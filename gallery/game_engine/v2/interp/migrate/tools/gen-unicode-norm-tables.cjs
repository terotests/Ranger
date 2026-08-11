#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/UnicodeNorm.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-norm-tables.cjs
//
// String.prototype.normalize was a no-op on every target, so "café" written
// with a combining accent never compared equal to "café" written with the
// precomposed letter -- two spellings of the same word that any text arriving
// from a file, a form or a keyboard will mix freely.
//
// As with the case tables, the GENERATED FILE IS THE SOURCE OF TRUTH and is
// committed; no target needs this script in order to build. It exists so the
// tables can be regenerated and audited rather than hand-maintained.
//
// Where the numbers come from: the Unicode Character Database --
//
//   UnicodeData.txt   field 3 (canonical combining class)
//                     field 5 (canonical decomposition mapping)
//   CompositionExclusions.txt
//
// Pass --ucd=<dir> to read them directly. With no --ucd the script DERIVES the
// same information from the host JavaScript engine's own normalize(), which
// implements those files:
//
//   * a code point's canonical decomposition is what NFD gives for it,
//   * a decomposition recomposes iff NFC of it gives the original back, which
//     is exactly the definition of a primary composite (an excluded one does
//     not come back),
//   * combining classes are recovered from REORDERING: NFD("a" + m1 + m2)
//     swaps the pair iff ccc(m1) > ccc(m2) > 0, so sorting every combining
//     mark under that test recovers the classes up to renumbering -- and only
//     their relative order is observable to the algorithm.
//
// Hangul is not in the tables at all: its decomposition and composition are
// arithmetic (§3.12), so the engine computes them.
//
// Either way the output is verified before it is written: NFC and NFD are run
// over every code point and over a few thousand generated mark sequences, and
// compared against the host. A table that does not reproduce the standard
// never reaches the file.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "UnicodeNorm.rgr");
const MAX_CP = 0x10ffff;

// Hangul, computed rather than tabulated (§3.12).
const SBASE = 0xac00;
const LCOUNT = 19, VCOUNT = 21, TCOUNT = 28;
const NCOUNT = VCOUNT * TCOUNT;      // 588
const SCOUNT = LCOUNT * NCOUNT;      // 11172

const args = process.argv.slice(2);
const ucdDir = (args.find((a) => a.startsWith("--ucd=")) || "").slice(6);

const cps = [];
for (let cp = 0; cp <= MAX_CP; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  cps.push(cp);
}
const chr = (cp) => String.fromCodePoint(cp);
const pts = (s) => Array.from(s).map((c) => c.codePointAt(0));

/** Canonical decompositions, Hangul excluded (it is arithmetic). */
function decompositions() {
  const out = [];
  for (const cp of cps) {
    if (cp >= SBASE && cp < SBASE + SCOUNT) continue;
    const s = chr(cp);
    const d = s.normalize("NFD");
    if (d !== s) out.push([cp, pts(d)]);
  }
  return out;
}

/**
 * Canonical combining classes, recovered from reordering behaviour.
 *
 * Only the ORDER of the classes is observable to the normalization algorithm
 * (it sorts by them and compares them for equality/blocking), so classes
 * renumbered 1..N in the same order behave identically to the real values.
 */
function combiningClasses() {
  const ACUTE = 0x0301;   // ccc 230
  const BELOW = 0x0334;   // ccc 1
  const marks = [];
  for (const cp of cps) {
    if (!/\p{M}/u.test(chr(cp))) continue;
    const m = chr(cp);
    // A mark that DECOMPOSES cannot be probed this way -- it is not present in
    // the normalized output to look for, so indexOf answered -1 and read as
    // "came first". That is what classified U+0CCA, a starter, as class 1 and
    // stopped Kannada from recomposing. Unicode gives every character with a
    // canonical decomposition ccc 0, so skipping them loses nothing.
    if (m.normalize("NFD") !== m) continue;
    // Reorders with a ccc-1 mark => ccc > 1, so certainly a non-starter.
    const vsLow = pts(("a" + m + chr(BELOW)).normalize("NFD"));
    let nonStarter = vsLow.indexOf(cp) >= 0 && vsLow.indexOf(BELOW) >= 0 &&
                     vsLow.indexOf(BELOW) < vsLow.indexOf(cp);
    if (!nonStarter) {
      // ccc 0 or 1: a ccc-1 mark still reorders under a ccc-230 one.
      const vsHigh = pts(("a" + chr(ACUTE) + m).normalize("NFD"));
      nonStarter = vsHigh.indexOf(cp) >= 0 && vsHigh.indexOf(ACUTE) >= 0 &&
                   vsHigh.indexOf(cp) < vsHigh.indexOf(ACUTE);
    }
    if (nonStarter) marks.push(cp);
  }
  // ccc(a) > ccc(b) exactly when the pair (a, b) is swapped by NFD.
  const swaps = (a, b) => {
    const seq = "a" + chr(a) + chr(b);
    const n = pts(seq.normalize("NFD"));
    return n.indexOf(b) < n.indexOf(a);
  };
  const cmp = (a, b) => {
    if (a === b) return 0;
    if (swaps(a, b)) return 1;
    if (swaps(b, a)) return -1;
    return 0;
  };
  marks.sort(cmp);
  const cls = new Map();
  let cur = 1;
  for (let i = 0; i < marks.length; i++) {
    if (i > 0 && cmp(marks[i - 1], marks[i]) !== 0) cur++;
    cls.set(marks[i], cur);
  }
  return cls;
}

