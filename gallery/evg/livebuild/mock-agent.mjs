#!/usr/bin/env node
/**
 * A local agent binary with no model: it thinks on stdout and writes
 * `doc.evg.json` in the workspace, the way Codex or Claude Code would.
 *
 *   node mock-agent.mjs <workspace>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ws = process.argv[2];
if (!ws) {
  console.error("usage: mock-agent.mjs <workspace>");
  process.exit(2);
}

const steps = [
  ["Empty canvas first — a phone column, dark, with padding.", "step1.evg.json"],
  ["A header row: the product name on the left, a live badge on the right.", "step2.evg.json"],
  ["First metric: orders. A dark card, the number large, the label quiet.", "step3.evg.json"],
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const delay = Number(process.env.EVG_MOCK_DELAY || 30);

console.log("Mock agent in " + ws);
console.log("The tree is doc.evg.json. I will patch it in three steps.");
for (const [thought, file] of steps) {
  console.log(thought);
  const src = path.join(here, "fixtures", file);
  fs.copyFileSync(src, path.join(ws, "doc.evg.json"));
  await sleep(delay);
}
fs.writeFileSync(
  path.join(ws, "App.rgr"),
  `Import "EVGElement.rgr"

sfn main:void () {
  def page (EVGElement.createDiv())
  page.setAttribute("width" "390px")
}
`,
);
console.log("Done. The document is three steps in.");
