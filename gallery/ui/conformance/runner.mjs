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
import { FIELDS, diffTraces } from "./diff.mjs";

export { MissingDomDeps, FIELDS, diffTraces };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { run: runRanger } = require("./ranger-adapter.cjs");


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

export async function runSpec(spec, css = loadTheme()) {
  const ranger = runRanger(spec, css);
  const dom = await runDom(spec);
  // `ignore` lets a spec declare a field DISPUTED: out of the denominator
  // entirely, with the evidence in behaviours.json. See SPEC.md.
  const { diffs, observations, matched } = diffTraces(ranger.trace, dom.trace, spec.ignore);
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
