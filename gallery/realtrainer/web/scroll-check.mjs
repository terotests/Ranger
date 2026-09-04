#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The scroll shortcut, against the layout it is a shortcut for.
//
//   node gallery/realtrainer/web/scroll-check.mjs
//
// Scrolling does not change a layout. `EVGLayout.applyScroll` lays the
// content out as if nothing were scrolled and then TRANSLATES the scrolled
// subtree by -scrollTop, so two scroll positions of the same document differ
// by exactly that translate — every width, every line break, every box is the
// same at the top of the page as at the bottom.
//
// `EVGLayout.scrollOnly` moves the subtree by the difference and lays nothing
// out, which is what makes a diary of any length scroll at all: the full path
// measured every string and re-broke every paragraph on every wheel event.
// The whole of that saving rests on the claim in the paragraph above, and
// this is what checks it: the same scrolls driven twice, once through the
// shortcut and once through a forced full re-layout, and the DISPLAY LISTS
// compared as text. Not the boxes — the frame that is actually painted.
//
// The deltas deliberately run off both ends: over-scrolling past the bottom
// and back past the top is where a shortcut that forgets to clamp, or clamps
// against a stale extent, stops agreeing.
//
// Exit code 0 when every frame matches.

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
const COMPACT = read("web", "..", "fixtures", "session.compact");
const SEED = read("fixtures", "reference", "seed.json");
const PLAN = read("fixtures", "machines", "planDialog.machine.json");
const CHAT = read("fixtures", "machines", "chat.machine.json");

const open = (route, w, h) => {
  const app = new RealTrainerDemo();
  app.init(CSS, COMPACT);
  app.loadPlanMachine(PLAN);
  app.loadChatMachine(CHAT);
  app.loadReference(SEED);
  app.setPageSize(w, h);
  app.openRoute(route);
  app.display();
  return app;
};

// Down, past the end, back up, past the top, and a nudge that moves nothing.
const DELTAS = [40, 120, 300, 900, 5000, -30, -200, -9000, 17, 0, -1];
const PAGES = [[980, 760], [390, 844]];
const ROUTES = [
  "/",
  "/calendar/cal-plan?week=2026-02-09",
  "/summary/yearsheet",
  "/yearsheet/y1",
  "/new-calendar",
];

let failed = 0;
let frames = 0;
for (const [w, h] of PAGES) {
  for (const route of ROUTES) {
    const fast = open(route, w, h);
    const full = open(route, w, h);
    let bad = false;
    for (const delta of DELTAS) {
      const movedFast = fast.scrollDocument(delta);
      const movedFull = full.scrollDocument(delta);
      // `setHover` clears the scroll flag, so this one lays out for real.
      full.setHover("");
      const a = fast.displayListJson();
      const b = full.displayListJson();
      frames += 1;
      if (movedFast !== movedFull || a !== b) {
        failed += 1;
        bad = true;
        console.log(
          `  FAIL ${w}x${h} ${route} delta=${delta}` +
            ` moved=${movedFast}/${movedFull} bytes=${a.length}/${b.length}`,
        );
        for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
          if (a[i] !== b[i]) {
            console.log("    shortcut: " + JSON.stringify(a.slice(Math.max(0, i - 80), i + 80)));
            console.log("    layout:   " + JSON.stringify(b.slice(Math.max(0, i - 80), i + 80)));
            break;
          }
        }
        break;
      }
    }
    if (bad === false) console.log(`  PASS ${w}x${h} ${route}`);
  }
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} route(s) diverged — the scroll shortcut is not the layout`);
  process.exit(1);
}
console.log(`  ${frames} scroll frames, every one identical to a full re-layout`);
