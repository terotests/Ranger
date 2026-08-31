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
// `line-height: normal`, from the browser capture rather than from a constant
// typed here — the same number the measurer was built against.
const NORMAL_LINE_BOX_EM = JSON.parse(
  fs.readFileSync(path.join(ROOT, "gallery/ui/conformance/oracle/textbox.json"), "utf8"),
).faces["sans-serif"].normalLineBoxEm;

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

// The chart's own commands. Taken from the range the DEMO reports rather than
// guessed from the shape of a command: this used to say "nothing in the
// element tree draws a path, so every path is Vela's", which was true until
// the sidebar's icons became real SVG artwork — and then it was silently
// wrong, and the chart's bounding box grew to include a folder icon 260
// pixels to its left. A property that identifies a thing today is not the
// same as one that defines it.
function chartCmds(d) {
  const list = JSON.parse(d.displayListJson());
  return list.cmds.slice(d.chartFrom, d.chartTo).filter((c) => c.pts !== undefined);
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
  // And ONLY the table. `aria-rowcount` on a `rowgroup` is not allowed — the
  // body holds the rows but owns no count — and it sat there unnoticed,
  // because a lint that reads the fields a node carries cannot tell you the
  // node's ROLE may not carry them. axe found it; this keeps it found.
  ok("and nothing else claims a count",
    nodes.filter((n) => n.rows !== undefined).length === 1,
    JSON.stringify(nodes.filter((n) => n.rows !== undefined).map((n) => n.id + ":" + n.role)));
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
  const wide = [];
  const tall = [];
  // `overflow: hidden` is a container that MEANS to clip — the table body is
  // one, and its window is taller than it on purpose. Everything else that
  // ends past its parent is a bug the picture will not necessarily show,
  // because a canvas paints what it is told and says nothing about the edge.
  const walk = (el) => {
    const clips = el.overflow === "hidden";
    for (const k of el.children) {
      if (k.position !== "absolute") {
        const right = k.calculatedX + k.calculatedWidth;
        const parentRight = el.calculatedX + el.calculatedWidth;
        if (right > parentRight + 0.5) {
          wide.push((k.className || "?") + " ends " + right.toFixed(0) + " inside " + (el.className || "?") + " ending " + parentRight.toFixed(0));
        }
        const bottom = k.calculatedY + k.calculatedHeight;
        const parentBottom = el.calculatedY + el.calculatedHeight;
        if (!clips && bottom > parentBottom + 0.5) {
          tall.push((k.className || "?") + " ends " + bottom.toFixed(0) + " inside " + (el.className || "?") + " ending " + parentBottom.toFixed(0));
        }
      }
      walk(k);
    }
  };
  walk(d.root);
  ok("every element ends inside its parent", wide.length === 0, wide.join("; "));
  // The DOWNWARD arm, which this sweep did not have. The sidebar's account row
  // sat 416 pixels below the bottom of the page and the only thing that
  // noticed was a screenshot with nothing at the bottom of it — a column
  // overflowing is exactly as wrong as a row overflowing and exactly as
  // invisible, and a check with one arm is a check that measures one of them.
  ok("and below it too", tall.length === 0, tall.join("; "));
}

