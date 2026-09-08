#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Adding a workout, from the press on the field to the card in the feed.
//
//   node gallery/realtrainer/web/add-check.mjs
//
// The row at the top of Home is not a picture of a text field: it is one, and
// the whole of adding a workout starts by pressing it. What follows is a
// request to a backend that is not there — `RtBackendSim`, on the app's own
// clock, so a save takes the same number of milliseconds here as in the
// browser and this check never sleeps.
//
// The states are the point. A screen with no waiting and no failure in it is a
// screen whose waiting and failure were never drawn, so both are walked here:
// the save that lands a card, the save that comes back with an error and LEAVES
// THE TEXT, and the retry after it. The ignores are checked too, because they
// are what a state machine is for — a keystroke while the request is in flight
// must do nothing at all.
//
// AND THE ANSWER IS NOT AN INSERT. What comes back is a proposal — a score, a
// sentence from the coach, and the entries it recognised — and each of those
// is added or skipped by hand. So nothing is written by the request, and the
// walk below only reaches the feed by pressing Add.
//
// Exit code 0 when every check passes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const BIN = path.join(ROOT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const require_ = createRequire(import.meta.url);
const { RealTrainerDemo } = require_(BIN);
const rd = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

// Home, on the training calendar, with the feed settled: the screen the row
// sits on.
const open = (calendar) => {
  const app = new RealTrainerDemo();
  app.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
  app.loadPlanMachine(rd("fixtures", "machines", "planDialog.machine.json"));
  app.loadChatMachine(rd("fixtures", "machines", "chat.machine.json"));
  app.loadReference(rd("fixtures", "reference", "seed.json"));
  app.setPageSize(390, 844);
  app.openRoute("/calendar/" + (calendar || "cal-train"));
  app.press("rt-nav-home");
  let spun = 0;
  while (app.building() && spun < 300) { app.tick(16.7); spun += 1; }
  app.display();
  return app;
};

const drawn = (app) =>
  JSON.parse(app.displayListJson()).cmds.filter((c) => c.k === 3).map((c) => c.text || "");
const shows = (app, s) => drawn(app).some((t) => t.includes(s));
// The clock, until the request answers. `tick` says whether anything moved,
// which is the same answer the host's frame loop acts on.
const settle = (app, ms) => {
  let spent = 0;
  while (spent < ms) { app.tick(16.7); spent += 16.7; }
  app.display();
};
const type = (app, s) => app.applyEdit("rt-home-field", s, s.length, s.length);
// The whole of it: type, send, wait, and say yes to what came back.
const addNow = (app, text) => {
  app.press("rt-home-field");
  type(app, text);
  app.press("rt-home-send");
  settle(app, 1200);
  app.press("rt-review-add-0");
  app.display();
};

const TEXT = "Exercise Maastaveto|3x5@100kg";
// Not a name the fixture already has: the check counts occurrences.
const OTHER = "Exercise Kahvakuulaheilautus|4x12@24kg";

console.log("--- the press, the text, the send ---");
{
  const app = open();
  ok("the row is a real field", app.hasField("rt-home-field"));
  ok("its placeholder is the calendar's", shows(app, "Kirjoita merkintä"));
  ok("pressing it takes the focus", app.press("rt-home-field") && app.focusedField() === "rt-home-field",
     app.focusedField());
  // Nothing typed: the send button is not a button that does nothing.
  ok("an empty composer does not send", app.press("rt-home-send") === false);

  ok("typing goes in", type(app, TEXT));
  ok("and is drawn", shows(app, "Maastaveto"));
  ok("the placeholder is gone", shows(app, "Kirjoita merkintä") === false);

  ok("the send starts a save", app.press("rt-home-send"));
  // THE WAIT IS A SCREEN, not a caption: the request reads the text and
  // comes back with something to look at, and a grey line under the composer
  // is not enough warning for that.
  ok("and says what it is doing", shows(app, "Tarkistetaan tietoja"));
  ok("over everything else", shows(app, "Luetaan merkintä"));
  // THE IGNORE. The machine refuses SET_INPUT_TEXT while saving, so a
  // keystroke that arrives mid-flight must not change what is being saved.
  type(app, TEXT + " ja vielä");
  ok("a keystroke while saving changes nothing", shows(app, "ja vielä") === false);

  settle(app, 1200);
  ok("the waiting screen is gone", shows(app, "Tarkistetaan tietoja") === false);
  // NOTHING IS IN THE FEED YET. What is on the screen is the proposal.
  ok("the review is what came back", shows(app, "Tarkista merkinnät"));
  ok("and the composer is empty again", shows(app, "Kirjoita merkintä"));

  ok("saying yes lands the card", app.press("rt-review-add-0"));
  app.display();
  ok("the card is in the feed", shows(app, "Maastaveto"));
  ok("and the review is gone", shows(app, "Recognized entries") === false);
}

