import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Generic classes are monomorphised: `History@(int)` becomes a concrete
// `History_int` before any writer runs. That is the whole point of the design
// — fourteen writers stay exactly as they are — so the test that matters is
// not "does the feature compile" but "does every writer still produce a
// program, and do the ones we can execute here produce the SAME bytes".
//
// The four cases are the ones PLAN_EDITOR_KERNEL asks for first:
//   1. one generic class at two different types in one program
//   2. one at an array type — nesting is the known failure, see below
//   3. one at a shape type, since `shape` is the other parameterised thing
//   4. all of it on every target
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output-generics");

// Two programs. `generic_class` is the language question — a type parameter as
// an array element, a parameter and a return type, at two types, an array type
// and a shape type. `generic_class_kernel` is the USE question: the shapes the
// shared editing kernel asks for — `Store@(T)` over `[string:T]`, one generic
// class holding another at its own parameter, a generic class that extends, a
// constructor with arguments, and a map as the type ARGUMENT.
interface Case {
  name: string;
  program: string;
  expected: string;
  // Targets whose RUN is skipped, and why. Codegen is still asserted.
  skipRun?: Record<string, string>;
}

function readCase(name: string, skipRun?: Record<string, string>): Case {
  const dir = path.join(ROOT, "tests", "conformance", name);
  return {
    name,
    program: `tests/conformance/${name}/program.rgr`,
    expected: fs
      .readFileSync(path.join(dir, "expected_output.txt"), "utf8")
      .replace(/\r\n/g, "\n")
      .trimEnd(),
    skipRun,
  };
}

const CASES: Case[] = [
  readCase("generic_class"),
  readCase("generic_class_kernel", {
    // ISSUES #74: a method whose only statement is a mutating call on a field
    // object is emitted `&self`, so the output does not compile. Nothing to do
    // with generics — twenty lines of ordinary Ranger reproduce it — but
    // `Holder@(T)` holding a `Slot@(T)` is exactly that shape.
    rust: "ISSUES #74 — statement-position field mutation is analysed as &self",
    // ISSUES #73: `[string:[string:int]]` segfaults on LLVM once the inner map
    // holds a second entry. Also nothing to do with generics — the same
    // twenty lines with the type written out crash identically — but
    // `Store@([string:int])` is that type.
    llvm: "ISSUES #73 — a map inside a map is under-retained on LLVM",
  }),
];

// Every target the compiler accepts (`allowed_languages` in VirtualCompiler).
const TARGETS: { lang: string; ext: string }[] = [
  { lang: "es6", ext: "js" },
  { lang: "go", ext: "go" },
  { lang: "python", ext: "py" },
  { lang: "cpp", ext: "cpp" },
  { lang: "rust", ext: "rs" },
  { lang: "swift3", ext: "swift" },
  { lang: "swift6", ext: "swift" },
  { lang: "java7", ext: "java" },
  { lang: "kotlin", ext: "kt" },
  { lang: "php", ext: "php" },
  { lang: "csharp", ext: "cs" },
  { lang: "scala", ext: "scala" },
  { lang: "dart", ext: "dart" },
  { lang: "llvm", ext: "ll" },
];

function compileTo(
  c: Case,
  lang: string,
  ext: string,
  extraFlags: string[] = []
): string {
  const outFile = `${c.name}_${lang}.${ext}`;
  const flag = lang === "es6" ? "-es6" : `-l=${lang}`;
  const cmd = [
    `node "${path.join(ROOT, "bin", "output.js")}"`,
    flag,
    ...extraFlags,
    `"./${c.program}"`,
    "-nodecli",
    `-d="tests/.output-generics"`,
    `-o="${outFile}"`,
  ].join(" ");
  const output = execSync(cmd, {
    cwd: ROOT,
    env: { ...process.env, RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr` },
    encoding: "utf-8",
    timeout: 120000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  expect(
    output.includes("[OK] Compilation successful!"),
    `${lang} codegen failed:\n${output}`
  ).toBe(true);
  return path.join(OUT, outFile);
}

function have(tool: string): boolean {
  try {
    execSync(`command -v ${tool}`, { stdio: "ignore", shell: "/bin/bash" });
    return true;
  } catch {
    return false;
  }
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").trimEnd();
}

beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

// `Type@(…)` after a colon is spelled the same for a TYPE ARGUMENT list and a
// FLAG list. The check that reports "takes no type arguments" once fired on
// `def p:RangerProcessBase@(optional)`, which is every `@process` class in the
// runtime — a whole target's worth of programs stopped compiling, and the
// generics suite was green throughout, because nothing here used a flag.
describe("a flag annotation is not a type argument list", () => {
  it("compiles a flag on a plain class and on an instantiation", () => {
    const outFile = "generic_flag_annotation.js";
    const cmd = [
      `node "${path.join(ROOT, "bin", "output.js")}"`,
      "-es6",
      `"./tests/fixtures/generic_flag_annotation.rgr"`,
      "-nodecli",
      `-d="tests/.output-generics"`,
      `-o="${outFile}"`,
    ].join(" ");
    const output = execSync(cmd, {
      cwd: ROOT,
      env: { ...process.env, RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr` },
      encoding: "utf-8",
      timeout: 120000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    expect(output.includes("[FAIL]"), output).toBe(false);
    const out = execSync(`node "${path.join(OUT, outFile)}"`, {
      encoding: "utf-8",
    });
    expect(normalize(out)).toBe("flags 7 2\nDone");
  });
});

