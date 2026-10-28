// ============================================================================
// rust-module-reads.test.ts — reads rustc rejected in a `-rust-module` build.
// ============================================================================
//
// In a module build every class is shared (Rc<RefCell<T>>), which exposed:
//   - `(Clock.parts(ms)).year`: a static call returns the Rc, so the field
//     read needs `.borrow()` first;
//   - `(? forward op.newText op.oldText)`: each branch of the value `if`
//     moved a String out of a borrow (E0507); it now clones;
//   - `def b:string family` in a method with no `self`: the bare field read
//     through `__self_rc.borrow()` moved too;
//   - a constructor calling a method that takes the handle.
// The same program also builds as a plain (non-module) Rust binary.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_module_reads/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-module-reads");
const EXPECTED = "2026\nn\no\nmono\n";

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

function build(mode: string, flags: string[], tail: string) {
  const dir = path.join(OUT, mode);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", ["dist/rgrc.js", "-l=rust", ...flags, SRC, `-d=${path.relative(ROOT, dir)}`, "-o=app.rs"]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  const src = path.join(dir, "app.rs");
  if (tail) fs.appendFileSync(src, tail);
  const bin = path.join(dir, "app");
  const b = run("rustc", ["--edition", "2021", "-o", bin, src]);
  expect(b.status, b.out).toBe(0);
  expect(run(bin, []).stdout).toBe(EXPECTED);
  return fs.readFileSync(src, "utf8");
}

describe("field reads in a -rust-module build", () => {
  it.skipIf(!has("rustc --version"))("module", () => {
    const rs = build("module", ["-rust-module"], "\nfn main() { __rg_main_body(); }\n");
    expect(rs).toContain("Clock::parts(ms).borrow().year");
    expect(rs).toContain("if forward { op.borrow().new_text.clone() } else { op.borrow().old_text.clone() }");
    expect(rs).toContain("let b: String = __self_rc.borrow().family.clone();");
  }, 180000);

  it.skipIf(!has("rustc --version"))("plain", () => {
    build("plain", [], "");
  }, 180000);
});
