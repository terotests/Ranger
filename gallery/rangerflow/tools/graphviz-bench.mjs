/**
 * graphviz-bench.mjs — what the DOT references cost, before we write a reader.
 *
 * `PLAN_PLANTUML.md` started by finding an oracle and measuring it, because a
 * format you cannot ask questions of is a format you can only claim to read.
 * This is the same first step for Graphviz's DOT language, and it answers two
 * questions that decide whether the PlantUML shape works a second time:
 *
 *   1. **Which reference tells the truth?** Four open-source implementations
 *      are given the same corpus — the real Graphviz (native `dot` and the
 *      same program compiled to WebAssembly), and two pure-JavaScript DOT
 *      parsers. `fixtures/graphviz/` is what Graphviz accepts,
 *      `fixtures/graphviz/bad/` is what it rejects, and a reference that
 *      disagrees with Graphviz on either list cannot be an oracle: it would
 *      score RangerFlow against its own bugs.
 *
 *   2. **What does asking cost?** PlantUML answers in ≈33 ms per diagram and
 *      needs a JVM and a 22 MB jar. If Graphviz answers for a fraction of that
 *      with no external process, the corpus can be far larger than PlantUML's
 *      and the oracle can run on every test, not on demand.
 *
 *   npm run rangerflow:graphviz:bench
 *   npm run rangerflow:graphviz:bench -- --runs 9   # more samples, same median
 *
 * → `docs/GRAPHVIZ_BENCH.md`, regenerated, never hand-edited.
 *
 * **Licence.** Graphviz is EPL-1.0. Every reference here is installed by npm
 * into the gitignored `harness/node_modules/`, or found on the machine, and is
 * run as a subprocess or as a sandboxed WebAssembly module — never linked into
 * RangerFlow, never vendored, and no Graphviz source is read or copied. What a
 * future reader knows about DOT it will learn from the published grammar and
 * from Graphviz's observable verdicts, which is the rule the PlantUML work set.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const CORPUS = path.join(ROOT, "fixtures", "graphviz");
const HARNESS = path.join(ROOT, "harness");
const DOC = path.join(ROOT, "docs", "GRAPHVIZ_BENCH.md");

const argv = process.argv.slice(2);
const RUNS = Number(argv[argv.indexOf("--runs") + 1]) || 5;
const N = Number(argv[argv.indexOf("--diagrams") + 1]) || 500;

// The references live in harness/node_modules, and this file does not: node
// resolves a bare import upward from the importer, which would look in the
// gallery and in the repository root. So they are resolved from the harness
// explicitly rather than by accident of directory depth.
const harnessRequire = createRequire(path.join(HARNESS, "package.json"));
/** The version a reference reports about itself, not one written down here. */
function versionOf(name) {
  // `require(name + "/package.json")` is refused by packages that declare
  // `exports` without it, so the manifest is read as the file it is.
  const manifest = path.join(HARNESS, "node_modules", ...name.split("/"), "package.json");
  return fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")).version : "?";
}

async function reference(name) {
  try {
    return await import(pathToFileURL(harnessRequire.resolve(name)).href);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------- the corpus --
const good = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".gv")).sort();
const bad = fs.existsSync(path.join(CORPUS, "bad"))
  ? fs.readdirSync(path.join(CORPUS, "bad")).filter((f) => f.endsWith(".gv")).sort()
  : [];
if (good.length === 0) {
  console.error(`  no DOT fixtures in ${CORPUS} — nothing to measure`);
  process.exit(1);
}
const src = (f) => fs.readFileSync(path.join(CORPUS, f), "utf8");
const srcBad = (f) => fs.readFileSync(path.join(CORPUS, "bad", f), "utf8");

// One fixture is a 200-node graph, and averaging it in with fifteen six-line
// diagrams would measure it rather than them. It is timed on its own instead.
const BIG = "14_big_flat.gv";
const small = good.filter((f) => f !== BIG);
const bigSrc = fs.existsSync(path.join(CORPUS, BIG)) ? src(BIG) : null;

/** `N` diagrams, cycled from the small fixtures — the throughput corpus. */
const stream = Array.from({ length: N }, (_, i) => src(small[i % small.length]));
const streamBytes = stream.reduce((a, s) => a + s.length, 0);

