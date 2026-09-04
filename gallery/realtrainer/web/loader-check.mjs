#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The app, driven with a made-up clock and read out of the display list.
//
//   node gallery/realtrainer/web/loader-check.mjs
//
// No browser and no GPU: the animation lives in `tick`, so the only thing a
// browser adds is pixels. What is asserted here is what the app SAYS to draw —
// that the bar's rectangle grows with time, that the ring's twelve blades
// carry a rotation that advances, that the gradient reaches the command (the
// whole reason `EVGDisplayList.applyGradient` exists), that the scene hands
// over when the bar is full, and that the controls behind the last two scenes
// are gallery/ui's own: sorting a column three times, opening one accordion
// section, switching a tab, and what each of them tells a reader.
//
// Exit code 0 when every check passes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, "..", "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const require = createRequire(import.meta.url);
const { RealTrainerDemo } = require(BIN);
const CSS = fs.readFileSync(path.join(HERE, "realtrainer.css"), "utf8");
const COMPACT = fs.readFileSync(
  path.join(HERE, "..", "fixtures", "session.compact"),
  "utf8",
);

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

const app = new RealTrainerDemo();
app.init(CSS, COMPACT);

console.log("--- the stylesheet ---");
const errs = [];
for (let i = 0; i < app.styleErrorCount(); i += 1) errs.push(app.styleErrorAt(i));
ok("parses with no errors", errs.length === 0, errs.join("; "));

const listOf = () => JSON.parse(app.displayListJson()).cmds;
const rectsOf = (cmds) => cmds.filter((c) => c.k === 0);
const textsOf = (cmds) => cmds.filter((c) => c.k === 3).map((c) => c.text);
// The bar's fill is the only gradient that runs ACROSS its box, which is what
// makes it findable without an id in a list that has no ids in it.
const fillOf = (cmds) => rectsOf(cmds).find((c) => c.gd === 1 && c.h === 14);

console.log("\n--- frame one ---");
let cmds = listOf();
ok("the loader is the scene", app.sceneName() === "loading", app.sceneName());
const words = textsOf(cmds);
ok("the wordmark is drawn", words.includes("REAL") && words.includes("TRAINER"), words.join("|"));
ok("and the caption", words.includes("Ladataan..."), words.join("|"));
ok("the bar starts empty", (fillOf(cmds)?.w ?? -1) === 0, JSON.stringify(fillOf(cmds)));

// The twelve blades: same size, one gradient each, twelve different angles.
const blades = rectsOf(cmds).filter((c) => c.w === 8 && c.h === 26);
ok("twelve blades", blades.length === 12, "found " + blades.length);
ok("each blade is a two-stop fill", blades.every((b) => b.c2 && b.gd === 0),
   JSON.stringify(blades[0]));
ok("and they fade around the ring",
   blades[0].c[3] === 1 && blades[11].c[3] < 0.2,
   blades.map((b) => b.c[3]).join(","));
const angles = blades.map((b) => Math.round(b.rot ?? 0)).sort((a, b) => a - b);
ok("twelve distinct angles, 30 degrees apart",
   new Set(angles).size === 12 && angles[1] - angles[0] === 30, angles.join(","));
console.log("\n--- half a second later ---");
const before = blades[0].rot ?? 0;
app.tick(500);
cmds = listOf();
const spun = rectsOf(cmds).filter((c) => c.w === 8 && c.h === 26)[0].rot ?? 0;
// 220 deg/s for half a second.
ok("the ring has turned ~110 degrees", Math.abs(spun - before - 110) < 1,
   `${before} -> ${spun}`);
const half = fillOf(cmds);
ok("the bar is a fifth of the way", Math.abs(half.w - 320 * (500 / 2600)) < 1, String(half.w));
ok("the fill is a gradient across its box", half.gd === 1 && Array.isArray(half.c2),
   JSON.stringify(half));
ok("the percentage counts", textsOf(cmds).includes("19 %"), textsOf(cmds).join("|"));
ok("the caption is still the first one",
   textsOf(cmds).includes("Ladataan..."), textsOf(cmds).join("|"));

