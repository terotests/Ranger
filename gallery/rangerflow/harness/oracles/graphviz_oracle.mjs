/**
 * graphviz_oracle.mjs — ask Graphviz what its own examples mean.
 *
 * Parity with a format is not a claim you can make from the outside, so the
 * reference answers here are not written down. Every file in
 * `fixtures/graphviz/` is handed to **Graphviz itself**, and what comes back is
 * what Graphviz understood.
 *
 *   node gallery/rangerflow/harness/oracles/graphviz_oracle.mjs
 *   → gallery/rangerflow/harness/out/graphviz.json
 *
 * Graphviz needs no persuading to describe itself: `-Tjson0` **is** its parse
 * result. Every node, every edge by endpoint, every subgraph with its
 * membership, and every attribute *after default resolution* —
 *
 *   { "name":"cluster_core", "nodes":[1,2] }
 *   { "_gvid":1, "name":"Web", "shape":"box" }
 *   { "tail":1, "head":2, "label":"http" }
 *
 * — which is the half a reader can be wrong about. The default resolution is
 * the valuable part: `node [shape=box]` applies to the nodes declared after it
 * in that subgraph and not to a sibling, and this is the only place that
 * answer can be checked rather than assumed.
 *
 * **The oracle runs in process.** `@hpcc-js/wasm-graphviz` is the same program
 * as the `dot` on the machine, compiled to WebAssembly: no JVM, no subprocess,
 * 0.3 ms an answer (`docs/GRAPHVIZ_BENCH.md`). Where a native `dot` exists its
 * verdicts are read too and any disagreement between the two is reported — two
 * builds of one program differing is worth knowing about.
 *
 * **What is NOT asked for.** Geometry. `-Tjson0` reports `pos`, `width`,
 * `height`, `bb` and `lp` whichever engine runs, so a position the author
 * wrote and one the layout computed are the same field, and neither is
 * RangerFlow's business — it lays a diagram out its own way. Those keys are
 * dropped here rather than compared, and `docs/GRAPHVIZ_PARITY.md` says so.
 *
 * **Licence.** Graphviz is EPL-1.0. It is installed by npm into the gitignored
 * `harness/node_modules/`, run as a sandboxed WebAssembly module or as a
 * subprocess, never linked into RangerFlow, never vendored, and no Graphviz
 * source is read or copied — not a grammar, not a keyword table. What the
 * reader knows about DOT it learned from the published grammar and from these
 * answers. See `docs/PLAN_GRAPHVIZ.md` §6.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const CORPUS = path.join(ROOT, "fixtures", "graphviz");
const OUTDIR = path.join(ROOT, "harness", "out");
const OUT = path.join(OUTDIR, "graphviz.json");

/** An oracle that could not be built is a fact, not a crash. */
function unavailable(reason) {
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ available: false, reason }, null, 1));
  console.error(`  graphviz oracle unavailable: ${reason}`);
  process.exit(0);
}

let Graphviz;
try {
  ({ Graphviz } = await import("@hpcc-js/wasm-graphviz"));
} catch (err) {
  unavailable("@hpcc-js/wasm-graphviz is not installed — run `cd gallery/rangerflow/harness && npm install`");
}
const gv = await Graphviz.load();

// Keys `-Tjson0` adds whichever engine runs: the drawing, and the geometry a
// layout computed. A `pos` the author wrote is indistinguishable from one the
// layout produced, so neither is scored — see the header.
const LAYOUT_KEYS = new Set([
  "pos", "bb", "lp", "width", "height", "lwidth", "lheight", "rects",
  "xdotversion", "_gvid", "_subgraph_cnt", "_draw_", "_ldraw_", "_hdraw_",
  "_tdraw_", "_hldraw_", "_tldraw_", "objects", "edges", "nodes", "subgraphs",
  "name", "directed", "strict", "tail", "head",
]);

