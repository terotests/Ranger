import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), "..");

/**
 * Operator matching is target-aware: an operator whose `templates {}` block has
 * no entry for the active target, and no `*` fallback, does not report a
 * missing template. It fails to match, and the error names the argument types
 * at whatever line happens to use it -- often inside the compiler's own
 * JSON.rgr rather than in user code:
 *
 *     [FAIL] Could not match argument types for getValue
 *
 * That is how @serialize(true) shipped broken for swift6 in 3.2.0 while
 * working on es6 and kotlin. This test makes the gap visible at the source
 * instead of at a user's build.
 */
const OPERATOR_FILES = [
  "compiler/Lang.rgr",
  "lib/stdlib.rgr",
  "lib/stdops.rgr",
  "lib/JSON.rgr",
];

const KNOWN_LANGS = new Set([
  "es6", "es5", "ts", "flow", "ranger", "java7", "kotlin", "go", "php",
  "swift3", "swift6", "python", "rust", "cpp", "csharp", "scala", "llvm",
  "nim", "*",
]);

interface Block {
  file: string;
  line: number;
  owner: string;
  langs: Set<string>;
}

function parseTemplateBlocks(file: string): Block[] {
  const src = fs.readFileSync(path.join(ROOT_DIR, file), "utf8").split(/\r?\n/);
  const blocks: Block[] = [];

  for (let i = 0; i < src.length; i++) {
    if (!/\btemplates\s*\{/.test(src[i])) continue;

    let depth =
      (src[i].match(/\{/g)?.length ?? 0) - (src[i].match(/\}/g)?.length ?? 0);
    const langs = new Set<string>();
    let j = i + 1;

    while (j < src.length && depth > 0) {
      depth +=
        (src[j].match(/\{/g)?.length ?? 0) - (src[j].match(/\}/g)?.length ?? 0);
      const m = /^\s*([a-z0-9]+|\*)\s*[(.]/.exec(src[j]);
      if (m && KNOWN_LANGS.has(m[1])) langs.add(m[1]);
      j++;
    }

    let k = i - 1;
    while (k > 0 && !src[k].trim()) k--;
    blocks.push({ file, line: i + 1, owner: src[k].trim().slice(0, 70), langs });
    i = j - 1;
  }

  return blocks;
}

const allBlocks = OPERATOR_FILES.flatMap(parseTemplateBlocks);

describe("operator target coverage", () => {
  it("parses the operator files", () => {
    expect(allBlocks.length).toBeGreaterThan(100);
  });

  // swift3 and swift6 are the same language. Where an operator declares one
  // and not the other, it is nearly always an oversight rather than a genuine
  // Swift 3 -> 6 difference: 86 operators declare identical templates for both,
  // and the ones that differ do so only for real API changes (.characters,
  // UnicodeScalar, Data(bytes:)).
  it("declares swift6 wherever it declares swift3", () => {
    const gaps = allBlocks.filter(
      (b) => b.langs.has("swift3") && !b.langs.has("swift6") && !b.langs.has("*")
    );

    expect(
      gaps.map((g) => `${g.file}:${g.line} ${g.owner}`).join("\n"),
      "operators with a swift3 template but no swift6 one and no * fallback"
    ).toBe("");
  });

  // Deliberately one-directional. swift6 is a primary target and swift3 is
  // legacy, so a newer operator existing only on swift6 (the buffer_* family,
  // for instance) is correct, not a gap. Only the reverse -- the primary
  // target lagging the legacy one -- is a defect.


  // No static "does this macro name itself" check lives here, deliberately.
  // `if ... else` and `if!` are macros whose templates emit `if` -- they lower
  // to the three-argument `if`, which is not a macro, so they terminate. Self
  // naming is therefore legal and such a check would be false-positive by
  // design. Recursion is caught exactly, at compile time, by the active-macro
  // map in ng_parser_std_match2.rgr; see tests/macro-recursion.test.ts.

  // A template that emits a literal false / an empty string / a "not
  // implemented" comment compiles and then silently does the wrong thing at
  // runtime. create_dir for swift3 was an empty template, so every Swift 3
  // build silently skipped directory creation. Failing to compile is better.
  it("has no silent not-implemented fallbacks", () => {
    const offenders: string[] = [];

    for (const file of OPERATOR_FILES) {
      const src = fs
        .readFileSync(path.join(ROOT_DIR, file), "utf8")
        .split(/\r?\n/);
      src.forEach((line, idx) => {
        const m = /^\s*([a-z0-9]+|\*)\s*\(([^)]*)\)/.exec(line);
        if (!m || !KNOWN_LANGS.has(m[1])) return;
        if (/not implemented/i.test(line)) {
          offenders.push(`${file}:${idx + 1} ${line.trim().slice(0, 80)}`);
        }
      });
    }

    // Documented, pre-existing inventory, kept as a ratchet so the list can
    // only shrink. Each entry compiles to a wrong value instead of an error:
    // dir_exists/create_dir/write_file for csharp+scala, plus the `*` fallbacks
    // across the http_* and terminal families. Converting them to hard errors
    // is a behaviour change per target, tracked in PLAN_OPERATORS.md §3 rather
    // than done here. The number may only go down.
    const ALLOWED = 30;
    expect(
      offenders.length,
      `silent "not implemented" templates:\n${offenders.join("\n")}`
    ).toBeLessThanOrEqual(ALLOWED);
  });
});
