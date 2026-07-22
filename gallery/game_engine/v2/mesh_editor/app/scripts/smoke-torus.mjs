#!/usr/bin/env node
// Smoke: torus unit-fit, ring topology, spine radius mod, v6→v7 migration.
import assert from "node:assert/strict";
import {
  latheProfileAsTorusOnSpine,
  torusUnitFitScale,
  defaultSpineKnots,
  defaultSpineSegments,
} from "../src/lib/spineLathe.js";
import { migrateProject } from "../src/library/migrations.js";
import { CURRENT_SCHEMA_VERSION, validateProject } from "../src/library/schema.js";

function discProfile() {
  return [
    { x: 0, y: -0.4, tx: 0, ty: 1, segmentIndex: 0 },
    { x: 0.35, y: 0, tx: 1, ty: 0, segmentIndex: 0 },
    { x: 0, y: 0.4, tx: 0, ty: 1, segmentIndex: 0 },
  ];
}

function unitOrbit(n = 16) {
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

const profile = discProfile();
const orbit = unitOrbit(24);
const { scale, majorR, tubeR } = torusUnitFitScale(profile, orbit);
assert.ok(Math.abs(majorR - 1) < 1e-6);
assert.ok(tubeR > 0.3);
assert.ok(Math.abs(scale * (majorR + tubeR) - 1) < 1e-6);

const straightK = defaultSpineKnots(() => "t" + Math.random().toString(36).slice(2, 6));
const straightS = defaultSpineSegments(straightK);
const mesh = latheProfileAsTorusOnSpine(
  profile,
  orbit,
  true,
  { knots: straightK, segments: straightS },
  { knots: straightK, segments: straightS },
);

assert.equal(mesh.rows, profile.length);
assert.equal(mesh.steps, orbit.length);
assert.equal(mesh.positions.length, profile.length * orbit.length * 3);

// Outer radius should be ~1 (unit torus)
let maxR = 0;
for (let i = 0; i < mesh.positions.length; i += 3) {
  maxR = Math.max(
    maxR,
    Math.hypot(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]),
  );
}
assert.ok(maxR > 0.85 && maxR < 1.15, `unit outer radius expected ~1, got ${maxR}`);

// Bent profile-spine should change major radius
const bentK = [
  { id: "b0", x: 0, y: -1, hx: 0, hy: 0, color: "#fff" },
  { id: "b1", x: 0.4, y: 0, hx: 0, hy: 0, color: "#fff" },
  { id: "b2", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
];
const bent = latheProfileAsTorusOnSpine(
  profile,
  orbit,
  true,
  { knots: bentK, segments: defaultSpineSegments(bentK) },
  { knots: straightK, segments: straightS },
);
let moved = 0;
for (let i = 0; i < mesh.positions.length; i++) {
  moved = Math.max(moved, Math.abs(bent.positions[i] - mesh.positions[i]));
}
assert.ok(moved > 0.02, `spine should modulate torus (moved=${moved})`);

const v6 = {
  kind: "ranger.splineProject",
  schemaVersion: 6,
  id: "t1",
  assetGuid: "g1",
  slug: "smoke-torus",
  name: "Smoke torus",
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
  placementNormal: { start: { x: 0, y: -1 }, end: { x: 0, y: 1 } },
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

const mig = migrateProject(v6);
assert.equal(mig.ok, true, mig.errors?.join("; "));
assert.equal(mig.doc.schemaVersion, CURRENT_SCHEMA_VERSION);
assert.equal(CURRENT_SCHEMA_VERSION, 9);
assert.equal(mig.doc.editor.tessellationMode, "rotation");
const errs = validateProject(mig.doc);
assert.equal(errs.length, 0, errs.join("; "));

console.log("smoke-torus: ok", { maxR, moved, schema: mig.doc.schemaVersion, scale });