function attrsOf(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (LAYOUT_KEYS.has(k)) continue;
    if (typeof v !== "string") continue;
    out[k] = v;
  }
  return out;
}

/** Does Graphviz accept this text, and if not, what did it say. */
function verdict(text) {
  try {
    gv.layout(text, "canon", "dot");
    return { accepted: true, error: "" };
  } catch (err) {
    return { accepted: false, error: String(err.message ?? err).split("\n")[0].trim().slice(0, 180) };
  }
}

/** The same question, asked of the `dot` on the machine, when there is one. */
const nativeProbe = spawnSync("dot", ["-V"], { encoding: "utf8" });
const hasNative = !nativeProbe.error;
function nativeVerdict(text) {
  if (!hasNative) return null;
  const run = spawnSync("dot", ["-Tcanon", "-o", process.platform === "win32" ? "NUL" : "/dev/null"],
    { input: text, encoding: "utf8" });
  return { accepted: run.status === 0, error: (run.stderr || "").split("\n")[0].trim().slice(0, 180) };
}

/** One file, as Graphviz's own model describes it. */
function read(file, text) {
  const out = { file, accepted: false, error: "", name: "", strict: false, directed: true,
    attrs: {}, nodes: [], edges: [], subgraphs: [] };
  const v = verdict(text);
  out.accepted = v.accepted;
  out.error = v.error;

  const native = nativeVerdict(text);
  if (native && native.accepted !== v.accepted) {
    out.nativeDisagrees = native.accepted ? "native dot accepts it" : "native dot rejects it";
  }
  if (!v.accepted) return out;

  const model = JSON.parse(gv.layout(text, "json0", "dot"));
  out.name = model.name ?? "";
  out.strict = model.strict === true;
  out.directed = model.directed === true;
  out.attrs = attrsOf(model);

  // `objects` is nodes and subgraphs in one list; a subgraph is the one that
  // owns members, and Graphviz numbers everything with `_gvid` so an edge can
  // name its ends by index.
  const byGvid = new Map();
  for (const o of model.objects ?? []) byGvid.set(o._gvid, o);
  for (const o of model.objects ?? []) {
    if (Array.isArray(o.nodes) || Array.isArray(o.subgraphs)) {
      out.subgraphs.push({
        id: o.name ?? "",
        cluster: String(o.name ?? "").toLowerCase().startsWith("cluster"),
        nodes: (o.nodes ?? []).map((id) => byGvid.get(id)?.name ?? String(id)),
        attrs: attrsOf(o),
      });
      continue;
    }
    out.nodes.push({ id: o.name ?? "", attrs: attrsOf(o) });
  }
  for (const e of model.edges ?? []) {
    out.edges.push({
      tail: byGvid.get(e.tail)?.name ?? String(e.tail),
      head: byGvid.get(e.head)?.name ?? String(e.head),
      attrs: attrsOf(e),
    });
  }
  return out;
}

// ------------------------------------------------------------- the corpus --
if (!fs.existsSync(CORPUS)) unavailable(`no corpus at ${CORPUS}`);
const files = [];
for (const f of fs.readdirSync(CORPUS).sort()) {
  if (f.endsWith(".gv")) files.push([f, path.join(CORPUS, f)]);
}
const badDir = path.join(CORPUS, "bad");
if (fs.existsSync(badDir)) {
  for (const f of fs.readdirSync(badDir).sort()) {
    if (f.endsWith(".gv")) files.push([f, path.join(badDir, f)]);
  }
}

const diagrams = files.map(([name, p]) => read(name, fs.readFileSync(p, "utf8")));

fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  available: true,
  version: gv.version(),
  native: hasNative ? (nativeProbe.stderr || nativeProbe.stdout || "").trim() : "",
  diagrams,
}, null, 1));

const accepted = diagrams.filter((d) => d.accepted).length;
console.error(`  graphviz ${gv.version()}: ${diagrams.length} files, ${accepted} accepted → harness/out/graphviz.json`);
