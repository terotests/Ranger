// ============================================================================
// value-and-mutable.test.ts — the four ways to declare data.
//
//                  mutable                  immutable / value
//   class          class C { }              class C@(immutable) { }
//   record         record R { }             record R@(immutable) { }
//
// Two of these four did not work before this file existed:
// `record R@(immutable)` could not be compiled at all, and neither could an
// @(immutable) class with a hand-written constructor. Both failed inside
// generated code (`__CopySelf` emitting `(new C)` against a constructor that
// takes arguments), so the error pointed at a line the author never wrote.
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = "./tests/fixtures/value_and_mutable.rgr";
const OUT_DIR = "./tests/.output-value";

function compile(target: string, outName: string, source = FIXTURE): string {
  return execFileSync(
    process.execPath,
    [
      path.join(ROOT, "bin", "output.js"),
      `-l=${target}`,
      source,
      `-d=${OUT_DIR}/${target}`,
      `-o=${outName}`,
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        RANGER_LIB: `${path.join(ROOT, "compiler", "Lang.rgr")}:${path.join(ROOT, "lib", "stdops.rgr")}`,
      },
    },
  );
}

function compileSource(src: string, name: string): string {
  const dir = path.join(ROOT, "tests", ".output-value", "src");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), src, "utf8");
  try {
    return compile("es6", `${name}.js`, `./tests/.output-value/src/${name}`);
  } catch (err: any) {
    return String(err.stdout ?? "") + String(err.stderr ?? "");
  }
}

let output: string;

beforeAll(() => {
  expect(compile("es6", "value.js")).toContain("[OK]");
  output = execFileSync(
    process.execPath,
    [path.join(ROOT, "tests", ".output-value", "es6", "value.js")],
    { cwd: ROOT, encoding: "utf8" },
  );
});

describe("mutable", () => {
  it("a class assigns fields and pushes into its arrays", () => {
    expect(output).toContain("1 mutable class: Ada 37 tags=1");
  });

  it("a record adds a positional constructor and stays mutable", () => {
    expect(output).toContain("3 mutable record: 30,4");
  });
});

describe("value", () => {
  it("a class keeps every earlier version of itself", () => {
    // u0, u1 and u2 are all alive and all still say what they said.
    expect(output).toContain("2 value class: ''/0 'Ada'/36 'Ada'/37");
  });

  it("replaces a plain [T] wholesale and grows a #[T] with conj", () => {
    expect(output).toContain("tags 0 -> 2");
    expect(output).toContain("roles 012");
  });

  it("leaves the branch a transition did not touch identical", () => {
    expect(output).toContain("tags branch shared true");
  });

  it("a record is positional AND updatable with `with`", () => {
    expect(output).toContain("4 value record: 3,4,origin -> 30,40,moved");
  });

  it("a hand-written constructor is called by the generated copy", () => {
    expect(output).toContain("5 value + ctor: 9 -> 19");
  });
});

describe("assignment through a value", () => {
  it("rebinds the variable instead of mutating the value", () => {
    // `p0.x = 9` on an @(immutable) value does NOT mutate: it is rewritten to
    // `p0 = (p0).set_x(9)`, so the variable points at a new value and every
    // other reference to the old one is untouched. Assignment syntax, value
    // semantics — worth knowing, because it looks like mutation and is not.
    const src = [
      "record P@(immutable) {",
      "  def x:int 0",
      "  def y:int 0",
      "}",
      "class M {",
      "  sfn main:void () {",
      "    def p0 (new P(1 2))",
      "    def keep p0",
      "    p0.x = 9",
      "    print ((to_string p0.x) + \"/\" + (to_string keep.x))",
      "  }",
      "}",
    ].join("\n");
    const out = compileSource(src, "assign_outside.rgr");
    expect(out).toContain("[OK]");
    const ran = execFileSync(
      process.execPath,
      [path.join(ROOT, "tests", ".output-value", "es6", "assign_outside.rgr.js")],
      { cwd: ROOT, encoding: "utf8" },
    );
    // p0 moved to 9; the value `keep` still holds is the original.
    expect(ran.trim()).toBe("9/1");
  });

  it("refuses a constructor parameter that names no field", () => {
    const src = [
      "class R@(immutable) {",
      "  def lo:int 0",
      "  Constructor (lo:int scale:int) {",
      "    this.lo = (lo * scale)",
      "  }",
      "}",
      "class M {",
      "  sfn main:void () {",
      "    def r (new R(2 3))",
      "    print (to_string r.lo)",
      "  }",
      "}",
    ].join("\n");
    const out = compileSource(src, "ctor_unknown.rgr");
    // A copy cannot reconstruct `scale`, and says so instead of failing inside
    // generated code with "Not enough arguments for class constructor".
    expect(out).toContain("names no field");
  });
});

describe("portability", () => {
  it("all four forms compile for every target", () => {
    const targets = [
      "es6", "go", "python", "kotlin", "csharp", "rust",
      "dart", "swift6", "cpp", "java7", "php", "scala",
    ];
    const failed: string[] = [];
    for (const target of targets) {
      try {
        if (!compile(target, "value.out").includes("[OK]")) failed.push(target);
      } catch {
        failed.push(target);
      }
    }
    expect(failed).toEqual([]);
  });
});
