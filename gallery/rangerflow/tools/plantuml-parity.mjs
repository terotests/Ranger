/**
 * plantuml-parity.mjs — how much of PlantUML's own examples RangerFlow reads.
 *
 * Two inputs, neither of them an opinion:
 *
 *   harness/out/plantuml.json              computed by PlantUML itself
 *   harness/out/rangerflow_plantuml.json   computed by RangerFlow's readers
 *
 * over the same corpus, `fixtures/plantuml/`. Every diagram is compared on what
 * a reader can be wrong about — which diagram it is, whether it parses at all,
 * the entity ids, the packages, the link endpoints, the participants and the
 * message endpoints. Nothing about geometry: PlantUML lays a diagram out its
 * own way and has no opinion about RangerFlow's, so comparing positions would
 * measure two layouts rather than one reader.
 *
 *   npm run rangerflow:plantuml:parity
 *   npm run rangerflow:plantuml:parity -- --diff     every mismatch, in full
 *
 * The two vocabularies meet here and nowhere else. PlantUML says `SEQUENCE`
 * and `DESCRIPTION`; RangerFlow says `sequence` and `description`. Translating
 * in one file keeps the model free of a foreign tool's spelling.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "harness", "out");
const DOC = path.join(ROOT, "docs", "PLANTUML_PARITY.md");
const wantDiff = process.argv.slice(2).includes("--diff");

const read = (name) => {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};

const ours = read("rangerflow_plantuml.json");
if (!ours) {
  console.error("  no rangerflow_plantuml.json — run: npm run rangerflow:plantuml:parity");
  process.exit(1);
}
const oracle = read("plantuml.json");
if (!oracle || oracle.available === false) {
  const why = oracle?.reason ?? "the oracle was never built";
  console.error(`  no PlantUML answers to compare against: ${why}`);
  fs.writeFileSync(DOC, `# PlantUML parity — not measured\n\n> ${why}\n\n` +
    `Without PlantUML there is nothing to agree with, and a number written here anyway\n` +
    `would be a number nobody computed. Install a JVM and re-run\n` +
    `\`npm run rangerflow:plantuml:parity\`.\n`);
  process.exit(0);
}

// ------------------------------------------------------------- vocabulary --
/** RangerFlow's name for the diagram PlantUML drew. */
const KIND = {
  SEQUENCE: "sequence", CLASS: "class", DESCRIPTION: "description",
  STATE: "state", ACTIVITY: "activity", TIMING: "timing", MINDMAP: "mindmap",
  WBS: "wbs", GANTT: "gantt", JSON: "json", YAML: "yaml", HCL: "hcl",
  SALT: "salt", WIRE: "salt", EBNF: "ebnf", REGEX: "regex", NWDIAG: "nwdiag",
  CHEN_EER: "chen", BOARD: "board", FILES: "files",
};

/**
 * Which checks a diagram can be scored on.
 *
 * Not every family answers every question, and pretending otherwise would
 * inflate the score with checks that pass because both sides said nothing.
 * PlantUML annotates entities and links for the CLASS and DESCRIPTION
 * families, participants and messages for SEQUENCE, links only for STATE, and
 * nothing at all for the rest — for those the check is that the type is read
 * as the type it is, which is the one a reader of somebody else's file must
 * not get wrong.
 */
function checksFor(type) {
  // A few of PlantUML's own diagrams write no `data-diagram-type` at all —
  // ditaa is a picture of ASCII art rather than a diagram it modelled. There
  // is nothing to agree with, so the type is not scored; whether this reader
  // recognises and refuses the header is in the table below instead.
  if (!type) return ["accepted"];
  if (type === "SEQUENCE") return ["type", "accepted", "participants", "messages"];
  if (type === "CLASS" || type === "DESCRIPTION") return ["type", "accepted", "entities", "clusters", "links", "notes"];
  return ["type", "accepted"];
}

const norm = (list) => [...list].sort().join("|");
const pairs = (list) => list.map((m) => `${m.source}->${m.target}`).join(",");

// ----------------------------------------------------------------- scoring --
const rows = [];
let pass = 0;
let total = 0;
const misses = [];

