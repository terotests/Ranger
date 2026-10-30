// ============================================================================
// rust-buffer-owned.test.ts — borrowed buffers into owned slots, base64 on Rust.
// ============================================================================
//
// `return bytes` and `def raw:buffer b` of a borrowed buffer parameter wrote
// the slice where a Vec was wanted (E0308), and buffer_to_base64 named the
// base64 crate, which a crate does not have unless it adds it.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_buffer_owned/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-buffer-owned");
const EXPECTED = "TWFu\n";

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

describe("borrowed buffers and base64 on Rust", () => {
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
