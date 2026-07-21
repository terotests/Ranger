// ============================================================================
// meshTransform.js — place / scale / mirror lathe part buffers in parent space.
// ============================================================================

import { rotationAligning } from "./placementNormal.js";

/**
 * @param {number[]} positions flat xyz
 * @returns {{ min:[number,number,number], max:[number,number,number], center:[number,number,number], size:[number,number,number], maxExtent:number }}
 */
export function computeBBox(positions) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  if (!Number.isFinite(minX)) {
    return {
      min: [0, 0, 0],
      max: [0, 0, 0],
      center: [0, 0, 0],
      size: [0, 0, 0],
      maxExtent: 0,
    };
  }
  const size = [maxX - minX, maxY - minY, maxZ - minZ];
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size,
    maxExtent: Math.max(size[0], size[1], size[2]),
  };
}

/** Union AABB of many parts (must use one shared center when placing a child). */
export function partsBBox(parts) {
  const all = [];
  for (const p of parts || []) {
    const pos = p.positions || [];
    for (let i = 0; i < pos.length; i++) all.push(pos[i]);
  }
  return computeBBox(all);
}

function reverseWinding(indices) {
  const out = indices.slice();
  for (let i = 0; i + 2 < out.length; i += 3) {
    const t = out[i + 1];
    out[i + 1] = out[i + 2];
    out[i + 2] = t;
  }
  return out;
}

function mulMat3Vec(m, x, y, z) {
  return {
    x: m[0] * x + m[1] * y + m[2] * z,
    y: m[3] * x + m[4] * y + m[5] * z,
    z: m[6] * x + m[7] * y + m[8] * z,
  };
}

function unit3(x, y, z, fallback) {
  const L = Math.hypot(x, y, z);
  if (!Number.isFinite(L) || L < 1e-9) return fallback;
  return { x: x / L, y: y / L, z: z / L };
}

/**
 * Profile stamp (default): (x,y,0) + Y-rotation + optional mirrorX.
 * Surface place (xf.surface): align child up → hit normal, pivot, translate to (x,y,z).
 */
export function transformPart(part, xf, sharedCenter, pivot) {
  if (xf?.surface) {
    return transformPartSurface(part, xf, pivot || sharedCenter);
  }
  const positions = part.positions.slice();
  const normals = part.normals ? part.normals.slice() : null;
  const indices = part.indices ? part.indices.slice() : [];
  const cx = sharedCenter?.[0] ?? 0;
  const cy = sharedCenter?.[1] ?? 0;
  const cz = sharedCenter?.[2] ?? 0;
  const s = Math.max(0.001, xf.scale ?? 1);
  const ax = xf.snapCenterline ? 0 : Number(xf.x) || 0;
  const ay = Number(xf.y) || 0;
  const mirror = !!xf.mirrorX;
  const rot = ((Number(xf.rotationYDeg) || 0) * Math.PI) / 180;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);

  for (let i = 0; i < positions.length; i += 3) {
    let x = (positions[i] - cx) * s;
    let y = (positions[i + 1] - cy) * s;
    let z = (positions[i + 2] - cz) * s;

    const rx = x * cr + z * sr;
    const rz = -x * sr + z * cr;
    x = rx;
    z = rz;

    if (mirror) x = -x;

    positions[i] = x + (mirror ? -ax : ax);
    positions[i + 1] = y + ay;
    positions[i + 2] = z;
  }

  if (normals) {
    for (let i = 0; i < normals.length; i += 3) {
      let nx = normals[i];
      let ny = normals[i + 1];
      let nz = normals[i + 2];
      const rx = nx * cr + nz * sr;
      const rz = -nx * sr + nz * cr;
      nx = rx;
      nz = rz;
      if (mirror) nx = -nx;
      const len = Math.hypot(nx, ny, nz) || 1;
      normals[i] = nx / len;
      normals[i + 1] = ny / len;
      normals[i + 2] = nz / len;
    }
  }

  return {
    ...part,
    positions,
    normals: normals || part.normals,
    indices: mirror ? reverseWinding(indices) : indices,
    uvs: part.uvs ? part.uvs.slice() : part.uvs,
    mapRgba: part.mapRgba ? part.mapRgba.slice() : part.mapRgba,
  };
}

