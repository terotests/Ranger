#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The page, in a real browser, on a real GPU.
//
//   node gallery/realtrainer/web/frame-check.mjs [--png out.png]
//
// `loader-check.mjs` proves what the app SAYS to draw. It cannot prove that
// anything was drawn: the rotation lives in a vertex shader and the gradient
// in a fragment shader, and the only honest way to check GLSL is to run it and
// read the pixels back.
//
// So this loads the page Chromium loads, fails on any uncaught exception or
// console error, and then probes the framebuffer:
//
//   the card is painted, and it is a GRADIENT — its top is lighter than its
//   bottom, which a flat fill cannot be
//   the ring MOVES — the same pixel, two frames apart, is a different colour
//   the bar GROWS — a point along the track is background early and blue later
//
// Exit code 0 when every probe reads what it should.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const args = process.argv.slice(2);
const pngAt = args.indexOf("--png");
const pngOut = pngAt >= 0 ? args[pngAt + 1] : "";

if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `npm run rt:page` first");
  process.exit(3);
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".cjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" })
    .end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({
  executablePath: findChromium(),
  // A headless Chromium has no GPU here, and SwiftShader is what makes WebGL 2
  // answer at all. It runs the same shaders.
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });

const problems = [];
page.on("pageerror", (e) => problems.push("uncaught: " + e.message.split("\n")[0]));
page.on("console", (m) => {
  if (m.type() === "error") problems.push("console.error: " + m.text().split("\n")[0]);
});
page.on("requestfailed", (r) => problems.push("request failed: " + r.url().replace(/^http:\/\/[^/]+/, "")));

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

console.log("--- the page loads ---");
// The desktop demo at its own size: without `page` the page is the window,
// and this check measures the loader's card at 470px.
// `--engine=worker` drives the page with the Ranger app in a Worker
// (gallery/evg/gl/evg-engine.js) — same page, same painter, same checks —
// which is how that host is held to this one.
const engineAt = args.indexOf("--engine");
const engine = engineAt >= 0 ? args[engineAt + 1] : "";
const engineParam = engine ? `&engine=${engine}` : "";
console.log(`--- the engine ${engine === "worker" ? "in a Worker" : "on the main thread"} ---`);
await page.goto(`http://127.0.0.1:${port}/gallery/realtrainer/web/index.html?page=980x760&gl=preserve${engineParam}`, { waitUntil: "networkidle" });
await page.waitForFunction("window.__lastStats !== undefined", null, { timeout: 20000 }).catch(() => {});
ok("no error on first paint", problems.length === 0, [...new Set(problems)].join("; "));
const size = await page.evaluate(() => {
  const c = document.querySelector("#stage canvas");
  return c ? [c.width, c.height] : [0, 0];
});
ok("the canvas was sized by the app", size[0] >= 980, "canvas " + size.join("x"));

// Pixels out of the framebuffer, in CSS pixels of the canvas. Many points in
// ONE round trip: a ring is only worth reading as a set of samples, and a
// probe per point would take the picture at a different moment each time.
const probeMany = (points) =>
  page.evaluate((pts) => {
    const c = document.querySelector("#stage canvas");
    const s = c.width / parseFloat(c.style.width);
    const g = c.getContext("webgl2", { preserveDrawingBuffer: true });
    return pts.map(([px, py]) => {
      const out = new Uint8Array(4);
      g.readPixels(Math.round(px * s), c.height - Math.round(py * s), 1, 1,
                   g.RGBA, g.UNSIGNED_BYTE, out);
      return [...out];
    });
  }, points);

const probe = async (x, y) => (await probeMany([[x, y]]))[0];

