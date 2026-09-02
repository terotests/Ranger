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

// --- 6. the cascade agrees with the values it produced -----------------------
{
  // The gate that keeps the provenance honest. It fails the moment a value
  // stops arriving through the plan — which is exactly the drift a recorded
  // trace is vulnerable to, and the reason the record is made in `buildPlan`
  // rather than reconstructed afterwards.
  //
  // The two sides are spelled differently on purpose: the sheet says
  // `#ffffff` and the element says `rgb(255,255,255)`, the sheet says `18px`
  // and the box says `18.00px`. So both are normalised to a comparable shape
  // and anything that will not normalise is skipped rather than guessed at.
  const norm = (v) => {
    // A unit the detail shows as authored AND resolved — `100vh  ->  900.00px`
    // — is compared on the authored half, because that half is literally the
    // text the sheet carries. Comparing the resolved half would be asking the
    // sheet to have written the answer the layout computed.
    const t = String(v).split("->")[0].trim().toLowerCase();
    let m = /^#([0-9a-f]{6})$/.exec(t);
    if (m) {
      const n = parseInt(m[1], 16);
      return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
    }
    m = /^#([0-9a-f]{3})$/.exec(t);
    if (m) {
      const [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16));
      return `rgb(${r},${g},${b})`;
    }
    m = /^rgba?\(([^)]*)\)$/.exec(t);
    if (m) {
      const p = m[1].split(",").map((x) => parseFloat(x));
      return `rgb(${p[0] | 0},${p[1] | 0},${p[2] | 0})`;
    }
    m = /^(-?[0-9.]+)px$/.exec(t);
    if (m) return String(Math.round(parseFloat(m[1]) * 100) / 100);
    if (/^-?[0-9.]+$/.test(t)) return String(Math.round(parseFloat(t) * 100) / 100);
    if (t === "transparent") return "rgb(0,0,0)";   // and alpha 0, which neither side prints here
    return t;
  };

  let checked = 0, disagreed = 0;
  const shown = [];
  for (const n of tree.nodes) {
    if (!n.cls) continue;
    const d = JSON.parse(app.inspectNodeJson(n.id));
    const winners = new Map();
    for (const c of d.cascade || []) if (c.win && !c.beatenByInline) winners.set(c.p, c.v);
    for (const [prop, want] of winners) {
      const got = (d.computed || {})[prop];
      if (got === undefined) continue;             // a shorthand, or not in the curated set
      checked++;
      if (norm(got) !== norm(want)) {
        disagreed++;
        if (shown.length < 6) shown.push(`${n.id} ${prop}: sheet ${want} → element ${got}`);
      }
    }
  }
  for (const line of shown) console.log("       " + line);
  ok("the winning rule is the value on the element", disagreed === 0,
     `${disagreed} of ${checked} disagree`);
  ok("the cascade was read at all", checked > 100, `${checked} properties compared`);
}

// --- 7. the sheet is an input, and reloading it lands ------------------------
{
  // The dashboard KEEPS its tree — `laidOutOnce` styles and lays out the same
  // root every frame — which is what makes this gate worth having. A reload
  // that swapped in a fresh EVGStyleSheet would restart the generation counter
  // at the value the elements are already holding, `applyTo` would skip every
  // one of them, and the new CSS would land on nothing. It would still pass on
  // a page that rebuilds its tree, so this is the shape of app that catches it.
  const node = tree.nodes.find((n) => n.cls === "db-card");
  const before = JSON.parse(app.inspectNodeJson(node.id)).computed["background-color"];
  const base = app.inspectCss();

  app.inspectSetCss(base + "\n.db-card { background-color: #123456; }\n");
  const after = JSON.parse(app.inspectNodeJson(node.id)).computed["background-color"];
  ok("a reloaded sheet reaches a retained tree", after !== before && /18,52,86/.test(after),
     `${before} → ${after}`);

  // And it reaches the picture, not only the element: the display list is what
  // a painter draws, and a value that stopped at the element would be a frame
  // that still shows the old colour.
  const cmds = (() => { const f = JSON.parse(app.inspectFrameJson()); return f.list ? f.list.cmds : f.cmds; })();
  ok("and the frame carries it", cmds.some((c) => c.c && c.c[0] === 18 && c.c[1] === 52 && c.c[2] === 86));

  // `parse` appends; `reload` must not. Applying the same text twice may not
  // grow the plan, or every rule in the sheet is in it twice and the second
  // copy is the one that wins.
  const lenOnce = JSON.parse(app.inspectNodeJson(node.id)).cascade.length;
  app.inspectSetCss(base + "\n.db-card { background-color: #123456; }\n");
  const lenTwice = JSON.parse(app.inspectNodeJson(node.id)).cascade.length;
  ok("reloading twice does not duplicate the rules", lenOnce === lenTwice, `${lenOnce} then ${lenTwice}`);

  app.inspectSetCss(base);
  const restored = JSON.parse(app.inspectNodeJson(node.id)).computed["background-color"];
  ok("and putting the original back restores the value", restored === before, `${restored} vs ${before}`);
}

