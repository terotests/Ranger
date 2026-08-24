#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Turn an API model into the standalone Office API reference.
 *
 * This used to write Starlight pages into `docs/site`, and it stopped for a
 * licensing reason rather than a technical one. Everything on these pages is
 * quoted from the facades under `gallery/`: the class descriptions, the
 * paragraph under each method, the sentence in every table row. That text is
 * AGPL. The documentation site is MIT and says so in its own footer, so a
 * page assembled there was AGPL prose published under an MIT notice.
 *
 * The output is therefore plain HTML with no site framework under it, built
 * beside the playground it documents and deployed with it at /office/. One
 * consequence worth stating: no search index and no sidebar generation. Both
 * were the site's, and neither is worth borrowing an incompatible licence for
 * on a reference this size.
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
import { DATA, REGISTRY, ensureDir, readJson } from "./paths.mjs";

const args = process.argv.slice(2);
let OUT = path.join(path.dirname(DATA), "dist");
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out") { OUT = path.resolve(args[++i]); continue; }
  console.error(`unknown argument: ${args[i]}`);
  process.exit(1);
}

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The subset of Markdown the source comments actually contain.
 *
 * They are prose written for a human reading the file: paragraphs separated by
 * blank lines, `backticks` around names, and the occasional bulleted list. A
 * full Markdown library would pull a dependency into a build whose whole point
 * is that it has none, and would render constructs no comment in this
 * repository uses.
 */
function prose(text) {
  if (!text) return "";
  const out = [];
  let list = null;
  const flushList = () => { if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; } };
  for (const block of String(text).split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    if (!lines.join("").trim()) continue;
    if (lines.every((l) => !l.trim() || /^\s{4,}\S/.test(l))) {
      flushList();
      out.push(`<pre><code>${esc(lines.map((l) => l.replace(/^\s{4}/, "")).join("\n"))}</code></pre>`);
      continue;
    }
    if (/^\s*[*-]\s+/.test(lines[0])) {
      // A list item can wrap onto the next line, indented under its bullet.
      const items = [];
      for (const line of lines) {
        if (/^\s*[*-]\s+/.test(line)) items.push(line.replace(/^\s*[*-]\s+/, ""));
        else if (items.length) items[items.length - 1] += " " + line.trim();
      }
      list = items.map((i) => `<li>${inline(i)}</li>`);
      flushList();
      continue;
    }
    flushList();
    out.push(`<p>${inline(lines.join(" "))}</p>`);
  }
  flushList();
  return out.join("\n");
}

/** `code` spans, and nothing else — the comments use nothing else inline. */
function inline(text) {
  return esc(text).replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
}

/**
 * The call as a reader will TYPE it.
 *
 * The prose on this page comes from the Ranger sources, because that is where
 * it is written. The names do not: a reader installs `@ranger/pptx` and gets
 * `Deck`, `Slide`, `Shape` — and `deck.slide(0)` rather than `slideAt`, and
 * `shape.text` rather than `shape.text()`. A reference that showed the Ranger
 * spelling would be a reference to something they cannot call, so the binding
 * is recorded in `api-sources.json` and applied here.
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
  return stop >= 0 ? flat.slice(0, stop + 1) : flat;
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

/** A heading id a link can point at, unique within the page. */
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function classSection(js, cls, nav) {
  const out = [];
  const shown = cls.methods.filter((m) => !m.internal);
  if (!shown.length) return out;

  const owner = (js.classes && js.classes[cls.name]) || cls.name;
  const id = slug(owner);
  nav.push({ id, label: owner });
  out.push(`<h3 id="${id}">${esc(owner)}</h3>`);
  if (cls.doc) out.push(prose(cls.doc));

  out.push("<table>", "<thead><tr><th>Call</th><th>Gives</th><th>What it is for</th></tr></thead>", "<tbody>");
  for (const m of shown) {
    out.push(`<tr><td><code>${esc(signature(js, cls, m))}</code></td>`
      + `<td><code>${esc(jsType(js, m.returns))}</code></td>`
      + `<td>${inline(firstSentence(m.doc))}</td></tr>`);
  }
  out.push("</tbody></table>");

  // The paragraph, for the methods that have one. A single-line comment is
  // already the whole of what the table says; repeating it under a heading
  // pads the page without adding anything.
  for (const m of shown) {
    if (!m.doc || !m.doc.includes("\n")) continue;
    out.push(`<h4 id="${slug(owner + "-" + jsName(js, cls, m).name)}"><code>${esc(signature(js, cls, m))}</code></h4>`);
    out.push(prose(m.doc));
  }
  return out;
}

