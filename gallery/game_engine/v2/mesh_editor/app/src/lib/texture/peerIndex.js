// ============================================================================
// peerIndex.js — find morph-compatible eye textures ACROSS library projects.
// ============================================================================
//
// WHY THIS EXISTS
//
// The emotion-morph panel used to offer only the textures inside the project
// that happened to be open. A texture project holds exactly one eye, so the
// panel was structurally guaranteed to say "no other eye textures share this
// topology" no matter how many compatible emotions were sitting in the library
// next to it. The natural authoring flow — open `neutral`, edit, "Save as"
// `sad` — produces two *projects*, never two textures in one project, so the
// feature could not fire for the workflow it was designed for.
//
// Two things had to change:
//
//   1. Scope. Peers come from the whole library index, not the open document.
//      That is what this module computes.
//
//   2. Identity. "Save as" keeps the source's `assetGuid` (deliberately — a
//      mesh that assigned that guid should keep resolving), so the two eyes are
//      guid-identical. Peer discovery therefore keys on `peerKey` =
//      "<slug>#<assetGuid>", see `eyeTextureIdentity` in eyeEmotion.js.
//
// The index (`GET /api/library`) carries `topologyKey` / `emotion` per texture,
// so the *candidate set* is decided without fetching a single full project;
// only the winners get loaded. Keeps a library of hundreds cheap to scan.
// ============================================================================

import { PART_CLASS_EYE, normalizeEmotionTag, eyeTopologyKey } from "./eyeEmotion.js";
import { normalizeEyeTexture } from "./eyeTexture.js";

/** Separator between project slug and asset guid in a peer key. */
export const PEER_KEY_SEP = "#";

/** Upper bound on projects fetched by one scan (a runaway-library backstop). */
export const PEER_SCAN_LIMIT = 24;

/**
 * @param {string} slug
 * @param {string} assetGuid
 * @returns {string}
 */
export function makePeerKey(slug, assetGuid) {
  return `${String(slug || "")}${PEER_KEY_SEP}${String(assetGuid || "")}`;
}

/**
 * Split a peer key back into its parts. Returns nulls for a non-peer key so
 * callers can branch without try/catch.
 * @param {string} key
 * @returns {{ slug: string|null, assetGuid: string|null }}
 */
export function parsePeerKey(key) {
  const s = String(key || "");
  const i = s.indexOf(PEER_KEY_SEP);
  if (i < 0) return { slug: null, assetGuid: null };
  return { slug: s.slice(0, i), assetGuid: s.slice(i + 1) };
}

/**
 * The topology key an index entry advertises.
 *
 * Index entries are summaries, not full textures — they have no `layers`, so
 * `eyeTopologyKey` cannot be recomputed client-side and the server-supplied
 * value is authoritative. An entry written before the index carried the field
 * simply reports "" and is skipped rather than guessed at.
 *
 * @param {{ topologyKey?: string }} entry
 * @returns {string}
 */
export function indexTopologyKey(entry) {
  return typeof entry?.topologyKey === "string" ? entry.topologyKey : "";
}

/**
 * Candidate peer textures in the library index, compatible with `ref`.
 *
 * Pure and synchronous: it looks only at the summary index. Callers fetch the
 * returned slugs and hand the loaded textures to {@link adoptPeerTexture}.
 *
 * @param {Array<object>} projects  entries from `GET /api/library`
 * @param {object} ref              the live texture being edited
 * @param {{ excludeSlug?: string|null, limit?: number }} [opts]
 *   `excludeSlug` drops the project `ref` itself came from, so the open
 *   document never shows up as a morph target for itself.
 * @returns {Array<{ slug: string, projectName: string, assetGuid: string,
 *                   name: string, emotion: string, peerKey: string }>}
 */