// Every blade turns about the SAME point, which is what makes it a ring
// rather than twelve boxes with angles on them. Asked here and not on the
// first frame: at rest the top blade's rotation is zero and a command with no
// rotation carries no origin — correctly, and there is nothing to compare.
const turned = rectsOf(cmds).filter((c) => c.w === 8 && c.h === 26);
const pivots = new Set(turned.map((b) => `${b.rox},${b.roy}`));
ok("all twelve turn about one pivot", pivots.size === 1, [...pivots].join(" / "));

console.log("\n--- when the bar is full ---");
app.tick(2100);
cmds = listOf();
ok("the bar is the width of its track", Math.abs(fillOf(cmds).w - 320) < 0.01,
   String(fillOf(cmds).w));
ok("and it says so", textsOf(cmds).includes("Valmista!"), textsOf(cmds).join("|"));
ok("the scene has not changed yet", app.sceneName() === "loading", app.sceneName());

console.log("\n--- and then the sign-in page ---");
app.tick(800);
ok("the scene handed over", app.sceneName() === "signin", app.sceneName());
cmds = listOf();
const t2 = textsOf(cmds);
ok("the three things it can do are listed",
   t2.includes("Käytä") && t2.includes("Sanele,") && t2.includes("Kuvaa"), t2.join("|"));
ok("the button is there", t2.includes("Jatka Googlella"), t2.join("|"));
// The icons are SVG, so they arrive as PATH commands and not as glyphs.
ok("the icons are drawn as paths", cmds.filter((c) => c.k === 6).length >= 6,
   "paths: " + cmds.filter((c) => c.k === 6).length);

console.log("\n--- the pointer ---");
const centre = 980 / 2;
// Where the button is, found by asking the app rather than by measuring the
// picture: this is EVG's own hit test, the same one the page uses.
const hits = [];
for (let y = 0; y < 760; y += 4) {
  if (app.hitId(centre, y) === "rt-google") hits.push(y);
}
ok("the button answers the hit test", hits.length > 0, "no row of the page hit it");

console.log("\n--- gallery/ui's controls, on the sign-in page ---");
// The checkbox is CheckboxCtl's, so this is Radix's state machine being driven
// through an app's hit test rather than a box this demo draws.
ok("the checkbox starts unchecked", app.press("rt-remember") === true, "no change");
let a11y = JSON.parse(app.a11yJson(1, ""));
const nodeById = (t) => a11y.nodes.find((n) => n.id === t);
ok("and reports itself checked", nodeById("rt-remember")?.checked === 2,
   JSON.stringify(nodeById("rt-remember")));
ok("the tips are collapsed", nodeById("rt-tips-content") === undefined,
   "content is in the tree while closed");
ok("the trigger opens them", app.press("rt-tips-trigger") === true, "no change");
// The body is a node with no ROLE — a plain box holding a label — so it is
// the drawn text that says whether it opened, not the accessibility tree.
ok("and then the tip is drawn",
   textsOf(listOf()).some((t) => t.startsWith("Sanele treeni")),
   textsOf(listOf()).join("|"));

console.log("\n--- and the dashboard behind it ---");
ok("the button opens the dashboard",
   app.press("rt-google") === true && app.sceneName() === "dashboard", app.sceneName());
cmds = listOf();
let t3 = textsOf(cmds);
ok("the three tabs are drawn",
   t3.includes("Dashboard") && t3.includes("Kalenteri") && t3.includes("Harjoitteet"),
   t3.join("|"));
ok("the active plan is on the dashboard tab",
   t3.some((t) => t.startsWith("Kuulantyöntäjän")), t3.join("|"));

