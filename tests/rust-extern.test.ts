// ============================================================================
// rust-extern.test.ts — `-rust-extern=<crate>=<path>`: two cargo crates that
// each include .rgr modules (ranger::import_rgr! on -rust-module output) and
// share .rgr files. base writes Shared.rgr's types; app's module names them
// with `use base::*;` instead of writing a second Item, so a value made by
// base passes to app's own class (fixture tests/fixtures/rust_extern).
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "tests/fixtures/rust_extern");
const OUT = path.join(ROOT, "tests", ".output", "rust-extern");

function has(cmd: string, args: string[]): boolean {
  return spawnSync(cmd, args, { stdio: "ignore" }).status === 0;
}

describe("-rust-extern", () => {
  it("es6 ignores the setting", () => {
    fs.mkdirSync(OUT, { recursive: true });
    const c = spawnSync("node", ["dist/rgrc.js", "-l=es6", path.join(DIR, "app/App.rgr"), `-rust-extern=base=${DIR}/base/Base.rgr`, "-nodecli", `-d=${OUT}`, "-o=app.js"], { cwd: ROOT, encoding: "utf8" });
    const out = (c.stdout ?? "") + (c.stderr ?? "");
    expect(c.status === 0 && !out.includes("[FAIL]"), out).toBe(true);
    expect(fs.readFileSync(path.join(OUT, "app.js"), "utf8")).toMatch(/^class Item /m);
  });

  it.skipIf(!has("cargo", ["--version"]))("app names base's types: one Item under rustc", () => {
    const target = path.join(OUT, "target");
    fs.rmSync(target, { recursive: true, force: true });
    const r = spawnSync("cargo", ["run", "-q", "--offline"], {
      cwd: path.join(DIR, "app"),
      encoding: "utf8",
      env: { ...process.env, CARGO_TARGET_DIR: target },
    });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toBe("a small 6\nb large 20\nplain\n*plain*\n2\n");
    const app = spawnSync("sh", ["-c", `cat ${target}/debug/build/app-*/out/App.rs`], { encoding: "utf8" }).stdout;
    expect(app).toContain("use ::base::*;");
    expect(app).not.toMatch(/struct Item\b/);
    expect(app).not.toMatch(/enum Kind\b/);
    expect(app).toMatch(/struct Report\b/);
    expect(app).toMatch(/pub trait LabelTrait\b/);
  }, 300000);

  // RangerMath's .rs modules use EVG's types from the rangerevg crate, whose
  // build.rs writes lib/evg (placed by npm run deps) as one module
  it.skipIf(!has("cargo", ["--version"]) || !fs.existsSync(path.join(ROOT, "lib/evg/EVGElement.rgr")))("gallery/math builds with cargo on rangerevg", () => {
    const r = spawnSync("cargo", ["build", "--offline"], {
      cwd: path.join(ROOT, "gallery/math"),
      encoding: "utf8",
      env: { ...process.env, CARGO_TARGET_DIR: path.join(OUT, "target-math") },
    });
    expect(r.status, r.stderr).toBe(0);
  }, 600000);
});
