// ============================================================================
// rust-rs-entry-crates.test.ts — a `.rs` entry crate whose .rgr module
// imports a second `.rs` crate, as MFilesAPI's desktop/web/main.rs is (its
// window crate's .rgr files import RangerDocx and RangerPPTX). The entry is
// the program's first crate: the second reuses its generated classes and
// gets clone helpers of its own (RsClone1). It was given the entry's name,
// RsClone, so one crate's helpers were lost ("function variable not found
// c_vec_vec_int").
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-rs-entry-crates");

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

const MAIN = "tests/fixtures/rust_rs_entry_crates/main.rs";
const OUT_TEXT = "16\n108\n";

describe("a .rs entry crate and a second crate from its .rgr module", () => {
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
