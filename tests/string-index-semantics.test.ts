import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileAndRun,
  compileAndRunCSharp,
  compileAndRunDart,
  compileAndRunGo,
  compileAndRunKotlin,
  compileAndRunPython,
  compileAndRunRust,
  compileRanger,
  isCSharpAvailable,
  isDartAvailable,
  isGoAvailable,
  isKotlinAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const FIXTURE = "tests/fixtures/string_index_semantics.rgr";

function hasGpp(): boolean {
  try {
    execSync("g++ --version", { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// strlen, charAt and substring have to agree on what an index counts. They did
// not on C++: strlen and charAt counted bytes while substring and `at` counted
// code points, so a scanner that found a character with charAt and then sliced
// it out with substring got the wrong slice -- or an empty one -- as soon as
// the text held anything outside ASCII. The compiler's own string parser does
// exactly that, one index at a time, when a literal contains an escape.
//
// The reference is the ES6 target. Every target has to produce these three
// lines; a target that disagrees has an index unit its own primitives do not
// share.
const EXPECTED = ["scan: [b]", "rebuild: same", "split: same"];

function expectAll(output: string | undefined, label: string) {
  for (const line of EXPECTED) {
    expect(output, `${label} output was:\n${output}`).toContain(line);
  }
}

describe("string index semantics", () => {
  it("scans and slices consistently on JavaScript", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expectAll(run?.output, "ES6");
  });

  it.skipIf(!hasGpp())(
    "scans and slices consistently on C++",
    () => {
      const outDir = path.join(ROOT, "tests", ".output-cpp-string-index");
      fs.mkdirSync(outDir, { recursive: true });

      const compile = compileRanger(FIXTURE, "cpp", outDir);
      expect(
        compile.success,
        `C++ codegen failed: ${compile.error || compile.output}`
      ).toBe(true);

      const cpp = path.join(outDir, "string_index_semantics.cpp");
      const bin = path.join(outDir, "string_index_semantics");
      execSync(`g++ -std=c++17 "${cpp}" -o "${bin}"`, {
        cwd: outDir,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 120000,
      });

      const output = execSync(`"${bin}"`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 30000,
      });
      expectAll(output, "C++");
    },
    300000
  );

  it.skipIf(!isRustAvailable())(
    "scans and slices consistently on Rust",
    () => {
      const { compile, run } = compileAndRunRust(FIXTURE);
      expect(compile.success, compile.error || compile.output).toBe(true);
      expectAll(run?.output, "Rust");
    },
    300000
  );

  it.skipIf(!isPythonAvailable())("scans and slices consistently on Python", () => {
    const { compile, run } = compileAndRunPython(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "Python");
  });

  it.skipIf(!isGoAvailable())("scans and slices consistently on Go", () => {
    const { compile, run } = compileAndRunGo(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "Go");
  });

  it.skipIf(!isKotlinAvailable())(
    "scans and slices consistently on Kotlin",
    () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, compile.error || compile.output).toBe(true);
      expectAll(run?.output, "Kotlin");
    },
    300000
  );

  it.skipIf(!isDartAvailable())("scans and slices consistently on Dart", () => {
    const { compile, run } = compileAndRunDart(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "Dart");
  });

  it.skipIf(!isCSharpAvailable())("scans and slices consistently on C#", () => {
    const { compile, run } = compileAndRunCSharp(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "C#");
  });
});
