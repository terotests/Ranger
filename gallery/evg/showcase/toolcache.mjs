/**
 * toolcache — compile a Ranger tool once, keyed on the sources it is made of.
 *
 * Shared by `dev.mjs` (one page, one theme) and `build.mjs` (the whole
 * gallery). Compiling one EVG tool costs about six seconds and the showcase
 * needs five of them; rendering a page with one costs about half a second.
 * Since a page's `.tsx` and a theme's `.css` are read at run time, editing
 * either cannot change a tool — so the compile is a cache, and this is it.
 *
 * The key is the content of the tool's whole transitive `Import` closure plus
 * the compiler bundle that will read it. Anything less would serve a stale
 * tool after an edit to the layout engine, and a stale tool is the failure
 * this repository is careful about everywhere else: a build that looks applied
 * and is not.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../../..");
export const CACHE = path.join(HERE, ".devcache");

/**
 * Every `.rgr` a tool reaches through `Import`, transitively, sorted. An
 * `Import` the resolver cannot follow leaves the closure incomplete, so the
 * hash cannot speak for it — that is reported rather than cached quietly.
 */
export function importClosure(entry) {
  const seen = new Set();
  const stack = [path.resolve(ROOT, entry)];
  const missing = [];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    if (!fs.existsSync(file)) { missing.push(file); continue; }
    seen.add(file);
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(/^[ \t]*Import[ \t]+"([^"]+)"/gm)) {
      stack.push(path.resolve(path.dirname(file), m[1]));
    }
  }
  return { files: [...seen].sort(), missing };
}

/** The closure's content hash, plus the compiler bundle that will read it. */
export function toolHash(entry, { warn = true } = {}) {
  const { files, missing } = importClosure(entry);
  if (missing.length && warn) {
    process.stderr.write("toolcache: unresolved Import(s); cache key is incomplete:\n");
    for (const f of missing) process.stderr.write(`  ${path.relative(ROOT, f)}\n`);
  }
  const h = crypto.createHash("sha256");
  for (const f of files) {
    h.update(path.relative(ROOT, f));
    h.update("\0");
    h.update(fs.readFileSync(f));
    h.update("\0");
  }
  const compiler = path.join(ROOT, "bin/output.js");
  if (fs.existsSync(compiler)) h.update(fs.readFileSync(compiler));
  return h.digest("hex").slice(0, 16);
}

/**
 * Compile `src` to JavaScript, or hand back the cached build. Returns the
 * path, whether it was a hit, and what the compile cost.
 *
 * The compiler prints `[FAIL]` and `Compilation FAILED` and then exits 0, so
 * the log is read for the failure the exit status omits and a missing output
 * file is itself an error. Nothing is written to the cache unless it compiled.
 */
export function compileCached(src, name, { force = false } = {}) {
  const base = name.replace(/\.js$/, "");
  const hash = toolHash(src);
  const out = path.join(CACHE, `${base}-${hash}.js`);
  if (fs.existsSync(out) && !force) return { path: out, cached: true, ms: 0 };

  fs.mkdirSync(CACHE, { recursive: true });
  const t0 = Date.now();
  const log = execFileSync("node", [
    "bin/output.js", "-es6", src,
    `-d=${path.relative(ROOT, CACHE)}`,
    `-o=${base}-${hash}.js`,
    "-nodecli",
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 28,
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr" },
  });
  if (log.includes("Compilation FAILED") || !fs.existsSync(out)) {
    fs.rmSync(out, { force: true });
    process.stderr.write(log.split("\n").slice(-30).join("\n") + "\n");
    throw new Error(`compile failed: ${src}`);
  }

  // A tool that changed leaves its older builds behind, at about 1.2 MB each.
  for (const f of fs.readdirSync(CACHE)) {
    if (f.startsWith(`${base}-`) && f !== path.basename(out)) {
      fs.rmSync(path.join(CACHE, f), { force: true });
    }
  }
  return { path: out, cached: false, ms: Date.now() - t0 };
}
