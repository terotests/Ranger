// ============================================================================
// compiler-cpp-class-shapes.test.ts — shapes the Sliqtly editor hit on C++
// ============================================================================
//
// - A subclass with no constructor of its own under a base that has one
//   crashed the C++ writer (it read the subclass's missing constructor).
// - A static function named like a field (`sfn text` next to `def text`) is
//   one scope in C++; the static now gets a suffix.
// - `cell = none` inside `if (!null? cell)` was written `cell.value() = none`.
// - `unwrap` of a buffer wrote `.value()` on a bare std::vector.
// - `??` over `(get map key)` with a variable key: the generated Ranger form
//   of an operator without a ranger template ran its arguments together,
//   `(get countskey)`.
// - A local named like a math function (`def floor:double`) hid the
//   unqualified `floor(…)` that to_int wrote in C++; the cmath calls of the
//   C++ templates are std:: now.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/cpp_class_shapes/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "cpp-class-shapes");

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

const EXPECTED = "hi\nbase1\ncleared\n3\n2 7\n|5\n45\n";

describe("C++ class shapes", () => {
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
