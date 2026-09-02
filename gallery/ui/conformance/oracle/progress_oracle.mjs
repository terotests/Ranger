/**
 * A progress bar, asked of BOTH references at once.
 *
 *   node gallery/ui/conformance/oracle/progress_oracle.mjs
 *
 * Writes `progress.json` beside this file. `ProgressCtl.rgr` is built against
 * it and `progress_check.mjs` gates it; nothing reads the file at run time.
 *
 * The request was ReUI's Progress, and reui.io is refused by the egress proxy
 * exactly as ui.shadcn.com is. Unlike the event calendar, that costs almost
 * nothing here: a progress bar is one of the few components that is genuinely
 * SETTLED, and the two libraries shadcn actually ships over — Radix in
 * `components/…` and Base UI in `components/base/…` — are both installed.
 * So this asks them the same questions side by side, and where they disagree
 * the disagreement is the finding rather than something to average away.
 *
 * WHAT IS WORTH ASKING. A progress bar looks like the most trivial component
 * there is, and it has exactly one hard part, which is what happens when
 * there is no number:
 *
 *   INDETERMINATE. `value={null}` is a real state — the work has started and
 *   nobody knows how far. WAI-ARIA says a progressbar with no `aria-valuenow`
 *   is indeterminate, and a reader announces "busy" rather than a percentage.
 *   An implementation that stores 0 for "unknown" says "0 percent", which is
 *   a different and wrong claim.
 *
 * And three more where an implementation guesses:
 *
 *   CLAMPING. What comes out for a value above max, below zero, or fractional.
 *   THE INDICATOR. How far along the fill is drawn, and in what units.
 *   THE STATE ATTRIBUTE. Radix publishes `data-state`; whether Base UI does,
 *   and whether the two agree about the word for "finished", is measurable
 *   and is the sort of thing a theme hangs off.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");

// The values worth asking about. Each is a place an implementation decides
// something rather than a place it copies a number through.
const VALUES = [
  { key: "zero", value: 0 },
  { key: "part", value: 40 },
  { key: "full", value: 100 },
  { key: "over", value: 140 },
  { key: "under", value: -20 },
  { key: "fraction", value: 33.333 },
  { key: "indeterminate", value: null },
];

const APP = `
import * as React from "react";
import { createRoot } from "react-dom/client";
import * as RadixProgress from "@radix-ui/react-progress";
import { Progress as BaseProgress } from "@base-ui/react/progress";

const VALUES = ${JSON.stringify(VALUES)};

function App() {
  return React.createElement("div", null,
    // Radix. value={null} is how it is told "indeterminate"; the prop is
    // omitted entirely rather than passed as null, because those are
    // different things to React and only one of them is the documented way.
    ...VALUES.map((v) =>
      React.createElement("div", { key: "r-" + v.key, "data-t": "radix-" + v.key },
        React.createElement(RadixProgress.Root,
          v.value === null ? { max: 100 } : { value: v.value, max: 100 },
          React.createElement(RadixProgress.Indicator, { "data-ind": "1" })))),
    // Base UI, asked the same list.
    ...VALUES.map((v) =>
      React.createElement("div", { key: "b-" + v.key, "data-t": "base-" + v.key },
        React.createElement(BaseProgress.Root,
          v.value === null ? { value: null, max: 100 } : { value: v.value, max: 100 },
          React.createElement(BaseProgress.Track, null,
            React.createElement(BaseProgress.Indicator, { "data-ind": "1" }))))),
    // A non-default range on both, because "max is always 100" is an
    // assumption an implementation makes and a caller breaks.
    React.createElement("div", { "data-t": "radix-range" },
      React.createElement(RadixProgress.Root, { value: 3, max: 8 },
        React.createElement(RadixProgress.Indicator, { "data-ind": "1" }))),
    React.createElement("div", { "data-t": "base-range" },
      React.createElement(BaseProgress.Root, { value: 3, max: 8 },
        React.createElement(BaseProgress.Track, null,
          React.createElement(BaseProgress.Indicator, { "data-ind": "1" })))),
    // And a labelled one: what a reader is told INSTEAD of the number.
    React.createElement("div", { "data-t": "radix-label" },
      React.createElement(RadixProgress.Root, {
        value: 40, max: 100, getValueLabel: (v, m) => v + " of " + m + " files",
      }, React.createElement(RadixProgress.Indicator, { "data-ind": "1" }))),
    React.createElement("div", { "data-t": "base-label" },
      React.createElement(BaseProgress.Root, {
        value: 40, max: 100, getAriaValueText: (f, v) => v + " of 100 files",
      }, React.createElement(BaseProgress.Track, null,
        React.createElement(BaseProgress.Indicator, { "data-ind": "1" })))),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

// Everything the DOM says about one bar, plus where its fill actually ends.
const READ = `(sel) => {
  const host = document.querySelector(sel);
  if (!host) return null;
  const el = host.querySelector('[role="progressbar"]') || host.firstElementChild;
  if (!el) return null;
  const ind = host.querySelector("[data-ind]");
  const attrs = {};
  for (const a of el.attributes) attrs[a.name] = a.value;
  const indAttrs = {};
  if (ind) for (const a of ind.attributes) indAttrs[a.name] = a.value;
  const r = el.getBoundingClientRect();
  const ir = ind ? ind.getBoundingClientRect() : null;
  return {
    role: el.getAttribute("role"),
    // null where the attribute is ABSENT, which for aria-valuenow is the
    // whole indeterminate signal: "" and missing are different claims.
    // (No backticks anywhere in this block — it lives inside a template
    // literal, and one closes the string.)
    valueNow: el.getAttribute("aria-valuenow"),
    valueMin: el.getAttribute("aria-valuemin"),
    valueMax: el.getAttribute("aria-valuemax"),
    valueText: el.getAttribute("aria-valuetext"),
    dataState: el.getAttribute("data-state"),
    attrs,
    indicator: {
      attrs: indAttrs,
      // The drawn fraction, measured rather than parsed out of a style
      // string: a library may express it as a width, a transform or an
      // inline custom property, and what a person SEES is the ratio.
      // Measured from the boxes for that reason.
      widthRatio: ir && r.width > 0 ? Math.round((ir.width / r.width) * 10000) / 10000 : null,
    },
  };
}`;

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".progress-probe.jsx");
const bundle = path.join(HERE, ".progress-probe.js");
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
const pageFile = path.join(HERE, ".progress-probe.html");
fs.writeFileSync(
  pageFile,
  `<!doctype html><meta charset="utf-8">` +
    // Both libraries are HEADLESS: an unstyled bar has no size, and a
    // zero-width bar makes the indicator ratio 0/0. Supplying the box is the
    // consumer's job, so the probe does what any consumer does. None of this
    // is captured — the appearance is shadcn's and is not the question.
    `<style>
       [role="progressbar"] { display:block; width: 200px; height: 8px;
         background: #eee; overflow: hidden; position: relative; }
       [data-ind] { display:block; height: 100%; background: #333; }
       body { margin: 16px; }
     </style>` +
    `<div id="root"></div><script src="./.progress-probe.js"></script>`,
);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(200);

const read = async (t) => page.evaluate(`(${READ})('[data-t="${t}"]')`);

const radix = {};
const base = {};
for (const v of VALUES) {
  radix[v.key] = await read("radix-" + v.key);
  base[v.key] = await read("base-" + v.key);
}
radix.range = await read("radix-range");
base.range = await read("base-range");
radix.label = await read("radix-label");
base.label = await read("base-label");

// Read off disk rather than through require: both packages declare `exports`
// without a `./package.json` entry, so requiring it is refused outright.
const versionOf = (name) =>
  JSON.parse(fs.readFileSync(path.join(DOM_DIR, "node_modules", name, "package.json"), "utf8")).version;
const versions = {
  radix: versionOf("@radix-ui/react-progress"),
  base: versionOf("@base-ui/react"),
};
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.unlinkSync(f);

// Where the two libraries answer differently, said out loud rather than
// averaged. Computed from what came back, not asserted in advance — an
// earlier oracle in this directory wrote its findings before reading its own
// measurement and got one of them backwards.
const DIVERGENCES = [];
for (const k of Object.keys(radix)) {
  const r = radix[k], b = base[k];
  if (!r || !b) continue;
  for (const f of ["valueNow", "valueMin", "valueMax", "valueText", "dataState"]) {
    if (String(r[f]) !== String(b[f])) {
      DIVERGENCES.push({ case: k, field: f, radix: r[f], base: b[f] });
    }
  }
}

const FINDINGS = {
  indeterminateIsTheAbsenceOfANumber: {
    what:
      "With no value, aria-valuenow is ABSENT rather than 0 or empty — " +
      "`indeterminate.valueNow` is null for BOTH libraries. Base UI also " +
      "writes aria-valuetext 'indeterminate progress'; Radix leaves it off.",
    consequence:
      "A reader announces 'busy' rather than '0 percent'. An implementation " +
      "storing 0 for 'unknown' makes a specific and wrong claim, and it is " +
      "the natural thing to write in a language with no null — which Ranger " +
      "is, so ProgressCtl carries a separate `hasValue` flag rather than a " +
      "sentinel number.",
  },
  radixDoesNotClampAtAll: {
    what:
      "THE BIG DIVERGENCE, and not a small one. Given 140 against a max of " +
      "100, or -20, Radix reports NO aria-valuenow and data-state " +
      "'indeterminate' — see the `over` and `under` rows. Base UI clamps: " +
      "140 becomes 100 and -20 becomes 0.",
    consequence:
      "These are two different components, not two spellings of one. Radix " +
      "treats an out-of-range number as a caller bug and refuses to report " +
      "anything; Base UI treats it as a number to bring into range. " +
      "ProgressCtl CLAMPS, following Base UI, because a bar that silently " +
      "becomes indeterminate when a caller's arithmetic drifts one over is " +
      "harder to notice than one pinned at full — and because a shadcn-family " +
      "bar is the Base UI one. Radix's choice is recorded here rather than " +
      "scored as a miss.",
  },
  radixDrawsNothing: {
    what:
      "Radix's Indicator carries data-state, data-value and data-max and NO " +
      "style at all. Base UI's carries an inline `width: 40%`. So " +
      "`indicator.widthRatio` is a real measurement for Base UI and, for " +
      "Radix, measures THIS PROBE'S OWN STYLESHEET — a default-width block — " +
      "and must not be read as a Radix answer. It is 1 for every Radix row " +
      "including `zero`, which is the tell.",
    consequence:
      "The fill is the consumer's job in Radix; shadcn's Progress supplies " +
      "it as a translateX off data-value. So the drawn fraction is not " +
      "something one can copy from Radix at all — Base UI is the only " +
      "reference for it here, and ProgressCtl reports a FRACTION that a demo " +
      "turns into pixels, the same split the event calendar is under.",
  },
  nobodySpecifiesTheIndeterminateFill: {
    what:
      "When indeterminate, Base UI's Indicator carries `data-indeterminate` " +
      "and NO style — the same shape as Radix's Indicator at every value. " +
      "So `indeterminate.indicator.widthRatio` is 1 for both libraries and " +
      "for the same reason: it is this probe's default-width block, not a " +
      "library answer.",
    consequence:
      "The fill for an indeterminate bar is not specified by either " +
      "reference; `data-indeterminate` is the hook a consumer hangs a " +
      "barber-pole animation off. ProgressCtl reporting 0.0 there is a " +
      "CHOICE, made so that a caller who draws the fraction anyway draws " +
      "nothing rather than a full bar claiming the work is done — and it is " +
      "gated as a choice rather than as a measurement.",
  },
  aRatioOfOneMeansNobodyDrewIt: {
    what:
      "Three times in this capture a widthRatio of 1 means the library set " +
      "no width at all: every Radix row, and the indeterminate Base UI row. " +
      "Only Base UI at a real value writes an inline `width: N%`.",
    consequence:
      "Read `indicator.widthRatio` together with `indicator.attrs.style`. A " +
      "ratio with no style behind it is the probe's stylesheet talking, and " +
      "taking it for a library decision would put a full fill on an empty " +
      "bar.",
  },
  valueTextIsARoundedPercent: {
    what:
      "Both libraries agree, and both round: 33.333 of 100 reads '33%', and " +
      "3 of 8 reads '38%' — 37.5 rounded up, not truncated.",
    consequence:
      "One of the few places the two references are identical, so it is " +
      "settled rather than chosen. Truncation is the plausible wrong " +
      "implementation and would differ on exactly the 3-of-8 case.",
  },
  baseHasNoDataState: {
    what:
      "Base UI publishes no data-state at any value; it marks a running bar " +
      "with a valueless `data-progressing` attribute instead. Radix's " +
      "data-state is three-valued: loading, complete, indeterminate.",
    consequence:
      "A theme written against one does not style the other. ProgressCtl " +
      "reports Radix's three-state word, because it is the one that carries " +
      "information a class can hang off, and 'complete' is a state a person " +
      "wants to see differently.",
  },
  divergences: DIVERGENCES,
};

const file = path.join(HERE, "progress.json");
fs.writeFileSync(
  file,
  JSON.stringify(
    {
      note:
        "Captured by progress_oracle.mjs from BOTH shadcn references at once. " +
        "Everything here is measured; where the two disagree it is listed in " +
        "FINDINGS.divergences rather than reconciled.",
      libraries: {
        radix: `@radix-ui/react-progress@${versions.radix}`,
        base: `@base-ui/react@${versions.base}`,
      },
      radix,
      base,
      FINDINGS,
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${path.relative(process.cwd(), file)}`);
console.log(`${DIVERGENCES.length} divergences between the two references`);
