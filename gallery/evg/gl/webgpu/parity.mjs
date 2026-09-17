#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Does the WebGPU painter draw the same picture as the WebGL one?
//
//   node gallery/evg/gl/webgpu/parity.mjs [--scene grid-1k-1run] [--shots dir]
//
// A spike that reports only milliseconds proves nothing: the fastest painter
// in the world is the one that draws the wrong thing quickly. This renders one
// display list through both, reads both back and differences them, and writes
// the three PNGs — WebGL, WebGPU, and the amplified difference — so that a
// disagreement can be looked at rather than argued about.
//
// Exit 0 when every scene asked for is within tolerance.

import fs from "node:fs";
import path from "node:path";
import { drive, argOf } from "./harness.mjs";

const arg = argOf(process.argv.slice(2));
const SCENES = (arg("scene", "grid-1k-1run,grid-10k-100runs,scroller-400")).split(",");
const SHOTS = arg("shots", null);
// A share of pixels that may differ by more than a rounding step. Not zero:
// the two paint the same geometry through the same distance field, but the
// sub-pixel arithmetic of two shader compilers is not bit-identical and an
// antialiased edge is where that shows.
const TOLERANCE = Number(arg("tolerance", 2.5));

let failed = 0;
for (const scene of SCENES) {
  const { result, log } = await drive(
    `gallery/evg/gl/webgpu/parity.html?scene=${scene}`, "__parity", { timeout: 180000 });
  if (!result || result.error) {
    console.log(`  FAIL ${scene} — ${result ? result.error : "the page never finished"}`);
    for (const l of log.filter((l) => !/favicon|404|experimental/.test(l)).slice(0, 10)) console.log("        " + l);
    failed += 1;
    continue;
  }
  const ok = result.pctOff <= TOLERANCE;
  if (!ok) failed += 1;
  console.log(
    `  ${ok ? "PASS" : "FAIL"} ${scene.padEnd(20)} ${result.quads} quads in ${result.runs} runs — ` +
    `mean ${result.meanDiff.toFixed(2)}, ${result.pctOff.toFixed(2)}% off, worst ${result.worst}` +
    (result.skipped ? ` (${result.skipped} commands this spike does not draw)` : ""));
  if (typeof SHOTS === "string") {
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const [k, url] of Object.entries(result.shots)) {
      const file = path.join(SHOTS, `${scene}-${k}.png`);
      fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
      console.log("        " + file);
    }
  }
}

console.log("");
console.log(failed ? `${failed} scene(s) disagree` : "the two painters draw the same picture");
process.exit(failed ? 1 : 0);
