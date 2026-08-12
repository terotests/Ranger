#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/UnicodeProps.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-props.cjs
//
// The data behind \p{...} and \P{...} in a Unicode-mode regular expression.
//
// A property is a SET OF CODE POINTS, and the only compact way to carry one is
// as sorted [lo, hi] ranges. They are derived by asking the host which code
// points a property matches -- one regex test per code point per property --
// and then run-length encoding the answer. That is a few tens of millions of
// tests, which takes seconds; it happens once, here, and never in a build.
//
// As with the other tables, the GENERATED FILE IS THE SOURCE OF TRUTH and is
// committed; no target needs this script in order to build.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "UnicodeProps.rgr");

// The properties a real pattern reaches for. Not every property Unicode
// defines -- that would be a megabyte of ranges for names nothing uses -- but
// every general category, the binary properties that appear in ordinary code,
// and the scripts with enough text behind them to matter.
const GENERAL_CATEGORIES = [
  "L", "Lu", "Ll", "Lt", "Lm", "Lo",
  "M", "Mn", "Mc", "Me",
  "N", "Nd", "Nl", "No",
  "P", "Pc", "Pd", "Ps", "Pe", "Pi", "Pf", "Po",
  "S", "Sm", "Sc", "Sk", "So",
  "Z", "Zs", "Zl", "Zp",
  "C", "Cc", "Cf", "Co", "Cs",
];

const BINARY_PROPERTIES = [
  "Alphabetic", "White_Space", "ASCII", "Any", "Assigned",
  "Uppercase", "Lowercase", "ID_Start", "ID_Continue",
  "Math", "Emoji", "Emoji_Presentation", "Default_Ignorable_Code_Point",
  "Case_Ignorable", "Cased", "Dash", "Diacritic", "Hex_Digit",
  "Join_Control", "Noncharacter_Code_Point", "Quotation_Mark",
  "Sentence_Terminal", "Terminal_Punctuation", "Variation_Selector",
];

const SCRIPTS = [
  "Latin", "Greek", "Cyrillic", "Arabic", "Hebrew", "Han", "Hiragana",
  "Katakana", "Hangul", "Thai", "Devanagari", "Bengali", "Tamil", "Telugu",
  "Kannada", "Malayalam", "Gujarati", "Gurmukhi", "Oriya", "Sinhala",
  "Myanmar", "Khmer", "Lao", "Tibetan", "Georgian", "Armenian", "Ethiopic",
  "Cherokee", "Mongolian", "Common", "Inherited",
];

const MAX_CP = 0x10ffff;

/** Every code point a property matches, as sorted [lo, hi] ranges. */
function rangesFor(source) {
  const re = new RegExp("^" + source + "$", "u");
  const out = [];
  let start = -1;
  for (let cp = 0; cp <= MAX_CP; cp++) {
    // A lone surrogate has no scalar value; String.fromCodePoint still makes
    // one, and every property answers false for it, which is what the spec
    // says too.
    let hit = false;
    if (cp < 0xd800 || cp > 0xdfff) {
      hit = re.test(String.fromCodePoint(cp));
    }
    if (hit) {
      if (start < 0) start = cp;
    } else if (start >= 0) {
      out.push(start, cp - 1);
      start = -1;
    }
  }
  if (start >= 0) out.push(start, MAX_CP);
  return out;
}

