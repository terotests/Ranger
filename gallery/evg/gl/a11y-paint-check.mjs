#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The accessibility mirror may not paint.
//
//   node gallery/evg/gl/a11y-paint-check.mjs
//
// The mirror is real DOM over the canvas — that is the whole point of it, and
// it is why a reader can find a button EVG drew. The canvas underneath has
// already drawn every one of those nodes, so a mirror node that puts one
// pixel on the screen is a SECOND COPY OF THE PAGE. And because the mirror is
// rebuilt on its own schedule rather than once a frame, that copy is at an
// older scroll offset: two pages superimposed, sliding over each other.
//
// `color: transparent` reads as enough and is not. The mirror makes NATIVE
// controls on purpose — a real <button> and a real <input>, because that is
// what readers understand and what the text bridge edits in — and a native
// control on iOS paints through `-webkit-text-fill-color` and
// `-webkit-appearance`, neither of which `color` reaches.
//
// So this is a list, and the list is the point: every way a user agent can
// decide to draw something has to be turned off by name. It runs without a
// DOM — `styleBase` only ever writes to `el.style`, so a plain object is a
// good enough element for the question being asked.

import { styleBase } from "./evg-a11y.js";

const MUST_BE = {
  background: "transparent",
  color: "transparent",
  webkitTextFillColor: "transparent",
  webkitAppearance: "none",
  appearance: "none",
  caretColor: "transparent",
  textShadow: "none",
  boxShadow: "none",
  border: "0",
  outline: "none",
  overflow: "hidden",
  pointerEvents: "none",
  userSelect: "none",
};

const el = { style: {} };
styleBase(el);

let failed = 0;
for (const [prop, want] of Object.entries(MUST_BE)) {
  const got = el.style[prop];
  if (got === want) console.log("  PASS " + prop + ": " + want);
  else {
    failed += 1;
    console.log("  FAIL " + prop + " is " + JSON.stringify(got) + ", want " + JSON.stringify(want));
  }
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} way(s) the mirror could still paint over the canvas`);
  process.exit(1);
}
console.log(`  ${Object.keys(MUST_BE).length} ways it cannot paint`);
