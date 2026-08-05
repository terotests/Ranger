/**
 * GitHub source links for the documentation.
 *
 * Line numbers are computed from the sources at generate time. A link that
 * points at the `master` branch becomes wrong as soon as that file moves on
 * master, even when the page still shows the old line. The link therefore
 * pins to the commit that built the documentation (RANGER_COMMIT), so the
 * line always opens the definition that the page describes.
 */
import { execSync } from "node:child_process";
import { ROOT } from "./paths.mjs";

let cachedRef;

/** The git ref that source links should open. */
export function sourceRef() {
  if (cachedRef !== undefined) {
    return cachedRef;
  }
  const fromEnv = (process.env.RANGER_COMMIT || "").trim();
  if (fromEnv) {
    cachedRef = fromEnv;
    return cachedRef;
  }
  try {
    cachedRef = execSync("git rev-parse HEAD", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    cachedRef = "master";
  }
  return cachedRef;
}

/**
 * A GitHub blob URL for a repository file.
 *
 * @param {string} repository  e.g. https://github.com/terotests/Ranger
 * @param {string} file        repository-relative path
 * @param {number} [line]      1-based line, omitted for a file link
 * @param {string} [ref]       git ref; defaults to the build commit
 */
export function blobUrl(repository, file, line, ref = sourceRef()) {
  const base = `${repository}/blob/${ref}/${file}`;
  return line > 0 ? `${base}#L${line}` : base;
}
