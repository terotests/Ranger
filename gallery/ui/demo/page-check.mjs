#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Load the demo page in a real browser and walk every demo.
//
//   node gallery/ui/demo/page-check.mjs
//
// WHY THIS EXISTS. `mod.EVGReconcile is not a constructor`, reported from a
// browser console. `keptTree` builds three of the demos and asks the compiled
// module for the classes it needs — the same module the elements come from,
// because two copies of a class are two classes — and `MenubarDemo.rgr` has
// never imported `EVGReconcile.rgr`. So that line threw the day it was
// written, and kept throwing for as long as the page has existed.
//
// Nothing caught it because nothing RAN the page. `ui:demo:build` bundles it,
// which proves esbuild can resolve the imports and nothing more; the checks
// beside this one drive the demo classes in Node and never touch main.js; and
// the a11y audit mirrors trees into a DOM without loading the page that draws
// them. A bundle that builds is not a page that works.
//
// So: serve the repo, load index.html, and fail on any uncaught exception or
// console error — then click through all thirteen demos, because a page that
// starts is not a page whose every tab starts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `node gallery/ui/demo/build.mjs` first");
  process.exit(3);
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".woff2": "font/woff2",
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
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

const problems = [];
page.on("pageerror", (e) => problems.push(`uncaught: ${e.message.split("\n")[0]}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console.error: ${m.text().split("\n")[0]}`);
});
page.on("requestfailed", (r) => problems.push(`request failed: ${r.url().replace(/^http:\/\/[^/]+/, "")}`));

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

console.log("--- the page loads ---");
// The SAME url a person opens. Serving index.html at "/" instead would make
// its relative `bundle.js` resolve to the repo root, which is not where it is
// — the check would then be testing a page nobody loads.
await page.goto(`http://127.0.0.1:${port}/gallery/ui/demo/index.html`, { waitUntil: "networkidle" });
// The stage only gets a canvas once main.js has run far enough to paint.
await page.waitForFunction("document.querySelector('#stage canvas') !== null", null, { timeout: 15000 })
  .catch(() => {});
ok("no error on first paint", problems.length === 0, [...new Set(problems)].join("; "));
// SIZED BY THE SCRIPT, not the 300x150 a canvas element is born with — that
// default is bigger than zero and would have passed while the bundle 404'd.
const painted = await page.evaluate(() => {
  const c = document.querySelector("#stage canvas");
  return c ? c.width : 0;
});
ok("and the canvas was sized by the page", painted > 600, "canvas width " + painted);

console.log("--- every demo ---");
// The switcher is a set of radios built by `radios(...)` into #demos; clicking
// each label is what a person does, and it is what exercises each demo's own
// first frame.
const names = await page.evaluate(() =>
  [...document.querySelectorAll("#demos input[type=radio]")].map((r) => r.value));
ok("the switcher offers all thirteen", names.length === 13, names.join(","));
for (const n of names) {
  problems.length = 0;
  await page.click(`#demos input[value="${n}"]`);
  await page.waitForTimeout(250);
  const drew = await page.evaluate(() => {
    const c = document.querySelector("#stage canvas");
    return c ? c.width : 0;
  });
  ok(`${n}: draws without an error`, problems.length === 0 && drew > 600,
    [...new Set(problems)].join("; ") || "canvas width " + drew);
}

