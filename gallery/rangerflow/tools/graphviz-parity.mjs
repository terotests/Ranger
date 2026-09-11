/**
 * graphviz-parity.mjs — how much of Graphviz's own examples RangerFlow reads.
 *
 * Two inputs, neither of them an opinion:
 *
 *   harness/out/graphviz.json        computed by Graphviz itself
 *   harness/out/rangerflow_dot.json  computed by RangerFlow's reader
 *
 * over the same corpus, `fixtures/graphviz/`. Every file is compared on what a
 * reader can be wrong about — whether it is DOT at all, the header, the node
 * ids, the edge endpoints, the subgraph membership, and the attributes AFTER
 * default resolution. Nothing about geometry: Graphviz lays a diagram out its
 * own way and has no opinion about RangerFlow's.
 *
 *   npm run rangerflow:graphviz:parity
 *   npm run rangerflow:graphviz:parity -- --diff     every mismatch, in full
 *
 * The two vocabularies meet here and nowhere else.
 *
 * **What is normalised, and why.** Three things Graphviz reports are not
 * disagreements, and each is written down rather than quietly dropped:
 *
 *   `label="\N"`   Graphviz gives every unlabelled node the default label
 *                  `\N`, which means "your own name". A reader that stores no
 *                  label says the same thing.
 *   inherited      A subgraph inherits the graph's attributes, and Graphviz
 *                  prints the inherited copy on every subgraph. Only what the
 *                  subgraph itself says is compared.
 *   geometry       `pos`, `width`, `height`, `bb`, `lp` are dropped by the
 *                  oracle: a position the author wrote and one the layout
 *                  computed are the same field in `-Tjson0`, so neither can be
 *                  scored honestly. Named here, not hidden.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "harness", "out");
const DOC = path.join(ROOT, "docs", "GRAPHVIZ_PARITY.md");
const wantDiff = process.argv.slice(2).includes("--diff");

const read = (name) => {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};

const ours = read("rangerflow_dot.json");
if (!ours) {
  console.error("  no rangerflow_dot.json — run: npm run rangerflow:graphviz:parity");
  process.exit(1);
}
const oracle = read("graphviz.json");
if (!oracle || oracle.available === false) {
  const why = oracle?.reason ?? "the oracle was never built";
  console.error(`  no Graphviz answers to compare against: ${why}`);
  fs.writeFileSync(DOC, `# Graphviz parity — not measured\n\n> ${why}\n\n` +
    `Without Graphviz there is nothing to agree with, and a number written here anyway\n` +
    `would be a number nobody computed. Install the harness and re-run\n` +
    `\`npm run rangerflow:graphviz:parity\`.\n`);
  process.exit(0);
}

const byFile = new Map(ours.diagrams.map((d) => [d.file, d]));

// ------------------------------------------------------------ normalising --
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sameSet = (a, b) => {
  const A = [...a].sort();
  const B = [...b].sort();
  return sameList(A, B);
};

/** Graphviz's attributes for one object, minus what is not a disagreement. */
function theirAttrs(attrs, { inherited = {}, oursHasLabel = true } = {}) {
  const out = {};
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (k === "label" && v === "\\N" && !oursHasLabel) continue;
    if (k === "label" && v === "" && !oursHasLabel) continue;
    if (Object.prototype.hasOwnProperty.call(inherited, k) && inherited[k] === v) continue;
    out[k] = v;
  }
  return out;
}

/**
 * RangerFlow's, in Graphviz's spelling. Two translations live here and nowhere
 * else, which is the rule the other parity tools follow: the model must not
 * carry a foreign tool's vocabulary.
 *
 *   ports     RangerFlow keeps the port and the compass point apart, because
 *             they are two different questions about where an edge lands.
 *             Graphviz writes them as one `tailport` / `headport` attribute.
 *   geometry  dropped on this side too — the oracle cannot tell an author's
 *             `pos` from a layout's, so neither side is scored on it.
 */
const GEOMETRY = new Set(["pos", "width", "height", "bb", "lp"]);
function ourAttrs(attrs, edge) {
  const out = {};
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (GEOMETRY.has(k)) continue;
    out[k] = v;
  }
  if (edge) {
    const tail = [edge.tailPort, edge.tailCompass].filter(Boolean).join(":");
    const head = [edge.headPort, edge.headCompass].filter(Boolean).join(":");
    if (tail) out.tailport = tail;
    if (head) out.headport = head;
  }
  return out;
}

/** Graphviz calls a graph nobody named `%1`; RangerFlow calls it nothing. */
const graphName = (name) => (/^%\d+$/.test(name ?? "") ? "" : (name ?? ""));

