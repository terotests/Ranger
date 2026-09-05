#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Does the list say the same thing after crossing a thread?
//
//   npm run evg:binary:check
//
// A host that shares a heap with the engine reads the display list off the
// Ranger object (`evg-list.js`). A host whose engine is in a Worker gets
// `toBinary()` — a positional record per command — and reads it with
// `evg-binary.js`. Both are meant to hand the painter the SAME command
// objects, and this holds them against each other on real frames: every
// scene of the RealTrainer app, at a phone's size, including a frame with a
// scroll layer, four-cornered radii, gradients, rotated runs and paths.
//
// A positional format's failure mode is plausible garbage, not a crash
// (ISSUES #4), so the comparison is key for key and value for value, on
// every command — not a count, not a spot check.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { cmdsOf, shiftsOf } from "./evg-list.js";
import { cmdsOfBinary, binaryStride, FIELDS_READ } from "./evg-binary.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const RT = path.join(ROOT, "gallery", "realtrainer");
const BIN = path.join(RT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const require_ = createRequire(import.meta.url);
const { RealTrainerDemo } = require_(BIN);
const read = (...p) => fs.readFileSync(path.join(RT, ...p), "utf8");

const app = new RealTrainerDemo();
app.init(read("web", "realtrainer.css"), read("fixtures", "session.compact"));
app.loadPlanMachine(read("fixtures", "machines", "planDialog.machine.json"));
app.loadChatMachine(read("fixtures", "machines", "chat.machine.json"));
app.loadReference(read("fixtures", "reference", "seed.json"));
app.setPageSize(390, 844);

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

// The object reader gives the layout's own doubles; the binary gives
// hundredths. `toJson` writes hundredths too, so the binary is exactly the
// JSON's numbers, and the object path is held to the same rounding here.
const r2 = (v) => Math.round(v * 100) / 100;
function normalise(o) {
  const out = {};
  for (const k of Object.keys(o).sort()) {
    const v = o[k];
    if (typeof v === "number") out[k] = r2(v);
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === "number" ? r2(x) : x));
    else if (v && typeof v === "object") out[k] = normalise(v);
    else out[k] = v;
  }
  return out;
}

function compare(label, dl) {
  const a = cmdsOf(dl).map(normalise);
  const bin = dl.toBinary();
  const b = cmdsOfBinary(bin).map(normalise);
  ok(`${label}: the record is ${FIELDS_READ} wide`, binaryStride(bin) === FIELDS_READ, `stride=${binaryStride(bin)}`);
  ok(`${label}: ${a.length} commands both ways`, a.length === b.length, `object=${a.length} binary=${b.length}`);
  let firstDiff = "";
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n && !firstDiff; i += 1) {
    const ja = JSON.stringify(a[i]), jb = JSON.stringify(b[i]);
    if (ja !== jb) firstDiff = `command ${i}:\n      object ${ja}\n      binary ${jb}`;
  }
  ok(`${label}: every command reads the same`, firstDiff === "", firstDiff);
  const kinds = new Set(a.map((c) => c.k));
  return { cmds: a, kinds, layers: a.some((c) => c.layer > 0), rc: a.some((c) => c.rc), grad: a.some((c) => c.gd !== undefined), rot: a.some((c) => c.rot), sh: b.some((c) => c.sh) };
}

const seen = { kinds: new Set(), layers: false, rc: false, grad: false, rot: false, sh: false };
for (const scene of ["loading", "signin", "dashboard", "session", "document"]) {
  app.setScene(scene);
  app.rebuild();
  const r = compare(scene, app.display());
  for (const k of r.kinds) seen.kinds.add(k);
  seen.layers ||= r.layers; seen.rc ||= r.rc; seen.grad ||= r.grad; seen.rot ||= r.rot; seen.sh ||= r.sh;
}
// A scrolled, kept list: the commands moved in place, the shifts beside them.
app.setScene("document");
app.rebuild();
app.scrollDocument(400);
const dl = app.display();
compare("document, scrolled", dl);
ok("the scrolled frame has a layer", cmdsOf(dl).some((c) => c.layer > 0));
ok("and its shifts are readable beside the record", Array.isArray(shiftsOf(dl)));

// What the app never draws, built by hand from the same module: a box with
// three corners rounded and a fourth square, under a drop shadow.
{
  const M = require_(BIN);
  const root = M.EVGElement.createDiv();
  root.setAttribute("width", "200px");
  root.setAttribute("height", "120px");
  const box = M.EVGElement.createDiv();
  box.setAttribute("width", "100px");
  box.setAttribute("height", "40px");
  box.setAttribute("background-color", "#336699");
  box.setAttribute("border-radius", "8px 8px 0px 8px");
  box.setAttribute("box-shadow", "2px 3px 6px #00000055");
  root.addChild(box);
  const lay = new M.EVGLayout();
  lay.setPageSize(200, 120);
  lay.layout(root);
  const dl = new M.EVGDisplayList();
  dl.setTextEngine(lay.getTextEngine());
  dl.build(root);
  // The tree walk does not emit shadows yet (`hasShadow` is written only by
  // hand-built commands), so the one here is built by hand, as the office
  // exporters build theirs.
  const sh = new M.EVGDrawCmd();
  sh.kind = 0; sh.x = 10; sh.y = 60; sh.w = 80; sh.h = 30; sh.r = 20; sh.g = 30; sh.b = 40;
  sh.hasShadow = true; sh.shadowX = 2; sh.shadowY = 3; sh.shadowBlur = 6;
  sh.shadowR = 1; sh.shadowG = 2; sh.shadowB = 3; sh.shadowA = 0.35;
  dl.addCmd(sh);
  const r = compare("a shadowed, four-cornered box", dl);
  seen.rc ||= r.rc; seen.sh ||= r.sh;
}

console.log(`  (kinds seen: ${[...seen.kinds].sort().join(" ")}; layers=${seen.layers} corners=${seen.rc} gradient=${seen.grad} rotation=${seen.rot} shadow=${seen.sh})`);
ok("the frames exercised a scroll layer", seen.layers);
ok("and four-cornered radii", seen.rc);
ok("and a rotation", seen.rot);
ok("and a shadow, which both readers now carry", seen.sh);

console.log(`\npassed = ${passed}  failed = ${failed}`);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