// The goals table: the order is TableCtl's, and three clicks on one header is
// ascending, descending, and back to the order the records arrived in. A
// two-way toggle cannot reach that third state, which is why the table is not
// hand-rolled here.
const goalOrder = () => {
  const rows = JSON.parse(app.a11yJson(1, "")).nodes
    .filter((n) => n.id.startsWith("rt-goals-cell-") && n.id.endsWith("-goal"));
  return rows.map((n) => n.name);
};
const arrived = goalOrder();
ok("four goals, in the order they were given", arrived.length === 4, arrived.join("|"));
app.press("rt-goals-col-goal");
const asc = goalOrder();
ok("one click sorts A-Z", asc[0] < asc[3] && asc.join("|") !== arrived.join("|"), asc.join("|"));
app.press("rt-goals-col-goal");
const desc = goalOrder();
ok("two clicks sort Z-A", desc[0] > desc[3], desc.join("|"));
app.press("rt-goals-col-goal");
ok("three clicks are the original order", goalOrder().join("|") === arrived.join("|"),
   goalOrder().join("|"));

// The toggle is ToggleCtl's; the filtering is this app's, over the order the
// controller arrived at.
app.press("rt-sportonly");
ok("the toggle filters the table", goalOrder().length === 1, goalOrder().join("|"));
app.press("rt-sportonly");
ok("and unfilters it", goalOrder().length === 4, goalOrder().join("|"));

// The accordion lives on the third tab, so getting to it is a tab press —
// TabsCtl's own activate, through the same hit-test path.
ok("the tab switches", app.press("rt-tabs-tab-drills") === true, "no change");
t3 = textsOf(listOf());
ok("and the plans are listed",
   t3.some((t) => t.startsWith("M50 Kuulantyöntö")), t3.join("|"));
ok("one section is open",
   t3.some((t) => t.startsWith("Kaksi kilpailukautta")), t3.join("|"));
ok("opening another closes the first", app.press("rt-plans-sm26-trigger") === true, "no change");
t3 = textsOf(listOf());
ok("the second body is showing",
   t3.some((t) => t.startsWith("Kevyempi jakso")) &&
     !t3.some((t) => t.startsWith("Kaksi kilpailukautta")), t3.join("|"));

// Pressing the tab that is already on. `activate` rebuilds the controller's
// subtree whether or not the value changed, so this is the case that emptied
// the dashboard: right tab strip, nothing under it.
app.press("rt-tabs-tab-dash");
app.press("rt-tabs-tab-dash");
ok("pressing the open tab keeps its content",
   textsOf(listOf()).some((t) => t.startsWith("Kuulantyöntäjän")),
   textsOf(listOf()).join("|"));

// The calendar is the one grid in the app: seven columns, four weeks, and the
// marked days carry a second box.
ok("the calendar tab draws a month", app.press("rt-tabs-tab-cal") === true, "no change");
cmds = listOf();
const dayNumbers = textsOf(cmds).filter((t) => /^\d+$/.test(t));
ok("twenty-eight days", dayNumbers.length === 28, dayNumbers.length + " day numbers");
const marks = cmds.filter((c) => c.k === 0 && c.w === 34 && c.h === 6);
ok("twelve of them carry a session", marks.length === 12, marks.length + " marks");

console.log("\n--- the training session ---");
app.press("rt-tabs-tab-dash");
ok("the rail opens a session",
   app.press("rt-rail-train") === true && app.sceneName() === "session", app.sceneName());
// The session's content is PARSED. `Exercise Takakyykky|3x5@90kg` in
// fixtures/session.compact is what the screen names and what it counts, and
// the spec line arrives as two runs — `3x5` and `x90kg` — because that is
// what CompactStatBuilder returns and the card draws one element per part.
let t4 = textsOf(listOf());
ok("the workout is named by the document", t4.includes("Kontrastivoima"), t4.join("|"));
ok("the first move is the first exercise row", t4.includes("1. Takakyykky"), t4.join("|"));
ok("its spec is two parts, not one string",
   t4.includes("3x5") && t4.includes("x90kg"), t4.join("|"));
ok("and the section above it is shown", t4.includes("Pääosa"), t4.join("|"));
ok("the plan's length is counted, not assumed",
   t4.includes("0 / 5 liikettä tehty"), t4.join("|"));

// The steppers, and the clamps that are the reason a stepper exists. They
// write into the ROW, so the spec line is rebuilt from the plan rather than
// from numbers the screen keeps beside it.
app.press("rt-reps-up");
app.press("rt-reps-up");
app.press("rt-weight-up");
t4 = textsOf(listOf());
ok("the steppers write into the row",
   t4.includes("3x7") && t4.includes("x95kg"), t4.join("|"));
