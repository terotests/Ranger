/**
 * markdown-parity.mjs — how much of CommonMark this parser reads.
 *
 *   npm run markdown:spec
 *   npm run markdown:spec -- --diff        every failing example, in full
 *   npm run markdown:spec -- --diff=12     …just that one
 *   npm run markdown:spec -- --bless       write the current score as the floor
 *
 * The oracle is not an opinion and not another library: it is the
 * specification's own examples, `harness/spec/commonmark-0.31.2.txt`, which
 * ships 652 pairs of (markdown, expected HTML) and defines conformance as an
 * exact string match. The same file the reference implementations are tested
 * with, pinned here so a score cannot move because a website did.
 *
 * The score is RATCHETED. `harness/floor.json` holds what each section passed
 * the last time the number went up, and a section that drops below its floor
 * fails the build. Going up is a diff in that file; going down is red. This
 * is the mechanism that keeps a parser honest after the week somebody was
 * excited about it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
// The split is shared with `markdown-srcmap.mjs`: two readers of one
// specification file would be two opinions about what an example is.
import { readExamples } from "./spec-examples.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const ROOT = path.join(MODULE, "..", "..");
const SPEC = path.join(MODULE, "harness", "spec", "commonmark-0.31.2.txt");
const OUT = path.join(MODULE, "harness", "out");
const CASES = path.join(OUT, "cases");
const RENDERED = path.join(OUT, "rendered");
const FLOOR = path.join(MODULE, "harness", "floor.json");
const DOC = path.join(MODULE, "docs", "COMMONMARK_PARITY.md");

const argv = process.argv.slice(2);
const wantDiff = argv.some((a) => a === "--diff" || a.startsWith("--diff="));
const onlyDiff = argv.find((a) => a.startsWith("--diff="))?.slice(7);
const bless = argv.includes("--bless");

const pad4 = (n) => String(n).padStart(4, "0");

function writeCases(examples) {
  fs.rmSync(CASES, { recursive: true, force: true });
  fs.rmSync(RENDERED, { recursive: true, force: true });
  fs.mkdirSync(CASES, { recursive: true });
  fs.mkdirSync(RENDERED, { recursive: true });
  for (const ex of examples) {
    fs.writeFileSync(path.join(CASES, pad4(ex.number) + ".md"), ex.markdown);
  }
}

function runParser(count) {
  const js = path.join(MODULE, "bin", "MdSpecDump.js");
  if (!fs.existsSync(js)) {
    console.error("gallery/markdown/bin/MdSpecDump.js is missing — build it first:");
    console.error("  npm run markdown:spec:build");
    process.exit(1);
  }
  // Repo-relative: Ranger's `write_file "." p` writes `./p`, so an absolute
  // path arrives as `.//home/...` and opens nothing.
  const rel = (p) => path.relative(ROOT, p);
  execFileSync(process.execPath, [js, rel(CASES), rel(RENDERED), String(count)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function bar(passed, total) {
  const width = 20;
  const filled = total === 0 ? 0 : Math.round((passed / total) * width);
  return "#".repeat(filled) + ".".repeat(width - filled);
}

const examples = readExamples(SPEC);
writeCases(examples);
runParser(examples.length);

const sections = new Map();
const failures = [];
for (const ex of examples) {
  const p = path.join(RENDERED, pad4(ex.number) + ".html");
  const got = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  const ok = got === ex.html;
  if (!sections.has(ex.section)) sections.set(ex.section, { passed: 0, total: 0 });
  const s = sections.get(ex.section);
  s.total += 1;
  if (ok) s.passed += 1;
  else failures.push({ ...ex, got });
}

const totalPassed = [...sections.values()].reduce((a, s) => a + s.passed, 0);
const total = examples.length;

// ---- the report ------------------------------------------------------------
const nameWidth = Math.max(...[...sections.keys()].map((k) => k.length));
const lines = [];
for (const [name, s] of sections) {
  const score = `${s.passed}/${s.total}`;
  lines.push(`${name.padEnd(nameWidth)}  ${score.padStart(7)}  ${bar(s.passed, s.total)}`);
}
console.log("");
console.log(lines.join("\n"));
console.log("─".repeat(nameWidth + 31));
const pct = ((totalPassed / total) * 100).toFixed(1);
console.log(
  `${"CommonMark 0.31.2".padEnd(nameWidth)}  ${`${totalPassed}/${total}`.padStart(7)}  ${pct}%`
);
console.log("");

// ---- the ratchet -----------------------------------------------------------
let floor = {};
if (fs.existsSync(FLOOR)) floor = JSON.parse(fs.readFileSync(FLOOR, "utf8"));

const regressions = [];
for (const [name, s] of sections) {
  const was = floor[name] ?? 0;
  if (s.passed < was) regressions.push(`${name}: ${s.passed} now, ${was} before`);
}

if (bless) {
  const next = {};
  for (const [name, s] of sections) next[name] = s.passed;
  fs.writeFileSync(FLOOR, JSON.stringify(next, null, 2) + "\n");
  console.log(`floor written: ${FLOOR}`);
}

// ---- the checked-in score --------------------------------------------------
const doc = [];
doc.push("# CommonMark parity");
doc.push("");
doc.push("<!-- GENERATED by gallery/markdown/tools/markdown-parity.mjs. Do not edit. -->");
doc.push("");
doc.push(
  `**${totalPassed} of ${total}** examples of CommonMark 0.31.2, compared as exact strings ` +
    "against the HTML the specification itself prints for each one."
);
doc.push("");
doc.push("Regenerate with `npm run markdown:spec`.");
doc.push("");
doc.push("| Section | | |");
doc.push("| --- | ---: | --- |");
for (const [name, s] of sections) {
  doc.push(`| ${name} | ${s.passed}/${s.total} | \`${bar(s.passed, s.total)}\` |`);
}
doc.push(`| **total** | **${totalPassed}/${total}** | **${pct}%** |`);
doc.push("");
fs.mkdirSync(path.dirname(DOC), { recursive: true });
fs.writeFileSync(DOC, doc.join("\n"));

// ---- the failures ----------------------------------------------------------
if (wantDiff) {
  const show = onlyDiff ? failures.filter((f) => String(f.number) === onlyDiff) : failures;
  for (const f of show) {
    console.log(`── example ${f.number}  (${f.section}) ${"─".repeat(40)}`);
    console.log("markdown:");
    console.log(JSON.stringify(f.markdown));
    console.log("want:");
    console.log(JSON.stringify(f.html));
    console.log("got:");
    console.log(JSON.stringify(f.got));
    console.log("");
  }
} else if (failures.length > 0) {
  const first = failures.slice(0, 8).map((f) => f.number).join(" ");
  console.log(`${failures.length} failing; first few: ${first}`);
  console.log("  npm run markdown:spec -- --diff        to see them");
}

if (regressions.length > 0) {
  console.error("");
  console.error("REGRESSION against gallery/markdown/harness/floor.json:");
  for (const r of regressions) console.error("  " + r);
  console.error("");
  console.error("Either fix it, or say why in the commit and re-bless with --bless.");
  process.exit(1);
}

// The marker `scripts/run-gallery-editor-tests.sh` greps for. It says the
// RATCHET held, which is what this script gates on — not that every example
// passes, which the score above states and which this line must not be read
// as claiming.
console.log("");
console.log(`ALL PASS — no section below its floor (${totalPassed}/${total})`);
