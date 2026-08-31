#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Four cards and a chart that is really drawn.
//
// The chart is the reason this file exists. It is a Vega specification run by
// Vela and emitted into this page's display list, and there are two ways to
// get one there — one of which quietly loses half of it:
//
//   an element carrying the SVG in `svgSource` imports as forty-seven
//   commands of pure geometry and NOT ONE axis label, because the importer
//   walks vector items and a `<text>` is not one;
//   `VlEvgList` emits geometry and text together.
//
// A picture with no numbers on its axes still looks like a chart, which is
// exactly why the check below counts words as well as outlines.
//
//   node gallery/ui/demo/dashboard-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/DashboardDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "dashboard.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => { const d = new M.DashboardDemo(); d.init(CSS); d.displayListJson(); return d; };

function flat(d) {
  const out = [];
  const walk = (el, parent) => { out.push({ el, parent, cls: el.className || "" }); for (const k of el.children) walk(k, el); };
  walk(d.root, null);
  return out;
}
const has = (n, c) => new RegExp("(^|\\s)" + c + "(\\s|$)").test(n.cls);
const find = (d, c) => flat(d).filter((n) => has(n, c));
const one = (d, id) => flat(d).find((n) => n.el.id === id);

// The chart's own commands, told apart from the page's by falling outside the
// element tree — nothing in the tree draws a path, so every path command on
// the page came from Vela.
function chartCmds(d) {
  const list = JSON.parse(d.displayListJson());
  return list.cmds.filter((c) => c.pts !== undefined);
}
function chartTexts(d, box) {
  const list = JSON.parse(d.displayListJson());
  // Text drawn inside the chart's box that no element in the tree accounts
  // for: the axis labels.
  const owned = new Set(flat(d).map((n) => n.el.textContent).filter(Boolean));
  return list.cmds.filter((c) => c.text !== undefined && !owned.has(c.text));
}

console.log("--- the specification runs ---");
{
  const d = fresh();
  ok("no style errors", d.styleErrorCount() === 0, d.styleErrorAt(0) || "");
  ok("and Vela has nothing to say about the spec", d.specErrors() === "", d.specErrors());
  ok("it emits commands", d.chartCommandCount() > 10, "got " + d.chartCommandCount());
}

console.log("--- the chart is drawn, LABELS AND ALL ---");
{
  const d = fresh();
  const box = one(d, "db-chart-box");
  ok("there is a box reserved for it", !!box);

  const paths = chartCmds(d);
  ok("outlines were painted", paths.length >= 8, "got " + paths.length);

  // THE CHECK THIS FILE IS FOR. The SVG route drops every one of these.
  const labels = chartTexts(d, box);
  ok("and so were the axis labels", labels.length >= 8, "got " + labels.length);
  // The y axis of a visitor count runs to the hundreds, so at least one label
  // is a number with three digits — a chart whose labels were all "0" would
  // pass a count and mean nothing.
  ok(
    "which are numbers off the scale",
    labels.some((c) => /^[0-9]{3}$/.test(c.text)),
    labels.map((c) => c.text).slice(0, 10).join(","),
  );

  // Everything Vela drew has to land inside the box the layout reserved.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of paths) {
    for (let i = 0; i < c.pts.length; i += 2) {
      minX = Math.min(minX, c.pts[i]); maxX = Math.max(maxX, c.pts[i]);
      minY = Math.min(minY, c.pts[i + 1]); maxY = Math.max(maxY, c.pts[i + 1]);
    }
  }
  const b = box.el;
  ok(
    "the plot sits inside its box",
    minX >= b.calculatedX - 1 && maxX <= b.calculatedX + b.calculatedWidth + 1 &&
      minY >= b.calculatedY - 1 && maxY <= b.calculatedY + b.calculatedHeight + 1,
    [minX, minY, maxX, maxY].map(Math.round).join(",") + " in " +
      [b.calculatedX, b.calculatedY, b.calculatedWidth, b.calculatedHeight].map(Math.round).join(","),
  );
  // And the y labels sit in the gutter to the LEFT of the plot rather than
  // hanging off the card: emitting at the box's corner put "600" at 29 when
  // the box began at 43, which is what the gutter is for.
  const leftMost = Math.min(...labels.map((c) => c.x));
  ok(
    "the y labels are inside the box too",
    leftMost >= b.calculatedX - 1,
    leftMost + " vs box at " + Math.round(b.calculatedX),
  );
}

console.log("--- the range button redraws it ---");
{
  const d = fresh();
  const ninety = chartCmds(d);
  ok("ninety days to start", d.rangeDays() === 90, "" + d.rangeDays());
  ok("pressing a button changes the range", d.press("db-range-d7") === true);
  ok("to seven", d.rangeDays() === 7, "" + d.rangeDays());
  const seven = chartCmds(d);
  // A week has fewer turns in it than a quarter. Comparing the AREA's point
  // count is the honest way to say the chart was recomputed rather than
  // re-drawn: a cached picture would have the same outline.
  const ptsOf = (cmds) => Math.max(...cmds.map((c) => c.pts.length));
  ok("and the outline has fewer points", ptsOf(seven) < ptsOf(ninety), ptsOf(seven) + " vs " + ptsOf(ninety));
  ok("the subtitle says so", find(d, "db-chart-sub")[0].el.textContent === "Total for the last 7 days",
    JSON.stringify(find(d, "db-chart-sub")[0].el.textContent));
  ok("pressing the same button again is not a change", d.press("db-range-d7") === false);
  // A radio group cannot be emptied — that is the whole reason this is not a
  // toggle group, where clicking the chosen item deselects it and leaves a
  // chart with no range to draw.
  ok("and the range is still set", d.rangeDays() === 7);
}

