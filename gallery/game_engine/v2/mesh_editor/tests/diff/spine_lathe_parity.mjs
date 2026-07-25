// ============================================================================
// spine_lathe_parity.mjs — JS reference vs Ranger port, same inputs, same mesh.
// ============================================================================
//
//   node gallery/game_engine/v2/mesh_editor/tests/diff/spine_lathe_parity.mjs
//
// The spine/orbit lathe kernel exists twice while it is being moved into
// Ranger: the original browser-only JS (`app/src/lib/spineLathe.js`) and the
// portable Ranger implementation (`tessellate/spline_lathe.rgr` →
// `SplineLathe.latheOnSpine`, which also lowers to native/wasm32).
//
// A port is only safe if it is bit-comparable on real inputs, so this drives
// both with identical sampled profile/orbit/centre arrays and diffs every
// position, normal, uv and index. It is the gate that lets the JS kernel be
// deleted later: while it is green, the Ranger side is a drop-in.
//
// Prints the v2 grep convention: "  PASS/FAIL <name>", "passed=X failed=Y",
// "ALL PASS" / "SOME FAILED".
// ============================================================================

import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const APP_LIB = path.resolve(HERE, "../../app/src/lib");

const { SplineLathe } = await import(
  url.pathToFileURL(path.resolve(HERE, "../../tessellate/spline_lathe.mjs")).href
);
const {
  latheProfileWithOrbitOnSpineJs,
  latheProfileAsTorusOnSpineJs,
  torusUnitFitScale,
  sampleSpineAt,
  defaultSpineKnots,
  defaultSpineSegments,
} = await import(url.pathToFileURL(path.join(APP_LIB, "spineLathe.js")).href);
const { sampleOpenPath, sampleClosedPath } = await import(
  url.pathToFileURL(path.join(APP_LIB, "pathSample.js")).href
);

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const EPS = 1e-9;

function knot(id, x, y, hx = 0, hy = 0) {
  return { id, x, y, hx, hy };
}
function segsFor(knots, pathType = "bezier") {
  const out = [];
  for (let i = 0; i < knots.length - 1; i++)
    out.push({ from: knots[i].id, to: knots[i + 1].id, pathType });
  return out;
}
function closedSegsFor(knots, pathType = "bezier") {
  const out = [];
  for (let i = 0; i < knots.length; i++)
    out.push({ from: knots[i].id, to: knots[(i + 1) % knots.length].id, pathType });
  return out;
}

/**
 * Replicates the centre-line derivation inside latheProfileWithOrbitOnSpine so
 * the Ranger entry point — which takes centres directly, keeping its ABI to
 * primitive arrays — is fed exactly what the JS computes internally.
 */
function centersFor(profilePts, spineProfile, spineOrbit) {
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
  const cx = [];
  const cy = [];
  const cz = [];
  for (const pr of profilePts) {
    const u = (pr.y - yMin) / ySpan;
    if (pk.length >= 2 && ok.length >= 2) {
      const sp = sampleSpineAt(pk, ps, u);
      const so = sampleSpineAt(ok, os, u);
      cx.push(sp.x); cy.push(sp.y); cz.push(so.x);
    } else if (pk.length >= 2) {
      const sp = sampleSpineAt(pk, ps, u);
      cx.push(sp.x); cy.push(sp.y); cz.push(0);
    } else if (ok.length >= 2) {
      const so = sampleSpineAt(ok, os, u);
      cx.push(0); cy.push(so.y); cz.push(so.x);
    } else {
      cx.push(0); cy.push(pr.y); cz.push(0);
    }
  }
  return { cx, cy, cz };
}

function maxAbsDiff(a, b) {
  if (a.length !== b.length) return { lenMismatch: [a.length, b.length], diff: Infinity, at: -1 };
  let worst = 0;
  let at = -1;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (d > worst) {
      worst = d;
      at = i;
    }
  }
  return { diff: worst, at };
}

