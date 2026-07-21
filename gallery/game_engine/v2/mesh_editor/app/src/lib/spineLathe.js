// ============================================================================
// spineLathe.js — place profile×orbit samples along a curved spine (centerline).
// Two planar paths: profile-spine (X vs Y) and orbit-spine (Z vs Y).
// Straight x=0 on both ⇒ classic Y-axis lathe.
// ============================================================================

import { evalSpan, normalizePathType } from "./pathSample.js";

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function mul(a, s) {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
function len(a) {
  return Math.hypot(a.x, a.y, a.z);
}
function normalize(a) {
  const L = len(a) || 1;
  return { x: a.x / L, y: a.y / L, z: a.z / L };
}

export function defaultSpineKnots(uid = () => "s" + Math.random().toString(36).slice(2, 9)) {
  const colors = ["#c8e87a", "#7ecf6a", "#6ec8ff"];
  return [
    { id: uid(), x: 0, y: -1, hx: 0, hy: 0, color: colors[0] },
    { id: uid(), x: 0, y: 0, hx: 0, hy: 0, color: colors[1] },
    { id: uid(), x: 0, y: 1, hx: 0, hy: 0, color: colors[2] },
  ];
}

export function defaultSpineSegments(knots) {
  const segs = [];
  for (let i = 0; i < knots.length - 1; i++) {
    segs.push({
      fromId: knots[i].id,
      toId: knots[i + 1].id,
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "gradient",
      textureData: null,
      textureAsset: null,
      pathType: "line",
      arcBulge: null,
    });
  }
  return segs;
}

/** Open path sample without radius clamp (signed lateral offset). */
export function sampleSpineOpenSigned(knots, segments, samplesPerSpan) {
  const pts = [];
  if (!knots || knots.length < 2) return pts;
  const segN = Math.max(1, samplesPerSpan | 0);
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i];
    const b = knots[i + 1];
    const seg = segments?.[i];
    const opts = {
      pathType: normalizePathType(seg?.pathType || "line"),
      curveType: 0,
      arcBulge: seg?.arcBulge ?? null,
    };
    const last = i < knots.length - 2 ? segN - 1 : segN;
    for (let s = 0; s <= last; s++) {
      const t = s / segN;
      const { p, tan } = evalSpan(a, b, t, opts);
      pts.push({ x: p.x, y: p.y, tx: tan.x, ty: tan.y, segmentIndex: i, t });
    }
  }
  return pts;
}

export function sampleSpineAt(knots, segments, u, samples = 48) {
  const raw = sampleSpineOpenSigned(knots, segments, Math.max(8, samples));
  if (!raw.length) return { x: 0, y: 0, tx: 0, ty: 1 };
  if (raw.length === 1) return raw[0];
  const t = Math.min(1, Math.max(0, u));
  const f = t * (raw.length - 1);
  const i = Math.min(raw.length - 2, Math.floor(f));
  const local = f - i;
  const a = raw[i];
  const b = raw[i + 1];
  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
    tx: a.tx + (b.tx - a.tx) * local,
    ty: a.ty + (b.ty - a.ty) * local,
  };
}

export function buildSpineFrames(centers) {
  const n = centers.length;
  if (!n) return [];
  const frames = [];
  let N = { x: 1, y: 0, z: 0 };
  for (let i = 0; i < n; i++) {
    let T;
    if (n === 1) T = { x: 0, y: 1, z: 0 };
    else if (i === 0) T = sub(centers[1], centers[0]);
    else if (i === n - 1) T = sub(centers[n - 1], centers[n - 2]);
    else T = sub(centers[i + 1], centers[i - 1]);
    if (len(T) < 1e-9) T = { x: 0, y: 1, z: 0 };
    T = normalize(T);
    N = sub(N, mul(T, dot(N, T)));
    if (len(N) < 1e-6) {
      const ref = Math.abs(T.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 };
      N = cross(ref, T);
      if (len(N) < 1e-6) N = { x: 1, y: 0, z: 0 };
      else N = normalize(N);
    } else {
      N = normalize(N);
    }
    const B = normalize(cross(T, N));
    N = normalize(cross(B, T));
    frames.push({ T, N, B, C: centers[i] });
  }
  return frames;
}

/**
 * Lathe along spine. When spines are straight x=0, matches classic
 * `(r·ox, y, r·oy)` — orbit is a scale on positions; only normals unitize.
 */
