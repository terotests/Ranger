// ============================================================================
// rust-docx-shapes.test.ts — three shapes RangerDocx's Rust-syntax modules
// needed: a `buffer` field of a .rgr class read and written from .rs as a
// Vec<u8>, `.clone()` of an `Rc<RefCell<T>>` whose T derives no Clone (the
// handle is copied), and `Type::f(&mut v, …)` with a Vec place, which is
// boxed and written back like a module function's.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-docx-shapes");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const HAS_GO = has("go version");
const HAS_CPP = has("g++ --version");

function build(src: string, lang: string, name: string): string {
  const dir = path.join(OUT, `${name}_${lang}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = lang === "es6" ? "main.js" : lang === "go" ? "main.go" : "main.cpp";
  const r = spawnSync("node", ["dist/rgrc.js", `-l=${lang}`, src, `-d=${dir}`, `-o=${file}`, "-nodecli"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  expect(r.stdout, r.stdout).not.toContain("[FAIL]");
  const out = path.join(dir, file);
  expect(fs.existsSync(out)).toBe(true);
  if (lang === "es6") {
    return execSync(`node ${out}`, { encoding: "utf-8" });
  }
  if (lang === "go") {
    return execSync(`go run ${file}`, { cwd: dir, encoding: "utf-8" });
  }
  execSync(`g++ -std=c++17 -w -o main ${file}`, { cwd: dir });
  return execSync("./main", { cwd: dir, encoding: "utf-8" });
}

const SHAPES = "tests/fixtures/rust_docx_shapes/Main.rgr";
const SHAPES_OUT = "204\n7\n123\n";

describe("RangerDocx shapes: buffer field, Rc clone, boxed static call", () => {
  it("es6", () => {
    expect(build(SHAPES, "es6", "shapes")).toBe(SHAPES_OUT);
  });
  it.skipIf(!HAS_GO)("go", () => {
    expect(build(SHAPES, "go", "shapes")).toBe(SHAPES_OUT);
  });
  it.skipIf(!HAS_CPP)("cpp", () => {
    expect(build(SHAPES, "cpp", "shapes")).toBe(SHAPES_OUT);
  });
});
