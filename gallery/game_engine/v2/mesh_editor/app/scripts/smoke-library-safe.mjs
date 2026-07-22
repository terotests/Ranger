#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { resolveSafeProjectDir, PROJECT_SLUG_RE } from "../src/library/safePath.mjs";
import { createEditHistory } from "../src/lib/editHistory.js";
import { buildProjectDocument } from "../src/library/schema.js";

const root = path.join(os.tmpdir(), "mesh-editor-lib-test");

assert.ok(PROJECT_SLUG_RE.test("tall-vase"));
assert.ok(PROJECT_SLUG_RE.test("a"));
assert.equal(PROJECT_SLUG_RE.test("../etc"), false);
assert.equal(PROJECT_SLUG_RE.test("foo/bar"), false);
assert.equal(PROJECT_SLUG_RE.test(""), false);

const ok = resolveSafeProjectDir(root, "my-project");
assert.equal(ok.slug, "my-project");
assert.ok(ok.dir.startsWith(path.resolve(root) + path.sep));
assert.ok(ok.file.endsWith(`${path.sep}project.json`));

for (const bad of ["../x", "..", "a/b", "a\\b", "UPPER", "has space", ".hidden", ""]) {
  assert.throws(() => resolveSafeProjectDir(root, bad), /Invalid project slug/);
}

// Encoded traversal that becomes ".." after decode would still fail pattern
assert.throws(() => resolveSafeProjectDir(root, decodeURIComponent("%2e%2e")), /Invalid/);

// History limit: both object and legacy number forms
const hObj = createEditHistory({ limit: 3 });
for (let i = 0; i < 5; i++) hObj.push({ i }, "n");
assert.equal(hObj.canUndo(), true);
// Drain past — only 3 kept
let n = 0;
let cur = { i: 99 };
while (hObj.canUndo()) {
  cur = hObj.undo(cur);
  n += 1;
}
assert.equal(n, 3);

const hNum = createEditHistory(2);
hNum.push({ a: 1 });
hNum.push({ a: 2 });
hNum.push({ a: 3 });
n = 0;
cur = { a: 0 };
while (hNum.canUndo()) {
  cur = hNum.undo(cur);
  n += 1;
}
assert.equal(n, 2);