console.log("--- the arrows move and select together ---");
{
  const d = fresh();
  d.setFocus("db-range-d90");
  ok("ArrowRight selects the next", d.key("ArrowRight") === true && d.rangeDays() === 30, "" + d.rangeDays());
  ok("and again", d.key("ArrowRight") === true && d.rangeDays() === 7, "" + d.rangeDays());
  ok("End goes to the last", d.key("End") === false, "already there");
  d.key("ArrowLeft");
  d.key("ArrowLeft");
  ok("ArrowLeft comes back", d.rangeDays() === 90, "" + d.rangeDays());
  ok("Home is a no-op at the start", d.key("Home") === false);
  ok("and it wraps", d.key("ArrowLeft") === true && d.rangeDays() === 7, "" + d.rangeDays());
}

console.log("--- four cards, one row ---");
{
  const d = fresh();
  const cards = find(d, "db-card");
  ok("four of them", cards.length === 4, "got " + cards.length);
  const ws = cards.map((c) => Math.round(c.el.calculatedWidth));
  ok("the same width", new Set(ws).size === 1, ws.join(","));
  // `align-items: stretch` is the claim: the row decides the height, not the
  // longest string in one of them.
  const hs = cards.map((c) => Math.round(c.el.calculatedHeight));
  ok("and the same height", new Set(hs).size === 1, hs.join(","));
  const tops = cards.map((c) => Math.round(c.el.calculatedY));
  ok("on one line", new Set(tops).size === 1, tops.join(","));
  // The badge at the far end of each card's header, which is the spacer's job.
  for (const c of cards) {
    const top = c.el.children[0];
    const badge = top.children[top.children.length - 1];
    ok(
      "the badge is at the right of " + c.el.id,
      (top.calculatedX + top.calculatedWidth) - (badge.calculatedX + badge.calculatedWidth) < 1,
      badge.calculatedX + "+" + badge.calculatedWidth + " in " + top.calculatedX + "+" + top.calculatedWidth,
    );
  }
}

console.log("--- nothing leaks out of its container ---");
{
  const d = fresh();
  const bad = [];
  const walk = (el) => {
    for (const k of el.children) {
      if (k.position !== "absolute") {
        const right = k.calculatedX + k.calculatedWidth;
        const parentRight = el.calculatedX + el.calculatedWidth;
        if (right > parentRight + 0.5) {
          bad.push((k.className || "?") + " ends " + right.toFixed(0) + " inside " + (el.className || "?") + " ending " + parentRight.toFixed(0));
        }
      }
      walk(k);
    }
  };
  walk(d.root);
  ok("every element ends inside its parent", bad.length === 0, bad.join("; "));
}

console.log("--- what a reader gets ---");
{
  const d = fresh();
  const nodes = JSON.parse(d.a11yJson(1, "db-range-d90")).nodes;
  const by = (id) => nodes.find((n) => n.id === id);

  const lists = nodes.filter((n) => n.role === "list");
  ok("the figures are a named list", lists.length === 1 && lists[0].name === "Key figures",
    JSON.stringify(lists.map((n) => n.name)));
  ok("of four items", nodes.filter((n) => n.role === "listitem").length === 4);
  // A card announces its label AND its number: "Total Revenue" alone tells a
  // reader there is a figure and not what it is.
  ok("each carrying its figure", by("db-revenue") && by("db-revenue").name === "Total Revenue, $1,250.00",
    by("db-revenue") ? JSON.stringify(by("db-revenue").name) : "absent");

  const groups = nodes.filter((n) => n.role === "radiogroup");
  ok("the range is a named radio group", groups.length === 1 && groups[0].name === "Range",
    JSON.stringify(groups.map((n) => n.name)));
  const radios = nodes.filter((n) => n.role === "radio");
  ok("with three options", radios.length === 3, "got " + radios.length);
  ok("exactly one chosen", radios.filter((r) => r.checked === 2).length === 1,
    radios.map((r) => r.checked).join(","));
  ok("and the others say they are not", radios.filter((r) => r.checked === 1).length === 2);

  // A hundred path commands are not something to announce, so the chart is one
  // named image and the trend arrows are decoration.
  const imgs = nodes.filter((n) => n.role === "img");
  ok("the chart is one named image", imgs.length === 1 && imgs[0].name.startsWith("Visitors, "),
    JSON.stringify(imgs.map((n) => n.name)));
  ok("the arrows are not announced", !nodes.some((n) => (n.name || "").includes("↗")));

  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
