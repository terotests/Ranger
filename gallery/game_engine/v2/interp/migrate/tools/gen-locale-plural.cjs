#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/LocalePlural.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-locale-plural.cjs
//
// The data behind Intl.PluralRules and Intl.ListFormat.
//
// CLDR states plural rules as expressions over the operands n, i, v, f and t --
// "one" when i is 1 and v is 0, "few" when i mod 10 is 2..4 and i mod 100 is
// not 12..14, and so on. Porting those expressions would mean writing a little
// rule language and an evaluator for it. What is carried instead is the
// ANSWER, keyed on just enough of the operands to determine it:
//
//   integers   the value itself below 1001, and (i mod 100, i mod 10, whether
//              i is a nonzero multiple of a million) above -- the last because
//              French says "many" for 1000000 and "other" for 200
//   fractions  (i clamped, v, f clamped)
//
// That the key is SUFFICIENT is not assumed. The generator checks every
// locale's rule against the host over 0..50000 and a fraction sweep, and
// refuses to write a table whose key ever gives two different answers for the
// same key.
//
// ListFormat needs only the separators, which are read off a formatted list.
//
// As with the other tables, the GENERATED FILE IS THE SOURCE OF TRUTH and is
// committed; no target needs this script in order to build.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "LocalePlural.rgr");

const LOCALES = [
  "en", "en-GB", "de", "fr", "es", "it", "nl", "pt", "pt-BR", "sv", "da", "nb",
  "fi", "is", "et", "cs", "sk", "pl", "hu", "tr", "ru", "uk", "el", "ro", "bg",
  "hr", "sl", "lt", "lv", "ja", "ko", "zh", "zh-TW", "he", "hi", "th", "vi",
  "id", "ca",
];

// The categories, in the order the engine's table indexes them.
const CATEGORIES = ["zero", "one", "two", "few", "many", "other"];
const catIndex = (c) => {
  const i = CATEGORIES.indexOf(c);
  if (i < 0) throw new Error("unknown plural category: " + c);
  return i;
};

/** The operands CLDR names, for a number written the way the caller wrote it. */
function operands(x) {
  const s = String(Math.abs(x));
  const dot = s.indexOf(".");
  const i = dot < 0 ? parseInt(s, 10) : parseInt(s.slice(0, dot), 10);
  const frac = dot < 0 ? "" : s.slice(dot + 1);
  return { i, v: frac.length, f: frac === "" ? 0 : parseInt(frac, 10) };
}

/**
 * The lookup key. Integers and fractions are keyed differently because the
 * rules are: an integer rule never looks at f, and a fraction rule rarely
 * looks past the first couple of integer digits.
 */
function keyOf(x) {
  const { i, v, f } = operands(x);
  if (v === 0) {
    // Exact below 1001: Italian's ORDINAL rules name 8, 11, 80 and 800
    // individually, so a threshold of 200 collided 800 with 200.
    if (i < 1001) return "s" + i;
    return "b|" + (i % 100) + "|" + (i % 10) + "|" + (i % 1000000 === 0 ? 1 : 0);
  }
  return "d|" + Math.min(i, 3) + "|" + Math.min(v, 3) + "|" + Math.min(f, 3);
}

/** Every value the verification sweeps, integers first. */
function sweep() {
  const out = [];
  for (let n = 0; n <= 50000; n++) out.push(n);
  // Past 50000 as well, and specifically the multiples of a million: the key
  // has a flag for them because French says "many" there, and a sweep that
  // stopped at 50000 never created those keys NOR noticed they were missing.
  for (const n of [100000, 123456, 999999, 1000000, 1000001, 1500000, 2000000,
                   2000001, 10000000, 100000000, 1000000000]) {
    out.push(n);
  }
  for (let i = 0; i <= 12; i++) {
    for (const frac of ["0", "1", "5", "01", "10", "25", "001", "500"]) {
      out.push(Number(i + "." + frac));
    }
  }
  return out;
}

function pluralTableFor(loc, type) {
  const pr = new Intl.PluralRules(loc, { type });
  const map = new Map();
  for (const x of sweep()) {
    const k = keyOf(x);
    const c = pr.select(x);
    if (map.has(k) && map.get(k) !== c) {
      throw new Error("key collision in " + loc + "/" + type + " at " + x +
        ": " + map.get(k) + " vs " + c);
    }
    map.set(k, c);
  }
  return map;
}

/** The separators a list format uses, read off two formatted lists. */
function listSeparators(loc, type) {
  const f = new Intl.ListFormat(loc, { type });
  const two = f.formatToParts(["", ""]);
  const three = f.formatToParts(["", "", ""]);
  const lits = (parts) => parts.filter((p) => p.type === "literal").map((p) => p.value);
  const twoLits = lits(two);
  const threeLits = lits(three);
  // pair: the separator between exactly two items
  // middle: between the first items of three or more
  // end: before the last of three or more
  return [
    twoLits[0] || ", ",
    threeLits[0] || ", ",
    threeLits[threeLits.length - 1] || ", ",
  ];
}

