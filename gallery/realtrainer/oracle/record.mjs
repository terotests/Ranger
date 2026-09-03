#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Record what the TypeScript library draws for every case in the corpus.
//
//   node gallery/realtrainer/oracle/record.mjs [--source <ui/react/src>]
//
// `realtrainer-compact/ui/react` is this port's reference: the same COMPACT,
// through its mapping and its formatters, gives the parts a screen shows. This
// writes them to `expected.json`, which is COMMITTED — the L0 gate compares
// against the recording, so it runs in CI where the library is not checked out
// and cannot quietly start passing because the oracle went missing.
//
// What comes from the library and what does not:
//
//   parsedRowMapping.ts   the parsed row → CompactRow mapping        (imported)
//   formatters.ts         the exercise scheme's parts                (imported)
//   rows/utils/*.ts       move duration, pace, split pace, split time (imported)
//   the ARRANGEMENT       which run goes where, and its tone         (transcribed)
//
// The last line is the honest part. Move, pyramid and split build their parts
// inside JSX, so there is no function to call: the shapes below are read off
// `MoveRow.tsx`, `PyramidRow.tsx` and `SplitRow.tsx` and written out as data.
// Change one of those components and this file has to be re-read, not just
// re-run — which is why each transcription names its source.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { assertDomInstalled, MissingDomDeps, requireHostTool } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const args = process.argv.slice(2);
const sourceArg = args.indexOf("--source");
const LIB = path.resolve(
  sourceArg === -1
    ? path.join(REPO, "..", "realtrainer-compact", "ui", "react", "src")
    : args[sourceArg + 1],
);

if (!fs.existsSync(path.join(LIB, "lib", "formatters.ts"))) {
  console.error(
    `No reference library at ${LIB}\n` +
      `Pass --source <realtrainer-compact/ui/react/src>, or check the repository\n` +
      `out next to this one. oracle/expected.json is committed, so the L0 gate\n` +
      `runs without it; only re-recording needs it.`,
  );
  process.exit(2);
}

let esbuild;
try {
  esbuild = requireHostTool("esbuild");
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}

// A generated entry rather than a file in the tree: the paths only resolve
// where the library is checked out, and a broken import in the repository
// would be a file that is wrong everywhere else.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rt-oracle-"));
const entry = path.join(tmp, "entry.ts");
const rows = path.join(LIB, "components", "molecules", "rows", "utils");
fs.writeFileSync(
  entry,
  [
    `export { compactRowFromParsedContent } from ${JSON.stringify(path.join(LIB, "lib", "parsedRowMapping"))};`,
    `export { formatExerciseSchemeParts } from ${JSON.stringify(path.join(LIB, "lib", "formatters"))};`,
    `export { formatMoveDuration } from ${JSON.stringify(path.join(rows, "formatMoveDuration"))};`,
    `export { deriveMovePace } from ${JSON.stringify(path.join(rows, "deriveMovePace"))};`,
    `export { formatSplitPace } from ${JSON.stringify(path.join(rows, "formatSplitPace"))};`,
    `export { formatSplitDuration } from ${JSON.stringify(path.join(rows, "formatSplitDuration"))};`,
  ].join("\n"),
);

const bundle = path.join(tmp, "oracle.cjs");
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: bundle,
  logLevel: "warning",
});

const require_ = createRequire(import.meta.url);
const lib = require_(bundle);
const { CompactV1Parser } = require_(path.join(HERE, "..", "bin", "CompactRows.cjs"));

const corpus = JSON.parse(
  fs.readFileSync(path.join(HERE, "..", "fixtures", "cases.json"), "utf8"),
);

/** MoveRow.tsx: reps, duration, distance, pace — the space lives in the part. */
function moveParts(move) {
  const reps =
    move.sets && move.count && !(move.sets === 1 && move.count === 1)
      ? `${move.sets}x${move.count}`
      : null;
  const texts = [
    reps,
    lib.formatMoveDuration(move.duration),
    move.distance?.value ? `${move.distance.value}${move.distance.unit ?? ""}` : null,
    lib.deriveMovePace(move.duration, move.distance),
  ].filter(Boolean);
  const parts = texts.map((t, i) => ({
    text: (i > 0 ? " " : "") + t,
    tone: t.startsWith("@") ? "weight" : "default",
    kind: "spec",
  }));
  if (typeof move.steps === "number") {
    parts.push({ text: ` ${move.steps} steps`, tone: "default", kind: "meta" });
  }
  return parts;
}

/** PyramidRow.tsx: two runs per set, and a set of no reps is not drawn. */
function pyramidParts(pyramid) {
  const parts = [];
  for (const set of pyramid.sets.filter((s) => s.reps > 0)) {
    parts.push({ text: `${set.reps}x`, tone: "default", kind: "spec" });
    if (typeof set.weightKg === "number" && set.weightKg > 0) {
      parts.push({ text: `${set.weightKg}kg`, tone: "weight", kind: "weight" });
    }
  }
  return parts;
}

/** SplitRow.tsx: distance, pace, duration, heart rate, note. No separators. */
function splitParts(split) {
  const parts = [];
  if (split.distance?.value) {
    parts.push({
      text: `${split.distance.value}${split.distance.unit ?? ""}`,
      tone: "default",
      kind: "spec",
    });
  }
  const pace = lib.formatSplitPace(split.pace);
  if (pace) parts.push({ text: pace, tone: "default", kind: "pace" });
  const duration = lib.formatSplitDuration(split.duration);
  if (duration) parts.push({ text: duration, tone: "default", kind: "duration" });
  if (typeof split.hr === "number") {
    parts.push({ text: `${split.hr}bpm`, tone: "weight", kind: "meta" });
  }
  if (split.note) parts.push({ text: split.note, tone: "muted", kind: "meta" });
  return parts;
}

function partsFor(content) {
  const row = lib.compactRowFromParsedContent(content);
  if (row.type === "exercise") return lib.formatExerciseSchemeParts(row);
  if (row.type === "move" || row.type === "run") return moveParts(row);
  if (row.type === "pyramid") return pyramidParts(row);
  if (row.type === "split") return splitParts(row);
  return null;
}

const out = { _: "Generated by oracle/record.mjs — do not edit.", cases: {} };
let skipped = 0;

for (const c of corpus.cases) {
  if (c.oracle !== "ts") {
    out.cases[c.id] = { parts: c.expect ?? [], oracle: "spec" };
    skipped += 1;
    continue;
  }
  const doc = JSON.parse(
    CompactV1Parser.parseText(`[2026-01-01] ## Case\n${c.row}\n`).toJSONString(),
  );
  const content = doc.workouts?.[0]?.content ?? [];
  const rows = [];
  for (const item of content) {
    const parts = partsFor(item);
    if (parts) rows.push({ type: item.type, parts });
    // A move's splits are rows of their own on the Ranger side, so they are
    // rows of their own here too.
    for (const split of item.splits ?? []) {
      rows.push({ type: "split", parts: splitParts(lib.compactRowFromParsedContent(split)) });
    }
  }
  out.cases[c.id] = { rows, oracle: "ts" };
}

fs.writeFileSync(
  path.join(HERE, "expected.json"),
  JSON.stringify(out, null, 1) + "\n",
);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(
  `recorded ${corpus.cases.length - skipped} case(s) from the library, ${skipped} specified here`,
);
