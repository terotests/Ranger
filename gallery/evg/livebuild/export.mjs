/**
 * Take a live-build session out as a brief another Ranger + EVG agent can
 * paste. Save keeps a design on this machine; this is the door out — the
 * screen as files, an outline of it, and the instructions that turn a picture
 * of an app into one.
 *
 * The payload is markdown on purpose. The receiving agent is a chat in a
 * Ranger checkout, not a special importer: it reads the brief, writes a Rave
 * document or an EVG app, and checks until the numbers say so.
 */
import fs from "node:fs";
import path from "node:path";

const FORMAT = "evg-livebuild-export";
const VERSION = 1;
const MAX_FILE = 250_000;
const MAX_OUTLINE = 220;
const SHOW_PROPS = [
  "width",
  "height",
  "display",
  "flex-direction",
  "justify-content",
  "align-items",
  "gap",
  "background-color",
  "color",
  "border-radius",
  "position",
  "left",
  "right",
  "top",
  "bottom",
];

export function slugOf(name) {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "screen";
}

export function collectFiles(dir) {
  const files = {};
  const doc = path.join(dir, "doc.evg.json");
  if (!fs.existsSync(doc)) return files;
  files["doc.evg.json"] = fs.readFileSync(doc, "utf8");
  const app = path.join(dir, "app");
  // Only THIS session's app. The host falls back to the example fixture when
  // Run is pressed on a screen that is not an app yet; exporting that would
  // hand another agent the traffic demo and call it theirs.
  if (!fs.existsSync(path.join(app, "machine.json"))) return files;
  const take = (rel) => {
    const abs = path.join(dir, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      files[rel] = fs.readFileSync(abs, "utf8");
    }
  };
  take("app/machine.json");
  take("app/APP.md");
  take("app/App.rgr");
  const pages = path.join(app, "pages");
  if (fs.existsSync(pages)) {
    for (const f of fs.readdirSync(pages).sort()) {
      if (f.endsWith(".evg.json")) take(`app/pages/${f}`);
    }
  }
  return files;
}

function countNodes(node) {
  if (!node || typeof node !== "object") return 0;
  let n = 1;
  for (const c of node.children || []) n += countNodes(c);
  return n;
}

function collectIds(node, out) {
  if (!node || typeof node !== "object") return;
  if (node.id) out.push(String(node.id));
  for (const c of node.children || []) collectIds(c, out);
}

export function outlineOf(doc) {
  const lines = [];
  const walk = (node, at) => {
    if (!node || typeof node !== "object") return;
    if (lines.length >= MAX_OUTLINE) return;
    const tag = node.tag || "?";
    const id = node.id ? ` #${node.id}` : "";
    const props = node.props && typeof node.props === "object" ? node.props : {};
    const cls = props["class-name"] || props.class || "";
    const klass = cls ? ` .${String(cls).replace(/\s+/g, ".")}` : "";
    const key = node.key ? ` k:${node.key}` : "";
    const text = node.text ? ` ${JSON.stringify(String(node.text).slice(0, 60))}` : "";
    const bits = [];
    for (const p of SHOW_PROPS) {
      if (props[p] != null && String(props[p]) !== "") bits.push(`${p}=${props[p]}`);
    }
    const extra = bits.length ? `  ${bits.join("  ")}` : "";
    lines.push(`${at}  ${tag}${id}${klass}${key}${text}${extra}`);
    const ch = node.children || [];
    for (let i = 0; i < ch.length; i += 1) walk(ch[i], `${at}/${i}`);
  };
  if (typeof doc.css === "string" && doc.css.trim()) {
    const rules = doc.css.split("}").filter((s) => s.includes("{")).length;
    lines.push(`css  ${rules} rule${rules === 1 ? "" : "s"}`);
  }
  if (doc.root) walk(doc.root, "0");
  const nodes = countNodes(doc.root);
  if (nodes > lines.filter((l) => l.startsWith("0")).length) {
    lines.push(`… ${nodes} nodes total — the JSON under Files is the rest`);
  }
  return lines;
}

