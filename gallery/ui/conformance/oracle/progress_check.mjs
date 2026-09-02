#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// ProgressCtl against BOTH references at once.
//
//   node gallery/ui/conformance/oracle/progress_check.mjs
//
// Reads `progress.json` rather than restating its numbers. The two libraries
// disagree in fourteen places, so this gate is explicit about which side each
// assertion is on: `agreed` walks the cases where Radix and Base UI say the
// same thing, and `chosen` names the ones where a side was picked and why.
//
// The controller predates the capture and got the hard part right by
// reasoning. The capture found two things reasoning had not — it did not clamp
// and its percentage truncated — and both have their own section below.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const ORACLE = JSON.parse(fs.readFileSync(path.join(HERE, "progress.json"), "utf8"));

let pass = 0;
let fail = 0;
const eq = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};
const ok = (what, cond, detail) => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : " — " + detail}`);
};

const mk = (value, max) => {
  const host = new H.UiHost();
  const c = host.addProgress("pg", "Upload");
  c.maxValue = max === undefined ? 100 : max;
  if (value === null) c.indeterminate = true;
  else c.value = value;
  c.build();
  return c;
};
const row = (c) => Array.from(c.rows())[0];

console.log("MEASURED — where the two references AGREE, walked out of progress.json");
{
  // Only the cases both libraries answer identically are asserted here. The
  // rest are in `chosen` below, named as choices.
  const VALUES = { zero: 0, part: 40, full: 100, fraction: 33.333 };
  for (const [key, v] of Object.entries(VALUES)) {
    const r = ORACLE.radix[key], b = ORACLE.base[key];
    const c = mk(v);
    const got = row(c);
    if (String(r.valueNow) === String(b.valueNow)) {
      // valueNow is an int on the row; the references report the number they
      // were given, so a fractional value is compared as its rounded form and
      // that difference is stated rather than hidden.
      const want = Math.round(Number(r.valueNow));
      eq(`${key}: aria-valuenow`, got.valueNow, want);
      eq(`${key}: has a position at all`, got.hasValueNow, true);
    }
    if (String(r.valueMax) === String(b.valueMax)) eq(`${key}: aria-valuemax`, got.valueMax, r.valueMax);
    if (String(r.valueMin) === String(b.valueMin)) eq(`${key}: aria-valuemin`, got.valueMin, r.valueMin);
    if (String(r.valueText) === String(b.valueText)) eq(`${key}: aria-valuetext`, c.valueText(), r.valueText);
  }
  // The non-default range, which is where truncation and rounding part.
  const r = ORACLE.radix.range, b = ORACLE.base.range;
  const c = mk(3, 8);
  ok("3 of 8: both references say the same thing", String(r.valueText) === String(b.valueText),
    `${r.valueText} vs ${b.valueText}`);
  eq("3 of 8: aria-valuetext", c.valueText(), r.valueText);
  eq("3 of 8: and it is 38%, not 37%", c.valueText(), "38%");
  eq("3 of 8: aria-valuemax", row(c).valueMax, r.valueMax);
}

console.log("\nMEASURED — indeterminate is the ABSENCE of a number, in both");
{
  const r = ORACLE.radix.indeterminate, b = ORACLE.base.indeterminate;
  ok("both references leave aria-valuenow off", r.valueNow === null && b.valueNow === null,
    `${r.valueNow} / ${b.valueNow}`);
  const c = mk(null);
  const got = row(c);
  eq("so this one publishes no position", got.hasValueNow, false);
  eq("but still publishes a range", got.hasRange, true);
  eq("and the range is intact", `${got.valueMin}..${got.valueMax}`, "0..100");
  // "" is the absence: UiHost turns an empty string into a null attribute,
  // which is what makes it absent rather than an empty one.
  eq("aria-valuetext is absent, not empty", c.valueText(), "");
  eq("the state word is Radix's", c.stateWord(), r.dataState);
}

console.log("\nMEASURED — the drawn fraction, for which Base UI is the ONLY reference");
{
  // Radix's Indicator carries no style at all, so `widthRatio` in the capture
  // measures the probe's own stylesheet for Radix and is 1 even at zero. That
  // is the tell, and it is asserted so the file cannot be misread later.
  ok("Radix's indicator reports a full ratio even at zero, so it draws nothing",
    ORACLE.radix.zero.indicator.widthRatio === 1, String(ORACLE.radix.zero.indicator.widthRatio));
  ok("and Radix's indicator has no style attribute",
    ORACLE.radix.part.indicator.attrs.style === undefined,
    JSON.stringify(ORACLE.radix.part.indicator.attrs));
  for (const [key, v] of [["zero", 0], ["part", 40], ["full", 100], ["fraction", 33.333]]) {
    const want = ORACLE.base[key].indicator.widthRatio;
    const c = mk(v);
    eq(`${key}: the fill fraction matches Base UI`, Math.round(c.fraction() * 10000) / 10000, want);
  }
  const c = mk(3, 8);
  eq("3 of 8: the fill fraction", Math.round(c.fraction() * 10000) / 10000, ORACLE.base.range.indicator.widthRatio);
}

console.log("\nCHOSEN — the indeterminate fill, which NEITHER reference specifies");
{
  // Base UI writes data-indeterminate and no style; Radix writes no style
  // ever. So the ratio of 1 in the capture is the probe's own stylesheet in
  // both cases, and there is no measured answer to copy.
  ok("Base UI sets no width when indeterminate",
    ORACLE.base.indeterminate.indicator.attrs.style === undefined,
    JSON.stringify(ORACLE.base.indeterminate.indicator.attrs));
  ok("and marks it with data-indeterminate instead",
    ORACLE.base.indeterminate.indicator.attrs["data-indeterminate"] !== undefined);
  // The choice, asserted. A version returning 1.0 here passed all sixty
  // assertions before this section existed — and an indeterminate bar drawn
  // full is a bar claiming the work is done.
  eq("this one reports an empty fill", mk(null).fraction(), 0);
  eq("and its drawn width follows", mk(null).percent(), 0);
  eq("which is not what it reports at full", mk(100).fraction(), 1);
}

console.log("\nCHOSEN — clamping, where the two references are different components");
{
  // The big divergence. Radix reports NOTHING out of range and goes
  // indeterminate; Base UI clamps. This follows Base UI, and the assertion
  // names both so the choice cannot be mistaken for a measurement.
  ok("Radix refuses to report an out-of-range value",
    ORACLE.radix.over.valueNow === null && ORACLE.radix.over.dataState === "indeterminate",
    `${ORACLE.radix.over.valueNow} / ${ORACLE.radix.over.dataState}`);
  ok("Base UI clamps it instead", ORACLE.base.over.valueNow === "100", ORACLE.base.over.valueNow);
  const over = mk(140);
  eq("this one clamps, following Base UI", row(over).valueNow, Number(ORACLE.base.over.valueNow));
  eq("and stays determinate", row(over).hasValueNow, true);
  eq("and reads complete", over.stateWord(), "complete");
  const under = mk(-20);
  eq("below zero clamps too", row(under).valueNow, Number(ORACLE.base.under.valueNow));
  eq("and its fill is empty, not negative", under.fraction(), 0);
  // The choice stays inspectable rather than silently absorbed.
  eq("but the controller says the value was out of range", over.outOfRange(), true);
  eq("and does not say so for a value inside it", mk(40).outOfRange(), false);
}

console.log("\nCHOSEN — the state word, which Base UI does not publish at all");
{
  ok("Base UI has no data-state at any value",
    ORACLE.base.zero.dataState === null && ORACLE.base.full.dataState === null,
    `${ORACLE.base.zero.dataState} / ${ORACLE.base.full.dataState}`);
  ok("it marks a running bar with data-progressing instead",
    ORACLE.base.part.attrs["data-progressing"] !== undefined,
    JSON.stringify(Object.keys(ORACLE.base.part.attrs)));
  for (const [v, want] of [[0, "loading"], [40, "loading"], [100, "complete"]]) {
    eq(`${v}: the word is Radix's`, mk(v).stateWord(), ORACLE.radix[v === 0 ? "zero" : v === 40 ? "part" : "full"].dataState);
    eq(`${v}: and it is what was expected`, mk(v).stateWord(), want);
  }
}

