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
const PROGRAM = "tests/conformance/generic_class/program.rgr";
const EXPECTED = fs
  .readFileSync(
    path.join(ROOT, "tests", "conformance", "generic_class", "expected_output.txt"),
    "utf8"
  )
  .replace(/\r\n/g, "\n")
  .trimEnd();

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

function compileTo(lang: string, ext: string, extraFlags: string[] = []): string {
  const outFile = `generic_class_${lang}.${ext}`;
  const flag = lang === "es6" ? "-es6" : `-l=${lang}`;
  const cmd = [
    `node "${path.join(ROOT, "bin", "output.js")}"`,
    flag,
    ...extraFlags,
    `"./${PROGRAM}"`,
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

describe("Generic classes (monomorphised)", () => {
  // A writer that cannot spell the instantiated class is the failure this
  // guards: none of the fourteen was taught a type system, so all fourteen
  // have to keep working with no change at all.
  describe("every target still produces a program", () => {
    for (const { lang, ext } of TARGETS) {
      it(`compiles for ${lang}`, () => {
        const file = compileTo(
          lang,
          ext,
          lang === "llvm" ? ["-target=native-linux-gnu"] : []
        );
        // java7 writes one file per class rather than the -o name
        if (lang !== "java7") {
          expect(fs.existsSync(file), `${lang} wrote no output file`).toBe(true);
        }
      });
    }
  });

  describe("and the ones we can execute agree byte for byte", () => {
    it("es6", () => {
      const file = compileTo("es6", "js");
      const out = execSync(`node "${file}"`, { encoding: "utf-8" });
      expect(normalize(out)).toBe(EXPECTED);
    });

    it.skipIf(!have("go"))("go", () => {
      const file = compileTo("go", "go");
      const out = execSync(`go run "${file}"`, {
        encoding: "utf-8",
        cwd: ROOT,
        timeout: 300000,
      });
      expect(normalize(out)).toBe(EXPECTED);
    });

    it.skipIf(!have("python3"))("python", () => {
      const file = compileTo("python", "py");
      const out = execSync(`python3 "${file}"`, { encoding: "utf-8" });
      expect(normalize(out)).toBe(EXPECTED);
    });

    it.skipIf(!have("php"))("php", () => {
      const file = compileTo("php", "php");
      const out = execSync(`php "${file}"`, { encoding: "utf-8" });
      expect(normalize(out)).toBe(EXPECTED);
    });

    it.skipIf(!have("g++"))("cpp", () => {
      const file = compileTo("cpp", "cpp");
      const bin = path.join(OUT, "generic_class_cpp.bin");
      execSync(`g++ -std=c++17 -o "${bin}" "${file}"`, { stdio: "pipe" });
      const out = execSync(`"${bin}"`, { encoding: "utf-8" });
      expect(normalize(out)).toBe(EXPECTED);
    });

    it.skipIf(!have("rustc"))("rust", () => {
      const file = compileTo("rust", "rs");
      const bin = path.join(OUT, "generic_class_rust.bin");
      execSync(`rustc -O -o "${bin}" "${file}"`, { stdio: "pipe" });
      const out = execSync(`"${bin}"`, { encoding: "utf-8" });
      expect(normalize(out)).toBe(EXPECTED);
    });

    // LLVM runs the three instantiations it can. The array one is left out on
    // purpose and NOT because generics broke it: `[[string]]` loses its
    // elements on this backend with no generic class anywhere in sight (a
    // plain class holding `[[string]]` prints an empty row too). That is the
    // same family as TARGET_NOTES #25 and #26 — a nested collection held
    // without a retain — and it is a Low IR ownership defect to fix on its
    // own, not something monomorphisation can reach.
    it.skipIf(!have("clang"))("llvm (nested arrays are a known Low IR gap)", () => {
      const file = compileTo("llvm", "ll", ["-target=native-linux-gnu"]);
      const bin = path.join(OUT, "generic_class_llvm.bin");
      execSync(
        `clang "${file}" "${path.join(ROOT, "runtime", "ranger_rt.c")}" "${path.join(
          ROOT,
          "runtime",
          "ranger_mem.c"
        )}" -o "${bin}" -Wno-override-module`,
        { stdio: "pipe" }
      );
      const got = normalize(execSync(`"${bin}"`, { encoding: "utf-8" })).split("\n");
      const want = EXPECTED.split("\n");
      const isRowLine = (l: string) => l.startsWith("rows:");
      expect(got.filter((l) => !isRowLine(l))).toEqual(
        want.filter((l) => !isRowLine(l))
      );
      // the row line is still expected to arrive, with the right count
      expect(got.some((l) => l.startsWith("rows: 2 "))).toBe(true);
    });
  });
});
