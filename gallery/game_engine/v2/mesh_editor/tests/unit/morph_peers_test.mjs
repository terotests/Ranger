// ============================================================================
// morph_peers_test.mjs — cross-project emotion-morph peer discovery.
// ============================================================================
//
// Regression cover for a bug where the morph panel could never find a target.
//
// Emotions are authored as separate projects: open `neutral`, edit, "Save as"
// `sad`. That produces two one-eye projects, and it breaks peer discovery in
// two independent ways:
//
//   1. SCOPE — the panel only ever saw the textures inside the open document.
//      A texture project holds exactly one eye, so the compatible list was
//      structurally always empty.
//
//   2. IDENTITY — "Save as" keeps the source's `assetGuid` on purpose (a mesh
//      that assigned that guid keeps resolving), so the two eyes are
//      guid-identical, and the old `t.assetGuid === ref.assetGuid` self-filter
//      threw the peer away even when both WERE in scope.
//
// Both had to be fixed for the feature to fire; either alone still yields zero
// peers, which is why the fixtures below deliberately share an `assetGuid`.
// ============================================================================

import assert from "node:assert/strict";
import {
  eyeTopologyKey,
  eyeTextureIdentity,
  listCompatibleEmotionPeers,
  areEyeTexturesCompatible,
  morphBetweenTextures,
} from "../../app/src/lib/texture/eyeEmotion.js";
import {
  createDefaultEyeTexture,
  normalizeEyeTexture,
} from "../../app/src/lib/texture/eyeTexture.js";
import {
  findCompatibleLibraryTextures,
  peersFromProjectDoc,
  adoptPeerTexture,
  eyePoseFingerprint,
  makePeerKey,
  parsePeerKey,
  indexTopologyKey,
  PEER_SCAN_LIMIT,
} from "../../app/src/lib/texture/peerIndex.js";

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS " + name);
  } catch (err) {
    failed++;
    console.log("  FAIL " + name + " — " + (err?.message || err));
  }
}

// ---------------------------------------------------------------------------
// Fixtures — the exact shape a "Save as" fork produces.
// ---------------------------------------------------------------------------

/** Both forks keep this guid. That is the point of the test. */
const SHARED_GUID = "56222f6f-bfc5-4cd5-8a0f-920999058786";

function makeEye(emotion, nudge) {
  const tex = createDefaultEyeTexture({ name: "Eye" });
  tex.assetGuid = SHARED_GUID;
  tex.emotion = emotion;
  // Move the eyeball knots so the two emotions are genuinely different shapes
  // (otherwise a "morph" would be a no-op and prove nothing).
  const eyeball = tex.layers.find((L) => L.type === "eyeball");
  for (const k of eyeball.knots) {
    k.x += nudge;
    k.y -= nudge * 0.5;
  }
  return normalizeEyeTexture(tex);
}

/** Mimic vite-plugin-library.mjs listProjects() for one texture project. */
function indexEntry(slug, name, tex, projectKind = "texture") {
  return {
    slug,
    name,
    projectKind,
    textures: [
      {
        assetGuid: tex.assetGuid,
        name: tex.name || "Eye",
        kind: "eye",
        emotion: tex.emotion,
        partClass: "eye",
        topologyKey: eyeTopologyKey(tex),
      },
    ],
  };
}

function projectDoc(slug, name, tex) {
  return {
    kind: "ranger.splineProject",
    schemaVersion: 12,
    projectKind: "texture",
    slug,
    name,
    textureAssets: { [tex.assetGuid]: JSON.parse(JSON.stringify(tex)) },
  };
}

const neutral = makeEye("neutral", 0);
const sad = makeEye("sad", 0.11);

const INDEX = [
  indexEntry("neutral-eyes", "neutral_eyes", neutral),
  indexEntry("sad-eyes", "sad_eyes", sad),
];

// ---------------------------------------------------------------------------
// The premise: these two ARE compatible and DO share a guid.
// ---------------------------------------------------------------------------

check("forked emotions share one assetGuid", () => {
  assert.equal(neutral.assetGuid, sad.assetGuid);
});

check("forked emotions have the same topology", () => {
  assert.equal(eyeTopologyKey(neutral), eyeTopologyKey(sad));
  assert.equal(areEyeTexturesCompatible(neutral, sad), true);
});

check("forked emotions are genuinely different shapes", () => {
  const a = neutral.layers.find((L) => L.type === "eyeball").knots;
  const b = sad.layers.find((L) => L.type === "eyeball").knots;
  assert.ok(a.some((k, i) => Math.abs(k.x - b[i].x) > 1e-6));
});

