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
  translatePath,
  pathCentroid,
} from "../pathModel.js";
import { newGuid } from "../assetClone.js";

/** Default radii for “Restore to circle” (and createEyeLayer closed parts). */
export const EYE_CIRCLE_RADII = {
  eyeball: { rx: 0.72, ry: 0.72, cx: 0, cy: 0 },
  iris: { rx: 0.28, ry: 0.28, cx: 0.06, cy: 0.02 },
  pupil: { rx: 0.15, ry: 0.15, cx: 0.06, cy: 0.02 },
  reflection: { rx: 0.05, ry: 0.065, cx: -0.02, cy: 0.1 },
};

/** Default left/right pair layout (preview + edit target). */
export const DEFAULT_EYE_PAIR = {
  /** Gap between eye centers in preview (0 = touching cells, 1 = wide). */
  distance: 0.35,
  /** When true, right eye is always a mirror of left (`layers`). */
  linked: true,
  /** Which side the editor targets: left | right | both (both ⇒ linked). */
  editSide: "both",
};

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
      ...makeEllipsePath({
        cx: EYE_CIRCLE_RADII.eyeball.cx,
        cy: EYE_CIRCLE_RADII.eyeball.cy,
        rx: EYE_CIRCLE_RADII.eyeball.rx,
        ry: EYE_CIRCLE_RADII.eyeball.ry,
        color: "#f2f0ea",
        n: 4,
      }),
    }),
    iris: () => ({
      name: "Iris",
      color: "#3a70d0",
      closed: true,
      ...makeEllipsePath({
        cx: EYE_CIRCLE_RADII.iris.cx,
        cy: EYE_CIRCLE_RADII.iris.cy,
        rx: EYE_CIRCLE_RADII.iris.rx,
        ry: EYE_CIRCLE_RADII.iris.ry,
        color: "#3a70d0",
        n: 4,
      }),
    }),
    pupil: () => ({
      name: "Pupil",
      color: "#0a0a0c",
      closed: true,
      ...makeEllipsePath({
        cx: EYE_CIRCLE_RADII.pupil.cx,
        cy: EYE_CIRCLE_RADII.pupil.cy,
        rx: EYE_CIRCLE_RADII.pupil.rx,
        ry: EYE_CIRCLE_RADII.pupil.ry,
        color: "#0a0a0c",
        n: 4,
      }),
    }),
    reflection: () => ({
      name: "Reflection",
      color: "#ffffff",
      closed: true,
      ...makeEllipsePath({ cx: -0.02, cy: 0.1, rx: 0.05, ry: 0.065, color: "#ffffff", n: 4 }),
    }),
    eyelid: () => ({
      name: "Eyelid",
      color: "#c4a484", // fill
      closed: false,
      fillSide: "above", // above | below — region clipped to eyeball
      border: false,
      borderWidth: 0.035, // authoring units → stroke in texture space
      borderColor: "#6e4f38",
      ...makeOpenArcPath({ y: 0.12, halfWidth: 0.7, bulge: 0.28, color: "#c4a484" }),
    }),
  };
  const base = (defaults[type] || defaults.eyeball)();
  const layer = {
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
  if (type === "eyelid") {
    layer.border = overrides.border != null ? !!overrides.border : !!base.border;
    layer.borderWidth =
      overrides.borderWidth != null ? Number(overrides.borderWidth) : Number(base.borderWidth) || 0.035;
    layer.borderColor = overrides.borderColor || base.borderColor || "#6e4f38";
  }
  return layer;
}

/** Clamp / normalize eyelid stroke fields (params only). */
export function normalizeEyelidBorder(L) {
  if (!L || L.type !== "eyelid") return L;
  L.border = !!L.border;
  const w = Number(L.borderWidth);
  L.borderWidth = Number.isFinite(w) ? Math.min(0.25, Math.max(0.005, w)) : 0.035;
  L.borderColor = typeof L.borderColor === "string" && L.borderColor ? L.borderColor : "#6e4f38";
  return L;
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
    /** Independent right-eye stack when eyePair.linked === false. */
    rightLayers: null,
    eyePair: { ...DEFAULT_EYE_PAIR },
  };
}

