// ============================================================================
// schema.js — semantic spline-project document + versioned migrations.
// ============================================================================

export const CURRENT_SCHEMA_VERSION = 4;

export const SCHEMA_KIND = "ranger.splineProject";

/**
 * @typedef {object} ChildInstanceV3
 * @property {string} instanceGuid
 * @property {string} contentGuid  // shared → linked; unique copy → independent
 * @property {'copy'|'link'} mode
 * @property {string} name
 * @property {string|null} [sourceId]
 * @property {string|null} [sourceSlug]
 * @property {{
 *   x: number, y: number,
 *   rotationYDeg: number,
 *   scale: number,
 *   useSymmetry: boolean,
 *   snapCenterline: boolean
 * }} transform
 * @property {boolean} [visible]
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

export function serializeSegment(seg) {
  const pathType =
    seg.pathType === "line" || seg.pathType === "arc" ? seg.pathType : "bezier";
  return {
    fromId: seg.fromId,
    toId: seg.toId,
    color: seg.color == null ? null : seg.color,
    roughness: Number(seg.roughness ?? 0.4),
    metalness: Number(seg.metalness ?? 0),
    opacity: Number(seg.opacity ?? 1),
    texture: seg.texture || "gradient",
    textureAsset: seg.textureAsset || null,
    pathType,
    arcBulge: seg.arcBulge == null || seg.arcBulge === "" ? null : Number(seg.arcBulge),
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

function serializeBodyContent(body) {
  return {
    assetGuid: body.assetGuid,
    name: body.name || "asset",
    curveType: body.curveType | 0,
    pathSegments: body.pathSegments | 0,
    angularSteps: body.angularSteps | 0,
    revolutionDeg: body.revolutionDeg | 0,
    objectMaterial: {
      color: body.objectMaterial?.color ?? null,
      roughness: Number(body.objectMaterial?.roughness ?? 0.4),
      metalness: Number(body.objectMaterial?.metalness ?? 0),
      opacity: Number(body.objectMaterial?.opacity ?? 1),
      texture: body.objectMaterial?.texture || "gradient",
    },
    knots: (body.knots || []).map(serializeKnot),
    segments: (body.segments || []).map(serializeSegment),
    orbitKnots: (body.orbitKnots || []).map(serializeKnot),
    orbitSegments: (body.orbitSegments || []).map(serializeSegment),
  };
}

function serializeChild(ch) {
  return {
    instanceGuid: ch.instanceGuid,
    contentGuid: ch.contentGuid,
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
  };
}

/**
 * Build a current-version project document from the live editor state.
 */
export function buildProjectDocument(opts) {
  const st = opts.state;
  const name = String(opts.name || "Untitled spline").trim() || "Untitled spline";
  const createdAt = opts.createdAt || nowIso();
  const embedded = {};
  for (const [guid, body] of Object.entries(st.embeddedAssets || {})) {
    embedded[guid] = serializeBodyContent(body);
  }
  return {
    kind: SCHEMA_KIND,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: opts.id || newId(),
    assetGuid: st.assetGuid || newId(),
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
    objectMaterial: {
      color: st.objectMaterial?.color ?? null,
      roughness: Number(st.objectMaterial?.roughness ?? 0.4),
      metalness: Number(st.objectMaterial?.metalness ?? 0),
      opacity: Number(st.objectMaterial?.opacity ?? 1),
      texture: st.objectMaterial?.texture || "gradient",
    },
    profile: {
      knots: (st.knots || []).map(serializeKnot),
      segments: (st.segments || []).map(serializeSegment),
    },
    orbit: {
      knots: (st.orbitKnots || []).map(serializeKnot),
      segments: (st.orbitSegments || []).map(serializeSegment),
    },
    embeddedAssets: embedded,
    children: (st.children || []).map(serializeChild),
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
  if (doc.schemaVersion >= 3) {
    if (!doc.assetGuid) errors.push("missing assetGuid");
    if (doc.children && !Array.isArray(doc.children)) errors.push("children must be an array");
  }
  return errors;
}
