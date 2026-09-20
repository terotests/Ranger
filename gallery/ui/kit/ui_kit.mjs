#!/usr/bin/env node
/**
 * THE KIT, FOR SOMETHING THAT CANNOT CLICK.
 *
 * An agent asked to "add a switch" has, until now, had to draw one: a rounded
 * box, a circle, a colour, and a guess about what it does when pressed. What
 * comes out looks like a switch in the screenshot that prompted it and is not
 * a control — nothing presses, nothing reports a state, and a screen reader
 * is told about a `div`.
 *
 * gallery/ui has the real ones, measured against Radix. This is the door to
 * them for a program with no browser:
 *
 *   node gallery/ui/kit/ui_kit.mjs list                    what exists, one line each
 *   node gallery/ui/kit/ui_kit.mjs spec                    …the whole thing, for a prompt
 *   node gallery/ui/kit/ui_kit.mjs spec switch             …one entry, in full
 *   node gallery/ui/kit/ui_kit.mjs add switch --name Wifi --checked
 *   node gallery/ui/kit/ui_kit.mjs shot switch --out sw.png
 *   node gallery/ui/kit/ui_kit.mjs check                   every entry builds and draws
 *
 * `add` answers a document fragment: the control as an EVG tree, the CSS its
 * classes need, and the `EVGPatch` op that puts it somewhere. The tree is
 * what the controller built — not a drawing of it — and the CSS is sliced out
 * of the kit's own sheet, so restyling it is editing rules rather than
 * redrawing boxes.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..", "..");

const CATALOG = path.join(here, "catalog.json");
const HOST = path.join(here, "..", "bin", "ui_host.cjs");
const THEME = path.join(here, "..", "theme", "base.css");
const BEHAVIOURS = path.join(here, "..", "conformance", "behaviours.json");
const SPECS = path.join(here, "..", "conformance", "specs");
const PNG_TOOL = path.join(root, "gallery", "pdf_writer", "bin", "evg_png_tool.js");
const AGENT = path.join(root, "lib", "evg", "bin", "evg_agent.js");

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function ensureHost() {
  if (fs.existsSync(HOST)) return;
  const built = spawnSync("npm", ["run", "ui:build"], { cwd: root, encoding: "utf8" });
  if (!fs.existsSync(HOST)) {
    process.stderr.write((built.stdout || "") + (built.stderr || ""));
    throw new Error("the compiled host is missing and `npm run ui:build` did not make one");
  }
}

// --- the fixture a component name turns into ---------------------------------
// The SAME shape `conformance/build-host.cjs` reads, because that is the one
// contract both this and the Radix side already speak. A component the
// catalogue lists is a fixture the conformance harness could run.

const SAMPLES = {
  radiogroup: [
    { value: "a", name: "Weekly" },
    { value: "b", name: "Monthly" },
  ],
  tabs: [
    { value: "a", name: "Account", body: "Your account" },
    { value: "b", name: "Password", body: "Your password" },
  ],
  accordion: [
    { value: "a", name: "Shipping", body: "Two to four days." },
    { value: "b", name: "Returns", body: "Thirty days." },
  ],
  select: [
    { value: "a", name: "Finland" },
    { value: "b", name: "Sweden" },
  ],
  dropdownmenu: [
    { value: "new", name: "New file" },
    { value: "open", name: "Open…" },
  ],
  combobox: [
    { value: "fi", name: "Finland" },
    { value: "se", name: "Sweden" },
    { value: "no", name: "Norway" },
  ],
  breadcrumb: [
    { value: "home", name: "Home" },
    { value: "settings", name: "Settings" },
  ],
};

const SAMPLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "qty", label: "Qty", numeric: true },
];
const SAMPLE_ROWS = [
  { key: "1", cells: ["Bolts", "24"] },
  { key: "2", cells: ["Nuts", "12"] },
];

function fixtureFor(entry, props) {
  // A prop nobody gave is not a prop set to nothing: spreading `undefined`
  // over the default would hand the host an id of `undefined`, and the
  // layout walks off the end of a tree whose nodes have no id.
  const given = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));
  const c = { type: entry.type, ...given, tid: given.tid || entry.type };
  delete c.out;
  if (c.name === undefined) c.name = defaultName(entry.type);
  if (entry.props.items && !c.items) c.items = SAMPLES[entry.type] || [];
  if (entry.type === "tabs" && !c.value) c.value = c.items[0]?.value || "";
  if (entry.type === "radiogroup" && !c.value) c.value = c.items[0]?.value || "";
  if (entry.type === "avatar" && !c.fallback) c.fallback = initials(c.name);
  if (entry.type === "dialog" && !c.title) c.title = c.name;
  if (entry.type === "toast" && !c.title) c.title = c.name;
  if (entry.type === "tooltip" && !c.body) c.body = c.name;
  if (entry.type === "collapsible" && !c.body) c.body = "What is under it.";
  if (entry.type === "popover" && !c.body) c.body = "What it says.";
  if (entry.type === "table") {
    if (!c.columns) c.columns = SAMPLE_COLUMNS;
    if (!c.rows) c.rows = SAMPLE_ROWS;
  }
  return { controls: [c] };
}

function defaultName(type) {
  const words = { switch: "Wi-Fi", checkbox: "Notifications", toggle: "Bold", input: "Email" };
  return words[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

// --- building ----------------------------------------------------------------

function buildTree(entry, props, css) {
  ensureHost();
  const M = require(HOST);
  const { buildHost } = require(path.join(here, "..", "conformance", "build-host.cjs"));
  const host = buildHost(M, fixtureFor(entry, props), css ?? fs.readFileSync(THEME, "utf8"));
  host.setPageSize(props.width || 420, props.height || 220);
  // Some controls are not on the screen until something opens them — a toast
  // arrives, it does not sit there. The entry says which press shows it.
  for (const step of entry.show || []) {
    host.layout();
    host.click(String(step).replace("{tid}", fixtureFor(entry, props).controls[0].tid));
  }
  // The document gets the tree WITHOUT the sheet resolved into it: an inline
  // property outranks every rule, so a control saved with its colours baked
  // in is frozen in the state it was built in — it cannot be restyled and it
  // cannot be bound to a machine. The classes and the rules do the work.
  const tree = JSON.parse(host.plainTreeJson());
  const rows = JSON.parse(host.a11yJson());
  // The box the layout gave it, asked of the host rather than read off the
  // document: a document has no coordinates in it, which is the point of one.
  const tid = fixtureFor(entry, props).controls[0].tid;
  // Usually the control's own id; a toast's box belongs to its viewport,
  // because the control itself is the thing that MAKES toasts.
  const measureId = (entry.measure || "{tid}").replace("{tid}", tid);
  // `rectOf` answers "x,y,w,h" for the element with that id.
  const rect = String(host.rectOf(measureId) || "").split(",").map(Number);
  const box = rect.length === 4 ? [rect[2], rect[3]] : [0, 0];
  return { host, tree, rows, box };
}

/** Every class name the built tree actually carries. */
function classesIn(node, out = new Set()) {
  const cls = (node.props && node.props["class-name"]) || node.className || "";
  for (const c of String(cls).split(/\s+/)) if (c) out.add(c);
  for (const kid of node.children || []) classesIn(kid, out);
  return out;
}

