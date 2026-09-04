#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Record the reference trace from the app as it really runs.
//
//   node gallery/realtrainer/scripts/record-reference-trace.mjs \
//        [--url http://localhost:5175] [--out traces/reference] \
//        [--viewport 390x844] [--only calendar-week]
//
// THIS DOES NOT RUN IN THIS REPOSITORY'S CI, and cannot: it needs the
// RealTrainer frontend and the Firebase emulators, neither of which is here.
// Run it on a machine that has the monorepo checked out beside this one:
//
//   cd realtrainer/e2e && npm run emulators                          # :9099 + :8080
//   cd realtrainer/frontend && npm run build:ranger-lib \
//       && npm run dev -- --mode test --port 5175 --strictPort       # the app
//   node gallery/realtrainer/scripts/record-reference-trace.mjs     # then this
//
// It does what the monorepo's own e2e specs do before a test, in plain fetch
// so nothing of theirs has to be compiled: wipe the auth and Firestore
// emulators, create the test user, seed a plan calendar and its entries over
// the Firestore REST API, sign in through the `window.__testSignIn` hook the
// test build exposes, and open the route the scenario names with the week
// pinned — the app's "today" is the real clock, and a trace that moved with
// the calendar would be a trace of the date.
//
// Then it drives the same scenarios `web/trace-check.mjs` replays on the
// Ranger side and writes the same shape: after every step, the accessibility
// tree as role, name and state. The React app is the oracle and the port is
// what is measured.
//
// Steps are clicked BY ROLE AND NAME. The views in scope carry zero
// `data-testid` attributes — DashboardPage, YearSheetPageV2, NewCalendarPage,
// CalendarWizard, PeriodDetailPage — so adding ids would be a change to the
// private repository for every node measured. Roles and names are already
// there, and they are what the EVG side publishes anyway. A scenario's `setup`
// is the RANGER side's way to the same screen (its loader, its sign-in
// button); here the way there is the route.

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
const [VW, VH] = arg("--viewport", "390x844").split("x").map(Number);
const ONLY = arg("--only", "");
// `--probe` prints, after every step, the headings and dialogs the DOM holds —
// for the moment a step did something the accessibility tree does not show.
const PROBE = args.includes("--probe");
// `--shots <dir>` saves a screenshot after every step, named after it.
const SHOTS = arg("--shots", "");

// --- the emulators, as the e2e helpers talk to them --------------------------
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = "http://127.0.0.1:8080";
const PROJECT = "realtrainer-4354b";
const DATABASE = "europewest1";
const USER = { email: "test@example.com", password: "testpassword123", displayName: "Test User" };

async function reachable(url) {
  try {
    const r = await fetch(url);
    return r.ok || r.status < 500;
  } catch {
    return false;
  }
}

