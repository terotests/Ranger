// ============================================================================
// rust-cpp-borrow.test.ts — Rust borrows and Rc<String> on C++ without copies.
// ============================================================================
//
// - `fn f(&self) -> &T` / `fn f(v: &Vec<T>, i) -> &T` of a struct returns
//   `const std::shared_ptr<T>&` (no count up and down per call) when every
//   return is storage of a borrowed input.
// - A place temporary of a struct (`self.ob(o).x`) is `auto&&`.
// - `Rc<String>` (and `Vec<Rc<String>>`) is rg_rcstr / rg_rcvec: a clone
//   shares the text instead of copying it.
// The answers must be the ones es6 gives.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_cpp_borrow/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-cpp-borrow");

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
  const c = run("node", ["dist/rgrc.js", `-l=${lang}`, SRC, ...extra, `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return dir;
}

describe("Rust borrows and Rc<String> on C++", () => {
  it.skipIf(!has("g++ --version"))("binds references and shares text, printing what es6 prints", () => {
    const es = compile("es6", "app.js");
    const expected = run("node", [path.join(es, "app.js")]).stdout;
    expect(expected.trim()).toBe("5 2 banana! 7 3 true true");

    const dir = compile("cpp", "app.cpp");
    const code = fs.readFileSync(path.join(dir, "app.cpp"), "utf8");
    expect(code).toMatch(/const std::shared_ptr<O>&\s+Lib::obj_at\(/);
    expect(code).toMatch(/const std::shared_ptr<O>&\s+M::ob\(/);
    expect(code).toMatch(/auto&& rs__r\d+ = m->ob\(0\);/);
    expect(code).toContain("rg_rcvec texts;");
    expect(code).toContain("rg_rcstr src;");
    expect(code).toMatch(/rg_rcstr\s+M::text\(/);

    const bin = path.join(dir, "app");
    const b = run("g++", ["-std=c++17", "-o", bin, path.join(dir, "app.cpp")]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(expected);
  }, 180000);
});