console.log("");
console.log("--- Enter sends it too ---");
{
  const app = open();
  app.press("rt-home-field");
  type(app, TEXT);
  ok("Enter is taken", app.keyWith("Enter", false, false));
  ok("and starts the save", shows(app, "Tarkistetaan tietoja"));
  settle(app, 1200);
  ok("the review comes back", shows(app, "Tarkista merkinnät"));
  ok("and Add lands the card", app.press("rt-review-add-0"));
  app.display();
  ok("the card is in the feed", shows(app, "Maastaveto"));
}

console.log("");
console.log("--- the save that fails, and the retry ---");
{
  const app = open();
  app.press("rt-home-field");
  type(app, OTHER);
  app.armFailure();
  ok("the send starts", app.press("rt-home-send"));
  settle(app, 1200);
  ok("the error is drawn", shows(app, "epäonnistui"), drawn(app).join(" | ").slice(0, 200));
  // THE ONE THAT MATTERS. A failed save that threw away what was typed would
  // be a second failure.
  ok("and the text is still in the composer", shows(app, "Kahvakuulaheilautus"));
  ok("no card was added", drawn(app).filter((t) => t.includes("Kahvakuula")).length === 1,
     drawn(app).filter((t) => t.includes("Kahvakuula")).join(" | "));

  ok("sending again is taken", app.press("rt-home-send"));
  settle(app, 1200);
  ok("the retry comes back with a review", shows(app, "Tarkista merkinnät"));
  app.press("rt-review-add-0");
  app.display();
  ok("and Add lands the card", drawn(app).some((t) => t.includes("Kahvakuula")));
  ok("and the error is gone", shows(app, "epäonnistui") === false);
  ok("and the composer is empty", shows(app, "Kirjoita merkintä"));
}

console.log("");
console.log("--- the wait is drawn, not only written ---");
{
  // A request that takes most of a second and says so only in words is a
  // screen a person taps twice. The send button's chevron becomes a turning
  // ring while the request is in flight — the loading screen's ring at a
  // twentieth of its size, turned by a transform written onto the element
  // once a frame, so the angle is the app's clock and this can read it.
  const app = open();
  const blades = () =>
    JSON.parse(app.displayListJson()).cmds.filter((c) => c.k === 0 && c.w === 3 && c.h === 6);
  ok("nothing is spinning before the send", blades().length === 0);

  app.press("rt-home-field");
  type(app, TEXT);
  app.press("rt-home-send");
  app.tick(16.7);
  app.display();
  ok("the button holds a ring while it waits", blades().length === 8, blades().length + " blades");

  // TURNING, and by the frame time: a dropped frame turns it further rather
  // than slowing it down, which is the same rule the loader's ring follows.
  const angleNow = () => Math.round(blades()[0].rot || 0);
  const a0 = angleNow();
  for (let i = 0; i < 10; i += 1) { app.tick(16.7); app.display(); }
  const a1 = angleNow();
  ok("and it turns", a1 !== a0, `${a0}deg then ${a1}deg`);
  ok("the frame says it moved", app.tick(16.7) === true);

  settle(app, 1200);
  ok("and it is gone once the answer is in", blades().length === 0, blades().length + " blades");
  ok("the chevron is back", shows(app, "Tarkista merkinnät"));
}

