#!/usr/bin/env node
/**
 * Language-feature matrix: every probe in tests/features/ against every target
 * whose toolchain is installed.
 *
 *   node scripts/feature-matrix.mjs                # the matrix
 *   node scripts/feature-matrix.mjs --markdown     # ...as a README table
 *   node scripts/feature-matrix.mjs --check        # fail if a cell regressed
 *   node scripts/feature-matrix.mjs --write-baseline
 *   TARGETS=es6,rust node scripts/feature-matrix.mjs
 *   FEATURES=union_case node scripts/feature-matrix.mjs
 *
 * WHY THIS EXISTS. "Does target X work" is not a yes/no question, and the two
 * things we had were both the wrong grain: the conformance fixtures are whole
 * programs a few dozen lines long that say a target basically functions, and
 * the interpreter is 65,000 lines that says nothing at all when it fails
 * except "somewhere". A target carries a real program only if it carries the
 * FEATURES that program is built from, so each probe here isolates one --
 * union narrowing, a shape, a singleton, an optional, inheritance, a closure,
 * map order -- and the matrix says which target has it.
 *
 * A cell is one of:
 *   ok        compiled and printed exactly what the probe expects
 *   GEN       the Ranger stage refused to emit code for this target
 *   BUILD     the target's own compiler rejected the generated code
 *   RUN       it built and then failed or printed something else
 *   -         no toolchain for that target on this machine
 *
 * GEN/BUILD/RUN are three different kinds of work: a missing template, a
 * writer bug, and a semantic difference. Keeping them apart is the point.
 */
import * as fs from "fs";
import * as path from "path";
import { execFileSync, execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FEATURE_DIR = path.join(ROOT, "tests", "features");
const OUT = path.join(ROOT, "tests", ".output-features");
const BASELINE = path.join(FEATURE_DIR, "baseline.json");

/**
 * Each target: the compiler's -l= name, the extension it writes, how to tell
 * whether its toolchain is here, and how to build+run one generated file.
 *
 * `build` returns the command to run, or throws to report BUILD. `run` returns
 * stdout. Both get the generated file's directory and basename.
 */
const TARGETS = {
  es6: {
    lang: "es6",
    ext: "js",
    probe: "node --version",
    run: (dir, file) => sh(`node ${q(path.join(dir, file))}`),
  },
  python: {
    lang: "python",
    ext: "py",
    probe: "python3 --version",
    run: (dir, file) => sh(`python3 ${q(path.join(dir, file))}`),
  },
  php: {
    lang: "php",
    ext: "php",
    probe: "php --version",
    run: (dir, file) => sh(`php ${q(path.join(dir, file))}`),
  },
  go: {
    lang: "go",
    ext: "go",
    probe: "go version",
    run: (dir, file) => sh(`go run ${q(path.join(dir, file))}`, dir),
  },
  cpp: {
    lang: "cpp",
    ext: "cpp",
    probe: "g++ --version",
    build: (dir, file) =>
      sh(`g++ -std=c++17 -w ${q(path.join(dir, file))} -o ${q(path.join(dir, "a.out"))}`),
    run: (dir) => sh(q(path.join(dir, "a.out"))),
  },
  rust: {
    lang: "rust",
    ext: "rs",
    probe: "rustc --version",
    build: (dir, file) => {
      // The writer stacks .clone().clone() in places; the native build script
      // collapses the same pair. Do it here so a cosmetic wart is not reported
      // as a missing feature.
      const p = path.join(dir, file);
      fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\.clone\(\)\.clone\(\)/g, ".clone()"));
      return sh(`rustc -A warnings --edition 2021 ${q(p)} -o ${q(path.join(dir, "a.out"))}`);
    },
    run: (dir) => sh(q(path.join(dir, "a.out"))),
  },
  java: {
    lang: "java7",
    ext: "java",
    probe: "javac -version",
    // The writer emits one file per class; compile them all and run the one
    // that has a main.
    build: (dir) => sh(`javac -nowarn -d ${q(dir)} ${q(dir)}/*.java`),
    run: (dir) => {
      const main = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".java"))
        .find((f) => /static\s+void\s+main/.test(fs.readFileSync(path.join(dir, f), "utf8")));
      if (!main) throw new Error("no class with a main");
      return sh(`java -cp ${q(dir)} ${path.basename(main, ".java")}`);
    },
  },
  kotlin: {
    lang: "kotlin",
    ext: "kt",
    probe: "kotlinc -version",
    build: (dir, file) =>
      sh(`kotlinc ${q(path.join(dir, file))} -include-runtime -d ${q(path.join(dir, "a.jar"))}`),
    run: (dir) => sh(`java -jar ${q(path.join(dir, "a.jar"))}`),
  },
  dart: {
    lang: "dart",
    ext: "dart",
    probe: "dart --version",
    run: (dir, file) => sh(`dart run ${q(path.join(dir, file))}`),
  },
  scala: {
    lang: "scala",
    ext: "scala",
    probe: "scala-cli version",
    run: (dir, file) =>
      sh(`scala-cli run --server=false --scala 2.13.14 ${q(path.join(dir, file))}`),
  },
};

