#!/usr/bin/env node
/**
 * Pack compiler/*.rgr for the in-tab VirtualCompiler sample.
 * Tests, issue repros and backups stay out — they are not what VirtualCompiler
 * Imports. Lang.rgr is already in compileEnv.json.
 *
 * The compiler no longer stops at its own directory: PkgFetch.rgr drives the
 * Git client in pkg/src, which reads DEFLATE from lib/zip, and its own code
 * lives in subfolders (ast/, cli/, apidoc/, modules/, frontend/rust/…). Those
 * are followed and packed flat beside the compiler's files, and every relative
 * Import with a directory in it is rewritten to the basename, because the VFS
 * this feeds is one flat folder, so two compiler files may not share a base
 * name (the build stops if they do).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../../../..");
const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "dist/compilerSources.json");
const srcDir = path.join(rangerRoot, "compiler");

function skipName(name) {
  if (!name.endsWith(".rgr")) return true;
  if (name === "Lang.rgr") return true;
  if (name.startsWith("test_")) return true;
  if (name.startsWith("issue_")) return true;
  if (name === "feature_tests.rgr") return true;
  if (name.includes("_backup.")) return true;
  if (name.endsWith("Orig.rgr")) return true;
  return false;
}

function rewriteRelativeImports(src) {
  return src.replace(/Import\s+"([^"]+\/[^"]+)"/g, (all, spec) => {
    if (spec.startsWith("pkg:")) return all;
    const base = spec.split("/").pop();
    return `Import "${base}"`;
  });
}

const files = {};
// base name -> the path it was packed from
const from = {};
const queue = [];

for (const name of fs.readdirSync(srcDir).sort()) {
  if (skipName(name)) continue;
  const abs = path.join(srcDir, name);
  files[name] = fs.readFileSync(abs, "utf8");
  from[name] = abs;
  queue.push(abs);
}

// Follow what the compiler imports beyond its own directory.
while (queue.length) {
  const abs = queue.pop();
  const src = files[path.basename(abs)];
  if (src === undefined || from[path.basename(abs)] !== abs) continue;
  const dir = path.dirname(abs);
  const re = /^\s*Import\s+"([^"]+)"/gm;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (!spec.endsWith(".rgr")) continue;
    if (spec.startsWith("pkg:")) continue;
    const dep = path.resolve(dir, spec);
    const rel = path.relative(rangerRoot, dep).split(path.sep).join("/");
    // Outside the repository, already packed, or the standard library the
    // compile env installs under /lib/ (lib/zip is source, and is followed).
    if (rel.startsWith("..")) continue;
    if (rel.startsWith("lib/") && rel.indexOf("/", 4) < 0) continue;
    const base = path.basename(dep);
    if (from[base] === dep) continue;
    // a top-level compiler file is packed already, or is a library name the
    // compile env provides (stdlib.rgr, CmdParams.rgr)
    if (path.dirname(dep) === srcDir || path.dirname(dep) === path.join(srcDir, "lib")) continue;
    if (files[base] !== undefined) {
      throw new Error(`two files named ${base}: ${path.relative(rangerRoot, from[base])} and ${rel} -- the pack is one flat folder`);
    }
    if (!fs.existsSync(dep)) {
      console.warn("  missing import " + rel);
      continue;
    }
    files[base] = fs.readFileSync(dep, "utf8");
    from[base] = dep;
    queue.push(dep);
  }
}

for (const name of Object.keys(files)) {
  files[name] = rewriteRelativeImports(files[name]);
}

if (!files["VirtualCompiler.rgr"]) {
  throw new Error("compiler/VirtualCompiler.rgr missing from the pack");
}
if (!files["RangerFlowParser.rgr"]) {
  throw new Error("compiler/RangerFlowParser.rgr missing from the pack");
}
if (!files["GitPack.rgr"]) {
  throw new Error("pkg/src/GitPack.rgr missing — PkgFetch.rgr cannot resolve");
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ files }));
const n = Object.keys(files).length;
const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log("  compilerSources.json " + n + " files, " + kb + " KB");