console.log("");
console.log("--- what the save answers with ---");
{
  // The screen the request comes back to, laid out top to bottom: a banner
  // with the score and the coach's sentence, the count of what was
  // recognised, and one card per entry — two chips, the title over its date,
  // Add and Skip, and then the rows as they were READ.
  const app = open();
  app.press("rt-home-field");
  type(app, "Juoksu 10km");
  app.press("rt-home-send");
  settle(app, 1200);
  // The overlay is drawn last, so everything from the sheet's own title
  // onward belongs to it. The feed is still under there and would otherwise
  // answer for the buttons this card must not have.
  const all = drawn(app);
  const t = all.slice(all.lastIndexOf("Tarkista merkinnät"));
  const has = (x) => t.some((s) => s.includes(x));

  ok("it is a sheet with a title", has("Tarkista merkinnät"));
  ok("the banner scores it", has("points") && t.some((s) => /^\d+$/.test(s)),
     t.slice(-14).join(" | "));
  ok("and the coach says something about it", has("on kirjattu"));
  // DECISIONS, not adds: a skipped entry is as done with as an added one,
  // and the counter counts both.
  ok("the count is of what was recognised", has("Recognized entries (0/1)"),
     t.filter((s) => s.includes("Recognized")).join(" | "));
  // The two chips over the card: which calendar it would go in, and what
  // would be done to it.
  ok("the chips say where and what", has("training") && has("ADD"));
  ok("the title is what was read out of the text", has("Juoksulenkki"));
  ok("with a date written the way the app writes them", has("03.09.2026"));
  ok("and the two answers are offered", has("Add") && has("Skip"));
  // THE ROWS, which is the point: what is being agreed to is what the parser
  // made of the line, not a sentence about it.
  ok("the body is what was parsed", has("Juoksu") && has("10km"));

  // A PROPOSAL IS NOT AN ENTRY. Nothing has been written, so nothing that is
  // done to a written entry belongs on this card.
  ok("nothing to delete yet", has("Poista") === false, t.join(" | ").slice(0, 120));
  ok("nothing to export yet", has("Compact") === false && has("JSON") === false);
  ok("and nothing to comment on yet", has("Lisää kommentti") === false);
}

console.log("");
console.log("--- Add writes it, Skip does not ---");
{
  const app = open();
  const cards = (a) => drawn(a).filter((x) => x.includes("Juoksulenkki")).length;

  app.press("rt-home-field");
  type(app, "Juoksu 10km");
  app.press("rt-home-send");
  settle(app, 1200);
  ok("Skip is taken", app.press("rt-review-skip-0"));
  app.display();
  ok("and closes the review", shows(app, "Recognized entries") === false);
  // The whole of it: a skipped proposal leaves the store exactly as it was.
  ok("and writes nothing", drawn(app).some((x) => x.includes("10km")) === false,
     drawn(app).filter((x) => x.includes("km")).join(" | "));

  // The same line again, and this time yes.
  app.press("rt-home-field");
  type(app, "Juoksu 10km");
  app.press("rt-home-send");
  settle(app, 1200);
  ok("Add is taken", app.press("rt-review-add-0"));
  app.display();
  ok("and the entry is in the feed", drawn(app).some((x) => x.includes("10km")));
  ok("the review closed on the last decision", shows(app, "Recognized entries") === false);
  ok("pressing Add again does nothing", app.press("rt-review-add-0") === false);
}

