// ============================================================================
// latheTessellate.js — profile×orbit lathe for one body (root or embedded asset).
// ============================================================================

import { SplineLathe, SplineKnot } from "../../../tessellate/spline_lathe.mjs";

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

function toRangerKnots(list) {
  return list.map((k) => SplineKnot.of(k.x, k.y, k.hx, k.hy));
}

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

function resolvePartStyle(body, segIndex, which) {
  const closed = which === "orbit";
  const knots = closed ? body.orbitKnots : body.knots;
  const segments = closed ? body.orbitSegments : body.segments;
  const a = knots[segIndex];
  const b = knots[closed ? (segIndex + 1) % knots.length : segIndex + 1];
  const seg = segments[segIndex] || defaultSegment(a?.id, b?.id);
  const colorA = a?.color || "#cccccc";
  const colorB = b?.color || "#cccccc";
  const solidHex = seg.color ? hexToInt(seg.color) : null;

  let map = null;
  let colorHex = 0xffffff;
  if (seg.texture === "upload" && seg.textureData) {
    map = seg.textureData;
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
  }
  return { colorHex, map, colorA, colorB, seg };
}

function midColorInt(body, segIndex, which) {
  const closed = which === "orbit";
  const knots = closed ? body.orbitKnots : body.knots;
  const segments = closed ? body.orbitSegments : body.segments;
  const a = knots[segIndex];
  const b = knots[closed ? (segIndex + 1) % knots.length : segIndex + 1];
  const seg = segments[segIndex];
  if (seg?.color) return hexToInt(seg.color);
  return mixHex(a?.color || "#cccccc", b?.color || "#cccccc", 0.5);
}

function resolveCombinedStyle(body, pi, oi) {
  const p = resolvePartStyle(body, pi, "profile");
  const o = resolvePartStyle(body, oi, "orbit");
  const pSeg = body.segments[pi];
  const oSeg = body.orbitSegments[oi];
  const map = p.map || o.map;
  let colorHex;
  if (map) {
    colorHex = p.map ? midColorInt(body, oi, "orbit") : midColorInt(body, pi, "profile");
    if (colorHex === 0xffffff) colorHex = mulColorHex(p.colorHex, o.colorHex);
  } else {
    colorHex = mulColorHex(midColorInt(body, pi, "profile"), midColorInt(body, oi, "orbit"));
  }
  // Object-level material tint (bulk default)
  const om = body.objectMaterial;
  if (om?.color) {
    colorHex = mulColorHex(colorHex === 0xffffff ? 0xffffff : colorHex, hexToInt(om.color));
    if (colorHex === 0xffffff) colorHex = hexToInt(om.color);
  }
  const rough =
    ((pSeg?.roughness ?? om?.roughness ?? 0.4) + (oSeg?.roughness ?? om?.roughness ?? 0.4)) / 2;
  const metal = Math.max(pSeg?.metalness ?? 0, oSeg?.metalness ?? 0, om?.metalness ?? 0);
  const opacity =
    (pSeg?.opacity ?? 1) * (oSeg?.opacity ?? 1) * (om?.opacity ?? 1);
  return {
    colorHex,
    shininess: roughnessToShininess(rough),
    reflectivity: Math.min(0.95, metal),
    opacity,
    map,
  };
}

/**
 * Tessellate one spline body into mesh parts.
 * @param {{
 *   knots: any[], segments: any[],
 *   orbitKnots: any[], orbitSegments: any[],
 *   curveType?: number, pathSegments?: number, angularSteps?: number, revolutionDeg?: number,
 *   objectMaterial?: object
 * }} body
 */
export function tessellateBody(body) {
  const curveType = body.curveType | 0;
  const pathSegments = body.pathSegments || 12;
  const angularSteps = body.angularSteps || 24;
  const revolutionDeg = body.revolutionDeg || 360;
  const closed = revolutionDeg >= 359.9;
  const nOrb = body.orbitKnots.length;
  const perSpan = Math.max(3, Math.round(angularSteps / Math.max(1, nOrb)));
  const sampled = SplineLathe.sampleClosedOrbit(
    toRangerKnots(body.orbitKnots),
    curveType,
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

  for (let pi = 0; pi < body.knots.length - 1; pi++) {
    const pair = [body.knots[pi], body.knots[pi + 1]];
    const mesh = SplineLathe.sampleAndLatheOrbit(
      toRangerKnots(pair),
      curveType,
      pathSegments,
      ox,
      oy,
      0,
      steps,
      closed,
    );
    const pieces = splitMeshByOrbitSegments(mesh, steps, oSeg, nOrb, closed);
    for (const piece of pieces) {
      const style = resolveCombinedStyle(body, pi, piece.orbitSeg);
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

  return { parts, verts: totalV, tris: totalT, orbitCols: steps };
}
