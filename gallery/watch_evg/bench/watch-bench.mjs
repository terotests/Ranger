#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The same three watch screens, on the other host.
//
// `scripts/run-jvm.sh` is the number that matters for Wear OS, because a Wear
// app is Kotlin. This one exists for two reasons anyway:
//
//   * `gallery/watch_evg` itself ships a JavaScript build — the watch dev
//     emulator consumes `generated/watch_evg.js` — so "EVG in JS on a watch"
//     is a real deployment shape and not a straw man;
//   * two hosts disagreeing about which phase is expensive is how you find out
//     that a phase's cost is a property of one runtime rather than of EVG.
//
//   node gallery/watch_evg/bench/watch-bench.mjs [--json]
//
// Build first: bash gallery/watch_evg/bench/scripts/build-ranger.sh

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(HERE, "bin/WatchBench.cjs"));
const B = M.WatchBench;
const CSS = fs.readFileSync(path.join(HERE, "watch.css"), "utf8");

const AS_JSON = process.argv.includes("--json");

const WARM = 300;
const RUNS = 51;

function time(fn, warm = WARM, runs = RUNS) {
  for (let i = 0; i < warm; i++) fn();
  const t = [];
  for (let i = 0; i < runs; i++) {
    const a = process.hrtime.bigint();
    fn();
    t.push(Number(process.hrtime.bigint() - a) / 1e6);
  }
  t.sort((x, y) => x - y);
  return t[runs >> 1];
}

const SCENES = [
  { name: "face", kind: 0, n: 60, v: 7 },
  { name: "list", kind: 1, n: 12, v: 2 },
  { name: "workout", kind: 2, n: 0, v: 148 },
];

// The cold pass first and once, before anything is warm — same rule as the JVM
// harness, and the same reason: a watch app draws its first frame on cold code.
const cold = {};
for (const s of SCENES) {
  const a = process.hrtime.bigint();
  const sh = B.sheetFor(CSS);
  const root = B.scene(s.kind, s.n, s.v);
  B.styleOnly(sh, root);
  const lay = B.layoutOnly(root);
  B.listOnly(root, lay);
  cold[s.name] = Number(process.hrtime.bigint() - a) / 1e6;
}

const cssParse = time(() => B.sheetFor(CSS), 20, 21);
const calibrate = time(() => B.calibrate(2_000_000), 3, 9);

function measure(s) {
  const build = time(() => B.scene(s.kind, s.n, s.v));

  const s1 = B.sheetFor(CSS);
  const styleTree = B.scene(s.kind, s.n, s.v);
  const style = time(() => B.styleOnly(s1, styleTree));

  const s2 = B.sheetFor(CSS);
  const layTree = B.scene(s.kind, s.n, s.v);
  B.styleOnly(s2, layTree);
  const layout = time(() => B.layoutOnly(layTree));

  const s3 = B.sheetFor(CSS);
  const dlTree = B.scene(s.kind, s.n, s.v);
  B.styleOnly(s3, dlTree);
  const dlLay = B.layoutOnly(dlTree);
  const displayList = time(() => B.listOnly(dlTree, dlLay));

  const sR = B.sheetFor(CSS);
  const rebuild = time(() => {
    const root = B.scene(s.kind, s.n, s.v);
    B.styleOnly(sR, root);
    B.listOnly(root, B.layoutOnly(root));
  });

  const s4 = B.sheetFor(CSS);
  const live = B.scene(s.kind, s.n, s.v);
  const retained = time(() => {
    B.styleOnly(s4, live);
    B.listOnly(live, B.layoutOnly(live));
  });

  // The clock's seconds move. One text run; nothing else.
  const s5 = B.sheetFor(CSS);
  const tickTree = B.scene(s.kind, s.n, s.v);
  B.styleOnly(s5, tickTree);
  let tickLay = B.layoutOnly(tickTree);
  B.listOnly(tickTree, tickLay);
  let sec = 0;
  const tick = time(() => {
    sec = (sec + 1) % 60;
    B.setClock(tickTree, sec);
    B.styleOnly(s5, tickTree);
    if (!B.layoutClean(s5)) tickLay = B.layoutOnly(tickTree);
    B.listOnly(tickTree, tickLay);
  });

  // The crown turned.
  const s6 = B.sheetFor(CSS);
  const scrollTree = B.scene(s.kind, s.n, s.v);
  B.styleOnly(s6, scrollTree);
  let off = 0;
  const scroll = time(() => {
    off = off > 240 ? 0 : off + 3;
    B.setScroll(scrollTree, off);
    B.listOnly(scrollTree, B.layoutOnly(scrollTree));
  });

  return {
    name: s.name,
    elements: B.countElements(dlTree),
    commands: B.listOnly(dlTree, dlLay),
    build, style, layout, displayList, tick, scroll, retained, rebuild,
    cold: cold[s.name],
    tickStyled: B.styledCount(s5),
    tickSkipped: B.skippedCount(s5),
    tickLayoutClean: B.layoutClean(s5),
  };
}

// Twice, reporting the second — the phases are tens of microseconds and a
// phase timed first sees a less-optimised function than the same phase timed
// last.
SCENES.map(measure);
const rows = SCENES.map(measure);

if (AS_JSON) {
  console.log(JSON.stringify({ node: process.version, calibrateMs: calibrate, cssParseMs: cssParse, scenes: rows }, null, 2));
} else {
  const f = (v) => v.toFixed(3).padStart(7);
  console.log("");
  console.log(`=== EVG on a 454x454 watch panel — ms per frame, JavaScript on Node ${process.version} ===`);
  console.log(`    (median of ${RUNS} after ${WARM} warm-up runs; calibrate(2e6) = ${calibrate.toFixed(1)} ms, stylesheet parse ${cssParse.toFixed(2)} ms)`);
  console.log("");
  console.log("  scene    elems  cmds |   build   style  layout    list |    tick  scroll retained rebuild |    cold");
  console.log("  -------  -----  ---- | ------- ------- ------- ------- | ------- ------- -------- ------- | -------");
  for (const r of rows) {
    console.log(
      `  ${r.name.padEnd(7)}  ${String(r.elements).padStart(5)}  ${String(r.commands).padStart(4)} |` +
        ` ${f(r.build)} ${f(r.style)} ${f(r.layout)} ${f(r.displayList)} |` +
        ` ${f(r.tick)} ${f(r.scroll)} ${f(r.retained)} ${f(r.rebuild)} | ${f(r.cold)}`,
    );
  }
  console.log("");
  for (const r of rows) {
    console.log(`  tick on ${r.name}: ${r.tickStyled} element(s) re-styled, ${r.tickSkipped} skipped, layout ${r.tickLayoutClean ? "SKIPPED" : "run"}`);
  }
  console.log("");
  console.log("  There is no `paint` column here: the JS build has no CPU rasteriser to");
  console.log("  paint through. `run-jvm.sh` paints the same list with Java2D.");
}
