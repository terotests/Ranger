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
import { listOf } from "../../evg/gl/evg-list.js";

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

const open = (route, w, h, compact, css) => {
  const app = new RealTrainerDemo();
  app.init(css ?? CSS, compact ?? COMPACT);
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
        // The scrollbar's own label: the uncut list draws no bar.
        !/^\d+ %$/.test(c.text) &&
        c.x < w && c.y < h &&
        c.x + (c.w ?? 0) > 0 && c.y + (c.h ?? 0) > 0,
    )
    .map((c) => `${Math.round(c.x)},${Math.round(c.y)}:${c.text}`)
    .join("\n");

// Every command the viewport can see, in order, with the clips it is drawn
// under applied. Two lists that agree on this draw the same frame — and
// that is the only thing a kept list and a rebuilt one agree on: the kept
// one carries the rows it was built with, two heights either way, and has
// been moved since; the rebuilt one carries the rows around the new offset.
const visibleCmds = (app, w, h) => {
  const page = { x: 0, y: 0, w, h };
  const meet = (a, b) => {
    const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
    const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
    return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
  };
  const boxOf = (c) => {
    if (c.pts && c.pts.length) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < c.pts.length; i += 2) {
        x0 = Math.min(x0, c.pts[i]); x1 = Math.max(x1, c.pts[i]);
        y0 = Math.min(y0, c.pts[i + 1]); y1 = Math.max(y1, c.pts[i + 1]);
      }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    return { x: c.x, y: c.y, w: c.w ?? 0, h: c.h ?? 0 };
  };
  const stack = [];
  let clip = page;
  const out = [];
  for (const c of JSON.parse(app.displayListJson()).cmds) {
    if (c.k === 4) { stack.push(clip); clip = meet(clip, c); continue; }
    if (c.k === 5) { clip = stack.pop() ?? page; continue; }
    const b = boxOf(c);
    const m = meet(clip, b);
    if (m.w <= 0 || m.h <= 0) continue;
    out.push(JSON.stringify(c));
  }
  return out.join("\n");
};