function runCase(name, { profileKnots, orbitKnots, closed, spineProfile, spineOrbit, pathSegments = 8, orbitSamples = 12 }) {
  const profilePts = sampleOpenPath(profileKnots, segsFor(profileKnots), pathSegments, 0);
  const orbitPts = sampleClosedPath(orbitKnots, closedSegsFor(orbitKnots), orbitSamples, 0);
  const usedOrbit = closed ? orbitPts : orbitPts.slice(0, Math.max(2, Math.floor(orbitPts.length / 2)));

  const js = latheProfileWithOrbitOnSpineJs(profilePts, usedOrbit, closed, spineProfile, spineOrbit);
  const { cx, cy, cz } = centersFor(profilePts, spineProfile, spineOrbit);

  const rg = SplineLathe.latheOnSpine(
    profilePts.map((p) => p.x),
    profilePts.map((p) => p.y),
    profilePts.map((p) => p.tx),
    profilePts.map((p) => p.ty),
    profilePts.map((p) => p.segmentIndex | 0),
    usedOrbit.map((p) => p.x),
    usedOrbit.map((p) => p.y),
    usedOrbit.map((p) => p.segmentIndex | 0),
    cx,
    cy,
    cz,
    closed,
  );

  check(`${name}: mesh is non-empty`, js.positions.length > 0 && rg.positions.length > 0, `js=${js.positions.length} rg=${rg.positions.length}`);

  const pos = maxAbsDiff(js.positions, Array.from(rg.positions));
  check(`${name}: positions match`, pos.diff <= EPS, pos.lenMismatch ? `length ${pos.lenMismatch}` : `max|Δ|=${pos.diff} at ${pos.at}`);

  const nrm = maxAbsDiff(js.normals, Array.from(rg.normals));
  check(`${name}: normals match`, nrm.diff <= EPS, nrm.lenMismatch ? `length ${nrm.lenMismatch}` : `max|Δ|=${nrm.diff} at ${nrm.at}`);

  const uv = maxAbsDiff(js.uvs, Array.from(rg.uvs));
  check(`${name}: uvs match`, uv.diff <= EPS, uv.lenMismatch ? `length ${uv.lenMismatch}` : `max|Δ|=${uv.diff} at ${uv.at}`);

  const idx = maxAbsDiff(js.indices, Array.from(rg.indices));
  check(`${name}: indices match`, idx.diff === 0, idx.lenMismatch ? `length ${idx.lenMismatch}` : `differs at ${idx.at}`);

  check(`${name}: grid shape matches`, rg.rows === js.rows && rg.steps === js.steps && rg.vertCols === js.vertCols, `rg=${rg.rows}x${rg.steps}/${rg.vertCols} js=${js.rows}x${js.steps}/${js.vertCols}`);
}

/**
 * Torus centres: the major ring in XZ, unit-fit scaled, with the profile spine
 * modulating radius and the orbit spine lifting Y. Mirrors the block inside
 * latheProfileAsTorusOnSpine so the Ranger entry point gets identical centres.
 */
function torusCentersFor(profilePts, orbitPts, spineProfile, spineOrbit) {
  const { scale: fit } = torusUnitFitScale(profilePts, orbitPts);
  const pk = spineProfile?.knots || [];
  const ps = spineProfile?.segments || [];
  const ok = spineOrbit?.knots || [];
  const os = spineOrbit?.segments || [];
  const hasSp = pk.length >= 2;
  const hasSo = ok.length >= 2;
  const steps = orbitPts.length;
  const cx = [];
  const cy = [];
  const cz = [];
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
    cx.push(o.x * fit * radialMul);
    cy.push(liftY);
    cz.push(o.y * fit * radialMul);
  }
  return { cx, cy, cz, fit };
}

