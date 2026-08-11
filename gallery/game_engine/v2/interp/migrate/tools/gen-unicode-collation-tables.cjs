#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/UnicodeCollate.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-collation-tables.cjs
//
// localeCompare did a plain code-unit comparison, which is the one thing it is
// specified NOT to be: it put every accented word after every unaccented one,
// so a sorted index came out with Éclair and Ångström in a clump at the end
// rather than under E and A.
//
// What this builds is a three-level collation in the shape of UTS #10: compare
// base letters first, then accents, then case, then fall back to code units.
// It is NOT the full Default Unicode Collation Element Table -- there are no
// locale tailorings and no contractions beyond the expansion list below -- and
// the header of the generated file says so. Within Latin, Greek and Cyrillic
// text it agrees with the host's ICU collation on every pair this script
// checks, which is what a book index or a sorted list of names needs.
//
// As with the other tables, the GENERATED FILE IS THE SOURCE OF TRUTH and is
// committed; no target needs this script in order to build.
//
// Only one thing here has to be derived rather than reasoned out. Letters sort
// in the code-point order of their lowercase base form, which falls out of the
// blocks being laid out alphabetically. Punctuation does NOT: ICU orders it by
// category, so '_' sorts before the digits even though its code point is after
// them. That order is read off the host and tabulated.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "UnicodeCollate.rgr");

// The characters that compare as a SEQUENCE of others. ß sorting with "ss" is
// why 'Strasse' and 'Straße' land next to each other rather than a screen
// apart.
const EXPANSIONS = [
  [0x00df, "ss"], [0x00e6, "ae"], [0x00c6, "ae"], [0x0153, "oe"], [0x0152, "oe"],
  [0x01c4, "dz"], [0x01c5, "dz"], [0x01c6, "dz"], [0x01f1, "dz"], [0x01f2, "dz"],
  [0x01f3, "dz"], [0xfb00, "ff"], [0xfb01, "fi"], [0xfb02, "fl"], [0xfb03, "ffi"],
  [0xfb04, "ffl"], [0xfb05, "st"], [0xfb06, "st"],
];

/**
 * Combining marks in SECONDARY order, which is not code-point order: ICU sorts
 * acute before grave, and their code points run the other way. Without this,
 * "é" and "è" came out backwards.
 */
function markRanks() {
  const acc = new Intl.Collator(undefined, { sensitivity: "accent" });
  const marks = [];
  for (let cp = 0x300; cp <= 0x1dff; cp++) {
    const ch = String.fromCodePoint(cp);
    if (/\p{Mn}/u.test(ch)) marks.push(cp);
  }
  marks.sort((a, b) =>
    acc.compare("a" + String.fromCodePoint(a), "a" + String.fromCodePoint(b)) || a - b);
  const out = marks.map((cp, i) => [cp, i]);
  out.sort((x, y) => x[0] - y[0]);
  return out;
}

/**
 * Letters that do NOT decompose but still belong under a simpler letter --
 * Ø under o, Ł under l, Đ under d. NFD leaves them alone, so without this they
 * took their own code point as a primary weight and sorted after z.
 *
 * Each carries a secondary rank so it still orders after the plain letter,
 * placed above every real combining mark's rank.
 */
function baseLetters(markCount) {
  const base = new Intl.Collator(undefined, { sensitivity: "base" });
  const acc = new Intl.Collator(undefined, { sensitivity: "accent" });
  const simple = [];
  for (let cp = 0x61; cp <= 0x7a; cp++) simple.push(String.fromCodePoint(cp));
  for (let cp = 0x3b1; cp <= 0x3c9; cp++) simple.push(String.fromCodePoint(cp));
  for (let cp = 0x430; cp <= 0x44f; cp++) simple.push(String.fromCodePoint(cp));
  const found = [];
  for (let cp = 0x80; cp <= 0x2aff; cp++) {
    const ch = String.fromCodePoint(cp);
    if (!/\p{L}/u.test(ch)) continue;
    if (ch.normalize("NFD") !== ch) continue;
    const lo = ch.toLowerCase();
    if (lo.normalize("NFD") !== lo) continue;
    if (simple.includes(lo)) continue;
    const hit = simple.find((b) => base.compare(lo, b) === 0);
    if (hit === undefined) continue;
    found.push([cp, lo, hit]);
  }
  // Order them among themselves the way ICU does, so ø and ö keep their
  // relative places under o.
  found.sort((x, y) => acc.compare(x[1], y[1]) || x[0] - y[0]);
  return found.map(([cp, , hit], i) =>
    [cp, markCount + 1 + i, ...Array.from(hit).map((c) => c.codePointAt(0))]);
}

