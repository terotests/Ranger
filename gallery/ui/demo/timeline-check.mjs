#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What the timeline draws, checked against the only oracle there is.
//
// There is no headless library under ReUI's Timeline and its source could not
// be reached from here, so there is no trace to diff against and no entry in
// `behaviours.json` — a conformance spec would be a step that cannot fail.
// What there IS is a picture of the reference rendering `defaultValue={3}`
// over four items, and a picture is a measurement:
//
//     the DOT is filled for steps 1, 2 and 3, and pale for 4
//     the LINE is dark between 1-2 and 2-3, and pale between 3-4
//
// So the dot is `step <= value` and the line is `step < value`, and THEY ARE
// NOT THE SAME PREDICATE. That is the whole finding, and it is what most of
// this file exists to hold in place: the obvious implementation gives both the
// same completed flag and draws a dark line under item 3.
//
// The rest checks the things that were wrong on the way here and would be
// wrong again silently: the icons' colour (a mis-spelt property left every
// icon black and the page still looked plausible), and the line reaching the
// next dot (`align-items: stretch` and `fill` both do less than they read as).
//
//   node gallery/ui/demo/timeline-check.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/TimelineDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "timeline.css"), "utf8");

const DOT_DONE = "#18181b";
const DOT_PALE = "#e8e8ea";
const LINE_DONE = "#18181b";
const LINE_PALE = "#e4e4e7";

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed++;
    console.log("  PASS " + name);
  } else {
    failed++;
    console.log("  FAIL " + name + (detail ? " — " + detail : ""));
  }
}

const hex = (c) =>
  "#" + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");

// The rail, read off the LIVE ELEMENTS rather than the display list, because
// the question is what each row decided and not how it was flattened.
function rail(demo) {
  const rows = [];
  const walk = (el) => {
    if (/(^|\s)tl-item(\s|$)/.test(el.className || "")) {
      let dot = null;
      let line = null;
      let icon = null;
      const dig = (n) => {
        const c = n.className || "";
        if (/(^|\s)tl-dot(\s|$)/.test(c)) dot = n;
        if (/(^|\s)tl-line(\s|$)/.test(c)) line = n;
        if (/(^|\s)tl-icon(\s|$)/.test(c)) icon = n;
        for (const k of n.children) dig(k);
      };
      dig(el);
      rows.push({
        id: el.id,
        top: el.calculatedY,
        height: el.calculatedHeight,
        dotTop: dot ? dot.calculatedY : null,
        dotBottom: dot ? dot.calculatedY + dot.calculatedHeight : null,
        dotDone: dot ? hex(dot.backgroundColor) === DOT_DONE : false,
        iconColour: icon ? hex(icon.fillColor) : null,
        hasLine: !!line,
        lineTop: line ? line.calculatedY : null,
        lineBottom: line ? line.calculatedY + line.calculatedHeight : null,
        lineDone: line ? hex(line.backgroundColor) === LINE_DONE : false,
      });
    }
    for (const k of el.children) walk(k);
  };
  walk(demo.root);
  return rows;
}

function at(value) {
  const d = new M.TimelineDemo();
  d.init(CSS);
  d.setValue(value);
  // Past every transition, so a colour read here is the settled one and not a
  // frame of the fade between them.
  for (let i = 0; i < 20; i++) d.tick(20);
  d.displayListJson();
  return { demo: d, rows: rail(d) };
}

console.log("--- the two predicates are not the same one ---");
{
  const { rows } = at(3);
  ok("four events", rows.length === 4, "got " + rows.length);
  ok(
    "dots 1-3 are filled and 4 is not",
    rows.map((r) => r.dotDone).join() === "true,true,true,false",
    rows.map((r) => r.dotDone).join(),
  );
  // The load-bearing one. With a single `completed` flag driving both, item 3's
  // line comes out dark and this line reads true,true,true.
  ok(
    "lines 1-2 and 2-3 are dark, 3-4 is pale",
    rows
      .filter((r) => r.hasLine)
      .map((r) => r.lineDone)
      .join() === "true,true,false",
    rows.filter((r) => r.hasLine).map((r) => r.lineDone).join(),
  );
  ok(
    "the row that is done but not joined is row 3",
    rows[2].dotDone === true && rows[2].lineDone === false,
    `done=${rows[2].dotDone} joined=${rows[2].lineDone}`,
  );
}

