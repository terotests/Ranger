/**
 * plantuml_oracle.mjs — ask PlantUML what its own examples mean.
 *
 * Parity with a format is not a claim you can make from the outside, so the
 * reference answers here are not written down. Every file in
 * `fixtures/plantuml/` is handed to **PlantUML itself**, and what comes back is
 * what PlantUML understood.
 *
 *   node gallery/rangerflow/harness/oracles/plantuml_oracle.mjs
 *   → gallery/rangerflow/harness/out/plantuml.json
 *
 * PlantUML has no `getVertices()` to ask, the way Mermaid's parse database
 * has. It has something better: **it annotates its own SVG**. Rendered with the
 * pure-Java layout engine, every node, every edge and every package comes back
 * as a group with the ids on it —
 *
 *   <g class="entity"  data-entity="API" data-source-line="1" data-uid="ent3">
 *   <g class="link"    data-entity-1="Web" data-entity-2="API">
 *   <g class="cluster" data-entity="core">
 *   <g class="message" data-participant-1="User" data-participant-2="API">
 *
 * — and the `<svg>` element itself carries `data-diagram-type`. That is a
 * structural answer for the diagram families this repository reads, and a
 * line-level one, which Mermaid's oracle never offered.
 *
 * **`-Playout=smetana` is not optional.** Without it, class, component,
 * deployment, use-case and state diagrams do not render at all on a machine
 * with no Graphviz: PlantUML draws a "Cannot find Graphviz" error image, which
 * parses as a diagram with zero entities and would silently score zero. The
 * error image is detected here and reported as a broken oracle rather than as
 * an answer.
 *
 * **Licence.** PlantUML is GPL-2.0-or-later. It is run here as a subprocess,
 * never linked, never vendored, and no PlantUML source is copied into this
 * repository — not a grammar, not a keyword table. The jar is fetched on
 * demand into `harness/vendor/` (gitignored) and the version is pinned. What
 * the reader knows about PlantUML it learned from PlantUML's observable
 * behaviour and from its own `-language` dump.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const CORPUS = path.join(ROOT, "fixtures", "plantuml");
const OUTDIR = path.join(ROOT, "harness", "out");
const VENDOR = path.join(ROOT, "harness", "vendor");
const OUT = path.join(OUTDIR, "plantuml.json");

const VERSION = "1.2025.4";
const JAR = path.join(VENDOR, `plantuml-${VERSION}.jar`);
const URL = `https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/${VERSION}/plantuml-${VERSION}.jar`;

/** An oracle that could not be built is a fact, not a crash. */
function unavailable(reason) {
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ available: false, reason, version: VERSION }, null, 1));
  console.error(`  plantuml oracle unavailable: ${reason}`);
  process.exit(0);
}

function java(args, opts = {}) {
  // JAVA_TOOL_OPTIONS prints a banner to stderr on every launch in some
  // environments, which would end up inside the answers.
  return execFileSync("java", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, JAVA_TOOL_OPTIONS: "" },
    ...opts,
  });
}

// ------------------------------------------------------------------ the jar -
function jar() {
  if (fs.existsSync(JAR)) return JAR;
  fs.mkdirSync(VENDOR, { recursive: true });
  console.error(`  fetching plantuml ${VERSION} (22 MB, once) …`);
  try {
    execFileSync("curl", ["-sSL", "--fail", "-o", JAR, URL], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (err) {
    if (fs.existsSync(JAR)) fs.unlinkSync(JAR);
    unavailable(`could not download plantuml: ${String(err.message ?? err).slice(0, 120)}`);
  }
  return JAR;
}

try {
  java(["-version"]);
} catch {
  unavailable("no java on this machine — PlantUML is a Java program");
}
const PLANTUML = jar();

// ------------------------------------------------------------ the registry -
/**
 * PlantUML's own vocabulary, as `-language` prints it. Read off the tool, so a
 * keyword the next release adds shows up as one this reader does not know
 * rather than hiding.
 */
function registry() {
  let dump = "";
  try {
    dump = java(["-jar", PLANTUML, "-language"]);
  } catch {
    return {};
  }
  const out = {};
  let section = null;
  for (const raw of dump.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith(";")) {
      const name = line.slice(1);
      // `;type` opens a section and the `;43` under it is that section's own
      // count — a header shape, not a section of its own.
      if (/^\d+$/.test(name)) continue;
      section = name === "EOF" ? null : name;
      if (section) out[section] = [];
      continue;
    }
    if (section) out[section].push(line);
  }
  return out;
}

// --------------------------------------------------------------- one file --
const files = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".puml")).sort();
if (files.length === 0) unavailable(`no .puml files in ${CORPUS}`);

