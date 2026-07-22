// ============================================================================
// safePath.mjs — keep library project paths inside the library root.
// ============================================================================

import path from "node:path";

/** Lowercase slug: letter/digit start, then [a-z0-9_-], max 64 chars. */
export const PROJECT_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/**
 * Resolve `<root>/<slug>` only if slug is safe and the path stays under root.
 * @param {string} root
 * @param {string} slug
 * @returns {{ dir: string, file: string, slug: string }}
 */
export function resolveSafeProjectDir(root, slug) {
  if (typeof slug !== "string" || !slug) {
    throw new Error("Invalid project slug");
  }
  if (
    slug.includes("\0") ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.includes("..") ||
    !PROJECT_SLUG_RE.test(slug)
  ) {
    throw new Error("Invalid project slug");
  }
  const rootPath = path.resolve(root);
  const candidate = path.resolve(rootPath, slug);
  if (candidate === rootPath || !candidate.startsWith(rootPath + path.sep)) {
    throw new Error("Invalid project slug");
  }
  return {
    slug,
    dir: candidate,
    file: path.join(candidate, "project.json"),
  };
}
