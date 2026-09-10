#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE TREE-SHAKEN APP IS THE SAME APP.
//
//   npm run rt:shaken        (after: npm run rt:page)
//
// The page ships the compiled app as an ES module so the bundler can drop what
// nothing reaches (web/build.mjs). Of 359 classes it keeps about fifty: the
// Vega-Lite compiler stays because the stats cards reach it, the compact
// parser goes because nothing in the browser does. That analysis is static and
// therefore sound — but "sound" is a claim about esbuild, and the cost of it
// being wrong is a screen that throws in front of a visitor and nowhere else.
//
// So this drives BOTH modules — the CommonJS one every Node check uses, and a
// bundle of the ES one with tree shaking on — through the same script, and
// holds their display lists against each other frame for frame. A class that
// was dropped and is in fact needed cannot survive this: it throws, or it
// draws something different.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { assertDomInstalled, MissingDomDeps } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, "..", "bin");
const require_ = createRequire(import.meta.url);
if (!fs.existsSync(path.join(BIN, "RealTrainerDemo.mjs"))) {
  console.error("the ES module view is missing — run `npm run rt:page` first");
  process.exit(3);
}

let esbuild;
try {
  assertDomInstalled();
  esbuild = createRequire(path.join(HERE, "..", "..", "ui", "conformance", "dom", "package.json"))("esbuild");
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}

// The same entry surface the page imports, bundled for Node so it can be
// driven here. Not minified: a name in a stack trace is worth more than bytes
// in a file nothing ships.
const SHAKEN = path.join(BIN, "RealTrainerDemo.shaken.cjs");
await esbuild.build({
  stdin: {
    contents:
      'export { RealTrainerDemo, EVGHostTextMeasurer, EVGDefaultMeasurer } from "./RealTrainerDemo.mjs";',
    resolveDir: BIN,
    loader: "js",
  },
  bundle: true,
  format: "cjs",
  platform: "node",
  treeShaking: true,
  outfile: SHAKEN,
  logLevel: "error",
});

const whole = require_(path.join(BIN, "RealTrainerDemo.cjs"));
const shaken = require_(SHAKEN);

const read = (...p) => fs.readFileSync(path.join(HERE, ...p), "utf8");
const CSS = read("realtrainer.css");
const COMPACT = read("..", "fixtures", "session.compact");
const PLAN = read("..", "fixtures", "machines", "planDialog.machine.json");
const CHAT = read("..", "fixtures", "machines", "chat.machine.json");
const SEED = read("..", "fixtures", "reference", "seed.json");

/** The app, set up as the page sets it up. */
function make(mod) {
  const app = new mod.RealTrainerDemo();
  app.init(CSS, COMPACT);
  app.loadPlanMachine(PLAN);
  app.loadChatMachine(CHAT);
  app.setToday("2026-02-09");
  app.loadReference(SEED);
  app.setPageSize(390, 844);
  app.openRoute("/");
  return app;
}

// Every screen that is worth a class: the stats tab is the one that reaches
// the chart compiler, which is the largest thing in the bundle and the whole
// reason this check exists.
const SCRIPT = [
  ["home", (a) => a.openRoute("/")],
  ["the calendar", (a) => a.openRoute("/calendar/cal-train")],
  // The way `scroll-check.mjs` gets there: the tab only exists on Home, and
  // Home only has the statistics to draw once a training calendar is open.
  ["home again", (a) => a.press("rt-nav-home")],
  ["the stats tab — the charts", (a) => a.press("rt-home-tab-stats")],
  ["the calculator over it", (a) => a.press("rt-stats-calc")],
  ["the year sheet", (a) => a.openRoute("/yearsheet")],
  ["back home", (a) => a.press("rt-nav-home")],
];

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

const a = make(whole);
const b = make(shaken);
ok("both modules start", true);

for (const [name, step] of SCRIPT) {
  let ea = null, eb = null;
  try { step(a); a.display(); a.tick(16); } catch (e) { ea = String((e && e.stack) || e); }
  try { step(b); b.display(); b.tick(16); } catch (e) { eb = String((e && e.stack) || e); }
  if (ea || eb) {
    ok(`${name}: neither module threw`, false, `whole: ${ea || "ok"} / shaken: ${eb || "ok"}`);
    continue;
  }
  const la = a.displayListJson();
  const lb = b.displayListJson();
  const na = JSON.parse(la).cmds.length;
  ok(`${name}: the same frame, command for command`, la === lb, `${na} vs ${JSON.parse(lb).cmds.length} commands`);
  if (la === lb) console.log(`         ${na} commands`);
}

// And say what was actually dropped, because a number nobody prints is a
// number nobody notices going to zero.
// esbuild writes `var X = class {…}` where the backend wrote `class X {…}`,
// and prefixes a renamed class with an underscore; count both shapes.
const classesIn = (file) => {
  const text = fs.readFileSync(file, "utf8");
  const names = new Set();
  for (const m of text.matchAll(/^\s*class ([A-Za-z0-9_$]+)/gm)) names.add(m[1].replace(/^_/, ""));
  for (const m of text.matchAll(/^\s*var ([A-Za-z0-9_$]+) = class\b/gm)) names.add(m[1].replace(/^_/, ""));
  return names;
};
const before = classesIn(path.join(BIN, "RealTrainerDemo.cjs"));
const after = classesIn(SHAKEN);
const dropped = [...before].filter((c) => !after.has(c) && !after.has("_" + c));
console.log(`\n  ${before.size} classes compiled, ${before.size - dropped.length} reachable, ${dropped.length} dropped`);
console.log(`  dropped: ${dropped.slice(0, 12).join(", ")}${dropped.length > 12 ? ", …" : ""}`);

console.log(`\npassed = ${passed}  failed = ${failed}`);
console.log(failed === 0 ? "ALL PASS" : `${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
