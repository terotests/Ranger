// ============================================================================
// meshPick.js — CPU raycast against lathe mesh parts (authoring or display space).
// ============================================================================

/**
 * @param {number} sx canvas X
 * @param {number} sy canvas Y
 * @param {{ cam:[number,number,number], target:[number,number,number], fovDeg:number, width:number, height:number }} view
 * @returns {{ origin:[number,number,number], dir:[number,number,number] }}
 */
export function rayFromCanvas(sx, sy, view) {
  const w = view.width || 1;
  const h = view.height || 1;
  const ndcX = (sx / w) * 2 - 1;
  const ndcY = 1 - (sy / h) * 2;
  const fov = ((view.fovDeg || 45) * Math.PI) / 180;
  const aspect = w / h;
  const tan = Math.tan(fov / 2);

  const eye = view.cam;
  const target = view.target;
  const forward = normalize3([
    target[0] - eye[0],
    target[1] - eye[1],
    target[2] - eye[2],
  ]);
  // world up
  let right = cross3(forward, [0, 1, 0]);
  if (len3(right) < 1e-8) right = cross3(forward, [1, 0, 0]);
  right = normalize3(right);
  const up = normalize3(cross3(right, forward));

  const dir = normalize3([
    forward[0] + right[0] * ndcX * tan * aspect + up[0] * ndcY * tan,
    forward[1] + right[1] * ndcX * tan * aspect + up[1] * ndcY * tan,
    forward[2] + right[2] * ndcX * tan * aspect + up[2] * ndcY * tan,
  ]);
  return { origin: [...eye], dir };
}

function len3(a) {
  return Math.hypot(a[0], a[1], a[2]);
}
function normalize3(a) {
  const L = len3(a) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
}
function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function sub3(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function mul3(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** Rotate point by euler (rx, ry, 0) — matches preview entityTransform. */
export function applyPreviewEuler(p, rx, ry) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  // X then Y (XYZ euler with z=0)
  let x = p[0];
  let y = p[1] * cx - p[2] * sx;
  let z = p[1] * sx + p[2] * cx;
  const x2 = x * cy + z * sy;
  const z2 = -x * sy + z * cy;
  return [x2, y, z2];
}

export function applyPreviewEulerInv(p, rx, ry) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  // inverse Y then inverse X
  let x = p[0] * cy - p[2] * sy;
  let y = p[1];
  let z = p[0] * sy + p[2] * cy;
  const y2 = y * cx + z * sx;
  const z2 = -y * sx + z * cx;
  return [x, y2, z2];
}

/** Möller–Trumbore; returns t or null. */
export function intersectTriangle(origin, dir, v0, v1, v2) {
  const eps = 1e-8;
  const e1 = sub3(v1, v0);
  const e2 = sub3(v2, v0);
  const pvec = cross3(dir, e2);
  const det = dot3(e1, pvec);
  if (Math.abs(det) < eps) return null;
  const invDet = 1 / det;
  const tvec = sub3(origin, v0);
  const u = dot3(tvec, pvec) * invDet;
  if (u < 0 || u > 1) return null;
  const qvec = cross3(tvec, e1);
  const v = dot3(dir, qvec) * invDet;
  if (v < 0 || u + v > 1) return null;
  const t = dot3(e2, qvec) * invDet;
  if (t < eps) return null;
  return t;
}

/**
 * Raycast mesh parts in the same space as the ray.
 * @returns {{ point:[number,number,number], normal:[number,number,number], t:number, instanceGuid?:string } | null}
 */
export function raycastMeshParts(origin, dir, parts) {
  let bestT = Infinity;
  let best = null;
  for (const part of parts || []) {
    const pos = part.positions;
    const idx = part.indices;
    const nrm = part.normals;
    if (!pos?.length || !idx?.length) continue;
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const i0 = idx[i] * 3;
      const i1 = idx[i + 1] * 3;
      const i2 = idx[i + 2] * 3;
      const v0 = [pos[i0], pos[i0 + 1], pos[i0 + 2]];
      const v1 = [pos[i1], pos[i1 + 1], pos[i1 + 2]];
      const v2 = [pos[i2], pos[i2 + 1], pos[i2 + 2]];
      const t = intersectTriangle(origin, dir, v0, v1, v2);
      if (t == null || t >= bestT) continue;
      bestT = t;
      let n = cross3(sub3(v1, v0), sub3(v2, v0));
      if (len3(n) < 1e-12 && nrm) {
        n = [nrm[i0], nrm[i0 + 1], nrm[i0 + 2]];
      }
      n = normalize3(n);
      // Face toward the ray
      if (dot3(n, dir) > 0) n = mul3(n, -1);
      best = {
        point: add3(origin, mul3(dir, t)),
        normal: n,
        t,
        instanceGuid: part.instanceGuid || undefined,
      };
    }
  }
  return best;
}

/**
 * Full pick: canvas → world ray → inverse preview euler → authoring ray → hit.
 * `orientInv` maps display(oriented) → authoring (3×3 row-major or null).
 */
export function pickRootSurface(sx, sy, view, rootParts, meshTilt, meshAngle, orientInvMat) {
  const { origin, dir } = rayFromCanvas(sx, sy, view);
  // World (after euler) → pre-euler oriented space
  const o1 = applyPreviewEulerInv(origin, meshTilt, meshAngle);
  const d1p = applyPreviewEulerInv(add3(origin, dir), meshTilt, meshAngle);
  let oA = o1;
  let dA = normalize3(sub3(d1p, o1));
  if (orientInvMat) {
    oA = mulMat3(orientInvMat, o1);
    const tip = mulMat3(orientInvMat, add3(o1, dA));
    dA = normalize3(sub3(tip, oA));
  }
  return raycastMeshParts(oA, dA, rootParts);
}

function mulMat3(m, v) {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Transpose of row-major 3×3 (= inverse for pure rotation). */
export function transposeMat3(m) {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}
