/**
 * The scorecard: how much of the Radix surface these EVG controllers actually
 * match, and what is still missing.
 *
 *   node gallery/ui/conformance/report.mjs [--update-baseline]
 *
 * Three numbers, because one is not enough:
 *
 *   coverage    catalogued behaviours that any spec exercises at all.
 *               Low coverage means the other numbers are not yet trustworthy.
 *   parity      catalogued behaviours a spec exercises AND that agree with
 *               Radix on every observation. This is the headline: it counts
 *               the whole catalogue, so adding a component you have not built
 *               LOWERS the score. That is the point — the denominator is the
 *               intent, not the work already done.
 *   observation matching field-observations over all of them. Fine-grained, so
 *               progress shows up between whole behaviours flipping green.
 *
 * The divergence profile says which KIND of thing is wrong (focus? aria?
 * visibility?), which is usually what tells you where to work next.
 *
 * `baseline.json` is checked in, so a pull request shows the score moving.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSpecs, runSpec, loadTheme, loadCatalogue, FIELDS, MissingDomDeps } from "./runner.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = path.join(HERE, "baseline.json");
const OUT_DIR = path.join(HERE, "out");

const updateBaseline = process.argv.includes("--update-baseline");
const specArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const catalogue = loadCatalogue();
const specs = listSpecs(specArgs);
const css = loadTheme();

// --- run everything --------------------------------------------------------

const results = [];
for (const spec of specs) {
  try {
    results.push(await runSpec(spec, css));
  } catch (e) {
    if (e instanceof MissingDomDeps) {
      console.error(e.message);
      process.exit(3);
    }
    throw e;
  }
}

// --- validate the specs against the catalogue ------------------------------

const problems = [];
for (const { spec } of results) {
  const entry = catalogue[spec.component];
  if (!entry) {
    problems.push(`${spec.name}: component "${spec.component}" is not in behaviours.json`);
    continue;
  }
  for (const b of spec.behaviours || []) {
    if (!(b in entry.behaviours)) {
      problems.push(`${spec.name}: behaviour "${b}" is not catalogued for ${spec.component}`);
    }
  }
}
if (problems.length) {
  console.error("Spec/catalogue mismatch:");
  for (const p of problems) console.error("  " + p);
  process.exit(2);
}

// --- score -----------------------------------------------------------------

// A catalogue entry is either a description or { note, disputed }. "Disputed"
// means the reference itself is inconsistent about it, so scoring either way
// would be a lie — it stays in the denominator, uncovered, with the evidence.
const disputed = [];
for (const [comp, entry] of Object.entries(catalogue)) {
  for (const [b, v] of Object.entries(entry.behaviours)) {
    if (v && typeof v === "object" && v.disputed) {
      disputed.push({ component: comp, behaviour: b, why: v.disputed });
    }
  }
}
const isDisputed = (comp, b) => disputed.some((d) => d.component === comp && d.behaviour === b);

const byComponent = new Map();
for (const name of Object.keys(catalogue)) {
  byComponent.set(name, {
    component: name,
    catalogued: Object.keys(catalogue[name].behaviours),
    covered: new Set(),
    failing: new Set(),
    observations: 0,
    matched: 0,
    specs: 0,
  });
}

const divergenceByField = Object.fromEntries(FIELDS.map((f) => [f, 0]));
let missingNodes = 0;

for (const r of results) {
  const c = byComponent.get(r.spec.component);
  c.specs += 1;
  c.observations += r.observations;
  c.matched += r.matched;
  for (const b of r.spec.behaviours || []) {
    c.covered.add(b);
    if (!r.passed) c.failing.add(b);
  }
  for (const d of r.diffs) {
    if (d.field) divergenceByField[d.field] += 1;
    else missingNodes += 1;
  }
}

const rows = [...byComponent.values()].map((c) => {
  const catalogued = c.catalogued.length;
  const covered = c.covered.size;
  const matched = [...c.covered].filter((b) => !c.failing.has(b)).length;
  return {
    component: c.component,
    specs: c.specs,
    catalogued,
    covered,
    matchedBehaviours: matched,
    coverage: catalogued ? covered / catalogued : 0,
    parity: catalogued ? matched / catalogued : 0,
    observations: c.observations,
    matchedObservations: c.matched,
    uncovered: c.catalogued.filter((b) => !c.covered.has(b) && !isDisputed(c.component, b)),
    failingBehaviours: [...c.failing].sort(),
  };
});

const total = rows.reduce(
  (a, r) => ({
    catalogued: a.catalogued + r.catalogued,
    covered: a.covered + r.covered,
    matchedBehaviours: a.matchedBehaviours + r.matchedBehaviours,
    observations: a.observations + r.observations,
    matchedObservations: a.matchedObservations + r.matchedObservations,
  }),
  { catalogued: 0, covered: 0, matchedBehaviours: 0, observations: 0, matchedObservations: 0 },
);
total.coverage = total.catalogued ? total.covered / total.catalogued : 0;
total.parity = total.catalogued ? total.matchedBehaviours / total.catalogued : 0;
total.observationParity = total.observations ? total.matchedObservations / total.observations : 0;

const scorecard = {
  generated: new Date().toISOString(),
  specs: results.length,
  disputed,
  components: rows,
  total,
  divergenceByField,
  missingNodes,
  failedSpecs: results.filter((r) => !r.passed).map((r) => r.spec.name),
};

// --- print -----------------------------------------------------------------

const pct = (v) => (v * 100).toFixed(1).padStart(5) + "%";
const bar = (v, width = 12) => {
  const filled = Math.round(v * width);
  return "█".repeat(filled) + "·".repeat(width - filled);
};

console.log("gallery/ui — parity with Radix\n");
console.log("component      specs  behaviours   coverage    parity  observations");
console.log("─".repeat(72));
for (const r of rows) {
  const b = `${String(r.matchedBehaviours).padStart(2)}/${String(r.catalogued).padStart(2)}`;
  const obs = r.observations ? `${r.matchedObservations}/${r.observations}` : "—";
  console.log(
    `${r.component.padEnd(13)} ${String(r.specs).padStart(5)}  ${b.padStart(10)}  ` +
      `${pct(r.coverage)}  ${pct(r.parity)}  ${obs.padStart(12)}`,
  );
}
console.log("─".repeat(72));
console.log(
  `${"TOTAL".padEnd(13)} ${String(results.length).padStart(5)}  ` +
    `${`${total.matchedBehaviours}/${total.catalogued}`.padStart(10)}  ` +
    `${pct(total.coverage)}  ${pct(total.parity)}  ` +
    `${`${total.matchedObservations}/${total.observations}`.padStart(12)}`,
);

console.log(`\nbehaviour parity  ${bar(total.parity)}  ${pct(total.parity)}`);
console.log(`coverage          ${bar(total.coverage)}  ${pct(total.coverage)}`);
console.log(`observations      ${bar(total.observationParity)}  ${pct(total.observationParity)}`);

const diverged = Object.entries(divergenceByField).filter(([, n]) => n > 0);
if (diverged.length || missingNodes) {
  console.log("\ndivergence profile");
  for (const [f, n] of diverged.sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f.padEnd(10)} ${String(n).padStart(4)}`);
  }
  if (missingNodes) console.log(`  ${"missing".padEnd(10)} ${String(missingNodes).padStart(4)}`);
}

const gaps = rows.filter((r) => r.uncovered.length || r.failingBehaviours.length);
if (gaps.length) {
  console.log("\ngaps");
  for (const r of gaps) {
    if (r.failingBehaviours.length) {
      console.log(`  ${r.component}: FAILING ${r.failingBehaviours.join(", ")}`);
    }
    if (r.uncovered.length) {
      console.log(`  ${r.component}: uncovered ${r.uncovered.join(", ")}`);
    }
  }
}

if (disputed.length) {
  console.log("\ndisputed — the reference is inconsistent, see conformance/SPEC.md");
  for (const d of disputed) {
    console.log(`  ${d.component}.${d.behaviour}`);
  }
}

// --- persist and compare with the baseline ---------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "scorecard.json"), JSON.stringify(scorecard, null, 2) + "\n");

if (updateBaseline) {
  const slim = {
    total: {
      catalogued: total.catalogued,
      covered: total.covered,
      matchedBehaviours: total.matchedBehaviours,
      observations: total.observations,
      matchedObservations: total.matchedObservations,
    },
    components: Object.fromEntries(
      rows.map((r) => [r.component, { covered: r.covered, matchedBehaviours: r.matchedBehaviours }]),
    ),
  };
  fs.writeFileSync(BASELINE, JSON.stringify(slim, null, 2) + "\n");
  console.log("\nbaseline updated");
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.log("\nno baseline yet — run with --update-baseline to record one");
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const delta = total.matchedBehaviours - base.total.matchedBehaviours;
const obsDelta = total.matchedObservations - base.total.matchedObservations;
const sign = (n) => (n > 0 ? "+" + n : String(n));

console.log(
  `\nvs baseline: behaviours ${sign(delta)}, observations ${sign(obsDelta)}` +
    ` (baseline ${base.total.matchedBehaviours}/${base.total.catalogued})`,
);

const regressed = [];
for (const r of rows) {
  const b = base.components[r.component];
  if (b && r.matchedBehaviours < b.matchedBehaviours) {
    regressed.push(`${r.component} ${b.matchedBehaviours} → ${r.matchedBehaviours}`);
  }
}
if (regressed.length) {
  console.log("\nREGRESSION");
  for (const r of regressed) console.log("  " + r);
  process.exit(1);
}
console.log(delta > 0 ? "\nRESULT IMPROVED" : "\nRESULT OK");
