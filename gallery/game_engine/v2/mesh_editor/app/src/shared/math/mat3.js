// ============================================================================
// mat3.js — row-major 3x3 rotation maths shared by the geometry modules.
// ============================================================================
//
// This existed three times over, character for character, as a private helper:
// `mulMat3Vec` (meshTransform.js), `mulMatVec` (placementNormal.js) and
// `mulMat3` (meshPick.js). They differed only in whether they returned an
// object or a tuple, so a fix or an index typo in one never reached the others.
//
// TWO VECTOR SHAPES, ON PURPOSE
//
// The editor carries 3D vectors in two forms and both are legitimate:
//
//   * `{ x, y, z }` — geometry code that reads like maths (placement normals,
//     part transforms). Most of the codebase.
//   * `[x, y, z]` and flat `[x,y,z, x,y,z, ...]` buffers — anything touching
//     vertex data, because that is the layout Three, the GPU and the Ranger
//     `rg3d_geometry_buffer` command all want.
//
// So the functions below come in an object flavour and a tuple/flat flavour
// rather than pretending one representation fits everywhere. Pick by what the
// caller already holds; do not convert just to call a helper.
//
// Matrices are row-major, 9 numbers: [m00 m01 m02 m10 m11 m12 m20 m21 m22].
// ============================================================================

/** Row-major 3x3 times (x,y,z) -> `{x,y,z}`. */
export function mat3MulXYZ(m, x, y, z) {
  return {
    x: m[0] * x + m[1] * y + m[2] * z,
    y: m[3] * x + m[4] * y + m[5] * z,
    z: m[6] * x + m[7] * y + m[8] * z,
  };
}

/** Row-major 3x3 times `[x,y,z]` -> `[x,y,z]`. */
export function mat3MulTuple(m, v) {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Transpose of a row-major 3x3 — the inverse for a pure rotation. */
export function transposeMat3(m) {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

/**
 * Normalise (x,y,z), returning `fallback` when the vector is degenerate or
 * non-finite. The fallback is required rather than optional: every caller has a
 * meaningful "up" or "forward" to fall back to, and silently returning a zero
 * vector is what makes degenerate geometry hard to trace.
 */
export function unit3(x, y, z, fallback) {
  const L = Math.hypot(x, y, z);
  if (!Number.isFinite(L) || L < 1e-9) return fallback;
  return { x: x / L, y: y / L, z: z / L };
}

/**
 * Rodrigues rotation of `p` about a UNIT axis, given the angle's cosine and
 * sine precomputed (callers rotate thousands of vertices by one angle, so the
 * trig stays hoisted out of the loop).
 *
 *   p' = p·cos + (axis × p)·sin + axis·(axis·p)·(1 - cos)
 *
 * Was inlined twice inside transformPart — once over positions, once over
 * normals — which is precisely the kind of copy where one loop gets a sign fix
 * and the other does not.
 */
export function rodrigues(p, ax, ay, az, ct, st) {
  const d = p.x * ax + p.y * ay + p.z * az;
  const cx = ay * p.z - az * p.y;
  const cy = az * p.x - ax * p.z;
  const cz = ax * p.y - ay * p.x;
  return {
    x: p.x * ct + cx * st + ax * d * (1 - ct),
    y: p.y * ct + cy * st + ay * d * (1 - ct),
    z: p.z * ct + cz * st + az * d * (1 - ct),
  };
}

// Rotating a flat vertex buffer comes in a mutating and a copying flavour, and
// the two are NOT interchangeable — mixing them up either corrupts the
// authoring-space mesh or silently drops the rotation. They are named for what
// they do rather than distinguished by a flag, because the previous
// `rotateFlatXyz` in placementNormal.js was documented "in place" while it
// actually returned a copy, and its callers depended on the copy.

/** Rotate a flat `[x,y,z, ...]` buffer IN PLACE. Returns the same array. */
export function rotateFlatXyzInPlace(arr, m) {
  if (!arr || !arr.length) return arr;
  for (let i = 0; i + 2 < arr.length; i += 3) {
    const p = mat3MulXYZ(m, arr[i], arr[i + 1], arr[i + 2]);
    arr[i] = p.x;
    arr[i + 1] = p.y;
    arr[i + 2] = p.z;
  }
  return arr;
}

/** Rotate a flat `[x,y,z, ...]` buffer into a NEW array; input untouched. */
export function rotateFlatXyzCopy(arr, m) {
  if (!arr || !arr.length) return arr;
  const out = arr.slice();
  return rotateFlatXyzInPlace(out, m);
}
