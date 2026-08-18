#!/usr/bin/env node
/**
 * DOCX oracle runner:
 *
 *   B. semantic  (python-docx ↔ Ranger actual.json)
 *   C. visual    (LibreOffice → PNG ↔ Ranger SoftCanvas PNG)
 *
 *   node gallery/docx_viewer/harness/run_oracles.mjs [--fixture hello.docx] [--skip-visual] [--skip-semantic]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const DOCX = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");

function argVal(name, def = null) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return def;
}
function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

const ONLY = argVal("--fixture");
const SKIP_VISUAL = hasFlag("--skip-visual");
const SKIP_SEMANTIC = hasFlag("--skip-semantic");
const MAE = argVal("--mae-limit", "45");

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: ROOT,
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
}

function ensureDumpTool() {
  const bin = path.join(DOCX, "bin/docx_oracle_dump.js");
  if (fs.existsSync(bin)) return bin;
  const compile = run(
    "node",
    [
      "bin/output.js",
      "-es6",
      "./gallery/docx_viewer/src/docx_oracle_dump.rgr",
      `-d=./gallery/docx_viewer/bin`,
      "-o=docx_oracle_dump.js",
      "-nodecli",
    ],
    { env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" } }
  );
  if (compile.status !== 0 || (compile.stdout + compile.stderr).includes("Compilation FAILED")) {
    console.error(compile.stdout);
    console.error(compile.stderr);
    throw new Error("failed to compile docx_oracle_dump");
  }
  return bin;
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
const dumpBin = ensureDumpTool();

let semanticFails = 0;
let visualFails = 0;
let visualSkipped = 0;
const rows = [];

for (const entry of manifest.fixtures) {
  if (ONLY && entry.file !== ONLY) continue;
  const docxPath = path.join(DOCX, "fixtures", entry.file);
  const stem = entry.file.replace(/\.docx$/i, "");
  const caseOut = path.join(OUT, stem);
  const rangerDir = path.join(caseOut, "ranger");
  fs.mkdirSync(rangerDir, { recursive: true });

  console.log(`\n=== ${entry.file} ===`);
  const dump = run("node", [dumpBin, docxPath, rangerDir], {
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
  });
  if (dump.status !== 0) {
    console.log("FAIL dump");
    console.log(dump.stdout);
    console.log(dump.stderr);
    semanticFails += 1;
    visualFails += 1;
    rows.push({ file: entry.file, dump: false });
    continue;
  }
  process.stdout.write(
    (dump.stdout || "")
      .split("\n")
      .filter((l) => l.startsWith("wrote") || l.startsWith("oracle"))
      .map((l) => "  " + l)
      .join("\n") + "\n"
  );

  const inspect = path.join(rangerDir, "actual.json");
  let semOk = true;
  let visOk = true;
  let visSkip = false;
  let visRan = false;

  if (!SKIP_SEMANTIC) {
    const sem = run("python3", [
      path.join(__dirname, "oracles/semantic.py"),
      docxPath,
      "--ranger-inspect",
      inspect,
      "--out-ref",
      path.join(caseOut, "python-docx.json"),
    ]);
    process.stdout.write("  " + (sem.stdout || "").trim().split("\n").join("\n  ") + "\n");
    if (sem.status !== 0) {
      semOk = false;
      semanticFails += 1;
    }
  }

  if (!SKIP_VISUAL) {
    visRan = true;
    const vis = run("python3", [
      path.join(__dirname, "oracles/visual.py"),
      docxPath,
      "--ranger-dir",
      rangerDir,
      "--out-dir",
      caseOut,
      "--dpi",
      "96",
      "--mae-limit",
      String(MAE),
      "--skip-if-missing",
    ]);
    const out = (vis.stdout || "").trim();
    process.stdout.write("  " + out.split("\n").join("\n  ") + "\n");
    if (out.includes("SKIP visual")) {
      visSkip = true;
      visualSkipped += 1;
    } else if (vis.status !== 0) {
      visOk = false;
      visualFails += 1;
    }
  } else {
    visSkip = true;
    visualSkipped += 1;
  }

  rows.push({
    file: entry.file,
    dump: true,
    semantic: SKIP_SEMANTIC ? null : semOk,
    visual: visSkip ? "skip" : visRan ? visOk : "skip",
  });
}

console.log("\n=== oracle summary ===");
for (const r of rows) {
  console.log(
    `  ${r.file}  semantic=${r.semantic === false ? "FAIL" : r.semantic ? "PASS" : "-"}  visual=${
      r.visual === "skip" ? "SKIP" : r.visual === false ? "FAIL" : r.visual ? "PASS" : "-"
    }`
  );
}
console.log(
  `\nsemantic_fails=${semanticFails}  visual_fails=${visualFails}  visual_skipped=${visualSkipped}`
);
console.log(`artifacts: ${path.relative(ROOT, OUT)}/`);

const hardFail = semanticFails > 0;
const strictVisual = hasFlag("--strict-visual");
if (strictVisual && visualFails > 0) {
  process.exit(1);
}
process.exit(hardFail ? 1 : 0);
