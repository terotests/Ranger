#!/usr/bin/env node
/**
 * Pack compiler/*.rgr for the in-tab VirtualCompiler sample.
 * Tests, issue repros and backups stay out — they are not what VirtualCompiler
 * Imports. Lang.rgr is already in compileEnv.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../../../..");
const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "dist/compilerSources.json");
const srcDir = path.join(rangerRoot, "compiler");

function skipName(name) {
  if (!name.endsWith(".rgr")) return true;
  if (name === "Lang.rgr") return true;
  if (name.startsWith("test_")) return true;
  if (name.startsWith("issue_")) return true;
  if (name === "feature_tests.rgr") return true;
  if (name.includes("_backup.")) return true;
  if (name.endsWith("Orig.rgr")) return true;
  return false;
}

const files = {};
for (const name of fs.readdirSync(srcDir).sort()) {
  if (skipName(name)) continue;
  files[name] = fs.readFileSync(path.join(srcDir, name), "utf8");
}

if (!files["VirtualCompiler.rgr"]) {
  throw new Error("compiler/VirtualCompiler.rgr missing from the pack");
}
if (!files["ng_RangerFlowParser.rgr"]) {
  throw new Error("compiler/ng_RangerFlowParser.rgr missing from the pack");
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ files }));
const n = Object.keys(files).length;
const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log("  compilerSources.json " + n + " files, " + kb + " KB");
