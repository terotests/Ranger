// ============================================================================
// rust-cpp-plain.test.ts — structs of numbers as C++ values.
// ============================================================================
//
// A struct whose fields are numbers, booleans or such structs is a C++
// value (no make_shared): Copy structs, and on C++ also structs Rust only
// moves (CEr's call Frame), unless one is ever behind Rc / Box / RefCell.
// A `&mut` to one (`let f = &mut v[i]`, an iter_mut() loop variable,
// `fn top(&mut self) -> &mut T`) is a C++ reference. The answers must be the ones es6 gives.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_cpp_plain/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-cpp-plain");

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

function compile(lang: string, file: string, src = SRC, sub = ""): string {
  const dir = path.join(OUT, sub, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const extra = lang === "es6" ? ["-nodecli"] : [];
  const c = run("node", ["dist/rgrc.js", `-l=${lang}`, src, ...extra, `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return dir;
}

describe("plain structs as C++ values", () => {
  for (const [name, src, want, gone] of [
    ["a moved struct (a call frame) in a Vec, next to a shared one", "tests/fixtures/rust_cpp_plain/app.rgr", "180216 2 true", "make_shared<F>"],
    ["Copy structs reached through &mut", "tests/fixtures/rust_cpp_plain_copy/app.rgr", "1246 1011 4 2.5 118 77 1 42", "make_shared<P>"],
  ] as const) {
    it.skipIf(!has("g++ --version"))(name, () => {
      const sub = path.basename(path.dirname(src));
      const es = compile("es6", "app.js", src, sub);
      const expected = run("node", [path.join(es, "app.js")]).stdout;
      expect(expected.trim()).toBe(want);
      const dir = compile("cpp", "app.cpp", src, sub);
      const code = fs.readFileSync(path.join(dir, "app.cpp"), "utf8");
      expect(code).not.toContain(gone);
      const bin = path.join(dir, "app");
      const g = run("g++", ["-std=c++17", "-O1", "-w", path.join(dir, "app.cpp"), "-o", bin]);
      expect(g.status, g.out).toBe(0);
      expect(run(bin, []).stdout).toBe(expected);
    }, 180000);
  }
});
