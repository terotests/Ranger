#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The COMPACT layer, with no app and no browser around it.
//
//   node gallery/realtrainer/web/compact-check.mjs
//
// Text in, rows out, and the spec line each row draws. The parser is the same
// Ranger source `realtrainer-compact` publishes (vendored under `../parser`),
// so what is checked here is the mapping and the formatter this demo adds on
// top of it — not the parse.
//
// The spec line is checked as PARTS and not only as a string. `3x5` and
// `x90kg` are two runs with different tones, and a renderer that concatenated
// them would still pass a text assertion while losing the one distinction the
// theme draws. The TypeScript library's `formatExerciseSchemeParts` splits
// them the same way, which is what makes the two comparable at all.
//
// Exit code 0 when every check passes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, "..", "bin", "CompactRows.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled rows missing — run `npm run rt:compact:build` first");
  process.exit(3);
}
const require = createRequire(import.meta.url);
const { CompactRowMapper, CompactStatBuilder } = require(BIN);

const text = fs.readFileSync(
  path.join(HERE, "..", "fixtures", "session.compact"),
  "utf8"
);

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

const title = CompactRowMapper.firstWorkoutTitle(text);
const rows = CompactRowMapper.firstWorkoutRows(text);

// What the demo would draw, one line per row. Printed whether or not the
// checks pass: a failing spec line is far easier to read next to the others.
console.log("");
console.log(`  ${title}`);
for (const row of rows) {
  const label = CompactStatBuilder.label(row);
  const spec = CompactStatBuilder.text(row);
  console.log(`    ${row.__rg_kind.replace("CompactRow_", "").padEnd(9)} ${label.padEnd(22)} ${spec}`);
}
console.log("");

ok("the workout's title is read", title === "Kontrastivoima", title);
ok("every row is a shape case", rows.every((r) => typeof r.__rg_kind === "string"));

const kinds = rows.map((r) => r.__rg_kind.replace("CompactRow_", ""));
ok("the rows arrive in the order they were written",
   kinds.join(",") ===
     "Summary,Phase,Section,Duration,Exercise,Exercise,Exercise,Exercise,Exercise,Section,Move,Custom,Text,Text,Text,Text",
   kinds.join(","));

// Rows are found by what they ARE and not by where they sit: the fixture is a
// document that grows, and an index would make every added line a test edit.
const kindOf = (r) => r.__rg_kind.replace("CompactRow_", "");
const byName = (name) =>
  rows.find((r) => CompactStatBuilder.label(r) === name);
const spec = (r) => (r ? CompactStatBuilder.text(r) : "<missing>");
const parts = (r) => (r ? CompactStatBuilder.parts(r) : []);

// The load's `x` belongs to the weight, so a row with reps prints `3x5x90kg`
// and one without would print `90kg`. This is the case the TypeScript
// library's own parity test asserts, spelled the same way.
const squat = byName("Takakyykky");
ok("sets, reps and load run together", spec(squat) === "3x5x90kg", spec(squat));
ok("a row with no load stops at the reps",
   spec(byName("Vauhditon pituus")) === "3x4", spec(byName("Vauhditon pituus")));
ok("the second load is its own row's",
   spec(byName("Penkkipunnerrus")) === "3x5x80kg", spec(byName("Penkkipunnerrus")));

const p1 = parts(squat);
ok("a loaded row is two parts", p1.length === 2, JSON.stringify(p1));
ok("the spec part is toned as spec",
   p1[0]?.text === "3x5" && p1[0]?.tone === "default" && p1[0]?.kind === "spec",
   JSON.stringify(p1[0]));
ok("the load part carries the weight tone",
   p1[1]?.text === "x90kg" && p1[1]?.tone === "weight" && p1[1]?.kind === "weight",
   JSON.stringify(p1[1]));

const p2 = parts(byName("Vauhditon pituus"));
ok("an unloaded row is one part", p2.length === 1, JSON.stringify(p2));

ok("the exercise keeps its name", squat !== undefined, "not found");
ok("a section heading is a row too",
   rows.some((r) => kindOf(r) === "Section" && CompactStatBuilder.label(r) === "Pääosa"));
const free = rows.filter((r) => kindOf(r) === "Text").map((r) => spec(r));
ok("free text survives the round trip",
   free.includes("Hyvä fiilis, selkä kesti"), free.join("|"));

// Tags and emojis are on the workout, not in the list. A port that left them
// in would draw two things the reference never shows.
ok("tags and emojis are not rows",
   !rows.some((r) => ["Tags", "Emojis"].includes(kindOf(r))),
   kinds.join(","));
// The light families the document carries, each drawn by its own arm.
ok("a summary is its own family",
   spec(rows.find((r) => kindOf(r) === "Summary")) === "Kova mutta hallittu treeni");
ok("a phase carries its number",
   spec(rows.find((r) => kindOf(r) === "Phase")) === "Phase1Peruskausi");
ok("a duration carries its description",
   spec(rows.find((r) => kindOf(r) === "Duration")) === "10minAlkulämmittely");
ok("a custom row is name and value",
   spec(rows.find((r) => kindOf(r) === "Custom")) === "mieliala: ~4");
ok("a run derives its pace",
   spec(rows.find((r) => kindOf(r) === "Move")) === "18min 3km @0:36/100m");
// A life family has no row type of its own: the reference turns it into a line
// of text with a fixed shape, and so does this.
// The label and its value are separate parts, so the flat text has no space
// between them — the space is the label's own margin, the way the reference
// gives it one. Assert on the parts.
const textParts = rows.filter((r) => kindOf(r) === "Text").map((r) => parts(r));
const sleep = textParts.find((ps) => ps[0]?.text === "Sleep");
ok("a life family becomes a line of text",
   sleep?.[0]?.tone === "label" && sleep?.[1]?.text === "7h",
   JSON.stringify(sleep));
ok("a family with no label is one plain run",
   textParts.some((ps) => ps.length === 1 && ps[0].text === "Location Kotisali"),
   JSON.stringify(textParts));
// `Weight 78.5kg aamulla` is a life line: the label and the number are their
// own parts, so a reader is not made to find the number inside a sentence.
const life = rows
  .filter((r) => kindOf(r) === "Text")
  .map((r) => parts(r))
  .find((ps) => ps[0]?.text === "Weight");
ok("a life line is split into label, number and words",
   life?.[0]?.text === "Weight" && life?.[0]?.tone === "label" &&
     life?.[1]?.text === "78.5kg" && life?.[1]?.tone === "number",
   JSON.stringify(life));

// A measured row reports what happened, so it prints the times and not the
// plan that produced them — and a set that measured zero is a set that was not
// done, so it is dropped rather than printed as `0s`. Both strings are what
// the TypeScript library's own parity test asserts.
const isometric = byName("Isometrinen kyykkypito seinää vasten");
ok("a measured row prints its times", spec(isometric) === "45s, 45s", spec(isometric));
ok("a zero set is dropped, not printed", !spec(isometric).includes("0s"), spec(isometric));
ok("the second measured row is its own", spec(byName("Lankku")) === "25s, 24s", spec(byName("Lankku")));
ok("a measured row is one part", parts(isometric).length === 1, JSON.stringify(parts(isometric)));
ok("and it is toned as spec",
   parts(isometric)[0]?.tone === "default" && parts(isometric)[0]?.kind === "spec",
   JSON.stringify(parts(isometric)[0]));

console.log("");
if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