for (const want of oracle.diagrams) {
  const got = ours.diagrams.find((d) => d.file === want.file);
  const checks = checksFor(want.type);
  const row = { file: want.file, type: want.type, cells: {} };
  // PlantUML's own notes come back under ids it made up, so they are counted
  // rather than named. See the oracle.
  const named = want.entities.filter((e) => !e.generated);
  const madeUp = want.entities.length - named.length;

  for (const check of checks) {
    total += 1;
    let ok = false;
    let why = "";
    if (!got) {
      why = "RangerFlow read nothing";
    } else if (check === "type") {
      const expect = KIND[want.type] ?? "";
      ok = got.kind === expect;
      why = `type ${got.kind} ≠ ${expect || "(none)"}`;
    } else if (check === "accepted") {
      // The check that matters most: a file PlantUML rejects and RangerFlow
      // reads happily means we invented syntax.
      ok = want.accepted;
      why = `PlantUML rejected it: ${want.error}`;
    } else if (check === "entities") {
      ok = norm(named.map((e) => e.id)) === norm(got.entities.map((e) => e.id));
      why = `entities ${norm(got.entities.map((e) => e.id))} ≠ ${norm(named.map((e) => e.id))}`;
    } else if (check === "clusters") {
      ok = norm(want.clusters.map((c) => c.id)) === norm(got.clusters);
      why = `clusters ${norm(got.clusters)} ≠ ${norm(want.clusters.map((c) => c.id))}`;
    } else if (check === "links") {
      ok = pairs(want.links) === pairs(got.links);
      why = `links ${pairs(got.links)} ≠ ${pairs(want.links)}`;
    } else if (check === "notes") {
      ok = madeUp === (got.notes ?? 0);
      why = `${got.notes ?? 0} notes read, PlantUML drew ${madeUp}`;
    } else if (check === "participants") {
      ok = norm(want.participants) === norm(got.participants);
      why = `participants ${norm(got.participants)} ≠ ${norm(want.participants)}`;
    } else if (check === "messages") {
      ok = pairs(want.messages) === pairs(got.messages);
      why = `messages ${pairs(got.messages)} ≠ ${pairs(want.messages)}`;
    }
    row.cells[check] = ok;
    if (ok) pass += 1;
    else misses.push({ file: want.file, check, why });
  }
  rows.push(row);
}

// -------------------------------------------------------------- the report --
const ALL = ["type", "accepted", "entities", "clusters", "links", "notes", "participants", "messages"];
const cell = (row, name) => (name in row.cells ? (row.cells[name] ? "✓" : "✗") : "—");
const pct = total === 0 ? 0 : Math.round((pass / total) * 100);

let md = `# PlantUML parity — the measured one\n\n`;
md += `> Regenerated by \`npm run rangerflow:plantuml:parity\`. Every number here comes\n`;
md += `> from **PlantUML itself**, run over the same files in \`fixtures/plantuml/\` and\n`;
md += `> asked what it understood. Nothing is transcribed, so nothing can be\n`;
md += `> transcribed wrong.\n\n`;
md += `PlantUML ${oracle.version} · ${rows.length} diagrams · **${pass}/${total} checks agree (${pct}%)**\n\n`;
md += `| example | PlantUML calls it | read as | parses | entities | packages | links | notes | participants | messages |\n`;
md += `| --- | --- | --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
for (const r of rows) {
  const mine = ours.diagrams.find((d) => d.file === r.file);
  md += `| \`${r.file}\` | ${r.type || "—"} | ${mine?.kind || "—"} ${cell(r, "type")} | ${cell(r, "accepted")} `;
  md += `| ${cell(r, "entities")} | ${cell(r, "clusters")} | ${cell(r, "links")} | ${cell(r, "notes")} `;
  md += `| ${cell(r, "participants")} | ${cell(r, "messages")} |\n`;
}

if (misses.length > 0) {
  md += `\n## Where they disagree\n\n`;
  for (const m of misses) md += `- **\`${m.file}\`** — ${m.check}: ${m.why}\n`;
}

