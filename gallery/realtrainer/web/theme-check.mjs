#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Asetukset, and the three palettes.
//
//   node gallery/realtrainer/web/theme-check.mjs
//
// A theme here is not a second stylesheet and not a second set of rules: it
// is a second set of VALUES for the same custom properties. `realtrainer.css`
// declares the palette once under `@vars` and writes every surface, line and
// ink in terms of it; `@vars ocean` and `@vars sunrise` say what those names
// are worth instead. Choosing one changes a single string on the app.
//
// So what this checks is that the SAME SCREEN comes out — the same commands,
// in the same places, at the same sizes — in different colours. A theme that
// moved a box would be a theme that had rules in it.
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

const open = () => {
  const app = new RealTrainerDemo();
  app.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
  app.loadPlanMachine(rd("fixtures", "machines", "planDialog.machine.json"));
  app.loadChatMachine(rd("fixtures", "machines", "chat.machine.json"));
  app.loadReference(rd("fixtures", "reference", "seed.json"));
  app.setPageSize(390, 844);
  app.openRoute("/calendar/cal-train");
  app.press("rt-nav-home");
  let spun = 0;
  while (app.building() && spun < 300) { app.tick(16.7); spun += 1; }
  app.display();
  return app;
};

const cmds = (app) => JSON.parse(app.displayListJson()).cmds;
const texts = (app) => cmds(app).filter((c) => c.k === 3).map((c) => c.text || "");
const shows = (app, s) => texts(app).some((t) => t.includes(s));
// Every command's shape, with the colour left out: the geometry of the frame.
const shape = (app) =>
  cmds(app).map((c) => `${c.k}@${Math.round(c.x)},${Math.round(c.y)} ${Math.round(c.w || 0)}x${Math.round(c.h || 0)} ${c.text || ""}`).join("\n");
// The page's own fill, which is `--bg`.
const paper = (app) => JSON.stringify(cmds(app).find((c) => c.k === 0)?.c);
// The first round accent chip in the header — `--accent`.
const inks = (app) => cmds(app).filter((c) => c.k === 0).map((c) => JSON.stringify(c.c)).join("|");

console.log("--- Asetukset is a page ---");
{
  const app = open();
  ok("the rail's gear goes there", app.press("rt-nav-settings"));
  ok("with its heading", shows(app, "Asetukset"));
  ok("and the one setting there is", shows(app, "Teema"));
  ok("the three palettes are named",
     shows(app, "Yö") && shows(app, "Ocean") && shows(app, "Sunrise"));
  ok("and one of them is on", texts(app).filter((t) => t === "Käytössä").length === 1,
     texts(app).filter((t) => t === "Käytössä").join("|"));
  ok("the dark one, to start with", app.themeChosen() === "", app.themeChosen());
}

console.log("");
console.log("--- and it is reachable on a phone, where there is no rail ---");
{
  // The bottom bar has no gear on it; "Lisää" is the way, and the sheet's
  // "Teema" row used to close on the way to a page that did not exist.
  for (const via of ["rt-more-settings", "rt-more-theme"]) {
    const app = open();
    app.press("rt-nav-more");
    ok(`${via}: the sheet opens`, shows(app, "Vuosilakana"));
    ok(`${via}: it goes to the page`, app.press(via) && shows(app, "Teema"));
    ok(`${via}: and the sheet closed behind it`, shows(app, "Vuosilakana") === false);
  }
}

console.log("");
console.log("--- choosing one repaints, and only repaints ---");
{
  const app = open();
  const night = { paper: paper(app), shape: shape(app), inks: inks(app) };

  ok("the page starts dark", night.paper === "[18,18,18,1]", night.paper);

  app.press("rt-nav-settings");
  ok("ocean is taken", app.press("rt-theme-ocean"));
  ok("and it is what is chosen", app.themeChosen() === "ocean");
  app.press("rt-nav-home");
  let spun = 0;
  while (app.building() && spun < 300) { app.tick(16.7); spun += 1; }
  app.display();
  const ocean = { paper: paper(app), shape: shape(app), inks: inks(app) };

  ok("the paper is another colour", ocean.paper !== night.paper, ocean.paper);
  ok("and so is a good deal else", ocean.inks !== night.inks);
  // THE POINT. A theme is a palette: it may not move anything.
  ok("but the frame is the same frame", ocean.shape === night.shape,
     firstDiff(night.shape, ocean.shape));

  app.press("rt-nav-settings");
  app.press("rt-theme-sunrise");
  app.press("rt-nav-home");
  spun = 0;
  while (app.building() && spun < 300) { app.tick(16.7); spun += 1; }
  app.display();
  const sunrise = { paper: paper(app), shape: shape(app), inks: inks(app) };
  ok("sunrise is a third colour",
     sunrise.paper !== night.paper && sunrise.paper !== ocean.paper, sunrise.paper);
  ok("and still the same frame", sunrise.shape === night.shape,
     firstDiff(night.shape, sunrise.shape));

  // Back where it started, exactly.
  app.press("rt-nav-settings");
  app.press("rt-theme-night");
  app.press("rt-nav-home");
  spun = 0;
  while (app.building() && spun < 300) { app.tick(16.7); spun += 1; }
  app.display();
  ok("and going back is the palette it began with", inks(app) === night.inks);
}

console.log("");
console.log("--- a palette is one value, not a machine ---");
{
  const app = open();
  app.press("rt-nav-settings");
  ok("choosing changes something", app.press("rt-theme-ocean"));
  ok("choosing it again does not", app.press("rt-theme-ocean") === false);
  ok("the card says which one", shows(app, "Käytössä"));
  ok("and only one card says it", texts(app).filter((t) => t === "Käytössä").length === 1);
}

console.log("");
console.log("--- the session screen keeps its own rules under any palette ---");
{
  // `applyTree` takes a LIST of themes: the session scene scopes two rules to
  // itself and the palette scopes the colours, and with one slot the two
  // would fight over it. See EVGStyleSheet.
  const app = open();
  app.press("rt-nav-settings");
  app.press("rt-theme-ocean");
  ok("off the session screen it is just the palette",
     app.themeName() === "ocean", app.themeName());

  // The session scene is reached from the dashboard's rail, which is a
  // different screen from the phone shell the rest of this walks.
  const dash = new RealTrainerDemo();
  dash.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
  dash.setPageSize(390, 844);
  let n = 0;
  while (dash.sceneName() !== "signin" && n < 600) { dash.tick(16.7); n += 1; }
  dash.press("rt-google");
  ok("the session screen opens",
     dash.press("rt-rail-train") && dash.sceneName() === "session", dash.sceneName());
  // With no palette chosen the list is the scene alone.
  ok("with no palette it is the scene alone",
     dash.themeName() === "session", dash.themeName());
  dash.setPalette("sunrise");
  ok("and with one, both names are on",
     dash.themeName() === "session sunrise", dash.themeName());
}

function firstDiff(a, b) {
  const x = a.split("\n");
  const y = b.split("\n");
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if (x[i] !== y[i]) return `line ${i}: ${x[i]} vs ${y[i]}`;
  }
  return "same";
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  three palettes, one frame");
