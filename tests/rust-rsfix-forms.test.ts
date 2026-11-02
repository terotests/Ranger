// ============================================================================
// rust-rsfix-forms.test.ts — shapes MFilesAPI's window program (desktop/
// wasm-rs) had patched after the Rust writer, from rustc's diagnostics
// (rsfix.py), until the writer wrote them itself:
//   - a struct holding a class with subclasses (Rc<RefCell<dyn XTrait>>)
//     derived no Clone, and `return t` from a local of it is `t.clone()`;
//   - `push list (this.environment((trim (this.rawGroup()))))` borrowed
//     `self` mutably twice in one statement (E0499): the push is the
//     statement, so the nested self call goes to a temporary first;
//   - a field read straight off a method's result, `(this.styleAt(i)).align`,
//     had no `.borrow()` when the method takes the shared handle (E0609);
//   - `st.bold.set(true)` on a local value struct left the local without
//     `mut` (E0596);
//   - `"x" + (esc((strfromcode 65)))` handed esc a char: a strfromcode is
//     left a char only when it is itself the format! argument;
//   - a hoisted argument took the name `__arg_0` of a local the source
//     declared itself, so the call read the temporary in its place.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_rsfix_forms/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-rsfix-forms");
const EXPECTED = [
  "fits",
  "3 6",
  "pg",
  "env:g1 11",
  "histver 1.5 2.5 4",
  "x[A]",
  "half fits",
  "3 7",
  "run bold",
  "bold",
  "",
].join("\n");

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

describe("Rust writer: the forms rsfix.py used to patch", () => {
  it.skipIf(!has("rustc --version"))("compiles with rustc as written and runs", () => {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    const c = run("node", ["dist/rgrc.js", "-l=rust", SRC, `-d=${path.relative(ROOT, OUT)}`, "-o=app.rs"]);
    expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
    const src = path.join(OUT, "app.rs");
    const rs = fs.readFileSync(src, "utf8");
    expect(rs).toMatch(/#\[derive\(Clone\)\]\nstruct Tok \{/);
    expect(rs).toMatch(/let mut _tmp_\d+ = self\.raw_group\(\);/);
    expect(rs).toMatch(/style_at\(__self_rc, a_line\)\.borrow\(\)\.align/);
    expect(rs).toContain("let mut st: RunStyle");
    expect(rs).toMatch(/let __arg_2 = Menu::rest_int\(id\);\n\s*self\.open\("histver", __arg_0, __arg_1, __arg_2\);/);
    const bin = path.join(OUT, "app");
    const b = run("rustc", ["--edition", "2021", "-o", bin, src]);
    expect(b.status, b.out).toBe(0);
    expect(run(bin, []).stdout).toBe(EXPECTED);
  }, 180000);

  it("es6 prints the same", () => {
    const dir = path.join(OUT, "es6");
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const c = run("node", ["dist/rgrc.js", "-l=es6", SRC, "-nodecli", `-d=${path.relative(ROOT, dir)}`, "-o=app.js"]);
    expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
    expect(run("node", [path.join(dir, "app.js")]).stdout).toBe(EXPECTED);
  }, 180000);
});
