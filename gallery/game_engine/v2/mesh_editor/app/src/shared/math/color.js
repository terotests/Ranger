// ============================================================================
// color.js — hex/int colour conversion and blending.
// ============================================================================
// Pulled out of latheTessellate.js. Two reasons beyond tidiness:
//
//  1. The texture rasterizer needs the same conversions, and it is queued for a
//     port to Ranger (so it can rasterize on native/Pi/wasm32 rather than only
//     in a browser canvas). Keeping colour maths in one small, dependency-free
//     module makes that port a direct transliteration instead of an archaeology
//     exercise across a 300-line tessellation file.
//  2. Ranger Three wants packed 0xRRGGBB ints while the UI carries "#rrggbb"
//     strings, so this conversion sits on a real boundary and deserves a name.
// ============================================================================

import { lerp } from "./scalar.js";

/**
 * "#rgb" / "#rrggbb" (with or without "#") -> `{r, g, b}` 0..255.
 * Unparseable input falls back to white rather than NaN, because a wrong-but-
 * visible colour is far easier to diagnose than a mesh that vanishes.
 */
export function hexToRgb(hex) {
  const h = String(hex || "#ffffff").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padStart(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Hex string -> packed 0xRRGGBB int (the form Ranger Three materials take). */
export function hexToInt(hex) {
  const c = hexToRgb(hex);
  return (c.r << 16) | (c.g << 8) | c.b;
}

/** Blend two hex strings and return a packed int. */
export function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(lerp(A.r, B.r, t));
  const g = Math.round(lerp(A.g, B.g, t));
  const b_ = Math.round(lerp(A.b, B.b, t));
  return (r << 16) | (g << 8) | b_;
}

/**
 * Multiply two packed colours per channel (a tint). White short-circuits, which
 * matters: the common case is "no tint", and it also keeps an exact 0xffffff
 * from drifting through the /255 rounding.
 */
export function mulColorHex(a, b) {
  if (a === 0xffffff) return b;
  if (b === 0xffffff) return a;
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (
    ((((ar * br) / 255) | 0) << 16) |
    ((((ag * bg) / 255) | 0) << 8) |
    (((ab * bb) / 255) | 0)
  );
}

/** Roughness 0..1 -> Phong shininess (rough = broad highlight). */
export function roughnessToShininess(r) {
  const t = Math.min(1, Math.max(0, r));
  return lerp(280, 6, t);
}
