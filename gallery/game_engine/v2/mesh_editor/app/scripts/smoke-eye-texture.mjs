#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  createDefaultEyeTexture,
  serializeEyeTexture,
  normalizeEyeTexture,
  constrainAllEyeLayers,
  findLayer,
  layerPolygon,
  mirrorLayersX,
  translateLayerTree,
  companionLayerTypes,
  rightEyeLayers,
  resetEyePairToMirror,
  editableLayers,
  restoreLayerToCircle,
  EYE_CIRCLE_RADII,
  rasterizeEyePairUvMap,
  rasterizeEyePairUvMapAsync,
  normalizeEyeUv,
  averageKnotColorHex,
  eyeUvFromCorners,
  eyeUvMoveCenter,
  unwrapUvPairU,
  layersWithEyeballColor,
} from "../src/lib/texture/eyeTexture.js";
import {
  clampAssignRegion,
  regionCorners,
  DEFAULT_ASSIGN_REGION,
} from "../src/lib/assignRegion.js";
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
import {
  CURRENT_SCHEMA_VERSION,
  buildProjectDocument,
  validateProject,
} from "../src/library/schema.js";
import {
  serializeTextureMap,
  normalizeTextureMap,
} from "../src/lib/texture/textureMapCodec.js";

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

// Handle-only edit + symmetry must keep hx/hy (no auto-smooth wipe)
{
  const circ = makeEllipsePath({ cx: 0, cy: 0, rx: 0.72, ry: 0.72, n: 4 });
  const tip = circ.knots.find((k) => k.x > 0.5);
  tip.hx = 0.12;
  tip.hy = 0.55;
  rebuildClosedYSymmetry(circ.knots);
  const tip2 = circ.knots.find((k) => k.id === tip.id);
  assert.ok(tip2, "edited knot id preserved");
  assert.ok(Math.abs(tip2.hx - 0.12) < 1e-6, "handle hx survives symmetry");
  assert.ok(Math.abs(tip2.hy - 0.55) < 1e-6, "handle hy survives symmetry");
  const mir = circ.knots.find((k) => Math.abs(k.x + tip2.x) < 1e-3 && Math.abs(k.y - tip2.y) < 1e-3);
  assert.ok(mir, "mirror knot exists");
  assert.ok(Math.abs(mir.hx + tip2.hx) < 1e-6, "mirror hx negates");
}

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

// Eyelid optional border + separate fill / border colors
{
  const lid = findLayer(eye, "eyelid");
  assert.ok(lid, "eyelid layer");
  assert.equal(lid.border, false);
  lid.enabled = true;
  lid.border = true;
  lid.borderWidth = 0.05;
  lid.borderColor = "#112233";
  lid.color = "#aabbcc";
  const serLid = serializeEyeTexture(eye);
  const lidSer = serLid.layers.find((L) => L.type === "eyelid");
  assert.equal(lidSer.border, true);
  assert.equal(lidSer.borderWidth, 0.05);
  assert.equal(lidSer.borderColor, "#112233");
  assert.equal(lidSer.color, "#aabbcc");
  const againLid = normalizeEyeTexture(serLid);
  const lid2 = findLayer(againLid, "eyelid");
  assert.equal(lid2.border, true);
  assert.equal(lid2.borderWidth, 0.05);
  assert.equal(lid2.borderColor, "#112233");
  assert.equal(lid2.color, "#aabbcc");
}

// Layer Move: translating iris also moves pupil + reflection
{
  const e2 = createDefaultEyeTexture({ name: "Move" });
  const iris = findLayer(e2, "iris");
  const pupil = findLayer(e2, "pupil");
  const shine = findLayer(e2, "reflection");
  const ix = iris.knots[0].x;
  const px = pupil.knots[0].x;
  const sx = shine.knots[0].x;
  translateLayerTree(e2.layers, iris.id, 0.1, 0);
  assert.ok(Math.abs(iris.knots[0].x - (ix + 0.1)) < 1e-6, "iris translated");
  assert.ok(Math.abs(pupil.knots[0].x - (px + 0.1)) < 1e-6, "pupil follows iris");
  assert.ok(Math.abs(shine.knots[0].x - (sx + 0.1)) < 1e-6, "reflection follows iris");
  assert.deepEqual(companionLayerTypes("iris"), ["pupil", "reflection"]);
}

