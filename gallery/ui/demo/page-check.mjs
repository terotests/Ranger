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
import { requireHostTool, findChromium } from "../conformance/dom-adapter.mjs";

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

// playwright-core ALONE. This check serves this repository and drives this
// repository's page; it renders no reference component, so `requireDom` — which
// demands everything the Radix host declares — would fail it on any machine
// that has not run `ui:conformance:install`, CI included.
const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
// A context of its own, so the clipboard can be granted: the point of the
// text bridge is that copy and paste are the platform's, and a check that
// cannot reach the clipboard cannot show that.
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
const page = await context.newPage();

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
// By NAME, not by count. This said "all thirteen" and went red the day a
// fourteenth demo arrived — a number in an assertion is a second place to
// remember something, and it is the place nobody remembers.
const EXPECTED = ["menubar", "toolbar", "sortable", "table", "tree", "timeline",
  "resizable", "form", "calendar", "filters", "eventcal", "message", "controls", "profile", "dashboard", "dropdown", "dialog", "motion"];
ok("the switcher offers every demo",
  EXPECTED.every((n) => names.includes(n)) && names.length === EXPECTED.length,
  names.join(","));
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
  // CANVAS or INPUT. Clicking a TEXT FIELD now hands the keyboard to the
  // hidden native proxy that owns the editing session, so INPUT is the right
  // answer there and CANVAS is the right answer everywhere else. This
  // asserted CANVAS alone, from before there was a session to hand over to.
  ok("clicking the picture puts the focus on it",
    focusedTag === "CANVAS" || focusedTag === "INPUT", focusedTag);
  await page.keyboard.type("XY");
  await page.waitForTimeout(200);
  const after = await drawn();
  ok("and typing reaches the field", after === before + "XY", before + " -> " + after);
}

// Shared by the two form sections below. Declared out here because both need
// them and a check that reaches into another block's scope is a check that
// stops working the moment the blocks are reordered.
let freshForm;
let box;
const IN_TEXT = 40;

