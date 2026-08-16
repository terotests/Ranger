// ============================================================================
// value-and-mutable.test.ts — the four ways to declare data.
//
//                  mutable                  immutable / value
//   class          class C { }              class C@(immutable) { }
//   record         record R { }             record R@(immutable) { }
//   struct                                  struct S { }
//
// Two of the first four did not work before this file existed:
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

describe("struct", () => {
  it("is built by naming fields, with no constructor to write", () => {
    // `with` over a defaulted instance: order-independent and self-documenting,
    // and nothing has to list the fields twice.
    expect(output).toContain("6 struct: 30,40,origin");
  });

  it("needs no argument list at all for a wide state", () => {
    // The case a record cannot serve: every field, including collections,
    // starts at its declared default. A record's generated constructor takes
    // every field and there is no way to omit one.
    expect(output).toContain("defaults 'idle' 0 tags=0 roles=0");
  });

  it("updates through `with` and leaves the earlier value intact", () => {
    expect(output).toContain("updated 'ready' 5 / old 'idle' 0");
    expect(output).toContain("roles 01 tags shared true");
  });

  it("refuses mutation of its fields", () => {
    const src = [
      "struct S {",
      "  def count:int 0",
      "  def rows:[string]",
      "}",
      "class M {",
      "  sfn main:void () {",
      "    def s0 (new S)",
      '    push s0.rows "x"',
      "    print (to_string (array_length s0.rows))",
      "  }",
      "}",
    ].join("\n");
    expect(compileSource(src, "struct_mutate.rgr")).toContain("[FAIL]");
  });
});

describe("@(default) parameters", () => {
  it("say they are unsupported instead of crashing the writer", () => {
    // The flag let the call through and then died in code generation with
    // "Cannot read properties of undefined (reading 'getFirst')", because the
    // argument list it emitted was shorter than the parameter list. Nothing
    // declares what value it would default to — a value written after the type
    // parses as the next parameter — so a diagnostic is the honest answer.
    const src = [
      "class M {",
      "  sfn f:int (a:int b@(default):int) {",
      "    return (a + b)",
      "  }",
      "  sfn main:void () {",
      "    print (to_string (M.f(5)))",
      "  }",
      "}",
    ].join("\n");
    const out = compileSource(src, "default_param.rgr");
    expect(out).toContain("@(default) parameters are not supported");
    expect(out).not.toContain("Unexpected compiler error");
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