for (let i = 0; i < 6; i += 1) app.press("rt-sets-down");
ok("and clamp at one set", textsOf(listOf()).includes("1x7"),
   textsOf(listOf()).join("|"));

// --- saving, which is simulated and has to look like it ---------------------
//
// No network and no cloud. What the screen still needs is the SHAPE of one:
// a wait with a state on it, and a failure that can be reached on purpose.
// The backend runs off the app's clock, so this takes no real time.
ok("saving starts a wait", app.press("rt-save") === true, "no change");
ok("and says so", textsOf(listOf()).some((t) => t.startsWith("Tallennetaan")),
   textsOf(listOf()).join("|"));
app.tick(400);
ok("still waiting halfway",
   textsOf(listOf()).some((t) => t.startsWith("Tallennetaan")),
   textsOf(listOf()).join("|"));
app.tick(400);
ok("then it is saved, with a version",
   textsOf(listOf()).some((t) => t.startsWith("Tallennettu — versio 1")),
   textsOf(listOf()).join("|"));

// A demo that cannot be made to fail on purpose is a demo whose error state
// nobody has looked at.
ok("the failure can be armed", app.press("rt-fail") === true, "no change");
app.press("rt-save");
app.tick(800);
ok("and then the save fails",
   textsOf(listOf()).some((t) => t.startsWith("Tallennus epäonnistui")),
   textsOf(listOf()).join("|"));
const saveState = JSON.parse(app.a11yJson(1, "")).nodes.find((n) => n.id === "rt-save-state");
ok("the state is announced as one", saveState?.role === "status", JSON.stringify(saveState));
app.press("rt-fail");


// The rest picker is a RadioGroupCtl, so the timer's length is the
// controller's value and not a number this screen keeps beside it.
ok("the rest picker takes a press", app.press("rt-rest-90") === true, "no change");
ok("starting the sets opens the dial", app.press("rt-start") === true, "no change");
cmds = listOf();
ok("the dial counts the chosen rest", textsOf(cmds).includes("90"), textsOf(cmds).join("|"));
const ticks = () => listOf().filter((c) => c.k === 0 && c.w === 6 && c.h === 18);
ok("sixty ticks", ticks().length === 60, ticks().length + " ticks");
// Lit is ORANGE and unlit is slate — both are two-stop fills now, for the
// reason the stylesheet gives beside `.rt-tick`, so the colour is what tells
// them apart and not the presence of a gradient.
const litNow = () => ticks().filter((c) => c.c[0] > c.c[2]).length;
ok("and all of them are lit at the start", litNow() === 60, litNow() + " lit");
app.tick(30000);
ok("a third of the way, forty are lit", litNow() === 40, litNow() + " lit");
ok("and the number counts down", textsOf(listOf()).includes("60"), textsOf(listOf()).join("|"));
app.press("rt-pause");
const paused = litNow();
app.tick(5000);
ok("pausing stops the countdown", litNow() === paused, `${paused} -> ${litNow()}`);
app.press("rt-reset");
ok("reset fills it again", litNow() === 60, litNow() + " lit");
app.tick(91000);
ok("it stops at zero", textsOf(listOf()).includes("0") && litNow() === 0,
   litNow() + " lit");
ok("and says the rest is over",
   textsOf(listOf()).some((t) => t.startsWith("Tauko ohi")), textsOf(listOf()).join("|"));
ok("done goes back to the exercise",
   app.press("rt-timer-done") === true &&
     textsOf(listOf()).includes("1x7"), textsOf(listOf()).join("|"));
// Done counts one off the plan AND moves to the next exercise row, which is
// the second one in the document rather than the second thing in it: the
// section heading between them is a row too, and it is not a move.
ok("and the session's own bar counts exercises",
   app.press("rt-done") === true &&
     textsOf(listOf()).includes("1 / 5 liikettä tehty"), textsOf(listOf()).join("|"));