/** PlantUML's verdict on whether it can parse the file at all. */
function accepted(file) {
  try {
    java(["-jar", PLANTUML, "-checkonly", path.join(CORPUS, file)]);
    return { accepted: true, error: "" };
  } catch (err) {
    const said = String(err.stdout ?? "") + String(err.stderr ?? "");
    return { accepted: false, error: said.trim().split("\n")[0].slice(0, 180) };
  }
}

const ATTR = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
};

/** What PlantUML drew, read back off the groups it annotated. */
function structure(svg) {
  const out = {
    type: "", entities: [], clusters: [], links: [],
    participants: [], messages: [], texts: [],
  };
  const head = svg.match(/<svg[^>]*>/);
  if (head) out.type = ATTR(head[0], "data-diagram-type");
  for (const tag of svg.match(/<g [^>]*>/g) ?? []) {
    const cls = ATTR(tag, "class");
    if (cls === "entity") {
      out.entities.push({
        id: ATTR(tag, "data-entity"),
        line: Number(ATTR(tag, "data-source-line") || 0),
      });
      continue;
    }
    if (cls === "cluster") {
      out.clusters.push({ id: ATTR(tag, "data-entity") });
      continue;
    }
    if (cls === "link") {
      out.links.push({ source: ATTR(tag, "data-entity-1"), target: ATTR(tag, "data-entity-2") });
      continue;
    }
    if (cls === "message") {
      out.messages.push({
        source: ATTR(tag, "data-participant-1"),
        target: ATTR(tag, "data-participant-2"),
      });
      continue;
    }
    if (cls.startsWith("participant")) {
      const who = ATTR(tag, "data-participant");
      // A participant has a head group and a tail group; it is one participant.
      if (who && !out.participants.includes(who)) out.participants.push(who);
    }
  }
  // Every string PlantUML actually drew. The shallow check for the diagram
  // types that annotate nothing — enough to catch "read as the wrong thing"
  // and "lost half the nodes", and not claimed to be more than that.
  for (const t of svg.match(/<text[^>]*>([^<]*)<\/text>/g) ?? []) {
    const s = t.replace(/<[^>]*>/g, "").replace(/&#160;/g, " ").trim();
    if (s) out.texts.push(s);
  }
  return out;
}

// Render the whole corpus in one JVM, into a scratch directory: the fixtures
// live in the repository and an oracle must not write there.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "rf-puml-"));
let renderError = "";
try {
  java(["-jar", PLANTUML, "-Playout=smetana", "-tsvg", "-o", scratch, path.join(CORPUS, "*.puml")]);
} catch (err) {
  renderError = String(err.stderr ?? err.message ?? err).trim().slice(0, 200);
}

const diagrams = [];
for (const file of files) {
  const svgPath = path.join(scratch, file.replace(/\.puml$/, ".svg"));
  const row = { file, ...accepted(file), type: "", entities: [], clusters: [], links: [], participants: [], messages: [], texts: [] };
  const source = fs.readFileSync(path.join(CORPUS, file), "utf8");
  if (fs.existsSync(svgPath)) {
    const svg = fs.readFileSync(svgPath, "utf8");
    // The one failure that must never be scored as an answer.
    if (svg.includes("Cannot find Graphviz")) {
      unavailable("PlantUML rendered a Graphviz error image — the smetana layout engine did not take");
    }
    Object.assign(row, structure(svg));
    // PlantUML gives a note an entity of its own, under an id it made up
    // (`GMN9`). An id that appears nowhere in the file the author wrote is one
    // of those, and cannot be compared by name — it is counted instead.
    for (const e of row.entities) e.generated = !source.includes(e.id);
  } else {
    row.error = row.error || "PlantUML produced no SVG for this file";
  }
  diagrams.push(row);
}
fs.rmSync(scratch, { recursive: true, force: true });

const reg = registry();
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  available: true,
  version: VERSION,
  renderError,
  registry: Object.fromEntries(Object.entries(reg).map(([k, v]) => [k, v.length])),
  types: reg.type ?? [],
  keywords: reg.keyword ?? [],
  preprocessor: reg.preprocessor ?? [],
  diagrams,
}, null, 1));
console.error(`  plantuml ${VERSION}: ${diagrams.length} diagrams → harness/out/plantuml.json`);
