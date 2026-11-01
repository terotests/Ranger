// ============================================================================
// rust-two-crates.test.ts — two `.rs` crates imported into one program, as
// MFilesAPI's window (app crate) and RangerDocx (docx crate) are: each is
// lowered on its own, so the generated classes (RsBox_, RsTup_, ...) the first
// wrote are reused by the second and each has its own clone-helper class.
// `Vec<u8>` (a buffer) and `Vec<i64>` get different helper names (both had the
// key `vec_int`).
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-two-crates");

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

const MAIN = "tests/fixtures/rust_two_crates/Main.rgr";
const OUT_TEXT = "16\n108\n";

describe("two .rs crates in one program", () => {
  it("es6", () => {
    expect(build(MAIN, "es6", "two")).toBe(OUT_TEXT);
  });
  it.skipIf(!HAS_GO)("go", () => {
    expect(build(MAIN, "go", "two")).toBe(OUT_TEXT);
  });
  it.skipIf(!HAS_CPP)("cpp", () => {
    expect(build(MAIN, "cpp", "two")).toBe(OUT_TEXT);
  });
});
