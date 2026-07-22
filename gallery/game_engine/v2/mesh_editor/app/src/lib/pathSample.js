// ============================================================================
// pathSample.js — per-segment path types (bezier | line | arc), SVG-path style.
// ============================================================================

import { SplineLathe } from "../../../tessellate/spline_lathe.mjs";

/** @typedef {'bezier'|'line'|'arc'} PathType */

export function normalizePathType(t) {
  if (t === "line" || t === "linear" || t === "L") return "line";
  if (t === "arc" || t === "A") return "arc";
  return "bezier";
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleLine(a, b, t) {
  return {
    p: { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) },
    tan: { x: b.x - a.x, y: b.y - a.y },
  };
}

function sampleBezier(a, b, t) {
  return {
    p: SplineLathe.bezierPoint(
      a.x,
      a.y,
      a.x + a.hx,
      a.y + a.hy,
      b.x - b.hx,
      b.y - b.hy,
      b.x,
      b.y,
      t,
    ),
    tan: SplineLathe.bezierTangent(
      a.x,
      a.y,
      a.x + a.hx,
      a.y + a.hy,
      b.x - b.hx,
      b.y - b.hy,
      b.x,
      b.y,
      t,
    ),
  };
}

function sampleCatmull(a, b, t) {
  return {
    p: SplineLathe.catmullPoint(a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, t),
    tan: SplineLathe.catmullTangent(a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, t),
  };
}

function circumcenter(ax, ay, bx, by, cx, cy) {
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-12) return null;
  const ax2 = ax * ax + ay * ay;
  const bx2 = bx * bx + by * by;
  const cx2 = cx * cx + cy * cy;
  const ux = (ax2 * (by - cy) + bx2 * (cy - ay) + cx2 * (ay - by)) / d;
  const uy = (ax2 * (cx - bx) + bx2 * (ax - cx) + cx2 * (bx - ax)) / d;
  return { x: ux, y: uy };
}

function angleDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Circular arc A→B. `bulge` = signed sagitta (distance of arc midpoint from chord).
 * Positive = left of A→B chord.
 */
export function sampleArc(a, b, t, bulge) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const chord = Math.hypot(dx, dy);
  if (chord < 1e-9) return sampleLine(a, b, t);
  const nx = -dy / chord;
  const ny = dx / chord;
  const bul =
    bulge != null && Number.isFinite(bulge) ? bulge : defaultArcBulge(a, b);
  if (Math.abs(bul) < 1e-9) return sampleLine(a, b, t);

  const mx = (a.x + b.x) / 2 + nx * bul;
  const my = (a.y + b.y) / 2 + ny * bul;
  const c = circumcenter(a.x, a.y, mx, my, b.x, b.y);
  if (!c) return sampleLine(a, b, t);

  const a0 = Math.atan2(a.y - c.y, a.x - c.x);
  const am = Math.atan2(my - c.y, mx - c.x);
  const a1 = Math.atan2(b.y - c.y, b.x - c.x);
  const sweep = angleDelta(a0, am) + angleDelta(am, a1);
  const ang = a0 + sweep * t;
  const r = Math.hypot(a.x - c.x, a.y - c.y);
  const s = Math.sign(sweep) || 1;
  return {
    p: { x: c.x + r * Math.cos(ang), y: c.y + r * Math.sin(ang) },
    tan: { x: -r * Math.sin(ang) * s, y: r * Math.cos(ang) * s },
  };
}

export function defaultArcBulge(a, b) {
  const chord = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  // Prefer handle bias when present
  const hx = a.hx || 0;
  const hy = a.hy || 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cross = dx * hy - dy * hx;
  const sign = cross === 0 ? 1 : Math.sign(cross);
  return sign * chord * 0.25;
}

/**
 * Evaluate one span. `curveType` 0=bezier family, 1=catmull (only when pathType bezier).
 */
export function evalSpan(a, b, t, { pathType = "bezier", curveType = 0, arcBulge = null } = {}) {
  const kind = normalizePathType(pathType);
  if (kind === "line") return sampleLine(a, b, t);
  if (kind === "arc") return sampleArc(a, b, t, arcBulge);
  if (curveType === 1) return sampleCatmull(a, b, t);
  return sampleBezier(a, b, t);
}

/**
 * Sample an open knot chain (profile). Each span uses segments[i].pathType.
 * @returns {{ x:number, y:number, tx:number, ty:number, segmentIndex:number, t:number }[]}
 */
export function sampleOpenPath(knots, segments, samplesPerSpan, curveType = 0) {
  const pts = [];
  if (!knots || knots.length < 2) return pts;
  const segN = Math.max(1, samplesPerSpan | 0);
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i];
    const b = knots[i + 1];
    const seg = segments?.[i];
    const opts = {
      pathType: seg?.pathType || "bezier",
      curveType,
      arcBulge: seg?.arcBulge ?? null,
    };
    const last = i < knots.length - 2 ? segN - 1 : segN;
    for (let s = 0; s <= last; s++) {
      const t = s / segN;
      const { p, tan } = evalSpan(a, b, t, opts);
      pts.push({
        x: Math.max(0, p.x),
        y: p.y,
        tx: tan.x,
        ty: tan.y,
        segmentIndex: i,
        t,
      });
    }
  }
  return pts;
}

