// ============================================================================
// rust-dyn-union-wrap.test.ts — `Rc<RefCell<dyn Trait>>` from Rust syntax
// through Ranger's Rust writer. The trait is a union of its structs there
// (`union_DynEditorLanguage`), and a struct value meeting the trait type was
// written bare: `none: PlainText::zero_of()` as a field's first value,
// `let j: union_DynEditorLanguage = Js::new_()`, an assignment, and a
// pre-evaluated argument `let __arg_0 = PlainText::new_()` — each a type
// error. A static call now gives the class it returns, so it is wrapped like a
// `new`. A struct whose method writes its own fields (`Js::count`) stays
// behind the cell, so the registry and a lookup share one object as they do on
// es6 and Go.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-dyn-union-wrap");
const SRC = "tests/fixtures/rust_dyn_union_wrap/Main.rgr";
const EXPECTED = "js 2 2\n1 3\ntext\ntext text\n";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function compile(lang: string, file: string): string {
  const dir = path.join(OUT, lang);
  fs.mkdirSync(dir, { recursive: true });
  const r = spawnSync("node", ["dist/rgrc.js", `-l=${lang}`, SRC, `-d=${dir}`, `-o=${file}`, "-nodecli"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  expect(r.stdout, r.stdout).not.toContain("[FAIL]");
  return dir;
}

describe("a struct wrapped into a dyn trait's union on the Rust target", () => {
  it.skipIf(!has("rustc --version"))("rust", () => {
    const dir = compile("rust", "main.rs");
    const b = spawnSync("rustc", ["--edition", "2021", "-o", path.join(dir, "main"), path.join(dir, "main.rs")], {
      encoding: "utf-8",
    });
    expect(b.status, b.stderr).toBe(0);
    expect(execSync(path.join(dir, "main"), { encoding: "utf-8" })).toBe(EXPECTED);
  });
  it("es6", () => {
    const dir = compile("es6", "main.js");
    expect(execSync(`node ${path.join(dir, "main.js")}`, { encoding: "utf-8" })).toBe(EXPECTED);
  });
  it.skipIf(!has("go version"))("go", () => {
    const dir = compile("go", "main.go");
    expect(execSync("go run main.go", { cwd: dir, encoding: "utf-8" })).toBe(EXPECTED);
  });
});
