import { reactive, computed, watch } from "vue";
import { SplineLathe, SplineKnot } from "@tessellate";

/** @typedef {{ id: string, x: number, y: number, hx: number, hy: number, color: string }} Knot */
/** @typedef {{ fromId: string, toId: string, color: string|null, roughness: number, metalness: number, opacity: number, texture: string, textureData: { rgba: Uint8Array, w: number, h: number, name: string }|null, textureAsset?: string|null }} Segment */

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

function defaultOrbitKnots() {
  const raw = SplineLathe.defaultOrbitKnots();
  return raw.map((k, i) => ({
    id: uid(),
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: DEFAULT_COLORS[(i + 2) % DEFAULT_COLORS.length],
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
    textureAsset: null,
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

function mulColorHex(a, b) {
  if (a === 0xffffff) return b;
  if (b === 0xffffff) return a;
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (((ar * br) / 255) | 0) << 16 | (((ag * bg) / 255) | 0) << 8 | (((ab * bb) / 255) | 0);
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

function cloneSeg(s, fromId, toId) {
  return {
    ...s,
    fromId,
    toId,
    textureData: s.textureData || null,
  };
}

/**
 * Split a full-orbit lathe band into per-orbit-segment parts (own vertex buffers).
 */
function splitMeshByOrbitSegments(mesh, steps, oSeg, numOrbitSegs, closed) {
  const vertCount = (mesh.positions.length / 3) | 0;
  if (steps < 2 || vertCount < steps * 2) return [];
  const rows = (vertCount / steps) | 0;
  const out = [];

  for (let oi = 0; oi < numOrbitSegs; oi++) {
    const faces = [];
    for (let r = 0; r < rows - 1; r++) {
      const colMax = closed ? steps : steps - 1;
      for (let c = 0; c < colMax; c++) {
        if ((oSeg[c] | 0) !== oi) continue;
        const cNext = c + 1 >= steps ? 0 : c + 1;
        const a = r * steps + c;
        const b = r * steps + cNext;
        const cc = (r + 1) * steps + cNext;
        const d = (r + 1) * steps + c;
        faces.push(a, d, b, b, d, cc);
      }
    }
    if (!faces.length) continue;

    const used = new Map();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const mapV = (g) => {
      let local = used.get(g);
      if (local != null) return local;
      local = used.size;
      used.set(g, local);
      const i3 = g * 3;
      const i2 = g * 2;
      positions.push(mesh.positions[i3], mesh.positions[i3 + 1], mesh.positions[i3 + 2]);
      normals.push(mesh.normals[i3], mesh.normals[i3 + 1], mesh.normals[i3 + 2]);
      uvs.push(mesh.uvs[i2], mesh.uvs[i2 + 1]);
      return local;
    };
    for (let i = 0; i < faces.length; i++) indices.push(mapV(faces[i]));
    out.push({ orbitSeg: oi, positions, normals, uvs, indices });
  }
  return out;
}

export function useSplineEditor() {
  const state = reactive({
    viewMode: "profile", // profile | orbit
    knots: defaultKnots(),
    segments: /** @type {Segment[]} */ ([]),
    orbitKnots: defaultOrbitKnots(),
    orbitSegments: /** @type {Segment[]} */ ([]),
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
    status: "Edit mode — drag points. Switch view to edit the orbit path.",
  });

  function isOrbit() {
    return state.viewMode === "orbit";
  }

  function activeKnots() {
    return isOrbit() ? state.orbitKnots : state.knots;
  }

  function activeSegments() {
    return isOrbit() ? state.orbitSegments : state.segments;
  }

  function syncOpenSegments() {
    const byPair = new Map();
    for (const s of state.segments) byPair.set(s.fromId + ">" + s.toId, s);
    const next = [];
    for (let i = 0; i < state.knots.length - 1; i++) {
      const fromId = state.knots[i].id;
      const toId = state.knots[i + 1].id;
      const exact = byPair.get(fromId + ">" + toId);
      next.push(exact ? cloneSeg(exact, fromId, toId) : defaultSegment(fromId, toId));
    }
    state.segments = next;
    if (!isOrbit() && state.selectedSegmentIndex >= next.length) {
      state.selectedSegmentIndex = next.length - 1;
    }
  }

  function syncOrbitSegments() {
    const byPair = new Map();
    for (const s of state.orbitSegments) byPair.set(s.fromId + ">" + s.toId, s);
    const next = [];
    const n = state.orbitKnots.length;
    for (let i = 0; i < n; i++) {
      const fromId = state.orbitKnots[i].id;
      const toId = state.orbitKnots[(i + 1) % n].id;
      const exact = byPair.get(fromId + ">" + toId);
      next.push(exact ? cloneSeg(exact, fromId, toId) : defaultSegment(fromId, toId));
    }
    state.orbitSegments = next;
    if (isOrbit() && state.selectedSegmentIndex >= next.length) {
      state.selectedSegmentIndex = next.length - 1;
    }
  }

  function syncSegments() {
    syncOpenSegments();
    syncOrbitSegments();
  }

  syncSegments();

  const selected = computed(() => activeKnots().find((k) => k.id === state.selectedId) || null);
  const selectedSegment = computed(() =>
    state.selectedSegmentIndex >= 0 ? activeSegments()[state.selectedSegmentIndex] || null : null,
  );

  function setViewMode(mode) {
    state.viewMode = mode === "orbit" ? "orbit" : "profile";
    state.selectedId = null;
    state.selectedSegmentIndex = -1;
    const knots = activeKnots();
    state.selectedId = knots[0]?.id || null;
    state.status =
      state.viewMode === "orbit"
        ? "Orbit view — closed Bezier path replaces cos/sin for the lathe."
        : "Profile view — right-half silhouette (x ≥ 0), lathed around Y.";
  }

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
    state.orbitKnots = defaultOrbitKnots();
    state.orbitSegments = [];
    syncSegments();
    state.viewMode = "profile";
    state.selectedId = state.knots[1]?.id || null;
    state.selectedSegmentIndex = -1;
    state.mesh = null;
    state.status = "Reset to default silhouette + unit-circle orbit.";
  }

  function removeKnot(id) {
    const knots = activeKnots();
    const min = isOrbit() ? 3 : 2;
    if (knots.length <= min) return;
    const idx = knots.findIndex((k) => k.id === id);
    if (idx < 0) return;
    knots.splice(idx, 1);
    syncSegments();
    state.selectedId = knots[Math.min(idx, knots.length - 1)]?.id || null;
    state.selectedSegmentIndex = -1;
  }

  function removeSelected() {
    if (state.selectedId) removeKnot(state.selectedId);
  }

  function updateKnot(id, patch) {
    const k = activeKnots().find((n) => n.id === id);
    if (!k) return;
    Object.assign(k, patch);
    if (!isOrbit() && typeof patch.x === "number") k.x = Math.max(0, patch.x);
  }

  function updateSegment(index, patch) {
    const s = activeSegments()[index];
    if (!s) return;
    Object.assign(s, patch);
  }

  function toRangerKnots(list) {
    return list.map((k) => SplineKnot.of(k.x, k.y, k.hx, k.hy));
  }

  function evalSpan(a, b, t, curveType) {
    if (curveType === 0) {
      return {
        p: SplineLathe.bezierPoint(a.x, a.y, a.x + a.hx, a.y + a.hy, b.x - b.hx, b.y - b.hy, b.x, b.y, t),
        tan: SplineLathe.bezierTangent(a.x, a.y, a.x + a.hx, a.y + a.hy, b.x - b.hx, b.y - b.hy, b.x, b.y, t),
      };
    }
    return {
      p: SplineLathe.catmullPoint(a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, t),
      tan: SplineLathe.catmullTangent(a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, t),
    };
  }

  function sampleCurvePoints(samplesPerSpan = 24) {
    const knots = activeKnots();
    const pts = [];
    if (isOrbit()) {
      const n = knots.length;
      for (let i = 0; i < n; i++) {
        const a = knots[i];
        const b = knots[(i + 1) % n];
        for (let s = 0; s < samplesPerSpan; s++) {
          const t = s / samplesPerSpan;
          const { p } = evalSpan(a, b, t, state.curveType);
          pts.push({ x: p.x, y: p.y, segmentIndex: i, t });
        }
      }
      if (pts.length) pts.push({ ...pts[0], t: 1 });
      return pts;
    }
    for (let i = 0; i < knots.length - 1; i++) {
      const a = knots[i];
      const b = knots[i + 1];
      const last = i < knots.length - 2 ? samplesPerSpan - 1 : samplesPerSpan;
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
    // Ignore the duplicate closing sample when measuring
    const limit = isOrbit() && pts.length > 1 ? pts.length - 1 : pts.length;
    let best = null;
    let bestD = maxDist;
    for (let i = 0; i < limit; i++) {
      const p = pts[i];
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
    const knots = activeKnots();
    const segIndex = hit.segmentIndex;
    const n = knots.length;
    const a = knots[segIndex];
    const b = isOrbit() ? knots[(segIndex + 1) % n] : knots[segIndex + 1];
    const segs = activeSegments();
    const oldSeg = segs[segIndex] ? { ...segs[segIndex] } : defaultSegment(a.id, b.id);
    const { p, tan } = evalSpan(a, b, hit.t, state.curveType);
    const tl = Math.hypot(tan.x, tan.y) || 1;
    const scale = 0.14;
    const k = {
      id: uid(),
      x: isOrbit() ? p.x : Math.max(0, p.x),
      y: p.y,
      hx: (tan.x / tl) * scale,
      hy: (tan.y / tl) * scale,
      color: DEFAULT_COLORS[knots.length % DEFAULT_COLORS.length],
    };

    if (isOrbit()) {
      const old = state.orbitSegments.slice();
      knots.splice(segIndex + 1, 0, k);
      const next = [];
      const nn = knots.length;
      for (let i = 0; i < nn; i++) {
        const fromId = knots[i].id;
        const toId = knots[(i + 1) % nn].id;
        if (i === segIndex || i === segIndex + 1) {
          next.push({ ...oldSeg, fromId, toId, textureData: oldSeg.textureData });
        } else {
          const oldIdx = i < segIndex ? i : i - 1;
          next.push(cloneSeg(old[oldIdx] || oldSeg, fromId, toId));
        }
      }
      state.orbitSegments = next;
    } else {
      knots.splice(segIndex + 1, 0, k);
      const next = [];
      for (let i = 0; i < knots.length - 1; i++) {
        const fromId = knots[i].id;
        const toId = knots[i + 1].id;
        if (i === segIndex || i === segIndex + 1) {
          next.push({ ...oldSeg, fromId, toId, textureData: oldSeg.textureData });
        } else if (i < segIndex) {
          next.push(cloneSeg(state.segments[i], fromId, toId));
        } else {
          next.push(cloneSeg(state.segments[i - 1], fromId, toId));
        }
      }
      state.segments = next;
    }

    state.selectedId = k.id;
    state.selectedSegmentIndex = -1;
    state.status = isOrbit()
      ? `Added orbit knot (segment ${segIndex + 1}).`
      : `Added knot at y=${k.y.toFixed(2)} (between #${segIndex + 1} and #${segIndex + 2}).`;
    return k;
  }

  function resolvePartStyle(segIndex, which) {
    const closed = which === "orbit";
    const knots = closed ? state.orbitKnots : state.knots;
    const segments = closed ? state.orbitSegments : state.segments;
    const a = knots[segIndex];
    const b = knots[closed ? (segIndex + 1) % knots.length : segIndex + 1];
    const seg = segments[segIndex] || defaultSegment(a?.id, b?.id);
    const colorA = a?.color || "#cccccc";
    const colorB = b?.color || "#cccccc";
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
      const from = solidHex != null ? seg.color : colorA;
      const to = solidHex != null ? seg.color : colorB;
      map = makeGradientRgba(from, to, 4, 64);
      colorHex = 0xffffff;
    }

    return { colorHex, shininess, reflectivity, opacity, map, midColor: mixHex(colorA, colorB, 0.5) };
  }

  function midColorInt(segIndex, which) {
    const closed = which === "orbit";
    const knots = closed ? state.orbitKnots : state.knots;
    const segments = closed ? state.orbitSegments : state.segments;
    const a = knots[segIndex];
    const b = knots[closed ? (segIndex + 1) % knots.length : segIndex + 1];
    const seg = segments[segIndex];
    if (seg?.color) return hexToInt(seg.color);
    return mixHex(a?.color || "#cccccc", b?.color || "#cccccc", 0.5);
  }

  function resolveCombinedStyle(pi, oi) {
    const p = resolvePartStyle(pi, "profile");
    const o = resolvePartStyle(oi, "orbit");
    const pSeg = state.segments[pi];
    const oSeg = state.orbitSegments[oi];
    const map = p.map || o.map;
    let colorHex;
    if (map) {
      // Texture from one dimension; tint with the other so both read in shading.
      colorHex = p.map ? midColorInt(oi, "orbit") : midColorInt(pi, "profile");
      if (colorHex === 0xffffff) colorHex = mulColorHex(p.colorHex, o.colorHex);
    } else {
      colorHex = mulColorHex(midColorInt(pi, "profile"), midColorInt(oi, "orbit"));
    }
    const rough = ((pSeg?.roughness ?? 0.4) + (oSeg?.roughness ?? 0.4)) / 2;
    return {
      colorHex,
      shininess: roughnessToShininess(rough),
      reflectivity: Math.min(0.95, Math.max(pSeg?.metalness ?? 0, oSeg?.metalness ?? 0)),
      opacity: (pSeg?.opacity ?? 1) * (oSeg?.opacity ?? 1),
      map,
    };
  }

  function tessellate() {
    const closed = state.revolutionDeg >= 359.9;
    const nOrb = state.orbitKnots.length;
    const perSpan = Math.max(3, Math.round(state.angularSteps / Math.max(1, nOrb)));
    const sampled = SplineLathe.sampleClosedOrbit(
      toRangerKnots(state.orbitKnots),
      state.curveType,
      perSpan,
    );
    let ox = sampled.orbitX.slice();
    let oy = sampled.orbitY.slice();
    let oSeg = sampled.profileX.map((x) => x | 0);

    if (!closed) {
      const half = Math.max(3, Math.floor(ox.length / 2) + 1);
      ox = ox.slice(0, half);
      oy = oy.slice(0, half);
      oSeg = oSeg.slice(0, half);
    }

    const steps = ox.length;
    const parts = [];
    let totalV = 0;
    let totalT = 0;

    for (let pi = 0; pi < state.knots.length - 1; pi++) {
      const pair = [state.knots[pi], state.knots[pi + 1]];
      const mesh = SplineLathe.sampleAndLatheOrbit(
        toRangerKnots(pair),
        state.curveType,
        state.pathSegments,
        ox,
        oy,
        0,
        steps,
        closed,
      );
      const pieces = splitMeshByOrbitSegments(mesh, steps, oSeg, nOrb, closed);
      for (const piece of pieces) {
        const style = resolveCombinedStyle(pi, piece.orbitSeg);
        parts.push({
          positions: piece.positions,
          normals: piece.normals,
          uvs: piece.uvs,
          indices: piece.indices,
          colorHex: style.colorHex,
          shininess: style.shininess,
          reflectivity: style.reflectivity,
          opacity: style.opacity,
          mapRgba: style.map ? Array.from(style.map.rgba) : null,
          mapW: style.map ? style.map.w : 0,
          mapH: style.map ? style.map.h : 0,
        });
        totalV += (piece.positions.length / 3) | 0;
        totalT += (piece.indices.length / 3) | 0;
      }
    }

    state.mesh = { parts };
    state.stats = {
      verts: totalV,
      tris: totalT,
      profile: state.knots.length,
      parts: parts.length,
    };
    state.status = `Tessellated ${parts.length} parts (profile × orbit) · ${totalV} verts / ${totalT} tris · ${steps} orbit cols.`;
    return state.mesh;
  }

  function applyProject(doc) {
    if (!doc?.profile?.knots) return false;
    const ed = doc.editor || {};
    state.curveType = ed.curveType | 0;
    state.pathSegments = ed.pathSegments || 12;
    state.angularSteps = ed.angularSteps || 24;
    state.revolutionDeg = ed.revolutionDeg || 360;
    state.materialMode = ed.materialMode ?? 3;
    state.symmetry = ed.symmetry !== false;
    state.viewMode = ed.viewMode === "orbit" ? "orbit" : "profile";
    state.knots = doc.profile.knots.map((k) => ({
      id: k.id,
      x: k.x,
      y: k.y,
      hx: k.hx,
      hy: k.hy,
      color: k.color || "#cccccc",
    }));
    state.segments = (doc.profile.segments || []).map((s) => ({
      fromId: s.fromId,
      toId: s.toId,
      color: s.color == null ? null : s.color,
      roughness: s.roughness ?? 0.4,
      metalness: s.metalness ?? 0,
      opacity: s.opacity ?? 1,
      texture: s.texture || "gradient",
      textureData: null,
      textureAsset: s.textureAsset || null,
    }));

    if (doc.orbit?.knots?.length >= 3) {
      state.orbitKnots = doc.orbit.knots.map((k) => ({
        id: k.id,
        x: k.x,
        y: k.y,
        hx: k.hx,
        hy: k.hy,
        color: k.color || "#cccccc",
      }));
      state.orbitSegments = (doc.orbit.segments || []).map((s) => ({
        fromId: s.fromId,
        toId: s.toId,
        color: s.color == null ? null : s.color,
        roughness: s.roughness ?? 0.4,
        metalness: s.metalness ?? 0,
        opacity: s.opacity ?? 1,
        texture: s.texture || "gradient",
        textureData: null,
        textureAsset: s.textureAsset || null,
      }));
    } else {
      state.orbitKnots = defaultOrbitKnots();
      state.orbitSegments = [];
    }

    syncSegments();
    const knots = activeKnots();
    state.selectedId = knots[0]?.id || null;
    state.selectedSegmentIndex = -1;
    state.status = `Loaded “${doc.name}” (schema v${doc.schemaVersion}).`;
    return true;
  }

  function snapshotState() {
    return {
      curveType: state.curveType,
      pathSegments: state.pathSegments,
      angularSteps: state.angularSteps,
      revolutionDeg: state.revolutionDeg,
      materialMode: state.materialMode,
      symmetry: state.symmetry,
      viewMode: state.viewMode,
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
      })),
    };
  }

  if (!state.selectedId && state.knots.length) {
    state.selectedId = state.knots[1].id;
  }

  watch(
    () => [state.knots.length, state.orbitKnots.length],
    () => syncSegments(),
  );

  return {
    state,
    selected,
    selectedSegment,
    setViewMode,
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
    applyProject,
    snapshotState,
  };
}
