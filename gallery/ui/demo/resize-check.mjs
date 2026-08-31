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