// Forty-eight points around the ring, at the radius the blades sit at.
//
// The count is not arbitrary: a blade is 8px wide at a radius of 41, which is
// about 11 degrees of arc, and they stand 30 degrees apart. Twenty-four
// samples are 15 degrees apart and can fall in the gaps — which they did, and
// the check failed on a ring that was drawn perfectly. At 7.5 degrees every
// blade is hit whatever the ring's angle.
const ringPoints = (cx, cy, r) => {
  const out = [];
  for (let i = 0; i < 48; i += 1) {
    const a = (i * Math.PI) / 24;
    out.push([cx + r * Math.sin(a), cy - r * Math.cos(a)]);
  }
  return out;
};

const totalDiff = (a, b) =>
  a.reduce((sum, px, i) =>
    sum + Math.abs(px[0] - b[i][0]) + Math.abs(px[1] - b[i][1]) + Math.abs(px[2] - b[i][2]), 0);

console.log("\n--- what was painted ---");
// The geometry comes from the list the page just drew, not from arithmetic
// repeated here: a probe at a hand-computed coordinate tests this file's
// ability to add up, and it drifts the moment a padding changes.
const listNow = async () => JSON.parse(await page.evaluate("window.__lastList")).cmds;
const cardOf = (cmds) => cmds.filter((c) => c.k === 0 && c.w === 470)[0];
const bladesOf = (cmds) => cmds.filter((c) => c.k === 0 && c.w === 8 && c.h === 26);
const fillOf = (cmds) => cmds.filter((c) => c.k === 0 && c.gd === 1 && c.h === 14)[0];

let cmds = await listNow();
const card = cardOf(cmds);
ok("the card is in the list", card !== undefined, "no 470px box");
const top = await probe(card.x + card.w / 2, card.y + 6);
const bottom = await probe(card.x + card.w / 2, card.y + card.h - 6);
ok("the card is painted", top[2] > 20, "rgba " + top.join(","));
// Its fill runs #16324f -> #0a1626, so the top is the lighter end. A flat
// colour reads the same at both ends, which is precisely what an element's
// gradient used to come out as.
ok("and it is a gradient, not a flat fill", top[2] - bottom[2] > 15,
   `top blue ${top[2]}, bottom blue ${bottom[2]}`);

// The ring, at the pivot every blade turns about — read off the command —
// plus the radius the blades sit at. A blade sweeps past this point and the
// next one is dimmer, so the colour there cannot hold still.
const blade = bladesOf(cmds).find((b) => b.rox !== undefined);
ok("the blades carry a pivot", blade !== undefined, "none rotated yet");
const circle = ringPoints(blade.rox, blade.roy, 41);
const before = await probeMany(circle);
// A blade is a light-blue box on a dark card, so somewhere on this circle the
// blue channel has to be far above the card's own.
const brightest = Math.max(...before.map((px) => px[2]));
ok("blades are painted on the ring", brightest > 110, "brightest blue " + brightest);
await page.waitForTimeout(180);
const after = await probeMany(circle);
// 180ms at 220 deg/s is about 40 degrees, and the blades are 30 apart with a
// different opacity each: every sample lands on a different part of the ring.
ok("the ring is turning", totalDiff(before, after) > 200,
   "total channel change " + totalDiff(before, after));

if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: pngOut });
  console.log("  wrote " + pngOut + " (the loader)");
}

console.log("\n--- the bar fills ---");
// Reloaded, because the probing above took real seconds and the loader has a
// finish: the bar is only worth watching from the beginning.
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction("window.__lastStats !== undefined", null, { timeout: 20000 });
const early = fillOf(await listNow());
ok("the bar is still short", early.w < 260, "width " + early.w);
await page.waitForTimeout(1400);
cmds = await listNow();
const late = fillOf(cmds);
ok("and it grows", late.w > early.w + 80, `${early.w} -> ${late.w}`);
// Just inside the left end of the fill, where it is the pale stop.
const inBar = await probe(late.x + 6, late.y + 7);
ok("the bar is painted blue", inBar[2] > 100 && inBar[2] > inBar[0],
   "rgba " + inBar.join(","));

