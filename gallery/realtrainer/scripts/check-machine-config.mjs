#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Is the machine config still the machine?
//
//   node gallery/realtrainer/scripts/check-machine-config.mjs [--source <dir>]
//
// `fixtures/machines/*.machine.json` is the shape `createMachine()` takes, and
// `gallery/statechart` runs it. That is only worth anything while it is the
// SAME machine the app runs. So this reads the real TypeScript, evaluates it
// with `xstate` stubbed — `createMachine` hands back its config, `assign`
// leaves a marker — and compares the structure: state names, the events each
// state handles, and where each one goes.
//
// Actions are not compared and cannot be: in XState they are functions, which
// is the whole reason the JSON writes assignments declaratively. Guards ARE
// compared, by name: XState writes one as `guard: 'hasContent'` and the config
// carries the same name beside its predicate, so the two meet there. What this
// catches is the structural drift — a state added, an event removed, a target
// or a guard changed — which is the drift that happens.
//
// It is the other half of `rt:machine:live`, and neither half is parity alone.
// That one runs the same config through both the runner and xstate, so it
// measures the RUNNER and can never see a mis-transcription; this one reads the
// real TypeScript and can never run anything.
//
// It needs the monorepo, so it exits 0 and says so where the sources are not
// checked out, the way the parser sync does.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { requireHostTool, MissingDomDeps } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const REPO = path.resolve(HERE, "..", "..", "..");
const args = process.argv.slice(2);
const sourceArg = args.indexOf("--source");
const SOURCE = path.resolve(
  sourceArg === -1
    ? path.join(REPO, "..", "realtrainer", "frontend", "src", "machines")
    : args[sourceArg + 1],
);

const MACHINES = [
  { json: "addWorkoutDialog.machine.json", ts: "addWorkoutDialogMachine.ts" },
  { json: "planDialog.machine.json", ts: "planDialogMachine.ts" },
  { json: "chat.machine.json", ts: "chatMachine.ts" },
];

if (!fs.existsSync(path.join(SOURCE, MACHINES[0].ts))) {
  console.log(
    `No machine sources at ${SOURCE}\n` +
      `Pass --source <frontend/src/machines>, or check the RealTrainer monorepo\n` +
      `out next to this one.\n\nNothing to compare against — skipped.`,
  );
  process.exit(0);
}

let esbuild;
try {
  esbuild = requireHostTool("esbuild");
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rt-machine-"));
const require_ = createRequire(import.meta.url);
let failed = 0;

// One transition, reduced to what both sides can be asked: where it goes, and
// which guard decides. XState writes a guard as a NAME (`guard: 'hasContent'`)
// and the config as a predicate carrying `named`, so the two meet at the name.
const transitionShape = (spec) => {
  if (Array.isArray(spec)) return spec.map(transitionShape);
  if (typeof spec === "string") return { target: spec };
  const out = { target: spec.target ?? null };
  const guard = spec.guard;
  if (typeof guard === "string") out.guard = guard;
  else if (guard && guard.named) out.guard = guard.named;
  else if (guard) out.guard = "?";
  return out;
};

/**
 * State path → its shape: the events it handles and where each goes, plus the
 * structure that makes a state more than a place — its initial child, whether
 * it is final, its `always` fork and its `onDone`.
 */
function structureOf(config) {
  const out = {};
  const walk = (states, prefix) => {
    for (const [name, node] of Object.entries(states ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      const shape = {};
      for (const [event, spec] of Object.entries(node.on ?? {})) {
        shape[event] = transitionShape(spec);
      }
      const meta = {};
      if (node.initial) meta.initial = node.initial;
      if (node.type) meta.type = node.type;
      if (node.always) meta.always = transitionShape(node.always);
      if (node.onDone) meta.onDone = transitionShape(node.onDone);
      out[path] = Object.keys(meta).length > 0 ? { ...shape, "": meta } : shape;
      if (node.states) walk(node.states, path);
    }
  };
  walk(config.states, "");
  if (config.on) {
    const shape = {};
    for (const [event, spec] of Object.entries(config.on)) shape[event] = transitionShape(spec);
    // The machine's own transitions, available from anywhere. Keyed by a name
    // no state can have.
    out["<machine>"] = shape;
  }
  return out;
}

for (const { json, ts } of MACHINES) {
  // `createMachine` hands its config straight back, and `assign` leaves a
  // marker: nothing here runs the machine, it only wants its shape.
  const shim = path.join(tmp, "xstate.js");
  fs.writeFileSync(
    shim,
    "export const createMachine = (config) => config;\n" +
      "export const assign = () => ({ __assign: true });\n" +
      "export const setup = () => ({ createMachine });\n",
  );
  const bundle = path.join(tmp, path.basename(ts, ".ts") + ".cjs");
  await esbuild.build({
    entryPoints: [path.join(SOURCE, ts)],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: bundle,
    alias: { xstate: shim },
    logLevel: "warning",
  });

  const mod = require_(bundle);
  const config = Object.values(mod).find((v) => v && v.states);
  if (!config) {
    failed += 1;
    console.log(`  FAIL ${ts} — no machine config exported`);
    continue;
  }

  const ours = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures", "machines", json), "utf8"));
  const want = structureOf(config);
  const got = structureOf(ours);

  const say = (name, cond, detail) => {
    if (cond) console.log(`  PASS ${name}`);
    else {
      failed += 1;
      console.log(`  FAIL ${name}${detail === undefined ? "" : " — " + detail}`);
    }
  };

  console.log(`\n  ${json}  ⟷  ${ts}\n`);
  say("the id is the same", ours.id === config.id, `${ours.id} / ${config.id}`);
  say("the initial state is the same", ours.initial === config.initial,
      `${ours.initial} / ${config.initial}`);
  say("the same states, in the same order",
      Object.keys(want).join(",") === Object.keys(got).join(","),
      `${Object.keys(want).join(",")} / ${Object.keys(got).join(",")}`);
  for (const state of Object.keys(want)) {
    say(`${state}: the same events, targets and guards`,
        JSON.stringify(want[state]) === JSON.stringify(got[state] ?? {}),
        `${JSON.stringify(want[state])} / ${JSON.stringify(got[state] ?? {})}`);
  }
  // The context keys the machine starts with. Names only: the original's
  // values include `new Date()`, which is the difference the port is explicit
  // about.
  // The port adds keys the original computes rather than stores — a host's
  // date, in both machines so far — so this asks that nothing was LOST.
  say("the same context keys",
      Object.keys(config.context ?? {}).every((k) => k in (ours.context ?? {})),
      `${Object.keys(config.context ?? {}).join(",")} / ${Object.keys(ours.context ?? {}).join(",")}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log("");
if (failed) {
  console.log(`${failed} difference(s) between the config and the machine`);
  process.exit(1);
}
console.log("the machine config is the machine");
