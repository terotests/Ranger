#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// NumberCtl against Base UI's NumberField.
//
//   node gallery/ui/conformance/oracle/numberfield_check.mjs
//
// Reads `numberfield.json` rather than restating its numbers. ONE reference,
// unlike the progress bar: Radix has no number field, so there is nothing to
// hold this against and no divergences to record. Where a rule is specified
// rather than measured it says so.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const O = JSON.parse(fs.readFileSync(path.join(HERE, "numberfield.json"), "utf8"));

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

const mk = (opts) => {
  const o = opts || {};
  const c = new H.NumberCtl();
  c.tid = "nf";
  c.name = "Quantity";
  if (o.step !== undefined) c.step = o.step;
  if (o.largeStep !== undefined) c.largeStep = o.largeStep;
  if (o.min !== undefined) c.setRange(o.min, o.max);
  if (o.value !== undefined) c.setValue(o.value);
  return c;
};
const rows = (c) => Object.fromEntries(Array.from(c.rows()).map((r) => [r.tid, r]));

console.log("MEASURED — it is NOT a spinbutton, which is what everyone implements");
{
  const s = O.shape.plain;
  ok("the reference publishes no role", s.role === null, String(s.role));
  ok("and no aria-valuenow", s.valueNow === null, String(s.valueNow));
  ok("it is a text input with a numeric keypad",
    s.type === "text" && s.inputMode === "numeric", `${s.type}/${s.inputMode}`);
  ok("named by a roledescription instead",
    s.attrs["aria-roledescription"] === "Number field", s.attrs["aria-roledescription"]);
  const r = rows(mk({ value: 5 }));
  // 7 is textField in EVGA11yRole; 32 would be slider and there is no
  // spinbutton in the catalogue, which is the point — nothing here needed one.
  eq("so this one reports a text field", r.nf.role, 7);
  eq("with the reference's roledescription", r.nf.roleDescription, s.attrs["aria-roledescription"]);
  eq("and no announced position", r.nf.hasValueNow, false);
  eq("its text is what is in the box", r.nf.text, "5");
}

console.log("MEASURED — the step");
{
  eq("ArrowUp from 5", (() => { const c = mk({ value: 5 }); c.onKey("ArrowUp", false); return c.plain(); })(), O.keys.arrowUp);
  eq("ArrowDown twice from 5", (() => { const c = mk({ value: 5 }); c.onKey("ArrowDown", false); c.onKey("ArrowDown", false); return c.plain(); })(), O.keys.arrowDownTwice);
  eq("a 0.25 step moves 0.25", (() => { const c = mk({ value: 0, step: 0.25 }); c.onKey("ArrowUp", false); return c.plain(); })(), O.keys.steppedArrowUp);
  eq("a step of 2 moves 2", (() => { const c = mk({ value: 0, step: 2, largeStep: 20 }); c.onKey("ArrowUp", false); return c.plain(); })(), O.keys.largeArrowUp);
}

console.log("MEASURED — the large step is on SHIFT, and PageUp does nothing");
{
  // Both halves of the plausible guess are wrong, and both are asserted.
  eq("PageUp moves nothing", O.keys.pageUp, "5");
  eq("PageDown moves nothing", O.keys.pageDown, "5");
  eq("nor does PageUp with a largeStep declared", O.keys.largePageUp, "0");
  const c = mk({ value: 5 });
  eq("so this one refuses PageUp too", c.onKey("PageUp", false), false);
  eq("and leaves the value alone", c.plain(), "5");
  eq("and refuses PageDown", mk({ value: 5 }).onKey("PageDown", false), false);

  eq("Shift+ArrowUp from 5", (() => { const d = mk({ value: 5 }); d.onKey("ArrowUp", true); return d.plain(); })(), O.keys.shiftArrowUp);
  eq("an explicit largeStep of 20", (() => { const d = mk({ value: 0, step: 2, largeStep: 20 }); d.onKey("ArrowUp", true); return d.plain(); })(), O.keys.largeShiftArrowUp);
  // The least guessable number in the component: with step 0.25, the default
  // large step is 10 ABSOLUTE, not ten steps (which would be 2.5).
  eq("and the default large step is 10, not ten steps",
    (() => { const d = mk({ value: 0, step: 0.25 }); d.onKey("ArrowUp", true); return d.plain(); })(), O.keys.steppedShiftArrowUp);
  eq("which is 10 and not 2.5", O.keys.steppedShiftArrowUp, "10");
}

console.log("MEASURED — Home and End");
{
  eq("Home goes to min", (() => { const c = mk({ value: 5, min: 0, max: 10 }); c.onKey("Home", false); return c.plain(); })(), O.keys.home);
  eq("End goes to max", (() => { const c = mk({ value: 5, min: 0, max: 10 }); c.onKey("End", false); return c.plain(); })(), O.keys.end);
  // An unbounded field has nowhere to go, so the key is refused rather than
  // silently swallowed.
  eq("Home is refused with no min", mk({ value: 5 }).onKey("Home", false), false);
}

