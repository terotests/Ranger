/**
 * How much of Radix is missing — derived, not remembered.
 *
 *   node gallery/ui/conformance/inventory.mjs
 *   node gallery/ui/conformance/inventory.mjs --refresh   # re-read npm
 *
 * The number is only worth having if it cannot quietly go stale, so:
 *
 *   the denominator  comes from the npm org listing for @radix-ui, cached into
 *                    radix-inventory.json. `--refresh` re-reads it; without the
 *                    flag the run is offline and CI-safe.
 *   the numerator    comes from `build-host.cjs`'s SUPPORTED_TYPES — the list
 *                    the code actually builds from, so "implemented" cannot
 *                    drift from what exists.
 *   the judgement    (is `react-menu` a component or plumbing?) lives in the
 *                    cache file as reviewable data, never as a regex.
 *
 * And the part that keeps it honest: a package nobody has classified is an
 * ERROR, not a silent omission. Radix ships something new, the next refresh
 * fails, and a human decides what it is. An inventory that can drift is a
 * number that flatters.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, "radix-inventory.json");
const NPM_ORG = "https://registry.npmjs.org/-/org/radix-ui/package?format=cli";
const require1 = createRequire(import.meta.url);
const { SUPPORTED_TYPES } = require1("./build-host.cjs");

async function fetchPackages() {
  const res = await fetch(NPM_ORG);
  if (!res.ok) throw new Error("npm returned " + res.status);
  const body = await res.json();
  return Object.keys(body)
    .filter((n) => n.startsWith("@radix-ui/react-"))
    .map((n) => n.slice("@radix-ui/react-".length))
    .sort();
}

const cache = JSON.parse(fs.readFileSync(CACHE, "utf8"));

if (process.argv.includes("--refresh")) {
  const packages = await fetchPackages();
  cache.packages = packages;
  cache.fetched = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2) + "\n");
  console.log(`refreshed: ${packages.length} @radix-ui/react-* packages\n`);
}

const { packages, components: componentNotes, utilities, implements: impl, machinery } = cache;

// --- classification must be total -------------------------------------------
//
// Both buckets are explicit. Deriving one as "everything that is not the other"
// would make the check a tautology that can never fail — which is exactly what
// it did on the first attempt, letting a new package slip in as a component
// with nobody looking at it.

const utilSet = new Set(Object.keys(utilities));
const compSet = new Set(Object.keys(componentNotes));
const components = packages.filter((p) => compSet.has(p));
const unclassified = packages.filter((p) => !compSet.has(p) && !utilSet.has(p));
const bothBuckets = packages.filter((p) => compSet.has(p) && utilSet.has(p));
const vanished = [...compSet, ...utilSet].filter((p) => !packages.includes(p));

const machineryOf = new Map();
for (const [need, names] of Object.entries(machinery)) {
  for (const n of names) {
    if (!machineryOf.has(n)) machineryOf.set(n, []);
    machineryOf.get(n).push(need);
  }
}

const problems = [];
for (const p of unclassified) problems.push(`${p}: new package, in neither bucket — classify it`);
for (const p of bothBuckets) problems.push(`${p}: listed as BOTH a component and a utility`);
for (const p of vanished) problems.push(`${p}: classified, but npm no longer lists it`);
for (const [p, note] of Object.entries(componentNotes)) {
  if (note === "TODO: classify") problems.push(`${p}: component with no description`);
}
for (const [radixName, ourType] of Object.entries(impl)) {
  if (!packages.includes(radixName)) problems.push(`${radixName}: mapped but no such Radix package`);
  if (!SUPPORTED_TYPES.includes(ourType)) {
    problems.push(`${radixName} → ${ourType}: build-host does not build that type`);
  }
}
for (const t of SUPPORTED_TYPES) {
  if (!Object.values(impl).includes(t)) problems.push(`${t}: built, but mapped to no Radix component`);
}
for (const names of Object.values(machinery)) {
  for (const n of names) {
    if (!components.includes(n)) problems.push(`${n}: listed under machinery but is not a component`);
  }
}
if (problems.length) {
  console.error("inventory is out of date:");
  for (const p of problems) console.error("  " + p);
  console.error("\nedit conformance/radix-inventory.json, then run again");
  process.exit(2);
}

// --- report ------------------------------------------------------------------

const done = new Set(Object.keys(impl));
const missing = components.filter((c) => !done.has(c));
const pct = (a, b) => (b ? (100 * a) / b : 0).toFixed(1) + "%";

console.log(`gallery/ui — Radix inventory (npm listing of ${cache.fetched})\n`);
console.log(`  @radix-ui/react-* packages   ${String(packages.length).padStart(3)}`);
console.log(`  internal plumbing            ${String(utilSet.size).padStart(3)}  (not components)`);
console.log(`  components                   ${String(components.length).padStart(3)}`);
console.log(`  implemented                  ${String(done.size).padStart(3)}  ${pct(done.size, components.length)}`);
console.log(`  MISSING                      ${String(missing.length).padStart(3)}\n`);

const byNeed = new Map();
for (const m of missing) {
  const needs = machineryOf.get(m) || ["—"];
  const key = needs.join(" + ");
  if (!byNeed.has(key)) byNeed.set(key, []);
  byNeed.get(key).push(m);
}
const ordered = [...byNeed.entries()].sort((a, b) => b[1].length - a[1].length);

console.log("what the missing ones need, most-blocking first");
for (const [need, names] of ordered) {
  console.log(`\n  ${need}  (${names.length})`);
  console.log("    " + names.join(", "));
}

console.log("\nimplemented");
console.log("  " + [...done].sort().join(", "));

const out = {
  fetched: cache.fetched,
  packages: packages.length,
  utilities: utilSet.size,
  components: components.length,
  implemented: [...done].sort(),
  missing,
  missingByMachinery: Object.fromEntries(ordered),
};
fs.mkdirSync(path.join(HERE, "out"), { recursive: true });
fs.writeFileSync(path.join(HERE, "out", "inventory.json"), JSON.stringify(out, null, 2) + "\n");

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  // Not a gate: a missing component is the plan, not a regression.
  process.exit(0);
}
