#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The demo, drawing from the simulator instead of from a file.
//
//   npm run firesim:realtrainer
//
// `gallery/realtrainer` has no backend: it reads `fixtures/reference/seed.json`
// off the disk, which is exactly the file its reference recorder puts into the
// Firebase emulator before it drives the React app. So the honest test of this
// module is to put that file in the simulator, ASK FOR IT BACK over the REST
// API as a signed-in user, hand what comes back to the demo, and require the
// app to draw the same thing — node for node, frame for frame.
//
// If the simulator loses a field, mis-sorts a collection, drops a document
// behind the rules or answers a query the wrong way, the tree stops matching
// and this fails. Nothing here is a mock of the demo: it is the demo.
//
// It needs two builds:
//   npm run firesim:build
//   npm run rt:build

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createSim } from "../host/firesim.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const RT = path.join(MODULE, "..", "realtrainer");
const require_ = createRequire(import.meta.url);

const DEMO = path.join(RT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(DEMO)) {
  console.error("the demo is not built — run `npm run rt:build` first");
  process.exit(3);
}
const { RealTrainerDemo } = require_(DEMO);

const SEED_FILE = path.join(RT, "fixtures", "reference", "seed.json");
const SEED = fs.readFileSync(SEED_FILE, "utf8");
const CSS = fs.readFileSync(path.join(RT, "web", "realtrainer.css"), "utf8");
const COMPACT = fs.readFileSync(path.join(RT, "fixtures", "session.compact"), "utf8");
const PLAN_MACHINE = fs.readFileSync(path.join(RT, "fixtures", "machines", "planDialog.machine.json"), "utf8");
const CHAT_MACHINE = fs.readFileSync(path.join(RT, "fixtures", "machines", "chat.machine.json"), "utf8");
const RULES = fs.readFileSync(path.join(MODULE, "fixtures", "realtrainer.rules"), "utf8");

const PROJECT = "realtrainer-4354b";
const DATABASE = "europewest1";
const BASE = `/v1/projects/${PROJECT}/databases/${DATABASE}/documents`;

let passed = 0;
const failures = [];
const ok = (name, cond, detail) => (cond ? (passed += 1) : failures.push(`${name}${detail ? `\n      ${detail}` : ""}`));

// =============================================================================
// The simulator, seeded and signed into.
// =============================================================================
const sim = createSim({ projectId: PROJECT, databaseId: DATABASE, rules: RULES, latency: { baseMs: 0 } });
const me = sim.signUp("test@example.com", "testpassword123", "Test User");
const written = sim.seedFile(SEED_FILE, { ownerUid: me.uid });
ok("the recorder's own seed loads unconverted", written > 700, `${written} documents`);

const H = { Authorization: `Bearer ${me.idToken}` };

// The plain value under a REST field, for the shapes this seed uses.
function plain(field) {
  if (!field) return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("nullValue" in field) return null;
  if ("timestampValue" in field) return field.timestampValue;
  if ("arrayValue" in field) return (field.arrayValue.values ?? []).map(plain);
  if ("mapValue" in field) {
    const out = {};
    for (const [k, v] of Object.entries(field.mapValue.fields ?? {})) out[k] = plain(v);
    return out;
  }
  return undefined;
}
const docToObject = (doc) => {
  const out = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) out[k] = plain(v);
  return out;
};

// A collection, read as the signed-in user through a query the app could
// actually write: narrowed to their own rows, ordered, paged.
function collection(name, order) {
  const structuredQuery = {
    from: [{ collectionId: name }],
    where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: me.uid } } },
  };
  if (order) structuredQuery.orderBy = [{ field: { fieldPath: order }, direction: "ASCENDING" }];
  const res = sim.fetchNow(`${BASE}:runQuery`, { method: "POST", headers: H, body: { structuredQuery } });
  if (res.status !== 200) throw new Error(`${name}: ${res.bodyText}`);
  return JSON.parse(res.bodyText)
    .filter((r) => r.document)
    .map((r) => docToObject(r.document));
}