export function latheProfileWithOrbitOnSpine(profilePts, orbitPts, closed, spineProfile, spineOrbit) {
  const rows = profilePts.length;
  const steps = orbitPts.length;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const rowSeg = profilePts.map((p) => p.segmentIndex | 0);
  const colSeg = orbitPts.map((p) => p.segmentIndex | 0);

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of profilePts) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  const ySpan = Math.max(1e-9, yMax - yMin);
  const pk = spineProfile?.knots || [];
  const ps = spineProfile?.segments || [];
  const ok = spineOrbit?.knots || [];
  const os = spineOrbit?.segments || [];

  const centers = [];
  for (let row = 0; row < rows; row++) {
    const pr = profilePts[row];
    const u = (pr.y - yMin) / ySpan;
    if (pk.length >= 2 && ok.length >= 2) {
      const sp = sampleSpineAt(pk, ps, u);
      const so = sampleSpineAt(ok, os, u);
      centers.push({ x: sp.x, y: sp.y, z: so.x });
    } else if (pk.length >= 2) {
      const sp = sampleSpineAt(pk, ps, u);
      centers.push({ x: sp.x, y: sp.y, z: 0 });
    } else if (ok.length >= 2) {
      const so = sampleSpineAt(ok, os, u);
      centers.push({ x: 0, y: so.y, z: so.x });
    } else {
      centers.push({ x: 0, y: pr.y, z: 0 });
    }
  }
  const frames = buildSpineFrames(centers);

  for (let row = 0; row < rows; row++) {
    const pr = profilePts[row];
    const radius = Math.max(0, pr.x);
    let pnx = pr.ty;
    let pny = -pr.tx;
    let pnl = Math.hypot(pnx, pny);
    if (pnl < 1e-9) {
      pnx = 1;
      pny = 0;
      pnl = 1;
    }
    pnx /= pnl;
    pny /= pnl;
    if (pnx < 0) {
      pnx = -pnx;
      pny = -pny;
    }

    const fr = frames[row] || {
      C: { x: 0, y: pr.y, z: 0 },
      T: { x: 0, y: 1, z: 0 },
      N: { x: 1, y: 0, z: 0 },
      B: { x: 0, y: 0, z: 1 },
    };

    for (let col = 0; col < steps; col++) {
      const o = orbitPts[col];
      const ct = o.x;
      const st = o.y;
      // Positions use raw orbit as a scale (same as classic lathe / Ranger).
      // Normals use the unit direction so non-circular orbits still shade cleanly.
      const olen = Math.hypot(ct, st);
      const nct = olen < 1e-9 ? 1 : ct / olen;
      const nst = olen < 1e-9 ? 0 : st / olen;

      const ox = fr.N.x * (radius * ct) + fr.B.x * (radius * st);
      const oy = fr.N.y * (radius * ct) + fr.B.y * (radius * st);
      const oz = fr.N.z * (radius * ct) + fr.B.z * (radius * st);
      positions.push(fr.C.x + ox, fr.C.y + oy, fr.C.z + oz);

      const nx = fr.N.x * (pnx * nct) + fr.T.x * pny + fr.B.x * (pnx * nst);
      const ny = fr.N.y * (pnx * nct) + fr.T.y * pny + fr.B.y * (pnx * nst);
      const nz = fr.N.z * (pnx * nct) + fr.T.z * pny + fr.B.z * (pnx * nst);
      const nl = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / nl, ny / nl, nz / nl);
      uvs.push(col / steps, rows <= 1 ? 0 : row / (rows - 1));
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    const colMax = closed ? steps : steps - 1;
    for (let c = 0; c < colMax; c++) {
      const cNext = c + 1 >= steps ? 0 : c + 1;
      const a = r * steps + c;
      const b = r * steps + cNext;
      const cc = (r + 1) * steps + cNext;
      const d = (r + 1) * steps + c;
      indices.push(a, d, b, b, d, cc);
    }
  }

  return { positions, normals, uvs, indices, rowSeg, colSeg, rows, steps };
}

/**
 * Unit-fit scale so major orbit radius R plus profile extent r fits in ~unit ball:
 * s = 1 / (R + r).
 */
