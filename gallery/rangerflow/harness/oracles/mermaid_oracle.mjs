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
import { fileURLToPath, pathToFileURL } from "node:url";
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
// `Option` is in the list because Mermaid 11.17 reaches for the browser's
// option-element constructor while parsing a sequence diagram's `box`, and a
// bare jsdom does not put it on the global. Without it the oracle reports
// "Mermaid will not parse this", which would be a lie about the corpus.
for (const name of ["Element", "SVGElement", "HTMLElement", "Node", "DOMParser", "NodeFilter", "getComputedStyle", "Option"]) {
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

// ------------------------------------------------------- the type registry -
/**
 * Every header keyword the installed Mermaid can DETECT, asked of Mermaid.
 *
 * Not a list of chunk filenames: a chunk is not always named after its
 * diagram. Five of them are called `diagram-<hash>.mjs` and carry no name at
 * all, which is how `packet`, `radar`, `treemap`, `treeView` and
 * `eventmodeling` stayed out of a matrix whose whole job was to notice a
 * diagram with no reader. The registry the parser itself consults is the only
 * list that cannot be short.
 *
 * Keywords rather than renderers: `graph` and `flowchart` draw one picture
 * through two of Mermaid's detectors, and a reader has to know both words, so
 * both are rows. Each keyword is read off a detector's own regular expression
 * and then handed back to that detector — a keyword derived wrongly is dropped
 * here rather than quietly asked of RangerFlow's reader as Mermaid's.
 */
async function types() {
  const dist = path.join(HERE, "..", "node_modules", "mermaid", "dist");
  const src = fs.readFileSync(path.join(dist, "mermaid.core.mjs"), "utf8");
  // `detectors` is the live registry. mermaid.core imports it from a chunk
  // whose hash changes with every release, so the path is read, never typed.
  const imp = src.match(/import\s*\{[^}]*\bdetectors\b[^}]*\}\s*from\s*"([^"]+)"/);
  if (!imp) return [];
  const api = await import(pathToFileURL(path.join(dist, imp[1])).href);
  const rows = new Map();
  for (const [id, plugin] of Object.entries(api.detectors ?? {})) {
    // `error` and `---` are Mermaid's own two entries, not diagram types.
    if (id === "error" || id === "---") continue;
    for (const header of headersOf(String(plugin.detector))) {
      if (rows.has(header)) continue;
      let owns = false;
      try { owns = plugin.detector(header + "\n", {}) === true; } catch { owns = false; }
      if (!owns) continue;
      // …and what Mermaid resolves the keyword to once every detector has had
      // a look, which is the renderer it would actually reach for.
      let type = "";
      try { type = api.detectType(header + "\n"); } catch { type = ""; }
      rows.set(header, { header, type, detector: id });
    }
  }
  return [...rows.values()].sort((a, b) => a.header.localeCompare(b.header));
}

/** Every keyword a detector's regular expressions open with. */
function headersOf(source) {
  // A detector is one or more `/^\s*<keyword>…/.test(txt)`. Two of them test
  // several — the flowchart answers to both `graph` and `flowchart` — so all
  // of them are read, and the caller checks each against the detector itself.
  const out = [];
  for (const m of source.matchAll(/\/\^\\s\*([^/]+)\//g)) {
    const k = m[1]
      // Groups go first: a `|` inside one is not an alternative keyword.
      .replace(/\(\?:[^)]*\)[?*]?/g, "")     // `(?:[\s:]|$)` is what follows the keyword
      .replace(/\([^)]*\)\?/g, "")           // `(-beta)?` is optional, so leave it off
      .replace(/\\b/g, "")
      .split("|")[0];                      // `C4Context|C4Container|…`
    if (k) out.push(k);
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
const known = await types();
fs.writeFileSync(OUT, JSON.stringify({ version, types: known, diagrams }, null, 1));
const flow = diagrams.filter((d) => d.nodes.length > 0).length;
console.log(`  mermaid oracle: ${diagrams.length} diagrams (${flow} flowcharts), ${known.length} header keywords → ${path.relative(process.cwd(), OUT)}`);
