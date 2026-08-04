// ============================================================================
// pages_smoke.mjs — smoke every demo under a build-pages.mjs output dir.
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-pages.mjs --out dist/pages
//   node gallery/game_engine/v2/web/tests/pages_smoke.mjs dist/pages
//
// Reads demos.json (or discovers child dirs with index.html) and runs
// browser_smoke.mjs against each demo. Exit 0 only if every demo renders.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DIR = path.resolve(process.argv[2] || path.join(HERE, "..", "dist", "pages"));
const SMOKE = path.join(HERE, "browser_smoke.mjs");
const MS = process.argv.includes("--ms")
  ? process.argv[process.argv.indexOf("--ms") + 1]
  : "2200";

if (!fs.existsSync(DIR)) {
  console.error("[pages-smoke] missing dir:", DIR);
  process.exit(2);
}

let demos = [];
const manifest = path.join(DIR, "demos.json");
if (fs.existsSync(manifest)) {
  demos = JSON.parse(fs.readFileSync(manifest, "utf8")).map((d) => d.id);
} else {
  demos = fs
    .readdirSync(DIR)
    .filter((n) => fs.existsSync(path.join(DIR, n, "index.html")));
}

if (demos.length === 0) {
  console.error("[pages-smoke] no demos in", DIR);
  process.exit(2);
}

console.log(`[pages-smoke] ${demos.length} demo(s) under ${DIR}`);
let failed = 0;
for (const id of demos) {
  const demoDir = path.join(DIR, id);
  const shot = path.join(demoDir, "_smoke.png");
  console.log(`\n[pages-smoke] >>> ${id}`);
  try {
    execFileSync(
      process.execPath,
      [SMOKE, demoDir, "--canvas", "#screen", "--ms", MS, "--shot", shot, "--min-colors", "6"],
      { stdio: "inherit" }
    );
  } catch {
    failed += 1;
  }
}

if (failed) {
  console.error(`\n[pages-smoke] FAILED ${failed}/${demos.length}`);
  process.exit(1);
}
console.log(`\n[pages-smoke] ALL ${demos.length} RENDERED ✓`);
process.exit(0);
