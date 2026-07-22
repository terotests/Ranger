// ============================================================================
// assignRegion.js — screen-space square for eye UV placement on the 3D preview.
// ============================================================================

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
 * Map normalized overlay coords → canvas pixel coords used by raycast.
 * @param {number} nx
 * @param {number} ny
 * @param {{ width: number, height: number }} canvas
 */
export function regionToCanvas(nx, ny, canvas) {
  const w = canvas?.width || 1;
  const h = canvas?.height || 1;
  return { sx: nx * w, sy: ny * h };
}
