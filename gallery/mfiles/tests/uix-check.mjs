#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// UIX applications against the emulator, with no browser.
//
//   npm run mfiles:uix:test
//
// Loads the sample applications into MfUixHost — each in its own Ranger
// ComponentEngine — and drives them the way the UI does: select, run a
// command, press a dialog button, switch UIX mode. Asserts on the shell state
// and the vault, never on pixels.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);
const COMPILED = path.join(MODULE, "bin", "MfUixHost.cjs");
if (!fs.existsSync(COMPILED)) {
  console.error("MfUixHost is not built — run `npm run mfiles:uix:build` first");
  process.exit(3);
}
const { MfUixHost } = require_(COMPILED);

const read = (rel) => fs.readFileSync(path.join(MODULE, rel), "utf8");

export function loadScripts(host) {
  host.setScripts(read("uix/uix-api.js"), read("uix/uix-core.js"), read("uix/uix1-prelude.js"), read("uix/uix2-prelude.js"), read("uix/mfgrpc.js"));
}

export function readApp(file) {
  const source = read(path.join("extensions", file));
  const tag = (name) => (source.match(new RegExp("@" + name + "\\s+(.+)")) || [])[1]?.trim() ?? "";
  return { file, name: tag("name"), guid: tag("guid"), version: Number(tag("uix") || "2"), source };
}

let passed = 0;
const failures = [];
const ok = (name, cond, detail) => (cond ? (passed += 1) : failures.push(`${name}${detail ? `\n      ${detail}` : ""}`));
const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
const section = (t) => process.stdout.write(`\n  ${t}\n`);

const errors = (host) => host.shell.logs.filter((l) => l.level === "error").map((l) => `${l.appId}: ${l.text}`);
const logText = (host) => host.shell.logs.map((l) => `[${l.level}] ${l.appId}: ${l.text}`).join("\n");
const menu = (host, context) => host.shell.visibleMenu(context).map((m) => host.shell.command(m.commandId).name);
const openDialogs = (host) => host.shell.dialogs.filter((d) => d.open);
const findObject = (host, title) => host.shell.vault.objects.find((o) => o.latest().title() === title);
const propText = (host, obj, pd) => {
  const v = obj.latest().prop(pd);
  return v.propDef < 0 ? null : host.shell.vault.valueText(pd, v.value);
};
function select(host, title) {
  const o = findObject(host, title);
  host.shell.select(o.objectType, o.id, false);
  host.notifySelection();
  return o;
}
function run(host, name) {
  const c = host.shell.commands.find((x) => x.name === name);
  if (!c) throw new Error(`no command named ${name}`);
  host.runCustomCommand(c.id);
}

const APPS = ["hello-world-v2.js", "metadata-inspector-v2.js", "invoice-approval-v2.js", "property-report-v1.js"].map(readApp);

function boot(mode) {
  const host = MfUixHost.withSampleVault();
  loadScripts(host);
  host.mode = mode;
  for (const a of APPS) host.addApp(a.name, a.guid, a.version, a.source);
  return host;
}

