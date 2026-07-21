// ============================================================================
// migrations.js — upgrade on-disk spline projects to CURRENT_SCHEMA_VERSION.
// ============================================================================

import { SplineLathe } from "../../../tessellate/spline_lathe.mjs";
import {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_KIND,
  newId,
  nowIso,
  slugify,
  validateProject,
} from "./schema.js";

function defaultOrbitDoc() {
  const raw = SplineLathe.defaultOrbitKnots();
  const colors = ["#ffb454", "#e87ac8", "#c8e87a", "#ff7a6a"];
  const knots = raw.map((k, i) => ({
    id: `o${i}`,
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: colors[i % colors.length],
  }));
  const segments = knots.map((k, i) => ({
    fromId: k.id,
    toId: knots[(i + 1) % knots.length].id,
    color: null,
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "gradient",
    textureAsset: null,
  }));
  return { knots, segments };
}

function mapKnots(list) {
  return (list || []).map((k, i) => ({
    id: k.id || `k${i}`,
    x: Number(k.x) || 0,
    y: Number(k.y) || 0,
    hx: Number(k.hx) || 0,
    hy: Number(k.hy) || 0,
    color: k.color || "#cccccc",
  }));
}

function mapSegments(list, knots, closed) {
  const n = knots.length;
  const want = closed ? n : Math.max(0, n - 1);
  const segments = (list || []).map((s, i) => ({
    fromId: s.fromId || knots[i]?.id || `k${i}`,
    toId:
      s.toId ||
      knots[closed ? (i + 1) % n : i + 1]?.id ||
      `k${i + 1}`,
    color: s.color == null ? null : s.color,
    roughness: Number(s.roughness ?? 0.4),
    metalness: Number(s.metalness ?? 0),
    opacity: Number(s.opacity ?? 1),
    texture: s.texture || "gradient",
    textureAsset: s.textureAsset || null,
  }));
  while (segments.length < want) {
    const i = segments.length;
    const fromId = knots[i].id;
    const toId = knots[closed ? (i + 1) % n : i + 1].id;
    segments.push({
      fromId,
      toId,
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "gradient",
      textureAsset: null,
    });
  }
  return segments.slice(0, want);
}

function normalizeV1(doc) {
  const knots = mapKnots(doc.profile?.knots || doc.knots);
  const segments = mapSegments(doc.profile?.segments || doc.segments, knots, false);
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
      curveType: Number(doc.editor?.curveType ?? doc.curveType ?? 0),
      pathSegments: Number(doc.editor?.pathSegments ?? doc.pathSegments ?? 12),
      angularSteps: Number(doc.editor?.angularSteps ?? doc.angularSteps ?? 24),
      revolutionDeg: Number(doc.editor?.revolutionDeg ?? doc.revolutionDeg ?? 360),
      materialMode: Number(doc.editor?.materialMode ?? doc.materialMode ?? 3),
      symmetry: doc.editor?.symmetry !== false && doc.symmetry !== false,
    },
    profile: { knots, segments },
  };
}

function normalizeV2(doc) {
  const v1 = normalizeV1(doc);
  const orbitSrc = doc.orbit?.knots?.length >= 3 ? doc.orbit : defaultOrbitDoc();
  const orbitKnots = mapKnots(orbitSrc.knots);
  // Re-id default orbit if colliding with profile ids
  const used = new Set(v1.profile.knots.map((k) => k.id));
  for (const k of orbitKnots) {
    if (used.has(k.id)) k.id = `o_${k.id}_${Math.random().toString(36).slice(2, 6)}`;
    used.add(k.id);
  }
  const orbitSegments = mapSegments(orbitSrc.segments, orbitKnots, true);
  return {
    ...v1,
    schemaVersion: 2,
    editor: {
      ...v1.editor,
      viewMode: doc.editor?.viewMode === "orbit" ? "orbit" : "profile",
    },
    orbit: { knots: orbitKnots, segments: orbitSegments },
  };
}

function normalizeEmbeddedBody(body, fallbackGuid) {
  if (!body) return null;
  const knots = mapKnots(body.knots);
  const orbitKnots = mapKnots(body.orbitKnots || body.orbit?.knots);
  if (orbitKnots.length < 3) return null;
  return {
    assetGuid: body.assetGuid || fallbackGuid || newId(),
    name: body.name || "Sub-object",
    curveType: Number(body.curveType ?? 0),
    pathSegments: Number(body.pathSegments ?? 12),
    angularSteps: Number(body.angularSteps ?? 24),
    revolutionDeg: Number(body.revolutionDeg ?? 360),
    objectMaterial: {
      color: body.objectMaterial?.color ?? null,
      roughness: Number(body.objectMaterial?.roughness ?? 0.4),
      metalness: Number(body.objectMaterial?.metalness ?? 0),
      opacity: Number(body.objectMaterial?.opacity ?? 1),
      texture: body.objectMaterial?.texture || "gradient",
    },
    knots,
    segments: mapSegments(body.segments, knots, false),
    orbitKnots,
    orbitSegments: mapSegments(body.orbitSegments || body.orbit?.segments, orbitKnots, true),
  };
}

function normalizeV3(doc) {
  const v2 = normalizeV2(doc);
  const embeddedAssets = {};
  const rawEmb = doc.embeddedAssets || {};
  for (const [guid, body] of Object.entries(rawEmb)) {
    const n = normalizeEmbeddedBody(body, guid);
    if (n) embeddedAssets[n.assetGuid] = n;
  }
  const children = (doc.children || []).map((ch, i) => ({
    instanceGuid: ch.instanceGuid || newId(),
    contentGuid: ch.contentGuid || ch.assetGuid || `missing_${i}`,
    mode: ch.mode === "link" ? "link" : "copy",
    name: ch.name || "Sub-object",
    sourceId: ch.sourceId || null,
    sourceSlug: ch.sourceSlug || null,
    transform: {
      x: Number(ch.transform?.x ?? 0.45),
      y: Number(ch.transform?.y ?? 0.35),
      rotationYDeg: Number(ch.transform?.rotationYDeg ?? 0),
      scale: Number(ch.transform?.scale ?? 0.28),
      useSymmetry: !!ch.transform?.useSymmetry,
      snapCenterline: !!ch.transform?.snapCenterline,
    },
    visible: ch.visible !== false,
  }));
  return {
    ...v2,
    schemaVersion: 3,
    assetGuid: doc.assetGuid || v2.id || newId(),
    objectMaterial: {
      color: doc.objectMaterial?.color ?? null,
      roughness: Number(doc.objectMaterial?.roughness ?? 0.4),
      metalness: Number(doc.objectMaterial?.metalness ?? 0),
      opacity: Number(doc.objectMaterial?.opacity ?? 1),
      texture: doc.objectMaterial?.texture || "gradient",
    },
    embeddedAssets,
    children,
  };
}

/** @type {Record<number, (doc: any) => any>} */
const STEPS = {
  1(doc) {
    return normalizeV1(doc);
  },
  2(doc) {
    return normalizeV2(doc);
  },
  // 2 → 3: assetGuid, objectMaterial, embeddedAssets, children
  3(doc) {
    return normalizeV3(doc);
  },
};

/**
 * Migrate any readable project blob to the current schema version.
 * @param {any} raw
 * @returns {{ ok: true, doc: object } | { ok: false, errors: string[] }}
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
