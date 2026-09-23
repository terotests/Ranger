/**
 * `if (!null? x) { ... }` narrows x for the then block: under -strict the
 * block may read through x without an `unwrap`. Only a condition that must be
 * true for the block to run counts -- a bare `!null?` or an `&&` of them. An
 * `||`, another variable, and the code after the `if` stay optional.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

const ROOT = path.resolve(__dirname, "..");
const FIXTURES = path.join(__dirname, "fixtures");

function compileStrict(fixture: string, lang: string) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "strict-narrowing-"));
  try {
    const r = spawnSync(
      process.execPath,
      [
        "dist/rgrc.js",
        `-l=${lang}`,
        "-strict",
        path.join(FIXTURES, fixture),
        `-d=${out}`,
        "-o=out",
      ],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    return r.stdout + r.stderr;
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}

const UNWRAP_ERROR = "Optional automatically unwrapped outside try block";

describe("-strict: if (!null? x) narrows x", () => {
  for (const lang of ["es6", "cpp", "go", "python", "java7", "rust", "kotlin", "swift6"]) {
    it(`accepts reads through a narrowed optional (${lang})`, () => {
      const output = compileStrict("strict_narrowing.rgr", lang);
      expect(output).not.toContain(UNWRAP_ERROR);
      expect(output).not.toContain("[FAIL]");
    });
  }

  it("still rejects ||, another variable and code after the if", () => {
    const output = compileStrict("strict_narrowing_rejects.rgr", "es6");
    const count = output.split(UNWRAP_ERROR).length - 1;
    expect(count).toBe(3);
  });
});