/**
 * The licence notice, on every page.
 *
 * Not decoration: the sentences above it are copied out of AGPL sources, and a
 * reader who lands here from a search engine has no other way to know that.
 * This is the whole reason the reference is built here rather than in the
 * documentation site.
 */
function notice(root) {
  return [
    '<footer>',
    '<p><strong>Licence.</strong> This page is generated from sources under',
    ' <code>gallery/</code>, which are licensed',
    ' <a href="https://github.com/terotests/Ranger/blob/master/LICENSE-AGPL-3.0">AGPL-3.0-or-later</a>,',
    ' and it quotes them. The Ranger compiler and language, documented separately at',
    ` <a href="${root}docs/">/docs/</a>, are MIT. The two licences are different and this`,
    ' reference follows the code it describes.</p>',
    '</footer>',
  ].join("\n");
}

const STYLE = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: #12151a; color: #e8ecf2;
       font: 15px/1.65 ui-sans-serif, system-ui, "Segoe UI", sans-serif; }
a { color: #7cc0ff; }
header { padding: 18px 24px 14px; border-bottom: 1px solid #232a33; }
header h1 { margin: 0 0 4px; font-size: 1.15rem; font-weight: 650; }
header p { margin: 0; color: #9fb0c4; font-size: 0.88rem; }
nav.top { display: flex; gap: 14px; flex-wrap: wrap; padding: 10px 24px;
          border-bottom: 1px solid #232a33; font-size: 0.85rem; }
main { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 0; align-items: start; }
@media (max-width: 860px) { main { grid-template-columns: 1fr; } nav.side { display: none; } }
nav.side { position: sticky; top: 0; padding: 20px 12px 20px 24px; font-size: 0.85rem; }
nav.side ul { list-style: none; margin: 0 0 14px; padding: 0; }
nav.side li { margin: 2px 0; }
nav.side .group { color: #9fb0c4; text-transform: uppercase; letter-spacing: 0.04em;
                  font-size: 0.7rem; margin: 12px 0 4px; }
article { padding: 20px 24px 60px; max-width: 62rem; min-width: 0; }
h2 { margin: 32px 0 10px; font-size: 1.25rem; border-bottom: 1px solid #232a33; padding-bottom: 6px; }
h3 { margin: 28px 0 8px; font-size: 1.05rem; color: #cfe3ff; }
h4 { margin: 22px 0 6px; font-size: 0.95rem; font-weight: 600; }
p { margin: 0 0 12px; }
code { background: #1b212a; padding: 1px 5px; border-radius: 3px;
       font: 0.86em/1.4 ui-monospace, Menlo, Consolas, monospace; }
pre { background: #0e1116; border: 1px solid #232a33; border-radius: 5px;
      padding: 10px 12px; overflow-x: auto; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 0 0 16px; display: block; overflow-x: auto; }
th, td { text-align: left; vertical-align: top; padding: 6px 10px;
         border-bottom: 1px solid #232a33; font-size: 0.9rem; }
th { color: #9fb0c4; font-weight: 600; white-space: nowrap; }
details { margin: 0 0 14px; border: 1px solid #232a33; border-radius: 5px; padding: 8px 12px; }
summary { cursor: pointer; color: #9fb0c4; font-size: 0.9rem; }
footer { margin-top: 40px; border-top: 1px solid #232a33; padding-top: 14px;
         color: #9fb0c4; font-size: 0.83rem; }
`.trim();

/**
 * `root` is the way back to the top of the deployed site, because the pages sit
 * at different depths (`/office/reference/` and `/office/reference/pptx/`) and
 * the links off this reference — to the playground and to the MIT language
 * documentation — leave it. Built into a bare directory with nothing around
 * it, those two links point at nothing; the reference itself still reads.
 */
function page(title, description, bodyHtml, navHtml, root) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Office API reference</title>
<meta name="description" content="${esc(description)}">
<style>
${STYLE}
</style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
</header>
<nav class="top">
  <a href="${root}office/reference/">Reference</a>
  <a href="${root}office/">Playground</a>
  <a href="${root}docs/">Ranger documentation</a>
  <a href="https://github.com/terotests/Ranger">Source</a>
</nav>
<main>
<nav class="side">
${navHtml}
</nav>
<article>
${bodyHtml}
${notice(root)}
</article>
</main>
</body>
</html>
`;
}

function renderApi(api) {
  const body = [];
  const nav = [];
  body.push(`<p>Installed as <code>${esc(api.package)}</code>.</p>`);
  body.push(`<p>${inline(api.summary)}</p>`);
  body.push('<p><em>Generated from the Ranger sources that declare the surface — '
    + api.entries.map((e) => `<code>${esc(e.file)}</code>`).join(" and ")
    + ' — so this page cannot describe a method that is not there.</em></p>');

  for (const entry of api.entries) {
    const id = slug(entry.title);
    nav.push({ id, label: entry.title, group: true });
    body.push(`<h2 id="${id}">${esc(entry.title)}</h2>`);
    body.push(`<pre><code>import { … } from "${esc(entry.import)}";</code></pre>`);
    if (entry.summary) body.push(`<p>${inline(entry.summary)}</p>`);
    if (entry.doc) {
      // The file's own banner says what the module is and why it is separate.
      body.push("<details><summary>Why this is its own module</summary>", prose(entry.doc), "</details>");
    }
    const js = entry.js || {};
    for (const cls of entry.classes) body.push(...classSection(js, cls, nav));
  }

  const navHtml = ["<ul>"];
  for (const n of nav) {
    if (n.group) navHtml.push(`</ul><div class="group">${esc(n.label)}</div><ul>`);
    else navHtml.push(`<li><a href="#${n.id}">${esc(n.label)}</a></li>`);
  }
  navHtml.push("</ul>");
  return page(api.title, api.summary, body.join("\n"), navHtml.join("\n"), "../../../");
}

function renderIndex(registry) {
  const rows = registry.apis.map((a) =>
    `<tr><td><a href="${a.id}/">${esc(a.title)}</a></td>`
    + `<td><code>${esc(a.package)}</code></td><td>${inline(a.summary)}</td></tr>`);
  const body = [
    "<p>Three document formats, three APIs, one shared infrastructure — the fonts,",
    "the bidirectional text, the geometry and the renderers are common, and the",
    "document models are not. Merging Word, Excel and PowerPoint into one model",
    "is the mistake this gallery is built to avoid; merging what they run on is",
    "the point of it.</p>",
    "<table><thead><tr><th>API</th><th>Package</th><th>What it does</th></tr></thead>",
    "<tbody>", ...rows, "</tbody></table>",
  ].join("\n");
  const nav = ["<ul>", ...registry.apis.map((a) => `<li><a href="${a.id}/">${esc(a.title)}</a></li>`), "</ul>"].join("\n");
  return page("Office APIs", "Read and write Word, Excel and PowerPoint documents from JavaScript.", body, nav, "../../");
}

function main() {
  const registry = readJson(REGISTRY);
  ensureDir(OUT);
  const written = [];
  for (const api of registry.apis) {
    const model = readJson(path.join(DATA, `${api.id}-api.json`));
    // One directory per API, so the link on the index is `pptx/` and the page
    // beside it can reach `../../docs/` whatever the site is mounted under.
    const dir = ensureDir(path.join(OUT, api.id));
    const file = path.join(dir, "index.html");
    fs.writeFileSync(file, renderApi(model));
    written.push(file);
  }
  const index = path.join(OUT, "index.html");
  fs.writeFileSync(index, renderIndex(registry));
  written.push(index);
  for (const w of written) console.log(`  wrote ${path.relative(process.cwd(), w)}`);
}

main();
