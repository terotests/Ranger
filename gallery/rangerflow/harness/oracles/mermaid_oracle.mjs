/**
 * mermaid_oracle.mjs — ask Mermaid what its own examples mean.
 *
 * Parity with a format is not a claim you can make from the outside. So the
 * reference answers here are not written down: every diagram in
 * `fixtures/mermaid/` is handed to **Mermaid's own parser**, and what comes
 * back is its own database — the vertices with their shapes, the edges with
 * their strokes and arrowheads, the subgraphs with their members, and the
 * direction it read out of the header.
 *
 *   node gallery/rangerflow/harness/oracles/mermaid_oracle.mjs
 *   → gallery/rangerflow/harness/out/mermaid.json
 *
 * Mermaid is a browser library and sanitizes its labels through DOMPurify, so
 * it needs a DOM to load at all. jsdom is that DOM and nothing else: no
 * rendering happens here, and no geometry is read — only what the parser
 * understood, which is the thing RangerFlow's reader has to agree with.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.join(HERE, "..", "..", "fixtures", "mermaid");
const OUT = path.join(HERE, "..", "out", "mermaid.json");

// Mermaid reaches for `window` and `document` while it is being imported, so
// they have to exist before the import rather than after it.
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
for (const name of ["Element", "SVGElement", "HTMLElement", "Node", "DOMParser", "NodeFilter", "getComputedStyle"]) {
  globalThis[name] = dom.window[name];
}

const mermaid = (await import("mermaid")).default;
mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

const asArray = (v) => (v instanceof Map ? [...v.values()] : Object.values(v ?? {}));

/** One diagram, as Mermaid's flowchart database describes it. */
async function read(file) {
  const text = fs.readFileSync(path.join(CORPUS, file), "utf8");
  const out = { file, kind: "", ok: false, error: "", direction: "", nodes: [], edges: [], subgraphs: [] };
  let diagram;
  try {
    diagram = await mermaid.mermaidAPI.getDiagramFromText(text);
  } catch (err) {
    // Mermaid's parse errors are several lines of caret art; the first line
    // says what happened and the rest says where.
    out.error = String(err.message ?? err).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 2).join(" · ").slice(0, 180);
    return out;
  }
  out.kind = diagram.type ?? "";
  const db = diagram.db;
  // Only the flowchart database answers these; every other diagram type is
  // recorded as "parsed, and not a flowchart", which is an answer too.
  if (typeof db.getVertices !== "function") return { ...out, ok: true };
  out.ok = true;
  out.direction = db.getDirection?.() ?? "";
  for (const v of asArray(db.getVertices())) {
    out.nodes.push({
      id: v.id,
      label: (v.text ?? "").trim(),
      shape: v.type ?? "square",
      // `default` is Mermaid's own, and `clickable` is one it adds because a
      // `click` statement exists — neither is a class the author wrote.
      classes: [...(v.classes ?? [])].filter((c) => c !== "default" && c !== "clickable"),
    });
  }
  for (const e of db.getEdges() ?? []) {
    out.edges.push({
      source: e.start,
      target: e.end,
      label: (e.text ?? "").trim(),
      // `type` is the arrowhead, `stroke` is the line.
      arrow: e.type ?? "",
      stroke: e.stroke ?? "",
    });
  }
  for (const s of db.getSubGraphs() ?? []) {
    out.subgraphs.push({ id: s.id, title: s.title, nodes: [...(s.nodes ?? [])].sort() });
  }
  return out;
}

const files = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".mmd")).sort();
const diagrams = [];
for (const file of files) diagrams.push(await read(file));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
// The version of the thing that answered, read from the package that answered.
const pkg = path.join(HERE, "..", "node_modules", "mermaid", "package.json");
const version = fs.existsSync(pkg) ? JSON.parse(fs.readFileSync(pkg, "utf8")).version : "";
fs.writeFileSync(OUT, JSON.stringify({ version, diagrams }, null, 1));
const flow = diagrams.filter((d) => d.nodes.length > 0).length;
console.log(`  mermaid oracle: ${diagrams.length} diagrams (${flow} flowcharts) → ${path.relative(process.cwd(), OUT)}`);
