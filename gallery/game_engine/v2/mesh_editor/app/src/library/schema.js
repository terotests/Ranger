// ============================================================================
// schema.js — semantic spline-project document + versioned migrations.
// ============================================================================

import { serializeEyeTexture, normalizeEyeUv } from "../lib/texture/eyeTexture.js";
import { serializeTextureMap, normalizeTextureMap } from "../lib/texture/textureMapCodec.js";

export const CURRENT_SCHEMA_VERSION = 11;

export { serializeTextureMap, normalizeTextureMap };

export const SCHEMA_KIND = "ranger.splineProject";

/** Library list / save filter: mesh projects vs texture-only authoring. */
export function normalizeProjectKind(kind) {
  return kind === "texture" ? "texture" : "mesh";
}

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

export function serializePlacementNormal(pn) {
  const start = pn?.start || {};
  const end = pn?.end || {};
  return {
    start: { x: Number(start.x) || 0, y: Number(start.y) || 0 },
    end: { x: Number(end.x) || 0, y: Number(end.y) || 0 },
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
    tessellationMode: body.tessellationMode === "torus" ? "torus" : "rotation",
    objectMaterial: serializeObjectMaterial(body.objectMaterial, { includeMap: false }),
    knots: (body.knots || []).map(serializeKnot),
    segments: (body.segments || []).map(serializeSegment),
    orbitKnots: (body.orbitKnots || []).map(serializeKnot),
    orbitSegments: (body.orbitSegments || []).map(serializeSegment),
    spineProfileKnots: (body.spineProfileKnots || []).map(serializeKnot),
    spineProfileSegments: (body.spineProfileSegments || []).map(serializeSegment),
    spineOrbitKnots: (body.spineOrbitKnots || []).map(serializeKnot),
    spineOrbitSegments: (body.spineOrbitSegments || []).map(serializeSegment),
    placementNormal: serializePlacementNormal(body.placementNormal),
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
      z: Number(ch.transform?.z ?? 0),
      nx: Number(ch.transform?.nx ?? 0),
      ny: Number(ch.transform?.ny ?? 1),
      nz: Number(ch.transform?.nz ?? 0),
      surface: !!ch.transform?.surface,
      rotationYDeg: Number(ch.transform?.rotationYDeg ?? 0),
      scale: Number(ch.transform?.scale ?? 0.28),
      useSymmetry: !!ch.transform?.useSymmetry,
      snapCenterline: !!ch.transform?.snapCenterline,
    },
    visible: ch.visible !== false,
  };
}

/** Texture assets store editable params only (no baked pixels). */
function serializeTextureAsset(tex) {
  if (!tex || typeof tex !== "object") return null;
  if (tex.kind === "eye" || !tex.kind) {
    return serializeEyeTexture(tex);
  }
  return {
    assetGuid: tex.assetGuid,
    name: tex.name || "Texture",
    kind: String(tex.kind),
    width: Number(tex.width) || 256,
    height: Number(tex.height) || 256,
    backgroundFrom: tex.backgroundFrom === "solid" ? "solid" : "vertexColors",
    previewBackground: tex.previewBackground || "#6a8f6a",
    layers: tex.layers || [],
  };
}

/**
 * Serialize objectMaterial for project JSON / embedded bodies.
 * @param {object|null|undefined} om
 * @param {{ includeMap?: boolean }} [opts] includeMap=true for root save (pre-baked UV atlas)
 */
