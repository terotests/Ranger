/**
 * Base UI's NumberField, asked what a number input actually does.
 *
 *   node gallery/ui/conformance/oracle/numberfield_oracle.mjs
 *
 * Writes `numberfield.json` beside this file. `NumberCtl.rgr` is built
 * against it and `numberfield_check.mjs` gates it; nothing reads the file at
 * run time.
 *
 * WHY BASE UI. The request was ReUI's Number Field, and reui.io is refused by
 * the egress proxy exactly as ui.shadcn.com is. Radix has no number field at
 * all, so there is no second reference to hold this one against — but shadcn's
 * `components/base/…` registry IS Base UI, and Base UI ships `number-field`.
 * That is the component a shadcn-family number input wraps, so it is the
 * oracle.
 *
 * THIS ALSO CORRECTS THE PLAN. `PLAN_INPUTS.md` says the P2 NumberCtl step has
 * no oracle available. That was written before the Base UI registry was
 * installed for the Switch work, and it is now wrong: this file is the oracle
 * it says does not exist.
 *
 * WHAT IS WORTH ASKING. A number field looks like a text box with two buttons
 * and is a nest of decisions, every one of which an implementation guesses:
 *
 *   THE STEP AND ITS LARGE COUSIN. ArrowUp moves by `step`; PageUp moves by
 *   something else, and whether that something is 10 * step or its own prop is
 *   not guessable.
 *   WHAT HOME AND END DO. Jump to min and max, or nothing at all.
 *   THE BOUNDARIES. What happens at min when you press down — clamp, refuse,
 *   or wrap — and whether the button goes disabled.
 *   TYPING NONSENSE. What the field holds after "abc", and WHEN it is
 *   reconciled: on every keystroke, or on blur.
 *   THE ROLE. A spinbutton reports aria-valuenow; a plain textbox does not,
 *   and which one this is decides what a reader hears.
 *   AN EMPTY FIELD. Not zero — the value is absent, and an implementation
 *   with no null stores 0 and lies.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");

const APP = `
import * as React from "react";
import { createRoot } from "react-dom/client";
import { NumberField } from "@base-ui/react/number-field";

function One(props) {
  return React.createElement("div", { "data-t": props.t },
    React.createElement(NumberField.Root, props.root,
      React.createElement(NumberField.Group, null,
        React.createElement(NumberField.Decrement, { "data-dec": "1" }, "-"),
        React.createElement(NumberField.Input, { "data-in": "1" }),
        React.createElement(NumberField.Increment, { "data-inc": "1" }, "+"))));
}

function App() {
  return React.createElement("div", null,
    // The plain one: no bounds, default step.
    React.createElement(One, { t: "plain", root: { defaultValue: 5 } }),
    // Bounded, so the edges are reachable.
    React.createElement(One, { t: "bounded", root: { defaultValue: 5, min: 0, max: 10 } }),
    // A step that is not 1, to tell "step" apart from "one".
    React.createElement(One, { t: "stepped", root: { defaultValue: 0, step: 0.25 } }),
    // A large step declared explicitly, to see whether PageUp uses it.
    React.createElement(One, { t: "large", root: { defaultValue: 0, step: 2, largeStep: 20 } }),
    // Empty to begin with: the value is ABSENT, not zero.
    React.createElement(One, { t: "empty", root: {} }),
    // A range that ALLOWS negatives, so "typing -99 into a min:0 field" and
    // "typing a negative at all" are two separate questions. Without this the
    // capture had one number standing for both.
    React.createElement(One, { t: "signed", root: { defaultValue: 0, min: -100, max: 100 } }),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

const READ = `(t) => {
  const host = document.querySelector('[data-t="' + t + '"]');
  if (!host) return null;
  const input = host.querySelector("[data-in]");
  const inc = host.querySelector("[data-inc]");
  const dec = host.querySelector("[data-dec]");
  const attrs = {};
  for (const a of input.attributes) attrs[a.name] = a.value;
  return {
    value: input.value,
    role: input.getAttribute("role"),
    valueNow: input.getAttribute("aria-valuenow"),
    valueMin: input.getAttribute("aria-valuemin"),
    valueMax: input.getAttribute("aria-valuemax"),
    valueText: input.getAttribute("aria-valuetext"),
    inputMode: input.getAttribute("inputmode"),
    type: input.getAttribute("type"),
    // The VALUE, not the presence. Base UI writes aria-disabled="false" on an
    // enabled button, so hasAttribute reported every button disabled — the
    // same truthiness trap aria-readonly hit earlier in this directory.
    incDisabled: inc.disabled === true || inc.getAttribute("aria-disabled") === "true",
    decDisabled: dec.disabled === true || dec.getAttribute("aria-disabled") === "true",
    incAriaDisabled: inc.getAttribute("aria-disabled"),
    decAriaDisabled: dec.getAttribute("aria-disabled"),
    attrs,
  };
}`;

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".nf-probe.jsx");
const bundle = path.join(HERE, ".nf-probe.js");
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
const pageFile = path.join(HERE, ".nf-probe.html");
fs.writeFileSync(
  pageFile,
  `<!doctype html><meta charset="utf-8">` +
    // Headless again: an unstyled button has no size and Playwright refuses to
    // click a zero-pixel element. The box is the consumer's job; none of this
    // appearance is captured.
    `<style>
       [data-t] { margin: 8px; }
       [data-in] { width: 90px; height: 24px; }
       [data-inc], [data-dec] { width: 24px; height: 24px; }
     </style>` +
    `<div id="root"></div><script src="./.nf-probe.js"></script>`,
);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(200);

const read = (t) => page.evaluate(`(${READ})(${JSON.stringify(t)})`);
const input = (t) => `[data-t="${t}"] [data-in]`;
const press = async (t, key, times) => {
  await page.click(input(t));
  for (let i = 0; i < (times || 1); i++) await page.press(input(t), key);
  await page.waitForTimeout(60);
};
// A fresh read after re-typing a known starting value, so each probe is
// independent of the one before it — an earlier oracle in this directory
// walked a component into a state and then blamed the component for the
// answers it got there.
const reset = async (t, text) => {
  await page.click(input(t));
  await page.press(input(t), "ControlOrMeta+a");
  await page.type(input(t), text);
  await page.press(input(t), "Tab");
  await page.waitForTimeout(60);
};

const shape = {
  plain: await read("plain"),
  bounded: await read("bounded"),
  stepped: await read("stepped"),
  large: await read("large"),
  empty: await read("empty"),
  signed: await read("signed"),
};

const keys = {};
// The step, and the large step. Both from a known start, both read back as
// the input's own value.
await reset("plain", "5");
await press("plain", "ArrowUp");
keys.arrowUp = (await read("plain")).value;
// RESET FIRST. This probe used to run straight on from the ArrowUp above, so
// "arrowDownTwice" was measured from 6 and recorded 4 under a name that says
// 5. The number was right for what was done and wrong for what it was called,
// which is worse than no measurement — the gate compared its own correct 3
// against it and failed.
await reset("plain", "5");
await press("plain", "ArrowDown", 2);
keys.arrowDownTwice = (await read("plain")).value;
await reset("plain", "5");
await press("plain", "PageUp");
keys.pageUp = (await read("plain")).value;
await reset("plain", "5");
await press("plain", "PageDown");
keys.pageDown = (await read("plain")).value;

await reset("stepped", "0");
await press("stepped", "ArrowUp");
keys.steppedArrowUp = (await read("stepped")).value;
await reset("stepped", "0");
await press("stepped", "PageUp");
keys.steppedPageUp = (await read("stepped")).value;

await reset("large", "0");
await press("large", "ArrowUp");
keys.largeArrowUp = (await read("large")).value;
await reset("large", "0");
await press("large", "PageUp");
keys.largePageUp = (await read("large")).value;
// PageUp moved nothing, even with largeStep declared — so the large step is
// somewhere else. Recording an absence without looking for the feature would
// have left "Base UI has no large step" in the file, which is a claim this
// capture is in a position to check.
await reset("large", "0");
await page.click(input("large"));
await page.press(input("large"), "Shift+ArrowUp");
await page.waitForTimeout(60);
keys.largeShiftArrowUp = (await read("large")).value;
await reset("plain", "5");
await page.click(input("plain"));
await page.press(input("plain"), "Shift+ArrowUp");
await page.waitForTimeout(60);
keys.shiftArrowUp = (await read("plain")).value;
await reset("stepped", "0");
await page.click(input("stepped"));
await page.press(input("stepped"), "Shift+ArrowUp");
await page.waitForTimeout(60);
keys.steppedShiftArrowUp = (await read("stepped")).value;

// Home and End: min and max, or nothing.
await reset("bounded", "5");
await press("bounded", "Home");
keys.home = (await read("bounded")).value;
await reset("bounded", "5");
await press("bounded", "End");
keys.end = (await read("bounded")).value;

const bounds = {};
// Walking off the bottom, and off the top.
await reset("bounded", "1");
await press("bounded", "ArrowDown", 3);
bounds.belowMin = await read("bounded");
await reset("bounded", "9");
await press("bounded", "ArrowUp", 3);
bounds.aboveMax = await read("bounded");
// And what a typed out-of-range number does — the same question, asked the
// other way, because a field may clamp a step and not a keystroke.
await reset("bounded", "99");
bounds.typedOver = await read("bounded");
await reset("bounded", "-99");
// Reads 10, not 0 — the minus is REJECTED by a field whose min is 0, because
// no in-range number starts with one, so what is left is 99 and that clamps
// to the max. Two behaviours in one number, which is why the signed field
// below exists to separate them.
bounds.typedUnderIntoUnsigned = await read("bounded");
await reset("signed", "-99");
bounds.typedNegativeIntoSigned = await read("signed");
await reset("signed", "-999");
bounds.typedBelowSignedMin = await read("signed");

const typing = {};
// Nonsense, and WHEN it is reconciled. Read once with focus still in the
// field and once after blur, because those are different answers.
await page.click(input("plain"));
await page.press(input("plain"), "ControlOrMeta+a");
await page.type(input("plain"), "abc");
await page.waitForTimeout(60);
typing.lettersWhileFocused = (await read("plain")).value;
await page.press(input("plain"), "Tab");
await page.waitForTimeout(60);
typing.lettersAfterBlur = (await read("plain")).value;

await page.click(input("plain"));
await page.press(input("plain"), "ControlOrMeta+a");
await page.type(input("plain"), "12abc34");
await page.waitForTimeout(60);
typing.mixedWhileFocused = (await read("plain")).value;
await page.press(input("plain"), "Tab");
await page.waitForTimeout(60);
typing.mixedAfterBlur = (await read("plain")).value;

await reset("plain", "-4.5");
typing.negativeDecimal = (await read("plain")).value;
await reset("plain", "1e3");
typing.exponent = (await read("plain")).value;

// The empty field, which is not zero.
await page.click(input("empty"));
await page.press(input("empty"), "ControlOrMeta+a");
await page.press(input("empty"), "Delete");
await page.press(input("empty"), "Tab");
await page.waitForTimeout(60);
typing.emptied = await read("empty");

const version = JSON.parse(
  fs.readFileSync(path.join(DOM_DIR, "node_modules", "@base-ui/react", "package.json"), "utf8"),
).version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.unlinkSync(f);

const FINDINGS = {
  itIsNotASpinbutton: {
    what:
      "See `shape.plain.role` and `shape.plain.valueNow`. Whichever they are, " +
      "they decide what a reader hears — a spinbutton announces a value and a " +
      "range, a textbox announces its text.",
    consequence:
      "NumberCtl publishes what was measured rather than what WAI-ARIA's " +
      "spinbutton pattern would suggest. The pattern is a recommendation; the " +
      "reference is what shadcn actually ships.",
  },
  theLargeStep: {
    what:
      "`keys.pageUp` against `keys.arrowUp` on a default field, and " +
      "`keys.largePageUp` on one with an explicit largeStep, say what PageUp " +
      "means and whether it is a multiple of step or its own number.",
    consequence:
      "'PageUp is ten steps' is the plausible guess. Whether it is right is " +
      "in the capture rather than in this sentence.",
  },
  whenTypingIsReconciled: {
    what:
      "`typing.lettersWhileFocused` against `typing.lettersAfterBlur`: a " +
      "number field may leave whatever was typed in place while it has focus " +
      "and only parse it on blur.",
    consequence:
      "The difference between those two is the whole editing model. A field " +
      "that reconciles on every keystroke cannot be typed into — '-' and '1e' " +
      "are both invalid prefixes of valid numbers — so the blur-time answer " +
      "is the one an implementation has to copy.",
  },
  emptyIsNotZero: {
    what: "`typing.emptied` is the field after its contents are deleted.",
    consequence:
      "Ranger has no null, so NumberCtl carries `hasValue` beside `value` — " +
      "the same shape ProgressCtl needed for the same reason. Storing 0 for " +
      "'nothing typed' reports a number the person never entered.",
  },
};

const file = path.join(HERE, "numberfield.json");
fs.writeFileSync(
  file,
  JSON.stringify(
    {
      note:
        "Captured by numberfield_oracle.mjs from a rendered " +
        "@base-ui/react/number-field. Radix has no number field, so there is " +
        "no second reference here — unlike the progress bar, this is a single " +
        "oracle and says so.",
      library: `@base-ui/react@${version}`,
      shape,
      keys,
      bounds,
      typing,
      FINDINGS,
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${path.relative(process.cwd(), file)}`);
