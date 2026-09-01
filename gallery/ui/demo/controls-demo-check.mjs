#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The controls demo: three measured controllers, drawn, and AGREEING.
//
//   node gallery/ui/demo/controls-demo-check.mjs
//
// `ui:stepper:check`, `ui:progress:check` and `ui:number:check` gate the three
// controllers — 180 assertions between them — and all three run in Node with
// nothing drawn. Two things only a page can check:
//
//   THE FRACTIONS BECOME PIXELS. ProgressCtl reports a fraction and this demo
//   turns it into a width, in one place. A mistake there is a mistake nothing
//   else can see.
//
//   THE THREE HAVE TO AGREE WITH EACH OTHER. Filling the number field
//   completes the step, which moves the bar and enables Next. No
//   single-component gate can check a chain, and a progress bar that never
//   moves is a picture of a progress bar.
//
// Every interaction goes through `hitId(x, y)` at a real coordinate, for the
// reason the filter demo does: the text field once worked in its controller
// AND in its demo's API while the page dropped the coordinate between them.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const M = require(path.join(ROOT, "gallery/ui/bin/ControlsDemo.cjs"));
const CSS = fs.readFileSync(path.join(HERE, "controls.css"), "utf8");

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};
const eq = (name, got, want) => {
  const good = String(got) === String(want);
  if (good) { passed++; console.log("  PASS " + name + ": " + got); }
  else { failed++; console.log("  FAIL " + name + ": " + got + "   want " + want); }
};

const fresh = () => {
  const d = new M.ControlsDemo();
  d.init(CSS);
  d.displayListJson();
  return d;
};
const flat = (d) => {
  const out = [];
  const walk = (el) => { out.push(el); for (const k of el.children) walk(k); };
  walk(d.root);
  return out;
};
const byId = (d, id) => flat(d).find((e) => e.id === id);
const cmds = (d) => JSON.parse(d.displayListJson()).cmds;
const texts = (d) => cmds(d).filter((c) => c.text !== undefined).map((c) => c.text);
const clickOn = (d, id) => {
  const el = byId(d, id);
  if (!el) return { hit: "(no such element)", handled: false };
  const hit = d.hitId(el.calculatedX + el.calculatedWidth / 2, el.calculatedY + el.calculatedHeight / 2);
  const handled = d.press(hit);
  d.displayListJson();
  return { hit, handled };
};
const fillWidth = (d) => Math.round(byId(d, "cx-barfill").calculatedWidth);
const nodes = (d) => JSON.parse(d.a11yJson(1, "")).nodes;

console.log("the stylesheet and the tree");
{
  const d = fresh();
  const errs = [];
  for (let i = 0; i < d.styleErrorCount(); i++) errs.push(d.styleErrorAt(i));
  ok("parses with no errors", errs.length === 0, errs.join("; "));
  ok("the accessible tree lints clean", Array.from(d.a11yProblems()).length === 0,
    Array.from(d.a11yProblems()).join(" | "));
}

console.log("the stepper is a LIST, which is the whole shape decision");
{
  const d = fresh();
  const ns = nodes(d);
  const strip = ns.find((n) => n.id && n.id.includes("cx-steps"));
  ok("the strip is a list", strip && strip.role === "list", strip && strip.role);
  ok("nothing on the page is a tab", ns.every((n) => n.role !== "tab"), JSON.stringify(ns.filter((n) => n.role === "tab")));
  ok("nothing publishes aria-selected", ns.every((n) => !n.selected || n.selected === "false"),
    JSON.stringify(ns.filter((n) => n.selected === "true").map((n) => n.id)));
  eq("exactly one step is aria-current=step", ns.filter((n) => n.current === "step").length, 1);
}

console.log("the linear gate is VISIBLE, not merely refused");
{
  const d = fresh();
  // Step three has not been reached. Clicking its circle must do nothing.
  const before = texts(d).join("|");
  const r = clickOn(d, "cx-step-payment");
  eq("clicking an unreachable step is refused", r.handled, false);
  eq("and nothing on the page changed", texts(d).join("|"), before);
  // It also has to LOOK unreachable — a circle that looks clickable and is not
  // is worse than one that looks disabled.
  const dot = byId(d, "cx-step-payment").children[0];
  ok("its circle carries the upcoming token", (dot.className || "").includes("cx-dot-upcoming"), dot.className);
  const nextBtn = byId(d, "cx-next");
  ok("and Next is drawn as unavailable", (nextBtn.className || "").includes("cx-btn-off"), nextBtn.className);
}

