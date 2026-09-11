/**
 * d2_oracle.mjs — ask D2 what its own examples mean.
 *
 * Every file in `fixtures/d2/` is handed to **D2 itself**, laid out by both
 * bundled engines, and what comes back is what D2 understood:
 *
 *   node gallery/rangerflow/harness/oracles/d2_oracle.mjs
 *   → gallery/rangerflow/harness/out/d2.json
 *
 * D2 is the easiest of the three formats to hold an oracle against. PlantUML
 * has to be read off an annotated SVG and Mermaid off its parse database;
 * `d2lib.Compile` hands back a `*d2target.Diagram` — every shape with its
 * absolute position, size, type, level and label, every connection with its
 * arrowheads, label and route, `sql_table` columns with their constraints,
 * `class` fields with their visibility, and the nested boards `layers` /
 * `scenarios` / `steps` created. It is JSON already. So this oracle answers
 * *structure* and *geometry*, which is more than the other two can, and the
 * parity tool decides how much of that to score.
 *
 * The keyword tables come the same way: `--keywords` prints D2's own
 * `ReservedKeywords`, `Shapes` and `Arrowheads` maps, so a keyword the next
 * release adds shows up as one this reader does not know rather than hiding.
 *
 * **Licence.** D2 is MPL-2.0. The Go toolchain fetches it at the pinned
 * version into its own module cache when the oracle is built, it is run as a
 * subprocess, and no D2 source is copied into this repository. The built
 * binary lands in `harness/vendor/`, which is gitignored.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const CORPUS = path.join(ROOT, "fixtures", "d2");
const OUTDIR = path.join(ROOT, "harness", "out");
const VENDOR = path.join(ROOT, "harness", "vendor");
const OUT = path.join(OUTDIR, "d2.json");

const VERSION = "v0.7.1";
const MODULE = "oss.terrastruct.com/d2";
const BUILD = path.join(VENDOR, "d2oracle");
const BIN = path.join(BUILD, process.platform === "win32" ? "d2oracle.exe" : "d2oracle");
const LAYOUTS = ["dagre", "elk"];

/** An oracle that could not be built is a fact, not a crash. */
function unavailable(reason) {
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ available: false, reason, version: VERSION }, null, 1));
  console.error(`  d2 oracle unavailable: ${reason}`);
  process.exit(0);
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

// ------------------------------------------------------------- the binary --
function build() {
  if (fs.existsSync(BIN)) return BIN;
  try {
    run("go", ["version"]);
  } catch {
    unavailable("no go toolchain on this machine — D2 is a Go program");
  }
  fs.mkdirSync(BUILD, { recursive: true });
  fs.copyFileSync(path.join(HERE, "d2_oracle.go"), path.join(BUILD, "main.go"));
  fs.writeFileSync(path.join(BUILD, "go.mod"), `module d2oracle\n\ngo 1.23\n`);
  console.error(`  building the d2 ${VERSION} oracle (once) …`);
  try {
    const env = { ...process.env, GOFLAGS: "-mod=mod" };
    run("go", ["get", `${MODULE}@${VERSION}`], { cwd: BUILD, env });
    run("go", ["mod", "tidy"], { cwd: BUILD, env });
    run("go", ["build", "-o", BIN, "."], { cwd: BUILD, env });
  } catch (err) {
    const said = String(err.stderr ?? err.message ?? err).trim().split("\n").slice(-1)[0];
    unavailable(`could not build d2 ${VERSION}: ${said.slice(0, 160)}`);
  }
  return BIN;
}

const ORACLE = build();

// The oracle writes JSON to a path rather than to stdout, so a scratch
// directory: the fixtures live in the repository and an oracle must not write
// there.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "rf-d2-"));
const tmp = (name) => path.join(scratch, name);

function ask(args, name) {
  const file = tmp(name);
  try {
    run(ORACLE, [...args, file]);
  } catch {
    // Exit 3 means D2 refused the file and wrote its complaint to `file`.
    if (!fs.existsSync(file)) return null;
  }
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// ------------------------------------------------------------ the tables ---
const keywords = ask(["--keywords"], "keywords.json");
if (!keywords) unavailable("the oracle built but would not print D2's keyword tables");

// --------------------------------------------------------------- the corpus -
const files = fs.existsSync(CORPUS)
  ? fs.readdirSync(CORPUS).filter((f) => f.endsWith(".d2")).sort()
  : [];
if (files.length === 0) unavailable(`no .d2 files in ${CORPUS}`);

const diagrams = {};
for (const file of files) {
  const name = file.replace(/\.d2$/, "");
  const entry = { file, layouts: {} };
  for (const engine of LAYOUTS) {
    const answer = ask(["--layout", engine, path.join(CORPUS, file)], `${name}.${engine}.json`);
    if (!answer) {
      entry.layouts[engine] = { error: "the oracle produced no answer" };
      continue;
    }
    entry.layouts[engine] = answer;
  }
  const dagre = entry.layouts.dagre ?? {};
  entry.accepted = !dagre.error;
  entry.error = dagre.error ?? "";
  diagrams[name] = entry;
}

fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify({ available: true, version: VERSION, layouts: LAYOUTS, keywords, diagrams }, null, 1)
);

const ok = Object.values(diagrams).filter((d) => d.accepted).length;
const shapes = Object.values(diagrams).reduce(
  (n, d) => n + (d.layouts.dagre?.shapes?.length ?? 0), 0);
const conns = Object.values(diagrams).reduce(
  (n, d) => n + (d.layouts.dagre?.connections?.length ?? 0), 0);
console.error(
  `  d2 ${VERSION}: ${ok}/${files.length} fixtures accepted, ` +
  `${shapes} shapes and ${conns} connections laid out by ${LAYOUTS.join(" and ")}, ` +
  `${keywords.all.length} keywords, ${keywords.shapes.length} shapes, ` +
  `${keywords.arrowheads.length} arrowheads`
);
