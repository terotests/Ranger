#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// L0 parity: the same COMPACT through both sides, compared as DATA.
//
//   node gallery/realtrainer/web/l0-check.mjs
//
// The Ranger row layer is a port of `realtrainer-compact/ui/react`'s mapping
// and formatters. This runs every case in `fixtures/cases.json` through the
// Ranger side and diffs the parts against `oracle/expected.json`, which
// `oracle/record.mjs` recorded from that library.
//
// Parts and not strings. `3x5` and `x80kg` print as `3x5x80kg` either way, and
// a port that returned the one string would pass every text assertion while
// having lost the only distinction a theme draws. The tone and the kind are
// compared too, for the same reason.
//
// No browser and no DOM: this is the cheapest gate there is, it covers the
// units, the ranges, the bilateral forms and the recoveries, and it is meant
// to run on every commit.
//
// Exit code 0 when every case matches.

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
const require_ = createRequire(import.meta.url);
const { CompactRowMapper, CompactStatBuilder } = require_(BIN);

const corpus = JSON.parse(
  fs.readFileSync(path.join(HERE, "..", "fixtures", "cases.json"), "utf8"),
);
const expected = JSON.parse(
  fs.readFileSync(path.join(HERE, "..", "oracle", "expected.json"), "utf8"),
);

const FAMILY = {
  CompactRow_Exercise: "exercise",
  CompactRow_Move: "move",
  CompactRow_Pyramid: "pyramid",
  CompactRow_Split: "split",
  CompactRow_Section: "section",
  CompactRow_Text: "text",
  CompactRow_Summary: "summary",
  CompactRow_Phase: "phase",
  CompactRow_Custom: "custom",
  CompactRow_Duration: "duration",
  CompactRow_Unknown: "unknown",
  CompactRow_Circuit: "circuit",
  CompactRow_CircuitItem: "circuitItem",
};

let failed = 0;
let matched = 0;
const skipped = [];
const deviations = [];

const show = (parts) =>
  parts.map((p) => `${JSON.stringify(p.text)}/${p.tone}/${p.kind}`).join(" ");

for (const c of corpus.cases) {
  const want = expected.cases[c.id];
  if (!want) {
    failed += 1;
    console.log(`  FAIL ${c.id} — no recording; run npm run rt:l0:record`);
    continue;
  }
  // Two kinds of case have no recording from the library. One is a family it
  // does not render at all; the other is a place this port deliberately draws
  // something else, and says why. Both are compared against what the corpus
  // writes down, and the deviations are listed at the end — a difference that
  // is not on that list is a failure.
  if (want.oracle !== "ts" && (want.rows ?? []).length === 0) {
    skipped.push(`${c.id} (${c.family}: no renderer in the reference library)`);
    continue;
  }
  if (want.oracle !== "ts") {
    deviations.push(`${c.id} — ${want.deviation ?? "no reason recorded"}`);
  }

  const rows = CompactRowMapper.firstWorkoutRows(`[2026-01-01] ## Case\n${c.row}\n`);
  const got = rows.map((r) => ({
    type: FAMILY[r.__rg_kind] ?? r.__rg_kind,
    parts: CompactStatBuilder.parts(r).map((p) => ({
      text: p.text,
      tone: p.tone,
      kind: p.kind,
    })),
  }));

  if (got.length !== want.rows.length) {
    failed += 1;
    console.log(
      `  FAIL ${c.id} — ${want.rows.length} row(s) expected, ${got.length} produced`,
    );
    continue;
  }

  let bad = null;
  for (let i = 0; i < got.length && !bad; i += 1) {
    if (got[i].type !== want.rows[i].type) {
      bad = `row ${i}: ${want.rows[i].type} expected, ${got[i].type} produced`;
      break;
    }
    const a = want.rows[i].parts;
    const b = got[i].parts;
    if (a.length !== b.length) {
      bad = `row ${i}: ${a.length} part(s) expected, ${b.length} produced\n         want ${show(a)}\n          got ${show(b)}`;
      break;
    }
    for (let j = 0; j < a.length; j += 1) {
      if (a[j].text !== b[j].text || a[j].tone !== b[j].tone || a[j].kind !== b[j].kind) {
        bad = `row ${i} part ${j}\n         want ${show(a)}\n          got ${show(b)}`;
        break;
      }
    }
  }

  if (bad) {
    failed += 1;
    console.log(`  FAIL ${c.id} — ${bad}`);
  } else {
    matched += 1;
    console.log(`  PASS ${c.id.padEnd(32)} ${show(got.flatMap((r) => r.parts))}`);
  }
}

console.log("");
if (deviations.length > 0) {
  console.log("deliberate deviations, compared against the corpus:");
  for (const d of deviations) console.log("  · " + d);
  console.log("");
}
if (skipped.length > 0) {
  console.log("not compared:");
  for (const s of skipped) console.log("  · " + s);
  console.log("");
}
if (failed) {
  console.log(`${failed} case(s) differ from the reference`);
  process.exit(1);
}
console.log(`${matched} case(s) match the reference part for part`);
