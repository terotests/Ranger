// ============================================================================
// transport_guard.mjs — the preview host must stay on the v2 transport.
// ============================================================================
//
//   node gallery/game_engine/v2/mesh_editor/tests/host/transport_guard.mjs
//
// web_mesh_editor_host.rgr used to import three/port classes and mutate
// ThreeSceneHost's arrays directly (`push host.geometries g`), bypassing the
// registry entirely — the shape v2/AGENTS.md rule 3 exists to prevent. It now
// drives RgRegistryBridge.invoke("rg3d_*") like any TSX or wasm32 guest.
//
// Two halves:
//   1. STATIC  — the host may not re-acquire direct three/port resource imports
//                or poke arena internals.
//   2. RUNTIME — the commands actually build a scene that renders, with zero
//                dispatch errors, and the shared-atlas semantics still hold.
//
// The shared-atlas case is subtle and was nearly lost in the port: the old host
// handed ONE mutable ThreeTexture to every part, so a batch always showed the
// LAST atlas uploaded. UVs are global across the profile (v = row / rows-1), so
// that sharing is what makes a multi-part gradient continuous. A command API
// mints a texture per material, so the host re-applies the staged atlas to
// every live part. Without that, each part samples its own atlas through global
// UVs and a seam appears at every segment boundary.
//
// Prints the v2 grep convention: "  PASS/FAIL <name>", "passed=X failed=Y",
// "ALL PASS" / "SOME FAILED".
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const MESH_EDITOR = path.resolve(HERE, "../..");
const REPO_ROOT = path.resolve(MESH_EDITOR, "../../../..");
const HOST_RGR = path.join(MESH_EDITOR, "host", "web_mesh_editor_host.rgr");
const DIST = path.join(MESH_EDITOR, "dist");

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ---------------------------------------------------------------------------
// 1. static
// ---------------------------------------------------------------------------
const src = fs.readFileSync(HOST_RGR, "utf8");

check(
  "host imports the one live transport (RgRegistryBridge)",
  /Import\s+"[^"]*RgRegistryBridge\.rgr"/.test(src),
);

// three/port resource classes must not come back as direct imports. The GL
// backend is allowed: choosing a presentation backend is a renderer concern,
// not a scene mutation.
const FORBIDDEN_IMPORTS = [
  "three_scene_host.rgr",
  "three_buffer_geometry.rgr",
  "three_mesh.rgr",
  "three_material.rgr",
  "three_texture.rgr",
];
for (const f of FORBIDDEN_IMPORTS) {
  check(
    `host does not import ${f} directly`,
    !new RegExp(`Import\\s+"[^"]*${f.replace(".", "\\.")}"`).test(src),
  );
}

check(
  "host does not push into the arena's geometry array",
  !/push\s+host\.geometries/.test(src) && !/push\s+this\.host\.geometries/.test(src),
);

// Every resource create / scene mutation should be an rg3d_* command.
const REQUIRED_COMMANDS = [
  "rg3d_scene_create",
  "rg3d_geometry_buffer",
  "rg3d_mesh_create",
  "rg3d_entity_set_parent",
  "rg3d_entity_remove",
  "rg3d_material_map_rgba",
  "rg3d_orbit_apply",
];
for (const c of REQUIRED_COMMANDS) {
  check(`host issues ${c}`, src.includes(`"${c}"`));
}

// ---------------------------------------------------------------------------
// 2. runtime
// ---------------------------------------------------------------------------
if (!fs.existsSync(path.join(DIST, "mesh_editor.bundle.js"))) {
  execFileSync("node", [path.join(MESH_EDITOR, "build-host.mjs")], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });
}

const { SplineLathe } = await import(
  url.pathToFileURL(path.join(MESH_EDITOR, "tessellate", "spline_lathe.mjs")).href
);

const root = globalThis;
// The bundle is a plain script that installs globals, same as the browser.
eval(fs.readFileSync(path.join(DIST, "vfs.js"), "utf8"));
eval(fs.readFileSync(path.join(DIST, "engine-host.js"), "utf8"));
const engine = root.RangerEngineHost.createEngine(
  fs.readFileSync(path.join(DIST, "mesh_editor.bundle.js"), "utf8"),
  new root.RangerVFS(),
  {},
);
const host = new engine.WebMeshEditorHost();
host.init(120, 120);