// The seed, rebuilt from what the backend answered. This is the object the
// app would build from a real Firestore, and it is what the demo is fed.
const fromBackend = {
  _: "rebuilt from what gallery/firesim answered over the REST API",
  week: JSON.parse(SEED).week,
  calendars: collection("calendars"),
  entries: collection("entries"),
  yearsheets: collection("yearsheets"),
};

const fileSeed = JSON.parse(SEED);
ok("every calendar comes back", fromBackend.calendars.length === fileSeed.calendars.length, `${fromBackend.calendars.length} vs ${fileSeed.calendars.length}`);
ok("every entry comes back", fromBackend.entries.length === fileSeed.entries.length, `${fromBackend.entries.length} vs ${fileSeed.entries.length}`);
ok("the year plan comes back", fromBackend.yearsheets.length === fileSeed.yearsheets.length);

// A nested example week survives the trip — the deepest structure the seed
// has, and the one a naive value model flattens.
const period = fromBackend.yearsheets[0]?.periods?.[0];
ok("a period's example week survives the wire", Array.isArray(period?.exampleWeeks) && period.exampleWeeks[0].days.length > 0, JSON.stringify(period?.exampleWeeks?.[0]?.days?.[0])?.slice(0, 60));

// The order the collections come back in has to be the file's order, because
// the app selects `calendars[0]` and draws that one.
ok(
  "the calendars come back in the order the app relies on",
  JSON.stringify(fromBackend.calendars.map((c) => c.id)) === JSON.stringify([...fileSeed.calendars].sort((a, b) => (a.id < b.id ? -1 : 1)).map((c) => c.id)),
  fromBackend.calendars.map((c) => c.id).join(","),
);

// …which is NOT the file's order — Firestore lists by document name. The app
// picks the first calendar, so a seed rebuilt from a backend has to say which
// one that is rather than inherit an accident of the file. Sorting the file's
// list the same way is what makes the two comparable.
const backendSeed = {
  ...fromBackend,
  calendars: [...fromBackend.calendars].sort((a, b) => fileSeed.calendars.findIndex((c) => c.id === a.id) - fileSeed.calendars.findIndex((c) => c.id === b.id)),
  entries: [...fromBackend.entries].sort((a, b) => fileSeed.entries.findIndex((e) => e.id === a.id) - fileSeed.entries.findIndex((e) => e.id === b.id)),
};

// =============================================================================
// The app, twice: from the file and from the backend.
// =============================================================================
function snapshot(app) {
  return JSON.parse(app.a11yJson(1, "")).nodes.map((n) => ({
    role: n.role,
    name: n.name ?? "",
    state: n.disabled ? "disabled" : n.checked === 2 ? "checked" : n.checked === 3 ? "mixed" : n.role === "heading" && n.level ? `level=${n.level}` : (n.state ?? ""),
  }));
}

// The same driver `web/trace-check.mjs` uses, so a frame here is a frame
// there: setup first, then a snapshot after every step.
function run(seedText, scenario) {
  const app = new RealTrainerDemo();
  app.init(CSS, COMPACT);
  app.loadPlanMachine(PLAN_MACHINE);
  app.loadChatMachine(CHAT_MACHINE);
  app.loadReference(seedText);
  const apply = (step) => {
    if (step.tick !== undefined) return app.tick(step.tick);
    if (step.page !== undefined) {
      const [w, h] = step.page.split("x").map(Number);
      app.setPageSize(w, h);
      return true;
    }
    if (step.route !== undefined) return app.openRoute(step.route);
    if (step.pointer !== undefined) {
      app.setPointerCoarse(step.pointer === "coarse");
      return true;
    }
    if (step.fail !== undefined) {
      app.armFailure();
      return true;
    }
    const pressed = app.press(step.id);
    if (step.type !== undefined) {
      const n = step.type.length;
      return app.applyEdit(step.id, step.type, n, n) || app.typeText(step.type) || pressed;
    }
    if (step.key !== undefined) return app.keyWith(step.key, false, false) || pressed;
    return pressed;
  };
  for (const step of scenario.setup ?? []) apply(step);
  return scenario.steps.map((step) => {
    apply(step);
    return snapshot(app);
  });
}

