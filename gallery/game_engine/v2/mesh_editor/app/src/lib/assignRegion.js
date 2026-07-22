// ============================================================================
// assignRegion.js — screen-space square for eye UV placement on the 3D preview.
// ============================================================================

import { eyeUvFromCorners, normalizeEyeUv, unwrapUvPairU } from "./texture/eyeTexture.js";

/** @typedef {{ cx: number, cy: number, half: number }} AssignRegion */

export const DEFAULT_ASSIGN_REGION = { cx: 0.5, cy: 0.42, half: 0.14 };

export function clampAssignRegion(r, minHalf = 0.04, maxHalf = 0.45) {
  const half = Math.min(maxHalf, Math.max(minHalf, Number(r?.half) || DEFAULT_ASSIGN_REGION.half));
  let cx = Number(r?.cx);
  let cy = Number(r?.cy);
  if (!Number.isFinite(cx)) cx = DEFAULT_ASSIGN_REGION.cx;
  if (!Number.isFinite(cy)) cy = DEFAULT_ASSIGN_REGION.cy;
  cx = Math.min(1 - half, Math.max(half, cx));
  cy = Math.min(1 - half, Math.max(half, cy));
  return { cx, cy, half };
}

/** Normalized corners (y grows downward). */
export function regionCorners(r) {
  const reg = clampAssignRegion(r);
  return {
    tl: { x: reg.cx - reg.half, y: reg.cy - reg.half },
    tr: { x: reg.cx + reg.half, y: reg.cy - reg.half },
    bl: { x: reg.cx - reg.half, y: reg.cy + reg.half },
    br: { x: reg.cx + reg.half, y: reg.cy + reg.half },
    center: { x: reg.cx, y: reg.cy },
  };
}

/**
 * Map normalized overlay coords → pick pixel coords.
 * @param {number} nx
 * @param {number} ny
 * @param {{ width: number, height: number }} size
 */
export function regionToCanvas(nx, ny, size) {
  const w = size?.width || 1;
  const h = size?.height || 1;
  return { sx: nx * w, sy: ny * h };
}

/** Dense sample points inside the square (normalized). */
export function regionSamplePoints(r, grid = 5) {
  const reg = clampAssignRegion(r);
  const c = regionCorners(reg);
  const n = Math.max(2, grid | 0);
  const pts = [];
  for (let iy = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++) {
      const x = c.tl.x + ((c.br.x - c.tl.x) * ix) / (n - 1);
      const y = c.tl.y + ((c.br.y - c.tl.y) * iy) / (n - 1);
      pts.push({ x, y });
    }
  }
  return pts;
}

/**
 * Build textureUv from one or more UV samples under the screen square.
 * Prefer AABB of samples; if only one sample, derive scale from region.half.
 *
 * @param {Array<[number, number]|{0:number,1:number}>} samples
 * @param {AssignRegion} region
 * @param {object} [opts]
 */
export function eyeUvFromRegionSamples(samples, region, opts = {}) {
  const list = (samples || [])
    .map((s) => {
      const u = Number(s?.[0]);
      const v = Number(s?.[1]);
      if (!Number.isFinite(u) || !Number.isFinite(v)) return null;
      return [u, v];
    })
    .filter(Boolean);
  if (!list.length) return null;

  const reg = clampAssignRegion(region);
  if (list.length === 1) {
    const scale = Math.min(
      2.5,
      Math.max(0.35, (reg.half / DEFAULT_ASSIGN_REGION.half) * (opts.baseScale || 1)),
    );
    const sep =
      opts.eyeSeparationU != null
        ? opts.eyeSeparationU
        : Math.min(0.16, Math.max(0.05, 0.12 * scale));
    return normalizeEyeUv({
      centerU: list[0][0],
      centerV: list[0][1],
      scale,
      eyeSeparationU: sep,
    });
  }

  // Unwrap U relative to the first sample so the AABB doesn't span the seam wrongly.
  const u0 = list[0][0];
  let uMin = Infinity;
  let uMax = -Infinity;
  let vMin = Infinity;
  let vMax = -Infinity;
  for (const [u, v] of list) {
    const [lo, hi] = unwrapUvPairU(u0, u);
    // unwrapUvPairU orders the pair; recover signed offset of u from u0
    let uu = ((u % 1) + 1) % 1;
    let base = ((u0 % 1) + 1) % 1;
    let d = uu - base;
    if (d > 0.5) uu -= 1;
    if (d < -0.5) uu += 1;
    uMin = Math.min(uMin, uu);
    uMax = Math.max(uMax, uu);
    vMin = Math.min(vMin, v);
    vMax = Math.max(vMax, v);
    void lo;
    void hi;
  }
  // eyeUvFromCorners expects two corners; pass unwrapped extents
  return eyeUvFromCorners(uMin, vMax, uMax, vMin, opts);
}
