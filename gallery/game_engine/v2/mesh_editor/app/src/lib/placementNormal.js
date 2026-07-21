// ============================================================================
// placementNormal.js — object placement “up” as a straight 2D segment (profile plane).
// World direction is (end - start) in XY → (dx, dy, 0). Preview aligns that to +Y.
// ============================================================================

export function defaultPlacementNormal() {
  return {
    start: { x: 0, y: -1 },
    end: { x: 0, y: 1 },
  };
}

export function normalizePlacementNormal(raw) {
  const d = defaultPlacementNormal();
  if (!raw || typeof raw !== "object") return d;
  const sx = Number(raw.start?.x);
  const sy = Number(raw.start?.y);
  const ex = Number(raw.end?.x);
  const ey = Number(raw.end?.y);
  return {
    start: {
      x: Number.isFinite(sx) ? sx : d.start.x,
      y: Number.isFinite(sy) ? sy : d.start.y,
    },
    end: {
      x: Number.isFinite(ex) ? ex : d.end.x,
      y: Number.isFinite(ey) ? ey : d.end.y,
    },
  };
}

/** Profile-plane direction → world XYZ (Z = 0). */
export function placementNormalDirection3(pn) {
  const n = normalizePlacementNormal(pn);
  const dx = n.end.x - n.start.x;
  const dy = n.end.y - n.start.y;
  const L = Math.hypot(dx, dy, 0);
  if (L < 1e-9) return { x: 0, y: 1, z: 0 };
  return { x: dx / L, y: dy / L, z: 0 };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function len(a) {
  return Math.hypot(a.x, a.y, a.z);
}
function normalize3(a) {
  const L = len(a) || 1;
  return { x: a.x / L, y: a.y / L, z: a.z / L };
}

/**
 * 3×3 row-major rotation that maps `from` → `to` (both unit-ish).
 * Identity when already aligned; 180° flip when opposite.
 */
export function rotationAligning(from, to) {
  const f = normalize3(from);
  const t = normalize3(to);
  const c = dot(f, t);
  if (c > 0.999999) {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }
  if (c < -0.999999) {
    // 180° about an axis perpendicular to f
    let axis = cross(f, { x: 1, y: 0, z: 0 });
    if (len(axis) < 1e-6) axis = cross(f, { x: 0, y: 0, z: 1 });
    axis = normalize3(axis);
    // Rodrigues with angle π: R = -I + 2 a a^T
    const ax = axis.x;
    const ay = axis.y;
    const az = axis.z;
    return [
      2 * ax * ax - 1,
      2 * ax * ay,
      2 * ax * az,
      2 * ay * ax,
      2 * ay * ay - 1,
      2 * ay * az,
      2 * az * ax,
      2 * az * ay,
      2 * az * az - 1,
    ];
  }
  const v = cross(f, t);
  const s = len(v);
  const vx = v.x / s;
  const vy = v.y / s;
  const vz = v.z / s;
  // Rodrigues: R = I + K sinθ + K² (1-cosθ); sinθ=s, cosθ=c, K = [v]_× with unit v
  const k = 1 - c;
  return [
    c + vx * vx * k,
    vx * vy * k - vz * s,
    vx * vz * k + vy * s,
    vy * vx * k + vz * s,
    c + vy * vy * k,
    vy * vz * k - vx * s,
    vz * vx * k - vy * s,
    vz * vy * k + vx * s,
    c + vz * vz * k,
  ];
}

function mulMatVec(m, x, y, z) {
  return {
    x: m[0] * x + m[1] * y + m[2] * z,
    y: m[3] * x + m[4] * y + m[5] * z,
    z: m[6] * x + m[7] * y + m[8] * z,
  };
}

/** Rotate flat xyz buffer in place by row-major 3×3. */
export function rotateFlatXyz(arr, m) {
  if (!arr || !arr.length) return arr;
  const out = arr.slice();
  for (let i = 0; i + 2 < out.length; i += 3) {
    const p = mulMatVec(m, out[i], out[i + 1], out[i + 2]);
    out[i] = p.x;
    out[i + 1] = p.y;
    out[i + 2] = p.z;
  }
  return out;
}

/**
 * Return a mesh copy oriented so placement normal points world +Y.
 * Does not mutate the authoring-space mesh.
 */
export function orientMeshToPlacementNormal(mesh, placementNormal) {
  if (!mesh?.parts?.length) return mesh;
  const dir = placementNormalDirection3(placementNormal);
  // Already +Y → no-op (common default)
  if (Math.abs(dir.x) < 1e-9 && dir.y > 0.999 && Math.abs(dir.z) < 1e-9) {
    return mesh;
  }
  const m = rotationAligning(dir, { x: 0, y: 1, z: 0 });
  return {
    ...mesh,
    parts: mesh.parts.map((part) => ({
      ...part,
      positions: rotateFlatXyz(part.positions, m),
      normals: part.normals ? rotateFlatXyz(part.normals, m) : part.normals,
    })),
  };
}
