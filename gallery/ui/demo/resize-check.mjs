#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The breadcrumb giving way to a real panel, and the two-pass loop settling.
//
// `BreadcrumbCtl`'s rule is measured by two conformance specs against widths a
// FIXTURE states. That proves the arithmetic and nothing about whether the
// rule survives contact with a font and a layout engine — and it did not, the
// first three times:
//
//   the widths were measured in one font family and drawn in another, so the
//   arithmetic said the trail fitted while it ran off the end of the card;
//   the separator's spacing was a CSS padding, which is a number the rule
//   cannot see; and EVG has no intrinsic text sizing, so a crumb with no
//   width filled its parent and the LIST ITEM around it did too.
//
// None of those is visible in a unit test of the rule. All three are visible
// here, which is what this file is for.
//
//   node gallery/ui/demo/resize-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/ResizeDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "resize.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const fresh = () => { const d = new M.ResizeDemo(); d.init(CSS); d.displayListJson(); return d; };

// Set the left panel's share and let the demo settle, the way a drag would.
function at(d, pct) {
  const p = d.outer.panels[0];
  const q = d.outer.panels[1];
  q.size += p.size - pct;
  p.size = pct;
  d.rebuild();
  d.displayListJson();
  return d.shownCrumbs();
}

function crumbEls(d) {
  const out = [];
  const walk = (el) => {
    if (/(^|\s)rz-crumb(\s|$)/.test(el.className || "")) out.push(el);
    for (const k of el.children) walk(k);
  };
  walk(d.root);
  return out;
}

console.log("--- the trail gives way, and comes back ---");
{
  const d = fresh();
  ok("wide: the whole trail", at(d, 60) === 5, "shown " + d.shownCrumbs());
  ok("narrower: first, ellipsis and the last two", at(d, 45) === 2, "shown " + d.shownCrumbs());
  ok("narrow: first, ellipsis and where you are", at(d, 25) === 1, "shown " + d.shownCrumbs());
  // The floor. There is nothing left to drop: the first is the way out and the
  // last is where you are, so the trail overflows rather than lying.
  ok("narrower still: it stops at the floor", at(d, 15) === 1, "shown " + d.shownCrumbs());
  ok("and widening brings them back", at(d, 60) === 5, "shown " + d.shownCrumbs());
}

console.log("--- the decision drives the rebuild, not the width ---");
{
  const d = fresh();
  at(d, 60);
  const before = d.rebuilds;
  // Three widths that all keep the same answer. A loop keyed on the WIDTH
  // would rebuild on each; one keyed on the decision rebuilds on none.
  d.outer.panels[0].size = 59;
  d.outer.panels[1].size = 41;
  d.settle();
  d.outer.panels[0].size = 58;
  d.outer.panels[1].size = 42;
  d.settle();
  ok("no rebuild while the answer holds", d.rebuilds === before, before + " -> " + d.rebuilds);
  // And one that changes it.
  d.outer.panels[0].size = 30;
  d.outer.panels[1].size = 70;
  d.settle();
  ok("one rebuild when it changes", d.rebuilds === before + 1, before + " -> " + d.rebuilds);
  // Settling again must not move: the second layout cannot change the width,
  // so one extra pass is always enough and the loop terminates.
  const after = d.rebuilds;
  d.settle();
  d.settle();
  ok("and it settles", d.rebuilds === after, after + " -> " + d.rebuilds);
}

console.log("--- the number the rule used is the number that is drawn ---");
{
  const d = fresh();
  at(d, 60);
  const els = crumbEls(d);
  ok("five crumbs drawn", els.length === 5, "got " + els.length);
  const same = els.every((el, i) => Math.abs(el.calculatedWidth - d.trail.crumbs[i].width) < 0.5);
  ok(
    "each drawn at its measured width",
    same,
    els.map((el, i) => el.calculatedWidth.toFixed(0) + "/" + d.trail.crumbs[i].width.toFixed(0)).join(" "),
  );
  // The whole point of the exercise: the trail has to be INSIDE the panel.
  // The first version passed every unit test of the rule and ran off the card.
  const right = Math.max(...els.map((el) => el.calculatedX + el.calculatedWidth));
  ok("and the trail ends inside the panel", right <= d.panelWidth() + 24 + 1, right.toFixed(0) + " vs " + (d.panelWidth() + 24).toFixed(0));
}

