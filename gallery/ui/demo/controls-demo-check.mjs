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
const hasCls = (el, c) => String(el.className || "").split(/\s+/).includes(c);
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
  const wasOn = d.stepper.current;
  const r = clickOn(d, "cx-step-payment");
  // THE CLICK HAS TO LAND FIRST. This used to assert `r.handled === false`,
  // and it passed for the wrong reason: the stepper's steps were laid out on
  // top of one another, so the centre of `cx-step-payment` was over something
  // else entirely and `press` refused a target it did not recognise. A gate
  // that reads "the click was refused" while the click never arrived says
  // nothing about the linear rule at all.
  eq("the click reaches the step it aimed at", r.hit, "cx-step-payment");
  // And then the rule, stated as the behaviour rather than as `press`'s
  // bookkeeping: `press` returns true for "I know this target and rebuilt",
  // which is not the same claim as "I moved".
  eq("the step you are on does not change", d.stepper.current, wasOn);
  eq("and nothing on the page changed", texts(d).join("|"), before);
  // It also has to LOOK unreachable — a circle that looks clickable and is not
  // is worse than one that looks disabled.
  const dot = byId(d, "cx-step-payment").children[0];
  ok("its circle carries ReUI's inactive token", (dot.className || "").includes("cx-dot-inactive"), dot.className);
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
  // The WHOLE token, not a substring. This read `.includes("cx-dottxt-complete")`
  // and passed on `cx-dottxt-completed` — which is the class the controller
  // actually emits, against a stylesheet that only defined `-complete`. The
  // rule matched nothing, every step painted identically, and this assertion
  // said it was fine.
  ok("a completed step's tick has its own token too",
    (dotTxt.className || "").split(/\s+/).includes("cx-dottxt-completed"), dotTxt.className);
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

console.log("ReUI's step block: icon, eyebrow, title, badge, separator");
{
  const d = fresh();
  const t = texts(d);
  // The icons come from the CONTROLLER as names and are turned into glyphs
  // here. The first version of that assignment used
  // `stepper.stepAt(0).icon = …`, which Ranger accepts and silently applies
  // to a temporary — it compiled clean and set nothing, so every circle drew
  // the fallback. This gate is JavaScript, where that same expression works,
  // so only a rendered check can catch it.
  ok("the first step draws its own icon, not the fallback", t.includes("☺"), t.join("/"));
  ok("the second draws its own", t.includes("▤"), t.join("/"));
  ok("and none of them is the fallback bullet at step one", t.indexOf("☺") < t.indexOf("•"), t.join("/"));
  ok("the eyebrow counts from one", t.includes("Step 1") && t.includes("Step 4"), t.join("/"));
  // ReUI's badge words, not prettified state names.
  ok("the current step reads In Progress", t.includes("In Progress"), t.join("/"));
  ok("and the rest read Pending", t.filter((x) => x === "Pending").length === 3, t.join("/"));
  // The panel under the strip shows the current step's content.
  ok("the panel shows the current step's content", t.includes("Name, email and how to reach you."), t.join("/"));

  // Complete step one and the separator after it greens, while the next stays.
  clickOn(d, "cx-num");
  clickOn(d, "cx-num-inc");
  // Filling it does NOT make the current step read Completed — the step you
  // are ON is active even when satisfied, which is ReUI's own precedence and
  // the reason `stateOf` tests position before completion.
  ok("the step you are on still reads In Progress", texts(d).includes("In Progress"), texts(d).join("/"));
  clickOn(d, "cx-next");
  const after = texts(d);
  ok("but once you leave it, it reads Completed", after.includes("Completed"), after.join("/"));
  ok("and shows a tick instead of its icon", after.includes("✓"), after.join("/"));
  ok("while its own icon is gone", !after.includes("☺"), after.join("/"));
}

