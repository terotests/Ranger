// ============================================================================
// assetClone.js — deep-clone spline body content with remapped ids + new GUID.
// ============================================================================

import { defaultSpineKnots, defaultSpineSegments } from "./spineLathe.js";
import { normalizePlacementNormal } from "./placementNormal.js";

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
    pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
    arcBulge: s.arcBulge == null || s.arcBulge === "" ? null : Number(s.arcBulge),
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
  const spinePMap = new Map();
  let spineProfileKnots = remapKnots(
    src.spineProfile?.knots || src.spineProfileKnots,
    spinePMap,
  );
  let spineProfileSegments = remapSegments(
    src.spineProfile?.segments || src.spineProfileSegments,
    spinePMap,
  );
  if (spineProfileKnots.length < 2) {
    spineProfileKnots = defaultSpineKnots();
    spineProfileSegments = defaultSpineSegments(spineProfileKnots);
  }
  const spineOMap = new Map();
  let spineOrbitKnots = remapKnots(src.spineOrbit?.knots || src.spineOrbitKnots, spineOMap);
  let spineOrbitSegments = remapSegments(
    src.spineOrbit?.segments || src.spineOrbitSegments,
    spineOMap,
  );
  if (spineOrbitKnots.length < 2) {
    spineOrbitKnots = defaultSpineKnots();
    spineOrbitSegments = defaultSpineSegments(spineOrbitKnots);
  }
  const ed = src.editor || src;
  return {
    assetGuid: preserveGuid && src.assetGuid ? src.assetGuid : newGuid(),
    name: name || src.name || "Sub-object",
    curveType: ed.curveType | 0,
    pathSegments: ed.pathSegments || 12,
    angularSteps: ed.angularSteps || 24,
    revolutionDeg: ed.revolutionDeg || 360,
    tessellationMode: ed.tessellationMode === "torus" || src.tessellationMode === "torus" ? "torus" : "rotation",
    objectMaterial: src.objectMaterial
      ? { ...src.objectMaterial }
      : { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" },
    knots: profileKnots,
    segments: profileSegments,
    orbitKnots,
    orbitSegments,
    spineProfileKnots,
    spineProfileSegments,
    spineOrbitKnots,
    spineOrbitSegments,
    placementNormal: normalizePlacementNormal(src.placementNormal),
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
    tessellationMode: state.tessellationMode === "torus" ? "torus" : "rotation",
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
      pathType: s.pathType || "bezier",
      arcBulge: s.arcBulge ?? null,
    })),
    spineProfileKnots: (state.spineProfileKnots || []).map((k) => ({ ...k })),
    spineProfileSegments: (state.spineProfileSegments || []).map((s) => ({
      fromId: s.fromId,
      toId: s.toId,
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness,
      opacity: s.opacity,
      texture: s.texture,
      textureAsset: s.textureAsset || null,
      textureData: null,
      pathType: s.pathType || "line",
      arcBulge: s.arcBulge ?? null,
    })),
    spineOrbitKnots: (state.spineOrbitKnots || []).map((k) => ({ ...k })),
    spineOrbitSegments: (state.spineOrbitSegments || []).map((s) => ({
      fromId: s.fromId,
      toId: s.toId,
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness,
      opacity: s.opacity,
      texture: s.texture,
      textureAsset: s.textureAsset || null,
      textureData: null,
      pathType: s.pathType || "line",
      arcBulge: s.arcBulge ?? null,
    })),
    placementNormal: normalizePlacementNormal(state.placementNormal),
  };
}

export function defaultChildTransform(overrides = {}) {
  return {
    x: 0.45,
    y: 0.35,
    z: 0,
    nx: 0,
    ny: 1,
    nz: 0,
    surface: false,
    rotationYDeg: 0,
    scale: 0.28,
    useSymmetry: false,
    snapCenterline: false,
    ...overrides,
  };
}
