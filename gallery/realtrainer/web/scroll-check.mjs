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

// A diary that does not fit on a screen, which is the only kind that proves
// anything about culling: the fixture as it ships is one workout and every
// row of it is on the page at once. The mapper reads the FIRST workout, so a
// long diary is one workout with its body repeated.
const longDiary = (times) => {
  const lines = COMPACT.split("\n");
  const head = lines.slice(0, 5).join("\n");
  const body = lines.slice(5).join("\n");
  let out = head;
  for (let i = 0; i < times; i += 1) out += "\n" + body;
  return out;
};

const open = (route, w, h, compact) => {
  const app = new RealTrainerDemo();
  app.init(CSS, compact ?? COMPACT);
  app.loadPlanMachine(PLAN);
  app.loadChatMachine(CHAT);
  app.loadReference(SEED);
  app.setPageSize(w, h);
  // `document` is not a route: it is the scene the parsed diary draws in, and
  // the one that gets long.
  if (route === "#document") app.setScene("document");
  else app.openRoute(route);
  app.display();
  return app;
};

// Down a screen at a time — which is where a culled row arrives at the edge
// and has to already be drawn — then past the end, back up, past the top, and
// a nudge that moves nothing.
const DELTAS = [
  40, 120, 300, 700, 700, 700, 700, 700, 900, 5000,
  -30, -200, -700, -700, -700, -9000, 17, 0, -1,
];
const PAGES = [[980, 760], [390, 844]];
const ROUTES = [
  "/",
  "/calendar/cal-plan?week=2026-02-09",
  "/summary/yearsheet",
  "/yearsheet/y1",
  "/new-calendar",
  "#document",
];
// The long-diary pass runs the document scene again with forty times the
// content, where most of it really is off the screen.
const LONG = longDiary(40);

// Every text the viewport can see, in the order it is drawn. This is what a
// culled frame has to have exactly as many of, and in the same order, as an
// uncalled one: a row that scrolls into view and stays blank is a text
// command that went missing.
const visibleText = (app, w, h) =>
  JSON.parse(app.displayListJson())
    .cmds.filter(
      (c) =>
        c.k === 3 &&
        c.x < w && c.y < h &&
        c.x + (c.w ?? 0) > 0 && c.y + (c.h ?? 0) > 0,
    )
    .map((c) => `${Math.round(c.x)},${Math.round(c.y)}:${c.text}`)
    .join("\n");

let failed = 0;
let frames = 0;
let culled = 0;
for (const [w, h] of PAGES) {
  for (const route of ROUTES) {
    const long = route === "#document" ? LONG : undefined;
    const fast = open(route, w, h, long);
    const full = open(route, w, h, long);
    // A third app draws the whole document — nothing left out — so the culled
    // frame can be held against it.
    const uncut = open(route, w, h, long);
    uncut.setCulling(false);
    let bad = false;
    for (const delta of DELTAS) {
      const movedFast = fast.scrollDocument(delta);
      const movedFull = full.scrollDocument(delta);
      // `setHover` clears the scroll flag, so this one lays out for real.
      full.setHover("");
      uncut.scrollDocument(delta);
      const a = fast.displayListJson();
      const b = full.displayListJson();
      frames += 1;
      const seenCulled = visibleText(fast, w, h);
      const seenWhole = visibleText(uncut, w, h);
      if (seenCulled !== seenWhole) {
        failed += 1;
        bad = true;
        console.log(`  FAIL ${w}x${h} ${route} delta=${delta} — culled frame is missing text`);
        const l = seenCulled.split("\n");
        const r = seenWhole.split("\n");
        for (let i = 0; i < Math.max(l.length, r.length); i += 1) {
          if (l[i] !== r[i]) {
            console.log("    culled: " + (l[i] ?? "<end>"));
            console.log("    whole:  " + (r[i] ?? "<end>"));
            break;
          }
        }
        break;
      }
      if (JSON.parse(a).cmds.length < JSON.parse(uncut.displayListJson()).cmds.length) culled += 1;
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
console.log(`  ${culled} of them drew less than the whole document, and saw all of it`);
