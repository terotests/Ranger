#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The ported state machine, against the machine it was ported from.
//
//   node gallery/realtrainer/web/machine-check.mjs
//
// `fixtures/machines/*.json` is the transition table transcribed from the
// XState machine in the RealTrainer monorepo: every state crossed with every
// event, and what each cell does. This drives the Ranger port through all of
// them and compares the state AND the whole context.
//
// The point is the IGNORES. Thirteen of the twenty-one cells here are pairs
// the machine does not handle, and they are the half a hand-port gets wrong:
// `OPEN` while already open must not re-blank what someone typed, `ERROR` out
// of `saving` must keep the input rather than throw it away, and
// `START_SAVING` while saving must do nothing at all. A port tested only on
// its happy path passes while being wrong about every one of them.
//
// No browser, no emulator, no Firebase: a state machine is the one part of an
// app that can be checked with none of them.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, "..", "bin", "AddWorkoutDialog.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled machine missing — run `npm run rt:machine:build` first");
  process.exit(3);
}
const require_ = createRequire(import.meta.url);
const { AddWorkoutDialog } = require_(BIN);

const table = JSON.parse(
  fs.readFileSync(
    path.join(HERE, "..", "fixtures", "machines", "addWorkoutDialog.json"),
    "utf8",
  ),
);

let failed = 0;
const context = (d) => ({
  targetDate: d.targetDate,
  targetCalendarId: d.targetCalendarId,
  inputText: d.inputText,
  error: d.error,
});

console.log(`\n  ${table.machine} — ${table.source}\n`);

for (const cell of table.cells) {
  const d = new AddWorkoutDialog();
  d.today = table.today;
  d.reset();
  for (const [event, value] of table.seeds[cell.from]) d.send(event, value);

  if (d.state !== cell.from) {
    failed += 1;
    console.log(`  FAIL ${cell.from} + ${cell.event} — seed left it in ${d.state}`);
    continue;
  }

  const moved = d.send(cell.event, cell.value);
  const got = { moved, state: d.state, context: context(d) };
  const want = { moved: cell.moved, state: cell.to, context: cell.context };
  const same = JSON.stringify(got) === JSON.stringify(want);
  const label = `${cell.from} + ${cell.event}`.padEnd(34);
  if (same) {
    console.log(`  PASS ${label} → ${cell.to}${cell.ignored ? "  (ignored)" : ""}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}\n         want ${JSON.stringify(want)}\n          got ${JSON.stringify(got)}`);
  }
}

const ignores = table.cells.filter((c) => c.ignored).length;
console.log("");
if (failed) {
  console.log(`${failed} of ${table.cells.length} cell(s) differ from the machine`);
  process.exit(1);
}
console.log(
  `all ${table.cells.length} cells match the machine — ${ignores} of them events it ignores`,
);
