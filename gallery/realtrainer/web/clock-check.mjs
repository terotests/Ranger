#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What day it is, and who decides.
//
//   node gallery/realtrainer/web/clock-check.mjs
//
// Ranger has no date type and no `now()`. That is deliberate and it is the
// same decision `AddWorkoutDialog` records: the machine it was ported from
// calls `new Date()` inside its own reducer, so its reset depends on when it
// ran, and a clock belongs outside a state machine for the same reason it
// belongs outside a workout controller. `UiDate` is the arithmetic — days
// since an epoch, weekday, ISO — and nothing more.
//
// So the app takes today as a VALUE and the host hands it in. Which means it
// has to be handed in: it was a bare constant nobody set, and the deployed
// page opened five days in the past. The week arithmetic was right the whole
// time — 31.8.2026 really is the Monday of week 36 — and it was drawing the
// wrong week.
//
// The checks below are the two halves of that: the arithmetic against dates
// worked out independently, and the wiring that lets a host say when now is.
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

// The week the calendar opens on, reached the way a person reaches it: the
// bar's calendar, which is always THIS week — `?week=` is only for a route.
const open = (today) => {
  const app = new RealTrainerDemo();
  app.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
  app.loadPlanMachine(rd("fixtures", "machines", "planDialog.machine.json"));
  app.loadChatMachine(rd("fixtures", "machines", "chat.machine.json"));
  if (today) app.setToday(today);
  app.loadReference(rd("fixtures", "reference", "seed.json"));
  app.setPageSize(390, 844);
  app.openRoute("/calendar/cal-plan");
  app.press("rt-nav-calendar");
  let spun = 0;
  while (app.building() && spun < 400) { app.tick(16.7); spun += 1; }
  app.display();
  return app;
};
const texts = (app) =>
  JSON.parse(app.displayListJson()).cmds.filter((c) => c.k === 3).map((c) => c.text || "");
const weekOf = (app) => texts(app).find((t) => t.startsWith("vko ")) || "";
const dayNumbers = (app) =>
  texts(app).filter((t) => /^\d{1,2}$/.test(t)).slice(0, 7).map(Number);

// The answers, worked out with the platform's own calendar rather than with
// the code under test — otherwise this would only prove it agrees with itself.
const isoWeek = (iso) => {
  const t = new Date(iso + "T00:00:00Z");
  const n = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  n.setUTCDate(n.getUTCDate() + 4 - (n.getUTCDay() || 7));
  const y = new Date(Date.UTC(n.getUTCFullYear(), 0, 1));
  return Math.ceil(((n - y) / 86400000 + 1) / 7);
};
const mondayDates = (iso) => {
  const t = new Date(iso + "T00:00:00Z");
  const back = (t.getUTCDay() + 6) % 7;
  const out = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(t);
    d.setUTCDate(t.getUTCDate() - back + i);
    out.push(d.getUTCDate());
  }
  return out;
};

console.log("--- the week the calendar opens on is the week today is in ---");
{
  // Four dates that break the easy mistakes: a mid-week day, a Monday, a
  // Sunday, and one where the ISO week belongs to the year next door.
  for (const day of ["2026-09-08", "2026-09-07", "2026-01-03", "2026-12-31"]) {
    const app = open(day);
    ok(`${day}: it is what the app was told`, app.todayIso() === day, app.todayIso());
    ok(`${day}: week ${isoWeek(day)}`, weekOf(app) === "vko " + isoWeek(day), weekOf(app));
    const want = mondayDates(day);
    const got = dayNumbers(app);
    ok(`${day}: Monday to Sunday are ${want.join(",")}`,
       got.join(",") === want.join(","), got.join(","));
  }
}

console.log("");
console.log("--- the default is a fixed day, so every other check is repeatable ---");
{
  // The constant in the source is what the traces and the oracles were
  // recorded against. A clock in here would make them fail on their own once
  // a day.
  const app = open(null);
  ok("today is the fixture's day", app.todayIso() === "2026-09-03", app.todayIso());
  ok("and its week is 36", weekOf(app) === "vko 36", weekOf(app));
  ok("31.8. is that Monday", dayNumbers(app).join(",") === "31,1,2,3,4,5,6",
     dayNumbers(app).join(","));
}

console.log("");
console.log("--- a date the app cannot read is refused, not believed ---");
{
  // Silently becoming 1970 would leave a screen that looks plausible, which
  // is the worst way for this to fail.
  const app = open(null);
  for (const bad of ["", "now", "2026-9-8", "08.09.2026", "2026-09-088", "20260908"]) {
    ok(`refused: ${JSON.stringify(bad)}`, app.setToday(bad) === false);
  }
  ok("and today is untouched", app.todayIso() === "2026-09-03", app.todayIso());
  ok("a real one is taken", app.setToday("2026-09-08"));
  ok("setting the same day again changes nothing", app.setToday("2026-09-08") === false);
}

console.log("");
console.log("--- the clock moves the week only when the week was today's ---");
{
  // A week the person walked to with the arrows is theirs. Moving it under
  // them because midnight passed would be a screen that changed by itself.
  const app = open("2026-09-08");
  ok("it opens on this week", weekOf(app) === "vko 37", weekOf(app));
  app.press("rt-week-prev");
  app.display();
  const walked = weekOf(app);
  ok("the arrow walks back a week", walked === "vko 36", walked);
  ok("the clock ticks over", app.setToday("2026-09-09"));
  app.display();
  ok("and the week the person chose is left alone", weekOf(app) === walked, weekOf(app));
}

console.log("");
console.log("--- an entry anchored to today moves with it ---");
{
  // Most of the fixture is dated outright, which is what makes it a fixture.
  // A few entries carry a `dateOffset` instead — so many days from today —
  // and those are the ones a host that sets the clock has to RE-ANCHOR, or
  // the diary is dated from the constant in the source.
  const dayOf = (today) => {
    const app = new RealTrainerDemo();
    app.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
    app.loadPlanMachine(rd("fixtures", "machines", "planDialog.machine.json"));
    app.loadChatMachine(rd("fixtures", "machines", "chat.machine.json"));
    if (today) app.setToday(today);
    app.loadReference(rd("fixtures", "reference", "seed.json"));
    app.setPageSize(390, 844);
    app.openRoute("/calendar/app-minimonster-training");
    app.press("rt-nav-home");
    let spun = 0;
    while (app.building() && spun < 400) { app.tick(16.7); spun += 1; }
    app.display();
    return texts(app).filter((t) => /^\d\d\.\d\d\.\d{4}$/.test(t))[0] || "";
  };
  const asIs = dayOf(null);
  const later = dayOf("2026-10-03");
  ok("the anchored entry is dated", /^\d\d\.\d\d\.\d{4}$/.test(asIs), asIs);
  const days = (a, b) => {
    const p = (s) => new Date(`${s.slice(6)}-${s.slice(3, 5)}-${s.slice(0, 2)}T00:00:00Z`);
    return Math.round((p(b) - p(a)) / 86400000);
  };
  // The default day and the one set are thirty days apart, so the entry is.
  ok("and it moved with the clock, exactly", days(asIs, later) === 30,
     `${asIs} -> ${later} is ${days(asIs, later)} days`);
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  the host says what day it is, and the arithmetic agrees with the calendar");