function parseDoc(text) {
  try {
    const j = JSON.parse(text);
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

function fence(lang, body) {
  const safe = String(body || "").replace(/\n```/g, "\n``\\`");
  return "```" + lang + "\n" + safe.replace(/\s+$/, "") + "\n```";
}

function pretty(text) {
  const j = parseDoc(text);
  if (!j) return String(text || "");
  return JSON.stringify(j, null, 2);
}

function clip(text) {
  const s = String(text || "");
  if (s.length <= MAX_FILE) return s;
  return `${s.slice(0, MAX_FILE)}\n… truncated, ${s.length} characters originally\n`;
}

function deviceName(view) {
  const w = Number(view && view.width) || 0;
  const h = Number(view && view.height) || 0;
  const a = Math.min(w, h);
  const b = Math.max(w, h);
  if (a === 390 && b === 844) return w > h ? "phone, landscape" : "phone, portrait";
  if (a === 820 && b === 1180) return w > h ? "tablet, landscape" : "tablet, portrait";
  if ((w === 1440 && h === 900) || (w === 900 && h === 1440)) {
    return w > h ? "desktop" : "desktop, tall";
  }
  return w && h ? `${w}×${h}` : "unknown";
}

function instructions({ hasApp, hasCode, viewport }) {
  const w = (viewport && viewport.width) || 390;
  const h = (viewport && viewport.height) || 844;
  const rave = `### A routed application — Rave

A Rave document is an application: routes, layouts, pages, a stylesheet with
real breakpoints, drawn by EVG. Use this when the screen is a product (several
pages, a nav, collections, a login) rather than one picture.

Read \`.claude/skills/rave/SKILL.md\` or run \`npm run rave -- spec\` once.

\`\`\`
npm run rave -- new app.rave --name "<name from the ask>" --start crud
# translate the outline into Rave markup: class selectors only, style= on the
# node, <on click="…"/> for actions, <collection> for tables of rows
npm run rave -- check app.rave          # the loop: RAVE OK or the reasons
npm run rave -- measure app.rave --width ${w}
npm run rave -- shot app.rave --width ${w}
\`\`\`

Do not finish on \`RAVE FAIL\`. Do not write HTML for a browser — Rave is the
document, EVG paints it.

What the engine does not have (\`calc()\`, \`aspect-ratio\`, \`box-shadow\`,
\`transform\`, per-side border shorthands, id selectors) is dropped silently
at draw time; \`check\` is where that surfaces.`;

  const evg = `### One screen, or an EVG app — the document as it stands

Write the files from the Files section into a folder. They are already EVG.

\`\`\`
npm run agent -- outline doc.evg.json
npm run agent -- measure doc.evg.json --width=${w} --height=${h}
\`\`\`

Read \`.claude/skills/evg-edit/SKILL.md\`. Change the tree with \`EVGPatch\`
ops (\`npm run agent -- patch\`), not by rewriting JSON and hoping. An
element's \`id\` is the event its press sends — give buttons, tabs and rows
one. Tabs that should become screens are \`nav.<state>\`.

Controls: do not draw a switch out of a pill and a circle. \`gallery/ui\`
has the real ones (\`./evg-ui add switch|card|row|…\`). A drawing of a
control looks finished and does nothing.`;

  const app = hasApp
    ? `### This paste already has an app

\`app/machine.json\` and \`app/pages/<state>.evg.json\` are a running app as
data. Drop them in a folder and:

\`\`\`
node gallery/evg/bin/evg_app.js check <dir>
\`\`\`

The machine owns the page. A press on an id the state does not take is a
dead button, and \`check\` names it. Pages that are still copies of each
other look like dead buttons from the outside — make the screens differ.
${hasCode ? "There is also `app/App.rgr`: a code app. Compile it; do not flatten it back into documents.\n" : ""}`
    : `### Making the screen an app

If the outline has a tab bar, give each tab \`nav.<state>\` and run
\`node gallery/evg/bin/evg_app.js init app --from=doc.evg.json\`. That writes
a state per tab and copies the document to each page. Then make the pages
differ — identical pages are the first thing to expect, and they look like
a press that does nothing.`;

  return `## How to build the real app

You are in the Ranger repository. The paste above is a screen designed in
EVG Live Build. It is a picture of an app until you make it one. The goal
is a working application another person can run, not a screenshot and not
a second copy of this live-build session.

Pick one door. Do not invent a third layout engine.

${rave}

${evg}

${app}

### What "done" means

- The screens match the outline: same structure, same copy, same palette.
- \`measure\` / \`rave check\` reports no overflow, overlap, or unknown CSS.
- Pressable things have ids, and those ids do something.
- You did not fake a control the kit already has.`;
}

export function buildBrief(bundle, { includeInstructions = true } = {}) {
  const view = bundle.viewport || {};
  const w = view.width || 390;
  const h = view.height || 844;
  const measure = bundle.measure || {};
  const findings = Array.isArray(measure.findings) ? measure.findings : [];
  const ids = bundle.ids || [];
  const files = bundle.files || {};
  const parts = [];

  parts.push("# Build this screen as a real EVG / Rave app");
  parts.push("");
  parts.push(
    "This paste is a screen designed in **EVG Live Build** (`npm run livebuild:withcursor`). " +
      "Recreate it as a working application in this Ranger repository. The JSON is the spec; " +
      "the outline is how to read it; the instructions are the loop.",
  );
  parts.push("");
  parts.push("## What was asked for");
  parts.push("");
  parts.push(bundle.prompt ? bundle.prompt : "(no prompt was recorded — the screen itself is the spec)");
  parts.push("");
  parts.push("## Viewport");
  parts.push("");
  parts.push(`- **${w} × ${h}** (${deviceName(view)})`);
  parts.push(`- live-build kind: \`${bundle.kind || "screen"}\``);
  parts.push(`- nodes: ${bundle.nodes || 0}`);
  if (ids.length) parts.push(`- ids (these are events): ${ids.map((id) => "`" + id + "`").join(", ")}`);
  parts.push("");
  parts.push("## Layout");
  parts.push("");
  if (findings.length) {
    parts.push(
      `This screen currently has **${findings.length}** measure finding${findings.length === 1 ? "" : "s"}. ` +
        "Carry the look, not the defects.",
    );
    parts.push("");
    for (const f of findings.slice(0, 24)) parts.push(`- ${f}`);
    if (findings.length > 24) parts.push(`- … ${findings.length - 24} more`);
  } else {
    parts.push(
      measure.count === 0
        ? `Layout ok at ${w}×${h}` +
            (Number.isFinite(measure.bottomFree) ? ` · ${measure.bottomFree}px free under the content.` : ".")
        : "No measure was attached. Run `npm run agent -- measure doc.evg.json` after writing the file.",
    );
  }
  if (Array.isArray(measure.align) && measure.align.length) {
    parts.push("");
    parts.push("Align:");
    for (const a of measure.align.slice(0, 12)) parts.push(`- ${a}`);
  }
  parts.push("");
  parts.push("## Outline");
  parts.push("");
  parts.push("One line per node: path, tag, id, class, text, and the properties it sets.");
  parts.push("");
  parts.push(fence("", (bundle.outline || []).join("\n")));
  parts.push("");
  parts.push("## Files");
  parts.push("");
  parts.push("Write these into a folder. Paths are relative to that folder.");
  parts.push("");
  const names = Object.keys(files);
  if (!names.length) {
    parts.push("(no files — the session had no document)");
  } else {
    for (const rel of names) {
      const body = files[rel];
      const lang = rel.endsWith(".md") ? "markdown" : rel.endsWith(".rgr") ? "ranger" : "json";
      parts.push(`### \`${rel}\``);
      parts.push("");
      parts.push(fence(lang, clip(rel.endsWith(".json") ? pretty(body) : body)));
      parts.push("");
    }
  }
  if (includeInstructions) {
    parts.push(
      instructions({
        hasApp: Boolean(files["app/machine.json"]),
        hasCode: Boolean(files["app/App.rgr"]),
        viewport: view,
      }),
    );
    parts.push("");
  }
  parts.push("## Machine-readable bundle");
  parts.push("");
  parts.push(
    `The same files are on this payload as JSON (\`format\`: \`${FORMAT}\`, version ${VERSION}). ` +
      "If you were given this markdown, the fences above are the spec — write those files and run the loop. " +
      "Do not wait for a second attachment.",
  );
  parts.push("");
  return parts.join("\n");
}

export function exportSession({
  dir,
  prompt = "",
  kind = "",
  name = "",
  viewport = null,
  measure = null,
} = {}) {
  const files = collectFiles(dir);
  const docText = files["doc.evg.json"] || "";
  const doc = parseDoc(docText) || {};
  const nodes = countNodes(doc.root);
  const ids = [];
  collectIds(doc.root, ids);
  const view = {
    width: (viewport && viewport.width) || 390,
    height: (viewport && viewport.height) || 844,
  };
  const outline = outlineOf(doc);
  const pages = Object.keys(files).filter((f) => f.startsWith("app/pages/")).length;
  const title = String(name || prompt || kind || "screen").slice(0, 120);
  const bundle = {
    format: FORMAT,
    version: VERSION,
    name: title,
    prompt: prompt || "",
    kind: kind || "",
    viewport: view,
    device: deviceName(view),
    nodes,
    ids,
    pages,
    hasApp: Boolean(files["app/machine.json"]),
    hasCode: Boolean(files["app/App.rgr"]),
    measure: measure
      ? {
          width: measure.width,
          height: measure.height,
          nodes: measure.nodes,
          count: measure.count,
          findings: measure.findings || [],
          align: measure.align || [],
          bottomFree: measure.bottomFree,
          tight: measure.tight || [],
          drawn: measure.drawn || [],
        }
      : null,
    files,
  };
  const payload = {
    prompt,
    kind,
    viewport: view,
    nodes,
    ids,
    measure: bundle.measure,
    outline,
    files,
    bundle,
  };
  const markdown = buildBrief(payload, { includeInstructions: true });
  const markdownBare = buildBrief(payload, { includeInstructions: false });
  return {
    format: FORMAT,
    version: VERSION,
    name: title,
    slug: slugOf(title),
    prompt: prompt || "",
    kind: kind || "",
    viewport: view,
    device: deviceName(view),
    nodes,
    ids,
    pages,
    hasApp: bundle.hasApp,
    hasCode: bundle.hasCode,
    bytes: markdown.length,
    outline,
    measure: bundle.measure,
    files,
    bundle,
    markdown,
    markdownBare,
  };
}