console.log("\n--- and it hands over ---");
let handedOver = true;
try {
  await page.waitForFunction("window.__app.sceneName() === 'signin'", null, { timeout: 8000 });
} catch {
  handedOver = false;
}
ok("the sign-in page arrives", handedOver,
   "still on " + (await page.evaluate("window.__app.sceneName()")));

const stem = pngOut.replace(/\.png$/, "");
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-signin.png" });
  console.log("  wrote " + stem + "-signin.png (the sign-in page)");
}

console.log("\n--- a real click on the button ---");
// The rectangle comes from the accessibility tree, which carries the box each
// node was drawn at — so the click lands where the button IS rather than where
// this file thinks it was laid out.
const box = await page.evaluate(() => {
  const tree = JSON.parse(window.__app.a11yJson(1, ""));
  const n = tree.nodes.find((x) => x.id === "rt-google");
  return n ? n.b : null;
});
ok("the button reports a rectangle", box !== null, "no rt-google node");
const canvasBox = await page.locator("#stage canvas").boundingBox();
await page.mouse.move(canvasBox.x + box[0] + box[2] / 2, canvasBox.y + box[1] + box[3] / 2);
await page.waitForTimeout(250);
// The hover is a `transition` in the stylesheet, run by EVGTransition on the
// app's own clock: the button's fill has to have moved off its resting colour.
const hoverPx = await probe(box[0] + 8, box[1] + box[3] / 2);
ok("hovering lifts the button's fill", hoverPx[0] > 14, "rgba " + hoverPx.join(","));
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(200);
ok("the click opens the dashboard",
   (await page.evaluate("window.__app.sceneName()")) === "dashboard",
   await page.evaluate("window.__app.sceneName()"));
// What the host costs a press: pointer-down to the frame that showed it, as
// the host itself measured it. With the engine in a Worker this includes
// the hop each way; with it on the main thread it is the layout and the
// draw. Printed, not asserted — a number to watch, and the check is not the
// place to decide how many milliseconds a Chromium without a GPU may take.
console.log(`  (pointer-down to the frame that showed it: ${(await page.evaluate("window.__latency")).toFixed(1)} ms)`);

const dashCmds = await listNow();
// The calendar is a grid of 108px cells; the dashboard tab has none, which is
// what makes this a check that the right tab is showing.
ok("the dashboard tab is the one open",
   dashCmds.filter((c) => c.k === 0 && c.w === 108).length === 0,
   "calendar cells on the dashboard tab");
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-dashboard.png" });
  console.log("  wrote " + stem + "-dashboard.png (the dashboard)");
}


console.log("\n--- the tab that is on, and the one that was ---");
// A class that goes away does not undo what it wrote — the cascade writes what
// the CURRENT classes ask for — so a state rule may only override a property
// its base rule also sets. This is that, checked: switch tabs, move the
// pointer off both, and exactly one of the three may be blue.
await page.mouse.move(canvasBox.x + 5, canvasBox.y + 700);
await page.waitForTimeout(250);
const tabFills = await page.evaluate(() => {
  const tree = JSON.parse(window.__app.a11yJson(1, ""));
  const cmds = JSON.parse(window.__lastList).cmds;
  return tree.nodes.filter((n) => n.id.startsWith("rt-tabs-tab-")).map((n) => {
    const c = cmds.find((c) => c.k === 0 && Math.abs(c.x - n.b[0]) < 0.5 && Math.abs(c.y - n.b[1]) < 0.5);
    return [n.id, c ? c.c : null];
  });
});
const blue = tabFills.filter(([, c]) => c && c[2] > c[0] + 40);
ok("exactly one tab is blue", blue.length === 1, JSON.stringify(tabFills));
ok("and it is the one that was pressed", blue[0] && blue[0][0] === "rt-tabs-tab-dash",
   JSON.stringify(tabFills));

