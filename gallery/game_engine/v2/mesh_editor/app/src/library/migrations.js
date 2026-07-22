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
  normalizeProjectKind,
} from "./schema.js";
import { normalizeEyeTexture } from "../lib/texture/eyeTexture.js";

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
    pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
    arcBulge: s.arcBulge == null || s.arcBulge === "" ? null : Number(s.arcBulge),
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
      pathType: "bezier",
      arcBulge: null,
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
  // Forward-compat: keep spine + placementNormal through the v3 whitelist so
  // migrateProject's final STEPS[CURRENT] re-normalize does not wipe them.
  const spineProfileKnots = mapKnots(body.spineProfileKnots);
  const spineOrbitKnots = mapKnots(body.spineOrbitKnots);
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
    spineProfileKnots,
    spineProfileSegments: spineProfileKnots.length
      ? mapSegments(body.spineProfileSegments, spineProfileKnots, false)
      : [],
    spineOrbitKnots,
    spineOrbitSegments: spineOrbitKnots.length
      ? mapSegments(body.spineOrbitSegments, spineOrbitKnots, false)
      : [],
    placementNormal: body.placementNormal
      ? {
          start: {
            x: Number(body.placementNormal.start?.x) || 0,
            y: Number(body.placementNormal.start?.y) || 0,
          },
          end: {
            x: Number(body.placementNormal.end?.x) || 0,
            y: Number(body.placementNormal.end?.y) || 0,
          },
        }
      : undefined,
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
      // Forward-compat: v8 surface fields must survive the v3 whitelist when
      // migrateProject re-runs STEPS[CURRENT] on an already-current document.
      z: Number(ch.transform?.z ?? 0),
      nx: Number.isFinite(Number(ch.transform?.nx)) ? Number(ch.transform.nx) : 0,
      ny: Number.isFinite(Number(ch.transform?.ny)) ? Number(ch.transform.ny) : 1,
      nz: Number.isFinite(Number(ch.transform?.nz)) ? Number(ch.transform.nz) : 0,
      surface: !!ch.transform?.surface,
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

function ensureSegPathTypes(segments) {
  return (segments || []).map((s) => ({
    ...s,
    pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
    arcBulge: s.arcBulge == null || s.arcBulge === "" ? null : Number(s.arcBulge),
  }));
}

function normalizeV4(doc) {
  const v3 = normalizeV3(doc);
  v3.schemaVersion = 4;
  v3.profile = {
    ...v3.profile,
    segments: ensureSegPathTypes(v3.profile.segments),
  };
  v3.orbit = {
    ...v3.orbit,
    segments: ensureSegPathTypes(v3.orbit.segments),
  };
  const emb = {};
  for (const [guid, body] of Object.entries(v3.embeddedAssets || {})) {
    emb[guid] = {
      ...body,
      segments: ensureSegPathTypes(body.segments),
      orbitSegments: ensureSegPathTypes(body.orbitSegments),
    };
  }
  v3.embeddedAssets = emb;
  return v3;
}

function defaultStraightSpine() {
  const knots = [
    { id: "sp0", x: 0, y: -1, hx: 0, hy: 0, color: "#c8e87a" },
    { id: "sp1", x: 0, y: 0, hx: 0, hy: 0, color: "#7ecf6a" },
    { id: "sp2", x: 0, y: 1, hx: 0, hy: 0, color: "#6ec8ff" },
  ];
  return {
    knots,
    segments: ensureSegPathTypes(
      knots.slice(0, -1).map((k, i) => ({
        fromId: k.id,
        toId: knots[i + 1].id,
        color: null,
        roughness: 0.4,
        metalness: 0,
        opacity: 1,
        texture: "gradient",
        pathType: "line",
        arcBulge: null,
      })),
    ),
  };
}

function normalizeSpineBlock(block, idPrefix) {
  if (block?.knots?.length >= 2) {
    const knots = mapKnots(block.knots);
    for (let i = 0; i < knots.length; i++) {
      if (!knots[i].id.startsWith(idPrefix)) {
        // keep ids; only fix empties via mapKnots
      }
    }
    return {
      knots,
      segments: ensureSegPathTypes(mapSegments(block.segments, knots, false)),
    };
  }
  const d = defaultStraightSpine();
  return {
    knots: d.knots.map((k, i) => ({ ...k, id: `${idPrefix}${i}` })),
    segments: d.segments.map((s, i) => ({
      ...s,
      fromId: `${idPrefix}${i}`,
      toId: `${idPrefix}${i + 1}`,
    })),
  };
}