// Left/right pair: linked right is mirror; reset re-links
{
  const e3 = createDefaultEyeTexture({ name: "Pair" });
  assert.equal(e3.eyePair.linked, true);
  const right = rightEyeLayers(e3);
  const leftIris = findLayer(e3.layers, "iris");
  const rightIris = findLayer(right, "iris");
  assert.ok(
    Math.abs(rightIris.knots[0].x + leftIris.knots[0].x) < 1e-6,
    "linked right iris mirrors left X",
  );
  e3.eyePair.linked = false;
  e3.eyePair.editSide = "right";
  e3.rightLayers = mirrorLayersX(e3.layers);
  // Nudge right iris independently
  const rIris = findLayer(e3.rightLayers, "iris");
  rIris.knots[0].x += 0.2;
  resetEyePairToMirror(e3, "left");
  assert.equal(e3.eyePair.linked, true);
  assert.equal(e3.rightLayers, null);
  assert.equal(editableLayers(e3), e3.layers);
}

// Restore to circle keeps center, resets radius to default
{
  const e4 = createDefaultEyeTexture({ name: "Restore" });
  const pupil = findLayer(e4, "pupil");
  const c0 = pathCentroid(pupil.knots);
  for (const k of pupil.knots) {
    k.x = c0.x + (k.x - c0.x) * 0.15;
    k.y = c0.y + (k.y - c0.y) * 0.15;
  }
  assert.ok(restoreLayerToCircle(pupil, { keepCenter: true }));
  const c1 = pathCentroid(pupil.knots);
  assert.ok(Math.abs(c1.x - c0.x) < 1e-5 && Math.abs(c1.y - c0.y) < 1e-5, "center kept");
  const tip = pupil.knots.reduce((a, k) => (k.x > a.x ? k : a), pupil.knots[0]);
  assert.ok(
    Math.abs(tip.x - (c1.x + EYE_CIRCLE_RADII.pupil.rx)) < 1e-5,
    "pupil radius restored",
  );
}

const ser = serializeEyeTexture(eye);
const again = normalizeEyeTexture(ser);
assert.equal(again.name, "TestEye");
assert.equal(again.layers.length, eye.layers.length);
assert.ok(again.eyePair);
assert.equal(again.eyePair.linked, true);

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
    projectKind: "mesh",
    objectMaterial: {
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "asset",
      textureAsset: ser.assetGuid,
      textureAssign: "eyePair",
    },
  },
  name: "With eye texture",
  slug: "with-eye",
  projectKind: "mesh",
});
assert.equal(doc.schemaVersion, 11);
assert.equal(doc.projectKind, "mesh");
assert.ok(doc.textureAssets[ser.assetGuid]);
assert.equal(doc.objectMaterial.textureAssign, "eyePair");

const mig = migrateProject(doc);
assert.equal(mig.ok, true, mig.errors?.join("; "));
assert.equal(CURRENT_SCHEMA_VERSION, 11);
assert.equal(mig.doc.schemaVersion, 11);
assert.equal(mig.doc.projectKind, "mesh");
assert.ok(mig.doc.textureAssets[ser.assetGuid].layers.length >= 4);

