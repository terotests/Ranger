#!/usr/bin/env node
// A RealTrainer diary backup (the app's "export", version 2.0) into the seed
// the port and the reference share — every workout as COMPACT text, with its
// score and the coach's feedback, under the calendar it came from.
//
//   node gallery/realtrainer/scripts/seed-from-backup.mjs \
//        --backup ~/realtrainerbackup.json \
//        --compact-repo ../realtrainer-compact   # the serializer lives there
//        [--seed gallery/realtrainer/fixtures/reference/seed.json]
//
// What is left out, on purpose: the account (userId, ownerId, ownerEmail,
// createdBy), the image links (signed storage URLs), the coach chats and the
// year sheets. The export lists the workouts calendar by calendar, each
// calendar's newest first, and carries no calendarId on them — so a calendar
// boundary is where the dates start over. With more boundaries than
// calendars the trailing runs fall to the last calendar.
//
// The COMPACT text comes from the compact package's own serializer, bundled
// from its source on the fly (that repository is GPL, this one is not, so
// nothing of it is copied here — only the diary it produces).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const backupPath = arg("--backup", "");
const compactRepo = path.resolve(arg("--compact-repo", path.join(ROOT, "..", "..", "..", "realtrainer-compact")));
const seedPath = path.resolve(arg("--seed", path.join(ROOT, "fixtures", "reference", "seed.json")));
if (!backupPath) {
  console.error("usage: seed-from-backup.mjs --backup <export.json> [--compact-repo <dir>] [--seed <seed.json>]");
  process.exit(2);
}

// --- the serializer, bundled from the compact repository ---------------------
const esbuild = path.join(compactRepo, "node_modules", ".bin", "esbuild");
if (!fs.existsSync(esbuild)) {
  console.error(`no esbuild under ${compactRepo} — run npm install there first`);
  process.exit(3);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rt-serializer-"));
const entry = path.join(tmp, "entry.ts");
fs.writeFileSync(entry, `export { serializeWorkout } from ${JSON.stringify(path.join(compactRepo, "src", "renderers", "compact.ts"))};\n`);
const bundle = path.join(tmp, "serializer.mjs");
execFileSync(esbuild, [entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${bundle}`, "--log-level=error"]);
const { serializeWorkout } = await import(pathToFileURL(bundle).href);

// --- the backup ----------------------------------------------------------------
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const iso = (d) => `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
const workouts = backup.workouts.filter((w) => w.date && w.date.year);
const runs = [];
let start = 0;
for (let i = 1; i < workouts.length; i++) {
  if (iso(workouts[i].date) > iso(workouts[i - 1].date)) { runs.push([start, i - 1]); start = i; }
}
runs.push([start, workouts.length - 1]);
const calendars = backup.calendars;
const slug = (c, i) => {
  if (!/^cal_\d+_/.test(c.id)) return c.id;
  return c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `calendar-${i}`;
};
const calOut = calendars.map((c, i) => ({ id: slug(c, i), name: c.name, type: c.type, color: c.color || "#22c55e", source: "diary" }));
const assign = new Array(workouts.length).fill(calOut.length - 1);
runs.forEach(([a, b], ri) => {
  const ci = Math.min(ri, calOut.length - 1);
  for (let k = a; k <= b; k++) assign[k] = ci;
});

const entries = [];
workouts.forEach((w, i) => {
  const compact = serializeWorkout(w);
  const e = { id: `diary-${i + 1}`, calendarId: calOut[assign[i]].id, date: iso(w.date), compact, source: "diary" };
  if (typeof w.points === "number") e.points = w.points;
  if (typeof w.feedback === "string" && w.feedback.trim()) e.feedback = w.feedback.trim();
  entries.push(e);
});

// --- into the seed, replacing what an earlier run put there -------------------
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
seed.calendars = seed.calendars.filter((c) => c.source !== "diary").concat(calOut);
seed.entries = seed.entries.filter((e) => e.source !== "diary").concat(entries);
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
fs.rmSync(tmp, { recursive: true, force: true });
const perCal = {};
for (const e of entries) perCal[e.calendarId] = (perCal[e.calendarId] || 0) + 1;
console.log(`${entries.length} entries into ${calOut.length} calendars:`, perCal);
console.log(`seed written to ${path.relative(process.cwd(), seedPath)}`);
