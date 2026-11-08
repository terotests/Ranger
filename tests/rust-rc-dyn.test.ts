// ============================================================================
// rust-rc-dyn.test.ts — an `Rc<RefCell<T>>` in Ranger's Rust syntax:
// `h.clone()` is Rc's clone (the same object) also when T has a `clone` of
// its own, `h.borrow().clone()` is T's, and `Rc<RefCell<dyn Trait>>` is
// borrowed and cloned like any shared object. The fixture prints the same
// on rustc, es6 and Go. C++ is left out: its union of a trait's structs
// holds them as values, so a shared trait object is a copy there.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-rc-dyn");
const SRC = "tests/fixtures/rust_rc_dyn/main.rs";
const EXPECTED = "3 4 9 9\n7 7\n";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const HAS_GO = has("go version");
const HAS_RUSTC = has("rustc --version");

function build(lang: string): string {
  const dir = path.join(OUT, lang);
  fs.mkdirSync(dir, { recursive: true });
  const file = lang === "es6" ? "main.js" : "main.go";
  const r = spawnSync("node", ["dist/rgrc.js", `-l=${lang}`, SRC, `-d=${dir}`, `-o=${file}`, "-nodecli"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  expect(r.stdout, r.stdout).not.toContain("[FAIL]");
  if (lang === "es6") {
    return execSync(`node ${path.join(dir, file)}`, { encoding: "utf-8" });
  }
  return execSync(`go run ${file}`, { cwd: dir, encoding: "utf-8" });
}

describe("Rc<RefCell<T>> clone and Rc<RefCell<dyn Trait>>", () => {
  it.skipIf(!HAS_RUSTC)("rustc", () => {
    const dir = path.join(OUT, "rustc");
    fs.mkdirSync(dir, { recursive: true });
    execSync(`rustc --edition 2021 -o ${path.join(dir, "main")} ${SRC}`, { cwd: ROOT, stdio: "ignore" });
    expect(execSync(path.join(dir, "main"), { encoding: "utf-8" })).toBe(EXPECTED);
  });
  it("es6", () => {
    expect(build("es6")).toBe(EXPECTED);
  });
  it.skipIf(!HAS_GO)("go", () => {
    expect(build("go")).toBe(EXPECTED);
  });
});
