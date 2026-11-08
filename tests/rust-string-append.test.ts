// ============================================================================
// rust-string-append.test.ts — `s = s + a + b` appends in place on Rust.
// ============================================================================
//
// The Rust writer used to write every string `+` as one format!, so
// `s = s + y` became `s = format!("{}{}", s, y)`: all of `s` copied on each
// pass, quadratic in a loop that builds a string (the PDF writer's content
// streams). It is now `s.push_str(..)` when the target is a plain owned
// String and the chain starts with it. A prepend, or a chain that names the
// target again, keeps its old meaning; the output must match es6.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_string_append/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-string-append");

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

describe("string self-append on Rust", () => {
  it.skipIf(!has("rustc --version"))("writes push_str and prints what es6 prints", () => {
    const es = compile("es6", "app.js");
    const expected = run("node", [path.join(es, "app.js")]).stdout;
    expect(expected).toContain("pre0,0;");

    const dir = compile("rust", "app.rs");
    const code = fs.readFileSync(path.join(dir, "app.rs"), "utf8");
    expect(code).toContain("s.push_str(&format!(\",{};\"");
    expect(code).toContain('self.out.push_str("{x}");');
    expect(code).toContain("self.out.push_str(&s);");
    expect(code).not.toMatch(/\bs = format!\("\{\}/);
    expect(code).not.toMatch(/self\.out = format!\("\{\}/);
    // a prepend is not an append
    expect(code).toContain('s = format!("pre{}", s);');

    const bin = path.join(dir, "app");
    const b = run("rustc", ["--edition", "2021", "-A", "warnings", "-o", bin, path.join(dir, "app.rs")]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(expected);
  }, 180000);
});