console.log("--- the keyboard reaches the demo ---");
{
  // Reported: the Profile page's inputs did not respond to the keyboard. They
  // worked in Node — press then keyWith inserts — and the page dropped every
  // key, because the keydown handler bailed on any `HTMLInputElement` and the
  // only inputs here are the sidebar's own radios. Choosing a demo left focus
  // on the radio that chose it. So the check is end to end: click the field
  // the way a person does, type, and look at what the page drew.
  await page.click('#demos input[value="profile"]');
  await page.waitForTimeout(250);
  const rect = await page.evaluate(() => {
    const el = document.querySelector('[data-a11y-id="pf-name"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  ok("the Full Name field is on the page", !!rect);
  const drawn = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    return (l.cmds || []).filter((c) => c.text).map((c) => c.text).find((t) => t.startsWith("Noa"));
  });
  const before = await drawn();
  await page.mouse.click(rect.x, rect.y);
  await page.waitForTimeout(120);
  const focusedTag = await page.evaluate(() => document.activeElement.tagName);
  ok("clicking the picture puts the focus on it", focusedTag === "CANVAS", focusedTag);
  await page.keyboard.type("XY");
  await page.waitForTimeout(200);
  const after = await drawn();
  ok("and typing reaches the field", after === before + "XY", before + " -> " + after);
}

console.log("--- the pointer edits the text, not just the focus ---");
{
  // THE BUG THIS EXISTS FOR. `FormDemo.pressAt` could put the caret under the
  // pointer since the day it was written, and `form-check.mjs` called it and
  // passed. The page called `press(id)` with the coordinate dropped, so on the
  // real page every click put the caret wherever it had been. A check that
  // calls the API cannot see that nothing calls the API — so this one clicks
  // the canvas, types, and reads the string that got drawn.
  //
  // Typing is the assertion on purpose. A caret x would have to be compared
  // against a measurement, and the measurement is the other half of the same
  // machinery; where the character LANDS in the string is independent of it.
  // Each of the three below starts from a RELOADED page. Switching to another
  // demo and back does not reset anything — the demo objects are made once at
  // module scope and keep their state — so the first version of this ran the
  // double-click against a field the click test had already typed into and
  // read "Ada ZXLovelace" back.
  const freshForm = async () => {
    await page.reload({ waitUntil: "networkidle" });
    await page.click('#demos input[value="form"]');
    await page.waitForTimeout(300);
  };
  await freshForm();

  // The field's VALUE, out of the accessible tree — which is what a screen
  // reader is told, and the only place the whole string is. Reading it off the
  // draw commands by looking for "Lovelace" was self-defeating: selecting that
  // word and typing over it is the behaviour under test, and it takes the
  // needle away with it.
  const shown = () => page.evaluate(() => {
    const t = JSON.parse(window.__lastA11y || "{}");
    const n = (t.nodes || []).find((x) => x.id === "fm-name");
    return n ? n.value : undefined;
  });
  const box = await page.evaluate(() => {
    const el = document.querySelector('[data-a11y-id="fm-name"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y + r.height / 2, w: r.width };
  });
  ok("the Full Name field is on the page", !!box);
  const before = await shown();
  ok("it holds the name", before === "Ada Lovelace", before);

  // 40px in from the box's left edge, not a fraction of its WIDTH. The box is
  // 370px wide and "Ada Lovelace" is 79px of it, so a third of the box is
  // well past the end of the text — the first version of this check clicked
  // there, got the caret at 12, and read as the very bug it was written for.
  // The offset is in text, and the click lands around the fifth character.
  const IN_TEXT = 40;
  await page.mouse.click(box.x + IN_TEXT, box.y);
  await page.waitForTimeout(120);
  await page.keyboard.type("X");
  await page.waitForTimeout(150);
  const after = await shown();
  const at = after ? after.indexOf("X") : -1;
  ok("a click puts the caret where the pointer landed",
    at > 0 && at < before.length, `${JSON.stringify(after)} — X at ${at}`);
  // Said separately, because "at the end" is the exact failure and deserves
  // to be named rather than folded into a range check.
  ok("and not at the end of the field, which is what a dropped x looks like",
    at !== before.length, JSON.stringify(after));

  // Double-click takes the run under the pointer. Typing replaces it, so the
  // word is gone — which is a stronger statement than "a selection exists".
  await freshForm();
  await page.mouse.dblclick(box.x + IN_TEXT, box.y);
  await page.waitForTimeout(120);
  await page.keyboard.type("Z");
  await page.waitForTimeout(150);
  const dbl = await shown();
  // The click lands inside "Lovelace", so the run taken is that word.
  ok("a double-click selects a word, and typing replaces it",
    dbl === "Ada Z" || dbl === "Z Lovelace", JSON.stringify(dbl));

  // A drag selects a range, and it keeps selecting after the pointer has left
  // the box — which is what pointer capture is for. Ending well past the right
  // edge should take everything from the press to the end of the text.
  await freshForm();
  await page.mouse.move(box.x + IN_TEXT, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.w + 400, box.y, { steps: 6 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.keyboard.type("Q");
  await page.waitForTimeout(150);
  const drag = await shown();
  ok("a drag off the right edge keeps selecting to the end",
    typeof drag === "string" && drag.endsWith("Q") && drag.length < before.length,
    JSON.stringify(drag));

  // And the cursor says the box is text. Without this a drawn form is a
  // picture of a form: the I-beam is how a person knows there is a caret to be
  // had. The page picks its cursor from the accessible tree, where a field and
  // a button both read as activatable, so this needs its own answer.
  await page.mouse.move(box.x + IN_TEXT, box.y);
  await page.waitForTimeout(120);
  const cur = await page.evaluate(() => document.querySelector("#stage canvas").style.cursor);
  ok("the pointer says the box is text", cur === "text", cur);
}

console.log("--- the window follows the pointer ---");
{
  // Reported: the window only jumped at the end of a drag. `dragBy` moved the
  // controller and was the only one of the three gesture methods that did not
  // rebuild the tree, so the painted position stayed where it was built until
  // the release rebuilt it.
  await page.click('#demos input[value="dialog"]');
  await page.waitForTimeout(300);
  const box = await (await page.$("#stage canvas")).boundingBox();
  const at = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    const c = (l.cmds || []).find((x) => Math.abs(x.w - 300) < 2 && Math.abs(x.h - 194) < 2);
    return c ? [c.x, c.y] : null;
  });
  await page.mouse.move(box.x + 700, box.y + 45);
  await page.waitForTimeout(120);
  const cursor = await page.evaluate(() => document.querySelector("#stage canvas").style.cursor);
  ok("the title bar says it can be moved", cursor === "move", cursor);

  const start = await at();
  await page.mouse.down();
  const seen = [];
  for (const d of [20, 40, 60]) {
    await page.mouse.move(box.x + 700 + d, box.y + 45);
    await page.waitForTimeout(60);
    seen.push((await at())[0]);
  }
  await page.mouse.up();
  // EVERY step moves it, not just the last: three distinct positions, each
  // one further along than the one before.
  ok("it moves at every step of the drag",
    seen.length === 3 && seen[0] > start[0] && seen[1] > seen[0] && seen[2] > seen[1],
    `${start[0]} -> ${seen.join(" -> ")}`);
}

console.log("--- the title bar is rounded only at the top ---");
{
  // `border-radius: 11px 11px 0 0` — the declaration that makes a strip sit
  // flush against what is under it, and which could not be written at all
  // while a box had one radius.
  const rc = await page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    const c = (l.cmds || []).find((x) => Math.abs(x.w - 298) < 2 && Math.abs(x.h - 40) < 2);
    return c ? c.rc : null;
  });
  ok("the bar carries four corners", Array.isArray(rc), JSON.stringify(rc));
  ok("rounded at the top, square at the bottom",
    rc && rc[0] > 0 && rc[1] > 0 && rc[2] === 0 && rc[3] === 0, JSON.stringify(rc));
}

