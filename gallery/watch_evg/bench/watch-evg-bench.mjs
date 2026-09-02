#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Watch-sized EVG CPU pipeline. Companion to the Android/JVM painter bench.
//
//   node gallery/watch_evg/bench/watch-evg-bench.mjs [--json]
//
// Reports median ms for the bezel face and a CSS list UI at 390×390.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const require = createRequire(import.meta.url);
const AS_JSON = process.argv.includes("--json");

const M = require(path.join(ROOT, "gallery/watch_evg/bin/WatchEvgBench.cjs"));

function time(fn, { warm = 3, runs = 9 } = {}) {
  for (let i = 0; i < warm; i++) fn();
  const t = [];
  for (let i = 0; i < runs; i++) {
    const a = process.hrtime.bigint();
    fn();
    t.push(Number(process.hrtime.bigint() - a) / 1e6);
  }
  t.sort((x, y) => x - y);
  return t[t.length >> 1];
}

function measureBezel(segments) {
  const root = () => M.WatchEvgBench.bezelRoot(segments);
  const build = time(root);
  const sample = root();
  const elements = M.WatchEvgBench.countElements(sample);
  const list = time(() => M.WatchEvgBench.bezelListOnly(sample));
  const svg = time(() => M.WatchEvgBench.bezelSvg(sample));
  const cmds = M.WatchEvgBench.bezelListOnly(sample);
  const svgLen = M.WatchEvgBench.bezelSvg(sample).length;
  return {
    scene: "bezel",
    segments,
    elements,
    cmds,
    svgBytes: svgLen,
    build_ms: build,
    list_ms: list,
    svg_ms: svg,
    total_ms: build + list,
  };
}

function measureList(rows) {
  const css = M.WatchEvgBench.listCss();
  const sheet = () => {
    const s = M.WatchEvgBench.sheetFor(css);
    return s;
  };
  const build = time(() => M.WatchEvgBench.listPage(rows, Math.min(1, rows - 1)));
  const s1 = sheet();
  const styleTree = M.WatchEvgBench.listPage(rows, 1);
  const style = time(() => M.WatchEvgBench.styleOnly(s1, styleTree));

  const s2 = sheet();
  const layTree = M.WatchEvgBench.listPage(rows, 1);
  M.WatchEvgBench.styleOnly(s2, layTree);
  const layout = time(() => M.WatchEvgBench.layoutOnly(layTree));

  const s3 = sheet();
  const dlTree = M.WatchEvgBench.listPage(rows, 1);
  M.WatchEvgBench.styleOnly(s3, dlTree);
  const dlLay = M.WatchEvgBench.layoutOnly(dlTree);
  const list = time(() => M.WatchEvgBench.listOnly(dlTree, dlLay));

  const elements = M.WatchEvgBench.countElements(dlTree);
  const cmds = M.WatchEvgBench.listOnly(dlTree, dlLay);
  const rebuild = time(() => {
    const s = sheet();
    const root = M.WatchEvgBench.listPage(rows, 1);
    M.WatchEvgBench.styleOnly(s, root);
    const lay = M.WatchEvgBench.layoutOnly(root);
    M.WatchEvgBench.listOnly(root, lay);
  });

  return {
    scene: "list",
    rows,
    elements,
    cmds,
    build_ms: build,
    style_ms: style,
    layout_ms: layout,
    list_ms: list,
    rebuild_ms: rebuild,
  };
}

const bezels = [4, 8, 12].map(measureBezel);
const lists = [4, 8, 12].map(measureList);

if (AS_JSON) {
  console.log(JSON.stringify({ host: "node-es6", face: 390, bezel: bezels, list: lists }, null, 2));
  process.exit(0);
}

console.log("=== Watch EVG CPU pipeline @ 390×390 (Node ES6, median ms) ===\n");
console.log("  bezel face (WatchEVGSceneBuilder → display list / SVG)");
console.log("  segs  els  cmds |  build   list    svg | total(build+list)  svgB");
console.log("  ----  ---  ---- | ------ ------ ------ | -----------------  ----");
for (const r of bezels) {
  console.log(
    `  ${String(r.segments).padStart(4)}  ${String(r.elements).padStart(3)}  ${String(r.cmds).padStart(4)} |` +
      ` ${r.build_ms.toFixed(2).padStart(6)} ${r.list_ms.toFixed(2).padStart(6)} ${r.svg_ms.toFixed(2).padStart(6)} |` +
      ` ${r.total_ms.toFixed(2).padStart(17)}  ${r.svgBytes}`,
  );
}

console.log("\n  CSS flex list UI (style → layout → display list)");
console.log("  rows  els  cmds |  build  style layout   list | rebuild");
console.log("  ----  ---  ---- | ------ ------ ------ ------ | -------");
for (const r of lists) {
  console.log(
    `  ${String(r.rows).padStart(4)}  ${String(r.elements).padStart(3)}  ${String(r.cmds).padStart(4)} |` +
      ` ${r.build_ms.toFixed(2).padStart(6)} ${r.style_ms.toFixed(2).padStart(6)} ${r.layout_ms.toFixed(2).padStart(6)} ${r.list_ms.toFixed(2).padStart(6)} |` +
      ` ${r.rebuild_ms.toFixed(2).padStart(7)}`,
  );
}

console.log(`
  Budget reminder: 60 Hz = 16.7 ms/frame; interactive watch UI often 30 Hz = 33 ms.
  Paint cost is measured by the Android/JVM harness (EvgPainter + AwtEvgSurface).
`);