console.log("");
console.log("--- closing it skips the rest ---");
{
  // Nothing was written, and a proposal left in a drawer nobody can open
  // again would be a worse answer than dropping it.
  const app = open();
  app.press("rt-home-field");
  type(app, "Juoksu 10km");
  app.press("rt-home-send");
  settle(app, 1200);
  ok("the close is taken", app.press("rt-review-close"));
  app.display();
  ok("the review is gone", shows(app, "Recognized entries") === false);
  ok("and nothing was added", drawn(app).some((x) => x.includes("10km")) === false);
  // And the screen under it takes presses again: a modal that closed but
  // kept the block would be a screen nobody can use.
  ok("Home answers again", app.press("rt-home-field") && app.focusedField() === "rt-home-field");
}

console.log("");
console.log("--- the review is a modal, and nothing under it takes a press ---");
{
  const app = open();
  app.press("rt-home-field");
  type(app, "Juoksu 10km");
  app.press("rt-home-send");
  settle(app, 1200);
  ok("the field under it does not take the focus", app.press("rt-home-field") === false);
  ok("nor does the tab bar", app.press("rt-nav-cal") === false);
  ok("nor a card under it", app.press("rt-entry-notes-0") === false);
  ok("but the review still does", app.press("rt-review-add-0"));
}

console.log("");
console.log("--- the wait turns, and it is the app's clock that turns it ---");
{
  // The waiting screen's ring is the loader's at a third of the size: twelve
  // blades, turned by a transform written onto the element once a frame.
  const app = open();
  const wblades = () =>
    JSON.parse(app.displayListJson()).cmds.filter((c) => c.k === 0 && c.w === 5 && c.h === 14);
  ok("nothing is waiting before the send", wblades().length === 0);
  app.press("rt-home-field");
  type(app, "Juoksu 10km");
  app.press("rt-home-send");
  app.tick(16.7);
  app.display();
  ok("the wait screen holds a ring", wblades().length === 12, wblades().length + " blades");
  const a0 = Math.round(wblades()[0].rot || 0);
  for (let i = 0; i < 10; i += 1) { app.tick(16.7); app.display(); }
  ok("and it turns", Math.round(wblades()[0].rot || 0) !== a0);
  settle(app, 1200);
  ok("and it is gone once the answer is in", wblades().length === 0);
}

console.log("");
console.log('--- "Lisää harjoitus" is the same composer in a modal ---');
{
  // TWO COMPOSERS, ONE MACHINE. The row on Home and the sheet behind "Lisää
  // harjoitus" are both an `AddWorkoutDialog` in front of the same simulated
  // backend, so they must answer alike. They did not: the sheet wrote the
  // entry itself the moment the backend answered — inside the frame loop,
  // with no wait screen, no ring and no review — which is a screen whose
  // state is not the machine's.
  const app = open();
  ok("the sheet opens", app.press("rt-add"));
  ok("with its heading", shows(app, "Lisää harjoitus"));
  ok("its field is a real one", app.hasField("rt-add-field"));
  ok("pressing it takes the focus",
     app.press("rt-add-field") && app.focusedField() === "rt-add-field", app.focusedField());
  ok("an empty sheet does not send", app.press("rt-sheet-save") === false);

  app.applyEdit("rt-add-field", TEXT, TEXT.length, TEXT.length);
  ok("the send starts a save", app.press("rt-sheet-save"));
  ok("and the wait is the same screen", shows(app, "Tarkistetaan tietoja"));
  // The sheet's chevron turns too, off the same clock as Home's.
  const blades = () =>
    JSON.parse(app.displayListJson()).cmds.filter((c) => c.k === 0 && c.w === 3 && c.h === 6);
  app.tick(16.7);
  app.display();
  ok("its button holds a ring", blades().length === 8, blades().length + " blades");
  // THE IGNORE, on this composer too.
  app.applyEdit("rt-add-field", TEXT + " ja vielä", 0, 0);
  ok("a keystroke while saving changes nothing", shows(app, "ja vielä") === false);

  settle(app, 1200);
  // "Lisää harjoitus" is also the calendar's own button, so the sheet is
  // recognised by what only it draws.
  ok("the sheet closed", shows(app, "Lisää kuva") === false);
  ok("and the answer is a review", shows(app, "Recognized entries (0/1)"));
  ok("with the same banner", shows(app, "points") && shows(app, "on kirjattu"));
  ok("Add lands the card", app.press("rt-review-add-0"));
  app.display();
  ok("the entry is in the feed", shows(app, "Maastaveto"));
}

