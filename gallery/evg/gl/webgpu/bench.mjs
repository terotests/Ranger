#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The spike's measurement: the same EVG display lists through the WebGL 2
// painter and the WebGPU one, in the same browser, in one process.
//
//   node gallery/evg/gl/webgpu/bench.mjs
//   node gallery/evg/gl/webgpu/bench.mjs --scene grid-10k-1000runs --draws 200
//   node gallery/evg/gl/webgpu/bench.mjs --json out.json --parity
//   node gallery/evg/gl/webgpu/bench.mjs --serve        # open it yourself, on a phone
//
// WHAT THIS MACHINE CAN AND CANNOT ANSWER. There is no GPU in the container
// this was written in: Chromium draws through SwiftShader, a software
// rasteriser, for both APIs. So
//
//   * the CPU-side numbers — building the instance data, uploading it,
//     encoding and submitting a frame — are REAL. They are the same JS and the
//     same driver-call counts a phone would run, and on a UI workload they are
//     most of what separates the two APIs.
//   * the flushed numbers are NOT a GPU measurement. They are how long
//     SwiftShader took on the CPU, and a phone's tile-based GPU behaves
//     nothing like them, so they are OFF by default (--flushed turns them on)
//     and left out of the table when present.
//
// The conclusion therefore has two halves and only one is settled here.
// `--serve` is for the other half: it prints a URL, and the same page opened
// on an actual phone answers what this container cannot.

import fs from "node:fs";
import { drive, serve, PAGE, argOf } from "./harness.mjs";

const arg = argOf(process.argv.slice(2));

if (arg("serve", false)) {
  const { port } = await serve(Number(arg("port", 8010)));
  console.log(`\n  http://localhost:${port}/${PAGE}?target=canvas`);
  console.log("  from a phone: the same URL with this machine's address instead of localhost");
  console.log("  knobs: &scene=grid-10k-1run&draws=120&dpr=2&parity=1\n");
} else {
  const query = [
    arg("scene", null) ? `scene=${arg("scene")}` : "",
    `draws=${arg("draws", 60)}`,
    `builds=${arg("builds", 5)}`,
    `batches=${arg("batches", 3)}`,
    `dpr=${arg("dpr", 1)}`,
    // A SMALL SURFACE BY DEFAULT, and only when run from here. The CPU cost of
    // building a frame and encoding one does not depend on how many pixels it
    // covers; the RASTERISATION does, and under SwiftShader the rasterisation
    // is on the CPU too. Measuring 200 batched frames of 10 000 quads at
    // 1280x900 took the suite past twenty minutes and it never finished. At
    // 320x240 the numbers this container can honestly report are unchanged and
    // the suite runs in minutes. The page's own default stays 1280x900, for a
    // browser on hardware.
    `w=${arg("w", 320)}`,
    `h=${arg("h", 240)}`,
    `target=${arg("target", "offscreen")}`,
    arg("parity", false) ? "parity=1" : "",
    arg("flushed", false) ? "flushed=1" : "",
  ].filter(Boolean).join("&");

  const { result, log } = await drive(`${PAGE}?${query}`, "__benchDone", { readFrom: "__bench" });
  if (!result) {
    console.error("the page never finished:\n  " + log.slice(0, 30).join("\n  "));
    process.exit(1);
  }
  report(result, log);
  if (!result.complete && !result.error) {
    console.log("INCOMPLETE — the page ran out of time; the scenes above are what it measured.");
  }
  const jsonPath = arg("json", null);
  if (typeof jsonPath === "string") {
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`written: ${jsonPath}`);
  }
  process.exit(result.error ? 1 : 0);
}

function report(out, log) {
  const pad = (s, n) => String(s).padStart(n);
  const padL = (s, n) => String(s).padEnd(n);
  console.log("");
  console.log("EVG display list — WebGL 2 against WebGPU");
  console.log("adapter: " + (out.adapter || "NONE — " + out.why));
  console.log("surface: " + out.w + "×" + out.h + " at dpr " + out.dpr + ", drawn into " + out.target);
  console.log("");
  if (out.error) {
    console.log("ERROR: " + out.error);
    const interesting = log.filter((l) => !/favicon|404|experimental/.test(l));
    if (interesting.length) console.log(interesting.slice(0, 25).map((l) => "  " + l).join("\n"));
    return;
  }
  const cols = [
    ["scene", 22], ["quads", 7], ["runs", 6],
    ["build gl", 10], ["build gpu", 10], ["×", 7],
    ["redraw gl", 10], ["redraw gpu", 11], ["×", 7],
    ["bundle", 8], ["px off", 7],
  ];
  console.log(cols.map(([h, n], i) => (i === 0 ? padL(h, n) : pad(h, n))).join(" "));
  console.log(cols.map(([, n]) => "─".repeat(n)).join(" "));
  for (const [name, r] of Object.entries(out.scenes)) {
    const g = r.webgpu;
    const f = (x) => (x === undefined || x === null ? "—" : x.toFixed(3));
    const ratio = (a, b) => (b ? (a / b).toFixed(2) + "×" : "—");
    console.log([
      padL(name, 22),
      pad(g ? g.quads : r.webgl.quads, 7),
      pad(g ? g.runs : r.webgl.runs, 6),
      pad(f(r.webgl.build), 10), pad(f(g && g.build), 10), pad(g ? ratio(r.webgl.build, g.build) : "—", 7),
      pad(f(r.webgl.redraw), 10), pad(f(g && g.redraw), 11), pad(g ? ratio(r.webgl.redraw, g.redraw) : "—", 7),
      pad(f(g && g.bundle), 8),
      pad(r.parity ? r.parity.pctOff.toFixed(2) + "%" : "—", 7),
    ].join(" "));
  }
  console.log("");
  console.log("ms, median. × above 1 means WebGPU is that many times faster.");
  console.log("CPU-side only — the flushed times are in --json and mean nothing under SwiftShader.");
}