// ---------------------------------------------------------------------------
section("UIX v2 mode");
{
  const host = boot(2);
  eq("three v2 apps run, the v1 app is refused", host.apps.map((a) => a.running), [true, true, true, false]);
  ok("refusal names both versions", /UIX v1 application.*UIX v2 mode/.test(host.apps[3].error), host.apps[3].error);
  eq("no errors on start", errors(host), []);
  eq("started toast", host.shell.toasts.map((t) => t.title), ["Hello World"]);
  eq("task pane commands", menu(host, false), ["Say hello", "Find unapproved invoices"]);
  eq("context menu before selection (approve hidden)", menu(host, true), ["Say hello"]);
  ok("inspector tab added before Preview", host.shell.tabs.map((t) => t.tabId).join(",") === "_metadata,inspector,_preview,_code", host.shell.tabs.map((t) => t.tabId).join(","));

  select(host, "Job Application, Paula McEnroe");
  const tab = host.shell.tab("inspector");
  ok("inspector shows the selection", tab.dataJson.includes("Position applied for · Text"), tab.dataJson.slice(0, 300));
  ok("inspector shows lookup names", tab.dataJson.includes("Job Application"), tab.dataJson.slice(0, 300));

  run(host, "Say hello");
  const hello = openDialogs(host);
  eq("hello dialog", hello.map((d) => [d.caption, d.text, d.buttons.join("|")]), [["Hello World", "Hello, Job Application, Paula McEnroe!", "Nice|Close"]]);
  host.closeDialog(hello[0].id, 1);
  ok("dialog promise resolved with the button", logText(host).includes("the user pressed button 1"), logText(host));

  select(host, "Invoice #998 - UPS");
  eq("approve visible on an unapproved invoice", menu(host, true), ["Approve invoice", "Say hello"]);
  run(host, "Approve invoice");
  const inv = findObject(host, "Invoice #998 - UPS");
  eq("invoice approved in the vault", propText(host, inv, 1009), "Yes");
  eq("approval made a new version", inv.latest().version, 2);
  ok("success toast", host.shell.toasts.some((t) => t.title === "Invoice approved" && t.kind === 1), JSON.stringify(host.shell.toasts.map((t) => t.title)));
  eq("approve hidden again", menu(host, true), ["Say hello"]);

  eq("delete vetoed for an approved invoice", host.builtinCommand(76), false);
  ok("veto explained", openDialogs(host).some((d) => d.text === "Approved invoices cannot be deleted."));
  openDialogs(host).forEach((d) => host.closeDialog(d.id, 1));
  select(host, "Job Application, Tina Cordwell");
  eq("delete allowed for a job application", host.builtinCommand(76), true);

  run(host, "Find unapproved invoices");
  const found = openDialogs(host).find((d) => d.caption === "Unapproved invoices");
  ok("search found the remaining unapproved invoices", found && found.text.startsWith("4 invoice(s) waiting"), found && found.text);
  eq("no errors in v2 run", errors(host), []);
}

// ---------------------------------------------------------------------------
section("UIX v1 mode");
{
  const host = boot(2);
  host.setMode(1);
  eq("after switching, only the v1 app runs", host.apps.map((a) => a.running), [false, false, false, true]);
  eq("v2 commands are gone", menu(host, false), []);
  eq("v1 context menu", menu(host, true), ["Property report (v1)", "Mark reviewed (v1)"]);

  select(host, "Invoice #2304 - CBC");
  run(host, "Property report (v1)");
  const report = openDialogs(host)[0];
  ok("v1 report lists class and customer", report && report.text.includes("Class: Invoice") && report.text.includes("Customer: CBC Company"), report && report.text);

  run(host, "Mark reviewed (v1)");
  const obj = findObject(host, "Invoice #2304 - CBC");
  eq("v1 check out / SetProperty / check in wrote the keyword", propText(host, obj, 1010), "reviewed");
  ok("v1 logged the new version", logText(host).includes("marked reviewed, now version 2"), logText(host));
  eq("no errors in v1 run", errors(host), []);
}

// ---------------------------------------------------------------------------
section("errors reach the console");
{
  const host = MfUixHost.withSampleVault();
  loadScripts(host);
  host.addApp("broken", "{BROKEN}", 2, "function OnNewShellUI(ui) { ui.Events.Register(Event.NewShellFrame, async (f) => { await ui.Vault.ObjectOperations.GetTemplates({}); }); }");
  ok("a 501 from an unemulated method is reported", errors(host).some((e) => e.includes("GetTemplates")), errors(host).join("\n"));
  host.addApp("syntax", "{SYNTAX}", 2, "function OnNewShellUI(ui) { ui.Events.Register(");
  ok("a syntax error stops the app", host.apps[1].running === false && host.apps[1].error.startsWith("Syntax error"), host.apps[1].error);
}

// ---------------------------------------------------------------------------
if (failures.length) {
  console.log(`\n  ${failures.length} failed, ${passed} passed\n`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n  uix: ${passed} passed\n`);
