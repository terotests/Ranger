#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  rayFromCanvas,
  intersectTriangle,
  raycastMeshParts,
  applyPreviewEuler,
  applyPreviewEulerInv,
} from "../src/lib/meshPick.js";
import { migrateProject } from "../src/library/migrations.js";
import { CURRENT_SCHEMA_VERSION } from "../src/library/schema.js";

// Unit square in XY at z=0, facing +Z
const parts = [
  {
    positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2, 0, 2, 3],
  },
];

const t = intersectTriangle(
  [0, 0, 2],
  [0, 0, -1],
  [-1, -1, 0],
  [1, -1, 0],
  [1, 1, 0],
);
assert.ok(t != null && Math.abs(t - 2) < 1e-6);

const hit = raycastMeshParts([0, 0, 3], [0, 0, -1], parts);
assert.ok(hit);
assert.ok(Math.abs(hit.point[2]) < 1e-5);
assert.ok(hit.normal[2] > 0.9);

const tagged = [{ ...parts[0], instanceGuid: "child-a" }];
const hitTagged = raycastMeshParts([0, 0, 3], [0, 0, -1], tagged);
assert.equal(hitTagged?.instanceGuid, "child-a");

const view = {
  cam: [0, 0, 4],
  target: [0, 0, 0],
  fovDeg: 45,
  width: 400,
  height: 400,
};
const { origin, dir } = rayFromCanvas(200, 200, view);
assert.ok(dir[2] < -0.5);

const p = [1, 0, 0];
const e = applyPreviewEuler(p, 0.12, 0.5);
const back = applyPreviewEulerInv(e, 0.12, 0.5);
assert.ok(Math.hypot(back[0] - 1, back[1], back[2]) < 1e-6);

const v7 = {
  kind: "ranger.splineProject",
  schemaVersion: 7,
  id: "t",
  assetGuid: "g",
  slug: "p",
  name: "P",
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
    tessellationMode: "rotation",
  },
  objectMaterial: { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" },
  placementNormal: { start: { x: 0, y: -1 }, end: { x: 0, y: 1 } },
  profile: {
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
  },
  orbit: {
    knots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0.55, color: "#fff" },
      { id: "o1", x: 0, y: 1, hx: -0.55, hy: 0, color: "#fff" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: -0.55, color: "#fff" },
      { id: "o3", x: 0, y: -1, hx: 0.55, hy: 0, color: "#fff" },
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
      { id: "s0", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
      { id: "s1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [
      { fromId: "s0", toId: "s1", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
  },
  spineOrbit: {
    knots: [
      { id: "t0", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
      { id: "t1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [
      { fromId: "t0", toId: "t1", pathType: "line", roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient", color: null },
    ],
  },
  embeddedAssets: {},
  children: [
    {
      instanceGuid: "i1",
      contentGuid: "c1",
      mode: "copy",
      name: "Eye",
      transform: { x: 0.4, y: 0.2, rotationYDeg: 0, scale: 0.2, useSymmetry: false, snapCenterline: false },
      visible: true,
    },
  ],
};

const mig = migrateProject(v7);
assert.equal(mig.ok, true, mig.errors?.join("; "));
assert.equal(CURRENT_SCHEMA_VERSION, 8);
assert.equal(mig.doc.schemaVersion, 8);
assert.equal(mig.doc.children[0].transform.surface, false);
assert.equal(mig.doc.children[0].transform.z, 0);

console.log("smoke-mesh-pick: ok");
