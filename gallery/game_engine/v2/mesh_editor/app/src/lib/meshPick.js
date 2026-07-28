// ============================================================================
// meshPick.js — CPU raycast against lathe mesh parts (authoring or display space).
// ============================================================================

/**
 * @param {number} sx canvas X
 * @param {number} sy canvas Y
 * @param {{ cam:[number,number,number], target:[number,number,number], fovDeg:number, width:number, height:number }} view
 * @returns {{ origin:[number,number,number], dir:[number,number,number] }}
 */
import { mat3MulTuple as mulMat3 } from "../shared/math/mat3.js";

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

/**
 * Rotate point by preview mesh euler (rx, ry, 0).
 * Must match Three.js Object3D Euler order "XYZ" used by
 * WebMeshEditorHost.entityTransform(..., tilt, yaw, 0): R = Rx * Ry
 * (apply yaw around Y first, then tilt around X).
 */
export function applyPreviewEuler(p, rx, ry) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  // Y first
  const x1 = p[0] * cy + p[2] * sy;
  const y1 = p[1];
  const z1 = -p[0] * sy + p[2] * cy;
  // then X
  return [x1, y1 * cx - z1 * sx, y1 * sx + z1 * cx];
}

/** Inverse of applyPreviewEuler (undo host mesh yaw/tilt into authoring space). */
export function applyPreviewEulerInv(p, rx, ry) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  // Inv(Rx*Ry) = Ry^-1 * Rx^-1 → undo X, then undo Y
  const x1 = p[0];
  const y1 = p[1] * cx + p[2] * sx;
  const z1 = -p[1] * sx + p[2] * cx;
  return [x1 * cy - z1 * sy, y1, x1 * sy + z1 * cy];
}

/** Transform all part positions/normals by preview euler (world-space pick helper). */
export function transformPartsByPreviewEuler(parts, rx, ry) {
  return (parts || []).map((part) => {
    const pos = part.positions;
    const nrm = part.normals;
    if (!pos?.length) return part;
    const positions = new Array(pos.length);
    for (let i = 0; i + 2 < pos.length; i += 3) {
      const p = applyPreviewEuler([pos[i], pos[i + 1], pos[i + 2]], rx, ry);
      positions[i] = p[0];
      positions[i + 1] = p[1];
      positions[i + 2] = p[2];
    }
    let normals = nrm;
    if (nrm?.length) {
      normals = new Array(nrm.length);
      for (let i = 0; i + 2 < nrm.length; i += 3) {
        const n = applyPreviewEuler([nrm[i], nrm[i + 1], nrm[i + 2]], rx, ry);
        const L = Math.hypot(n[0], n[1], n[2]) || 1;
        normals[i] = n[0] / L;
        normals[i + 1] = n[1] / L;
        normals[i + 2] = n[2] / L;
      }
    }
    return { ...part, positions, normals };
  });
}

/**
 * Möller–Trumbore; returns hit with barycentric (u,v) or null.
 * Weights: w0 = 1-u-v (v0), w1 = u (v1), w2 = v (v2).
 * @returns {{ t:number, u:number, v:number } | null}
 */
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
  return { t, u, v };
}

/**
 * Raycast mesh parts in the same space as the ray.
 * When `part.uvs` is present, interpolates lathe UV at the hit.
 * @returns {{ point:[number,number,number], normal:[number,number,number], t:number, uv?:[number,number], instanceGuid?:string } | null}
 */
