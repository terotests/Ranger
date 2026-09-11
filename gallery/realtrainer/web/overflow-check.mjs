#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// TEXT THAT DOES NOT FIT THE BOX IT WAS GIVEN.
//
//   node gallery/realtrainer/web/overflow-check.mjs [--all]
//
// The accessibility trace compares NAMES, and a name is the same string
// whether the glyphs land inside the button or half a line below it. So a
// button whose label wrapped to two lines inside a box with `height: 30px`
// on it passed every gate this app has and looked broken on screen — which
// is how "Tallenna ohjeet ja generoi" came to hang out of its own button.
//
// This walks the laid-out tree of every scenario, at every step, and reports
// two things: a text element whose LINES are taller than the box the
// stylesheet gave it, and a box that sticks out of the SIDE of the one
// holding it.
// The measurement is the layout's own: the same wrap, the same line box, the
// same width the painter breaks at — `EVGLayout` computes them and leaves
// them on the element, and this only compares two numbers that are already
// there.
//
// What it does NOT report: an element inside a parent that clips
// (`overflow` is not `visible`), because that is a scroll container and its
// content is meant to be longer than it; and an element with no text.
//
// The fix for a hit is almost never `overflow: hidden` — that throws the
// second line away rather than drawing it in the wrong place. It is
// `min-height` in place of `height`, so the box grows to what is in it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const ALL = process.argv.includes("--all");

const require_ = createRequire(import.meta.url);
const BIN = path.join(ROOT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const { RealTrainerDemo } = require_(BIN);
const CSS = fs.readFileSync(path.join(HERE, "realtrainer.css"), "utf8");
const COMPACT = fs.readFileSync(path.join(ROOT, "fixtures", "session.compact"), "utf8");
const PLAN_MACHINE = fs.readFileSync(path.join(ROOT, "fixtures", "machines", "planDialog.machine.json"), "utf8");
const CHAT_MACHINE = fs.readFileSync(path.join(ROOT, "fixtures", "machines", "chat.machine.json"), "utf8");
const SEED = fs.readFileSync(path.join(ROOT, "fixtures", "reference", "seed.json"), "utf8");

// A tenth of a pixel is rounding, not an overflow: the line box is a product
// of a font size and a ratio and never lands on a whole number.
const SLACK = 0.5;

/**
 * Every element under `el`, with the nearest ancestor that clips carried
 * down — content inside a scroll container is supposed to be longer than the
 * container, and reporting it would bury the real hits.
 */
function* walk(el, clipped = false, parent = null) {
  yield { el, clipped, parent };
  const inside = clipped || el.clipsContent();
  for (const kid of el.children ?? []) yield* walk(kid, inside, el);
}

/**
 * A box that sticks out of the SIDE of the one holding it. Only where the
 * parent does not clip and the child is in the flow: a row of chips that does
 * not wrap draws its last chip past the edge of the card, and the
 * accessibility tree says nothing about it either.
 */
function sideways(el, parent) {
  if (!parent) return null;
  if (el.isAbsolute || el.isOverlay) return null;
  if (parent.clipsContent()) return null;
  const room = parent.box.getInnerWidth(parent.calculatedWidth);
  if (!(room > 0) || !(el.calculatedWidth > 0)) return null;
  const left = el.calculatedX - parent.calculatedX - parent.box.paddingLeftPx - parent.box.borderWidthPx;
  const over = left + el.calculatedWidth - room;
  if (!Number.isFinite(over) || over <= SLACK) return null;
  return { over, width: el.calculatedWidth, room, text: (el.textContent ?? "").slice(0, 40) };
}

/**
 * The lines this element's text actually breaks into, at the width the
 * painter breaks it at, and the height they need. Both come from the
 * layout's own engine, so a hit here is a hit on screen.
 */
function textOverflow(el, lay) {
  const text = el.textContent ?? "";
  if (!text.trim()) return null;
  if ((el.children ?? []).length) return null;
  const engine = lay.getTextEngine();
  const family = el.effectiveFontFamily();
  // `fontSize` is an `EVGUnit`; the engine wants the resolved pixels.
  const size = el.fontSize.pixels;
  // A box the sheet folded away — `display: none` — lays out at 0x0. It is
  // not on screen, so nothing can hang out of it.
  const inner = el.wrapWidth(el.box.getInnerWidth(el.calculatedWidth));
  if (!(inner > 0) || !(size > 0)) return null;
  const lines = engine.lineCount(text, family, size, inner);
  const lineBox = el.lineBoxFor(size, engine.lineHeightFor(family, size));
  const needed = lines * lineBox;
  const have = el.box.getInnerHeight(el.calculatedHeight);
  if (!Number.isFinite(needed) || !Number.isFinite(have)) return null;
  if (needed <= have + SLACK) return null;
  return { lines, needed, have, text };
}

function runScenario(file, hits) {
  const scenario = JSON.parse(fs.readFileSync(file, "utf8"));
  const app = new RealTrainerDemo();
  app.init(CSS, COMPACT);
  app.loadPlanMachine(PLAN_MACHINE);
  app.loadChatMachine(CHAT_MACHINE);
  app.loadReference(SEED);

  const apply = (step) => {
    if (step.tick !== undefined) {
      let spent = 0;
      while (spent < step.tick) {
        const slice = Math.min(16.7, step.tick - spent);
        app.tick(slice);
        spent += slice;
      }
      return;
    }
    if (step.page !== undefined) {
      const [w, h] = step.page.split("x").map(Number);
      app.setPageSize(w, h);
      return;
    }
    if (step.route !== undefined) return void app.openRoute(step.route);
    if (step.pointer !== undefined) return void app.setPointerCoarse(step.pointer === "coarse");
    if (step.fail !== undefined) return void app.armFailure();
    // The same five steps `trace-check.mjs` understands, applied the same
    // way — a press first, then the edit or the key on top of it.
    app.press(step.id);
    if (step.type !== undefined) {
      const n = step.type.length;
      app.applyEdit(step.id, step.type, n, n) || app.typeText(step.type);
      return;
    }
    if (step.key !== undefined) app.keyWith(step.key, false, false);
  };
  const settle = () => {
    let spun = 0;
    while (app.building() && spun < 400) {
      app.tick(16.7);
      spun += 1;
    }
  };

  const look = (where) => {
    const lay = app.laidOut();
    const root = app.root;
    if (!root) return;
    for (const { el, clipped, parent } of walk(root)) {
      const name = el.className || el.styleClass || "(no class)";
      const bad = clipped ? null : textOverflow(el, lay);
      if (bad) hits.push({ kind: "text", scenario: path.basename(file), where, className: name, ...bad });
      // SIDEWAYS IS THE DIRECT PARENT'S BUSINESS, not an ancestor's. A row of
      // buttons inside a panel that scrolls DOWN is still cut off at the
      // panel's right edge — the scroll is the wrong axis to excuse it — so
      // only a child of the container that clips is let off here.
      const wide = sideways(el, parent);
      if (wide) hits.push({ kind: "row", scenario: path.basename(file), where, className: name, ...wide });
    }
  };

  for (const step of scenario.setup ?? []) apply(step);
  settle();
  look("setup");
  for (const step of scenario.steps) {
    apply(step);
    settle();
    look(step.id ?? (step.fail !== undefined ? "fail" : `tick ${step.tick}`));
  }
}

const dir = path.join(ROOT, "fixtures", "scenarios");
const hits = [];
for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  runScenario(path.join(dir, name), hits);
}

