#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What the browser makes of a colour, so a picker can agree with it.
//
//   node gallery/ui/conformance/oracle/color_oracle.mjs
//
// Writes `color.json` beside this file.
//
// WHY, AND WHERE THIS ORACLE STOPS. A colour picker is three things stacked:
// a value on a two-dimensional track, a value on a one-dimensional one, and a
// typed value in a text field. Only the last of those has a browser behaviour
// to measure against, and it is worth being precise about which parts are
// measured and which are merely arithmetic, because it is easy to present the
// whole thing as "oracled" when half of it is a convention I picked.
//
//   MEASURED. Hex parsing in all four lengths (#rgb, #rgba, #rrggbb,
//   #rrggbbaa), `hsl()` resolution to sRGB, the rounding rule when a channel
//   lands between integers, and what happens to out-of-range and malformed
//   input. These are CSS behaviours; the browser is the authority and this
//   records what it does.
//
//   NOT MEASURED. HSV. CSS has no HSV notation — `hsl()` is lightness, not
//   value — so there is nothing to ask the browser about. Pickers use HSV
//   because a square of saturation against value is the shape people expect,
//   so it has to exist, but it is asserted from the standard formula and by
//   round-trip identity rather than measured. Said plainly here so nobody
//   later reads a green check as a browser agreeing about HSV.
//
//   ALSO NOT MEASURED. Where the thumb sits for a given saturation. That is
//   geometry, and no browser has an opinion about it.
//
// The hue sweep is every 15 degrees at three saturations and three
// lightnesses, which is enough to catch a wrong sector boundary — the classic
// HSL bug is an off-by-one in the sixth of the wheel a hue falls into, and it
// only shows at the seams.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const HEXES = [
  "#000", "#fff", "#f00", "#0f0", "#00f",
  "#3b72c4", "#25a", "#123456", "#abcdef",
  "#3b72c480", "#0f08", "#ffffff00",
  // the deck colours this editor actually uses
  "#1f51a9", "#c0ffee", "#102030",
];

const HSLS = [];
for (let h = 0; h < 360; h += 15) {
  for (const [s, l] of [[100, 50], [50, 50], [25, 75], [0, 40], [100, 25]]) {
    HSLS.push(`hsl(${h} ${s}% ${l}%)`);
  }
}
// The seams of the wheel, exactly.
for (const h of [0, 59.9, 60, 60.1, 119.9, 120, 180, 239.9, 240, 300, 359.9]) {
  HSLS.push(`hsl(${h} 100% 50%)`);
}

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 400, height: 200 } });
await page.setContent('<style>html,body{margin:0}</style><div id="host"></div>');

const rows = await page.evaluate(({ hexes, hsls }) => {
  const host = document.getElementById("host");
  // The browser's own parser, read back as resolved sRGB. `color` resolves to
  // `rgb(r, g, b)` or `rgba(r, g, b, a)`, and an unparseable value leaves the
  // property at its inherited default — which is how invalid input is
  // detected here rather than guessed at.
  const resolve = (css) => {
    const d = document.createElement("div");
    d.style.color = "rgb(1, 2, 3)";      // a sentinel nothing else produces
    d.style.color = css;
    host.appendChild(d);
    const got = getComputedStyle(d).color;
    d.remove();
    return got === "rgb(1, 2, 3)" && css !== "rgb(1, 2, 3)" ? null : got;
  };
  const parse = (s) => {
    if (s === null) return null;
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  return {
    hex: hexes.map((h) => ({ in: h, out: parse(resolve(h)) })),
    hsl: hsls.map((h) => ({ in: h, out: parse(resolve(h)) })),
    invalid: ["#12", "#1234567", "hsl(bogus)", "notacolour", ""]
      .map((h) => ({ in: h, out: parse(resolve(h)) })),
  };
}, { hexes: HEXES, hsls: HSLS });

await browser.close();

const out = {
  note: "browser-measured: hex parsing and hsl() resolution. HSV is NOT here; CSS has no HSV.",
  userAgent: "chromium",
  ...rows,
};
fs.writeFileSync(path.join(HERE, "color.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`wrote color.json — ${rows.hex.length} hex, ${rows.hsl.length} hsl, ${rows.invalid.length} invalid`);
