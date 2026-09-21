/**
 * Take a live-build session out as one Ranger UI document.
 *
 * Save keeps a design on this machine. Export is the door out: a single
 * `.ranger.json` — ui, css, machine — that another agent (or Ranger) can
 * paste. Compact is the clipboard; full adds the compiled EVG snapshot and
 * the layout debug. Same format either way.
 */
import fs from "node:fs";
import path from "node:path";
import { buildRangerUi, FORMAT, VERSION, compactOf } from "./ranger-ui.mjs";

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
    lines.push(`… ${nodes} nodes total`);
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

function pageFiles(files) {
  const pages = {};
  for (const [rel, text] of Object.entries(files || {})) {
    const m = rel.match(/^app\/pages\/(.+)\.evg\.json$/);
    if (m) pages[m[1]] = text;
  }
  return pages;
}

export function exportSession({
  dir,
  prompt = "",
  kind = "",
  name = "",
  viewport = null,
  measure = null,
  full = false,
} = {}) {
  const files = collectFiles(dir);
  const docText = files["doc.evg.json"] || "";
  const doc = parseDoc(docText) || {};
  const view = {
    width: (viewport && viewport.width) || 390,
    height: (viewport && viewport.height) || 844,
  };
  const outline = outlineOf(doc);
  const title = String(name || prompt || kind || "screen").slice(0, 120);
  const pages = pageFiles(files);
  const layout = measure
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
    : null;
  const made = buildRangerUi({
    doc: docText,
    name: title,
    prompt,
    kind,
    viewport: view,
    machine: files["app/machine.json"] || null,
    pages: Object.keys(pages).length ? pages : null,
    measure: layout,
    outline,
    full: true,
  });
  const compact = made.compact;
  const document = full ? made.document : compact;
  const json = JSON.stringify(document, null, 2);
  return {
    format: FORMAT,
    version: VERSION,
    name: title,
    slug: slugOf(title),
    prompt: prompt || "",
    kind: kind || "",
    viewport: view,
    device: deviceName(view),
    nodes: made.nodes,
    ids: made.ids,
    pages: Object.keys(pages).length,
    hasApp: made.hasApp,
    bytes: json.length,
    outline,
    measure: layout,
    valid: made.valid,
    components: made.components,
    compact,
    full: made.document,
    document,
    json,
    files,
  };
}

export { compactOf, FORMAT, VERSION };