console.log("filling the field moves the bar and lights Next — the chain");
{
  const d = fresh();
  eq("the bar starts empty", fillWidth(d), 0);
  eq("and says so", texts(d).find((t) => /steps done$/.test(t)), "0 of 4 steps done");

  // Click into the box, then the + button. Both through the hit test.
  clickOn(d, "cx-num");
  const inc = clickOn(d, "cx-num-inc");
  eq("the + button is handled", inc.handled, true);
  // MEASURED-adjacent, and not what this gate first assumed: an EMPTY field's
  // first step lands ON its base rather than one step past it, so + on an
  // empty 0..99 field gives 0, not 1. That is NumberCtl's documented rule and
  // its own gate asserts it; the expectation here was simply wrong.
  eq("the field holds a number", texts(d).includes("0"), true);
  // THE POINT: the step completed, so the bar moved.
  ok("the bar moved", fillWidth(d) > 0, String(fillWidth(d)));
  eq("and the count followed", texts(d).find((t) => /steps done$/.test(t)), "1 of 4 steps done");
  // A quarter of the track, because one of four steps is done. This is the
  // fraction becoming pixels, which is the arithmetic only a page can check.
  const track = byId(d, "cx-bar");
  eq("by exactly a quarter of the track", fillWidth(d), Math.round(track.calculatedWidth * 0.25));

  const nextBtn = byId(d, "cx-next");
  ok("and Next is now primary", (nextBtn.className || "").includes("cx-btn-primary"), nextBtn.className);
  const goNext = clickOn(d, "cx-next");
  eq("clicking it advances", goNext.handled, true);
  eq("to step two", texts(d).includes("How many for Address?"), true);
  eq("whose field starts empty", texts(d).includes("—"), true);
  eq("and the bar holds its quarter", fillWidth(d), Math.round(track.calculatedWidth * 0.25));
}

console.log("going back restores what was typed");
{
  // An empty box on return reads as lost work, so each step keeps its own.
  const d = fresh();
  clickOn(d, "cx-num");
  clickOn(d, "cx-num-inc");   // empty -> 0
  clickOn(d, "cx-num-inc");   // 0 -> 1
  clickOn(d, "cx-num-inc");   // 1 -> 2
  eq("step one holds 2", texts(d).includes("2"), true);
  clickOn(d, "cx-next");
  eq("step two is empty", texts(d).includes("—"), true);
  clickOn(d, "cx-back");
  eq("and step one still holds 2", texts(d).includes("2"), true);
  ok("with its step still complete", fillWidth(d) > 0, String(fillWidth(d)));
}

console.log("nothing is drawn dark on dark");
{
  const d = fresh();
  clickOn(d, "cx-num");
  clickOn(d, "cx-num-inc");
  // Next is primary now: its fill is near-black, so its label must not be.
  const btn = byId(d, "cx-next");
  const label = btn.children[0];
  ok("the primary button's label has its own token",
    (label.className || "").includes("cx-btntxt-primary"), label.className);
  // The DRAWN colour, not the class name: a token that exists but resolves to
  // the same value is the bug this is looking for. A primary button's fill is
  // near-black, so its label must not be.
  const glyphs = cmds(d).find((c) => c.text === "Next");
  ok("and is drawn light, not the default near-black",
    glyphs && String(glyphs.c) === "255,255,255,1", glyphs && String(glyphs.c));
  // And the other way round, so the assertion above cannot pass by everything
  // being white: Back is an ordinary button and its label is dark.
  const back = cmds(d).find((c) => c.text === "Back");
  ok("while an ordinary button's label stays dark",
    back && String(back.c) === "10,10,10,1", back && String(back.c));
  // The completed step's tick, over a green circle, under the same rule —
  // checked AFTER advancing, because a step you are standing on reads
  // "current" even when it is done. Position wins over completion, which is
  // StepperCtl's rule and this gate had it backwards.
  clickOn(d, "cx-next");
  const dotTxt = byId(d, "cx-step-account").children[0].children[0];
  ok("a completed step's tick has its own token too",
    (dotTxt.className || "").includes("cx-dottxt-complete"), dotTxt.className);
}

