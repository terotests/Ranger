/**
 * What a browser's own text-input session actually reports.
 *
 *   node gallery/ui/conformance/oracle/textinput_oracle.mjs
 *
 * Writes `textinput.json` beside this file.
 *
 * This is the oracle for the WEB TEXT BRIDGE: the plan is to stop turning
 * `keydown` into edits and instead let a real, hidden `<input>` own the
 * editing session, with Ranger mirroring its state. Before building that, the
 * question is what the browser hands over and when — because the whole
 * argument for the bridge is that the platform knows things we would
 * otherwise have to reimplement: IME, dead keys, the clipboard, undo,
 * platform word boundaries, and where a grapheme ends.
 *
 * Every answer below is recorded from a real `<input>` driven through the
 * DevTools protocol, including the IME composition — `Input.imeSetComposition`
 * is a real composition as far as the page is concerned, so the events are the
 * ones a Japanese or Chinese keyboard would produce rather than a simulation
 * of them.
 *
 * The five questions:
 *
 *   1. TYPING. What `beforeinput` carries, and whether `value` has already
 *      changed when it fires. That decides whether the bridge can be a plain
 *      "read the input afterwards" mirror or has to compute a diff.
 *   2. COMPOSITION. Whether the composing range is readable, since drawing it
 *      underlined is the one part of a text field a hidden proxy cannot do
 *      for us.
 *   3. THE CLIPBOARD and UNDO, which are two of the six things `InputCtl`
 *      says out loud that it does not implement.
 *   4. GRAPHEMES. What one Backspace removes from an emoji, a flag and a ZWJ
 *      family — the question `previousGraphemeBoundary` exists to answer.
 *   5. SELECTION, during and after all of it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const PAGE = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;font:16px system-ui} #f{width:420px;font:16px monospace}</style>
<input id="f">
<script>
window.__log = [];
const f = document.getElementById("f");
const snap = (kind, ev) => {
  window.__log.push({
    kind,
    inputType: ev && ev.inputType !== undefined ? ev.inputType : null,
    data: ev && ev.data !== undefined ? ev.data : null,
    isComposing: ev && ev.isComposing !== undefined ? !!ev.isComposing : null,
    value: f.value,
    selStart: f.selectionStart,
    selEnd: f.selectionEnd,
  });
};
for (const k of ["beforeinput", "input", "compositionstart", "compositionupdate",
                 "compositionend", "keydown", "paste", "cut"]) {
  f.addEventListener(k, (ev) => snap(k, ev));
}
document.addEventListener("selectionchange", () => snap("selectionchange", null));
window.__reset = (v) => {
  f.value = v === undefined ? "" : v;
  f.setSelectionRange(f.value.length, f.value.length);
  f.focus();
  window.__log = [];
};
window.__state = () => ({ value: f.value, selStart: f.selectionStart, selEnd: f.selectionEnd });
window.__READY__ = true;
</script>`;

assertDomInstalled();
const { chromium } = requireDom("playwright-core");

const file = path.join(HERE, ".textinput-probe.html");
fs.writeFileSync(file, PAGE);
const browser = await chromium.launch({ executablePath: findChromium() });
const context = await browser.newContext();
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
const page = await context.newPage();
await page.goto(pathToFileURL(file).href);
await page.waitForFunction("window.__READY__ === true");
const cdp = await context.newCDPSession(page);

const reset = (v) => page.evaluate((x) => window.__reset(x), v);
const log = () => page.evaluate(() => window.__log);
const state = () => page.evaluate(() => window.__state());
/** Drop `selectionchange`, which fires constantly and drowns the shape. */
const edits = async () => (await log()).filter((e) => e.kind !== "selectionchange");

const out = {};

// --- 1. plain typing ---------------------------------------------------------
await reset("ab");
await page.keyboard.type("c");
out.typing = {
  events: await edits(),
  $comment:
    "Whether `value` already carries the new character when `beforeinput` " +
    "fires decides the bridge's shape: if it does not, the bridge can simply " +
    "read the input on `input` and mirror it wholesale.",
};

// --- 2. IME composition, through the DevTools protocol -----------------------
// A real composition: the page cannot tell this from a Japanese keyboard.
await reset("");
await cdp.send("Input.imeSetComposition", {
  text: "にほ",
  selectionStart: 2,
  selectionEnd: 2,
});
const midComposition = await state();
await cdp.send("Input.imeSetComposition", {
  text: "にほん",
  selectionStart: 3,
  selectionEnd: 3,
});
const midComposition2 = await state();
await cdp.send("Input.insertText", { text: "日本" });
const afterCommit = await state();
out.composition = {
  events: await edits(),
  midComposition,
  midComposition2,
  afterCommit,
  $comment:
    "The composing range is what a field has to underline, and it is the one " +
    "part of this a hidden proxy cannot draw for us. If the range is not " +
    "readable from the events, the bridge has to track it from " +
    "compositionstart plus the data length.",
};

