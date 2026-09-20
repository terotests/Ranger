#!/usr/bin/env node
/**
 * The app door: a machine, a page per state, and the checks between them.
 * PLAN_LIVE_APP.md stage S1.
 *
 *   npm run livebuild:app
 *
 * What this is really testing is `check`. A sound app passing is the easy
 * half; the half that matters is that a BROKEN app fails, and fails by
 * naming which of the three invisible defects it has — a state with no page,
 * a page no state renders, an id that is not an event. An app whose tab bar
 * is decoration passes every other check in this repository.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const bin = path.join(root, "gallery/evg/bin/evg_app.js");
const fixture = path.join(here, "fixtures/app");

function compile() {
  if (fs.existsSync(bin)) return;
  const r = spawnSync(
    "bash",
    ["scripts/rgr-suite.sh", "./gallery/evg/livebuild/EvgAppTool.rgr", "./gallery/evg/bin", "evg_app.js"],
    { cwd: root, encoding: "utf8", maxBuffer: 40 * 1024 * 1024 },
  );
  if (!fs.existsSync(bin)) {
    console.error(`${r.stdout || ""}${r.stderr || ""}`.slice(-3000));
    throw new Error("could not build EvgAppTool");
  }
}

function app(...args) {
  const r = spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
  });
  const text = (r.stdout || "").trim();
  const open = text.indexOf("{");
  if (open < 0) throw new Error(`no answer from ${args[0]}: ${text.slice(0, 300)}`);
  return JSON.parse(text.slice(open));
}

compile();

// --- the sound app ----------------------------------------------------------

const states = app("states", fixture);
if (states.count !== 3) throw new Error(`expected three states, got ${states.count}`);
for (const s of states.states) {
  if (!s.hasPage) throw new Error(`${s.state} has no page`);
  if (!s.events.length) throw new Error(`${s.state} answers to nothing`);
}
console.log(`  states      ${states.states.map((s) => s.state).join(", ")} (initial ${states.initial})`);

// A press is only real if it lands somewhere. The last one is deliberately an
// event the state does not take: silence is the answer a screen gives to a
// dead button, and the tool has to say so instead.
const walk = app("press", fixture, "nav.routes", "route.add", "nav.map", "route.add");
if (walk.state !== "map") throw new Error(`the walk ended in ${walk.state}`);
const taken = walk.steps.filter((s) => s.taken).length;
if (taken !== 3) throw new Error(`three of four presses should land, got ${taken}`);
if (walk.steps.at(-1).taken) throw new Error("route.add is not an event of map");
if (!/ignored/.test(walk.steps.at(-1).note || "")) throw new Error("an ignored press said nothing");
if (String(walk.context.trips) !== "4") {
  throw new Error(`the assign did not reach the context: ${JSON.stringify(walk.context)}`);
}
console.log(`  press       3 of 4 landed, context ${JSON.stringify(walk.context)}`);

const clean = app("check", fixture);
if (clean.count !== 0) throw new Error(`the fixture app has problems: ${clean.problems.join("; ")}`);
for (const page of clean.pages) {
  if (page.layout.count !== 0) throw new Error(`${page.state} does not measure clean`);
  if (!(page.ids > 0)) throw new Error(`${page.state} has nothing to press`);
}
console.log(`  check       ${clean.pages.length} pages, every id an event, every page measured`);

// The context reaches the text, which is the whole templating language.
const out = path.join(os.tmpdir(), "evg-app-render.evg.json");
const rendered = app("render", fixture, "nav.routes", "route.add", `--out=${out}`);
if (rendered.state !== "routes") throw new Error("render landed in the wrong state");
const doc = fs.readFileSync(out, "utf8");
if (!doc.includes("4 tallennettua")) throw new Error("{trips} was not filled from the context");
if (doc.includes("{trips}")) throw new Error("the binding was left in the page");
console.log("  render      {trips} → 4, the page a host would paint");

// --- the data model and the memory ------------------------------------------

const model = app("model", fixture);
if (model.count !== 0) throw new Error(`the fixture model has problems: ${model.problems.join("; ")}`);
const trips = model.keys.find((k) => k.key === "trips");
if (!trips || !trips.declared) throw new Error("trips is not in the model");
if (!/route.add/.test(trips.writtenBy)) throw new Error("the model lost who writes trips");
if (!/routes/.test(trips.readBy)) throw new Error("the model lost who reads trips");
console.log(`  model       ${model.keys.length} key(s): ${trips.key} written by ${trips.writtenBy}, read by ${trips.readBy}`);

// The memory is half generated and half written, and the written half has to
// survive a refresh — a memory that eats what somebody wrote into it will not
// be written into twice.
const memoPath = path.join(fixture, "APP.md");
const before = fs.readFileSync(memoPath, "utf8");
const memo = app("memo", fixture);
if (!memo.kept) throw new Error("memo did not know there was a file already");
const after = fs.readFileSync(memoPath, "utf8");
for (const kept of ["## What this app is for", "## Decisions", "stored, not counted"]) {
  if (!after.includes(kept)) throw new Error(`memo dropped the hand-written "${kept}"`);
}
if (after !== before) throw new Error("a refresh with nothing changed rewrote the file");
console.log("  memo        APP.md refreshed, every hand-written line kept");

// An app that changed and a memory that did not is the failure this exists to
// catch, along with a key the machine gained and nothing declared.
const stale = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-stale-"));
fs.cpSync(fixture, stale, { recursive: true });
const machine = JSON.parse(fs.readFileSync(path.join(stale, "machine.json"), "utf8"));
machine.states.routes.on["route.remove"] = { actions: [{ assign: { deleted: { value: "1" } } }] };
fs.writeFileSync(path.join(stale, "machine.json"), JSON.stringify(machine));
const drifted = app("check", stale);
const saidDrift = drifted.problems.join(" | ");
if (!/APP\.md no longer describes/.test(saidDrift)) throw new Error(`stale memory went unreported: ${saidDrift}`);
if (!/not in the machine's initial context/.test(saidDrift)) throw new Error(`the undeclared key went unreported: ${saidDrift}`);
// …and refreshing the memory is what clears the first of them.
app("memo", stale);
const refreshed = app("check", stale);
if (/APP\.md no longer describes/.test(refreshed.problems.join(" | "))) {
  throw new Error("a refreshed memory still reads as stale");
}
console.log("  stale       a changed app with an old memory is caught, and memo clears it");
fs.rmSync(stale, { recursive: true, force: true });

// --- a screen becoming an app -----------------------------------------------
//
// The phone on the live-build page is a document: it has a tab bar because a
// phone has one, and pressing it does nothing because there is nothing behind
// it. `init` writes the two mechanical parts — the machine and a page per
// state — and refuses to invent the third, which is which parts of each
// screen differ.
{
  // A screen whose tabs already carry ids says what its states are, and
  // reading that is not a guess.
  const wired = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-init-"));
  const made = app("init", wired, `--from=${path.join(fixture, "pages/map.evg.json")}`);
  if (made.states.join(",") !== "map,routes,settings") {
    throw new Error(`init did not read the states off the screen: ${made.states}`);
  }
  if (made.missing) throw new Error(`a wired screen should be missing nothing: ${made.missing}`);
  if (made.pages !== 3) throw new Error(`three states, ${made.pages} pages`);
  const ran = app("check", wired);
  const said = ran.problems.join(" | ");
  // Every page is the same screen to start with, so every state renders and
  // every id is an event — what is left is design, and `check` says nothing
  // about design.
  if (/is not an event/.test(said)) throw new Error(`the new app has dead ids: ${said}`);
  console.log(`  init        ${made.states.join(", ")} read off the screen, ${made.pages} pages, no dead ids`);
  fs.rmSync(wired, { recursive: true, force: true });

  // A screen with nothing pressable gets one state and is TOLD what is
  // missing, rather than being given a machine that looks finished.
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-init-"));
  const one = app("init", plain, `--from=${path.join(here, "fixtures/dashboard.evg.json")}`);
  if (one.states.join(",") !== "main") throw new Error(`expected one state, got ${one.states}`);
  if (one.idsOnTheScreen !== 0) throw new Error("that screen has no ids");
  if (!(one.missing || []).includes("nav.main")) throw new Error("init did not say what is missing");
  if (!/give what should switch tabs those ids/.test(one.next || "")) {
    throw new Error(`init did not say what to do next: ${one.next}`);
  }
  console.log(`  init bare   one state, 0 ids, and it says which id is missing`);
  fs.rmSync(plain, { recursive: true, force: true });
}

// --- the broken app ---------------------------------------------------------
//
// Three defects, one per line of `check`'s reason for existing.
const broken = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-broken-"));
fs.mkdirSync(path.join(broken, "pages"), { recursive: true });
fs.writeFileSync(
  path.join(broken, "machine.json"),
  JSON.stringify({
    id: "broken",
    initial: "one",
    states: {
      one: { on: { "go.two": { target: "two" } } },
      two: { on: { "go.one": { target: "one" } } },
    },
  }),
);
const page = (id) => ({
  evg: 1,
  root: {
    tag: "div",
    props: { display: "flex", width: "390px", height: "844px" },
    children: [{ tag: "div", id, props: { width: "100px", height: "40px" } }],
  },
});
// one: its only button sends an event the state does not take
fs.writeFileSync(path.join(broken, "pages/one.evg.json"), JSON.stringify(page("go.nowhere")));
// two: no page at all
// and a page nothing renders
fs.writeFileSync(path.join(broken, "pages/three.evg.json"), JSON.stringify(page("go.one")));

const bad = app("check", broken);
const said = bad.problems.join(" | ");
if (!/has no page/.test(said)) throw new Error(`a state with no page went unreported: ${said}`);
if (!/not the page of any state/.test(said)) throw new Error(`an orphan page went unreported: ${said}`);
if (!/is not an event this state takes/.test(said)) throw new Error(`a dead id went unreported: ${said}`);
if (bad.count < 3) throw new Error(`three defects, ${bad.count} reported`);
console.log(`  broken      ${bad.count} problems named: missing page, orphan page, dead id`);
fs.rmSync(broken, { recursive: true, force: true });

// Pages that are copies. `init` makes them on purpose and `check` has to say
// so, because a press that moves the machine over an identical screen is what
// a dead button looks like from the outside.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-copies-"));
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  const one = fs.readFileSync(path.join(here, "fixtures/app/pages/map.evg.json"), "utf8");
  for (const st of ["a", "b"]) fs.writeFileSync(path.join(dir, `pages/${st}.evg.json`), one);
  fs.writeFileSync(
    path.join(dir, "machine.json"),
    JSON.stringify({ id: "copies", initial: "a", states: { a: { on: { "nav.b": "b" } }, b: { on: { "nav.a": "a" } } } }),
  );
  const said = app("check", dir);
  const copy = said.problems.find((p) => /same document/.test(p));
  if (!copy) throw new Error(`identical pages went unreported: ${said.problems.join("; ")}`);
  if (said.problems.filter((p) => /same document/.test(p)).length !== 1) {
    throw new Error("the same fact was reported more than once");
  }
  console.log("  copies      two states, one document — named once, and it says what it looks like");
  fs.rmSync(dir, { recursive: true, force: true });
}

// A CONTROL THAT WORKS. A switch put on a screen used to be a picture with a
// real name: its press was an event and the machine took it, and nothing on
// the screen could move, because a control's state is a CLASS and only text
// was bound to the context. This is the whole chain in one check — the kit
// writes the control, the machine flips the key, the render shows the other
// state — and it is the difference between a screen of controls and a
// drawing of one.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-bound-"));
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  const page = path.join(dir, "pages/settings.evg.json");
  fs.writeFileSync(
    page,
    JSON.stringify({
      evg: 1,
      css: "",
      root: { tag: "div", props: { display: "flex", width: "390px", height: "160px" }, children: [] },
    }),
  );
  const kit = path.join(root, "gallery/ui/kit/ui_kit.mjs");
  const added = spawnSync(
    process.execPath,
    [kit, "add", "row", "--title", "Wi-Fi", "--control", "switch", "--checked", "--id", "toggle.wifi", "--bind", "wifi", "--into", page],
    { cwd: root, encoding: "utf8", timeout: 180000 },
  );
  const batch = JSON.parse(added.stdout || "{}");
  if (!batch.ops) throw new Error("the kit did not answer a batch: " + (added.stderr || added.stdout));
  const ops = path.join(dir, "ops.json");
  fs.writeFileSync(ops, JSON.stringify({ ops: batch.ops }));
  const agent = path.join(root, "lib/evg/bin/evg_agent.js");
  if (fs.existsSync(agent)) {
    spawnSync(process.execPath, [agent, "patch", page, ops], { cwd: root, encoding: "utf8", timeout: 180000 });
    const doc = fs.readFileSync(page, "utf8");
    if (!doc.includes("ui-switch-track-state-{wifi}")) {
      throw new Error("the control's state is not bound to the machine: " + doc.slice(0, 400));
    }
    // The paint has to come from the RULES, not from properties baked into
    // the node — an inline colour outranks every rule, and a control saved
    // that way is frozen in the state it was built in.
    if (/"background-color":"rgb\(22,163,74\)"/.test(doc)) {
      throw new Error("the control was saved with its colours resolved into it");
    }
    fs.writeFileSync(
      path.join(dir, "machine.json"),
      JSON.stringify({
        id: "bound",
        initial: "settings",
        context: { wifi: "checked" },
        states: {
          settings: {
            on: {
              "toggle.wifi": [
                { guard: { is: { context: "wifi" }, equals: "checked" }, actions: [{ assign: { wifi: { value: "unchecked" } } }] },
                { actions: [{ assign: { wifi: { value: "checked" } } }] },
              ],
              "toggle.wifi.control": [
                { guard: { is: { context: "wifi" }, equals: "checked" }, actions: [{ assign: { wifi: { value: "unchecked" } } }] },
                { actions: [{ assign: { wifi: { value: "checked" } } }] },
              ],
            },
          },
        },
      }),
    );
    const pressed = app("press", dir, "toggle.wifi");
    if ((pressed.context || {}).wifi !== "unchecked") {
      throw new Error("a press did not flip the control: " + JSON.stringify(pressed.context));
    }
    const twice = app("press", dir, "toggle.wifi", "toggle.wifi");
    if ((twice.context || {}).wifi !== "checked") {
      throw new Error("two presses did not come back: " + JSON.stringify(twice.context));
    }
    const shown = spawnSync(process.execPath, [bin, "render", dir], { cwd: root, encoding: "utf8" }).stdout || "";
    if (!shown.includes("ui-switch-track-state-checked")) {
      throw new Error("the render did not fill the state in from the context");
    }
    console.log("  bound       a switch the machine owns: press it and the screen moves");
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

// MAKE APP WIRES THE CONTROLS. A screen with a bound switch on it is telling
// the machine what it needs — a key called `wifi`, and an event that flips
// it — and writing that by hand was the last step between "the kit drew me a
// control" and "the control works". `init` reads them off the screen the way
// it reads `nav.*` for the states, so a designed screen becomes an app whose
// switches move without anybody opening machine.json.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-wire-"));
  const screen = path.join(dir, "doc.evg.json");
  fs.writeFileSync(
    screen,
    JSON.stringify({
      evg: 1,
      css: "",
      root: { tag: "div", props: { display: "flex", width: "390px", height: "200px" }, children: [] },
    }),
  );
  const kit = path.join(root, "gallery/ui/kit/ui_kit.mjs");
  const agent = path.join(root, "lib/evg/bin/evg_agent.js");
  if (fs.existsSync(agent)) {
    for (const [id, key, on] of [["toggle.cellular", "cellular", true], ["toggle.wifi", "wifi", false]]) {
      const args = [kit, "add", "row", "--title", key, "--control", "switch", "--id", id, "--bind", key, "--into", screen];
      if (on) args.push("--checked");
      const made = JSON.parse(spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 180000 }).stdout || "{}");
      const opsFile = path.join(dir, "ops.json");
      fs.writeFileSync(opsFile, JSON.stringify({ ops: made.ops }));
      spawnSync(process.execPath, [agent, "patch", screen, opsFile], { cwd: root, encoding: "utf8", timeout: 180000 });
    }
    const appDir = path.join(dir, "app");
    // `--from=` is the flag form this tool reads.
    app("init", appDir, `--from=${screen}`);
    const machine = JSON.parse(fs.readFileSync(path.join(appDir, "machine.json"), "utf8"));
    // The context comes off the SCREEN: the app opens as it was drawn.
    if (machine.context.cellular !== "checked" || machine.context.wifi !== "unchecked") {
      throw new Error("init did not read the controls' states: " + JSON.stringify(machine.context));
    }
    const on = machine.states.main.on;
    for (const want of ["toggle.wifi", "toggle.wifi.control", "toggle.cellular"]) {
      if (!on[want]) throw new Error(`init wired no event for ${want}`);
    }
    const flipped = app("press", appDir, "toggle.wifi");
    if (flipped.context.wifi !== "checked") {
      throw new Error("the wired toggle did not flip: " + JSON.stringify(flipped.context));
    }
    const rendered = spawnSync(process.execPath, [bin, "render", appDir], { cwd: root, encoding: "utf8" }).stdout || "";
    if (!rendered.includes("ui-switch-track-state-checked") || !rendered.includes("ui-switch-track-state-unchecked")) {
      throw new Error("the two switches render in the same state");
    }
    console.log("  make app    a screen's bound controls become context keys and events");
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

// THE SAME BINDING IN THE TAB. The tool renders a page and so does the
// browser runtime, and for a while they were two copies of the rule: the CLI
// filled `{key}` in a class and the tab did not, so a switch bound to the
// machine moved on the command line and was dead in the browser — which is
// the only place anybody looks. One copy now lives in `EvgAppRules`; this is
// what says so, without a browser.
{
  const webBin = path.join(root, "gallery/evg/bin/evg_app_web.js");
  if (fs.existsSync(webBin)) {
    const src = fs.readFileSync(webBin, "utf8");
    const mod = await import("data:text/javascript," + encodeURIComponent(src + "\nexport { EvgAppWeb };\n"));
    const w = new mod.EvgAppWeb();
    const machine = JSON.stringify({
      id: "tab",
      initial: "settings",
      context: { wifi: "checked" },
      states: {
        settings: {
          on: {
            "toggle.wifi": [
              { guard: { is: { context: "wifi" }, equals: "checked" }, actions: [{ assign: { wifi: { value: "unchecked" } } }] },
              { actions: [{ assign: { wifi: { value: "checked" } } }] },
            ],
          },
        },
      },
    });
    if (!w.boot(machine)) throw new Error("the runtime in the tab did not boot");
    w.put(
      "settings",
      JSON.stringify({
        evg: 1,
        css: "",
        root: {
          tag: "div",
          props: { display: "flex", width: "390px", height: "200px" },
          children: [{ tag: "div", id: "toggle.wifi", props: { width: "44px", height: "26px", "class-name": "ui-switch-track ui-switch-track-state-{wifi}" } }],
        },
      }),
    );
    w.size(390, 200);
    if (!JSON.parse(w.frame()).context) throw new Error("a frame from the tab carries no context");
    const hit = JSON.parse(w.press(20, 10));
    if (!hit.takes) throw new Error("the press did not reach the machine in the tab");
    if (!hit.context || hit.context.wifi !== "unchecked") {
      throw new Error("the press answered no context: " + JSON.stringify(hit));
    }
    const cls = JSON.parse(w.doc()).root.children[0].props["class-name"];
    if (!cls.includes("ui-switch-track-state-unchecked")) {
      throw new Error("the tab did not fill the state into the class: " + cls);
    }
    console.log("  in the tab  the same binding and the same context the CLI has");
  }
}

console.log("ALL PASS — a machine, a page per state, a model that agrees with itself, a memory that does not rot");
