// ============================================================================
// rust-tuple-match.test.ts — `match (a, b)` without building a tuple object.
// ============================================================================
//
// The elements of a tuple scrutinee get one temporary each and the tuple
// patterns test those directly; before, every match allocated an RsTup_
// (on C++ a make_shared per call). A number is still copied, so an arm that
// changes the variable does not change what the pattern bound. The answers must be the ones es6 gives.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/rust_tuple_match/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "rust-tuple-match");

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

function compile(lang: string, file: string, src = SRC, sub = ""): string {
  const dir = path.join(OUT, sub, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const extra = lang === "es6" ? ["-nodecli"] : [];
  const c = run("node", ["dist/rgrc.js", `-l=${lang}`, src, ...extra, `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return dir;
}

describe("Rust match on a tuple", () => {
  it.skipIf(!has("g++ --version"))("matches the elements in place on C++, printing what es6 prints", () => {
    const es = compile("es6", "app.js");
    const expected = run("node", [path.join(es, "app.js")]).stdout;
    expect(expected.trim()).toBe("1 7 -1 7 -1 7 2 -1 4 -1 100 100 100 100 100 7 4 -1 6 -1 200 200 200 200 200 | 21 empty ab-x 2:z 9 0");

    const dir = compile("cpp", "app.cpp");
    const code = fs.readFileSync(path.join(dir, "app.cpp"), "utf8");
    expect(code).not.toContain("RsTup_");

    const bin = path.join(dir, "app");
    const g = run("g++", ["-std=c++17", "-O1", "-w", path.join(dir, "app.cpp"), "-o", bin]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(expected);
  }, 180000);

  it.skipIf(!has("g++ --version"))("copies a tuple of numbers on every target and holds it by value on C++", () => {
    const src = "tests/fixtures/rust_tuple_value/app.rgr";
    const es = compile("es6", "app.js", src, "value");
    const expected = run("node", [path.join(es, "app.js")]).stdout;
    // `let mut u = t; u.0 = 100` leaves t.0 at 3
    expect(expected.trim()).toBe("46 9 2 8 3 100 11");
    const dir = compile("cpp", "app.cpp", src, "value");
    const code = fs.readFileSync(path.join(dir, "app.cpp"), "utf8");
    expect(code).toContain("std::vector<RsTup_int_int> pairs");
    expect(code).not.toContain("make_shared<RsTup_int_int>");
    const bin = path.join(dir, "app");
    const g = run("g++", ["-std=c++17", "-O1", "-w", path.join(dir, "app.cpp"), "-o", bin]);
    expect(g.status, g.out).toBe(0);
    expect(run(bin, []).stdout).toBe(expected);
  }, 180000);
});
