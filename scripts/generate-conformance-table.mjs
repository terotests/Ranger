#!/usr/bin/env node
/**
 * Lists conformance fixtures for README / CI documentation.
 * Run: node scripts/generate-conformance-table.mjs
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const conformanceDir = path.join(root, "tests", "conformance");

const cases = fs
  .readdirSync(conformanceDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const rows = cases.map((name) => {
  const topicPath = path.join(conformanceDir, name, "program.rgr");
  const firstLine = fs.readFileSync(topicPath, "utf8").split("\n")[0] ?? "";
  const topic = firstLine.replace(/^;\s*Conformance:\s*/i, "").trim() || name;
  return `| \`${name}\` | ${topic} | ES6, Go, Kotlin (when toolchain present) |`;
});

const table = [
  "<!-- BEGIN CONFORMANCE_TABLE -->",
  "| Fixture | Topic | Targets |",
  "| --- | --- | --- |",
  ...rows,
  "<!-- END CONFORMANCE_TABLE -->",
].join("\n");

console.log(table);
