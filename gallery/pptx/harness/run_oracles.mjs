#!/usr/bin/env node
/**
 * PPTX oracle runner — three correctness layers:
 *
 *   A. feature/manifest checks   (existing run.mjs)
 *   B. semantic (python-pptx vs Ranger inspect.json)
 *   C. visual   (LibreOffice → PNG vs Ranger SoftCanvas PNG)
 *
 *   npm run pptx:oracles
 *   node gallery/pptx/harness/run_oracles.mjs [--fixture 01-text.pptx] [--skip-visual]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const PPTX = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const require = createRequire(import.meta.url);

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
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: ROOT,
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
  return r;
}

function ensureDumpTool() {
  const bin = path.join(PPTX, "bin/pptx_oracle_dump.js");
  if (fs.existsSync(bin)) return bin;
  const compile = run("node", [
    "bin/output.js",
    "-es6",
    "./gallery/pptx/src/pptx_oracle_dump.rgr",
    `-d=./gallery/pptx/bin`,
    "-o=pptx_oracle_dump.js",
    "-nodecli",
  ], { env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" } });
  if (compile.status !== 0 || (compile.stdout + compile.stderr).includes("Compilation FAILED")) {
    console.error(compile.stdout);
    console.error(compile.stderr);
    throw new Error("failed to compile pptx_oracle_dump");
  }
  return bin;
}

function ensureModule() {
  const mod = path.join(PPTX, "bin/pptx_app_module.cjs");
  if (fs.existsSync(mod)) return;
  const r = run("npm", ["run", "pptx:module"]);
  if (r.status !== 0) throw new Error("pptx:module failed");
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
const dumpBin = ensureDumpTool();
ensureModule();

// Baseline feature harness (layer A-lite already in run.mjs — invoke it)
console.log("=== A. feature harness ===");
const feat = run("node", [path.join(__dirname, "run.mjs"), ...(ONLY ? ["--fixture", ONLY] : [])]);
process.stdout.write(feat.stdout || "");
if (feat.status !== 0) {
  console.error(feat.stderr || "");
}

let semanticFails = 0;
let visualFails = 0;
let visualSkipped = 0;
const rows = [];

for (const entry of manifest.fixtures) {
  if (ONLY && entry.file !== ONLY) continue;
  const pptxPath = path.join(PPTX, "fixtures", entry.file);
  const stem = entry.file.replace(/\.pptx$/i, "");
  const caseOut = path.join(OUT, stem);
  const rangerDir = path.join(caseOut, "ranger");
  fs.mkdirSync(rangerDir, { recursive: true });

  console.log(`\n=== ${entry.file} ===`);
  const dump = run("node", [dumpBin, pptxPath, rangerDir], {
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

  const inspect = path.join(rangerDir, "inspect.json");
  let semOk = true;
  let visOk = true;
  let visSkip = false;

  if (!SKIP_SEMANTIC) {
    const sem = run("python3", [
      path.join(__dirname, "oracles/semantic.py"),
      pptxPath,
      "--ranger-inspect",
      inspect,
      "--out-ref",
      path.join(caseOut, "python-pptx.json"),
    ]);
    process.stdout.write("  " + (sem.stdout || "").trim().split("\n").join("\n  ") + "\n");
    if (sem.status !== 0) {
      semOk = false;
      semanticFails += 1;
    }
  }

  let maeVals = [];
  let maxErr = null;
  if (!SKIP_VISUAL) {
    const vis = run("python3", [
      path.join(__dirname, "oracles/visual.py"),
      pptxPath,
      "--ranger-dir",
      rangerDir,
      "--out-dir",
      caseOut,
      "--dpi",
      "96",
      "--mae-limit",
      String(MAE),
      "--skip-if-missing",
      "--json",
    ]);
    let visJson = null;
    try {
      visJson = JSON.parse((vis.stdout || "").trim().split("\n").pop());
    } catch {
      visJson = null;
    }
    if (visJson && visJson.skipped) {
      process.stdout.write("  SKIP visual\n");
      visSkip = true;
      visualSkipped += 1;
    } else if (visJson) {
      for (const s of visJson.slides || []) {
        const mark = s.ok ? "ok" : "DIFF";
        process.stdout.write(
          `  ${mark}  ${s.slide}  mae=${s.mae} max=${s.max} sizes=${JSON.stringify(s.refSize)}/${JSON.stringify(s.rangerSize)}\n`
        );
        if (typeof s.mae === "number") maeVals.push(s.mae);
        if (typeof s.max === "number") maxErr = maxErr == null ? s.max : Math.max(maxErr, s.max);
      }
      if (!visJson.ok) {
        visOk = false;
        visualFails += 1;
        for (const f of visJson.fails || []) process.stdout.write("  · " + f + "\n");
      } else {
        process.stdout.write("  PASS visual\n");
      }
    } else {
      const out = (vis.stdout || "").trim();
      process.stdout.write("  " + out.split("\n").join("\n  ") + "\n");
      if (out.includes("SKIP visual")) {
        visSkip = true;
        visualSkipped += 1;
      } else if (vis.status !== 0) {
        visOk = false;
        visualFails += 1;
      }
    }
  }

  const inspectObj = JSON.parse(fs.readFileSync(inspect, "utf8"));
  rows.push({
    file: entry.file,
    dump: true,
    semantic: semOk,
    visual: visSkip ? "skip" : visOk,
    mae: maeVals.length ? Math.max(...maeVals) : null,
    maeAvg: maeVals.length ? maeVals.reduce((a, b) => a + b, 0) / maeVals.length : null,
    maxError: maxErr,
    dims: `${inspectObj.slideWidth}x${inspectObj.slideHeight}pt`,
    features: (entry.features || []).join(","),
  });
}

console.log("\n=== oracle summary ===");
for (const r of rows) {
  const maeStr = r.mae == null ? "-" : `mae_max=${r.mae.toFixed(1)} avg=${(r.maeAvg || 0).toFixed(1)}`;
  console.log(
    `  ${r.file}  semantic=${r.semantic === false ? "FAIL" : r.semantic ? "PASS" : "-"}  visual=${
      r.visual === "skip" ? "SKIP" : r.visual === false ? "FAIL" : r.visual ? "PASS" : "-"
    }  ${maeStr}  ${r.dims || ""}  [${r.features || ""}]`
  );
}
console.log(
  `\nfeature=${feat.status === 0 ? "PASS" : "FAIL"}  semantic_fails=${semanticFails}  visual_fails=${visualFails}  visual_skipped=${visualSkipped}`
);
console.log(`artifacts: ${path.relative(ROOT, OUT)}/`);

const hardFail = feat.status !== 0 || semanticFails > 0;
// Visual diffs are advisory until fidelity rises — fail only if --strict-visual
const strictVisual = hasFlag("--strict-visual");
if (strictVisual && visualFails > 0) {
  process.exit(1);
}
process.exit(hardFail ? 1 : 0);
