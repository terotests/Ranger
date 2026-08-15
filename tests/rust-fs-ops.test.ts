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

const FIXTURE = "tests/fixtures/rust_fs_ops.rgr";

function hasGpp(): boolean {
  try {
    execSync("g++ --version", { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// dir_exists, create_dir and sha256 had no Rust template, and env_var's
// returned a plain String where the operator is declared optional. An operator
// with no template for the active target does not fall back to something
// approximate -- it fails to match, and the build stops with "Could not match
// argument types". So a Ranger program that creates a directory, checks one,
// reads an environment variable or hashes a string could not be built for Rust
// at all, and neither could the compiler itself.
//
// The digest is the published SHA-256 of "abc", so a target that computes it
// differently is wrong rather than merely different.
const EXPECTED = [
  "dir: created",
  "absent: ok",
  "env missing: ok",
  "sha256: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
];

function expectAll(output: string | undefined, label: string) {
  for (const line of EXPECTED) {
    expect(output, `${label} output was:\n${output}`).toContain(line);
  }
}

// The fixture only creates the directory when it is not already there, so the
// probe has to start from a clean slate for "dir: created" to mean anything.
function clearProbeDir() {
  for (const d of [path.join(ROOT, "rgr_fs_ops_probe"), path.join(ROOT, "tmp", "rgr_fs_ops_probe")]) {
    fs.rmSync(d, { recursive: true, force: true });
  }
}

describe("filesystem and environment operators", () => {
  it("runs on JavaScript", () => {
    clearProbeDir();
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expectAll(run?.output, "ES6");
  });

  it.skipIf(!isRustAvailable())(
    "runs on Rust",
    () => {
      clearProbeDir();
      const { compile, run } = compileAndRunRust(FIXTURE);
      expect(compile.success, compile.error || compile.output).toBe(true);
      expectAll(run?.output, "Rust");
    },
    300000
  );

  it.skipIf(!hasGpp())(
    "runs on C++",
    () => {
      const outDir = path.join(ROOT, "tests", ".output-cpp-fs-ops");
      fs.mkdirSync(outDir, { recursive: true });

      const compile = compileRanger(FIXTURE, "cpp", outDir);
      expect(
        compile.success,
        `C++ codegen failed: ${compile.error || compile.output}`
      ).toBe(true);

      const cpp = path.join(outDir, "rust_fs_ops.cpp");
      const bin = path.join(outDir, "rust_fs_ops");
      execSync(`g++ -std=c++17 "${cpp}" -o "${bin}"`, {
        cwd: outDir,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 120000,
      });

      clearProbeDir();
      const output = execSync(`"${bin}"`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 30000,
      });
      expectAll(output, "C++");
    },
    300000
  );

  it.skipIf(!isPythonAvailable())("runs on Python", () => {
    clearProbeDir();
    const { compile, run } = compileAndRunPython(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "Python");
  });

  it.skipIf(!isGoAvailable())("runs on Go", () => {
    clearProbeDir();
    const { compile, run } = compileAndRunGo(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "Go");
  });

  it.skipIf(!isKotlinAvailable())(
    "runs on Kotlin",
    () => {
      clearProbeDir();
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, compile.error || compile.output).toBe(true);
      expectAll(run?.output, "Kotlin");
    },
    300000
  );

  it.skipIf(!isDartAvailable())("runs on Dart", () => {
    clearProbeDir();
    const { compile, run } = compileAndRunDart(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "Dart");
  });

  it.skipIf(!isCSharpAvailable())("runs on C#", () => {
    clearProbeDir();
    const { compile, run } = compileAndRunCSharp(FIXTURE);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expectAll(run?.output, "C#");
  });
});