// ------------------------------------------------------ drawn, or refused --
md += `\n## Drawn, and refused\n\n`;
md += `A header this reader does not know must **not** fall through to the entity\n`;
md += `parser: a ditaa block read as a component diagram is a page of invented boxes.\n`;
md += `So every \`@start\` word is either drawn, or recognised **and refused**.\n\n`;
md += `| \`@start\` word | RangerFlow |\n| --- | --- |\n`;
for (const o of ours.openers ?? []) {
  if (!o.kind) {
    // `@startuml` commits the file to nothing: the body decides which of the
    // five UML diagrams it is, and three of the five are drawn.
    md += `| \`${o.opener}\` | **drawn** — the body decides which diagram it is; see the sniff |\n`;
    continue;
  }
  md += `| \`${o.opener}\` | ${o.draws ? "**drawn**" : "recognised, and refused"} — read as \`${o.kind}\` |\n`;
}

// --------------------------------------------------------- the vocabulary --
md += `\n## PlantUML's own vocabulary\n\n`;
md += `Read off the installed PlantUML with \`-language\` rather than typed here, so a\n`;
md += `keyword added upstream appears the next time the harness runs.\n\n`;
md += `| section | PlantUML has | notes |\n| --- | ---: | --- |\n`;
const reg = oracle.registry ?? {};
md += `| declaration keywords | ${reg.type ?? 0} | every one is read — \`PlantUmlEntityReader.isTypeWord\` |\n`;
md += `| statement keywords | ${reg.keyword ?? 0} | the ones that change what is drawn |\n`;
md += `| preprocessor commands | ${reg.preprocessor ?? 0} | **recognised, counted and dropped** — not expanded |\n`;
md += `| skinparameters | ${reg.skinparameter ?? 0} | style; see the plan |\n`;
md += `| named colours | ${reg.color ?? 0} | style |\n`;

md += `\n## What this compares\n\n`;
md += `- **The reading, not the drawing.** PlantUML lays a diagram out its own way\n`;
md += `  and has no opinion about RangerFlow's, so comparing positions would measure\n`;
md += `  two layouts rather than one reader.\n`;
md += `- **Not every diagram equally.** PlantUML annotates its own SVG with the ids\n`;
md += `  it used — \`class="entity"\`, \`class="link"\`, \`class="cluster"\`,\n`;
md += `  \`class="message"\` — for the class, description and sequence families, and\n`;
md += `  with nothing at all for a mindmap or a Gantt chart. Where there is nothing to\n`;
md += `  compare, the check is that the type is read as the type it is, and the table\n`;
md += `  says \`—\` rather than pretending to a tick.\n`;
md += `- **\`parses\` is PlantUML's verdict, not ours.** A file PlantUML rejects and\n`;
md += `  RangerFlow reads happily means this reader invented syntax.\n`;
md += `- **Notes are counted, not named.** PlantUML gives a note an entity of its own\n`;
md += `  under an id it made up (\`GMN9\`); an id that appears nowhere in the file the\n`;
md += `  author wrote is one of those.\n`;
md += `- **The vocabularies meet in \`tools/plantuml-parity.mjs\`.** PlantUML says\n`;
md += `  \`DESCRIPTION\`, RangerFlow says \`description\`. The translation lives in the\n`;
md += `  meter so neither model has to hold the other's spelling.\n`;
md += `- **PlantUML is GPL and is never linked.** It is run as a subprocess, fetched\n`;
md += `  on demand into \`harness/vendor/\` and not vendored, and no PlantUML source is\n`;
md += `  copied into this repository. See \`docs/PLAN_PLANTUML.md\` §3.5.\n`;

fs.writeFileSync(DOC, md);
console.log(`  PlantUML ${oracle.version}: ${pass}/${total} checks agree (${pct}%) over ${rows.length} diagrams`);
console.log(`  wrote ${path.relative(process.cwd(), DOC)}`);
if (misses.length > 0) {
  console.log(`  ${misses.length} disagreements:`);
  for (const m of misses.slice(0, wantDiff ? misses.length : 8)) {
    console.log(`    ${m.file} — ${m.check}: ${m.why}`);
  }
}
