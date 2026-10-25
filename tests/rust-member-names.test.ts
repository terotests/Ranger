// ============================================================================
// rust-member-names.test.ts — .rgr code uses the members of a .rs struct by
// their Rust names, also when they are named like Ranger keywords or
// operators (`type`, `data`, `remove`, `clear`, `select`, `group`); only
// RustReserved.memberUnsafeNames are renamed. Static fns keep their names
// too (`open`, `sorted`), `!` on a call with a format! argument keeps its
// arguments, a field of a class from an imported .rgr file starts as that
// class's constructor, and a static call as a constructor argument in a
// field's first value compiles on Go and C++.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-member-names");

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

const MEMBERS = "tests/fixtures/rust_member_names/Main.rgr";
const MEMBERS_OUT = "7\n2:dx:7\n2::7\n6\nfound\nmissing\n";
const CTOR = "tests/fixtures/ctor_arg_static_call.rgr";

describe("members of a .rs struct named like Ranger keywords", () => {
  it("es6", () => {
    expect(build(MEMBERS, "es6", "members")).toBe(MEMBERS_OUT);
  });
  it.skipIf(!HAS_GO)("go", () => {
    expect(build(MEMBERS, "go", "members")).toBe(MEMBERS_OUT);
  });
  it.skipIf(!HAS_CPP)("cpp", () => {
    expect(build(MEMBERS, "cpp", "members")).toBe(MEMBERS_OUT);
  });
});

describe("a static call as a constructor argument in a field's first value", () => {
  it("es6", () => {
    expect(build(CTOR, "es6", "ctor")).toBe("2\n");
  });
  it.skipIf(!HAS_GO)("go", () => {
    expect(build(CTOR, "go", "ctor")).toBe("2\n");
  });
  it.skipIf(!HAS_CPP)("cpp", () => {
    expect(build(CTOR, "cpp", "ctor")).toBe("2\n");
  });
});

const RGR_FIELD = "tests/fixtures/rust_rgr_field/Main.rgr";

describe("a .rs struct field of a class from an imported .rgr file", () => {
  it("es6", () => {
    expect(build(RGR_FIELD, "es6", "rgrfield")).toBe("2\n");
  });
  it.skipIf(!HAS_GO)("go", () => {
    expect(build(RGR_FIELD, "go", "rgrfield")).toBe("2\n");
  });
  it.skipIf(!HAS_CPP)("cpp", () => {
    expect(build(RGR_FIELD, "cpp", "rgrfield")).toBe("2\n");
  });
});
