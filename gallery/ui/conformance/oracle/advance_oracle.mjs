#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// How wide each character actually is.
//
//   node gallery/ui/conformance/oracle/advance_oracle.mjs
//
// Writes `advance.json` beside this file.
//
// WHY. `EVGTextMeasurer` estimates every character as `fontSize * 0.55`, so
// "ada.example.com" measures the same as "WWWWWWWWWWWWWWW". That is fine for a
// rough box and useless for a caret: the caret is placed at the measured width
// of the text before it, and in a proportional face the estimate drifts by
// tens of pixels over a short string. It is what puts the caret a centimetre
// past the end of the text in the invoice demo.
//
// It matters more than a caret, because the RENDERER does not estimate. The GL
// backend builds its glyph atlas with canvas `measureText`, so the text is
// drawn at its true width while the layout believes the estimate. Two
// measurements of the same string, and everything downstream — a caret, a
// selection band, a click that has to land on a character, a box sized to fit
// its label — is placed with the one that is wrong.
//
// So this records the truth, per character, at a reference size, and the
// measurer sums it.
//
// WHAT THIS ORACLE IS AND IS NOT. Sum-of-advances is not the same as measuring
// the whole string: a browser applies kerning between pairs, and no table of
// single characters can express that. The oracle therefore records BOTH — each
// character alone, and a set of whole strings — so the check can report how
// far the sum drifts from the truth rather than assume it does not. If the
// drift is small the table is the right answer; if it is not, that is a fact
// worth having before building on it.
//
// The reference size is 100px because advances scale linearly and a big
// reference keeps three decimal places of the ratio.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const REF = 100;

/**
 * The SYMBOLS the gallery actually draws, read out of the sources.
 *
 * Printable ASCII was measured from the start and everything above it fell
 * back to `fontSize * 0.55615` — one number for a chevron, a lock, a braille
 * drag handle and a crying emoji alike. Ninety-three distinct code points,
 * all measured the same, which is what put a step's icon visibly off-centre
 * in a circle whose box was correct: the glyph's BOX was 6px and the font
 * drew it twice that, so a centred box does not centre a glyph.
 *
 * Derived rather than listed. A hand-written list is a list that goes stale
 * the first time someone adds an icon, and `advance_check.mjs` asserts the
 * table covers the sources — so adding a glyph without re-running this fails
 * the gate instead of silently getting the fallback.
 */
function galleryCodePoints() {
  const out = new Set();
  const skip = /node_modules|[\/]bin[\/]|\.git/;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (skip.test(p)) continue;
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(rgr|css)$/.test(e.name)) continue;
      for (const ch of fs.readFileSync(p, "utf8")) {
        const c = ch.codePointAt(0);
        if (c > 126 && c !== 0x2028 && c !== 0x2029) out.add(c);
      }
    }
  };
  for (const d of ["gallery/ui/demo", "gallery/ui/src", "gallery/evg"]) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) walk(abs);
  }
  return [...out].sort((a, b) => a - b);
}

const SYMBOLS = galleryCodePoints();

// The families the gallery actually asks for.
const FAMILIES = ["Arial", "Helvetica", "sans-serif", "monospace"];

// Strings that exercise the drift: narrow letters, wide letters, digits,
// punctuation, and the ones from the demo that were reported wrong.
const STRINGS = [
  "ada.example.com", "Ada Lovelace", "INV-2026-0148", "1250.00",
  "iiiiiiiiii", "WWWWWWWWWW", "lllllllll", "MMMMMMMMM",
  "The quick brown fox", "0123456789", "AVATAR", "To Wave",
  "Search customers", "At least 8 characters.", "€1250.00",
];

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 400, height: 200 } });
await page.setContent("<canvas id=c></canvas>");

const out = await page.evaluate(({ ref, families, strings, symbols }) => {
  const ctx = document.getElementById("c").getContext("2d");
  const res = {};
  for (const fam of families) {
    ctx.font = `${ref}px ${fam}`;
    const adv = {};
    // printable ASCII, plus the euro the demo prefixes an amount with
    for (let code = 32; code < 127; code++) {
      const ch = String.fromCharCode(code);
      adv[code] = Math.round(ctx.measureText(ch).width * 1000) / 1000;
    }
    // Every symbol the gallery draws, at the same reference size. Emoji are
    // in here too: they are wider than any letter and were getting the same
    // 0.556em as everything else.
    for (const cp of symbols) {
      adv[cp] = Math.round(ctx.measureText(String.fromCodePoint(cp)).width * 1000) / 1000;
    }
    const whole = strings.map((s) => ({
      s, w: Math.round(ctx.measureText(s).width * 1000) / 1000,
    }));
    res[fam] = { advance: adv, whole };
  }
  return res;
}, { ref: REF, families: FAMILIES, strings: STRINGS, symbols: SYMBOLS });

await browser.close();

fs.writeFileSync(path.join(HERE, "advance.json"),
  JSON.stringify({ referenceSize: REF, symbols: SYMBOLS, families: out }, null, 2) + "\n");

// A first look at the drift, so the number is on the record from the start.
for (const fam of FAMILIES) {
  const { advance, whole } = out[fam];
  let worst = 0, worstS = "";
  for (const { s, w } of whole) {
    let sum = 0;
    for (const ch of s) sum += advance[ch.codePointAt(0)] || 0;
    const d = Math.abs(sum - w) / REF * 13;   // in px at the demo's 13px
    if (d > worst) { worst = d; worstS = s; }
  }
  console.log(`  ${fam.padEnd(12)} worst sum-vs-whole drift at 13px: ${worst.toFixed(3)}px  (${worstS})`);
}
console.log(`  symbols measured: ${SYMBOLS.length} code points above ASCII`);
{
  // What the fallback was costing, at the size the demos draw an icon.
  const adv = out["Arial"].advance;
  const fall = 0.55615 * 13;
  let worst = 0, worstCp = 0;
  for (const cp of SYMBOLS) {
    const real = (adv[cp] / REF) * 13;
    if (Math.abs(real - fall) > worst) { worst = Math.abs(real - fall); worstCp = cp; }
  }
  console.log(`  worst fallback error at 13px: ${worst.toFixed(2)}px on U+${worstCp.toString(16).toUpperCase()} ${JSON.stringify(String.fromCodePoint(worstCp))}`);
}
console.log("wrote advance.json");