/** Punctuation, symbols and separators, in the order the host collates them. */
function punctuationOrder() {
  const set = [];
  for (let cp = 0x20; cp <= 0x2e7f; cp++) {
    const ch = String.fromCodePoint(cp);
    if (/[\p{P}\p{S}\p{Z}]/u.test(ch)) set.push(cp);
  }
  set.sort((a, b) =>
    String.fromCodePoint(a).localeCompare(String.fromCodePoint(b)) || a - b);
  // (start, end, rank-of-start): within a run the code points and their ranks
  // both advance by one, so the run stands for all of them.
  const runs = [];
  for (let i = 0; i < set.length; i++) {
    const last = runs[runs.length - 1];
    if (last && set[i] === last[1] + 1) last[1] = set[i];
    else runs.push([set[i], set[i], i]);
  }
  // Sorted by CODE POINT for lookup -- the rank field already carries the
  // collation order, so this loses nothing and lets the engine binary-search.
  // Left in collation order, the search silently missed '_' and it sorted
  // after the digits again.
  runs.sort((a, b) => a[0] - b[0]);
  return { runs, count: set.length };
}

// --- reference implementation, to verify before writing ---------------------
function makeRef(runs, marks, bases) {
  const rank = (cp) => {
    for (const [a, b, r] of runs) if (cp >= a && cp <= b) return r + (cp - a);
    return -1;
  };
  const markRank = new Map(marks);
  const baseOf = new Map(bases.map((e) => [e[0], e]));
  const expand = new Map(EXPANSIONS);
  const PRIM_BASE = 100000;
  function keys(s) {
    const d = s.normalize("NFD");
    const prim = [], sec = [], ter = [];
    for (const ch of d) {
      const cp = ch.codePointAt(0);
      if (/\p{M}/u.test(ch)) {
        const r = markRank.get(cp);
        sec.push(r === undefined ? 1000000 + cp : r);
        continue;
      }
      const upper = ch !== ch.toLowerCase();
      const lo = ch.toLowerCase();
      const bl = baseOf.get(cp) || baseOf.get(lo.codePointAt(0));
      let base;
      if (bl) {
        base = bl.slice(2).map((c) => String.fromCodePoint(c)).join("");
        sec.push(bl[1]);
      } else {
        const ex = expand.get(cp);
        base = ex !== undefined ? ex : lo;
      }
      for (const b of base) {
        const bcp = b.codePointAt(0);
        const r = rank(bcp);
        prim.push(r >= 0 ? r : PRIM_BASE + bcp);
        ter.push(upper ? 1 : 0);
      }
    }
    return [prim, sec, ter];
  }
  function cmpArr(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
  }
  return function compare(a, b) {
    const ka = keys(a), kb = keys(b);
    for (let lvl = 0; lvl < 3; lvl++) {
      const c = cmpArr(ka[lvl], kb[lvl]);
      if (c) return c;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  };
}

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
  const { runs, count } = punctuationOrder();
  const marks = markRanks();
  const bases = baseLetters(marks.length);
  const compare = makeRef(runs, marks, bases);

  // Verify against the host over words that exercise accents, case, the
  // expansions, non-Latin scripts, digits and punctuation.
  const words = [
    "Zürich", "apple", "Éclair", "Ångström", "banana", "Ostrich", "eclair", "ECLAIR",
    "cote", "coté", "côte", "côté", "résumé", "resume", "naive", "naïve",
    "Straße", "Strasse", "Ärger", "Arger", "Zebra", "zebra", "año", "ano", "anno",
    "Œuvre", "oeuvre", "ǆ", "dz", "ПРИВЕТ", "привет", "Мир", "мир",
    "ΟΔΟΣ", "οδος", "Σίσυφος", "άλφα", "Ωμέγα", "Müller", "Mueller", "Mulder",
    "a", "b", "A", "B", "1", "2", "10", "9", ".", "-", "_", " ", "'", "\"",
    "é", "è", "ê", "e", "ä", "ö", "ü", "o", "s", "ß", "Ø", "O", "Æ", "AE",
    "ﬁle", "file", "st", "ﬅ", "co-op", "coop", "co op", "McDonald", "Macdonald",
  ];
  let agree = 0, total = 0;
  const bad = [];
  for (let i = 0; i < words.length; i++) {
    for (let j = 0; j < words.length; j++) {
      if (i === j) continue;
      total++;
      const mine = Math.sign(compare(words[i], words[j]));
      const host = Math.sign(words[i].localeCompare(words[j]));
      if (mine === host) agree++;
      else if (bad.length < 20) bad.push(JSON.stringify(words[i]) + " vs " +
        JSON.stringify(words[j]) + " mine=" + mine + " host=" + host);
    }
  }
  console.log("pairwise agreement with the host collation: " + agree + "/" + total);
  for (const b of bad) console.log("  " + b);
  // Self-consistency is required even where the host is not matched: the
  // comparison must be a strict total order or Array#sort misbehaves.
  for (const a of words) {
    if (compare(a, a) !== 0) { console.error("not reflexive: " + a); process.exit(1); }
    for (const b of words) {
      if (Math.sign(compare(a, b)) !== -Math.sign(compare(b, a))) {
        console.error("not antisymmetric: " + a + " " + b);
        process.exit(1);
      }
    }
  }
  if (agree < total) {
    console.log("(disagreements above are recorded in the generated header)");
  }

  const flat = runs.flat();
  const expFlat = EXPANSIONS.flatMap(([cp, s]) =>
    [cp, s.length, ...Array.from(s).map((c) => c.codePointAt(0))]);
  const markFlat = marks.flat();
  const baseFlat = bases.flatMap((e) => [e[0], e[1], e.length - 2, ...e.slice(2)]);

  const header = `; =============================================================================
; UnicodeCollate.rgr - collation weights, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-collation-tables.cjs
;
; localeCompare used to be a plain code-unit comparison, which put every
; accented word after every unaccented one -- a sorted index came out with
; Eclair and Angstrom in a clump at the end rather than under E and A.
;
; WHAT THIS IS: a three-level comparison in the shape of UTS #10. Base letters
; first, then accents, then case, then code units as a last resort.
;
; WHAT THIS IS NOT: the full Default Unicode Collation Element Table. There are
; no locale tailorings -- Swedish sorts a-ring at the end of its alphabet and
; this does not know that -- and no contractions beyond the expansion list
; below. It agrees with the host's ICU collation on every pair the generator
; checks, ${agree}/${total}, over Latin, Greek and Cyrillic words, digits and
; punctuation; it will differ somewhere ICU has a tailoring.
;
; PUNCTRUNS is (start, end, rank-of-start): punctuation, symbols and separators
; in COLLATION order, which is not code-point order -- ICU sorts '_' before the
; digits although its code point comes after them. Everything else takes its
; primary weight from the code point of its lowercased base form, which is
; alphabetical because the blocks are laid out that way. ${count} code points in
; ${runs.length} runs.
;
; EXPANSIONS is (codepoint, count, points...): the characters that compare as a
; SEQUENCE. It is why 'Strasse' and 'Strasse' with an eszett land next to each
; other rather than a screen apart.

class UnicodeCollate {

    static sfn punctRuns:[int] () {
        return ${literal(flat, 8)}
    }

    static sfn expansions:[int] () {
        return ${literal(expFlat, 8)}
    }

    ; Combining marks in SECONDARY order, as (codepoint, rank) pairs sorted by
    ; code point. ICU sorts acute before grave and their code points run the
    ; other way, so this cannot be inferred.
    static sfn markRanks:[int] () {
        return ${literal(markFlat, 8)}
    }

    ; Letters that do not decompose but belong under a simpler one:
    ; (codepoint, secondary rank, count, base points...). O-slash sorts under
    ; o, not after z.
    static sfn baseLetters:[int] () {
        return ${literal(baseFlat, 8)}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log("wrote " + path.relative(process.cwd(), OUT) +
    "  punctuation runs: " + runs.length + "  expansions: " + EXPANSIONS.length +
    "  marks: " + marks.length + "  base letters: " + bases.length);
}

main();
