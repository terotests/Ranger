// ============================================================================
// eyeTexture.js — eye texture params (not pixels) + canvas renderer + constraints.
// ============================================================================

import {
  makeEllipsePath,
  makeOpenArcPath,
  samplePath,
  constrainPathInside,
  knotUid,
  syncClosedSegments,
  syncOpenSegments,
} from "../pathModel.js";
import { newGuid } from "../assetClone.js";

export const EYE_LAYER_TYPES = ["eyeball", "iris", "pupil", "reflection", "eyelid"];

export const EYE_CLIP_PARENT = {
  eyeball: null,
  iris: "eyeball",
  pupil: "iris",
  reflection: "eyeball",
  eyelid: "eyeball",
};

/** Default draw order (bottom → top). Eyelid above iris/pupil/reflection. */
export const EYE_DEFAULT_ORDER = ["eyeball", "iris", "pupil", "reflection", "eyelid"];

function layerId() {
  return "tl_" + Math.random().toString(36).slice(2, 9);
}

export function createEyeLayer(type, overrides = {}) {
  const defaults = {
    // 4-knot circle like Mesh Orbit (κ ≈ 0.552) — not a squircle
    eyeball: () => ({
      name: "Eyeball",
      color: "#f2f0ea",
      closed: true,
      ...makeEllipsePath({ cx: 0, cy: 0, rx: 0.72, ry: 0.72, color: "#f2f0ea", n: 4 }),
    }),
    iris: () => ({
      name: "Iris",
      color: "#3a70d0",
      closed: true,
      ...makeEllipsePath({ cx: 0.06, cy: 0.02, rx: 0.28, ry: 0.28, color: "#3a70d0", n: 4 }),
    }),
    pupil: () => ({
      name: "Pupil",
      color: "#0a0a0c",
      closed: true,
      ...makeEllipsePath({ cx: 0.06, cy: 0.02, rx: 0.12, ry: 0.12, color: "#0a0a0c", n: 4 }),
    }),
    reflection: () => ({
      name: "Reflection",
      color: "#ffffff",
      closed: true,
      ...makeEllipsePath({ cx: -0.02, cy: 0.1, rx: 0.05, ry: 0.065, color: "#ffffff", n: 4 }),
    }),
    eyelid: () => ({
      name: "Eyelid",
      color: "#c4a484",
      closed: false,
      fillSide: "above", // above | below — region clipped to eyeball
      ...makeOpenArcPath({ y: 0.12, halfWidth: 0.7, bulge: 0.28, color: "#c4a484" }),
    }),
  };
  const base = (defaults[type] || defaults.eyeball)();
  return {
    id: layerId(),
    type,
    name: overrides.name || base.name,
    enabled: overrides.enabled !== false,
    color: overrides.color || base.color,
    closed: base.closed,
    fillSide: base.fillSide || null,
    knots: overrides.knots || base.knots,
    segments: overrides.segments || base.segments,
    clipTo: EYE_CLIP_PARENT[type] ?? null,
  };
}

export function createDefaultEyeTexture({ name = "Eye" } = {}) {
  const layers = EYE_DEFAULT_ORDER.map((t) => createEyeLayer(t));
  // Optional eyelid starts disabled — user can enable
  const lid = layers.find((l) => l.type === "eyelid");
  if (lid) lid.enabled = false;
  return {
    assetGuid: newGuid(),
    name,
    kind: "eye",
    width: 256,
    height: 256,
    /** Background at mesh assign time comes from vertex colors; preview uses this fallback. */
    backgroundFrom: "vertexColors",
    previewBackground: "#6a8f6a",
    layers,
  };
}

export function serializePathBlock(block) {
  return {
    knots: (block.knots || []).map((k) => ({
      id: k.id || knotUid(),
      x: Number(k.x) || 0,
      y: Number(k.y) || 0,
      hx: Number(k.hx) || 0,
      hy: Number(k.hy) || 0,
      color: k.color || "#cccccc",
    })),
    segments: (block.segments || []).map((s) => ({
      fromId: s.fromId,
      toId: s.toId,
      color: s.color == null ? null : s.color,
      pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
      arcBulge: s.arcBulge == null || s.arcBulge === "" ? null : Number(s.arcBulge),
      roughness: Number(s.roughness ?? 0.4),
      metalness: Number(s.metalness ?? 0),
      opacity: Number(s.opacity ?? 1),
      texture: s.texture || "none",
      textureAsset: s.textureAsset || null,
    })),
  };
}

