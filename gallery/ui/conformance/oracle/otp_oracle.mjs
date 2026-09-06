#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// input-otp — the library behind shadcn's Input OTP — asked what a one-time
// code field does.
//
//   node gallery/ui/conformance/oracle/otp_oracle.mjs
//
// Writes `otp.json` beside this file. `OtpCtl.rgr` is built against it and
// `otp_check.mjs` gates it; nothing reads the file at run time.
//
// WHY THIS LIBRARY. shadcn's `input-otp` component is a thin styled wrapper
// around guilhermerodz/input-otp: ONE hidden `<input>` laid over a row of drawn
// slots, with the slots rendered from the input's value and selection. The
// slot that is "active" is the one the selection covers, and the whole
// behaviour — which slot lights up after a click, what Backspace deletes, where
// a paste goes — is the browser's text input plus input-otp's normalisation of
// the selection. That is what has to be reproduced, and none of it is
// guessable.
//
// WHAT IS WORTH ASKING:
//
//   WHERE FOCUS LANDS on Tab in — the first empty slot, or the last filled one.
//   WHAT A CLICK ON A FILLED SLOT SELECTS, and what typing there does: insert
//   or replace.
//   A CLICK ON AN EMPTY SLOT far past the value.
//   ARROWS: a range of one, moving; what happens at the ends.
//   BACKSPACE on the end, on a selected middle slot, on nothing.
//   DELETE.
//   THE SEVENTH DIGIT of a six-digit code.
//   A LETTER into a digits-only field — refused, or the whole change refused.
//   PASTE: a full code into an empty field, a code into a half-filled one, a
//   code with punctuation in it, a code that is too long.
//   CTRL+A then a digit; Ctrl+A then Backspace.
//   WHEN `onComplete` FIRES, and how many times.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");
const OUT = path.join(HERE, "otp.json");