/**
 * BIND THE STATE TO THE MACHINE. A control's state is a class — a switch is
 * on because it carries `ui-switch-state-checked` — so a control put into a
 * document is frozen in whatever state it was built in. `--bind wifi` writes
 * `{wifi}` where that word is, and an app fills it from its context on every
 * render: press the switch, the machine flips the key, the switch moves.
 *
 * Without this the control is a picture with a real name: its press IS an
 * event and the machine takes it, and nothing on the screen can change.
 */
function bindState(node, key) {
  const cls = (node.props && node.props["class-name"]) || "";
  if (cls) {
    node.props["class-name"] = cls.replace(/-state-[a-z]+/g, `-state-{${key}}`).replace(/\bstate-[a-z]+\b/g, `state-{${key}}`);
  }
  for (const kid of node.children || []) bindState(kid, key);
}

/** The control itself, out of the page-and-root wrapper this tool builds. */
function controlOf(tree) {
  const page = tree.root || tree;
  const uiRoot = page.children?.[0];
  return uiRoot?.children?.[0] ?? uiRoot ?? page;
}

// `--into` makes it a batch that can just be applied: the sheet the document
// already has, plus the rules this piece needs and does not have yet. Without
// it the caller has to merge the CSS itself, and a control whose rules never
// arrive paints as bare text — the failure this whole tool exists to stop.
function mergeCss(ops, into, css) {
  const doc = JSON.parse(fs.readFileSync(into, "utf8"));
  const have = doc.css || "";
  // Rule by rule, not line by line. A rule may carry a LIST of selectors over
  // several lines — `.theme-dark .ui-row-sub,\n.theme-dark .ui-row-value { … }`
  // — and splitting on line starts cut one of those in half, which left a
  // dangling selector in the sheet and took every rule after it down with it.
  // The screen then painted with almost no styling at all, which looks like
  // the kit being broken rather than the merge being.
  const missing = rulesOf(css)
    .filter((rule) => !have.includes(rule.selector))
    .map((rule) => rule.text)
    .join("\n");
  if (missing.trim()) {
    ops.unshift({ op: "set-css", at: "0", value: (have ? have.trimEnd() + "\n" : "") + missing + "\n" });
  }
}

