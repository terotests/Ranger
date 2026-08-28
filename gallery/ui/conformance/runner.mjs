/**
 * Shared spec runner: one spec, both adapters, one diff.
 *
 * `compare.mjs` uses this to print divergences; `report.mjs` uses it to score
 * them. Neither owns the comparison rules — they live here, once.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { run as runDom, MissingDomDeps } from "./dom-adapter.mjs";

export { MissingDomDeps };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { run: runRanger } = require("./ranger-adapter.cjs");

/** The observable surface. Every one of these is compared literally. */
export const FIELDS = ["role", "name", "state", "expanded", "pressed", "disabled", "focused", "visible"];

export function loadTheme() {
  const p = path.join(HERE, "..", "theme", "base.css");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

export function loadCatalogue() {
  return JSON.parse(fs.readFileSync(path.join(HERE, "behaviours.json"), "utf8")).components;
}

export function listSpecs(argv = []) {
  const paths = argv.length
    ? argv
    : fs
        .readdirSync(path.join(HERE, "specs"))
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => path.join(HERE, "specs", f));
  return paths.map((p) => JSON.parse(fs.readFileSync(p, "utf8")));
}

function indexByTid(nodes) {
  const m = new Map();
  for (const n of nodes) m.set(n.tid, n);
  return m;
}

/**
 * Compare two traces field by field.
 *
 * Returns the divergences plus the counts the scorecard needs: an observation
 * is one field of one node at one step, so a spec's denominator grows with
 * both the fixture and the number of steps.
 */
export function diffTraces(rangerTrace, domTrace) {
  const diffs = [];
  let observations = 0;
  let matched = 0;
  const steps = Math.max(rangerTrace.length, domTrace.length);

  for (let i = 0; i < steps; i++) {
    const r = rangerTrace[i];
    const d = domTrace[i];
    if (!r || !d) {
      diffs.push({ step: (r || d).step, note: "step missing on " + (r ? "dom" : "ranger") });
      continue;
    }
    const rm = indexByTid(r.nodes);
    const dm = indexByTid(d.nodes);
    for (const tid of new Set([...rm.keys(), ...dm.keys()])) {
      const rn = rm.get(tid);
      const dn = dm.get(tid);
      if (!rn || !dn) {
        // A node only one side knows about fails every field at once.
        observations += FIELDS.length;
        diffs.push({ step: r.step, tid, note: "node missing on " + (rn ? "dom" : "ranger") });
        continue;
      }
      for (const f of FIELDS) {
        observations += 1;
        if (rn[f] === dn[f]) matched += 1;
        else diffs.push({ step: r.step, tid, field: f, ranger: rn[f], dom: dn[f] });
      }
    }
  }
  return { diffs, observations, matched };
}

export async function runSpec(spec, css = loadTheme()) {
  const ranger = runRanger(spec, css);
  const dom = await runDom(spec);
  const { diffs, observations, matched } = diffTraces(ranger.trace, dom.trace);
  return {
    spec,
    ranger,
    dom,
    diffs,
    observations,
    matched,
    steps: ranger.trace.length,
    passed: diffs.length === 0,
  };
}
