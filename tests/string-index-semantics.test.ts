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
const UTF8_FIXTURE = "tests/fixtures/utf8_substring.rgr";

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

// utf8_substring is the other half of the split: it always counts characters,
// whatever unit the target's own substring counts, so text can be measured
// without cutting a multi-byte character in half.
const UTF8_EXPECTED = [
  "c0: ok",
  "c1: ok",
  "tail: ok",
  "whole: ok",
  "empty: ok",
  "rebuild: ok",
];

function expectAll(output: string | undefined, label: string) {
  for (const line of EXPECTED) {
    expect(output, `${label} output was:\n${output}`).toContain(line);
  }
}

function expectUtf8(output: string | undefined, label: string) {
  for (const line of UTF8_EXPECTED) {
    expect(output, `${label} utf8 output was:\n${output}`).toContain(line);
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

describe("utf8_substring counts characters", () => {
  it("slices by character on JavaScript", () => {
    const { compile, run } = compileAndRun(UTF8_FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expectUtf8(run?.output, "ES6");
  });

  it.skipIf(!hasGpp())(
    "slices by character on C++",
    () => {
      const outDir = path.join(ROOT, "tests", ".output-cpp-utf8-substring");
      fs.mkdirSync(outDir, { recursive: true });

      const compile = compileRanger(UTF8_FIXTURE, "cpp", outDir);
      expect(
        compile.success,
        `C++ codegen failed: ${compile.error || compile.output}`
      ).toBe(true);

      const cpp = path.join(outDir, "utf8_substring.cpp");
      const bin = path.join(outDir, "utf8_substring");
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
      expectUtf8(output, "C++");
    },
    300000
  );

  it.skipIf(!isRustAvailable())(
    "slices by character on Rust",
    () => {
      const { compile, run } = compileAndRunRust(UTF8_FIXTURE);
      expect(compile.success, compile.error || compile.output).toBe(true);
      expectUtf8(run?.output, "Rust");
    },
    300000
  );

  it.skipIf(!isPythonAvailable())("slices by character on Python", () => {
    const { compile, run } = compileAndRunPython(UTF8_FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectUtf8(run?.output, "Python");
  });

  it.skipIf(!isGoAvailable())("slices by character on Go", () => {
    const { compile, run } = compileAndRunGo(UTF8_FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectUtf8(run?.output, "Go");
  });

  it.skipIf(!isKotlinAvailable())(
    "slices by character on Kotlin",
    () => {
      const { compile, run } = compileAndRunKotlin(UTF8_FIXTURE);
      expect(compile.success, compile.error || compile.output).toBe(true);
      expectUtf8(run?.output, "Kotlin");
    },
    300000
  );

  it.skipIf(!isDartAvailable())("slices by character on Dart", () => {
    const { compile, run } = compileAndRunDart(UTF8_FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectUtf8(run?.output, "Dart");
  });

  it.skipIf(!isCSharpAvailable())("slices by character on C#", () => {
    const { compile, run } = compileAndRunCSharp(UTF8_FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectUtf8(run?.output, "C#");
  });
});