function runTorusCase(name, { profileKnots, orbitKnots, closed, spineProfile, spineOrbit, pathSegments = 8, orbitSamples = 12 }) {
  const profilePts = sampleOpenPath(profileKnots, segsFor(profileKnots), pathSegments, 0);
  const orbitPts = sampleClosedPath(orbitKnots, closedSegsFor(orbitKnots), orbitSamples, 0);
  const usedOrbit = closed ? orbitPts : orbitPts.slice(0, Math.max(2, Math.floor(orbitPts.length / 2)));

  const js = latheProfileAsTorusOnSpineJs(profilePts, usedOrbit, closed, spineProfile, spineOrbit);
  const { cx, cy, cz, fit } = torusCentersFor(profilePts, usedOrbit, spineProfile, spineOrbit);

  const rgFit = SplineLathe.torusUnitFitScale(
    profilePts.map((p) => p.x),
    profilePts.map((p) => p.y),
    usedOrbit.map((p) => p.x),
    usedOrbit.map((p) => p.y),
  );
  check(`${name}: unit-fit scale matches`, Math.abs(rgFit - fit) <= EPS, `rg=${rgFit} js=${fit}`);

  const rg = SplineLathe.torusOnSpine(
    profilePts.map((p) => p.x),
    profilePts.map((p) => p.y),
    profilePts.map((p) => p.tx),
    profilePts.map((p) => p.ty),
    profilePts.map((p) => p.segmentIndex | 0),
    usedOrbit.map((p) => p.x),
    usedOrbit.map((p) => p.y),
    usedOrbit.map((p) => p.segmentIndex | 0),
    cx,
    cy,
    cz,
    rgFit,
    closed,
  );

  check(`${name}: mesh is non-empty`, js.positions.length > 0 && rg.positions.length > 0, `js=${js.positions.length} rg=${rg.positions.length}`);

  const pos = maxAbsDiff(js.positions, Array.from(rg.positions));
  check(`${name}: positions match`, pos.diff <= EPS, pos.lenMismatch ? `length ${pos.lenMismatch}` : `max|Δ|=${pos.diff} at ${pos.at}`);

  const nrm = maxAbsDiff(js.normals, Array.from(rg.normals));
  check(`${name}: normals match`, nrm.diff <= EPS, nrm.lenMismatch ? `length ${nrm.lenMismatch}` : `max|Δ|=${nrm.diff} at ${nrm.at}`);

  const uv = maxAbsDiff(js.uvs, Array.from(rg.uvs));
  check(`${name}: uvs match`, uv.diff <= EPS, uv.lenMismatch ? `length ${uv.lenMismatch}` : `max|Δ|=${uv.diff} at ${uv.at}`);

  const idx = maxAbsDiff(js.indices, Array.from(rg.indices));
  check(`${name}: indices match`, idx.diff === 0, idx.lenMismatch ? `length ${idx.lenMismatch}` : `differs at ${idx.at}`);
}

// --- inputs ------------------------------------------------------------------
const profile = [
  knot("p0", 0, -1, 0.2, 0),
  knot("p1", 0.5, 0, 0, 0.3),
  knot("p2", 0, 1, -0.2, 0),
];
const K = 0.55228475;
const orbit = [
  knot("o0", 1, 0, 0, K),
  knot("o1", 0, 1, -K, 0),
  knot("o2", -1, 0, 0, -K),
  knot("o3", 0, -1, K, 0),
];
const straightSpine = { knots: defaultSpineKnots(() => "s" + Math.random().toString(36).slice(2, 9)), segments: null };
straightSpine.segments = defaultSpineSegments(straightSpine.knots);

const bentSpine = {
  knots: [knot("b0", 0, -1), knot("b1", 0.35, 0), knot("b2", 0, 1)],
};
bentSpine.segments = segsFor(bentSpine.knots, "line");

console.log("### mesh_editor/tests/diff/spine_lathe_parity");

runCase("no spine, closed 360", { profileKnots: profile, orbitKnots: orbit, closed: true });
runCase("no spine, open 180", { profileKnots: profile, orbitKnots: orbit, closed: false });
runCase("straight spine, closed", { profileKnots: profile, orbitKnots: orbit, closed: true, spineProfile: straightSpine });
runCase("bent profile spine, closed", { profileKnots: profile, orbitKnots: orbit, closed: true, spineProfile: bentSpine });
runCase("bent orbit spine, closed", { profileKnots: profile, orbitKnots: orbit, closed: true, spineOrbit: bentSpine });
runCase("both spines bent, closed", { profileKnots: profile, orbitKnots: orbit, closed: true, spineProfile: bentSpine, spineOrbit: bentSpine });
runCase("dense sampling", { profileKnots: profile, orbitKnots: orbit, closed: true, spineProfile: bentSpine, pathSegments: 16, orbitSamples: 24 });

runTorusCase("torus, no spine", { profileKnots: profile, orbitKnots: orbit, closed: true });
runTorusCase("torus, open ring", { profileKnots: profile, orbitKnots: orbit, closed: false });
runTorusCase("torus, radius-modulating profile spine", { profileKnots: profile, orbitKnots: orbit, closed: true, spineProfile: bentSpine });
runTorusCase("torus, lifting orbit spine", { profileKnots: profile, orbitKnots: orbit, closed: true, spineOrbit: bentSpine });
runTorusCase("torus, both spines", { profileKnots: profile, orbitKnots: orbit, closed: true, spineProfile: bentSpine, spineOrbit: bentSpine });

console.log(`passed=${passed} failed=${failed}`);
console.log(failed === 0 ? "ALL PASS" : "SOME FAILED");
process.exit(failed === 0 ? 0 : 1);
