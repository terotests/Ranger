// ============================================================================
// rust-scope-names.test.ts — shapes rustc rejected when a .rgr program that
// imports Rust-syntax modules (MFilesAPI's MfdApp.rgr importing lib.rs) was
// built with the Rust target:
//   - the snake_case collision guard took every name of the program, so a
//     .rs module's own `ring_ends` / `max_y` kept a .rgr class's `ringEnds` /
//     `maxY` camelCase everywhere; it now asks the name's own scope (a class
//     with its parents, or a function), and both spellings in one scope
//     still keep the camelCase one;
//   - `def found@(optional):string o` then `found = o5` wrote
//     `found = o5.clone().unwrap()` into an Option local;
//   - a pre-evaluated value for an Rc local (a tuple `if` over a shared
//     object's fields) went into the temporary without its cell.
// Built as a -rust-module and as a plain Rust binary.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_scope_names/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-scope-names");
const EXPECTED = "5 1 2\nx\n11\n3 12\n";

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

function names(rs: string) {
  expect(rs).toMatch(/ring_ends: Vec<i64>,\n  (pub )?max_y: i64,/);
  expect(rs).toMatch(/fooBar: i64,\n  (pub )?foo_bar: i64,/);
  expect(rs).toContain("let pluginFn: i64 = 5;");
}

describe("Rust names by scope, optional locals, pre-evaluated cells", () => {
  it.skipIf(!has("rustc --version"))("module", () => {
    const rs = build("module", ["-rust-module"], "\nfn main() { __rg_main_body(); }\n");
    names(rs);
    expect(rs).not.toContain("found = o5.clone().unwrap()");
    expect(rs).toMatch(/let _tmp_\d+ = Rc::new\(RefCell::new\(RsTup_int_int::new\(/);
  }, 180000);

  it.skipIf(!has("rustc --version"))("plain", () => {
    names(build("plain", [], ""));
  }, 180000);
});
