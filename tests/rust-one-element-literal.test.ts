// ============================================================================
// rust-one-element-literal.test.ts — `f(([] _:string ("id")))` on Rust.
// ============================================================================
//
// The Rust writer unwraps single-child expressions to find a bare string
// literal argument; a walked one-element array literal is such a node, so
// the call came out as `f("id")`. The unwrapping now stops at an array
// literal.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/one_element_literal/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "one-element-literal");
const EXPECTED = "1\nk=v\n2\n";

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

describe("a one-element array literal as a call argument", () => {
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
