#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EVGLayout against the browser's own answer for `flex-grow`.
//
//   npm run evg:flexgrow:check
//
// Reads `flexgrow.json`, which `flexgrow_oracle.mjs` captured from Chromium.
// Nothing here recomputes a flex rule in JavaScript and calls it an oracle:
// every expected number came off a real browser laying out the same CSS.
//
// The gate exists because `flex-grow` was not a property EVG parsed at all —
// see the note in the oracle. A silently ignored property is invisible to a
// unit test of the thing that uses it, so the test has to be the pixels.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const M = require(path.join(ROOT, "gallery/ui/bin/ControlsDemo.cjs"));
const DATA = JSON.parse(fs.readFileSync(path.join(HERE, "flexgrow.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed += 1; console.log(`  PASS ${name}`); }
  else { failed += 1; console.log(`  FAIL ${name}${detail ? " — " + detail : ""}`); }
};

// The oracle records the markup as a flat list of children under one box, so
// rebuilding it needs no HTML parser: every id in `ids` is a child, in order,
// and its classes are read back out of the html by position.
function build(c) {
  const root = new M.EVGElement();
  root.className = "box";
  const re = /<div class="([^"]+)" id="([^"]+)">/g;
  let m;
  while ((m = re.exec(c.html)) !== null) {
    const kid = new M.EVGElement();
    kid.className = m[1];
    kid.id = m[2];
    root.addChild(kid);
  }
  const sheet = new M.EVGStyleSheet();
  sheet.parse(c.css);
  sheet.applyTree(root);
  new M.EVGLayout().layout(root, 1000, 600);
  return root;
}

const findById = (el, id) => {
  if (el.id === id) return el;
  for (const k of el.children) { const r = findById(k, id); if (r) return r; }
  return null;
};

for (const [name, c] of Object.entries(DATA.cases)) {
  console.log(`--- ${name}: ${c.note} ---`);
  const root = build(c);
  // The oracle's coordinates are page-absolute and the box starts at 0,0, so
  // they are directly comparable with EVG's — but only because nothing above
  // the box has margin. `*{margin:0}` in the oracle's stylesheet is what makes
  // that true, and it is why the base rules are captured with the case.
  for (const id of c.ids) {
    const want = c.boxes[id];
    const el = findById(root, id);
    if (!el) { ok(`${id} exists`, false, "not in the built tree"); continue; }
    const got = {
      x: el.calculatedX, y: el.calculatedY,
      w: el.calculatedWidth, h: el.calculatedHeight,
    };
    const near = (a, b) => Math.abs(a - b) <= 1.0;
    ok(`${id} is ${want.w}px wide at x=${want.x}`,
      near(got.x, want.x) && near(got.w, want.w),
      `got x=${got.x.toFixed(1)} w=${got.w.toFixed(1)}`);
    // The cross axis is checked too on the column case, where growth IS the
    // vertical measurement and a width-only assertion would prove nothing.
    if (name === "columnGrow") {
      ok(`${id} is ${want.h}px tall at y=${want.y}`,
        near(got.y, want.y) && near(got.h, want.h),
        `got y=${got.y.toFixed(1)} h=${got.h.toFixed(1)}`);
    }
  }
}

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) { console.log("SOME FAILED"); process.exit(1); }
console.log("ALL PASS");
