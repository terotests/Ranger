#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// DateFieldCtl against Chromium's own <input type="date">.
//
//   node gallery/ui/conformance/oracle/datefield_check.mjs
//
// Replays every scenario `datefield_oracle.mjs` captured into `datefield.json`
// against the controller: the same starting value, the same keys and typed
// digits, and after every step the three segments' shown text, the segment the
// keyboard is in, and the committed ISO value. Nothing here restates a number
// the oracle measured; a rule that is specified rather than measured says so.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const O = JSON.parse(fs.readFileSync(path.join(HERE, "datefield.json"), "utf8"));

let pass = 0;
let fail = 0;
const ok = (what, cond, detail) => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : " — " + detail}`);
};

// The oracle ran in 2026 and the empty year steps to the current year; the
// controller is told the same year rather than asked to know the date.
const CAPTURE_YEAR = (() => {
  const s = O.scenarios.arrows_on_empty_day_year;
  const y = s && s.steps.map((st) => st.segs.year).find((v) => v !== "");
  return y ? Number(y) : new Date().getFullYear();
})();

const SEG = ["month", "day", "year"];

const mk = (iso) => {
  const c = new H.DateFieldCtl();
  c.tid = "df";
  c.name = "Date";
  c.todayYear = CAPTURE_YEAR;
  if (iso) c.setIso(iso);
  return c;
};

// The controller's observation in the oracle's vocabulary.
const read = (c, focusTid) => {
  const segs = { month: c.shown(0), day: c.shown(1), year: c.shown(2) };
  let focus;
  if (focusTid === "") focus = "";
  else focus = SEG[[c.segTid(0), c.segTid(1), c.segTid(2)].indexOf(focusTid)] || "?";
  return { value: c.isoValue(), segs, focus };
};

const same = (got, want) =>
  got.value === want.value &&
  got.focus === want.focus &&
  SEG.every((k) => got.segs[k] === want.segs[k]);

const fmt = (o) => `${o.segs.month || "__"}/${o.segs.day || "__"}/${o.segs.year || "____"} @${o.focus || "-"} value=${JSON.stringify(o.value)}`;

console.log(`REPLAY — ${O.order.length} scenarios from ${O.browser}, ${O.locale}`);
for (const name of O.order) {
  const sc = O.scenarios[name];
  const c = mk(sc.start.value);
  // Tab in from the element before: the month.
  let focus = c.enterFrom(false);
  let want = { value: sc.start.value, segs: sc.start.segs, focus: sc.start.focus };
  let got = read(c, focus);
  const bad = [];
  if (!same(got, want)) bad.push(`start: got ${fmt(got)} want ${fmt(want)}`);
  for (const st of sc.steps) {
    if (st.type) {
      for (const ch of st.type) c.typeChar(focus, ch);
      focus = c.focusTid();
    } else {
      const shift = st.key.startsWith("Shift+");
      const key = shift ? st.key.slice(6) : st.key;
      const landed = c.keyDownWith(focus, key, shift, false);
      // "" from a Tab means the box was left — the oracle's focus then names
      // the neighbouring button, which this controller does not own.
      if (key === "Tab") focus = landed;
      else if (landed !== "") focus = landed;
    }
    want = { value: st.value, segs: st.segs, focus: st.focus };
    got = read(c, focus);
    const left = key_left(st) && focus === "";
    const agree = left ? same({ ...got, focus: want.focus }, want) : same(got, want);
    if (!agree) bad.push(`${st.key || "type " + st.type}: got ${fmt(got)} want ${fmt(want)}`);
  }
  ok(name, bad.length === 0, bad.join("; "));
}

function key_left(st) {
  // The oracle reports "" (after) or "before" once the field is left; the
  // controller reports "" for both, which is all a host needs.
  return st.key === "Tab" || st.key === "Shift+Tab";
}

console.log("SPECIFIED — what the oracle could not say");
{
  const c = mk("2026-05-20");
  const rows = Object.fromEntries(Array.from(c.rows()).map((r) => [r.tid, r]));
  ok("the box is a group named by the field", rows.df.role === 1 && rows.df.name === "Date", `${rows.df.role}/${rows.df.name}`);
  ok("its text is the ISO value", rows.df.text === "2026-05-20", rows.df.text);
  ok("three segments named Month, Day, Year under it",
    ["df-month", "df-day", "df-year"].every((t) => rows[t] && rows[t].parentTid === "df") &&
      rows["df-month"].name === "Month" && rows["df-day"].name === "Day" && rows["df-year"].name === "Year");
  ok("each says spinbutton in its roledescription, as Chromium's role is",
    ["df-month", "df-day", "df-year"].every((t) => rows[t].roleDescription === "spinbutton"));
  ok("their text is what they show", rows["df-month"].text === "05" && rows["df-day"].text === "20" && rows["df-year"].text === "2026");
  ok("only the month is a tab stop; all three are focusable",
    rows["df-month"].tabStop && !rows["df-day"].tabStop && !rows["df-year"].tabStop && SEG.every((k) => rows["df-" + k].focusable));
  const e = mk("");
  const er = Object.fromEntries(Array.from(e.rows()).map((r) => [r.tid, r]));
  ok("an empty segment publishes its hint as the placeholder", er["df-month"].placeholder === "mm" && er["df-year"].placeholder === "yyyy" && er["df-month"].text === "");
  ok("Shift+Tab into the box lands on the year", e.enterFrom(true) === "df-year");
  ok("a click on the box itself goes to the month", e.activate("df") === "df-month");
  ok("a click on the day goes to the day", e.activate("df-day") === "df-day");
  const f = mk("2026-01-31");
  f.enterFrom(false);
  f.keyDown("df-month", "ArrowUp");
  ok("February 31 is empty, then the calendar's own arithmetic decides", f.isoValue() === "" && f.month === 2 && f.day === 31);
  const g = mk("2024-02-29");
  ok("a leap day is a value", g.isoValue() === "2024-02-29");
  g.enterFrom(false);
  g.keyDown("df-year", "ArrowUp");
  ok("and is not one the year after", g.isoValue() === "" && g.year === 2025);
  const b = mk("");
  b.enterFrom(false);
  ok("a letter is refused and the keyboard stays", b.typeChar("df-month", "a") === false && b.focusTid() === "df-month");
  b.build();
  const root = b.rootEl;
  ok("the box builds three segments and two slashes",
    root.children.length === 5 && root.children[1].textContent === "/" && root.children[3].textContent === "/",
    String(root.children.length));
  ok("an empty segment is drawn with its hint and the hint class",
    root.children[0].textContent === "mm" && root.children[0].className.includes("ui-datefield-hint"));
  ok("the focused segment carries the focus class", root.children[0].className.includes("ui-datefield-seg-focus") && !root.children[2].className.includes("ui-datefield-seg-focus"));
  ok("setIso refuses a bad string and empties", (() => { const x = mk("2026-13-01"); return x.isoValue() === "" && x.month === 0; })());
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("ALL PASS");
