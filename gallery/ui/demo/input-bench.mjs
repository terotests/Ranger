#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Every text field on every demo page, against the browser's own <input>.
//
//   node gallery/ui/demo/input-bench.mjs            # score against the baseline
//   node gallery/ui/demo/input-bench.mjs --record   # rewrite the baseline
//   node gallery/ui/demo/input-bench.mjs --only=fm-name --verbose
//
// WHY THIS EXISTS. The fields on these pages do not behave like the fields on
// a shadcn page, and nothing said so. Nine conformance specs drive `InputCtl`
// against a real <input> and pass; `ui:demo:page` clicks one field on one
// form and types into it. Between those two there is a gap the size of the
// complaint: sixteen text boxes on five pages, and for fourteen of them no
// gate has ever clicked at a character, dragged across a word, pasted, or
// pressed Tab. A component that is measured in isolation and wired by hand on
// every page is only as good as the page it is on.
//
// So this is a MATRIX, not a story. Rows are fields, discovered from the
// accessibility tree of each page — a field that is added is benchmarked
// without anyone remembering to. Columns are scenarios, and every scenario is
// run twice: once on the drawn field, with a real pointer and a real
// keyboard, and once on a native <input> given the same value, the same
// attributes, the same font and the same box — the browser is the oracle,
// which is the same rule the conformance harness uses and the only reference
// that cannot be argued with. After every step both sides report value,
// selection and focus, and the cell is green only if every observation agrees.
//
// WHAT A RED CELL MEANS. Not that the controller is wrong — the controller
// passes its specs. That THIS FIELD ON THIS PAGE does not do what the same
// gesture does in a browser: a page that routes a click through the wrong
// door, a demo that draws a field and never opened an editing session for it,
// a caret that is one pixel off because the text starts where the CSS did not
// say. Those are the defects a person sees and a unit test cannot.
//
// WHAT IS NOT MEASURED, AND SAID SO. A cell reads `–` when the scenario does
// not apply (IME into a digits-only field), and `?` when the page publishes
// no selection to compare — a field with no editing session has a value in
// the tree and nothing else, and "unobservable" is a finding about the page,
// not an exemption from the score.
//
// The baseline is checked in. A cell that goes red fails the run; a cell that
// goes green ALSO fails the run until the baseline is re-recorded, so the file
// always says what the pages actually do. `input-catalogue.json` beside it is
// the denominator: the shadcn and reui demo variants, and which field here
// stands for each — a variant with no field is printed as MISSING, and stays
// on the list.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireHostTool, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const BASELINE = path.join(HERE, "input-bench-baseline.json");
const CATALOGUE = path.join(HERE, "input-catalogue.json");

const argv = process.argv.slice(2);
const RECORD = argv.includes("--record");
const VERBOSE = argv.includes("--verbose");
// `--only=fm-name,fm-amount` narrows the rows; a narrowed `--record` merges
// those rows into the baseline and leaves the rest as they were.
const ONLY = (argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
// `--scenario=drag,undo` narrows the columns while a scenario is being written.
// A narrowed run never writes the baseline.
const SCEN = (argv.find((a) => a.startsWith("--scenario=")) || "").slice(11).split(",").filter(Boolean);

if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `node gallery/ui/demo/build.mjs` first");
  process.exit(3);
}

// --- the page, served the way a person loads it --------------------------------

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
const URL_ = `http://127.0.0.1:${port}/gallery/ui/demo/index.html`;

const { chromium } = requireHostTool("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
const page = await context.newPage();
// The oracle lives on a page of its own. On the demo page a window-level
// keydown handler and a canvas that takes focus on every pointerdown would
// both reach into the reference, and a reference that can be disturbed by the
// thing it measures is not a reference.
const oraclePage = await context.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`uncaught: ${e.message.split("\n")[0]}`));
page.on("console", (m) => { if (m.type() === "error") problems.push(`console.error: ${m.text().split("\n")[0]}`); });

let loaded = false;
async function load(demoName) {
  // The page once; after that the demo is rebuilt in place, which is what a
  // reload would give and 10 MB cheaper. See `__resetDemo` in main.js.
  const reset = loaded && await page.evaluate((n) => (window.__resetDemo ? window.__resetDemo(n) : false), demoName);
  if (!reset) {
    await page.goto(URL_, { waitUntil: "load" });
    await page.waitForFunction("document.querySelector('#stage canvas') !== null", null, { timeout: 15000 });
    loaded = true;
  }
  await page.click(`#demos input[value="${demoName}"]`);
  await page.waitForTimeout(reset ? 80 : 200);
  if (PREP[demoName]) await PREP[demoName]();
}

// A field that only exists once something else has been opened. The dialog's
// two inputs are in the tree while the dialog is shut, with no box to click.
const PREP = {
  dialog: async () => {
    const r = await mirrorRect("dlg-trigger");
    if (r) { await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await page.waitForTimeout(250); }
  },
};

// --- reading the page ----------------------------------------------------------

