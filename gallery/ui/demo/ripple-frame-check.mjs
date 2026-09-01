#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The surface effect must not eat the page it is drawn over.
//
//   node gallery/ui/demo/ripple-frame-check.mjs
//
// WHY THIS EXISTS. `evg-surface-effect: ripple` renders the whole frame into a
// texture and puts it back on the screen through a shader. Making that texture
// left it bound to texture unit 0 — the unit the glyph atlas lives on — so the
// first rippling frame drew every letter, card and image while SAMPLING THE
// SURFACE IT WAS DRAWING INTO. The spec calls that undefined; this driver
// dropped the draws. The page came back with its chart and its icons on it and
// nothing else: no text, no cards, no buttons.
//
// Every check that existed passed on that frame. The effect was declared, the
// touch became its origin, the age advanced, the renderer reported taking the
// post-pass — all true, and all true of a blank page. Nothing was looking at
// the pixels.
//
// It also hid in the one place a person would look. The target is made once
// and reused, so only the FIRST rippling frame after it is made is wrong; on
// the live page that frame is gone in a few milliseconds and every frame after
// it is right. The single-frame render harness draws exactly that frame and
// nothing else, which is why the check lives here.
//
// So: render the dashboard twice, once at rest and once with a drop on it, and
// compare how much of the canvas each frame actually painted. A ratio rather
// than a number, so it calibrates itself against whatever the page happens to
// say today.
//
// Opacity, and not darkness: the first version of this counted dark pixels and
// PASSED on the broken frame. A page whose draws were dropped is transparent,
// the white behind it looks like a white page, and the chart that did survive
// carried enough dark pixels to clear any threshold worth setting. What is
// missing from such a frame is not ink, it is coverage.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

// The renderer's own report, off the finished frame: `covered` is how many
// pixels the frame actually painted and `rippled` is whether the second pass
// ran.
const render = (env) => {
  const out = execFileSync("node", [path.join(HERE, "render.mjs"),
    path.join(ROOT, "tmp", "ripple_frame_check.png")], {
    cwd: ROOT,
    env: { ...process.env, DEMO: "dashboard", ...env },
    encoding: "utf8",
  });
  const line = out.split("\n").find((l) => l.startsWith("painted:"));
  if (!line) throw new Error("the render harness printed no stats:\n" + out);
  return JSON.parse(line.slice("painted:".length));
};

console.log("--- a rippling frame is still the page ---");

const calm = render({});
ok("the page at rest takes no post-pass", calm.rippled === 0, JSON.stringify(calm.rippled));
// The dashboard paints its own background, so a whole frame of it is opaque.
// That is what makes the ratio below mean anything.
ok("and covers the canvas", calm.covered === calm.pixels,
  `${calm.covered} of ${calm.pixels}`);

const rippled = render({ DASH_RIPPLE: "640,400,0.32" });
ok("a drop makes the frame take the post-pass", rippled.rippled === 1,
  JSON.stringify(rippled.rippled));

// A ripple pushes pixels around and can pull a few in from the edges, so the
// count is allowed to move; what it may not do is fall off a cliff. With the
// binding in the wrong order this read 573,298 against 4,809,600 — one pixel
// in eight — because the page came back transparent everywhere its dropped
// draws should have been.
ok("and the page is still on it", rippled.covered > calm.covered * 0.7,
  `${rippled.covered} of ${calm.covered}`);

// The same frame, drawn the same way, minus the effect: everything a display
// list asks for has to come out either way.
ok("with everything the list asked for still drawn",
  rippled.drawn === calm.drawn && rippled.textRuns === calm.textRuns &&
    rippled.paths === calm.paths && rippled.skippedFills === 0,
  `${rippled.drawn}/${rippled.textRuns}/${rippled.paths} vs ` +
    `${calm.drawn}/${calm.textRuns}/${calm.paths}`);

console.log("");
if (failed > 0) { console.log(`RESULT FAIL — ${failed} problem(s)`); process.exit(1); }
console.log("RESULT OK — the ripple draws over the page, not instead of it");