/** A sheet as rules: the selector text, and the rule whole. */
function rulesOf(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    out.push({ selector: m[1].trim(), text: `${m[1].trim()} {${m[2]}}` });
  }
  return out;
}

/** The rules from the kit's sheet whose selector mentions one of these classes. */
function cssFor(classes) {
  const sheet = fs.readFileSync(THEME, "utf8");
  const wanted = new Set(classes);
  // A BOUND control carries `ui-switch-state-{wifi}` rather than one state
  // word, so slicing by the classes it happens to have would take the rules
  // for none of its states and the control could never look on. Every state
  // of a bound part comes along.
  const prefixes = [];
  for (const c of classes) {
    const at = c.indexOf("-state-{");
    if (at > 0) prefixes.push(c.slice(0, at + "-state-".length));
  }
  const out = [];
  // A rule is `selectors { body }`; comments are dropped. Good enough for a
  // sheet this one writes and this one reads.
  const text = sheet.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const selectors = m[1].trim();
    const kept = selectors
      .split(",")
      .map((s) => s.trim())
      .filter((s) => {
        const names = [...s.matchAll(/\.([A-Za-z0-9_{}-]+)/g)].map((x) => x[1]);
        if (!names.length) return false;
        const last = names[names.length - 1];
        // A `.theme-x .a` rule is kept when `.a` is ours; a plain `.a` the same.
        return wanted.has(last) || prefixes.some((p) => last.startsWith(p));
      });
    if (kept.length) out.push(`${kept.join(",\n")} {${m[2]}}`);
  }
  return out.join("\n");
}

// --- the pieces a screen is made of ------------------------------------------
// A control is not what an agent builds. It builds a ROW — an icon, a title
// over a subtitle, a switch at the end — and then thirty more like it. Handed
// only the switch, it draws the other four parts itself every time, which is
// both where the drawn controls come from and where a screen of things that
// do not line up comes from: five hand-written paddings and five guesses at
// the gap.
//
// So the kit offers the whole piece. A pattern is built HERE, in this file,
// out of plain nodes and the kit's own controls — there is no second control
// implementation — and its own parts carry classes the sheet already styles.

/** A tree-json node. */
function n(tag, cls, props, children, text) {
  const node = { tag };
  if (text !== undefined && text !== null && text !== "") node.text = String(text);
  const p = { ...(props || {}) };
  if (cls) p["class-name"] = cls;
  if (Object.keys(p).length) node.props = p;
  if (children && children.length) node.children = children.filter(Boolean);
  return node;
}

const text = (cls, words) => (words === undefined || words === "" ? null : n("span", cls, null, null, words));

/** The control that sits at the end of a row, whatever kind it is. */
function rowEnd(props) {
  const kind = props.control || (props.checked !== undefined ? "switch" : "none");
  if (kind === "none") return null;
  if (kind === "value") return text("ui-row-value", props.value ?? "");
  if (kind === "chevron") return text("ui-row-chevron", "›");
  const built = add(kind, {
    name: "",
    tid: props.id ? `${props.id}.control` : undefined,
    checked: props.checked ?? false,
    disabled: props.disabled,
    bind: props.bind,
  });
  return built.tree;
}