export function raycastMeshParts(origin, dir, parts) {
  let bestT = Infinity;
  let best = null;
  for (const part of parts || []) {
    const pos = part.positions;
    const idx = part.indices;
    const nrm = part.normals;
    const uvs = part.uvs;
    if (!pos?.length || !idx?.length) continue;
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const ia = idx[i];
      const ib = idx[i + 1];
      const ic = idx[i + 2];
      const i0 = ia * 3;
      const i1 = ib * 3;
      const i2 = ic * 3;
      const v0 = [pos[i0], pos[i0 + 1], pos[i0 + 2]];
      const v1 = [pos[i1], pos[i1 + 1], pos[i1 + 2]];
      const v2 = [pos[i2], pos[i2 + 1], pos[i2 + 2]];
      const hitT = intersectTriangle(origin, dir, v0, v1, v2);
      if (hitT == null || hitT.t >= bestT) continue;
      bestT = hitT.t;
      let n = cross3(sub3(v1, v0), sub3(v2, v0));
      if (len3(n) < 1e-12 && nrm) {
        n = [nrm[i0], nrm[i0 + 1], nrm[i0 + 2]];
      }
      n = normalize3(n);
      // Face toward the ray
      if (dot3(n, dir) > 0) n = mul3(n, -1);
      let uv = undefined;
      if (uvs && uvs.length >= (Math.max(ia, ib, ic) + 1) * 2) {
        const bu = hitT.u;
        const bv = hitT.v;
        const bw = 1 - bu - bv;
        let u0 = uvs[ia * 2];
        let u1 = uvs[ib * 2];
        let u2 = uvs[ic * 2];
        const v0 = uvs[ia * 2 + 1];
        const v1 = uvs[ib * 2 + 1];
        const v2 = uvs[ic * 2 + 1];
        // Closed lathe seam: UV jumps ~1 across a short 3D edge. Unwrap only then
        // (not for a large UV island that legitimately spans 0→1).
        const pairs = [
          [u0, u1, i0, i1],
          [u0, u2, i0, i2],
          [u1, u2, i1, i2],
        ];
        let seam = false;
        for (const [ua, ub, pa, pb] of pairs) {
          if (Math.abs(ua - ub) <= 0.5) continue;
          const plen = Math.hypot(
            pos[pa] - pos[pb],
            pos[pa + 1] - pos[pb + 1],
            pos[pa + 2] - pos[pb + 2],
          );
          if (plen < 1.25) {
            seam = true;
            break;
          }
        }
        if (seam) {
          if (u1 - u0 > 0.5) u1 -= 1;
          else if (u1 - u0 < -0.5) u1 += 1;
          if (u2 - u0 > 0.5) u2 -= 1;
          else if (u2 - u0 < -0.5) u2 += 1;
        }
        let u = bw * u0 + bu * u1 + bv * u2;
        u = ((u % 1) + 1) % 1;
        const v = bw * v0 + bu * v1 + bv * v2;
        uv = [u, v];
      }
      best = {
        point: add3(origin, mul3(dir, hitT.t)),
        normal: n,
        t: hitT.t,
        uv,
        instanceGuid: part.instanceGuid || undefined,
      };
    }
  }
  return best;
}

/**
 * Approximate lathe UV from a hit point when vertex UVs are missing.
 * u = angle around Y, v = normalized height in the part's Y range.
 */
export function approximateLatheUvFromPoint(point, parts) {
  if (!point) return null;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const part of parts || []) {
    const pos = part.positions;
    if (!pos?.length) continue;
    for (let i = 1; i < pos.length; i += 3) {
      const y = pos[i];
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) return null;
  const span = Math.max(1e-6, yMax - yMin);
  // Lathe u=0 at +X (pathSample: col0 → orbit (1,0) → position x=r, z=0).
  const u = ((Math.atan2(point[2], point[0]) / (Math.PI * 2)) + 1) % 1;
  const v = Math.min(1, Math.max(0, (point[1] - yMin) / span));
  return [u, v];
}

/**
 * Full pick against root parts in authoring space.
 * Accounts for the preview host mesh yaw/tilt (entityTransform euler XYZ) by
 * inverse-rotating the camera ray into authoring space — same rotation the
 * editor applies when the object spins / is frozen after orbit.
 *
 * `orientInv` maps placement-oriented display → authoring (3×3 row-major or null).
 * If the hit has no vertex UVs, fills `uv` via approximateLatheUvFromPoint.
 */
export function pickRootSurface(sx, sy, view, rootParts, meshTilt, meshAngle, orientInvMat) {
  const { origin, dir } = rayFromCanvas(sx, sy, view);
  // World (mesh rotated by host euler) → authoring / placement-oriented space
  const o1 = applyPreviewEulerInv(origin, meshTilt, meshAngle);
  const d1p = applyPreviewEulerInv(add3(origin, dir), meshTilt, meshAngle);
  let oA = o1;
  let dA = normalize3(sub3(d1p, o1));
  if (orientInvMat) {
    oA = mulMat3(orientInvMat, o1);
    const tip = mulMat3(orientInvMat, add3(o1, dA));
    dA = normalize3(sub3(tip, oA));
  }
  const hit = raycastMeshParts(oA, dA, rootParts);
  if (hit && !hit.uv) {
    hit.uv = approximateLatheUvFromPoint(hit.point, rootParts);
  }
  return hit;
}

/** Transpose of a row-major 3x3 (= inverse for a pure rotation). */
export { transposeMat3 } from "../shared/math/mat3.js";
