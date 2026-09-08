#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The workbench, driven with no browser.
//
//   npm run firesim:demo
//
// The page is the claim that a whole Firebase — a database, its rules and its
// accounts — runs in a tab. What a browser adds to it is pixels, a pointer
// and a clock, and none of those is where the claim can go wrong, so this
// drives the same app with a made-up clock and presses its controls at the
// rectangles the accessibility tree reports (the same path a pointer takes).
//
// What it cannot check is that the page LOOKS right. Nothing here draws;
// `tests/page-render-check.mjs` is the half that does.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const GALLERY = path.join(MODULE, "..");
const require_ = createRequire(import.meta.url);

const COMPILED = path.join(MODULE, "bin", "FiresimConsole.cjs");
if (!fs.existsSync(COMPILED)) {
  console.error("the workbench is not built — run `npm run firesim:demo:build` first");
  process.exit(3);
}
const { FiresimConsole } = require_(COMPILED);

const CSS = fs.readFileSync(path.join(MODULE, "demo", "firesim-console.css"), "utf8");
const RULES = fs.readFileSync(path.join(MODULE, "fixtures", "console.rules"), "utf8");
const RT_SEED = path.join(GALLERY, "realtrainer", "fixtures", "reference", "seed.json");
const RT_RULES = path.join(MODULE, "fixtures", "realtrainer.rules");

let passed = 0;
const failures = [];
const ok = (name, cond, detail) => (cond ? (passed += 1) : failures.push(`${name}${detail ? `\n      ${detail}` : ""}`));
const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
const section = (t) => process.stdout.write(`\n  ${t}\n`);

function open(w = 1440, h = 860) {
  const app = new FiresimConsole();
  app.init(CSS, RULES);
  app.setPageSize(w, h);
  settle(app);
  return app;
}
// Enough ticks for a call at the default latency to be issued, answered and
// read, and for the listener to have polled.
function settle(app, times = 12, dt = 120) {
  for (let i = 0; i < times; i += 1) app.tick(dt);
}
const nodes = (app) => JSON.parse(app.a11yJson(1, "")).nodes;
const named = (app, role) => nodes(app).filter((n) => n.role === role).map((n) => n.name ?? "");
const cells = (app) => nodes(app).filter((n) => n.role === "cell").map((n) => n.name ?? "");
// Press where the reader was told the control is, not by id — the same path a
// pointer takes, so a control drawn where nothing can reach it fails here.
function pressByName(app, role, name) {
  const node = nodes(app).find((n) => n.role === role && (n.name ?? "") === name);
  if (!node || !node.b) return false;
  const id = app.hitId(node.b[0] + node.b[2] / 2, node.b[1] + node.b[3] / 2);
  if (!id) return false;
  app.setFocus(id);
  return app.press(id);
}
const docIds = (app) => Array.from({ length: app.docCount() }, (_, i) => app.docIdAt(i));

// =============================================================================
section("it opens on a database");
// =============================================================================
{
  const app = open();
  eq("the stylesheet has no errors", app.styleErrorCount(), 0);
  eq("the accessibility tree has no lint", app.a11yProblems(), []);
  ok("something is drawn", app.displayListJson().length > 2000);
  eq("the five views are there", named(app, "tab"), ["Data", "Query", "Rules", "Users", "Traffic"]);
  eq("the sample dataset is loaded", app.datasetName(), "Sample");
  eq("…and it is nine documents", app.storeCount(), 9);
  ok("the three collections are offered", ["orders", "products", "users"].every((c) => named(app, "button").includes(c)), JSON.stringify(named(app, "button").slice(0, 10)));
  // A browser that opens on an empty pane looks broken, so it opens on the
  // collection with the most in it, as the caller who can see the most, with
  // the first document already picked.
  eq("it opens as the admin", app.whoLabel(), "root");
  eq("…on the collection with the most in it", app.collectionPathNow(), "products");
  eq("…with its documents listed", app.docCount(), 3);
  ok("…and one already selected", app.selectedPath().startsWith("products/"), app.selectedPath());
}