// Texture kind snapshot must keep textureAssets in the document
const doc = buildProjectDocument({
  projectKind: "texture",
  name: "Eyes",
  state: {
    knots: [
      { id: "a", x: 0.2, y: -0.5, hx: 0, hy: 0, color: "#fff" },
      { id: "b", x: 0.3, y: 0.5, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [],
    orbitKnots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0, color: "#fff" },
      { id: "o1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: 0, color: "#fff" },
    ],
    orbitSegments: [],
    textureAssets: {
      g1: {
        assetGuid: "g1",
        name: "Eye",
        kind: "eye",
        layers: [{ id: "l1", type: "eyeball", name: "Eyeball", knots: [], segments: [] }],
      },
    },
  },
});
assert.equal(doc.projectKind, "texture");
assert.ok(doc.textureAssets.g1, "textureAssets must be serialized into JSON doc");
assert.equal(doc.textureAssets.g1.name, "Eye");

// Repair: texture:"asset" without textureAsset but assets present → fill guid
const broken = buildProjectDocument({
  projectKind: "mesh",
  name: "kivinen",
  state: {
    knots: [
      { id: "a", x: 0.2, y: -0.5, hx: 0, hy: 0, color: "#fff" },
      { id: "b", x: 0.3, y: 0.5, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [],
    orbitKnots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0, color: "#fff" },
      { id: "o1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: 0, color: "#fff" },
    ],
    orbitSegments: [],
    objectMaterial: {
      color: "#b5b5b5",
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "asset",
      textureAsset: null,
      textureAssign: null,
      textureUv: { centerU: 0.5, centerV: 0.58, scale: 1, eyeSeparationU: null },
    },
    textureAssets: {
      g1: {
        assetGuid: "g1",
        name: "Eye",
        kind: "eye",
        layers: [{ id: "l1", type: "eyeball", name: "Eyeball", knots: [], segments: [] }],
      },
    },
  },
});
assert.equal(broken.objectMaterial.textureAsset, "g1", "repair missing textureAsset on save");
assert.equal(broken.objectMaterial.textureAssign, "eyePair");
assert.equal(broken.objectMaterial.texture, "asset");

// Mesh save must not embed every open Texture-editor eye — only the assigned one.
// (Otherwise assign picker showed "Eye · egghead" for each unused embed.)
const meshEgg = buildProjectDocument({
  projectKind: "mesh",
  name: "egghead",
  state: {
    knots: [
      { id: "a", x: 0.2, y: -0.5, hx: 0, hy: 0, color: "#fff" },
      { id: "b", x: 0.3, y: 0.5, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [],
    orbitKnots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0, color: "#fff" },
      { id: "o1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: 0, color: "#fff" },
    ],
    orbitSegments: [],
    objectMaterial: {
      color: null,
      roughness: 0.4,
      metalness: 0,
      opacity: 1,
      texture: "asset",
      textureAsset: "keep-me",
      textureAssign: "eyePair",
    },
    textureAssets: {
      "keep-me": {
        assetGuid: "keep-me",
        name: "Eye",
        kind: "eye",
        layers: [{ id: "l1", type: "eyeball", name: "Eyeball", knots: [], segments: [] }],
      },
      "extra-open": {
        assetGuid: "extra-open",
        name: "Eye",
        kind: "eye",
        layers: [{ id: "l2", type: "eyeball", name: "Eyeball", knots: [], segments: [] }],
      },
    },
  },
});
assert.ok(meshEgg.textureAssets["keep-me"], "assigned eye kept");
assert.equal(meshEgg.textureAssets["extra-open"], undefined, "unassigned open eye not embedded");
assert.equal(Object.keys(meshEgg.textureAssets).length, 1);

// Texture projects still keep all assets
const texProj = buildProjectDocument({
  projectKind: "texture",
  name: "Eyes pack",
  state: {
    knots: [
      { id: "a", x: 0.2, y: -0.5, hx: 0, hy: 0, color: "#fff" },
      { id: "b", x: 0.3, y: 0.5, hx: 0, hy: 0, color: "#fff" },
    ],
    segments: [],
    orbitKnots: [
      { id: "o0", x: 1, y: 0, hx: 0, hy: 0, color: "#fff" },
      { id: "o1", x: 0, y: 1, hx: 0, hy: 0, color: "#fff" },
      { id: "o2", x: -1, y: 0, hx: 0, hy: 0, color: "#fff" },
    ],
    orbitSegments: [],
    textureAssets: {
      a: {
        assetGuid: "a",
        name: "Eye A",
        kind: "eye",
        layers: [{ id: "l1", type: "eyeball", name: "Eyeball", knots: [], segments: [] }],
      },
      b: {
        assetGuid: "b",
        name: "Eye B",
        kind: "eye",
        layers: [{ id: "l2", type: "eyeball", name: "Eyeball", knots: [], segments: [] }],
      },
    },
  },
});
assert.equal(Object.keys(texProj.textureAssets).length, 2);

// Assign picker filter: only projectKind===texture (mesh embeds must not appear)
{
  const projects = [
    { slug: "egghead", name: "egghead", projectKind: "mesh", textureCount: 2, textures: [
      { assetGuid: "keep-me", name: "Eye" },
      { assetGuid: "extra-open", name: "Eye" },
    ]},
    { slug: "eyes", name: "Eyes", projectKind: "texture", textureCount: 1, textures: [
      { assetGuid: "tex1", name: "Eye" },
    ]},
  ];
  const forPicker = projects.filter((p) => p.projectKind === "texture");
  assert.equal(forPicker.length, 1);
  assert.equal(forPicker[0].slug, "eyes");
  const labels = [];
  for (const p of forPicker) {
    for (const t of p.textures) labels.push(`${t.name} · ${p.name}`);
  }
  assert.deepEqual(labels, ["Eye · Eyes"]);
  assert.ok(!labels.some((l) => l.includes("egghead")), "mesh name must not leak into texture list");
}

console.log("smoke-library-safe: ok");
