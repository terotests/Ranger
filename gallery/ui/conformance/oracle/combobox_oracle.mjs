/**
 * Base UI's Combobox, asked what a combobox — single, and multiple with chips —
 * actually does.
 *
 *   node gallery/ui/conformance/oracle/combobox_oracle.mjs
 *
 * Writes `combobox.json` beside this file. `ComboboxCtl.rgr` is built against
 * it and `combobox_check.mjs` gates it; nothing reads the file at run time.
 *
 * WHY BASE UI. Radix has no combobox and no tag input, which is why both sat
 * in PLAN.md as "genuinely new — needs an oracle before it needs a rule". The
 * shadcn `components/base/…` registry is Base UI, and Base UI's Combobox ships
 * the whole shape in one component: an input that filters a listbox, a
 * `multiple` mode whose selection is drawn as chips inside the input group,
 * and a `ChipRemove` on each. That is the M-Files metadata card's lookup
 * field — "ESTT Corporation ×" with a caret — and its class picker, measured
 * rather than reconstructed.
 *
 * WHAT IS WORTH ASKING. Every one of these is a decision an implementation
 * guesses, and the guesses disagree with each other:
 *
 *   OPENING. Does clicking the input open the list, or only the trigger and
 *   ArrowDown? Where does the highlight land when it opens — nowhere, the
 *   first row, or the chosen one?
 *   THE HIGHLIGHT. Does typing highlight the first match on its own
 *   (autoHighlight), or does Enter on a filtered list do nothing until an
 *   arrow has been pressed?
 *   CHOOSING, SINGLE. Does the input take the label? Does the list close?
 *   Where is focus afterwards?
 *   CHOOSING, MULTIPLE. Does the list stay open? Is the typed filter cleared?
 *   Does the option say aria-selected, and does the listbox say
 *   aria-multiselectable?
 *   THE CHIPS. What role is the strip, what role is a chip, is a chip a tab
 *   stop, and — the whole reason a tag input feels right — what Backspace
 *   does in an empty input: removes the last chip, focuses it, or nothing.
 *   ARROWLEFT out of an empty input: onto the chips, or a caret that stays.
 *   TYPING NONSENSE. What the input holds after blur when nothing matched:
 *   kept, cleared, or reverted to the chosen label.
 *   CLEAR. What the button is, when it is shown, and where focus goes.
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
import { Combobox } from "@base-ui/react/combobox";

const LANGS = ["JavaScript", "TypeScript", "Python", "Ruby", "Rust", "Go"];

function Popup() {
  return React.createElement(Combobox.Portal, null,
    React.createElement(Combobox.Positioner, { sideOffset: 4 },
      React.createElement(Combobox.Popup, { "data-popup": "1" },
        React.createElement(Combobox.Empty, { "data-empty": "1" }, "No languages found."),
        React.createElement(Combobox.List, { "data-list": "1" },
          (item) => React.createElement(Combobox.Item, { key: item, value: item, "data-item": item },
            React.createElement(Combobox.ItemIndicator, { "data-indicator": "1" }, "✓"),
            React.createElement("span", null, item))))));
}

// One value, a text box, a clear button and a trigger.
function Single(props) {
  return React.createElement("div", { "data-t": props.t },
    React.createElement(Combobox.Root, { items: LANGS, defaultValue: props.value ?? null, disabled: !!props.disabled },
      React.createElement(Combobox.InputGroup, { "data-group": "1" },
        React.createElement(Combobox.Input, { "data-in": "1", placeholder: "Pick a language", "aria-label": "Language" }),
        React.createElement(Combobox.Clear, { "data-clear": "1", "aria-label": "Clear" }, "×"),
        React.createElement(Combobox.Trigger, { "data-trigger": "1", "aria-label": "Open" }, "▾")),
      Popup()));
}

// Several values, drawn as chips sharing the box with the input — the
// reference's own "Multiple select" demo, unstyled.
function Multi(props) {
  return React.createElement("div", { "data-t": props.t },
    React.createElement(Combobox.Root, { items: LANGS, multiple: true, defaultValue: props.value ?? [] },
      React.createElement(Combobox.InputGroup, { "data-group": "1" },
        React.createElement(Combobox.Chips, { "data-chips": "1" },
          React.createElement(Combobox.Value, null, (value) => React.createElement(React.Fragment, null,
            value.map((v) => React.createElement(Combobox.Chip, { key: v, "data-chip": v, "aria-label": v },
              v,
              React.createElement(Combobox.ChipRemove, { "data-chip-remove": v, "aria-label": "Remove " + v }, "×"))),
            React.createElement(Combobox.Input, { "data-in": "1", "aria-label": "Languages",
              placeholder: value.length > 0 ? "" : "e.g. TypeScript" })))),
        React.createElement(Combobox.Trigger, { "data-trigger": "1", "aria-label": "Open" }, "▾")),
      Popup()));
}

function App() {
  return React.createElement("div", null,
    React.createElement(Single, { t: "single", value: "Python" }),
    React.createElement(Single, { t: "single-empty" }),
    React.createElement(Single, { t: "single-disabled", value: "Python", disabled: true }),
    React.createElement(Multi, { t: "multi", value: ["JavaScript", "TypeScript"] }),
    React.createElement(Multi, { t: "multi-empty" }),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

// Everything observable about one fixture, in one read. The popup is
// portalled, so it is found by the input's aria-controls rather than under the
// fixture's div — which is itself a measurement: the input SAYS which list it
// owns.
const READ = `(t) => {
  const host = document.querySelector('[data-t="' + t + '"]');
  if (!host) return null;
  const attrsOf = (el) => {
    if (!el) return null;
    const o = { tag: el.tagName.toLowerCase(), text: (el.textContent || "").trim() };
    for (const a of el.attributes) if (/^(role|aria-|data-(selected|highlighted|disabled|open|popup-open|filled|focused|empty|pressed)|tabindex|type|disabled|placeholder|hidden)/.test(a.name)) o[a.name] = a.value;
    if (el.tagName === "INPUT") { o.value = el.value; o.selStart = el.selectionStart; o.selEnd = el.selectionEnd; }
    o.focused = document.activeElement === el;
    return o;
  };
  const input = host.querySelector("[data-in]");
  const controls = input && input.getAttribute("aria-controls");
  const list = controls ? document.getElementById(controls) : null;
  const popup = list ? list.closest("[data-popup]") : document.querySelector("[data-popup]");
  const items = list ? Array.from(list.querySelectorAll("[data-item]")).map((el) => Object.assign(attrsOf(el), {
    item: el.getAttribute("data-item"),
    indicatorShown: !!el.querySelector("[data-indicator]"),
  })) : [];
  const act = document.activeElement;
  const focus = !act || act === document.body ? "body" :
    act.hasAttribute("data-in") ? "input" :
    act.hasAttribute("data-chip") ? "chip:" + act.getAttribute("data-chip") :
    act.hasAttribute("data-chip-remove") ? "chip-remove:" + act.getAttribute("data-chip-remove") :
    act.hasAttribute("data-trigger") ? "trigger" :
    act.hasAttribute("data-clear") ? "clear" :
    act.hasAttribute("data-item") ? "item:" + act.getAttribute("data-item") :
    act.hasAttribute("data-list") ? "list" :
    act.tagName.toLowerCase() + (act.getAttribute("role") ? "[" + act.getAttribute("role") + "]" : "");
  return {
    group: attrsOf(host.querySelector("[data-group]")),
    input: attrsOf(input),
    trigger: attrsOf(host.querySelector("[data-trigger]")),
    clear: attrsOf(host.querySelector("[data-clear]")),
    chips: attrsOf(host.querySelector("[data-chips]")),
    chip: Array.from(host.querySelectorAll("[data-chip]")).map((el) => Object.assign(attrsOf(el), { chip: el.getAttribute("data-chip") })),
    chipRemove: Array.from(host.querySelectorAll("[data-chip-remove]")).map((el) => Object.assign(attrsOf(el), { chip: el.getAttribute("data-chip-remove") })),
    open: !!popup && !popup.hidden,
    popup: attrsOf(popup),
    list: attrsOf(list),
    empty: attrsOf(popup ? popup.querySelector("[data-empty]") : null),
    items,
    focus,
  };
}`;

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".cb-probe.jsx");
const bundle = path.join(HERE, ".cb-probe.js");
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
const pageFile = path.join(HERE, ".cb-probe.html");
fs.writeFileSync(
  pageFile,
  `<!doctype html><meta charset="utf-8">` +
    // Unstyled but SIZED: Playwright will not click a zero-pixel element, and
    // a chip with no box cannot be a click target. None of the appearance is
    // captured.
    `<style>
       [data-t] { margin: 8px; }
       [data-group] { display: flex; flex-wrap: wrap; gap: 4px; width: 320px; min-height: 28px; border: 1px solid #888; }
       [data-chips] { display: flex; flex-wrap: wrap; gap: 4px; }
       [data-in] { width: 120px; height: 24px; }
       [data-chip] { display: inline-flex; gap: 4px; padding: 2px 6px; background: #eee; }
       [data-chip-remove], [data-trigger], [data-clear] { width: 20px; height: 20px; }
       [data-item] { padding: 4px 8px; }
     </style>` +
    `<div id="root"></div><script src="./.cb-probe.js"></script>`,
);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(200);

const read = (t) => page.evaluate(`(${READ})(${JSON.stringify(t)})`);
const sel = (t, part) => `[data-t="${t}"] [data-${part}]`;
const settle = () => page.waitForTimeout(80);
const click = async (t, part) => { await page.click(sel(t, part)); await settle(); };
const key = async (k, times) => { for (let i = 0; i < (times || 1); i++) await page.keyboard.press(k); await settle(); };
const type = async (s) => { await page.keyboard.type(s); await settle(); };
const clickItem = async (item) => { await page.click(`[data-item="${item}"]`); await settle(); };
// Blur everything by focusing an unrelated control, so the next probe starts
// cold. Escape first, because a click elsewhere while the popup is open is
// swallowed by the outside-press dismissal and lands nowhere.
const park = async () => {
  await page.keyboard.press("Escape");
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
  await settle();
};
// Reload the page between families of probes, so a walked-into state is not
// blamed on the component. Cheap, and the honest form of "reset".
const fresh = async () => {
  await page.reload();
  await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
  await page.waitForTimeout(150);
};

const shape = {
  single: await read("single"),
  singleEmpty: await read("single-empty"),
  singleDisabled: await read("single-disabled"),
  multi: await read("multi"),
  multiEmpty: await read("multi-empty"),
};

// --- single: opening ----------------------------------------------------------
const single = {};
await click("single", "in");
single.afterClickInput = await read("single");
await park();
await click("single", "trigger");
single.afterClickTrigger = await read("single");
await park();
await click("single", "in");
await key("ArrowDown");
single.afterArrowDown = await read("single");
await key("ArrowDown");
single.afterArrowDownTwice = await read("single");
await key("ArrowUp");
single.afterArrowUpBack = await read("single");
await key("Escape");
single.afterEscape = await read("single");
await key("Escape");
single.afterEscapeTwice = await read("single");
await park();

// A field with NOTHING chosen: where the highlight lands on ArrowDown, and
// what Enter does when nothing is highlighted.
await click("single-empty", "in");
await key("ArrowDown");
single.emptyAfterArrowDown = await read("single-empty");
await park();
await click("single-empty", "in");
single.emptyAfterClickInput = await read("single-empty");
await key("Enter");
single.emptyAfterEnterOnNothing = await read("single-empty");
await park();

// --- single: choosing -----------------------------------------------------------
await fresh();
await click("single", "in");
await key("ArrowDown");
await key("ArrowDown");
await key("Enter");
single.afterEnterOnNext = await read("single");
await park();
await fresh();
await click("single", "trigger");
await clickItem("Rust");
single.afterClickItem = await read("single");
await park();

// --- single: typing -------------------------------------------------------------
await fresh();
await click("single", "in");
await page.keyboard.press("ControlOrMeta+a");
await type("ru");
single.afterTypingRu = await read("single");
await key("Enter");
single.afterTypingRuEnter = await read("single");
await park();
await fresh();
await click("single", "in");
await page.keyboard.press("ControlOrMeta+a");
await type("zzz");
single.afterTypingNonsense = await read("single");
await key("Tab");
single.afterTypingNonsenseTab = await read("single");
await park();
await fresh();
await click("single", "in");
await page.keyboard.press("ControlOrMeta+a");
await type("ty");
await key("ArrowDown");
single.afterTypingTyArrowDown = await read("single");
await key("Enter");
single.afterTypingTyArrowDownEnter = await read("single");
await park();
// Typed and abandoned with a partial match: what the box holds after blur.
await fresh();
await click("single", "in");
await page.keyboard.press("ControlOrMeta+a");
await type("ru");
await key("Tab");
single.afterTypingRuTab = await read("single");
await park();

// --- single: clear ----------------------------------------------------------------
await fresh();
await click("single", "clear");
single.afterClear = await read("single");
await park();
await fresh();
await click("single", "in");
await page.keyboard.press("ControlOrMeta+a");
await key("Backspace");
single.afterBackspaceAll = await read("single");
await key("Tab");
single.afterBackspaceAllTab = await read("single");
await park();

// --- disabled ------------------------------------------------------------------------
await fresh();
try { await page.click(sel("single-disabled", "trigger"), { timeout: 1500, force: true }); } catch {}
await settle();
single.disabledAfterClickTrigger = await read("single-disabled");

// --- multi: opening and choosing ------------------------------------------------------
await fresh();
const multi = {};
await click("multi", "in");
multi.afterClickInput = await read("multi");
await key("ArrowDown");
multi.afterArrowDown = await read("multi");
await key("Enter");
multi.afterEnterOnHighlighted = await read("multi");
await key("Enter");
multi.afterEnterAgain = await read("multi");
await park();
await fresh();
await click("multi", "trigger");
multi.afterClickTrigger = await read("multi");
await clickItem("Rust");
multi.afterClickItemRust = await read("multi");
await clickItem("JavaScript");
multi.afterClickItemJavaScriptAgain = await read("multi");
await park();

// --- multi: typing then choosing --------------------------------------------------------
await fresh();
await click("multi", "in");
await type("ru");
multi.afterTypingRu = await read("multi");
await key("Enter");
multi.afterTypingRuEnter = await read("multi");
await park();
await fresh();
await click("multi", "in");
await type("zzz");
await key("Tab");
multi.afterTypingNonsenseTab = await read("multi");
await park();

// --- multi: the chips -----------------------------------------------------------------
await fresh();
await click("multi", "in");
await key("Backspace");
multi.afterBackspaceInEmptyInput = await read("multi");
await key("Backspace");
multi.afterBackspaceTwice = await read("multi");
await park();
await fresh();
await click("multi", "in");
await key("ArrowLeft");
multi.afterArrowLeftFromEmptyInput = await read("multi");
await key("ArrowLeft");
multi.afterArrowLeftTwice = await read("multi");
await key("ArrowLeft");
multi.afterArrowLeftThrice = await read("multi");
await key("ArrowRight");
multi.afterArrowRightBack = await read("multi");
await key("ArrowRight");
multi.afterArrowRightToInput = await read("multi");
await park();
await fresh();
await click("multi", "in");
await key("ArrowLeft");
await key("Backspace");
multi.afterBackspaceOnFocusedChip = await read("multi");
await park();
await fresh();
await click("multi", "in");
await key("ArrowLeft");
await key("ArrowLeft");
await key("Delete");
multi.afterDeleteOnFirstChip = await read("multi");
await park();
await fresh();
await click("multi", "in");
await key("ArrowLeft");
await key("Enter");
multi.afterEnterOnFocusedChip = await read("multi");
await park();
await fresh();
await page.click('[data-t="multi"] [data-chip-remove="JavaScript"]');
await settle();
multi.afterClickChipRemove = await read("multi");
await park();
await fresh();
await page.click('[data-t="multi"] [data-chip="TypeScript"]');
await settle();
multi.afterClickChip = await read("multi");
await park();
// Backspace with text in the input takes a character, not a chip.
await fresh();
await click("multi", "in");
await type("r");
await key("Backspace");
multi.afterBackspaceWithText = await read("multi");
await park();
// Tab order: from the input, where does Tab go — over the chips or past them?
await fresh();
await click("multi", "in");
await key("Tab");
multi.afterTabFromInput = await read("multi");
await park();
await fresh();
await click("multi-empty", "in");
await key("Backspace");
multi.emptyAfterBackspace = await read("multi-empty");
await key("ArrowLeft");
multi.emptyAfterArrowLeft = await read("multi-empty");
await park();

const version = JSON.parse(
  fs.readFileSync(path.join(DOM_DIR, "node_modules", "@base-ui/react", "package.json"), "utf8"),
).version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.unlinkSync(f);

const FINDINGS = {
  howItOpens: {
    what:
      "`single.afterClickInput.open` against `single.afterClickTrigger.open` and " +
      "`single.afterArrowDown.open`: which gestures open the list.",
    consequence:
      "A text box that opens on click behaves like a select; one that does not " +
      "behaves like a search box. The controller copies whichever the capture says.",
  },
  whereTheHighlightLands: {
    what:
      "`single.afterArrowDown.items[*]['data-highlighted']` on a field with " +
      "'Python' chosen, and `single.emptyAfterArrowDown` on one with nothing chosen.",
    consequence:
      "The chosen row, the first row, or no row. A select puts you where you " +
      "already are; a combobox may not.",
  },
  autoHighlight: {
    what:
      "`single.afterTypingRu.items` — is the first match highlighted with no " +
      "arrow pressed — and `single.afterTypingRuEnter.input.value`, which is what " +
      "Enter then does.",
    consequence:
      "Without autoHighlight, typing 'ru' and pressing Enter chooses nothing. " +
      "That is the single most surprising thing about the shadcn combobox and " +
      "it is measured rather than assumed either way.",
  },
  nonsenseAfterBlur: {
    what:
      "`single.afterTypingNonsenseTab.input.value` and `single.afterTypingRuTab.input.value`: " +
      "what the box holds when what was typed matched nothing, or matched but was " +
      "not chosen, and focus left.",
    consequence:
      "Reverting to the chosen label is the difference between a combobox and an " +
      "autocomplete. The controller does what the capture says.",
  },
  multipleKeepsTheListOpen: {
    what:
      "`multi.afterEnterOnHighlighted.open` and `multi.afterClickItemRust.open`, " +
      "and the same reads' `input.value` after a filter was typed " +
      "(`multi.afterTypingRuEnter`).",
    consequence:
      "A multi-select that closed on every pick would need reopening for each " +
      "tag. Whether the typed filter survives a pick decides whether picking " +
      "three matches is three keystrokes or nine.",
  },
  backspaceAndTheChips: {
    what:
      "`multi.afterBackspaceInEmptyInput`: whether the last chip is REMOVED, " +
      "FOCUSED, or untouched. `multi.afterArrowLeftFromEmptyInput.focus`: whether " +
      "ArrowLeft leaves the input for the chips. `multi.afterBackspaceOnFocusedChip` " +
      "and `multi.afterDeleteOnFirstChip`: what removes a focused chip and where " +
      "focus goes after.",
    consequence:
      "This is the whole character of a tag input, and every library does it " +
      "differently. The rule here is the one the capture shows.",
  },
  theChipsRoles: {
    what:
      "`shape.multi.chips.role`, `shape.multi.chip[0].role`, " +
      "`shape.multi.chip[0].tabindex`, `shape.multi.chipRemove[0]` and " +
      "`shape.multi.list['aria-multiselectable']`.",
    consequence:
      "What a reader is told the strip is, and whether Tab stops on every chip " +
      "or on none of them.",
  },
};

fs.writeFileSync(
  path.join(HERE, "combobox.json"),
  JSON.stringify(
    {
      reference: "@base-ui/react/combobox",
      version,
      note:
        "Captured by combobox_oracle.mjs against Base UI's Combobox: a single-value " +
        "field with a Clear and a Trigger, and a `multiple` field whose selection " +
        "is drawn as Chips with a ChipRemove each. Every value below was read off " +
        "the DOM after a real gesture; FINDINGS names the reads that matter and why.",
      findings: FINDINGS,
      shape,
      single,
      multi,
    },
    null,
    2,
  ) + "\n",
);
console.log("wrote combobox.json (@base-ui/react " + version + ")");
