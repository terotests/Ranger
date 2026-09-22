/**
 * `-strict-strings` on the compiler's own sources has to stay at zero.
 *
 * The flag reports the places where a string index is *observable* — where
 * the answer, not only the number, changes with the target. A scan is not
 * one of those: `while (i < (strlen s)) { charAt s i }` reads the same
 * characters whether the target counts UTF-8 bytes, UTF-16 code units or
 * code points. A column, a width or a padding count is, and so is a
 * `to_chars` offset handed to `charAt`.
 *
 * docs/plans/PLAN_STRING_INDEXING.md §3.3 has the rules and what the pass
 * cannot follow — provenance across a function boundary, which the source
 * marks with `@(units)`.
 *
 * This test is the reason the migration does not have to be done twice: a
 * new `strlen` used as a character count fails here rather than showing up
 * as a self-host diff months later.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

const ROOT = path.resolve(__dirname, "..");

function strictStrings(source: string): string {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "strict-strings-"));
  try {
    return execFileSync(
      process.execPath,
      [
        "dist/rgrc.js",
        "-es6",
        "-strict-strings",
        source,
        "-nodecli",
        `-d=${out}`,
        "-o=out.js",
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        env: {
          ...process.env,
          RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr",
        },
      },
    );
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}

describe("-strict-strings", () => {
  it("reports nothing on the compiler itself", () => {
    const stdout = strictStrings("./compiler/Compiler.rgr");

    const sites = stdout
      .split("\n")
      .filter((l) => l.startsWith("strict-strings ") && !l.startsWith("strict-strings note "));
    expect(sites, `new observable string index sites:\n${sites.join("\n")}`).toEqual([]);

    const summary = stdout.match(/^strict-strings: (\d+) of (\d+) /m);
    expect(summary, `no summary line in:\n${stdout.slice(-2000)}`).not.toBeNull();
    expect(Number(summary![1])).toBe(0);
    // ...and the pass is still looking at the whole compiler, rather than
    // reporting zero because it stopped walking.
    expect(Number(summary![2])).toBeGreaterThan(1000);
  }, 180_000);

  it("still catches a count of characters, and a code-point offset", () => {
    const fixture = path.join(ROOT, "tests/fixtures/strict_strings_bad.rgr");
    const stdout = strictStrings(fixture);
    const sites = stdout
      .split("\n")
      .filter((l) => l.startsWith("strict-strings ") && !l.startsWith("strict-strings note "));

    expect(sites.join("\n")).toMatch(/strlen\(text\) in Bad\.width .* count of characters/);
    expect(sites.join("\n")).toMatch(/charAt\(s\) in Bad\.mixed .* code-point offset/);
    // ...and does not report the scan next to them.
    expect(sites.join("\n")).not.toMatch(/Bad\.scan/);
  }, 120_000);
});
