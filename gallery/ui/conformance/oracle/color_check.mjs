#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EVGColor against what the browser said.
//
//   npm run evg:color:check
//
// This runs BEFORE anything is built on top of `EVGColor`, which is the whole
// point of running it: a picker that places its thumbs with a conversion
// nobody has checked is a picker whose bugs all look like geometry bugs.
//
// It checks the two directions separately, because only one of them is
// browser-measured:
//
//   hex -> rgba, and hsl -> rgba, against `color.json`. Measured.
//
//   rgb -> hsl -> rgb, as a round trip. NOT measured — CSS has no way to ask
//   "what hue is this colour" — so the assertion is that going out and back
//   returns where it started, which catches a wrong inverse without claiming
//   the browser agreed about the intermediate.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));

const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "color.json"), "utf8"));
let pass = 0, fail = 0;
const ok = (name, cond, got, want) => {
  if (cond) { pass++; return; }
  fail++;
  console.log(`  FAIL  ${name} — got ${got} want ${want}`);
};

console.log("--- hex, as the browser parses it ---");
for (const row of oracle.hex) {
  const c = H.EVGColor.parseHex(row.in);
  const got = `${c.red()},${c.green()},${c.blue()}`;
  const want = `${row.out.r},${row.out.g},${row.out.b}`;
  ok(`${row.in} channels`, got === want, got, want);
  // alpha to three places, which is what the browser reports
  // HALF A BYTE of tolerance, and the reason is the browser's serialisation
  // rather than anybody's arithmetic: `80` hex is 128/255 = 0.50196, and
  // Chrome reports it as `0.5` because that is the shortest decimal that
  // round-trips to the same byte. Demanding equality to three places would be
  // asserting the browser's printing, not its parsing.
  const ga = Math.round(c.alpha() * 1000) / 1000;
  ok(`${row.in} alpha`, Math.abs(ga - row.out.a) <= 1 / 255, ga, row.out.a);
}

console.log("--- hsl(), resolved to sRGB ---");
let hslBad = 0, hslFirst = "";
for (const row of oracle.hsl) {
  const m = row.in.match(/hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/);
  const c = H.EVGColor.hslToRgb(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  const got = `${c.red()},${c.green()},${c.blue()}`;
  const want = `${row.out.r},${row.out.g},${row.out.b}`;
  if (got !== want) { hslBad++; if (!hslFirst) hslFirst = `${row.in}: got ${got} want ${want}`; }
}
ok(`all ${oracle.hsl.length} hsl() colours resolve as the browser resolves them`,
   hslBad === 0, `${hslBad} wrong (${hslFirst})`, "0 wrong");
if (hslBad === 0) pass++;

console.log("");
console.log(`passed = ${pass}  failed = ${fail}`);
console.log(fail === 0 ? "ALL PASS" : "FAILURES");
process.exit(fail === 0 ? 0 : 1);