// Native Graphviz reads files, not strings, so the same corpus is staged on
// disk. It goes to a temp directory: 500 copies of a fixture are not a
// repository's business.
const STAGE = fs.mkdtempSync(path.join(os.tmpdir(), "rangerflow-dot-"));
const streamFiles = stream.map((s, i) => {
  const p = path.join(STAGE, `d${i}.gv`);
  fs.writeFileSync(p, s);
  return p;
});

// ------------------------------------------------------------ the clock ----
const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
/** Milliseconds, at the precision the number deserves and no further. */
const ms = (x) => (x >= 10 ? x.toFixed(0) : x.toFixed(x >= 1 ? 2 : 3));
function time(fn, runs = RUNS) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const t = performance.now();
    fn();
    samples.push(performance.now() - t);
  }
  return median(samples);
}

// ------------------------------------------------------- the references ----
/** Native Graphviz, if this machine has it. */
function nativeDot() {
  const probe = spawnSync("dot", ["-V"], { encoding: "utf8" });
  if (probe.error) return null;
  // `dot -V` prints its version to stderr, which is where a version banner has
  // gone since 1989 and is not an error.
  return { version: (probe.stderr || probe.stdout || "").trim() };
}

const dot = nativeDot();
const wasm = await reference("@hpcc-js/wasm-graphviz");
const dotparser = await reference("dotparser");
const tsAst = await reference("@ts-graphviz/ast");

let gv = null;
let wasmLoadMs = 0;
if (wasm) {
  const t = performance.now();
  gv = await wasm.Graphviz.load();
  wasmLoadMs = performance.now() - t;
}

const missing = [
  !dot && "native `dot` (apt-get install graphviz) — the CLI row is skipped",
  !wasm && "`@hpcc-js/wasm-graphviz` — run `cd gallery/rangerflow/harness && npm install`",
  !dotparser && "`dotparser` — run `cd gallery/rangerflow/harness && npm install`",
  !tsAst && "`@ts-graphviz/ast` — run `cd gallery/rangerflow/harness && npm install`",
].filter(Boolean);

if (!dot && !wasm && !dotparser && !tsAst) {
  console.error("  no DOT reference on this machine — nothing to measure against");
  fs.writeFileSync(DOC, "# DOT references — not measured\n\n> " +
    missing.join("\n> ") + "\n\nA number written here anyway would be a number nobody computed.\n");
  process.exit(0);
}

/** Every reference, as one question: does it accept this text, and how fast. */
const refs = [];
if (dot) {
  refs.push({
    key: "dot-cli-parse",
    name: "graphviz `dot -Tcanon` (native, parse only)",
    kind: "graphviz",
    accepts: (text) => spawnSync("dot", ["-Tcanon", "-o", process.platform === "win32" ? "NUL" : "/dev/null"],
      { input: text, encoding: "utf8" }).status === 0,
    // One process for the whole corpus, so the measurement is parsing rather
    // than 500 × fork/exec. The fixed cost is reported beside it.
    stream: () => execFileSync("dot", ["-Tcanon", "-o", "/dev/null", ...streamFiles], { stdio: "ignore" }),
    one: (text) => spawnSync("dot", ["-Tcanon", "-o", "/dev/null"], { input: text }),
  });
  refs.push({
    key: "dot-cli-render",
    name: "graphviz `dot -Tsvg` (native, parse + layout + render)",
    kind: "graphviz",
    stream: () => execFileSync("dot", ["-Tsvg", "-o", "/dev/null", ...streamFiles], { stdio: "ignore" }),
    one: (text) => spawnSync("dot", ["-Tsvg", "-o", "/dev/null"], { input: text }),
  });
}
if (gv) {
  refs.push({
    key: "wasm-canon",
    name: "graphviz wasm `canon` (in process, parse only)",
    kind: "graphviz",
    accepts: (text) => { try { gv.layout(text, "canon", "dot"); return true; } catch { return false; } },
    stream: () => { for (const s of stream) gv.layout(s, "canon", "dot"); },
    one: (text) => gv.layout(text, "canon", "dot"),
  });
  refs.push({
    key: "wasm-json0",
    name: "graphviz wasm `json0` (in process, parse → structure)",
    kind: "graphviz",
    stream: () => { for (const s of stream) gv.layout(s, "json0", "dot"); },
    one: (text) => gv.layout(text, "json0", "dot"),
  });
  refs.push({
    key: "wasm-svg",
    name: "graphviz wasm `svg` (in process, parse + layout + render)",
    kind: "graphviz",
    stream: () => { for (const s of stream) gv.layout(s, "svg", "dot"); },
    one: (text) => gv.layout(text, "svg", "dot"),
  });
}
if (dotparser) {
  const parse = dotparser.default ?? dotparser;
  refs.push({
    key: "dotparser",
    name: "dotparser (pure JS, MIT) → AST",
    kind: "js",
    accepts: (text) => { try { parse(text); return true; } catch { return false; } },
    stream: () => { for (const s of stream) parse(s); },
    one: (text) => parse(text),
  });
}
if (tsAst) {
  refs.push({
    key: "ts-graphviz-ast",
    name: "@ts-graphviz/ast (pure JS, MIT) → AST",
    kind: "js",
    accepts: (text) => { try { tsAst.parse(text); return true; } catch { return false; } },
    stream: () => { for (const s of stream) { try { tsAst.parse(s); } catch { /* counted in the verdict table */ } } },
    one: (text) => { try { tsAst.parse(text); } catch { /* as above */ } },
  });
}