// Texture-only library entry validates without mesh profile
const texOnly = {
  kind: "ranger.splineProject",
  schemaVersion: 11,
  projectKind: "texture",
  name: "Eyes only",
  textureAssets: { [ser.assetGuid]: ser },
};
assert.deepEqual(validateProject(texOnly), []);
const uv = rasterizeEyePairUvMap(eye, 64, 64, {
  background: averageKnotColorHex([{ color: "#c8a070" }, { color: "#c8a070" }]),
  uv: normalizeEyeUv({ centerU: 0.4, centerV: 0.6, scale: 1.2, eyeSeparationU: 0.14 }),
});
assert.ok(uv && uv.w === 64 && uv.h === 64 && uv.rgba.length === 64 * 64 * 4);
assert.equal(averageKnotColorHex([{ color: "#ff0000" }, { color: "#0000ff" }]), "#800080");
assert.equal(averageKnotColorHex([], ""), "");
// Atlas fill must use mesh tint — never texture previewBackground green
assert.notEqual(eye.previewBackground, "#c8a070");
assert.equal(
  averageKnotColorHex([{ color: "#c8a070" }, { color: "#c8a070" }]),
  "#c8a070",
  "mesh/segment tint for atlas bg",
);
assert.equal(normalizeEyeUv({ scale: 99 }).scale, 3);
assert.equal(normalizeEyeUv({ centerU: 0.4, eyeSeparationU: 0.14 }).eyeSeparationU, 0.14);

const fromCorners = eyeUvFromCorners(0.35, 0.7, 0.65, 0.45);
assert.ok(Math.abs(fromCorners.centerU - 0.5) < 1e-6);
assert.ok(Math.abs(fromCorners.centerV - 0.575) < 1e-6);
assert.ok(fromCorners.scale > 0.5 && fromCorners.scale < 3);
assert.ok(fromCorners.eyeSeparationU > 0.02);
assert.ok(fromCorners.eyeSeparationU <= 0.16 + 1e-9, "pair gap capped for one face");
// Wide UV span (cobra-like cheeks) must NOT pin eyes to the U edges
const wide = eyeUvFromCorners(0.05, 0.7, 0.55, 0.45);
assert.ok(wide.eyeSeparationU <= 0.16 + 1e-9, `sep capped, got ${wide.eyeSeparationU}`);
assert.ok(wide.eyeSeparationU < 0.45, "must not use full rect width as gap");
assert.ok(wide.eyeSeparationU >= 0.05, "eyes still separated");
// Tall UV rect must not explode scale past what width can hold
const tall = eyeUvFromCorners(0.4, 0.9, 0.6, 0.2);
assert.ok(tall.scale < 2.5, "scale fits width+height, not height-only");
assert.ok(tall.eyeSeparationU >= 0.04 && tall.eyeSeparationU <= 0.16 + 1e-9);
// Sclera tint helper still available, but atlas default keeps authored white
const tinted = layersWithEyeballColor(eye.layers, "#00ff00");
assert.equal(tinted.find((L) => L.type === "eyeball")?.color, "#00ff00");
assert.equal(eye.layers.find((L) => L.type === "eyeball")?.color, "#f2f0ea");
assert.deepEqual(unwrapUvPairU(0.9, 0.1)[0] <= unwrapUvPairU(0.9, 0.1)[1], true);
const moved = eyeUvMoveCenter(fromCorners, 0.42, 0.55);
assert.ok(Math.abs(moved.centerU - 0.42) < 1e-9);
assert.ok(Math.abs(moved.centerV - 0.55) < 1e-9);
assert.equal(moved.scale, fromCorners.scale);

const reg = clampAssignRegion(DEFAULT_ASSIGN_REGION);
const rc = regionCorners(reg);
assert.ok(rc.tl.x < rc.br.x && rc.tl.y < rc.br.y);
const asyncMap = await rasterizeEyePairUvMapAsync(eye, 64, 64, {
  background: "#c8a070",
  uv: fromCorners,
});
assert.equal(asyncMap.w, 64);
assert.equal(asyncMap.rgba.length, 64 * 64 * 4);

