/**
 * memory.mjs — one engine, one form, one number.
 *
 * Run as a child process by `timings.mjs` so neither engine's heap is measured
 * through the other's garbage. Requires `--expose-gc`.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [which, branchesArg] = process.argv.slice(2);
const BRANCHES = parseInt(branchesArg, 10);
const TODAY = Math.floor(Date.UTC(2026, 0, 1) / 86400000);

const { branchingForm } = await import(pathToFileURL(path.join(HERE, "timings-forms.mjs")).href);
const spec = branchingForm(BRANCHES);

let held;
if (which === "ranger") {
  const R = await import(pathToFileURL(path.join(HERE, "..", "bin", "bench_runner.cjs")).href);
  const reader = R.SurveyReader.read(JSON.stringify(spec));
  const engine = R.FormEngine.load(reader.form, reader.host);
  held = [engine, engine.start(TODAY)];
} else {
  const { Model } = await import("survey-core");
  const s = new Model(spec);
  s.clearInvisibleValues = "none";
  s.getAllQuestions();
  held = [s];
}

if (global.gc) { global.gc(); global.gc(); }
console.log("heap " + process.memoryUsage().heapUsed);
if (!held) process.exit(1);
