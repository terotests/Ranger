// ============================================================================
// migrations.js — upgrade on-disk spline projects to CURRENT_SCHEMA_VERSION.
// ============================================================================

import {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_KIND,
  newId,
  nowIso,
  slugify,
  validateProject,
} from "./schema.js";

/** @type {Record<number, (doc: any) => any>} */
const STEPS = {
  // 0 / missing → 1: wrap a loose editor dump into the semantic envelope.
  1(doc) {
    if (doc && doc.schemaVersion === 1 && doc.kind === SCHEMA_KIND) {
      return normalizeV1(doc);
    }
    // Accept earlier ad-hoc shapes: { knots, segments, ...editor fields }
    const knots = doc.profile?.knots || doc.knots || [];
    const segments = doc.profile?.segments || doc.segments || [];
    const name = doc.name || "Migrated spline";
    return normalizeV1({
      kind: SCHEMA_KIND,
      schemaVersion: 1,
      id: doc.id || newId(),
      slug: doc.slug || slugify(name),
      name,
      description: doc.description || "",
      tags: doc.tags || [],
      createdAt: doc.createdAt || nowIso(),
      updatedAt: doc.updatedAt || nowIso(),
      editor: {
        curveType: doc.editor?.curveType ?? doc.curveType ?? 0,
        pathSegments: doc.editor?.pathSegments ?? doc.pathSegments ?? 12,
        angularSteps: doc.editor?.angularSteps ?? doc.angularSteps ?? 24,
        revolutionDeg: doc.editor?.revolutionDeg ?? doc.revolutionDeg ?? 360,
        materialMode: doc.editor?.materialMode ?? doc.materialMode ?? 3,
        symmetry: doc.editor?.symmetry ?? doc.symmetry ?? true,
      },
      profile: { knots, segments },
    });
  },
};

function normalizeV1(doc) {
  const knots = (doc.profile?.knots || []).map((k, i) => ({
    id: k.id || `k${i}`,
    x: Number(k.x) || 0,
    y: Number(k.y) || 0,
    hx: Number(k.hx) || 0,
    hy: Number(k.hy) || 0,
    color: k.color || "#cccccc",
  }));
  const segments = (doc.profile?.segments || []).map((s, i) => ({
    fromId: s.fromId || knots[i]?.id || `k${i}`,
    toId: s.toId || knots[i + 1]?.id || `k${i + 1}`,
    color: s.color == null ? null : s.color,
    roughness: Number(s.roughness ?? 0.4),
    metalness: Number(s.metalness ?? 0),
    opacity: Number(s.opacity ?? 1),
    texture: s.texture || "gradient",
    textureAsset: s.textureAsset || null,
  }));
  // Ensure segment count matches knot spans.
  while (segments.length < Math.max(0, knots.length - 1)) {
    const i = segments.length;
    segments.push({
      fromId: knots[i].id,
      toId: knots[i + 1].id,
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "gradient",
      textureAsset: null,
    });
  }
  return {
    kind: SCHEMA_KIND,
    schemaVersion: 1,
    id: doc.id || newId(),
    slug: doc.slug || slugify(doc.name || "spline"),
    name: doc.name || "Untitled spline",
    description: doc.description || "",
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    createdAt: doc.createdAt || nowIso(),
    updatedAt: doc.updatedAt || nowIso(),
    editor: {
      curveType: Number(doc.editor?.curveType ?? 0),
      pathSegments: Number(doc.editor?.pathSegments ?? 12),
      angularSteps: Number(doc.editor?.angularSteps ?? 24),
      revolutionDeg: Number(doc.editor?.revolutionDeg ?? 360),
      materialMode: Number(doc.editor?.materialMode ?? 3),
      symmetry: doc.editor?.symmetry !== false,
    },
    profile: { knots, segments: segments.slice(0, Math.max(0, knots.length - 1)) },
  };
}

/**
 * Migrate any readable project blob to the current schema version.
 * @param {any} raw
 * @returns {{ ok: true, doc: import('./schema.js').SplineProjectV1 } | { ok: false, errors: string[] }}
 */
export function migrateProject(raw) {
  if (raw == null || typeof raw !== "object") {
    return { ok: false, errors: ["not an object"] };
  }
  let doc = structuredClone(raw);
  let v = Number(doc.schemaVersion || 0);
  if (v > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [`schemaVersion ${v} is newer than this app (${CURRENT_SCHEMA_VERSION})`],
    };
  }
  while (v < CURRENT_SCHEMA_VERSION) {
    const next = v + 1;
    const step = STEPS[next];
    if (!step) {
      return { ok: false, errors: [`missing migration step to v${next}`] };
    }
    doc = step(doc);
    doc.schemaVersion = next;
    v = next;
  }
  doc = STEPS[CURRENT_SCHEMA_VERSION](doc);
  const errors = validateProject(doc);
  if (errors.length) return { ok: false, errors };
  return { ok: true, doc };
}
