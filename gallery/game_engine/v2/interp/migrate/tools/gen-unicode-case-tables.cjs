#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/UnicodeCase.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-case-tables.cjs
//
// The engine cannot borrow the host language's case conversion: es6 and Rust
// apply the Unicode rules, C++ toupper is ASCII-only, and a guest program must
// not get a different answer depending on which build it is running in. So the
// mapping lives in the engine, and the mapping is DATA -- ß uppercases to two
// letters, ﬁ to three, and the Latin/Greek/Cyrillic blocks each shift by their
// own amount.
//
// This script writes that data out as ordinary Ranger array literals. The
// GENERATED FILE IS THE SOURCE OF TRUTH and is committed; nothing reads these
// tables at build time and no target needs this script to compile. It exists so
// the tables can be regenerated and audited rather than hand-maintained, and so
// a reviewer can see exactly where every number came from.
//
// Where the numbers come from: the two source files of the Unicode Character
// Database that define case conversion --
//
//   UnicodeData.txt   fields 12/13 (simple uppercase / lowercase mapping)
//   SpecialCasing.txt the unconditional multi-character mappings
//
// Pass --ucd=<dir> to read them directly. With no --ucd the script falls back
// to querying the host JavaScript engine's own toUpperCase/toLowerCase, which
// implements exactly those two files; the fallback is a convenience, and
// --verify checks the two against each other when both are available.
//
// Either way the output is checked: every one of the 1.1M code points is
// round-tripped through the emitted tables and compared against the host's
// answer before the file is written.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "UnicodeCase.rgr");
const MAX_CP = 0x10ffff;

const args = process.argv.slice(2);
const ucdDir = (args.find((a) => a.startsWith("--ucd=")) || "").slice(6);

/** Case mappings read from the UCD text files, when a directory was given. */
function fromUcd(dir) {
  const simple = { up: new Map(), lo: new Map() };
  const data = fs.readFileSync(path.join(dir, "UnicodeData.txt"), "utf8");
  for (const line of data.split("\n")) {
    if (!line) continue;
    const f = line.split(";");
    const cp = parseInt(f[0], 16);
    if (f[12]) simple.up.set(cp, [parseInt(f[12], 16)]);
    if (f[13]) simple.lo.set(cp, [parseInt(f[13], 16)]);
  }
  const spec = fs.readFileSync(path.join(dir, "SpecialCasing.txt"), "utf8");
  for (const raw of spec.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const f = line.split(";").map((x) => x.trim());
    // A fifth field is a CONDITION (language or context sensitive). Those are
    // not part of the language-independent mapping; Final_Sigma is the one
    // context rule the engine implements, and it is implemented as a rule
    // rather than a table entry.
    if (f.length > 4 && f[4]) continue;
    const cp = parseInt(f[0], 16);
    const lower = f[1] ? f[1].split(/\s+/).map((h) => parseInt(h, 16)) : [];
    const upper = f[3] ? f[3].split(/\s+/).map((h) => parseInt(h, 16)) : [];
    if (upper.length) simple.up.set(cp, upper);
    if (lower.length) simple.lo.set(cp, lower);
  }
  return simple;
}

/** The same mappings, asked of the host engine one code point at a time. */
function fromHost() {
  const up = new Map();
  const lo = new Map();
  for (let cp = 0; cp <= MAX_CP; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const s = String.fromCodePoint(cp);
    const u = s.toUpperCase();
    const l = s.toLowerCase();
    if (u !== s) up.set(cp, Array.from(u).map((c) => c.codePointAt(0)));
    if (l !== s) lo.set(cp, Array.from(l).map((c) => c.codePointAt(0)));
  }
  return { up, lo };
}

/**
 * Split a mapping table into single-code-point deltas (compressed into runs)
 * and multi-code-point replacements (listed).
 *
 * Most of Unicode cases in blocks that shift by a constant -- Cyrillic by 32 --
 * or in alternating pairs, where every even code point maps to the odd one
 * after it. A run is (start, end, step, delta) and 1478 mappings become 198.
 */
