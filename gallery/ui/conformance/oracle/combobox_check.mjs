#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// ComboboxCtl against Base UI's Combobox — single, and multiple with chips.
//
//   node gallery/ui/conformance/oracle/combobox_check.mjs
//
// Reads `combobox.json` rather than restating its numbers: every `want` below
// is a read the oracle made after a real gesture, and the assertion is that
// the controller, driven through UiHost by the same gesture, says the same.
// Where a rule is specified rather than measured it says so and reads no
// capture.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const O = JSON.parse(fs.readFileSync(path.join(HERE, "combobox.json"), "utf8"));

let pass = 0;
let fail = 0;
const eq = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};
const ok = (what, cond, detail) => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : " — " + detail}`);
};

// The oracle's fixture: six languages, keyed by their label because Base UI
// was given plain strings. The controller keys by a value and shows a label;
// the two are the same string here so a capture and a row compare directly.
const LANGS = ["JavaScript", "TypeScript", "Python", "Ruby", "Rust", "Go"];
const mk = (opts) => {
  const o = opts || {};
  const h = new H.UiHost();
  const c = h.addCombobox("cb", o.multiple ? "Languages" : "Language", !!o.multiple);
  for (const l of LANGS) c.addItem(l, l, false);
  if (o.multiple) for (const v of o.values || []) c.values.push(v);
  else c.value = o.value || "";
  c.placeholder = o.multiple ? "e.g. TypeScript" : "Pick a language";
  if (o.disabled) c.disabled = true;
  c.settleText();
  c.build();
  return { h, c };
};
const rows = (h) => Object.fromEntries(Array.from(h.allRows()).map((r) => [r.tid, r]));
const chips = (c) => Array.from(c.values);
// The oracle's item line: which rows are selected and which one is highlighted.
const oracleSelected = (read) => read.items.filter((i) => i["aria-selected"] === "true").map((i) => i.item);
const oracleHighlighted = (read) => (read.items.find((i) => i["data-highlighted"] !== undefined) || {}).item || "";
const oracleVisible = (read) => read.items.map((i) => i.item);
const selected = (h) => Object.values(rows(h)).filter((r) => r.role === 38 && r.selected === 2).map((r) => r.name);
const visible = (h) => Object.values(rows(h)).filter((r) => r.role === 38).map((r) => r.name);
// Playwright's ControlOrMeta+A selects the whole value; on the host it is
// Ctrl+A into the text field.
const selectAll = (h) => h.keyWith("a", false, true);
const type = (h, s) => { for (const ch of s) h.type(ch); };

console.log("MEASURED — the shape");
{
  const s = O.shape.single;
  const { h } = mk({ value: "Python" });
  const r = rows(h);
  eq("the input's role is the reference's", s.input.role, "combobox");
  eq("so the row is a combobox (36)", r["cb-input"].role, 36);
  eq("it holds the chosen label", r["cb-input"].text, s.input.value);
  eq("with the caret at the end", r["cb-input"].selStart, s.input.selStart);
  eq("closed says not expanded", r["cb-input"].expanded, s.input["aria-expanded"] === "true" ? 2 : 1);
  eq("aria-haspopup is a listbox", r["cb-input"].hasPopup, s.input["aria-haspopup"]);
  ok("the input is the tab stop", r["cb-input"].tabStop === true);
  ok("the trigger is a button that is NOT a tab stop",
    s.trigger.tabindex === "-1" && r["cb-trigger"].role === 4 && r["cb-trigger"].tabStop === false,
    `ref tabindex=${s.trigger.tabindex} row tabStop=${r["cb-trigger"].tabStop}`);
  ok("a clear button is present while there is a value", s.clear !== null && !!r["cb-clear"]);
  const e = O.shape.singleEmpty;
  const { h: he } = mk({});
  ok("and ABSENT while there is not — not disabled, gone", e.clear === null && !rows(he)["cb-clear"]);
  ok("the list is not in the tree while closed", s.list === null && !r["cb-content"]);
  const m = O.shape.multi;
  const { h: hm } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  const rm = rows(hm);
  eq("the chips are a toolbar", m.chips.role, "toolbar");
  eq("so the row is one (17)", rm["cb-chips"].role, 17);
  eq("a chip has no role of its own", m.chip[0].role === undefined ? "none" : m.chip[0].role, "none");
  eq("and its label as its name", rm["cb-chip-JavaScript"].name, m.chip[0]["aria-label"]);
  ok("a chip is reachable but not a tab stop",
    m.chip[0].tabindex === "-1" && rm["cb-chip-JavaScript"].focusable === true && rm["cb-chip-JavaScript"].tabStop === false);
  eq("the remove is a button", m.chipRemove[0].tag, "button");
  eq("named for the chip", rm["cb-chip-JavaScript-remove"].name, "Remove JavaScript");
  eq("a box with chips shows no placeholder", rm["cb-input"].placeholder, m.input.placeholder);
  eq("a box with none shows its own", rows(mk({ multiple: true }).h)["cb-input"].placeholder, O.shape.multiEmpty.input.placeholder);
  const d = O.shape.singleDisabled;
  const { h: hd } = mk({ value: "Python", disabled: true });
  ok("a disabled box says so", d.input.disabled !== undefined && rows(hd)["cb-input"].disabled === true);
}

console.log("MEASURED — opening, single");
{
  const w = O.single.afterClickInput;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  eq("a click on the input opens", c.open, w.open);
  eq("focus stays on the input", h.focusId, w.focus === "input" ? "cb-input" : w.focus);
  eq("the highlight lands on the chosen row", c.activeValue, oracleHighlighted(w));
  eq("the list is a listbox", rows(h)["cb-content"].role, 37);
  eq("the options say what is selected", selected(h).join(","), oracleSelected(w).join(","));
  eq("the trigger says expanded", rows(h)["cb-trigger"].expanded, w.trigger["aria-expanded"] === "true" ? 2 : 1);
}
{
  const w = O.single.afterClickTrigger;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-trigger");
  eq("the trigger opens too", c.open, w.open);
  eq("and focus goes to the input", h.focusId, "cb-input");
  eq("same highlight", c.activeValue, oracleHighlighted(w));
}
{
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  h.key("ArrowDown");
  eq("ArrowDown moves the highlight down", c.activeValue, oracleHighlighted(O.single.afterArrowDown));
  eq("and leaves the value alone", c.value, O.single.afterArrowDown.input.value);
  eq("aria-selected stays on the chosen row", selected(h).join(","), oracleSelected(O.single.afterArrowDown).join(","));
  h.key("ArrowDown");
  eq("again", c.activeValue, oracleHighlighted(O.single.afterArrowDownTwice));
  h.key("ArrowUp");
  eq("ArrowUp comes back", c.activeValue, oracleHighlighted(O.single.afterArrowUpBack));
  h.key("Escape");
  eq("Escape closes", c.open, O.single.afterEscape.open);
  eq("and keeps the text", rows(h)["cb-input"].text, O.single.afterEscape.input.value);
  eq("focus is the input's", h.focusId, "cb-input");
  h.key("Escape");
  eq("a second Escape CLEARS the box", rows(h)["cb-input"].text, O.single.afterEscapeTwice.input.value);
  ok("and the clear button goes with the value", O.single.afterEscapeTwice.clear === null && !rows(h)["cb-clear"]);
}
{
  const w = O.single.emptyAfterArrowDown;
  const { h, c } = mk({});
  h.click("cb-input");
  eq("a click on an EMPTY box opens with no highlight", c.activeValue, oracleHighlighted(O.single.emptyAfterClickInput));
  h.key("Enter");
  eq("Enter with nothing highlighted closes", c.open, O.single.emptyAfterEnterOnNothing.open);
  eq("and chooses nothing", rows(h)["cb-input"].text, O.single.emptyAfterEnterOnNothing.input.value);
  h.key("ArrowDown");
  eq("ArrowDown on an empty box highlights the first row", c.activeValue, oracleHighlighted(w));
}

console.log("MEASURED — choosing, single");
{
  const w = O.single.afterEnterOnNext;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  h.key("ArrowDown");
  h.key("ArrowDown");
  h.key("Enter");
  eq("Enter takes the highlighted row's label into the box", rows(h)["cb-input"].text, w.input.value);
  eq("caret at its end", rows(h)["cb-input"].selStart, w.input.selStart);
  eq("the list closes", c.open, w.open);
  eq("focus is the input's", h.focusId, "cb-input");
  const wc = O.single.afterClickItem;
  const { h: h2, c: c2 } = mk({ value: "Python" });
  h2.click("cb-trigger");
  h2.click("cb-item-Rust");
  eq("a click on a row does the same", rows(h2)["cb-input"].text, wc.input.value);
  eq("and closes", c2.open, wc.open);
}

console.log("MEASURED — typing, single");
{
  const w = O.single.afterTypingRu;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  selectAll(h);
  type(h, "ru");
  eq("the box holds the query", rows(h)["cb-input"].text, w.input.value);
  eq("the list is filtered to what contains it", visible(h).join(","), oracleVisible(w).join(","));
  eq("with NO highlight — no autoHighlight", c.activeValue, oracleHighlighted(w));
  h.key("Enter");
  const we = O.single.afterTypingRuEnter;
  eq("Enter on nothing closes", c.open, we.open);
  eq("and the box REVERTS to the chosen label", rows(h)["cb-input"].text, we.input.value);
}
{
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  selectAll(h);
  type(h, "ty");
  h.key("ArrowDown");
  eq("ArrowDown highlights the first match", c.activeValue, oracleHighlighted(O.single.afterTypingTyArrowDown));
  h.key("Enter");
  eq("and Enter takes it", rows(h)["cb-input"].text, O.single.afterTypingTyArrowDownEnter.input.value);
}
{
  const w = O.single.afterTypingNonsense;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  selectAll(h);
  type(h, "zzz");
  eq("nothing matches: no options", visible(h).length, oracleVisible(w).length);
  ok("the empty row is shown", w.empty.text.length > 0 && !!rows(h)["cb-empty"]);
  // Tab, on the reference, moved focus off the box. On the host that is a
  // focus step elsewhere, which fires the same blur.
  h.addToggle("elsewhere", "Elsewhere");
  h.focus("elsewhere");
  eq("leaving reverts a nonsense query", rows(h)["cb-input"].text, O.single.afterTypingNonsenseTab.input.value);
  eq("and closes", c.open, O.single.afterTypingNonsenseTab.open);
}
{
  const { h } = mk({ value: "Python" });
  h.click("cb-input");
  selectAll(h);
  type(h, "ru");
  h.addToggle("elsewhere", "Elsewhere");
  h.focus("elsewhere");
  eq("leaving reverts a partial match too", rows(h)["cb-input"].text, O.single.afterTypingRuTab.input.value);
}
{
  const w = O.single.afterBackspaceAll;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-input");
  selectAll(h);
  h.key("Backspace");
  eq("emptying the box opens the list", c.open, w.open);
  eq("unfiltered", visible(h).length, oracleVisible(w).length);
  ok("and the clear button is gone already", w.clear === null && !rows(h)["cb-clear"]);
  h.addToggle("elsewhere", "Elsewhere");
  h.focus("elsewhere");
  eq("leaving an EMPTIED box clears the selection", rows(h)["cb-input"].text, O.single.afterBackspaceAllTab.input.value);
  eq("value gone", c.value, "");
}

console.log("MEASURED — clear and disabled");
{
  const w = O.single.afterClear;
  const { h, c } = mk({ value: "Python" });
  h.click("cb-clear");
  eq("clear empties the box", rows(h)["cb-input"].text, w.input.value);
  eq("does not open", c.open, w.open);
  eq("and focus is the input's", h.focusId, "cb-input");
  ok("the button removed itself", w.clear === null && !rows(h)["cb-clear"]);
  const d = O.single.disabledAfterClickTrigger;
  const { h: hd, c: cd } = mk({ value: "Python", disabled: true });
  hd.click("cb-trigger");
  eq("a disabled trigger opens nothing", cd.open, d.open);
  eq("and takes no focus", hd.focusId, d.focus === "body" ? "" : d.focus);
}

console.log("MEASURED — opening and choosing, multiple");
{
  const w = O.multi.afterClickInput;
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  eq("opens", c.open, w.open);
  eq("the list says multiselectable", rows(h)["cb-content"].multiSelectable, w.list["aria-multiselectable"]);
  eq("the highlight lands on the first chosen", c.activeValue, oracleHighlighted(w));
  eq("both chosen rows say selected", selected(h).join(","), oracleSelected(w).join(","));
  h.key("ArrowDown");
  eq("ArrowDown", c.activeValue, oracleHighlighted(O.multi.afterArrowDown));
  h.key("Enter");
  const we = O.multi.afterEnterOnHighlighted;
  eq("Enter TOGGLES the highlighted chip off", chips(c).join(","), we.chip.map((x) => x.chip).join(","));
  eq("the list stays open", c.open, we.open);
  eq("the highlight stays put", c.activeValue, oracleHighlighted(we));
  h.key("Enter");
  eq("Enter again toggles it back", chips(c).join(","), O.multi.afterEnterAgain.chip.map((x) => x.chip).join(","));
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-trigger");
  h.click("cb-item-Rust");
  const w = O.multi.afterClickItemRust;
  eq("a click adds a chip at the END", chips(c).join(","), w.chip.map((x) => x.chip).join(","));
  eq("the list stays open", c.open, w.open);
  eq("the highlight moves to the picked row", c.activeValue, oracleHighlighted(w));
  h.click("cb-item-JavaScript");
  const w2 = O.multi.afterClickItemJavaScriptAgain;
  eq("clicking a chosen row removes its chip", chips(c).join(","), w2.chip.map((x) => x.chip).join(","));
  eq("still open", c.open, w2.open);
}
{
  const w = O.multi.afterTypingRu;
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  type(h, "ru");
  eq("typing filters", visible(h).join(","), oracleVisible(w).join(","));
  eq("no highlight", c.activeValue, oracleHighlighted(w));
  h.key("Enter");
  const we = O.multi.afterTypingRuEnter;
  eq("Enter on nothing CLEARS the query", rows(h)["cb-input"].text, we.input.value);
  eq("keeps the chips", chips(c).join(","), we.chip.map((x) => x.chip).join(","));
  eq("closes", c.open, we.open);
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  type(h, "zzz");
  h.addToggle("elsewhere", "Elsewhere");
  h.focus("elsewhere");
  const w = O.multi.afterTypingNonsenseTab;
  eq("leaving a multiple box clears a nonsense query", rows(h)["cb-input"].text, w.input.value);
  eq("and keeps the chips", chips(c).join(","), w.chip.map((x) => x.chip).join(","));
}

console.log("MEASURED — the chips");
{
  const w = O.multi.afterBackspaceInEmptyInput;
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  h.key("Backspace");
  eq("Backspace in an empty input REMOVES the last chip", chips(c).join(","), w.chip.map((x) => x.chip).join(","));
  eq("focus stays on the input", h.focusId, "cb-input");
  eq("and the list is open — Backspace is typing", c.open, w.open);
  h.key("Backspace");
  const w2 = O.multi.afterBackspaceTwice;
  eq("again takes the other", chips(c).length, (w2.chip || []).length);
  eq("and the placeholder comes back", rows(h)["cb-input"].placeholder, w2.input.placeholder);
  h.key("Backspace");
  eq("with nothing left, nothing happens", chips(c).length, (O.multi.emptyAfterBackspace.chip || []).length);
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  h.key("ArrowLeft");
  const w = O.multi.afterArrowLeftFromEmptyInput;
  eq("ArrowLeft in an empty input focuses the LAST chip", h.focusId, "cb-" + w.focus.replace(":", "-"));
  eq("and closes the list", c.open, w.open);
  h.key("ArrowLeft");
  eq("again, the one before", h.focusId, "cb-" + O.multi.afterArrowLeftTwice.focus.replace(":", "-"));
  h.key("ArrowLeft");
  eq("past the first, round to the input", h.focusId, O.multi.afterArrowLeftThrice.focus === "input" ? "cb-input" : "?");
  h.key("ArrowRight");
  eq("ArrowRight in the input stays there", h.focusId, O.multi.afterArrowRightBack.focus === "input" ? "cb-input" : "?");
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  h.key("ArrowLeft");
  h.key("Backspace");
  const w = O.multi.afterBackspaceOnFocusedChip;
  eq("Backspace on the last chip removes it", chips(c).join(","), w.chip.map((x) => x.chip).join(","));
  eq("and focus goes to the one before it", h.focusId, "cb-" + w.focus.replace(":", "-"));
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  h.key("ArrowLeft");
  h.key("ArrowLeft");
  h.key("Delete");
  const w = O.multi.afterDeleteOnFirstChip;
  eq("Delete on the first chip removes it", chips(c).join(","), w.chip.map((x) => x.chip).join(","));
  eq("and focus goes to the chip now in its place", h.focusId, "cb-" + w.focus.replace(":", "-"));
}
{
  const { h } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  h.key("ArrowLeft");
  h.key("Enter");
  eq("Enter on a chip goes back to the input", h.focusId, O.multi.afterEnterOnFocusedChip.focus === "input" ? "cb-input" : "?");
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-chip-JavaScript-remove");
  const w = O.multi.afterClickChipRemove;
  eq("the remove button removes its chip", chips(c).join(","), w.chip.map((x) => x.chip).join(","));
  eq("focus is the input's", h.focusId, w.focus === "input" ? "cb-input" : "?");
  eq("the list is closed", c.open, w.open);
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-chip-TypeScript");
  const w = O.multi.afterClickChip;
  eq("a click on a chip opens the list", c.open, w.open);
  eq("with focus on the input", h.focusId, w.focus === "input" ? "cb-input" : "?");
  eq("chips untouched", chips(c).length, w.chip.length);
}
{
  const { h, c } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  type(h, "r");
  h.key("Backspace");
  const w = O.multi.afterBackspaceWithText;
  eq("Backspace with text takes a character, not a chip", chips(c).length, w.chip.length);
  eq("the box is empty again", rows(h)["cb-input"].text, w.input.value);
}
{
  const { h, c } = mk({ multiple: true });
  h.click("cb-input");
  h.key("ArrowLeft");
  eq("ArrowLeft with no chips stays in the input", h.focusId, O.multi.emptyAfterArrowLeft.focus === "input" ? "cb-input" : "?");
  eq("and leaves the list open", c.open, O.multi.emptyAfterArrowLeft.open);
}

console.log("SPECIFIED — what the capture could not reach");
{
  const { h } = mk({ multiple: true, values: ["JavaScript", "TypeScript"] });
  h.click("cb-input");
  h.key("ArrowLeft");
  h.key("ArrowLeft");
  h.key("ArrowRight");
  eq("ArrowRight from a chip goes to the next", h.focusId, "cb-chip-TypeScript");
  h.key("ArrowRight");
  eq("and past the last, to the input", h.focusId, "cb-input");
  const { h: h2, c: c2 } = mk({ value: "Python" });
  h2.click("cb-input");
  h2.key("Escape");
  h2.key("ArrowUp");
  eq("ArrowUp on a closed list opens it on the last row", c2.activeValue, "Go");
}

console.log(`\n${fail === 0 ? "RESULT OK" : "RESULT FAIL"}  pass=${pass} failed=${fail}  (reference @base-ui/react ${O.version})`);
if (fail === 0) console.log("ALL PASS");
process.exit(fail === 0 ? 0 : 1);
