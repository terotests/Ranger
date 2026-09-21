/**
 * Measure which Ranger files import a library.
 *
 * tests/docs-usage.test.ts uses this so a `legacy` / `stable` status in
 * docs/sources.json cannot drift from the tree without a failing test.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./paths.mjs";

const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".cache", "bin"]);

/** Repository-relative paths of every `.rgr` file, excluding build trees. */
export function walkRgrFiles(root = ROOT) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(full);
        }
        continue;
      }
      if (entry.name.endsWith(".rgr")) {
        out.push(path.relative(root, full).split(path.sep).join("/"));
      }
    }
  }
  walk(root);
  return out.sort();
}

/** The string arguments of `Import "…"` statements in a source. */
export function importPaths(text) {
  const found = [];
  const re = /^\s*Import\s+"([^"]+)"/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    found.push(match[1]);
  }
  return found;
}

export function importBasename(importPath) {
  const cleaned = String(importPath).replace(/\\/g, "/");
  const parts = cleaned.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Files that import the given library basename.
 * The library file itself is not a user.
 */
export function importersOf(basename, { root = ROOT, files } = {}) {
  const list = files || walkRgrFiles(root);
  const hits = [];
  for (const rel of list) {
    if (rel === `lib/${basename}`) {
      continue;
    }
    const full = path.join(root, rel);
    let text;
    try {
      text = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (importPaths(text).some((p) => importBasename(p) === basename)) {
      hits.push(rel);
    }
  }
  return hits;
}

/** Importers that are not themselves a listed legacy operator source. */
export function nonLegacyImporters(basename, legacyFiles, opts = {}) {
  const legacy = legacyFiles instanceof Set ? legacyFiles : new Set(legacyFiles);
  return importersOf(basename, opts).filter((rel) => !legacy.has(rel));
}

/** Library file names that the playground compiler ships. */
export function playgroundLibFiles(root = ROOT) {
  const builder = path.join(root, "playground/scripts/build-compiler-env.mjs");
  const text = fs.readFileSync(builder, "utf8");
  const block = text.match(/const libFiles\s*=\s*\[([\s\S]*?)\]/);
  if (!block) {
    return [];
  }
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** Top-level `lib/*.rgr` files (not subdirectories). */
export function topLevelLibFiles(root = ROOT) {
  const dir = path.join(root, "lib");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".rgr"))
    .map((name) => `lib/${name}`)
    .sort();
}

export function declaresOperators(text) {
  return (
    /(^|\n)\s*(operators|commands)\s*\{/.test(text) || /(^|\n)\s*operator\s+type:/.test(text)
  );
}

export function isLibTestFile(file) {
  return /test\.rgr$/i.test(file);
}