// =============================================================================
section("the data browser walks the tree");
// =============================================================================
{
  const app = open();
  ok("a collection is a press", pressByName(app, "button", "products"));
  settle(app);
  eq("…and its documents arrive", docIds(app), ["dsk-160", "kb-87", "lmp-04"]);

  ok("a document is a press", pressByName(app, "button", "kb-87"));
  eq("…and the path says where you are", app.selectedPath(), "products/kb-87");

  // The field list is the point of the tool: a name, a Firestore TYPE and a
  // value, for every kind of value there is.
  const shown = cells(app);
  for (const [field, type] of [
    ["title", "string"],
    ["price", "double"],
    ["stock", "integer"],
    ["inStock", "boolean"],
    ["tags", "array"],
    ["dimensions", "map"],
    ["addedAt", "timestamp"],
    ["discontinuedAt", "null"],
  ]) {
    const at = shown.indexOf(field);
    ok(`${field} is shown as ${type}`, at >= 0 && shown[at + 1] === type, `${field} → ${shown[at + 1]}`);
  }
  ok("an array shows its shape", shown.includes('["input","desk"]'), JSON.stringify(shown.slice(0, 20)));
  ok("a map shows its shape", shown.some((c) => c.startsWith('{"w":360')));

  // A geopoint and a reference, on the other two documents.
  pressByName(app, "button", "dsk-160");
  ok("a geopoint is a geopoint", cells(app).includes("geopoint"), JSON.stringify(cells(app)));

  // A subcollection is not a field, and drilling into it is a press.
  ok("users is a press", pressByName(app, "button", "users"));
  settle(app);
  const uid = docIds(app)[0];
  pressByName(app, "button", uid);
  ok("a subcollection is listed apart from the fields", named(app, "button").includes("subcollection sessions"), JSON.stringify(named(app, "button").slice(-6)));
  ok("…and drilling in is a press", pressByName(app, "button", "subcollection sessions"));
  settle(app);
  eq("…which moves the path down a level", app.collectionPathNow(), `users/${uid}/sessions`);
  eq("…and lists what is there", docIds(app), ["s-9f1", "s-a02"]);

  // The breadcrumb comes back up.
  ok("the breadcrumb goes back", pressByName(app, "button", "users"));
  settle(app);
  eq("…to the collection it names", app.collectionPathNow(), "users");
  ok("and the root crumb goes all the way", pressByName(app, "button", "the database root"));
  settle(app);
  eq("…to the collection the root opens on", app.collectionPathNow(), "products");
}

// =============================================================================
section("the rules decide what the browser can see");
// =============================================================================
{
  const app = open();
  pressByName(app, "button", "orders");
  settle(app);
  eq("the admin claim sees every order", docIds(app), ["o-1001", "o-1002"]);

  ok("switching identity is a press", pressByName(app, "radio", "ada"));
  settle(app);
  eq("ada sees her own", docIds(app), ["o-1001"]);

  ok("and alan his", pressByName(app, "radio", "alan"));
  settle(app);
  eq("…because the rule is ownership", docIds(app), ["o-1002"]);

  ok("signed out sees nothing", pressByName(app, "radio", "signed out"));
  settle(app);
  eq("…at all", docIds(app), []);

  // products is public: even signed out.
  pressByName(app, "button", "products");
  settle(app);
  eq("…except the public collection", docIds(app).length, 3);
}

// =============================================================================
section("the permission grid is the engine, on the selected path");
// =============================================================================
{
  const app = open();
  pressByName(app, "button", "users");
  settle(app);
  const uid = docIds(app)[0];
  pressByName(app, "button", uid);
  pressByName(app, "tab", "Rules");
  const grid = cells(app);
  ok("the owner may write their profile", grid.includes(`ada update users/${uid}: allowed`), JSON.stringify(grid.slice(0, 6)));
  ok("another signed-in user may read it", grid.includes(`alan get users/${uid}: allowed`));
  ok("…and may not write it", grid.includes(`alan update users/${uid}: denied`));
  ok("the admin may write it", grid.includes(`root update users/${uid}: allowed`));
  ok("a signed-out caller may not even read it", grid.includes(`signed out get users/${uid}: denied`));
  ok("the rules file is on screen", nodes(app).length > 50);

  // The grid follows the browser: pick a product and it is a different answer.
  pressByName(app, "tab", "Data");
  pressByName(app, "button", "products");
  settle(app);
  pressByName(app, "button", "kb-87");
  pressByName(app, "tab", "Rules");
  const grid2 = cells(app);
  ok("a public document reads for everyone", grid2.includes("signed out get products/kb-87: allowed"), JSON.stringify(grid2.slice(0, 6)));
  ok("…and is written only by an admin", grid2.includes("ada update products/kb-87: denied") && grid2.includes("root update products/kb-87: allowed"));
}