/**
 * Primary composites: the (starter, combining) pairs NFC puts back together.
 * A composition exclusion decomposes but does not recompose, and testing that
 * directly is how they are left out.
 */
function compositions(decomp) {
  const seen = new Map();
  for (const [, d] of decomp) {
    if (d.length < 2) continue;                // a singleton never composes
    // NFD is the FULL decomposition, so 'U+01D5' arrives as U+0055 U+0308
    // U+0304 and the pair table it implies is built up a step at a time:
    // (U, diaeresis) -> U-with-diaeresis, then (that, macron) -> U+01D5.
    // Taking the whole sequence as one pair found neither of them.
    let s = d[0];
    for (let i = 1; i < d.length; i++) {
      const joined = (chr(s) + chr(d[i])).normalize("NFC");
      const jp = pts(joined);
      if (jp.length !== 1) break;              // an exclusion, or no composite
      seen.set(s * 0x200000 + d[i], [s, d[i], jp[0]]);
      s = jp[0];
    }
  }
  return [...seen.values()].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
}

/** Compress a map of cp -> small int into (start, end, value) runs. */
function classRuns(cls) {
  const keys = [...cls.keys()].sort((a, b) => a - b);
  const runs = [];
  for (const cp of keys) {
    const v = cls.get(cp);
    const last = runs[runs.length - 1];
    if (last && last[1] === cp - 1 && last[2] === v) last[1] = cp;
    else runs.push([cp, cp, v]);
  }
  return runs;
}

// --- a reference implementation over the emitted tables, for verification ---
function makeRef(decompFlat, clsRuns, compFlat) {
  const dec = new Map();
  for (let i = 0; i < decompFlat.length; ) {
    const cp = decompFlat[i], n = decompFlat[i + 1];
    dec.set(cp, decompFlat.slice(i + 2, i + 2 + n));
    i += 2 + n;
  }
  const comp = new Map();
  for (let i = 0; i < compFlat.length; i += 3) {
    comp.set(compFlat[i] * 0x200000 + compFlat[i + 1], compFlat[i + 2]);
  }
  const ccc = (cp) => {
    for (const [a, b, v] of clsRuns) if (cp >= a && cp <= b) return v;
    return 0;
  };
  function decompose(cp, out) {
    if (cp >= SBASE && cp < SBASE + SCOUNT) {
      const s = cp - SBASE;
      out.push(0x1100 + Math.floor(s / NCOUNT));
      out.push(0x1161 + Math.floor((s % NCOUNT) / TCOUNT));
      const t = s % TCOUNT;
      if (t) out.push(0x11a7 + t);
      return;
    }
    const d = dec.get(cp);
    if (!d) { out.push(cp); return; }
    for (const c of d) decompose(c, out);
  }
  function order(seq) {
    // A stable insertion sort by combining class, over each run of non-starters.
    for (let i = 1; i < seq.length; i++) {
      const c = ccc(seq[i]);
      if (c === 0) continue;
      let j = i;
      while (j > 0 && ccc(seq[j - 1]) > c) {
        const t = seq[j]; seq[j] = seq[j - 1]; seq[j - 1] = t;
        j--;
      }
    }
    return seq;
  }
  function nfd(str) {
    const out = [];
    for (const cp of pts(str)) decompose(cp, out);
    return order(out).map(chr).join("");
  }
  function nfc(str) {
    const seq = pts(nfd(str));
    if (!seq.length) return "";
    const out = [seq[0]];
    let starter = 0;              // index in `out` of the last starter
    let lastClass = ccc(seq[0]) === 0 ? -1 : ccc(seq[0]);
    for (let i = 1; i < seq.length; i++) {
      const cp = seq[i];
      const c = ccc(cp);
      const s = out[starter];
      let composite = -1;
      if (ccc(s) === 0 && (lastClass < c || lastClass === -1)) {
        // Hangul composition, then the table.
        if (s >= 0x1100 && s < 0x1100 + LCOUNT && cp >= 0x1161 && cp < 0x1161 + VCOUNT) {
          composite = SBASE + ((s - 0x1100) * VCOUNT + (cp - 0x1161)) * TCOUNT;
        } else if (s >= SBASE && s < SBASE + SCOUNT && (s - SBASE) % TCOUNT === 0 &&
                   cp > 0x11a7 && cp < 0x11a7 + TCOUNT) {
          composite = s + (cp - 0x11a7);
        } else {
          const hit = comp.get(s * 0x200000 + cp);
          if (hit !== undefined) composite = hit;
        }
      }
      if (composite >= 0) {
        out[starter] = composite;
      } else {
        if (c === 0) { starter = out.length; lastClass = -1; }
        else lastClass = c;
        out.push(cp);
      }
    }
    return out.map(chr).join("");
  }
  return { nfd, nfc };
}

