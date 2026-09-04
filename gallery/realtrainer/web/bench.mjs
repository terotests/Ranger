#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What a frame costs, and which half of it.
//
//   node gallery/realtrainer/web/bench.mjs            # the fixture as it ships
//   node gallery/realtrainer/web/bench.mjs 40         # a diary 40x that long
//   node --cpu-prof --cpu-prof-dir=prof \
//        gallery/realtrainer/web/bench.mjs 40         # …and a profile of it
//
// No browser and no GL: this is the app's own work — layout, display list,
// serialisation, accessibility tree — driven by scrolling, which is the
// thing that was slow. A Chromium profile of the page shows the same
// functions with the painter's time added on top, and is the right tool when
// the question is about the GL side; this one answers "which of the app's
// stages is the frame going into", which is what the numbers below are.
//
// The stages are cumulative on purpose: each line adds one thing to the line
// above it, so the DIFFERENCE between two lines is what that stage costs.
// `a11yJson` stands alone because it is not part of drawing at all — it is
// the accessibility tree, and the frame loop rebuilds it only when the page
// has settled.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const BIN = path.join(ROOT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const require_ = createRequire(import.meta.url);
const { RealTrainerDemo } = require_(BIN);

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const CSS = read("web", "realtrainer.css");
const BASE = read("fixtures", "session.compact");

// The mapper reads the FIRST workout, so a long diary is one workout with its
// body repeated — which is what a real one is: a page of rows, not a page of
// headings.
const REPS = Number(process.argv[2] || 1);
const lines = BASE.split("\n");
let compact = lines.slice(0, 5).join("\n");
for (let i = 0; i < REPS; i += 1) compact += "\n" + lines.slice(5).join("\n");

const W = 390;
const H = 844;
const app = new RealTrainerDemo();
app.init(CSS, compact);
app.setPageSize(W, H);
app.setScene("document");
app.display();

const N = Number(process.argv[3] || 200);
const stage = (label, fn) => {
  for (let i = 0; i < 20; i += 1) fn(i);
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < N; i += 1) fn(i);
  const t1 = process.hrtime.bigint();
  console.log("  " + label.padEnd(36) + (Number(t1 - t0) / 1e6 / N).toFixed(2) + " ms");
};
const wheel = (i) => app.scrollDocument(i % 2 ? 24 : -24);

console.log("");
console.log(`  ${REPS}x the fixture, ${W}x${H}, ${N} scroll frames each`);
console.log("");
stage("scrollDocument", wheel);
stage("+ display()", (i) => { wheel(i); app.display(); });
stage("+ displayListJson()", (i) => { wheel(i); app.displayListJson(); });
stage("+ JSON.parse", (i) => { wheel(i); JSON.parse(app.displayListJson()); });
// The pointer, asking what it is over on every move: a hit test, and
// nothing else — the layout is the one the frame already has.
stage("hitId()  (per pointer move)", (i) => { app.hitId(200, 300 + (i % 7) * 60); });
let gen = 0;
stage("a11yJson() + parse  (settled only)", () => { gen += 1; JSON.parse(app.a11yJson(gen, "")); });
console.log("");
const cmds = JSON.parse(app.displayListJson()).cmds.length;
console.log(`  ${cmds} draw commands, ${app.displayListJson().length} bytes`);
console.log("");
