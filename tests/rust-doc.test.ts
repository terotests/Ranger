// ============================================================================
// rust-doc.test.ts — rustdoc read as Ranger documentation (PLAN_RUST_SYNTAX.md
// stage R5): `-apidoc` describes tests/fixtures/rust_doc/geometry.rs as it
// describes its hand-written .rgr twin.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-doc");

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

function apidoc(file: string, dirName: string) {
  const dir = path.join(OUT, dirName);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const c = run("node", [
    "dist/rgrc.js",
    "-es6",
    file,
    `-d=${path.relative(ROOT, dir)}`,
    "-o=index.js",
    "-apidoc=docs",
    "-apiformat=json,markdown",
  ]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out).toBe(true);
  return {
    dir,
    md: fs.readFileSync(path.join(dir, "docs", "api.md"), "utf8"),
    json: JSON.parse(fs.readFileSync(path.join(dir, "docs", "api.json"), "utf8")),
    js: fs.readFileSync(path.join(dir, "index.js"), "utf8"),
  };
}

// The public API: the classes, fields and methods marked public. The
// generated helper classes of either form are not part of it.
function publicApi(json: { classes: any[] }) {
  return json.classes
    .filter((c) => c.public)
    .map((c) => ({
      ...c,
      fields: (c.fields ?? []).filter((f: any) => f.public),
      methods: (c.methods ?? []).filter((m: any) => m.public),
    }));
}

describe("rustdoc as API documentation", () => {
  const rs = apidoc("tests/fixtures/rust_doc/geometry.rs", "rs");
  const rgr = apidoc("tests/fixtures/rust_doc/geometry.rgr", "rgr");

  it("api.md of the .rs module equals the one of its .rgr twin", () => {
    expect(rs.md).toBe(rgr.md);
    expect(rs.md).toContain("Points and distances on a grid.");
    expect(rs.md).toContain("**Deprecated** since 1.3. Compare x and y directly.");
  });

  it("the public entries of api.json are equal", () => {
    expect(publicApi(rs.json)).toEqual(publicApi(rgr.json));
    const manhattan = publicApi(rs.json)
      .find((c: any) => c.name === "Geometry")
      .methods.find((m: any) => m.name === "manhattan");
    expect(manhattan.since).toBe("1.2");
    expect(manhattan.examples).toEqual(["manhattan(Point::new(0, 0), Point::new(2, 3)) == 5"]);
  });

  it("a doctest is compiled as an example and left out of the code", () => {
    expect(rs.js).toMatch(/@example[\s\S]*\.step\(/);
    expect(rs.js).not.toMatch(/doc_example_step_1 = function|doc_example_step_1\s*\(/);
  });

  it.skipIf(!has("cargo --version") || !has("rustc --version"))(
    "rustc builds the module with the prelude crate, and it prints what es6 prints",
    () => {
      const target = path.join(OUT, "cargo");
      const b = run("cargo", [
        "build",
        "--offline",
        "--quiet",
        "--manifest-path",
        "runtime/rust/ranger/Cargo.toml",
        "--target-dir",
        target,
      ]);
      expect(b.status, b.out).toBe(0);
      const dbg = path.join(target, "debug");
      const bin = path.join(OUT, "geometry-native");
      const c = run("rustc", [
        "--edition",
        "2021",
        "--extern",
        `ranger=${path.join(dbg, "libranger.rlib")}`,
        "-L",
        `dependency=${path.join(dbg, "deps")}`,
        "-o",
        bin,
        "tests/fixtures/rust_doc/geometry.rs",
      ]);
      expect(c.status, c.out).toBe(0);
      const native = run(bin, []).stdout;
      expect(run("node", [path.join(rs.dir, "index.js")]).stdout).toBe(native);
    },
    300000,
  );
});
