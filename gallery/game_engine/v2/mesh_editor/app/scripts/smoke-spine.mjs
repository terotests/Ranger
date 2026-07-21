#!/usr/bin/env node
// Smoke: straight spine ≈ classic lathe; bent spine moves mesh; v4→v5 migration.
import assert from "node:assert/strict";
import {
  defaultSpineKnots,
  defaultSpineSegments,
  latheProfileWithOrbitOnSpine,
} from "../src/lib/spineLathe.js";
import { migrateProject } from "../src/library/migrations.js";
import { CURRENT_SCHEMA_VERSION, validateProject } from "../src/library/schema.js";

function sampleDiscProfile() {
  return [
    { x: 0.4, y: -1, tx: 0, ty: 1, segmentIndex: 0 },
    { x: 0.5, y: 0, tx: 0, ty: 1, segmentIndex: 0 },
    { x: 0.3, y: 1, tx: 0, ty: 1, segmentIndex: 0 },
  ];
}

function sampleUnitOrbit() {
  const n = 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push({
      x: Math.cos(t),
      y: Math.sin(t),
      tx: -Math.sin(t),
      ty: Math.cos(t),
      segmentIndex: 0,
    });
  }
  return pts;
}

/** Non-unit ellipse — classic lathe must keep radius scale, not unitize positions. */
function sampleScaledOrbit() {
  const n = 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push({
      x: 1.5 * Math.cos(t),
      y: 0.6 * Math.sin(t),
      tx: -1.5 * Math.sin(t),
      ty: 0.6 * Math.cos(t),
      segmentIndex: 0,
    });
  }
  return pts;
}

const profile = sampleDiscProfile();
const orbit = sampleUnitOrbit();

const straightK = defaultSpineKnots(() => "s" + Math.random().toString(36).slice(2, 6));
const straightS = defaultSpineSegments(straightK);
const straight = latheProfileWithOrbitOnSpine(
  profile,
  orbit,
  true,
  { knots: straightK, segments: straightS },
  { knots: straightK, segments: straightS },
);

const classic = latheProfileWithOrbitOnSpine(profile, orbit, true, null, null);

assert.equal(straight.positions.length, classic.positions.length);
let maxDiff = 0;
for (let i = 0; i < straight.positions.length; i++) {
  maxDiff = Math.max(maxDiff, Math.abs(straight.positions[i] - classic.positions[i]));
}
assert.ok(maxDiff < 1e-4, `straight spine should match classic (maxDiff=${maxDiff})`);

const scaled = sampleScaledOrbit();
const classicScaled = latheProfileWithOrbitOnSpine(profile, scaled, true, null, null);
const spineScaled = latheProfileWithOrbitOnSpine(
  profile,
  scaled,
  true,
  { knots: straightK, segments: straightS },
  { knots: straightK, segments: straightS },
);
let scaledDiff = 0;
for (let i = 0; i < classicScaled.positions.length; i++) {
  scaledDiff = Math.max(
    scaledDiff,
    Math.abs(classicScaled.positions[i] - spineScaled.positions[i]),
  );
}
assert.ok(
  scaledDiff < 1e-4,
  `straight spine must keep raw orbit scale (scaledDiff=${scaledDiff})`,
);
// Sanity: scaled orbit must actually stretch vs unit orbit
let stretch = 0;
for (let i = 0; i < classic.positions.length; i++) {
  stretch = Math.max(stretch, Math.abs(classicScaled.positions[i] - classic.positions[i]));
}
assert.ok(stretch > 0.1, `scaled orbit should differ from unit (stretch=${stretch})`);

