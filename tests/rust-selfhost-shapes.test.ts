// ============================================================================
// rust-selfhost-shapes.test.ts — shapes from the compiler's own sources that
// kept its Rust build from compiling (28 rustc errors, 2026-11-23).
// ============================================================================
//
// - a local copied from a field declared with no value (`def t (o.target)`)
//   is Option<T> in its `let`, and reading `t.ioFn` must unwrap it
// - a collection field declared `@(optional)` is Option<Vec<…>>: it starts
//   as None and an assignment wraps the value in Some()
// - `(? c a b)` over two String locals clones them: both are read again
// - `def w:Base (new Base)` for an extended class whose trait is implemented
//   for the handle takes the handle inside the trait object's cell
// - an optional object field of an extended class is Option<RefCell<T>>:
//   `unwrap` takes the value out of the cell, and an assignment from another
//   class puts it in one
//
// Every Rust output must print what the es6 output prints.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const FIX = "tests/fixtures/rust_selfhost_shapes";
const OUT = path.join(ROOT, "tests", ".output", "rust-selfhost-shapes");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 180000 });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), stdout: r.stdout ?? "" };
}

function compile(lang: string, file: string): string {
  const dir = path.join(OUT, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const extra = lang === "es6" ? ["-nodecli"] : [];
  const c = run("node", ["dist/rgrc.js", `-l=${lang}`, `${FIX}/app.rgr`, ...extra, `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return dir;
}

const expected = fs.readFileSync(path.join(ROOT, FIX, "expected.txt"), "utf8");

describe("compiler shapes on Rust", () => {
  it("es6 prints the expected output", () => {
    const dir = compile("es6", "app.js");
    expect(run("node", [path.join(dir, "app.js")]).stdout).toBe(expected);
  });

  it.skipIf(!has("rustc --version"))("rustc accepts the Rust output and it prints the same", () => {
    const dir = compile("rust", "app.rs");
    const code = fs.readFileSync(path.join(dir, "app.rs"), "utf8");
    expect(code).toContain("target.as_ref().unwrap().io_fn");
    expect(code).toContain("chain: None,");
    const b = run("rustc", ["--edition", "2021", "-o", path.join(dir, "app"), path.join(dir, "app.rs")]);
    expect(b.status, b.out).toBe(0);
    expect(run(path.join(dir, "app"), []).stdout).toBe(expected);
  });

  it.skipIf(!has("go version"))("the Go output prints the same", () => {
    const dir = compile("go", "app.go");
    const r = run("go", ["run", "app.go"], dir);
    expect(r.status, r.out).toBe(0);
    expect(r.stdout).toBe(expected);
  });
});