ok("done moves on to the next exercise",
   textsOf(listOf()).includes("2. Vauhditon pituus"), textsOf(listOf()).join("|"));

// The fourth exercise is measured — `3x45s,45s,0s`, what was done rather than
// what was planned. There is nothing on it for a stepper to write, and the
// card says so instead of offering three that would edit the past.
app.press("rt-done");
app.press("rt-done");
const measured = textsOf(listOf());
ok("a measured row prints its times", measured.includes("45s, 45s"), measured.join("|"));
ok("a measured row refuses to be saved",
   app.press("rt-save") === true &&
     textsOf(listOf()).some((t) => t.startsWith("Tätä riviä ei voi")),
   textsOf(listOf()).join("|"));
ok("and carries no steppers",
   !measured.includes("Sarjat") && measured.some((t) => t.startsWith("Mitattu sarja")),
   measured.join("|"));

console.log("\n--- the document ---");
// The session screen shows one move at a time, which hides everything else the
// parser did. This screen is the other half: every row, drawn by its family.
app.press("rt-rail-log");
ok("the rail opens the document", app.sceneName() === "document", app.sceneName());
const doc = textsOf(listOf());
ok("the whole document is drawn", doc.includes("21 riviä"), doc.join("|"));
ok("a summary is drawn", doc.includes("Kova mutta hallittu treeni"), doc.join("|"));
ok("a phase carries its number", doc.includes("Phase1"), doc.join("|"));
ok("a duration is drawn", doc.includes("10min") && doc.includes("Alkulämmittely"), doc.join("|"));
ok("a run derives its pace", doc.includes(" @0:36/100m"), doc.join("|"));
ok("a custom row is name and value", doc.includes("~4"), doc.join("|"));
// The life line's number is its own element, which is the whole point of
// splitting it out: a reader can be pointed at it.
ok("a life line's number is its own run", doc.includes("78.5kg"), doc.join("|"));
ok("and its label is too", doc.includes("Weight"), doc.join("|"));
ok("both sections are headings",
   doc.includes("Pääosa") && doc.includes("Loppuverryttely"), doc.join("|"));
// Tags and emojis belong to the workout, not to the list.
ok("tags are not a row", !doc.some((t) => t.includes("kontrasti")), doc.join("|"));
const docTree = JSON.parse(app.a11yJson(1, "")).nodes;
ok("the list is a list", docTree.some((n) => n.id === "rt-doc-list" && n.role === "list"),
   JSON.stringify(docTree.find((n) => n.id === "rt-doc-list")));
ok("with an item per row",
   docTree.filter((n) => n.role === "listitem").length === 21,
   docTree.filter((n) => n.role === "listitem").length + " items");

// A circuit is a header and its exercises, flattened into the list under it.
ok("a circuit draws its rounds and its variant",
   doc.includes("3x") && doc.includes("circuit"), doc.join("|"));
ok("and its exercises are rows of their own",
   doc.includes("8@80kg") && doc.includes("12@60kg"), doc.join("|"));

// The document scrolls. How far is the LAYOUT's answer — it measured the
// content — so the app asks for a distance and is told what it got.
const lastText = () => {
  // The last text of the DOCUMENT: the scrollbar's own label ("34 %") is
  // drawn after it and is not a row.
  const t = listOf().filter((c) => c.k === 3 && !/^\d+ %$/.test(c.text));
  return t[t.length - 1];
};
const bottomBefore = lastText().y;
ok("the wheel moves the document", app.scrollDocument(200) === true);
ok("and the rows move with it", lastText().y < bottomBefore,
   `${bottomBefore} -> ${lastText().y}`);
ok("it stops at the end", app.scrollDocument(2000) === false, "kept scrolling");
ok("and comes back to the top",
   app.scrollDocument(-9999) === true && lastText().y === bottomBefore,
   `${bottomBefore} -> ${lastText().y}`);
ok("and stops there too", app.scrollDocument(-100) === false, "kept scrolling");