export function torusUnitFitScale(profilePts, orbitPts) {
  let R = 0;
  let n = 0;
  for (const o of orbitPts || []) {
    const L = Math.hypot(o.x, o.y);
    if (L > 1e-9) {
      R += L;
      n++;
    }
  }
  R = n ? R / n : 1;
  let r = 0;
  for (const p of profilePts || []) {
    r = Math.max(r, Math.hypot(Math.max(0, p.x), p.y));
  }
  if (r < 1e-9) r = 0.25;
  return { scale: 1 / (R + r), majorR: R, tubeR: r };
}

/**
 * Torus / tube-sweep mode: profile travels along the orbit path as a ring.
 * Orbit = major path (XZ). Profile = tube cross-section in the path normal plane (N,B).
 * Everything is scaled so R_major + r_profile ≈ 1 (unit torus).
 * Spine modulates major radius (profile-spine.x) and lifts the ring (orbit-spine.x → Y).
 */
export function latheProfileAsTorusOnSpine(
  profilePts,
  orbitPts,
  closed,
  spineProfile,
  spineOrbit,
) {
  const rows = profilePts.length;
  const steps = orbitPts.length;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const rowSeg = profilePts.map((p) => p.segmentIndex | 0);
  const colSeg = orbitPts.map((p) => p.segmentIndex | 0);

  const { scale: fit } = torusUnitFitScale(profilePts, orbitPts);
  const pk = spineProfile?.knots || [];
  const ps = spineProfile?.segments || [];
  const ok = spineOrbit?.knots || [];
  const os = spineOrbit?.segments || [];
  const hasSp = pk.length >= 2;
  const hasSo = ok.length >= 2;

  // Major-path centers in XZ, unit-fit scaled; spine adjusts radius + lift.
  const centers = [];
  for (let col = 0; col < steps; col++) {
    const o = orbitPts[col];
    const u = steps <= 1 ? 0 : col / (steps - 1);
    let radialMul = 1;
    let liftY = 0;
    if (hasSp) {
      const sp = sampleSpineAt(pk, ps, u);
      radialMul = 1 + sp.x;
      if (radialMul < 0.05) radialMul = 0.05;
    }
    if (hasSo) {
      const so = sampleSpineAt(ok, os, u);
      liftY = so.x * fit;
    }
    centers.push({
      x: o.x * fit * radialMul,
      y: liftY,
      z: o.y * fit * radialMul,
    });
  }
  const frames = buildSpineFrames(centers);

  for (let row = 0; row < rows; row++) {
    const pr = profilePts[row];
    const px = Math.max(0, pr.x) * fit;
    const py = pr.y * fit;
    // Profile normal in the N–B plane (same 2D construction as lathe silhouette).
    let pnx = pr.ty;
    let pny = -pr.tx;
    let pnl = Math.hypot(pnx, pny);
    if (pnl < 1e-9) {
      pnx = 1;
      pny = 0;
      pnl = 1;
    }
    pnx /= pnl;
    pny /= pnl;
    if (pnx < 0) {
      pnx = -pnx;
      pny = -pny;
    }

    for (let col = 0; col < steps; col++) {
      const fr = frames[col] || {
        C: centers[col] || { x: 0, y: 0, z: 0 },
        T: { x: 0, y: 0, z: 1 },
        N: { x: 1, y: 0, z: 0 },
        B: { x: 0, y: 1, z: 0 },
      };
      // Tube cross-section: N·px + B·py (travels along T / orbit).
      const ox = fr.N.x * px + fr.B.x * py;
      const oy = fr.N.y * px + fr.B.y * py;
      const oz = fr.N.z * px + fr.B.z * py;
      positions.push(fr.C.x + ox, fr.C.y + oy, fr.C.z + oz);

      const nx = fr.N.x * pnx + fr.B.x * pny;
      const ny = fr.N.y * pnx + fr.B.y * pny;
      const nz = fr.N.z * pnx + fr.B.z * pny;
      const nl = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / nl, ny / nl, nz / nl);
      uvs.push(col / steps, rows <= 1 ? 0 : row / (rows - 1));
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    const colMax = closed ? steps : steps - 1;
    for (let c = 0; c < colMax; c++) {
      const cNext = c + 1 >= steps ? 0 : c + 1;
      const a = r * steps + c;
      const b = r * steps + cNext;
      const cc = (r + 1) * steps + cNext;
      const d = (r + 1) * steps + c;
      indices.push(a, d, b, b, d, cc);
    }
  }

  return { positions, normals, uvs, indices, rowSeg, colSeg, rows, steps };
}
