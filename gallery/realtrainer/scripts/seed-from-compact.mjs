#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A diary's entries into the reference seed.
//
//   node gallery/realtrainer/scripts/seed-from-compact.mjs <file.compact> [--calendar cal-train]
//
// The seed is what the recorder puts into the emulator and what the Ranger
// side draws, so a calendar with a real diary in it — realtrainer-compact's
// sample.compact, ninety-nine workouts over four months — is the same on both
// sides. Each `[date] ## title` block becomes one entry of the calendar; the
// timestamp's time and zone are dropped, the date is the entry's day. The
// other calendars and the yearsheets in the seed are kept as they are.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.join(HERE, "..", "fixtures", "reference", "seed.json");
const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("usage: seed-from-compact.mjs <file.compact> [--calendar id]");
  process.exit(2);
}
const calFlag = argv.indexOf("--calendar");
const calendarId = calFlag >= 0 ? argv[calFlag + 1] : "cal-train";

const text = fs.readFileSync(file, "utf8");
const entries = [];
let cur = null;
for (const raw of text.split(/\r?\n/)) {
  const m = raw.match(/^\[(\d{4}-\d{2}-\d{2})[^\]]*\]\s*(.*)$/);
  if (m) {
    if (cur) entries.push(cur);
    cur = { date: m[1], lines: [m[2].trim()] };
    continue;
  }
  if (!cur) continue;
  if (raw.startsWith("#") && !raw.startsWith("##")) continue;
  cur.lines.push(raw);
}
if (cur) entries.push(cur);

const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
seed.entries = seed.entries.filter((e) => e.calendarId !== calendarId);
const seq = new Map();
for (const e of entries.sort((a, b) => a.date.localeCompare(b.date))) {
  const n = (seq.get(e.date) ?? 0) + 1;
  seq.set(e.date, n);
  const body = e.lines.join("\n").replace(/\n+$/, "");
  seed.entries.push({
    id: `${calendarId}-${e.date}-${n}`,
    calendarId,
    date: e.date,
    compact: `[${e.date}]\n${body}`,
  });
}
fs.writeFileSync(SEED, JSON.stringify(seed, null, 2) + "\n");
console.log(`${entries.length} entries of ${path.basename(file)} into ${calendarId} — ${seed.entries.length} entries in the seed`);
