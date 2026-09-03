#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Record the reference trace from the app as it really runs.
//
//   node gallery/realtrainer/scripts/record-reference-trace.mjs \
//        [--url http://localhost:5175] [--out traces/reference]
//
// THIS DOES NOT RUN IN THIS REPOSITORY'S CI, and cannot: it needs the
// RealTrainer frontend and the Firebase emulators, neither of which is here.
// Run it on a machine that has the monorepo checked out, with the stack the
// e2e harness already starts:
//
//   cd realtrainer/e2e && npm run ui:emulator:ready     # frontend :5175 + emulators
//   node .../record-reference-trace.mjs                 # then this
//
// It drives the same scenarios `web/trace-check.mjs` replays on the Ranger
// side and writes the same shape: after every step, the accessibility tree as
// role, name and state. The two are then comparable, which is the whole point
// — the React app is the oracle and the port is what is measured.
//
// Steps are clicked BY ROLE AND NAME. The views in scope carry zero
// `data-testid` attributes — DashboardPage, YearSheetPageV2, NewCalendarPage,
// CalendarWizard, PeriodDetailPage — so adding ids would be a change to the
// private repository for every node measured. Roles and names are already
// there, and they are what the EVG side publishes anyway.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireHostTool, MissingDomDeps } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const URL = arg("--url", "http://localhost:5175");
const OUT = path.resolve(ROOT, arg("--out", path.join("traces", "reference")));

let playwright;
try {
  playwright = requireHostTool("playwright-core");
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}

const browser = await playwright.chromium.launch();
const page = await browser.newPage();

try {
  const response = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 10000 });
  if (!response || !response.ok()) throw new Error(`no app at ${URL}`);
} catch (e) {
  console.error(
    `${e.message}\n\n` +
      `The app has to be running. From the monorepo:\n` +
      `  cd e2e && npm run ui:emulator:ready\n` +
      `then re-run this with --url if it is not on 5175.`,
  );
  await browser.close();
  process.exit(2);
}

/**
 * Role, name and state per node, off the real accessibility tree — the same
 * three fields the Ranger side answers with.
 */
async function snapshot() {
  const tree = await page.accessibility.snapshot({ interestingOnly: true });
  const out = [];
  const walk = (node) => {
    if (!node) return;
    out.push({
      role: node.role ?? "",
      name: node.name ?? "",
      state: node.checked ?? node.pressed ?? node.expanded ?? "",
    });
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return out;
}

async function apply(step) {
  if (step.tick !== undefined) {
    await page.waitForTimeout(step.tick);
    return true;
  }
  const target = page.getByRole(step.role, { name: step.name, exact: false }).first();
  if ((await target.count()) === 0) return false;
  await target.click();
  await page.waitForTimeout(120);
  return true;
}

const dir = path.join(ROOT, "fixtures", "scenarios");
fs.mkdirSync(OUT, { recursive: true });

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const scenario = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
  for (const step of scenario.setup ?? []) await apply(step);
  const frames = [];
  for (const step of scenario.steps) {
    const handled = await apply(step);
    frames.push({
      step: step.id ?? `tick ${step.tick}`,
      handled,
      nodes: await snapshot(),
    });
  }
  const trace = { id: scenario.id, machine: scenario.machine, frames };
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(trace, null, 1) + "\n");
  console.log(
    `  recorded ${name} — ${frames.length} frames, ` +
      `${frames.filter((f) => !f.handled).length} step(s) found nothing to click`,
  );
}

await browser.close();
console.log(`\nreference traces in ${path.relative(process.cwd(), OUT)}`);
console.log(
  "Diff them against the Ranger side with `npm run rt:trace` — a step that found\n" +
    "nothing to click is a name the port and the app do not agree on, which is\n" +
    "the first thing worth fixing.",
);
