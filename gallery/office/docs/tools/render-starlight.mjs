#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Turn an API model into Starlight Markdown pages.
 *
 * These pages are the Office reference, published at /office/reference/ with
 * the same Starlight chrome as the language documentation — without putting
 * AGPL quotes into that MIT tree.
 *
 * Writes gallery/office/docs/site/src/content/docs/<page>.md (or .mdx when
 * the page embeds a live example). The page name is `api.page` or `api.id`,
 * so PowerPoint stays at /office/reference/pptx/. Those files are generated.
 * They are not in git.
 */
import fs from "node:fs";
import path from "node:path";
import { DATA, HOME, REGISTRY, ensureDir, readJson } from "./paths.mjs";

const CONTENT = path.join(HOME, "site", "src", "content", "docs");
const REPOSITORY = "https://github.com/terotests/Ranger";

function escapeYaml(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** A Ranger comment as Markdown. The comments use paragraphs, `code` and lists. */
function mdProse(text) {
  if (!text) return "";
  const out = [];
  for (const block of String(text).split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    if (!lines.join("").trim()) continue;
    if (lines.every((l) => !l.trim() || /^\s{4,}\S/.test(l))) {
      const body = lines.map((l) => l.replace(/^\s{4}/, "")).join("\n");
      out.push("```\n" + body + "\n```");
      continue;
    }
    if (/^\s*[*-]\s+/.test(lines[0])) {
      const items = [];
      for (const line of lines) {
        if (/^\s*[*-]\s+/.test(line)) items.push(line.replace(/^\s*[*-]\s+/, ""));
        else if (items.length) items[items.length - 1] += " " + line.trim();
      }
      out.push(items.map((i) => `- ${mdxText(i)}`).join("\n"));
      continue;
    }
    out.push(mdxText(lines.join(" ")));
  }
  return out.join("\n\n");
}

function jsName(js, cls, m) {
  const owner = (js.classes && js.classes[cls.name]) || cls.name;
  const renamed = (js.renames && js.renames[`${cls.name}.${m.name}`]) || m.name;
  const getters = (js.getters && js.getters[cls.name]) || [];
  const isGetter = getters.includes(m.name) && m.args.length === 0;
  return { owner, name: renamed, isGetter };
}

function signature(js, cls, m) {
  const { owner, name, isGetter } = jsName(js, cls, m);
  const recv = m.kind === "static" ? owner : owner.charAt(0).toLowerCase() + owner.slice(1);
  if (isGetter) return `${recv}.${name}`;
  const args = m.args.map((a) => a.name).join(", ");
  return `${recv}.${name}(${args})`;
}

function firstSentence(doc) {
  if (!doc) return "";
  const flat = doc.split("\n\n")[0].replace(/\n/g, " ").trim();
  const stop = flat.search(/\.\s|\.$/);
  return stop >= 0 ? flat.slice(0, stop + 1) : flat;
}

function jsType(js, t) {
  const map = { buffer: "Uint8Array", double: "number", int: "number", string: "string", boolean: "boolean", void: "void" };
  const cls = (js.classes && js.classes[t]) || null;
  if (cls) return cls;
  if (map[t]) return map[t];
  const arr = /^\[(\w+)\]$/.exec(t);
  if (arr) return `${jsType(js, arr[1])}[]`;
  return t;
}

function cell(text) {
  return mdxText(String(text).replace(/\|/g, "\\|").replace(/\n/g, " "));
}

/** MDX treats `{` as an expression. Code fences are safe; the rest is not. */
function mdxText(text) {
  return String(text).replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function isRanger(entry) {
  return entry.language === "ranger" || (entry.js && entry.js.language === "ranger");
}

function importFence(entry) {
  if (isRanger(entry)) {
    return "```lisp\nImport \"" + entry.import + "\"\n```";
  }
  return "```js\nimport { … } from \"" + entry.import + "\";\n```";
}

function classSection(js, cls, ranger) {
  const out = [];
  const shown = cls.methods.filter((m) => !m.internal);
  if (!shown.length) return out;

  const owner = (js.classes && js.classes[cls.name]) || cls.name;
  out.push(`### ${owner}`);
  out.push("");
  if (cls.doc) {
    out.push(mdProse(cls.doc));
    out.push("");
  }

  out.push("| Call | Gives | What it is for |");
  out.push("| --- | --- | --- |");
  for (const m of shown) {
    const call = ranger ? rangerSignature(cls, m) : signature(js, cls, m);
    const gives = ranger ? (m.returns || "void") : jsType(js, m.returns);
    out.push(`| \`${cell(call)}\` | \`${cell(gives)}\` | ${cell(firstSentence(m.doc))} |`);
  }
  out.push("");

  for (const m of shown) {
    if (!m.doc || !m.doc.includes("\n")) continue;
    const call = ranger ? rangerSignature(cls, m) : signature(js, cls, m);
    out.push(`#### \`${call}\``);
    out.push("");
    out.push(mdProse(m.doc));
    out.push("");
  }
  return out;
}

/** Ranger spelling: `chart.bar()` rather than a JavaScript getter. */
function rangerSignature(cls, m) {
  const names = { VlChart: "chart", VlChartMark: "mark", VlDataset: "dataset", VlDataRow: "row" };
  const owner = m.kind === "static"
    ? cls.name
    : (names[cls.name] || (cls.name.charAt(0).toLowerCase() + cls.name.slice(1)));
  const args = m.args.map((a) => a.name).join(" ");
  if (m.args.length === 0) return `${owner}.${m.name}()`;
  return `${owner}.${m.name}(${args})`;
}

function renderApi(api, order) {
  const body = [];
  const rangerApi = api.kind === "ranger";
  const livePptx = api.id === "pptx";
  body.push("---");
  body.push(`title: "${escapeYaml(api.title)}"`);
  body.push(`description: "${escapeYaml(api.summary)}"`);
  body.push("sidebar:");
  body.push(`  order: ${order}`);
  body.push("---");
  body.push("");
  if (livePptx) {
    body.push('import PptxApiExample from "../../components/PptxApiExample.astro";');
    body.push('import { createTitleSlide, severalSlides } from "../../examples/pptx-live.js";');
    body.push("");
  }
  if (rangerApi) {
    body.push("A Ranger API. There is no npm package yet. Import the source, or use the compiled classes on the [live chart page](/Ranger/evg/chart-api/).");
  } else {
    body.push(`Installed as \`${api.package}\`.`);
  }
  body.push("");
  body.push(mdxText(api.summary));
  body.push("");
  body.push("*Generated from the Ranger sources that declare the surface — "
    + api.entries.map((e) => `\`${e.file}\``).join(" and ")
    + " — so this page cannot describe a method that is not there.*");
  body.push("");

  for (const entry of api.entries) {
    const ranger = rangerApi || isRanger(entry);
    body.push(`## ${entry.title}`);
    body.push("");
    body.push(importFence(entry));
    body.push("");
    if (entry.summary) {
      body.push(mdxText(entry.summary));
      body.push("");
    }
    if (entry.doc) {
      body.push(":::note[Why this is its own module]");
      body.push(mdProse(entry.doc));
      body.push(":::");
      body.push("");
    }
    const js = entry.js || {};
    for (const cls of entry.classes) {
      body.push(...classSection(js, cls, ranger));
      const owner = (js.classes && js.classes[cls.name]) || cls.name;
      if (owner === "Pptx") {
        body.push("The two programs below call this API in the page. Edit the");
        body.push("JavaScript and press **Run**. The viewer opens the `.pptx` the");
        body.push("code produced — not a preview of the model in memory.");
        body.push("");
        body.push('<PptxApiExample title="Pptx.create — a title slide" code={createTitleSlide} />');
        body.push("");
        body.push('<PptxApiExample title="deck.addSlide — a three-slide stack" code={severalSlides} />');
        body.push("");
      }
    }
  }

  body.push("## Source");
  body.push("");
  for (const entry of api.entries) {
    body.push(`- [\`${entry.file}\`](${REPOSITORY}/blob/master/${entry.file})`);
  }
  body.push("");
  body.push("Licence: AGPL-3.0-or-later. This page quotes the comments in those files.");
  body.push("");
  return body.join("\n");
}

function main() {
  const registry = readJson(REGISTRY);
  ensureDir(CONTENT);
  const written = [];
  for (const [i, api] of registry.apis.entries()) {
    const model = readJson(path.join(DATA, `${api.id}-api.json`));
    const page = api.page || api.id;
    const ext = api.id === "pptx" ? ".mdx" : ".md";
    const file = path.join(CONTENT, `${page}${ext}`);
    const stale = path.join(CONTENT, `${page}${ext === ".mdx" ? ".md" : ".mdx"}`);
    if (fs.existsSync(stale)) fs.unlinkSync(stale);
    fs.writeFileSync(file, renderApi(model, 10 + i));
    written.push(file);
  }
  for (const w of written) {
    console.log(`  wrote ${path.relative(process.cwd(), w)}`);
  }
}

main();