// THE SELECT, ON THE PAGE. It works in Node — trigger opens, option chooses —
// and that proves nothing about here: the page's press door is
// `beginSelection`, not `press`, and a control routed through the wrong door
// is this gallery's most-repeated defect. Three of them survived every Node
// assertion before this file existed.
{
  const box = async (id) => page.evaluate((x) => {
    const el = document.querySelector(`[data-a11y-id="${x}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, id);
  const roleOf = async (id) => page.evaluate((x) => {
    const el = document.querySelector(`[data-a11y-id="${x}"]`);
    return el ? el.getAttribute("role") : null;
  }, id);

  const trig = await box("pf-visibility");
  ok("the Visibility select is on the page", !!trig);
  if (trig) {
    ok("and it is a combobox", (await roleOf("pf-visibility")) === "combobox");
    await page.mouse.click(trig.x, trig.y);
    await page.waitForTimeout(150);
    const opt = await box("pf-visibility-item-nobody");
    ok("clicking it opens the list", !!opt, "no option element after the click");
    if (opt) {
      await page.mouse.click(opt.x, opt.y);
      await page.waitForTimeout(150);
      const label = await page.evaluate(() => {
        const l = JSON.parse(window.__lastList || "{}");
        return (l.cmds || []).filter((c) => c.text).map((c) => c.text)
          .find((t) => t === "Nobody" || t === "Team only" || t === "Everyone");
      });
      ok("choosing an option puts its label on the trigger", label === "Nobody", String(label));
      const stillOpen = await box("pf-visibility-item-nobody");
      ok("and closes the list", !stillOpen);
    }
  }
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
  freshForm = async () => {
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
  box = await page.evaluate(() => {
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

console.log("--- the platform owns the editing, not us ---");
{
  // The payoff. None of the four below is implemented anywhere in this repo:
  // they work because a real, transparent <input> sits over the focused field
  // and does the editing, and Ranger mirrors its value and selection. Before
  // the bridge, `keydown` was turned into edits by hand and every one of them
  // was impossible — three are on InputCtl's own list of things it does not
  // do, and the fourth breaks any implementation that deletes one code unit.
  const proxy = () => page.evaluate(() => {
    const i = [...document.querySelectorAll("input")].find(
      (x) => x.getAttribute("aria-hidden") === "true");
    return i ? { value: i.value, s: i.selectionStart, e: i.selectionEnd,
                 focused: document.activeElement === i, type: i.type } : null;
  });
  const rangerValue = () => page.evaluate(() => {
    const t = JSON.parse(window.__lastA11y || "{}");
    const n = (t.nodes || []).find((x) => x.id === "fm-name");
    return n ? n.value : undefined;
  });
  const clickField = async () => {
    await freshForm();
    await page.mouse.click(box.x + IN_TEXT, box.y);
    await page.waitForTimeout(150);
  };

  await clickField();
  const p0 = await proxy();
  ok("a focused field hands the keyboard to a real input", p0 && p0.focused, JSON.stringify(p0));
  ok("seeded with the field's own value and caret",
    p0 && p0.value === "Ada Lovelace" && p0.s === p0.e && p0.s > 0, JSON.stringify(p0));

  // 1. COPY AND PASTE. InputCtl lists the clipboard as not implemented.
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+c");
  await page.keyboard.press("End");
  await page.keyboard.type("! ");
  await page.keyboard.press("ControlOrMeta+v");
  await page.waitForTimeout(200);
  ok("copy and paste work, with no code of ours",
    (await rangerValue()) === "Ada Lovelace! Ada Lovelace", JSON.stringify(await rangerValue()));

  // 2. UNDO. Also on the not-implemented list.
  //
  // GRANULARITY IS NOT ASSERTED. The oracle typed "XYZ" into a bare <input>
  // and one Ctrl+Z took all three back; here each keystroke undoes on its
  // own. Coalescing is the browser's business — it depends on timing, on word
  // boundaries and on whether anything has written to `value` in between —
  // and pinning it would be asserting a number nobody promised. What is
  // asserted is the claim actually being made: undo reverses typing, and
  // keeps reversing it back to where the field started, with no code of ours.
  await clickField();
  await page.keyboard.type("QQQ");
  await page.waitForTimeout(120);
  const typed = await rangerValue();
  ok("typing changed it", typed === "Ada QQQLovelace", JSON.stringify(typed));
  await page.keyboard.press("ControlOrMeta+z");
  await page.waitForTimeout(150);
  const oneUndo = await rangerValue();
  ok("one undo reverses part of it", oneUndo !== typed, `${JSON.stringify(typed)} -> ${JSON.stringify(oneUndo)}`);
  let steps = 1;
  let now = oneUndo;
  while (now !== "Ada Lovelace" && steps < 8) {
    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(120);
    const next = await rangerValue();
    if (next === now) break;
    now = next;
    steps++;
  }
  ok("and undoing gets back to where the field started",
    now === "Ada Lovelace", `${JSON.stringify(now)} after ${steps} undos`);

  // 3. GRAPHEMES. One Backspace over a ZWJ family removes ELEVEN code units.
  // `caret - 1` leaves half a surrogate pair and the field draws a mojibake
  // box; the browser knows where the cluster ends because it is the browser.
  await clickField();
  await page.keyboard.press("End");
  await page.keyboard.insertText("\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}");
  await page.waitForTimeout(150);
  const withFamily = await rangerValue();
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(200);
  const afterBksp = await rangerValue();
  ok("one Backspace removes a whole ZWJ family, not one code unit",
    withFamily.length - afterBksp.length === 11 && afterBksp === "Ada Lovelace",
    `${withFamily.length} -> ${afterBksp.length}, ${JSON.stringify(afterBksp)}`);

  // 4. IME. Driven through the DevTools protocol, so the page sees a real
  // composition rather than a simulation of one — this is what a Japanese or
  // Chinese keyboard produces, and it is the single largest thing a
  // keydown-to-edit field cannot do at all.
  await clickField();
  await page.keyboard.press("End");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.imeSetComposition", { text: "にほ", selectionStart: 2, selectionEnd: 2 });
  await page.waitForTimeout(150);
  const composing = await rangerValue();
  ok("a composition in progress reaches the field",
    typeof composing === "string" && composing.endsWith("にほ"), JSON.stringify(composing));
  await cdp.send("Input.insertText", { text: "日本" });
  await page.waitForTimeout(200);
  const committed = await rangerValue();
  ok("and committing it replaces the composition",
    committed === "Ada Lovelace日本", JSON.stringify(committed));

  // Tab still belongs to the application, not to the field.
  await clickField();
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);
  const afterTab = await proxy();
  ok("Tab moves to the next field rather than typing one",
    afterTab && afterTab.focused && afterTab.value !== "Ada Lovelace", JSON.stringify(afterTab));

  // The model still refuses what the field will not hold. `inputmode` is a
  // keyboard hint on a phone and nothing on a desktop keyboard, so without
  // this the bridge quietly undid the number field's filter — every edit now
  // goes round `insertText`, which is where that filter used to live.
  await freshForm();
  const amt = await page.evaluate(() => {
    const el = document.querySelector('[data-a11y-id="fm-amount"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + 20, y: r.y + r.height / 2 };
  });
  if (amt) {
    await page.mouse.click(amt.x, amt.y);
    await page.waitForTimeout(150);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("12ab3");
    await page.waitForTimeout(200);
    const amount = await page.evaluate(() => {
      const t = JSON.parse(window.__lastA11y || "{}");
      const n = (t.nodes || []).find((x) => x.id === "fm-amount");
      return n ? n.value : undefined;
    });
    ok("a number field still refuses letters", amount === "123", JSON.stringify(amount));
  }

  // And a password field gets a password proxy — so the platform's own
  // reveal, and on a phone the right keyboard.
  await freshForm();
  const pw = await page.evaluate(() => {
    const el = document.querySelector('[data-a11y-id="fm-secret"]');
    const r = el.getBoundingClientRect();
    return { x: r.x + 20, y: r.y + r.height / 2 };
  });
  await page.mouse.click(pw.x, pw.y);
  await page.waitForTimeout(150);
  const pp = await proxy();
  ok("a password field gets a password proxy", pp && pp.type === "password", JSON.stringify(pp));
}

console.log("--- and a reader is told the same thing a person is shown ---");
{
  // The JSON tree carrying `invalid` is not the same as a reader hearing it.
  // These read the MIRROR — the real DOM elements a screen reader walks — so
  // the last hop is covered too. It was not: `aria-pressed` was only ever
  // derived from `checked`, so a control that set `pressed` honestly got
  // nothing, and `aria-readonly` was `node.readonly ? "true" : null`, which
  // turns a measured "false" into "true" the moment the field becomes a
  // string.
  await freshForm();
  const attrs = (id) => page.evaluate((x) => {
    const el = document.querySelector(`[data-a11y-id="${x}"]`);
    if (!el) return null;
    return {
      required: el.getAttribute("aria-required"),
      invalid: el.getAttribute("aria-invalid"),
      readonly: el.getAttribute("aria-readonly"),
      pressed: el.getAttribute("aria-pressed"),
    };
  }, id);

  const email = await attrs("fm-email");
  ok("the field in error is announced as invalid", email && email.invalid === "true",
    JSON.stringify(email));
  const nameField = await attrs("fm-name");
  ok("a required field is announced as required", nameField && nameField.required === "true",
    JSON.stringify(nameField));
  ok("and it claims nothing about validity", nameField && nameField.invalid === null,
    JSON.stringify(nameField));
  const invoice = await attrs("fm-invoice");
  ok("the read-only field is announced as read-only", invoice && invoice.readonly === "true",
    JSON.stringify(invoice));

  const eyeBefore = await attrs("fm-secret-eye");
  ok("the password toggle reports its state", eyeBefore && eyeBefore.pressed === "false",
    JSON.stringify(eyeBefore));
  const eyeBox = await page.evaluate(() => {
    const el = document.querySelector('[data-a11y-id="fm-secret-eye"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(eyeBox.x, eyeBox.y);
  await page.waitForTimeout(200);
  const eyeAfter = await attrs("fm-secret-eye");
  ok("and flips it when pressed", eyeAfter && eyeAfter.pressed === "true",
    JSON.stringify(eyeAfter));
}

console.log("--- the filter bar filters, in a browser ---");
{
  // The controller has 121 assertions and the demo has 32, and BOTH ran in
  // Node. The text field had exactly that shape once — green in the
  // controller, green in the demo's own API, and unclickable on the page,
  // because `main.js` dropped the coordinate between them. So this clicks
  // PIXELS, and reads the answer back off what was painted.
  await page.click('#demos input[value="filters"]');
  await page.waitForTimeout(250);

  // The count, out of the display list the page just drew.
  const countNow = () =>
    page.evaluate(() => {
      const list = JSON.parse(window.__lastList || "null");
      if (!list) return "(no list)";
      const c = list.cmds.find((k) => typeof k.text === "string" && / of \d+ tasks$/.test(k.text));
      return c ? c.text : "(no count)";
    });
  // Where a piece of drawn text is, in the canvas's own coordinates — which is
  // what `offsetX/offsetY` are, so no scaling guesswork.
  const whereIs = (needle) =>
    page.evaluate((n) => {
      const list = JSON.parse(window.__lastList || "null");
      if (!list) return null;
      const c = list.cmds.find((k) => k.text === n);
      return c ? { x: c.x + c.w / 2, y: c.y + c.h / 2 } : null;
    }, needle);
  const clickAt = async (pt) => {
    const r = await page.evaluate(() => {
      const c = document.querySelector("#stage canvas");
      const b = c.getBoundingClientRect();
      return { x: b.x, y: b.y };
    });
    await page.mouse.click(r.x + pt.x, r.y + pt.y);
    await page.waitForTimeout(150);
  };

  ok("the page draws the count", (await countNow()) === "2 of 6 tasks", await countNow());
  ok("and the four-value chip collapses on screen",
    await page.evaluate(() => JSON.parse(window.__lastList).cmds.some((k) => k.text === "Ada, Grace, Alan +1")));

  // Open the priority chip's value list by clicking the word "Urgent".
  const urgent = await whereIs("Urgent");
  ok("the value chip is on the page to be clicked", urgent !== null, JSON.stringify(urgent));
  if (urgent) {
    await clickAt(urgent);
    const opened = await page.evaluate(() =>
      JSON.parse(window.__lastList).cmds.filter((k) => k.text === "Low").length);
    ok("clicking it opens the option list", opened > 0, "found " + opened);

    // Pick "Low". `is` replaces rather than accumulates, so the answer narrows.
    const low = await whereIs("Low");
    if (low) {
      await clickAt(low);
      const after = await countNow();
      ok("picking a different value changes the answer ON THE PAGE",
        after === "1 of 6 tasks", after);
      ok("and the surviving row is drawn",
        await page.evaluate(() => JSON.parse(window.__lastList).cmds.some((k) => k.text === "Trim the atlas")));
    } else {
      ok("the option is on the page to be clicked", false, "no 'Low'");
    }
  }

  // And a reader is told the same thing. The count is role=status, so it is in
  // the tree rather than only in the paint.
  // The tree is `{root, focus, gen, nodes}` — a FLAT node list, not a nested
  // one. An earlier version of this walked `n.children`, found nothing, and
  // reported the component silent when it was the probe that was wrong.
  const spoken = await page.evaluate(() => {
    const t = JSON.parse(window.__lastA11y || "null");
    if (!t || !t.nodes) return "(no tree)";
    return t.nodes
      .filter((n) => n.role === "status" && / of \d+ tasks$/.test(n.name || ""))
      .map((n) => n.name)
      .join("|");
  });
  ok("and a reader is told the count, as a status", spoken === "1 of 6 tasks", spoken);
}

console.log("--- the calendar: reaching a year ---");
{
  // Reported: the calendar looked right and had no way to a year — 2019 was
  // forty-eight presses of the previous-month arrow. `ui:calendar:check`
  // gates what a jump DOES against react-day-picker and `ui:calendar:demo`
  // gates the drawn panel; what only a page can check is the WHEEL, because
  // the page owns that event and hands it to the demo, and a panel taller
  // than its box with no way to scroll it is a list with most of its years
  // out of reach.
  await page.click('#demos input[value="calendar"]');
  await page.waitForTimeout(300);

  const origin = await page.evaluate(() => {
    const b = document.querySelector("#stage canvas").getBoundingClientRect();
    return { x: b.x, y: b.y };
  });
  // The display list does NOT clip to a scroll container — the painter does —
  // so a year scrolled out of the panel is still in it, at a y outside the
  // panel's box. Reading the SET of year texts therefore says the same thing
  // however far the panel is scrolled, which is how this block first passed
  // its "a list appears" assertion while its wheel assertions compared two
  // identical strings. Positions are what carry the answer.
  //
  // An option's number is 60 wide (`.cd-yearopttx`) and the caption's year is
  // 44 (`.cd-yeartxt`), which is what tells the two apart.
  const opts = () =>
    page.evaluate(() => {
      const l = JSON.parse(window.__lastList || '{"cmds":[]}');
      return (l.cmds || [])
        .filter((c) => typeof c.text === "string" && /^\d{4}$/.test(c.text) && Math.abs(c.w - 60) < 1)
        .map((c) => ({ year: c.text, x: c.x + c.w / 2, y: c.y + c.h / 2 }));
    });
  const captionYear = () =>
    page.evaluate(() => {
      const l = JSON.parse(window.__lastList || '{"cmds":[]}');
      const c = (l.cmds || []).find((x) => typeof x.text === "string" && /^\d{4}$/.test(x.text) && Math.abs(x.w - 44) < 1);
      return c ? { year: c.text, x: c.x + c.w / 2, y: c.y + c.h / 2 } : null;
    });
  // The panel's own box, so "visible" can be asked properly.
  const panelBox = () =>
    page.evaluate(() => {
      const l = JSON.parse(window.__lastList || '{"cmds":[]}');
      const c = (l.cmds || []).find((x) => Math.abs(x.w - 88) < 1 && Math.abs(x.h - 200) < 1);
      return c ? { top: c.y, bottom: c.y + c.h } : null;
    });
  const mirror = (id, what) =>
    page.evaluate(([i, w]) => {
      const el = document.querySelector(`[data-a11y-id="${i}"]`);
      if (!el) return "(absent)";
      return w === "tag" ? el.tagName : el.getAttribute(w);
    }, [id, what]);

  const cap = await captionYear();
  ok("the caption shows a year", cap && cap.year === "2026", JSON.stringify(cap));
  ok("no panel is drawn while it is shut", (await opts()).length === 0,
    JSON.stringify(await opts()));
  // The mirror renders role=button as a real <button>, which already carries
  // the role, so the tag is the thing to look at and not a role attribute.
  ok("the year is a button in the mirror", (await mirror("cal-year", "tag")) === "BUTTON",
    await mirror("cal-year", "tag"));
  ok("reported collapsed", (await mirror("cal-year", "aria-expanded")) === "false",
    await mirror("cal-year", "aria-expanded"));

  await page.mouse.click(origin.x + cap.x, origin.y + cap.y);
  await page.waitForTimeout(200);
  ok("pressing it expands the year", (await mirror("cal-year", "aria-expanded")) === "true",
    await mirror("cal-year", "aria-expanded"));
  const opened = await opts();
  ok("a list of years appears", opened.length === 21, String(opened.length));
  const box = await panelBox();
  const inside = (o) => box && o.y >= box.top && o.y <= box.bottom;
  ok("parked on the year it is on", opened.some((o) => o.year === "2026" && inside(o)),
    JSON.stringify(opened.filter((o) => o.year === "2026")));
  // A scroller, not a list that happens to fit: with 21 years at 26px in a
  // 200px box, some of them have to be outside it.
  ok("and years beyond the box are out of view", opened.some((o) => !inside(o)),
    JSON.stringify(box));

  // The wheel. This is the assertion that needs a page: `scroll(dy)` is
  // plumbed by main.js and the offline check calls `scrollBy` directly, so a
  // panel that scrolls in the demo and not under a real wheel would pass
  // everything else.
  const yOf = (list, y) => (list.find((o) => o.year === y) || {}).y;
  const before2026 = yOf(opened, "2026");
  await page.mouse.move(origin.x + cap.x, origin.y + cap.y + 60);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(200);
  const afterUp = await opts();
  ok("the wheel scrolls the panel", yOf(afterUp, "2026") === before2026 + 120,
    `${before2026} -> ${yOf(afterUp, "2026")}`);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(200);
  ok("and back", yOf(await opts(), "2026") === before2026,
    `${yOf(await opts(), "2026")} vs ${before2026}`);

  // Down far enough to bring an older year into the box, then choose the one
  // that is actually visible. Clicking a year drawn outside the panel is
  // clicking through it, which is what made this look broken the first time.
  await page.mouse.wheel(0, 160);
  await page.waitForTimeout(200);
  const scrolled = await opts();
  const box2 = await panelBox();
  const visible = scrolled.filter((o) => o.y >= box2.top + 14 && o.y <= box2.bottom - 14);
  const pick = visible.find((o) => Number(o.year) < 2026);
  ok("an older year is now inside the panel", !!pick,
    JSON.stringify(visible.map((o) => o.year)));
  await page.mouse.click(origin.x + pick.x, origin.y + pick.y);
  await page.waitForTimeout(250);
  const nowCap = await captionYear();
  ok("choosing it moves the calendar", nowCap && nowCap.year === pick.year,
    `${JSON.stringify(nowCap)} want ${pick.year}`);
  ok("and the panel closed behind it", (await opts()).length === 0,
    String((await opts()).length));
  ok("collapsed again in the mirror", (await mirror("cal-year", "aria-expanded")) === "false",
    await mirror("cal-year", "aria-expanded"));
  // The month is kept, which is the reference's rule and is measured in
  // `ui:calendar:check`; this is it surviving the trip through the page.
  const texts = await page.evaluate(() =>
    JSON.parse(window.__lastList || '{"cmds":[]}').cmds
      .filter((c) => typeof c.text === "string").map((c) => c.text));
  ok("keeping the month it was on", texts.includes("May"), texts.slice(0, 8).join("/"));
}

console.log("--- the controls demo, and the modifier the page nearly dropped ---");
{
  // The large step lives on SHIFT and is the least guessable thing the number
  // field measured. This page has two doors for keys — `key(k)` with one
  // argument, and `keyWith(k, shift, ctrl)` — and a handler on the wrong one
  // sees no modifier at all while every Node-side assertion still passes,
  // because those call the controller directly. That is the text field's
  // dropped coordinate exactly, so it is checked HERE, through a real keypress.
  await page.click('#demos input[value="controls"]');
  await page.waitForTimeout(250);

  const shown = () =>
    page.evaluate(() => JSON.parse(window.__lastList || '{"cmds":[]}').cmds
      .filter((c) => typeof c.text === "string").map((c) => c.text));
  const clickText = async (needle) => {
    const at = await page.evaluate((n) => {
      const c = JSON.parse(window.__lastList || "null");
      const k = c && c.cmds.find((x) => x.text === n);
      return k ? { x: k.x + k.w / 2, y: k.y + k.h / 2 } : null;
    }, needle);
    if (!at) return false;
    const r = await page.evaluate(() => {
      const b = document.querySelector("#stage canvas").getBoundingClientRect();
      return { x: b.x, y: b.y };
    });
    await page.mouse.click(r.x + at.x, r.y + at.y);
    await page.waitForTimeout(120);
    return true;
  };

  ok("the stepper is drawn", (await shown()).includes("Checkout"), (await shown()).join("/"));
  ok("and the bar starts empty", (await shown()).includes("0 of 4 steps done"), (await shown()).join("/"));

  // Two clicks on + : empty lands on the base, then one step.
  ok("the + button is on the page", await clickText("+"));
  await clickText("+");
  const afterTwo = await shown();
  ok("two presses give 1", afterTwo.includes("1"), afterTwo.join("/"));
  ok("and the step completed", afterTwo.includes("1 of 4 steps done"), afterTwo.join("/"));

  // Now the modifier, through a real keypress on the page.
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.up("Shift");
  await page.waitForTimeout(150);
  const afterShift = await shown();
  ok("Shift+ArrowUp reaches the field and jumps by ten", afterShift.includes("11"),
    afterShift.join("/"));

  // And the plain arrow still moves by one, so the modifier is being READ
  // rather than always assumed.
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(150);
  ok("a plain ArrowUp still moves by one", (await shown()).includes("12"),
    (await shown()).join("/"));
  // --- the sliders, through the page's own pointer -------------------------
  //
  // Four sliders drawn from a controller that has known how to be pressed,
  // dragged and arrowed since it was measured against Radix. The demo called
  // none of it and the page handed `press` an id with the x thrown away, so
  // every one of them was a picture: a press on a track returned false and
  // the values never moved. Making `position: absolute` parse put the thumbs
  // in the right PLACE, which is the version of this that looks fixed.
  //
  // Checked here rather than only offline because the offline check drives
  // `pressAt` directly, and what was missing was the page CALLING it — and
  // because a drag has three steps and only a real pointer has all three.
  const rails = () => page.evaluate(() => {
    const cmds = JSON.parse(window.__lastList || '{"cmds":[]}').cmds;
    // The rail and its filled range share an origin and a height; the colour
    // is what tells them apart, and a full range is 300 wide like the rail.
    const same = (c, rgb) => c.c && c.c[0] === rgb[0] && c.c[1] === rgb[1] && c.c[2] === rgb[2];
    const bars = cmds.filter((c) => Math.abs(c.h - 6) < 0.5);
    return bars.filter((c) => same(c, [244, 244, 245]))
      .map((rail) => {
        const fill = bars.find((b) => same(b, [10, 10, 10])
          && Math.abs(b.x - rail.x) < 0.5 && Math.abs(b.y - rail.y) < 0.5);
        return { x: rail.x, y: rail.y + rail.h / 2, w: rail.w, fill: fill ? fill.w : 0 };
      })
      .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  });
  const origin = await page.evaluate(() => {
    const b = document.querySelector("#stage canvas").getBoundingClientRect();
    return { x: b.x, y: b.y };
  });
  const storage = async () => (await rails())[0];

  const four = await rails();
  ok("four sliders are drawn", four.length === 4, JSON.stringify(four));
  // 5..35 at 12 is (12-5)/30 of 300.
  ok("storage starts where init put it", Math.round(four[0].fill) === 70,
    JSON.stringify(four[0]));

  // A press on the rail, at 80% of it: 5..35 at 80% is 29, so 240/300 filled.
  {
    const s = await storage();
    await page.mouse.click(origin.x + s.x + s.w * 0.8, origin.y + s.y);
    await page.waitForTimeout(150);
    const after = await storage();
    ok("a press on the rail moves the slider", Math.round(after.fill) === 240,
      JSON.stringify(after));
  }

  // A drag. Down at 80%, move to 20%, up — the three-step gesture, and the
  // only one of the three paths a click cannot exercise.
  {
    const s = await storage();
    await page.mouse.move(origin.x + s.x + s.w * 0.8, origin.y + s.y);
    await page.mouse.down();
    await page.mouse.move(origin.x + s.x + s.w * 0.5, origin.y + s.y, { steps: 4 });
    await page.waitForTimeout(120);
    const mid = await storage();
    ok("the value follows the pointer DURING the drag", Math.round(mid.fill) === 150,
      JSON.stringify(mid));
    // Off the track entirely, which is where a real finger goes: the slider
    // that was picked up keeps the gesture.
    await page.mouse.move(origin.x + s.x + s.w * 0.2, origin.y + s.y - 60, { steps: 4 });
    await page.waitForTimeout(120);
    const off = await storage();
    ok("and keeps following once the pointer leaves the track",
      Math.round(off.fill) === 60, JSON.stringify(off));
    await page.mouse.up();
    await page.waitForTimeout(120);
    // 5..35 at 20% is 11.
    const end = await storage();
    ok("the release leaves it where the drag ended", Math.round(end.fill) === 60,
      JSON.stringify(end));
    // And the gesture is over: moving again does nothing.
    await page.mouse.move(origin.x + s.x + s.w * 0.9, origin.y + s.y, { steps: 2 });
    await page.waitForTimeout(120);
    ok("a move after the release is not a drag",
      Math.round((await storage()).fill) === 60, JSON.stringify(await storage()));
  }

  // The keyboard, on the thumb the press focused. One step of 30 across 300px
  // is 10px of fill.
  {
    // Against the fill BEFORE the key, not against an absolute number: with
    // the page's wiring reverted this slider sits at 70 for the whole run,
    // and `=== 70` here would have passed while every other assertion in this
    // block failed. A gate that can pass for the wrong reason is not a gate.
    const before = Math.round((await storage()).fill);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    const after = Math.round((await storage()).fill);
    ok("ArrowRight moves the focused slider by exactly one step",
      after - before === 10, `${before} -> ${after}`);
    await page.keyboard.press("End");
    await page.waitForTimeout(150);
    ok("End fills it", Math.round((await storage()).fill) === 300,
      JSON.stringify(await storage()));
    await page.keyboard.press("Home");
    await page.waitForTimeout(150);
    ok("Home empties it", Math.round((await storage()).fill) === 0,
      JSON.stringify(await storage()));
  }

  // What a reader gets. The mirror is the tree a screen reader walks, and a
  // slider that moves on screen while the mirror says 12 is the defect
  // `a11yHasValue`/`a11yHasRange` were added for, reappearing on the page.
  {
    const spoken = await page.evaluate(() => {
      const el = document.querySelector('[data-a11y-id="cx-storage-thumb"]');
      return el ? [el.getAttribute("role"), el.getAttribute("aria-valuenow")].join("|") : "(absent)";
    });
    ok("the mirror reports the slider's new position", spoken === "slider|5", spoken);
  }
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

console.log("--- the dashboard has a second palette ---");
{
  // The theme radio, in a real page. What the node-level check cannot say is
  // that the control is wired to the demo at all: `dashboard-check.mjs` calls
  // `setTheme` itself.
  await page.click('#demos input[value="dashboard"]');
  await page.waitForTimeout(200);
  const shot = () => page.evaluate(() => {
    const l = JSON.parse(window.__lastList || "{}");
    return {
      bg: (l.cmds[0] || {}).c,
      speed: l.effect ? l.effect.speed : null,
      geom: (l.cmds || []).map((c) => [c.k, c.x, c.y, c.w, c.h, c.text || ""].join(",")).join("|"),
    };
  });
  const light = await shot();
  await page.click('#dashthemes input[value="marine"]');
  await page.waitForTimeout(200);
  const marine = await shot();
  ok("the page is repainted", JSON.stringify(marine.bg) === "[212,234,242,1]",
    JSON.stringify(marine.bg));
  ok("the theme reaches the surface effect", marine.speed === 320, String(marine.speed));
  // The whole claim of a theme in this engine: colours change, boxes do not.
  ok("and not one box moved", marine.geom === light.geom);
  await page.click('#dashthemes input[value="default"]');
  await page.waitForTimeout(200);
  const back = await shot();
  ok("and going back puts it all back",
    JSON.stringify(back.bg) === JSON.stringify(light.bg) && back.speed === light.speed &&
      back.geom === light.geom, JSON.stringify(back.bg));
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
  //
  // POLLED, NOT SAMPLED. This read `window.__lastStats` once, 80ms after the
  // drag, and `rippled` is a PER-FRAME flag: whether the last frame took the
  // post-pass, not whether any frame did. Whether that one read landed on a
  // rippled frame depended on where the animation clock happened to be, so the
  // assertion passed and failed on identical code — measured twice in a row,
  // once each way. A gate that answers differently to the same question is
  // worse than no gate, because it teaches everyone to re-run it.
  //
  // So: wait for the frame rather than guess at when it will be. Failure is
  // still a real failure — a second of frames with no post-pass among them
  // means the renderer never took it.
  let rippled = 0;
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => window.__lastStats || null);
    if (st && st.rippled === 1) { rippled = 1; break; }
    await page.waitForTimeout(25);
  }
  // The skip that used to hang off this — "the page does not publish renderer
  // stats" — went with the sampling: the poll above already distinguishes a
  // page that never reports from a page that reports zero, and both are the
  // same failure for a check whose whole subject is whether the post-pass ran.
  ok("the renderer took the post-pass", rippled === 1,
    "no frame in a second of them reported rippled=1");
}

await browser.close();
server.close();
console.log("");
// `failed=N` is the marker the aggregate runner greps for, and every other
// suite prints it. This one printed only prose, so the runner reported
// "no pass marker in output" on a run whose own last line said RESULT OK —
// a suite that cannot be told apart from a broken one is not in CI, whatever
// the list says.
if (failed > 0) {
  console.log(`RESULT FAIL — failed=${failed}`);
  process.exit(1);
}
console.log("RESULT OK — the page loads and every demo draws, failed=0");
