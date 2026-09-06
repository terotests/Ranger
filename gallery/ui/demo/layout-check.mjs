#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Does anything sit on top of anything else?
//
//   npm run ui:layout:check
//
// WHY THIS EXISTS. Ten layout defects were reported from looking at the pages
// while every suite was green. The containment rule that existed — in
// `form-check`, and only there — compares RIGHT edges:
//
//     if (childRight > parentRight + 0.5) …
//
// Every demo passes it. Every defect reported was VERTICAL: a stepper written
// over a progress bar, a value popup landing on the rows beneath it. Half a
// rule, applied to one demo out of eighteen.
//
// So this is the other half, over all of them. Two rules, and neither needs an
// oracle — they are invariants a laid-out box tree owes you whatever the
// design is:
//
//   1. an in-flow child ends inside its parent, bottom as well as right;
//   2. two in-flow siblings do not occupy the same pixels.
//
// ABSOLUTE CHILDREN ARE EXEMPT, and that is not a loophole: a caret, a
// selection band, a menu surface and the password eye are placed against their
// box on purpose and are not content it has to make room for. An overlay that
// wants to cover the page says so by being out of flow. A popup that is IN
// flow and lands on the rows below is the bug this catches — `fd-menu` in the
// filter bar is exactly that.
//
// THE BASELINE. `layout-baseline.json` records the count each demo is allowed.
// A demo at or under its number passes; over it fails, and so does a demo that
// improves without the baseline being lowered, because a stale allowance is
// how a fixed bug comes back. Lower a number when you fix something; never
// raise one to get green.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const BIN = path.join(ROOT, "gallery", "ui", "bin");
const BASELINE = path.join(HERE, "layout-baseline.json");

// TWO SHAPES, because the demos have two. Most are an instance you `init` with
// a stylesheet and then ask for a display list, which lays the tree out on the
// way. Three — menubar, sortable, toolbar — are STATIC: `sfn page(...)`
// returns a tree and the host lays it out, so here the sheet is applied and
// `EVGLayout` run by hand with the same viewport the page uses.
//
// They are not skipped for being awkward. A gate with a hole in it is how all
// of this got here.
const STATIC_ARGS = {
  MenubarDemo: (M) => M.MenubarDemo.page([], "ada", "", false, false),
  SortableDemo: (M) =>
    M.SortableDemo.page(["a", "b", "c", "d", "e"], ""),
  ToolbarDemo: (M) =>
    M.ToolbarDemo.page(false, false, false, "left", "Edited 2 hours ago"),
};

// name -> the stylesheet it is initialised with. A demo with no stylesheet of
// its own is not skipped; it is initialised with an empty one, because a demo
// that only lays out correctly with CSS is still a demo that has to lay out.
const DEMOS = [
  ["CalendarDemo", "calendar.css"],
  ["ControlsDemo", "controls.css"],
  ["DashboardDemo", "dashboard.css"],
  ["DialogDemo", "dialog.css"],
  ["DropdownDemo", "dropdown.css"],
  ["EventCalDemo", "eventcal.css"],
  ["FilterDemo", "filters.css"],
  ["FormDemo", "form.css"],
  ["MenubarDemo", "menubar.css"],
  ["MessageDemo", "message.css"],
  ["MotionDemo", "motion.css"],
  ["OtpDemo", "otp.css"],
  ["ProfileDemo", "profile.css"],
  ["ResizeDemo", "resize.css"],
  ["SortableDemo", "sortable.css"],
  ["TableDemo", "table.css"],
  ["TimelineDemo", "timeline.css"],
  ["ToolbarDemo", "toolbar.css"],
  ["TreeDemo", "tree.css"],
];

const rect = (e) => ({
  x: e.calculatedX, y: e.calculatedY,
  w: e.calculatedWidth, h: e.calculatedHeight,
});
const name = (e) => e.id || e.className || "?";

function faults(root) {
  const out = [];
  const walk = (el) => {
    const p = rect(el);
    const flow = el.children.filter((k) => k.position !== "absolute");
    for (const k of flow) {
      const r = rect(k);
      if (r.h > 0 && p.h > 0 && r.y + r.h > p.y + p.h + 0.5) {
        out.push(`${name(k)} bottom ${(r.y + r.h).toFixed(0)} passes ${name(el)} bottom ${(p.y + p.h).toFixed(0)}`);
      }
      if (r.w > 0 && p.w > 0 && r.x + r.w > p.x + p.w + 0.5) {
        out.push(`${name(k)} right ${(r.x + r.w).toFixed(0)} passes ${name(el)} right ${(p.x + p.w).toFixed(0)}`);
      }
    }
    for (let i = 0; i < flow.length; i++) {
      for (let j = i + 1; j < flow.length; j++) {
        const a = rect(flow[i]);
        const b = rect(flow[j]);
        if (a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) continue;
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 0.5 && oy > 0.5) {
          out.push(`${name(flow[i])} and ${name(flow[j])} share ${ox.toFixed(0)}x${oy.toFixed(0)}px inside ${name(el)}`);
        }
      }
    }
    for (const k of el.children) walk(k);
  };
  walk(root);
  return out;
}

const cssFor = (f) => {
  const p = path.join(HERE, f);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
};

const baseline = fs.existsSync(BASELINE)
  ? JSON.parse(fs.readFileSync(BASELINE, "utf8"))
  : {};
const record = process.argv.includes("--record");

let failed = 0;
const counts = {};
for (const [demo, css] of DEMOS) {
  const file = path.join(BIN, demo + ".cjs");
  if (!fs.existsSync(file)) {
    console.log(`  MISSING ${demo} — run \`npm run ui:demo:build\``);
    failed += 1;
    continue;
  }
  let list;
  try {
    const M = require(file);
    let root;
    if (STATIC_ARGS[demo]) {
      root = STATIC_ARGS[demo](M);
      const sheet = new M.EVGStyleSheet();
      sheet.parse(cssFor(css));
      sheet.applyTree(root);
      new M.EVGLayout().layout(root, 1200, 800);
    } else {
      const d = new M[demo]();
      d.init(cssFor(css));
      d.displayListJson();
      root = d.root;
    }
    list = faults(root);
  } catch (e) {
    console.log(`  ERROR   ${demo} — ${e.message}`);
    failed += 1;
    continue;
  }
  counts[demo] = list.length;
  const allowed = Object.prototype.hasOwnProperty.call(baseline, demo) ? baseline[demo] : 0;
  if (record) {
    console.log(`  ${demo}: ${list.length}`);
    continue;
  }
  if (list.length > allowed) {
    failed += 1;
    console.log(`  FAIL ${demo}: ${list.length} faults, ${allowed} allowed`);
    for (const l of list.slice(0, 8)) console.log(`         ${l}`);
    if (list.length > 8) console.log(`         … and ${list.length - 8} more`);
  } else if (list.length < allowed) {
    failed += 1;
    console.log(`  FAIL ${demo}: ${list.length} faults but ${allowed} allowed — lower the baseline`);
  } else if (allowed > 0) {
    console.log(`  KNOWN ${demo}: ${list.length} faults, at its baseline`);
  } else {
    console.log(`  PASS ${demo}: nothing overlaps`);
  }
}

if (record) {
  fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + "\n");
  console.log(`\nwrote ${path.relative(ROOT, BASELINE)}`);
  process.exit(0);
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`\nlayout faults: ${total} across ${Object.keys(counts).length} demos`);
if (failed > 0) {
  console.log("SOME FAILED");
  process.exit(1);
}
console.log("ALL PASS");