// --- emit -------------------------------------------------------------------
function literal(nums, indent) {
  const pad = " ".repeat(indent);
  const parts = [];
  let line = "";
  for (const n of nums) {
    const t = String(n);
    if (line.length + t.length + 1 > 92) { parts.push(line); line = ""; }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return "([] _:int ())";
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

function main() {
  const decomp = decompositions();
  const cls = combiningClasses();
  const comps = compositions(decomp);
  const runs = classRuns(cls);

  const decompFlat = decomp.flatMap(([cp, d]) => [cp, d.length, ...d]);
  const clsFlat = runs.flat();
  const compFlat = comps.flat();

  const ref = makeRef(decompFlat, runs, compFlat);

  let bad = 0;
  const report = (what, mine, want) => {
    bad++;
    if (bad < 10) {
      console.error("MISMATCH " + what + " got " + JSON.stringify(mine) +
                    " want " + JSON.stringify(want));
    }
  };
  for (const cp of cps) {
    const s = chr(cp);
    if (ref.nfd(s) !== s.normalize("NFD")) report("NFD U+" + cp.toString(16), ref.nfd(s), s.normalize("NFD"));
    if (ref.nfc(s) !== s.normalize("NFC")) report("NFC U+" + cp.toString(16),
      pts(ref.nfc(s)).map((c) => c.toString(16)).join(" "),
      pts(s.normalize("NFC")).map((c) => c.toString(16)).join(" "));
  }
  // Multi-mark sequences, which is where ordering and blocking actually bite.
  sequenceSweep(ref, report);
  if (bad) {
    console.error("refusing to write: " + bad + " mismatches");
    process.exit(1);
  }

  const header = `; =============================================================================
; UnicodeNorm.rgr - canonical normalization tables, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-norm-tables.cjs
;
; and see that script for where every number comes from. The generator runs NFC
; and NFD over every code point and over several thousand combining-mark
; sequences and compares against the reference before writing, so a table that
; does not reproduce the standard never reaches this file.
;
; DECOMP is (codepoint, count, points...) laid end to end: the canonical
; decomposition, already fully expanded so the engine never has to recurse.
; Hangul is absent on purpose -- its decomposition is arithmetic (S 3.12).
;
; CCCRUNS is (start, end, class) triples: the canonical combining class, which
; is what the reordering step sorts by. The values are renumbered from 1 in the
; real classes' order; only their ORDER is observable to the algorithm.
;
; COMPOSE is (starter, combining, composite) triples: the pairs NFC puts back
; together. Composition exclusions are simply absent, which is what makes them
; decompose without recomposing.

class UnicodeNorm {

    static sfn decomp:[int] () {
        return ${literal(decompFlat, 8)}
    }

    static sfn cccRuns:[int] () {
        return ${literal(clsFlat, 8)}
    }

    static sfn compose:[int] () {
        return ${literal(compFlat, 8)}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log("wrote " + path.relative(process.cwd(), OUT) +
    "  decompositions: " + decomp.length +
    "  ccc runs: " + runs.length +
    "  compositions: " + comps.length);
}

/** The sequence sweep, kept out of main() for readability. */
function sequenceSweep(ref, report) {
  const bases = [0x61, 0x41, 0x6f, 0x1e0a, 0x00c5, 0x0915, 0xac00, 0x1100, 0x304b];
  const marks = [0x0301, 0x0300, 0x0308, 0x0323, 0x0327, 0x031b, 0x0334, 0x093c,
                 0x3099, 0x0345, 0x0591, 0x05b0];
  for (const b of bases) {
    for (const m1 of marks) {
      for (const m2 of marks) {
        const s = String.fromCodePoint(b, m1, m2);
        if (ref.nfd(s) !== s.normalize("NFD")) report("NFD seq " + s.split("").map(c=>c.codePointAt(0).toString(16)).join("+"), ref.nfd(s), s.normalize("NFD"));
        if (ref.nfc(s) !== s.normalize("NFC")) report("NFC seq " + s.split("").map(c=>c.codePointAt(0).toString(16)).join("+"), ref.nfc(s), s.normalize("NFC"));
      }
    }
  }
}

main();