console.log("--- what a reader gets ---");
{
  const d = fresh();
  const nodes = JSON.parse(d.a11yJson(1, "db-range-d90")).nodes;
  const by = (id) => nodes.find((n) => n.id === id);

  // Scoped to THIS list by name, not "the only list on the page" — the
  // sidebar's menus are lists too, and a count over the whole tree would have
  // to be edited every time one arrives, which is a check measuring the page's
  // furniture instead of its claim.
  const figures = nodes.find((n) => n.role === "list" && n.name === "Key figures");
  ok("the figures are a named list", !!figures,
    JSON.stringify(nodes.filter((n) => n.role === "list").map((n) => n.name)));
  ok("of four items",
    nodes.filter((n) => n.role === "listitem" && n.p === figures.id).length === 4,
    "got " + nodes.filter((n) => n.role === "listitem" && n.p === figures.id).length);
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

console.log("--- the sidebar is a landmark, and it says which page you are on ---");
{
  const d = fresh();
  const nodes = JSON.parse(d.a11yJson(1, "db-range-d90")).nodes;
  const by = (id) => nodes.find((n) => n.id === id);

  // A LANDMARK. This is the whole reason a sidebar is not just a column of
  // buttons: it is the thing a reader jumps to. An unnamed one is a landmark
  // they have to open to find out what it is.
  const navs = nodes.filter((n) => n.role === "navigation");
  ok("one navigation landmark", navs.length === 1, "got " + navs.length);
  ok("and it is named", navs.length === 1 && navs[0].name === "Main",
    JSON.stringify(navs.map((n) => n.name)));

  // LINKS, not buttons. The difference is what a reader is told will happen.
  const links = nodes.filter((n) => n.role === "link");
  ok("nine links", links.length === 9, "got " + links.length);
  ok("every one of them named", links.every((n) => (n.name || "").length > 0),
    JSON.stringify(links.map((n) => n.name)));

  // The two menus. The one with words above it is named by them; the one with
  // no label has no name, because a name invented here is a word a reader
  // hears that nobody wrote.
  const menus = nodes.filter((n) => n.role === "list" && n.p === "db-side");
  ok("two menus under it", menus.length === 2, "got " + menus.length);
  ok("the labelled one carries its label",
    menus.some((n) => n.name === "Documents"), JSON.stringify(menus.map((n) => n.name)));
  ok("and the unlabelled one invents nothing",
    menus.some((n) => !n.name), JSON.stringify(menus.map((n) => n.name)));
  ok("every link is an item of one of them",
    links.every((n) => (n.p || "").startsWith("db-menu-")),
    JSON.stringify(links.map((n) => n.p)));

  // The actions are BUTTONS and they sit outside the lists: "Quick Create"
  // goes nowhere, it does something.
  ok("Quick Create is a button", by("db-quick") && by("db-quick").role === "button");
  ok("and it is not in a menu", by("db-quick").p === "db-side", by("db-quick").p);
  // An icon with no words. The name is the entire interface here.
  ok("the inbox has the name its glyph cannot give it",
    by("db-inbox") && by("db-inbox").name === "Inbox",
    by("db-inbox") ? JSON.stringify(by("db-inbox").name) : "absent");
  ok("and the envelope itself is not announced",
    !nodes.some((n) => (n.name || "").includes("\u2709")));
  // Both open menus, and both say so before they are pressed.
  ok("the brand says it opens a menu", by("db-brand") && by("db-brand").haspopup === "menu");
  ok("so does the account", by("db-user") && by("db-user").haspopup === "menu");

  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
}

console.log("--- pressing a link moves the current page in BOTH vocabularies ---");
{
  const d = fresh();
  const currentOf = (dd) => {
    const nodes = JSON.parse(dd.a11yJson(1, "")).nodes;
    return nodes.filter((n) => n.current === "page").map((n) => n.id);
  };
  const filled = (dd) => find(dd, "db-nav-on").map((n) => n.el.id);

  ok("exactly one link is current at rest", currentOf(d).join(",") === "db-nav-dashboard",
    currentOf(d).join(","));
  // The FILL and `aria-current` are set from the same test, so they cannot
  // disagree — a highlighted row that does not say it is current, or a current
  // one that is not highlighted, is one of the two audiences told the truth.
  ok("and the fill is on the same one", filled(d).join(",") === "db-nav-dashboard",
    filled(d).join(","));

  ok("pressing another one is a change", d.press("db-nav-analytics"));
  d.displayListJson();
  ok("the current link moved", currentOf(d).join(",") === "db-nav-analytics",
    currentOf(d).join(","));
  ok("and it is still exactly one", currentOf(d).length === 1, "" + currentOf(d).length);
  ok("the fill moved with it", filled(d).join(",") === "db-nav-analytics", filled(d).join(","));
  // The menu ids share the `db-nav-` prefix's neighbourhood; pressing the list
  // itself must not make a tenth page appear.
  ok("pressing a menu is not pressing a link", d.press("db-menu-docs") === false);
}

console.log("--- the main region scrolls, and the sidebar does not ---");
{
  const d = fresh();
  const scroll = one(d, "db-scroll").el;
  const side = one(d, "db-side").el;
  // The container has to be TALLER-CONTENTED than itself or there is nothing
  // being tested. This is also the check that the layout stopped shrinking:
  // before the scroll container existed, a column with a definite height
  // squeezed its children until they fit and `scrollHeight` was the box.
  ok("there is more content than viewport",
    scroll.scrollHeight > scroll.clientHeight(),
    scroll.scrollHeight + " vs " + scroll.clientHeight());
  ok("so there is something to scroll", scroll.maxScrollTop() > 100,
    "" + scroll.maxScrollTop());

  const cardsY0 = one(d, "db-cards").el.calculatedY;
  const sideY0 = side.calculatedY;
  ok("scrolling down is a change", d.scrollBy(200));
  d.displayListJson();
  ok("the content moved by exactly that much",
    Math.abs((cardsY0 - one(d, "db-cards").el.calculatedY) - 200) < 0.5,
    (cardsY0 - one(d, "db-cards").el.calculatedY).toFixed(1));
  // THE POINT OF A SIDEBAR. It is outside the scroll container, so it does not
  // move — a navigation you have to scroll back up to reach is a navigation
  // that is only there some of the time.
  ok("and the sidebar did not", one(d, "db-side").el.calculatedY === sideY0);

  // Clamped, like a browser: asking for more than there is gives the end, and
  // the demo is told so rather than going on believing it asked for 9000.
  d.scrollTo(9000);
  const max = d.maxScroll();
  ok("scrolling past the end lands on the end", Math.abs(d.scrollY - max) < 0.5,
    d.scrollY + " vs " + max);
  ok("and there is no room left", d.scrollBy(50) === false);
  // Focus first, and it MATTERS which. Home while a range button has focus
  // moves between range buttons and never reaches the page — the control that
  // has focus gets the key, and the scroll region is the fallback for a key
  // nothing else wanted. Proved both ways below.
  d.setFocus("db-range-d90");
  ok("Home goes to the range group while it has focus, not the page",
    d.key("Home") === false || d.scrollY > 0, "" + d.scrollY);
  d.scrollTo(max);
  d.setFocus("db-quick");
  ok("Home goes back to the top", d.key("Home") && d.scrollY === 0, "" + d.scrollY);
  ok("End goes to the bottom", d.key("End") && Math.abs(d.scrollY - max) < 0.5,
    "" + d.scrollY);
  ok("Page Up from the bottom moves", d.key("PageUp") && d.scrollY < max,
    "" + d.scrollY);
  ok("Page Down brings it back", d.key("PageDown") && Math.abs(d.scrollY - max) < 0.5,
    "" + d.scrollY);

  // What is scrolled out of sight is not under the pointer. The whole page is
  // 1336 wide and the region starts at 256; a point near the top of it, after
  // scrolling, must not answer with a card that is now above the viewport.
  d.scrollTo(0);
  d.displayListJson();
  const cards = one(d, "db-cards").el;
  const probeY = cards.calculatedY + 10;
  const insideBefore = d.hitId(600, probeY);
  d.scrollTo(400);
  d.displayListJson();
  const insideAfter = d.hitId(600, probeY);
  ok("the same point had a card under it before the scroll",
    insideBefore.startsWith("db-"), insideBefore);
  ok("and something else after it", insideAfter !== insideBefore,
    insideBefore + " -> " + insideAfter);
}

console.log("--- the sidebar navigates ---");
{
  const PAGES = ["dashboard", "analytics", "lifecycle", "projects", "team",
    "library", "reports", "assistant", "more"];
  const titleOf = (d) => {
    const t = one(d, "db-head-title");
    return t ? t.el.textContent : "(the dashboard, which has no page title)";
  };
  const d = fresh();
  // Every link leads somewhere, every somewhere is a different somewhere, and
  // the tree it produces has no lint against it. Nine links and six builders
  // is a claim that has to hold for all nine.
  const seen = new Set();
  for (const p of PAGES) {
    d.press("db-nav-" + p);
    d.displayListJson();
    const t = titleOf(d);
    ok(`${p}: has content of its own`, !seen.has(t), t);
    seen.add(t);
    ok(`${p}: no lint`, d.a11yProblems().length === 0, d.a11yProblems().join("; "));
    // The whole-tree sweep, on every page and not only the first — a view
    // nobody rendered is a view nobody checked.
    const bad = [];
    const walk = (el) => {
      const clips = el.overflow === "hidden";
      for (const k of el.children) {
        if (k.position !== "absolute") {
          if (k.calculatedX + k.calculatedWidth > el.calculatedX + el.calculatedWidth + 0.5)
            bad.push("wide: " + (k.className || "?"));
          if (!clips && k.calculatedY + k.calculatedHeight > el.calculatedY + el.calculatedHeight + 0.5)
            bad.push("tall: " + (k.className || "?"));
        }
        walk(k);
      }
    };
    walk(d.root);
    ok(`${p}: nothing leaks out of its container`, bad.length === 0, bad.join("; "));
  }

  // Following a link puts you at the TOP of what you followed it to.
  const e = fresh();
  e.scrollTo(300);
  ok("scrolled down the dashboard", e.scrollY > 0, "" + e.scrollY);
  e.press("db-nav-analytics");
  ok("and following a link starts the next page at the top", e.scrollY === 0,
    "" + e.scrollY);

  // The chart is on two pages now, so the emit is not tied to the dashboard.
  // Counted in the LIST, not by asking the spec how many commands it would
  // make: `chartCommandCount` runs Vela on its own and would answer the same
  // number on a page with no chart on it at all.
  const f = fresh();
  f.press("db-nav-analytics");
  ok("the chart is drawn on Analytics too", chartCmds(f).length > 10,
    "" + chartCmds(f).length);
  f.press("db-nav-team");
  ok("and not on a page without one", chartCmds(f).length === 0,
    "" + chartCmds(f).length);
}

console.log("--- the chart is inside the scroll region's clip ---");
{
  // The chart is appended AFTER the tree walk — that is what puts it outside
  // the element tree — so it is also outside every clip the walk pushed and
  // popped, and it has to be clipped by hand. Scrolled up, an unclipped chart
  // draws straight across the sidebar, and nothing else in this file would
  // notice: the element tree is correct, the a11y tree is correct, and the
  // commands are all where the chart wanted them.
  const d = fresh();
  d.scrollTo(300);
  const scroll = one(d, "db-scroll").el;
  const list = JSON.parse(d.displayListJson());
  // Walk the list keeping the clip stack, the way a renderer does, and ask
  // what was in force for each of the chart's path commands.
  const stack = [];
  let unclipped = 0;
  let outside = 0;
  let paths = 0;
  for (let i = 0; i < list.cmds.length; i++) {
    const c = list.cmds[i];
    if (c.k === 4) { stack.push(c); continue; }
    if (c.k === 5) { stack.pop(); continue; }
    if (c.pts === undefined) continue;
    if (i < d.chartFrom || i >= d.chartTo) continue;
    paths++;
    const clip = stack[stack.length - 1];
    if (!clip) { unclipped++; continue; }
    if (clip.y < scroll.calculatedY - 0.5 ||
        clip.y + clip.h > scroll.calculatedY + scroll.calculatedHeight + 0.5 ||
        clip.x < scroll.calculatedX - 0.5 ||
        clip.x + clip.w > scroll.calculatedX + scroll.calculatedWidth + 0.5) outside++;
  }
  ok("the scrolled page still draws a chart", paths > 10, "" + paths);
  ok("every one of its commands is under a clip", unclipped === 0, "" + unclipped);
  ok("and that clip is no bigger than the scroll region", outside === 0, "" + outside);
  // And the geometry really does run past the top edge, or the two checks
  // above would hold on a chart that happened to fit.
  const above = chartCmds(d).some((c) => {
    for (let i = 1; i < c.pts.length; i += 2) if (c.pts[i] < scroll.calculatedY) return true;
    return false;
  });
  ok("with geometry above the top edge to clip", above);
}

console.log("--- an icon and its label sit on one baseline ---");
{
  // Reported from a phone, zoomed in: the sidebar icons sat low against their
  // words. One pixel, every row, and no gate could see it — the tree was
  // right, the a11y tree was right, and the overflow sweep only ever asks
  // whether a box is INSIDE its parent, never where the ink in it landed.
  //
  // The cause was two numbers where there should have been one:
  // `.db-nav-icon` was 18 tall and `.db-nav-text` 20. `align-items: center`
  // centres the BOXES, and a text box's baseline is measured from its own
  // top, so the taller box's baseline is higher. A browser does the same
  // thing with the same declarations — it was never an engine bug.
  //
  // The rule this checks is the narrow one that is actually true: children of
  // a centred row that share a FONT SIZE must share a baseline. Two different
  // sizes on one line have two baselines in CSS as well, so the trend arrow
  // beside its sentence is exempt and rightly so.
  const bad = [];
  const d = fresh();
  for (const page of ["dashboard", "analytics", "lifecycle", "projects", "team", "more"]) {
    d.press("db-nav-" + page);
    d.displayListJson();
    const walk = (el) => {
      if (el.display === "flex" && el.flexDirection === "row" && el.alignItems === "center") {
        const leaves = el.children.filter((k) => (k.textContent || "").length > 0 && k.children.length === 0);
        const bySize = new Map();
        for (const k of leaves) {
          const f = k.fontSize && k.fontSize.pixels;
          if (!bySize.has(f)) bySize.set(f, []);
          bySize.get(f).push(k);
        }
        for (const [size, group] of bySize) {
          if (group.length < 2) continue;
          const bl = group.map((k) => k.calculatedY + k.calculatedBaseline);
          const spread = Math.max(...bl) - Math.min(...bl);
          if (spread > 0.01) {
            bad.push(`${page}: ${el.className || "?"} at ${size}px — ` +
              group.map((k, i) => `${k.className}=${bl[i].toFixed(1)}`).join(" vs "));
          }
        }
      }
      for (const k of el.children) walk(k);
    };
    walk(d.root);
  }
  ok("same size, same baseline, on every page", bad.length === 0,
    [...new Set(bad)].join("; "));

  // And the sidebar's icons, which are no longer text at all. A 16x16 `path`
  // is a BOX, so the claim is the simple one a box can make: its centre and
  // its label's centre are the same line. This is what the reported bug was
  // asking for, and as glyphs it could not be had — a glyph sits on a
  // baseline, and where its ink lands above that baseline is the type
  // designer's business, not the layout's.
  const off = [];
  const e = fresh();
  const walk2 = (el) => {
    if ((el.className || "").startsWith("db-nav")) {
      const icon = el.children.find((k) => (k.className || "").includes("db-nav-icon"));
      const text = el.children.find((k) => (k.className || "").includes("db-nav-text"));
      if (icon && text) {
        const a = icon.calculatedY + icon.calculatedHeight / 2;
        const b = text.calculatedY + text.calculatedHeight / 2;
        if (Math.abs(a - b) > 0.01) off.push(`${el.id}: icon ${a} vs text ${b}`);
      }
    }
    for (const k of el.children) walk2(k);
  };
  walk2(e.root);
  ok("every sidebar icon is centred on its label", off.length === 0, off.join("; "));
  ok("and there are nine of them", find(e, "db-nav-icon").length === 9,
    "" + find(e, "db-nav-icon").length);
  // Real artwork, not a glyph: each icon must actually draw something.
  const list = JSON.parse(e.displayListJson());
  const iconPaths = list.cmds.slice(0, e.chartFrom).filter((c) => c.pts !== undefined);
  ok("drawn as real paths", iconPaths.length >= 9, "" + iconPaths.length);

  // THE RULE THE REPORT WAS ABOUT, stated as the thing a reader can see.
  // `align-items: center` centres BOXES, and a text box taller than the line
  // inside it puts the line at the TOP with the slack underneath — in CSS as
  // in EVG. So centring the box does not centre the words, and the sidebar's
  // labels sat 2.5 pixels high with every declaration in the sheet correct.
  //
  // The check is therefore about the LINE, not the box: in a centred row, a
  // text leaf's line box must be centred on the row. It holds when the leaf
  // has no hand-written height, which is the same thing task #63 has been
  // asking for — the engine already computes that height, and the number
  // somebody typed instead of it is a number that can be wrong.
  const high = [];
  const f = fresh();
  for (const page of ["dashboard", "analytics", "lifecycle", "projects", "team", "more"]) {
    f.press("db-nav-" + page);
    f.displayListJson();
    const walk3 = (el) => {
      if (el.display === "flex" && el.flexDirection === "row" && el.alignItems === "center") {
        const rowCentre = el.calculatedY + el.box.borderWidthPx + el.box.paddingTopPx +
          el.calculatedInnerHeight / 2;
        for (const k of el.children) {
          if (!(k.textContent || "").length || k.children.length) continue;
          if (k.position === "absolute") continue;
          // The line box: it starts at the content top and is as tall as the
          // LEADING — which is not the same as the content box, and assuming
          // it was is how the first version of this check passed a mutation
          // that put `height: 20px` back on the labels. The whole bug is a
          // box that is taller than the line inside it, so a check that
          // measures the box measures nothing.
          const lineTop = k.calculatedY + k.box.borderWidthPx + k.box.paddingTopPx;
          const size = k.fontSize && k.fontSize.isSet ? k.fontSize.pixels : k.inheritedFontSize;
          const lineH = size * (k.lineHeight > 0 ? k.lineHeight : NORMAL_LINE_BOX_EM);
          const off = lineTop + lineH / 2 - rowCentre;
          if (Math.abs(off) > 0.5) {
            high.push(`${page}: ${k.className || "?"} off by ${off.toFixed(2)}`);
          }
        }
      }
      for (const k of el.children) walk3(k);
    };
    walk3(f.root);
  }
  ok("every line of text in a centred row is centred on it",
    high.length === 0, [...new Set(high)].join("; "));
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
