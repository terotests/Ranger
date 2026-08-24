#!/usr/bin/env node
/**
 * Turn an API model into Starlight pages under /docs/office/.
 *
 * One page per API, with a section per entry point and a table plus a
 * description list per class. The reason for a table AND a list is that they
 * answer different questions: the table is "what can I call", read by someone
 * scanning, and the list is "what does this one do and why", read by someone
 * who found the name and now needs the paragraph that says which mistake the
 * method exists to prevent. A reference with only the table is a list of
 * signatures, which the .d.ts already gives.
 *
 * Internal members are left out — see `@internal` in extract-api.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { CONTENT, DATA, DOCS, ensureDir, readJson } from "./lib/paths.mjs";

const OUT = path.join(CONTENT, "office");

/** Starlight front matter. A colon or a quote in a title breaks bare YAML. */
function frontMatter(title, description, order) {
  const esc = (s) => String(s).replace(/"/g, '\\"');
  return [
    "---",
    `title: "${esc(title)}"`,
    `description: "${esc(description)}"`,
    "sidebar:",
    `  order: ${order}`,
    "---",
    "",
  ].join("\n");
}

/**
 * The call as a reader will TYPE it.
 *
 * The prose on this page comes from the Ranger sources, because that is where
 * it is written. The names do not: a reader installs `@ranger/pptx` and gets
 * `Deck`, `Slide`, `Shape` — and `deck.slide(0)` rather than `slideAt`, and
 * `shape.text` rather than `shape.text()`. A reference that showed the Ranger
 * spelling would be a reference to something they cannot call, so the binding
 * is recorded in `docs/api-sources.json` and applied here.
 */
function jsName(js, cls, m) {
  const owner = (js.classes && js.classes[cls.name]) || cls.name;
  const renamed = (js.renames && js.renames[`${cls.name}.${m.name}`]) || m.name;
  const getters = (js.getters && js.getters[cls.name]) || [];
  const isGetter = getters.includes(m.name) && m.args.length === 0;
  return { owner, name: renamed, isGetter };
}

function signature(js, cls, m) {
  const { owner, name, isGetter } = jsName(js, cls, m);
  const recv = m.kind === "static" ? owner : owner.toLowerCase();
  if (isGetter) return `${recv}.${name}`;
  const args = m.args.map((a) => a.name).join(", ");
  return `${recv}.${name}(${args})`;
}

/** The first sentence, for the scanning table. */
function firstSentence(doc) {
  if (!doc) return "";
  const flat = doc.split("\n\n")[0].replace(/\n/g, " ").trim();
  const stop = flat.search(/\.\s|\.$/);
  const one = stop >= 0 ? flat.slice(0, stop + 1) : flat;
  // A pipe would end the table cell it is sitting in.
  return one.replace(/\|/g, "\\|");
}

/** A Ranger type as the JavaScript package spells it. */
function jsType(js, t) {
  const map = { buffer: "Uint8Array", double: "number", int: "number", string: "string", boolean: "boolean", void: "void" };
  const cls = (js.classes && js.classes[t]) || null;
  if (cls) return cls;
  if (map[t]) return map[t];
  // `[string]` is an array of them.
  const arr = /^\[(\w+)\]$/.exec(t);
  if (arr) return `${jsType(js, arr[1])}[]`;
  return t;
}

function classSection(js, cls) {
  const out = [];
  const shown = cls.methods.filter((m) => !m.internal);
  if (!shown.length) return out;

  const owner = (js.classes && js.classes[cls.name]) || cls.name;
  out.push(`### ${owner}`, "");
  if (cls.doc) out.push(cls.doc, "");

  out.push("| Call | Gives | What it is for |", "| --- | --- | --- |");
  for (const m of shown) {
    out.push(`| \`${signature(js, cls, m)}\` | \`${jsType(js, m.returns)}\` | ${firstSentence(m.doc)} |`);
  }
  out.push("");

  // The paragraph, for the methods that have one. A single-line comment is
  // already the whole of what the table says; repeating it under a heading
  // pads the page without adding anything.
  for (const m of shown) {
    if (!m.doc || !m.doc.includes("\n")) continue;
    out.push(`#### \`${signature(js, cls, m)}\``, "", m.doc, "");
  }
  return out;
}

function renderApi(api) {
  const body = [];
  body.push(frontMatter(
    api.title,
    api.summary,
    api.id === "pptx" ? 1 : 2,
  ));
  body.push(`Installed as \`${api.package}\`.`, "", api.summary, "");
  body.push(
    ":::note",
    "Generated from the Ranger sources that declare the surface —",
    api.entries.map((e) => `\`${e.file}\``).join(" and "),
    "— so this page cannot describe a method that is not there.",
    ":::",
    "",
  );

  for (const entry of api.entries) {
    body.push(`## ${entry.title}`, "");
    body.push(`\`\`\`js\nimport { … } from "${entry.import}";\n\`\`\``, "");
    if (entry.summary) body.push(entry.summary, "");
    if (entry.doc) {
      // The file's own banner says what the module is and why it is separate.
      body.push("<details>", "<summary>Why this is its own module</summary>", "");
      body.push(entry.doc, "");
      body.push("</details>", "");
    }
    const js = entry.js || {};
    for (const cls of entry.classes) body.push(...classSection(js, cls));
  }

  return body.join("\n");
}

function main() {
  const registry = readJson(path.join(DOCS, "api-sources.json"));
  ensureDir(OUT);
  const written = [];
  for (const api of registry.apis) {
    const model = readJson(path.join(DATA, `${api.id}-api.json`));
    const file = path.join(OUT, `${api.id}.mdx`);
    fs.writeFileSync(file, renderApi(model));
    written.push(path.relative(CONTENT, file));
  }

  // An index, so /docs/office/ is a place rather than a 404 between pages.
  const index = [
    frontMatter("Office APIs", "Read and write Word, Excel and PowerPoint documents from JavaScript.", 0),
    "Three document formats, three APIs, one shared infrastructure — the fonts,",
    "the bidirectional text, the geometry and the renderers are common, and the",
    "document models are not. Merging Word, Excel and PowerPoint into one model",
    "is the mistake this gallery is built to avoid; merging what they run on is",
    "the point of it.",
    "",
    "| API | Package | What it does |",
    "| --- | --- | --- |",
    ...registry.apis.map((a) =>
      `| [${a.title}](/docs/office/${a.id}/) | \`${a.package}\` | ${a.summary} |`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "index.mdx"), index);
  written.push(path.relative(CONTENT, path.join(OUT, "index.mdx")));

  for (const w of written) console.log(`  wrote ${w}`);
}

main();
