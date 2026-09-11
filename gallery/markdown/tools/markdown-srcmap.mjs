/**
 * The source map, scored against the specification's own 652 examples.
 *
 *   npm run markdown:srcmap:spec
 *   npm run markdown:srcmap:spec -- --list      every example that fails
 *   npm run markdown:srcmap:spec -- --bless     write the current score as the floor
 *
 * WHY THE CORPUS AND NOT A FIXTURE FILE. `MdNode.srcStart` / `srcEnd` are
 * stamped in three places — the block parser from the lines it read, the
 * inline parser from the characters it consumed, and the emphasis pass from
 * the delimiters that turned out to pair — and nothing inside the parser can
 * tell whether a span names the right characters. A fixture file contains the
 * cases the person who wrote the stamping thought of. The specification is a
 * document whose entire purpose is to contain one of everything, including
 * every construct that moves an offset: stripped markers, tab expansion, lazy
 * continuation, a reference definition at the head of a paragraph, emphasis
 * that pairs across a link boundary.
 *
 * WHAT IS SCORED. Three properties, counted per node — see
 * `gallery/markdown/src/MdSrcMap.rgr` for what each means and why a span of
 * -1 ("this character has no source") is a declared answer rather than a
 * violation. The score is RATCHETED against `harness/srcmap-floor.json` so it
 * cannot quietly go down.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { readExamples } from "./spec-examples.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const ROOT = path.join(MODULE, "..", "..");
const SPEC = path.join(MODULE, "harness", "spec", "commonmark-0.31.2.txt");
const CASES = path.join(MODULE, "harness", "out", "srcmap-cases");
const FLOOR = path.join(MODULE, "harness", "srcmap-floor.json");

const argv = process.argv.slice(2);
const wantList = argv.includes("--list");
const bless = argv.includes("--bless");

const examples = readExamples(SPEC);
fs.rmSync(CASES, { recursive: true, force: true });
fs.mkdirSync(CASES, { recursive: true });
const pad4 = (n) => String(n).padStart(4, "0");
for (const ex of examples) {
  fs.writeFileSync(path.join(CASES, pad4(ex.number) + ".md"), ex.markdown);
}

const js = path.join(MODULE, "bin", "MdSrcMapProbe.js");
if (!fs.existsSync(js)) {
  console.error("gallery/markdown/bin/MdSrcMapProbe.js is missing — build it first:");
  console.error("  npm run markdown:srcmap:build");
  process.exit(1);
}

// Repo-relative: Ranger's `read_file "." p` opens `./p`, so an absolute path
// arrives as `.//home/…` and reads nothing.
const rel = path.relative(ROOT, CASES).split(path.sep).join("/");
const out = execFileSync("node", [js, rel, String(examples.length)], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

const nums = {};
const bad = [];
for (const line of out.split("\n")) {
  const m = /^([a-zA-Z]+) (-?\d+)$/.exec(line.trim());
  if (m) {
    nums[m[1]] = Number(m[2]);
    continue;
  }
  const b = /^BAD (\d+) ?(.*)$/.exec(line.trim());
  if (b) bad.push({ number: Number(b[1]), why: b[2] });
}

for (const key of ["nodes", "valid", "ordered", "unmapped", "exactChecked", "exactOk", "emptyBlocks", "badExamples", "examples"]) {
  if (nums[key] === undefined) {
    console.error("the probe printed no " + key + " — its output was:");
    console.error(out.slice(0, 2000));
    process.exit(1);
  }
}

const pct = (a, b) => (b === 0 ? "100.0" : ((a / b) * 100).toFixed(1));
const row = (name, a, b) =>
  `  ${name.padEnd(34)} ${`${a}/${b}`.padStart(15)}  ${pct(a, b).padStart(5)}%`;

console.log("");
console.log(`CommonMark 0.31.2 — ${nums.examples} examples, ${nums.nodes} spanned nodes`);
console.log(row("inside the document", nums.valid, nums.nodes));
console.log(row("in document order", nums.ordered, nums.nodes));
console.log(row("verbatim runs read back", nums.exactOk, nums.exactChecked));
console.log(
  `  ${"declared as having no source".padEnd(34)} ${String(nums.unmapped).padStart(15)}`
);
console.log(
  `  ${"examples with a problem".padEnd(34)} ${`${nums.badExamples}/${nums.examples}`.padStart(15)}`
);
// A block whose span is empty does not identify itself, and the layout cache
// keys on it. Six of the corpus's own examples had one — one-line HTML blocks
// — and the inline scan above could not see it, because it only ever looked
// at what the INLINE pass stamped.
console.log(
  `  ${"blocks with an empty span".padEnd(34)} ${String(nums.emptyBlocks).padStart(15)}`
);
console.log("");

if (wantList && bad.length > 0) {
  for (const b of bad.slice(0, 60)) console.log(`  ${pad4(b.number)}  ${b.why}`);
  if (bad.length > 60) console.log(`  …and ${bad.length - 60} more`);
  console.log("");
}

// ---- the ratchet ------------------------------------------------------------
// Floors are MINIMA for the things that should go up and a MAXIMUM for the one
// that should go down, which is why they are not one number.
const current = {
  valid: nums.valid,
  ordered: nums.ordered,
  exactOk: nums.exactOk,
  exactChecked: nums.exactChecked,
  maxBadExamples: nums.badExamples,
  maxEmptyBlocks: nums.emptyBlocks,
};

if (bless) {
  fs.writeFileSync(FLOOR, JSON.stringify(current, null, 2) + "\n");
  console.log("floor written: " + FLOOR);
  process.exit(0);
}

let floor = current;
if (fs.existsSync(FLOOR)) floor = JSON.parse(fs.readFileSync(FLOOR, "utf8"));
else {
  fs.writeFileSync(FLOOR, JSON.stringify(current, null, 2) + "\n");
  console.log("floor written (first run): " + FLOOR);
}

const regressions = [];
for (const key of ["valid", "ordered", "exactOk", "exactChecked"]) {
  if (current[key] < (floor[key] ?? 0)) {
    regressions.push(`${key}: ${current[key]}, was ${floor[key]}`);
  }
}
if (current.maxBadExamples > (floor.maxBadExamples ?? 0)) {
  regressions.push(
    `examples with a problem: ${current.maxBadExamples}, was ${floor.maxBadExamples}`
  );
}
if (current.maxEmptyBlocks > (floor.maxEmptyBlocks ?? 0)) {
  regressions.push(
    `blocks with an empty span: ${current.maxEmptyBlocks}, was ${floor.maxEmptyBlocks}`
  );
}

if (regressions.length > 0) {
  console.error("REGRESSION against gallery/markdown/harness/srcmap-floor.json:");
  for (const r of regressions) console.error("  " + r);
  console.error("");
  console.error("  npm run markdown:srcmap:spec -- --list    to see which examples");
  console.error("");
  console.error("Either fix it, or say why in the commit and re-bless with --bless.");
  process.exit(1);
}

// `exactChecked` going UP is a ratchet too: it is how many runs the scan was
// able to hold to the sharp test, and a change that quietly exempts more of
// them would otherwise read as a clean pass.
console.log("ALL PASS — no measure below its floor");