const bentK = [
  { id: "b0", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
  { id: "b1", x: 0.35, y: 0, hx: 0, hy: 0, color: "#fff" },
  { id: "b2", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
];
const bentS = defaultSpineSegments(bentK);
const bent = latheProfileWithOrbitOnSpine(
  profile,
  orbit,
  true,
  { knots: bentK, segments: bentS },
  { knots: straightK, segments: straightS },
);
let moved = 0;
for (let i = 0; i < bent.positions.length; i++) {
  moved = Math.max(moved, Math.abs(bent.positions[i] - classic.positions[i]));
}
assert.ok(moved > 0.05, `bent spine should move mesh (moved=${moved})`);

const v4 = {
  kind: "ranger.splineProject",
  schemaVersion: 4,
  id: "t1",
  assetGuid: "g1",
  slug: "smoke",
  name: "Smoke",
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
  },
  objectMaterial: { color: null, roughness: 0.4, metalness: 0, opacity: 1, texture: "gradient" },
  profile: {
    knots: [
      { id: "p0", x: 0, y: -1, hx: 0, hy: 0, color: "#7ecf6a" },
      { id: "p1", x: 0.5, y: 0, hx: 0.1, hy: 0, color: "#6ec8ff" },
      { id: "p2", x: 0, y: 1, hx: 0, hy: 0, color: "#ffb454" },
    ],
    segments: [
      {
        fromId: "p0",
        toId: "p1",
        color: null,
        roughness: 0.4,
        metalness: 0,
        opacity: 1,
        texture: "gradient",
        pathType: "bezier",
      },
      {
        fromId: "p1",
        toId: "p2",
        color: null,
        roughness: 0.4,
        metalness: 0,
        opacity: 1,
        texture: "gradient",
        pathType: "line",
      },
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
  embeddedAssets: {},
  children: [],
};

const mig = migrateProject(v4);
assert.equal(mig.ok, true, mig.errors?.join("; "));
assert.equal(mig.doc.schemaVersion, CURRENT_SCHEMA_VERSION);
assert.ok(mig.doc.spineProfile.knots.length >= 2);
assert.ok(mig.doc.spineOrbit.knots.length >= 2);
assert.ok(mig.doc.spineProfile.knots.every((k) => Math.abs(k.x) < 1e-9));
const errs = validateProject(mig.doc);
assert.equal(errs.length, 0, errs.join("; "));

// Embedded child spines must survive save re-migrate (not reset to y=-1…1).
const shortSpine = [
  { id: "sp0", x: 0, y: -0.2, hx: 0, hy: 0, color: "#fff" },
  { id: "sp1", x: 0, y: 0, hx: 0, hy: 0, color: "#fff" },
  { id: "sp2", x: 0, y: 0.25, hx: 0, hy: 0, color: "#fff" },
];
const shortSegs = [
  {
    fromId: "sp0",
    toId: "sp1",
    pathType: "line",
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "gradient",
    color: null,
  },
  {
    fromId: "sp1",
    toId: "sp2",
    pathType: "line",
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "gradient",
    color: null,
  },
];
const v8Child = {
  ...mig.doc,
  schemaVersion: 8,
  embeddedAssets: {
    c1: {
      assetGuid: "c1",
      name: "Eye",
      curveType: 0,
      pathSegments: 12,
      angularSteps: 24,
      revolutionDeg: 360,
      tessellationMode: "rotation",
      objectMaterial: mig.doc.objectMaterial,
      knots: mig.doc.profile.knots,
      segments: mig.doc.profile.segments,
      orbitKnots: mig.doc.orbit.knots,
      orbitSegments: mig.doc.orbit.segments,
      spineProfileKnots: shortSpine,
      spineProfileSegments: shortSegs,
      spineOrbitKnots: shortSpine,
      spineOrbitSegments: shortSegs,
      placementNormal: { start: { x: 0, y: -0.2 }, end: { x: 0, y: 0.25 } },
    },
  },
  children: [
    {
      instanceGuid: "i1",
      contentGuid: "c1",
      mode: "copy",
      name: "Eye",
      transform: {
        x: 0.1,
        y: 0.2,
        z: 0.3,
        nx: 0,
        ny: 1,
        nz: 0,
        surface: true,
        scale: 0.2,
        rotationYDeg: 0,
        useSymmetry: false,
        snapCenterline: false,
      },
      visible: true,
    },
  ],
};
const childRound = migrateProject(v8Child);
assert.equal(childRound.ok, true, childRound.errors?.join("; "));
const emb = childRound.doc.embeddedAssets.c1;
assert.ok(emb, "embedded asset kept");
assert.ok(Math.abs(emb.spineProfileKnots[0].y - -0.2) < 1e-9, "short spine start kept");
assert.ok(Math.abs(emb.spineProfileKnots[2].y - 0.25) < 1e-9, "short spine end kept");
assert.ok(Math.abs(emb.placementNormal.start.y - -0.2) < 1e-9, "child placementNormal kept");

console.log("smoke-spine: ok", {
  maxDiffStraight: maxDiff,
  scaledOrbitDiff: scaledDiff,
  bentMoved: moved,
  schema: mig.doc.schemaVersion,
  childSpineY: [emb.spineProfileKnots[0].y, emb.spineProfileKnots[2].y],
});