// Pre-baked atlas codec + project JSON round-trip (reload must keep pixels)
const enc = serializeTextureMap(asyncMap);
assert.equal(enc.encoding, "rgba8-base64");
assert.equal(enc.w, 64);
assert.equal(enc.h, 64);
assert.ok(typeof enc.data === "string" && enc.data.length > 100);
const dec = normalizeTextureMap(enc);
assert.equal(dec.w, 64);
assert.equal(dec.h, 64);
assert.equal(dec.rgba.length, 64 * 64 * 4);
for (let i = 0; i < dec.rgba.length; i++) {
  assert.equal(dec.rgba[i], asyncMap.rgba[i], `pixel byte ${i}`);
}

const docWithBake = buildProjectDocument({
  state: {
    assetGuid: "root-bake",
    curveType: 0,
    pathSegments: 12,
    angularSteps: 24,
    revolutionDeg: 360,
    tessellationMode: "rotation",
    materialMode: 3,
    symmetry: true,
    viewMode: "profile",
    spineSource: "profile",
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
    projectKind: "mesh",
    objectMaterial: {
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "asset",
      textureAsset: ser.assetGuid,
      textureAssign: "eyePair",
      textureUv: fromCorners,
      textureMap: asyncMap,
    },
  },
  name: "Baked eyes",
  slug: "baked-eyes",
  projectKind: "mesh",
});
assert.equal(docWithBake.schemaVersion, 11);
assert.ok(docWithBake.objectMaterial.textureMap?.encoding === "rgba8-base64");
assert.deepEqual(validateProject(docWithBake), []);
const migBake = migrateProject(JSON.parse(JSON.stringify(docWithBake)));
assert.equal(migBake.ok, true, migBake.errors?.join("; "));
const restoredMap = normalizeTextureMap(migBake.doc.objectMaterial.textureMap);
assert.ok(restoredMap);
assert.equal(restoredMap.rgba[0], asyncMap.rgba[0]);
assert.equal(
  restoredMap.rgba[restoredMap.rgba.length - 1],
  asyncMap.rgba[asyncMap.rgba.length - 1],
);
// v10 docs without textureMap still migrate
const v10 = JSON.parse(JSON.stringify(doc));
v10.schemaVersion = 10;
delete v10.objectMaterial.textureMap;
const mig10 = migrateProject(v10);
assert.equal(mig10.ok, true, mig10.errors?.join("; "));
assert.equal(mig10.doc.schemaVersion, 11);
assert.equal(mig10.doc.objectMaterial.textureMap, null);

// Save path: buildProjectDocument must keep bake when state carries a live map
{
  const saveDoc = buildProjectDocument({
    state: {
      ...docWithBake,
      // Simulate editor snapshotState({ includeMap: true }) — live rgba map
      objectMaterial: {
        ...docWithBake.objectMaterial,
        textureMap: asyncMap,
      },
      textureAssets: { [ser.assetGuid]: ser },
      knots: docWithBake.profile.knots,
      segments: docWithBake.profile.segments,
      orbitKnots: docWithBake.orbit.knots,
      orbitSegments: docWithBake.orbit.segments,
      spineProfileKnots: docWithBake.spineProfile.knots,
      spineProfileSegments: docWithBake.spineProfile.segments,
      spineOrbitKnots: docWithBake.spineOrbit.knots,
      spineOrbitSegments: docWithBake.spineOrbit.segments,
      placementNormal: docWithBake.placementNormal,
      embeddedAssets: {},
      children: [],
      editor: docWithBake.editor,
    },
    name: "Save bake",
    slug: "save-bake",
    projectKind: "mesh",
  });
  assert.ok(
    saveDoc.objectMaterial.textureMap?.encoding === "rgba8-base64",
    "Save must persist textureMap bake",
  );
  assert.ok(saveDoc.objectMaterial.textureMap.data.length > 100);
}

console.log("smoke-eye-texture: ok", {
  schema: mig.doc.schemaVersion,
  projectKind: mig.doc.projectKind,
  layers: mig.doc.textureAssets[ser.assetGuid].layers.map((L) => L.type),
  bakedBytes: enc.data.length,
});
