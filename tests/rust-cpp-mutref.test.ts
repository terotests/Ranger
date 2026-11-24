// ============================================================================
// rust-cpp-mutref.test.ts — Rust `&mut` of a value type on C++: a plain `T&`.
// ============================================================================
//
// A `&mut Vec<T>`, `&mut String`, `&mut i32`, `&mut HashMap` or `&mut Vec<u8>`
// parameter binds the caller's place (`std::vector<int>& v`) instead of
// moving it into a heap RsBox_ and back on every call. Other targets keep the
// box. The answers must be the ones es6 gives.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_cpp_mutref/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-cpp-mutref");

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

describe("Rust &mut of a value type on C++", () => {
  it.skipIf(!has("g++ --version"))("passes T& instead of a box, printing what es6 prints", () => {
    const es = compile("es6", "app.js");
    const expected = run("node", [path.join(es, "app.js")]).stdout;
    expect(expected.trim()).toBe("3 100 8 6 hi! 2 2 6 10");

    const dir = compile("cpp", "app.cpp");
    const code = fs.readFileSync(path.join(dir, "app.cpp"), "utf8");
    expect(code).not.toContain("RsBox_");
    expect(code).toContain("Lib::grow( std::vector<int>& v )");
    expect(code).toContain("Lib::bump( int& n )");
    expect(code).toContain("Lib::shout( std::string& s )");
    expect(code).toContain("Lib::bytes( std::vector<uint8_t>& b )");
    expect(code).toContain("Lib::add_all(this->items, 3);");

    const bin = path.join(dir, "app");
    const g = run("g++", ["-std=c++17", "-O1", "-w", path.join(dir, "app.cpp"), "-o", bin]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(expected);
  }, 180000);
});