function compress(map) {
  const single = [];
  const multi = [];
  for (const cp of [...map.keys()].sort((a, b) => a - b)) {
    const pts = map.get(cp);
    if (pts.length === 1) single.push([cp, pts[0] - cp]);
    else multi.push([cp, pts]);
  }
  const runs = [];
  let i = 0;
  while (i < single.length) {
    const [cp0, d0] = single[i];
    let best = null;
    for (const step of [1, 2]) {
      let j = i;
      let last = cp0;
      while (
        j + 1 < single.length &&
        single[j + 1][0] === last + step &&
        single[j + 1][1] === d0
      ) {
        j++;
        last = single[j][0];
      }
      const count = j - i + 1;
      if (!best || count > best.count) best = { step, j, last, count };
    }
    runs.push([cp0, best.last, best.step, d0]);
    i = best.j + 1;
  }
  return { runs, multi, singles: single.length };
}

/** Inclusive (start, end) ranges over which a predicate holds. */
function propRanges(re) {
  const out = [];
  let start = -1;
  for (let cp = 0; cp <= MAX_CP; cp++) {
    const skip = cp >= 0xd800 && cp <= 0xdfff;
    const hit = !skip && re.test(String.fromCodePoint(cp));
    if (hit && start < 0) start = cp;
    else if (!hit && start >= 0) {
      out.push([start, cp - 1]);
      start = -1;
    }
  }
  if (start >= 0) out.push([start, MAX_CP]);
  return out;
}

// --- lookup against the compressed form, used to verify before writing -------
function runDelta(runs, cp) {
  for (const [a, b, step, d] of runs) {
    if (cp >= a && cp <= b && (cp - a) % step === 0) return d;
  }
  return 0;
}
function multiFor(multi, cp) {
  for (const [c, pts] of multi) if (c === cp) return pts;
  return null;
}
function inRanges(ranges, cp) {
  for (const [a, b] of ranges) if (cp >= a && cp <= b) return true;
  return false;
}

function convert(str, upper, T) {
  const cps = Array.from(str).map((c) => c.codePointAt(0));
  let out = "";
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (!upper && cp === 0x03a3) {
      let before = false;
      for (let j = i - 1; j >= 0; j--) {
        if (inRanges(T.ign, cps[j])) continue;
        before = inRanges(T.cased, cps[j]);
        break;
      }
      let after = false;
      for (let j = i + 1; j < cps.length; j++) {
        if (inRanges(T.ign, cps[j])) continue;
        after = inRanges(T.cased, cps[j]);
        break;
      }
      out += String.fromCodePoint(before && !after ? 0x03c2 : 0x03c3);
      continue;
    }
    const m = multiFor(upper ? T.up.multi : T.lo.multi, cp);
    if (m) {
      out += m.map((c) => String.fromCodePoint(c)).join("");
      continue;
    }
    const d = runDelta(upper ? T.up.runs : T.lo.runs, cp);
    out += String.fromCodePoint(cp + d);
  }
  return out;
}

