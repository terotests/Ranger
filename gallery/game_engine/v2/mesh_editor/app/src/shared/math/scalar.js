// ============================================================================
// scalar.js — one-line numeric helpers used across the editor.
// ============================================================================
// `lerp` had two private copies (latheTessellate.js, pathSample.js). They agreed,
// but two copies of an interpolation rule is two places for an endpoint
// convention to drift.
// ============================================================================

/** Linear interpolation; `t` is NOT clamped (callers sometimes extrapolate). */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Clamp to [lo, hi]. */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Clamp to [0, 1] — the common case for curve parameters and weights. */
export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
