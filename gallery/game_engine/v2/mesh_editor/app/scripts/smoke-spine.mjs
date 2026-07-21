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

console.log("smoke-spine: ok", {
  maxDiffStraight: maxDiff,
  bentMoved: moved,
  schema: mig.doc.schemaVersion,
});