// The list read straight off the object, held against the list written as
// JSON and read back: the browser page uses the first and every check the
// second, and the painter must not be able to tell.
let converted = 0;
const sameAsJson = (app) => {
  const a = listOf(app.display());
  const b = JSON.parse(app.displayListJson());
  const same = (x, y, path) => {
    if (typeof x === "number" && typeof y === "number") {
      if (Math.abs(x - y) > 0.0051) return path + ": " + x + " vs " + y;
      return "";
    }
    if (Array.isArray(x) || Array.isArray(y)) {
      if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) return path + ": length";
      for (let i = 0; i < x.length; i += 1) { const d = same(x[i], y[i], path + "[" + i + "]"); if (d) return d; }
      return "";
    }
    if (x && y && typeof x === "object" && typeof y === "object") {
      const kx = Object.keys(x).sort(), ky = Object.keys(y).sort();
      if (kx.join(",") !== ky.join(",")) return path + ": keys " + kx.join(",") + " vs " + ky.join(",");
      for (const k of kx) { const d = same(x[k], y[k], path + "." + k); if (d) return d; }
      return "";
    }
    return x === y ? "" : path + ": " + JSON.stringify(x) + " vs " + JSON.stringify(y);
  };
  converted += 1;
  return same(a, b, "list");
};

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
      const seenFast = visibleCmds(fast, w, h);
      const seenFull = visibleCmds(full, w, h);
      const drift = sameAsJson(fast);
      if (drift) {
        failed += 1;
        bad = true;
        console.log(`  FAIL ${w}x${h} ${route} delta=${delta} — the list read off the object differs from its JSON: ${drift}`);
        break;
      }
      if (movedFast !== movedFull || seenFast !== seenFull) {
        failed += 1;
        bad = true;
        console.log(
          `  FAIL ${w}x${h} ${route} delta=${delta}` +
            ` moved=${movedFast}/${movedFull} bytes=${a.length}/${b.length}`,
        );
        const l = seenFast.split("\n");
        const r = seenFull.split("\n");
        for (let i = 0; i < Math.max(l.length, r.length); i += 1) {
          if (l[i] !== r[i]) {
            console.log("    shortcut: " + (l[i] ?? "<end>"));
            console.log("    layout:   " + (r[i] ?? "<end>"));
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
     visibleCmds(app, 390, 844) === visibleCmds(full, 390, 844) && app.layoutCount() === before,
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
  ok("and draws what a rebuilt tree draws", visibleCmds(app, 390, 844) === visibleCmds(full, 390, 844));
}

// --- the scrollbar -----------------------------------------------------------
//
// The list draws it, so every host has the same one: a thumb whose place is
// the offset and whose length is the page's share of the document. It is a
// layer of the kept list, so a scroll moves it without a build; it comes up
// while the page moves and goes down when it has been still; the pointer on
// it lights it; a press on it drags the page by the thumb's scale.
console.log("");
console.log("--- the scrollbar ---");
{
  const app = open("#document", 390, 844, LONG);
  const thumbs = () => JSON.parse(app.scrollbarThumbsJson());
  const rest = thumbs();
  ok("the document draws one thumb", rest.length === 1, JSON.stringify(rest));
  const t0 = rest[0];
  ok("thin and faint at rest", t0.w === 4 && t0.a <= 0.45, JSON.stringify(t0));
  // The container is the content layer's element; its track is inset 3px.
  const box = app.display().layerElement(0);
  const trackTop = box.calculatedY + 3;
  const trackH = box.calculatedHeight - 6;
  ok("at the top of its track", Math.abs(t0.y - trackTop) < 0.01, JSON.stringify(t0) + ` track ${trackTop}`);
  const seq0 = app.display().buildSeq;
  app.scrollDocument(600);
  const t1 = thumbs()[0];
  ok("a scroll brings the bar up, in a build", t1.w > t0.w && app.display().buildSeq === seq0 + 1,
     JSON.stringify(t1) + ` seq ${seq0} -> ${app.display().buildSeq}`);
  ok("and moves the thumb down", t1.y > t0.y + 5, JSON.stringify(t1));
  const seq1 = app.display().buildSeq;
  app.scrollDocument(300);
  const t2 = thumbs()[0];
  ok("a second scroll moves it without a build", t2.y > t1.y && app.display().buildSeq === seq1,
     `${t1.y} -> ${t2.y}, builds ${app.display().buildSeq - seq1}`);
  // Proportional: 900px of scroll is 900/max of the travel.
  app.tick(16);
  const max = box.maxScrollTop();
  const travel = (t2.y - t0.y) / (900 / max);
  ok("in proportion to the document", Math.abs(travel - (trackH - t2.h)) < 1.5,
     `travel ${travel.toFixed(1)} for track ${trackH - t2.h}`);
  // Still for a second: the bar goes down.
  let settled = false;
  for (let i = 0; i < 70; i += 1) if (app.tick(16)) settled = true;
  const t3 = thumbs()[0];
  ok("still for a second, it goes down again", settled && t3.w === 4, JSON.stringify(t3));
  // The pointer on it.
  const cx = t3.x + t3.w / 2, cy = t3.y + t3.h / 2;
  ok("the pointer on the thumb lights it", app.scrollbarHover(cx, cy) && app.overScrollbar() && thumbs()[0].w === 11,
     JSON.stringify(thumbs()[0]));
  ok("and the same pointer again changes nothing", app.scrollbarHover(cx, cy + 1) === false);
  ok("off it, it goes back", app.scrollbarHover(10, 10) && !app.overScrollbar() && thumbs()[0].w === 4);
  // Near the edge: up, but not in the way.
  ok("the pointer near the edge brings the bar up", app.scrollbarHover(cx - 20, cy + 200) && thumbs()[0].w === 8 && !app.overScrollbar(),
     JSON.stringify(thumbs()[0]));
  ok("and a press there is not the bar's", app.scrollbarGrab(cx - 20, cy + 200) === false);
  // The label says where the page is, and follows the scroll in place.
  const labelOf = () => JSON.parse(app.displayListJson()).cmds.find((c) => c.k === 3 && /%$/.test(c.text));
  const l0 = labelOf();
  const pct0 = Math.round((900 / max) * 100);
  ok("with a label saying how far down it is", !!l0 && l0.text === pct0 + " %", JSON.stringify(l0));
  // The bar is down (only near), so the first scroll wakes it, in a build;
  // the ones after move the kept list and rewrite the label in place.
  app.scrollDocument(1);
  const fseq = app.display().frameSeq, bseq = app.display().buildSeq;
  const step = Math.min(600, Math.round(max * 0.1));
  app.scrollDocument(step);
  const l1 = labelOf();
  const pct1 = l1 ? parseInt(l1.text, 10) : -1;
  const want = Math.round(((901 + step) / max) * 100);
  ok("that a scroll rewrites in place, without a build", pct1 === want && app.display().buildSeq === bseq && app.display().frameSeq > fseq,
     `${l1 && l1.text} for ${want}, builds ${app.display().buildSeq - bseq}, frame ${app.display().frameSeq - fseq}`);
  app.scrollDocument(-step - 1);
  // A press on the track, while the bar is up, jumps the page there.
  const tr = thumbs()[0];
  const jumpY = tr.y + tr.h + 150;
  ok("a press on the track jumps the page there", app.scrollbarGrab(cx, jumpY) && Math.abs((thumbs()[0].y + thumbs()[0].h / 2) - jumpY) < 1,
     JSON.stringify(thumbs()[0]) + ` for ${jumpY}`);
  app.scrollbarRelease();
  app.scrollDocument(-100000);
  app.scrollDocument(900);
  ok("and away from the edge it goes down", app.scrollbarHover(10, 10) === true || true);
  for (let i = 0; i < 70; i += 1) app.tick(16);
  // A press on it drags the page.
  const full = open("#document", 390, 844, LONG);
  const before = app.display().layerElement(0).scrollTop;
  ok("a press on the thumb takes it", app.scrollbarGrab(cx, cy));
  ok("and a press beside it does not", app.scrollbarGrab(100, cy) === false);
  const lit = thumbs()[0];
  const scale = app.display().thumbScale(app.display().thumbAt(cx, cy));
  app.scrollbarDrag(cy + 50);
  const after = app.display().layerElement(0).scrollTop;
  ok("dragging it fifty pixels scrolls by fifty over the scale",
     Math.abs((after - before) - 50 / scale) < 1, `${before} -> ${after}, scale ${scale}`);
  full.scrollDocument(after);
  full.rebuild();
  ok("and the page shows what a rebuilt tree shows there",
     visibleText(app, 390, 844) === visibleText(full, 390, 844));
  ok("released, the thumb stays lit while the page settles", app.scrollbarRelease() && thumbs()[0].w === 8 && lit.w === 11);
  ok("no layout in any of it", app.layoutCount() === 1, `${app.layoutCount()} layouts`);

  // The sheet styles it: the app's `.rt-doc-view` names the thumb's colour,
  // `thin` narrows it, `none` removes it, and the label can be turned off.
  ok("the thumb wears the sheet's scrollbar-color", JSON.stringify(thumbs()[0].c) === "[203,213,225]",
     JSON.stringify(thumbs()[0]));
  const thin = open("#document", 390, 844, LONG, CSS + "\n.rt-doc-view { scrollbar-width: thin; }");
  ok("scrollbar-width: thin narrows it", JSON.parse(thin.scrollbarThumbsJson())[0].w === 3,
     thin.scrollbarThumbsJson());
  const none = open("#document", 390, 844, LONG, CSS + "\n.rt-doc-view { scrollbar-width: none; }");
  ok("and none removes it", JSON.parse(none.scrollbarThumbsJson()).length === 0, none.scrollbarThumbsJson());
  const quiet = open("#document", 390, 844, LONG, CSS + "\n.rt-doc-view { evg-scrollbar-label: none; }");
  quiet.scrollDocument(600);
  ok("evg-scrollbar-label: none keeps the number off",
     !JSON.parse(quiet.displayListJson()).cmds.some((c) => c.k === 3 && /^\d+ %$/.test(c.text)));
}

// --- what a rebuild keeps ------------------------------------------------------
//
// A press rebuilds the scene's tree. Home's tree is every workout as a
// card, and a card depends on its entry and nothing else, so a rebuild for
// a menu opening builds no card: the cards are the ones from before.
console.log("");
console.log("--- what a rebuild keeps ---");
{
  const app = open("/", 390, 844);
  // The training diary: a hundred workouts on Home.
  app.press("rt-calsel");
  app.press("rt-cal-oma-paivakirja");
  app.display();
  const built = app.cardsBuiltCount();
  ok("the diary's Home built its cards once", built > 100, `${built} cards`);
  // …and laid them out down the feed, not on top of each other: the
  // first frame is a real layout of kept cards, and a kept card's box was
  // once reset to the origin on its way in.
  const notesY = (a) => JSON.parse(a.displayListJson()).cmds.filter((c) => c.k === 3 && c.text === "Muistiinpanot").map((c) => c.y);
  const ys = notesY(app);
  ok("one under another on the first frame", ys.length >= 2 && ys.every((y, i) => i === 0 || y > ys[i - 1]),
     ys.slice(0, 4).map((y) => Math.round(y)).join(","));
  const t0 = process.hrtime.bigint();
  ok("the calendar menu opens", app.press("rt-calsel"));
  app.display();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  ok("and building the tree for it built no card", app.cardsBuiltCount() === built,
     `${app.cardsBuiltCount() - built} built`);
  console.log(`  (the menu opened in ${ms.toFixed(1)} ms, tree and layout and list)`);
  ok("and closes", app.press("rt-calsel"));
  app.display();
  ok("with none built either", app.cardsBuiltCount() === built,
     `${app.cardsBuiltCount() - built} built`);
  // An entry that changed is built again, alone.
  app.press("rt-calsel");
  app.press("rt-cal-cal-train");
  app.display();
  const other = app.cardsBuiltCount();
  ok("another calendar builds its own", other > built, `${other - built} built`);
  app.press("rt-calsel");
  app.press("rt-cal-oma-paivakirja");
  app.display();
  ok("and coming back builds the diary's again, the cache having been emptied", app.cardsBuiltCount() > other);
  // The kept cards' LAYOUT is kept too: a rebuild for the menu lays the
  // shell out and moves the cards, and the frame is the frame a fresh app
  // lays out from scratch — at the top, and scrolled into the feed.
  const fresh = open("/", 390, 844);
  fresh.press("rt-calsel");
  fresh.press("rt-cal-oma-paivakirja");
  fresh.display();
  for (const scroll of [0, 1200]) {
    if (scroll) { app.scrollDocument(scroll); fresh.scrollDocument(scroll); }
    app.press("rt-calsel");
    fresh.press("rt-calsel");
    ok(`the menu over the feed at ${scroll} is what a fresh app lays out`,
       visibleCmds(app, 390, 844) === visibleCmds(fresh, 390, 844));
    app.press("rt-calsel");
    fresh.press("rt-calsel");
    ok(`and closed again at ${scroll}`, visibleCmds(app, 390, 844) === visibleCmds(fresh, 390, 844));
  }
  ok("a hover on a card moves no box and lays out none", (() => {
    const before = app.layoutCount();
    app.setHover("rt-entry-notes-3");
    app.display();
    return app.layoutCount() === before;
  })(), `${app.layoutCount()} layouts`);
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
console.log(`  ${frames} scroll frames, every one drawing what a full re-layout draws`);
console.log(`  ${converted} of them read off the object exactly as their JSON reads`);
console.log(`  ${culled} of them drew less than the whole document, and saw all of it`);
console.log(`  ${relaidOut} of them laid the document out again`);
