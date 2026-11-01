// ============================================================================
// rust-rgr-generic.test.ts — a generic .rgr class used from Rust syntax.
// ============================================================================
//
// `Hist<Rc<RefCell<Snap>>>` in a .rs file names `class Hist @params(Op)` of
// an imported .rgr file. The lowering used to treat it as a generic Rust
// struct to instantiate and crashed on the .rgr methods (no patterns). It
// is now written as Ranger's `Hist@(Snap)`, built with `new Hist@(Snap) ()`.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_rgr_generic/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-rgr-generic");
const EXPECTED = "1\n2\nb\nb\n";

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

describe("a generic .rgr class used from Rust syntax", () => {
  it("es6", () => {
    const dir = path.join(OUT, "es6");
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const c = run("node", ["dist/rgrc.js", "-es6", SRC, `-d=${path.relative(ROOT, dir)}`, "-o=app.js", "-nodecli"]);
    expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
    expect(run("node", [path.join(dir, "app.js")]).stdout).toBe(EXPECTED);
  }, 180000);

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
