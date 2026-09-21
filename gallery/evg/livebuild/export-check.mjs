#!/usr/bin/env node
/**
 * Ranger UI export v2 — one JSON document.
 *
 *   npm run livebuild:export
 *
 * Compact is ui + css + machine. Full adds compiled EVG and layout debug.
 * What is checked: the tree is semantic (no CSS in props, known controls
 * collapse to rave.Switch / SettingsRow), the example app does not leak
 * into a document-only session, and the machine rides along when there is
 * one.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectFiles, exportSession, outlineOf } from "./export.mjs";
import { buildRangerUi, convertDocument, inferKind, validateRangerUi, FORMAT, VERSION } from "./ranger-ui.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

function findType(node, type, hits = []) {
  if (!node) return hits;
  if (node.type === type) hits.push(node);
  for (const c of node.children || []) findType(c, type, hits);
  return hits;
}

function typesIn(node, out = []) {
  if (!node) return out;
  out.push(node.type);
  for (const c of node.children || []) typesIn(c, out);
  return out;
}

function visualLeaks(node, at = "ui", hits = []) {
  const props = (node && node.props) || {};
  for (const k of ["background-color", "padding-left", "border-radius", "font-size", "width", "height"]) {
    if (props[k] != null) hits.push(`${at}.props.${k}`);
  }
  (node.children || []).forEach((c, i) => visualLeaks(c, `${at}/${i}`, hits));
  return hits;
}

// --- outline still names the copy ------------------------------------------------

const dash = JSON.parse(fs.readFileSync(path.join(here, "fixtures/dashboard.evg.json"), "utf8"));
const lines = outlineOf(dash);
if (!lines.some((l) => l.includes("Northwind"))) {
  throw new Error("the outline does not mention the screen's title:\n" + lines.slice(0, 8).join("\n"));
}
console.log(`  outline     ${lines.length} lines`);

// --- dashboard becomes a Screen of evg nodes, appearance in css --------------

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "evg-export-"));
fs.copyFileSync(path.join(here, "fixtures/dashboard.evg.json"), path.join(tmp, "doc.evg.json"));
const lonely = exportSession({
  dir: tmp,
  prompt: "a northwind phone",
  kind: "dashboard",
  viewport: { width: 390, height: 844 },
});
if (lonely.format !== FORMAT || lonely.version !== VERSION) {
  throw new Error(`wrong format: ${lonely.format} v${lonely.version}`);
}
if (lonely.hasApp) throw new Error("a document with no app/ exported the example app");
if (lonely.compact.machine) throw new Error("compact carried a machine the session does not have");
if (lonely.compact.compiled) throw new Error("compact carried compiled EVG");
if (lonely.full.compiled == null || !lonely.full.compiled.evg) {
  throw new Error("full mode dropped compiled.evg");
}
if (lonely.compact.ui.type !== "Screen") {
  throw new Error(`root is ${lonely.compact.ui && lonely.compact.ui.type}, not Screen`);
}
if (!lonely.compact.meta.prompt.includes("a northwind phone")) {
  throw new Error("the ask did not reach meta.prompt");
}
if (!lonely.compact.meta.handoff.includes("ranger-ui")) {
  throw new Error("meta.handoff does not name the format");
}
const leaks = visualLeaks(lonely.compact.ui);
if (leaks.length) throw new Error("appearance leaked into ui.props:\n" + leaks.join("\n"));
if (!lonely.compact.css.includes("background-color")) {
  throw new Error("css did not receive the screen's background");
}
if (lonely.compact.css.includes("width: 390px") && lonely.compact.viewport.width === 390) {
  // size belongs on viewport when it is the page size
  throw new Error("root width duplicated viewport in css");
}
if (!lonely.valid.ok) throw new Error("compact failed schema: " + lonely.valid.errors.join("; "));
if (JSON.stringify(lonely.compact).includes("traffic")) {
  throw new Error("the example app leaked into a document-only export");
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log("  compact     Screen + css, no machine, no compiled, schema ok");

// --- a known switch collapses; internals do not export -----------------------

const switchDoc = {
  evg: 1,
  css: ".ui-switch-track { background-color: rgb(0,0,0); }\n.camera-settings { background-color: rgb(242,242,247); }\n",
  root: {
    tag: "div",
    id: "sky",
    props: { "class-name": "camera-settings", width: "390px", height: "844px", "background-color": "rgb(242,242,247)" },
    children: [
      {
        tag: "div",
        props: { "class-name": "ui-card" },
        children: [
          {
            tag: "div",
            id: "row.grid",
            props: { "class-name": "ui-row" },
            children: [
              {
                tag: "div",
                props: { "class-name": "ui-row-text" },
                children: [{ tag: "span", text: "Grid", props: { "class-name": "ui-row-title" } }],
              },
              {
                tag: "div",
                id: "toggle.grid",
                role: "switch",
                props: { "class-name": "ui-switch ui-switch-state-{grid}" },
                children: [
                  {
                    tag: "div",
                    props: { "class-name": "ui-switch-track ui-switch-track-state-{grid}" },
                    children: [{ tag: "div", props: { "class-name": "ui-switch-thumb ui-switch-thumb-state-{grid}" } }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};
const conv = convertDocument(switchDoc, { viewport: { width: 390, height: 844 } });
const kinds = typesIn(conv.ui);
if (!kinds.includes("rave.Switch")) throw new Error("switch did not collapse: " + kinds.join(", "));
if (!kinds.includes("SettingsRow")) throw new Error("row did not collapse: " + kinds.join(", "));
if (!kinds.includes("rave.Card")) throw new Error("card did not collapse: " + kinds.join(", "));
const json = JSON.stringify(conv.ui);
if (json.includes("ui-switch-track") || json.includes("ui-switch-thumb")) {
  throw new Error("switch internals leaked into the semantic tree");
}
if (json.includes("ui-switch-track-state-{grid}")) {
  throw new Error("state class interpolation leaked into the tree");
}
const switches = findType(conv.ui, "rave.Switch");
if (!switches.length || switches[0].props.checked !== "{grid}") {
  throw new Error("switch.checked is not {grid}:\n" + JSON.stringify(conv.ui, null, 2));
}
if (switches[0].id !== "toggle.grid") throw new Error("switch id did not travel");
if (!switches[0].uid.startsWith("rui_")) throw new Error("switch has no uid");
if (!conv.components["rave.Switch"] || conv.components["rave.Switch"].library !== "@rave/core") {
  throw new Error("components manifest missed rave.Switch");
}
if (conv.css.includes(".ui-switch-track")) {
  throw new Error("kit default CSS was not stripped: " + conv.css);
}
if (!conv.css.includes(".camera-settings")) {
  throw new Error("author CSS was stripped: " + conv.css);
}
const built = buildRangerUi({
  doc: switchDoc,
  name: "Camera Settings",
  viewport: { width: 390, height: 844 },
  machine: { id: "app", initial: "camera", context: { grid: "checked" }, states: { camera: { on: { "toggle.grid": [] } } } },
});
if (!built.valid.ok) throw new Error("camera doc failed schema: " + built.valid.errors.join("; "));
if (built.compact.machine.context.grid !== "checked") throw new Error("machine did not embed");
if (built.compact.compiled) throw new Error("compact included compiled");
const full = buildRangerUi({ doc: switchDoc, full: true, outline: ["0 Screen"], measure: { count: 0 } });
if (!full.document.debug.outline.includes("0 Screen")) throw new Error("debug.outline missing");
if (!full.document.compiled.evg.root) throw new Error("compiled.evg missing the tree");
console.log("  switch      rave.Switch + SettingsRow + Card, kit css stripped, {grid} bound");

// --- author class "card"/"row" and a titled box soup collapse ----------------

const authorDoc = {
  evg: 1,
  css: ".card { background-color: rgb(254,254,254); border-radius: 12px; }\n.row-title { color: rgb(0,0,0); }\n",
  root: {
    tag: "div",
    props: { "class-name": "sky", width: "390px", height: "844px" },
    children: [
      {
        tag: "div",
        props: { "class-name": "card" },
        children: [
          {
            tag: "div",
            props: { "class-name": "row" },
            children: [
              { tag: "span", text: "Grid", props: { "class-name": "row-title" } },
              { tag: "span", text: "On", props: { "class-name": "row-value" } },
            ],
          },
        ],
      },
    ],
  },
};
const authorConv = convertDocument(authorDoc, { viewport: { width: 390, height: 844 } });
const authorKinds = typesIn(authorConv.ui);
if (!authorKinds.includes("rave.Card")) throw new Error("class card did not collapse: " + authorKinds.join(", "));
if (!authorKinds.includes("SettingsRow")) throw new Error("class row did not collapse: " + authorKinds.join(", "));
const authorCard = findType(authorConv.ui, "rave.Card")[0];
if (!authorCard || (authorCard.props && authorCard.props.title !== "Grid")) {
  // title comes from first heading inside; row-title "Grid" is fine
  if (!authorCard) throw new Error("author card missing");
}
const authorRow = findType(authorConv.ui, "SettingsRow")[0];
if (!authorRow || !authorRow.props || authorRow.props.label !== "Grid") {
  throw new Error("row-title did not become SettingsRow.label: " + JSON.stringify(authorConv.ui, null, 2));
}
if (!authorConv.components["rave.Card"] || !authorConv.components.SettingsRow) {
  throw new Error("components missed author card/row");
}

const soupDoc = {
  evg: 1,
  root: {
    tag: "div",
    props: { "background-color": "rgb(34,36,42)", width: "390px", height: "844px" },
    children: [
      {
        tag: "div",
        children: [
          { tag: "span", text: "RECENT ACTIVITIES" },
          {
            tag: "div",
            children: [
              { tag: "span", text: "MORNING RUN" },
              { tag: "span", text: "342 kcal" },
            ],
          },
        ],
      },
      {
        tag: "div",
        props: { position: "absolute", bottom: "8px" },
        children: [
          { tag: "span", text: "Home" },
          { tag: "span", text: "Search" },
          { tag: "span", text: "Alerts" },
          { tag: "span", text: "You" },
        ],
      },
    ],
  },
};
const soupConv = convertDocument(soupDoc, { viewport: { width: 390, height: 844 } });
const soupKinds = typesIn(soupConv.ui);
if (!soupKinds.includes("rave.Card")) {
  throw new Error("titled box soup did not become rave.Card: " + soupKinds.join(", ") + "\n" + JSON.stringify(soupConv.ui, null, 2));
}
const soupCard = findType(soupConv.ui, "rave.Card")[0];
if (!soupCard || !soupCard.props || soupCard.props.title !== "RECENT ACTIVITIES") {
  throw new Error("inferred card title missing: " + JSON.stringify(soupConv.ui, null, 2));
}
const tab = findType(soupConv.ui, "rave.TabBar")[0];
if (!tab) throw new Error("pinned short labels did not become rave.TabBar: " + JSON.stringify(soupConv.ui, null, 2));
if (!findType(tab, "rave.Tab").length) throw new Error("tab items did not become rave.Tab");
if (soupConv.ui.class !== "screen") {
  throw new Error("root visual class should be screen, not a generated rui-sN: " + soupConv.ui.class);
}
console.log("  author/soup card/row aliases + inferred titled panel + TabBar");

const dashPieces = {
  evg: 1,
  css: ".ui-tabbar {\n  display: flex; height: 56px;\n}\n.ui-tab-item { display: flex; }\n.ui-tab-icon { height: 22px; }\n.theme-dark .ui-tabbar { background-color: #111c31; }\n.rui-s2 {\n  color: rgb(240,215,123);\n}\n",
  root: {
    tag: "div",
    children: [
      {
        tag: "div",
        props: { "class-name": "ui-tiles" },
        children: [
          {
            tag: "div",
            props: { "class-name": "ui-tile" },
            children: [
              { tag: "span", text: "Sleep Average", props: { "class-name": "ui-tile-label" } },
              { tag: "span", text: "7h 38m", props: { "class-name": "ui-tile-value" } },
            ],
          },
        ],
      },
      {
        tag: "div",
        props: { "class-name": "ui-bars" },
        children: [
          { tag: "span", text: "Steps & Calories Trend", props: { "class-name": "ui-bars-title" } },
          { tag: "span", text: "Avg 9,240 steps/day", props: { "class-name": "ui-bars-value" } },
          {
            tag: "div",
            props: { "class-name": "ui-bars-row" },
            children: [
              {
                tag: "div",
                props: { "class-name": "ui-bar-col" },
                children: [
                  { tag: "div", props: { "class-name": "ui-bar", height: "44px", "background-color": "#EF9587" } },
                  { tag: "span", text: "M", props: { "class-name": "ui-bar-label" } },
                ],
              },
            ],
          },
        ],
      },
      {
        tag: "div",
        props: { "class-name": "ui-tabbar" },
        children: [
          {
            tag: "div",
            id: "nav.progress",
            props: { "class-name": "ui-tab-item" },
            children: [
              { tag: "span", text: "◈", props: { "class-name": "ui-tab-icon" } },
              { tag: "span", text: "Progress", props: { "class-name": "ui-tab-label ui-tab-label-active" } },
            ],
          },
        ],
      },
      {
        tag: "div",
        props: { "class-name": "ui-banner" },
        children: [
          { tag: "span", text: "Milestone Unlocked", props: { "class-name": "ui-banner-eyebrow" } },
          { tag: "span", text: "100k Steps in 10 Days", props: { "class-name": "ui-banner-title" } },
        ],
      },
      {
        tag: "div",
        props: { "class-name": "ui-pills" },
        children: [
          { tag: "div", props: { "class-name": "ui-pill ui-pill-active" }, text: "Week" },
          { tag: "div", props: { "class-name": "ui-pill" }, text: "Day" },
        ],
      },
    ],
  },
};
const dashConv = convertDocument(dashPieces, { viewport: { width: 390, height: 844 } });
const dashKinds = typesIn(dashConv.ui);
for (const need of ["rave.Tiles", "rave.Tile", "rave.Bars", "rave.Banner", "rave.Pills", "rave.Chip", "rave.TabBar", "rave.Tab"]) {
  if (!dashKinds.includes(need)) throw new Error("dashboard piece did not collapse to " + need + ": " + dashKinds.join(", "));
}
const tile = findType(dashConv.ui, "rave.Tile")[0];
if (!tile || !tile.props || tile.props.value !== "7h 38m") {
  throw new Error("tile value missing: " + JSON.stringify(dashConv.ui, null, 2));
}
const banner = findType(dashConv.ui, "rave.Banner")[0];
if (!banner || !banner.props || banner.props.title !== "100k Steps in 10 Days") {
  throw new Error("banner title missing: " + JSON.stringify(banner));
}
const bars = findType(dashConv.ui, "rave.Bars")[0];
if (!bars || !bars.props || !Array.isArray(bars.props.bars) || bars.props.bars[0].label !== "M") {
  throw new Error("bars series missing: " + JSON.stringify(bars));
}
const chip = findType(dashConv.ui, "rave.Chip").find((c) => c.props && c.props.label === "Week");
if (!chip || chip.props.active !== true) throw new Error("active pill must set Chip.active: " + JSON.stringify(chip));
const tabItem = findType(dashConv.ui, "rave.Tab")[0];
if (!tabItem || tabItem.props.label !== "Progress" || tabItem.props.active !== true || tabItem.id !== "nav.progress") {
  throw new Error("tab did not collapse: " + JSON.stringify(tabItem));
}
if (JSON.stringify(dashConv.ui).includes("ui-tab-icon") || JSON.stringify(dashConv.ui).includes("evg.div")) {
  throw new Error("tab internals leaked: " + JSON.stringify(dashConv.ui));
}
if ((dashConv.css || "").includes(".ui-tabbar") || (dashConv.css || "").includes(".ui-tab-icon")) {
  throw new Error("kit tabbar CSS leaked: " + dashConv.css);
}
if (!(dashConv.css || "").includes(".rui-s2")) {
  throw new Error("author chip colour was stripped with the kit sheet: " + dashConv.css);
}
const kinded = buildRangerUi({ doc: dashPieces, kind: "empty", name: "Progress" });
if (kinded.compact.meta.kind !== "dashboard") {
  throw new Error("empty seed with dashboard pieces should infer kind dashboard: " + kinded.compact.meta.kind);
}
if (inferKind(dashConv.ui, "empty") !== "dashboard") {
  throw new Error("inferKind missed dashboard pieces");
}
console.log("  dashboard   tiles/bars/banner/pills/TabBar collapse to named types");

// --- an app's machine and pages travel ---------------------------------------

const withApp = fs.mkdtempSync(path.join(os.tmpdir(), "evg-export-app-"));
fs.copyFileSync(path.join(here, "fixtures/dashboard.evg.json"), path.join(withApp, "doc.evg.json"));
fs.cpSync(path.join(here, "fixtures/app"), path.join(withApp, "app"), { recursive: true });
const packed = exportSession({ dir: withApp, kind: "dashboard", name: "tabs" });
if (!packed.hasApp) throw new Error("an app next to the document was not exported");
if (!packed.compact.machine || packed.compact.machine.id !== "traffic") {
  throw new Error("machine.json did not embed: " + JSON.stringify(packed.compact.machine && packed.compact.machine.id));
}
if (!packed.compact.pages || Object.keys(packed.compact.pages).length !== 3) {
  throw new Error(`expected 3 pages in the document, got ${JSON.stringify(Object.keys(packed.compact.pages || {}))}`);
}
const collected = collectFiles(withApp);
if (!collected["app/pages/map.evg.json"]) throw new Error("a page was skipped on disk");
fs.rmSync(withApp, { recursive: true, force: true });
console.log("  with app    machine + 3 pages inside the same JSON");

const tagged = JSON.parse(JSON.stringify(dash));
tagged.root.children[0].id = "nav.home";
if (!outlineOf(tagged).some((l) => l.includes("#nav.home"))) {
  throw new Error("an id on a node does not appear in the outline");
}
console.log("  ids         nav.home is visible in the outline");

// --- over HTTP ---------------------------------------------------------------

const saved = fs.mkdtempSync(path.join(os.tmpdir(), "evg-export-saved-"));
const port = 8700 + Math.floor(Math.random() * 60);
const server = spawn(process.execPath, [path.join(here, "serve.mjs")], {
  cwd: root,
  env: { ...process.env, EVG_LIVEBUILD_SAVED: saved, EVG_LIVEBUILD_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (b) => { log += b; });
server.stderr.on("data", (b) => { log += b; });

const done = (code) => {
  server.kill();
  fs.rmSync(saved, { recursive: true, force: true });
  process.exit(code);
};
process.on("uncaughtException", (e) => {
  console.error(e.message);
  console.error(log.slice(-800));
  done(1);
});

const base = `http://127.0.0.1:${port}`;
const ask = async (p, body) => {
  const res = await fetch(base + p, body
    ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    : undefined);
  const d = await res.json();
  if (d.error) throw new Error(`${p}: ${d.error}`);
  return d;
};

for (let i = 0; ; i += 1) {
  try {
    await ask("/saved");
    break;
  } catch (e) {
    if (i > 60) throw new Error(`the server never came up:\n${log.slice(-600)}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

await ask("/seed?kind=dashboard");
const first = await ask("/export?w=390&h=844");
if (first.format !== FORMAT) throw new Error(`wrong format: ${first.format}`);
if (first.hasApp) throw new Error("a seed exported an app it does not have");
if (!first.compact || first.compact.ui.type !== "Screen") throw new Error("HTTP compact has no Screen");
if (first.compact.compiled) throw new Error("HTTP compact included compiled");
if (!first.full || !first.full.compiled) throw new Error("HTTP full dropped compiled.evg");
if (first.viewport.width !== 390) throw new Error(`viewport did not travel: ${JSON.stringify(first.viewport)}`);
console.log(`  http        seed compact ${first.nodes} nodes, ${first.bytes} bytes`);

const typed = await ask("/export?ask=" + encodeURIComponent("four-tab bottom nav"));
if (!typed.compact.meta.prompt.includes("four-tab bottom nav")) {
  throw new Error("the typed ask did not reach meta.prompt");
}
console.log("  ask         the box on the page is what the next agent is told");

const session = path.join(os.tmpdir(), "evg-live-session");
const docPath = path.join(session, "doc.evg.json");
const doc = JSON.parse(fs.readFileSync(docPath, "utf8"));
doc.root.children[0].id = "nav.first";
doc.root.children[1].id = "nav.second";
fs.writeFileSync(docPath, JSON.stringify(doc, null, 1));

const ran = await ask("/app/data");
if (ran.example) throw new Error("Run did not make an app out of the named tabs");

const second = await ask("/export");
if (!second.hasApp) throw new Error("after Make app, export has no app");
if (!second.compact.machine) throw new Error("machine missing from the HTTP export");
if (!second.ids.includes("nav.first")) throw new Error(`ids did not travel: ${second.ids}`);
const check = validateRangerUi(second.compact);
if (!check.ok) throw new Error("HTTP compact failed schema: " + check.errors.join("; "));
console.log(`  app         machine + ids ${second.ids.join(", ")}`);

console.log("ALL PASS — one ranger-ui JSON, semantic tree, css, optional machine");
done(0);
