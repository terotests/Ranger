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

const LIFE_LABELS = new Set([
  "Drinking", "Food", "Expense", "Reminder", "Feeling", "Pain", "Sleep",
  "Health", "Vitals", "Weight", "BodyFat", "Waist", "Hip", "Measurement",
]);

/**
 * Text.tsx: a life row's label is set apart and the numbers in its body are
 * picked out. The split is the component's own regex; the empty strings a
 * capturing split produces are dropped, because a span with no text draws
 * nothing on either side.
 */
function textParts(text) {
  const match = text.text.match(/^([A-Za-z]+)\s+(.*)$/);
  if (!match || !LIFE_LABELS.has(match[1])) {
    return [{ text: text.text, tone: "muted", kind: "meta" }];
  }
  const parts = [{ text: match[1], tone: "label", kind: "meta" }];
  for (const piece of match[2].split(/(\d+(?:[.,]\d+)?(?:[a-zA-Z%°]+)?)/g)) {
    if (piece === "") continue;
    parts.push({
      text: piece,
      tone: /^\d/.test(piece) ? "number" : "default",
      kind: "meta",
    });
  }
  return parts;
}

/** Summary.tsx, Section.tsx, Phase.tsx, Custom.tsx, Unknown.tsx. */
function summaryParts(row) {
  return [{ text: row.text, tone: "muted", kind: "meta" }];
}
function sectionParts(row) {
  return [{ text: row.name, tone: "default", kind: "heading" }];
}
function phaseParts(row) {
  const parts = [
    { text: row.number === null ? "Phase" : `Phase${row.number}`, tone: "weight", kind: "meta" },
    { text: row.name, tone: "default", kind: "spec" },
  ];
  if (row.details) parts.push({ text: row.details, tone: "muted", kind: "meta" });
  return parts;
}
function customParts(row) {
  const value = row.value === null || row.value === undefined ? "" : String(row.value);
  const range = typeof row.valueMax === "number" ? `${value}-${row.valueMax}` : value;
  return [
    { text: `${row.name}: `, tone: "muted", kind: "meta" },
    { text: `~${range}${row.unit ?? ""}`, tone: "default", kind: "spec" },
  ];
}
function unknownParts(row) {
  return [{ text: row.raw, tone: "warn", kind: "meta" }];
}

function partsFor(content) {
  const row = lib.compactRowFromParsedContent(content);
  if (row.type === "exercise") return lib.formatExerciseSchemeParts(row);
  if (row.type === "move" || row.type === "run") return moveParts(row);
  if (row.type === "pyramid") return pyramidParts(row);
  if (row.type === "split") return splitParts(row);
  if (row.type === "summary") return summaryParts(row);
  if (row.type === "section") return sectionParts(row);
  if (row.type === "phase") return phaseParts(row);
  if (row.type === "custom") return customParts(row);
  if (row.type === "text") return textParts(row);
  if (row.type === "unknown") return unknownParts(row);
  return null;
}

const out = { _: "Generated by oracle/record.mjs — do not edit.", cases: {} };
let skipped = 0;

for (const c of corpus.cases) {
  if (c.oracle !== "ts") {
    out.cases[c.id] = { rows: c.expect ?? [], oracle: "spec", deviation: c.deviation };
    skipped += 1;
    continue;
  }
  const doc = JSON.parse(
    CompactV1Parser.parseText(`[2026-01-01] ## Case\n${c.row}\n`).toJSONString(),
  );
  const content = doc.workouts?.[0]?.content ?? [];
  const rows = [];
  for (const item of content) {
    // The library lifts these onto the workout and filters them out of rows.
    if (item.type === "tags" || item.type === "emojis" || item.type === "derived") continue;
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
