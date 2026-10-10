// ============================================================================
// compiler-go-subclass-iface.test.ts — subclass interfaces and indexOf in Go
// ============================================================================
//
// A class with both a parent and subclasses is an interface in Go
// (IFACE_Mid), and that interface listed only the class's own fields and
// methods: a Mid could not be used where its parent was wanted ("IFACE_Mid
// does not implement IFACE_Base (missing method Get_name)"). Its interface
// now lists what it inherits too.
//
// `indexOf` wrote its helper's element type with a "*" whenever the array
// expression was not a primitive type node: on a list of a subclassed class
// that gave []*IFACE_Base, and on a call's result []*string, a second
// r_indexof_arr_string beside the right one. The "*" now follows the
// rules the array's own type is written by.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/go_subclass_iface/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "go-subclass-iface");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), stdout: r.stdout ?? "" };
}

function compile(target: string, outName: string) {
  const dir = path.join(OUT, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", ["dist/rgrc.js", `-l=${target}`, SRC, `-d=${path.relative(ROOT, dir)}`, `-o=${outName}`]);
  return { ok: c.status === 0 && !c.out.includes("[FAIL]"), log: c.out, dir, file: path.join(dir, outName) };
}

const EXPECTED = [
  "indexOf class with subclasses: 0",
  "kid as base: base k",
  "indexOf on a call result: 1",
  "indexOf strings: 0",
  "a Mid as a Base: base leaf",
  "indexOf mids: 0",
  "indexOf plain: 0",
  "",
].join("\n");

describe("Go: subclass interfaces and indexOf", () => {
  it("es6", () => {
    const c = compile("es6", "app.js");
    expect(c.ok, c.log).toBe(true);
    expect(run("node", [c.file]).stdout).toBe(EXPECTED);
  });

  it.skipIf(!has("go version"))("go", () => {
    const c = compile("go", "app.go");
    expect(c.ok, c.log).toBe(true);
    const r = run("go", ["run", "app.go"], c.dir);
    expect(r.stdout, r.out).toBe(EXPECTED);
  });
});