function attrDiff(mine, theirs) {
  const keys = [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].sort();
  const bad = [];
  for (const k of keys) {
    const a = mine[k];
    const b = theirs[k];
    if (a === b) continue;
    // Graphviz normalises a quoted numeral and we keep the text. `4` and
    // `4.0` are the same attribute, and a reader is not wrong about it.
    if (a !== undefined && b !== undefined && Number(a) === Number(b) && a !== "" && b !== "") continue;
    bad.push(`${k}: ${JSON.stringify(a ?? null)} vs ${JSON.stringify(b ?? null)}`);
  }
  return bad;
}

// ---------------------------------------------------------------- scoring --
const CHECKS = ["accepted", "header", "nodes", "edges", "subgraphs", "node attrs", "edge attrs", "cluster labels"];
const rows = [];
const notes = [];
let pass = 0;
let total = 0;

for (const them of oracle.diagrams) {
  const us = byFile.get(them.file);
  const row = { file: them.file, accepted: them.accepted, marks: {} };
  const mark = (name, ok, why) => {
    row.marks[name] = ok;
    total += 1;
    if (ok) pass += 1;
    if (!ok && why) notes.push(`${them.file} · ${name}: ${why}`);
  };

  if (!us) {
    mark("accepted", false, "RangerFlow never saw this file");
    rows.push(row);
    continue;
  }

  mark("accepted", us.ok === them.accepted,
    `Graphviz ${them.accepted ? "accepts" : "rejects"} it, RangerFlow ${us.ok ? "reads" : "refuses"} it` +
    (us.error ? ` (${us.error})` : "") + (them.error ? ` (graphviz: ${them.error})` : ""));

  if (!them.accepted) {
    // A file Graphviz rejects has no model to compare; refusing it is the
    // whole check, and the rest are not applicable rather than passed.
    rows.push(row);
    continue;
  }
  if (!us.ok) {
    rows.push(row);
    continue;
  }

  const headerOk = us.name === graphName(them.name) && us.strict === them.strict && us.directed === them.directed;
  mark("header", headerOk,
    `name ${JSON.stringify(us.name)} vs ${JSON.stringify(graphName(them.name))}, strict ${us.strict} vs ${them.strict}, directed ${us.directed} vs ${them.directed}`);

  const ourNodes = us.nodes.map((n) => n.id);
  const theirNodes = them.nodes.map((n) => n.id);
  mark("nodes", sameList(ourNodes, theirNodes),
    `${ourNodes.length} vs ${theirNodes.length}: ${JSON.stringify(ourNodes)} vs ${JSON.stringify(theirNodes)}`);

  const ourEdges = us.edges.map((e) => `${e.tail}→${e.head}`);
  const theirEdges = them.edges.map((e) => `${e.tail}→${e.head}`);
  mark("edges", sameList(ourEdges, theirEdges),
    `${ourEdges.length} vs ${theirEdges.length}: ${JSON.stringify(ourEdges)} vs ${JSON.stringify(theirEdges)}`);

  // Anonymous subgraphs are named by a counter on both sides and the counters
  // are not the same counter, so what is compared is the membership and which
  // of them are clusters — the two things a drawing depends on.
  const shape = (list) => list.map((s) => `${s.cluster ? s.id : "{}"}:[${[...s.nodes].sort().join(",")}]`).sort();
  const ourSubs = shape(us.subgraphs);
  const theirSubs = shape(them.subgraphs);
  mark("subgraphs", sameList(ourSubs, theirSubs),
    `${JSON.stringify(ourSubs)} vs ${JSON.stringify(theirSubs)}`);

  const nodeBad = [];
  for (const mine of us.nodes) {
    const theirNode = them.nodes.find((n) => n.id === mine.id);
    if (!theirNode) continue;
    const a = ourAttrs(mine.attrs, null);
    const b = theirAttrs(theirNode.attrs, { oursHasLabel: a.label !== undefined });
    const bad = attrDiff(a, b);
    if (bad.length) nodeBad.push(`${mine.id} — ${bad.join("; ")}`);
  }
  mark("node attrs", nodeBad.length === 0, nodeBad.join(" · "));

  const edgeBad = [];
  us.edges.forEach((mine, i) => {
    const theirEdge = them.edges[i];
    if (!theirEdge) return;
    const a = ourAttrs(mine.attrs, mine);
    const b = theirAttrs(theirEdge.attrs, { oursHasLabel: a.label !== undefined });
    const bad = attrDiff(a, b);
    if (bad.length) edgeBad.push(`${mine.tail}→${mine.head} — ${bad.join("; ")}`);
  });
  mark("edge attrs", edgeBad.length === 0, edgeBad.join(" · "));

  const labelBad = [];
  for (const mine of us.subgraphs) {
    if (!mine.cluster) continue;
    const theirSub = them.subgraphs.find((s) => s.id === mine.id);
    if (!theirSub) {
      labelBad.push(`${mine.id} — Graphviz has no such cluster`);
      continue;
    }
    const a = (mine.attrs ?? {}).label ?? "";
    const b = (theirSub.attrs ?? {}).label ?? "";
    if (a !== b) labelBad.push(`${mine.id} — ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  }
  mark("cluster labels", labelBad.length === 0, labelBad.join(" · "));

  rows.push(row);
}

// ----------------------------------------------------------------- report --
const tick = (v) => (v === undefined ? "—" : v ? "✓" : "**✗**");
const pct = total === 0 ? 0 : Math.round((pass / total) * 100);

const lines = [];
const say = (s = "") => lines.push(s);

say("# Graphviz parity — the measured one");
say();
say("> Regenerated by `npm run rangerflow:graphviz:parity`. Every number here comes");
say("> from **Graphviz itself**, run over the same files in `fixtures/graphviz/` and");
say("> asked what it understood. Nothing is transcribed, so nothing can be");
say("> transcribed wrong.");
say();
say(`Graphviz ${oracle.version}${oracle.native ? ` · cross-checked against \`${oracle.native}\`` : ""} · ` +
  `${oracle.diagrams.length} files · **${pass}/${total} checks agree (${pct}%)**`);
say();
say(`| example | Graphviz | ${CHECKS.map((c) => c).join(" | ")} |`);
say(`| --- | --- | ${CHECKS.map(() => ":---:").join(" | ")} |`);
for (const r of rows) {
  say(`| \`${r.file}\` | ${r.accepted ? "accepts" : "rejects"} | ${CHECKS.map((c) => tick(r.marks[c])).join(" | ")} |`);
}
say();
say("A file Graphviz **rejects** is scored on one check only — that RangerFlow refuses");
say("it too. There is no model to compare when there is no model, and a reader that");
say("reads a file Graphviz will not is a reader that invented syntax.");
say();

if (notes.length) {
  say("## What does not agree");
  say();
  for (const n of notes) say(`- ${n.slice(0, wantDiff ? 100000 : 400)}`);
  say();
} else {
  say("Nothing disagrees.");
  say();
}

say("## What is not scored, and why");
say();
say("| | |");
say("| --- | --- |");
say("| geometry | `pos`, `width`, `height`, `bb`, `lp`. `-Tjson0` reports them whichever engine runs, so a position the author wrote and one the layout computed are the same field. RangerFlow lays a diagram out its own way; comparing positions would measure two layouts rather than one reader. |");
say("| source lines | Graphviz's model carries none. PlantUML's SVG does, and `PLANTUML_PARITY.md` scores it; writing the check here anyway would mean scoring against ourselves. |");
say("| subgraph attributes | Beyond the cluster's own `label`. Graphviz prints the graph's attributes again on every subgraph that inherits them, so the comparison would be about inheritance rather than about reading. |");
say("| `record` and HTML labels | The cells and their ports are read and drawn; the geometry they come out with is RangerFlow's own, and Graphviz has no opinion about it. |");
say("| ports and compass points | Read, dumped and aimed at — but where a port lands on the page is geometry again. |");
say();
say("## The corpus");
say();
say("Sixteen files Graphviz accepts and four it rejects, covering the published");
say("grammar: both edge operators, `strict`, clusters and anonymous subgraphs, ports");
say("and records, HTML labels, quoting with escapes and line continuation, repeated");
say("attribute lists, unicode ids, `#` line markers, both comment spellings, and a");
say("200-node graph. The four in `bad/` are the ones that matter most: two of the four");
say("open-source DOT parsers measured in `GRAPHVIZ_BENCH.md` accept syntax Graphviz");
say("does not, and a reader built against one of them would have inherited that.");
say();

fs.writeFileSync(DOC, lines.join("\n") + "\n");
console.log(`  graphviz parity: ${pass}/${total} checks agree (${pct}%) → ${path.relative(process.cwd(), DOC)}`);
if (notes.length && !wantDiff) {
  console.log(`  ${notes.length} disagreements — run with -- --diff for the full text`);
}
for (const n of notes.slice(0, wantDiff ? notes.length : 8)) {
  console.log(`    ${n.slice(0, wantDiff ? 100000 : 220)}`);
}
