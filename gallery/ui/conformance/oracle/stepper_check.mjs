#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// StepperCtl: the flow, and the shape it deliberately is not.
//
//   node gallery/ui/conformance/oracle/stepper_check.mjs
//
// SPECIFIED, NOT MEASURED, and the split is sharper here than anywhere else in
// this directory: there IS no stepper to measure. None of the three registries
// shadcn ships over has one, WAI-ARIA has no stepper role, and reui.io is
// refused by the proxy.
//
// What IS measured — and read out of `stepper.json` below rather than restated
// — is the DECISION: a Radix tablist and an ordered list with
// aria-current="step", captured side by side, so the choice between them rests
// on what each publishes and how each answers a key.
//
// THE SOURCE ARRIVED LATER. The user supplied ReUI's own component source, so
// the parts that were guessed at are now specified from it: the state words
// are its `data-[state=completed|active|inactive]`, the badges are its "In
// Progress"/"Completed"/"Pending", and `loading` exists because its Stepper
// takes an `indicators.loading`. Sections below say which of the two they
// stand on.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const O = JSON.parse(fs.readFileSync(path.join(HERE, "stepper.json"), "utf8"));

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
  const c = new H.StepperCtl();
  c.tid = "st";
  c.name = "Checkout";
  if (o.linear !== undefined) c.linear = o.linear;
  for (const [k, l] of [["account", "Account"], ["address", "Address"], ["payment", "Payment"], ["review", "Review"]]) {
    c.addStep(k, l, "");
  }
  for (const i of o.complete || []) c.stepAt(i).complete = true;
  for (const i of o.disabled || []) c.stepAt(i).disabled = true;
  if (o.at !== undefined) c.current = o.at;
  return c;
};
const rows = (c) => Object.fromEntries(Array.from(c.rows()).map((r) => [r.tid, r]));

console.log("MEASURED — the shape this is NOT, and why");
{
  // A tablist activates as it moves and WRAPS: from the first of four steps,
  // one ArrowRight lands on the second and three more come back to the first.
  eq("a Radix tablist moves on ArrowRight", O.tabKeys.afterArrowRight, "Address");
  eq("and wraps round to the start", O.tabKeys.afterThreeMoreArrows, "Account");
  ok("its items are tabs with aria-selected",
    O.tabs.items[0].role === "tab" && O.tabs.items[0].selected === "true",
    JSON.stringify(O.tabs.items[0]));
  // The other shape: a plain list, one item marked, nothing selectable.
  ok("the ordered list publishes no role at all", O.current.items[0].role === null,
    String(O.current.items[0].role));
  ok("and marks exactly one item aria-current=step",
    O.current.items.filter((i) => i.current === "step").length === 1,
    JSON.stringify(O.current.items.map((i) => i.current)));
}

console.log("\nCHOSEN — a list with aria-current, and movement that does not wrap");
{
  const c = mk({ at: 0, complete: [0, 1, 2, 3] });
  const r = rows(c);
  // 22 is list, 23 is listItem. Nothing here is a tab (16) or a tablist (15).
  eq("the strip is a list, not a tablist", r.st.role, 22);
  eq("its steps are list items, not tabs", r["st-account"].role, 23);
  eq("nothing publishes aria-selected", Array.from(c.rows()).filter((x) => x.selected !== 0).length, 0);
  eq("the step you are on carries aria-current=step", r["st-account"].current, "step");
  eq("and only that one", Array.from(c.rows()).filter((x) => x.current === "step").length, 1);
  // Asserted from a MIDDLE step as well. At index 0 "the current one" and
  // "every one up to here" are the same set, so a version marking all the
  // completed steps too passed this section untouched — a reader would have
  // been told it was on four steps at once.
  const mid = mk({ at: 2, complete: [0, 1] });
  eq("still only one from the middle", Array.from(mid.rows()).filter((x) => x.current === "step").length, 1);
  eq("and it is the one you are on", Array.from(mid.rows()).find((x) => x.current === "step").tid, "st-payment");
  eq("the finished ones carry nothing", rows(mid)["st-account"].current, "");
  // The behaviour the capture argued against.
  c.onKey("ArrowRight"); c.onKey("ArrowRight"); c.onKey("ArrowRight");
  eq("three rights reach the last step", c.current, 3);
  eq("a fourth is refused rather than wrapping", c.onKey("ArrowRight"), false);
  eq("and the position holds", c.current, 3);
  eq("left from the first is refused too", (() => { const d = mk({ at: 0 }); return d.onKey("ArrowLeft"); })(), false);
}

