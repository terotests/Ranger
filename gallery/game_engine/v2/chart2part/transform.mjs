// ============================================================================
// transform.mjs — the chart→part transformer (calibration + 2D→3D lift).
// ============================================================================
// Pure math, shared by the scene build (to place parts) and the validator (to
// know where each part SHOULD be). Single source of truth for the mapping, so
// the render and the check can never disagree.
//
// The chart is an orthographic PLAN view, so the mapping is a SIMILARITY:
// chart(px,py) → world(X,Z) = uniform scale + translation (no shear). One scale
// for both axes keeps circles round (see PROCESS.md §2, §4b).
// ============================================================================

// Build the calibration from the playfield inner-wall box + a chosen world width.
export function makeCalibration(c) {
  const s = c.worldW / (c.xR - c.xL);        // world units per chart pixel (uniform)
  const cx = (c.xL + c.xR) / 2;
  const cz = (c.yT + c.yB) / 2;
  return {
    s, cx, cz,
    worldX: (px) => (px - cx) * s,
    worldZ: (py) => (py - cz) * s,
    // playfield world box (top of chart → −Z, bottom → +Z)
    halfW: (c.xR - c.xL) * s / 2,
    zMin: (c.yT - cz) * s,
    zMax: (c.yB - cz) * s,
    width: (c.xR - c.xL) * s,
    length: (c.yB - c.yT) * s,
  };
}

// A flipper: measured shaft-hole (pivot) + tip centers and end diameters.
// The pivot→tip spine gives location, orientation and the collider at once
// (medial-axis insight, PROCESS.md §4b).
export function liftFlipper(cal, m) {
  const pivot = { x: cal.worldX(m.pivotPx[0]), z: cal.worldZ(m.pivotPx[1]) };
  const tip = { x: cal.worldX(m.tipPx[0]), z: cal.worldZ(m.tipPx[1]) };
  const dx = tip.x - pivot.x, dz = tip.z - pivot.z;
  const length = Math.hypot(dx, dz);
  // rotation.y convention: world dir of local +X is (cos a, -sin a) in (X,Z)
  const angle = Math.atan2(-dz, dx);
  return {
    type: "flipper", pivot, tip, length, angle,
    baseR: (m.baseDiaPx * cal.s) / 2,
    tipR: (m.tipDiaPx * cal.s) / 2,
    y: m.y != null ? m.y : 0.0,
  };
}

// A disc-footprint part (bumper cap, spinner): center + outer diameter.
export function liftDisc(cal, m) {
  return {
    type: "disc",
    center: { x: cal.worldX(m.centerPx[0]), z: cal.worldZ(m.centerPx[1]) },
    r: (m.diaPx * cal.s) / 2,
    y: m.y != null ? m.y : 0.0,
  };
}

// A triangle / polygon part (slingshot rebound): corner px → world corners.
export function liftTriangle(cal, m) {
  return {
    type: "triangle",
    corners: m.cornersPx.map((p) => ({ x: cal.worldX(p[0]), z: cal.worldZ(p[1]) })),
    y: m.y != null ? m.y : 0.0,
  };
}

// A polyline (guide wire / rail): each px point → world.
export function liftPolyline(cal, m) {
  return {
    type: "polyline",
    points: m.pointsPx.map((p) => ({ x: cal.worldX(p[0]), z: cal.worldZ(p[1]) })),
    y: m.y != null ? m.y : 0.0,
  };
}

const LIFTERS = { flipper: liftFlipper, disc: liftDisc, triangle: liftTriangle, polyline: liftPolyline };

// Compute every part in a chart file to world space.
// chart = { calibration:{…}, parts:{ name:{ type, …px… } } }
export function computeParts(chart) {
  const cal = makeCalibration(chart.calibration);
  const out = { calibration: cal, parts: {} };
  for (const [name, m] of Object.entries(chart.parts || {})) {
    const lift = LIFTERS[m.type];
    if (!lift) throw new Error(`no lifter for part type '${m.type}' (${name})`);
    out.parts[name] = lift(cal, m);
  }
  return out;
}