function normalizeV5(doc) {
  const v4 = normalizeV4(doc);
  v4.schemaVersion = 5;
  v4.editor = {
    ...v4.editor,
    spineSource: doc.editor?.spineSource === "orbit" ? "orbit" : "profile",
    viewMode:
      doc.editor?.viewMode === "orbit" || doc.editor?.viewMode === "spine"
        ? doc.editor.viewMode
        : v4.editor.viewMode || "profile",
  };
  v4.spineProfile = normalizeSpineBlock(doc.spineProfile, "spp");
  v4.spineOrbit = normalizeSpineBlock(doc.spineOrbit, "spo");
  const emb = {};
  // Prefer spines from the *input* doc — normalizeV3 historically rebuilt
  // embedded bodies without spine fields, which reset shortened child spines
  // to the default full-length (-1…1) centerline on every save/migrate.
  const origEmb = doc.embeddedAssets || {};
  for (const [guid, body] of Object.entries(v4.embeddedAssets || {})) {
    const src =
      origEmb[guid] ||
      origEmb[body.assetGuid] ||
      Object.values(origEmb).find((b) => b?.assetGuid === body.assetGuid) ||
      body;
    const sp = normalizeSpineBlock(
      { knots: src.spineProfileKnots, segments: src.spineProfileSegments },
      "spp",
    );
    const so = normalizeSpineBlock(
      { knots: src.spineOrbitKnots, segments: src.spineOrbitSegments },
      "spo",
    );
    const pnSrc = src.placementNormal || body.placementNormal;
    emb[guid] = {
      ...body,
      spineProfileKnots: sp.knots,
      spineProfileSegments: sp.segments,
      spineOrbitKnots: so.knots,
      spineOrbitSegments: so.segments,
      placementNormal: pnSrc
        ? {
            start: {
              x: Number(pnSrc.start?.x) || 0,
              y: Number(pnSrc.start?.y) || 0,
            },
            end: {
              x: Number(pnSrc.end?.x) || 0,
              y: Number(pnSrc.end?.y) || 0,
            },
          }
        : body.placementNormal,
    };
  }
  v4.embeddedAssets = emb;
  return v4;
}

function normalizeV6(doc) {
  const v5 = normalizeV5(doc);
  v5.schemaVersion = 6;
  const src = doc.placementNormal || v5.placementNormal;
  const sx = Number(src?.start?.x);
  const sy = Number(src?.start?.y);
  const ex = Number(src?.end?.x);
  const ey = Number(src?.end?.y);
  const start = {
    x: Number.isFinite(sx) ? sx : 0,
    y: Number.isFinite(sy) ? sy : -1,
  };
  const end = {
    x: Number.isFinite(ex) ? ex : 0,
    y: Number.isFinite(ey) ? ey : 1,
  };
  if (Math.hypot(end.x - start.x, end.y - start.y) < 1e-9) {
    end.x = start.x;
    end.y = start.y + 2;
  }
  v5.placementNormal = { start, end };
  return v5;
}

function normalizeV7(doc) {
  const v6 = normalizeV6(doc);
  v6.schemaVersion = 7;
  const mode =
    doc.editor?.tessellationMode === "torus" || v6.editor?.tessellationMode === "torus"
      ? "torus"
      : "rotation";
  v6.editor = { ...v6.editor, tessellationMode: mode };
  const emb = {};
  for (const [guid, body] of Object.entries(v6.embeddedAssets || {})) {
    emb[guid] = {
      ...body,
      tessellationMode: body.tessellationMode === "torus" ? "torus" : "rotation",
    };
  }
  v6.embeddedAssets = emb;
  return v6;
}