console.log("the sliders: four pictures, one measured control");
{
  const d = fresh();
  const t = texts(d);
  // Reference labels — the ends and the midpoint, with the unit.
  ok("the storage slider labels its ends", t.includes("5 GB") && t.includes("35 GB"), t.join("/"));
  ok("and its midpoint", t.includes("20 GB"), t.join("/"));
  // The ruler: every other tick carries a number, and 1/3/5 do not.
  for (const n of ["0", "2", "4", "6", "8", "10", "12"]) {
    ok(`the ruler shows ${n}`, t.includes(n), t.join("/"));
  }
  ok("but not the odd months", !t.includes("11"), t.join("/"));
  // The bubble, and the rating's word.
  ok("the volume bubble reads its unit", t.includes("50%"), t.join("/"));
  ok("the rating shows a face", t.includes("😐"), t.join("/"));
  ok("and the word under it", t.includes("Okay"), t.join("/"));
}

console.log("the slider geometry is the controller's fraction, in pixels");
{
  const d = fresh();
  // 20 of a 5..35 range is HALFWAY, not 57%. The trap is dividing by max
  // alone, and it is only visible once the fractions become pixels.
  const track = byId(d, "cx-storage-track");
  const range = byId(d, "cx-storage-range");
  eq("the storage fill is half the track",
    Math.round(range.calculatedWidth), Math.round(track.calculatedWidth * (12 - 5) / 30));
  const thumb = byId(d, "cx-storage-thumb");
  ok("and the thumb sits on the fill's end",
    Math.abs((thumb.calculatedX + thumb.calculatedWidth / 2) - (range.calculatedX + range.calculatedWidth)) < 2,
    `${thumb.calculatedX + thumb.calculatedWidth / 2} vs ${range.calculatedX + range.calculatedWidth}`);
  // The tick marks: minor ones are shorter than major ones. Two rules, and an
  // implementation keeping one draws a bare ruler or a crowded one.
  const marks = flat(d).filter((e) => (e.className || "").includes("cx-tickmark"));
  eq("there are thirteen marks", marks.length, 13);
  const major = marks.filter((e) => (e.className || "").includes("major"));
  const minor = marks.filter((e) => (e.className || "").includes("minor"));
  eq("seven of them are major", major.length, 7);
  eq("and six are minor", minor.length, 6);
  ok("the minor ones are drawn shorter",
    minor[0].calculatedHeight < major[0].calculatedHeight,
    `${minor[0].calculatedHeight} vs ${major[0].calculatedHeight}`);
}

console.log("a reader hears the word, not the number");
{
  const d = fresh();
  const ns = nodes(d);
  const rating = ns.find((n) => n.id === "cx-rating-thumb");
  // The whole point of the band labels: 3 of 5 tells a reader nothing.
  eq("the rating slider announces its band", rating.value, "Okay");
  eq("while its raw value is still there", rating.now, 3);
  const storage = ns.find((n) => n.id === "cx-storage-thumb");
  eq("the storage slider announces its unit", storage.value, "12 GB");
  const duration = ns.find((n) => n.id === "cx-duration-thumb");
  // No unit and no bands, so the attribute stays ABSENT rather than
  // duplicating aria-valuenow.
  ok("a bare slider announces no valuetext", !duration.value, String(duration.value));
  eq("but still reports its position", duration.now, 5);
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
  // ReUI's badge words, and its precedence: the step you are STANDING ON is
  // "In Progress" even when satisfied, because position wins over completion.
  const here = ns.find((n) => n.id === "cx-step-account");
  eq("the step you are on says In Progress", here.name, "Account, In Progress");
  d.press("cx-next"); d.displayListJson();
  const done = JSON.parse(d.a11yJson(2, "")).nodes.find((n) => n.id === "cx-step-account");
  eq("and Completed once you have left it", done.name, "Account, Completed");
  // The slider's position reaches a reader on the ELEMENT path too. It did
  // not until `a11yHasValue`/`a11yHasRange` were set: the numbers alone are
  // not enough, and a slider announcing only its name is the defect that
  // forced this trace to grow in the first place.
  const rate = ns.find((n) => n.id === "cx-rating-thumb");
  eq("the rating slider reports a position", rate.now, 3);
  eq("and its range", `${rate.min}..${rate.max}`, "1..5");
}