// ---------------------------------------------------------------------------
// Identity — the bug that hid the pair.
// ---------------------------------------------------------------------------

check("identity falls back to assetGuid for our own textures", () => {
  assert.equal(eyeTextureIdentity(neutral), SHARED_GUID);
});

check("identity uses peerKey once a texture is adopted as a peer", () => {
  const p = adoptPeerTexture(JSON.parse(JSON.stringify(neutral)), {
    slug: "neutral-eyes",
    projectName: "neutral_eyes",
  });
  assert.equal(eyeTextureIdentity(p), "neutral-eyes#" + SHARED_GUID);
  assert.notEqual(eyeTextureIdentity(p), eyeTextureIdentity(sad));
});

check("peer keys round-trip", () => {
  const key = makePeerKey("neutral-eyes", SHARED_GUID);
  assert.deepEqual(parsePeerKey(key), { slug: "neutral-eyes", assetGuid: SHARED_GUID });
  assert.deepEqual(parsePeerKey(SHARED_GUID), { slug: null, assetGuid: null });
});

check("a guid-sharing peer is listed, not swallowed as self", () => {
  const peer = adoptPeerTexture(JSON.parse(JSON.stringify(neutral)), { slug: "neutral-eyes" });
  const list = listCompatibleEmotionPeers([sad, peer], sad);
  assert.equal(list.length, 1);
  assert.equal(list[0].emotion, "neutral");
});

check("the reference itself is never its own peer", () => {
  assert.equal(listCompatibleEmotionPeers([sad], sad).length, 0);
  assert.equal(listCompatibleEmotionPeers([sad, sad], sad).length, 0);
});

check("two peers with the same identity collapse to one", () => {
  const a = adoptPeerTexture(JSON.parse(JSON.stringify(neutral)), { slug: "neutral-eyes" });
  const b = adoptPeerTexture(JSON.parse(JSON.stringify(neutral)), { slug: "neutral-eyes" });
  assert.equal(listCompatibleEmotionPeers([a, b], sad).length, 1);
});

// ---------------------------------------------------------------------------
// Scope — scanning the library index.
// ---------------------------------------------------------------------------

check("the open document alone yields no peers (the original symptom)", () => {
  const openOnly = [sad];
  assert.equal(listCompatibleEmotionPeers(openOnly, sad).length, 0);
});

check("the index scan finds the other project", () => {
  const found = findCompatibleLibraryTextures(INDEX, sad, { excludeSlug: "sad-eyes" });
  assert.equal(found.length, 1);
  assert.equal(found[0].slug, "neutral-eyes");
  assert.equal(found[0].emotion, "neutral");
  assert.equal(found[0].peerKey, "neutral-eyes#" + SHARED_GUID);
});

check("excludeSlug is what keeps the open project out", () => {
  assert.equal(findCompatibleLibraryTextures(INDEX, sad, {}).length, 2);
  assert.equal(findCompatibleLibraryTextures(INDEX, sad, { excludeSlug: "sad-eyes" }).length, 1);
});

check("mesh projects are never scanned for peers", () => {
  const withMesh = [...INDEX, indexEntry("a-body", "body", neutral, "mesh")];
  assert.equal(findCompatibleLibraryTextures(withMesh, sad, { excludeSlug: "sad-eyes" }).length, 1);
});

check("index entries that failed to migrate are skipped", () => {
  const broken = [{ slug: "bad", name: "bad", projectKind: "texture", error: "boom" }, ...INDEX];
  assert.equal(findCompatibleLibraryTextures(broken, sad, { excludeSlug: "sad-eyes" }).length, 1);
});

check("an index entry with no topologyKey is skipped, not guessed at", () => {
  const stale = [{ slug: "old", name: "old", projectKind: "texture", textures: [{ assetGuid: "x", kind: "eye" }] }];
  assert.equal(indexTopologyKey(stale[0].textures[0]), "");
  assert.equal(findCompatibleLibraryTextures(stale, sad, {}).length, 0);
});

check("a different knot count is not compatible", () => {
  const odd = JSON.parse(JSON.stringify(sad));
  const eyeball = odd.layers.find((L) => L.type === "eyeball");
  eyeball.knots.push({ ...eyeball.knots[0], id: "extra" });
  assert.notEqual(eyeTopologyKey(odd), eyeTopologyKey(sad));
  assert.equal(findCompatibleLibraryTextures(INDEX, odd, {}).length, 0);
});

