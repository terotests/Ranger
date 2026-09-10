#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE WRITTEN-DOWN STYLESHEET DRAWS WHAT THE SOURCE DRAWS.
//
//   npm run rt:sheet        (after: npm run rt:build)
//
// PLAN_WEB_LOADING.md S5, C2. The page ships the stylesheet already parsed —
// `EVGStyleSheet.toText()`, produced in the build by the app's own parser —
// rather than 104 KB of CSS to be parsed again on every load on every device.
// That is only sound if the two are the same sheet, and "the same sheet" is
// not a claim about rule counts: it is a claim about the picture.
//
// So this parses the source, writes it down, reads it back, and then drives
// two apps — one given the CSS, one given the artifact — through the same
// screens, holding their display lists against each other command for
// command. It also compares the sheets rule by rule, because a difference
// there is easier to read than a difference in a frame.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require_ = createRequire(import.meta.url);
const BIN = path.join(HERE, "..", "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const M = require_(BIN);

const read = (...p) => fs.readFileSync(path.join(HERE, ...p), "utf8");
const CSS = read("realtrainer.css");
const COMPACT = read("..", "fixtures", "session.compact");
const PLAN = read("..", "fixtures", "machines", "planDialog.machine.json");
const CHAT = read("..", "fixtures", "machines", "chat.machine.json");
const SEED = read("..", "fixtures", "reference", "seed.json");

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

// --- the sheet, written down and read back ---------------------------------
const source = new M.EVGStyleSheet();
source.parse(CSS);
ok("the source parses without complaint", source.getErrorCount() === 0,
   source.getErrorCount() ? source.getError(0) : "");
const TEXT = source.toText();
ok("and says it is a written-down sheet", M.EVGStyleSheet.isSheetText(TEXT), TEXT.slice(0, 20));
const back = new M.EVGStyleSheet();
ok("which reads back", back.loadText(TEXT) === true);
ok("with the same rules", back.getRuleCount() === source.getRuleCount(),
   `${back.getRuleCount()} vs ${source.getRuleCount()}`);
ok("and the same palette", back.getVarCount() === source.getVarCount(),
   `${back.getVarCount()} vs ${source.getVarCount()}`);

let ruleDiff = 0;
let firstDiff = "";
for (let i = 0; i < source.rules.length; i += 1) {
  const a = source.rules[i], b = back.rules[i];
  const same = b
    && a.theme === b.theme && a.className === b.className
    && a.pseudo === b.pseudo && a.order === b.order
    && a.media.minWidth === b.media.minWidth && a.media.maxWidth === b.media.maxWidth
    && a.media.minHeight === b.media.minHeight && a.media.maxHeight === b.media.maxHeight
    && a.media.orientation === b.media.orientation && a.media.pointer === b.media.pointer
    && a.media.broken === b.media.broken
    && a.decls.length === b.decls.length
    && a.decls.every((d, j) => d.name === b.decls[j].name && d.value === b.decls[j].value);
  if (!same) {
    ruleDiff += 1;
    if (!firstDiff) firstDiff = `.${a.className}${a.pseudo ? ":" + a.pseudo : ""}`;
  }
}
ok("rule for rule, declaration for declaration", ruleDiff === 0,
   `${ruleDiff} differ, first ${firstDiff}`);

// --- and the same picture ---------------------------------------------------
function make(style) {
  const app = new M.RealTrainerDemo();
  app.init(style, COMPACT);
  app.loadPlanMachine(PLAN);
  app.loadChatMachine(CHAT);
  app.setToday("2026-02-09");
  app.loadReference(SEED);
  app.setPageSize(390, 844);
  app.openRoute("/");
  return app;
}
// The chart maker, on both: the app asks `RtCharts` for one and this check is
// a host (RtCharts.rgr).
M.RtCharts.install(new M.RtVelaChartMaker());

const SCRIPT = [
  ["home", (a) => a.openRoute("/")],
  ["the calendar", (a) => a.openRoute("/calendar/cal-train")],
  ["home again", (a) => a.press("rt-nav-home")],
  ["the stats tab", (a) => a.press("rt-home-tab-stats")],
  ["the year sheet", (a) => a.openRoute("/yearsheet")],
  ["hovered", (a) => a.setHover("rt-nav-home")],
  ["and wide", (a) => a.setPageSize(1200, 900)],
];

const fromCss = make(CSS);
const fromText = make(TEXT);
for (const [name, step] of SCRIPT) {
  try { step(fromCss); } catch (e) { /* a step the build of this app does not have */ }
  try { step(fromText); } catch (e) { /* … and it must be missing from both */ }
  fromCss.display(); fromCss.tick(16);
  fromText.display(); fromText.tick(16);
  const a = fromCss.displayListJson();
  const b = fromText.displayListJson();
  ok(`${name}: the same frame`, a === b, `${JSON.parse(a).cmds.length} vs ${JSON.parse(b).cmds.length} commands`);
}

const gz = (s) => require_("node:zlib").gzipSync(Buffer.from(s), { level: 9 }).length;
console.log(`\n  the source: ${CSS.length} bytes, ${gz(CSS)} gzipped`);
console.log(`  written down: ${TEXT.length} bytes, ${gz(TEXT)} gzipped ` +
            `(${source.getRuleCount()} rules, ${source.rules.reduce((n, r) => n + r.decls.length, 0)} declarations)`);

console.log(`\npassed = ${passed}  failed = ${failed}`);
console.log(failed === 0 ? "ALL PASS" : `${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
