// ============================================================================
// persistent-collections.test.ts — `#[T]` and `#[K:V]`.
//
// One rule is under test: an operation on a persistent value never changes the
// value it was given. Every assertion here checks the OLD value as well as the
// new one, because a copy-on-write bug looks exactly like a correct result if
// you only ever look at what came back.
//
// The feature this replaces was untested and had rotted into silence: every
// collection field of an @(immutable) class was swapped for a Vector, and then
// `for` did not compile against it, `push` as a statement did nothing at all,
// and assigning a plain array to it crashed at run time. That is what an
// ungated language feature turns into, so this file gates the new one.
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = "./tests/fixtures/persistent_collections.rgr";
const OUT_DIR = "./tests/.output-persistent";

function compile(target: string, outName: string): string {
  return execFileSync(
    process.execPath,
    [
      path.join(ROOT, "bin", "output.js"),
      `-l=${target}`,
      FIXTURE,
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

/** Compile a source string, returning the compiler's output (errors included). */
function compileSource(src: string, name: string): string {
  const dir = path.join(ROOT, "tests", ".output-persistent", "src");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, src, "utf8");
  try {
    return execFileSync(
      process.execPath,
      [
        path.join(ROOT, "bin", "output.js"),
        "-l=es6",
        `./tests/.output-persistent/src/${name}`,
        `-d=${OUT_DIR}/src`,
        `-o=${name}.js`,
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
  } catch (err: any) {
    // A failing compile exits non-zero; its diagnostics are what we want.
    return String(err.stdout ?? "") + String(err.stderr ?? "");
  }
}

let output: string;

beforeAll(() => {
  const res = compile("es6", "persistent.js");
  expect(res).toContain("[OK]");
  output = execFileSync(
    process.execPath,
    [path.join(ROOT, "tests", ".output-persistent", "es6", "persistent.js")],
    { cwd: ROOT, encoding: "utf8" },
  );
});

describe("persistent vector", () => {
  it("leaves every earlier value at the size it had", () => {
    // a stays empty, b has 1, c has 2, d has 3 — all four alive at once.
    expect(output).toContain("sizes 0123");
  });

  it("assoc replaces an index without touching the original", () => {
    expect(output).toContain("assoc new 20 old 2");
  });

  it("removeAt drops an element without touching the original", () => {
    expect(output).toContain("removeAt new 2 old 3");
    expect(output).toContain("removeAt head 2");
  });
});

describe("persistent map", () => {
  it("assoc and dissoc leave the earlier maps intact", () => {
    expect(output).toContain("map sizes 121");
  });

  it("a key removed from the new map is still in the old one", () => {
    expect(output).toContain("map a old 1 new 0");
  });
});

describe("value classes", () => {
  it("carries a collection through a chain of field updates", () => {
    expect(output).toContain("rows 011");
    expect(output).toContain("loading false true");
    expect(output).toContain("selected '' '42'");
  });

  it("shares the untouched branch by identity", () => {
    // The payoff for a view layer: `loading` and `selectedId` changed, `rows`
    // did not, and the two states hold the SAME collection — so a renderer
    // comparing branches can skip the subtree instead of diffing it.
    expect(output).toContain("rows branch shared true");
  });

  it("leaves a plain [T] field in the same class an ordinary array", () => {
    // `for` over it compiles and runs, which is precisely what the old
    // swap-everything behaviour made impossible.
    expect(output).toContain("tag plain");
  });
});

describe("with", () => {
  it("keeps a string literal intact through the expansion", () => {
    // The desugar used to write each value back out as source and re-parse it.
    // The Ranger writer does not re-escape string literals, so a quote inside
    // one ended the string early and the generated source failed to parse — or,
    // with the right contents, would have parsed as something else. Values are
    // spliced as nodes now, so this is a literal, not a round trip.
    expect(output).toContain('quoted [he said "hi" \\ done]');
    expect(output).toContain("loading true");
  });

  it("takes any expression as a value and leaves the old value alone", () => {
    expect(output).toContain("computed id-21 false");
    expect(output).toContain('old still he said "hi" \\ done');
  });

  it("refuses a nested path with an explanation rather than a set_ error", () => {
    const src = [
      "class Inner@(immutable) {",
      "  def name:string \"\"",
      "}",
      "class S@(immutable) {",
      "  def inner:Inner (new Inner)",
      "}",
      "class M {",
      "  sfn main:void () {",
      "    def s0 (new S)",
      "    def s1 (with s0 inner.name \"Ada\")",
      "    print s1.inner.name",
      "  }",
      "}",
    ].join("\n");
    const out = compileSource(src, "with_nested.rgr");
    expect(out).toContain("nested paths are not supported yet");
  });
});

describe("immutability is enforced, not just documented", () => {
  // push / set_at / removeLast were already rejected against an @(immutable)
  // class's field. `clear` was not: its operator declaration was the only one
  // of the four missing @(mutates), so it reached through and emptied the array
  // in place — wiping every other state value that shared it, silently, since
  // clear returns void.
  const MUTATORS: Array<[string, string]> = [
    ["push", 'push s0.rows "x"'],
    ["set_at", 'set_at s0.rows 0 "x"'],
    ["removeLast", "removeLast s0.rows"],
    ["clear", "clear s0.rows"],
  ];

  for (const [name, stmt] of MUTATORS) {
    it(`rejects ${name} against an immutable field`, () => {
      const src = [
        "class S@(immutable) {",
        "  def rows:[string]",
        "}",
        "class M {",
        "  sfn main:void () {",
        "    def s0 (new S)",
        `    ${stmt}`,
        "    print (to_string (array_length s0.rows))",
        "  }",
        "}",
      ].join("\n");
      const out = compileSource(src, `mutator_${name}.rgr`);
      expect(out).toContain("[FAIL]");
    });
  }
});

describe("portability", () => {
  it("compiles for every target", () => {
    const targets = [
      "es6", "go", "python", "kotlin", "csharp", "rust",
      "dart", "swift6", "cpp", "java7", "php", "scala",
    ];
    const failed: string[] = [];
    for (const target of targets) {
      try {
        if (!compile(target, "persistent.out").includes("[OK]")) failed.push(target);
      } catch {
        failed.push(target);
      }
    }
    expect(failed).toEqual([]);
  });
});