function transformPartSurface(part, xf, pivot) {
  const positions = part.positions.slice();
  const normals = part.normals ? part.normals.slice() : null;
  const indices = part.indices ? part.indices.slice() : [];
  const s = Math.max(0.001, xf.scale ?? 1);
  const ppx = Number(pivot?.[0]) || 0;
  const ppy = Number(pivot?.[1]) || 0;
  const ppz = Number(pivot?.[2]) || 0;
  const ax = Number(xf.x) || 0;
  const ay = Number(xf.y) || 0;
  const az = Number(xf.z) || 0;
  const hitN = unit3(Number(xf.nx), Number(xf.ny), Number(xf.nz), { x: 0, y: 1, z: 0 });
  const childUp = unit3(
    Number(xf.childUpX),
    Number(xf.childUpY),
    Number(xf.childUpZ),
    { x: 0, y: 1, z: 0 },
  );
  const R = rotationAligning(childUp, hitN);
  const twist = ((Number(xf.rotationYDeg) || 0) * Math.PI) / 180;
  const ct = Math.cos(twist);
  const st = Math.sin(twist);
  const { x: nx, y: ny, z: nz } = hitN;

  for (let i = 0; i < positions.length; i += 3) {
    let x = (positions[i] - ppx) * s;
    let y = (positions[i + 1] - ppy) * s;
    let z = (positions[i + 2] - ppz) * s;
    let p = mulMat3Vec(R, x, y, z);
    if (Math.abs(twist) > 1e-8) {
      const d = p.x * nx + p.y * ny + p.z * nz;
      const cx = ny * p.z - nz * p.y;
      const cy = nz * p.x - nx * p.z;
      const cz = nx * p.y - ny * p.x;
      p = {
        x: p.x * ct + cx * st + nx * d * (1 - ct),
        y: p.y * ct + cy * st + ny * d * (1 - ct),
        z: p.z * ct + cz * st + nz * d * (1 - ct),
      };
    }
    positions[i] = p.x + ax;
    positions[i + 1] = p.y + ay;
    positions[i + 2] = p.z + az;
  }

  if (normals) {
    for (let i = 0; i < normals.length; i += 3) {
      let p = mulMat3Vec(R, normals[i], normals[i + 1], normals[i + 2]);
      if (Math.abs(twist) > 1e-8) {
        const d = p.x * nx + p.y * ny + p.z * nz;
        const cx = ny * p.z - nz * p.y;
        const cy = nz * p.x - nx * p.z;
        const cz = nx * p.y - ny * p.x;
        p = {
          x: p.x * ct + cx * st + nx * d * (1 - ct),
          y: p.y * ct + cy * st + ny * d * (1 - ct),
          z: p.z * ct + cz * st + nz * d * (1 - ct),
        };
      }
      const len = Math.hypot(p.x, p.y, p.z) || 1;
      normals[i] = p.x / len;
      normals[i + 1] = p.y / len;
      normals[i + 2] = p.z / len;
    }
  }

  return {
    ...part,
    positions,
    normals: normals || part.normals,
    indices,
    uvs: part.uvs ? part.uvs.slice() : part.uvs,
    mapRgba: part.mapRgba ? part.mapRgba.slice() : part.mapRgba,
  };
}

/**
 * Transform every part of a child mesh with one shared bbox center so wedges
 * stay welded. Returns new part objects (never mutates inputs).
 * For surface placement, pass xf.surface and optional pivot [x,y,z].
 */
export function transformParts(parts, xf, pivot) {
  if (!parts?.length) return [];
  const bbox = partsBBox(parts);
  const usePivot = xf?.surface
    ? pivot || [
        Number(xf.pivotX) || bbox.center[0],
        Number(xf.pivotY) || bbox.min[1],
        Number(xf.pivotZ) || bbox.center[2],
      ]
    : bbox.center;
  return parts.map((p) => transformPart(p, xf, bbox.center, usePivot));
}
