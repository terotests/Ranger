#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The emulator's client window, driven with no browser.
//
//   npm run mfiles:web:check
//
// Builds the same MfilesApp the page runs, loads the sample extensions, and
// presses controls at the rectangles the accessibility tree reports — the path
// a pointer takes — then asserts on what the tree says and on the vault. What
// it cannot check is that the page looks right; the Browser pane is for that.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);
const COMPILED = path.join(MODULE, "bin", "MfilesApp.cjs");
if (!fs.existsSync(COMPILED)) {
  console.error("MfilesApp is not built — run `npm run mfiles:web:build` first");
  process.exit(3);
}
const { MfilesApp } = require_(COMPILED);
const read = (rel) => fs.readFileSync(path.join(MODULE, rel), "utf8");

let passed = 0;
const failures = [];
const ok = (name, cond, detail) => (cond ? (passed += 1) : failures.push(`${name}${detail ? `\n      ${detail}` : ""}`));
const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
const section = (t) => process.stdout.write(`\n  ${t}\n`);

function open(mode = 2) {
  const app = new MfilesApp();
  app.init(read("web/mfiles.css"), read("uix/uix-api.js"), read("uix/uix-core.js"), read("uix/uix1-prelude.js"), read("uix/uix2-prelude.js"), read("uix/mfgrpc.js"));
  if (mode === 1) app.setMode(1);
  for (const file of fs.readdirSync(path.join(MODULE, "extensions")).sort()) {
    const source = read(path.join("extensions", file));
    const tag = (n) => (source.match(new RegExp("@" + n + "\\s+(.+)")) || [])[1]?.trim() ?? "";
    app.addExtension(tag("name"), tag("guid"), Number(tag("uix") || "2"), source);
  }
  app.setPageSize(1440, 900);
  app.displayListJson();
  return app;
}

const nodes = (app) => JSON.parse(app.a11yJson(1, "")).nodes;
const named = (app, role) => nodes(app).filter((n) => n.role === role && n.id !== "mf-table-head").map((n) => n.name ?? "");
function node(app, role, name) {
  return nodes(app).find((n) => n.role === role && (n.name ?? "") === name);
}
function press(app, role, name, button = 0) {
  const n = node(app, role, name);
  if (!n || !n.b) return false;
  const x = n.b[0] + Math.min(n.b[2] / 2, 40);
  const y = n.b[1] + n.b[3] / 2;
  app.pointerDown(x, y, button);
  app.displayListJson();
  return true;
}
const vault = (app) => app.host.shell.vault;
const find = (app, title) => vault(app).objects.find((o) => o.latest().title() === title);
const propText = (app, title, pd) => {
  const v = find(app, title).latest().prop(pd);
  return v.propDef < 0 ? null : vault(app).valueText(pd, v.value);
};

// ---------------------------------------------------------------------------
section("the window");
{
  const app = open();
  eq("stylesheet parses", app.styleErrorCount(), 0);
  const rows = named(app, "row");
  ok("recent listing shows the screenshot's documents", rows.includes("Job Application, Paula McEnroe") && rows.includes("Invoice A113-112-33 - GNT"), rows.join(" | "));
  eq("recent rows", rows.length, 15);
  const tabs = named(app, "tab");
  ok("view tabs and pane tabs", ["Recent", "Assigned (1)", "Checked out (0)", "Pinned", "Metadata", "Inspector", "Preview"].every((t) => tabs.includes(t)), tabs.join(" | "));
  const buttons = named(app, "button");
  ok("task-pane commands from extensions are toolbar buttons", buttons.includes("Say hello") && buttons.includes("Find unapproved invoices"), buttons.join(" | "));
  ok("the apps are listed with a restart button", buttons.includes("Restart Hello World (UIX v2)"), buttons.join(" | "));
}