console.log("--- the value drives the whole picture ---");
for (const [value, dots, lines] of [
  [0, "false,false,false,false", "false,false,false"],
  [1, "true,false,false,false", "false,false,false"],
  [2, "true,true,false,false", "true,false,false"],
  [4, "true,true,true,true", "true,true,true"],
]) {
  const { rows } = at(value);
  ok(
    `value ${value}: dots`,
    rows.map((r) => r.dotDone).join() === dots,
    rows.map((r) => r.dotDone).join(),
  );
  ok(
    `value ${value}: lines`,
    rows.filter((r) => r.hasLine).map((r) => r.lineDone).join() === lines,
    rows.filter((r) => r.hasLine).map((r) => r.lineDone).join(),
  );
}

console.log("--- the rail is joined up ---");
{
  const { rows } = at(3);
  ok("the last event draws no line", rows[3].hasLine === false);
  ok("every other event draws one", rows.slice(0, 3).every((r) => r.hasLine));
  // Two pixels clear of each dot, top and bottom. Not "touching": the
  // reference's own numbers say so — `translate-y-6.5` starts the line 26px
  // down against a 24px dot, and its calc takes 28 off the height, which is
  // 2 above and 2 below. The bug this first caught was the whole 4 sitting at
  // the bottom, which no screenshot was going to show; the one before that was
  // a line stopping forty pixels short because `stretch` had nothing to
  // stretch against.
  for (let i = 0; i < 3; i++) {
    ok(
      `line ${i + 1} stops two above the next dot`,
      Math.abs(rows[i + 1].dotTop - rows[i].lineBottom - 2) < 0.5,
      `line ends ${rows[i].lineBottom}, next dot starts ${rows[i + 1].dotTop}`,
    );
    ok(
      `line ${i + 1} starts two below its own`,
      Math.abs(rows[i].lineTop - rows[i].dotBottom - 2) < 0.5,
      `line starts ${rows[i].lineTop}, dot ends ${rows[i].dotBottom}`,
    );
  }
}

console.log("--- the icons are drawn, and coloured by the dot ---");
{
  const { demo, rows } = at(3);
  ok(
    "a filled dot carries a white icon",
    rows.slice(0, 3).every((r) => r.iconColour === "#ffffff"),
    rows.map((r) => r.iconColour).join(),
  );
  ok("a pale dot carries a dark one", rows[3].iconColour === "#18181b", rows[3].iconColour);

  // The four lucide files have 5, 5, 6 and 3 shapes. Every one is a stroke and
  // none is a fill, which is what `fill="none" stroke="currentColor"` means —
  // so a fill command here would mean the importer had invented paint.
  const cmds = JSON.parse(demo.displayListJson()).cmds;
  const strokes = cmds.filter((c) => c.k === 7);
  ok("nineteen stroked shapes", strokes.length === 19, "got " + strokes.length);
  ok("no filled ones", cmds.filter((c) => c.k === 6).length === 0);
  const colours = new Set(strokes.map((c) => JSON.stringify(c.c)));
  ok(
    "in exactly two colours",
    colours.size === 2,
    [...colours].join(" "),
  );
  // `currentColor` resolving to the element's fill is the whole reason one copy
  // of the artwork serves both dots. Black would mean it fell back to the SVG
  // default and nobody would notice on a pale dot.
  ok(
    "and neither of them is the parser's default black",
    !colours.has("[0,0,0,1]"),
    [...colours].join(" "),
  );
}

console.log("--- what a reader gets ---");
{
  const { demo } = at(3);
  const nodes = JSON.parse(demo.a11yJson(1, "")).nodes;
  const roles = nodes.map((n) => n.role);
  ok("one list", roles.filter((r) => r === "list").length === 1, roles.join(","));
  ok("four list items", roles.filter((r) => r === "listitem").length === 4, roles.join(","));
  // The rail is a picture of the value, and the value is already in the words.
  ok("the rail is not in it", !nodes.some((n) => /rail|dot|line/.test(n.id || "")));
  // And the words are all of them. "four list items, PASS" is exactly the
  // shape of result that hides an empty one — a reader that gets the titles
  // and not the descriptions loses most of the page and the count is the same.
  const items = nodes.filter((n) => n.role === "listitem");
  ok(
    "every item is named by its whole text",
    items.length === 4 &&
      items.every((n, i) => {
        const want = ["Forked Repository", "Pull Request Submitted", "Comparing Branches", "Merged Branch"][i];
        return (
          (n.name || "").startsWith(want) &&
          (n.name || "").length > want.length + 30 &&
          /(ago|Just now)$/.test(n.name || "")
        );
      }),
    items.map((n) => JSON.stringify(n.name)).join(" "),
  );
  ok("no lint", demo.a11yProblems().length === 0, demo.a11yProblems().join("; "));
  ok("no host lint", demo.hostProblems().length === 0, demo.hostProblems().join("; "));
  ok("no style errors", demo.styleErrorCount() === 0);
}

console.log("");
console.log("passed=" + passed + " failed=" + failed);
if (failed > 0) {
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