/**
 * Sample a closed knot loop (orbit). segments.length === knots.length.
 */
export function sampleClosedPath(knots, segments, samplesPerSpan, curveType = 0) {
  const pts = [];
  if (!knots || knots.length < 2) return pts;
  const n = knots.length;
  const segN = Math.max(1, samplesPerSpan | 0);
  for (let i = 0; i < n; i++) {
    const a = knots[i];
    const b = knots[(i + 1) % n];
    const seg = segments?.[i];
    const opts = {
      pathType: seg?.pathType || "bezier",
      curveType,
      arcBulge: seg?.arcBulge ?? null,
    };
    for (let s = 0; s < segN; s++) {
      const t = s / segN;
      const { p, tan } = evalSpan(a, b, t, opts);
      pts.push({
        x: p.x,
        y: p.y,
        tx: tan.x,
        ty: tan.y,
        segmentIndex: i,
        t,
      });
    }
  }
  return pts;
}

/**
 * Revolve a sampled open profile around Y using orbit direction samples (ox, oy).
 * Returns a single mesh buffer (all profile rows × orbit cols) plus rowSeg meta.
 *
 * Closed meshes emit an extra seam column (duplicate of col 0 at u=1) so wrap
 * faces interpolate (steps-1)/steps → 1 instead of crossing the whole atlas.
 */
export function latheProfileWithOrbit(profilePts, orbitPts, closed) {
  const rows = profilePts.length;
  const steps = orbitPts.length;
  const vertCols = closed ? steps + 1 : steps;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const rowSeg = profilePts.map((p) => p.segmentIndex | 0);
  const colSeg = orbitPts.map((p) => p.segmentIndex | 0);

  for (let row = 0; row < rows; row++) {
    const pr = profilePts[row];
    const radius = Math.max(0, pr.x);
    const yy = pr.y;
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
    const v = rows <= 1 ? 0 : row / (rows - 1);

    for (let col = 0; col < steps; col++) {
      const o = orbitPts[col];
      const ct = o.x;
      const st = o.y;
      const olen = Math.hypot(ct, st);
      const nct = olen < 1e-9 ? 1 : ct / olen;
      const nst = olen < 1e-9 ? 0 : st / olen;
      positions.push(radius * ct, yy, radius * st);
      normals.push(pnx * nct, pny, pnx * nst);
      uvs.push(col / steps, v);
    }
    if (closed) {
      const base = positions.length - steps * 3;
      positions.push(positions[base], positions[base + 1], positions[base + 2]);
      normals.push(normals[base], normals[base + 1], normals[base + 2]);
      uvs.push(1, v);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    const colMax = closed ? steps : steps - 1;
    for (let c = 0; c < colMax; c++) {
      const cNext = c + 1;
      const a = r * vertCols + c;
      const b = r * vertCols + cNext;
      const cc = (r + 1) * vertCols + cNext;
      const d = (r + 1) * vertCols + c;
      indices.push(a, d, b, b, d, cc);
    }
  }

  return { positions, normals, uvs, indices, rowSeg, colSeg, rows, steps, vertCols };
}

/**
 * Split a full lathe mesh into profileSeg × orbitSeg parts (own buffers).
 */
export function splitLatheBySegments(mesh, numProfileSegs, numOrbitSegs, closed) {
  const { positions, normals, uvs, rowSeg, colSeg, rows, steps } = mesh;
  const vertCols =
    mesh.vertCols || (closed ? steps + 1 : steps);
  const out = [];

  for (let pi = 0; pi < numProfileSegs; pi++) {
    for (let oi = 0; oi < numOrbitSegs; oi++) {
      const faces = [];
      for (let r = 0; r < rows - 1; r++) {
        if ((rowSeg[r] | 0) !== pi && (rowSeg[r + 1] | 0) !== pi) {
          // allow row on boundary: use rowSeg[r]
        }
        if ((rowSeg[r] | 0) !== pi) continue;
        const colMax = closed ? steps : steps - 1;
        for (let c = 0; c < colMax; c++) {
          if ((colSeg[c] | 0) !== oi) continue;
          const cNext = c + 1;
          const a = r * vertCols + c;
          const b = r * vertCols + cNext;
          const cc = (r + 1) * vertCols + cNext;
          const d = (r + 1) * vertCols + c;
          faces.push(a, d, b, b, d, cc);
        }
      }
      if (!faces.length) continue;

      const used = new Map();
      const p = [];
      const n = [];
      const u = [];
      const idx = [];
      const mapV = (g) => {
        let local = used.get(g);
        if (local != null) return local;
        local = used.size;
        used.set(g, local);
        const i3 = g * 3;
        const i2 = g * 2;
        p.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        n.push(normals[i3], normals[i3 + 1], normals[i3 + 2]);
        u.push(uvs[i2], uvs[i2 + 1]);
        return local;
      };
      for (let i = 0; i < faces.length; i++) idx.push(mapV(faces[i]));
      out.push({ profileSeg: pi, orbitSeg: oi, positions: p, normals: n, uvs: u, indices: idx });
    }
  }
  return out;
}
