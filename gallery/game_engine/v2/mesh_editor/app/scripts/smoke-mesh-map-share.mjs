#!/usr/bin/env node
/**
 * smoke-mesh-map-share.mjs — atlas must stay TypedArray + shared across parts.
 */
import assert from "node:assert/strict";
import { tessellateBody } from "../src/lib/latheTessellate.js";
import { defaultSpineKnots, defaultSpineSegments } from "../src/lib/spineLathe.js";
import { SplineLathe } from "../../tessellate/spline_lathe.mjs";

function uid() {
  return "k" + Math.random().toString(36).slice(2, 9);
}

function knotsFrom(defaults) {
  return defaults.map((k, i) => ({
    id: uid(),
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: i % 2 ? "#7ecf6a" : "#6ec8ff",
  }));
}

function openSegs(knots) {
  const segs = [];
  for (let i = 0; i < knots.length - 1; i++) {
    segs.push({
      fromId: knots[i].id,
      toId: knots[i + 1].id,
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "gradient",
      textureData: null,
      pathType: "bezier",
    });
  }
  return segs;
}

function closedSegs(knots) {
  const segs = [];
  for (let i = 0; i < knots.length; i++) {
    segs.push({
      fromId: knots[i].id,
      toId: knots[(i + 1) % knots.length].id,
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "gradient",
      textureData: null,
      pathType: "bezier",
    });
  }
  return segs;
}

const profile = knotsFrom(SplineLathe.defaultKnots());
const orbit = knotsFrom(SplineLathe.defaultOrbitKnots());
const spineP = defaultSpineKnots();
const spineO = defaultSpineKnots();

const W = 64;
const H = 64;
const atlas = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < atlas.length; i += 4) {
  atlas[i] = 200;
  atlas[i + 1] = 40;
  atlas[i + 2] = 40;
  atlas[i + 3] = 255;
}

const body = {
  knots: profile,
  segments: openSegs(profile),
  orbitKnots: orbit,
  orbitSegments: closedSegs(orbit),
  spineProfileKnots: spineP,
  spineProfileSegments: defaultSpineSegments(spineP),
  spineOrbitKnots: spineO,
  spineOrbitSegments: defaultSpineSegments(spineO),
  curveType: 0,
  pathSegments: 8,
  angularSteps: 16,
  revolutionDeg: 360,
  tessellationMode: "rotation",
  objectMaterial: {
    color: null,
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "asset",
    textureAsset: "test-guid",
    textureAssign: "eyePair",
    textureMap: { rgba: atlas, w: W, h: H },
  },
};

const mesh = tessellateBody(body, {
  resolveTextureMap: (om) => om.textureMap,
});

assert.ok(mesh.parts.length >= 2, "expected multiple lathe parts");
const first = mesh.parts[0].mapRgba;
assert.ok(first instanceof Uint8Array, "mapRgba must stay TypedArray (no Array.from)");
assert.equal(first.length, W * H * 4);

for (const part of mesh.parts) {
  assert.strictEqual(
    part.mapRgba,
    first,
    "body atlas must be shared by reference across parts",
  );
  assert.equal(part.mapW, W);
  assert.equal(part.mapH, H);
}

// Gradient-only body still uses TypedArray maps (not number[]).
const plain = {
  ...body,
  objectMaterial: {
    color: null,
    roughness: 0.4,
    metalness: 0,
    opacity: 1,
    texture: "gradient",
    textureAsset: null,
    textureAssign: null,
    textureMap: null,
  },
};
const plainMesh = tessellateBody(plain, {});
assert.ok(plainMesh.parts.length >= 1);
assert.ok(
  plainMesh.parts[0].mapRgba instanceof Uint8Array,
  "procedural maps should also be TypedArray",
);

console.log("[smoke-mesh-map-share] OK", {
  parts: mesh.parts.length,
  atlasBytes: first.byteLength,
  shared: true,
});
