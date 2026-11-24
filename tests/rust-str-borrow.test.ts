// ============================================================================
// rust-str-borrow.test.ts — borrowed strings without copies; UTF-8 bytes on JS.
// ============================================================================
//
// C++ keeps a Rust `&str` as a std::string, so a borrow was a copy of the
// whole text: `let s = self.text_of(i)` copied once when the method
// returned and again into the local, and a JavaScript engine written in Rust
// (CEr) copied a 30 kB script for every character it read. Now a `let` of a
// `&str` (not `mut`) is `const std::string&` (a temporary lives as long as
// the reference), and `fn f(&self) -> &str` returns `const std::string&`
// when every return is self's own text; a part of it (`&t[0..3]`) stays a
// value. On JavaScript `s.len()` and `s.as_bytes()[i]` were an encoding of
// the whole string per call; a long string's bytes are now encoded once.
// The program prints the same on JavaScript, C++ and rustc, with
// multi-byte text (ä, €, emoji) short and long.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const FIX = "tests/fixtures/rust_str_borrow";
const OUT = path.join(ROOT, "tests", ".output", "rust-str-borrow");
const EXPECTED = "3:294:3:3;9:1624:9:9;6:920:6:6;2100:340800:2100:2100;abcstöre😀|10|1502\n";

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
  const c = run("node", ["dist/rgrc.js", `-l=${lang}`, `${FIX}/main.rgr`, ...extra, `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return dir;
}

describe("borrowed strings and UTF-8 bytes", () => {
  it("es6: bytes read without an encoding per call", () => {
    const dir = compile("es6", "main.js");
    const code = fs.readFileSync(path.join(dir, "main.js"), "utf8");
    expect(code).toContain("r_u8.len(");
    expect(code).toContain("r_u8.at(");
    expect(run("node", [path.join(dir, "main.js")]).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("g++ --version"))("cpp: const references for borrows, values for new text", () => {
    const dir = compile("cpp", "main.cpp");
    const code = fs.readFileSync(path.join(dir, "main.cpp"), "utf8");
    expect(code).toMatch(/const std::string&\s+Store::text_of\( int i \)/);
    expect(code).toMatch(/const std::string&\s+Store::title_m\(\)/);
    // a part of the text and a new string are values
    expect(code).toMatch(/\nstd::string\s+Store::head_of\(/);
    expect(code).toMatch(/\nstd::string\s+Store::upper_of\(/);
    expect(code).toContain("const std::string& t = this->text_of(i);");
    expect(code).toContain("const std::string& h = st->head_of(i);");
    const bin = path.join(dir, "main");
    const b = run("g++", ["-std=c++17", "-O1", "-o", bin, path.join(dir, "main.cpp")]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 240000);

  it.skipIf(!has("rustc --version"))("rustc agrees", () => {
    fs.mkdirSync(OUT, { recursive: true });
    const bin = path.join(OUT, "main-rustc");
    const b = run("rustc", ["--edition", "2021", "-A", "warnings", "-o", bin, `${FIX}/main.rs`]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);
});
