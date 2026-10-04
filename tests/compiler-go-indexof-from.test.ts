// ============================================================================
// compiler-go-indexof-from.test.ts — `indexOfFrom s key start` with start named idx
// ============================================================================
//
// The Go expansion of `indexOfFrom` wrapped the search in a
// closure that declared `idx := strings.Index(...)` and then added the start.
// A start that was itself a variable named `idx` read the closure's `int`, and
// the generated file did not build ("mismatched types int64 and int"). That
// took every OPC package reader with it (gallery/ooxml/OpcPackage.rgr scans
// relationships with exactly that name). Fixed by 0d991d159 (the closure's
// variable is __at), ported to master with this test; the program here opens
// no package, so it pins the expansion itself.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const SRC = "tests/fixtures/indexof_from_idx/app.rgr";
const OUT = path.join(ROOT, "tests", ".output", "indexof-from-idx");

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

// "<b" is at 9, the ">" after it at 12; three "<"; no "zz"; the first quote at or after 3 is 5
const EXPECTED = "12\n3\n-1\n5\n";

describe("indexOfFrom with a start named idx", () => {
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