console.log("--- the surface ripples where it was touched ---");
{
  // `evg-surface-effect: ripple` is an EVG EXTENSION, not CSS: there is no
  // browser property to measure it against, so what is checked is that the
  // declaration reaches the display list, that a touch becomes its origin,
  // that the age advances, and that the renderer took the second pass.
  await page.click('#demos input[value="dashboard"]');
  await page.waitForTimeout(400);
  const effect = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    return l.effect || null;
  });
  const at = await effect();
  ok("the sheet's effect reaches the list", at && at.kind === "ripple",
    JSON.stringify(at));
  ok("and it is at rest until something touches it",
    at && at.drops.length === 0, JSON.stringify(at && at.drops));

  const box = await (await page.$("#stage canvas")).boundingBox();
  await page.mouse.click(box.x + 700, box.y + 430);
  await page.waitForTimeout(150);
  const live = await effect();
  ok("a click becomes the ripple's origin",
    live && live.drops.length >= 1 &&
      Math.abs(live.drops[0][0] - 700) < 3 && Math.abs(live.drops[0][1] - 430) < 3,
    JSON.stringify(live && live.drops[0]));
  ok("and its clock starts", live && live.drops[0][2] >= 0,
    String(live && live.drops[0][2]));

  // MANY AT ONCE, which is the difference between an effect and a surface:
  // a tap somewhere else ADDS a source, it does not move the one that is
  // there. What is asserted per tap is its PLACE — that a click anywhere on
  // the page lands a drop under the pointer, which is the part only a real
  // browser with a real hit test can prove.
  //
  // NOT that all three coexist. That is a fact about a wall clock this test
  // does not own: in this container a rippling frame can take over a second,
  // and a machine busy with something else will retire the first drop before
  // the third click happens. It failed exactly that way once, with both gates
  // running at the same time, and passed three for three on a quiet machine —
  // which is a flake, not a check. The shape of the set — three coexisting,
  // three distinct ages, oldest first — is asserted in `dashboard-check.mjs`,
  // where the clock is the test's, for the same reason the wake is.
  const newest = (fx) => fx && fx.drops.length ? fx.drops[fx.drops.length - 1] : null;
  for (const [cx, cy] of [[420, 330], [900, 520]]) {
    await page.mouse.click(box.x + cx, box.y + cy);
    await page.waitForTimeout(90);
    const d = newest(await effect());
    ok(`a touch at ${cx},${cy} lands there`,
      d && Math.abs(d[0] - cx) < 3 && Math.abs(d[1] - cy) < 3, JSON.stringify(d));
  }
  // Not even "at least two are still in flight". On this machine that is
  // sometimes 1: the frames are slow enough that a drop can be born, live and
  // retire between two clicks 90ms apart. Whatever IS in flight still has to
  // be well formed, which is what the two below say.
  const many = await effect();
  ok("each with an age of its own",
    many && new Set(many.drops.map((d) => d[2])).size === many.drops.length,
    JSON.stringify(many && many.drops.map((d) => d[2])));
  // Oldest first, which is the order the ring buffer retires them in.
  ok("oldest first",
    many && many.drops.every((d, i) => i === 0 || d[2] <= many.drops[i - 1][2]),
    JSON.stringify(many && many.drops.map((d) => d[2])));

  // A dragged finger leaves a WAKE. What is asserted here is only that a drag
  // makes drops at all: this container draws with SwiftShader on the CPU, and
  // a rippling frame can take over two seconds, so one `tick` ages everything
  // added before it past its lifetime and the wake is thinned out by the
  // machine rather than by the code. The wake's real shape — eight of them, a
  // step apart, oldest retired — is checked in `dashboard-check.mjs`, where
  // the clock is the test's and not the renderer's.
  await page.mouse.move(box.x + 300, box.y + 600);
  await page.mouse.down();
  for (let x = 300; x <= 620; x += 40) {
    await page.mouse.move(box.x + x, box.y + 600);
  }
  await page.mouse.up();
  await page.waitForTimeout(80);
  const wake = await effect();
  ok("a drag leaves drops behind it", wake && wake.drops.length >= 1,
    String(wake && wake.drops.length));
  ok("and never more than the shader can hold", wake && wake.drops.length <= 8,
    String(wake && wake.drops.length));

  // The second pass really ran: `rippled` is the renderer saying it drew the
  // page into a texture and put it on the screen through the shader.
  const stats = await page.evaluate(() => window.__lastStats || null);
  if (stats) ok("the renderer took the post-pass", stats.rippled === 1, JSON.stringify(stats.rippled));
  else console.log("  (the page does not publish renderer stats; skipped)");
}

await browser.close();
server.close();
console.log("");
if (failed > 0) { console.log(`RESULT FAIL — ${failed} problem(s)`); process.exit(1); }
console.log("RESULT OK — the page loads and every demo draws");
