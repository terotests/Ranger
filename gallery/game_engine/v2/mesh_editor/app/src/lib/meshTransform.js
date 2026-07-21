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

/**
 * Bake TRS into a part (positions + normals). Attachment is in profile space:
 * x = radial (+X), y = height. Optional mirror across the Y axis (x → −x).
 *
 * @param {object} part
 * @param {{
 *   x: number, y: number,
 *   rotationYDeg?: number,
 *   scale?: number,
 *   snapCenterline?: boolean,
 *   mirrorX?: boolean,
 * }} xf
 */
export function transformPart(part, xf) {
  const positions = part.positions.slice();
  const normals = part.normals ? part.normals.slice() : null;
  const bbox = computeBBox(positions);
  const extent = Math.max(1e-6, bbox.maxExtent);
  // scale: user bbox size multiplier — 1 keeps natural size; typical sub-object ~0.2–0.5
  const s = Math.max(0.001, xf.scale ?? 1);
  const ax = xf.snapCenterline ? 0 : Number(xf.x) || 0;
  const ay = Number(xf.y) || 0;
  const mirror = !!xf.mirrorX;
  const rot = ((Number(xf.rotationYDeg) || 0) * Math.PI) / 180;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);

  for (let i = 0; i < positions.length; i += 3) {
    // Center on bbox, then uniform scale
    let x = (positions[i] - bbox.center[0]) * s;
    let y = (positions[i + 1] - bbox.center[1]) * s;
    let z = (positions[i + 2] - bbox.center[2]) * s;

    // Rotate around Y
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
  };
}

/** Union bbox of many parts (for UI readout). */
export function partsBBox(parts) {
  const all = [];
  for (const p of parts || []) {
    for (let i = 0; i < p.positions.length; i++) all.push(p.positions[i]);
  }
  return computeBBox(all);
}
