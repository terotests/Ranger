#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  createDefaultEyeTexture,
  serializeEyeTexture,
  normalizeEyeTexture,
  constrainAllEyeLayers,
  findLayer,
  layerPolygon,
} from "../src/lib/texture/eyeTexture.js";
import {
  pointInPolygon,
  pathCentroid,
  autoSmoothHandles,
  rebuildClosedYSymmetry,
  makeEllipsePath,
  CIRCLE_BEZIER_KAPPA,
  samplePath,
} from "../src/lib/pathModel.js";
import { migrateProject } from "../src/library/migrations.js";
import { CURRENT_SCHEMA_VERSION, buildProjectDocument } from "../src/library/schema.js";

const eye = createDefaultEyeTexture({ name: "TestEye" });
assert.equal(eye.kind, "eye");
assert.ok(eye.layers.some((L) => L.type === "eyeball"));
assert.ok(eye.layers.some((L) => L.type === "iris"));
assert.ok(eye.layers.some((L) => L.type === "pupil"));

// Default eyeball: 4-knot circle like Mesh Orbit (κ handles, not a square)
const eyeball = findLayer(eye, "eyeball");
assert.equal(eyeball.knots.length, 4, "eyeball starts with 4 knots");
const rightTip = eyeball.knots.find((k) => k.x > 0.5);
assert.ok(rightTip, "right tip");
assert.ok(
  Math.abs(Math.abs(rightTip.hy) - 0.72 * CIRCLE_BEZIER_KAPPA) < 1e-6,
  `orbit-like κ handle, got hy=${rightTip.hy}`,
);
// Sampled radius should stay near 0.72 (square would bulge on diagonals)
const eyePts = samplePath(eyeball.knots, eyeball.segments, { closed: true, samplesPerSpan: 16 });
let maxR = 0;
let minR = Infinity;
for (const p of eyePts) {
  const r = Math.hypot(p.x, p.y);
  maxR = Math.max(maxR, r);
  minR = Math.min(minR, r);
}
assert.ok(maxR - minR < 0.04, `near-circular (maxR-minR=${maxR - minR})`);

const ell = makeEllipsePath({ cx: 0, cy: 0, rx: 1, ry: 1, n: 4 });
assert.equal(ell.knots.length, 4);
assert.ok(Math.abs(ell.knots[0].hy - CIRCLE_BEZIER_KAPPA) < 1e-9);
// Auto-smooth should keep finite handles
for (const k of ell.knots) {
  k.hx = 0;
  k.hy = 0;
}
autoSmoothHandles(ell.knots, { closed: true });
assert.ok(ell.knots.some((k) => Math.hypot(k.hx, k.hy) > 0.01), "auto-smooth sets handles");

// Y-symmetry rebuild: move right tip, left should mirror about centroid X
const right = ell.knots.find((k) => k.x > 0.5);
right.x = 0.9;
right.y = 0.05;
rebuildClosedYSymmetry(ell.knots);
const ax = pathCentroid(ell.knots).x;
const right2 = ell.knots.find((k) => k.x > ax + 0.3);
const left = ell.knots.find((k) => k.x < ax - 0.3);
assert.ok(right2 && left, "left/right tips exist after symmetry rebuild");
assert.ok(Math.abs(right2.x - ax - (ax - left.x)) < 1e-6, "left mirrors right about centroid");
assert.ok(Math.abs(left.y - right2.y) < 1e-6, "left mirrors right y");

// Move iris far outside, then constrain — centroid should land inside eyeball
const iris = findLayer(eye, "iris");
for (const k of iris.knots) {
  k.x += 5;
  k.y += 5;
}
constrainAllEyeLayers(eye);
const eyePoly = layerPolygon(findLayer(eye, "eyeball"));
const c = pathCentroid(iris.knots);
assert.ok(pointInPolygon(c.x, c.y, eyePoly), "iris centroid inside eyeball after constrain");

const pupil = findLayer(eye, "pupil");
for (const k of pupil.knots) {
  k.x = iris.knots[0].x + 3;
  k.y = iris.knots[0].y + 3;
}
constrainAllEyeLayers(eye);
const irisPoly = layerPolygon(findLayer(eye, "iris"));
const pc = pathCentroid(pupil.knots);
assert.ok(pointInPolygon(pc.x, pc.y, irisPoly), "pupil centroid inside iris after constrain");

const ser = serializeEyeTexture(eye);
const again = normalizeEyeTexture(ser);
assert.equal(again.name, "TestEye");
assert.equal(again.layers.length, eye.layers.length);

// Schema v9 migrate round-trip
const doc = buildProjectDocument({
  state: {
    assetGuid: "root-g",
    curveType: 0,
    pathSegments: 12,
    angularSteps: 24,
    revolutionDeg: 360,
    tessellationMode: "rotation",
    materialMode: 3,
    symmetry: true,
    viewMode: "profile",
    spineSource: "profile",
    objectMaterial: { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" },
    knots: [
      { id: "a", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
      { id: "b", x: 0.4, y: 1, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [
      {
        fromId: "a",
        toId: "b",
        pathType: "line",
        roughness: 0.4,
        metalness: 0,
        opacity: 1,
        texture: "gradient",
        color: null,
      },
    ],
    orbitKnots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0.55, color: "#fff" },
      { id: "o1", x: 0, y: 1, hx: -0.55, hy: 0, color: "#fff" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: -0.55, color: "#fff" },
      { id: "o3", x: 0, y: -1, hx: 0.55, hy: 0, color: "#fff" },
    ],
    orbitSegments: [
      { fromId: "o0", toId: "o1", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "o1", toId: "o2", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "o2", toId: "o3", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "o3", toId: "o0", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
    spineProfileKnots: [
      { id: "s0", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
      { id: "s1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
    ],
    spineProfileSegments: [
      { fromId: "s0", toId: "s1", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
    spineOrbitKnots: [
      { id: "t0", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
      { id: "t1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
    ],
    spineOrbitSegments: [
      { fromId: "t0", toId: "t1", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
    placementNormal: { start: { x: 0, y: -1 }, end: { x: 0, y: 1 } },
    embeddedAssets: {},
    children: [],
    textureAssets: { [ser.assetGuid]: ser },
  },
  name: "With eye texture",
  slug: "with-eye",
});
assert.equal(doc.schemaVersion, 9);
assert.ok(doc.textureAssets[ser.assetGuid]);

const mig = migrateProject(doc);
assert.equal(mig.ok, true, mig.errors?.join("; "));
assert.equal(CURRENT_SCHEMA_VERSION, 9);
assert.equal(mig.doc.schemaVersion, 9);
assert.ok(mig.doc.textureAssets[ser.assetGuid].layers.length >= 4);

console.log("smoke-eye-texture: ok", {
  schema: mig.doc.schemaVersion,
  layers: mig.doc.textureAssets[ser.assetGuid].layers.map((L) => L.type),
});
