import { reactive, computed, watch } from "vue";
import { SplineLathe, SplineKnot } from "@tessellate";

/** @typedef {{ id: string, x: number, y: number, hx: number, hy: number, color: string }} Knot */
/** @typedef {{ fromId: string, toId: string, color: string|null, roughness: number, metalness: number, opacity: number, texture: string, textureData: { rgba: Uint8Array, w: number, h: number, name: string }|null }} Segment */

function uid() {
  return "k" + Math.random().toString(36).slice(2, 9);
}

const DEFAULT_COLORS = ["#7ecf6a", "#6ec8ff", "#ffb454", "#e87ac8", "#c8e87a", "#ff7a6a"];

function defaultKnots() {
  const raw = SplineLathe.defaultKnots();
  return raw.map((k, i) => ({
    id: uid(),
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));
}

function defaultSegment(fromId, toId) {
  return {
    fromId,
    toId,
    color: null,
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "gradient",
    textureData: null,
  };
}

function hexToRgb(hex) {
  const h = String(hex || "#ffffff").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padStart(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(lerp(A.r, B.r, t));
  const g = Math.round(lerp(A.g, B.g, t));
  const b_ = Math.round(lerp(A.b, B.b, t));
  return (r << 16) | (g << 8) | b_;
}

function hexToInt(hex) {
  const c = hexToRgb(hex);
  return (c.r << 16) | (c.g << 8) | c.b;
}

function roughnessToShininess(r) {
  const t = Math.min(1, Math.max(0, r));
  return lerp(280, 6, t);
}

function makeGradientRgba(hexA, hexB, w = 4, h = 64) {
  const A = hexToRgb(hexA);
  const B = hexToRgb(hexB);
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = y / Math.max(1, h - 1);
    const r = Math.round(lerp(A.r, B.r, t));
    const g = Math.round(lerp(A.g, B.g, t));
    const b = Math.round(lerp(A.b, B.b, t));
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }
  return { rgba, w, h };
}

function makeCheckerRgba(size = 64) {
  const rgba = new Uint8Array(size * size * 4);
  const cell = size / 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const odd = (((x / cell) | 0) + ((y / cell) | 0)) & 1;
      const i = (y * size + x) * 4;
      rgba[i] = odd ? 90 : 220;
      rgba[i + 1] = odd ? 120 : 220;
      rgba[i + 2] = odd ? 160 : 210;
      rgba[i + 3] = 255;
    }
  }
  return { rgba, w: size, h: size };
}

function makeStripesRgba(size = 64) {
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const odd = ((y / 6) | 0) & 1;
      const i = (y * size + x) * 4;
      rgba[i] = odd ? 40 : 230;
      rgba[i + 1] = odd ? 160 : 210;
      rgba[i + 2] = odd ? 120 : 90;
      rgba[i + 3] = 255;
    }
  }
  return { rgba, w: size, h: size };
}

