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
import { pointInPolygon, pathCentroid } from "../src/lib/pathModel.js";
import { migrateProject } from "../src/library/migrations.js";
import { CURRENT_SCHEMA_VERSION, buildProjectDocument } from "../src/library/schema.js";

const eye = createDefaultEyeTexture({ name: "TestEye" });
assert.equal(eye.kind, "eye");
assert.ok(eye.layers.some((L) => L.type === "eyeball"));
assert.ok(eye.layers.some((L) => L.type === "iris"));
assert.ok(eye.layers.some((L) => L.type === "pupil"));

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
