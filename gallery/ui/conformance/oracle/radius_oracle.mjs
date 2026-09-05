#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What `border-radius` means with one to four values.
//
//   node gallery/ui/conformance/oracle/radius_oracle.mjs
//
// Writes `radius.json` beside this file.
//
// WHY. A window's title bar was rounded on all four corners because EVG has
// ONE radius for a box, so `border-radius: 11px 11px 0 0` — the declaration
// that makes a strip sit flush against what is under it — could not be
// written. Adding three more numbers is easy; getting the two rules right is
// what needs measuring:
//
//   THE FILL-IN ORDER. One value is all four. Two are (TL+BR, TR+BL). Three
//   are (TL, TR+BL, BR). Four are TL, TR, BR, BL — clockwise from the top
//   left, which is not the order any other box shorthand uses.
//
//   THE SCALE-DOWN. If two radii on one side add up to more than that side,
//   EVERY radius on the box is multiplied by the same factor — the smallest
//   ratio over all four sides — so a 100px-wide box asking for 80px corners
//   does not get two overlapping bulges. Getting this wrong per-corner rather
//   than per-box is the classic mistake and it shows up as a lopsided box.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireDom, findChromium } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const CASES = [
  { decl: "8px", w: 200, h: 100 },
  { decl: "8px 20px", w: 200, h: 100 },
  { decl: "8px 20px 4px", w: 200, h: 100 },
  { decl: "11px 11px 0 0", w: 200, h: 100 },
  { decl: "0 0 11px 11px", w: 200, h: 100 },
  { decl: "50%", w: 200, h: 100 },
  { decl: "25% 10%", w: 200, h: 100 },
  // The scale-down: 80 + 80 across a 100-wide box.
  { decl: "80px", w: 100, h: 100 },
  { decl: "80px 80px 0 0", w: 100, h: 40 },
  { decl: "60px 20px 0 0", w: 50, h: 200 },
  { decl: "1em", w: 200, h: 100 },
];

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.setContent('<style>html,body{margin:0;font-size:16px}</style><div id="host"></div>');

const rows = await page.evaluate((cases) => {
  const host = document.getElementById("host");
  return cases.map((c) => {
    const d = document.createElement("div");
    d.style.cssText =
      `position:absolute;left:0;top:0;font-size:16px;width:${c.w}px;height:${c.h}px;border-radius:${c.decl}`;
    host.appendChild(d);
    const s = getComputedStyle(d);
    // Computed style gives the AUTHORED value resolved to px/%, not the
    // scaled-down one, so the used radii are what the box is actually drawn
    // with and have to be derived — which is exactly the rule being recorded.
    const px = (v) => {
      const parts = v.split(" ");
      return parts.map((p) => (p.endsWith("%")
        ? null
        : parseFloat(p)));
    };
    const out = {
      decl: c.decl, w: c.w, h: c.h,
      computed: [
        s.borderTopLeftRadius, s.borderTopRightRadius,
        s.borderBottomRightRadius, s.borderBottomLeftRadius,
      ],
    };
    d.remove();
    return out;
  });
}, CASES);

await browser.close();

// Resolve the computed strings into the four used radii, applying the
// scale-down here so the file records the numbers a painter needs. A
// percentage is against the box's WIDTH horizontally and its HEIGHT
// vertically; EVG has one radius per corner rather than an ellipse, so a
// single-axis reading is what it can consume — recorded as such.
for (const r of rows) {
  const one = (s, w, h) => {
    const parts = String(s).split(" ");
    const a = parts[0];
    const v = a.endsWith("%") ? (parseFloat(a) / 100) * w : parseFloat(a);
    return v;
  };
  const raw = [
    one(r.computed[0], r.w, r.h), one(r.computed[1], r.w, r.h),
    one(r.computed[2], r.w, r.h), one(r.computed[3], r.w, r.h),
  ];
  // f is the smallest ratio over the four sides; radii scale by min(1, f).
  const sides = [
    r.w / (raw[0] + raw[1]), // top
    r.h / (raw[1] + raw[2]), // right
    r.w / (raw[3] + raw[2]), // bottom
    r.h / (raw[0] + raw[3]), // left
  ].filter((x) => Number.isFinite(x));
  const f = Math.min(1, ...sides);
  r.authored = raw.map((v) => +v.toFixed(3));
  r.scale = +f.toFixed(4);
  r.used = raw.map((v) => +(v * f).toFixed(3));
}

fs.writeFileSync(path.join(HERE, "radius.json"), JSON.stringify(rows, null, 1) + "\n");
console.log("wrote oracle/radius.json");
for (const r of rows) {
  console.log(`  ${r.decl.padEnd(16)} ${String(r.w).padStart(3)}x${String(r.h).padStart(3)}  ` +
    `authored ${JSON.stringify(r.authored).padEnd(24)} scale ${r.scale}  used ${JSON.stringify(r.used)}`);
}
