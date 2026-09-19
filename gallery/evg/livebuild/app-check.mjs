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

console.log("ALL PASS — a machine, a page per state, a model that agrees with itself, a memory that does not rot");