export function serializeObjectMaterial(om, opts = {}) {
  const includeMap = opts.includeMap !== false;
  const out = {
    color: om?.color ?? null,
    roughness: Number(om?.roughness ?? 0.4),
    metalness: Number(om?.metalness ?? 0),
    opacity: Number(om?.opacity ?? 1),
    texture: om?.texture || "gradient",
    textureAsset: om?.textureAsset || null,
    textureAssign:
      om?.textureAssign === "eyePair" ? "eyePair" : om?.textureAssign || null,
    textureUv: normalizeEyeUv(om?.textureUv),
  };
  if (includeMap) {
    out.textureMap = serializeTextureMap(om?.textureMap);
  }
  return out;
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
  const projectKind = normalizeProjectKind(opts.projectKind || st.projectKind || "mesh");
  const textureAssets = {};
  for (const [guid, tex] of Object.entries(st.textureAssets || {})) {
    const s = serializeTextureAsset({ ...tex, assetGuid: tex.assetGuid || guid });
    if (s) textureAssets[s.assetGuid] = s;
  }
  const assetKeys = Object.keys(textureAssets);
  let texAsset = st.objectMaterial?.textureAsset || null;
  let texAssign =
    st.objectMaterial?.textureAssign === "eyePair"
      ? "eyePair"
      : st.objectMaterial?.textureAssign || null;
  let texMode = st.objectMaterial?.texture || "gradient";
  if (texAsset && !textureAssets[texAsset]) {
    // Stale guid — fall back when there is exactly one embedded texture.
    texAsset = assetKeys.length === 1 ? assetKeys[0] : null;
  }
  if (!texAsset && assetKeys.length && (texMode === "asset" || texAssign === "eyePair")) {
    texAsset = assetKeys[0];
    texAssign = texAssign || "eyePair";
    texMode = "asset";
  }
  if (texAsset && !texAssign) texAssign = "eyePair";
  if (texAsset && texMode !== "asset") texMode = "asset";

  return {
    kind: SCHEMA_KIND,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projectKind,
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
      tessellationMode: st.tessellationMode === "torus" ? "torus" : "rotation",
      materialMode: st.materialMode | 0,
      symmetry: !!st.symmetry,
      viewMode:
        st.viewMode === "orbit" || st.viewMode === "spine" ? st.viewMode : "profile",
      spineSource: st.spineSource === "orbit" ? "orbit" : "profile",
    },
    objectMaterial: {
      ...serializeObjectMaterial(
        {
          ...(st.objectMaterial || {}),
          texture: texMode,
          textureAsset: texAsset,
          textureAssign: texAssign,
        },
        { includeMap: true },
      ),
    },
    profile: {
      knots: (st.knots || []).map(serializeKnot),
      segments: (st.segments || []).map(serializeSegment),
    },
    orbit: {
      knots: (st.orbitKnots || []).map(serializeKnot),
      segments: (st.orbitSegments || []).map(serializeSegment),
    },
    spineProfile: {
      knots: (st.spineProfileKnots || []).map(serializeKnot),
      segments: (st.spineProfileSegments || []).map(serializeSegment),
    },
    spineOrbit: {
      knots: (st.spineOrbitKnots || []).map(serializeKnot),
      segments: (st.spineOrbitSegments || []).map(serializeSegment),
    },
    placementNormal: serializePlacementNormal(st.placementNormal),
    embeddedAssets: embedded,
    children: (st.children || []).map(serializeChild),
    textureAssets,
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
  const projectKind = normalizeProjectKind(doc.projectKind);
  if (doc.schemaVersion >= 10 && doc.projectKind != null && doc.projectKind !== "mesh" && doc.projectKind !== "texture") {
    errors.push('projectKind must be "mesh" or "texture"');
  }

  // Texture-library entries: params only — mesh profile optional.
  if (projectKind === "texture") {
    if (doc.textureAssets == null || typeof doc.textureAssets !== "object") {
      errors.push("texture project needs textureAssets map");
    } else if (!Object.keys(doc.textureAssets).length) {
      errors.push("texture project needs at least one textureAssets entry");
    } else {
      for (const [guid, tex] of Object.entries(doc.textureAssets)) {
        if (!tex || typeof tex !== "object") {
          errors.push(`textureAssets[${guid}] invalid`);
          continue;
        }
        if (!Array.isArray(tex.layers)) errors.push(`textureAssets[${guid}].layers must be an array`);
      }
    }
    return errors;
  }

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
  if (doc.schemaVersion >= 5) {
    if (!doc.spineProfile || !Array.isArray(doc.spineProfile.knots)) {
      errors.push("missing spineProfile.knots");
    } else if (doc.spineProfile.knots.length < 2) {
      errors.push("spineProfile.knots needs at least 2 points");
    }
    if (!doc.spineOrbit || !Array.isArray(doc.spineOrbit.knots)) {
      errors.push("missing spineOrbit.knots");
    } else if (doc.spineOrbit.knots.length < 2) {
      errors.push("spineOrbit.knots needs at least 2 points");
    }
  }
  if (doc.schemaVersion >= 6) {
    if (!doc.placementNormal?.start || !doc.placementNormal?.end) {
      errors.push("missing placementNormal.start/end");
    } else {
      const sx = Number(doc.placementNormal.start.x);
      const sy = Number(doc.placementNormal.start.y);
      const ex = Number(doc.placementNormal.end.x);
      const ey = Number(doc.placementNormal.end.y);
      if (![sx, sy, ex, ey].every(Number.isFinite)) {
        errors.push("placementNormal coordinates must be finite numbers");
      } else if (Math.hypot(ex - sx, ey - sy) < 1e-9) {
        errors.push("placementNormal start and end must differ");
      }
    }
  }
  if (doc.schemaVersion >= 7) {
    const m = doc.editor?.tessellationMode;
    if (m != null && m !== "rotation" && m !== "torus") {
      errors.push('editor.tessellationMode must be "rotation" or "torus"');
    }
  }
  if (doc.schemaVersion >= 9) {
    if (doc.textureAssets != null && typeof doc.textureAssets !== "object") {
      errors.push("textureAssets must be an object map");
    } else if (doc.textureAssets) {
      for (const [guid, tex] of Object.entries(doc.textureAssets)) {
        if (!tex || typeof tex !== "object") {
          errors.push(`textureAssets[${guid}] invalid`);
          continue;
        }
        if (!Array.isArray(tex.layers)) errors.push(`textureAssets[${guid}].layers must be an array`);
      }
    }
  }
  if (doc.schemaVersion >= 11 && doc.objectMaterial?.textureMap != null) {
    const tm = doc.objectMaterial.textureMap;
    if (typeof tm !== "object") {
      errors.push("objectMaterial.textureMap must be an object or null");
    } else if (tm.encoding !== "rgba8-base64") {
      errors.push('objectMaterial.textureMap.encoding must be "rgba8-base64"');
    } else if (!(tm.w > 0) || !(tm.h > 0) || typeof tm.data !== "string") {
      errors.push("objectMaterial.textureMap needs w, h, and data");
    }
  }
  return errors;
}
