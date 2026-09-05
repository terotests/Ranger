#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The litmus test for keyed reconciliation: does the gap OPEN, or does it
// appear?
//
// The sortable used to answer this with `SortableDemo.applyShift()` — a
// hand-written pass that re-aimed the existing rows so nothing had to be
// rebuilt — because rebuilding gave every row a brand-new element with no
// flight, and a row with no flight arrives instead of travelling. That is not a
// theory: the comment it left behind records the measurement, "the rows were at
// their final positions 40ms after the crossing, having gone through nothing".
//
// `applyShift` is gone. The page rebuilds the whole tree on every frame of a
// drag and reconciles it into the live one, and this file is what says the
// animation did not get worse for it. It runs the demo's own pipeline with no
// browser: build, reconcile, style, transition, advance, and read back where
// each row actually is.
//
// Mutating the rebuild into a plain replacement (drop the reconcile) must fail
// this, and does — that is the check being a check rather than a description.
//
//   node gallery/ui/demo/sortable-motion-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/SortableDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "sortable.css"), "utf8");

const ORDER = ["demo", "spec", "video", "audio", "extra"];
const STRIDE = 88; // .sr-row height + .sr-list gap; SortableDemo.stride() agrees.

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed++;
    console.log("  PASS " + name);
  } else {
    failed++;
    console.log("  FAIL " + name);
    if (detail !== undefined) console.log("       " + detail);
  }
}

// The demo's pipeline, minus the painter. `keptTree` in main.js does exactly
// this; duplicating it here rather than importing keeps the check runnable
// without a bundler, and it is six lines.
function makeHost() {
  const sheet = new M.EVGStyleSheet();
  sheet.parse(CSS);
  const transitions = new M.EVGTransition();
  const reconciler = new M.EVGReconcile();
  let root = null;

  const settleFrame = () => {
    sheet.setViewport(1240, 560, false);
    sheet.applyTree(root, "");
    transitions.reconcileTree(root);
    const lay = new M.EVGLayout();
    lay.setPageSize(1240, 560);
    lay.layout(root);
  };

  return {
    rebuild(build, keyed) {
      const next = build();
      if (!root) {
        root = next;
      } else if (keyed) {
        reconciler.resetStats();
        reconciler.reconcile(root, next);
      } else {
        // The mutation: throw the live tree away and take the new one.
        root = next;
      }
      settleFrame();
    },
    advance(ms) {
      transitions.advanceTree(root, ms);
      settleFrame();
    },
    stats: () => reconciler.stats,
    rowsById() {
      const out = new Map();
      const walk = (el) => {
        if (el.id && el.id.indexOf("sr-row-") === 0) out.set(el.id, el);
        for (let i = 0; i < el.children.length; i++) walk(el.children[i]);
      };
      walk(root);
      return out;
    },
  };
}

// One drag: pick "video" up, then cross onto "spec". Rows one and two have to
// step DOWN one place to open the gap, and the placeholder travels up two.
function run(keyed) {
  const host = makeHost();
  const page = (over) => () => M.SortableDemo.dragPage(ORDER, "video", over, 40, 40, true);

  host.rebuild(page(""), keyed);
  host.advance(1000); // settle: nothing may be in flight when the crossing happens

  const before = host.rowsById();
  const startSpec = before.get("sr-row-spec").translateY;

  // The crossing.
  host.rebuild(page("spec"), keyed);

  const samples = [];
  for (let i = 0; i < 12; i++) {
    host.advance(16);
    const rows = host.rowsById();
    samples.push(rows.get("sr-row-spec").translateY);
  }
  return { startSpec, samples, stats: keyed ? host.stats() : null };
}

// Where a row is actually DRAWN: its laid-out top plus whatever the transform
// is doing to it. A row moved by transform has two numbers and only their sum
// is on screen, which is exactly what the drop below gets wrong when it goes
// wrong.
function drawnY(host, id) {
  const el = host.rowsById().get(id);
  return el.calculatedY + el.translateY;
}