function normalizeChildTransformV8(t) {
  return {
    x: Number(t?.x ?? 0.45),
    y: Number(t?.y ?? 0.35),
    z: Number(t?.z ?? 0),
    nx: Number.isFinite(Number(t?.nx)) ? Number(t.nx) : 0,
    ny: Number.isFinite(Number(t?.ny)) ? Number(t.ny) : 1,
    nz: Number.isFinite(Number(t?.nz)) ? Number(t.nz) : 0,
    surface: !!t?.surface,
    rotationYDeg: Number(t?.rotationYDeg ?? 0),
    scale: Number(t?.scale ?? 0.28),
    useSymmetry: !!t?.useSymmetry,
    snapCenterline: !!t?.snapCenterline,
  };
}

function normalizeV8(doc) {
  const v7 = normalizeV7(doc);
  v7.schemaVersion = 8;
  // normalizeV7→V3 historically rebuilt child transforms without surface fields.
  // Prefer the input document's transforms (by instanceGuid) so save/load keeps
  // surface placement (x,y,z + normal) instead of resetting to profile-plane defaults.
  const origXf = new Map(
    (doc.children || [])
      .filter((ch) => ch?.instanceGuid)
      .map((ch) => [ch.instanceGuid, ch.transform || {}]),
  );
  v7.children = (v7.children || []).map((ch) => ({
    ...ch,
    transform: normalizeChildTransformV8({
      ...ch.transform,
      ...(origXf.get(ch.instanceGuid) || {}),
    }),
  }));
  return v7;
}

function normalizeV9(doc) {
  const v8 = normalizeV8(doc);
  v8.schemaVersion = 9;
  const src = doc.textureAssets || v8.textureAssets || {};
  const textureAssets = {};
  for (const [guid, raw] of Object.entries(src)) {
    const tex = normalizeEyeTexture({
      ...raw,
      assetGuid: raw?.assetGuid || guid,
      kind: raw?.kind || "eye",
    });
    textureAssets[tex.assetGuid] = tex;
  }
  v8.textureAssets = textureAssets;
  return v8;
}

function normalizeV10(doc) {
  const v9 = normalizeV9(doc);
  v9.schemaVersion = 10;
  const hasMesh = Array.isArray(v9.profile?.knots) && v9.profile.knots.length >= 2;
  const texN = Object.keys(v9.textureAssets || {}).length;
  let kind =
    doc.projectKind === "texture" || doc.projectKind === "mesh" ? doc.projectKind : null;
  if (!kind) kind = !hasMesh && texN > 0 ? "texture" : "mesh";
  v9.projectKind = normalizeProjectKind(kind);
  const om = v9.objectMaterial || {};
  v9.objectMaterial = {
    color: om.color ?? null,
    roughness: Number(om.roughness ?? 0.4),
    metalness: Number(om.metalness ?? 0),
    opacity: Number(om.opacity ?? 1),
    texture: om.texture || "gradient",
    textureAsset: om.textureAsset || null,
    textureAssign: om.textureAssign === "eyePair" ? "eyePair" : om.textureAssign || null,
  };
  return v9;
}

/** @type {Record<number, (doc: any) => any>} */
const STEPS = {
  1(doc) {
    return normalizeV1(doc);
  },
  2(doc) {
    return normalizeV2(doc);
  },
  3(doc) {
    return normalizeV3(doc);
  },
  // 3 → 4: per-segment pathType (bezier|line|arc) + optional arcBulge
  4(doc) {
    return normalizeV4(doc);
  },
  // 4 → 5: spineProfile + spineOrbit centerline paths
  5(doc) {
    return normalizeV5(doc);
  },
  // 5 → 6: placementNormal (object “up” segment for preview / assembly)
  6(doc) {
    return normalizeV6(doc);
  },
  // 6 → 7: tessellationMode rotation | torus
  7(doc) {
    return normalizeV7(doc);
  },
  // 7 → 8: child surface placement (z + normal + surface flag)
  8(doc) {
    return normalizeV8(doc);
  },
  // 8 → 9: textureAssets (params-only procedural textures, eye editor first)
  9(doc) {
    return normalizeV9(doc);
  },
  // 9 → 10: projectKind mesh|texture + objectMaterial.textureAsset assign
  10(doc) {
    return normalizeV10(doc);
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
