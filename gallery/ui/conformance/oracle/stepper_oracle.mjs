/**
 * The two shapes a stepper could be, put side by side in a browser.
 *
 *   node gallery/ui/conformance/oracle/stepper_oracle.mjs
 *
 * Writes `stepper.json` beside this file. `StepperCtl.rgr` is built against
 * the choice this records and `stepper_check.mjs` gates it.
 *
 * THERE IS NO STEPPER TO MEASURE. reui.io is refused by the egress proxy, and
 * unlike the progress bar and the number field there is no near-equivalent to
 * borrow: none of the three registries shadcn ships over has a stepper
 * primitive — not Radix, not Base UI, not React Aria — and WAI-ARIA has no
 * stepper role. So the FLOW is specified, exactly as the questionnaire's was,
 * and this file does not pretend otherwise.
 *
 * WHAT IS MEASURABLE IS THE DECISION. A stepper is built one of two ways, and
 * which one is not a naming preference — the two publish different things to a
 * reader and answer keys differently:
 *
 *   AS A TABLIST. `role="tablist"` with `role="tab"` items, roving tabindex,
 *   `aria-selected`, arrow keys moving between them. Radix Tabs is installed
 *   and already measured in `behaviours.json` (eight behaviours), so this
 *   captures what it publishes rather than re-deriving it.
 *
 *   AS AN ORDERED LIST with `aria-current="step"`. No roving focus, no
 *   selection, one item marked as the one you are on.
 *
 * The capture below renders both and reads what each says. The difference is
 * the argument: a TAB IS FREELY SELECTABLE and a STEP IS NOT. A tablist whose
 * items refuse to activate is a tablist that lies — a reader is told it can
 * arrow to tab four and finds nothing happens. `aria-current="step"` is the
 * token ARIA has for exactly this, and StepperCtl uses it.
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
import * as Tabs from "@radix-ui/react-tabs";

const STEPS = ["Account", "Address", "Payment", "Review"];

function App() {
  return React.createElement("div", null,
    // Shape one: a tablist. What Radix publishes, so the comparison is against
    // a real implementation rather than hand-written markup pretending to be
    // one.
    React.createElement("div", { "data-t": "tabs" },
      React.createElement(Tabs.Root, { defaultValue: "s1" },
        React.createElement(Tabs.List, null,
          ...STEPS.map((s, i) =>
            React.createElement(Tabs.Trigger, { key: s, value: "s" + (i + 1) }, s))),
        ...STEPS.map((s, i) =>
          React.createElement(Tabs.Content, { key: s, value: "s" + (i + 1) }, s + " panel")))),
    // Shape two: an ordered list, with the step you are on marked. Plain
    // markup because there is no library that ships this — which is itself
    // the finding.
    React.createElement("ol", { "data-t": "current" },
      ...STEPS.map((s, i) =>
        React.createElement("li", {
          key: s,
          "aria-current": i === 1 ? "step" : undefined,
        }, s))),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

const READ = `(t) => {
  const host = document.querySelector('[data-t="' + t + '"]');
  if (!host) return null;
  const all = [...host.querySelectorAll("*")].filter((e) => e.textContent && e.children.length === 0);
  return {
    hostRole: host.getAttribute("role") || host.tagName.toLowerCase(),
    items: all.slice(0, 8).map((e) => {
      const a = {};
      for (const at of e.attributes) a[at.name] = at.value;
      return {
        tag: e.tagName.toLowerCase(),
        text: e.textContent,
        role: e.getAttribute("role"),
        selected: e.getAttribute("aria-selected"),
        current: e.getAttribute("aria-current"),
        tabIndex: e.tabIndex,
        attrs: a,
      };
    }),
  };
}`;

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".step-probe.jsx");
const bundle = path.join(HERE, ".step-probe.js");
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
const pageFile = path.join(HERE, ".step-probe.html");
fs.writeFileSync(pageFile,
  `<!doctype html><meta charset="utf-8"><style>body{margin:16px;font:14px system-ui}` +
  `[role=tab],li{padding:4px 8px}</style>` +
  `<div id="root"></div><script src="./.step-probe.js"></script>`);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(200);

const read = (t) => page.evaluate(`(${READ})(${JSON.stringify(t)})`);
const tabs = await read("tabs");
const current = await read("current");

// What arrow keys do in a tablist — the behaviour a stepper would inherit and
// must not, because a step you cannot enter is not somewhere to arrow to.
const tabKeys = {};
await page.click('[data-t="tabs"] [role="tab"]');
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(60);
tabKeys.afterArrowRight = await page.evaluate(
  `document.querySelector('[data-t="tabs"] [aria-selected="true"]').textContent`);
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(60);
tabKeys.afterThreeMoreArrows = await page.evaluate(
  `document.querySelector('[data-t="tabs"] [aria-selected="true"]').textContent`);
tabKeys.note =
  "A tablist activates as it moves and WRAPS. Four steps and four presses " +
  "from the first lands back on the first — which is the behaviour a stepper " +
  "must not have: arrowing past the last step into the first is not a thing " +
  "that can happen to a person filling in a form.";

const version = JSON.parse(fs.readFileSync(
  path.join(DOM_DIR, "node_modules", "@radix-ui", "react-tabs", "package.json"), "utf8")).version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.unlinkSync(f);

const FINDINGS = {
  noStepperExists: {
    what:
      "None of the three registries shadcn ships over has a stepper: not " +
      "Radix, not Base UI, not React Aria. WAI-ARIA has no stepper role " +
      "either. reui.io, which does have one, is refused by the proxy.",
    consequence:
      "The FLOW below is SPECIFIED, like the questionnaire's, and nothing " +
      "here is dressed up as measured. What IS measured is the difference " +
      "between the two shapes a stepper could take.",
  },
  aTabIsFreelySelectableAndAStepIsNot: {
    what:
      "The tablist capture shows roving tabindex and aria-selected, and " +
      "`tabKeys` shows arrow movement ACTIVATING as it goes and WRAPPING " +
      "from the last item back to the first.",
    consequence:
      "That is the wrong promise for a stepper. A reader told it can arrow " +
      "to step four finds either that nothing happens — a tablist that lies " +
      "— or that it has skipped the two steps in between. StepperCtl is an " +
      "ordered LIST with aria-current='step', which is the token ARIA has " +
      "for exactly this, and its arrows do not wrap.",
  },
  ariaCurrentTakesTheStepToken: {
    what:
      "The `current` capture is a plain <ol>: no role override, no " +
      "tabindex, one item carrying aria-current='step'. No library ships " +
      "it, which is why it is hand-written here.",
    consequence:
      "`UiRow.current` is already a free-form string — the breadcrumb puts " +
      "'page' in it — so this needed no new plumbing on either the " +
      "controller or the element path. That is the tell that it is the right " +
      "shape: it is the same claim a breadcrumb makes, about a different " +
      "kind of sequence.",
  },
};

const file = path.join(HERE, "stepper.json");
fs.writeFileSync(file, JSON.stringify({
  note:
    "Captured by stepper_oracle.mjs. There is NO stepper reference to " +
    "measure — see FINDINGS.noStepperExists. What is captured is the two " +
    "shapes a stepper could take, so the choice between them is made against " +
    "data rather than taste.",
  library: `@radix-ui/react-tabs@${version}`,
  tabs,
  current,
  tabKeys,
  FINDINGS,
}, null, 2) + "\n");
console.log(`wrote ${path.relative(process.cwd(), file)}`);
