#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Build the model of a published API surface, from the Ranger that declares it.
 *
 * The operator reference next door is generated from `compiler/Lang.rgr` by
 * compiling a probe and asking the writer context what it registered. That
 * cannot work here: an API facade declares no operators, and what needs
 * documenting is its CLASSES — their methods, the types, and the long comments
 * above them that say what each is for and which bug it exists to prevent.
 *
 * So this reads the source. The subset it has to understand is small, because
 * a facade is written to be read:
 *
 *     ; a documentary comment, one or more `;` lines
 *     class Name {
 *         def field:Type value
 *         fn method:Return (arg:Type other:Type) {
 *         sfn static:Return (arg:Type) {
 *     }
 *
 * The rule that matters is that the comment belongs to whatever it sits
 * directly above, with no blank line between. That is the house style already
 * — every facade in this repository is written that way — so the documentation
 * is the source rather than a second description of it that drifts.
 *
 * Writes gallery/office/docs/.model/<id>-api.json, which the renderer next
 * door turns into pages. Both the model and the pages stay under gallery/:
 * the comments this reads are AGPL text, and the documentation site is MIT.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, REGISTRY, DATA, readJson, writeJson } from "./paths.mjs";

/**
 * Plumbing a caller never touches, marked in the source.
 *
 * A handle's `model()` and `touch()` are real methods and have to be public to
 * the code beside them, and putting them on a reference page would invite
 * somebody to reach past the API into the model — where nothing marks a slide
 * dirty and an edit is silently dropped at save. `; @internal` on the comment
 * keeps them out of the documentation without hiding them from the source.
 */
const INTERNAL = /^@internal\b\s*/;

/** A `;` comment block, cleaned of its markers and its box-drawing rules. */
function commentText(lines) {
  const out = [];
  for (const raw of lines) {
    let t = raw.trim();
    if (!t.startsWith(";")) continue;
    t = t.slice(1);
    if (t.startsWith(" ")) t = t.slice(1);
    // The `===` and `---` rules that head a file's banner are decoration; a
    // line of them in the middle of a paragraph would render as a heading.
    if (/^[=\-]{3,}$/.test(t.trim())) continue;
    out.push(t);
  }
  // Trim blank lines at both ends without touching the ones between paragraphs.
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.join("\n");
}

/** The comment block directly above `i`, or "". A blank line breaks it. */
function docAbove(lines, i) {
  const block = [];
  let k = i - 1;
  while (k >= 0) {
    const t = lines[k].trim();
    if (t.startsWith(";")) { block.unshift(lines[k]); k--; continue; }
    break;
  }
  return commentText(block);
}

/**
 * `(name:Type other:Type)` → [{name, type}].
 *
 * Split on whitespace rather than on commas: Ranger's argument lists have no
 * commas in them, and a first version that looked for them found one argument
 * per method and reported every signature as unary.
 */
function parseArgs(text) {
  const inner = text.trim();
  if (!inner) return [];
  return inner.split(/\s+/).filter(Boolean).map((tok) => {
    const at = tok.indexOf(":");
    if (at < 0) return { name: tok, type: "" };
    return { name: tok.slice(0, at), type: tok.slice(at + 1) };
  });
}

const CLASS_RE = /^class\s+([A-Za-z_][\w]*)\s*(?:extends\s+[\w]+\s*)?\{/;
const FN_RE = /^(sfn|fn)\s+([A-Za-z_][\w]*)(@\(optional\))?:([\w\[\]:]+)?\s*(?:@\(optional\))?\s*\(([^)]*)\)/;
const DEF_RE = /^(sdef|def)\s+([A-Za-z_][\w]*)(@\(optional\))?:([\w\[\]:]+)/;

/** Splits `@internal` off the front of a comment. */
function docFields(doc) {
  if (INTERNAL.test(doc)) return { doc: doc.replace(INTERNAL, ""), internal: true };
  return { doc, internal: false };
}

function parseFile(relFile) {
  const abs = path.join(ROOT, relFile);
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  const classes = [];
  let current = null;
  let depth = 0;

  // The file's own banner: the first comment block that is not the licence.
  // Every file here opens with an SPDX line and a blank one, so a reader that
  // simply takes the first block gets "SPDX-License-Identifier" as the
  // module's description — which is what the first version of this page said.
  let fileDoc = "";
  {
    const blocks = [];
    let block = [];
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith(";")) { block.push(line); continue; }
      if (block.length) { blocks.push(block); block = []; }
      // Stop at the first real declaration: anything after it belongs to it.
      if (t && !t.startsWith(";")) break;
    }
    if (block.length) blocks.push(block);
    const real = blocks.map(commentText).filter((b) => b && !/^SPDX-License/.test(b));
    fileDoc = real.length ? real[0] : "";
  }

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const cm = CLASS_RE.exec(t);
    if (cm && depth === 0) {
      current = { name: cm[1], doc: docAbove(lines, i), line: i + 1, methods: [], fields: [] };
      classes.push(current);
      depth = 1;
      continue;
    }
    if (!current) continue;

    // Brace depth, so a `{` inside a method body does not look like a class.
    const opens = (t.match(/\{/g) || []).length;
    const closes = (t.match(/\}/g) || []).length;

    const fm = FN_RE.exec(t);
    if (fm && depth === 1) {
      current.methods.push({
        kind: fm[1] === "sfn" ? "static" : "instance",
        name: fm[2],
        returns: fm[4] || "void",
        optional: Boolean(fm[3]),
        args: parseArgs(fm[5]),
        ...docFields(docAbove(lines, i)),
        line: i + 1,
      });
    } else {
      const dm = DEF_RE.exec(t);
      if (dm && depth === 1) {
        current.fields.push({
          name: dm[2],
          type: dm[4],
          constant: dm[1] === "sdef",
          doc: docAbove(lines, i),
          line: i + 1,
        });
      }
    }

    depth += opens - closes;
    if (depth <= 0) { current = null; depth = 0; }
  }
  return { file: relFile, doc: fileDoc, classes };
}

function main() {
  const registry = readJson(REGISTRY);
  let total = 0;
  for (const api of registry.apis) {
    const entries = api.entries.map((e) => ({ ...e, ...parseFile(e.file) }));
    const classes = entries.reduce((n, e) => n + e.classes.length, 0);
    const methods = entries.reduce(
      (n, e) => n + e.classes.reduce((m, c) => m + c.methods.length, 0), 0);
    // A facade whose methods carry no comments is a page of signatures, which
    // is worse than no page: it looks documented. Reported rather than failed,
    // because a private helper class legitimately has none.
    const undocumented = entries.flatMap((e) =>
      e.classes.flatMap((c) =>
        c.methods.filter((m) => !m.doc && !m.internal).map((m) => `${c.name}.${m.name}`)));
    writeJson(path.join(DATA, `${api.id}-api.json`), {
      id: api.id, title: api.title, package: api.package, kind: api.kind || "",
      summary: api.summary, entries,
    });
    console.log(`  ${api.id}: ${classes} classes, ${methods} methods` +
      (undocumented.length ? `, ${undocumented.length} without a comment` : ""));
    if (undocumented.length && process.env.API_DOCS_VERBOSE) {
      for (const u of undocumented) console.log(`      ${u}`);
    }
    total += methods;
  }
  console.log(`  wrote ${registry.apis.length} API model(s), ${total} methods`);
}

main();