function q(s) {
  return `"${s}"`;
}

function sh(cmd, cwd) {
  return execSync(cmd, {
    cwd: cwd || ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 900000,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function haveToolchain(t) {
  try {
    execSync(t.probe, { stdio: ["pipe", "pipe", "pipe"], timeout: 120000 });
    return true;
  } catch {
    return false;
  }
}

/** JVM chatter and build-tool progress are not program output. */
function cleanOutput(s) {
  return s
    .split("\n")
    .filter(
      (l) =>
        !/^Picked up JAVA_TOOL_OPTIONS/.test(l) &&
        !/^(Downloading|Downloaded|Compiling|Compiled) /.test(l) &&
        !/^\[(warn|info)\]/.test(l) &&
        !/^warning: /.test(l)
    )
    .join("\n")
    .replace(/\r\n/g, "\n")
    .trimEnd();
}

/** Doubles print with different precision per target; compare their values. */
function normalize(s) {
  return cleanOutput(s).replace(/\d+\.\d+/g, (n) => {
    const v = Number(n);
    return Number.isNaN(v) ? n : v.toFixed(6);
  });
}

function generate(feature, target, dir) {
  const t = TARGETS[target];
  const out = `${feature}.${t.ext}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const rel = path.relative(ROOT, dir).replace(/\\/g, "/");
  const log = execFileSync(
    "node",
    [
      "--stack-size=8000",
      path.join(ROOT, "bin", "output.js"),
      `-l=${t.lang}`,
      `tests/features/${feature}/program.rgr`,
      `-d=${rel}`,
      `-o=${out}`,
      "-nodecli",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
      timeout: 300000,
      stdio: ["pipe", "pipe", "pipe"],
    }
  );
  if (/Compilation FAILED/.test(log)) {
    const why = (log.match(/\[FAIL\][^\n]*/g) || []).slice(0, 3).join(" | ");
    throw Object.assign(new Error(why || "Compilation FAILED"), { stage: "GEN" });
  }
  // Some writers name the file after the class rather than -o.
  if (!fs.existsSync(path.join(dir, out))) {
    const found = fs.readdirSync(dir).filter((f) => f.endsWith("." + t.ext));
    if (!found.length) throw Object.assign(new Error("no output file"), { stage: "GEN" });
    return found[0];
  }
  return out;
}

function runCell(feature, target, expected) {
  const t = TARGETS[target];
  const dir = path.join(OUT, target, feature);
  let file;
  try {
    file = generate(feature, target, dir);
  } catch (err) {
    return { state: "GEN", detail: firstLine(err.stdout || err.message) };
  }
  if (t.build) {
    try {
      t.build(dir, file);
    } catch (err) {
      return { state: "BUILD", detail: firstLine(err.stderr || err.stdout || err.message) };
    }
  }
  let output;
  try {
    output = t.run(dir, file);
  } catch (err) {
    return { state: "RUN", detail: firstLine(err.stderr || err.stdout || err.message) };
  }
  if (normalize(output) !== normalize(expected)) {
    return { state: "RUN", detail: `got ${JSON.stringify(cleanOutput(output).slice(0, 80))}` };
  }
  return { state: "ok", detail: "" };
}

function firstLine(s) {
  return String(s || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^Picked up JAVA_TOOL_OPTIONS/.test(l))
    .slice(0, 1)
    .join(" ")
    .slice(0, 160);
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const wantMarkdown = args.includes("--markdown");
const wantCheck = args.includes("--check");
const wantWrite = args.includes("--write-baseline");

const features = (
  process.env.FEATURES
    ? process.env.FEATURES.split(",")
    : fs
        .readdirSync(FEATURE_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
).sort();

const targetNames = (
  process.env.TARGETS ? process.env.TARGETS.split(",") : Object.keys(TARGETS)
).filter((n) => TARGETS[n]);

const available = {};
for (const name of targetNames) available[name] = haveToolchain(TARGETS[name]);

const results = {};
for (const feature of features) {
  const expected = fs.readFileSync(path.join(FEATURE_DIR, feature, "expected_output.txt"), "utf8");
  results[feature] = {};
  for (const name of targetNames) {
    if (!available[name]) {
      results[feature][name] = { state: "-", detail: "" };
      continue;
    }
    process.stderr.write(`  ${feature} / ${name} ... `);
    const cell = runCell(feature, name, expected);
    results[feature][name] = cell;
    process.stderr.write(`${cell.state}\n`);
  }
}

const shown = targetNames.filter((n) => available[n] || !process.env.TARGETS);

if (wantMarkdown) {
  const head = `| Feature | ${shown.join(" | ")} |`;
  const sep = `| --- | ${shown.map(() => "---").join(" | ")} |`;
  const rows = features.map((f) => {
    const cells = shown.map((n) => {
      const s = results[f][n].state;
      return s === "ok" ? "✅" : s === "-" ? "–" : `**${s}**`;
    });
    return `| \`${f}\` | ${cells.join(" | ")} |`;
  });
  console.log([head, sep, ...rows].join("\n"));
} else {
  const w = Math.max(...features.map((f) => f.length)) + 2;
  console.log("");
  console.log("feature".padEnd(w) + shown.map((n) => n.padEnd(9)).join(""));
  console.log("-".repeat(w + shown.length * 9));
  for (const f of features) {
    console.log(f.padEnd(w) + shown.map((n) => results[f][n].state.padEnd(9)).join(""));
  }
  console.log("");
  const problems = [];
  for (const f of features)
    for (const n of shown)
      if (!["ok", "-"].includes(results[f][n].state))
        problems.push(`  ${n}/${f}: ${results[f][n].state} — ${results[f][n].detail}`);
  if (problems.length) {
    console.log("details:");
    console.log(problems.join("\n"));
    console.log("");
  }
  const missing = shown.filter((n) => !available[n]);
  if (missing.length) console.log(`no toolchain: ${missing.join(", ")}`);
}

const flat = {};
for (const f of features)
  for (const n of targetNames) if (available[n]) flat[`${n}/${f}`] = results[f][n].state;

if (wantWrite) {
  fs.writeFileSync(BASELINE, JSON.stringify(flat, null, 2) + "\n");
  console.error(`baseline written: ${path.relative(ROOT, BASELINE)}`);
}

if (wantCheck) {
  if (!fs.existsSync(BASELINE)) {
    console.error("no baseline; run with --write-baseline first");
    process.exit(1);
  }
  const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
  const regressed = Object.keys(flat).filter(
    (k) => base[k] === "ok" && flat[k] !== "ok"
  );
  // A cell absent from the baseline is new work, not a regression.
  if (regressed.length) {
    console.error("REGRESSED (was ok in the baseline):");
    for (const k of regressed) console.error(`  ${k} -> ${flat[k]}`);
    process.exit(1);
  }
  const improved = Object.keys(flat).filter((k) => base[k] && base[k] !== "ok" && flat[k] === "ok");
  if (improved.length) {
    console.error("improved (update the baseline):");
    for (const k of improved) console.error(`  ${k}: ${base[k]} -> ok`);
  }
}