export function serializeEyeTexture(tex) {
  return {
    assetGuid: tex.assetGuid,
    name: tex.name || "Eye",
    kind: "eye",
    width: Number(tex.width) || 256,
    height: Number(tex.height) || 256,
    backgroundFrom: tex.backgroundFrom === "solid" ? "solid" : "vertexColors",
    previewBackground: tex.previewBackground || "#6a8f6a",
    layers: (tex.layers || []).map((L) => ({
      id: L.id,
      type: EYE_LAYER_TYPES.includes(L.type) ? L.type : "eyeball",
      name: L.name || L.type,
      enabled: L.enabled !== false,
      color: L.color || "#ffffff",
      closed: L.closed !== false && L.type !== "eyelid",
      fillSide: L.fillSide === "below" ? "below" : L.type === "eyelid" ? "above" : null,
      clipTo: L.clipTo || EYE_CLIP_PARENT[L.type] || null,
      ...serializePathBlock(L),
    })),
  };
}

export function normalizeEyeTexture(raw) {
  if (!raw || typeof raw !== "object") return createDefaultEyeTexture();
  const base = createDefaultEyeTexture({ name: raw.name || "Eye" });
  const layersIn = Array.isArray(raw.layers) ? raw.layers : null;
  let layers;
  if (layersIn?.length) {
    layers = layersIn.map((L) => {
      const type = EYE_LAYER_TYPES.includes(L.type) ? L.type : "eyeball";
      const def = createEyeLayer(type);
      const path = serializePathBlock(L.knots ? L : def);
      return {
        ...def,
        id: L.id || def.id,
        type,
        name: L.name || def.name,
        enabled: L.enabled !== false,
        color: L.color || def.color,
        closed: type !== "eyelid",
        fillSide: type === "eyelid" ? (L.fillSide === "below" ? "below" : "above") : null,
        clipTo: L.clipTo || EYE_CLIP_PARENT[type],
        knots: path.knots,
        segments:
          type === "eyelid"
            ? syncOpenSegments(path.knots, path.segments, "bezier")
            : syncClosedSegments(path.knots, path.segments, "bezier"),
      };
    });
  } else {
    layers = base.layers;
  }
  return {
    assetGuid: raw.assetGuid || base.assetGuid,
    name: raw.name || base.name,
    kind: "eye",
    width: Number(raw.width) || 256,
    height: Number(raw.height) || 256,
    backgroundFrom: raw.backgroundFrom === "solid" ? "solid" : "vertexColors",
    previewBackground: raw.previewBackground || base.previewBackground,
    layers,
  };
}

export function findLayer(tex, typeOrId) {
  return (tex.layers || []).find((L) => L.id === typeOrId || L.type === typeOrId) || null;
}

export function layerPolygon(layer, samplesPerSpan = 20) {
  if (!layer?.knots?.length) return [];
  const pts = samplePath(layer.knots, layer.segments, {
    closed: layer.closed !== false && layer.type !== "eyelid",
    samplesPerSpan,
  });
  return pts.map((p) => ({ x: p.x, y: p.y }));
}

/** Apply nesting constraints after a layer edit. */
export function constrainEyeLayer(tex, layerId) {
  const layer = findLayer(tex, layerId);
  if (!layer || layer.type === "eyeball" || layer.type === "eyelid") return;
  const parentType = layer.clipTo || EYE_CLIP_PARENT[layer.type];
  let parent = parentType ? findLayer(tex, parentType) : null;
  // Pupil prefers iris; if iris missing/disabled, fall back to eyeball
  if (layer.type === "pupil" && (!parent || parent.enabled === false)) {
    parent = findLayer(tex, "eyeball");
  }
  // Reflection stays inside eyeball (and ideally near pupil — soft)
  if (!parent || !parent.enabled) parent = findLayer(tex, "eyeball");
  if (!parent) return;
  const poly = layerPolygon(parent);
  constrainPathInside(layer.knots, poly);
  if (layer.type === "pupil") {
    // Also keep pupil inside iris when both exist
    const iris = findLayer(tex, "iris");
    if (iris?.enabled !== false) constrainPathInside(layer.knots, layerPolygon(iris));
  }
}

