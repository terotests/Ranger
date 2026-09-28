// ============================================================================
// compiler-static-op-names.test.ts — `Util.count(3)` and `sort` of numbers.
// ============================================================================
//
// A static method named like an operator (`count`, `make`, `size`, `sort`, …)
// was rewritten into the operator-method form `(call Util count …)` and then
// looked up as an instance method: "Class Util does not have method count".
// `sort` took only a comparison callback, so a `[double]` or `[int]` could not
// be sorted without one. Both on each target with a toolchain here.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/static_op_names/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "static-op-names");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), stdout: r.stdout ?? "" };
}

function compile(target: string, outName: string) {
  const dir = path.join(OUT, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", ["dist/rgrc.js", `-l=${target}`, SRC, `-d=${path.relative(ROOT, dir)}`, `-o=${outName}`]);
  return { ok: c.status === 0 && !c.out.includes("[FAIL]"), log: c.out, dir, file: path.join(dir, outName) };
}

const EXPECTED = "12\n3\n101\n125 250 350 -2 0 5 9 \n350\n";

describe("static methods named like operators, numeric sort", () => {
  it("es6", () => {
    const c = compile("es6", "app.js");
    expect(c.ok, c.log).toBe(true);
    expect(run("node", [c.file]).stdout).toBe(EXPECTED);
  });

  it.skipIf(!has("python3 --version"))("python", () => {
    const c = compile("python", "app.py");
    expect(c.ok, c.log).toBe(true);
    expect(run("python3", [c.file]).stdout).toBe(EXPECTED);
  });

  it.skipIf(!has("go version"))("go", () => {
    const c = compile("go", "app.go");
    expect(c.ok, c.log).toBe(true);
    expect(run("go", ["run", "app.go"], c.dir).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("g++ --version"))("cpp", () => {
    const c = compile("cpp", "app.cpp");
    expect(c.ok, c.log).toBe(true);
    const bin = path.join(c.dir, "app");
    const g = run("g++", ["-std=c++17", "-o", bin, c.file]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("rustc --version"))("rust", () => {
    const c = compile("rust", "app.rs");
    expect(c.ok, c.log).toBe(true);
    const bin = path.join(c.dir, "app");
    const b = run("rustc", ["--edition", "2021", "-o", bin, c.file]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("javac -version"))("java7", () => {
    const c = compile("java7", "app");
    expect(c.ok, c.log).toBe(true);
    const files = fs.readdirSync(c.dir).filter((f) => f.endsWith(".java"));
    const b = run("javac", files, c.dir);
    expect(b.status, b.out).toBe(0);
    expect(run("java", ["Main"], c.dir).stdout).toBe(EXPECTED);
  }, 180000);
});