const a11y = () => page.evaluate(() => JSON.parse(window.__lastA11y || "{}"));
const cmds = () => page.evaluate(() => (JSON.parse(window.__lastList || "{}").cmds || []));
const fieldState = (tid) => page.evaluate((t) => window.__fieldState ? window.__fieldState(t) : null, tid);
const focusedField = () => page.evaluate(() => (window.__focusedField ? window.__focusedField() : ""));
const canvasRect = () => page.evaluate(() => {
  const r = document.querySelector("#stage canvas").getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
const mirrorRect = (tid) => page.evaluate((t) => {
  const el = document.querySelector(`[data-a11y-id="${t}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}, tid);
const mirrorAttrs = (tid) => page.evaluate((t) => {
  const el = document.querySelector(`[data-a11y-id="${t}"]`);
  if (!el) return null;
  const a = (n) => el.getAttribute(n);
  return {
    tag: el.tagName, role: a("role") || (el.tagName === "INPUT" ? "textbox" : null),
    label: a("aria-label"), value: el.tagName === "INPUT" ? el.value : null,
    required: a("aria-required"), invalid: a("aria-invalid"), readonly: a("aria-readonly"),
    description: a("aria-description"), pressed: a("aria-pressed"),
    focused: document.activeElement === el,
  };
}, tid);
// The hidden native <input> the text bridge edits in, if one is active.
const proxy = () => page.evaluate(() => {
  const i = [...document.querySelectorAll("input")].find((x) => x.getAttribute("aria-hidden") === "true");
  return i ? { value: i.value, s: i.selectionStart, e: i.selectionEnd, type: i.type,
               maxLength: i.maxLength, focused: document.activeElement === i } : null;
});

// The strings drawn inside a box, left to right. Read off the display list
// rather than the tree: the tree says what a field HOLDS, the list says what a
// person SEES, and for a password and a placeholder those are different by
// design.
async function drawnIn(box) {
  const all = await cmds();
  return all
    .filter((c) => c.text && c.y >= box.y - 1 && c.y <= box.y + box.h && c.x >= box.x - 1 && c.x <= box.x + box.w)
    .sort((a, b) => a.x - b.x);
}

// --- discovery -----------------------------------------------------------------

const demoNames = async () => {
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForFunction("document.querySelector('#stage canvas') !== null", null, { timeout: 15000 });
  return page.evaluate(() => [...document.querySelectorAll("#demos input[type=radio]")].map((r) => r.value));
};

const MEASURED_ELSEWHERE = new Set(["spinbutton", "One-time code"]);
const elsewhere = [];

async function discover() {
  const fields = [];
  for (const demo of await demoNames()) {
    await load(demo);
    const tree = await a11y();
    for (const n of tree.nodes || []) {
      if (n.role !== "textbox") continue;
      // A textbox whose roledescription names a component with an oracle of
      // its own is not a text field and is not scored against one: the date
      // field's segments (`spinbutton`, Chromium's own date input in
      // ui:datefield:check) and the one-time code (`One-time code`, input-otp
      // in ui:otp:check) normalise their selection on purpose, and every
      // divergence from a plain <input> here would be the measured rule.
      if (MEASURED_ELSEWHERE.has(n.roledesc)) {
        elsewhere.push(`${demo}/${n.id} (${n.roledesc})`);
        continue;
      }
      if (ONLY.length && !ONLY.includes(n.id)) continue;
      // A toggle drawn inside the field — the password's eye — is the field's
      // child in the tree, and the masking scenario needs to know it is there.
      const toggle = (tree.nodes || []).find((c) => c.p === n.id && c.role === "button");
      fields.push({ demo, tid: n.id, name: n.name, node: n, toggle: toggle ? toggle.id : null });
    }
    if (ONLY.length && fields.length >= ONLY.length) break;
  }
  return fields;
}

// --- the two drivers -----------------------------------------------------------
//
// One interface, two subjects. A scenario is a list of steps; `run` performs
// each step on a driver and reads the same four things back after it, so the
// two traces line up step for step and diff like the conformance harness's.

const MOD = { Shift: "Shift", Control: "ControlOrMeta" };
const chord = (key, mods = []) => [...mods.map((m) => MOD[m] || m), key].join("+");

function rangerDriver(f) {
  // `origin` is where the field's text begins on the page, in CSS pixels; a
  // click at `dx` lands `dx` pixels into the text on BOTH sides, so the two
  // boxes need not be the same width, have the same prefix, or sit anywhere in
  // particular. The y is the box's centre line.
  //
  // WHOLE PIXELS, on both sides. Measured: a backward drag from 56.72 to
  // 22.06 collapses to a caret in Chromium where the same drag from 57 to 22
  // selects [3,9]. A real pointer never reports a fraction; a fraction here
  // would be measuring a synthetic event, not a gesture.
  const at = (dx) => ({ x: Math.round(f.origin.x + dx), y: Math.round(f.origin.y) });
  return {
    side: "ranger",
    async click(dx, mods = []) {
      const p = at(dx);
      if (mods.includes("Shift")) await page.keyboard.down("Shift");
      await page.mouse.click(p.x, p.y);
      if (mods.includes("Shift")) await page.keyboard.up("Shift");
      await page.waitForTimeout(90);
    },
    async dblclick(dx) { const p = at(dx); await page.mouse.dblclick(p.x, p.y); await page.waitForTimeout(90); },
    async drag(dx1, dx2) {
      const a = at(dx1); const b = at(dx2);
      await page.mouse.move(a.x, a.y); await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 6 }); await page.waitForTimeout(40);
      await page.mouse.up(); await page.waitForTimeout(90);
    },
    async key(k, mods) { await page.keyboard.press(chord(k, mods)); await page.waitForTimeout(70); },
    async type(s) { await page.keyboard.type(s); await page.waitForTimeout(90); },
    async insert(s) { await page.keyboard.insertText(s); await page.waitForTimeout(90); },
    async compose(text, commit) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.imeSetComposition", { text, selectionStart: text.length, selectionEnd: text.length });
      await page.waitForTimeout(90);
      if (commit != null) { await cdp.send("Input.insertText", { text: commit }); await page.waitForTimeout(90); }
      await cdp.detach();
    },
    // One round trip: the model's state if the page has an editing session,
    // else the tree's value — which is all a page without one publishes.
    read: () => page.evaluate((tid) => {
      const st = window.__fieldState ? window.__fieldState(tid) : null;
      if (st) {
        return { value: st.value, selStart: st.selStart, selEnd: st.selEnd,
                 focused: (window.__focusedField ? window.__focusedField() : "") === tid };
      }
      const tree = JSON.parse(window.__lastA11y || "{}");
      const node = (tree.nodes || []).find((n) => n.id === tid) || {};
      return { value: node.value == null ? "" : node.value, selStart: null, selEnd: null,
               focused: tree.focus === tid };
    }, f.tid),
  };
}

function oracleDriver(f) {
  const at = (dx) => ({ x: Math.round(f.oracle.origin.x + dx), y: Math.round(f.oracle.origin.y) });
  return {
    side: "oracle",
    async click(dx, mods = []) {
      const p = at(dx);
      if (mods.includes("Shift")) await oraclePage.keyboard.down("Shift");
      await oraclePage.mouse.click(p.x, p.y);
      if (mods.includes("Shift")) await oraclePage.keyboard.up("Shift");
      await oraclePage.waitForTimeout(30);
    },
    async dblclick(dx) { const p = at(dx); await oraclePage.mouse.dblclick(p.x, p.y); await oraclePage.waitForTimeout(30); },
    async drag(dx1, dx2) {
      const a = at(dx1); const b = at(dx2);
      await oraclePage.mouse.move(a.x, a.y); await oraclePage.mouse.down();
      await oraclePage.mouse.move(b.x, b.y, { steps: 6 }); await oraclePage.waitForTimeout(20);
      await oraclePage.mouse.up(); await oraclePage.waitForTimeout(30);
    },
    async key(k, mods) { await oraclePage.keyboard.press(chord(k, mods)); await oraclePage.waitForTimeout(20); },
    async type(s) { await oraclePage.keyboard.type(s); await oraclePage.waitForTimeout(30); },
    async insert(s) { await oraclePage.keyboard.insertText(s); await oraclePage.waitForTimeout(30); },
    async compose(text, commit) {
      const cdp = await context.newCDPSession(oraclePage);
      await cdp.send("Input.imeSetComposition", { text, selectionStart: text.length, selectionEnd: text.length });
      await oraclePage.waitForTimeout(30);
      if (commit != null) { await cdp.send("Input.insertText", { text: commit }); await oraclePage.waitForTimeout(30); }
      await cdp.detach();
    },
    read: () => oraclePage.evaluate(() => {
      const i = document.querySelector("#oracle");
      return { value: i.value, selStart: i.selectionStart, selEnd: i.selectionEnd,
               focused: document.activeElement === i };
    }),
  };
}

// The reference: a bare <input> with the field's own value, kind, attributes,
// font and box. Bare on purpose — no library between the gesture and the
// platform, because the platform is the claim. `box-sizing: border-box` with
// a 1px border and 10px of padding is the demo's `.fm-box`, so the text starts
// 11px into the box on both sides.
async function makeOracle(f) {
  const st = f.state || {};
  const attrs = [
    `type="${st.kind === "password" ? "password" : "text"}"`,
    st.readOnly ? "readonly" : "",
    st.disabled || f.node.disabled ? "disabled" : "",
    st.maxLength > 0 ? `maxlength="${st.maxLength}"` : "",
    st.placeholder ? `placeholder="${esc(st.placeholder)}"` : "",
    `value="${esc(st.value == null ? f.node.value || "" : st.value)}"`,
  ].filter(Boolean).join(" ");
  const w = Math.max(120, Math.round(f.box.w));
  await oraclePage.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
    <input id="oracle" ${attrs} aria-label="${esc(f.name)}"
      style="position:absolute;left:40px;top:40px;box-sizing:border-box;width:${w}px;height:36px;
             border:1px solid #e4e4e7;border-radius:8px;padding:0 10px;margin:0;
             font:${f.font.size}px ${f.font.family};color:#18181b;background:#fff;outline:none">
    <canvas id="m" width="10" height="10"></canvas></body></html>`);
  const r = await oraclePage.evaluate(() => {
    const b = document.querySelector("#oracle").getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  f.oracle = { rect: r, origin: { x: r.x + 11, y: r.y + r.h / 2 } };
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// How wide the field's text is, in the reference font — the scenarios click at
// fractions of it, and a fraction of the WIDTH of the box is the mistake
// `page-check.mjs` documents: on a 370px box holding 79px of text, a third of
// the box is well past the end of the text.
const measure = (text, font) => oraclePage.evaluate(([t, f]) => {
  const c = document.querySelector("#m").getContext("2d");
  c.font = `${f.size}px ${f.family}`;
  return c.measureText(t).width;
}, [text, font]);

// --- the scenarios -------------------------------------------------------------
//
// `steps` is a script both drivers run; after each step both are read and the
// four fields compared. `applies` narrows a scenario to the fields it can be
// asked of. `check` is a Ranger-only assertion list for the things a native
// <input> cannot be compared against — what is DRAWN, what the mirror says,
// where the proxy is.

const OBS = ["value", "selStart", "selEnd", "focused"];

const COMPARED = [
  {
    key: "focus", label: "click focuses",
    steps: (f) => [{ click: f.mid }],
  },
  {
    key: "caret", label: "click → caret at the nearer boundary",
    applies: (f) => f.textW > 0,
    steps: (f) => [...f.points.map((p) => ({ click: p })), { click: f.textW + 30 }, { click: -4 }],
  },
  {
    key: "type", label: "typing inserts at the caret",
    steps: (f) => [{ click: f.mid }, { type: f.digits ? "42" : "xY" }, { key: "Home" }, { type: f.digits ? "7" : "Q" }],
  },
  {
    key: "arrows", label: "Home/End, Arrow, Shift+Arrow",
    steps: (f) => [{ click: f.mid }, { key: "Home" }, { key: "ArrowRight" }, { key: "ArrowRight" },
      { key: "ArrowRight", mods: ["Shift"] }, { key: "ArrowRight", mods: ["Shift"] }, { key: "ArrowLeft" },
      { key: "End" }, { key: "ArrowLeft", mods: ["Shift"] }, { key: "Home", mods: ["Shift"] }],
  },
  {
    key: "word", label: "Ctrl+Arrow moves by a word",
    applies: (f) => f.textW > 0,
    steps: (f) => [{ click: f.q1 }, { key: "Home" }, { key: "ArrowRight", mods: ["Control"] },
      { key: "ArrowRight", mods: ["Control"] }, { key: "ArrowLeft", mods: ["Control"] },
      { key: "ArrowRight", mods: ["Control", "Shift"] }, { key: "End" }, { key: "ArrowLeft", mods: ["Control"] }],
  },
  {
    key: "delete", label: "Backspace, Delete, and over a selection",
    steps: (f) => [{ click: f.mid }, { key: "End" }, { key: "Backspace" }, { key: "Home" }, { key: "Delete" },
      { key: "ArrowRight", mods: ["Shift"] }, { key: "ArrowRight", mods: ["Shift"] }, { key: "Backspace" },
      { key: "a", mods: ["Control"] }, { key: "Delete" }],
  },
  {
    key: "dblclick", label: "double-click takes the run under the pointer",
    applies: (f) => f.textW > 0,
    steps: (f) => [{ dblclick: f.q3 }, { dblclick: f.q1 }],
  },
  {
    key: "drag", label: "a drag selects, and keeps selecting past the edge",
    applies: (f) => f.textW > 0,
    // A collapsing click between drags. A press INSIDE a selection starts a
    // drag of the selected text, not a new selection — a real platform rule,
    // and one this bench does not claim; measured, the third drag read [3,9]
    // on the reference when it began on the second drag's selection.
    steps: (f) => [{ drag: [f.q1, f.q3] }, { click: -4 }, { drag: [f.q3, f.q1] }, { click: -4 }, { drag: [f.q1, f.textW + 400] }],
  },
  {
    key: "shiftclick", label: "Shift+click extends from the anchor",
    applies: (f) => f.textW > 0,
    // The plain click lands OUTSIDE the selection the first two made. A press
    // inside a selection is the start of a text drag in the browser, and in a
    // readonly field Chromium then collapses to 0 on release rather than to
    // the press — a rule about dragging text, which is not this column's.
    steps: (f) => [{ click: f.q3 }, { click: f.q1, mods: ["Shift"] }, { click: -4 }, { click: f.mid, mods: ["Shift"] }],
  },
  {
    key: "clipboard", label: "copy, cut, paste",
    // A digits field copies its first two characters rather than all of them:
    // pasting "1250.00" after itself would ask the field to hold a second
    // separator, which its filter refuses by design and a bare <input> does
    // not — that rule is the `kind` column's, not this one's.
    steps: (f) => [{ click: f.mid }, { key: "Home" },
      ...(f.digits ? [{ key: "ArrowRight", mods: ["Shift"] }, { key: "ArrowRight", mods: ["Shift"] }] : [{ key: "a", mods: ["Control"] }]),
      { key: "c", mods: ["Control"] },
      { key: "End" }, { key: "v", mods: ["Control"] }, { key: "a", mods: ["Control"] }, { key: "x", mods: ["Control"] },
      { key: "v", mods: ["Control"] }],
  },
  {
    key: "undo", label: "undo reverses typing, back to the start",
    steps: (f) => [{ click: f.mid }, { key: "End" }, { type: f.digits ? "99" : "zz" }, { undoAll: true }],
  },
  {
    key: "maxlength", label: "the value never grows past maxlength",
    applies: (f) => (f.state && f.state.maxLength > 0),
    steps: (f) => [{ click: f.mid }, { key: "End" }, { type: (f.digits ? "1234567890" : "abcdefghij").repeat(3) }],
  },
  {
    key: "grapheme", label: "one Backspace removes a whole ZWJ family",
    applies: (f) => !f.digits && f.state && !f.state.readOnly && !f.state.disabled,
    steps: (f) => [{ click: f.mid }, { key: "End" }, { insert: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}" },
      { key: "Backspace" }, { insert: "é" }, { key: "ArrowLeft" }, { key: "Backspace" }],
  },
  {
    key: "ime", label: "a live composition, then its commit",
    applies: (f) => !f.digits && f.state && !f.state.readOnly && !f.state.disabled,
    steps: (f) => [{ click: f.mid }, { key: "End" }, { compose: ["にほ", null] }, { compose: ["にほん", "日本"] }],
  },
];

// Ranger-only: the parts of a field a native <input> has no answer for, or
// answers in a place the comparison cannot see.
const CHECKED = [
  {
    key: "proxy", label: "a focused field hands the keyboard to a real input",
    check: async (f, d) => {
      await d.click(f.mid);
      const p = await proxy();
      const st = f.state;
      const disabled = !!(st && st.disabled) || !!f.node.disabled;
      if (disabled) return p && p.focused ? [`a disabled field opened a session ${JSON.stringify(p)}`] : [];
      const out = [];
      if (!p || !p.focused) out.push(`no focused proxy ${JSON.stringify(p)}`);
      if (p && st && p.type !== (st.kind === "password" ? "password" : "text")) out.push(`proxy type ${p.type} for kind ${st.kind}`);
      if (p && st && st.maxLength > 0 && p.maxLength !== st.maxLength) out.push(`proxy maxlength ${p.maxLength} want ${st.maxLength}`);
      const cur = await page.evaluate(() => document.querySelector("#stage canvas").style.cursor);
      if (cur !== "text") out.push(`cursor over the text is "${cur}", not "text"`);
      return out;
    },
  },
  {
    key: "ring", label: "a focused field is drawn as one",
    // The invoice form had no `:focus` rule at all: Tab moved the focus, the
    // caret was the only sign of it, and a readonly field draws no caret. The
    // BORDER command of the box is what a person sees change, so that is what
    // is compared — its colour before the click and after.
    applies: (f) => !(f.state && f.state.disabled) && !f.node.disabled,
    check: async (f, d) => {
      const borderOf = async () => {
        const all = await cmds();
        const b = all.find((c) => c.k === 1 && Math.abs(c.x - f.box.x) < 1 && Math.abs(c.y - f.box.y) < 1 && Math.abs(c.w - f.box.w) < 1);
        return b ? JSON.stringify(b.c) : null;
      };
      // Focused first, then not: a page may open with this very field focused
      // — the invoice form starts on Amount, the profile on Full Name — so
      // "before the click" is not reliably the unfocused picture. Tab moves the
      // focus on; the border must differ between the two states.
      await d.click(f.mid);
      const focused = await borderOf();
      await d.key("Tab");
      const unfocused = await borderOf();
      if (!focused) return ["no border command found on the box"];
      if (focused === unfocused) return [`the box is drawn the same focused and not: border ${focused}`];
      return [];
    },
  },
  {
    key: "placeholder", label: "the placeholder shows when empty and is never the value",
    applies: (f) => !!(f.state && f.state.placeholder && !f.state.readOnly && !f.state.disabled),
    check: async (f, d) => {
      const out = [];
      await d.click(f.mid);
      await d.key("a", ["Control"]); await d.key("Backspace");
      const shown = (await drawnIn(f.box)).map((c) => c.text);
      const r0 = await d.read();
      if (r0.value !== "") out.push(`value after clearing is ${JSON.stringify(r0.value)}`);
      if (!shown.includes(f.state.placeholder)) out.push(`placeholder ${JSON.stringify(f.state.placeholder)} not drawn; drawn: ${JSON.stringify(shown)}`);
      const m = await mirrorAttrs(f.tid);
      if (m && m.value !== "") out.push(`the mirror reads ${JSON.stringify(m.value)} for an empty field`);
      await d.type(f.digits ? "1" : "a");
      const after = (await drawnIn(f.box)).map((c) => c.text);
      if (after.includes(f.state.placeholder)) out.push("placeholder still drawn after typing");
      return out;
    },
  },
  {
    key: "mask", label: "a password draws bullets, tells a reader nothing, and the eye reveals it",
    applies: (f) => !!(f.state && f.state.kind === "password"),
    check: async (f, d) => {
      const out = [];
      await d.click(f.mid);
      await d.key("End");
      await d.type("abc");
      const st = await fieldState(f.tid);
      const drawn = (await drawnIn(f.box)).map((c) => c.text);
      const bullets = drawn.find((t) => /^[•●•*]+$/.test(t));
      if (drawn.includes(st.value)) out.push(`the value ${JSON.stringify(st.value)} is drawn in clear`);
      if (!bullets || bullets.length !== st.value.length) out.push(`bullets ${JSON.stringify(bullets)} for a ${st.value.length}-char value`);
      const tree = await a11y();
      const node = (tree.nodes || []).find((n) => n.id === f.tid) || {};
      if (node.value) out.push(`the tree carries the password ${JSON.stringify(node.value)}`);
      if (!f.toggle) { out.push("no reveal toggle inside the field"); return out; }
      const eye0 = await mirrorAttrs(f.toggle);
      if (!eye0 || eye0.pressed !== "false") out.push(`toggle before: ${JSON.stringify(eye0)}`);
      const r = await mirrorRect(f.toggle);
      if (!r || r.w === 0) { out.push(`toggle has no box in the mirror ${JSON.stringify(r)}`); return out; }
      await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await page.waitForTimeout(150);
      const eye1 = await mirrorAttrs(f.toggle);
      if (!eye1 || eye1.pressed !== "true") out.push(`toggle after press: ${JSON.stringify(eye1)}`);
      const clear = (await drawnIn(f.box)).map((c) => c.text);
      if (!clear.includes(st.value)) out.push(`value not revealed; drawn: ${JSON.stringify(clear)}`);
      const p = await proxy();
      if (p && p.focused && p.type !== "text") out.push(`proxy still type=${p.type} while revealed`);
      await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await page.waitForTimeout(150);
      const back = (await drawnIn(f.box)).map((c) => c.text);
      if (back.includes(st.value)) out.push("second press did not mask it again");
      return out;
    },
  },
  {
    key: "mirror", label: "the mirror says what the field is, holds, and claims",
    check: async (f) => {
      const out = [];
      const m = await mirrorAttrs(f.tid);
      if (!m) return ["no mirror element"];
      if (m.tag !== "INPUT") out.push(`mirrored as <${m.tag.toLowerCase()}>, not a native input`);
      if (m.label !== f.name) out.push(`aria-label ${JSON.stringify(m.label)} want ${JSON.stringify(f.name)}`);
      const n = f.node;
      const st = f.state;
      const want = st && st.kind === "password" ? "" : (n.value == null ? "" : n.value);
      if (m.value !== want) out.push(`mirror value ${JSON.stringify(m.value)} want ${JSON.stringify(want)}`);
      if ((m.required || null) !== (n.required || null)) out.push(`aria-required ${m.required} want ${n.required || null}`);
      if ((m.invalid || null) !== (n.invalid || null)) out.push(`aria-invalid ${m.invalid} want ${n.invalid || null}`);
      if ((m.readonly || null) !== (n.readonly || null)) out.push(`aria-readonly ${m.readonly} want ${n.readonly || null}`);
      if (st && st.readOnly && n.readonly !== "true") out.push("a readonly field claims nothing about it");
      if ((m.description || null) !== (n.desc || null)) out.push(`aria-description ${JSON.stringify(m.description)} want ${JSON.stringify(n.desc || null)}`);
      // The model and the tree agree about the value. `null` state (no session)
      // is reported by the `?` cells, not here.
      if (st && st.kind !== "password" && st.value !== (n.value == null ? "" : n.value)) {
        out.push(`the tree says ${JSON.stringify(n.value)} and the model ${JSON.stringify(st.value)}`);
      }
      return out;
    },
  },
  {
    key: "tab", label: "Tab leaves for the next stop and Shift+Tab comes back",
    applies: (f) => !!(f.state && !f.state.disabled) && !f.node.disabled,
    check: async (f, d) => {
      const out = [];
      await d.click(f.mid);
      if ((await focusedField()) !== f.tid) out.push(`the session says ${JSON.stringify(await focusedField())} after the click`);
      await d.key("Tab");
      const ff = await focusedField();
      const p = await proxy();
      if (ff === f.tid) out.push("Tab left focus on the field");
      if (ff) {
        // The next stop is a text field: the session moves with it, seeded
        // with THAT field's value.
        const next = await fieldState(ff);
        if (!p || !p.focused) out.push(`the proxy did not follow the Tab to ${ff}`);
        else if (next && p.value !== next.value) out.push(`the proxy holds ${JSON.stringify(p.value)} on ${ff}, whose value is ${JSON.stringify(next.value)}`);
      } else if (p && p.focused) {
        out.push("focus left the fields and the proxy kept the keyboard");
      }
      const r1 = await d.read();
      if (r1.focused) out.push("the field still reads as focused after Tab");
      await d.key("Tab", ["Shift"]);
      const back = await focusedField();
      if (back !== f.tid) out.push(`Shift+Tab came back to ${JSON.stringify(back)}`);
      return out;
    },
  },
  {
    key: "kind", label: "a digits field refuses letters; a text field takes them",
    applies: (f) => !!(f.state && !f.state.readOnly && !f.state.disabled),
    check: async (f, d) => {
      await d.click(f.mid);
      await d.key("a", ["Control"]);
      await d.type("12ab3");
      const st = await fieldState(f.tid);
      const want = f.digits ? "123" : "12ab3";
      return st.value === want ? [] : [`typed "12ab3", field holds ${JSON.stringify(st.value)}, want ${JSON.stringify(want)}`];
    },
  },
];

const SCENARIOS = [...COMPARED, ...CHECKED].filter((s) => !SCEN.length || SCEN.includes(s.key));

// --- running one scenario on one driver ---------------------------------------

async function perform(d, step, f) {
  if ("click" in step) return d.click(step.click, step.mods);
  if ("dblclick" in step) return d.dblclick(step.dblclick);
  if ("drag" in step) return d.drag(step.drag[0], step.drag[1]);
  if ("key" in step) return d.key(step.key, step.mods);
  if ("type" in step) return d.type(step.type);
  if ("insert" in step) return d.insert(step.insert);
  if ("compose" in step) return d.compose(step.compose[0], step.compose[1]);
  if ("undoAll" in step) {
    // Granularity is the browser's business, and it differs between a bare
    // <input> and one whose value has been written to: the oracle coalesces
    // "zz" into one undo and the page may take two. So undo until it stops
    // changing, at most eight times, and compare where it ENDS.
    let prev = await d.read();
    const hist = [];
    for (let i = 0; i < 8; i++) {
      await d.key("z", ["Control"]);
      const now = await d.read();
      if (VERBOSE) hist.push(`${JSON.stringify(now.value)} [${now.selStart},${now.selEnd}]` +
        (d.side === "ranger" ? ` proxy=${JSON.stringify(await proxy())}` : ""));
      if (now.value === prev.value) break;
      prev = now;
    }
    if (VERBOSE) d.lastHist = hist;
    return;
  }
  throw new Error("unknown step " + JSON.stringify(step));
}

const describe = (step) => {
  const k = Object.keys(step).find((x) => x !== "mods");
  const v = step[k];
  return `${k} ${Array.isArray(v) ? v.join("→") : typeof v === "number" ? Math.round(v) : JSON.stringify(v)}` +
    (step.mods ? ` [${step.mods.join("+")}]` : "");
};

async function trace(d, steps, f) {
  const out = [];
  for (const step of steps) {
    await perform(d, step, f);
    out.push({ step: describe(step), ...(await d.read()), hist: d.lastHist });
    d.lastHist = undefined;
  }
  return out;
}

function diff(r, o) {
  const diffs = [];
  let observations = 0;
  let matched = 0;
  let unobservable = 0;
  for (let i = 0; i < o.length; i++) {
    for (const k of OBS) {
      observations++;
      const rv = r[i] ? r[i][k] : undefined;
      const ov = o[i][k];
      if (rv === null && k !== "value") { unobservable++; diffs.push({ step: o[i].step, field: k, ranger: "?", oracle: ov }); continue; }
      if (rv === ov) matched++;
      else diffs.push({ step: o[i].step, field: k, ranger: rv, oracle: ov });
    }
  }
  return { diffs, observations, matched, unobservable };
}

// --- one field --------------------------------------------------------------

async function prepareField(f) {
  await load(f.demo);
  f.state = await fieldState(f.tid);
  const cr = await canvasRect();
  const tree = await a11y();
  f.node = (tree.nodes || []).find((n) => n.id === f.tid) || f.node;
  const b = f.node.b || [0, 0, 0, 0];
  // App pixels are canvas-relative CSS pixels here (dpr 1 in this viewport).
  f.box = { x: b[0], y: b[1], w: b[2], h: b[3] };
  f.mirror = await mirrorRect(f.tid);
  const shown = await drawnIn(f.box);
  const value = f.state ? f.state.value : (f.node.value || "");
  // Where the text begins. The run that IS the value, or the bullets standing
  // in for it, or the placeholder — whichever is drawn. Failing all of those,
  // the box's content edge.
  const run = shown.find((c) => c.text === value)
    || shown.find((c) => /^[•●•*]+$/.test(c.text))
    || (f.state && f.state.placeholder ? shown.find((c) => c.text === f.state.placeholder) : null);
  f.font = run ? { family: run.font || "Arial", size: run.size || 13 } : { family: "Arial", size: 13 };
  const ox = run ? run.x : f.box.x + 11;
  f.origin = { x: cr.x + ox, y: cr.y + f.box.y + f.box.h / 2 };
  await makeOracle(f);
  const shownText = f.state && f.state.kind === "password" ? "•".repeat(value.length) : value;
  f.textW = value ? await measure(shownText, f.font) : 0;
  // WHERE TO CLICK. Not at fractions of the text width: a fraction lands on a
  // glyph boundary's midpoint by chance — measured, 0.5 × 87.5px on
  // "INV-2026-0148" is 44px and the boundary between 6 and 7 is at 40.4 and
  // 47.6, so the click was a tie that the two sides rounded apart. The rule
  // under test is "the nearer boundary", so the points are chosen INSIDE
  // glyphs at 30% and 70% of their advance, and only in glyphs at least 6px
  // wide, so a half-pixel of rounding cannot move a point across the middle.
  // This is how `conformance/oracle/pointer.json` was measured as well.
  const widths = [0];
  for (let i = 1; i <= shownText.length; i++) widths.push(await measure(shownText.slice(0, i), f.font));
  const wide = [];
  for (let i = 0; i < shownText.length; i++) if (widths[i + 1] - widths[i] >= 6) wide.push(i);
  const pick = (frac) => wide.length ? wide[Math.min(wide.length - 1, Math.floor(wide.length * frac))] : -1;
  const into = (i, frac) => (i < 0 ? f.textW * frac : widths[i] + (widths[i + 1] - widths[i]) * frac);
  const a = pick(0.15), m = pick(0.5), z = pick(0.85);
  f.q1 = into(a, 0.3);
  f.mid = f.textW > 0 ? into(m, 0.3) : 20;
  f.q3 = into(z, 0.7);
  // The caret scenario's extra points: the far side of the same glyphs.
  f.points = [f.q1, into(a, 0.7), f.mid, into(m, 0.7), into(z, 0.3), f.q3];
  f.digits = !!(f.state && f.state.kind === "number");
  if (VERBOSE && !f.reported) {
    f.reported = true;
    console.log(`\n    box ${JSON.stringify(f.box)} origin ${JSON.stringify(f.origin)} textW ${f.textW.toFixed(1)} font ${JSON.stringify(f.font)} state ${JSON.stringify(f.state)} oracle ${JSON.stringify(f.oracle.origin)}`);
  }
}

async function benchField(f) {
  const cells = {};
  const details = {};
  for (const sc of SCENARIOS) {
    problems.length = 0;
    await prepareField(f);
    if (sc.applies && !sc.applies(f)) { cells[sc.key] = "na"; continue; }
    if (sc.steps) {
      const steps = sc.steps(f);
      const r = await trace(rangerDriver(f), steps, f);
      const o = await trace(oracleDriver(f), steps, f);
      const d = diff(r, o);
      // A real disagreement is a divergence whatever else is missing; a trace
      // that is only missing its selection is unobservable, not wrong.
      const real = d.diffs.filter((x) => x.ranger !== "?").length;
      cells[sc.key] = real ? "fail" : d.unobservable ? "unobs" : "pass";
      details[sc.key] = d;
      if (VERBOSE || cells[sc.key] !== "pass") {
        details[sc.key].traces = { ranger: r, oracle: o };
      }
    } else {
      const errs = await sc.check(f, rangerDriver(f));
      cells[sc.key] = errs.length ? "fail" : "pass";
      details[sc.key] = { errs };
    }
    if (problems.length) {
      cells[sc.key] = "fail";
      details[sc.key].errs = [...(details[sc.key].errs || []), ...new Set(problems)];
    }
  }
  return { cells, details };
}

// --- the run ----------------------------------------------------------------

const GLYPH = { pass: "✓", fail: "✗", na: "–", unobs: "?" };

const fields = await discover();
if (!fields.length) { console.error("no text fields found" + (ONLY.length ? ` for --only=${ONLY.join(",")}` : "")); process.exit(2); }

const results = {};
for (const f of fields) {
  const id = `${f.demo}/${f.tid}`;
  process.stdout.write(`  ${id} … `);
  const { cells, details } = await benchField(f);
  results[id] = { cells, details, name: f.name, state: f.state };
  const summary = SCENARIOS.map((s) => GLYPH[cells[s.key]]).join("");
  console.log(summary);
}

await browser.close();
server.close();

// --- the report -------------------------------------------------------------

const SHORT = Object.fromEntries(SCENARIOS.map((s) => [s.key, s.key.slice(0, 5)]));

console.log("\n--- fields × scenarios ---");
console.log("  legend: ✓ agrees with the browser   ✗ diverges   – not applicable   ? the page publishes no selection to compare\n");
const idW = Math.max(...Object.keys(results).map((k) => k.length));
console.log("  " + "field".padEnd(idW) + "  " + SCENARIOS.map((s) => SHORT[s.key].padEnd(6)).join(""));
for (const [id, r] of Object.entries(results)) {
  console.log("  " + id.padEnd(idW) + "  " + SCENARIOS.map((s) => (GLYPH[r.cells[s.key]] || " ").padEnd(6)).join(""));
}
console.log("\n  columns:");
for (const s of SCENARIOS) console.log(`    ${SHORT[s.key].padEnd(6)} ${s.label}`);

console.log("\n--- divergences ---");
let anyDetail = false;
for (const [id, r] of Object.entries(results)) {
  for (const s of SCENARIOS) {
    const cell = r.cells[s.key];
    if (cell !== "fail" && cell !== "unobs") continue;
    const d = r.details[s.key] || {};
    anyDetail = true;
    console.log(`  ${id} :: ${s.key}${cell === "unobs" ? "  (unobservable — no editing session on this page)" : ""}`);
    const shown = (d.diffs || []).filter((x) => cell !== "unobs" || x.field === "value" || x.field === "focused");
    for (const x of shown.slice(0, VERBOSE ? 100 : 6)) {
      console.log(`      ${x.step.padEnd(28)} ${x.field.padEnd(8)} ranger=${JSON.stringify(x.ranger)}  browser=${JSON.stringify(x.oracle)}`);
    }
    if (shown.length > 6 && !VERBOSE) console.log(`      … ${shown.length - 6} more (--verbose)`);
    for (const e of d.errs || []) console.log(`      ${e}`);
    if (VERBOSE && d.traces) {
      console.log("      step                         ranger                                   browser");
      for (let i = 0; i < d.traces.oracle.length; i++) {
        const r = d.traces.ranger[i] || {}; const o = d.traces.oracle[i];
        const fmt = (x) => `${JSON.stringify(x.value)} [${x.selStart},${x.selEnd}]${x.focused ? " •" : ""}`;
        console.log(`      ${o.step.padEnd(28)} ${fmt(r).padEnd(40)} ${fmt(o)}`);
        for (const h of r.hist || []) console.log(`        ranger undo: ${h}`);
        for (const h of o.hist || []) console.log(`        browser undo: ${h}`);
      }
    }
  }
}
if (!anyDetail) console.log("  none");

// Totals. Observation parity is the finer number: it moves between whole cells
// flipping, the way the conformance scorecard's does.
let cellsPass = 0, cellsFail = 0, cellsNa = 0, cellsUnobs = 0, obs = 0, obsMatched = 0;
for (const r of Object.values(results)) {
  for (const s of SCENARIOS) {
    const c = r.cells[s.key];
    if (c === "pass") cellsPass++; else if (c === "fail") cellsFail++; else if (c === "na") cellsNa++; else if (c === "unobs") cellsUnobs++;
    const d = r.details[s.key];
    if (d && d.observations) { obs += d.observations; obsMatched += d.matched; }
  }
}
console.log("\n--- score ---");
console.log(`  fields ${Object.keys(results).length}   cells: ${cellsPass} agree, ${cellsFail} diverge, ${cellsUnobs} unobservable, ${cellsNa} n/a`);
console.log(`  observations ${obsMatched}/${obs}  (${obs ? (100 * obsMatched / obs).toFixed(1) : "0.0"}%)`);

// --- the catalogue ----------------------------------------------------------

if (fs.existsSync(CATALOGUE)) {
  const cat = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
  console.log("\n--- the shadcn / reui variants, and which field here stands for each ---");
  let covered = 0, missing = 0;
  for (const group of cat.groups) {
    console.log(`  ${group.component}  (${group.reference})`);
    for (const v of group.variants) {
      const fs_ = (v.fields || []).filter((id) => results[id] || !ONLY.length);
      if (!v.fields || !v.fields.length) {
        missing++;
        console.log(`    MISSING  ${v.variant.padEnd(28)} ${v.note || ""}`);
        continue;
      }
      covered++;
      const score = fs_.map((id) => {
        const r = results[id];
        if (!r) return `${id}: not run`;
        const n = SCENARIOS.filter((s) => r.cells[s.key] !== "na").length;
        const p = SCENARIOS.filter((s) => r.cells[s.key] === "pass").length;
        return `${id} ${p}/${n}`;
      }).join(", ");
      console.log(`    covered  ${v.variant.padEnd(28)} ${score}`);
    }
  }
  console.log(`  ${covered} of ${covered + missing} variants have a field on these pages; ${missing} have none.`);
}
if (elsewhere.length) {
  console.log("\n--- textboxes measured by their own oracle, not scored here ---");
  for (const e of elsewhere) console.log(`  ${e}`);
}

// --- the baseline -----------------------------------------------------------

const snapshot = {};
for (const [id, r] of Object.entries(results)) snapshot[id] = Object.fromEntries(SCENARIOS.map((s) => [s.key, r.cells[s.key]]));

let exit = 0;
if (RECORD && SCEN.length) {
  console.log("\n--scenario narrows the run; the baseline is not written");
} else if (RECORD) {
  const prev = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : { fields: {} };
  const merged = ONLY.length ? { ...prev.fields, ...snapshot } : snapshot;
  fs.writeFileSync(BASELINE, JSON.stringify({
    "$comment": "Recorded by input-bench.mjs --record. pass = agrees with a native <input> on every observation; fail = diverges; unobs = the page publishes no selection; na = the scenario does not apply to this field. A cell that changes in either direction fails the bench until this file is re-recorded.",
    fields: merged,
  }, null, 2) + "\n");
  console.log(`\nbaseline written: ${path.relative(ROOT, BASELINE)}`);
} else if (!fs.existsSync(BASELINE)) {
  console.log("\nno baseline — run with --record to write one");
  exit = 1;
} else {
  const base = JSON.parse(fs.readFileSync(BASELINE, "utf8")).fields || {};
  const regressions = [], improvements = [], unknown = [];
  for (const [id, cells] of Object.entries(snapshot)) {
    const b = base[id];
    if (!b) { unknown.push(id); continue; }
    for (const s of SCENARIOS) {
      const was = b[s.key], now = cells[s.key];
      if (was === undefined) { unknown.push(`${id}.${s.key}`); continue; }
      if (was === now) continue;
      if (now === "fail" || now === "unobs" && was === "pass") regressions.push(`${id}.${s.key}: ${was} → ${now}`);
      else improvements.push(`${id}.${s.key}: ${was} → ${now}`);
    }
  }
  if (!ONLY.length) for (const id of Object.keys(base)) if (!snapshot[id]) unknown.push(`${id} (in the baseline, not on the page)`);
  console.log("\n--- against the baseline ---");
  if (regressions.length) { exit = 1; console.log("  REGRESSIONS:"); for (const r of regressions) console.log("    " + r); }
  if (improvements.length) { exit = 1; console.log("  improved — record the new state (`--record`) so the baseline stays honest:"); for (const r of improvements) console.log("    " + r); }
  if (unknown.length) { exit = 1; console.log("  not in the baseline — record:"); for (const r of unknown) console.log("    " + r); }
  if (!exit) console.log("  unchanged");
}

// The runner in scripts/run-gallery-editor-tests.sh takes `failed=0` or
// `ALL PASS` as the pass marker and nothing else — a suite that exits 0 with
// neither is reported as "no pass marker in output", which is what this one
// was the first time it ran in CI. The count is the number of cells that
// diverge from the browser AND were not already in the baseline, which is
// the thing this run is red or green about.
const failedCells = exit ? 1 : 0;
console.log(exit ? `\nRESULT FAIL — failed=${failedCells}` : "\nRESULT OK — the pages do what the baseline says, failed=0");
process.exit(exit);
