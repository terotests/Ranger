// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * What a pasted RangerFlow link is allowed to become inside the Confluence
 * macro: an iframe `src` onto GitHub Pages, with `?embed=1` so the diagram
 * is view-only and fitted to the frame.
 *
 * The diagram itself lives after `#rf=` (and, as a fallback, `?rf=`). A
 * browser does not send a fragment to the host, so GitHub Pages never sees
 * the document. This file does not fetch, store or decode it.
 */
export const PAGES_ORIGIN = "https://terotests.github.io";
export const PAGES_PATH = "/Ranger/rangerflow";
export const DEFAULT_HEIGHT_PX = 650;
export const DOC_KEY = "rf";
export const EMBED_SIZE_TYPE = "rangerflow:embed-size";
export const PLACEHOLDER_APP_ID =
  "ari:cloud:ecosystem::app/00000000-0000-4000-8000-000000000000";

/** URL patterns the Forge macro registers for paste-to-embed. Hash is not
 *  part of a matcher: Confluence matches the URL and hands the whole paste,
 *  fragment included, to the macro as `autoConvertLink`. */
export const AUTO_CONVERT_PATTERNS = [
  "https://terotests.github.io/Ranger/rangerflow",
  "https://terotests.github.io/Ranger/rangerflow/",
  "https://terotests.github.io/Ranger/rangerflow?*",
  "https://terotests.github.io/Ranger/rangerflow/?*",
  "https://terotests.github.io/Ranger/rangerflow/index.html",
  "https://terotests.github.io/Ranger/rangerflow/index.html?*",
];

function normalizePath(pathname) {
  return pathname.replace(/\/index\.html$/i, "").replace(/\/+$/, "") || "/";
}

function parseAllowed(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  let u;
  try {
    u = new URL(text);
  } catch {
    return null;
  }
  if (u.username || u.password) return null;
  const path = normalizePath(u.pathname);
  if (u.protocol === "https:" && u.hostname === "terotests.github.io") {
    if (path !== PAGES_PATH) return null;
    u.pathname = `${PAGES_PATH}/`;
    return u;
  }
  // Local `npm run rangerflow:web:serve` and `forge tunnel` against it.
  if ((u.protocol === "http:" || u.protocol === "https:") &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")) {
    if (path !== "/" && path !== PAGES_PATH) return null;
    if (path === PAGES_PATH) u.pathname = `${PAGES_PATH}/`;
    return u;
  }
  return null;
}

export function isAllowedRangerFlowUrl(raw) {
  return parseAllowed(raw) != null;
}

/** The pasted URL Confluence captured, from any of the shapes the platform
 *  has used for autoconvert. */
export function pastedUrlFromContext(context) {
  const ext = (context && context.extension) || {};
  const cfg = ext.config || {};
  const raw = ext.autoConvertLink || cfg.autoConvertLink || cfg.url || "";
  return String(raw).trim();
}

/** Packed `FlowDocument` carried by the link: `#rf=` wins, then `?rf=`. */
export function packedFromUrl(raw) {
  const u = (() => {
    try { return new URL(String(raw).trim()); } catch { return null; }
  })();
  if (!u) return "";
  const hash = new URLSearchParams(u.hash.startsWith("#") ? u.hash.slice(1) : u.hash);
  const fromHash = hash.get(DOC_KEY);
  if (fromHash) return fromHash;
  return u.searchParams.get(DOC_KEY) || "";
}

/** View-only iframe target. Null when the URL is not a RangerFlow page. */
export function toEmbedUrl(raw) {
  const u = parseAllowed(raw);
  if (!u) return null;
  u.searchParams.set("embed", "1");
  return u.toString();
}

/** Same diagram in the editor. Used by "Open in RangerFlow". */
export function toEditorUrl(raw) {
  const u = parseAllowed(raw);
  if (!u) return null;
  u.searchParams.delete("embed");
  return u.toString();
}

/** Atlassian autoConvert matcher → regex. `*` is one path segment (no `/`).
 *  Matching is against the URL with the fragment stripped, which is how
 *  Confluence decides "this paste is ours" before storing the whole string. */
export function patternToRegExp(pattern) {
  const escaped = String(pattern).replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, "[^/]*")}$`);
}

export function matchesAutoConvert(raw) {
  let u;
  try {
    u = new URL(String(raw).trim());
  } catch {
    return false;
  }
  u.hash = "";
  const withoutHash = u.toString().replace(/#$/, "");
  return AUTO_CONVERT_PATTERNS.some((p) => patternToRegExp(p).test(withoutHash));
}

/** Origins allowed to tell the macro how tall the diagram is. */
export function isTrustedEmbedOrigin(origin) {
  let u;
  try {
    u = new URL(String(origin));
  } catch {
    return false;
  }
  if (u.protocol === "https:" && u.hostname === "terotests.github.io") return true;
  if ((u.protocol === "http:" || u.protocol === "https:") &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return true;
  return false;
}

export function clampEmbedHeight(height) {
  const n = Math.round(Number(height));
  if (!Number.isFinite(n)) return DEFAULT_HEIGHT_PX;
  if (n < 280) return 280;
  if (n > 1400) return 1400;
  return n;
}
