#!/usr/bin/env node
/**
 * Pack gallery/css, gallery/evg and gallery/zip for the in-tab CodeGraph
 * samples. Follows Import "…" from each entry so the VFS has the closure
 * VirtualCompiler will ask for — tests, tools and unrelated EVG files stay out.
 *
 * Relative Imports (`../evg/EVGColor.rgr`) are rewritten to the basename so
 * the in-memory filesystem can find them on RANGER_LIB (it does not walk `..`).
 *
 * An import may leave gallery/ entirely — gallery/zip reads DEFLATE from
 * lib/zip/Inflate.rgr, which is MIT platform code rather than gallery IP.
 * Those files are packed into the sample that needs them: the VFS this feeds
 * is one flat folder per sample, and every import in it is resolved by
 * basename anyway.
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

// The VFS key of a file the pack reaches. Inside gallery/ it keeps its own
// path so the sample folders stay recognisable; outside it (lib/zip) it joins
// the sample that pulled it in, because the VFS has no folder for it.
function keyFor(absPath, sample) {
  const rel = path.relative(rangerRoot, absPath).split(path.sep).join("/");
  if (rel.startsWith("gallery/")) {
    return rel.slice("gallery/".length);
  }
  return sample + "/" + path.basename(absPath);
}

function collect(entryRel) {
  const files = {};
  const sample = entryRel.split("/")[0];
  const queue = [path.join(galleryRoot, entryRel)];
  while (queue.length) {
    const abs = queue.pop();
    const key = keyFor(abs, sample);
    if (files[key]) continue;
    if (!fs.existsSync(abs)) {
      console.warn("  missing import " + key);
      continue;
    }
    const src = fs.readFileSync(abs, "utf8");
    files[key] = src;
    const dir = path.dirname(abs);
    const re = /^\s*Import\s+"([^"]+)"/gm;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      if (!spec.endsWith(".rgr")) continue;
      if (spec.startsWith("pkg:")) continue;
      const dep = path.resolve(dir, spec);
      const rel = path.relative(rangerRoot, dep).split(path.sep).join("/");
      // Outside the repository, the compiler's own sources, or the standard
      // library the compile env already installs under /lib/.
      if (rel.startsWith("..")) continue;
      if (rel.startsWith("compiler/")) continue;
      if (rel.startsWith("lib/") && rel.indexOf("/", 4) < 0) continue;
      queue.push(dep);
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
