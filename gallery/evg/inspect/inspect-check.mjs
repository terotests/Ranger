#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The inspector's gates. No browser: the four channels are read off a real app
// in this process, which is the whole point of them being derived from the
// tree rather than from the picture.
//
//   npm run evg:inspect:test
//
// A second description of something is only worth having if it is DIFFERENCED
// against the first, which is the habit the painters already keep
// (`pptx:html:parity`). These are the differences worth taking:
//
//   1. the tree is a tree            — one root, every parent present, no path twice
//   2. the box model closes          — content + padding + borders == the border box
//   3. attribution lands inside      — a command is inside the box of the element
//                                      that emitted it, with the two exceptions
//                                      that are real and are asserted as such
//   4. the hit test agrees           — a point in a node's box resolves to that
//                                      node or something under it
//   5. off costs nothing             — a list built without attribution carries
//                                      no attribution
//
// Gate 3 is the one that would catch the class of bug this was built for: a
// painter reading a stale field draws outside the box it was told about.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

const MOD = path.join(ROOT, "gallery/ui/bin/DashboardDemo.cjs");
if (!fs.existsSync(MOD)) {
  console.error("missing " + path.relative(ROOT, MOD) + " — run: npm run ui:demo:build");
  process.exit(1);
}
const M = require(MOD);
const CSS = fs.readFileSync(path.join(ROOT, "gallery/ui/demo/dashboard.css"), "utf8");
const app = new M.DashboardDemo();
app.init(CSS);
app.displayListJson();

const tree = JSON.parse(app.inspectJson(1));
console.log(`\ndashboard: ${tree.nodes.length} nodes, ${tree.w}×${tree.h}\n`);

// --- 1. the tree is a tree ---------------------------------------------------
{
  const seen = new Set();
  let dupes = 0, orphans = 0;
  for (const n of tree.nodes) {
    if (seen.has(n.id)) dupes++;
    seen.add(n.id);
  }
  for (const n of tree.nodes) if (n.p != null && !seen.has(n.p)) orphans++;
  ok("every path is unique", dupes === 0, `${dupes} repeated`);
  ok("every parent is present", orphans === 0, `${orphans} orphans`);
  ok("the root has no parent", tree.nodes[0].id === tree.root && tree.nodes[0].p == null);
  ok("slots are the array index", tree.nodes.every((n, i) => n.slot === i));
}

// --- 2. the box model closes -------------------------------------------------
{
  let off = 0, worst = 0, worstId = "";
  for (const n of tree.nodes) {
    const [, , w, h] = n.box;
    const b = n.b || 0, pd = n.pd || [0, 0, 0, 0];
    const detail = JSON.parse(app.inspectNodeJson(n.id));
    const [, , cw, ch] = detail.content;
    const dw = Math.abs((cw + pd[1] + pd[3] + 2 * b) - w);
    const dh = Math.abs((ch + pd[0] + pd[2] + 2 * b) - h);
    const d = Math.max(dw, dh);
    if (d > 0.02) { off++; if (d > worst) { worst = d; worstId = n.id; } }
  }
  ok("content + padding + borders is the border box", off === 0,
     `${off} nodes off, worst ${worst.toFixed(3)}px at ${worstId}`);
}

// --- 3. attribution lands inside ---------------------------------------------
{
  const frame = JSON.parse(app.inspectFrameJson());
  const cmds = frame.list ? frame.list.cmds : frame.cmds;
  const bySlot = new Map(tree.nodes.map((n) => [n.slot, n]));
  let unattributed = 0, unknown = 0, outside = 0, textOverhang = 0;
  const EPS = 0.5;
  for (const c of cmds) {
    if (c.n === undefined || c.n < 0) { unattributed++; continue; }
    const n = bySlot.get(c.n);
    if (!n) { unknown++; continue; }
    // POP_CLIP carries no geometry.
    if (c.k === 5) continue;
    const [bx, by, bw, bh] = n.box;
    const inside = c.x >= bx - EPS && c.y >= by - EPS
      && c.x + (c.w || 0) <= bx + bw + EPS && c.y + (c.h || 0) <= by + bh + EPS;
    if (inside) continue;
    // The two real exceptions. A text run may overhang its box by the font's
    // side bearings and by the line box's leading; a shadow extends by its
    // blur and offset. Anything else escaping its box is a finding.
    if (c.k === 3) { textOverhang++; continue; }
    if (c.hasShadow || c.bb) continue;
    outside++;
    if (outside < 4) console.log(`       outside: ${JSON.stringify(c).slice(0, 130)} vs ${n.id} ${JSON.stringify(n.box)}`);
  }
  ok("every command names an element", unattributed === 0, `${unattributed} of ${cmds.length}`);
  ok("every named element exists", unknown === 0, `${unknown} dangling slots`);
  ok("every command is inside the box it was attributed to", outside === 0,
     `${outside} of ${cmds.length} outside (${textOverhang} text runs allowed to overhang)`);
}

// --- 4. the hit test agrees --------------------------------------------------
{
  // A point in the middle of a node's box, put to the hit test.
  //
  // "NO ANSWER" IS AN ANSWER, and expecting one from every node was the first
  // version of this gate being wrong: the dashboard's table is 552px tall
  // inside a 414px scroll box, so half its rows are at coordinates the page
  // does not show. `EVGHitTest` drops a clipping box's whole subtree when the
  // point is outside it — deliberately, and its header says why: a row
  // scrolled out of view that is still clickable is the worst of both. So a
  // point over clipped-away content resolves to nothing, and that is correct.
  //
  // What must hold is the other half: WHEN it answers, the answer contains
  // the point. Nothing may be reported under a pointer that is not under it.
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  let wrong = 0, tested = 0, empty = 0;
  for (const n of tree.nodes) {
    const [x, y, w, h] = n.box;
    if (w < 4 || h < 4) continue;
    const cx = x + w / 2, cy = y + h / 2;
    tested++;
    const hit = byId.get(app.inspectHitPath(cx, cy));
    if (!hit) { empty++; continue; }
    const [hx, hy, hw, hh] = hit.box;
    if (!(cx >= hx - 0.5 && cy >= hy - 0.5 && cx <= hx + hw + 0.5 && cy <= hy + hh + 0.5)) wrong++;
  }
  ok("the hit test never names a node the point is outside", wrong === 0, `${wrong} of ${tested}`);
  // And it does answer for most of the page, so the gate above is not passing
  // by never being asked anything.
  ok("most nodes are reachable by a point", empty < tested * 0.6,
     `${empty} of ${tested} resolve to nothing (clipped or off-page)`);
}

// --- 5. off costs nothing ----------------------------------------------------
{
  const plain = app.displayListJson();
  ok("a list built without attribution carries none", !/"n":/.test(plain));
  const attributed = app.inspectFrameJson();
  ok("and the attributed one does", /"n":/.test(attributed));
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