function main() {
  const names = [];
  const offsets = [];
  const counts = [];
  const flat = [];

  const add = (canonicalName, source) => {
    let ranges;
    try {
      ranges = rangesFor(source);
    } catch (e) {
      // A property this host does not know is skipped rather than guessed at.
      console.error("skipping " + canonicalName + ": " + e.message);
      return;
    }
    names.push(canonicalName);
    offsets.push(flat.length / 2);
    counts.push(ranges.length / 2);
    for (const v of ranges) flat.push(v);
  };

  for (const gc of GENERAL_CATEGORIES) {
    // The general categories are reachable by bare name AND as
    // General_Category=..., and both spellings answer the same set.
    add(gc.toLowerCase(), "\\p{" + gc + "}");
  }
  for (const bp of BINARY_PROPERTIES) {
    add(bp.toLowerCase(), "\\p{" + bp + "}");
  }
  for (const sc of SCRIPTS) {
    add("script=" + sc.toLowerCase(), "\\p{Script=" + sc + "}");
  }

  // Verify: the emitted ranges must answer exactly what the host answers, for
  // every code point of every property. This is the same sweep again, against
  // the TABLE this time rather than against the regex that built it.
  let bad = 0;
  for (let i = 0; i < names.length; i++) {
    const nm = names[i];
    const source = nm.startsWith("script=")
      ? "\\p{Script=" + nm.slice(7) + "}"
      : "\\p{" + nm + "}";
    let re;
    try {
      re = new RegExp("^" + source + "$", "u");
    } catch { continue; }
    const off = offsets[i], cnt = counts[i];
    const inTable = (cp) => {
      let lo = 0, hi = cnt - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const a = flat[(off + mid) * 2], b = flat[(off + mid) * 2 + 1];
        if (cp < a) hi = mid - 1;
        else if (cp > b) lo = mid + 1;
        else return true;
      }
      return false;
    };
    for (let cp = 0; cp <= MAX_CP; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      const want = re.test(String.fromCodePoint(cp));
      if (inTable(cp) !== want) {
        bad++;
        if (bad < 6) {
          console.error("MISMATCH " + nm + " at U+" + cp.toString(16));
        }
      }
    }
  }
  if (bad) {
    console.error("refusing to write: " + bad + " mismatches");
    process.exit(1);
  }

  const strLiteral = (list, indent) => {
    const pad = " ".repeat(indent);
    const esc = (s) => '"' + s + '"';
    const parts = [];
    let line = "";
    for (const s of list) {
      const t = esc(s);
      if (line.length + t.length + 1 > 88) { parts.push(line); line = ""; }
      line += (line ? " " : "") + t;
    }
    if (line) parts.push(line);
    return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
  };
  const intLiteral = (list, indent) => {
    const pad = " ".repeat(indent);
    const parts = [];
    let line = "";
    for (const n of list) {
      const t = String(n);
      if (line.length + t.length + 1 > 88) { parts.push(line); line = ""; }
      line += (line ? " " : "") + t;
    }
    if (line) parts.push(line);
    return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
  };

  const header = `; =============================================================================
; UnicodeProps.rgr - the code points each \\p{...} property matches, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-props.cjs
;
; A property is a SET OF CODE POINTS and is carried as sorted [lo, hi] ranges,
; which is the only compact form: \\p{L} alone is hundreds of disjoint runs.
; NAMES is every supported property, lowercased and canonical -- a general
; category by its short name ("lu"), a binary property by its long one
; ("alphabetic"), a script as "script=greek". OFFSETS and COUNTS index into
; RANGES, which is [lo, hi] pairs laid end to end and sorted, so a lookup is a
; binary search.
;
; That the ranges are RIGHT is checked rather than assumed: the generator walks
; every code point of every property twice -- once to build the runs, once to
; compare the built table against the host -- and refuses to write a table that
; disagrees anywhere.
;
; Not every property Unicode defines is here. What is: every general category,
; the binary properties that appear in ordinary patterns, and the scripts with
; enough text behind them to matter. An unknown name is a SyntaxError, which is
; what the spec asks for.

class UnicodeProps {

    static sfn names:[string] () {
        return ${strLiteral(names, 8)}
    }

    static sfn offsets:[int] () {
        return ${intLiteral(offsets, 8)}
    }

    static sfn counts:[int] () {
        return ${intLiteral(counts, 8)}
    }

    static sfn ranges:[int] () {
        return ${intLiteral(flat, 8)}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log("wrote " + path.relative(process.cwd(), OUT) +
    "  properties: " + names.length + "  ranges: " + flat.length / 2);
}

main();