// -------------------------------------------------------- what they read ---
/**
 * The verdict table: one row per fixture, one column per reference that has an
 * opinion about whether a file is DOT. Graphviz's column is the answer; the
 * others are scored against it, because a reader built against a parser that
 * accepts what Graphviz rejects would be a reader that invents syntax.
 */
const judges = refs.filter((r) => r.accepts);
const verdicts = [];
for (const f of good) verdicts.push({ file: f, valid: true, by: judges.map((r) => r.accepts(src(f))) });
for (const f of bad) verdicts.push({ file: `bad/${f}`, valid: false, by: judges.map((r) => r.accepts(srcBad(f))) });

const truth = judges.findIndex((r) => r.kind === "graphviz");
const agreement = judges.map((_, i) =>
  verdicts.filter((v) => truth < 0 ? v.by[i] === v.valid : v.by[i] === v.by[truth]).length);

// ----------------------------------------------------------- throughput ----
const results = [];
for (const r of refs) results.push({ ...r, ms: time(r.stream, r.kind === "graphviz" && r.key.startsWith("dot-cli") ? 3 : RUNS) });

// A process that is started 500 times pays its startup 500 times, and a
// benchmark that hides a rival's fixed cost — or charges it twice — is not one.
const startupMs = dot ? time(() => spawnSync("dot", ["-V"]), RUNS) : 0;

// The native rows below start a process per graph, so they carry the startup
// cost the corpus rows had amortised. Said on the row rather than subtracted:
// a reader of one table should not have to remember a sentence from another.
const bigMs = bigSrc
  ? refs.map((r) => ({
      name: r.name + (r.key.startsWith("dot-cli") ? ` (incl. ${ms(startupMs)} ms process start)` : ""),
      ms: time(() => r.one(bigSrc), RUNS),
    }))
  : [];

// ----------------------------------------------------------------- report --
const cpu = os.cpus()[0]?.model?.replace(/\s+/g, " ").trim() ?? "unknown cpu";
const when = new Date().toISOString().slice(0, 10);

const lines = [];
const say = (s = "") => { lines.push(s); console.log(s); };

