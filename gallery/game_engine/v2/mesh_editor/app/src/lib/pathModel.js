// ============================================================================
// pathModel.js — shared knot/segment helpers for mesh + texture spline editors.
// ============================================================================

import { evalSpan as evalPathSpan } from "./pathSample.js";
import { sampleOpenPath, sampleClosedPath } from "./pathSample.js";

export function knotUid() {
  return "k" + Math.random().toString(36).slice(2, 9);
}

export function defaultSegment(fromId, toId, pathType = "bezier") {
  return {
    fromId,
    toId,
    color: null,
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "gradient",
    textureData: null,
    textureAsset: null,
    pathType: pathType === "line" || pathType === "arc" ? pathType : "bezier",
    arcBulge: null,
  };
}

export function cloneSeg(s, fromId, toId) {
  return {
    ...s,
    fromId,
    toId,
    textureData: s.textureData || null,
    pathType: s.pathType === "line" || s.pathType === "arc" ? s.pathType : "bezier",
    arcBulge: s.arcBulge ?? null,
  };
}

export function syncOpenSegments(knots, segments, defaultPathType = "bezier") {
  const byPair = new Map();
  for (const s of segments || []) byPair.set(s.fromId + ">" + s.toId, s);
  const next = [];
  for (let i = 0; i < (knots?.length || 0) - 1; i++) {
    const fromId = knots[i].id;
    const toId = knots[i + 1].id;
    const exact = byPair.get(fromId + ">" + toId);
    next.push(exact ? cloneSeg(exact, fromId, toId) : defaultSegment(fromId, toId, defaultPathType));
  }
  return next;
}

export function syncClosedSegments(knots, segments, defaultPathType = "bezier") {
  const byPair = new Map();
  for (const s of segments || []) byPair.set(s.fromId + ">" + s.toId, s);
  const next = [];
  const n = knots?.length || 0;
  for (let i = 0; i < n; i++) {
    const fromId = knots[i].id;
    const toId = knots[(i + 1) % n].id;
    const exact = byPair.get(fromId + ">" + toId);
    next.push(exact ? cloneSeg(exact, fromId, toId) : defaultSegment(fromId, toId, defaultPathType));
  }
  return next;
}

export function makeEllipsePath({
  cx = 0,
  cy = 0,
  rx = 0.45,
  ry = 0.55,
  color = "#ffffff",
  n = 8,
} = {}) {
  const knots = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(t) * rx;
    const y = cy + Math.sin(t) * ry;
    // Approximate cubic handles for a circle/ellipse
    const tang = 0.5522847498;
    const tx = -Math.sin(t) * rx * tang;
    const ty = Math.cos(t) * ry * tang;
    knots.push({
      id: knotUid(),
      x,
      y,
      hx: tx / n,
      hy: ty / n,
      color,
    });
  }
  // Better ellipse handles: adjacent Bezier control for circular arc
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 4 * Math.tan(Math.PI / n) / 3;
    knots[i].hx = (-Math.sin(t) * rx * k) / 2;
    knots[i].hy = (Math.cos(t) * ry * k) / 2;
  }
  const segments = syncClosedSegments(knots, [], "bezier");
  for (const s of segments) s.color = color;
  return { knots, segments };
}

export function makeOpenArcPath({
  y = 0.15,
  halfWidth = 0.55,
  bulge = 0.2,
  color = "#c8a07a",
} = {}) {
  const knots = [
    { id: knotUid(), x: -halfWidth, y, hx: halfWidth * 0.25, hy: bulge, color },
    { id: knotUid(), x: 0, y: y + bulge, hx: halfWidth * 0.3, hy: 0, color },
    { id: knotUid(), x: halfWidth, y, hx: -halfWidth * 0.25, hy: -bulge * 0.2, color },
  ];
  const segments = syncOpenSegments(knots, [], "bezier");
  for (const s of segments) s.color = color;
  return { knots, segments };
}

/**
 * Sample open or closed path. Open paths here allow signed X (texture eyelids);
 * mesh profile sampling still uses pathSample.sampleOpenPath (x ≥ 0).
 */
export function samplePath(knots, segments, { closed = false, samplesPerSpan = 24, curveType = 0 } = {}) {
  if (closed) return sampleClosedPath(knots, segments, samplesPerSpan, curveType);
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
      const { p, tan } = evalPathSpan(a, b, t, opts);
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

export function pathCentroid(knots) {
  if (!knots?.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const k of knots) {
    x += k.x;
    y += k.y;
  }
  return { x: x / knots.length, y: y / knots.length };
}

export function translatePath(knots, dx, dy) {
  for (const k of knots) {
    k.x += dx;
    k.y += dy;
  }
}

/** Point-in-polygon (ray cast). poly = [{x,y}, ...] */
export function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-15) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Project point to nearest location on polygon edges. */
export function projectToPolygonBoundary(px, py, poly) {
  let best = { x: px, y: py };
  let bestD = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = px - a.x;
    const apy = py - a.y;
    const ab2 = abx * abx + aby * aby || 1;
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const qx = a.x + abx * t;
    const qy = a.y + aby * t;
    const d = (qx - px) * (qx - px) + (qy - py) * (qy - py);
    if (d < bestD) {
      bestD = d;
      best = { x: qx, y: qy };
    }
  }
  return best;
}

export function clampPointInPolygon(px, py, poly, inset = 0.02) {
  if (!poly?.length) return { x: px, y: py };
  if (pointInPolygon(px, py, poly)) return { x: px, y: py };
  const b = projectToPolygonBoundary(px, py, poly);
  const c = pathCentroid(poly);
  const dx = c.x - b.x;
  const dy = c.y - b.y;
  const L = Math.hypot(dx, dy) || 1;
  return { x: b.x + (dx / L) * inset, y: b.y + (dy / L) * inset };
}

/**
 * Keep a child closed path inside a parent polygon by translating if the
 * centroid escapes, then clamping outlier knots onto the boundary.
 */
export function constrainPathInside(knots, parentPoly) {
  if (!knots?.length || !parentPoly?.length) return;
  const c = pathCentroid(knots);
  if (!pointInPolygon(c.x, c.y, parentPoly)) {
    const clamped = clampPointInPolygon(c.x, c.y, parentPoly, 0.04);
    translatePath(knots, clamped.x - c.x, clamped.y - c.y);
  }
  for (const k of knots) {
    if (!pointInPolygon(k.x, k.y, parentPoly)) {
      const p = clampPointInPolygon(k.x, k.y, parentPoly, 0.015);
      k.x = p.x;
      k.y = p.y;
    }
  }
}

export function evalSpanOnPath(knots, segments, spanIndex, t, { closed = false, curveType = 0 } = {}) {
  const n = knots.length;
  if (n < 2) return null;
  const i = spanIndex;
  const a = knots[i];
  const b = knots[closed ? (i + 1) % n : i + 1];
  if (!a || !b) return null;
  const seg = segments[i];
  return evalPathSpan(a, b, t, {
    pathType: seg?.pathType || "bezier",
    curveType,
    arcBulge: seg?.arcBulge ?? null,
  });
}
