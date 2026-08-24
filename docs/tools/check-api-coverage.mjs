#!/usr/bin/env node
/**
 * Does the JavaScript package still expose what the reference describes?
 *
 * The page is generated from the Ranger facade and a reader installs the npm
 * package, so the two have to stay in step. Nothing enforced that: a method
 * added to `PptxApi.rgr` and forgotten in `index.cjs` would appear on the page
 * as something to call, and calling it would be a TypeError.
 *
 * The check is a name scan of the wrapper source rather than a load-and-poke
 * of the module, and deliberately so: the compiled bundles are gitignored, so
 * a documentation build on a clean checkout has no module to load, and a check
 * that quietly skips itself when its input is missing is worse than none.
 *
 * Exits non-zero on a gap, so `docs:generate` stops rather than publishing a
 * page describing methods that are not there.
 */
import fs from "node:fs";
import path from "node:path";
import { DATA, DOCS, ROOT, readJson } from "./lib/paths.mjs";

let problems = 0;

function check(api) {
  const model = readJson(path.join(DATA, `${api.id}-api.json`));
  for (const entry of model.entries) {
    const js = entry.js || {};
    if (!js.wrapper) {
      console.log(`  ${entry.file}: no wrapper recorded, nothing to check`);
      continue;
    }
    const wrapperFile = path.join(ROOT, js.wrapper);
    if (!fs.existsSync(wrapperFile)) {
      console.error(`  MISSING  ${js.wrapper} — recorded in docs/api-sources.json and not on disk`);
      problems++;
      continue;
    }
    const src = fs.readFileSync(wrapperFile, "utf8");
    for (const cls of entry.classes) {
      const owner = (js.classes && js.classes[cls.name]) || cls.name;
      // The class itself has to exist under the name the page prints.
      if (!new RegExp(`\\b(class|const)\\s+${owner}\\b`).test(src)) {
        console.error(`  MISSING  ${owner} (${cls.name}) is on the page and not in ${js.wrapper}`);
        problems++;
        continue;
      }
      for (const m of cls.methods) {
        if (m.internal) continue;
        const name = (js.renames && js.renames[`${cls.name}.${m.name}`]) || m.name;
        // A method, a getter, or a shorthand property — any of the three.
        const found =
          new RegExp(`\\b${name}\\s*\\(`).test(src) ||
          new RegExp(`\\bget\\s+${name}\\b`).test(src) ||
          new RegExp(`\\b${name}\\s*:`).test(src);
        if (!found) {
          console.error(`  MISSING  ${owner}.${name} is on the page and not in ${js.wrapper}`);
          problems++;
        }
      }
    }
  }
}

const registry = readJson(path.join(DOCS, "api-sources.json"));
for (const api of registry.apis) check(api);

if (problems) {
  console.error(`\n${problems} documented name(s) the JavaScript package does not expose.`);
  console.error("Either add them to the wrapper or mark them `; @internal` in the Ranger source.");
  process.exit(1);
}
console.log("  every documented name is in the JavaScript package");