export function constrainAllEyeLayers(tex) {
  for (const order of ["iris", "pupil", "reflection"]) {
    const L = findLayer(tex, order);
    if (L) constrainEyeLayer(tex, L.id);
  }
}

function worldToTex(x, y, w, h, pad = 0.08) {
  // Map authoring [-1,1]² (with pad) → texture pixels
  const min = -1 - pad;
  const max = 1 + pad;
  const sx = ((x - min) / (max - min)) * w;
  const sy = ((max - y) / (max - min)) * h;
  return [sx, sy];
}

function tracePath(ctx, pts, w, h, closed) {
  if (pts.length < 2) return;
  const [x0, y0] = worldToTex(pts[0].x, pts[0].y, w, h);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = worldToTex(pts[i].x, pts[i].y, w, h);
    ctx.lineTo(x, y);
  }
  if (closed) ctx.closePath();
}

/**
 * Render eye texture params into a 2D canvas context (dynamic — no bake).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} tex normalizeEyeTexture result
 * @param {{ background?: string }} [opts]
 */
export function renderEyeTexture(ctx, tex, opts = {}) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const bg =
    opts.background ||
    (tex.backgroundFrom === "solid" ? tex.previewBackground : tex.previewBackground) ||
    "#6a8f6a";
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const eyeball = findLayer(tex, "eyeball");
  const eyePoly = eyeball ? layerPolygon(eyeball) : [];

  const drawOrder = [...(tex.layers || [])];
  // Ensure eyelid after iris/pupil/reflection
  drawOrder.sort((a, b) => {
    const rank = (t) => {
      const i = EYE_DEFAULT_ORDER.indexOf(t);
      return i < 0 ? 50 : i;
    };
    return rank(a.type) - rank(b.type);
  });

  for (const layer of drawOrder) {
    if (layer.enabled === false) continue;
    const closed = layer.type !== "eyelid";
    const pts = samplePath(layer.knots, layer.segments, {
      closed,
      samplesPerSpan: 28,
    });
    if (pts.length < 2) continue;

    ctx.save();
    if (layer.type !== "eyeball" && eyePoly.length >= 3) {
      tracePath(ctx, eyePoly, w, h, true);
      ctx.clip();
    }

    if (layer.type === "eyelid") {
      // Fill region above/below curve, clipped to eyeball
      const side = layer.fillSide === "below" ? "below" : "above";
      const [x0, y0] = worldToTex(pts[0].x, pts[0].y, w, h);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = worldToTex(pts[i].x, pts[i].y, w, h);
        ctx.lineTo(x, y);
      }
      if (side === "above") {
        ctx.lineTo(w, worldToTex(pts[pts.length - 1].x, pts[pts.length - 1].y, w, h)[1]);
        ctx.lineTo(w, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, y0);
      } else {
        ctx.lineTo(w, worldToTex(pts[pts.length - 1].x, pts[pts.length - 1].y, w, h)[1]);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.lineTo(0, y0);
      }
      ctx.closePath();
      ctx.fillStyle = layer.color || "#c4a484";
      ctx.fill();
    } else {
      if (layer.type === "iris" || layer.type === "pupil") {
        const parentType = layer.clipTo;
        const parent = parentType ? findLayer(tex, parentType) : null;
        if (parent?.enabled !== false && parent) {
          const ppoly = layerPolygon(parent);
          if (ppoly.length >= 3) {
            tracePath(ctx, ppoly, w, h, true);
            ctx.clip();
          }
        }
      }
      tracePath(ctx, pts, w, h, true);
      ctx.fillStyle = layer.color || "#fff";
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Offscreen render → ImageData (for tests / future mesh assign). */
export function rasterizeEyeTexture(tex, width, height) {
  const w = width || tex.width || 256;
  const h = height || tex.height || 256;
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) {
    // Node smoke: return null; browser path uses canvas
    return null;
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  renderEyeTexture(ctx, tex);
  return ctx.getImageData(0, 0, w, h);
}