// ---------------------------------------------------------------------------
section("views, folders, selection");
{
  const app = open();
  ok("press Documents by Class", press(app, "treeitem", "Documents by Class"));
  const folders = named(app, "row");
  eq("class folders", folders, ["Document Template", "Invoice", "Job Application", "Letter", "Project Plan"]);
  ok("open the Invoice folder", press(app, "row", "Invoice"));
  ok("invoices listed", named(app, "row").includes("Invoice #998 - UPS"), named(app, "row").join(" | "));
  ok("select an invoice", press(app, "row", "Invoice #998 - UPS"));
  ok("metadata card shows the class", named(app, "button").some((b) => b === "Class: Invoice"), named(app, "button").join(" | "));
  ok("metadata card shows the customer", named(app, "button").some((b) => b === "Customer: UPS"));
  press(app, "tab", "Inspector");
  ok("the extension's tab shows the selection", app.host.shell.tab("inspector").dataJson.includes("Invoice number · Text"));
  press(app, "tab", "Preview");
  eq("preview tab selected", app.host.shell.selectedTab, "_preview");
  eq("preview paper drawn", app.findById("mf-paper").id, "mf-paper");
}

// ---------------------------------------------------------------------------
section("context menu and an extension command");
{
  const app = open();
  press(app, "treeitem", "Documents by Class");
  press(app, "row", "Invoice");
  ok("right-click the invoice", press(app, "row", "Invoice #998 - UPS", 2));
  const items = named(app, "menuitem");
  ok("menu has built-ins and the extension command", items.includes("Check out") && items.includes("Pin") && items.includes("Approve invoice") && items.includes("Say hello"), items.join(" | "));
  ok("press Approve invoice", press(app, "menuitem", "Approve invoice"));
  app.tick(16);
  app.displayListJson();
  eq("approved in the vault", propText(app, "Invoice #998 - UPS", 1009), "Yes");
  const status = nodes(app).filter((n) => n.role === "status").map((n) => n.name).join(" ");
  ok("a toast is on screen", app.host.shell.toasts.some((t) => t.title === "Invoice approved"), status);
  press(app, "button", "Delete");
  ok("delete of an approved invoice is vetoed and explained", named(app, "dialog").length === 1 && !find(app, "Invoice #998 - UPS").deleted, named(app, "dialog").join(" | "));
  ok("close the dialog", press(app, "button", "OK"));
  eq("dialog gone", named(app, "dialog"), []);
}

// ---------------------------------------------------------------------------
section("editing metadata");
{
  const app = open();
  press(app, "row", "Job Application, Paula McEnroe");
  ok("press Edit metadata", press(app, "button", "Edit metadata"));
  ok("text field for Position applied for", !!node(app, "textbox", "Position applied for"));
  press(app, "textbox", "Position applied for");
  eq("the field has the keyboard", app.focusedField(), "mf-field-1015");
  const st = JSON.parse(app.fieldStateJson("mf-field-1015"));
  ok("the field state carries a box for the proxy", st.box && st.box.w > 100, JSON.stringify(st));
  app.applyEdit("mf-field-1015", "Team Lead", 9, 9);
  ok("department is a combobox", press(app, "combobox", "Department"));
  ok("its list offers Finance", named(app, "option").includes("Finance"), named(app, "option").join(" | "));
  press(app, "option", "Finance");
  ok("press Save", press(app, "button", "Save"));
  eq("position saved", propText(app, "Job Application, Paula McEnroe", 1015), "Team Lead");
  eq("department saved", propText(app, "Job Application, Paula McEnroe", 1008), "Finance");
  eq("one new version", find(app, "Job Application, Paula McEnroe").latest().version, 2);

  press(app, "button", "Edit metadata");
  press(app, "textbox", "Position applied for");
  app.applyEdit("mf-field-1015", "", 0, 0);
  press(app, "button", "Save");
  eq("a required property cannot be emptied", app.editError, "Required: Position applied for");
  ok("the card stays open to fix it", named(app, "button").includes("Save"));
  app.keyWith("Escape", false, false);
  app.displayListJson();
  eq("escape discards", propText(app, "Job Application, Paula McEnroe", 1015), "Team Lead");
}

