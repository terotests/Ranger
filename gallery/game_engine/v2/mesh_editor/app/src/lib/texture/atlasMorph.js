// ============================================================================
// atlasMorph.js — fast CPU lerp between two UV atlases (no vector re-raster).
// ============================================================================

/**
 * @typedef {{ rgba: Uint8Array|Uint8ClampedArray, w: number, h: number }} Atlas
 */

/**
 * @param {Atlas|null|undefined} map
 * @returns {Atlas|null}
 */
export function cloneAtlas(map) {
  if (!map?.rgba || !(map.w > 0) || !(map.h > 0)) return null;
  const n = (map.w | 0) * (map.h | 0) * 4;
  if (map.rgba.length < n) return null;
  const rgba = new Uint8ClampedArray(n);
  rgba.set(map.rgba.subarray ? map.rgba.subarray(0, n) : map.rgba);
  return { rgba, w: map.w | 0, h: map.h | 0 };
}

/**
 * Linear blend of two same-size atlases into `out` (or a new buffer).
 * @param {Atlas} from
 * @param {Atlas} to
 * @param {number} t 0…1
 * @param {Uint8ClampedArray|Uint8Array} [out]
 * @returns {Atlas|null}
 */
export function lerpAtlas(from, to, t, out) {
  if (!from?.rgba || !to?.rgba) return null;
  const w = from.w | 0;
  const h = from.h | 0;
  if (w !== (to.w | 0) || h !== (to.h | 0) || w < 1 || h < 1) return null;
  const n = w * h * 4;
  if (from.rgba.length < n || to.rgba.length < n) return null;
  const u = Math.min(1, Math.max(0, Number(t) || 0));
  if (u <= 0) {
    const rgba = out && out.length >= n ? out : new Uint8ClampedArray(n);
    rgba.set(from.rgba.subarray ? from.rgba.subarray(0, n) : from.rgba);
    return { rgba, w, h };
  }
  if (u >= 1) {
    const rgba = out && out.length >= n ? out : new Uint8ClampedArray(n);
    rgba.set(to.rgba.subarray ? to.rgba.subarray(0, n) : to.rgba);
    return { rgba, w, h };
  }
  const rgba = out && out.length >= n ? out : new Uint8ClampedArray(n);
  const a = from.rgba;
  const b = to.rgba;
  const inv = 1 - u;
  for (let i = 0; i < n; i++) {
    rgba[i] = (a[i] * inv + b[i] * u + 0.5) | 0;
  }
  return { rgba, w, h };
}