// =============================================================================
section("the query builder, and the refusals");
// =============================================================================
{
  const app = open();
  pressByName(app, "button", "products");
  settle(app);
  pressByName(app, "tab", "Query");
  ok("the builder offers a field from the data", named(app, "button").some((n) => n.startsWith("where ")), JSON.stringify(named(app, "button")));
  ok("Run is a press", pressByName(app, "button", "Run"));
  settle(app);
  ok("a query runs", app.queryStatus().startsWith("200"), app.queryStatus());
  ok("…and matches something", app.queryResultCount() >= 1, app.queryStatus());

  // Cycle to a number and an inequality, then order by something else: the
  // refusal Firestore gives and a naive mock does not.
  app.press("fs-q-field");
  app.press("fs-q-field");
  app.press("fs-q-field");
  app.press("fs-q-op");
  app.press("fs-q-op");
  app.press("fs-q-order");
  app.press("fs-q-run");
  settle(app);
  ok("an inequality ordered by another field is refused", app.queryStatus().startsWith("400"), app.queryStatus());
  ok("…with the message the real API gives", app.queryStatus().includes("first orderBy"), app.queryStatus());
}

// =============================================================================
section("writing, and the listener that reports it");
// =============================================================================
{
  const app = open();
  pressByName(app, "button", "products");
  settle(app);
  // products is admin-only to write, so ada is refused and root is not.
  ok("as a non-admin", pressByName(app, "radio", "ada"));
  settle(app);
  const before = app.docCount();
  ok("adding is a press", pressByName(app, "button", "Add a document"));
  settle(app);
  ok("…and a non-admin is refused", app.noteText().includes("refused"), app.noteText());
  eq("…so nothing arrived", app.docCount(), before);

  ok("as the admin", pressByName(app, "radio", "root"));
  settle(app);
  pressByName(app, "button", "Add a document");
  settle(app);
  eq("…the write lands", app.docCount(), before + 1);
  ok("…and the listener is what reported it", app.noteText().includes("added"), app.noteText());

  const added = docIds(app).find((d) => d.startsWith("wb-"));
  ok("the new document is there to select", !!added, JSON.stringify(docIds(app)));
  pressByName(app, "button", added);
  ok("deleting is a press", pressByName(app, "button", "Delete it"));
  settle(app);
  eq("…and the row leaves", app.docCount(), before);
}

// =============================================================================
section("the accounts, and the traffic");
// =============================================================================
{
  const app = open();
  pressByName(app, "tab", "Users");
  const table = cells(app);
  ok("the accounts are listed", table.includes("ada@example.com") && table.includes("root@example.com"), JSON.stringify(table.slice(0, 8)));
  ok("…with the admin's custom claim", table.some((c) => c.includes('"admin":true')), JSON.stringify(table));
  ok("an account can be made", pressByName(app, "button", "Create an account"));
  ok("…and it says so", app.noteText().startsWith("created"), app.noteText());
  ok("an anonymous session too", pressByName(app, "button", "Sign in anonymously"));
  ok("…and it has a uid", app.noteText().startsWith("anonymous session uid-"), app.noteText());

  pressByName(app, "tab", "Traffic");
  const log = cells(app);
  ok("the log lists what was asked", log.some((c) => c.startsWith("/firesim/v1/watch") || c.startsWith("…/")), JSON.stringify(log.slice(0, 6)));
  ok("a stream is a press", pressByName(app, "button", "Open a stream"));
  settle(app, 30, 100);
  ok("…and it closes", app.noteText().includes("stream"), app.noteText());
}

// =============================================================================
section("the wait");
// =============================================================================
{
  const app = open();
  eq("the latency starts where the rail says", app.latencyMs(), 200);
  app.slideTo(1.0);
  eq("dragging to the end is the maximum", app.latencyMs(), 1500);
  app.slideTo(0.0);
  eq("…and to the start is nothing", app.latencyMs(), 0);

  pressByName(app, "switch", "Offline");
  pressByName(app, "button", "products");
  settle(app, 20, 200);
  ok("offline makes the calls fail", app.noteText().includes("offline") || app.noteText().includes("refused") || app.noteText().includes("stopped"), app.noteText());
}

