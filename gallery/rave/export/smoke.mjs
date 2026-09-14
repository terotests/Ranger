#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The exported application, checked without a browser: the module the
// build wrote opens the document the build wrote, and the M0 script — the
// guard, the keyboard, a sign-in, three widths — runs against it. This is
// the runtime the editor's Run tab drives, so what passed there passes here.
//
//   npm run rave:export:smoke

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { RaveExport } = await import(path.join(HERE, "generated-host.js"));

let failed = 0;
const ok = (name, cond, extra) => {
  if (cond) {
    console.log(`  PASS  ${name}`);
    return;
  }
  failed += 1;
  console.log(`  FAIL  ${name}${extra == null ? "" : "  — " + extra}`);
};

const json = fs.readFileSync(path.join(HERE, "app.rave.json"), "utf8");
ok("the document beside the page is one", RaveExport.isDocument(json));
ok("a string that is not one is refused", !RaveExport.isDocument("hello"));

const rt = RaveExport.open(json);
ok("the sheet parses clean", rt.styleErrorCount() === 0, rt.styleErrorCount() > 0 ? rt.styleError(0) : "");
const v = rt.addView("app", 1280, 800, false);
ok("one view, the window", rt.viewCount() === 1);
ok("it starts at /", rt.path() === "/");
const dl = JSON.parse(rt.displayListJson(v));
ok("the landing page is drawn", (dl.list.cmds || []).length > 10, `${(dl.list.cmds || []).length} commands`);
ok("…in the window's own coordinates", !dl.list.view || dl.list.view[0] === 0);
ok("the engine rejected nothing", rt.layoutWarningCount(v) === 0, rt.layoutWarningCount(v) > 0 ? rt.layoutWarning(v, 0) : "");
ok("it lints clean", rt.lintCount(v) === 0, rt.lintCount(v) > 0 ? rt.lint(v)[0] : "");

// --- the guard and the keyboard --------------------------------------------------
ok("the dashboard is protected", rt.navigate("/dashboard") && rt.path() === "/login", rt.path());
ok("Tab reaches the email field", rt.keyWith(v, "Tab", false, false));
ok("typing reaches it", rt.typeChar(v, "a") && rt.typeChar(v, "d"));
rt.keyWith(v, "Tab", false, false);
rt.keyWith(v, "Tab", false, false);
ok("Enter on the button signs in", rt.keyWith(v, "Enter", false, false));
ok("…onto the dashboard", rt.path() === "/dashboard", rt.path());
ok("…which shows Log out", JSON.stringify(JSON.parse(rt.displayListJson(v)).list.cmds).includes("Log out"));
ok("…and lints clean", rt.lintCount(v) === 0);

// --- the window's width is the breakpoint ------------------------------------------
rt.resizeView(v, 390, 800);
ok("at 390 the sidebar folds away", !JSON.stringify(JSON.parse(rt.displayListJson(v)).list.cmds).includes("Profile"));
rt.resizeView(v, 1280, 800);
ok("at 1280 it is back", JSON.stringify(JSON.parse(rt.displayListJson(v)).list.cmds).includes("Profile"));

// --- the kit runs here too -------------------------------------------------------------
rt.navigate("/settings");
const tabs = JSON.stringify(JSON.parse(rt.displayListJson(v)).list.cmds);
ok("the settings tabs are drawn", tabs.includes("Security") && tabs.includes("Billing"));

console.log(failed === 0 ? "\nALL PASS" : `\nfailed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
