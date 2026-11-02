// ============================================================================
// math-gallery.test.ts — gallery/math (TeX formulas: parser, layout, OMML,
// EVG/SVG drawing) runs its own suite, MathTest.rgr, on every target it is
// built for. Parser, layout, OMML and render are Rust-syntax modules (src/
// lib.rs); the font data and glyph cache stay .rgr. Each target must pass all
// checks and print the same lines.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "gallery/math/tests/MathTest.rgr";
const OUT = path.join(ROOT, "tests", ".output", "math-gallery");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 300000 });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), stdout: r.stdout ?? "" };
}

function compile(lang: string, file: string) {
  const dir = path.join(OUT, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", ["--max-old-space-size=8192", "dist/rgrc.js", `-l=${lang}`, SRC, "-nodecli", `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  fs.mkdirSync(path.join(ROOT, "gallery/math/bin"), { recursive: true });
  return dir;
}

let es6Out = "";

describe("gallery/math", () => {
  it("es6: every check passes", () => {
    const dir = compile("es6", "math.js");
    es6Out = run("node", [path.join(dir, "math.js")]).stdout;
    expect(es6Out).toContain("ALL PASS");
  }, 300000);

  it.skipIf(!has("rustc --version"))("rust: same output", () => {
    const dir = compile("rust", "math.rs");
    const bin = path.join(dir, "math");
    const b = run("rustc", ["--edition", "2021", "-O", "-o", bin, path.join(dir, "math.rs")]);
    expect(b.status, b.out).toBe(0);
    const out = run(bin, []).stdout;
    expect(out).toContain("ALL PASS");
    if (es6Out) expect(out).toBe(es6Out);
  }, 300000);

  it.skipIf(!has("go version"))("go: same output", () => {
    const dir = compile("go", "main.go");
    fs.writeFileSync(path.join(dir, "go.mod"), "module mathtest\n\ngo 1.21\n");
    const bin = path.join(dir, "math");
    const b = run("go", ["build", "-o", bin, "."], dir);
    expect(b.status, b.out).toBe(0);
    const out = run(bin, []).stdout;
    expect(out).toContain("ALL PASS");
    if (es6Out) expect(out).toBe(es6Out);
  }, 300000);
});