console.log("the number field's own rules survive being drawn");
{
  const d = fresh();
  clickOn(d, "cx-num");
  // MEASURED: the buttons disable AT the bound. The field starts empty and
  // its min is 0, so decrementing to 0 is where decrement goes away.
  clickOn(d, "cx-num-dec");
  eq("stepping down from empty lands on the min", texts(d).includes("0"), true);
  const dec = byId(d, "cx-num-dec");
  ok("and decrement is drawn as unavailable", (dec.className || "").includes("cx-numbtn-off"), dec.className);
  eq("clicking it again changes nothing", (() => { clickOn(d, "cx-num-dec"); return texts(d).includes("0"); })(), true);

  // MEASURED, and the least guessable number in the component: the large step
  // is 10 ABSOLUTE and lives on Shift, not on PageUp.
  const e = fresh();
  e.setFocus("cx-num");
  e.press("cx-num");
  eq("PageUp does nothing, as the reference does nothing", e.key("PageUp"), false);
  // From a REAL value: an empty field's first step lands on its base whatever
  // the step size, so a large step out of empty would have measured the base
  // rule again rather than the large step.
  e.press("cx-num-inc");   // empty -> 0
  e.press("cx-num-inc");   // 0 -> 1
  e.displayListJson();
  eq("starting from one", texts(e).includes("1"), true);
  eq("Shift+ArrowUp jumps by ten", (() => { e.keyWithShift("ArrowUp"); e.displayListJson(); return texts(e).includes("11"); })(), true);
}

console.log("clicking a stepper button leaves focus on the field");
{
  // The page gate caught this and this gate did not, so it belongs here too —
  // a browser round trip is the expensive place to learn something a Node
  // assertion can say. Clicking + used to move focus onto the BUTTON, so the
  // next arrow key found focus on a button and did nothing, which reads as a
  // dropped keystroke. A real number field's increment does not steal focus.
  const d = fresh();
  clickOn(d, "cx-num");
  clickOn(d, "cx-num-inc");   // empty -> 0
  clickOn(d, "cx-num-inc");   // 0 -> 1
  eq("the field holds 1 after two presses", texts(d).includes("1"), true);
  eq("and a plain ArrowUp still reaches it", d.key("ArrowUp"), true);
  d.displayListJson();
  eq("moving it to 2", texts(d).includes("2"), true);
  // And the two key paths agree about WHERE a key goes: Shift is not a back
  // door that works regardless of focus.
  const e = fresh();
  e.setFocus("cx-back");
  eq("Shift+ArrowUp does not reach the field from elsewhere", e.keyWithShift("ArrowUp"), false);
  eq("and the field is untouched", texts(e).includes("—"), true);
}

console.log("every control is reachable by the pointer");
{
  const d = fresh();
  for (const id of ["cx-step-account", "cx-num-dec", "cx-num", "cx-num-inc", "cx-back", "cx-next"]) {
    const el = byId(d, id);
    const cx = el.calculatedX + el.calculatedWidth / 2;
    const cy = el.calculatedY + el.calculatedHeight / 2;
    // A step's circle is a child of the item, so the hit may land on either —
    // what matters is that it lands INSIDE the thing and not on the page.
    const hit = d.hitId(cx, cy);
    ok(`${id} answers at its centre`, hit === id || hit.startsWith(id), `got [${hit}]`);
  }
  // The +/- buttons sit flush against the box with no gap. A hit one pixel
  // inside the box must be the box, not the button beside it.
  const box = byId(d, "cx-num");
  eq("the box is not swallowed by the button beside it",
    d.hitId(box.calculatedX + 2, box.calculatedY + box.calculatedHeight / 2), "cx-num");
}

console.log("what a reader is told");
{
  const d = fresh();
  clickOn(d, "cx-num");
  clickOn(d, "cx-num-inc");
  const ns = nodes(d);
  const bar = ns.find((n) => n.id === "cx-bar");
  ok("the bar is a progressbar", bar && bar.role === "progressbar", bar && bar.role);
  // The element path spells these `min`/`max`/`now`, not the DOM's
  // aria-valuemin/max/now — the controller path uses the DOM names and the two
  // are different serialisers. This gate had the DOM's names and got undefined
  // back twice before checking.
  eq("with a range", `${bar.min}..${bar.max}`, "0..4");
  eq("and a position in it", bar.now, 1);
  eq("and a percentage said out loud", bar.value, "25%");
  const box = ns.find((n) => n.id === "cx-num");
  eq("the field says what it holds", box.value, "0");
  eq("and what kind of field it is", box.roledesc, "Number field");
  // "current" while you are standing on it — position wins over completion.
  const here = ns.find((n) => n.id === "cx-step-account");
  eq("the step you are on says current", here.name, "Account, current");
  d.press("cx-next"); d.displayListJson();
  const done = JSON.parse(d.a11yJson(2, "")).nodes.find((n) => n.id === "cx-step-account");
  eq("and says complete once you have left it", done.name, "Account, complete");
}

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
console.log("ALL PASS");