console.log("--- the panels still answer their keyboard ---");
{
  const d = fresh();
  d.setFocus("rz-sep-0");
  const before = d.leftPercent();
  d.key("ArrowRight");
  ok("ArrowRight widens the left panel", d.leftPercent() === before + 5, before + " -> " + d.leftPercent());
  d.key("ArrowUp");
  ok("ArrowUp does nothing to a horizontal group", d.leftPercent() === before + 5, "" + d.leftPercent());
  d.key("Home");
  ok("Home takes it to its minimum", d.leftPercent() === 15, "" + d.leftPercent());
  d.displayListJson();
  ok("and the trail has given way", d.shownCrumbs() === 1, "shown " + d.shownCrumbs());
}

console.log("--- the picture, which is where all three of these were found ---");
{
  // Every check below failed before the fix beside it, and none of the
  // twenty-six above so much as flinched: they measure the RULE, and all
  // three bugs were in what the rule's numbers turned into on screen.
  const d = fresh();
  at(d, 60);
  const byClass = (re) => {
    const out = [];
    const walk = (el) => { if (re.test(el.className || "")) out.push(el); for (const k of el.children) walk(k); };
    walk(d.root);
    return out;
  };
  const mid = (el) => ({ x: el.calculatedX + el.calculatedWidth / 2, y: el.calculatedY + el.calculatedHeight / 2 });

  // 1. `align-items: center` down a divider whose height came from the
  //    group's `align-items: stretch` rather than from a declaration. The
  //    engine asked `height.isSet`, which is where the height came FROM, not
  //    whether there is one — so the grip sat at the top of a 298px divider.
  const seps = byClass(/(^|\s)rz-sep(\s|$)/);
  ok("two dividers", seps.length === 2, "got " + seps.length);
  for (const sep of seps) {
    const grip = sep.children[0];
    const s = mid(sep), g = mid(grip);
    ok(
      "the grip is in the middle of its divider (" + (sep.className.includes("rz-sep-h") ? "horizontal" : "vertical") + ")",
      Math.abs(s.x - g.x) < 1 && Math.abs(s.y - g.y) < 1,
      "sep " + s.x.toFixed(0) + "," + s.y.toFixed(0) + " grip " + g.x.toFixed(0) + "," + g.y.toFixed(0),
    );
  }
  // And the divider spans the group it divides, on the axis it lies across.
  const group = byClass(/(^|\s)rz-group(\s|$)/).find((e) => !/rz-group-v/.test(e.className));
  const vsep = seps.find((e) => !/rz-sep-h/.test(e.className));
  ok(
    "the vertical divider spans the group",
    Math.abs(vsep.calculatedHeight - group.calculatedHeight) < 1,
    vsep.calculatedHeight + " vs " + group.calculatedHeight,
  );

  // 2. The trail shrink-wraps and centres. `.rz-panel` says
  //    `align-items: center`, under which `width: auto` is fit-content, not
  //    stretch — the nav used to fill the panel and the trail hung off its
  //    left edge while the label below it sat in the middle.
  const nav = byClass(/rz-crumbs/)[0];
  const panel = byClass(/(^|\s)rz-panel(\s|$)/)[0];
  const list = byClass(/rz-crumb-list/)[0];
  ok("the trail is no wider than its contents", Math.abs(nav.calculatedWidth - list.calculatedWidth) < 1,
    nav.calculatedWidth + " vs " + list.calculatedWidth);
  ok("and is centred in its panel", Math.abs(mid(nav).x - mid(panel).x) < 1,
    mid(nav).x.toFixed(0) + " vs " + mid(panel).x.toFixed(0));

  // 3. The separator is drawn with the spaces it was written with. Splitting
  //    " / " on " " gives ["", "/", ""], and the wrapper counted CHARACTERS to
  //    decide whether the line was empty — so the leading empty token looked
  //    like nothing at all and the space in front of the slash was dropped.
  //    The slash then sat hard against the crumb before it with a double gap
  //    after. The no-wrap path kept its spaces, so the same string drew two
  //    different ways depending on whether it had a width.
  const cmds = JSON.parse(d.displayListJson()).cmds.filter((c) => c.text);
  const slashes = cmds.filter((c) => c.text.includes("/"));
  ok("four separators drawn", slashes.length === 4, "got " + slashes.length);
  ok("each with the space it was written with", slashes.every((c) => c.text === " / "),
    JSON.stringify(slashes.map((c) => c.text)));
}