export function useSplineEditor() {
  const state = reactive({
    knots: defaultKnots(),
    segments: /** @type {Segment[]} */ ([]),
    selectedId: null,
    selectedSegmentIndex: -1,
    toolMode: "edit", // edit | add | color
    curveType: 0,
    pathSegments: 12,
    angularSteps: 24,
    revolutionDeg: 360,
    materialMode: 3,
    symmetry: true,
    viewport: { min: -1.1, max: 1.1 },
    mesh: null,
    stats: { verts: 0, tris: 0, profile: 0, parts: 0 },
    status: "Edit mode — drag points. Switch to Add to insert on the curve.",
  });

  function syncSegments() {
    const byPair = new Map();
    for (const s of state.segments) {
      byPair.set(s.fromId + ">" + s.toId, s);
    }
    const next = [];
    for (let i = 0; i < state.knots.length - 1; i++) {
      const fromId = state.knots[i].id;
      const toId = state.knots[i + 1].id;
      const key = fromId + ">" + toId;
      const exact = byPair.get(key);
      if (exact) {
        next.push({ ...exact, fromId, toId });
      } else {
        next.push(defaultSegment(fromId, toId));
      }
    }
    state.segments = next;
    if (state.selectedSegmentIndex >= next.length) state.selectedSegmentIndex = next.length - 1;
  }

  syncSegments();

  const selected = computed(() => state.knots.find((k) => k.id === state.selectedId) || null);
  const selectedSegment = computed(() =>
    state.selectedSegmentIndex >= 0 ? state.segments[state.selectedSegmentIndex] || null : null,
  );

  function setToolMode(mode) {
    state.toolMode = mode;
    if (mode === "edit") state.status = "Edit mode — drag knots and Bezier handles.";
    if (mode === "add") state.status = "Add mode — click the curve to insert a knot.";
    if (mode === "color") state.status = "Coloring — pick a knot or segment in the canvas / list.";
  }

  function select(id) {
    state.selectedId = id;
    state.selectedSegmentIndex = -1;
  }

  function selectSegment(index) {
    state.selectedSegmentIndex = index;
    state.selectedId = null;
  }

  function resetDefaults() {
    state.knots = defaultKnots();
    state.segments = [];
    syncSegments();
    state.selectedId = state.knots[1]?.id || null;
    state.selectedSegmentIndex = -1;
    state.mesh = null;
    state.status = "Reset to default silhouette.";
  }

  function removeKnot(id) {
    if (state.knots.length <= 2) return;
    const idx = state.knots.findIndex((k) => k.id === id);
    if (idx < 0) return;
    state.knots.splice(idx, 1);
    syncSegments();
    state.selectedId = state.knots[Math.min(idx, state.knots.length - 1)]?.id || null;
    state.selectedSegmentIndex = -1;
  }

  function removeSelected() {
    if (state.selectedId) removeKnot(state.selectedId);
  }

  function updateKnot(id, patch) {
    const k = state.knots.find((n) => n.id === id);
    if (!k) return;
    Object.assign(k, patch);
    if (typeof patch.x === "number") k.x = Math.max(0, patch.x);
  }

  function updateSegment(index, patch) {
    const s = state.segments[index];
    if (!s) return;
    Object.assign(s, patch);
  }

  function toRangerKnots(list = state.knots) {
    return list.map((k) => SplineKnot.of(k.x, k.y, k.hx, k.hy));
  }

  function evalSpan(a, b, t, curveType) {
    if (curveType === 0) {
      return {
        p: SplineLathe.bezierPoint(a.x, a.y, a.x + a.hx, a.y + a.hy, b.x - b.hx, b.y - b.hy, b.x, b.y, t),
        tan: SplineLathe.bezierTangent(a.x, a.y, a.x + a.hx, a.y + a.hy, b.x - b.hx, b.y - b.hy, b.x, b.y, t),
      };
    }
    // catmull uses neighbours; approximate with span endpoints as p1/p2 and duplicates
    return {
      p: SplineLathe.catmullPoint(a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, t),
      tan: SplineLathe.catmullTangent(a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, t),
    };
  }

  function sampleCurvePoints(samplesPerSpan = 24) {
    const pts = [];
    for (let i = 0; i < state.knots.length - 1; i++) {
      const a = state.knots[i];
      const b = state.knots[i + 1];
      const last = i < state.knots.length - 2 ? samplesPerSpan - 1 : samplesPerSpan;
      for (let s = 0; s <= last; s++) {
        const t = s / samplesPerSpan;
        const { p } = evalSpan(a, b, t, state.curveType);
        pts.push({ x: Math.max(0, p.x), y: p.y, segmentIndex: i, t });
      }
    }
    return pts;
  }

  function findClosestOnCurve(wx, wy, maxDist = 0.12) {
    const pts = sampleCurvePoints(40);
    let best = null;
    let bestD = maxDist;
    for (const p of pts) {
      const d = Math.hypot(p.x - wx, p.y - wy);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function insertKnotOnCurve(wx, wy) {
    const hit = findClosestOnCurve(wx, wy);
    if (!hit) {
      state.status = "Click closer to the curve to add a point.";
      return null;
    }
    const segIndex = hit.segmentIndex;
    const a = state.knots[segIndex];
    const b = state.knots[segIndex + 1];
    const oldSeg = state.segments[segIndex]
      ? { ...state.segments[segIndex] }
      : defaultSegment(a.id, b.id);
    const { p, tan } = evalSpan(a, b, hit.t, state.curveType);
    const tl = Math.hypot(tan.x, tan.y) || 1;
    const scale = 0.14;
    const k = {
      id: uid(),
      x: Math.max(0, p.x),
      y: p.y,
      hx: (tan.x / tl) * scale,
      hy: (tan.y / tl) * scale,
      color: DEFAULT_COLORS[state.knots.length % DEFAULT_COLORS.length],
    };
    // Insert knot, then rebuild segments with the split styles in the correct slots.
    state.knots.splice(segIndex + 1, 0, k);
    const next = [];
    for (let i = 0; i < state.knots.length - 1; i++) {
      const fromId = state.knots[i].id;
      const toId = state.knots[i + 1].id;
      if (i === segIndex || i === segIndex + 1) {
        next.push({
          ...oldSeg,
          fromId,
          toId,
          textureData: oldSeg.textureData,
        });
      } else if (i < segIndex) {
        next.push({ ...state.segments[i], fromId, toId });
      } else {
        // i >= segIndex + 2 → old segment index was i - 1
        next.push({ ...state.segments[i - 1], fromId, toId });
      }
    }
    state.segments = next;
    state.selectedId = k.id;
    state.selectedSegmentIndex = -1;
    state.status = `Added knot at y=${k.y.toFixed(2)} (between #${segIndex + 1} and #${segIndex + 2}).`;
    return k;
  }

  function resolvePartStyle(segIndex) {
    const a = state.knots[segIndex];
    const b = state.knots[segIndex + 1];
    const seg = state.segments[segIndex];
    const colorA = a.color || "#cccccc";
    const colorB = b.color || "#cccccc";
    const solidHex = seg.color ? hexToInt(seg.color) : null;
    const shininess = roughnessToShininess(seg.roughness ?? 0.4);
    const reflectivity = Math.min(0.95, Math.max(0, seg.metalness ?? 0));
    const opacity = seg.opacity ?? 1;

    let map = null;
    let colorHex = 0xffffff;
    if (seg.texture === "upload" && seg.textureData) {
      map = seg.textureData;
      colorHex = 0xffffff;
    } else if (seg.texture === "checker") {
      map = makeCheckerRgba(64);
      colorHex = solidHex != null ? solidHex : mixHex(colorA, colorB, 0.5);
    } else if (seg.texture === "stripes") {
      map = makeStripesRgba(64);
      colorHex = solidHex != null ? solidHex : mixHex(colorA, colorB, 0.5);
    } else if (seg.texture === "none" && solidHex != null) {
      colorHex = solidHex;
    } else {
      // linear gradient along the segment (knot A → knot B), or solid override tinted gradient
      const from = solidHex != null ? seg.color : colorA;
      const to = solidHex != null ? seg.color : colorB;
      map = makeGradientRgba(from, to, 4, 64);
      colorHex = 0xffffff;
    }

    return { colorHex, shininess, reflectivity, opacity, map };
  }

  function tessellate() {
    const phi = (state.revolutionDeg * Math.PI) / 180;
    const closed = state.revolutionDeg >= 359.9;
    const parts = [];
    let totalV = 0;
    let totalT = 0;

    for (let i = 0; i < state.knots.length - 1; i++) {
      const pair = [state.knots[i], state.knots[i + 1]];
      const mesh = SplineLathe.sampleAndLatheEx(
        toRangerKnots(pair),
        state.curveType,
        state.pathSegments,
        state.angularSteps,
        phi,
        closed,
      );
      const style = resolvePartStyle(i);
      parts.push({
        positions: mesh.positions.slice(),
        normals: mesh.normals.slice(),
        uvs: mesh.uvs.slice(),
        indices: mesh.indices.slice(),
        ...style,
        mapRgba: style.map ? Array.from(style.map.rgba) : null,
        mapW: style.map ? style.map.w : 0,
        mapH: style.map ? style.map.h : 0,
      });
      totalV += (mesh.positions.length / 3) | 0;
      totalT += (mesh.indices.length / 3) | 0;
    }

    state.mesh = { parts };
    state.stats = {
      verts: totalV,
      tris: totalT,
      profile: state.knots.length,
      parts: parts.length,
    };
    state.status = `Tessellated ${parts.length} parts · ${totalV} verts / ${totalT} tris.`;
    return state.mesh;
  }

  if (!state.selectedId && state.knots.length) {
    state.selectedId = state.knots[1].id;
  }

  watch(
    () => state.knots.length,
    () => syncSegments(),
  );

  return {
    state,
    selected,
    selectedSegment,
    setToolMode,
    select,
    selectSegment,
    resetDefaults,
    removeKnot,
    removeSelected,
    updateKnot,
    updateSegment,
    sampleCurvePoints,
    findClosestOnCurve,
    insertKnotOnCurve,
    tessellate,
    syncSegments,
  };
}
