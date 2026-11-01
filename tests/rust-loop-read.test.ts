// ============================================================================
// rust-loop-read.test.ts — a string read inside a loop it was declared outside.
// ============================================================================
//
// `def owner:string last` in a loop body, with `last` declared before the
// loop, was written as a move because `last` is named only once (ref_cnt
// 1). The second pass then read a moved value (E0382). Both the .rgr form
// and the Rust-syntax form (`last.clone()` lowered to a plain read) are
// checked.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_loop_read/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-loop-read");
const EXPECTED = "abbabb\naba\n";

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

describe("a string read inside a loop it was declared outside of", () => {
  it.skipIf(!has("rustc --version"))("rust", () => {
    const dir = path.join(OUT, "rust");
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const c = run("node", ["dist/rgrc.js", "-l=rust", SRC, `-d=${path.relative(ROOT, dir)}`, "-o=app.rs"]);
    expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
    const bin = path.join(dir, "app");
    const b = run("rustc", ["--edition", "2021", "-o", bin, path.join(dir, "app.rs")]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);
});