console.log("");
console.log("--- and it fails and retries the same way ---");
{
  const app = open();
  app.press("rt-add");
  app.press("rt-add-field");
  app.applyEdit("rt-add-field", OTHER, OTHER.length, OTHER.length);
  app.armFailure();
  ok("the send starts", app.press("rt-sheet-save"));
  settle(app, 1200);
  ok("the error is drawn", shows(app, "epäonnistui"));
  ok("the sheet is still there", shows(app, "Lisää kuva"));
  // ERROR takes `saving` back to `open` and does NOT clear the input.
  ok("and the text is still in it", shows(app, "Kahvakuulaheilautus"));
  ok("nothing came back to review", shows(app, "Recognized entries") === false);

  ok("sending again is taken", app.press("rt-sheet-save"));
  settle(app, 1200);
  ok("the retry comes back with a review", shows(app, "Recognized entries (0/1)"));
  app.press("rt-review-add-0");
  app.display();
  ok("and Add lands the card", drawn(app).some((t) => t.includes("Kahvakuula")));
}

console.log("");
console.log("--- Enter sends the sheet too ---");
{
  const app = open();
  app.press("rt-add");
  app.press("rt-add-field");
  app.applyEdit("rt-add-field", TEXT, TEXT.length, TEXT.length);
  ok("Enter is taken", app.keyWith("Enter", false, false));
  ok("and starts the save", shows(app, "Tarkistetaan tietoja"));
  settle(app, 1200);
  ok("the review comes back", shows(app, "Recognized entries (0/1)"));
  ok("Skip drops it", app.press("rt-review-skip-0"));
  app.display();
  ok("and nothing was written", drawn(app).filter((t) => t.includes("Maastaveto")).length === 0,
     drawn(app).filter((t) => t.includes("Maastaveto")).join(" | "));
}

console.log("");
console.log("--- the AI chat proposes, and its yes writes ---");
{
  // THE THIRD COMPOSER. The chat has its own machine — sixteen events, an
  // `always` fork, an `onDone` — and it already had a `reviewing` state. What
  // it did not have was anything IN it: a row reading `addWorkout · w1` with
  // Hyväksy and Hylkää after it, and an accept that ran a six-hundred
  // millisecond job and wrote NOTHING to the diary. A review of an id is a
  // review of nothing.
  const app = open();
  ok("the chat opens", app.press("rt-nav-chat"));
  ok("two lifts in one sentence is taken", app.press("rt-chat-type2"));
  ok("and sends", app.press("rt-chat-send"));
  // The stream is on the app's clock, like every other wait here.
  for (let i = 0; i < 80; i += 1) app.tick(200);
  app.display();
  const t = drawn(app);
  const has = (x) => t.some((s) => s.includes(x));

  ok("what came back is proposed one card at a time",
     t.filter((s) => s === "ADD").length === 2, t.join(" | ").slice(0, 200));
  ok("each says which calendar it would go in", has("training"));
  // THE POINT: the title and the rows are what the parser made of the
  // phrase, not the id the machine gave it.
  ok("with the lift's own name on it", has("Maastaveto") && has("kyykky"));
  ok("and the rows it would write", has("3x5") && has("x100kg"));
  ok("no id is shown as if it were a review", has("addWorkout · w1") === false);
  ok("and the two answers are offered", has("Hyväksy") && has("Hylkää"));
  // A proposal is not an entry here either.
  ok("nothing to delete yet", has("Poista") === false);
  // "Näytä tilastot" is an icon button with no text, so it is the recorded
  // accessibility trace (`chat-review.json`) that holds it out of a proposal.

  ok("one is accepted", app.press("rt-chat-accept-0"));
  ok("and says so", shows(app, "hyväksytty"));
  ok("the other is rejected", app.press("rt-chat-reject-1"));
  ok("and says so", shows(app, "hylätty"));
  // In `multiAction` the machine stays in the review until it is closed —
  // that is the machine's own shape, not the view's.
  ok("closing it saves what was accepted", app.press("rt-chat-close"));
  settle(app, 900);
  ok("the review is gone", shows(app, "Hyväksy") === false);

  app.press("rt-nav-home");
  let spun = 0;
  while (app.building() && spun < 300) { app.tick(16.7); spun += 1; }
  app.display();
  // THE WHOLE OF IT. The accept used to end in "Tallennetaan päiväkirjaan…"
  // and an empty diary.
  ok("the accepted lift is in the diary", shows(app, "Maastaveto"));
  ok("and the rejected one is not", shows(app, "kyykky") === false,
     drawn(app).filter((x) => x.toLowerCase().includes("kyykky")).join(" | "));
}