// --- the ported state machine, on a screen ---------------------------------
//
// The dialog is drawn from `addWorkoutDialog`'s state and nothing else: there
// is no local "is it open" flag and no second copy of the text. Which states
// it has and what each event does is checked exhaustively by `rt:machine`
// against the XState machine it was ported from; this is that machine wired to
// a view.
ok("the dialog opens", app.press("rt-add") === true, "no change");
let sheet = textsOf(listOf());
ok("with its heading", sheet.includes("Lisää harjoitus"), sheet.join("|"));
ok("and the field's placeholder while nothing is typed",
   sheet.includes('Luo harjoitusohjelma, esim. "viikon peruskuntojakso"'), sheet.join("|"));
app.press("rt-add-field");
app.typeText("Exercise Maastaveto|3x5@100kg");
ok("typing reaches the machine",
   textsOf(listOf()).includes("Exercise Maastaveto|3x5@100kg"),
   textsOf(listOf()).join("|"));
ok("saving waits", app.press("rt-sheet-save") === true && textsOf(listOf()).includes("Tallennetaan…"),
   textsOf(listOf()).join("|"));
app.tick(800);
ok("and a finished save closes it",
   !textsOf(listOf()).includes("Tallennetaan…") &&
     !textsOf(listOf()).includes("Exercise Maastaveto|3x5@100kg"),
   textsOf(listOf()).join("|"));

// ERROR takes `saving` back to `open` and does NOT clear the input — a failed
// save that threw away what was typed would be a second failure. That arm is
// one of the twenty-one cells rt:machine checks; this is it on screen.
app.press("rt-add");
app.press("rt-add-field");
app.typeText("Exercise Maastaveto|3x5@100kg");
app.press("rt-fail");
app.press("rt-sheet-save");
app.tick(800);
sheet = textsOf(listOf());
ok("a failed save says so", sheet.some((t) => t.startsWith("Tallennus epäonnistui")), sheet.join("|"));
ok("and keeps what was typed",
   sheet.includes("Exercise Maastaveto|3x5@100kg"), sheet.join("|"));
ok("the dialog is still there", sheet.includes("Lisää harjoitus"), sheet.join("|"));
app.press("rt-sheet-cancel");
app.press("rt-fail");
ok("cancel closes it",
   !textsOf(listOf()).includes("Päivä"), textsOf(listOf()).join("|"));

// An id nothing handled is not handled. This was a real hole: the loader's
// "a press skips the wait" was the fall-through for every scene.
ok("an unknown id is not claimed", app.press("rt-nothing-here") === false, "claimed it");

// And back, because the rail is a navigation and not a one-way door.
ok("the rail goes home again",
   app.press("rt-rail-home") === true && app.sceneName() === "dashboard",
   app.sceneName());

console.log("\n--- what a reader is told ---");
app.press("rt-quit");
app.press("rt-tabs-tab-dash");
const problems = app.a11yProblems();
ok("the tree lints clean", problems.length === 0, problems.join("; "));
const tree = JSON.parse(app.a11yJson(1, ""));
const roles = tree.nodes.map((n) => n.role);
// The controllers' own vocabulary, arriving through `adopt` — without that
// bridge every one of these paints correctly and says nothing.
ok("the tab strip is a tablist with tabs",
   roles.includes("tablist") && roles.filter((r) => r === "tab").length === 3,
   roles.join(","));
ok("the sorted column says so",
   tree.nodes.some((n) => n.id === "rt-goals-col-goal" && n.role === "columnheader"),
   JSON.stringify(tree.nodes.find((n) => n.id === "rt-goals-col-goal")));

// And the loader's own reading, which is ProgressCtl's row: a progressbar with
// a range and a position, not a picture of a bar.
app.press("rt-rail-out");
ok("the rail logs out to the loader", app.sceneName() === "loading", app.sceneName());
app.tick(1300);
const loading = JSON.parse(app.a11yJson(1, "")).nodes.find((n) => n.id === "rt-bar");
ok("the bar is a progressbar", loading?.role === "progressbar", JSON.stringify(loading));
ok("with a value on it", loading?.now > 0 && loading?.max === 100,
   JSON.stringify(loading));

console.log("");
if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
console.log("ALL PASS");
