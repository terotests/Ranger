// ============================================================================
// schema.js — semantic spline-project document + versioned migrations.
// ============================================================================
// On-disk layout (default):
//   mesh_editor/library/projects/<slug>/project.json
// Optional binary textures (future / upload):
//   mesh_editor/library/projects/<slug>/assets/<name>.png
//
// Bump CURRENT_SCHEMA_VERSION when the document shape changes and add a
// migration step in migrations.js. loadProject() always returns the current
// version so older folders remain readable.
// ============================================================================

export const CURRENT_SCHEMA_VERSION = 2;

export const SCHEMA_KIND = "ranger.splineProject";

/** @typedef {{ id: string, x: number, y: number, hx: number, hy: number, color: string }} KnotV2 */
/** @typedef {{ fromId: string, toId: string, color: string|null, roughness: number, metalness: number, opacity: number, texture: string, textureAsset?: string|null }} SegmentV2 */

/**
 * @typedef {object} SplineProjectV2
 * @property {typeof SCHEMA_KIND} kind
 * @property {2} schemaVersion
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} [description]
 * @property {string[]} [tags]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {{
 *   curveType: number,
 *   pathSegments: number,
 *   angularSteps: number,
 *   revolutionDeg: number,
 *   materialMode: number,
 *   symmetry: boolean,
 *   viewMode?: 'profile'|'orbit'
 * }} editor
 * @property {{ knots: KnotV2[], segments: SegmentV2[] }} profile
 * @property {{ knots: KnotV2[], segments: SegmentV2[] }} orbit
 */

export function nowIso() {
  return new Date().toISOString();
}

export function slugify(name) {
  const s = String(name || "spline")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "spline";
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "sp_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Strip non-JSON-friendly fields (e.g. in-memory textureData buffers). */
export function serializeSegment(seg) {
  return {
    fromId: seg.fromId,
    toId: seg.toId,
    color: seg.color == null ? null : seg.color,
    roughness: Number(seg.roughness ?? 0.4),
    metalness: Number(seg.metalness ?? 0),
    opacity: Number(seg.opacity ?? 1),
    texture: seg.texture || "gradient",
    textureAsset: seg.textureAsset || null,
  };
}

export function serializeKnot(k) {
  return {
    id: k.id,
    x: Number(k.x),
    y: Number(k.y),
    hx: Number(k.hx),
    hy: Number(k.hy),
    color: k.color || "#cccccc",
  };
}

/**
 * Build a current-version project document from the live editor state.
 * @param {object} opts
 * @param {object} opts.state - useSplineEditor reactive state (or snapshotState())
 * @param {string} opts.name
 * @param {string} [opts.id]
 * @param {string} [opts.slug]
 * @param {string} [opts.description]
 * @param {string[]} [opts.tags]
 * @param {string} [opts.createdAt]
 */
export function buildProjectDocument(opts) {
  const st = opts.state;
  const name = String(opts.name || "Untitled spline").trim() || "Untitled spline";
  const createdAt = opts.createdAt || nowIso();
  return {
    kind: SCHEMA_KIND,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: opts.id || newId(),
    slug: opts.slug || slugify(name),
    name,
    description: opts.description || "",
    tags: Array.isArray(opts.tags) ? opts.tags.slice() : [],
    createdAt,
    updatedAt: nowIso(),
    editor: {
      curveType: st.curveType | 0,
      pathSegments: st.pathSegments | 0,
      angularSteps: st.angularSteps | 0,
      revolutionDeg: st.revolutionDeg | 0,
      materialMode: st.materialMode | 0,
      symmetry: !!st.symmetry,
      viewMode: st.viewMode === "orbit" ? "orbit" : "profile",
    },
    profile: {
      knots: (st.knots || []).map(serializeKnot),
      segments: (st.segments || []).map(serializeSegment),
    },
    orbit: {
      knots: (st.orbitKnots || []).map(serializeKnot),
      segments: (st.orbitSegments || []).map(serializeSegment),
    },
  };
}

export function validateProject(doc) {
  const errors = [];
  if (!doc || typeof doc !== "object") {
    errors.push("document is not an object");
    return errors;
  }
  if (doc.kind && doc.kind !== SCHEMA_KIND) {
    errors.push(`unexpected kind "${doc.kind}" (expected ${SCHEMA_KIND})`);
  }
  if (!doc.name) errors.push("missing name");
  if (!doc.profile || !Array.isArray(doc.profile.knots)) errors.push("missing profile.knots");
  if (doc.profile && doc.profile.knots && doc.profile.knots.length < 2) {
    errors.push("profile.knots needs at least 2 points");
  }
  if (doc.schemaVersion >= 2) {
    if (!doc.orbit || !Array.isArray(doc.orbit.knots)) errors.push("missing orbit.knots");
    if (doc.orbit && doc.orbit.knots && doc.orbit.knots.length < 3) {
      errors.push("orbit.knots needs at least 3 points");
    }
  }
  return errors;
}
