/**
 * xforms.mjs — RangerForms against Enketo's XPath engine, on ODK XForms.
 *
 *   npm install --no-save openrosa-xpath-evaluator jsdom
 *   npm run rangerforms:xforms
 *   node gallery/rangerforms/bench/xforms.mjs --verbose --case select
 *
 * The oracle is `openrosa-xpath-evaluator` — the evaluator Enketo itself runs
 * — over a real XML instance built from the same answers. For every step of
 * every case, every `relevant`, `required`, `constraint` and `calculate` in
 * the form is put to both, and the two answers are compared.
 *
 * ---------------------------------------------------------------------------
 * Why the expressions and not a whole engine
 * ---------------------------------------------------------------------------
 *
 * Enketo Core is a browser application: running it headlessly to compare form
 * state would be comparing our engine against its DOM. Its XPath evaluator is
 * a library, and the expressions ARE the part the plan called the stress case
 * — `relevant`, `calculate` and `constraint` are where an XForm keeps its
 * behaviour. So the oracle answers the expressions and our engine's own state
 * is what is checked against them.
 *
 * A form the reader could not fully represent is UNSUPPORTED, not a pass and
 * not a failure — the same three buckets as the SurveyJS comparison, and for
 * the same reason.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.join(HERE, "xforms");
const MODULE = path.join(HERE, "..", "bin", "xform_bench.cjs");

const argv = process.argv.slice(2);
const argVal = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const only = argVal("--case", null);
const verbose = argv.includes("--verbose");

if (!fs.existsSync(MODULE)) {
  console.error("build the module first:  npm run rangerforms:xforms:build");
  process.exit(2);
}

let JSDOM, ore;
try {
  ({ JSDOM } = await import("jsdom"));
} catch {
  console.error("jsdom is not installed:  npm install --no-save openrosa-xpath-evaluator jsdom");
  process.exit(2);
}
const dom = new JSDOM("<!doctype html><html><body></body></html>");
for (const k of ["window", "document", "Node", "XPathResult", "DOMParser", "XPathEvaluator", "XPathExpression"]) {
  global[k] = dom.window[k];
}
global.window = dom.window;
try {
  ore = (await import("openrosa-xpath-evaluator")).default;
} catch (e) {
  console.error("openrosa-xpath-evaluator is not installed:  npm install --no-save openrosa-xpath-evaluator jsdom");
  process.exit(2);
}

const R = await import(pathToFileURL(MODULE).href);
const TODAY = Math.floor(Date.UTC(2026, 0, 1) / 86400000);
const evaluator = ore();
const parser = new dom.window.DOMParser();

// --- the oracle --------------------------------------------------------------

/** The instance, as XForms holds it: every node a string, a multi-select space delimited. */
function instanceXml(names, answers) {
  let body = "";
  for (const name of names) {
    const v = answers[name];
    let text = "";
    if (Array.isArray(v)) text = v.join(" ");
    else if (v !== undefined && v !== null) text = String(v);
    body += `<${name}>${escapeXml(text)}</${name}>`;
  }
  return `<data>${body}</data>`;
}
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function ask(doc, expr) {
  try {
    const r = evaluator.evaluate.call(doc, expr, doc.documentElement, null, dom.window.XPathResult.ANY_TYPE, null);
    if (r.resultType === dom.window.XPathResult.BOOLEAN_TYPE) return { kind: "bool", value: r.booleanValue };
    if (r.resultType === dom.window.XPathResult.NUMBER_TYPE) return { kind: "num", value: r.numberValue };
    if (r.resultType === dom.window.XPathResult.STRING_TYPE) return { kind: "str", value: r.stringValue };
    return { kind: "nodes", value: "(node set)" };
  } catch (e) {
    return { kind: "error", value: e.message };
  }
}

/** Both sides printed the same way, so a difference is a difference and not a format. */
function show(kind, value) {
  if (kind === "bool") return value ? "1" : "0";
  if (kind === "num") {
    if (Number.isNaN(value)) return "NaN";
    return String(value);
  }
  return String(value);
}

// --- ours --------------------------------------------------------------------

function ourValue(state, name) {
  const v = state.rawValueOf(name);
  if (v.isEmpty()) return "";
  if (v.isError()) return "(error)";
  return v.asText();
}

function setAnswer(engine, state, name, value) {
  if (Array.isArray(value)) {
    return engine.answer(state, name, R.FormValue.ofList(value));
  }
  if (typeof value === "number") return engine.answerNumber(state, name, value);
  if (typeof value === "boolean") return engine.answer(state, name, R.FormValue.ofBool(value));
  return engine.answerText(state, name, String(value));
}

// --- one case ----------------------------------------------------------------

