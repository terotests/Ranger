#!/usr/bin/env node
/**
 * Side-by-side bench: Ranger EVG SoftCanvas editor vs @hufe921/canvas-editor.
 *
 *   node run.mjs --lines 1000
 *   node run.mjs --engine ranger --lines 1000
 *   node run.mjs --engine canvas-editor --lines 1000
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, formatTable } from "./corpus.mjs";
import { runRangerBench } from "./adapters/ranger_node.mjs";
import { runCanvasEditorBench } from "./adapters/canvas_editor_chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { lines, engines } = parseArgs();

console.log(`== text_editor compare  lines=${lines}  engines=${engines.join(",")} ==`);

const results = [];
for (const eng of engines) {
  console.log(`\n-- running ${eng} --`);
  try {
    if (eng === "ranger" || eng === "ranger-evg") {
      results.push(await runRangerBench({ lines }));
    } else if (eng === "canvas-editor" || eng === "canvas_editor") {
      results.push(await runCanvasEditorBench({ lines }));
    } else {
      throw new Error("unknown engine: " + eng);
    }
    const last = results[results.length - 1];
    console.log(
      `  done host=${last.host}` +
        (last.errors ? ` errors=${last.errors.length}` : "")
    );
  } catch (e) {
    console.error(`  FAIL ${eng}:`, e && e.stack ? e.stack : e);
    results.push({
      engine: eng,
      host: "error",
      lines,
      ops: {},
      error: String(e && e.message ? e.message : e),
    });
  }
}

console.log("\n" + formatTable(results));

const outPath = path.join(__dirname, "last-results.json");
fs.writeFileSync(outPath, JSON.stringify({ lines, results, at: new Date().toISOString() }, null, 2));
console.log("wrote " + outPath);

if (results.some((r) => r.error || (r.errors && r.errors.length))) {
  process.exitCode = 1;
}
