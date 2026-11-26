// ============================================================================
// rust-data-enum.test.ts — a Rust enum with data, written per target.
// ============================================================================
//
// RustLower turns `enum Obj { Null, Num(f64), Dict { keys, items } }` into a
// Ranger `shape` with one `case` per variant, and each writer gives it the
// platform's own sum type: Kotlin a sealed interface, C++ a std::variant, Go
// a tagged struct (a tag and one pointer per case), es6 classes told apart
// by a kind field. The Rust target keeps the source. The fixture changes a
// variant in place through `&mut self` (`items[i] = v`, `keys.push(..)`),
// which C++ binds as a reference into the case (`@(refmut)`).

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_data_enum/main.rs";
const OUT = path.join(ROOT, "tests", ".output", "rust-data-enum");
const EXPECTED = "2 2 1 0 4999950000\nx\n";

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
  const c = run("node", ["dist/rgrc.js", `-l=${lang}`, SRC, "-nodecli", `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return path.join(dir, file);
}

describe("Rust data enum per target", () => {
  it.skipIf(!has("rustc --version"))("rustc prints the expected answer", () => {
    const bin = path.join(OUT, "rust_bin");
    fs.mkdirSync(OUT, { recursive: true });
    const c = run("rustc", ["--edition", "2021", "-O", SRC, "-o", bin]);
    expect(c.status, c.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);

  it("es6: classes with a kind field", () => {
    const f = compile("es6", "main.js");
    expect(fs.readFileSync(f, "utf8")).toContain('__rg_kind === "Obj_Dict"');
    expect(run("node", [f]).stdout).toBe(EXPECTED);
  }, 180000);

  it("kotlin: a sealed interface", () => {
    const f = compile("kotlin", "main.kt");
    const code = fs.readFileSync(f, "utf8");
    expect(code).toContain("sealed interface union_Obj");
    expect(code).toMatch(/class Obj_Dict\(.*\) : union_Obj/);
  }, 180000);

  it.skipIf(!has("go version"))("go: a tagged struct", () => {
    const f = compile("go", "main.go");
    const code = fs.readFileSync(f, "utf8");
    expect(code).toContain("type union_Obj struct {\n  tag int");
    expect(run("go", ["run", path.basename(f)], path.dirname(f)).stdout).toBe(EXPECTED);
  }, 180000);

  it.skipIf(!has("g++ --version"))("cpp: a std::variant, changed in place", () => {
    const f = compile("cpp", "main.cpp");
    const code = fs.readFileSync(f, "utf8");
    expect(code).toContain("typedef std::variant<Obj_Null, Obj_Num,");
    // the `ref mut` bindings of the Vec fields are references into the
    // case, not copies (a copy made each push O(n): 25 s against 0.08 s)
    expect(code).toContain("std::vector<r_union_Obj>& items = ");
    expect(code).toContain("std::vector<std::string>& keys_ = ");
    const bin = path.join(path.dirname(f), "main");
    const g = run("g++", ["-std=c++17", "-O1", "-w", f, "-o", bin]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);
});