describe("Generic classes (monomorphised)", () => {
  for (const c of CASES) {
    describe(c.name, () => {
      // A writer that cannot spell the instantiated class is the failure this
      // guards: none of the fourteen was taught a type system, so all fourteen
      // have to keep working with no change at all.
      describe("every target still produces a program", () => {
        for (const { lang, ext } of TARGETS) {
          it(`compiles for ${lang}`, () => {
            const file = compileTo(
              c,
              lang,
              ext,
              lang === "llvm" ? ["-target=native-linux-gnu"] : []
            );
            // java7 writes one file per class rather than the -o name
            if (lang !== "java7") {
              expect(fs.existsSync(file), `${lang} wrote no output file`).toBe(
                true
              );
            }
          });
        }
      });

      describe("and the ones we can execute agree byte for byte", () => {
        const skipped = (lang: string) => c.skipRun?.[lang];

        it("es6", () => {
          const file = compileTo(c, "es6", "js");
          const out = execSync(`node "${file}"`, { encoding: "utf-8" });
          expect(normalize(out)).toBe(c.expected);
        });

        it.skipIf(!have("go"))("go", () => {
          const file = compileTo(c, "go", "go");
          const out = execSync(`go run "${file}"`, {
            encoding: "utf-8",
            cwd: ROOT,
            timeout: 300000,
          });
          expect(normalize(out)).toBe(c.expected);
        });

        it.skipIf(!have("python3"))("python", () => {
          const file = compileTo(c, "python", "py");
          const out = execSync(`python3 "${file}"`, { encoding: "utf-8" });
          expect(normalize(out)).toBe(c.expected);
        });

        it.skipIf(!have("php"))("php", () => {
          const file = compileTo(c, "php", "php");
          const out = execSync(`php "${file}"`, { encoding: "utf-8" });
          expect(normalize(out)).toBe(c.expected);
        });

        it.skipIf(!have("g++"))("cpp", () => {
          const file = compileTo(c, "cpp", "cpp");
          const bin = path.join(OUT, `${c.name}_cpp.bin`);
          execSync(`g++ -std=c++17 -o "${bin}" "${file}"`, { stdio: "pipe" });
          const out = execSync(`"${bin}"`, { encoding: "utf-8" });
          expect(normalize(out)).toBe(c.expected);
        });

        // The codegen assertion above still covers Rust when the RUN is
        // skipped; `skipRun` names a target defect, never a missing feature.
        it.skipIf(!have("rustc") || !!skipped("rust"))("rust", () => {
          const file = compileTo(c, "rust", "rs");
          const bin = path.join(OUT, `${c.name}_rust.bin`);
          execSync(`rustc -O -o "${bin}" "${file}"`, { stdio: "pipe" });
          const out = execSync(`"${bin}"`, { encoding: "utf-8" });
          expect(normalize(out)).toBe(c.expected);
        });

        // LLVM runs every line that does not hold a nested array. The array
        // one is left out on purpose and NOT because generics broke it:
        // `[[string]]` loses its elements on this backend with no generic
        // class anywhere in sight (a plain class holding `[[string]]` prints
        // an empty row too). Same family as TARGET_NOTES #25 and #26 — a
        // nested collection held without a retain, ISSUES #73 — and a Low IR
        // ownership defect to fix on its own.
        it.skipIf(!have("clang") || !!skipped("llvm"))("llvm (nested collections are a known Low IR gap)", () => {
          const file = compileTo(c, "llvm", "ll", ["-target=native-linux-gnu"]);
          const bin = path.join(OUT, `${c.name}_llvm.bin`);
          execSync(
            `clang "${file}" "${path.join(
              ROOT,
              "runtime",
              "ranger_rt.c"
            )}" "${path.join(
              ROOT,
              "runtime",
              "ranger_mem.c"
            )}" -o "${bin}" -Wno-override-module`,
            { stdio: "pipe" }
          );
          const got = normalize(execSync(`"${bin}"`, { encoding: "utf-8" })).split(
            "\n"
          );
          const want = c.expected.split("\n");
          // the lines that carry a nested array, by the label they print
          const nested = (l: string) => l.startsWith("rows:");
          expect(got.filter((l) => !nested(l))).toEqual(
            want.filter((l) => !nested(l))
          );
          // the nested line still arrives, with the right count
          for (const w of want.filter(nested)) {
            const head = w.split(" ").slice(0, 2).join(" ");
            expect(
              got.some((l) => l.startsWith(head)),
              `llvm lost the nested-array line entirely: wanted "${head} …"`
            ).toBe(true);
          }
        });
      });
    });
  }
});
