/**
 * timings.mjs — the eight measurements, RangerForms beside SurveyJS.
 *
 *   npm run rangerforms:timings
 *   node gallery/rangerforms/bench/timings.mjs --branches 500 --repeat 7
 *
 * The corpus is GENERATED here rather than hand-written, so the sizes in the
 * table are the sizes that were actually run and anybody can reproduce them.
 * Every measurement is the MEDIAN of `--repeat` runs after a warm-up, because
 * one run of a JIT-compiled engine measures the JIT.
 *
 * ---------------------------------------------------------------------------
 * What a fair comparison can and cannot separate
 * ---------------------------------------------------------------------------
 *
 * SurveyJS evaluates the whole form in its constructor, so "parse" and "first
 * evaluation" are one act there and two here. Splitting ours and reporting the
 * split against their combined number would be flattering and wrong, so Q1 and
 * Q2 are reported for us alone as a breakdown, and Q8 — text in, ready to
 * answer — is the one both are measured on.
 *
 * Q3 is the measurement that matters, and it is reported twice: in
 * milliseconds, which is a fact about this machine, and in RULE EVALUATIONS,
 * which is a fact about the engine and the same on every target.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..", "bin", "bench_runner.cjs");

const argv = process.argv.slice(2);
const num = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? parseInt(argv[i + 1], 10) : dflt;
};
const BRANCHES = num("--branches", 500);   // × 5 questions each
const CASCADE = num("--cascade", 1000);
const REPEAT = num("--repeat", 5);

if (!fs.existsSync(MODULE)) {
  console.error("build the runner first:  npm run rangerforms:bench:build");
  process.exit(2);
}
let Model;
try { ({ Model } = await import("survey-core")); }
catch { console.error("survey-core is not installed:  npm install --no-save survey-core"); process.exit(2); }
const R = await import(pathToFileURL(MODULE).href);
const { branchingForm, cascadeForm } = await import(pathToFileURL(path.join(HERE, "timings-forms.mjs")).href);

const TODAY = Math.floor(Date.UTC(2026, 0, 1) / 86400000);

// --- timing ------------------------------------------------------------------

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Median of REPEAT runs after one warm-up, in milliseconds. */
function time(fn) {
  fn();
  const runs = [];
  for (let i = 0; i < REPEAT; i++) {
    const t0 = process.hrtime.bigint();
    fn();
    runs.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  return median(runs);
}

const ms = (x) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2));

// --- the two engines ---------------------------------------------------------

const ours = {
  read: (text) => R.SurveyReader.read(text),
  load: (reader) => R.FormEngine.load(reader.form, reader.host),
  start: (engine) => engine.start(TODAY),
};

function ourColdStart(text) {
  const reader = ours.read(text);
  const engine = ours.load(reader);
  return { engine, state: ours.start(engine) };
}

function theirColdStart(spec) {
  const s = new Model(spec);
  s.clearInvisibleValues = "none";
  s.getAllQuestions();          // SurveyJS builds lazily; make it finish
  return s;
}

// --- the measurements --------------------------------------------------------

const rows = [];
const add = (id, what, size, mine, theirs, note) => rows.push({ id, what, size, mine, theirs, note });

const bigSpec = branchingForm(BRANCHES);
const bigText = JSON.stringify({ elements: bigSpec.elements });
const questions = BRANCHES * 5;

// Q1 · parse — ours alone; see the header.
const q1 = time(() => ours.read(bigText));
add("Q1", "parse", `${questions} questions`, q1, null, "text → questionnaire with compiled rules");

// Q2 · initial evaluation — ours alone.
{
  const reader = ours.read(bigText);
  const engine = ours.load(reader);
  const q2 = time(() => ours.start(engine));
  add("Q2", "initial evaluation", `${BRANCHES * 4} rules`, q2, null, "every rule, once");
}

// Q8 · cold start — the one both are measured on.
{
  const mine = time(() => ourColdStart(bigText));
  const theirs = time(() => theirColdStart(bigSpec));
  add("Q8", "cold start", `${questions} questions`, mine, theirs, "text in, ready to answer");
}

// Q3 · one answer, settled. THE measurement.
let evaluationsPerAnswer = 0;
{
  const { engine, state } = ourColdStart(bigText);
  const mid = Math.floor(BRANCHES / 2);
  const mine = time(() => engine.answerNumber(state, `q${mid}`, 50));
  state.resetCounters();
  engine.answerNumber(state, `q${mid}`, 51);
  evaluationsPerAnswer = state.evaluations;

  const s = theirColdStart(bigSpec);
  let v = 50;
  const theirs = time(() => s.setValue(`q${mid}`, v++));
  add("Q3", "one answer, settled", `in ${questions} questions`, mine, theirs, `${evaluationsPerAnswer} rule evaluations`);
}