// =============================================================================
section("the RealTrainer dataset, as example data");
// =============================================================================
{
  const app = open();
  ok("picking it asks the host to fetch", pressByName(app, "radio", "RealTrainer"));
  eq("…by name", app.wantedDataset(), "RealTrainer");
  // What the browser host does when the fetch lands.
  app.loadDataset("RealTrainer", fs.readFileSync(RT_SEED, "utf8"), fs.readFileSync(RT_RULES, "utf8"));
  app.clearWanted();
  settle(app, 16);
  eq("the whole reference seed loads unconverted", app.storeCount(), 747);
  eq("…and the dataset is named", app.datasetName(), "RealTrainer");
  eq("…and it opens on the collection with the most in it", app.collectionPathNow(), "entries");
  ok("a collection of hundreds lists", app.docCount() > 700, String(app.docCount()));
  ok("…with one already selected", app.selectedPath().startsWith("entries/"), app.selectedPath());

  // It is seeded as whoever loaded it, so picking a dataset does not empty
  // the browser — and its own rules came with it.
  pressByName(app, "tab", "Rules");
  const grid = cells(app);
  const path = app.selectedPath();
  ok("the caller who loaded it may read it", grid.includes(`root get ${path}: allowed`), JSON.stringify(grid.slice(0, 4)));
  ok("…and nobody else may", grid.includes(`alan get ${path}: denied`));

  pressByName(app, "tab", "Data");
  pressByName(app, "button", "the database root");
  settle(app, 20);
  ok("the calendars are there too", named(app, "button").includes("calendars"), JSON.stringify(named(app, "button").slice(0, 8)));
}

// =============================================================================
section("a phone");
// =============================================================================
{
  const phone = open(390, 844);
  eq("the page lays out on a phone with no style errors", phone.styleErrorCount(), 0);
  eq("…and the accessibility tree is still clean", phone.a11yProblems(), []);
  ok("…and the browser is still walkable", pressByName(phone, "button", "users"));
  settle(phone);
  eq("…and lists what is there", phone.docCount(), 2);
}

// =============================================================================
section("the two things that were broken");
// =============================================================================
{
  // The slider's role and id are on the TRACK, not the thumb. A drag measured
  // against the thumb's own rectangle measures against something that has
  // already moved, which is a slider that snaps to an end on every press.
  const app = open();
  const track = nodes(app).find((n) => n.id === "fs-latency");
  ok("the slider's rectangle is the track's", !!track && track.b[2] > 100, JSON.stringify(track && track.b));
  const [x, , w] = track.b;
  const at = (frac) => {
    const px = x + 7 + (w - 14) * frac;
    app.slideTo(Math.min(1, Math.max(0, (px - (x + 7)) / (w - 14))));
    return app.latencyMs();
  };
  eq("the left end is nothing", at(0), 0);
  eq("the middle is the middle", at(0.5), 760);
  eq("the right end is the maximum", at(1), 1500);
  ok("the rectangle does not move with the value", nodes(app).find((n) => n.id === "fs-latency").b[0] === x);

  // A listener that gave up for good left the browser frozen on whatever it
  // had, which is indistinguishable from an empty database.
  const net = open();
  const had = net.docCount();
  pressByName(net, "switch", "Offline");
  settle(net, 20, 200);
  ok("offline says the listener went", net.noteText().includes("retrying"), net.noteText());
  pressByName(net, "switch", "Offline");
  settle(net, 30, 200);
  ok("…and it comes back on its own", net.noteText().includes("back"), net.noteText());
  pressByName(net, "button", "Add a document");
  settle(net, 20, 200);
  eq("…and reports what happened while it was away", net.docCount(), had + 1);
}

process.stdout.write(`\n  ${passed} passed`);
if (failures.length) {
  process.stdout.write(`, ${failures.length} FAILED\n\n`);
  for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
  process.stdout.write("\n");
  process.exit(1);
}
process.stdout.write(", 0 failed\n\n  ALL PASS\n\n");
