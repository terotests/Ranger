#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// SliderCtl's ReUI presentation layer.
//
//   node gallery/ui/conformance/oracle/slider_check.mjs
//
// The slider's CORE — the role, the keys, the value arithmetic — is measured
// against @radix-ui/react-slider and gated by the conformance harness
// (`slider` in behaviours.json). None of that is re-decided here.
//
// This gate is for the layer ReUI draws on top: reference labels, tick marks
// with a skip interval, a value bubble, and a rating whose value is a word.
// SPECIFIED from the component source and screenshots the user supplied —
// reui.io is refused by the egress proxy, so this is the same footing the four
// shadcn components were on: a real source rather than a guess.
//
// One of these is an accessibility fix and not decoration. A rating slider
// whose thumb sits at 3 announces "3", which tells a reader nothing; the
// screen says "Okay". `aria-valuetext` is what closes that.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));

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

const mk = (o) => {
  const host = new H.UiHost();
  const c = host.addSlider("sl", o.name || "Value");
  c.minValue = o.min === undefined ? 0 : o.min;
  c.maxValue = o.max === undefined ? 100 : o.max;
  c.value = o.value === undefined ? 50 : o.value;
  if (o.unit !== undefined) c.unitSuffix = o.unit;
  if (o.tickStep !== undefined) c.tickStep = o.tickStep;
  if (o.skip !== undefined) c.skipInterval = o.skip;
  for (const b of o.bands || []) c.addBand(b[0], b[1], b[2]);
  c.build();
  return c;
};
const thumbRow = (c) => Array.from(c.rows()).find((r) => r.tid === "sl-thumb");
const r4 = (x) => Math.round(x * 10000) / 10000;

console.log("the tick ruler — two rules, not one");
{
  // ReUI's source: ticks are `Array.from({length: max + 1})`, every one draws
  // a mark, and `tick % skipInterval !== 0` draws it SHORTER and hides its
  // number. Two rules. An implementation keeping only one draws either a bare
  // ruler or a crowded one.
  const c = mk({ name: "Duration (months)", min: 0, max: 12, value: 5, tickStep: 1, skip: 2 });
  // Thirteen, not twelve: inclusive of both ends, which is the off-by-one
  // between a ruler ending on 12 and one ending on 11.
  eq("a 0..12 range has thirteen ticks", c.tickCount(), 13);
  eq("the first is the minimum", c.tickValue(0), 0);
  eq("the last is the maximum", c.tickValue(12), 12);
  const majors = [];
  for (let i = 0; i < c.tickCount(); i++) if (c.tickIsMajor(i)) majors.push(c.tickValue(i));
  eq("every other one carries a number", majors.join(","), "0,2,4,6,8,10,12");
  eq("and the ones between do not", c.tickIsMajor(1), false);
  eq("but they still exist as marks", c.tickCount() - majors.length, 6);
  // Positions are FRACTIONS, so one number serves any track width.
  eq("the middle tick sits halfway", r4(c.tickFraction(6)), 0.5);
  eq("the last sits at the end", r4(c.tickFraction(12)), 1);
  eq("and the first at the start", r4(c.tickFraction(0)), 0);
  // No skip interval means every tick is major — a ruler, not a blank rail.
  const d = mk({ min: 0, max: 4, value: 0, tickStep: 1 });
  eq("with no skip interval every tick is labelled", [0, 1, 2, 3, 4].every((i) => d.tickIsMajor(i)), true);
  // And no tickStep at all means no ruler, rather than a division by zero.
  eq("a slider with no tick step has no ticks", mk({ value: 5 }).tickCount(), 0);
}

console.log("the value bubble, and the unit that would otherwise be lost");
{
  const c = mk({ name: "Volume", value: 50, unit: "%" });
  eq("the bubble reads the value with its unit", c.formatted(), "50%");
  eq("and sits over the thumb", r4(c.thumbFraction()), 0.5);
  c.setValue(0);
  eq("at the left end it is flush left", r4(c.thumbFraction()), 0);
  c.setValue(100);
  eq("and at the right end flush right", r4(c.thumbFraction()), 1);
  // A unit is on the SCREEN and, without valuetext, nowhere a reader can hear
  // it: 20 of 35 is meaningless without the GB.
  const g = mk({ name: "Storage", min: 5, max: 35, value: 20, unit: " GB" });
  eq("a storage slider reads its unit", g.formatted(), "20 GB");
  eq("and a reader is told the same", thumbRow(g).valueText, "20 GB");
  eq("while the raw number is still there", thumbRow(g).valueNow, 20);
  // A slider whose number speaks for itself keeps the attribute ABSENT
  // rather than duplicating aria-valuenow.
  eq("a bare slider publishes no valuetext", thumbRow(mk({ value: 40 })).valueText, "");
}