// The DROP, which is the half of this that a passing "the gap opens" hides.
//
// At the drop the list reorders and every shift transform goes to zero in the
// same frame. Keeping the elements across that rebuild — which is the whole
// feature — means the row's new layout position is 88px further down while its
// transform is still +88, so a TRANSITIONED transform starts from a row drawn
// 176px low and slides back. That regression was real, and measured here at
// y=216 jumping to 304; `.sr-row-sorting` is the fix, and this is what holds it.
function runDrop() {
  const host = makeHost();
  host.rebuild(() => M.SortableDemo.dragPage(ORDER, "video", "", 40, 40, true), true);
  host.advance(1000);
  host.rebuild(() => M.SortableDemo.dragPage(ORDER, "video", "spec", 40, 40, true), true);
  host.advance(1000);

  const open = { spec: drawnY(host, "sr-row-spec"), video: drawnY(host, "sr-row-video") };

  // arrayMove, and nothing is being carried any more.
  const dropped = ["demo", "video", "spec", "audio", "extra"];
  host.rebuild(() => M.SortableDemo.dragPage(dropped, "", "", 0, 0, false), true);

  const frames = [{ spec: drawnY(host, "sr-row-spec"), video: drawnY(host, "sr-row-video") }];
  for (let i = 0; i < 6; i++) {
    host.advance(16);
    frames.push({ spec: drawnY(host, "sr-row-spec"), video: drawnY(host, "sr-row-video") });
  }
  return { open, frames };
}

console.log("=== the sortable's gap, rebuilt and reconciled ===");

const keyed = run(true);
const endSpec = STRIDE; // "spec" steps one place DOWN to let "video" in above it

ok("the row starts where it was", keyed.startSpec === 0, `translateY=${keyed.startSpec}`);
ok(
  "and ends one place down",
  Math.abs(keyed.samples[keyed.samples.length - 1] - endSpec) < 0.5,
  `translateY=${keyed.samples[keyed.samples.length - 1]}, want ${endSpec}`,
);

// The whole point. `.sr-row-sorting` transitions transform over 180ms, so at
// 16ms the row must be somewhere in between — not at 0 and not at 88.
const first = keyed.samples[0];
ok(
  "one frame after the crossing it is on its way, not there",
  first > 0.5 && first < endSpec - 0.5,
  `translateY=${first} after 16ms, between 0 and ${endSpec}`,
);

// And it passes through a spread of values rather than snapping.
const distinct = new Set(keyed.samples.map((v) => Math.round(v))).size;
ok("it travels through a range of positions", distinct >= 6, `${distinct} distinct positions in 12 frames`);

ok(
  "and the reconcile kept the rows rather than building them",
  keyed.stats.created === 0 && keyed.stats.kept > 0,
  `kept=${keyed.stats.kept} created=${keyed.stats.created}`,
);

// The drop, which must be invisible: the rows are already sitting where the
// reorder puts them, so not one pixel may move.
const drop = runDrop();
const worst = Math.max(
  ...drop.frames.map((f) => Math.max(Math.abs(f.spec - drop.open.spec), Math.abs(f.video - drop.open.video))),
);
ok(
  "the drop moves nothing — the rows are already where the reorder puts them",
  worst < 0.5,
  `worst displacement ${worst.toFixed(1)}px across 7 frames after the drop` +
    ` (open at spec=${drop.open.spec.toFixed(0)}, video=${drop.open.video.toFixed(0)})`,
);

// The mutation, run for real: the same drag with the reconcile taken out.
const plain = run(false);
const plainFirst = plain.samples[0];
ok(
  "and without it the row is simply THERE — the check can fail",
  !(plainFirst > 0.5 && plainFirst < endSpec - 0.5),
  `translateY=${plainFirst} one frame after the crossing`,
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