console.log("--- and it drags ---");
{
  // The note under the card says "Drag a divider". Nothing above this point
  // has ever pressed one.
  const d = fresh();
  at(d, 60);
  const before = d.leftPercent();
  ok("a divider takes a press", d.beginPress("rz-sep-0", 458, 180) === true);
  ok("moving right widens the left panel", d.dragMove(494, 180) === true && d.leftPercent() > before,
    before + " -> " + d.leftPercent());
  const wide = d.leftPercent();
  ok("and moving back narrows it", d.dragMove(458, 180) === true && d.leftPercent() === before,
    wide + " -> " + d.leftPercent());
  ok("the drop ends the drag", d.dragDrop() === true);
  ok("and a move after the drop does nothing", d.dragMove(600, 180) === false);

  // The inner divider lies across the other axis: it must read the pointer's
  // Y and leave the outer group alone.
  const outerBefore = d.leftPercent();
  const topBefore = d.inner.panels[0].size;
  ok("the inner divider takes a press", d.beginPress("rz-panel-two-group-sep-0", 600, 110) === true);
  ok("dragging it down grows the top panel", d.dragMove(600, 170) === true && d.inner.panels[0].size > topBefore,
    topBefore + " -> " + d.inner.panels[0].size);
  ok("and leaves the outer group where it was", d.leftPercent() === outerBefore,
    outerBefore + " -> " + d.leftPercent());
  d.dragDrop();
  ok("a drag never leaves the panels adding up to something else",
    Math.abs(d.outer.panels[0].size + d.outer.panels[1].size - 100) < 0.001,
    d.outer.panels[0].size + " + " + d.outer.panels[1].size);
}

console.log("--- what a reader gets ---");
{
  const d = fresh();
  at(d, 45);
  const nodes = JSON.parse(d.a11yJson(1, "")).nodes;
  const nav = nodes.filter((n) => n.role === "navigation");
  ok("one named navigation landmark", nav.length === 1 && nav[0].name === "Breadcrumb", JSON.stringify(nav.map((n) => n.name)));
  ok("a list", nodes.filter((n) => n.role === "list").length === 1);
  const links = nodes.filter((n) => n.role === "link");
  ok("three crumbs when collapsed", links.length === 3, "got " + links.length);
  ok(
    "the last is the current page and disabled",
    links[2].current === "page" && links[2].disabled === true,
    JSON.stringify({ current: links[2].current, disabled: links[2].disabled }),
  );
  ok("and the others are not", !links[0].current && !links[1].current);
  // The name is on the ITEM and the glyph is hidden: three dots read aloud is
  // not "some crumbs are missing".
  const dots = nodes.find((n) => (n.id || "").includes("ellipsis-li"));
  ok("the ellipsis is named", dots && dots.name === "More", dots ? JSON.stringify(dots.name) : "absent");
  ok("and its glyph is not announced", !nodes.some((n) => (n.name || "") === "…"));
  // Two separators, both named, both with a value range.
  const seps = nodes.filter((n) => n.role === "separator");
  ok("two separators", seps.length === 2, "got " + seps.length);
  ok("both named", seps.every((s) => (s.name || "").startsWith("Resize")), seps.map((s) => s.name).join(","));
  ok("no lint", d.a11yProblems().length === 0, d.a11yProblems().join("; "));
  ok("no style errors", d.styleErrorCount() === 0);
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
