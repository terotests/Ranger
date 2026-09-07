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
  ok("and says so", shows(app, "Tallennetaan"));
  // THE IGNORE. The machine refuses SET_INPUT_TEXT while saving, so a
  // keystroke that arrives mid-flight must not change what is being saved.
  type(app, TEXT + " ja vielä");
  ok("a keystroke while saving changes nothing", shows(app, "ja vielä") === false);

  settle(app, 1200);
  ok("the card lands in the feed", shows(app, "Maastaveto"));
  ok("the waiting line is gone", shows(app, "Tallennetaan") === false);
  ok("and the composer is empty again", shows(app, "Kirjoita merkintä"));
}

console.log("");
console.log("--- Enter sends it too ---");
{
  const app = open();
  app.press("rt-home-field");
  type(app, TEXT);
  ok("Enter is taken", app.keyWith("Enter", false, false));
  ok("and starts the save", shows(app, "Tallennetaan"));
  settle(app, 1200);
  ok("the card lands", shows(app, "Maastaveto"));
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
  ok("the retry lands the card", drawn(app).some((t) => t.includes("Kahvakuula")));
  ok("and the error is gone", shows(app, "epäonnistui") === false);
  ok("and the composer is empty", shows(app, "Kirjoita merkintä"));
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
  ok("the entry is on Home", shows(app, "Aitajuoksu"));
  ok("and the sentence is gone", shows(app, "Ei tulevia tapahtumia") === false);
  ok("and the composer is empty", shows(app, "Kirjoita merkintä"));
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  the quick entry adds a workout, waits, fails and retries");