const APP = `
import * as React from "react";
import { createRoot } from "react-dom/client";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";

window.__complete = {};
window.__setters = {};

function Field({ t, maxLength, pattern }) {
  const [value, setValue] = React.useState("");
  window.__setters[t] = setValue;
  return React.createElement("div", { "data-t": t },
    React.createElement(OTPInput, {
      maxLength, pattern, value,
      onChange: setValue,
      onComplete: () => { window.__complete[t] = (window.__complete[t] || 0) + 1; },
      // shadcn's InputOTPSlot: a box per slot with data-active, the char, and
      // a fake caret when the slot is active and empty.
      render: ({ slots }) => React.createElement("div", { className: "row" },
        slots.map((s, i) => React.createElement("div", {
          key: i, className: "slot", "data-slot": i,
          "data-active": s.isActive ? "true" : "false",
          "data-char": s.char === null ? "" : s.char,
          "data-caret": s.hasFakeCaret ? "true" : "false",
        }, s.char))),
    }));
}

function App() {
  return React.createElement("div", null,
    React.createElement("button", { id: "before" }, "before"),
    React.createElement(Field, { t: "digits", maxLength: 6, pattern: REGEXP_ONLY_DIGITS }),
    React.createElement("button", { id: "after" }, "after"),
    React.createElement(Field, { t: "free", maxLength: 4 }),
    React.createElement("textarea", { id: "clip" }),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

const READ = `(t) => {
  const host = document.querySelector('[data-t="' + t + '"]');
  const input = host.querySelector("input");
  const slots = Array.from(host.querySelectorAll("[data-slot]"));
  const focused = document.activeElement === input;
  return {
    value: input.value,
    selStart: focused ? input.selectionStart : null,
    selEnd: focused ? input.selectionEnd : null,
    focused,
    active: slots.map((s, i) => s.dataset.active === "true" ? i : -1).filter((i) => i >= 0),
    caret: slots.map((s, i) => s.dataset.caret === "true" ? i : -1).filter((i) => i >= 0),
    chars: slots.map((s) => s.dataset.char),
    complete: window.__complete[t] || 0,
    activeId: document.activeElement && document.activeElement.id || "",
  };
}`;

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".otp-probe.jsx");
const bundle = path.join(HERE, ".otp-probe.js");
fs.writeFileSync(entry, APP);
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  outfile: bundle,
  loader: { ".jsx": "jsx" },
  format: "iife",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(DOM_DIR, "node_modules")],
  logLevel: "silent",
});
const pageFile = path.join(HERE, ".otp-probe.html");
fs.writeFileSync(
  pageFile,
  `<!doctype html><meta charset="utf-8">` +
    // shadcn's slot is h-9 w-9 (36px) with a 14px font; what is drawn is not
    // captured, but the slot WIDTH decides which character a click lands on,
    // so it is shadcn's.
    `<style>
       body { font: 14px Arial; margin: 16px; }
       [data-t] { margin: 12px 0; width: max-content; }
       .row { display: flex; }
       .slot { width: 36px; height: 36px; border: 1px solid #888; display: flex; align-items: center; justify-content: center; }
       #clip { display: block; margin-top: 12px; }
     </style>` +
    `<div id="root"></div><script src="./.otp-probe.js"></script>`,
);

const browser = await chromium.launch({ executablePath: findChromium() });
const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(200);

const read = (t) => page.evaluate(`(${READ})(${JSON.stringify(t)})`);
const settle = () => page.waitForTimeout(80);

// A real pointer at the slot's centre. `page.click` on the slot refuses,
// correctly: the hidden input lies over every slot and takes the event — which
// is exactly how the library works, so the click goes to the coordinates.
async function clickSlot(t, i) {
  const box = await page.locator(`[data-t="${t}"] [data-slot="${i}"]`).boundingBox();
  await page.mouse.click(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
}

// Start over: a value (or none), the completion counter zeroed, and the
// keyboard on the button before the field — every scenario then says how it
// gets in (Tab, or a click on a slot).
async function start(t, value) {
  await page.evaluate(([t, v]) => {
    window.__setters[t](v || "");
    window.__complete[t] = 0;
    document.querySelector("#before").focus();
  }, [t, value]);
  await settle();
}

// The text to paste goes through the platform clipboard: typed into a
// textarea, copied from it, so Ctrl+V in the field is a real paste.
async function loadClipboard(text) {
  await page.click("#clip");
  await page.fill("#clip", text);
  await page.press("#clip", "ControlOrMeta+a");
  await page.press("#clip", "ControlOrMeta+c");
  await settle();
}

const order = [];
const scenarios = {};
async function scenario(name, t, value, steps) {
  await start(t, value);
  const rec = { field: t, start: { value: value || "", ...(await read(t)) }, steps: [] };
  for (const step of steps) {
    if (step.type) await page.keyboard.type(step.type);
    else if (step.click !== undefined) await clickSlot(t, step.click);
    else if (step.paste !== undefined) {
      await loadClipboard(step.paste);
      // Back to where the field's focus was: the clipboard load moved it.
      if (step.via === "tab") { await page.evaluate(() => document.querySelector("#before").focus()); await page.keyboard.press("Tab"); }
      else await clickSlot(t, step.via);
      await settle();
      await page.keyboard.press("ControlOrMeta+v");
    } else await page.keyboard.press(step.key);
    await settle();
    rec.steps.push({ ...step, ...(await read(t)) });
  }
  scenarios[name] = rec;
  order.push(name);
}

const K = (k) => ({ key: k });
const T = (s) => ({ type: s });
const C = (i) => ({ click: i });
const P = (text, via) => ({ paste: text, via });

await scenario("tab_in_empty", "digits", "", [K("Tab")]);
await scenario("tab_in_partial", "digits", "123", [K("Tab")]);
await scenario("tab_in_full", "digits", "123456", [K("Tab")]);
await scenario("type_seven", "digits", "", [K("Tab"), T("1"), T("2"), T("3"), T("4"), T("5"), T("6"), T("7")]);
await scenario("backspace_from_end", "digits", "123456", [K("Tab"), K("Backspace"), K("Backspace"), K("Backspace")]);
await scenario("backspace_partial", "digits", "123", [K("Tab"), K("Backspace"), K("Backspace"), K("Backspace"), K("Backspace")]);
await scenario("click_filled_middle", "digits", "123456", [C(2), T("9"), K("Backspace"), K("Backspace")]);
await scenario("click_first", "digits", "123456", [C(0), T("7")]);
await scenario("click_last", "digits", "123456", [C(5), T("8")]);
await scenario("click_partial_middle", "digits", "123", [C(0), T("7"), T("8")]);
await scenario("click_empty_slot", "digits", "12", [C(4), T("3")]);
await scenario("click_empty_field", "digits", "", [C(3), T("4")]);
await scenario("arrows_full", "digits", "123456", [K("Tab"), K("ArrowLeft"), K("ArrowLeft"), K("ArrowRight"), K("ArrowRight"), K("ArrowRight"), K("Home"), K("End")]);
await scenario("arrows_partial", "digits", "123", [K("Tab"), K("ArrowLeft"), K("ArrowLeft"), K("ArrowRight"), K("ArrowRight"), K("ArrowRight")]);
await scenario("arrows_empty", "digits", "", [K("Tab"), K("ArrowLeft"), K("ArrowRight")]);
await scenario("arrow_then_type", "digits", "123", [K("Tab"), K("ArrowLeft"), T("9")]);
await scenario("letters_into_digits", "digits", "12", [K("Tab"), T("a"), T("3"), T("-"), T("4")]);
await scenario("delete_key", "digits", "123456", [C(1), K("Delete"), K("Delete")]);
await scenario("delete_at_end", "digits", "123", [K("Tab"), K("Delete")]);
await scenario("select_all_type", "digits", "123456", [K("Tab"), K("ControlOrMeta+a"), T("5")]);
await scenario("select_all_backspace", "digits", "123", [K("Tab"), K("ControlOrMeta+a"), K("Backspace")]);
await scenario("paste_full", "digits", "", [P("123456", "tab")]);
await scenario("paste_into_partial", "digits", "12", [P("9876", "tab")]);
await scenario("paste_with_junk", "digits", "", [P("12-34", "tab")]);
await scenario("paste_long", "digits", "", [P("12345678", "tab")]);
await scenario("paste_over_selection", "digits", "123456", [P("00", 2)]);
await scenario("tab_out", "digits", "123", [K("Tab"), K("Tab")]);
await scenario("shift_tab_out", "digits", "123", [K("Tab"), K("Shift+Tab")]);
await scenario("complete_count", "digits", "12345", [K("Tab"), T("6"), K("Backspace"), T("7")]);
await scenario("type_after_home", "digits", "123456", [K("Tab"), K("Home"), T("9"), T("8")]);
await scenario("delete_middle", "digits", "123456", [K("Tab"), K("ArrowLeft"), K("ArrowLeft"), K("Delete"), K("Delete")]);
await scenario("backspace_middle", "digits", "123456", [K("Tab"), K("Home"), K("ArrowRight"), K("Backspace"), K("Backspace")]);
// A click while the field ALREADY has focus: the focus handler does not run,
// so the browser's own caret placement is what the selection handler sees.
await scenario("click_while_focused", "digits", "123456", [K("Tab"), C(1), C(4), C(0)]);
await scenario("click_while_focused_partial", "digits", "123", [K("Tab"), C(0), C(5)]);
await scenario("free_letters", "free", "", [C(0), T("a"), T("B"), T("1"), T("-"), T("x")]);

const attrs = await page.evaluate(() => {
  const input = document.querySelector('[data-t="digits"] input');
  const out = {};
  for (const a of input.attributes) if (!a.name.startsWith("style")) out[a.name] = a.value;
  return out;
});
const version = browser.version();
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.rmSync(f, { force: true });

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      note:
        "Captured by otp_oracle.mjs from input-otp (the library behind shadcn's Input OTP) rendered with shadcn-shaped slots in Chromium. `digits` is maxLength 6 with REGEXP_ONLY_DIGITS; `free` is maxLength 4 with no pattern. After every step: the hidden input's value and selection (null when it is not focused), the slots marked active and the one with the fake caret, each slot's character, and how many times onComplete has fired since the scenario began. A click step clicks the centre of slot N; a paste step loads the platform clipboard, re-enters the field the way `via` says (\"tab\" or a slot index), and presses Ctrl+V.",
      library: "input-otp " + JSON.parse(fs.readFileSync(path.join(DOM_DIR, "node_modules", "input-otp", "package.json"), "utf8")).version,
      browser: "Chromium " + version,
      inputAttrs: attrs,
      order,
      scenarios,
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${order.length} scenarios`);