// --- emit --------------------------------------------------------------------
/** A Ranger `([] ...)` literal, wrapped so no line runs off the screen. */
function literal(nums, indent) {
  const pad = " ".repeat(indent);
  const parts = [];
  let line = "";
  for (const n of nums) {
    const t = String(n);
    if (line.length + t.length + 1 > 92) {
      parts.push(line);
      line = "";
    }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return "([] _:int ())";
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

function main() {
  const host = fromHost();
  let src = host;
  if (ucdDir) {
    src = fromUcd(ucdDir);
    let diff = 0;
    for (const which of ["up", "lo"]) {
      const a = src[which];
      const b = host[which];
      const keys = new Set([...a.keys(), ...b.keys()]);
      for (const k of keys) {
        const x = (a.get(k) || []).join(",");
        const y = (b.get(k) || []).join(",");
        if (x !== y) diff++;
      }
    }
    console.log(
      diff
        ? "WARNING: UCD and host disagree on " + diff + " mappings (UCD wins)"
        : "UCD and host agree on every mapping"
    );
  }

  const up = compress(src.up);
  const lo = compress(src.lo);
  const cased = propRanges(/\p{Cased}/u);
  const ign = propRanges(/\p{Case_Ignorable}/u);
  const T = { up, lo, cased, ign };

  // Verify before writing: the emitted tables must reproduce the host's answer
  // for every code point, and for the strings that exercise the special rules.
  let bad = 0;
  const samples = [
    "café société", "Straße", "Grüße", "ΟΔΟΣ", "Σίσυφος", "ΑΣ", "aΣb", "aΣ", "Σa",
    "İstanbul", "IŞIK", "ПРИВЕТ", "ąćęłńóśźż", "Ærø", "ﬁt", "ǆǅǄ", "ŉ", "ẞ", "𐐷", "𐐏",
  ];
  for (const s of samples) {
    for (const upper of [true, false]) {
      const mine = convert(s, upper, T);
      const want = upper ? s.toUpperCase() : s.toLowerCase();
      if (mine !== want) {
        bad++;
        console.error("MISMATCH " + JSON.stringify(s) + " " + (upper ? "U" : "L"));
      }
    }
  }
  for (let cp = 0; cp <= MAX_CP; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const s = String.fromCodePoint(cp);
    for (const upper of [true, false]) {
      const mine = convert(s, upper, T);
      const want = upper ? s.toUpperCase() : s.toLowerCase();
      if (mine !== want) {
        bad++;
        if (bad < 10) {
          console.error(
            "MISMATCH U+" + cp.toString(16) + " " + (upper ? "U" : "L") +
            " got " + JSON.stringify(mine) + " want " + JSON.stringify(want)
          );
        }
      }
    }
  }
  if (bad) {
    console.error("refusing to write: " + bad + " mismatches");
    process.exit(1);
  }

  const flatRuns = (r) => r.flat();
  const flatMulti = (m) => m.flatMap(([cp, pts]) => [cp, pts.length, ...pts]);
  const flatRanges = (r) => r.flat();

  const header = `; =============================================================================
; UnicodeCase.rgr - the case-mapping tables, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-case-tables.cjs
;
; and see that script for where every number comes from (UnicodeData.txt fields
; 12/13 and the unconditional entries of SpecialCasing.txt). The generator
; verifies the emitted tables against all 1.1M code points before writing, so a
; table that does not reproduce the standard never reaches this file.
;
; The engine carries these rather than calling the host language's case
; conversion because the hosts disagree: es6 and Rust apply the Unicode rules,
; C++ toupper is ASCII-only. A guest program must not get 'CAFé' on one build
; and 'CAFÉ' on another.
;
; RUNS are quads (start, end, step, delta). Most of Unicode cases in blocks
; that shift by a constant -- Cyrillic by 32 -- or in alternating pairs, where
; every even code point maps to the odd one after it, which is step 2. ${up.singles}
; individual uppercase mappings compress to ${up.runs.length} runs.
;
; MULTI entries are (codepoint, count, points...) laid end to end: the mappings
; that are not one-to-one. ß -> SS is why 'Straße'.toUpperCase().length is 7.
;
; CASED and IGNORABLE are inclusive (start, end) pairs, used for one thing: the
; Final_Sigma condition, which lowercases Greek capital sigma to the final form
; ς when it ends a word and to σ otherwise.

class UnicodeCase {

    ; Uppercase mappings, one code point to one.
    static sfn upperRuns:[int] () {
        return ${literal(flatRuns(up.runs), 8)}
    }

    ; Uppercase mappings, one code point to several.
    static sfn upperMulti:[int] () {
        return ${literal(flatMulti(up.multi), 8)}
    }

    ; Lowercase mappings, one code point to one.
    static sfn lowerRuns:[int] () {
        return ${literal(flatRuns(lo.runs), 8)}
    }

    ; Lowercase mappings, one code point to several.
    static sfn lowerMulti:[int] () {
        return ${literal(flatMulti(lo.multi), 8)}
    }

    ; Unicode property Cased.
    static sfn casedRanges:[int] () {
        return ${literal(flatRanges(cased), 8)}
    }

    ; Unicode property Case_Ignorable.
    static sfn ignorableRanges:[int] () {
        return ${literal(flatRanges(ign), 8)}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log(
    "wrote " + path.relative(process.cwd(), OUT) +
    "  upper: " + up.runs.length + " runs / " + up.multi.length + " multi" +
    "  lower: " + lo.runs.length + " runs / " + lo.multi.length + " multi" +
    "  cased: " + cased.length + "  ignorable: " + ign.length
  );
}

main();
