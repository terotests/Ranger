#!/usr/bin/env node
/**
 * Pack gallery/css, gallery/evg and gallery/zip for the in-tab CodeGraph
 * samples. Follows Import "…" from each entry so the VFS has the closure
 * VirtualCompiler will ask for — tests, tools and unrelated EVG files stay out.
 *
 * Relative Imports (`../evg/EVGColor.rgr`) are rewritten to the basename so
 * the in-memory filesystem can find them on RANGER_LIB (it does not walk `..`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../../../..");
const galleryRoot = path.join(rangerRoot, "gallery");
const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "dist/gallerySources.json");

const ENTRIES = {
  css: "css/CssCore.rgr",
  evg: "evg/EVGElement.rgr",
  zip: "zip/zip_tool.rgr",
};

function collect(entryRel) {
  const files = {};
  const queue = [entryRel];
  while (queue.length) {
    const rel = queue.pop();
    if (files[rel]) continue;
    const full = path.join(galleryRoot, rel);
    if (!fs.existsSync(full)) {
      console.warn("  missing import " + rel);
      continue;
    }
    const src = fs.readFileSync(full, "utf8");
    files[rel] = src;
    const dir = path.dirname(rel);
    const re = /^\s*Import\s+"([^"]+)"/gm;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      if (spec.indexOf("compiler/") >= 0) continue;
      if (spec.indexOf("lib/") >= 0) continue;
      const resolved = path.posix.normalize(path.posix.join(dir, spec));
      if (resolved.startsWith("..")) continue;
      if (!resolved.endsWith(".rgr")) continue;
      queue.push(resolved);
    }
  }
  return files;
}

function rewriteRelativeImports(src) {
  return src.replace(/Import\s+"(\.\.[^"]+)"/g, (_all, spec) => {
    const base = spec.split("/").pop();
    return `Import "${base}"`;
  });
}

const files = {};
for (const entry of Object.values(ENTRIES)) {
  Object.assign(files, collect(entry));
}

const packed = {};
for (const [rel, src] of Object.entries(files)) {
  packed[rel] = rewriteRelativeImports(src);
}

if (!packed["css/CssCore.rgr"]) {
  throw new Error("css/CssCore.rgr missing from the gallery pack");
}
if (!packed["evg/EVGElement.rgr"]) {
  throw new Error("evg/EVGElement.rgr missing from the gallery pack");
}
if (!packed["zip/zip_tool.rgr"]) {
  throw new Error("zip/zip_tool.rgr missing from the gallery pack");
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ entries: ENTRIES, files: packed }));
const n = Object.keys(packed).length;
const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log("  gallerySources.json " + n + " files, " + kb + " KB");