// --- 3. composition INSIDE existing text, and cancelled ----------------------
await reset("abcd");
await page.evaluate(() => document.getElementById("f").setSelectionRange(2, 2));
await cdp.send("Input.imeSetComposition", { text: "ろ", selectionStart: 1, selectionEnd: 1 });
out.compositionInsideText = { state: await state(), events: await edits() };
// Cancelling: an empty composition is how an IME withdraws.
await cdp.send("Input.imeSetComposition", { text: "", selectionStart: 0, selectionEnd: 0 });
out.compositionCancelled = { state: await state(), events: await edits() };

// --- 4. the clipboard --------------------------------------------------------
await reset("hello world");
await page.evaluate(() => document.getElementById("f").setSelectionRange(0, 5));
await page.keyboard.press("ControlOrMeta+c");
await page.evaluate(() => document.getElementById("f").setSelectionRange(6, 11));
await page.keyboard.press("ControlOrMeta+v");
out.clipboard = {
  events: await edits(),
  state: await state(),
  $comment: "Copy then paste over a different selection, with no code of ours.",
};

// --- 5. undo -----------------------------------------------------------------
await reset("start");
await page.keyboard.type("XYZ");
const beforeUndo = await state();
await page.keyboard.press("ControlOrMeta+z");
const afterUndo = await state();
await page.keyboard.press("ControlOrMeta+Shift+z");
out.undo = {
  beforeUndo,
  afterUndo,
  afterRedo: await state(),
  events: (await edits()).filter((e) => e.inputType && e.inputType.startsWith("history")),
  $comment:
    "Undo is one of the six things InputCtl says out loud that it does not " +
    "do. Through a native proxy it is not implemented at all — it is simply " +
    "there, and arrives as an inputType like any other edit.",
};

// --- 6. graphemes ------------------------------------------------------------
// One Backspace, over four shapes that a code-unit delete gets wrong.
out.backspace = [];
for (const [name, value] of [
  ["plain ascii", "abc"],
  ["combining acute", "café"],
  ["a BMP-external emoji", "hi\u{1F642}"],
  ["a regional-indicator flag", "hi\u{1F1EB}\u{1F1EE}"],
  ["a ZWJ family", "hi\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}"],
  ["a skin-tone modifier", "hi\u{1F44D}\u{1F3FD}"],
]) {
  await reset(value);
  const before = await state();
  await page.keyboard.press("Backspace");
  const after = await state();
  out.backspace.push({
    name,
    value,
    codeUnitsBefore: before.value.length,
    codeUnitsAfter: after.value.length,
    removed: before.value.length - after.value.length,
    result: after.value,
  });
}
out.backspaceComment =
  "How many CODE UNITS one Backspace removes. Anything other than 1 is a " +
  "shape that `caret - 1` breaks: it leaves half a surrogate pair, a bare " +
  "combining mark, or one flag letter. This is the table " +
  "`previousGraphemeBoundary` has to reproduce — or, through a native proxy, " +
  "never has to, because the browser has already done it.";

// --- 7. and ArrowLeft, which is a different question -------------------------
out.arrowLeft = [];
for (const [name, value] of [
  ["combining acute", "café"],
  ["a ZWJ family", "hi\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}"],
]) {
  await reset(value);
  await page.keyboard.press("ArrowLeft");
  const s = await state();
  out.arrowLeft.push({ name, value, caret: s.selStart, ofLength: value.length });
}

await browser.close();
fs.rmSync(file, { force: true });
fs.writeFileSync(path.join(HERE, "textinput.json"), JSON.stringify(out, null, 2) + "\n");

console.log("wrote gallery/ui/conformance/oracle/textinput.json");
const kinds = (o) => o.events.map((e) => e.kind + (e.inputType ? ":" + e.inputType : "")).join(" ");
console.log("typing     :", kinds(out.typing));
console.log("composition:", kinds(out.composition));
console.log("  mid      :", JSON.stringify(out.composition.midComposition), "->", JSON.stringify(out.composition.midComposition2));
console.log("  committed:", JSON.stringify(out.composition.afterCommit));
console.log("clipboard  :", kinds(out.clipboard), "->", JSON.stringify(out.clipboard.state));
console.log("undo       :", JSON.stringify(out.undo.beforeUndo), "->", JSON.stringify(out.undo.afterUndo), "->", JSON.stringify(out.undo.afterRedo));
console.log("backspace  :", out.backspace.map((b) => `${b.name}=${b.removed}`).join("  "));
console.log("arrowLeft  :", out.arrowLeft.map((a) => `${a.name}: ${a.caret}/${a.ofLength}`).join("  "));