console.log("MEASURED — the bounds, and the buttons that go with them");
{
  eq("stepping below min clamps", (() => {
    const c = mk({ value: 1, min: 0, max: 10 });
    c.onKey("ArrowDown", false); c.onKey("ArrowDown", false); c.onKey("ArrowDown", false);
    return c.plain();
  })(), O.bounds.belowMin.value);
  eq("stepping above max clamps", (() => {
    const c = mk({ value: 9, min: 0, max: 10 });
    c.onKey("ArrowUp", false); c.onKey("ArrowUp", false); c.onKey("ArrowUp", false);
    return c.plain();
  })(), O.bounds.aboveMax.value);
  // The buttons disable AT the bound.
  ok("the reference disables decrement at min", O.bounds.belowMin.decDisabled === true);
  ok("and increment at max", O.bounds.aboveMax.incDisabled === true);
  const atMin = mk({ value: 0, min: 0, max: 10 });
  eq("so this one cannot decrement at min", atMin.canDecrement(), false);
  eq("but can still increment", atMin.canIncrement(), true);
  eq("and the row says disabled", rows(atMin)["nf-dec"].disabled, true);
  const atMax = mk({ value: 10, min: 0, max: 10 });
  eq("and cannot increment at max", atMax.canIncrement(), false);
  eq("with the row to match", rows(atMax)["nf-inc"].disabled, true);
  // The trap: enabled buttons carry aria-disabled="false", so a probe reading
  // hasAttribute called every one of them disabled. Pinned so a re-capture
  // that reverts to a presence test is visible.
  eq("an enabled button publishes aria-disabled=false, not nothing",
    O.shape.bounded.incAriaDisabled, "false");
}

console.log("MEASURED — typing, and WHEN it is reconciled");
{
  // Letters are rejected outright, not accepted and cleaned up later.
  const c = mk({ value: 5 });
  c.focus();
  c.setText("abc");
  eq("letters never reach the box", c.text, "");
  c.blur();
  eq("and blurring an empty box empties the value", c.hasValue, false);

  const d = mk({});
  d.focus();
  d.setText("12abc34");
  eq("digits survive and letters do not", d.text, O.typing.mixedWhileFocused);
  d.blur();
  eq("and blur formats it", d.text, O.typing.mixedAfterBlur);
  eq("which is 1,234 with a separator", d.text, "1,234");
  eq("the settled value has no separator in it", d.plain(), "1234");

  // Focus shows the raw number again: nobody should have to step over a comma.
  d.focus();
  eq("focusing strips the separator", d.text, "1234");

  const e = mk({});
  e.setText("-4.5"); e.blur();
  eq("a negative decimal survives", e.plain(), O.typing.negativeDecimal);
  const f = mk({});
  f.setText("1e3"); f.blur();
  eq("an exponent does not: the e is dropped", f.plain(), O.typing.exponent);
  eq("which leaves 13", f.plain(), "13");
}

console.log("MEASURED — the minus key is a function of the RANGE");
{
  // Two behaviours the capture originally had standing behind one number.
  eq("typing -99 into a min:0 field lands on the max", (() => {
    const c = mk({ value: 5, min: 0, max: 10 });
    c.focus(); c.setText("-99"); c.blur(); return c.plain();
  })(), O.bounds.typedUnderIntoUnsigned.value);
  eq("because the minus was refused, leaving 99", (() => {
    const c = mk({ value: 5, min: 0, max: 10 });
    c.focus(); c.setText("-99"); return c.text;
  })(), "99");
  eq("the same keystrokes into a signed field keep the sign", (() => {
    const c = mk({ value: 0, min: -100, max: 100 });
    c.focus(); c.setText("-99"); c.blur(); return c.plain();
  })(), O.bounds.typedNegativeIntoSigned.value);
  eq("and clamp at its min", (() => {
    const c = mk({ value: 0, min: -100, max: 100 });
    c.focus(); c.setText("-999"); c.blur(); return c.plain();
  })(), O.bounds.typedBelowSignedMin.value);
  eq("a minus is only accepted at the front", (() => {
    const c = mk({ value: 0, min: -100, max: 100 });
    c.focus(); c.setText("12-3"); return c.text;
  })(), "123");
  eq("and only one decimal point is taken", (() => {
    const c = mk({});
    c.focus(); c.setText("1.2.3"); return c.text;
  })(), "1.23");
}

console.log("MEASURED — empty is not zero");
{
  ok("the reference leaves the box empty", O.typing.emptied.value === "", O.typing.emptied.value);
  const c = mk({ value: 5 });
  c.focus();
  c.setText("");
  c.blur();
  eq("so this one has no value", c.hasValue, false);
  eq("and shows nothing", c.text, "");
  // The whole reason for the flag: 0 would be a number the person never typed.
  eq("which is not the same as zero", mk({ value: 0 }).hasValue, true);
  eq("and zero still shows its digit", mk({ value: 0 }).text, "0");
}

console.log("SPECIFIED — where an empty field's first step lands");
{
  // Not in the capture: the reference's empty field has no bounds in the
  // fixture, so what an empty BOUNDED field does on ArrowUp was never
  // measured. Landing on the min rather than one step past it is a choice,
  // made because the min is a value the person has not rejected.
  const c = mk({ min: 5, max: 10 });
  c.onKey("ArrowUp", false);
  eq("an empty bounded field steps to its min", c.plain(), "5");
  const d = mk({});
  d.onKey("ArrowUp", false);
  eq("and an empty unbounded one to zero", d.plain(), "0");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL PASS");