export function normalizeEyePair(raw) {
  const d = Number(raw?.distance);
  const side = raw?.editSide;
  return {
    distance: Number.isFinite(d) ? Math.min(1, Math.max(0, d)) : DEFAULT_EYE_PAIR.distance,
    linked: raw?.linked !== false,
    editSide: side === "left" || side === "right" || side === "both" ? side : "both",
  };
}

/** Deep-clone a layer stack (new knot object refs; keeps ids). */
export function cloneLayers(layers) {
  return (layers || []).map((L) => {
    const path = serializePathBlock(L);
    const row = {
      id: L.id,
      type: L.type,
      name: L.name,
      enabled: L.enabled !== false,
      color: L.color,
      closed: L.closed !== false && L.type !== "eyelid",
      fillSide: L.fillSide ?? null,
      clipTo: L.clipTo ?? EYE_CLIP_PARENT[L.type] ?? null,
      knots: path.knots,
      segments: path.segments,
    };
    if (L.type === "eyelid") {
      row.border = !!L.border;
      row.borderWidth = L.borderWidth;
      row.borderColor = L.borderColor;
      normalizeEyelidBorder(row);
    }
    return row;
  });
}

/** Mirror a layer stack about local X = 0 (left ↔ right eye). */
export function mirrorLayersX(layers) {
  return cloneLayers(layers).map((L) => {
    for (const k of L.knots) {
      k.x = -k.x;
      k.hx = -k.hx;
    }
    return L;
  });
}

/** Types that translate together when the root layer moves. */
export function companionLayerTypes(type) {
  if (type === "eyeball") return ["iris", "pupil", "reflection", "eyelid"];
  if (type === "iris") return ["pupil"];
  return [];
}

/**
 * Layer list currently shown/edited for this texture + eyePair settings.
 * Left/`both`/linked → `tex.layers`; unlinked right → `tex.rightLayers`.
 */
export function editableLayers(tex) {
  if (!tex) return [];
  const pair = normalizeEyePair(tex.eyePair);
  if (pair.editSide === "right" && !pair.linked && Array.isArray(tex.rightLayers)) {
    return tex.rightLayers;
  }
  return tex.layers || [];
}

/** Layers used to draw the right eye in the pair preview. */
export function rightEyeLayers(tex) {
  if (!tex) return [];
  const pair = normalizeEyePair(tex.eyePair);
  if (pair.linked || !Array.isArray(tex.rightLayers) || !tex.rightLayers.length) {
    return mirrorLayersX(tex.layers);
  }
  return tex.rightLayers;
}

/**
 * Translate a layer and nested companions (iris → pupil, eyeball → all).
 * @param {object[]} layers
 * @param {string} layerId
 * @param {number} dx
 * @param {number} dy
 */
export function translateLayerTree(layers, layerId, dx, dy) {
  if (!layers?.length || (!dx && !dy)) return;
  const root = findLayer(layers, layerId);
  if (!root) return;
  const types = new Set([root.type, ...companionLayerTypes(root.type)]);
  for (const L of layers) {
    if (types.has(L.type) && L.knots?.length) translatePath(L.knots, dx, dy);
  }
  const fake = { layers };
  for (const order of ["iris", "pupil", "reflection"]) {
    if (!types.has(order)) continue;
    const L = findLayer(layers, order);
    if (L) constrainEyeLayer(fake, L.id);
  }
}

/**
 * Rebuild a closed eye layer as a round/elliptical Bezier circle at its
 * current centroid (or type default center). Keeps color / id / type.
 */
export function restoreLayerToCircle(layer, { keepCenter = true } = {}) {
  if (!layer || layer.type === "eyelid" || layer.closed === false) return false;
  const def = EYE_CIRCLE_RADII[layer.type] || { rx: 0.2, ry: 0.2, cx: 0, cy: 0 };
  let cx = def.cx;
  let cy = def.cy;
  if (keepCenter && layer.knots?.length) {
    const c = pathCentroid(layer.knots);
    cx = c.x;
    cy = c.y;
  }
  const fresh = makeEllipsePath({
    cx,
    cy,
    rx: def.rx,
    ry: def.ry,
    color: layer.color || "#ffffff",
    n: 4,
  });
  layer.knots = fresh.knots;
  layer.segments = fresh.segments;
  layer.closed = true;
  return true;
}