// Q4 · a cascade of calculations.
{
  const spec = cascadeForm(CASCADE);
  const text = JSON.stringify(spec);
  const { engine, state } = ourColdStart(text);
  let n = 1;
  const mine = time(() => engine.answerNumber(state, "c0", n++));
  const s = theirColdStart(spec);
  let m = 1;
  const theirs = time(() => s.setValue("c0", m++));
  const last = engine.numberOf(state, `c${CASCADE - 1}`);
  add("Q4", "cascade", `depth ${CASCADE}`, mine, theirs, `last = ${last}`);
}

// Q5 · validation over every answered question.
//
// The two engines pay for this in different places, so it is reported twice.
// Ours settles as answers arrive and `invalidAnswers` reads flags that are
// already up to date; SurveyJS evaluates on demand. Comparing only the read
// against their evaluation would be comparing a cache with a computation, so
// the row underneath re-runs EVERY rule on our side — the honest upper bound
// on the same act.
{
  const { engine, state } = ourColdStart(bigText);
  for (let i = 0; i < BRANCHES; i++) engine.answerNumber(state, `q${i}`, 5);
  const mine = time(() => engine.invalidAnswers(state));
  const fromScratch = time(() => engine.evaluateAll(state));

  const s = theirColdStart(bigSpec);
  for (let i = 0; i < BRANCHES; i++) s.setValue(`q${i}`, 5);
  const theirs = time(() => s.hasErrors(false));
  add("Q5", "validation, read", `${BRANCHES} answers`, mine, theirs, "ours reads flags settle keeps current");
  add("Q5b", "…re-run every rule", `${BRANCHES * 4} rules`, fromScratch, theirs, "the same act, upper bound on our side");
}

// Q6 · state out and back.
{
  const { engine, state } = ourColdStart(bigText);
  for (let i = 0; i < BRANCHES; i++) engine.answerNumber(state, `q${i}`, 5);
  const mine = time(() => JSON.parse(engine.submissionJson(state)));

  const s = theirColdStart(bigSpec);
  for (let i = 0; i < BRANCHES; i++) s.setValue(`q${i}`, 5);
  const theirs = time(() => JSON.parse(JSON.stringify(s.data)));
  add("Q6", "serialization", `${BRANCHES} answers`, mine, theirs, "state → JSON → state");
}

// Q7 · memory, in a child process each, so nothing is measured through the
// other engine's garbage.
function residentFor(which) {
  const r = spawnSync(process.execPath, ["--expose-gc", path.join(HERE, "memory.mjs"), which, String(BRANCHES)],
    { encoding: "utf8", cwd: process.cwd() });
  const m = /heap (\d+)/.exec(r.stdout || "");
  return m ? parseInt(m[1], 10) / 1048576 : null;
}
{
  const mine = residentFor("ranger");
  const theirs = residentFor("surveyjs");
  add("Q7", "memory", `${questions} questions`, mine, theirs, "heap after a forced collection, MB");
}

// --- the table ---------------------------------------------------------------
console.log("");
console.log(`RangerForms vs SurveyJS — median of ${REPEAT} runs after a warm-up, on this machine`);
console.log("");
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
console.log("  " + pad("", 4) + pad("what", 22) + pad("size", 22) + rpad("ours", 9) + rpad("surveyjs", 11) + "   note");
console.log("  " + "─".repeat(4 + 22 + 22 + 9 + 11 + 3 + 40));
for (const r of rows) {
  const unit = r.id === "Q7" ? "" : " ms";
  const mine = r.mine == null ? "—" : ms(r.mine) + unit;
  const theirs = r.theirs == null ? "—" : ms(r.theirs) + unit;
  console.log("  " + pad(r.id, 4) + pad(r.what, 22) + pad(r.size, 22) + rpad(mine, 9) + rpad(theirs, 11) + "   " + r.note);
}
console.log("");
console.log("  Q1 and Q2 have no SurveyJS column: it evaluates the whole form in its");
console.log("  constructor, so parse and first evaluation are one act there. Q8 is the");
console.log("  number both engines are measured on.");
console.log("");
console.log(`  Q3 in rule evaluations: ${evaluationsPerAnswer}. That one is a fact about the`);
console.log("  engine and is the same on every target; the milliseconds beside it are a");
console.log("  fact about this machine.");
console.log("");