// The same class overflowing on every frame of every scenario is ONE bug in
// the stylesheet, and printing it three hundred times hides the other two.
const byClass = new Map();
for (const h of hits) {
  const k = `${h.kind}|${h.className}|${h.text}`;
  if (!byClass.has(k)) byClass.set(k, { ...h, count: 0, scenarios: new Set() });
  const e = byClass.get(k);
  e.count += 1;
  e.scenarios.add(h.scenario);
}
const amount = (r) => (r.kind === "text" ? r.needed - r.have : r.over);
const rows = [...byClass.values()].sort((a, b) => amount(b) - amount(a));

if (!rows.length) {
  console.log(`no text overflows its box — ${fs.readdirSync(dir).filter((f) => f.endsWith(".json")).length} scenarios`);
  console.log("ALL PASS");
  process.exit(0);
}
for (const r of ALL ? rows : rows.slice(0, 40)) {
  if (r.kind === "text") {
    console.log(
      `  ${r.className} — ${r.lines} lines need ${r.needed.toFixed(1)}px, box is ${r.have.toFixed(1)}px (over by ${(r.needed - r.have).toFixed(1)})`,
    );
  } else {
    console.log(
      `  ${r.className} — ${r.width.toFixed(1)}px wide in ${r.room.toFixed(1)}px of room (over by ${r.over.toFixed(1)})`,
    );
  }
  console.log(`      "${r.text}"  ·  ${[...r.scenarios].sort().join(", ")} @ ${r.where}`);
}
if (!ALL && rows.length > 40) console.log(`  … and ${rows.length - 40} more — pass --all`);
console.log(`\n${rows.length} element(s) draw outside the box the sheet gave them`);
process.exit(1);
