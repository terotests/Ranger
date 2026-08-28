/**
 * The conformance gate: run every spec through both adapters and print the
 * divergences.
 *
 *   node gallery/ui/conformance/compare.mjs [spec.json ...]
 *
 * Ranger's EVG controllers and Radix's React components share no code and work
 * nothing alike — one mutates a display tree, the other re-renders a virtual
 * one. What they must agree on is what a user can observe.
 *
 * For the score rather than the detail, use `report.mjs`.
 *
 * Exit code 0 when every step of every spec matches.
 */

import { listSpecs, runSpec, loadTheme, MissingDomDeps } from "./runner.mjs";

const specs = listSpecs(process.argv.slice(2));
const css = loadTheme();
let failed = 0;

for (const spec of specs) {
  let result;
  try {
    result = await runSpec(spec, css);
  } catch (e) {
    if (e instanceof MissingDomDeps) {
      console.error("SKIP " + spec.name + " — " + e.message);
      process.exit(3);
    }
    throw e;
  }

  if (result.passed) {
    console.log(`PASS ${spec.name}  (${result.steps} steps, ${result.observations} observations)`);
    continue;
  }
  failed += 1;
  console.log(`FAIL ${spec.name}  (${result.diffs.length} divergences)`);
  for (const d of result.diffs) {
    if (d.note) {
      console.log(`  ${d.step} :: ${d.tid || ""} ${d.note}`);
    } else {
      console.log(
        `  ${d.step} :: ${d.tid}.${d.field}  ranger=${JSON.stringify(d.ranger)} radix=${JSON.stringify(d.dom)}`,
      );
    }
  }
}

if (failed > 0) {
  console.log("\nRESULT FAIL");
  process.exit(1);
}
console.log("\nRESULT OK");
