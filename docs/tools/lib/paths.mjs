/**
 * Shared paths and small filesystem helpers for the documentation tools.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, "..", "..", "..");
export const DOCS = path.join(ROOT, "docs");
export const CACHE = path.join(DOCS, ".cache");
export const SITE = path.join(DOCS, "site");
export const DATA = path.join(SITE, "src", "data");
export const CONTENT = path.join(SITE, "src", "content", "docs");
export const EXAMPLES = path.join(DOCS, "examples");
export const DESCRIPTIONS = path.join(DOCS, "descriptions");
export const BASELINE = path.join(DOCS, "baseline");

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** List every file under dir that matches the extension. Returns repository-relative paths. */
export function walk(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, ext));
    } else if (entry.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out.sort();
}

export function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}