function runCase(xml, spec) {
  const reader = R.XFormReader.read(xml);
  const gaps = R.XFormBench.gapsOf(reader).split("\n").filter(Boolean);
  const names = R.XFormBench.questionNames(reader.form).split("\n").filter(Boolean);
  const rules = new Map();
  for (const name of names) {
    const lines = R.XFormBench.rulesOf(reader.form, name).split("\n").filter(Boolean);
    rules.set(name, lines.map((l) => {
      const at = l.indexOf("=");
      return { role: l.slice(0, at), source: l.slice(at + 1) };
    }));
  }
  if (gaps.length) return { gaps, names };

  const engine = R.FormEngine.load(reader.form, reader.host);
  if (!engine.ready) return { error: engine.errorText };
  const state = engine.start(TODAY);

  const answers = {};
  const diffs = [];
  const steps = [{}].concat(spec.script || []);
  for (let s = 0; s < steps.length; s++) {
    for (const [name, value] of Object.entries(steps[s])) {
      answers[name] = value;
      setAnswer(engine, state, name, value);
    }
    // The oracle is an EXPRESSION evaluator, not a form engine, so the harness
    // has to keep its instance the way an engine would: a calculated node has
    // its value written back, and anything reading that node sees it. Settled
    // by re-running the calculations until they stop changing — which is the
    // slow way to do what our dependency graph does in one pass, and the right
    // way for an oracle that has no graph.
    const doc = parser.parseFromString(instanceXml(names, answers), "text/xml");
    settleOracle(doc, names, rules);
    for (const name of names) {
      for (const rule of rules.get(name) || []) {
        const theirs = ask(doc, rule.source);
        let mine;
        if (rule.role === "visible") mine = state.isVisible(name) ? "1" : "0";
        else if (rule.role === "required") mine = state.isRequired(name) ? "1" : "0";
        else if (rule.role === "validate") mine = state.isValid(name) ? "1" : "0";
        else if (rule.role === "calculated") mine = ourValue(state, name);
        else continue;
        let want = show(theirs.kind, theirs.value);
        // A boolean rule is a boolean question on both sides, whatever XPath's
        // own result type happened to be for the expression.
        if (rule.role !== "calculated") {
          want = truthOf(theirs) ? "1" : "0";
        }
        if (mine !== want) {
          diffs.push({ step: s, question: name, role: rule.role, source: rule.source, mine, theirs: want });
        }
      }
    }
  }
  return { diffs, names, steps: steps.length };
}

/**
 * Run every `calculate` until nothing changes, writing each result into the
 * instance. Five passes is more than any of these forms needs and a bound on a
 * form that would not settle — which our own engine refuses at load.
 */
function settleOracle(doc, names, rules) {
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const name of names) {
      for (const rule of rules.get(name) || []) {
        if (rule.role !== "calculated") continue;
        const r = ask(doc, rule.source);
        const text = r.kind === "error" ? "" : show(r.kind, r.value);
        const node = doc.documentElement.getElementsByTagName(name)[0];
        if (node && node.textContent !== text) {
          node.textContent = text;
          changed = true;
        }
      }
    }
    if (!changed) return;
  }
}

/** XPath's own truthiness, which is what a `relevant` is read with. */
function truthOf(r) {
  if (r.kind === "bool") return r.value;
  if (r.kind === "num") return !Number.isNaN(r.value) && r.value !== 0;
  if (r.kind === "str") return r.value.length > 0;
  return false;
}

function classify(diffs, known) {
  const byQuestion = new Map(known.map((k) => [k.question, k.reason]));
  const bug = [], design = [];
  for (const d of diffs) {
    if (byQuestion.has(d.question)) design.push({ ...d, reason: byQuestion.get(d.question) });
    else bug.push(d);
  }
  return { bug, design };
}

// --- the run -----------------------------------------------------------------

const files = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".xml")).sort();
let identical = 0, differing = 0, byDesign = 0, unsupported = 0, broken = 0;
const rows = [];

for (const file of files) {
  const base = file.slice(0, -4);
  const specPath = path.join(CORPUS, base + ".json");
  const spec = fs.existsSync(specPath) ? JSON.parse(fs.readFileSync(specPath, "utf8")) : { name: base, script: [] };
  if (only && spec.name !== only) continue;
  const xml = fs.readFileSync(path.join(CORPUS, file), "utf8");

  let out;
  try { out = runCase(xml, spec); }
  catch (e) { broken++; rows.push([spec.name, "ERROR", e.message]); continue; }

  if (out.error) { broken++; rows.push([spec.name, "ERROR", out.error]); continue; }
  if (out.gaps) {
    unsupported++;
    rows.push([spec.name, "unsupported", out.gaps[0] + (out.gaps.length > 1 ? ` (+${out.gaps.length - 1} more)` : "")]);
    if (verbose) for (const g of out.gaps) console.log("    gap: " + g);
    continue;
  }

  const { bug, design } = classify(out.diffs, spec.knownDifferences || []);
  if (bug.length === 0 && design.length === 0) {
    identical++;
    rows.push([spec.name, "identical", `${out.names.length} nodes over ${out.steps} steps`]);
  } else if (bug.length === 0) {
    byDesign++;
    rows.push([spec.name, "differs by design", [...new Set(design.map((d) => d.reason))][0]]);
    if (verbose) for (const d of design) console.log(`    ${d.question}.${d.role} step ${d.step}: ours ${d.mine} · enketo ${d.theirs}   ${d.source}`);
  } else {
    differing++;
    rows.push([spec.name, `${bug.length} differ`, `${bug[0].question}.${bug[0].role}: ours ${bug[0].mine} ≠ ${bug[0].theirs}`]);
    if (verbose) for (const d of bug) console.log(`    ${d.question}.${d.role} step ${d.step}: ours ${d.mine} · enketo ${d.theirs}   ${d.source}`);
  }
}

const w0 = Math.max(...rows.map((r) => r[0].length), 4);
const w1 = Math.max(...rows.map((r) => r[1].length), 7);
console.log("");
console.log("RangerForms vs Enketo's XPath evaluator — the same XForm, the same answers");
console.log("");
for (const r of rows) console.log("  " + r[0].padEnd(w0) + "  " + r[1].padEnd(w1) + "  " + r[2]);
console.log("");
const scored = identical + differing + byDesign;
console.log(`  identical    ${identical} of ${scored} scored`);
console.log(`  by design    ${byDesign}  (the corpus names the decision and the node)`);
console.log(`  differing    ${differing}`);
console.log(`  unsupported  ${unsupported}  (the reader said so; not counted as agreement)`);
if (broken) console.log(`  broken       ${broken}`);
console.log("");
process.exit(differing > 0 || broken > 0 ? 1 : 0);
