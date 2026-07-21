// ============================================================================
// assetClone.js — deep-clone spline body content with remapped ids + new GUID.
// ============================================================================

export function newGuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "g_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function knotUid() {
  return "k" + Math.random().toString(36).slice(2, 9);
}

function remapKnots(knots, idMap) {
  return (knots || []).map((k) => {
    const nid = knotUid();
    idMap.set(k.id, nid);
    return {
      id: nid,
      x: Number(k.x) || 0,
      y: Number(k.y) || 0,
      hx: Number(k.hx) || 0,
      hy: Number(k.hy) || 0,
      color: k.color || "#cccccc",
    };
  });
}

function remapSegments(segments, idMap) {
  return (segments || []).map((s) => ({
    fromId: idMap.get(s.fromId) || s.fromId,
    toId: idMap.get(s.toId) || s.toId,
    color: s.color == null ? null : s.color,
    roughness: Number(s.roughness ?? 0.4),
    metalness: Number(s.metalness ?? 0),
    opacity: Number(s.opacity ?? 1),
    texture: s.texture || "gradient",
    textureAsset: s.textureAsset || null,
    textureData: null,
  }));
}

/**
 * Clone profile+orbit (+ optional objectMaterial) into an embedded asset body.
 * Always assigns a fresh assetGuid unless preserveGuid is set (link cache).
 */
export function cloneBodyContent(src, { preserveGuid = false, name = "Sub-object" } = {}) {
  const idMap = new Map();
  const profileKnots = remapKnots(src.profile?.knots || src.knots, idMap);
  const profileSegments = remapSegments(src.profile?.segments || src.segments, idMap);
  const orbitMap = new Map();
  const orbitKnots = remapKnots(src.orbit?.knots || src.orbitKnots, orbitMap);
  const orbitSegments = remapSegments(src.orbit?.segments || src.orbitSegments, orbitMap);
  const ed = src.editor || src;
  return {
    assetGuid: preserveGuid && src.assetGuid ? src.assetGuid : newGuid(),
    name: name || src.name || "Sub-object",
    curveType: ed.curveType | 0,
    pathSegments: ed.pathSegments || 12,
    angularSteps: ed.angularSteps || 24,
    revolutionDeg: ed.revolutionDeg || 360,
    objectMaterial: src.objectMaterial
      ? { ...src.objectMaterial }
      : { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" },
    knots: profileKnots,
    segments: profileSegments,
    orbitKnots,
    orbitSegments,
  };
}

/** Snapshot the live root editor fields into body-content shape. */
export function snapshotRootAsBody(state) {
  return {
    assetGuid: state.assetGuid,
    name: "root",
    curveType: state.curveType,
    pathSegments: state.pathSegments,
    angularSteps: state.angularSteps,
    revolutionDeg: state.revolutionDeg,
    objectMaterial: { ...state.objectMaterial },
    knots: state.knots.map((k) => ({ ...k })),
    segments: state.segments.map((s) => ({
      fromId: s.fromId,
      toId: s.toId,
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness,
      opacity: s.opacity,
      texture: s.texture,
      textureAsset: s.textureAsset || null,
      textureData: null,
    })),
    orbitKnots: state.orbitKnots.map((k) => ({ ...k })),
    orbitSegments: state.orbitSegments.map((s) => ({
      fromId: s.fromId,
      toId: s.toId,
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness,
      opacity: s.opacity,
      texture: s.texture,
      textureAsset: s.textureAsset || null,
      textureData: null,
    })),
  };
}

export function defaultChildTransform(overrides = {}) {
  return {
    x: 0.45,
    y: 0.35,
    rotationYDeg: 0,
    scale: 0.28,
    useSymmetry: false,
    snapCenterline: false,
    ...overrides,
  };
}