// ---------------------------------------------------------------------------
section("a chip field: the invoice's Customer");
{
  // Customer is a multi-select lookup, which the card draws as gallery/ui's
  // ComboboxCtl with chips. The rules exercised here are the ones that
  // controller measured on Base UI; this checks they reach the vault.
  const app = open();
  const title = "Invoice #1035 - Fortney Nolte Associates";
  press(app, "row", title);
  ok("press Edit metadata on the invoice", press(app, "button", "Edit metadata"));
  ok("Customer is a combobox", !!node(app, "combobox", "Customer"));
  ok("with the existing customer as a chip", !!node(app, "button", "Remove Fortney Nolte Associates"));
  ok("open its list", press(app, "combobox", "Customer"));
  ok("it offers UPS", named(app, "option").includes("UPS"), named(app, "option").join(" | "));
  press(app, "option", "UPS");
  ok("picking adds a second chip", !!node(app, "button", "Remove UPS"));
  ok("and the list stays open — a multiple pick does not close it", named(app, "option").length > 0);
  app.keyWith("Escape", false, false);
  app.displayListJson();
  ok("Escape closes the list and leaves the card open", named(app, "option").length === 0 && named(app, "button").includes("Save"));
  app.keyWith("Backspace", false, false);
  app.displayListJson();
  ok("Backspace in the empty box takes the last chip", !node(app, "button", "Remove UPS") && !!node(app, "button", "Remove Fortney Nolte Associates"));
  press(app, "combobox", "Customer");
  press(app, "option", "CBC Company");
  press(app, "button", "Save");
  const saved = propText(app, title, 1001) || "";
  ok("both customers reached the vault", saved.includes("Fortney Nolte Associates") && saved.includes("CBC Company"), saved);
  eq("as one new version", find(app, title).latest().version, 2);

  // The pills (RadioGroupCtl in toggle mode) and the date (DateFieldCtl):
  // Approved goes from No to Yes with a press, the due date is typed segment
  // by segment — two digits fill a segment and move on, measured on Chromium.
  press(app, "button", "Edit metadata");
  ok("Approved is a radio group of two", !!node(app, "radio", "Yes") && !!node(app, "radio", "No"));
  ok("press Yes", press(app, "radio", "Yes"));
  const due = node(app, "group", "Due date");
  ok("the due date is a date field", !!due);
  // Its Month segment: the textbox inside the group's rectangle, because the
  // invoice has two date fields and both have a "Month".
  const inside = (n) => n.b && due.b && n.b[0] >= due.b[0] && n.b[0] + n.b[2] <= due.b[0] + due.b[2] && n.b[1] >= due.b[1] && n.b[1] + n.b[3] <= due.b[1] + due.b[3];
  const month = nodes(app).find((n) => n.role === "textbox" && n.name === "Month" && inside(n));
  ok("with a Month segment", !!month);
  app.pointerDown(month.b[0] + month.b[2] / 2, month.b[1] + month.b[3] / 2, 0);
  app.displayListJson();
  for (const ch of "12252025") { app.keyWith(ch, false, false); app.displayListJson(); }
  app.displayListJson();
  press(app, "button", "Save");
  eq("Approved saved as Yes", propText(app, title, 1009), "Yes");
  eq("the typed date saved as a date", propText(app, title, 1014), "12/25/2025");
  eq("version 3", find(app, title).latest().version, 3);
}

