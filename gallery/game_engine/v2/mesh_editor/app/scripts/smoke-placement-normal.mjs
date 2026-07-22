#!/usr/bin/env node
// Smoke: placement normal defaults, alignment rotation, migration v5→v6.
import assert from "node:assert/strict";
import {
  defaultPlacementNormal,
  normalizePlacementNormal,
  placementNormalDirection3,
  rotationAligning,
  orientMeshToPlacementNormal,
  rotateFlatXyz,
} from "../src/lib/placementNormal.js";
import { migrateProject } from "../src/library/migrations.js";
import { CURRENT_SCHEMA_VERSION, validateProject } from "../src/library/schema.js";

const d = defaultPlacementNormal();
assert.deepEqual(d.start, { x: 0, y: -1 });
assert.deepEqual(d.end, { x: 0, y: 1 });
const dir = placementNormalDirection3(d);
assert.ok(Math.abs(dir.x) < 1e-9 && dir.y > 0.99 && Math.abs(dir.z) < 1e-9);

// Align +X → +Y
const m = rotationAligning({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
const p = rotateFlatXyz([1, 0, 0], m);
assert.ok(Math.abs(p[0]) < 1e-6 && Math.abs(p[1] - 1) < 1e-6 && Math.abs(p[2]) < 1e-6);

// Mesh with point on +X should flip to +Y when normal is +X
const mesh = {
  parts: [
    {
      positions: [0.5, 0, 0, 0.5, 0, 0.1],
      normals: [1, 0, 0, 1, 0, 0],
      uvs: [],
      indices: [0, 1, 0],
    },
  ],
};
const oriented = orientMeshToPlacementNormal(mesh, {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
});
assert.ok(Math.abs(oriented.parts[0].positions[0]) < 1e-6);
assert.ok(Math.abs(oriented.parts[0].positions[1] - 0.5) < 1e-6);

// Default normal → identity (same positions)
const same = orientMeshToPlacementNormal(mesh, defaultPlacementNormal());
assert.equal(same.parts[0].positions[0], 0.5);

const n = normalizePlacementNormal({ start: { x: "nope" }, end: {} });
assert.equal(n.start.y, -1);
assert.equal(n.end.y, 1);

const v5 = {
  kind: "ranger.splineProject",
  schemaVersion: 5,
  id: "t1",
  assetGuid: "g1",
  slug: "smoke-normal",
  name: "Smoke normal",
  description: "",
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  editor: {
    curveType: 0,
    pathSegments: 12,
    angularSteps: 24,
    revolutionDeg: 360,
    materialMode: 3,
    symmetry: true,
    viewMode: "profile",
    spineSource: "profile",
  },
  objectMaterial: { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" },
  profile: {
    knots: [
      { id: "p0", x: 0, y: -1, hx: 0, hy: 0, color: "#7ecf6a" },
      { id: "p1", x: 0.5, y: 0, hx: 0.1, hy: 0, color: "#6ec8ff" },
      { id: "p2", x: 0, y: 1, hx: 0, hy: 0, color: "#ffb454" },
    ],
    segments: [
      { fromId: "p0", toId: "p1", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "p1", toId: "p2", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
  },
  orbit: {
    knots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0.55, color: "#ffb454" },
      { id: "o1", x: 0, y: 1, hx: -0.55, hy: 0, color: "#e87ac8" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: -0.55, color: "#c8e87a" },
      { id: "o3", x: 0, y: -1, hx: 0.55, hy: 0, color: "#ff7a6a" },
    ],
    segments: [
      { fromId: "o0", toId: "o1", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "o1", toId: "o2", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "o2", toId: "o3", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
      { fromId: "o3", toId: "o0", pathType: "bezier", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
  },
  spineProfile: {
    knots: [
      { id: "spp0", x: 0, y: -1, hx: 0, hy: 0, color: "#c8e87a" },
      { id: "spp1", x: 0, y: 1, hx: 0, hy: 0, color: "#6ec8ff" },
    ],
    segments: [
      { fromId: "spp0", toId: "spp1", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
  },
  spineOrbit: {
    knots: [
      { id: "spo0", x: 0, y: -1, hx: 0, hy: 0, color: "#c8e87a" },
      { id: "spo1", x: 0, y: 1, hx: 0, hy: 0, color: "#6ec8ff" },
    ],
    segments: [
      { fromId: "spo0", toId: "spo1", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
  },
  embeddedAssets: {},
  children: [],
};

const mig = migrateProject(v5);
assert.equal(mig.ok, true, mig.errors?.join("; "));
assert.equal(mig.doc.schemaVersion, CURRENT_SCHEMA_VERSION);
assert.equal(CURRENT_SCHEMA_VERSION, 9);
assert.deepEqual(mig.doc.placementNormal.start, { x: 0, y: -1 });
assert.deepEqual(mig.doc.placementNormal.end, { x: 0, y: 1 });
assert.equal(mig.doc.editor.tessellationMode, "rotation");
const errs = validateProject(mig.doc);
assert.equal(errs.length, 0, errs.join("; "));

console.log("smoke-placement-normal: ok", { schema: mig.doc.schemaVersion });
