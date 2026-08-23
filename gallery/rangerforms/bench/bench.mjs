/**
 * bench.mjs — RangerForms against SurveyJS, on the same forms and the same answers.
 *
 *   node gallery/rangerforms/bench/bench.mjs [--case NAME] [--verbose]
 *
 * Both engines are given a SurveyJS form definition and a script of answers.
 * After the initial pass and after every step, each is asked what it believes
 * about every question — showing, required, and the value — and the two
 * answers are compared line by line.
 *
 * ---------------------------------------------------------------------------
 * What counts as agreement, and what does not
 * ---------------------------------------------------------------------------
 *
 * A form the reader could not fully represent is UNSUPPORTED, not a failure
 * and not a pass. `SurveyReader` records every property it did not understand,
 * and a form with any gap is scored separately — because an engine that
 * silently dropped `validators` would agree with SurveyJS on every case that
 * did not use them, and the score would be a lie about what it does.
 *
 * survey-core is not a dependency of this repository and this is not part of
 * `npm test`: the comparison needs the thing being compared against.
 *
 *     npm install --no-save survey-core
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.join(HERE, "corpus");
const MODULE = path.join(HERE, "..", "bin", "bench_runner.cjs");

const argv = process.argv.slice(2);
function argVal(name, dflt) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
}
const only = argVal("--case", null);
const verbose = argv.includes("--verbose");

if (!fs.existsSync(MODULE)) {
  console.error("build the runner first:  npm run rangerforms:bench:build");
  process.exit(2);
}

let Model;
try {
  ({ Model } = await import("survey-core"));
} catch (e) {
  console.error("survey-core is not installed. This benchmark compares against it:");
  console.error("    npm install --no-save survey-core");
  process.exit(2);
}

const { BenchRunner } = await import(pathToFileURL(MODULE).href);

/** The same day for both engines, so nothing depends on when this was run. */
const TODAY_DAYS = Math.floor(Date.UTC(2026, 0, 1) / 86400000);

function showValue(v) {
  if (Array.isArray(v)) return v.length ? v.map(showValue).join(", ") : "-";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

/**
 * SurveyJS's opinion, in the same shape the Ranger runner prints.
 *
 * `q.isVisible` is the question's OWN visibility and does not include its
 * page's: SurveyJS keeps the two apart and a question on a hidden page still
 * reports 1. Our model folds a page's condition into every question on it,
 * because what a person can see is one fact and not two. Comparing the raw
 * flags would be comparing an implementation detail, so both sides are asked
 * the question that matters — is it on screen.
 */
function surveySnapshot(survey) {
  let out = "";
  for (const q of survey.getAllQuestions()) {
    const onPage = !q.page || q.page.isVisible;
    const visible = q.isVisible && onPage ? 1 : 0;
    const required = q.isRequired ? 1 : 0;
    let value = "-";
    if (visible) {
      const v = survey.getValue(q.name);
      if (v !== undefined && v !== null && v !== "") value = showValue(v);
    }
    out += `${q.name} visible=${visible} required=${required} value=${value}\n`;
  }
  return out;
}

function runSurveyJs(spec) {
  const survey = new Model(spec.survey);
  // Nothing may be pruned on the way out: we are comparing what each engine
  // BELIEVES, and SurveyJS clearing hidden values would change the question.
  survey.clearInvisibleValues = "none";
  let out = "-- step 0\n" + surveySnapshot(survey);
  const script = spec.script || [];
  for (let i = 0; i < script.length; i++) {
    for (const [name, value] of Object.entries(script[i])) survey.setValue(name, value);
    out += `-- step ${i + 1}\n` + surveySnapshot(survey);
  }
  return out;
}

function runRanger(text) {
  const r = new BenchRunner();
  if (!r.load(text, TODAY_DAYS)) return { error: r.errorText };
  const full = r.report();
  const at = full.indexOf("-- step 0\n");
  const head = full.slice(0, at);
  const gaps = head.split("\n").filter((l) => l.startsWith("gap ")).map((l) => l.slice(4));
  const evals = /evaluations (\d+)/.exec(full);
  return {
    body: full.slice(at).replace(/evaluations \d+\n$/, ""),
    gaps,
    evaluations: evals ? parseInt(evals[1], 10) : 0,
  };
}

/** Line by line, so a disagreement names the question that disagreed. */
function diff(mine, theirs) {
  const a = mine.split("\n");
  const b = theirs.split("\n");
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || "") !== (b[i] || "")) out.push({ mine: a[i] || "", theirs: b[i] || "" });
  }
  return out;
}

