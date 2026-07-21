// ============================================================================
// meshTransform.js — place / scale / mirror lathe part buffers in parent space.
// ============================================================================

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

/**
 * Bake TRS into one part using a SHARED object-space center (not this part's bbox).
 * Centering each profile×orbit wedge on its own AABB tears the child mesh apart.
 */
export function transformPart(part, xf, sharedCenter) {
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

    // Place at ±attach: mirrored copies go to the opposite side of the axis.
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
    // Mirroring flips triangle winding — reverse so fronts stay outward.
    indices: mirror ? reverseWinding(indices) : indices,
    // Defensive copies so mirrored pass never shares buffers with the primary.
    uvs: part.uvs ? part.uvs.slice() : part.uvs,
    mapRgba: part.mapRgba ? part.mapRgba.slice() : part.mapRgba,
  };
}

/**
 * Transform every part of a child mesh with one shared bbox center so wedges
 * stay welded. Returns new part objects (never mutates inputs).
 */
export function transformParts(parts, xf) {
  if (!parts?.length) return [];
  const bbox = partsBBox(parts);
  return parts.map((p) => transformPart(p, xf, bbox.center));
}
