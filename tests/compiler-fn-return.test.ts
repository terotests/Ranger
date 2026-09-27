// ============================================================================
// compiler-fn-return.test.ts — a function can return a function (ISSUES.md
// #103): tests/fixtures/fn_return.rgr on every target with a toolchain here.
// ============================================================================
//
// Rust writes a returned closure as `Box<dyn FnMut(…)>` with `move` captures;
// LLVM hands back the closure handle; the other targets have function types.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const FIXTURE = "tests/fixtures/fn_return.rgr";
const OUT = path.join(ROOT, "tests", ".output", "fn-return");
const EXPECTED = "adder 15\nagain 11\nscaler 21\noffset 7\ncurried 42\n";

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

function compile(target: string, outName: string, extra: string[] = []) {
  const dir = path.join(OUT, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", ["dist/rgrc.js", `-l=${target}`, FIXTURE, `-d=${path.relative(ROOT, dir)}`, `-o=${outName}`, ...extra]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return path.join(dir, outName);
}

describe("functions returning functions", () => {
  it("es6", () => {
    const f = compile("es6", "fn_return.js");
    expect(run("node", [f]).stdout).toBe(EXPECTED);
  });

  it.skipIf(!has("python3 --version"))("python", () => {
    const f = compile("python", "fn_return.py");
    expect(run("python3", [f]).stdout).toBe(EXPECTED);
  });

  it.skipIf(!has("go version"))("go", () => {
    const f = compile("go", "fn_return.go");
    expect(run("go", ["run", path.basename(f)], path.dirname(f)).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("g++ --version"))("cpp", () => {
    const f = compile("cpp", "fn_return.cpp");
    const bin = path.join(path.dirname(f), "fn_return");
    const g = run("g++", ["-std=c++17", "-o", bin, f]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("rustc --version"))("rust", () => {
    const f = compile("rust", "fn_return.rs");
    const src = fs.readFileSync(f, "utf8");
    expect(src).toContain("-> Box<dyn FnMut(i64) -> i64>");
    const bin = path.join(path.dirname(f), "fn_return");
    const b = run("rustc", ["--edition", "2021", "-o", bin, f]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("clang --version"))("llvm", () => {
    const f = compile("llvm", "fn_return.ll", ["-target=native-linux-gnu"]);
    const bin = path.join(path.dirname(f), "fn_return");
    const rt = ["runtime/ranger_rt.c", "runtime/ranger_mem.c"].map((p) => path.join(ROOT, p));
    const b = run("clang", [f, ...rt, "-o", bin, "-Wno-override-module"]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);
});
