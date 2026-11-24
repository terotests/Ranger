// ============================================================================
// rust-copy-value.test.ts — a Rust Copy struct of scalars is a C++ value.
// ============================================================================
//
// `#[derive(Clone, Copy)] struct P { x: i32, y: f64 }` used to reach C++ as
// `std::shared_ptr<P>`: every `P::new`, every copy Rust makes on a read, a
// heap allocation and a reference count. RustLower marks such a struct
// `@(copy)` and the C++ writer holds it by value: `P`, `std::vector<P>`,
// `std::optional<P>`, `&self` methods const, `&P` / `P` parameters by value,
// `&mut P` as `P&`, and the place temporaries of `v[i].x = ..` as `auto&&`.
// The answers must be the ones es6 gives (copies stay copies, writes through
// a place land in it).

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_copy_value/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-copy-value");

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

describe("Rust Copy struct on C++", () => {
  it.skipIf(!has("g++ --version"))("is a value and prints what es6 prints", () => {
    const es = compile("es6", "app.js");
    const expected = run("node", [path.join(es, "app.js")]).stdout;
    expect(expected.trim()).toBe("1 2 10 3 2 3 10 20 12.5 11 first 20 empty");

    const dir = compile("cpp", "app.cpp");
    const code = fs.readFileSync(path.join(dir, "app.cpp"), "utf8");
    expect(code).not.toContain("std::shared_ptr<P>");
    expect(code).toContain("std::vector<P>");
    expect(code).toContain("std::optional<P>");
    expect(code).toMatch(/double sum\(\s*\) const;/);
    expect(code).toMatch(/void bump\(\s*\);/);

    const bin = path.join(dir, "app");
    const b = run("g++", ["-std=c++17", "-o", bin, path.join(dir, "app.cpp")]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(expected);
  }, 180000);
});
