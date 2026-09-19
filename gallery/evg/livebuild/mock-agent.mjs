#!/usr/bin/env node
/**
 * A local agent binary with no model: it thinks on stdout and writes
 * `doc.evg.json` in the workspace, the way Codex or Claude Code would.
 *
 *   node mock-agent.mjs <workspace>
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

function writeAtomic(dest, src) {
  const tmp = dest + ".tmp";
  fs.copyFileSync(src, tmp);
  fs.renameSync(tmp, dest);
}

const delay = Number(process.env.EVG_MOCK_DELAY || 30);

console.log("Mock agent in " + ws);
console.log("The tree is doc.evg.json. I will patch it in three steps.");
for (const [thought, file] of steps) {
  console.log(thought);
  writeAtomic(path.join(ws, "doc.evg.json"), path.join(here, "fixtures", file));
  await sleep(delay);
}
// The last change goes through the tool surface rather than the file. That is
// how a live agent is asked to edit, and it is the only way the host learns
// WHAT changed instead of only that something did — the page's EVGPatch panel
// is fed by the ops this leaves behind.
const shim = path.join(ws, "evg-agent");
if (fs.existsSync(shim)) {
  fs.writeFileSync(
    path.join(ws, "ops.json"),
    JSON.stringify(
      { ops: [{ op: "set-prop", at: "0", prop: "background-color", value: "rgb(2,6,23)" }] },
      null,
      2,
    ),
  );
  console.log("Last change through EVGPatch: darken the page behind the cards.");
  const r = spawnSync(shim, ["patch", "doc.evg.json", "ops.json"], { cwd: ws, encoding: "utf8" });
  if (r.status !== 0) {
    console.log("patch failed: " + String(r.stderr || r.stdout || "").trim());
  }
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