console.log("\n--- and the calendar's grid ---");
const calTab = await page.evaluate(() => {
  const tree = JSON.parse(window.__app.a11yJson(1, ""));
  const n = tree.nodes.find((x) => x.id === "rt-tabs-tab-cal");
  return n ? n.b : null;
});
ok("the calendar tab is reachable", calTab !== null, "no tab node");
await page.mouse.click(canvasBox.x + calTab[0] + calTab[2] / 2, canvasBox.y + calTab[1] + calTab[3] / 2);
await page.waitForTimeout(200);
const calCmds = await listNow();
const cells = calCmds.filter((c) => c.k === 0 && c.w === 108 && c.h === 64);
ok("twenty-eight day cells", cells.length === 28, cells.length + " cells");
// Seven across: the row a cell is on is its y, and there should be four of them.
ok("in four rows of seven", new Set(cells.map((c) => c.y)).size === 4,
   [...new Set(cells.map((c) => c.y))].join(","));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-calendar.png" });
  console.log("  wrote " + stem + "-calendar.png (the calendar)");
}

console.log("\n--- the training session, and the dial ---");
// Everything from here is driven by real clicks at the rectangles the a11y
// tree reports, which is the same path a person's pointer takes.
const clickId = async (id) => {
  const b = await page.evaluate((wanted) => {
    const tree = JSON.parse(window.__app.a11yJson(1, ""));
    const n = tree.nodes.find((x) => x.id === wanted);
    return n ? n.b : null;
  }, id);
  if (!b) return false;
  await page.mouse.click(canvasBox.x + b[0] + b[2] / 2, canvasBox.y + b[1] + b[3] / 2);
  await page.waitForTimeout(120);
  return true;
};

ok("the rail opens a session", await clickId("rt-rail-train"), "no rt-rail-train node");
ok("and the session is the scene",
   (await page.evaluate("window.__app.sceneName()")) === "session",
   await page.evaluate("window.__app.sceneName()"));
await clickId("rt-reps-up");
await clickId("rt-weight-up");
// The spec line is rebuilt from the ROW the steppers wrote into, and it
// arrives as parts: `3x6` and `x95kg` are two runs with two tones.
const planLine = (await listNow()).filter((c) => c.k === 3).map((c) => c.text);
ok("the steppers wrote into the row",
   planLine.includes("3x6") && planLine.includes("x95kg"), planLine.join("|"));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-session.png" });
  console.log("  wrote " + stem + "-session.png (the session)");
}

ok("the orange button starts the rest", await clickId("rt-start"), "no rt-start node");
await page.waitForTimeout(400);
const dialTicks = async () => (await listNow()).filter((c) => c.k === 0 && c.w === 6 && c.h === 18);
const litTicks = async () => (await dialTicks()).filter((c) => c.c[0] > c.c[2]).length;
ok("sixty ticks are drawn", (await dialTicks()).length === 60,
   (await dialTicks()).length + " ticks");
const litAt = await litTicks();
ok("nearly all of them are lit", litAt >= 58, litAt + " lit");
// The pivot every tick turns about — one point, or it is not a dial.
const pivots = new Set((await dialTicks()).filter((t) => t.rox !== undefined)
  .map((t) => `${t.rox},${t.roy}`));
ok("all turning about one point", pivots.size === 1, [...pivots].join(" / "));
await page.waitForTimeout(1600);
const litLater = await litTicks();
ok("and the ring empties as the clock runs", litLater < litAt, `${litAt} -> ${litLater}`);
// --- and the document -------------------------------------------------------
//
// The session shows one move at a time. This is every row the parser produced,
// drawn by its family — the row library with nothing on top of it.
ok("the rail opens the document", await clickId("rt-rail-log"), "no rt-rail-log node");
await page.waitForTimeout(200);
const docTexts = (await listNow()).filter((c) => c.k === 3).map((c) => c.text);
ok("the document scene is on",
   (await page.evaluate("window.__app.sceneName()")) === "document",
   await page.evaluate("window.__app.sceneName()"));
