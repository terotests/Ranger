#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// OtpCtl against input-otp, the library behind shadcn's Input OTP.
//
//   node gallery/ui/conformance/oracle/otp_check.mjs
//
// Replays every scenario `otp_oracle.mjs` captured into `otp.json` against the
// controller: the same starting value, the same keys, characters, clicks and
// pastes, and after every step the value, the selection, the active slots, the
// slot with the fake caret, and how many times the code has been completed.
// Two scenarios are held out and asserted the other way round — see DIVERGES.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const O = JSON.parse(fs.readFileSync(path.join(HERE, "otp.json"), "utf8"));

let pass = 0;
let fail = 0;
const ok = (what, cond, detail) => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : " — " + detail}`);
};

// A click while the field already has focus lands where the browser's caret
// placement in input-otp's invisible, letter-spacing-squeezed text says. The
// capture shows slot 0 selecting slot 3. That is reproduced nowhere on
// purpose; the controller selects the slot that was clicked.
const HELD_OUT = new Set(["click_while_focused", "click_while_focused_partial"]);

const FIELDS = {
  digits: { maxLength: 6, digitsOnly: true },
  free: { maxLength: 4, digitsOnly: false },
};

const mk = (field, value) => {
  const c = new H.OtpCtl();
  c.tid = "otp";
  c.name = "One-time code";
  c.maxLength = FIELDS[field].maxLength;
  c.digitsOnly = FIELDS[field].digitsOnly;
  c.setValue(value || "");
  c.completeCount = 0;
  c.blur();
  return c;
};

const read = (c) => {
  const n = c.maxLength;
  const active = [];
  const caret = [];
  const chars = [];
  for (let i = 0; i < n; i++) {
    if (c.isActive(i)) active.push(i);
    if (c.hasFakeCaret(i)) caret.push(i);
    chars.push(c.charAtSlot(i));
  }
  return {
    value: c.value,
    selStart: c.focused ? c.selStart : null,
    selEnd: c.focused ? c.selEnd : null,
    focused: c.focused,
    active,
    caret,
    chars,
    complete: c.completeCount,
  };
};

const fmt = (o) =>
  `${o.value.padEnd(6, "_")} sel=[${o.selStart},${o.selEnd}] act=[${o.active}] car=[${o.caret}] ${o.focused ? "F" : "-"} c=${o.complete}`;

const same = (got, want, complete0) =>
  got.value === want.value &&
  got.focused === want.focused &&
  got.selStart === want.selStart &&
  got.selEnd === want.selEnd &&
  got.active.join() === want.active.join() &&
  got.caret.join() === want.caret.join() &&
  got.chars.join("|") === want.chars.join("|") &&
  got.complete === want.complete - complete0;

// The oracle's step, done to the controller.
function apply(c, st) {
  if (st.type !== undefined) {
    for (const ch of st.type) c.typeChar("otp", ch);
    return;
  }
  if (st.click !== undefined) {
    c.activate(c.slotTid(st.click));
    return;
  }
  if (st.paste !== undefined) {
    // Loading the clipboard moved focus off the field; it comes back the way
    // `via` says, and the focus handler runs again.
    c.blur();
    if (st.via === "tab") c.focus();
    else c.activate(c.slotTid(st.via));
    c.paste(st.paste);
    return;
  }
  const key = st.key;
  if (key === "Tab") {
    if (c.focused) c.keyDownWith("otp", "Tab", false, false);
    else c.focus();
    return;
  }
  if (key === "Shift+Tab") {
    c.keyDownWith("otp", "Tab", true, false);
    return;
  }
  if (key === "ControlOrMeta+a") {
    c.keyDownWith("otp", "a", false, true);
    return;
  }
  c.keyDownWith("otp", key, false, false);
}

const stepName = (st) =>
  st.key || (st.type !== undefined ? "type " + st.type : st.click !== undefined ? "click " + st.click : `paste ${st.paste} via ${st.via}`);

console.log(`REPLAY — ${O.order.length - HELD_OUT.size} scenarios from ${O.library} in ${O.browser}`);
for (const name of O.order) {
  if (HELD_OUT.has(name)) continue;
  const sc = O.scenarios[name];
  const c = mk(sc.field, sc.start.value);
  const complete0 = sc.start.complete;
  const bad = [];
  let got = read(c);
  if (!same(got, sc.start, complete0)) bad.push(`start: got ${fmt(got)} want ${fmt(sc.start)}`);
  for (const st of sc.steps) {
    apply(c, st);
    got = read(c);
    if (!same(got, st, complete0)) bad.push(`${stepName(st)}: got ${fmt(got)} want ${fmt(st)}`);
  }
  ok(name, bad.length === 0, bad.join("; "));
}

console.log("DIVERGES — a click on a focused field selects the slot clicked, not where the hidden caret fell");
for (const name of [...HELD_OUT]) {
  const sc = O.scenarios[name];
  const c = mk(sc.field, sc.start.value);
  c.focus();
  const seen = [];
  for (const st of sc.steps) {
    if (st.click === undefined) continue;
    c.activate(c.slotTid(st.click));
    const len = c.value.length;
    const want = st.click < len ? [st.click, st.click + 1] : len < c.maxLength ? [len, len] : [c.maxLength - 1, c.maxLength];
    seen.push(`slot ${st.click}: reference [${st.selStart},${st.selEnd}], this [${c.selStart},${c.selEnd}]`);
    ok(`${name}: slot ${st.click} clicked selects [${want}]`, c.selStart === want[0] && c.selEnd === want[1], `got [${c.selStart},${c.selEnd}]`);
  }
  console.log(`    reference: ${seen.join("; ")}`);
}

console.log("SPECIFIED — what the oracle could not say");
{
  const a = O.inputAttrs;
  ok("the reference's hidden input is inputmode numeric with autocomplete one-time-code",
    a.inputmode === "numeric" && a.autocomplete === "one-time-code", JSON.stringify(a));
  const c = mk("digits", "123");
  const rows = Array.from(c.rows());
  ok("one text field row, named, carrying the whole code", rows.length === 1 && rows[0].role === 7 && rows[0].text === "123" && rows[0].name === "One-time code");
  ok("with a roledescription the bench can recognise", rows[0].roleDescription === "One-time code");
  ok("no selection is published while unfocused", rows[0].hasSelection === false);
  c.focus();
  const r2 = Array.from(c.rows())[0];
  ok("the selection is published when focused", r2.hasSelection && r2.selStart === 3 && r2.selEnd === 3);
  c.build();
  const root = c.rootEl;
  ok("six slots are built", root.children.length === 6, String(root.children.length));
  ok("the fourth is the caret slot and active", root.children[3].className.includes("ui-otp-slot-caret") && root.children[3].className.includes("ui-otp-slot-active"));
  ok("filled slots show their character", root.children[0].textContent === "1" && root.children[2].textContent === "3" && root.children[4].textContent === "");
  const g = mk("digits", "");
  g.groupSize = 3;
  g.build();
  ok("a group size draws a separator between groups", g.rootEl.children.length === 7 && g.rootEl.children[3].textContent === "-", String(g.rootEl.children.length));
  const d = mk("digits", "");
  ok("a disabled field is not focusable", (() => { d.disabled = true; return d.isFocusable("otp") === false; })());
  ok("setValue cuts to the length", (() => { const x = mk("digits", "12345678"); return x.value === "123456"; })());
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log("ALL PASS");
