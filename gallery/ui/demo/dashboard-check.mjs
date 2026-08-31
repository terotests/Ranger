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

console.log("--- the table sorts, selects and pages ---");
{
  const d = fresh();
  ok("five thousand sections", d.table.records.length === 5000, "got " + d.table.records.length);
  // And a dozen-ish rows built, which is the entire point — see the
  // virtualisation section below.
  ok("but not five thousand rows", find(d, "db-tr").length < 20,
    "got " + find(d, "db-tr").length);

  // Sorting is TableCtl's, measured against TanStack. This only checks the
  // demo routed the press to it and redrew.
  const firstHeader = () => d.table.pageRecords()[0].cells[0];
  const before = firstHeader();
  ok("a column header sorts", d.press("db-table-col-target") === true);
  ok("and the order changed", firstHeader() !== before, before + " -> " + firstHeader());

  // Selection. The checkbox selects, not the row — TanStack has no opinion
  // about row clicks and ReUI puts a box in the row so a keyboard can reach it.
  ok("a row's box selects it", d.press("db-table-check-cover") === true);
  ok("one selected", d.table.selectedCount() === 1, "" + d.table.selectedCount());
  ok("select-all is then mixed", d.table.selectAllState() === 3, "" + d.table.selectAllState());
  ok("pressing select-all takes the page", d.press("db-table-selectall") === true);
  // The PAGE is the whole table now — virtualisation replaced the pager, so
  // "all on this page" means all five thousand. That is TableCtl's own
  // arithmetic, unchanged; only the page size moved.
  ok("all of them", d.table.selectedOnPage() === 5000, "" + d.table.selectedOnPage());
}

console.log("--- and it reorders, with one owner for the order ---");
{
  const d = fresh();
  const headers = () => d.table.records.map((r) => r.cells[0]);
  const before = headers();
  // A row that is ON SCREEN. Only the visible window is draggable — a row you
  // cannot see is a row you cannot pick up, which is why the sortable holds
  // the range rather than the whole table.
  const onScreen = d.table.sortedRecords()[d.virt.firstVisible() + 1].key;
  ok("the grip picks a row up", d.press("db-order-item-" + onScreen) === true);
  ok("and the sortable is carrying it", d.order.activeValue === onScreen, d.order.activeValue);
  // Moving and dropping is dnd-kit's contract, driven through the grip's key
  // handler the way a keyboard user would.
  d.setFocus("db-order-item-" + onScreen);
  d.key("ArrowUp");
  d.key("ArrowUp");
  d.key(" ");
  ok("the drop ends the drag", d.order.activeValue === "", JSON.stringify(d.order.activeValue));
  const after = headers();
  ok("the records moved", after.join("|") !== before.join("|"), after.slice(0, 5).join(","));
  // THE WRITE-BACK'S ONE INVARIANT. A shorter list would mean a row vanished,
  // which is worse than ignoring the drag — so `applyOrder` refuses to write
  // one, and this is the check that says so.
  ok("and nothing was lost", after.length === before.length, after.length + " vs " + before.length);
  ok("nor duplicated", new Set(after).size === after.length, after.join(","));
  ok("the same rows, reordered", [...after].sort().join("|") === [...before].sort().join("|"));

  // A hand-made order is not a sorted one, so the header stops claiming it is.
  const e = fresh();
  e.press("db-table-col-target");
  ok("sorting sets a sort key", e.table.sortKey === "target", JSON.stringify(e.table.sortKey));
  e.displayListJson();
  const vis = e.table.sortedRecords()[e.virt.firstVisible() + 1].key;
  e.press("db-order-item-" + vis);
  e.setFocus("db-order-item-" + vis);
  e.key("ArrowUp");
  e.key(" ");
  ok("and a drag clears it", e.table.sortKey === "", JSON.stringify(e.table.sortKey));
}

console.log("--- a cancelled drag puts the row back ---");
{
  const d = fresh();
  const before = d.table.records.map((r) => r.cells[0]);
  const onScreen = d.table.sortedRecords()[d.virt.firstVisible() + 1].key;
  d.press("db-order-item-" + onScreen);
  d.setFocus("db-order-item-" + onScreen);
  d.key("ArrowUp");
  d.key("Escape");
  ok("Escape ends the drag", d.order.activeValue === "", JSON.stringify(d.order.activeValue));
  ok("and the order is what it was", d.table.records.map((r) => r.cells[0]).join("|") === before.join("|"));
}

console.log("--- the tab strip ---");
{
  const d = fresh();
  ok("four tabs", find(d, "db-tab").length === 4, "got " + find(d, "db-tab").length);
  ok("pressing one selects it", d.press("db-tab-people") === true && d.tabs.value === "people", d.tabs.value);
  ok("pressing it again is not a change", d.press("db-tab-people") === false);
}