console.log("");
console.log("--- a lift written the way a person writes one ---");
{
  // `Maastaveto 3x5@100kg` is what someone types; `Exercise Maastaveto|3x5@100kg`
  // is what the parser reads. The recogniser bridges the two, which is what
  // lets the chat's proposals and the quick entry's carry real rows.
  const app = open();
  addNow(app, "Penkkipunnerrus 3x8@60kg");
  ok("the name became the title", shows(app, "Penkkipunnerrus"));
  ok("and the sets became a row", shows(app, "3x8") || shows(app, "3x"),
     drawn(app).filter((x) => x.includes("8")).slice(0, 8).join(" | "));
}

console.log("");
console.log("--- the field is one line, whatever is in it ---");
{
  // An `<input>` never wraps: it scrolls. The plan calendar's placeholder is
  // the longer of the two and does not fit its box, and before `white-space`
  // it broke onto a second line and fell out of the bottom of a 40px row.
  for (const [cal, ghost] of [["cal-plan", "maanantai"], ["cal-train", "treeni 60min"]]) {
    const app = open(cal);
    const runs = drawn(app).filter((t) => t.startsWith("Kirjoita") || t.includes(ghost));
    ok(`${cal}: the placeholder is one run, not two`, runs.length === 1, runs.join(" / "));
  }
  const app = open("cal-plan");
  app.press("rt-home-field");
  // Longer than the box by a wide margin, and still one line.
  const LONG = "maanantai pitkä juoksulenkki metsässä ja sen jälkeen venyttelyt";
  type(app, LONG);
  const runs = drawn(app).filter((t) => t.includes("juoksulenkki"));
  ok("and so is a value longer than the box", runs.length === 1, runs.join(" / "));
}

console.log("");
console.log("--- a plan calendar answers with what is coming ---");
{
  // "Ei tulevia tapahtumia" used to be printed whether or not anything was
  // coming, so a plan calendar could be written into and answer that it had
  // nothing, with the entry sitting in the store.
  const app = open("cal-plan");
  ok("it starts with nothing coming", shows(app, "Ei tulevia tapahtumia"));
  app.press("rt-home-field");
  type(app, "Exercise Aitajuoksu|6x60m");
  ok("the send starts", app.press("rt-home-send"));
  settle(app, 1200);
  ok("the review still says nothing is coming", shows(app, "Ei tulevia tapahtumia"));
  ok("Add is taken", app.press("rt-review-add-0"));
  app.display();
  ok("the entry is on Home", shows(app, "Aitajuoksu"));
  ok("and the sentence is gone", shows(app, "Ei tulevia tapahtumia") === false);
  ok("and the composer is empty", shows(app, "Kirjoita merkintä"));
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  the quick entry reads a workout, proposes it, and adds what is agreed to");