// The sliders MOVE. Four of them were drawn from a controller that has known
// how to be pressed, dragged and arrowed since it was measured against Radix,
// and the demo called none of it: `press` on a track returned false, an arrow
// key returned false, and all four sat at their initial values for the life of
// the page. Making `position: absolute` parse a commit earlier put the thumbs
// in the right PLACE, which is the version of this defect that is hardest to
// see — four sliders that look correct and are pictures.
//
// Every press below goes through `hitId(x, y)` at a real coordinate, for the
// same reason the rest of this file does.
console.log("the sliders move");
{
  const d = fresh();
  // Laid out FIRST, every time. `rebuild()` hands back a fresh tree whose
  // boxes are all at zero until something lays it out, so a helper that reads
  // geometry straight after a key press aims at (0, 0) and hits nothing —
  // which shows up as a slider that "did not move" when what did not happen
  // was the press. The page paints between every event and never sees this;
  // a check driving the demo directly does.
  const trackOf = (name) => { d.displayListJson(); return byId(d, `cx-${name}-track`); };
  // Press at a FRACTION of the track, through the hit test, the way the page
  // does: `pressAt(hitId(x, y), x)`.
  const pressFrac = (name, f) => {
    const t = trackOf(name);
    const x = t.calculatedX + t.calculatedWidth * f;
    const y = t.calculatedY + t.calculatedHeight / 2;
    const took = d.pressAt(d.hitId(x, y), x);
    d.displayListJson();
    return took;
  };
  const dragFrac = (name, f) => {
    const t = trackOf(name);
    const x = t.calculatedX + t.calculatedWidth * f;
    const took = d.dragTo("", x);
    d.displayListJson();
    return took;
  };

  eq("storage starts where init put it", d.storage.value, 12);
  ok("a press on the rail is taken", pressFrac("storage", 0.8));
  // 5..35 at 80% is 29. The value comes from the TRACK's geometry, not from
  // where on the control the press landed.
  eq("and lands the value the fraction names", d.storage.value, 29);
  eq("focus goes to the THUMB, not the rail", d.focused, "cx-storage-thumb");

  ok("a drag carries", dragFrac("storage", 0.2));
  eq("to the value under the pointer", d.storage.value, 11);
  // Past either end: clamped, not extrapolated. `valueAtFraction` rounds
  // toward the nearest step and a fraction below zero rounds the other way,
  // which is why SliderCtl spells that branch out.
  ok("a drag past the left end is taken", dragFrac("storage", -0.5));
  eq("and clamps to the minimum", d.storage.value, 5);
  ok("a drag past the right end is taken", dragFrac("storage", 1.5));
  eq("and clamps to the maximum", d.storage.value, 35);
  ok("the drag ends", d.dragEnd());
  ok("and a move after the release is not a drag", dragFrac("storage", 0.5) === false);
  eq("so the value stays where the release left it", d.storage.value, 35);

  // The visible half. A controller that moved and a range that did not is the
  // whole class of defect this file exists for.
  const range = () => Math.round(byId(d, "cx-storage-range").calculatedWidth);
  const thumbX = () => Math.round(byId(d, "cx-storage-thumb").calculatedX);
  eq("the filled range spans the whole track at the maximum", range(), 300);
  // 24 (the track's x) + 300 - 7 (half the thumb) — centred on the value
  // rather than hanging off the end.
  eq("and the thumb is centred on the end, not past it", thumbX(), 317);
  pressFrac("storage", 0.0);
  eq("at the minimum the range is empty", range(), 0);
  eq("and the thumb sits back by half its width", thumbX(), 17);

  // The keyboard, on the focused thumb.
  pressFrac("storage", 0.5);
  eq("a press at the midpoint", d.storage.value, 20);
  ok("ArrowRight is taken", d.key("ArrowRight"));
  eq("and moves by one step", d.storage.value, 21);
  ok("ArrowUp is taken", d.key("ArrowUp"));
  // Up means MORE. Not "earlier in the list", which is what a menu's
  // next/prev keys would have said — the harness caught that on the first run
  // with the reference at 60 and this at 40.
  eq("and also means MORE", d.storage.value, 22);
  d.key("ArrowLeft"); d.key("ArrowDown");
  eq("Left and Down mean less", d.storage.value, 20);
  d.key("Home");
  eq("Home is the minimum", d.storage.value, 5);
  d.key("End");
  eq("End is the maximum", d.storage.value, 35);

  // A key a slider does not use must not fall through to the stepper strip
  // behind it, and neither must one it uses and cannot act on.
  const step0 = d.stepper.current;
  ok("ArrowRight at the maximum is still taken", d.key("ArrowRight"));
  eq("and does not advance the checkout behind it", d.stepper.current, step0);
  ok("Shift+Arrow does not become a back door either",
    d.keyWithShift("ArrowRight", true) && d.stepper.current === step0);

  // Four sliders, four controllers.
  pressFrac("volume", 0.25);
  eq("pressing one slider moves that one", d.volume.value, 25);
  eq("and leaves the others alone", d.storage.value, 35);

  // Everything that is not a slider still goes where it always went.
  d.displayListJson();
  const inc = byId(d, "cx-num-inc");
  const ix = inc.calculatedX + inc.calculatedWidth / 2;
  const iy = inc.calculatedY + inc.calculatedHeight / 2;
  const heldStorage = d.storage.value;
  ok("a press on a button still reaches `press`", d.pressAt(d.hitId(ix, iy), ix));
  eq("focus left the slider", d.focused, "cx-num");
  // And the arrow key goes with it. The two consumers of a key on this page
  // are now three, and the rule is the same one: focus decides.
  ok("so an arrow key belongs to the field again", d.key("ArrowUp"));
  eq("and the slider it left did not move", d.storage.value, heldStorage);
}