console.log("\nSPECIFIED — linear is the whole design question");
{
  // Nothing done yet: you cannot jump to step three.
  const c = mk({ at: 0 });
  eq("the frontier is the first unfinished step", c.firstIncomplete(), 0);
  eq("so step two is out of reach", c.canGoTo(1), false);
  eq("and going there fails", c.goTo(2), false);
  eq("leaving the position alone", c.current, 0);
  eq("an incomplete step will not advance", c.canAdvance(), false);
  eq("and next() refuses", c.next(), false);

  // Finish it and the frontier moves.
  c.stepAt(0).complete = true;
  eq("completing it moves the frontier", c.firstIncomplete(), 1);
  eq("so next() works now", c.next(), true);
  eq("landing on step two", c.current, 1);
  // Back is always allowed to somewhere you have been.
  eq("back always works", c.back(), true);
  eq("returning to step one", c.current, 0);
  // And forward to the frontier is one move, not one step at a time — a
  // person who filled in three steps should not click three times to return.
  const d = mk({ at: 0, complete: [0, 1, 2] });
  eq("you can jump straight to the frontier", d.goTo(3), true);
  eq("but not past it", d.goTo(3) && d.canGoTo(4), false);
}

console.log("\nSPECIFIED — a non-linear stepper lets a person wander");
{
  const c = mk({ at: 0, linear: false });
  eq("any step is reachable", c.canGoTo(3), true);
  eq("and going there works", c.goTo(3), true);
  eq("with nothing completed", c.completedCount(), 0);
  // The gate is gone, because there is nothing to gate.
  eq("an incomplete step still advances", mk({ at: 0, linear: false }).canAdvance(), true);
}

console.log("\nSPECIFIED — a disabled step is skipped, which IS worth borrowing");
{
  // The one behaviour taken from the tablist capture rather than refused.
  const c = mk({ at: 0, linear: false, disabled: [1] });
  c.onKey("ArrowRight");
  eq("ArrowRight steps over the disabled one", c.current, 2);
  c.onKey("ArrowLeft");
  eq("and ArrowLeft steps back over it", c.current, 0);
  eq("it cannot be reached directly either", c.canGoTo(1), false);
  eq("its state says so", c.stateOf(1), "disabled");
  eq("and its row is not focusable", rows(c)["st-address"].focusable, false);
  eq("while the row it skipped to is", rows(c)["st-payment"].focusable, true);
}

console.log("\nSPECIFIED — what each step is, which the index alone cannot say");
{
  // A step BEFORE the current one that was skipped is not complete, and one
  // after it that a caller satisfied is not upcoming. Position decides only
  // which is current.
  const c = mk({ at: 2, linear: false, complete: [0, 3] });
  eq("a finished earlier step is completed", c.stateOf(0), "completed");
  eq("a skipped earlier step is NOT completed", c.stateOf(1), "inactive");
  eq("the one you are on is active", c.stateOf(2), "active");
  eq("a finished later step is completed, not inactive", c.stateOf(3), "completed");
  eq("and the count follows the flags, not the position", c.completedCount(), 2);
}

