/**
 * mermaid-parity.mjs — how much of Mermaid's own examples RangerFlow reads.
 *
 * Two inputs, neither of them an opinion:
 *
 *   harness/out/mermaid.json             computed by Mermaid's own parser
 *   harness/out/rangerflow_mermaid.json  computed by RangerFlow's reader
 *
 * over the same corpus, `fixtures/mermaid/`. Every diagram is compared on what
 * a reader can be wrong about — the direction, the node ids, their labels and
 * their shapes, the edges with their arrowheads and strokes, the subgraphs
 * with their members, and the classes a `classDef` handed out. Nothing about
 * geometry: Mermaid lays a diagram out its own way and has no opinion about
 * RangerFlow's, so a layout comparison would measure two layouts rather than
 * one reader.
 *
 *   npm run rangerflow:mermaid:parity
 *   npm run rangerflow:mermaid:parity -- --diff     every mismatch, in full
 *
 * The two vocabularies meet here and nowhere else: Mermaid says `lean_right`
 * and RangerFlow says `leanr`, Mermaid says `arrow_point` and RangerFlow
 * carries the marker its renderer draws. Translating in one file keeps the
 * model free of a foreign library's spelling.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "harness", "out");
const DOC = path.join(ROOT, "docs", "MERMAID_PARITY.md");
const argv = process.argv.slice(2);
const wantDiff = argv.includes("--diff");

function read(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * Every header keyword the installed Mermaid detects — the ORACLE's list.
 *
 * Not a list typed into this file, and no longer a list of chunk filenames
 * either: five chunks are named `diagram-<hash>.mjs` and say nothing about
 * which diagram they are, so reading names off filenames quietly missed five
 * types. The oracle asks Mermaid's own detector registry instead, which is
 * the list the parser itself consults.
 */
function mermaidDiagramTypes(oracle) {
  return (oracle?.types ?? []).map((t) => ({ header: t.header, type: t.type }));
}

const oracle = read("mermaid.json");
const ours = read("rangerflow_mermaid.json");
if (!ours) {
  console.error("  no rangerflow_mermaid.json — run: npm run rangerflow:mermaid:parity");
  process.exit(1);
}
if (!oracle) {
  console.error("  no mermaid.json — the oracle could not be built, so there is nothing to compare against");
  process.exit(1);
}

// ------------------------------------------------------------ vocabulary ---
/** RangerFlow's shape name for Mermaid's. */
const SHAPE = {
  // the bracket spellings
  square: "square", round: "round", stadium: "stadium", subroutine: "subroutine",
  cylinder: "cylinder", circle: "circle", doublecircle: "doublecircle", odd: "odd",
  diamond: "rhombus", hexagon: "hexagon", lean_right: "leanr", lean_left: "leanl",
  trapezoid: "trapezoid", inv_trapezoid: "trapezoidalt",
  // …and `@{ shape: … }`, where Mermaid keeps whichever alias was typed
  rect: "square", rectangle: "square", proc: "square", process: "square",
  rounded: "round", event: "round", pill: "stadium", terminal: "stadium",
  subproc: "subroutine", subprocess: "subroutine", "framed-rectangle": "subroutine",
  cyl: "cylinder", db: "cylinder", database: "cylinder", circ: "circle",
  diam: "rhombus", decision: "rhombus", question: "rhombus",
  hex: "hexagon", prepare: "hexagon",
  "lean-r": "leanr", "lean-right": "leanr", "in-out": "leanr",
  "lean-l": "leanl", "lean-left": "leanl", "out-in": "leanl",
  "trap-b": "trapezoid", "trapezoid-bottom": "trapezoid", priority: "trapezoid",
  "trap-t": "trapezoidalt", "trapezoid-top": "trapezoidalt", manual: "trapezoidalt",
  "dbl-circ": "doublecircle", "double-circle": "doublecircle",
  doc: "doc", document: "doc",
  card: "card", "notch-rect": "card", "notched-rectangle": "card",
  das: "das", "h-cyl": "das", "horizontal-cylinder": "das",
};

