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
  // The press above is how this gets to a screen, not something a person did:
  // a real one would leave the ring on the button it pressed — see the last
  // section — and every check below starts from a screen nobody has touched.
  app.focusOn("");
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

  // Tree order: the header, then the page, then the bar — the order the page
  // is written in, which is the order the mirror publishes. The settings page
  // is the reference's now, and that is fifty-odd stops before the palettes.
  const walk = [];
  for (let i = 0; i < 80; i += 1) { key(app, "Tab"); walk.push(app.focusRingId()); }
  ok("it reaches the theme cards", walk.includes("rt-theme-ocean"), walk.slice(0, 12).join(" > "));
  ok("and the bar after them", walk.includes("rt-nav-home"),
     walk.slice(walk.indexOf("rt-theme-ocean")).slice(0, 12).join(" > "));
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
  // Onto the first palette by Tab, then down the stack of them by arrow.
  let spun = 0;
  while (spun < 90 && app.focusRingId() !== "rt-theme-night") { key(app, "Tab"); spun += 1; }
  ok("Tab reaches the first palette", app.focusRingId() === "rt-theme-night", app.focusRingId());
  const down = [];
  for (let i = 0; i < 4; i += 1) { key(app, "ArrowDown"); down.push(app.focusRingId()); }
  ok("down walks the cards", down[0] === "rt-theme-ocean" && down[1] === "rt-theme-forest" &&
     down[2] === "rt-theme-violet" && down[3] === "rt-theme-sunrise", down.join(" > "));
  const up = [];
  for (let i = 0; i < 2; i += 1) { key(app, "ArrowUp"); up.push(app.focusRingId()); }
  ok("and up comes back", up[0] === "rt-theme-violet" && up[1] === "rt-theme-forest",
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
  let spun2 = 0;
  while (spun2 < 90 && app.focusRingId() !== "rt-theme-ocean") { key(app, "Tab"); spun2 += 1; }
  ok("the ring is on a theme", app.focusRingId() === "rt-theme-ocean", app.focusRingId());
  ok("Enter is taken", key(app, "Enter"));
  ok("and it chose the theme", app.themeChosen() === "ocean", app.themeChosen());

  key(app, "ArrowDown");
  const next = app.focusRingId();
  ok("the arrow moved to the next card", next === "rt-theme-forest", next);
  ok("Space is taken too", key(app, " "));
  ok("and it chose the next one", app.themeChosen() === "forest", app.themeChosen());

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
  let spun3 = 0;
  while (spun3 < 90 && app.focusRingId() !== "rt-theme-ocean") { key(app, "Tab"); spun3 += 1; }
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
console.log("--- a dialog shuts the keys inside it ---");
{
  // Tab past the last control of a dialog used to land on the page behind it:
  // the ring on things the person cannot see the point of and cannot get back
  // from except by walking all the way round. Nothing here says "trap now" —
  // the overlay declares `a11yModal`, which is the same declaration the
  // accessibility mirror reads, and `EVGFocus` reads it too.
  const app = open("rt-nav-home");
  ok("nothing is trapped to start with", app.focusTrapId() === "", app.focusTrapId());
  const loose = [];
  for (let i = 0; i < 5; i += 1) { key(app, "Tab"); loose.push(app.focusRingId()); }
  ok("and Tab walks the page", loose.includes("rt-add"), loose.join(" > "));

  ok("the sheet opens", app.press("rt-add"));
  ok("and it is what the keys are in", app.focusTrapId() === "rt-overlay-add",
     app.focusTrapId());
  const inside = [];
  for (let i = 0; i < 7; i += 1) { key(app, "Tab"); inside.push(app.focusRingId()); }
  // Every stop is one of the sheet's own, and it comes round rather than
  // leaving.
  ok("every stop is the sheet's",
     inside.every((id) => id.startsWith("rt-sheet-") || id === "rt-add-field"),
     inside.join(" > "));
  ok("and it wraps rather than leaving", inside[0] === inside[3], inside.join(" > "));
  ok("nothing on the page behind is reachable",
     inside.includes("rt-add") === false && inside.includes("rt-credits") === false,
     inside.join(" > "));
  // An arrow cannot leave either — the page's buttons are above the sheet.
  const before = app.focusRingId();
  key(app, "ArrowUp");
  ok("nor by arrow", app.focusRingId().startsWith("rt-sheet-") ||
     app.focusRingId() === "rt-add-field" || app.focusRingId() === before,
     app.focusRingId());
}

console.log("");
console.log("--- and Escape is the way out ---");
{
  // A trap with no door is worse than no trap. Each sheet has its own close
  // and Escape presses the topmost one's.
  const app = open("rt-nav-home");
  app.press("rt-add");
  ok("the sheet is up", app.focusTrapId() === "rt-overlay-add");
  ok("Escape is taken", key(app, "Escape"));
  ok("and the sheet is gone", app.focusTrapId() === "", app.focusTrapId());
  ok("the page is walkable again", key(app, "Tab") && app.focusRingId() !== "");

  // The bar's sheet too, which is a different dialog with a different close.
  app.press("rt-nav-more");
  ok("the More sheet traps", app.focusTrapId() === "rt-overlay-more", app.focusTrapId());
  ok("Escape closes it too", key(app, "Escape"));
  ok("and lets go", app.focusTrapId() === "", app.focusTrapId());

  // With nothing open Escape is what it always was: never mind, drop the ring.
  key(app, "Tab");
  ok("with no dialog it drops the ring", key(app, "Escape") && app.focusRingId() === "");
  ok("and then it is not taken at all", key(app, "Escape") === false);
}

console.log("");
console.log("--- the review over the sheet is the one that traps ---");
{
  // Overlays are appended, so the later one is on top — and the keys follow
  // the top one, not the first.
  const app = open("rt-nav-home");
  app.press("rt-home-field");
  app.applyEdit("rt-home-field", "Juoksu 10km", 11, 11);
  app.press("rt-home-send");
  let spent = 0;
  while (spent < 1200) { app.tick(16.7); spent += 16.7; }
  app.display();
  ok("the review came back", app.focusTrapId() === "rt-overlay-review", app.focusTrapId());
  const inside = [];
  for (let i = 0; i < 5; i += 1) { key(app, "Tab"); inside.push(app.focusRingId()); }
  ok("and the keys are in it",
     inside.every((id) => id.startsWith("rt-review-")), inside.join(" > "));
  ok("Escape closes the review", key(app, "Escape") && app.focusTrapId() === "",
     app.focusTrapId());
}

console.log("");
console.log("--- a field keeps its own keys, except Tab ---");
{
  // While something is being typed into, the arrows move a caret: that is the
  // platform's job and the host holds those keys back. Tab is not one of them.
  // A canvas is ONE element, so there is no browser tab order underneath to
  // take over when a field declines the key — a Tab the app does not answer
  // goes nowhere, which is how the composer became a place you could type in
  // and never reach the send button beside it from.
  const app = open();
  app.press("rt-home-field");
  ok("the field has the keyboard", app.focusedField() === "rt-home-field");
  ok("and the ring is on it too", app.focusRingId() === "rt-home-field", app.focusRingId());

  app.applyEdit("rt-home-field", "Juoksu 10km", 11, 11);
  ok("Tab is taken", key(app, "Tab"));
  ok("and it reaches the send button", app.focusRingId() === "rt-home-send", app.focusRingId());
  ok("the field let go of the keyboard", app.focusedField() === "", app.focusedField());
  app.display();
  ok("and the ring is drawn round the button", rings(app).length === 1, rings(app).length + " rings");
  ok("Enter presses it", key(app, "Enter"));
}

console.log("");
console.log("--- the same in the AI chat, which is where it was noticed ---");
{
  const app = open("rt-nav-chat");
  ok("the chat has a field", app.press("rt-chat-field") && app.focusedField() === "rt-chat-field");
  app.applyEdit("rt-chat-field", "Miten meni?", 11, 11);
  ok("Tab is taken", key(app, "Tab"));
  ok("and lands on send", app.focusRingId() === "rt-chat-send", app.focusRingId());
  ok("Shift+Tab goes back to the field", key(app, "Tab", true) &&
     app.focusRingId() === "rt-chat-field", app.focusRingId());
}

console.log("");
console.log("--- Tab onto a field hands it the keyboard ---");
{
  // Reaching a field and not being able to type in it is a field that is not
  // reachable. The browser's own tab order used to do this part — the field
  // IS an <input> in the accessibility mirror, so landing on it started the
  // session — and once the app took Tab over, the app had to do it too.
  const app = open("rt-nav-chat");
  let spun = 0;
  while (spun < 40 && app.focusRingId() !== "rt-chat-field") { key(app, "Tab"); spun += 1; }
  ok("Tab reaches the chat field", app.focusRingId() === "rt-chat-field", app.focusRingId());
  ok("and the field has the keyboard", app.focusedField() === "rt-chat-field",
     app.focusedField());
  ok("so a letter goes into it", app.typeChar("j"));
  const val = () => JSON.parse(app.fieldStateJson("rt-chat-field")).value;
  ok("and it is in the field", val() === "j", val());
  ok("Tab leaves again", key(app, "Tab") && app.focusedField() === "", app.focusedField());
  ok("landing on send", app.focusRingId() === "rt-chat-send", app.focusRingId());
}

console.log("");
console.log("--- Escape is the way out of a field as well ---");
{
  // A field answered no key the app knew, Escape included, so a dialog you
  // were typing in could only be closed by finding its × with the mouse —
  // while the same Escape one Tab later closed it at once. A native dialog
  // closes on Escape from inside its own input; so does this one.
  const app = open("rt-nav-home");
  app.press("rt-add");
  ok("the sheet is up with a field in it", app.focusTrapId() === "rt-overlay-add",
     app.focusTrapId());
  app.press("rt-add-field");
  ok("and the keyboard is in the field", app.focusedField() === "rt-add-field");
  app.applyEdit("rt-add-field", "Penkki 3x5", 10, 10);
  ok("Escape is taken", key(app, "Escape"));
  ok("and the sheet is gone", app.focusTrapId() === "", app.focusTrapId());
  ok("with the keyboard let go of", app.focusedField() === "", app.focusedField());
  ok("and the page walkable again", key(app, "Tab") && app.focusRingId() !== "");

  // With no dialog up it is the field it lets go of, not a screen: the ring
  // stays on the field so the arrows carry on from there.
  const chat = open("rt-nav-chat");
  chat.press("rt-chat-field");
  chat.applyEdit("rt-chat-field", "Miten meni?", 11, 11);
  ok("Escape in a plain field is taken", key(chat, "Escape"));
  ok("the field let go", chat.focusedField() === "", chat.focusedField());
  ok("and the ring stayed on it", chat.focusRingId() === "rt-chat-field", chat.focusRingId());
  chat.display();
  ok("and is drawn now, because a key put it there", rings(chat).length === 1,
     rings(chat).length + " rings");
  ok("so Tab carries on from the field", key(chat, "Tab") &&
     chat.focusRingId() === "rt-chat-send", chat.focusRingId());
}

console.log("");
console.log("--- the ring is round its element, whatever the page is doing ---");
{
  // THE RING IS DRAWN LAST AND OUTSIDE EVERY CLIP, so that a button in a
  // panel is not half-ringed by the panel's edge — which also puts it outside
  // every scrolled layer's range. A frame that only scrolls moves those
  // ranges and nothing else, so the page slid out from under a ring that
  // stayed where it was until `EVGDisplayList.refreshRing`.
  //
  // What is checked here is not that the ring MOVED BY the scroll — a ring
  // that lags by a frame and a ring that leads by one both move by the right
  // amount eventually. It is the invariant: the ring is exactly round its
  // element's box, on every frame, whatever moved it. A drawn ring that is
  // out of step with the page under it is the one thing a screenshot shows
  // and a delta test does not.
  const PAD = 2;
  const boxOf = (app, id) =>
    (JSON.parse(app.a11yJson(1, "")).nodes.find((n) => n.id === id) || {}).b;
  const around = (app, why) => {
    const id = app.focusRingId();
    const r = rings(app)[0];
    const b = boxOf(app, id);
    if (!r || !b) {
      ok(why, false, `ring=${!!r} box=${!!b} on ${id}`);
      return;
    }
    const off = [r.x - (b[0] - PAD), r.y - (b[1] - PAD), r.w - (b[2] + PAD * 2), r.h - (b[3] + PAD * 2)];
    ok(why, off.every((d) => Math.abs(d) < 1),
       `${id}: ring ${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.w.toFixed(1)}x${r.h.toFixed(1)} vs box ${b[0].toFixed(1)},${b[1].toFixed(1)} ${b[2].toFixed(1)}x${b[3].toFixed(1)}`);
  };

  const app = open("rt-nav-home");
  let spun = 0;
  while (spun < 30 && !app.focusRingId().startsWith("rt-entry")) { key(app, "Tab"); spun += 1; }
  ok("the ring is on something in the feed", app.focusRingId().startsWith("rt-entry"),
     app.focusRingId());
  app.display();
  around(app, "at rest");

  // AND IT SAYS WHICH LAYER IT IS IN, which is the half of this the list
  // cannot show. A host does not re-read the list for a frame that only
  // scrolled: it moves the kept frame by a per-layer offset — `uShift` in the
  // WebGL painter, the same arithmetic in the worker page. The ring is drawn
  // last and outside every clip, so it belonged to no layer and got no offset:
  // the page moved under a ring that stayed. Everything above passes with that
  // bug in place, because the LIST was right all along.
  const ringCmd = (a) => JSON.parse(a.displayListJson()).cmds.find(
    (c) => c.k === 1 && c.c && c.c[0] === 125 && c.c[1] === 211 && c.c[2] === 252);
  const layers = (a) => JSON.parse(a.displayListJson()).cmds.filter((c) => c.k === 4 && c.layer > 0);
  ok("the ring is in the feed's own scroll layer",
     (ringCmd(app) || {}).layer > 0 &&
     layers(app).some((c) => c.layer === ringCmd(app).layer),
     `layer ${(ringCmd(app) || {}).layer} of ${layers(app).map((c) => c.layer).join(",")}`);
  // …and a control that scrolls with nothing is in no layer, or it would be
  // moved by a scroll it does not take part in.
  app.focusOn("rt-credits");
  app.display();
  ok("and a header button's ring is in none",
     ((ringCmd(app) || {}).layer || 0) === 0, `layer ${(ringCmd(app) || {}).layer}`);
  app.focusOn("");
  spun = 0;
  while (spun < 30 && !app.focusRingId().startsWith("rt-entry")) { key(app, "Tab"); spun += 1; }
  app.display();

  // A wheel, down and up, including past what was built for.
  for (const d of [40, 120, 300, 900, -260, -1100]) {
    app.scrollDocument(d);
    app.display();
    around(app, `after a wheel of ${d}`);
  }

  // A THROW, moved by the clock and not by a call: the kept list is shifted
  // frame by frame here and the ring has to be shifted with it every time.
  app.scrollDocument(600);
  for (let i = 0; i < 12; i += 1) {
    app.tick(16.7);
    app.display();
    around(app, `frame ${i + 1} of a throw`);
  }

  // A REBUILD UNDER THE RING. The tree is built again and the boxes move;
  // the ring is emitted afresh and must land on the new box, not the old one.
  app.scrollDocument(-99999);
  app.display();
  app.setHover("rt-entry-notes-0");
  app.display();
  around(app, "after a hover restyled the page");
  // Enter, not a click: a POINTER press puts the ring away on purpose — see
  // `EVGFocus.pointAt` — and a key press does not, so this is the one that
  // leaves a ring to check across a rebuild.
  ok("Enter opens the card's menu", key(app, "Enter") && app.focusRingId() === "rt-entry-add-0",
     app.focusRingId());
  app.display();
  around(app, "after a key press rebuilt the card under it");
  ok("Escape closes it", key(app, "Escape"));
  app.display();
  around(app, "and after it closed again");

  // …and the page turned, which lays everything out afresh at a new width.
  app.setPageSize(844, 390);
  app.display();
  around(app, "at another page size");
  app.scrollDocument(200);
  app.display();
  around(app, "and scrolled there");
  app.setPageSize(390, 844);
  app.display();
  around(app, "and back");

  // THE COMPOSER GROWS WHEN IT TAKES THE KEYBOARD, which moves everything
  // under it — the ring included, since Tab onto a field is the field's now.
  const c = open("rt-nav-home");
  let m = 0;
  while (m < 40 && c.focusRingId() !== "rt-home-field") { key(c, "Tab"); m += 1; }
  c.display();
  around(c, "on the composer's field");
  c.typeChar("t");
  c.display();
  around(c, "with a letter in it");
  for (let i = 0; i < 20; i += 1) { c.tick(16.7); c.display(); }
  around(c, "and after the frames that opened it");
  c.scrollDocument(80);
  c.display();
  around(c, "then a wheel under it");
}

console.log("");
console.log("--- the pointer and the keyboard share one focus ---");
{
  // They used to keep two: a click moved the caret or pressed a button and
  // left the ring wherever the last key had put it, so Tab after a click
  // carried on from somewhere else on the screen.
  const app = open("rt-nav-home");
  ok("a click puts the ring on what it pressed", app.press("rt-add") &&
     app.focusRingId() === "rt-add", app.focusRingId());
  ok("Escape closes the sheet the click opened", key(app, "Escape"));

  key(app, "Home");
  const first = app.focusRingId();
  app.press("rt-nav-calendar");
  ok("and a click elsewhere moves it there", app.focusRingId() === "rt-nav-calendar",
     app.focusRingId());
  ok("which is not where the keys had left it", first !== "rt-nav-calendar", first);

  // An id nothing focusable carries leaves the ring where it was: a ring
  // round nothing is worse than a ring that did not move.
  const here = app.focusRingId();
  // …and a press with a KEY keeps it, which is the other half of the rule.
  // …on a control that is still there afterwards: Enter on the credit gauge
  // opens a page and takes the ring's element with it, which is the settle
  // rule and not this one.
  const k = open("rt-nav-home");
  let t = 0;
  while (t < 30 && k.focusRingId() !== "rt-home-tab-drills") { key(k, "Tab"); t += 1; }
  const on = k.focusRingId();
  k.display();
  ok("a key press leaves the ring where it was", key(k, "Enter") &&
     k.focusRingId() === on && rings(k).length === 1,
     `${on} -> ${k.focusRingId()}, ${rings(k).length} rings`);
  ok("a press on nothing is refused", app.focusOn("rt-not-a-thing") === false);
  ok("and the ring stays", app.focusRingId() === here, app.focusRingId());
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  the arrows work, and the ring says where they are");
// The marker `scripts/run-gallery-editor-tests.sh` greps for: the compiler
// prints `[FAIL]` and still exits 0, so that runner refuses to take a zero
// exit as a pass — a suite has to SAY it passed.
console.log("ALL PASS");