const PATTERNS = {
  row: {
    summary: "A settings row: an icon, a title over a subtitle, and a control at the end.",
    props: {
      title: { type: "string" },
      sub: { type: "string", note: "the smaller line under it" },
      icon: { type: "string", note: "one glyph, or leave it out" },
      control: { type: "\"switch\" | \"checkbox\" | \"value\" | \"chevron\" | \"none\"", default: "none" },
      checked: { type: "boolean", note: "for switch and checkbox; naming it implies control=switch" },
      value: { type: "string", note: "for control=value — \"5 GHz\"" },
      id: { type: "string", note: "the row's id, and the control's is <id>.control" },
      bind: { type: "string", note: "a context key — the control's state comes from the machine, and a press can change it" },
    },
    build(props) {
      const row = n(
        "div",
        "ui-row",
        null,
        [
          props.icon ? n("div", "ui-row-icon", null, null, props.icon) : null,
          n("div", "ui-row-text", null, [text("ui-row-title", props.title ?? ""), text("ui-row-sub", props.sub)]),
          rowEnd(props),
        ],
      );
      if (props.id) row.id = props.id;
      return row;
    },
  },

  card: {
    summary: "A rounded panel of rows with a line between them — a settings list.",
    props: {
      title: { type: "string", note: "the small caption over the card" },
      row: { type: "repeated", note: "--row \"Title|Subtitle|control\", once per row; control is switch:on, value:5 GHz, chevron or nothing" },
    },
    build(props) {
      const rows = asList(props.row);
      const kids = [];
      if (props.title) kids.push(text("ui-card-title", props.title));
      rows.forEach((spec, i) => {
        if (i > 0) kids.push(n("div", "ui-row-line"));
        kids.push(PATTERNS.row.build(rowSpec(spec)));
      });
      return n("div", "ui-card", null, kids);
    },
  },

  appbar: {
    summary: "The bar at the top: a back arrow, the screen's name, one action.",
    props: {
      title: { type: "string" },
      back: { type: "string", default: "←" },
      action: { type: "string", note: "one glyph on the right, or leave it out" },
      id: { type: "string", default: "nav", note: "ids are <id>.back and <id>.action" },
    },
    build(props) {
      const base = props.id || "nav";
      const back = n("div", "ui-appbar-btn", null, null, props.back ?? "←");
      back.id = `${base}.back`;
      const kids = [back, text("ui-appbar-title", props.title ?? "")];
      if (props.action) {
        const act = n("div", "ui-appbar-btn", null, null, props.action);
        act.id = `${base}.action`;
        kids.push(act);
      } else {
        kids.push(n("div", "ui-appbar-btn"));
      }
      return n("div", "ui-appbar", null, kids);
    },
  },

  chips: {
    summary: "A row of round actions under a header — Forget · Disconnect · Share.",
    props: {
      chip: { type: "repeated", note: "--chip \"Forget|🗑|net.forget\": label, glyph, id" },
    },
    build(props) {
      const chips = asList(props.chip).map((spec) => {
        const [label = "", glyph = "•", id = ""] = String(spec).split("|");
        const dot = n("div", "ui-chip-dot", null, null, glyph);
        if (id) dot.id = id;
        return n("div", "ui-chip", null, [dot, text("ui-chip-label", label)]);
      });
      return n("div", "ui-chiprow", null, chips);
    },
  },

  // The row of CTAs at the bottom of a screen. It is here because it is what
  // people were drawing by hand: two pills side by side, each a `div` with a
  // radius and a colour, neither of them pressable and neither restyleable.
  // `chips` is the round-icon-with-a-caption row and does not fit them.
  actions: {
    summary: "A row of buttons — the CTAs at the foot of a screen.",
    props: {
      button: {
        type: "repeated",
        note: "--button \"Add to plan|primary|plan.add\": words, variant, id",
      },
      align: { type: "\"center\" | \"start\" | \"end\" | \"fill\"", default: "center" },
    },
    build(props) {
      const list = asList(props.button).map((spec) => {
        const [label = "", variant = "secondary", id = ""] = String(spec).split("|");
        return add("button", { name: label, variant, tid: id || undefined }).tree;
      });
      const where = { start: "flex-start", end: "flex-end", center: "center", fill: "space-between" }[
        props.align || "center"
      ] || "center";
      return n("div", "ui-actions", { "justify-content": where }, list);
    },
  },

  field: {
    summary: "A labelled text field with its helper line — a form's row.",
    props: {
      label: { type: "string" },
      help: { type: "string" },
      placeholder: { type: "string" },
      value: { type: "string" },
      id: { type: "string" },
      invalid: { type: "boolean", default: false },
    },
    build(props) {
      const input = add("input", {
        name: props.label ?? "",
        tid: props.id || undefined,
        value: props.value,
        placeholder: props.placeholder,
        invalid: props.invalid,
      }).tree;
      return n("div", "ui-field", null, [
        text("ui-field-label", props.label),
        input,
        props.invalid ? text("ui-field-error", props.help) : text("ui-field-help", props.help),
      ]);
    },
  },
};