check("the scan is capped", () => {
  const many = [];
  for (let i = 0; i < PEER_SCAN_LIMIT + 7; i++) {
    many.push(indexEntry("p" + i, "p" + i, neutral));
  }
  assert.equal(findCompatibleLibraryTextures(many, sad, {}).length, PEER_SCAN_LIMIT);
});

check("scan order is stable across calls", () => {
  const a = findCompatibleLibraryTextures(INDEX, sad, {}).map((x) => x.peerKey);
  const b = findCompatibleLibraryTextures([...INDEX].reverse(), sad, {}).map((x) => x.peerKey);
  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// Loading peers out of a project document.
// ---------------------------------------------------------------------------

check("peersFromProjectDoc tags origin and normalizes", () => {
  const doc = projectDoc("neutral-eyes", "neutral_eyes", neutral);
  const peers = peersFromProjectDoc(doc, sad);
  assert.equal(peers.length, 1);
  assert.equal(peers[0].peerSlug, "neutral-eyes");
  assert.equal(peers[0].peerProject, "neutral_eyes");
  assert.ok(peers[0].layers.every((L) => Array.isArray(L.knots)));
});

check("peersFromProjectDoc drops incompatible topologies", () => {
  const odd = JSON.parse(JSON.stringify(neutral));
  const eyeball = odd.layers.find((L) => L.type === "eyeball");
  eyeball.knots.push({ ...eyeball.knots[0], id: "extra" });
  const doc = projectDoc("odd-eyes", "odd", odd);
  assert.equal(peersFromProjectDoc(doc, sad).length, 0);
});

// ---------------------------------------------------------------------------
// The fingerprint — keeps the Assign flow from listing a texture against itself.
// ---------------------------------------------------------------------------

check("fingerprint is stable across a JSON round-trip", () => {
  const a = eyePoseFingerprint(sad);
  const b = eyePoseFingerprint(JSON.parse(JSON.stringify(sad)));
  assert.equal(a, b);
  assert.ok(a.length > 0);
});

check("fingerprint separates the two emotions", () => {
  assert.notEqual(eyePoseFingerprint(neutral), eyePoseFingerprint(sad));
});

check("assigning a library eye does not list its source as a peer", () => {
  // Assign copies sad-eyes' eye into a mesh document; the scan then finds the
  // very same eye back in sad-eyes/project.json. Guid and slug both fail to
  // catch it; geometry does.
  const assigned = normalizeEyeTexture(JSON.parse(JSON.stringify(sad)));
  const prints = new Set([eyePoseFingerprint(assigned)]);
  const fromSource = peersFromProjectDoc(projectDoc("sad-eyes", "sad_eyes", sad), assigned);
  assert.equal(fromSource.length, 1); // topology-compatible…
  assert.equal(fromSource.filter((p) => !prints.has(eyePoseFingerprint(p))).length, 0); // …but it IS us
  // The genuinely different emotion still survives.
  const other = peersFromProjectDoc(projectDoc("neutral-eyes", "neutral_eyes", neutral), assigned);
  assert.equal(other.filter((p) => !prints.has(eyePoseFingerprint(p))).length, 1);
});

// ---------------------------------------------------------------------------
// And the discovered peer actually morphs.
// ---------------------------------------------------------------------------

check("a discovered peer morphs to the exact midpoint at t=0.5", () => {
  const doc = projectDoc("neutral-eyes", "neutral_eyes", neutral);
  const peer = peersFromProjectDoc(doc, sad)[0];
  const mid = morphBetweenTextures(sad, peer, 0.5);
  assert.ok(mid);
  const knots = (t) => t.layers.find((L) => L.type === "eyeball").knots;
  const a = knots(sad);
  const b = knots(peer);
  const m = knots(mid);
  assert.equal(m.length, a.length);
  for (let i = 0; i < m.length; i++) {
    assert.ok(Math.abs(m[i].x - (a[i].x + b[i].x) / 2) < 1e-9, `knot ${i} x`);
    assert.ok(Math.abs(m[i].y - (a[i].y + b[i].y) / 2) < 1e-9, `knot ${i} y`);
  }
});

check("morph endpoints are the endpoints", () => {
  const peer = peersFromProjectDoc(projectDoc("neutral-eyes", "n", neutral), sad)[0];
  const at0 = morphBetweenTextures(sad, peer, 0);
  const at1 = morphBetweenTextures(sad, peer, 1);
  assert.equal(eyePoseFingerprint(at0), eyePoseFingerprint(sad));
  assert.equal(eyePoseFingerprint(at1), eyePoseFingerprint(peer));
});

console.log(`\npassed=${passed} failed=${failed}`);
process.exit(failed ? 1 : 0);