function strLiteral(list, indent) {
  const pad = " ".repeat(indent);
  const esc = (s) => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  const parts = [];
  let line = "";
  for (const s of list) {
    const t = esc(s);
    if (line.length + t.length + 1 > 88) { parts.push(line); line = ""; }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return '([] _:string ())';
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

function intLiteral(list, indent) {
  const pad = " ".repeat(indent);
  const parts = [];
  let line = "";
  for (const n of list) {
    const t = String(n);
    if (line.length + t.length + 1 > 88) { parts.push(line); line = ""; }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return "([] _:int ())";
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

function main() {
  const tags = [];
  const keyStr = [];        // every distinct key, once
  const keyIndex = new Map();
  const entryInt = [];      // per locale: offset, count, then (keyId, catId) pairs
  const listStr = [];

  const internKey = (k) => {
    if (!keyIndex.has(k)) {
      keyIndex.set(k, keyStr.length);
      keyStr.push(k);
    }
    return keyIndex.get(k);
  };

  const pairs = [];
  for (const loc of LOCALES) {
    tags.push(loc.toLowerCase());
    for (const type of ["cardinal", "ordinal"]) {
      const map = pluralTableFor(loc, type);
      // The commonest category becomes the DEFAULT and is left out of the
      // table, which removes most of the entries: nearly every key in nearly
      // every locale answers "other".
      const counts = new Map();
      for (const c of map.values()) counts.set(c, (counts.get(c) || 0) + 1);
      let fallback = "other";
      let best = -1;
      for (const [c, n] of counts) if (n > best) { best = n; fallback = c; }
      const listed = [...map.entries()].filter(([, c]) => c !== fallback);
      // The offset is a PAIR index, not a flat one -- the engine multiplies by
      // two to reach the key.
      entryInt.push(pairs.length / 2, listed.length, catIndex(fallback));
      for (const [k, c] of listed) pairs.push(internKey(k), catIndex(c));
    }
    for (const type of ["conjunction", "disjunction"]) {
      listStr.push(...listSeparators(loc, type));
    }
  }

  // Verify the emitted tables reproduce the host for every swept value.
  const lookup = (locIdx, typeIdx, x) => {
    const base = (locIdx * 2 + typeIdx) * 3;
    const off = entryInt[base], count = entryInt[base + 1], fb = entryInt[base + 2];
    const k = keyOf(x);
    for (let j = 0; j < count; j++) {
      if (keyStr[pairs[(off + j) * 2]] === k) return CATEGORIES[pairs[(off + j) * 2 + 1]];
    }
    return CATEGORIES[fb];
  };
  let bad = 0;
  const values = sweep();
  for (let li = 0; li < LOCALES.length; li++) {
    for (let ti = 0; ti < 2; ti++) {
      const type = ti === 0 ? "cardinal" : "ordinal";
      const pr = new Intl.PluralRules(LOCALES[li], { type });
      for (const x of values) {
        const mine = lookup(li, ti, x);
        const want = pr.select(x);
        if (mine !== want) {
          bad++;
          if (bad < 6) {
            console.error("MISMATCH " + LOCALES[li] + "/" + type + " " + x +
              ": " + mine + " vs " + want);
          }
        }
      }
    }
  }
  if (bad) {
    console.error("refusing to write: " + bad + " mismatches");
    process.exit(1);
  }

  const header = `; =============================================================================
; LocalePlural.rgr - plural categories and list separators, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-locale-plural.cjs
;
; CLDR states plural rules as expressions over the operands n, i, v, f and t --
; "one" when i is 1 and v is 0, "few" when i mod 10 is 2..4 and i mod 100 is not
; 12..14. Porting them would mean writing a little rule language and an
; evaluator for it. What is carried instead is the ANSWER, keyed on just enough
; of the operands to determine it: the value itself below 1001, then (i mod 100,
; i mod 10, is-a-nonzero-multiple-of-a-million) above -- that last because
; French says "many" for 1000000 and "other" for 200 -- and (i, v, f) for
; anything with a fraction.
;
; That the key is SUFFICIENT is checked rather than assumed: the generator
; sweeps 0..50000 and a fraction set through every locale and refuses to write a
; table whose key ever gives two answers for one key.
;
; KEYS is every distinct key, once. ENTRIES is (offset, count, fallback
; category) per locale per type -- cardinal then ordinal -- and PAIRS is
; (key id, category id) laid end to end. The commonest category per locale is
; the FALLBACK and is left out, which removes most of the entries: nearly every
; key in nearly every locale answers "other".
; Categories: 0 zero, 1 one, 2 two, 3 few, 4 many, 5 other.
;
; LISTSEP is (pair, middle, end) for conjunction then disjunction, per locale:
; English joins two with " and ", three with ", " and ", and ".

class LocalePlural {

    static sfn tags:[string] () {
        return ${strLiteral(tags, 8)}
    }

    ; Named keyList rather than keys, which is a Ranger builtin: a static called
    ; that cannot be resolved.
    static sfn keyList:[string] () {
        return ${strLiteral(keyStr, 8)}
    }

    static sfn entries:[int] () {
        return ${intLiteral(entryInt, 8)}
    }

    static sfn pairs:[int] () {
        return ${intLiteral(pairs, 8)}
    }

    static sfn listSeparators:[string] () {
        return ${strLiteral(listStr, 8)}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log("wrote " + path.relative(process.cwd(), OUT) +
    "  locales: " + LOCALES.length + "  distinct keys: " + keyStr.length +
    "  listed pairs: " + pairs.length / 2);
}

main();
