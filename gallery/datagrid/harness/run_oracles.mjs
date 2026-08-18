#!/usr/bin/env node
/**
 * DataGrid / XLSX oracle runner
 *
 *   A. Ranger unit tests (invoked separately via npm)
 *   B. openpyxl semantic oracle
 *   C. LibreOffice visual MAE (SKIP if LO missing)
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const DG = path.resolve(__dirname, "..");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd: ROOT, ...opts });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

const fixtures = [
  { file: "business-workbook.xlsx", name: "business" },
  { file: "formats.xlsx", name: "formats" },
  { file: "merged.xlsx", name: "merged" },
];

let failed = 0;
for (const f of fixtures) {
  const xlsx = path.join(DG, "fixtures", f.file);
  const outDir = path.join(__dirname, "out", f.name);
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "inspect.json");
  const pngPath = path.join(outDir, "ranger.png");

  console.log("\n==", f.file, "==");
  // Dump via compiled oracle if present, else skip dump and only semantic if inspect exists
  const dumpJs = path.join(DG, "bin/xlsx_oracle_dump.js");
  if (fs.existsSync(dumpJs)) {
    // rewrite args by env — dump uses defaults; copy for non-business
    const st = run("node", [
      dumpJs,
      "--xlsx",
      xlsx,
      "--json",
      jsonPath,
    ]);
    if (st !== 0) failed++;
  }

  if (fs.existsSync(jsonPath)) {
    const st = run("python3", [
      path.join(__dirname, "oracles/semantic.py"),
      xlsx,
      "--ranger",
      jsonPath,
      "--out",
      path.join(outDir, "openpyxl.json"),
    ]);
    if (st !== 0) failed++;
  } else {
    console.log("SKIP semantic (no inspect.json — run datagrid:oracle:dump)");
  }

  if (fs.existsSync(pngPath)) {
    run("python3", [
      path.join(__dirname, "oracles/visual.py"),
      xlsx,
      "--ranger-png",
      pngPath,
      "--out-dir",
      outDir,
    ]);
  } else {
    console.log("SKIP visual (no ranger.png)");
  }
}

console.log(failed === 0 ? "\nORACLES DONE" : "\nORACLES HAD FAILURES");
process.exit(failed === 0 ? 0 : 1);
