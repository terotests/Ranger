// ============================================================================
// rust-crate-twice.test.ts — a .rs crate that another crate depends on
// (Cargo path dependency) and that the program also imports itself is
// written once, whichever import comes first: the second one knows its
// types and functions without writing them again, and a .rgr class both
// crates include (ranger::import_rgr!) is one class. RangerMarkdown depends
// on RangerMath this way, both include EVG's classes, and a window imports
// both.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const DIR = "tests/fixtures/rust_crate_twice";
const OUT = path.join(ROOT, "tests", ".output", "rust-crate-twice");

function has(cmd: string, args: string[]): boolean {
  return spawnSync(cmd, args, { stdio: "ignore" }).status === 0;
}

function build(prog: string, lang: string, file: string) {
  const dir = path.join(OUT, lang);
  fs.mkdirSync(dir, { recursive: true });
  const c = spawnSync("node", ["dist/rgrc.js", `-l=${lang}`, `${DIR}/${prog}.rgr`, "-nodecli", `-d=${path.relative(ROOT, dir)}`, `-o=${file}`], { cwd: ROOT, encoding: "utf8" });
  const out = (c.stdout ?? "") + (c.stderr ?? "");
  expect(c.status === 0 && !out.includes("[FAIL]"), out).toBe(true);
  return path.join(dir, file);
}

describe("a .rs crate imported directly and as a dependency", () => {
  for (const prog of ["geo_first", "shapes_first"]) {
    it(`${prog}: es6, each class once`, () => {
      const js = build(prog, "es6", `${prog}.js`);
      const src = fs.readFileSync(js, "utf8");
      expect(src.match(/^class Pt /gm)?.length).toBe(1);
      expect(src.match(/^class Seg /gm)?.length).toBe(1);
      expect(src.match(/^class Label /gm)?.length).toBe(1);
      const r = spawnSync("node", [js], { encoding: "utf8" });
      expect(r.stdout).toBe("len 5\nseg pt\ndist 1\n");
    });
    it.skipIf(!has("rustc", ["--version"]))(`${prog}: rust`, () => {
      const rs = build(prog, "rust", `${prog}.rs`);
      const bin = rs.replace(/\.rs$/, "");
      const b = spawnSync("rustc", ["--edition", "2021", "-o", bin, rs], { encoding: "utf8" });
      expect(b.status, b.stderr).toBe(0);
      expect(spawnSync(bin, [], { encoding: "utf8" }).stdout).toBe("len 5\nseg pt\ndist 1\n");
    }, 120000);
  }
});