say(`# The DOT references, measured`);
say();
say(`> Generated by \`npm run rangerflow:graphviz:bench\` on ${when}. Never hand-edited.`);
say(`> ${cpu} · node ${process.version} · ${os.platform()} ${os.release()}`);
say();
say(`Corpus: **${good.length} fixtures** Graphviz accepts and **${bad.length}** it rejects, in`);
say(`\`fixtures/graphviz/\`. Throughput is measured over **${N} diagrams** (${streamBytes} bytes,`);
say(`${Math.round(streamBytes / N)} B average) cycled from the ${small.length} small ones, median of ${RUNS} runs.`);
say();
if (missing.length) {
  say(`Not measured on this machine:`);
  for (const m of missing) say(`- ${m}`);
  say();
}
say(`| reference | version | licence |`);
say(`| --- | --- | --- |`);
if (dot) say(`| native \`dot\` | ${dot.version} | EPL-1.0 |`);
if (gv) say(`| \`@hpcc-js/wasm-graphviz\` | graphviz ${gv.version()}, package ${versionOf("@hpcc-js/wasm-graphviz")} | Apache-2.0 wrapper, EPL-1.0 inside |`);
if (dotparser) say(`| \`dotparser\` | ${versionOf("dotparser")} | MIT |`);
if (tsAst) say(`| \`@ts-graphviz/ast\` | ${versionOf("@ts-graphviz/ast")} | MIT |`);
say();

say(`## Who reads DOT the way Graphviz does`);
say();
say(`${good.length} files Graphviz accepts, ${bad.length} it rejects. ✓ means the reference agreed with`);
say(`Graphviz — not that it liked the file.`);
say();
say(`| fixture | Graphviz says | ${judges.map((r) => r.name.replace(/ \(.*/, "")).join(" | ")} |`);
say(`| --- | --- | ${judges.map(() => "---").join(" | ")} |`);
for (const v of verdicts) {
  const mark = (ok, i) => (truth >= 0 && i === truth ? (ok ? "accepts" : "rejects") : ok === v.by[truth] ? "✓" : (ok ? "**accepts**" : "**rejects**"));
  say(`| \`${v.file}\` | ${v.by[truth] ? "accepts" : "rejects"} | ${v.by.map(mark).join(" | ")} |`);
}
say();
say(`| reference | agrees with Graphviz |`);
say(`| --- | --- |`);
judges.forEach((r, i) => say(`| ${r.name} | ${agreement[i]} / ${verdicts.length} |`));
say();

say(`## What asking costs`);
say();
say(`| reference | ${N} diagrams | per diagram |`);
say(`| --- | --- | --- |`);
for (const r of results) say(`| ${r.name} | ${ms(r.ms)} ms | **${ms(r.ms / N)} ms** |`);
say();
const disagreeing = judges.map((r, i) => [r, verdicts.filter((v, k) => good.includes(verdicts[k].file) && v.by[i] !== v.by[truth]).length]).filter(([, n]) => n > 0);
for (const [r, n] of disagreeing) {
  say(`${r.name} throws on ${n} of the ${small.length} fixtures in the stream, so ${Math.round(n / small.length * N)} of its`);
  say(`${N} answers are a thrown error rather than an AST. That is cheaper than parsing, and its`);
  say(`row is therefore a flattering number, not a comparable one.`);
  say();
}
if (dot) {
  say(`\`dot -V\` alone — one process, no diagram — is **${ms(startupMs)} ms**, and the two native rows`);
  say(`above are one process for the whole corpus. Started once per diagram instead, the`);
  say(`CLI would pay that ${N} times over: **${ms(startupMs)} ms/diagram** of fixed cost before any DOT is read.`);
  say();
}
if (gv) {
  say(`The WebAssembly module loads once, in **${ms(wasmLoadMs)} ms**, and then answers in process —`);
  say(`no fork, no exec, no JVM, and the same answers as the native program (the table above).`);
  say();
}
if (bigMs.length) {
  say(`One 200-node, 199-edge graph (${bigSrc.length} B), median of ${RUNS}:`);
  say();
  say(`| reference | one graph |`);
  say(`| --- | --- |`);
  for (const b of bigMs) say(`| ${b.name} | ${ms(b.ms)} ms |`);
  say();
}
say(`For scale, the numbers the PlantUML work measured on the same shape of corpus:`);
say(`**≈33 ms/diagram** to parse (\`-checkonly\`) and **≈70 ms/diagram** to render, plus a`);
say(`0.19 s JVM start and a 22 MB jar fetched on demand. See \`PLAN_PLANTUML.md\` §8.`);
say();

fs.writeFileSync(DOC, lines.join("\n") + "\n");
fs.rmSync(STAGE, { recursive: true, force: true });
console.error(`\n  → ${path.relative(process.cwd(), DOC)}`);
