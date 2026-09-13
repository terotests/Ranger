#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Rafi, checked without a browser: the chrome is Ranger, so the whole editor
// answers in Node and the only thing WebGL adds is the pixels.
//
//   npm run rafi:test
//
// What it asserts is what a screenshot would show and a unit test would not:
// that the rails are where the DOM editor puts them, that the board is the
// space between them, that clicking a tab changes the pane, that a layer
// picked in the tree is the layer the panel describes, and that the board's
// own drawing is in the list under the chrome rather than beside it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { RafiApp } = await import(path.join(HERE, "generated-host.js"));

const W = 1440;
const H = 860;
let failed = 0;
const ok = (name, cond, extra) => {
  if (cond) {
    console.log(`  PASS  ${name}`);
    return;
  }
  failed += 1;
  console.log(`  FAIL  ${name}${extra == null ? "" : "  — " + extra}`);
};

const app = new RafiApp();
app.init(fs.readFileSync(path.join(HERE, "rafi.css"), "utf8"));
app.setPageSize(W, H);
const raw = fs.readFileSync(path.join(HERE, "fixtures", "health.fig"));
// Ranger reads a `buffer` through a DataView it expects to find on the
// ArrayBuffer itself, which is what the browser host hands it too.
const bytes = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
bytes._view = new DataView(bytes);
ok("health.fig opens", app.openBytes(bytes, "health.fig"), app.error());
app.fit();

const doc = JSON.parse(app.displayListJson());
const cmds = (doc.list && doc.list.cmds) || [];
ok("the page is drawn", cmds.length > 200, `${cmds.length} commands`);

// --- the shape of the window ---------------------------------------------------
// 244 + 272 are the rail widths the DOM editor's grid uses, and 20 the ruler.
// The board is what is left, minus the ruler on each edge.
const boardOk = app.insideBoard(244 + 20 + 5, 40) && !app.insideBoard(100, 400) && !app.insideBoard(W - 100, 400);
ok("the board is the space between the rails", boardOk);
ok("the left rail is not the board", !app.insideBoard(120, 400));
ok("the right rail is not the board", !app.insideBoard(W - 60, 400));
ok("the footer is not the board", !app.insideBoard(W / 2, H - 6));

// --- the rails answer to a click -----------------------------------------------
ok("a tab is hit where it is drawn", app.hitId(280, 16).length > 0 || app.hitId(40, 50).length > 0);
ok("Assets is a tab", app.press("tab:assets"));
ok("…and it changes the pane", app.displayListJson().includes("IMAGES IN THE FILE"));
app.press("tab:file");
ok("Raw is a tab", app.press("tab:raw"));
app.press("tab:design");

// --- the board's own drawing is in the same list --------------------------------
const [bx, by, bw, bh] = JSON.parse(app.boardBoxJson());
const board = JSON.parse(app.boardJson());
const bcmds = (board.list && board.list.cmds) || [];
ok("the board has a list of its own", bcmds.length > 100, `${bcmds.length} commands`);
ok("…with a camera on it", Array.isArray(board.list.view), JSON.stringify(board.list.view));
// The document's own text comes through as outlines, and an outline is only
// where its box is when the camera carries it — a list in page coordinates
// leaves the paths behind at the origin, which is the board drawn blank.
const paths = bcmds.filter((c) => c.k === 6 && c.pts && c.pts.length);
ok("the outlines are drawn", paths.length > 50, `${paths.length} paths`);
// THE CHROME PAINTS NO BACKGROUND BEHIND THE STAGE. The board is under it, so
// a rectangle there would paint the document out.
const covering = cmds.filter((c) => c.k === 0 && c.x <= bx + 1 && c.y <= by + 1 && c.w >= bw && c.h >= bh);
ok("the chrome leaves the board showing", covering.length === 0, `${covering.length} cover the board`);

// --- the tree picks a layer, the panel describes it -----------------------------
const tree = JSON.parse(app.treeIdsJson());
ok("the tree has rows", tree.length > 3, `${tree.length}`);
if (tree.length > 3) {
  app.press("tree:" + tree[3]);
  ok("the tree selects", app.selectedId() === tree[3], `${app.selectedId()} vs ${tree[3]}`);
}

// --- the view ---------------------------------------------------------------------
const z0 = app.zoomNow();
app.press("zoom:in");
ok("the toolbar zooms", app.zoomNow() > z0, `${z0} -> ${app.zoomNow()}`);
app.press("fit");
ok("…and fits", app.zoomNow() > 0);

// --- what a screen reader is handed -------------------------------------------------
const a11y = JSON.parse(app.a11yJson(1, ""));
ok("the chrome reaches the accessibility tree", JSON.stringify(a11y).includes("button"));

console.log(`\nrafi: failed=${failed}`);
if (failed === 0) console.log("ALL PASS");
process.exit(failed === 0 ? 0 : 1);