async function resetEmulators() {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/${DATABASE}/documents`, { method: "DELETE" });
}

async function createUser() {
  const signUp = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...USER, returnSecureToken: true }),
  });
  if (!signUp.ok) throw new Error(`could not create the test user: ${await signUp.text()}`);
  return (await signUp.json()).localId;
}

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

async function writeDocument(collection, id, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
  const r = await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/${DATABASE}/documents/${collection}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`could not write ${collection}/${id}: ${await r.text()}`);
}

/**
 * The plan calendar the scenarios open, and the week's entries. The entries
 * live in `fixtures/reference/entries.json` so the Ranger side can draw the
 * same week from the same COMPACT.
 */
async function seed(uid) {
  const now = new Date().toISOString();
  const seedFile = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures", "reference", "seed.json"), "utf8"));
  await writeDocument("users", uid, {
    uid,
    email: USER.email,
    displayName: USER.displayName,
    plan: "pro",
    tokensUsed: 0,
    tokensLimit: 100000,
    createdAt: now,
    updatedAt: now,
  });
  for (const cal of seedFile.calendars) {
    await writeDocument("calendars", cal.id, {
      ...cal,
      userId: uid,
      ownerId: uid,
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });
  }
  for (const entry of seedFile.entries) {
    await writeDocument("entries", entry.id, { ...entry, userId: uid, createdAt: now, updatedAt: now });
  }
  // The year plan the example week and the plan buttons hang off — without
  // one the calendar shows "Sinulla ei ole vielä vuosisuunnitelmaa" instead.
  for (const ys of seedFile.yearsheets ?? []) {
    await writeDocument("yearsheets", ys.id, { ...ys, userId: uid, createdAt: now, updatedAt: now });
  }
  return seedFile;
}

// --- the browser -------------------------------------------------------------
let playwright;
try {
  playwright = requireHostTool("playwright-core");
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}

if (!(await reachable(URL)) || !(await reachable(`${AUTH}/`)) || !(await reachable(`${FIRESTORE}/`))) {
  console.error(
    `The app and the emulators have to be running:\n` +
      `  app        ${URL}\n  auth       ${AUTH}\n  firestore  ${FIRESTORE}\n\n` +
      `From the monorepo:\n  cd e2e && npm run emulators\n` +
      `  cd frontend && npm run build:ranger-lib && npm run dev -- --mode test --port 5175 --strictPort\n` +
      `then re-run this, with --url if the app is not on 5175.`,
  );
  process.exit(2);
}

const browser = await playwright.chromium.launch();
const context = await browser.newContext({ viewport: { width: VW, height: VH }, locale: "fi-FI" });
const page = await context.newPage();

async function signIn() {
  await page.goto(`${URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof globalThis.__testSignIn === "function", null, { timeout: 15000 });
  await page.evaluate(
    async ({ email, password }) => globalThis.__testSignIn(email, password),
    { email: USER.email, password: USER.password },
  );
  await page.waitForSelector('[data-id="nav-home"], [data-id="nav-calendar"], [data-id="onboarding-modal"], nav', {
    timeout: 15000,
  });
}

async function dismissOnboarding() {
  const modal = page.locator('[data-id="onboarding-modal"]');
  if (!(await modal.isVisible({ timeout: 3000 }).catch(() => false))) return;
  for (const id of ["onboarding-skip", "onboarding-skip-top"]) {
    const btn = page.locator(`[data-id="${id}"]`);
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click();
      break;
    }
  }
  await modal.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
}

/**
 * Role, name and state per node, off the real accessibility tree — the same
 * three fields the Ranger side answers with. Playwright's `ariaSnapshot` is
 * YAML, one node per line: `- button "Lisää harjoitus" [active]:` — the role
 * first, the name quoted, the states in brackets.
 */
async function snapshot() {
  const yaml = await page.locator("body").ariaSnapshot();
  const out = [];
  for (const raw of yaml.split("\n")) {
    const line = raw.trim().replace(/^- /, "").replace(/:$/, "").replace(/^'(.*)'$/, "$1");
    if (!line) continue;
    const m = /^([a-z]+)(?:\s+"((?:[^"\\]|\\.)*)")?(.*)$/.exec(line);
    if (!m) continue;
    const [, role, rawName = "", rest] = m;
    const name = rawName.replace(/\\"/g, '"');
    const states = [...rest.matchAll(/\[([a-z]+)(?:=([^\]]+))?\]/g)].map(([, k, v]) => (v ? `${k}=${v}` : k));
    // What the plain text of a leaf says, when it has no name of its own:
    // `- generic: wk 36` → the text is the name a reader hears.
    const text = /^:\s*(.+)$/.exec(rest.replace(/\s*\[[^\]]*\]/g, ""))?.[1] ?? "";
    out.push({ role, name: name || text, state: states.join(" ") });
  }
  return out;
}

async function targetOf(step) {
  if (step.name === undefined) {
    const all = page.getByRole(step.role);
    return (await all.count()) ? (step.nth !== undefined ? all.nth(step.nth) : all.last()) : null;
  }
  if (step.name !== "") {
    const all = page.getByRole(step.role, { name: step.name, exact: true });
    return (await all.count()) ? (step.nth !== undefined ? all.nth(step.nth) : all.last()) : null;
  }
  const all = page.getByRole(step.role);
  const n = await all.count();
  const unnamed = [];
  for (let i = 0; i < n; i++) {
    const el = all.nth(i);
    const label = await el.getAttribute("aria-label");
    const title = await el.getAttribute("title");
    const text = (await el.innerText().catch(() => "")).trim();
    if (!label && !title && !text) unnamed.push(el);
  }
  if (!unnamed.length) return null;
  return step.nth !== undefined ? unnamed[step.nth] : unnamed[unnamed.length - 1];
}

