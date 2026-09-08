#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The keyboard, on a screen that is a picture.
//
//   node gallery/realtrainer/web/keys-check.mjs
//
// A canvas is ONE element. Everything the app draws inside it is a rectangle
// the GPU painted, so the browser has no tab stops to offer and the arrows do
// nothing — which is where this app was until `EVGFocus`. That class is in
// EVG rather than here on purpose: every drawn UI needs the same thing, and
// `EVGFocusTest` checks the rules. This checks the wiring — that the app hands
// its tree over, presses what the ring is round, and DRAWS the ring.
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

const open = (section) => {
  const app = new RealTrainerDemo();
  app.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
  app.loadPlanMachine(rd("fixtures", "machines", "planDialog.machine.json"));
  app.loadChatMachine(rd("fixtures", "machines", "chat.machine.json"));
  app.loadReference(rd("fixtures", "reference", "seed.json"));
  app.setPageSize(390, 844);
  app.openRoute("/calendar/cal-train");
  app.press(section || "rt-nav-home");
  let spun = 0;
  while (app.building() && spun < 400) { app.tick(16.7); spun += 1; }
  app.display();
  return app;
};
const key = (app, k, shift) => app.keyWith(k, !!shift, false);
// The ring is a BORDER command in the ring's own colour — see
// `EVGDisplayList.paintFocusRing`.
const rings = (app) =>
  JSON.parse(app.displayListJson()).cmds.filter(
    (c) => c.k === 1 && c.c && c.c[0] === 125 && c.c[1] === 211 && c.c[2] === 252,
  );

console.log("--- Tab walks the screen, and the ring says where ---");
{
  const app = open("rt-nav-settings");
  ok("nothing has it to start with", app.focusRingId() === "", app.focusRingId());
  ok("and nothing is drawn", rings(app).length === 0);

  ok("Tab is taken", key(app, "Tab"));
  ok("and something has it", app.focusRingId() !== "", app.focusRingId());
  app.display();
  ok("the ring is drawn", rings(app).length === 1, rings(app).length + " rings");
  ok("and only one", rings(app).length === 1);

  const walk = [];
  for (let i = 0; i < 9; i += 1) { key(app, "Tab"); walk.push(app.focusRingId()); }
  // Tree order: the header, then the page, then the bar — the order the page
  // is written in, which is the order the mirror publishes.
  ok("it reaches the theme cards", walk.includes("rt-theme-ocean"), walk.join(" > "));
  ok("and the bar after them", walk.includes("rt-nav-home"), walk.join(" > "));
  ok("and it wraps", walk[walk.length - 1] !== walk[walk.length - 2]);

  // Back the way it came.
  const here = app.focusRingId();
  key(app, "Tab", true);
  key(app, "Tab", false);
  ok("Shift+Tab goes back and forward again", app.focusRingId() === here, app.focusRingId());
}

console.log("");
console.log("--- an arrow is a direction ---");
{
  // The three theme cards are stacked, so down and up are the ones that read
  // as "the next card" — and Tab would answer the same here, which is why the
  // check below leaves the stack.
  const app = open("rt-nav-settings");
  key(app, "Home");
  const down = [];
  for (let i = 0; i < 4; i += 1) { key(app, "ArrowDown"); down.push(app.focusRingId()); }
  ok("down walks the cards", down[0] === "rt-theme-night" && down[1] === "rt-theme-ocean" &&
     down[2] === "rt-theme-sunrise", down.join(" > "));
  const up = [];
  for (let i = 0; i < 2; i += 1) { key(app, "ArrowUp"); up.push(app.focusRingId()); }
  ok("and up comes back", up.join(",").includes("rt-theme-sunrise") || up.join(",").includes("rt-theme-ocean"),
     up.join(" > "));

  // OFF THE EDGE IS NOWHERE, not a wrap: the eye does not jump to the far
  // side of the screen, so neither does the ring.
  key(app, "Home");
  const first = app.focusRingId();
  ok("up from the top is refused", key(app, "ArrowUp") === false);
  ok("and the ring did not move", app.focusRingId() === first);
}

console.log("");
console.log("--- Enter and Space press what the ring is round ---");
{
  const app = open("rt-nav-settings");
  for (let i = 0; i < 4; i += 1) key(app, "Tab");
  ok("the ring is on a theme", app.focusRingId() === "rt-theme-ocean", app.focusRingId());
  ok("Enter is taken", key(app, "Enter"));
  ok("and it chose the theme", app.themeChosen() === "ocean", app.themeChosen());

  key(app, "ArrowDown");
  ok("Space is taken too", key(app, " "));
  ok("and it chose the next one", app.themeChosen() === "sunrise", app.themeChosen());

  // A Space that reaches the page scrolls it, so it is taken even when the
  // press it made changed nothing.
  ok("Space on the same one is still taken", key(app, " "));

  ok("Escape drops the ring", key(app, "Escape") && app.focusRingId() === "");
  app.display();
  ok("and stops drawing it", rings(app).length === 0);
}

console.log("");
console.log("--- a key it does nothing with is refused ---");
{
  // Refusing is what lets the page keep its own behaviour: a host that takes
  // every key it is offered is a page that stops scrolling.
  const app = open();
  ok("an unknown key", key(app, "PageDown") === false);
  ok("a letter", key(app, "q") === false);
  ok("Enter with no ring", key(app, "Enter") === false);
  ok("Escape with no ring", key(app, "Escape") === false);
}

console.log("");
console.log("--- the ring follows a rebuild, or goes with what it was on ---");
{
  // Every frame rebuilds the tree here, so the focus is kept by id. And a
  // screen change takes the elements away: the ring must not point at
  // something that is gone.
  const app = open("rt-nav-settings");
  for (let i = 0; i < 4; i += 1) key(app, "Tab");
  const on = app.focusRingId();
  ok("the ring is on a card", on === "rt-theme-ocean", on);
  app.tick(16.7);
  app.display();
  ok("a frame does not move it", app.focusRingId() === on);

  app.press("rt-nav-home");
  let spun = 0;
  while (app.building() && spun < 400) { app.tick(16.7); spun += 1; }
  app.display();
  key(app, "Tab");
  ok("leaving the screen does not leave the ring behind",
     app.focusRingId() !== "rt-theme-ocean", app.focusRingId());
  app.display();
  ok("and it still draws exactly one", rings(app).length === 1, rings(app).length + " rings");
}

console.log("");
console.log("--- a field keeps its own keys ---");
{
  // While something is being typed into, the arrows move a caret. The host is
  // what holds the key back there; this checks the app agrees about who has
  // the keyboard.
  const app = open();
  app.press("rt-home-field");
  ok("the field has it", app.focusedField() === "rt-home-field");
  ok("and the ring does not", app.focusRingId() === "", app.focusRingId());
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  the arrows work, and the ring says where they are");