check("init completed through commands (ready)", host.ready === true);
check("scene / camera / orbit guest ids minted", host.sceneId > 0 && host.camId > 0 && host.orbitId > 0, `scene=${host.sceneId} cam=${host.camId} orbit=${host.orbitId}`);

function rangerBuffer(bytes) {
  const src8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const ab = new ArrayBuffer(src8.byteLength);
  new Uint8Array(ab).set(src8);
  ab._view = new DataView(ab);
  return ab;
}

/** Flat RGBA atlas of one colour. */
function solidAtlas(r, g, b, w = 4, h = 8) {
  const out = [];
  for (let i = 0; i < w * h; i++) out.push(r, g, b, 255);
  return { bytes: new Uint8Array(out), w, h };
}

function frameColours() {
  host.frame(16);
  const px = new Uint8Array(host.framePixels());
  const seen = new Map();
  for (let i = 0; i + 2 < px.length; i += 3) {
    const k = `${px[i]},${px[i + 1]},${px[i + 2]}`;
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  return seen;
}

const knots = SplineLathe.defaultKnots();
const mesh = SplineLathe.sampleAndLatheEx(knots, 0, 8, 16, Math.PI * 2, true);
const pos = Array.from(mesh.positions);
const nrm = Array.from(mesh.normals);
const uvs = Array.from(mesh.uvs);
const idx = Array.from(mesh.indices);

// Two parts, each staged with its OWN atlas — the shared-atlas rule says both
// end up showing the second one.
const red = solidAtlas(255, 0, 0);
const blue = solidAtlas(0, 0, 255);

host.beginParts();
host.setPartMapBuffer(rangerBuffer(red.bytes), red.w, red.h);
host.addPart(pos, nrm, uvs, idx, 0xffffff, 220, 1, 0, [], red.w, red.h);
host.setPartMapBuffer(rangerBuffer(blue.bytes), blue.w, blue.h);
host.addPart(pos, nrm, uvs, idx, 0xffffff, 220, 1, 0, [], blue.w, blue.h);

check("both parts registered", host.partCount() === 2, `partCount=${host.partCount()}`);
check("no bridge dispatch errors", host.bridge.errorCount === 0, `errorCount=${host.bridge.errorCount} last=${host.bridge.lastError}`);

// Count lit PIXELS, not distinct colours: these atlases are flat, so a correct
// render legitimately has only a handful of shades.
const colours = frameColours();
const litCount = [...colours.entries()]
  .filter(([k]) => k !== "30,33,40")
  .reduce((a, [, n]) => a + n, 0);
check("scene renders through the command path", litCount > 200, `lit pixels=${litCount}`);

const blueish = [...colours.entries()]
  .filter(([k, n]) => {
    const [r, g, b] = k.split(",").map(Number);
    return b > 90 && b > r + 40 && b > g + 40 && n > 4;
  })
  .reduce((a, [, n]) => a + n, 0);
const reddish = [...colours.entries()]
  .filter(([k, n]) => {
    const [r, g, b] = k.split(",").map(Number);
    return r > 90 && r > b + 40 && r > g + 40 && n > 4;
  })
  .reduce((a, [, n]) => a + n, 0);

check(
  "the batch shows the LAST staged atlas (shared-atlas semantics)",
  blueish > 0,
  `blueish=${blueish} reddish=${reddish}`,
);
check(
  "the superseded atlas is gone from every part",
  reddish === 0,
  `reddish=${reddish} — a part kept its own atlas, so global UVs will seam`,
);

// A hot swap with no re-tessellation must repaint the existing parts.
const green = solidAtlas(0, 255, 0);
host.updatePartMapBuffer(rangerBuffer(green.bytes), green.w, green.h);
const after = frameColours();
const greenish = [...after.entries()]
  .filter(([k, n]) => {
    const [r, g, b] = k.split(",").map(Number);
    return g > 90 && g > r + 40 && g > b + 40 && n > 4;
  })
  .reduce((a, [, n]) => a + n, 0);
check("hot atlas swap repaints live parts without re-tessellating", greenish > 0, `greenish=${greenish}`);
check("part count unchanged by a hot swap", host.partCount() === 2, `partCount=${host.partCount()}`);

console.log(`passed=${passed} failed=${failed}`);
console.log(failed === 0 ? "ALL PASS" : "SOME FAILED");
process.exit(failed === 0 ? 0 : 1);