export function findCompatibleLibraryTextures(projects, ref, opts = {}) {
  if (!ref) return [];
  const refKey = eyeTopologyKey(ref);
  if (!refKey) return [];
  const excludeSlug = opts.excludeSlug || null;
  const limit = Number.isFinite(opts.limit) ? opts.limit : PEER_SCAN_LIMIT;

  const out = [];
  for (const p of projects || []) {
    if (!p || p.error) continue;
    if (p.projectKind !== "texture") continue;
    if (excludeSlug && p.slug === excludeSlug) continue;
    for (const t of p.textures || []) {
      const kind = t?.kind == null || t.kind === "eye" ? PART_CLASS_EYE : t.kind;
      if (kind !== PART_CLASS_EYE) continue;
      if (indexTopologyKey(t) !== refKey) continue;
      out.push({
        slug: p.slug,
        projectName: p.name || p.slug,
        assetGuid: t.assetGuid,
        name: t.name || "Eye",
        emotion: normalizeEmotionTag(t.emotion),
        peerKey: makePeerKey(p.slug, t.assetGuid),
      });
    }
  }

  // Stable order so the <select> does not reshuffle between refreshes.
  out.sort((a, b) => {
    if (a.emotion !== b.emotion) return a.emotion.localeCompare(b.emotion);
    return a.slug.localeCompare(b.slug);
  });
  return out.slice(0, limit);
}

/**
 * Tag a texture loaded out of another project as a peer.
 *
 * Mutates and returns `tex` — callers always pass a freshly parsed document, so
 * there is nothing to alias. The `peer*` fields are what keep peers out of the
 * open project's own asset map: {@link snapshotTextures} never sees them, so a
 * Save cannot accidentally embed a neighbour's eye.
 *
 * @param {object} tex
 * @param {{ slug: string, projectName?: string }} origin
 * @returns {object} tex
 */
export function adoptPeerTexture(tex, origin) {
  if (!tex) return tex;
  tex.peerKey = makePeerKey(origin?.slug, tex.assetGuid);
  tex.peerSlug = origin?.slug || null;
  tex.peerProject = origin?.projectName || origin?.slug || null;
  return tex;
}

/**
 * Content fingerprint of an eye's pose — every layer's knot geometry, rounded.
 *
 * Used to drop a "peer" that is really the open texture wearing a different
 * slug. That happens on the Assign path: assigning `sad-eyes` copies its eye
 * into the open document, and the library scan then finds the very same eye
 * back in `sad-eyes/project.json`. Comparing guids cannot catch it (forked
 * projects share one) and comparing slugs cannot either (the open document is
 * a *mesh* project by then), but the geometry is identical, so this does.
 *
 * Rounded to 1e-6: enough to survive a JSON round-trip, tight enough that a
 * genuinely different emotion never collides.
 *
 * @param {object} tex
 * @returns {string}
 */
export function eyePoseFingerprint(tex) {
  if (!tex?.layers?.length) return "";
  const parts = [];
  for (const L of tex.layers) {
    const knots = L?.knots || [];
    const nums = [];
    for (const k of knots) {
      nums.push(
        Math.round((Number(k?.x) || 0) * 1e6),
        Math.round((Number(k?.y) || 0) * 1e6),
        Math.round((Number(k?.hx) || 0) * 1e6),
        Math.round((Number(k?.hy) || 0) * 1e6),
      );
    }
    parts.push(`${L?.type || "?"}:${nums.join(",")}`);
  }
  return parts.join("|");
}

/**
 * Extract the eye textures of a loaded project document as peers.
 *
 * Normalized on the way out: `morphBetweenTextures` reads knots and segments
 * straight off the texture, so a peer has to be as complete as an eye the
 * editor created itself. The server migrates on GET, so this only fills
 * defaults — it never has to guess at an older schema.
 *
 * @param {object} doc  a full project.json
 * @param {object} ref  the live texture to stay compatible with
 * @returns {object[]}
 */
export function peersFromProjectDoc(doc, ref) {
  if (!doc?.textureAssets) return [];
  const refKey = ref ? eyeTopologyKey(ref) : "";
  const out = [];
  for (const [guid, raw] of Object.entries(doc.textureAssets)) {
    if (!raw) continue;
    if (raw.kind != null && raw.kind !== "eye") continue;
    const tex = normalizeEyeTexture({ ...raw, assetGuid: raw.assetGuid || guid });
    if (refKey && eyeTopologyKey(tex) !== refKey) continue;
    out.push(adoptPeerTexture(tex, { slug: doc.slug, projectName: doc.name }));
  }
  return out;
}
