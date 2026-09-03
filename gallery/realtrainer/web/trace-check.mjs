#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Replay a scenario on the Ranger side and write — or check — its trace.
//
//   node gallery/realtrainer/web/trace-check.mjs [--record]
//
// This is one half of the benchmark. The other half is the same scenario run
// against the app as it really is — `frontend --mode test` on 5175 with the
// Firebase emulators — by `scripts/record-reference-trace.mjs`, which needs a
// machine that has both. Neither half is much use alone; what makes them
// comparable is that they emit the SAME SHAPE: after every step, the
// accessibility tree as role, name and state.
//
// Why the accessibility tree and not test ids: the views being measured carry
// zero `data-testid` attributes — DashboardPage, YearSheetPageV2,
// NewCalendarPage, CalendarWizard and PeriodDetailPage, all of them. Roles and
// names are already there, and they are also what the EVG side publishes
// through `UiCtl.rows()`. It is the same key `gallery/ui` diffs against Radix.
//
// The trace is committed, for the reason the L0 oracle is: this repository's
// CI has neither the emulators nor the private frontend.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const record = process.argv.includes("--record");

const require_ = createRequire(import.meta.url);
const BIN = path.join(ROOT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const { RealTrainerDemo } = require_(BIN);
const CSS = fs.readFileSync(path.join(HERE, "realtrainer.css"), "utf8");
const COMPACT = fs.readFileSync(
  path.join(ROOT, "fixtures", "session.compact"),
  "utf8",
);
// The plan-week machine is read from its own definition — the same file
// `rt:machine:live` runs through XState — so the view is never a transcription.
const PLAN_MACHINE = fs.readFileSync(
  path.join(ROOT, "fixtures", "machines", "planDialog.machine.json"),
  "utf8",
);

/** Role, name and state per node — the fields both sides can answer. */
function snapshot(app) {
  return JSON.parse(app.a11yJson(1, "")).nodes.map((n) => ({
    role: n.role,
    name: n.name ?? "",
    state: n.state ?? "",
  }));
}

/**
 * Where the machine the scenario names is, on this side — the same answer the
 * React side gives through `window.__machineState`. A step that says which
 * state it should leave behind is checked, not just recorded.
 */
function machineState(app, machine) {
  if (machine === "addWorkoutDialog") return app.addDialog.state;
  if (machine === "planDialog") return app.plan.state();
  return "";
}

function runScenario(file) {
  const scenario = JSON.parse(fs.readFileSync(file, "utf8"));
  const app = new RealTrainerDemo();
  app.init(CSS, COMPACT);
  app.loadPlanMachine(PLAN_MACHINE);
  const apply = (step) => {
    if (step.tick !== undefined) return app.tick(step.tick);
    return app.press(step.id);
  };
  for (const step of scenario.setup ?? []) apply(step);
  const wrong = [];
  const frames = scenario.steps.map((step) => {
    const handled = apply(step);
    const state = machineState(app, scenario.machine);
    if (step.state !== undefined && step.state !== state) {
      wrong.push(`${step.id ?? `tick ${step.tick}`}: in ${state}, wanted ${step.state}`);
    }
    return {
      step: step.id ?? `tick ${step.tick}`,
      handled: !!handled,
      state,
      nodes: snapshot(app),
    };
  });
  return { id: scenario.id, machine: scenario.machine, frames, wrong };
}

const dir = path.join(ROOT, "fixtures", "scenarios");
const out = path.join(ROOT, "traces");
let failed = 0;

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const { wrong, ...trace } = runScenario(path.join(dir, name));
  const target = path.join(out, name);
  const text = JSON.stringify(trace, null, 1) + "\n";
  if (wrong.length) {
    failed += 1;
    console.log(`  FAIL ${name} — the machine is not where the scenario says: ${wrong.join("; ")}`);
    continue;
  }
  if (record) {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(target, text);
    console.log(`  recorded ${name} — ${trace.frames.length} frames`);
    continue;
  }
  if (!fs.existsSync(target)) {
    failed += 1;
    console.log(`  FAIL ${name} — no trace recorded; run npm run rt:trace:record`);
    continue;
  }
  const want = fs.readFileSync(target, "utf8");
  if (want === text) {
    console.log(`  PASS ${name} — ${trace.frames.length} frames`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name} — the trace moved`);
  }
}

console.log("");
if (failed) {
  console.log(`${failed} scenario(s) differ`);
  process.exit(1);
}
console.log("the Ranger trace is the recorded one");