// --- 8. classes, and how many elements a rule reaches -------------------------
{
  const node = tree.nodes.find((n) => n.cls === "db-card");
  const d = JSON.parse(app.inspectNodeJson(node.id));
  const card = (d.classes || []).find((c) => c.name === "db-card");
  const actual = tree.nodes.filter((n) => (n.cls || "").split(/\s+/).includes("db-card")).length;
  ok("the class list is the element's own", card !== undefined);
  ok("and its match count is the tree's", card && card.matches === actual,
     `panel says ${card && card.matches}, tree has ${actual}`);
}

// --- 9. a state held on ------------------------------------------------------
{
  // A `:hover` rule cannot be read while the only way to make it true is to
  // keep the pointer off the panel. Holding the bit on is the answer, and what
  // makes it work across this page's rebuilds is that the table is keyed by
  // PATH: the dashboard throws its elements away and builds them again, so a
  // flag written onto an element would last exactly one frame.
  //
  // Nothing was taught to the cascade. `EVGPseudo.holds` reads `isHovered`,
  // and a held bit is that field being true — so what the gate checks is that
  // the ORDINARY hover rule won, not that some parallel path produced a colour.
  const node = tree.nodes.find((n) => (n.cls || "").split(/\s+/).includes("db-brand"));
  ok("there is something with a :hover rule to hold", node !== undefined);
  if (node) {
    const before = JSON.parse(app.inspectNodeJson(node.id));
    ok("nothing is held to begin with", before.forced === 0, String(before.forced));

    app.inspectForce(node.id, 1);
    const held = JSON.parse(app.inspectNodeJson(node.id));
    const flags = JSON.parse(app.inspectJson(9)).nodes.find((n) => n.id === node.id).flags || [];
    ok("the element reports the state", flags.includes("hover"), JSON.stringify(flags));
    ok("and the panel knows it is being held", held.forced === 1, String(held.forced));
    ok("the hover rule now wins", (held.cascade || []).some(
      (c) => c.p === "background-color" && c.win && /:hover/.test(c.sel)),
      JSON.stringify((held.cascade || []).filter((c) => c.p === "background-color")));
    ok("and the value on the element followed",
      held.computed["background-color"] !== before.computed["background-color"],
      `${before.computed["background-color"]} → ${held.computed["background-color"]}`);

    // The rebuild is the point: ask for a fresh frame and the hold survives it.
    app.displayListJson();
    const still = JSON.parse(app.inspectNodeJson(node.id));
    ok("and it survives a rebuild", still.computed["background-color"] === held.computed["background-color"]);

    app.inspectClearForced();
    const let_go = JSON.parse(app.inspectNodeJson(node.id));
    ok("letting go puts it back",
      let_go.computed["background-color"] === before.computed["background-color"],
      `${held.computed["background-color"]} → ${let_go.computed["background-color"]}`);
    ok("and nothing is held again", let_go.forced === 0);
  }
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