function asList(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/** `"Share network|Others can connect|switch:on"` as row props. */
function rowSpec(spec) {
  if (spec && typeof spec === "object") return spec;
  const [title = "", sub = "", ctl = ""] = String(spec).split("|");
  const out = { title, sub: sub || undefined };
  const [kind, arg] = String(ctl).split(":");
  if (!kind) return out;
  if (kind === "switch" || kind === "checkbox") {
    out.control = kind;
    out.checked = arg === "on" || arg === "true" || arg === "checked";
  } else if (kind === "value") {
    out.control = "value";
    out.value = arg ?? "";
  } else if (kind === "chevron") {
    out.control = "chevron";
  }
  return out;
}

function patternFor(name) {
  const p = PATTERNS[name];
  if (!p) return null;
  return { name, ...p };
}

function addPattern(name, props) {
  const p = patternFor(name);
  const tree = p.build(props);
  const classes = [...classesIn(tree)].filter((c) => c.startsWith("ui-"));
  const css = cssFor(classes);
  const ops = [{ op: "insert", at: String(props.at ?? "0"), index: props.index ?? 9999, node: tree }];
  if (props.into) mergeCss(ops, props.into, css);
  return { pattern: name, tree, css, classes, ops };
}

// --- the catalogue -----------------------------------------------------------

function proven() {
  const out = {};
  for (const f of fs.readdirSync(SPECS)) {
    if (!f.endsWith(".json")) continue;
    const spec = read(path.join(SPECS, f));
    (out[spec.component] ||= []).push(spec.name);
  }
  return out;
}

function catalogue() {
  const cat = read(CATALOG);
  const specs = proven();
  const behaviours = read(BEHAVIOURS).components;
  return cat.components.map((e) => ({
    ...e,
    specs: specs[e.type] || [],
    behaviours: behaviours[e.type] ? Object.keys(behaviours[e.type].behaviours) : [],
  }));
}

function listText() {
  const lines = [];
  // The pieces first: they are what a screen is actually made of, and an
  // agent that reaches for a row does not draw the four parts around the
  // switch by hand.
  lines.push("PIECES — a whole row, card or bar in one go. Reach for these first.");
  lines.push("");
  for (const name of Object.keys(PATTERNS)) {
    lines.push(`    ${name.padEnd(14)} ${PATTERNS[name].summary}`);
  }
  lines.push("");
  lines.push("  e.g.  ./evg-ui add card --title \"NETWORK\" \\");
  lines.push("          --row \"Signal strength|Excellent|value:Excellent\" \\");
  lines.push("          --row \"Share network|Others can connect|switch:on\" --into doc.evg.json");
  lines.push("");
  lines.push("CONTROLS this kit HAS. Ask for one by name; do not draw it.");
  lines.push("");
  for (const e of catalogue()) {
    const mark = e.specs.length ? "✔" : " ";
    lines.push(`  ${mark} ${e.type.padEnd(14)} ${e.summary}`);
  }
  lines.push("");
  lines.push("  ✔ = measured against the real Radix component, behaviour by behaviour.");
  lines.push("  Anything not on this list has to be built out of boxes, and will");
  lines.push("  behave like boxes. Say so rather than drawing a picture of a control.");
  return lines.join("\n");
}

function patternSpecText(only) {
  const out = [];
  for (const name of Object.keys(PATTERNS)) {
    if (only && name !== only) continue;
    const p = PATTERNS[name];
    out.push(`${name} — ${p.summary}`);
    out.push("  props");
    for (const [k, v] of Object.entries(p.props)) {
      const bits = [v.type];
      if (v.default !== undefined) bits.push(`default ${JSON.stringify(v.default)}`);
      if (v.note) bits.push(v.note);
      out.push(`    ${k.padEnd(12)} ${bits.join(" · ")}`);
    }
    try {
      const tree = p.build(sampleProps(name));
      out.push(`  classes   ${[...classesIn(tree)].filter((c) => c.startsWith("ui-")).join(" ")}`);
    } catch (err) {
      out.push(`  classes   (does not build: ${err.message})`);
    }
    out.push("");
  }
  return out.join("\n");
}

/** Enough props to build one of each, for the spec and the check. */
function sampleProps(name) {
  if (name === "row") {
    return { icon: "•", title: "Share network", sub: "Others on this device can connect", control: "switch", checked: true, id: "share" };
  }
  if (name === "card") {
    return {
      title: "NETWORK",
      row: ["Signal strength|Excellent|value:Excellent", "Share network|Others can connect|switch:on", "Privacy|Randomized MAC|chevron"],
    };
  }
  if (name === "appbar") return { title: "Network details", action: "✎" };
  if (name === "chips") return { chip: ["Forget|✕|net.forget", "Share|▦|net.share"] };
  if (name === "actions") return { button: ["Add to plan|primary|plan.add", "Update plan|secondary|plan.update"] };
  if (name === "field") return { label: "Email", placeholder: "name@example.com", help: "We only use it to sign you in." };
  return {};
}

function specText(only) {
  const out = [];
  for (const e of catalogue()) {
    if (only && e.type !== only) continue;
    out.push(`${e.type} — ${e.summary}`);
    out.push(`  role      ${e.role}`);
    const props = Object.entries(e.props);
    if (props.length) {
      out.push("  props");
      for (const [k, v] of props) {
        const bits = [v.type];
        if (v.default !== undefined) bits.push(`default ${JSON.stringify(v.default)}`);
        if (v.note) bits.push(v.note);
        out.push(`    ${k.padEnd(12)} ${bits.join(" · ")}`);
      }
    }
    if (e.behaviours.length) out.push(`  behaviours ${e.behaviours.join(" ")}`);
    out.push(`  proven    ${e.specs.length ? e.specs.join(" ") : "not yet — no conformance spec"}`);
    try {
      const { tree } = buildTree(e, {});
      out.push(`  classes   ${[...classesIn(controlOf(tree))].filter((c) => c.startsWith("ui-")).join(" ")}`);
    } catch (err) {
      out.push(`  classes   (does not build: ${err.message})`);
    }
    out.push("");
  }
  return out.join("\n");
}

// --- the commands ------------------------------------------------------------

function flags(argv) {
  const props = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    let value = true;
    if (next !== undefined && !next.startsWith("--")) {
      value = /^-?\d+(\.\d+)?$/.test(next) ? Number(next) : next;
      i += 1;
    }
    // A flag given more than once collects — `--row … --row …` is how a card
    // is written, and a card of one row is not worth a file.
    if (key in props) {
      props[key] = Array.isArray(props[key]) ? props[key].concat(value) : [props[key], value];
    } else {
      props[key] = value;
    }
  }
  return props;
}