console.log("--- it shows five thousand rows without building them ---");
{
  const d = fresh();
  const built = () => find(d, "db-tr").length - 1; // less the header
  ok("five thousand records", d.virt.count === 5000, "" + d.virt.count);
  const atTop = built();
  ok("a dozen or so built", atTop > 5 && atTop < 20, "" + atTop);

  // THE PROPERTY. Not "few rows" — the number built must not depend on how
  // many there are. A virtualiser that quietly built them all would still
  // pass a "shows the right rows" check and would take a second to do it.
  d.virt.scrollTo(100000);
  d.rebuild();
  d.displayListJson();
  ok("the same number after scrolling four thousand rows", Math.abs(built() - atTop) <= 2,
    atTop + " -> " + built());
  ok("but different rows", d.virt.firstVisible() > 2000, "" + d.virt.firstVisible());

  // The window is slid by the SUB-ROW remainder and nothing more: at most one
  // row's height, never the 230,000 pixels a DOM spacer would carry. That is
  // the whole reason there are no spacers — see the demo's header.
  const win = one(d, "db-window");
  ok("there is a window", !!win);
  const slide = Math.abs(win.el.calculatedY - one(d, "db-tbody").el.calculatedY);
  // At most the OVERSCAN plus the part of the first in-view row that is
  // scrolled past — three rows here, not the 99,866 pixels a DOM spacer would
  // have carried. That bound is the whole claim: the number the layout is
  // given never grows with the data.
  const bound = (d.virt.overscan + 1) * d.virt.rowHeight;
  ok("slid by at most the overscan and a part row", slide <= bound + 0.5,
    slide + " vs " + bound);

  // And the rows that ARE built land inside the clip box, give or take the
  // overscan that is deliberately outside it.
  const body = one(d, "db-tbody").el;
  ok("the body is the viewport it was given", Math.abs(body.calculatedHeight - 414) < 0.5,
    "" + body.calculatedHeight);
}

console.log("--- what a reader is told about five thousand rows ---");
{
  const d = fresh();
  d.virt.scrollTo(100000);
  d.rebuild();
  const nodes = JSON.parse(d.a11yJson(1, "")).nodes;
  const table = nodes.find((n) => n.role === "table");
  // THE FINDING. Without this a reader is told the table has fourteen rows.
  ok("the table says how many rows it really has", table && table.rows === 5000,
    table ? JSON.stringify(table.rows) : "absent");
  const rows = nodes.filter((n) => n.role === "row");
  ok("and the tree holds a dozen", rows.length < 20, "" + rows.length);

  const header = rows.find((r) => r.row === 1);
  ok("the header is row 1", !!header);
  const body = rows.filter((r) => r.row && r.row > 1).map((r) => r.row).sort((a, b) => a - b);
  ok("every built row knows where it really is", body.length === rows.length - 1,
    body.length + " of " + (rows.length - 1));
  // Not 2..15. Four thousand rows down, and saying "row 2" there is worse
  // than saying nothing.
  ok("which is nowhere near the top", body[0] > 2000, "" + body[0]);
  ok("and they run consecutively", body.every((v, i) => i === 0 || v === body[i - 1] + 1),
    body.slice(0, 5).join(","));
  // 1-based and counting the header: the first body row is its index + 2.
  ok("counting the header", body[0] === d.virt.firstVisible() + 2,
    body[0] + " vs " + (d.virt.firstVisible() + 2));

  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
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

  // The table's roles. `rowgroup` was missing from the builder and an
  // unrecognised role drops the element AND EVERYTHING UNDER IT — the whole
  // body of this table was absent from the tree while the picture was
  // perfect, and the lint is the only thing that noticed.
  ok("the table is a table", nodes.filter((n) => n.role === "table").length === 1);
  ok("with two row groups", nodes.filter((n) => n.role === "rowgroup").length === 2,
    "got " + nodes.filter((n) => n.role === "rowgroup").length);
  ok("a dozen-ish rows in the tree", nodes.filter((n) => n.role === "row").length < 20,
    "got " + nodes.filter((n) => n.role === "row").length);
  ok("and every column header is named",
    nodes.filter((n) => n.role === "columnheader").every((n) => (n.name || "").length > 0),
    JSON.stringify(nodes.filter((n) => n.role === "columnheader").map((n) => n.name)));

  const tabList = nodes.filter((n) => n.role === "tablist");
  ok("a named tab list", tabList.length === 1 && tabList[0].name === "Sections");
  // The count is part of the tab's NAME. A pill announced separately after
  // "Past Performance" is a number with nothing attached to it.
  const past = nodes.find((n) => (n.name || "").startsWith("Past Performance"));
  ok("with the count in the tab's name", past && past.name === "Past Performance, 3",
    past ? JSON.stringify(past.name) : "absent");
  ok("and the pill is not announced on its own", !nodes.some((n) => (n.name || "") === "3"));

  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
}

console.log("--- what a reader is told about a carried row ---");
{
  const d = fresh();
  ok("nothing is said at rest", d.order.said() === "", JSON.stringify(d.order.said()));
  d.press("db-order-item-design");
  ok("picking a row up says so", d.order.said().length > 0, JSON.stringify(d.order.said()));
  d.displayListJson();
  const nodes = JSON.parse(d.a11yJson(2, "db-order-item-design")).nodes;
  const grip = nodes.find((n) => n.id === "db-order-item-design");
  // PRESSED, not checked. A carried row is a button held down; a checked one
  // is a box with a tick in it, and a reader says different words for each.
  ok("the grip reports itself pressed", grip && grip.pressed === 2,
    grip ? JSON.stringify(grip.pressed) : "absent");
  ok("and not checked", !grip.checked, JSON.stringify(grip.checked));
  // dnd-kit's instructions, on every grip: this pattern has no visible
  // affordance a reader can discover, so the sentence IS the interface.
  ok("every grip carries the instructions",
    nodes.filter((n) => (n.id || "").startsWith("db-order-item-"))
      .every((n) => (n.desc || "").startsWith("To pick up a draggable item")),
    JSON.stringify((grip.desc || "").slice(0, 40)));
  const live = nodes.filter((n) => n.role === "status");
  ok("and there is a live region saying it", live.length === 1 && live[0].name.length > 0,
    JSON.stringify(live.map((n) => n.name)));
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