/** The marker pair RangerFlow draws, for Mermaid's arrow name. */
const ARROW = {
  arrow_point: ["arrowclosed", ""], arrow_open: ["", ""],
  arrow_circle: ["circle", ""], arrow_cross: ["cross", ""],
  double_arrow_point: ["arrowclosed", "arrowclosed"],
  double_arrow_circle: ["circle", "circle"],
  double_arrow_cross: ["cross", "cross"],
};

const STROKE = { normal: "solid", thick: "thick", dotted: "dotted" };

/**
 * A label as both sides would draw it.
 *
 * Mermaid's database holds a label the way an HTML renderer wants it: `<br/>`
 * is still a tag, `&amp;` is still an entity, and `#quot;` has been swapped for
 * a private placeholder it unwraps at render time. RangerFlow has no HTML
 * downstream, so its reader resolves all three while reading — a break becomes
 * a newline the text layout can take, and an entity becomes the character it
 * names. Neither is wrong; they are the same label written for two different
 * renderers, so the comparison is made after both are resolved.
 */
const ENTITY = { quot: '"', amp: "&", lt: "<", gt: ">", nbsp: " ", apos: "'" };
function labelText(raw) {
  return String(raw ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    // Mermaid's own placeholder for an entity it will unwrap when it draws.
    .replace(/\uFB02\u00b0([a-z]+)\u00b6\u00df/gi, (m, name) => ENTITY[name.toLowerCase()] ?? m)
    .replace(/&(quot|amp|lt|gt|nbsp|apos);/gi, (m, name) => ENTITY[name.toLowerCase()] ?? m)
    // A label written over two lines carries the second line's indentation in
    // Mermaid and not in RangerFlow. Indentation is not content.
    .split("\n").map((line) => line.trim()).join("\n")
    .trim();
}

/** Mermaid names a diagram type several ways; this is the short one. */
// `flowchart-elk` is the same language read by a different layout engine, and
// RangerFlow has a layout engine of its own — so it is a flowchart here.
// Two types keep a word in Mermaid's name that RangerFlow's vocabulary drops,
// the way it calls the others `er` and `c4`. Written out rather than pattern
// matched: `xychart` would lose its "chart" to a rule and become `xy`.
const SHORT_NAME = {
  gitgraph: "git", quadrantchart: "quadrant",
  // The three grammar notations are one diagram to Mermaid and three to a
  // reader, which is the useful way round: `railroadEbnf` is EBNF.
  railroadebnf: "ebnf", railroadabnf: "abnf", railroadpeg: "peg",
};
const kindOf = (raw) => {
  const k = String(raw ?? "").toLowerCase().replace(/-v2$/, "").replace(/^flowchart-elk$/, "flowchart").replace(/diagram$/, "");
  return SHORT_NAME[k] ?? k ?? "";
};

const dirOf = (raw) => (String(raw ?? "").toUpperCase() === "TD" ? "TB" : String(raw ?? "").toUpperCase());

// ---------------------------------------------------------- the comparison -
const byFile = new Map(ours.diagrams.map((d) => [d.file, d]));
const rows = [];

for (const want of oracle.diagrams) {
  const got = byFile.get(want.file);
  const checks = [];
  const notes = [];
  const add = (name, ok, detail) => {
    checks.push({ name, ok });
    if (!ok && detail) notes.push(detail);
  };

  if (!got) {
    rows.push({ file: want.file, kind: kindOf(want.kind), checks: [{ name: "read", ok: false }], notes: ["RangerFlow did not read this file"] });
    continue;
  }

  // Mermaid could not parse it. There is nothing to be in parity WITH, so the
  // row is not scored — it is recorded, because "this reader takes what
  // Mermaid refuses" is worth knowing and is not the same as agreement.
  if (want.error) {
    rows.push({
      file: want.file, kind: "—", checks: [], tolerated: true,
      notes: [`Mermaid: ${want.error}`, `RangerFlow read ${got.nodes.length} nodes, ${got.edges.length} edges`],
    });
    continue;
  }

  const kind = kindOf(want.kind);
  add("diagram type", kindOf(got.kind) === kind, `type ${got.kind || "(none)"} ≠ ${want.kind}`);

  // A diagram Mermaid draws with another parser is one RangerFlow must say no
  // to rather than read as a flowchart. That is the whole of the check — with
  // one exception, and Mermaid's own source is what makes it one: a swimlane
  // diagram "reuses the flowchart parser, DB, and renderer wholesale and only
  // swaps in a different layout engine", so reading it as a flowchart is
  // right and reading it as nothing would be the failure.
  if (kind === "swimlane") {
    add("read as the flowchart it is", got.nodes.length > 0, "no nodes read from a swimlane diagram");
    rows.push({ file: want.file, kind, checks, notes });
    continue;
  }
  if (kind !== "flowchart") {
    add("not read as a flowchart", got.nodes.length === 0, `${got.nodes.length} nodes invented from a ${kind} diagram`);
    rows.push({ file: want.file, kind, checks, notes });
    continue;
  }

  add("direction", dirOf(got.direction) === dirOf(want.direction), `direction ${got.direction} ≠ ${want.direction}`);

  // Nodes, by id.
  const mine = new Map(got.nodes.map((n) => [n.id, n]));
  const missing = want.nodes.filter((n) => !mine.has(n.id)).map((n) => n.id);
  const extra = got.nodes.filter((n) => !want.nodes.some((w) => w.id === n.id)).map((n) => n.id);
  add("nodes", missing.length === 0 && extra.length === 0,
    [missing.length ? `missing ${missing.join(", ")}` : "", extra.length ? `extra ${extra.join(", ")}` : ""].filter(Boolean).join("; "));

  const labelBad = [];
  const shapeBad = [];
  const classBad = [];
  for (const w of want.nodes) {
    const g = mine.get(w.id);
    if (!g) continue;
    if (labelText(g.label) !== labelText(w.label)) labelBad.push(`${w.id}: "${g.label}" ≠ "${w.label}"`);
    const wantShape = SHAPE[w.shape] ?? w.shape;
    if ((g.shape ?? "") !== wantShape) shapeBad.push(`${w.id}: ${g.shape} ≠ ${w.shape}`);
    const a = [...(g.classes ?? [])].sort().join(" ");
    const b = [...(w.classes ?? [])].sort().join(" ");
    if (a !== b) classBad.push(`${w.id}: [${a}] ≠ [${b}]`);
  }
  add("labels", labelBad.length === 0, labelBad.join("; "));
  add("shapes", shapeBad.length === 0, shapeBad.join("; "));
  add("classes", classBad.length === 0, classBad.join("; "));

  // Edges, as a multiset: Mermaid's order and ours agree today, and an edge
  // list that agrees in a different order is still the same diagram.
  const edgeKey = (source, target, label, head, tail, stroke) =>
    `${source}→${target} "${label}" ${head || "none"}/${tail || "none"} ${stroke}`;
  const wantEdges = want.edges.map((e) => {
    const [head, tail] = ARROW[e.arrow] ?? [e.arrow, ""];
    return edgeKey(e.source, e.target, labelText(e.label), head, tail, STROKE[e.stroke] ?? e.stroke);
  }).sort();
  const gotEdges = got.edges.map((e) => edgeKey(e.source, e.target, labelText(e.label), e.head, e.tail, e.stroke)).sort();
  const edgeDiff = [];
  for (const e of wantEdges) if (!gotEdges.includes(e)) edgeDiff.push(`missing ${e}`);
  for (const e of gotEdges) if (!wantEdges.includes(e)) edgeDiff.push(`extra ${e}`);
  add("edges", edgeDiff.length === 0, edgeDiff.join("; "));

  // Subgraphs, by id, with the nodes each one holds.
  const mySub = new Map(got.subgraphs.map((s) => [s.id, s]));
  const subDiff = [];
  for (const w of want.subgraphs) {
    const g = mySub.get(w.id);
    if (!g) { subDiff.push(`missing subgraph ${w.id}`); continue; }
    if ((g.title ?? "") !== (w.title ?? "")) subDiff.push(`${w.id}: title "${g.title}" ≠ "${w.title}"`);
    const a = [...(g.nodes ?? [])].sort().join(",");
    const b = [...(w.nodes ?? [])].sort().join(",");
    if (a !== b) subDiff.push(`${w.id}: members [${a}] ≠ [${b}]`);
  }
  for (const g of got.subgraphs) if (!want.subgraphs.some((w) => w.id === g.id)) subDiff.push(`extra subgraph ${g.id}`);
  add("subgraphs", subDiff.length === 0, subDiff.join("; "));

  rows.push({ file: want.file, kind, checks, notes });
}

// ------------------------------------------------------- the type coverage -
// Two readers here — a flowchart and a class diagram — and two dozen kinds of
// diagram in Mermaid. What matters is not the score but that every OTHER kind
// is recognised and refused: a Wardley map read as a flowchart is a page of
// invented boxes, and a header this reader has never heard of falls straight
// through to the flowchart parser.
// Which kinds have a reader is the READER's answer, not this file's: the dump
// asks `MermaidReader.draws` for every header and reports what it said.
const FLOWCHART = new Set(["flowchart", "flowchart-v2", "flowchart-elk"]);
const types = mermaidDiagramTypes(oracle);
const byHeader = new Map((ours.headers ?? []).map((h) => [h.header, h]));
const coverage = [];
for (const t of types) {
  const got = byHeader.get(t.header);
  const kind = got?.kind ?? "";
  let verdict = "refused";
  if (!kind || kind === "flowchart") {
    // Either it is the flowchart, or it fell through to the flowchart parser
    // — and for every other header that is the failure this table exists for.
    // `graph`, `flowchart` and `flowchart-elk` are one picture behind three of
    // Mermaid's detectors — elk only changes which layout engine draws it — so
    // reading any of them as a flowchart is the right answer, not a fall-through.
    verdict = FLOWCHART.has(t.type) ? "read" : "MISTAKEN FOR A FLOWCHART";
  } else if (got?.draws) {
    verdict = "read";
  }
  coverage.push({ ...t, kind, verdict });
}
const mistaken = coverage.filter((c) => c.verdict.startsWith("MIS"));

// ------------------------------------------------------------- the report --
const passed = rows.reduce((n, r) => n + r.checks.filter((c) => c.ok).length, 0);
const total = rows.reduce((n, r) => n + r.checks.length, 0);
const score = total ? Math.round((passed / total) * 1000) / 10 : 0;
const failing = rows.filter((r) => r.checks.some((c) => !c.ok));
const tolerated = rows.filter((r) => r.tolerated);

console.log("");
console.log(`  Mermaid ${oracle.version || ""} → RangerFlow, over ${rows.length} diagrams in fixtures/mermaid/`);
console.log("");
for (const r of rows) {
  if (r.tolerated) {
    console.log(`  [ -- ] ${r.file.padEnd(26)} Mermaid will not parse it; this reader does`);
    if (wantDiff) for (const note of r.notes) console.log(`         ${note}`);
    continue;
  }
  const bad = r.checks.filter((c) => !c.ok);
  const mark = bad.length ? "FAIL" : " ok ";
  console.log(`  [${mark}] ${r.file.padEnd(26)} ${r.checks.length - bad.length}/${r.checks.length} checks${bad.length ? "  — " + bad.map((c) => c.name).join(", ") : ""}`);
  if (bad.length && wantDiff) for (const note of r.notes) console.log(`         ${note}`);
}
console.log("");
if (coverage.length) {
  const read = coverage.filter((c) => c.verdict === "read").length;
  const refused = coverage.filter((c) => c.verdict === "refused").length;
  console.log(`  of Mermaid's ${coverage.length} diagram types: ${read} drawn, ${refused} recognised and refused` +
    (mistaken.length ? `, ${mistaken.length} MISTAKEN FOR A FLOWCHART` : ""));
  for (const c of mistaken) console.log(`    ${c.header} → ${c.kind || "(unrecognised)"}`);
  console.log("");
}
console.log(`  ${passed}/${total} checks agree with Mermaid's own parser — ${score}%`);
if (tolerated.length) console.log(`  ${tolerated.length} diagram(s) Mermaid refuses and this reader takes`);
if (failing.length && !wantDiff) console.log("  (run with -- --diff to see what differs)");
console.log("");

const lines = [];
lines.push("# Mermaid parity — the measured one");
lines.push("");
lines.push("> Regenerated by `npm run rangerflow:mermaid:parity`. Every number here comes");
lines.push("> from **Mermaid's own parser**, run over the same files in `fixtures/mermaid/`");
lines.push("> and asked what it understood. Nothing is transcribed, so nothing can be");
lines.push("> transcribed wrong.");
lines.push("");
lines.push(`Mermaid ${oracle.version || "(version unknown)"} · ${rows.length} diagrams · **${passed}/${total} checks agree (${score}%)**`);
lines.push("");
lines.push("| example | type | direction | nodes | labels | shapes | classes | edges | subgraphs |");
lines.push("| --- | --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
const cell = (r, name) => {
  const c = r.checks.find((x) => x.name === name);
  if (!c) return "—";
  return c.ok ? "✓" : "✗";
};
for (const r of rows) {
  // A diagram of another kind has one thing to get right, and the type cell is
  // where it is said: recognised, and read as nothing.
  const guard = r.checks.find((c) => c.name === "not read as a flowchart" || c.name === "read as the flowchart it is");
  const kindCell = guard ? `${r.kind} ${guard.ok ? "✓" : "✗"}` : r.kind;
  lines.push(`| \`${r.file}\` | ${kindCell} | ${cell(r, "direction")} | ${cell(r, "nodes")} | ${cell(r, "labels")} | ${cell(r, "shapes")} | ${cell(r, "classes")} | ${cell(r, "edges")} | ${cell(r, "subgraphs")} |`);
}
lines.push("");
if (tolerated.length) {
  lines.push("## Read anyway");
  lines.push("");
  lines.push("Diagrams **Mermaid's own parser rejects** and this reader takes. Not scored —");
  lines.push("there is nothing to agree with — and not a licence to invent syntax either:");
  lines.push("every one of these is a file somebody wrote and Mermaid would not draw.");
  lines.push("");
  for (const r of tolerated) lines.push(`- **\`${r.file}\`** — ${r.notes.join("; ")}`);
  lines.push("");
}
if (failing.length) {
  lines.push("## What differs");
  lines.push("");
  for (const r of failing) {
    lines.push(`- **\`${r.file}\`** — ${r.notes.filter(Boolean).join("; ")}`);
  }
  lines.push("");
}
if (coverage.length) {
  lines.push("## Mermaid's diagram types");
  lines.push("");
  lines.push("Read off the installed Mermaid's own build rather than typed here, so a type");
  const drawn = coverage.filter((c) => c.verdict === "read").length;
  lines.push(`added upstream appears the next time the harness is installed. ${drawn} of the ` +
    `${coverage.length} are drawn;`);
  lines.push("the rest have to be **recognised and refused**, because a header this reader");
  lines.push("does not know falls through to the flowchart parser, and a Wardley map read as");
  lines.push("a flowchart is a page of invented boxes.");
  lines.push("");
  lines.push("| header | RangerFlow |");
  lines.push("| --- | --- |");
  for (const c of coverage) {
    const say = c.verdict === "read" ? `**drawn** — read as \`${c.kind}\``
      : c.verdict === "refused" ? `recognised as \`${c.kind}\`, read as nothing`
      : `⚠️ ${c.verdict.toLowerCase()}`;
    lines.push(`| \`${c.header}\` | ${say} |`);
  }
  lines.push("");
}
lines.push("## What this compares");
lines.push("");
lines.push("- **The reading, not the drawing.** Mermaid lays a diagram out its own way and");
lines.push("  has no opinion about RangerFlow's, so comparing positions would measure two");
lines.push("  layouts rather than one reader.");
lines.push("- **Every diagram type, but not equally.** A flowchart is compared node by node");
lines.push("  and edge by edge. For the other kinds Mermaid draws, the check is that the");
lines.push("  header is read as the type it is — and, where there is no reader for that");
lines.push("  type yet, that it is read as *nothing*. A Wardley map read as a flowchart");
lines.push("  would be a page of invented boxes, which is the one failure a reader of");
lines.push("  somebody else's file must not have.");
lines.push("- **The vocabularies meet in `tools/mermaid-parity.mjs`.** Mermaid says");
lines.push("  `lean_right` and `arrow_point`; RangerFlow says `leanr` and carries the");
lines.push("  marker its renderer draws. The translation lives in the meter so neither");
lines.push("  model has to hold the other's spelling.");
lines.push("");

fs.mkdirSync(path.dirname(DOC), { recursive: true });
fs.writeFileSync(DOC, lines.join("\n"));
console.log(`  wrote ${path.relative(process.cwd(), DOC)}`);
if (failing.length || mistaken.length) process.exit(1);