ok("every family is drawn",
   ["Kova mutta hallittu treeni", "Phase1", "Alkulämmittely", " @0:36/100m", "~4", "78.5kg"]
     .every((t) => docTexts.includes(t)),
   docTexts.join("|"));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-document.png" });
  console.log("  wrote " + stem + "-document.png (the document)");
}

// The ported XState machine, on a screen. Which states it has and what each
// event does is checked exhaustively by `npm run rt:machine`; this is that
// machine wired to a view and drawn.
ok("the dialog opens", await clickId("rt-add"), "no rt-add node");
await page.waitForTimeout(150);
await clickId("rt-add-field");
await page.evaluate("window.__app.typeText('Exercise Maastaveto|3x5@100kg')");
await page.waitForTimeout(150);
const sheetTexts = (await listNow()).filter((c) => c.k === 3).map((c) => c.text);
ok("and shows what was typed",
   sheetTexts.includes("Exercise Maastaveto|3x5@100kg"), sheetTexts.join("|"));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-dialog.png" });
  console.log("  wrote " + stem + "-dialog.png (the ported dialog)");
}
await clickId("rt-sheet-cancel");

if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-timer.png" });
  console.log("  wrote " + stem + "-timer.png (the dial)");
}
await clickId("rt-pause");
const paused = await litTicks();
await page.waitForTimeout(700);
ok("pausing stops it", (await litTicks()) === paused, `${paused} -> ${await litTicks()}`);

// The plan-week dialog: a six-state machine run from its own definition, drawn
// on the dashboard. `rt:trace` walks it step by step; this is the same view in
// a real browser, one step in and one step out.
await clickId("rt-rail-home");
await page.waitForTimeout(150);
ok("the plan dialog opens", await clickId("rt-plan"), "no rt-plan node");
await page.waitForTimeout(150);
ok("into the week selection",
   (await page.evaluate("window.__app.plan.state()")) === "weekSelection",
   await page.evaluate("window.__app.plan.state()"));
await clickId("rt-plan-confirm");
await page.waitForTimeout(150);
ok("confirming the week runs the machine's named action and lands in confirmation",
   (await page.evaluate("window.__app.plan.state()")) === "confirmation",
   await page.evaluate("window.__app.plan.state()"));
const planTexts = (await listNow()).filter((c) => c.k === 3).map((c) => c.text);
ok("and the week's entries are on it, a checkbox each",
   planTexts.includes("Korvaa tiistai"), planTexts.join("|"));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-plan.png" });
  console.log("  wrote " + stem + "-plan.png (the plan-week dialog)");
}
await clickId("rt-plan-close");
await page.waitForTimeout(150);
ok("cancelling closes it",
   (await page.evaluate("window.__app.plan.state()")) === "closed",
   await page.evaluate("window.__app.plan.state()"));
// …and the other branch, the edit sheet, for the picture's sake.
await clickId("rt-plan");
await page.waitForTimeout(150);
// The edit sheet opens from the example week's "Muokkaa" on the phone; the
// dashboard has no such button, and the event is sent by id.
await page.evaluate("window.__app.press('rt-plan-edit')");
await page.waitForTimeout(150);
ok("the edit sheet is the other way in",
   (await page.evaluate("window.__app.plan.state()")) === "editInstructions",
   await page.evaluate("window.__app.plan.state()"));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-plan-edit.png" });
  console.log("  wrote " + stem + "-plan-edit.png (the plan-week dialog, editing)");
}
await clickId("rt-plan-cancel");

// The conversation: the nested machine, its reply streamed in on the app's
// clock, and the fork that reads how many actions the reply proposed.
ok("the rail opens the conversation", await clickId("rt-rail-chat"), "no rt-rail-chat node");
await page.waitForTimeout(150);
await clickId("rt-chat-type2");
await clickId("rt-chat-send");
ok("sending streams",
   (await page.evaluate("window.__app.chat.state()")) === "sending.streaming",
   await page.evaluate("window.__app.chat.state()"));
