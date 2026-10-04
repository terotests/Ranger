// ============================================================================
// compiler-cpp-buffer-from-string.test.ts — buffer_from_string of a temporary
// ============================================================================
//
// The C++ expansion was `std::vector<uint8_t>(E.begin(), E.end())`, with E
// written twice. For a temporary — a literal, a call, a concatenation — that
// is two strings, and the vector was built from the start of one to the end of
// the other: garbage bytes for "", std::length_error for a call's result. The
// expression is now bound once, by a lambda's parameter.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/buffer_from_temp/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "buffer-from-temp");

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

// 0 bytes, 3, 1000, 2, and "b" is 98
const EXPECTED = "0\n3\n1000\n2\n98\n";

describe("buffer_from_string of a temporary", () => {
  it("es6", () => {
    const c = compile("es6", "app.js");
    expect(c.ok, c.log).toBe(true);
    expect(run("node", [c.file]).stdout).toBe(EXPECTED);
  });

  it.skipIf(!has("g++ --version"))("cpp", () => {
    const c = compile("cpp", "app.cpp");
    expect(c.ok, c.log).toBe(true);
    fs.copyFileSync(path.join(ROOT, "gallery/invaders/variant.hpp"), path.join(c.dir, "variant.hpp"));
    const b = run("g++", ["-std=c++17", "-I", c.dir, "-o", path.join(c.dir, "app"), c.file]);
    expect(b.status, b.out).toBe(0);
    const r = run(path.join(c.dir, "app"), []);
    expect(r.stdout, r.out).toBe(EXPECTED);
  });
});