function entryFor(type) {
  const e = catalogue().find((x) => x.type === type);
  if (!e) {
    throw new Error(
      `no component called "${type}". What there is:\n\n${listText()}`,
    );
  }
  return e;
}

function add(type, props) {
  const entry = entryFor(type);
  const { tree, rows } = buildTree(entry, props);
  // The page wrapper is this tool's; what the caller wants is the control.
  const control = controlOf(tree);
  if (props.bind) bindState(control, props.bind);
  const classes = [...classesIn(control)].filter((c) => c.startsWith("ui-"));
  const css = cssFor(classes);
  // `--at` is the PARENT the control goes into and `--index` the slot in it;
  // the default is the end of the root. Replacing a drawn control is a
  // `remove` at its path followed by this insert at its parent and index.
  const ops = [{ op: "insert", at: String(props.at ?? "0"), index: props.index ?? 9999, node: control }];

  // `--into` makes it a batch that can just be applied: the sheet the
  // document already has, plus the rules this control needs and does not
  // have yet. Without it the caller has to merge the CSS itself, and a
  // control whose rules never arrive paints as bare text — which is the
  // failure this whole tool exists to stop.
  if (props.into) {
    const doc = JSON.parse(fs.readFileSync(props.into, "utf8"));
    const have = doc.css || "";
    const missing = css
      .split(/\n(?=[^\s])/)
      .filter((rule) => {
        const sel = rule.split("{")[0].trim();
        return sel && !have.includes(sel);
      })
      .join("\n");
    if (missing.trim()) ops.unshift({ op: "set-css", at: "0", value: (have ? have + "\n" : "") + missing + "\n" });
  }
  return { type, tree: control, css, classes, a11y: rows, ops };
}

