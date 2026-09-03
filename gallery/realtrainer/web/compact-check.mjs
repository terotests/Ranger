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
   kinds.join(",") === "Section,Exercise,Exercise,Exercise,Exercise,Exercise,Section,Text",
   kinds.join(","));

const spec = (i) => CompactStatBuilder.text(rows[i]);
const parts = (i) => CompactStatBuilder.parts(rows[i]);

// The load's `x` belongs to the weight, so a row with reps prints `3x5x90kg`
// and one without would print `90kg`. This is the case the TypeScript
// library's own parity test asserts, spelled the same way.
ok("sets, reps and load run together", spec(1) === "3x5x90kg", spec(1));
ok("a row with no load stops at the reps", spec(2) === "3x4", spec(2));
ok("the second load is its own row's", spec(3) === "3x5x80kg", spec(3));

const p1 = parts(1);
ok("a loaded row is two parts", p1.length === 2, JSON.stringify(p1));
ok("the spec part is toned as spec",
   p1[0]?.text === "3x5" && p1[0]?.tone === "default" && p1[0]?.kind === "spec",
   JSON.stringify(p1[0]));
ok("the load part carries the weight tone",
   p1[1]?.text === "x90kg" && p1[1]?.tone === "weight" && p1[1]?.kind === "weight",
   JSON.stringify(p1[1]));

const p2 = parts(2);
ok("an unloaded row is one part", p2.length === 1, JSON.stringify(p2));

ok("the exercise keeps its name",
   CompactStatBuilder.label(rows[1]) === "Takakyykky",
   CompactStatBuilder.label(rows[1]));
ok("a section heading is a row too",
   CompactStatBuilder.label(rows[0]) === "Pääosa",
   CompactStatBuilder.label(rows[0]));
ok("free text survives the round trip",
   spec(7) === "Hyvä fiilis, selkä kesti",
   spec(7));

// A measured row reports what happened, so it prints the times and not the
// plan that produced them — and a set that measured zero is a set that was not
// done, so it is dropped rather than printed as `0s`. Both strings are what
// the TypeScript library's own parity test asserts.
ok("a measured row prints its times", spec(4) === "45s, 45s", spec(4));
ok("a zero set is dropped, not printed", !spec(4).includes("0s"), spec(4));
ok("the second measured row is its own", spec(5) === "25s, 24s", spec(5));
ok("a measured row is one part", parts(4).length === 1, JSON.stringify(parts(4)));
ok("and it is toned as spec",
   parts(4)[0]?.tone === "default" && parts(4)[0]?.kind === "spec",
   JSON.stringify(parts(4)[0]));

console.log("");
if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