async function apply(step) {
  if (step.tick !== undefined) {
    await page.waitForTimeout(step.tick);
    return true;
  }
  // The Ranger side arms a failure with this; here there is no AI behind the
  // app and every request fails on its own.
  if (step.fail !== undefined) return true;
  // The pointer is what the recorder's browser has; the step is this side's.
  if (step.pointer !== undefined) return true;
  // The LAST match unless the step says which: a dialog's button comes after
  // the page's button of the same name in the DOM, and it is the one on top.
  // `nth` picks another — the first unnamed button is a dialog's close.
  //
  // An EMPTY name is a real filter here. To Playwright `name: ""` is no
  // filter at all, and the last button on the page is the bar's "Lisää" —
  // which is how three scenarios opened the More sheet by accident.
  const target = await targetOf(step);
  if (!target) return false;
  try {
    if (step.type !== undefined) {
      await target.fill(step.type, { timeout: 5000 });
    } else if (step.key !== undefined) {
      await target.press(step.key, { timeout: 5000 });
    } else {
      await target.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      await target.click({ timeout: 5000 });
    }
  } catch (e) {
    console.log(`    ${step.name ?? step.role}: ${String(e.message).split("\n")[0]}`);
    return false;
  }
  await page.waitForTimeout(150);
  return true;
}

const dir = path.join(ROOT, "fixtures", "scenarios");
fs.mkdirSync(OUT, { recursive: true });

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  if (ONLY && !name.startsWith(ONLY)) continue;
  const scenario = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
  // A scenario the reference cannot play — a reply the AI would have to
  // write — is the port's alone, and has no reference trace.
  if (scenario.noReference) continue;
  const ref = scenario.reference ?? {};
  await resetEmulators();
  const uid = await createUser();
  const seeded = await seed(uid);
  await signIn();
  await page.goto(`${URL}${ref.route ?? `/calendar/${seeded.calendars[0].id}?week=${seeded.week}`}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissOnboarding();
  // The dashboard keeps an ExampleWeekPanel mounted in a zero-height host on
  // every tab so an action can open its dialog without a tab switch. It is
  // not on the screen, and the trace is of the screen.
  // Its dialogs are `fixed` and escape the clipping, so they stay.
  // Playwright prunes a subtree at the first hidden element, dialogs
  // included, so the host is given a box and only the panel's own sections
  // — everything under it that is not a fixed overlay — are taken out.
  await page.addStyleTag({
    content:
      ".max-h-0.overflow-hidden { max-height: none !important; overflow: visible !important; }" +
      ".max-h-0.overflow-hidden > * > *:not(.fixed) { display: none !important; }",
  });
  await page.waitForTimeout(600);
  const frames = [];
  for (const step of scenario.steps) {
    const handled = await apply(step);
    if (PROBE) {
      const seen = await page.evaluate(() =>
        [...document.querySelectorAll("h1,h2,h3,[role=dialog],.fixed")].map(
          (e) => `${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ").slice(0, 3).join(".") : ""}: ${(e.textContent || "").trim().slice(0, 60)}`,
        ),
      );
      console.log(`    after ${step.id ?? step.name ?? `tick ${step.tick}`}:\n      ${seen.join("\n      ")}`);
    }
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `${name.replace(/\.json$/, "")}-${frames.length + 1}.png`) });
    }
    frames.push({
      step: step.id ?? `tick ${step.tick}`,
      handled,
      // The machine's state, where a build exposes it; "" where it does not.
      // The Ranger side writes the same field from its own runner.
      state: await page.evaluate(() => globalThis.__machineState ?? ""),
      nodes: await snapshot(),
    });
  }
  const trace = { id: scenario.id, machine: scenario.machine, viewport: `${VW}x${VH}`, frames };
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(trace, null, 1) + "\n");
  console.log(
    `  recorded ${name} — ${frames.length} frames, ` +
      `${frames.filter((f) => !f.handled).length} step(s) found nothing to click`,
  );
}

await browser.close();
console.log(`\nreference traces in ${path.relative(process.cwd(), OUT)}`);
console.log(
  "Diff them against the Ranger side with `npm run rt:trace:diff` — a step that\n" +
    "found nothing to click is a name the port and the app do not agree on, which\n" +
    "is the first thing a parity trace is for.",
);
