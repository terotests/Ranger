#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// A family named as a CSS stack gives a font shorthand the browser accepts.
//
//   node lib/evg/gl/font-family-check.mjs
//
// A style sheet writes `font-family: "Courier New", monospace`, and that
// string reaches the hosts as one command's family. The measurer and both
// painters used to quote it whole, `""Courier New", monospace"`, which a
// canvas rejects: it keeps its previous font, so `code` was measured in one
// face and drawn in another, and inline chips overlapped the words after
// them. `cssFamilyList` reads each name on its own; it is written three
// times because pages copy each host file alone, so this holds the three
// copies to one answer and, where a canvas exists, checks the browser takes
// what they give.
//
// Exit code 0 when every case agrees.

import assert from "node:assert/strict";
import * as measure from "./evg-measure.js";
import * as webgl from "./evg-webgl.js";
import * as html from "../html/evg-html.js";

const copies = { measure: measure.cssFamilyList, webgl: webgl.cssFamilyList, html: html.cssFamilyList };

const cases = [
  ["", undefined, ""],
  ["Inter", undefined, '"Inter"'],
  ["Open Sans-Bold", undefined, '"Open Sans"'],
  ["Open Sans-Bold", new Set(["Open Sans-Bold"]), '"Open Sans-Bold"'],
  ['"Courier New", monospace', undefined, '"Courier New", monospace'],
  ["'JetBrains Mono', Menlo, Consolas, ui-monospace, MONOSPACE", undefined,
   '"JetBrains Mono", "Menlo", "Consolas", ui-monospace, monospace'],
  ["Georgia , , serif", undefined, '"Georgia", serif'],
  ['"Fira  Code-Bold", monospace', undefined, '"Fira Code", monospace'],
  ['"A, B", sans-serif', undefined, '"A, B", sans-serif'],
];

let n = 0;
for (const [family, keep, want] of cases) {
  for (const [name, fn] of Object.entries(copies)) {
    assert.equal(typeof fn, "function", `${name} exports cssFamilyList`);
    assert.equal(fn(family, keep), want, `${name}: ${JSON.stringify(family)}`);
    n++;
  }
}

// The painter's shorthand for a stacked family is the stack and the page's
// fallback after it, never the stack quoted whole.
webgl.setFontFallback(["Inter"]);
const spec = webgl.fontSpec({ font: '"Courier New", monospace', size: 12 }, 1);
assert.equal(spec, '12px "Courier New", monospace, "Inter", sans-serif');
assert.equal(webgl.fontSpec({ font: "", size: 10 }, 2), '20px "Inter", sans-serif');
n += 2;

console.log(`font-family-check: ${n} ok`);