// ---------------------------------------------------------------------------
section("search, dialogs, modes");
{
  const app = open();
  press(app, "textbox", "Search");
  eq("search takes the keyboard", app.focusedField(), "mf-search");
  app.applyEdit("mf-search", "ups", 3, 3);
  app.keyWith("Enter", false, false);
  app.displayListJson();
  const hits = named(app, "row");
  ok("full-text search", hits.includes("Invoice #811 - UPS") && hits.includes("UPS"), hits.join(" | "));

  press(app, "row", "Invoice #811 - UPS");
  press(app, "button", "Say hello");
  eq("the extension's message is a dialog", named(app, "dialog"), ["Hello World"]);
  press(app, "button", "Nice");
  eq("closed by its button", named(app, "dialog"), []);
  ok("the promise resolved in the extension", app.host.shell.logs.some((l) => l.text === "the user pressed button 1"));

  ok("switch to UIX v1", press(app, "radio", "UIX v1"));
  eq("mode", app.modeNow(), 1);
  press(app, "row", "Invoice #811 - UPS", 2);
  const items = named(app, "menuitem");
  ok("the v1 commands replace the v2 ones", items.includes("Property report (v1)") && !items.includes("Say hello"), items.join(" | "));
}

// ---------------------------------------------------------------------------
section("a phone");
{
  const app = open();
  app.setPageSize(390, 780);
  app.displayListJson();
  eq("stylesheet still parses", app.styleErrorCount(), 0);
  const bar = ["Views", "Objects", "Details", "Code", "Console"];
  eq("a bottom bar of screens", named(app, "tab").filter((t) => bar.includes(t)), bar);
  ok("the objects are the first screen", named(app, "row").includes("Job Application, Paula McEnroe"));
  ok("with no navigation column beside them", !named(app, "treeitem").includes("Documents by Class"));
  ok("press Views", press(app, "tab", "Views"));
  ok("the views screen", named(app, "treeitem").includes("Documents by Class"), named(app, "treeitem").join(" | "));
  press(app, "treeitem", "Documents by Class");
  ok("a view goes back to the objects", named(app, "row").includes("Invoice"), named(app, "row").join(" | "));
  press(app, "row", "Invoice");
  press(app, "row", "Invoice #998 - UPS");
  ok("an object opens its details", named(app, "button").includes("Edit metadata"), named(app, "button").join(" | "));
  press(app, "tab", "Code");
  eq("the code screen is the pane's code tab", app.host.shell.selectedTab, "_code");
  ok("with room for the editor", JSON.parse(app.codeRectJson()).w === 390);
  press(app, "tab", "Console");
  ok("the console screen", nodes(app).some((n) => n.role === "log"));
}

// ---------------------------------------------------------------------------
section("previews with the gallery's viewers");
{
  const app = open();
  press(app, "row", "Job Application, Paula McEnroe");
  eq("the metadata tab shows no viewer", JSON.parse(app.previewJson()), null);
  press(app, "tab", "Preview");
  const word = JSON.parse(app.previewJson());
  ok("a .docx asks for the Word viewer", word && word.kind === "docx" && word.url === "samples/20-business-report.docx", JSON.stringify(word));
  ok("over the pane's box", word && word.w > 200 && word.h > 200 && word.x > 0, JSON.stringify(word));
  eq("and the pane is left as a hole", app.hitId(word.x + 20, word.y + 20), "mf-pscroll");
  press(app, "row", "Sales Invoice 237 - City of Chicago (Planning and Development)");
  const sheet = JSON.parse(app.previewJson());
  ok("an .xlsx asks for the spreadsheet", sheet && sheet.kind === "xlsx" && sheet.url === "samples/sales.xlsx", JSON.stringify(sheet));
  press(app, "row", "Invoice #998 - UPS");
  eq("a PDF keeps the text preview", JSON.parse(app.previewJson()), null);
  const samples = vault(app)
    .objects.map((o) => o.latest())
    .flatMap((v) => v.files)
    .map((f) => f.sample)
    .filter(Boolean);
  for (const s of new Set(samples)) ok(`${s} is in the build's sample list`, read("web/build.mjs").includes(`"${s.replace("samples/", "")}"`));
}

if (failures.length) {
  console.log(`\n  ${failures.length} failed, ${passed} passed\n`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n  app: ${passed} passed\n`);