console.log("\nSPECIFIED — what a reader is told");
{
  const c = mk({ at: 1, complete: [0] });
  const r = rows(c);
  eq("each step says its state out loud", r["st-address"].name, "Address, In Progress");
  eq("including the finished one", r["st-account"].name, "Account, Completed");
  eq("and the ones still to come", r["st-payment"].name, "Payment, Pending");
  // No ARIA attribute carries "complete" or "upcoming", so a reader arriving
  // on step three must not have to infer it from silence.
  eq("position in the set is published", `${r["st-payment"].setPos}/${r["st-payment"].setSize}`, "3/4");
  eq("and there is a live status saying where you are", r["st-position"].name, "Step 2 of 4");
  eq("which is a status role, so moving is announced", r["st-position"].role, 20);
  eq("exactly one step is a tab stop", Array.from(c.rows()).filter((x) => x.tabStop).length, 1);
  // ReUI renders a StepperContent per step and shows the current one. A panel
  // that changed under a reader with no name is a region that moved on its own.
  eq("the panel is named for the step it belongs to", r["st-panel"].name, "Address");
  eq("and is a region", r["st-panel"].role, 27);
  eq("and it is the current one", Array.from(c.rows()).find((x) => x.tabStop).tid, "st-address");
}

console.log("\nSPECIFIED FROM ReUI'S SOURCE — its words, not prettified state names");
{
  const c = mk({ at: 1, complete: [0] });
  // The state words are ReUI's data-[state=...] values. A theme written
  // against its attribute would match nothing if these were renamed.
  eq("completed", c.stateOf(0), "completed");
  eq("active", c.stateOf(1), "active");
  eq("inactive", c.stateOf(2), "inactive");
  // And the badge text is ITS text: the mapping is not one-to-one, because
  // `active` reads "In Progress" rather than "Active".
  eq("the active step's badge", c.badgeAt(1), "In Progress");
  eq("the completed step's badge", c.badgeAt(0), "Completed");
  eq("a pending step's badge", c.badgeAt(2), "Pending");
  eq("the eyebrow counts from one", c.eyebrowAt(0), "Step 1");
  eq("and follows the index", c.eyebrowAt(3), "Step 4");
}

console.log("\nSPECIFIED FROM ReUI'S SOURCE — the loading state its indicators imply");
{
  // ReUI's Stepper takes indicators={{completed, loading}}, so a step can be
  // WORKING — an OTP being checked — which is neither done nor waiting.
  // Nothing else in the component could express that.
  const c = mk({ at: 2, complete: [0, 1] });
  c.stepAt(2).loading = true;
  eq("a working step is loading", c.stateOf(2), "loading");
  eq("and says so", c.badgeAt(2), "Verifying");
  eq("its indicator is a spinner", c.indicatorAt(2), "spinner");
  // Loading beats active: the step you are on that is checking itself is
  // reported as checking, not as merely current.
  eq("which outranks being the current step", c.stateOf(2) !== "active", true);
  eq("a finished step shows a tick", c.indicatorAt(0), "check");
  c.stepAt(3).icon = "lock";
  eq("and an ordinary one shows its own icon", c.indicatorAt(3), "lock");
}

console.log("\nSPECIFIED FROM ReUI'S SOURCE — the separator belongs to the step BEFORE it");
{
  // ReUI draws one after every step but the last and greens it from
  // `group-data-[state=completed]/step`, which is the step it hangs off — not
  // the one it points at. Getting that backwards leaves a green line running
  // into a pending circle.
  const c = mk({ at: 1, complete: [0] });
  eq("there is a separator after the first step", c.hasSeparatorAfter(0), true);
  eq("and none after the last", c.hasSeparatorAfter(3), false);
  eq("the one after a finished step is completed", c.separatorStateAt(0), "completed");
  eq("and the one after an unfinished step is not", c.separatorStateAt(1), "inactive");
}

console.log("\nSPECIFIED — Home and End go where you are ALLOWED to go");
{
  const c = mk({ at: 2, complete: [0, 1] });
  c.onKey("End");
  // The frontier, not the last circle drawn on the screen.
  eq("End reaches the furthest reachable step", c.current, 2);
  eq("which is the frontier, not the last step", c.firstIncomplete(), 2);
  c.onKey("Home");
  eq("Home returns to the first", c.current, 0);
  const d = mk({ at: 0, linear: false });
  d.onKey("End");
  eq("in a free stepper End is the last step", d.current, 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL PASS");