/** Force right = mirror(left) and re-link. */
export function resetEyePairToMirror(tex, source = "left") {
  if (!tex) return;
  tex.eyePair = normalizeEyePair(tex.eyePair);
  if (source === "right" && Array.isArray(tex.rightLayers) && tex.rightLayers.length) {
    tex.layers = mirrorLayersX(tex.rightLayers);
  }
  tex.rightLayers = null;
  tex.eyePair.linked = true;
  if (tex.eyePair.editSide === "right") tex.eyePair.editSide = "both";
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

function serializeLayerRow(L) {
  const type = EYE_LAYER_TYPES.includes(L.type) ? L.type : "eyeball";
  const row = {
    id: L.id,
    type,
    name: L.name || L.type,
    enabled: L.enabled !== false,
    color: L.color || "#ffffff",
    closed: L.closed !== false && type !== "eyelid",
    fillSide: L.fillSide === "below" ? "below" : type === "eyelid" ? "above" : null,
    clipTo: L.clipTo || EYE_CLIP_PARENT[type] || null,
    ...serializePathBlock(L),
  };
  if (type === "eyelid") {
    const w = Number(L.borderWidth);
    row.border = !!L.border;
    row.borderWidth = Number.isFinite(w) ? Math.min(0.25, Math.max(0.005, w)) : 0.035;
    row.borderColor = L.borderColor || "#6e4f38";
  }
  return row;
}

function normalizeLayerRow(L) {
  const type = EYE_LAYER_TYPES.includes(L.type) ? L.type : "eyeball";
  const def = createEyeLayer(type);
  const path = serializePathBlock(L.knots ? L : def);
  const row = {
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
  if (type === "eyelid") {
    row.border = L.border != null ? !!L.border : !!def.border;
    const bw = Number(L.borderWidth);
    row.borderWidth = Number.isFinite(bw) ? bw : def.borderWidth;
    row.borderColor = L.borderColor || def.borderColor;
    normalizeEyelidBorder(row);
  }
  return row;
}

export function serializeEyeTexture(tex) {
  const pair = normalizeEyePair(tex.eyePair);
  const out = {
    assetGuid: tex.assetGuid,
    name: tex.name || "Eye",
    kind: "eye",
    width: Number(tex.width) || 256,
    height: Number(tex.height) || 256,
    backgroundFrom: tex.backgroundFrom === "solid" ? "solid" : "vertexColors",
    previewBackground: tex.previewBackground || "#6a8f6a",
    layers: (tex.layers || []).map(serializeLayerRow),
    eyePair: pair,
    rightLayers: null,
  };
  if (!pair.linked && Array.isArray(tex.rightLayers) && tex.rightLayers.length) {
    out.rightLayers = tex.rightLayers.map(serializeLayerRow);
  }
  return out;
}

export function normalizeEyeTexture(raw) {
  if (!raw || typeof raw !== "object") return createDefaultEyeTexture();
  const base = createDefaultEyeTexture({ name: raw.name || "Eye" });
  const layersIn = Array.isArray(raw.layers) ? raw.layers : null;
  const layers = layersIn?.length ? layersIn.map(normalizeLayerRow) : base.layers;
  const pair = normalizeEyePair(raw.eyePair);
  let rightLayers = null;
  if (!pair.linked && Array.isArray(raw.rightLayers) && raw.rightLayers.length) {
    rightLayers = raw.rightLayers.map(normalizeLayerRow);
  }
  if (pair.editSide === "both") pair.linked = true;
  return {
    assetGuid: raw.assetGuid || base.assetGuid,
    name: raw.name || base.name,
    kind: "eye",
    width: Number(raw.width) || 256,
    height: Number(raw.height) || 256,
    backgroundFrom: raw.backgroundFrom === "solid" ? "solid" : "vertexColors",
    previewBackground: raw.previewBackground || base.previewBackground,
    layers,
    rightLayers,
    eyePair: pair,
  };
}

export function findLayer(texOrLayers, typeOrId) {
  const layers = Array.isArray(texOrLayers) ? texOrLayers : texOrLayers?.layers || [];
  return layers.find((L) => L.id === typeOrId || L.type === typeOrId) || null;
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
 * Draw one eye's layers into a w×h pixel rect (no background clear).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object[]} layers
 * @param {number} w
 * @param {number} h
 */
export function drawEyeLayers(ctx, layers, w, h) {
  const eyeball = findLayer(layers, "eyeball");
  const eyePoly = eyeball ? layerPolygon(eyeball) : [];

  const drawOrder = [...(layers || [])];
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

      if (layer.border) {
        const pad = 0.08;
        const worldSpan = 2 + 2 * pad;
        const bw = Number(layer.borderWidth);
        const worldW = Number.isFinite(bw) ? Math.min(0.25, Math.max(0.005, bw)) : 0.035;
        const lineW = Math.max(1, (worldW / worldSpan) * w);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (let i = 1; i < pts.length; i++) {
          const [x, y] = worldToTex(pts[i].x, pts[i].y, w, h);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = layer.borderColor || "#6e4f38";
        ctx.lineWidth = lineW;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    } else {
      if (layer.type === "iris" || layer.type === "pupil") {
        const parentType = layer.clipTo;
        const parent = parentType ? findLayer(layers, parentType) : null;
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

/**
 * Render eye texture params into a 2D canvas context (dynamic — no bake).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} tex normalizeEyeTexture result
 * @param {{ background?: string, pair?: boolean, editSide?: string }} [opts]
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

  if (opts.pair) {
    renderEyePairPreview(ctx, tex, opts);
    return;
  }
  drawEyeLayers(ctx, tex.layers || [], w, h);
}

/**
 * Side-by-side left/right eyes. `eyePair.distance` grows the gap between cells.
 */
export function renderEyePairPreview(ctx, tex, opts = {}) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const pair = normalizeEyePair(tex.eyePair);
  const editSide = opts.editSide || pair.editSide;
  const gap = Math.round(8 + pair.distance * Math.min(w, h) * 0.45);
  const cell = Math.max(32, Math.min(h - 8, Math.floor((w - gap) / 2)));
  const total = cell * 2 + gap;
  const x0 = Math.floor((w - total) / 2);
  const y0 = Math.floor((h - cell) / 2);

  const left = tex.layers || [];
  const right = rightEyeLayers(tex);

  function blit(layers, x, active) {
    if (typeof document === "undefined") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y0, cell, cell);
      ctx.clip();
      ctx.translate(x, y0);
      const sx = cell / Math.max(cell, 1);
      ctx.scale(sx, sx);
      drawEyeLayers(ctx, layers, cell, cell);
      ctx.restore();
    } else {
      const off = document.createElement("canvas");
      off.width = cell;
      off.height = cell;
      const octx = off.getContext("2d");
      octx.fillStyle = ctx.fillStyle;
      // Transparent over already-filled bg — draw eye only
      drawEyeLayers(octx, layers, cell, cell);
      ctx.drawImage(off, x, y0);
    }
    if (active) {
      ctx.strokeStyle = "rgba(200,232,122,0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y0 + 1, cell - 2, cell - 2);
    }
  }

  const activeLeft = editSide === "left" || editSide === "both";
  const activeRight = editSide === "right" || editSide === "both";
  blit(left, x0, activeLeft);
  blit(right, x0 + cell + gap, activeRight);

  ctx.fillStyle = "rgba(200,220,200,0.55)";
  ctx.font = `${Math.max(10, Math.round(cell * 0.06))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("L", x0 + cell / 2, y0 + cell - 6);
  ctx.fillText("R", x0 + cell + gap + cell / 2, y0 + cell - 6);
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