const SCENARIOS = ["calendar-week", "calendar-diary", "home-diary", "home-tabs", "yearsheet", "yearsheet-detail"];
// What the seed puts on the screen, so a run that rendered nothing cannot
// pass by comparing two empty trees.
let sawSeedContent = false;
for (const name of SCENARIOS) {
  const file = path.join(RT, "fixtures", "scenarios", `${name}.json`);
  if (!fs.existsSync(file)) {
    failures.push(`the scenario ${name} is missing`);
    continue;
  }
  const scenario = JSON.parse(fs.readFileSync(file, "utf8"));
  let fromFile;
  let fromSim;
  try {
    fromFile = run(SEED, scenario);
    fromSim = run(JSON.stringify(backendSeed), scenario);
  } catch (e) {
    failures.push(`${name} threw: ${String(e).slice(0, 200)}`);
    continue;
  }
  let firstBad = -1;
  let detail = "";
  for (let i = 0; i < Math.max(fromFile.length, fromSim.length); i += 1) {
    const a = JSON.stringify(fromFile[i] ?? null);
    const b = JSON.stringify(fromSim[i] ?? null);
    if (a !== b) {
      firstBad = i;
      const nodesA = fromFile[i] ?? [];
      const nodesB = fromSim[i] ?? [];
      const at = nodesA.findIndex((n, k) => JSON.stringify(n) !== JSON.stringify(nodesB[k]));
      detail = `frame ${i}, node ${at}: file ${JSON.stringify(nodesA[at])} vs sim ${JSON.stringify(nodesB[at])}`;
      break;
    }
  }
  const nodes = fromFile.reduce((n, f) => n + f.length, 0);
  const text = JSON.stringify(fromFile);
  if (text.includes("Harjoitussuunnitelma") || text.includes("Vuosisuunnitelma 2026")) sawSeedContent = true;
  ok(`${name}: the same tree from the simulator — ${fromFile.length} frames, ${nodes} nodes`, firstBad < 0 && nodes > 0, detail || `only ${nodes} nodes: the app did not render`);
}

ok("the seed reaches the screen (so the comparison is of something)", sawSeedContent);

// =============================================================================
// …and the app's writes go back through the rules.
// =============================================================================
{
  const add = sim.fetchNow(`${BASE}/entries/new-1`, {
    method: "PATCH",
    headers: H,
    body: { fields: { userId: { stringValue: me.uid }, calendarId: { stringValue: "cal-train" }, date: { stringValue: "2026-02-12" }, compact: { stringValue: "[2026-02-12]\n## Uusi treeni\nDuration 30min" } } },
  });
  ok("the app can add a workout", add.status === 200, add.bodyText.slice(0, 120));
  ok("…and it is in the diary", sim.docData("entries/new-1").compact.includes("Uusi treeni"));

  const other = sim.signUp("other@example.com", "password1", "Other");
  const stolen = sim.fetchNow(`${BASE}/entries/new-1`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${other.idToken}` },
    body: { fields: { userId: { stringValue: other.uid }, compact: { stringValue: "mine now" } } },
  });
  ok("…and another account cannot take it", stolen.status === 403, `${stolen.status}`);
  ok("…and the entry is unchanged", sim.docData("entries/new-1").userId === me.uid);
}

process.stdout.write(`\n  ${passed} passed`);
if (failures.length) {
  process.stdout.write(`, ${failures.length} FAILED\n\n`);
  for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
  process.stdout.write("\n");
  process.exit(1);
}
process.stdout.write(", 0 failed\n\n  ALL PASS\n\n");
