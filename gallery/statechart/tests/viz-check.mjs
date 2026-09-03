#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The drawing, checked.
//
//   node gallery/statechart/tests/viz-check.mjs
//
// A picture is easy to leave broken: nobody notices an SVG that stopped being
// written, or an arrow that stopped being drawn, until they open the file. So
// this runs the visualizer over every fixture machine and asks the graph the
// questions a reader would ask of the picture:
//
//   is every state the machine can be in on it
//   is every transition on it, and no transition twice
//   does the entry dot point at the state the machine starts in
//   did the label pass actually move labels off each other and off the boxes
//   does a live run highlight the state it ended in, and its exits
//
// Structure comes from the graph JSON the demo writes rather than from the
// SVG, because the question is what was DRAWN and not how the renderer drew
// it — and the same graph is what the WebGL page and the PDF get. Colour is
// not in that JSON, being a drawing decision, so the highlight is checked in
// the SVG where it actually lands.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const REPO = path.resolve(MODULE, "..", "..");
const BIN = path.join(MODULE, "bin", "statechart_viz.js");
const OUT = path.join(MODULE, "out");

let failed = 0;
const say = (name, cond, detail) => {
  if (cond) console.log(`  PASS ${name}`);
  else {
    failed += 1;
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` — ${detail}`}`);
  }
};

function draw(args) {
  return execFileSync(process.execPath, [BIN, ...args], { cwd: REPO, stdio: "pipe" }).toString();
}

/** The demo reports the label pass: "labels  120 sitting on something → 14". */
function labelClutter(output) {
  const m = /labels\s+(\d+) sitting on something → (\d+)/.exec(output);
  return m ? { before: Number(m[1]), after: Number(m[2]) } : null;
}

function graphOf(stem) {
  return JSON.parse(fs.readFileSync(path.join(OUT, `${stem}.graph.json`), "utf8"));
}

/** Every leaf state, by dot path — what the picture is supposed to have a box for. */
function leavesOf(states, prefix) {
  const out = [];
  for (const [name, node] of Object.entries(states)) {
    const p = prefix ? `${prefix}.${name}` : name;
    if (node.states) out.push(...leavesOf(node.states, p));
    else out.push(p);
  }
  return out;
}

function entryLeaf(config, path_) {
  let node = config;
  let here = path_;
  for (const part of path_.split(".")) node = node.states[part];
  while (node.initial) {
    here = `${here}.${node.initial}`;
    node = node.states[node.initial];
  }
  return here;
}

const CASES = [
  // `labelCap` is what the relaxation actually reaches, with a little room:
  // a number nobody can reach is not a gate, and a number that only goes up is
  // not one either.
  { file: "gallery/statechart/fixtures/machines/trafficLight.machine.json", stem: "statechart-trafficLight", labelCap: 6 },
  { file: "gallery/statechart/fixtures/machines/checkout.machine.json", stem: "statechart-checkout", labelCap: 14 },
  // The real one. A drawing that only ever sees its own fixtures is a drawing
  // of its own fixtures.
  { file: "gallery/realtrainer/fixtures/machines/chat.machine.json", stem: "statechart-chat", labelCap: 18 },
];

for (const { file, stem, labelCap } of CASES) {
  const config = JSON.parse(fs.readFileSync(path.join(REPO, file), "utf8"));
  const output = draw([file]);
  const g = graphOf(stem);
  const ids = new Set(g.nodes.map((n) => n.id));
  const leaves = leavesOf(config.states, "");

  console.log(`\n  ${config.id}\n`);
  say("every state the machine can be in has a box",
      leaves.every((p) => ids.has(p)),
      leaves.filter((p) => !ids.has(p)).join(", "));
  say("no box for a state the machine is never in",
      g.nodes.every((n) => n.id.startsWith("<") || leaves.includes(n.id)),
      g.nodes.map((n) => n.id).filter((id) => !id.startsWith("<") && !leaves.includes(id)).join(", "));

  const fromStart = g.edges.filter((e) => e.source === "<start>");
  say("the entry dot points at the state the machine starts in",
      fromStart.length === 1 && fromStart[0].target === entryLeaf(config, config.initial),
      JSON.stringify(fromStart.map((e) => e.target)));

  const anyNode = ids.has("<any>");
  say("the machine's own transitions come from one source, not from every state",
      anyNode === Boolean(config.on),
      `<any> ${anyNode ? "drawn" : "absent"}, machine-level on ${config.on ? "present" : "absent"}`);

  // One arrow per PAIR — the whole point of merging — so no pair may repeat.
  const pairs = g.edges.map((e) => `${e.source}>${e.target}>${e.dash > 0}`);
  say("no two arrows between the same pair of states",
      new Set(pairs).size === pairs.length,
      pairs.filter((p, i) => pairs.indexOf(p) !== i).join(", "));

  say("every arrow joins two boxes that are on the picture",
      g.edges.every((e) => ids.has(e.source) && ids.has(e.target)));

  say("every arrow says which event takes it",
      g.edges.every((e) => e.source === "<start>" || (e.label ?? "").length > 0),
      g.edges.filter((e) => e.source !== "<start>" && !(e.label ?? "").length)
             .map((e) => `${e.source}→${e.target}`).join(", "));

  // The label pass, gated. A relaxation that silently stopped relaxing would
  // leave a picture that still passes every structural check above.
  const clutter = labelClutter(output);
  say("labels are moved off each other and off the boxes",
      clutter !== null && clutter.after < clutter.before && clutter.after <= labelCap,
      clutter === null ? "the demo did not report the pass"
                       : `${clutter.before} → ${clutter.after}, cap ${labelCap}`);
}

// …and a live run: the point of the module.
console.log(`\n  a run, drawn\n`);
draw([
  "gallery/statechart/fixtures/machines/checkout.machine.json",
  "--run", "ADD_ITEM:sku=a", "ADD_ITEM:sku=b", "CHECKOUT", "SET_CARD:card=4242", "PAY", "APPROVED",
]);
const live = graphOf("statechart-checkout-fulfilment-packing");
const exits = live.edges.filter((e) => e.source === "fulfilment.packing");
say("the state the run ended in is on the picture, with a way out of it",
    live.nodes.some((n) => n.id === "fulfilment.packing") && exits.length === 1,
    JSON.stringify(exits.map((e) => e.label)));

// Colour is not in the graph JSON — it is a drawing decision — so the
// highlight is checked where it actually lands, in the SVG.
const svgOf = (stem) => fs.readFileSync(path.join(OUT, `${stem}.svg`), "utf8");
const count = (text, needle) => text.split(needle).length - 1;
const ACTIVE = "#ffe08a";
const ACCENT = "#b45309";
const hotSvg = svgOf("statechart-checkout-fulfilment-packing");
const coldSvg = svgOf("statechart-checkout");
say("exactly one box is highlighted", count(hotSvg, ACTIVE) === 1, `${count(hotSvg, ACTIVE)} found`);
say("what can be done from there is drawn in the accent colour",
    count(hotSvg, ACCENT) > 0);
say("a drawing of the machine rather than of a run highlights nothing",
    count(coldSvg, ACTIVE) === 0 && count(coldSvg, ACCENT) === 0,
    `${count(coldSvg, ACTIVE)} highlights, ${count(coldSvg, ACCENT)} accents`);

console.log("");
if (failed) {
  console.log(`${failed} problem(s) with the drawing`);
  process.exit(1);
}
console.log("the machine is drawn, and a run is drawn on it");
