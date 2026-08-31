#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// EVG's border-radius against the numbers a browser produced.
//
//   node gallery/ui/conformance/oracle/radius_check.mjs
//
// Two rules, and the second is the one that is easy to get wrong: the
// shorthand's fill-in order (two values are a DIAGONAL pair, unlike padding's)
// and the box-wide scale-down (when two radii on a side overrun it, ALL FOUR
// shrink by the same factor — clamping per corner comes out lopsided).

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "gallery/ui/bin/ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "radius.json"), "utf8"));

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

// The radii a command comes out carrying, which is what a painter gets.
function drawn(decl, w, h) {
  const sheet = new H.EVGStyleSheet();
  sheet.parse(
    `.page{display:flex;flex-direction:column;flex-wrap:nowrap;width:800px;height:600px;font-size:16px}` +
    `.b{width:${w}px;height:${h}px;background-color:#abc;font-size:16px;border-radius:${decl}}`,
  );
  const page = H.EVGElement.createDiv();
  page.className = "page";
  const b = H.EVGElement.createDiv();
  b.className = "b";
  page.addChild(b);
  sheet.applyTree(page, "");
  const l = new H.EVGLayout();
  l.setPageSize(800, 600);
  l.layout(page);
  const dl = new H.EVGDisplayList();
  dl.build(page);
  const list = JSON.parse(dl.toJson());
  // The box's own fill: the first command with this size.
  const c = list.cmds.find((x) => Math.abs(x.w - w) < 0.5 && Math.abs(x.h - h) < 0.5 && x.k === 0);
  if (!c) return null;
  return c.rc ? c.rc : [c.r || 0, c.r || 0, c.r || 0, c.r || 0];
}

for (const row of oracle) {
  const got = drawn(row.decl, row.w, row.h);
  const want = row.used;
  const same = got && got.every((v, i) => Math.abs(v - want[i]) < 0.05);
  ok(`${row.decl} on ${row.w}x${row.h}`, same,
    JSON.stringify(got) + "   want " + JSON.stringify(want));
}

console.log("--- one number is still one number ---");
{
  // Everything that reads this list but the WebGL painter takes a single
  // radius. A box with four equal corners must not start emitting an array.
  const sheet = new H.EVGStyleSheet();
  sheet.parse(".b{width:100px;height:50px;background-color:#abc;border-radius:6px}");
  const b = H.EVGElement.createDiv();
  b.className = "b";
  sheet.applyTree(b, "");
  const l = new H.EVGLayout();
  l.setPageSize(400, 200);
  l.layout(b);
  const dl = new H.EVGDisplayList();
  dl.build(b);
  const c = JSON.parse(dl.toJson()).cmds.find((x) => x.k === 0);
  ok("a uniform radius emits `r` and no `rc`", c.r === 6 && c.rc === undefined,
    JSON.stringify({ r: c.r, rc: c.rc }));
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
