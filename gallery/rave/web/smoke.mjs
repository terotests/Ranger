#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Rave, checked without a browser: the chrome and the application under it
// are both Ranger, so the whole page answers in Node and WebGL only adds
// the pixels.
//
//   npm run rave:smoke
//
// The deeper checks — every edit and its undo, the guard, the keyboard, the
// lint — are in tests/RaveTest.rgr. This asserts what the PAGE does: that
// the module the build wrote loads, that the rails are where they should be
// and the stage between them, that the stage list carries a camera, and
// that a sign-in typed at the page ends on the dashboard.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { RaveEditor } = await import(path.join(HERE, "generated-host.js"));
const { CSS } = await import(path.join(HERE, "generated.js"));

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

const app = new RaveEditor();
app.init(CSS);
app.setPageSize(W, H);

const doc = JSON.parse(app.displayListJson());
const cmds = (doc.list && doc.list.cmds) || [];
ok("the chrome is drawn", cmds.length > 120, `${cmds.length} commands`);

// --- the shape of the window ---------------------------------------------------
ok("the stage is the space between the rails", app.insideBoard(700, 400) && !app.insideBoard(100, 400) && !app.insideBoard(W - 100, 400));
ok("the top bar is not the stage", !app.insideBoard(W / 2, 20));
ok("the strip is not the stage", !app.insideBoard(W / 2, H - 6));

// --- the stage carries the app -------------------------------------------------------
const [bx, by, bw, bh] = JSON.parse(app.boardBoxJson());
const board = JSON.parse(app.boardJson());
const bcmds = (board.list && board.list.cmds) || [];
ok("the stage has a list of its own", bcmds.length > 30, `${bcmds.length} commands`);
ok("…with a camera on it", Array.isArray(board.list.view), JSON.stringify(board.list.view));
ok("…showing the landing page", JSON.stringify(bcmds).includes("Welcome to Acme"));
const covering = cmds.filter((c) => c.k === 0 && c.x <= bx + 1 && c.y <= by + 1 && c.w >= bw && c.h >= bh);
ok("the chrome leaves the stage showing", covering.length === 0, `${covering.length} cover the stage`);
// The strip counts what the engine refused, and the chrome must not be the
// thing it refused: a per-side border or a box-shadow in rave.css would show
// up here as a rejection that looks like the document's.
JSON.parse(app.displayListJson());
JSON.parse(app.boardJson());
ok("the chrome costs no engine rejections", app.runtime().layoutWarningCount(0) === 0, `${app.runtime().layoutWarningCount(0)}`);

// --- the rails answer to a click ------------------------------------------------------
ok("Routes is a tab", app.press("tab:routes"));
ok("…and it lists the routes", app.displayListJson().includes("/settings"));
ok("Components is a tab", app.press("tab:components"));
ok("…and it lists the kit", app.displayListJson().includes("Button"));
app.press("tab:layers");
ok("A11y is a tab", app.press("tab:a11y"));
ok("…and it shows the tree", app.displayListJson().includes("banner"));
app.press("tab:design");

// --- a layer picked in the tree is the node the inspector describes ---------------------
const ids = JSON.parse(app.treeIdsJson());
ok("the tree has rows", ids.length > 10, `${ids.length} rows`);
ok("a row selects", app.press("tree:" + ids[1].slice(1)));
ok("…and the inspector names it", app.displayListJson().includes("Header"));

// --- sign in, from the page's own doors ---------------------------------------------------
app.press("mode:run");
ok("Run is a mode", app.modeNow() === "run");
app.press("route:/login");
ok("the app is at /login", app.path() === "/login");
app.keyWith("Tab", false, false);
app.keyWith("Tab", false, false);
app.keyWith("Tab", false, false);
ok("Enter on the button signs in", app.keyWith("Enter", false, false));
ok("…and lands on the dashboard", app.path() === "/dashboard", app.path());
ok("…which the stage draws", JSON.stringify(JSON.parse(app.boardJson()).list.cmds).includes("Log out"));

// --- the AI menu: a prompt out, an answer back ---------------------------------------------
ok("AI opens a sheet", app.press("ai:open"));
const aiPrompt = app.aiPrompt();
ok("the prompt carries the format", aiPrompt.includes("RAVE MARKUP"));
ok("…and the document as it stands", aiPrompt.includes('<route path="/dashboard"'));
app.press("ai:scope:page");
ok(
  "an answer in that markup is taken, <page> wrapper and all",
  app.applyAiText(
    [
      '<style class="note">padding: 16px; border-radius: 10px; background-color: #eef3ff</style>',
      '<page name="Home">',
      '  <h1 style="font-size: 28px; color: #111318">Pasted back</h1>',
      '  <p class="note">This page came in through the clipboard.</p>',
      '</page>',
      '',
    ].join("\n"),
  ),
  app.aiErrorCount() ? app.aiErrorAt(0) : null,
);
ok("…and the stage draws it", JSON.stringify(JSON.parse(app.boardJson()).list.cmds).includes("Pasted back"));
ok("…as one undo step", app.press("undo"));
app.press("mode:design");

// --- a Figma file, imported through the same door the page uses ----------------------------
const figPath = path.join(HERE, "..", "..", "figma", "fixtures", "health.fig");
const rawFig = fs.readFileSync(figPath);
// Ranger reads a `buffer` through a DataView it expects on the ArrayBuffer
// itself — the same handover main.js makes from the file picker.
const figBytes = rawFig.buffer.slice(rawFig.byteOffset, rawFig.byteOffset + rawFig.byteLength);
figBytes._view = new DataView(figBytes);
const figEditor = new RaveEditor();
figEditor.init(CSS);
figEditor.setPageSize(W, H);
ok("a .fig imports", figEditor.importFig(figBytes, "health.fig"));
ok("…as more than one screen", figEditor.doc.routes.length >= 3, `${figEditor.doc.routes.length} routes`);
ok("…with a report to read", figEditor.importNoteCount() > 0);
ok("…which the Import tab shows", figEditor.displayListJson().includes("IMPORT"));
const figBoard = JSON.parse(figEditor.boardJson());
ok("…and the screens are drawn", JSON.stringify(figBoard.list.cmds).length > 2000);
ok("…with nothing the engine rejected", figEditor.runtime().layoutWarningCount(0) === 0);

// --- the file door `rave serve` uses --------------------------------------------------------
const markup = app.saveMarkup();
ok("the editor writes its document as markup", markup.startsWith("<app "));
const fileEditor = new RaveEditor();
fileEditor.init(CSS);
fileEditor.setPageSize(W, H);
ok("…and opens one", fileEditor.openMarkup(markup));
ok("…as the same markup", fileEditor.saveMarkup() === markup);
ok("…drawing it", JSON.stringify(JSON.parse(fileEditor.boardJson()).list.cmds).length > 2000);
ok("markup it cannot read is refused", !fileEditor.openMarkup("<widget/>"));

// --- the document survives a save ----------------------------------------------------------
const json = app.saveJson();
const again = new RaveEditor();
again.init(CSS);
ok("the document opens again", again.openJson(json));
ok("…as the same text", again.saveJson() === json);

console.log(failed === 0 ? "\nALL PASS" : `\nfailed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
