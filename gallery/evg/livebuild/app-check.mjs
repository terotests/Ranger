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

console.log("ALL PASS — a machine, a page per state, and nothing pressable that is dead");