/**
 * Some divergences are decisions, not defects, and a benchmark that scored
 * them as failures would be pressure to give the decision up.
 *
 * A case names them itself, in `knownDifferences`, with the question and the
 * reason. Anything NOT named there is a failure — so the list is a claim the
 * corpus makes out loud rather than a quiet exemption, and adding to it is a
 * visible act.
 */
function classify(differences, known) {
  const byQuestion = new Map(known.map((k) => [k.question, k.reason]));
  const bug = [], design = [];
  for (const d of differences) {
    const name = (d.mine || d.theirs).split(" ")[0];
    if (byQuestion.has(name)) design.push({ ...d, reason: byQuestion.get(name) });
    else bug.push(d);
  }
  return { bug, design };
}

const files = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".json")).sort();
let identical = 0, differing = 0, byDesign = 0, unsupported = 0, broken = 0;
const rows = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(CORPUS, file), "utf8");
  const spec = JSON.parse(text);
  if (only && spec.name !== only) continue;

  const mine = runRanger(text);
  if (mine.error) {
    broken++;
    rows.push([spec.name, "ERROR", mine.error]);
    continue;
  }
  let theirs;
  try {
    theirs = runSurveyJs(spec);
  } catch (e) {
    broken++;
    rows.push([spec.name, "ERROR", "survey-core threw: " + e.message]);
    continue;
  }

  if (mine.gaps.length) {
    unsupported++;
    rows.push([spec.name, "unsupported", mine.gaps[0] + (mine.gaps.length > 1 ? ` (+${mine.gaps.length - 1} more)` : "")]);
    if (verbose) for (const g of mine.gaps) console.log("    gap: " + g);
    continue;
  }

  const d = diff(mine.body, theirs);
  const { bug, design } = classify(d, spec.knownDifferences || []);
  if (bug.length === 0 && design.length === 0) {
    identical++;
    rows.push([spec.name, "identical", `${mine.evaluations} rule evaluations`]);
  } else if (bug.length === 0) {
    byDesign++;
    const reasons = [...new Set(design.map((x) => x.reason))].join("; ");
    rows.push([spec.name, "differs by design", reasons]);
    if (verbose) {
      console.log("  " + spec.name + ":");
      for (const x of design) {
        console.log(`    ours    ${x.mine}`);
        console.log(`    surveys ${x.theirs}   (${x.reason})`);
      }
    }
  } else {
    differing++;
    rows.push([spec.name, `${bug.length} lines differ`, bug[0].mine + "  ≠  " + bug[0].theirs]);
    if (verbose) {
      console.log("  " + spec.name + ":");
      for (const x of bug) {
        console.log(`    ours    ${x.mine}`);
        console.log(`    surveys ${x.theirs}`);
      }
    }
  }
}

const w0 = Math.max(...rows.map((r) => r[0].length), 4);
const w1 = Math.max(...rows.map((r) => r[1].length), 7);
console.log("");
console.log("RangerForms vs SurveyJS — the same form, the same answers");
console.log("");
for (const r of rows) console.log("  " + r[0].padEnd(w0) + "  " + r[1].padEnd(w1) + "  " + r[2]);
console.log("");
const scored = identical + differing + byDesign;
console.log(`  identical    ${identical} of ${scored} scored`);
console.log(`  by design    ${byDesign}  (the corpus names the decision and the question)`);
console.log(`  differing    ${differing}`);
console.log(`  unsupported  ${unsupported}  (the reader said so; not counted as agreement)`);
if (broken) console.log(`  broken       ${broken}`);
console.log("");
process.exit(differing > 0 || broken > 0 ? 1 : 0);