// EVERY CLASS THE DEMO EMITS IS A CLASS THE STYLESHEET DEFINES.
//
// The defect this exists for: `StepperCtl.stateOf` answers `active` /
// `completed` / `inactive` / `disabled` / `loading`, and controls.css was
// written against `current` / `complete` / `upcoming`. Nine rules — the
// current step's black circle, its white glyph, its dark title, and the same
// three for completed and for upcoming — matched nothing at all, so every
// step painted identically and the step you were standing on was
// indistinguishable from the ones you had not reached.
//
// Nothing could see it. The stylesheet parses without error, because an
// unused rule is not an error; the tree builds; the layout is fine; and the
// one assertion pointed at it matched a SUBSTRING. A class name is the seam
// between two files, and this is the gate for that seam.
console.log("every emitted class is a class the stylesheet defines");
{
  const d = fresh();
  // The tokens the stylesheet defines, from its own text: `.token {`, plus
  // any pseudo-class form.
  const defined = new Set();
  for (const m of CSS.matchAll(/\.([A-Za-z0-9_-]+)\s*(?::[a-z-]+)?\s*\{/g)) defined.add(m[1]);
  ok("the stylesheet defines some classes", defined.size > 20, String(defined.size));

  // Walk every state the page can reach, not just the one it opens in: a
  // class only a completed step carries is invisible until a step completes.
  const seen = new Map();
  const sweep = () => {
    for (const el of flat(d)) {
      for (const c of String(el.className || "").split(/\s+/)) {
        if (c) seen.set(c, (el.id || el.className));
      }
    }
  };
  sweep();
  clickOn(d, "cx-next"); d.displayListJson(); sweep();
  clickOn(d, "cx-next"); d.displayListJson(); sweep();
  clickOn(d, "cx-back"); d.displayListJson(); sweep();

  const orphans = [...seen.keys()].filter((c) => !defined.has(c)).sort();
  ok("no class is emitted that the stylesheet never defines",
    orphans.length === 0, orphans.join(", "));
  // And the state variants specifically: the controller's vocabulary is the
  // one that counts, because it is the measured one.
  for (const state of ["active", "completed", "inactive", "disabled", "loading"]) {
    for (const base of ["cx-dot", "cx-dottxt", "cx-steplbl"]) {
      ok(`${base}-${state} is defined`, defined.has(`${base}-${state}`));
    }
  }
}

// The four steps are one shape.
//
// Reported: "step 1 on jotenkin väärin asetelmoitu muihin nähden". `.cx-step`
// had no `flex-wrap` — `.cx-strip` was given `nowrap` for this same reason and
// the step one level down was not — so the WIDEST step wrapped its circle onto
// a line of its own. Nothing about it was special except that its badge says
// "In Progress" rather than "Pending".
console.log("the four steps are one shape");
{
  const d = fresh();
  const steps = flat(d).filter((e) => e.id && e.id.startsWith("cx-step-") && hasCls(e, "cx-step"));
  ok("four steps", steps.length === 4, String(steps.length));
  const heights = steps.map((e) => Math.round(e.calculatedHeight));
  ok("all the same height", new Set(heights).size === 1, heights.join("/"));
  // The circle beside the title, not above it: same row means the circle's
  // box sits inside the step's vertical span rather than starting at its top
  // with the column below.
  for (const st of steps) {
    const dot = st.children[0];
    const col = st.children[1];
    const overlap = Math.min(dot.calculatedY + dot.calculatedHeight, col.calculatedY + col.calculatedHeight)
      - Math.max(dot.calculatedY, col.calculatedY);
    ok(`${st.id}: the circle is beside its column`, overlap > 0,
      `dot ${dot.calculatedY}..${dot.calculatedY + dot.calculatedHeight}, col ${col.calculatedY}..${col.calculatedY + col.calculatedHeight}`);
  }
  // And the current step LOOKS current. Before the vocabulary was fixed, the
  // glyph and the title were the same grey on all four.
  const colOf = (e) => (e.color ? `${e.color.r},${e.color.g},${e.color.b}` : "-");
  const cur = steps[0];
  const other = steps[1];
  ok("the current step's glyph differs from a pending one's",
    colOf(cur.children[0].children[0]) !== colOf(other.children[0].children[0]),
    colOf(cur.children[0].children[0]));
  ok("and so does its title",
    colOf(cur.children[1].children[1]) !== colOf(other.children[1].children[1]),
    colOf(cur.children[1].children[1]));
}

// The ruler is a ruler.
//
// Reported: "stepit ei oo ihan tasamittaisia". The row was
// `justify-content: space-between` over thirteen cells sized by their labels,
// and space-between divides the LEFTOVER evenly — so cells of different widths
// give centres at different intervals. Measured before: nine gaps of 23.47px
// and then three of 26.53. The ends were wrong too, each mark being centred in
// a cell that began at the row's edge.
console.log("the ruler is evenly divided");
{
  const d = fresh();
  const marks = flat(d).filter((e) => hasCls(e, "cx-tickmark"));
  ok("thirteen ticks for 0..12 by one", marks.length === 13, String(marks.length));
  const centres = marks.map((m) => +(m.calculatedX + m.calculatedWidth / 2).toFixed(2));
  const gaps = centres.slice(1).map((v, i) => +(v - centres[i]).toFixed(2));
  ok("every gap is the same", new Set(gaps).size === 1, gaps.join(" "));
  // And it spans the TRACK, end to end — the thing space-between could not do
  // while its cells had width.
  const track = byId(d, "cx-duration-track");
  ok("the first tick is on the track's left edge",
    Math.abs(centres[0] - track.calculatedX) < 0.01, `${centres[0]} vs ${track.calculatedX}`);
  ok("and the last on its right",
    Math.abs(centres[12] - (track.calculatedX + track.calculatedWidth)) < 0.01,
    `${centres[12]} vs ${track.calculatedX + track.calculatedWidth}`);
  // A tick sits where its VALUE does. Checked against the controller rather
  // than against 25px, so a different range or step still has to agree.
  const s = d.duration;
  for (let i = 0; i < marks.length; i++) {
    const want = track.calculatedX + s.tickFraction(i) * 300;
    if (Math.abs(centres[i] - want) > 0.01) {
      ok(`tick ${i} sits at its own fraction`, false, `${centres[i]} vs ${want}`);
      break;
    }
    if (i === marks.length - 1) ok("every tick sits at its own fraction", true);
  }
  // The numbers are still on the major ticks only.
  const labelled = flat(d).filter((e) => hasCls(e, "cx-ticktxt") && e.textContent).map((e) => e.textContent);
  ok("only the major ticks carry a number", labelled.join(",") === "0,2,4,6,8,10,12", labelled.join(","));
}

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
console.log("ALL PASS");
