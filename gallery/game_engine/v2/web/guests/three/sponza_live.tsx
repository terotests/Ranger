// ============================================================================
// sponza_live.tsx — a LIVE (method-call) ranger:three procedural courtyard.
// ============================================================================
// Third RETIRE-RECONCILE demo on the live path. Like cube_live / teapot_live it
// drives the ranger:three façade DIRECTLY (Scene / PerspectiveCamera / geometry
// / material / Mesh / lights) — every construction is an immediate host method
// call through RgRegistryBridge → RgRangerThree → ThreeSceneHost, no reconciler.
//
// This is the "sponza"-style PROCEDURAL scene the web_sponza_tsx_host demo shows
// (a ground plane + a cluster of boxes + lights), not the real Sponza atrium. It
// exercises the newly-added live PlaneGeometry (laid flat as a floor) alongside
// BoxGeometry and the ambient/directional lights. init() builds the scene once;
// tick(dt) slowly orbits the CAMERA around the origin so the floor + boxes sweep
// through view and shade to many distinct colours.
// ============================================================================

import * as THREE from "ranger:three";

let _scene = null;
let _camera = null;
let _angle = 0.6;

// Camera orbit parameters: a circle of radius R at height Y, always aimed back
// at the origin. setPose takes EULER angles — yaw about Y equals the orbit angle
// (rotating the default -Z view onto the origin), plus a fixed downward pitch so
// the floor reads under the box cluster.
const ORBIT_R = 22.0;
const ORBIT_Y = 9.0;
const ORBIT_PITCH = -0.34;

function placeCamera(angle) {
  const px = ORBIT_R * Math.sin(angle);
  const pz = ORBIT_R * Math.cos(angle);
  // yaw = atan2(px, pz) = angle; aim the -Z view back through the origin.
  _camera.setPose(px, ORBIT_Y, pz, ORBIT_PITCH, angle, 0.0);
}

// Build one box sitting ON the floor: base geometry w×h×d, positioned so its
// bottom rests at y=0 (centre at h/2), coloured with a lambert material.
function addBox(x, z, w, h, d, colorHex) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial(colorHex);
  const mesh = new THREE.Mesh(geo, mat);
  _scene.add(mesh);
  mesh.setTransform(x, h * 0.5, z, 0.0, 0.0, 0.0);
  return mesh;
}

function init() {
  _scene = new THREE.Scene();

  _camera = new THREE.PerspectiveCamera(55, 1.0, 0.1, 300);
  placeCamera(_angle);

  // Large ground plane laid flat: PlaneGeometry defaults to the XY plane facing
  // +Z, so rotate -90° about X (ex = -PI/2) to make it a floor with its normal
  // pointing up. A muted sandstone lambert so the coloured boxes read against it.
  // SUBDIVIDED (24×24): a single 2-triangle quad this large projects, near the
  // horizon, to a screen span past the SW rasteriser's span guard (w*8) and gets
  // dropped whole — many small triangles each stay under the guard and render.
  const floorGeo = new THREE.PlaneGeometry(60.0, 60.0, 24, 24);
  const floorMat = new THREE.MeshLambertMaterial(12167812); // 0xb9a884 sandstone
  const floor = new THREE.Mesh(floorGeo, floorMat);
  _scene.add(floor);
  floor.setTransform(0.0, 0.0, 0.0, -1.5708, 0.0, 0.0);

  // A little procedural courtyard: boxes of varied size/colour around a plaza.
  addBox(-6.0, -6.0, 3.0, 6.0, 3.0, 14242639); // 0xd9534f red pillar
  addBox( 6.0, -6.0, 3.0, 4.0, 3.0, 6076508);  // 0x5cb85c green block
  addBox(-6.0,  6.0, 3.0, 5.0, 3.0, 3512575);  // 0x3597ff blue block
  addBox( 6.0,  6.0, 3.0, 7.0, 3.0, 15773518); // 0xf0ad4e amber pillar
  addBox( 0.0,  0.0, 4.0, 2.0, 4.0, 10183350); // 0x9b59b6 low purple dais
  addBox(-11.0, 0.0, 2.5, 8.0, 2.5, 1752220);  // 0x1abc9c teal tower
  addBox( 11.0, 0.0, 2.5, 8.0, 2.5, 15108130); // 0xe67e22 orange tower
  addBox( 0.0, 10.0, 5.0, 3.0, 2.0, 14242639); // 0xd9534f red bench

  // Ambient fill + a bright directional "sun" + two coloured fill directionals,
  // so every face of every box shades to a distinct mix (a single flat hue would
  // read near-uniform across the plaza).
  const amb = new THREE.AmbientLight(16777215, 0.30);
  _scene.add(amb);
  const sun = new THREE.DirectionalLight(16777215, 1.20, 0.4, 0.85, 0.30);
  _scene.add(sun);
  const warm = new THREE.DirectionalLight(16756832, 0.55, -0.7, 0.35, 0.40); // 0xffb060
  _scene.add(warm);
  const cool = new THREE.DirectionalLight(6332671, 0.50, 0.30, 0.40, -0.70);  // 0x60a0ff
  _scene.add(cool);

  return 1;
}

function tick(dt) {
  // dt in ms; slowly orbit the camera around the plaza so the floor + boxes
  // sweep through view (a full loop takes ~26s at 0.00024 rad/ms).
  _angle = _angle + dt * 0.00024;
  placeCamera(_angle);
  return 1;
}

function sceneGuestId() { return _scene.id; }
function cameraGuestId() { return _camera.id; }