/** A piece on a page of its own, as a document — what paints and measures. */
function documentOf(tree, css, w, h) {
  return JSON.stringify({
    evg: 1,
    css,
    root: {
      tag: "div",
      props: { display: "flex", width: `${w}px`, height: `${h}px`, "background-color": "rgb(241,245,249)", padding: "16px" },
      children: [tree],
    },
  });
}

/**
 * What `measure` says about a piece — above all `drawn`, which names a
 * control made out of boxes. A pattern of this kit tripping that check would
 * mean the kit is doing the very thing it tells an agent not to.
 */
function measured(docText, w, h) {
  if (!fs.existsSync(AGENT)) return null;
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "ui-kit-m-"));
  const file = path.join(dir, "doc.evg.json");
  fs.writeFileSync(file, docText);
  const ran = spawnSync(process.execPath, [AGENT, "measure", file, `--width=${w}`, `--height=${h}`], {
    cwd: root,
    encoding: "utf8",
    timeout: 120000,
  });
  fs.rmSync(dir, { recursive: true, force: true });
  try {
    return JSON.parse(ran.stdout || "{}");
  } catch {
    return null;
  }
}

function shot(type, props) {
  const w = props.width || 420;
  const h = props.height || 220;
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "ui-kit-"));
  const treeFile = path.join(dir, "tree.evg.json");
  if (PATTERNS[type]) {
    // A picture of an empty card says nothing; with no props of its own the
    // sample is what the spec shows.
    const given = Object.keys(props).filter((k) => !["width", "height", "out"].includes(k));
    const made = addPattern(type, given.length ? props : sampleProps(type));
    fs.writeFileSync(treeFile, documentOf(made.tree, made.css, w, h));
    const out = path.resolve(props.out || `${type}.png`);
    const painted = spawnSync(process.execPath, [PNG_TOOL, treeFile, out, "-w", String(w), "-h", String(h)], {
      cwd: root,
      encoding: "utf8",
    });
    fs.rmSync(dir, { recursive: true, force: true });
    if (!fs.existsSync(out)) {
      process.stderr.write((painted.stdout || "") + (painted.stderr || ""));
      return 1;
    }
    process.stdout.write(`${out} ${w}x${h}\n`);
    return 0;
  }
  const entry = entryFor(type);
  const { host } = buildTree(entry, props);
  fs.writeFileSync(treeFile, host.treeJson());
  const out = path.resolve(props.out || `${type}.png`);
  const painted = spawnSync(process.execPath, [PNG_TOOL, treeFile, out, "-w", String(w), "-h", String(h)], {
    cwd: root,
    encoding: "utf8",
  });
  fs.rmSync(dir, { recursive: true, force: true });
  if (!fs.existsSync(out)) {
    process.stderr.write((painted.stdout || "") + (painted.stderr || ""));
    return 1;
  }
  process.stdout.write(`${out} ${w}x${h}\n`);
  return 0;
}

/**
 * Every entry builds, draws, and has a rule for every class it carries.
 *
 * The last one is the check that matters: a control whose classes have no
 * rules paints as bare text, and that is exactly how a component stops being
 * usable without anybody noticing — it still "works", it just looks like
 * nothing.
 */
