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
let relaidOut = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};
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
      const before = fast.layoutCount();
      const movedFast = fast.scrollDocument(delta);
      // The frame loop ticks the clock on every frame, scrolling or not, and
      // a tick that does nothing must not cost a layout — that regression is
      // worth ten milliseconds a frame and shows up nowhere but here.
      fast.tick(16.7);
      const movedFull = full.scrollDocument(delta);
      // A rebuilt tree is laid out from scratch: this one lays out for real,
      // and the shortcut's frame has to be the same bytes.
      full.rebuild();
      uncut.scrollDocument(delta);
      const a = fast.displayListJson();
      const b = full.displayListJson();
      frames += 1;
      const laidOut = fast.layoutCount() - before;
      if (laidOut > 0) {
        failed += 1;
        bad = true;
        relaidOut += 1;
        console.log(
          `  FAIL ${w}x${h} ${route} delta=${delta} — the scroll frame laid out ${laidOut}x`,
        );
        break;
      }
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

// --- who lays out ------------------------------------------------------------
//
// A frame asks the app three questions — what is under the pointer, what to
// draw, what a reader is told — and only a change to the page is a reason to
// lay it out again. The one-shot scroll flag this replaced was spent by the
// first question, so the second laid the page out: 13ms per pointer move on
// a long diary, twice, and once more when the page settled and the mirror
// asked. Each of these is a frame that used to cost a layout and must not.
console.log("");
console.log("--- who lays out ---");
{
  const app = open("#document", 390, 844, LONG);
  const full = open("#document", 390, 844, LONG);
  app.scrollDocument(300);
  full.scrollDocument(300);
  app.display();
  full.rebuild();
  full.display();
  const before = app.layoutCount();
  // The pointer, asking what it is over, between two scroll frames.
  const under = app.hitId(200, 400);
  app.scrollDocument(40);
  full.scrollDocument(40);
  const after = app.hitId(200, 400);
  app.display();
  ok("the pointer asking what it is over does not lay out", app.layoutCount() === before,
     `${app.layoutCount() - before} layouts`);
  ok("and is answered from where the page is now", after === full.hitId(200, 400),
     `${under} -> ${after}`);
  // The mirror, rebuilt when the page settles.
  app.a11yJson(1, "");
  ok("the accessibility tree after a scroll does not lay out", app.layoutCount() === before,
     `${app.layoutCount() - before} layouts`);
  // Six finger moves between two frames: the document moves once, by their
  // sum, and the frame shows exactly what a full layout at that offset shows.
  for (let i = 0; i < 6; i += 1) app.scrollDrag(7, 8);
  full.scrollDocument(42);
  full.rebuild();
  ok("six moves between frames draw the frame one layout would",
     app.displayListJson() === full.displayListJson() && app.layoutCount() === before,
     `${app.layoutCount() - before} layouts`);
  // A hover IS a change — the sheet's :hover rule and the transition it
  // starts — but one that moves no box, and the sheet says so: the sheet
  // runs, the layout does not, and the frame is the frame a rebuilt tree
  // with the same hover lays out from scratch.
  app.setHover(after);
  app.hitId(200, 401);
  app.display();
  app.hitId(200, 402);
  full.setHover(after);
  full.rebuild();
  ok("a hover that moves no box is not laid out", app.layoutCount() === before,
     `${app.layoutCount() - before} layouts`);
  ok("and draws what a rebuilt tree draws", app.displayListJson() === full.displayListJson());
}

// --- the throw ---------------------------------------------------------------
//
// A swipe that leaves the glass moving keeps the page moving, and a faster
// swipe carries it further. `EVGFling` makes the distance PROPORTIONAL to the
// speed of the throw — which is a claim worth checking rather than feeling,
// because it is the difference between a page that reads like a phone and one
// that stops dead under your finger.
//
// The swipe is six samples of the same distance, a frame apart, and the glide
// afterwards is driven by `tick` exactly as a host drives it.
console.log("");
console.log("--- the throw ---");
const swipe = (perFrame) => {
  const app = open("#document", 390, 844, LONG);
  app.scrollHalt();
  for (let i = 0; i < 6; i += 1) app.scrollDrag(perFrame, 16);
  const threw = app.scrollRelease();
  let glided = 0;
  let frames = 0;
  while (app.scrollVelocity() !== 0 && frames < 600) {
    glided += app.scrollVelocity() * 16.7;
    app.tick(16.7);
    frames += 1;
  }
  return { threw, glided: Math.round(glided), ms: Math.round(frames * 16.7) };
};

const crawl = swipe(0.5);
ok("a finger creeping along does not throw the page", crawl.threw === false,
   JSON.stringify(crawl));

// 8, 16, 32 and 64 pixels a frame is 0.5, 1, 2 and 4 pixels a millisecond —
// an idle drag, a push, a swipe and a hard flick, in the sizes a finger on a
// phone actually produces.
const slow = swipe(8);
const fast = swipe(16);
const hard = swipe(32);
const flick = swipe(64);
ok("a swipe throws it", slow.threw && slow.glided > 100, JSON.stringify(slow));
// Proportional, so twice the speed is twice the distance. The window is wide
// because the glide stops at a minimum speed rather than at zero, which costs
// the slower throw proportionally more of its tail.
const ratio = fast.glided / slow.glided;
ok("twice as fast goes about twice as far", ratio > 1.8 && ratio < 2.3,
   `${slow.glided}px then ${fast.glided}px — ${ratio.toFixed(2)}x`);
const ratio2 = hard.glided / fast.glided;
ok("and twice again", ratio2 > 1.8 && ratio2 < 2.3,
   `${fast.glided}px then ${hard.glided}px — ${ratio2.toFixed(2)}x`);
ok("a swipe clears more than a screen", hard.glided > 844, hard.glided + "px");
ok("a hard flick clears more than two", flick.glided > 1688, flick.glided + "px");
ok("and it stops", flick.ms > 0 && flick.ms < 4000, flick.ms + "ms");

// A finger going down catches it, the way it does on a phone.
{
  const app = open("#document", 390, 844, LONG);
  for (let i = 0; i < 6; i += 1) app.scrollDrag(32, 16);
  app.scrollRelease();
  ok("a throw is in flight", app.scrollVelocity() !== 0, String(app.scrollVelocity()));
  app.scrollHalt();
  ok("and a finger down catches it", app.scrollVelocity() === 0, String(app.scrollVelocity()));
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log(`  ${frames} scroll frames, every one identical to a full re-layout`);
console.log(`  ${culled} of them drew less than the whole document, and saw all of it`);
console.log(`  ${relaidOut} of them laid the document out again`);
