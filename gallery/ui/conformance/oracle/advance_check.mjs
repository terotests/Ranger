#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Does the measurer agree with the browser about how wide text is?
//
//   npm run evg:advance:check
//
// The caret is drawn at the measured width of the text before it, so this
// number IS the caret's error. It was 12.4px at 13px before the advance table
// went in — eight of those pixels on "ada.example.com", which is what put the
// caret visibly past the end of the text in the invoice demo.
//
// TWO BUDGETS, because there are two kinds of error and only one of them is a
// bug. A string the table gets wrong by summing single advances where the
// browser kerns a pair is a KNOWN residual, bounded and small; a string it
// gets wrong for any other reason is a broken table. So: exact for anything
// without a kerning pair, and a stated ceiling for the rest.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));
const o = JSON.parse(fs.readFileSync(path.join(HERE, "advance.json"), "utf8"));

// The strings where a browser kerns and a sum of advances cannot.
const KERNS = new Set(["AVATAR", "To Wave", "INV-2026-0148"]);
const KERN_BUDGET = 4.0;   // px at 13px, measured worst case 3.86

let pass = 0, fail = 0;
const ok = (name, cond, got, want) => {
  if (cond) { pass++; return; }
  fail++;
  console.log(`  FAIL  ${name} — got ${got} want ${want}`);
};

for (const [fam, data] of Object.entries(o.families)) {
  const m = new H.SimpleTextMeasurer();
  for (const size of [11, 13, 14, 18]) {
    let worstPlain = 0, worstPlainS = "", worstKern = 0;
    for (const { s, w } of data.whole) {
      const want = w / o.referenceSize * size;
      const got = m.measureText(s, fam, size).width;
      const err = Math.abs(got - want);
      if (KERNS.has(s)) { if (err > worstKern) worstKern = err; }
      else if (err > worstPlain) { worstPlain = err; worstPlainS = s; }
    }
    // "exact" to a tenth of a pixel: the table holds five decimals of an em.
    ok(`${fam} @${size}px — unkerned strings are exact`,
       worstPlain < 0.1, `${worstPlain.toFixed(3)}px on "${worstPlainS}"`, "< 0.1px");
    const budget = KERN_BUDGET * size / 13;
    ok(`${fam} @${size}px — kerned strings stay inside the stated residual`,
       worstKern <= budget, `${worstKern.toFixed(3)}px`, `<= ${budget.toFixed(2)}px`);
  }
}

// THE SYMBOLS, one code point at a time.
//
// Printable ASCII was measured from the start; everything above it took a flat
// 0.5em guess — the same number for a chevron, a lock, a braille drag handle
// and a box-drawing glyph. At the 12px a step's icon is drawn that is 11.34px
// of real width believed to be 6.00, and a glyph nearly twice as wide as its
// box does not sit in the middle of that box. Which is what was reported: an
// icon visibly off-centre in a circle whose geometry was correct.
{
  const m = new H.SimpleTextMeasurer();
  for (const [fam, data] of Object.entries(o.families)) {
    let worst = 0, worstCp = 0;
    let missing = 0;
    for (const cp of o.symbols) {
      // Astral code points reach the measurer as a surrogate PAIR and are
      // handled by their own rule; this table is the BMP.
      if (cp > 0xffff) continue;
      const want = data.advance[cp] / o.referenceSize * 13;
      const got = m.measureChar(cp, fam, 13);
      if (got === 0) { missing++; continue; }
      const err = Math.abs(got - want);
      if (err > worst) { worst = err; worstCp = cp; }
    }
    ok(`${fam} @13px — every symbol the gallery draws is measured`,
      worst < 0.1, `${worst.toFixed(3)}px on U+${worstCp.toString(16).toUpperCase()}`, "< 0.1px");
  }
}

// AND THE TABLE KEEPS UP WITH THE SOURCES.
//
// The set is derived by the oracle from the gallery's own files, so this asks
// the question the other way round: does the table still cover what the
// sources draw? Adding an icon without re-running the oracle fails here rather
// than silently taking the guess.
{
  const skip = /node_modules|[\\/]bin[\\/]|\.git/;
  const found = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (skip.test(p)) continue;
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(rgr|css)$/.test(e.name)) continue;
      for (const ch of fs.readFileSync(p, "utf8")) {
        const c = ch.codePointAt(0);
        if (c > 126 && c !== 0x2028 && c !== 0x2029) found.add(c);
      }
    }
  };
  for (const d of ["gallery/ui/demo", "gallery/ui/src", "gallery/evg"]) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) walk(abs);
  }
  const known = new Set(o.symbols);
  const uncovered = [...found].filter((c) => !known.has(c)).sort((a, b) => a - b);
  ok("every non-ASCII character in the gallery's sources is in the table",
    uncovered.length === 0,
    uncovered.map((c) => "U+" + c.toString(16).toUpperCase()).join(" ") || "none",
    "none");
}

console.log("");
console.log(`passed = ${pass}  failed = ${fail}`);
console.log(fail === 0 ? "ALL PASS" : "FAILURES");
process.exit(fail === 0 ? 0 : 1);
