/**
 * The conformance gate: run one spec through both adapters and diff the
 * behaviour traces.
 *
 *   node gallery/ui/conformance/compare.mjs [spec.json ...]
 *
 * Ranger's EVG controllers and Radix's React components share no code and work
 * nothing alike — one mutates a display tree, the other re-renders a virtual
 * one. What they must agree on is what a user can observe: role, name, state,
 * expanded/pressed, disabled, focus and visibility, after every input.
 *
 * Exit code 0 when every step of every spec matches.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { run as runDom, MissingDomDeps } from "./dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { run: runRanger } = require("./ranger-adapter.cjs");

const FIELDS = ["role", "name", "state", "expanded", "pressed", "disabled", "focused", "visible"];

function indexByTid(nodes) {
  const m = new Map();
  for (const n of nodes) m.set(n.tid, n);
  return m;
}

function diffTraces(ranger, dom) {
  const diffs = [];
  const steps = Math.max(ranger.length, dom.length);
  for (let i = 0; i < steps; i++) {
    const r = ranger[i];
    const d = dom[i];
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
        diffs.push({ step: r.step, tid, note: "node missing on " + (rn ? "dom" : "ranger") });
        continue;
      }
      for (const f of FIELDS) {
        if (rn[f] !== dn[f]) {
          diffs.push({ step: r.step, tid, field: f, ranger: rn[f], dom: dn[f] });
        }
      }
    }
  }
  return diffs;
}

function specPaths(argv) {
  if (argv.length) return argv;
  const dir = path.join(HERE, "specs");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));
}

let failed = 0;
const themePath = path.join(HERE, "..", "theme", "base.css");
const css = fs.existsSync(themePath) ? fs.readFileSync(themePath, "utf8") : "";

for (const specPath of specPaths(process.argv.slice(2))) {
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const ranger = runRanger(spec, css);
  let dom;
  try {
    dom = await runDom(spec);
  } catch (e) {
    if (e instanceof MissingDomDeps) {
      console.error("SKIP " + spec.name + " — " + e.message);
      process.exit(3);
    }
    throw e;
  }

  const diffs = diffTraces(ranger.trace, dom.trace);
  const steps = ranger.trace.length;
  const nodes = ranger.trace.reduce((n, s) => n + s.nodes.length, 0);
  if (diffs.length === 0) {
    console.log(`PASS ${spec.name}  (${steps} steps, ${nodes} observations)`);
  } else {
    failed += 1;
    console.log(`FAIL ${spec.name}  (${diffs.length} divergences)`);
    for (const d of diffs) {
      if (d.note) {
        console.log(`  ${d.step} :: ${d.tid || ""} ${d.note}`);
      } else {
        console.log(`  ${d.step} :: ${d.tid}.${d.field}  ranger=${JSON.stringify(d.ranger)} radix=${JSON.stringify(d.dom)}`);
      }
    }
  }
}

if (failed > 0) {
  console.log("\nRESULT FAIL");
  process.exit(1);
}
console.log("\nRESULT OK");
