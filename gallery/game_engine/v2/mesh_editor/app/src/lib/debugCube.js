// ============================================================================
// debugCube.js — small solid cube mesh parts for preview markers.
// ============================================================================

/**
 * World-space cube size ≈ `screenFraction` of the preview frame height.
 * @param {{ cam:number[], target:number[], fovDeg:number }} view
 * @param {number} [screenFraction=0.02]
 */
export function cubeSizeForView(view, screenFraction = 0.02) {
  if (!view?.cam || !view?.target) return 0.08;
  const dx = view.cam[0] - view.target[0];
  const dy = view.cam[1] - view.target[1];
  const dz = view.cam[2] - view.target[2];
  const dist = Math.hypot(dx, dy, dz) || 3;
  const fov = ((view.fovDeg || 45) * Math.PI) / 180;
  const frameH = 2 * dist * Math.tan(fov / 2);
  return Math.max(0.015, frameH * screenFraction);
}

/**
 * Axis-aligned cube centered at (cx,cy,cz) with half-extent `half`.
 * @returns {{ positions:number[], normals:number[], uvs:number[], indices:number[], colorHex:number, shininess:number, opacity:number, reflectivity:number }}
 */
export function makeAxisCubePart(cx, cy, cz, half, colorHex = 0x3b82f6) {
  const h = Math.max(1e-4, half);
  const x0 = cx - h;
  const x1 = cx + h;
  const y0 = cy - h;
  const y1 = cy + h;
  const z0 = cz - h;
  const z1 = cz + h;
  // 6 faces × 4 verts (unique per face for flat normals)
  const faces = [
    // +Z
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
      [0, 0, 1],
    ],
    // -Z
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
      [0, 0, -1],
    ],
    // +Y
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
      [0, 1, 0],
    ],
    // -Y
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
      [0, -1, 0],
    ],
    // +X
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [1, 0, 0],
    ],
    // -X
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
      [-1, 0, 0],
    ],
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vi = 0;
  for (const f of faces) {
    const n = f[4];
    for (let i = 0; i < 4; i++) {
      const p = f[i];
      positions.push(p[0], p[1], p[2]);
      normals.push(n[0], n[1], n[2]);
      uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
    }
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
    vi += 4;
  }
  return {
    positions,
    normals,
    uvs,
    indices,
    colorHex: colorHex | 0,
    shininess: 40,
    opacity: 1,
    reflectivity: 0,
  };
}

/**
 * Cube sitting on a surface hit: center pushed out along the normal.
 * @param {[number,number,number]} point
 * @param {[number,number,number]} normal
 * @param {number} edge World edge length
 * @param {number} [colorHex]
 */
export function makeSurfaceNormalCubePart(point, normal, edge, colorHex = 0x3b82f6) {
  const half = edge / 2;
  const nx = Number(normal?.[0]) || 0;
  const ny = Number(normal?.[1]) || 1;
  const nz = Number(normal?.[2]) || 0;
  const L = Math.hypot(nx, ny, nz) || 1;
  const ux = nx / L;
  const uy = ny / L;
  const uz = nz / L;
  // Sit just outside the surface so the cube is visible
  const cx = point[0] + ux * half * 1.15;
  const cy = point[1] + uy * half * 1.15;
  const cz = point[2] + uz * half * 1.15;
  return makeAxisCubePart(cx, cy, cz, half, colorHex);
}