function checkPatterns() {
  let bad = 0;
  for (const name of Object.keys(PATTERNS)) {
    let line = `  ${name.padEnd(14)}`;
    try {
      const made = addPattern(name, sampleProps(name));
      const classes = made.classes;
      const styled = classes.filter((c) => new RegExp(`\\.${c}\\b`).test(made.css));
      const bare = classes.filter((c) => !styled.includes(c) && !/-state-/.test(c));
      const m = measured(documentOf(made.tree, made.css, 390, 420), 390, 420);
      if (bare.length) {
        line += ` FAIL  no rule for ${bare.join(" ")}`;
        bad += 1;
      } else if (m && (m.count || 0) > 0) {
        line += ` FAIL  it does not lay out: ${(m.findings || [])[0]}`;
        bad += 1;
      } else if (m && (m.drawn || []).length) {
        // The kit telling an agent not to draw a control, and drawing one.
        line += ` FAIL  the kit drew a control: ${m.drawn[0]}`;
        bad += 1;
      } else {
        line += ` ok    ${classes.length} classes` + (m ? `  ${m.nodes} nodes` : "");
      }
    } catch (err) {
      line += ` FAIL  ${err.message}`;
      bad += 1;
    }
    process.stdout.write(line + "\n");
  }
  return bad;
}

function check() {
  let bad = 0;
  for (const e of catalogue()) {
    let line = `  ${e.type.padEnd(14)}`;
    try {
      const { tree, box, host } = buildTree(e, {});
      const control = controlOf(tree);
      const classes = [...classesIn(control)].filter((c) => c.startsWith("ui-"));
      const rules = cssFor(classes);
      const styled = classes.filter((c) => new RegExp(`\\.${c}\\b`).test(rules));
      // A state class with no rule is the RESTING look — `-state-unchecked`
      // is what the base class already says. A PART with no rule is the
      // defect this check is for: it paints as nothing.
      const bare = classes.filter((c) => !styled.includes(c) && !/-state-/.test(c));
      const styleErrors = host.styleErrorCount();
      if (styleErrors > 0) {
        line += ` FAIL  the sheet did not parse: ${host.styleError(0)}`;
        bad += 1;
      } else if (box[0] < 1 || box[1] < 1) {
        line += ` FAIL  laid out to nothing (${box[0]}×${box[1]})`;
        bad += 1;
      } else if (bare.length) {
        line += ` FAIL  no rule for ${bare.join(" ")}`;
        bad += 1;
      } else {
        line += ` ok    ${Math.round(box[0])}×${Math.round(box[1])}  ${classes.length} classes` +
          (e.specs.length ? `  ${e.specs.length} specs` : "  no spec yet");
      }
    } catch (err) {
      line += ` FAIL  ${err.message}`;
      bad += 1;
    }
    process.stdout.write(line + "\n");
  }
  process.stdout.write("\n  --- pieces ---\n");
  bad += checkPatterns();
  process.stdout.write(bad === 0 ? "\nALL PASS\n" : `\nfailed=${bad}\n`);
  return bad === 0 ? 0 : 1;
}

const [cmd, ...rest] = process.argv.slice(2);
const named = rest.filter((a) => !a.startsWith("--"));
const props = flags(rest);

try {
  if (cmd === "list") {
    process.stdout.write(listText() + "\n");
  } else if (cmd === "spec") {
    const one = named[0];
    if (one && PATTERNS[one]) {
      process.stdout.write(patternSpecText(one) + "\n");
    } else if (one) {
      process.stdout.write(specText(one) + "\n");
    } else {
      process.stdout.write(patternSpecText() + "\n" + specText() + "\n");
    }
  } else if (cmd === "add") {
    const what = named[0];
    const made = PATTERNS[what] ? addPattern(what, props) : add(what, props);
    process.stdout.write(JSON.stringify(made, null, 2) + "\n");
  } else if (cmd === "shot") {
    process.exit(shot(named[0], props));
  } else if (cmd === "check") {
    process.exit(check());
  } else {
    process.stdout.write(
      "usage: ui_kit.mjs list | spec [type] | add <type> [--prop v] | shot <type> [--out x.png] | check\n",
    );
    process.exit(2);
  }
} catch (err) {
  process.stderr.write(String(err.stack || err.message || err) + "\n");
  process.exit(1);
}