await page.waitForTimeout(3200);
ok("two proposed actions land in multiAction",
   (await page.evaluate("window.__app.chat.state()")) === "reviewing.multiAction",
   await page.evaluate("window.__app.chat.state()"));
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-chat.png" });
  console.log("  wrote " + stem + "-chat.png (the conversation, reviewing)");
}
await clickId("rt-chat-accept-all");
ok("accepting all saves",
   (await page.evaluate("window.__app.chat.state()")) === "processing.saving",
   await page.evaluate("window.__app.chat.state()"));
await page.waitForTimeout(900);
ok("and the save answers back to idle",
   (await page.evaluate("window.__app.chat.state()")) === "idle",
   await page.evaluate("window.__app.chat.state()"));

// The caret is drawn at the measured width of the text before it, and the
// text is drawn by the browser's own glyphs — two measurements of one string.
// A password field is where they came apart: the measurer guessed the bullet
// at half an em where the face draws 0.35, and nine characters in the caret
// sat fifteen pixels past the last one. So: type into three fields — Latin,
// umlauts, bullets — and check the caret sits on the run's right edge in the
// same picture.
const caretAfter = async (tid, text) => {
  await page.evaluate((t) => { window.__app.press(t); }, tid);
  await page.evaluate((t) => { window.__app.typeText(t); }, text);
  await page.waitForTimeout(200);
  const list = await listNow();
  const box = JSON.parse(await page.evaluate((t) => window.__app.fieldStateJson(t), tid)).box;
  const inBox = (c) => c.x >= box.x && c.x <= box.x + box.w && c.y >= box.y && c.y <= box.y + box.h;
  const run = list.find((c) => c.k === 3 && inBox(c));
  const caret = list.find((c) => c.k === 0 && c.w === 2 && c.h === 18 && inBox(c));
  if (!run || !caret) return { err: `no ${run ? "caret" : "text run"} in the field's box` };
  // NOT the run's own `w`: that is the layout's measurement, the same number
  // the caret was placed from, and the two agree even when both are wrong.
  // The glyph atlas is built with the browser's `measureText`, so that is
  // the width the text is DRAWN at, and the only one worth comparing against.
  const drawn = await page.evaluate(({ text, font, size }) => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${size}px ${font.replace(/-Bold$/, "")}`;
    return ctx.measureText(text).width;
  }, { text: run.text, font: run.font, size: run.size });
  return { err: null, drift: caret.x - (run.x + drawn), text: run.text };
};
await page.evaluate("window.__app.openRoute('/new-calendar')");
await page.waitForTimeout(200);
await page.evaluate("window.__app.press('rt-wiz-next')");
const latin = await caretAfter("rt-wiz-name", "Kilpailukausi 2026");
ok("the caret sits on the end of Latin text",
   !latin.err && Math.abs(latin.drift) < 0.5, latin.err ?? `${latin.drift.toFixed(2)}px past "${latin.text}"`);
const umlauts = await caretAfter("rt-wiz-desc", "Päiväkirja — ääkkösiä");
ok("and on the end of text with umlauts and a dash",
   !umlauts.err && Math.abs(umlauts.drift) < 0.5, umlauts.err ?? `${umlauts.drift.toFixed(2)}px past "${umlauts.text}"`);
await page.evaluate("window.__app.press('rt-wiz-next')");
await page.evaluate("window.__app.press('rt-wiz-encrypt')");
const bullets = await caretAfter("rt-wiz-pass", "Kissa2026");
ok("and on the end of a password's bullets",
   !bullets.err && Math.abs(bullets.drift) < 0.5, bullets.err ?? `${bullets.drift.toFixed(2)}px past "${bullets.text}"`);
if (pngOut) {
  await page.locator("#stage canvas").screenshot({ path: stem + "-wizard-password.png" });
  console.log("  wrote " + stem + "-wizard-password.png (the caret after the bullets)");
}

ok("nothing errored along the way", problems.length === 0, [...new Set(problems)].join("; "));

await browser.close();
server.close();
console.log("");
if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
