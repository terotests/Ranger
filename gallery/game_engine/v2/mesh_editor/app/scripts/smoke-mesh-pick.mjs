#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  rayFromCanvas,
  intersectTriangle,
  raycastMeshParts,
  applyPreviewEuler,
  applyPreviewEulerInv,
  approximateLatheUvFromPoint,
  pickRootSurface,
  transformPartsByPreviewEuler,
} from "../src/lib/meshPick.js";
import {
  eyeUvFromRegionSamples,
  regionSamplePoints,
  DEFAULT_ASSIGN_REGION,
} from "../src/lib/assignRegion.js";
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
assert.ok(t != null && Math.abs(t.t - 2) < 1e-6);

const hit = raycastMeshParts([0, 0, 3], [0, 0, -1], parts);
assert.ok(hit);
assert.ok(Math.abs(hit.point[2]) < 1e-5);
assert.ok(hit.normal[2] > 0.9);

// UV interpolation at triangle centroid-ish (hit near origin on square)
const uvParts = [
  {
    positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    // v0=(0,0) v1=(1,0) v2=(1,1) v3=(0,1)
    uvs: [0, 0, 1, 0, 1, 1, 0, 1],
    indices: [0, 1, 2, 0, 2, 3],
  },
];
const uvHit = raycastMeshParts([0, 0, 3], [0, 0, -1], uvParts);
assert.ok(uvHit?.uv);
assert.ok(Math.abs(uvHit.uv[0] - 0.5) < 0.05);
assert.ok(Math.abs(uvHit.uv[1] - 0.5) < 0.05);

const approx = approximateLatheUvFromPoint([0.5, 0, 0.5], [
  { positions: [-1, -1, -1, 1, 1, 1] },
]);
assert.ok(approx && approx[0] >= 0 && approx[0] <= 1);

const fromSamples = eyeUvFromRegionSamples(
  [
    [0.4, 0.7],
    [0.6, 0.45],
  ],
  DEFAULT_ASSIGN_REGION,
);
assert.ok(fromSamples && fromSamples.scale > 0);
assert.ok(regionSamplePoints(DEFAULT_ASSIGN_REGION, 3).length === 9);

// pickRootSurface fills UV when vertex uvs are missing
const pickView = {
  cam: [0, 0, 4],
  target: [0, 0, 0],
  fovDeg: 45,
  width: 400,
  height: 400,
};
const noUvHit = pickRootSurface(200, 200, pickView, parts, 0, 0, null);
assert.ok(noUvHit?.uv, "approximate UV on hit without vertex uvs");

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

// Must match Three.js Euler XYZ (host entityTransform) — R = Rx * Ry
{
  const rx = 0.12;
  const ry = 0.4;
  const c1 = Math.cos(rx / 2);
  const c2 = Math.cos(ry / 2);
  const s1 = Math.sin(rx / 2);
  const s2 = Math.sin(ry / 2);
  const q = {
    x: s1 * c2,
    y: c1 * s2,
    z: s1 * s2,
    w: c1 * c2,
  };
  // z=0 simplifies Three.js XYZ quat
  const qFull = {
    x: s1 * c2 * 1 + c1 * s2 * 0,
    y: c1 * s2 * 1 - s1 * c2 * 0,
    z: c1 * c2 * 0 + s1 * s2 * 1,
    w: c1 * c2 * 1 - s1 * s2 * 0,
  };
  void q;
  const pt = [0.3, 0.7, -0.2];
  const ours = applyPreviewEuler(pt, rx, ry);
  const qx = qFull.x;
  const qy = qFull.y;
  const qz = qFull.z;
  const qw = qFull.w;
  const ix = qw * pt[0] + qy * pt[2] - qz * pt[1];
  const iy = qw * pt[1] + qz * pt[0] - qx * pt[2];
  const iz = qw * pt[2] + qx * pt[1] - qy * pt[0];
  const iw = -qx * pt[0] - qy * pt[1] - qz * pt[2];
  const three = [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
  assert.ok(
    Math.hypot(ours[0] - three[0], ours[1] - three[1], ours[2] - three[2]) < 1e-9,
    "preview euler must match Three.js XYZ used by mesh host",
  );
}

// Picking must succeed when the host has spun the mesh (yaw/tilt ≠ 0)
{
  const rx = 0.12;
  const ry = 0.55;
  const localHit = pickRootSurface(200, 200, view, uvParts, rx, ry, null);
  assert.ok(localHit?.uv, "pick through inverse host yaw/tilt");
  const worldParts = transformPartsByPreviewEuler(uvParts, rx, ry);
  const { origin: oW, dir: dW } = rayFromCanvas(200, 200, view);
  const worldHit = raycastMeshParts(oW, dW, worldParts);
  assert.ok(worldHit?.uv, "world-space rotated parts still pickable");
  assert.ok(
    Math.hypot(localHit.uv[0] - worldHit.uv[0], localHit.uv[1] - worldHit.uv[1]) < 0.05,
    "inverse-ray pick UV matches world-space rotated pick",
  );
}

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
assert.equal(CURRENT_SCHEMA_VERSION, 10);
assert.equal(mig.doc.schemaVersion, 10);
assert.equal(mig.doc.children[0].transform.surface, false);
assert.equal(mig.doc.children[0].transform.z, 0);

// Save path re-runs migrate on an already-v8 doc — surface pose must survive.
const v8Surface = {
  ...mig.doc,
  schemaVersion: 8,
  children: [
    {
      ...mig.doc.children[0],
      transform: {
        x: 0.12,
        y: -0.34,
        z: 0.56,
        nx: 0.1,
        ny: 0.9,
        nz: 0.2,
        surface: true,
        rotationYDeg: 15,
        scale: 0.22,
        useSymmetry: false,
        snapCenterline: false,
      },
    },
  ],
};
const roundTrip = migrateProject(v8Surface);
assert.equal(roundTrip.ok, true, roundTrip.errors?.join("; "));
const xf = roundTrip.doc.children[0].transform;
assert.equal(xf.surface, true);
assert.ok(Math.abs(xf.x - 0.12) < 1e-9);
assert.ok(Math.abs(xf.y - -0.34) < 1e-9);
assert.ok(Math.abs(xf.z - 0.56) < 1e-9);
assert.ok(Math.abs(xf.nx - 0.1) < 1e-9);
assert.ok(Math.abs(xf.ny - 0.9) < 1e-9);
assert.ok(Math.abs(xf.nz - 0.2) < 1e-9);
assert.ok(Math.abs(xf.scale - 0.22) < 1e-9);

console.log("smoke-mesh-pick: ok");