console.log("a fraction is not a percentage of the RANGE's start");
{
  // The trap: a 5..35 slider at 20 is halfway, not 20%. An implementation
  // dividing by max alone puts the thumb at 57%.
  const c = mk({ min: 5, max: 35, value: 20 });
  eq("20 of 5..35 is halfway", r4(c.thumbFraction()), 0.5);
  eq("the minimum is at zero", r4(c.fractionOf(5)), 0);
  eq("the maximum is at one", r4(c.fractionOf(35)), 1);
  // And it clamps rather than running off the ends.
  eq("below the minimum clamps to zero", r4(c.fractionOf(-10)), 0);
  eq("above the maximum clamps to one", r4(c.fractionOf(999)), 1);
}

console.log("a rating whose value is a WORD");
{
  // The accessibility fix. Five bands, low to high.
  const c = mk({
    name: "Rate your experience", min: 1, max: 5, value: 3,
    bands: [[1, "Awful", "\u{1F62D}"], [2, "Poor", "\u{1F641}"], [3, "Okay", "\u{1F610}"],
            [4, "Good", "\u{1F642}"], [5, "Great", "\u{1F60D}"]],
  });
  eq("the middle reads Okay", c.currentBand(), "Okay");
  eq("with the face from the screenshot", c.currentEmoji(), "\u{1F610}");
  // THE POINT: a reader hears the word, not the number.
  eq("and a reader hears the word", thumbRow(c).valueText, "Okay");
  eq("not the bare 3", thumbRow(c).valueText !== "3", true);
  // Each band is an upper bound, so the boundary belongs to the LOWER band.
  eq("band 1", c.bandFor(1), "Awful");
  eq("band 2", c.bandFor(2), "Poor");
  eq("band 4", c.bandFor(4), "Good");
  eq("band 5", c.bandFor(5), "Great");
  // Above the last bound falls into the last band rather than off the end.
  eq("anything above the top band is still the top band", c.bandFor(99), "Great");
  // A band wins over a unit: the word is what the screen shows.
  const d = mk({ min: 1, max: 5, value: 5, unit: " stars",
    bands: [[3, "Meh", "\u{1F610}"], [5, "Great", "\u{1F60D}"]] });
  eq("a banded slider reads its word, not its unit", thumbRow(d).valueText, "Great");
}

console.log("the reference labels under the track");
{
  // "5 GB / 20 GB / 35 GB" from the screenshot: the ends and the middle,
  // which are the values a caller does not have to be told.
  const c = mk({ min: 5, max: 35, value: 20, unit: " GB" });
  const mid = c.minValue + Math.round((c.maxValue - c.minValue) / 2);
  eq("the low label is the minimum", `${c.minValue}${c.unitSuffix}`, "5 GB");
  eq("the high label is the maximum", `${c.maxValue}${c.unitSuffix}`, "35 GB");
  eq("and the middle is the midpoint", `${mid}${c.unitSuffix}`, "20 GB");
}

console.log("the measured core is untouched");
{
  // The keys and the arithmetic still belong to the Radix capture. Asserted
  // here so a change to the presentation layer that broke them is caught
  // beside the layer that broke it, not two suites away.
  const c = mk({ min: 0, max: 12, value: 5, tickStep: 1, skip: 2 });
  c.keyDown("sl-thumb", "ArrowRight");
  eq("ArrowRight still adds a step", c.value, 6);
  c.keyDown("sl-thumb", "Home");
  eq("Home still goes to the minimum", c.value, 0);
  c.keyDown("sl-thumb", "End");
  eq("End still goes to the maximum", c.value, 12);
  eq("and the thumb is still the only tab stop",
    Array.from(c.rows()).filter((r) => r.tabStop).map((r) => r.tid).join(","), "sl-thumb");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL PASS");
