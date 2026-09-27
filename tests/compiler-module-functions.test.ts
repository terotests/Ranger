// ============================================================================
// compiler-module-functions.test.ts — top-level functions (ISSUES.md #104).
// ============================================================================
//
// A `fn` at the top level of a file is a static method of the file's module
// class (`geometry.rgr` -> `geometry`). A call without a receiver finds it
// when no local, parameter or method of the caller has the name: the
// caller's file first, then a unique module; several matches are an error.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const DIR = "tests/fixtures/module_fns";
const OUT = path.join(ROOT, "tests", ".output", "module-fns");

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

function compile(file: string, target: string, outName: string) {
  const dir = path.join(OUT, path.basename(file, ".rgr"), target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", ["dist/rgrc.js", `-l=${target}`, `${DIR}/${file}`, `-d=${path.relative(ROOT, dir)}`, `-o=${outName}`]);
  return { ok: c.status === 0 && !c.out.includes("[FAIL]"), log: c.out, file: path.join(dir, outName) };
}

const APP = "42\n12\n9\n3\n";

describe("top-level functions", () => {
  it("es6: own file, imported module, from a class method", () => {
    const c = compile("app.rgr", "es6", "app.js");
    expect(c.ok, c.log).toBe(true);
    expect(run("node", [c.file]).stdout).toBe(APP);
  });

  it.skipIf(!has("python3 --version"))("python", () => {
    const c = compile("app.rgr", "python", "app.py");
    expect(c.ok, c.log).toBe(true);
    expect(run("python3", [c.file]).stdout).toBe(APP);
  });

  it.skipIf(!has("go version"))("go", () => {
    const c = compile("app.rgr", "go", "app.go");
    expect(c.ok, c.log).toBe(true);
    expect(run("go", ["run", "app.go"], path.dirname(c.file)).stdout).toBe(APP);
  }, 180000);

  it.skipIf(!has("g++ --version"))("cpp", () => {
    const c = compile("app.rgr", "cpp", "app.cpp");
    expect(c.ok, c.log).toBe(true);
    const bin = path.join(path.dirname(c.file), "app");
    const g = run("g++", ["-std=c++17", "-o", bin, c.file]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(APP);
  }, 180000);

  it.skipIf(!has("rustc --version"))("rust", () => {
    const c = compile("app.rgr", "rust", "app.rs");
    expect(c.ok, c.log).toBe(true);
    const bin = path.join(path.dirname(c.file), "app");
    const b = run("rustc", ["--edition", "2021", "-o", bin, c.file]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(APP);
  }, 180000);

  it("a local shadows a module function; functions join the file's class", () => {
    const c = compile("shadow.rgr", "es6", "shadow.js");
    expect(c.ok, c.log).toBe(true);
    expect(run("node", [c.file]).stdout).toBe("15\nhi\n10\n");
  });

  it("a name two modules define must be qualified", () => {
    const c = compile("ambiguous.rgr", "es6", "ambiguous.js");
    expect(c.ok).toBe(false);
    expect(c.log).toContain("`label` is a function of several modules: call it as dup_a.label or dup_b.label");
  });
});
