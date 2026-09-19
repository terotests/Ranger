#!/usr/bin/env node
/**
 * A code app: the same app as fixtures/app, written as a program.
 * PLAN_LIVE_APP.md stage S4.
 *
 *   npm run livebuild:codeapp
 *
 * Two things are being checked, and only the second one is new.
 *
 * The first is that a code app answers the same questions a data app does —
 * `states`, `check`, `render`, `hit` — because the host must not have to know
 * which kind it is holding.
 *
 * The second is the reason code exists at all: a list that comes from the
 * context and an instance that outlives a build. The instance is the subtle
 * one. A command line spawns a process per press, and a process that dies
 * takes every component with it, so `seen` would be 1 forever and a component
 * would be an expensive way to write a function. Held open — one module, one
 * kit, many presses — the same row comes back, and that is what this asserts.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const appDir = path.join(here, "fixtures/codeapp");
const cliBin = path.join(appDir, "bin/app.js");
const modBin = path.join(appDir, "bin/app_module.mjs");

function compile(out, extra) {
  const src = path.join(appDir, "App.rgr");
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) return;
  const r = spawnSync(
    "node",
    ["bin/output.js", "-es6", ...extra, src, `-d=${path.join(appDir, "bin")}`, `-o=${path.basename(out)}`],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
      env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    },
  );
  const text = `${r.stdout || ""}${r.stderr || ""}`;
  if (!fs.existsSync(out) || /Compilation FAILED/.test(text)) {
    console.error(text.slice(-2000));
    throw new Error(`App.rgr did not compile into ${path.basename(out)}`);
  }
}

function cli(...args) {
  const r = spawnSync(process.execPath, [cliBin, ...args, `--app=${appDir}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
  });
  const text = (r.stdout || "").trim();
  const open = text.indexOf("{");
  if (open < 0) throw new Error(`no answer from ${args[0]}: ${text.slice(0, 300)}`);
  return JSON.parse(text.slice(open));
}

compile(cliBin, ["-nodecli"]);
compile(modBin, ["-esm", "-nodemodule"]);

// --- the same questions a data app answers ----------------------------------

const states = cli("states");
if (!states.code) throw new Error("a code app should say so");
if (states.count !== 3) throw new Error(`expected three states, got ${states.count}`);
for (const s of states.states) {
  if (!s.events.length) throw new Error(`${s.state} answers to nothing`);
}
console.log(`  states      ${states.states.map((s) => s.state).join(", ")} — from a program, not a folder`);

const checked = cli("check");
if (checked.count !== 0) throw new Error(`the code app has problems: ${checked.problems.join("; ")}`);
for (const page of checked.pages) {
  if (page.layout.count !== 0) throw new Error(`${page.state} does not measure clean`);
  if (!(page.ids > 0)) throw new Error(`${page.state} has nothing to press`);
}
console.log(`  check       ${checked.pages.length} pages built and measured, every id an event`);

const hit = cli("hit", "195", "790");
if (hit.id !== "nav.routes" || !hit.takes) throw new Error(`the nav does not answer: ${JSON.stringify(hit)}`);
// `hit` asks; it must not press. The events it was given are the caller's
// session, and one it added itself would be a history nobody wrote.
const after = cli("hit", "195", "790");
if (after.state !== hit.state) throw new Error("hit moved the machine");
console.log(`  hit         (195,790) → ${hit.id}, and the machine did not move`);

// --- what a document cannot do ----------------------------------------------

const { App, EvgAppKit } = await import(pathToFileURL(modBin).href);
const machine = fs.readFileSync(path.join(appDir, "machine.json"), "utf8");
const app = new App();
const kit = new EvgAppKit();
app.kit = kit;
kit.bootText(machine);

const started = kit.list("routes").length;
if (started !== 2) throw new Error(`the fixture starts with two routes, not ${started}`);
kit.sendEvent("nav.routes");
kit.sendEvent("route.add");
const grown = kit.list("routes");
if (grown.length !== started + 1) throw new Error(`the list did not grow: ${JSON.stringify(grown)}`);

const frame = JSON.parse(kit.frameJson(app));
if (!(frame.ncmds > 0)) throw new Error("the page drew nothing");
if (frame.layout.count !== 0) throw new Error(`the grown page does not measure clean: ${JSON.stringify(frame.layout)}`);
if (frame.live !== grown.length) throw new Error(`${grown.length} rows, ${frame.live} components`);
console.log(`  list        ${started} → ${grown.length} routes, ${frame.live} row components, ${frame.ncmds} draw commands`);

// The instance, which is the whole reason this runtime is held open.
const rowPath = kit.host.livePaths().find((p) => p.includes("Keskusta"));
if (!rowPath) throw new Error("the first route has no component");
const seenAfterTwo = kit.host.find(rowPath).seen;
kit.frameJson(app);
kit.frameJson(app);
const row = kit.host.find(rowPath);
if (row.seen !== seenAfterTwo + 2) {
  throw new Error(`the row was rebuilt from scratch: seen ${row.seen}, expected ${seenAfterTwo + 2}`);
}
if (row.renders < 3) throw new Error(`the instance did not survive: renders ${row.renders}`);
console.log(`  instance    the same row across ${row.renders} builds — seen ${row.seen}, not 1`);

// A row that leaves is told. Nothing else can tell it: an element dropped from
// a tree takes its subtree out and notifies nobody.
const before = kit.liveComponents();
kit.sendEvent("nav.settings");
kit.frameJson(app);
const live = kit.liveComponents();
if (live >= before) throw new Error(`leaving the page kept ${live} components`);
console.log(`  dispose     ${before} components on routes, ${live} on settings`);

// --- a press, end to end, in one process ------------------------------------

const t0 = Date.now();
kit.sendEvent("nav.routes");
for (let i = 0; i < 20; i += 1) {
  kit.pressPoint(app, 195, 790);
  kit.frameJson(app);
}
const ms = Date.now() - t0;
if (ms > 2000) throw new Error(`20 presses took ${ms}ms — something is spawning`);
console.log(`  loop        20 presses and frames in ${ms}ms, no process in sight`);

// --- a compile that fails says why ------------------------------------------

const bad = fs.mkdtempSync(path.join(os.tmpdir(), "evg-app-bad-"));
fs.writeFileSync(path.join(bad, "machine.json"), JSON.stringify({ id: "bad", initial: "one", states: { one: {} } }));
fs.writeFileSync(
  path.join(bad, "App.rgr"),
  'Import "pkg:evg-livebuild/EvgAppKit.rgr"\n\nclass App extends EvgApp {\n    fn build:EVGElement (state:string) {\n        return (this.noSuchThing())\n    }\n}\n',
);
fs.writeFileSync(
  path.join(bad, "ranger.json"),
  JSON.stringify({
    name: "bad",
    entry: "App.rgr",
    dependencies: {
      evg: { path: path.join(root, "lib/evg") },
      "evg-livebuild": { path: path.join(root, "gallery/evg/livebuild") },
    },
  }),
);
const failed = spawnSync(
  "node",
  ["bin/output.js", "-es6", path.join(bad, "App.rgr"), `-d=${path.join(bad, "bin")}`, "-o=app.js", "-nodecli"],
  {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
  },
);
const said = `${failed.stdout || ""}${failed.stderr || ""}`;
if (!/\[FAIL\]/.test(said)) throw new Error("a broken app compiled, or failed silently");
if (!/noSuchThing/.test(said)) throw new Error(`the error does not name the mistake:\n${said.slice(-600)}`);
console.log("  compile     a broken App.rgr fails, and the error names the line");
fs.rmSync(bad, { recursive: true, force: true });

console.log("ALL PASS — an app that is a program: a list from the context, and an instance that outlives a build");