console.log("\nSPECIFIED — a caller's own label, which both references pass through");
{
  const r = ORACLE.radix.label, b = ORACLE.base.label;
  ok("both references use it verbatim", String(r.valueText) === String(b.valueText),
    `${r.valueText} vs ${b.valueText}`);
  const c = mk(40);
  c.valueLabel = "40 of 100 files";
  eq("so this one does too", c.valueText(), r.valueText);
  eq("and the number underneath is unchanged", row(c).valueNow, 40);
  // A label must not survive into the indeterminate state: there is no value
  // to describe, and both references publish nothing there.
  const ind = mk(null);
  ind.valueLabel = "40 of 100 files";
  eq("an indeterminate bar ignores a stale label", ind.valueText(), "");
}

console.log("\nthe divergences the capture recorded");
{
  ok("the capture found the two references disagreeing", ORACLE.FINDINGS.divergences.length > 0,
    String(ORACLE.FINDINGS.divergences.length));
  const fields = [...new Set(ORACLE.FINDINGS.divergences.map((d) => d.field))].sort();
  console.log(`  (${ORACLE.FINDINGS.divergences.length} divergences over: ${fields.join(", ")})`);
  // Every divergence is either dataState (Base UI publishes none) or one of
  // the out-of-range rows. If a re-capture ever produces a divergence outside
  // those, this gate should be re-read rather than re-run.
  const unexpected = ORACLE.FINDINGS.divergences.filter(
    (d) => d.field !== "dataState" && d.case !== "over" && d.case !== "under" && d.case !== "indeterminate");
  ok("and every one of them is accounted for above", unexpected.length === 0,
    JSON.stringify(unexpected));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL PASS");
