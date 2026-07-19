// ============================================================================
// teapot_live.tsx — a LIVE (method-call) ranger:three spinning Utah teapot.
// ============================================================================
// Second RETIRE-RECONCILE demo on the live path: same generic WebLive3dHost as
// cube_live, but exercises TeapotGeometry (added to the live registry) instead
// of a box. Every construction is an immediate host method-call through
// RgRegistryBridge → RgRangerThree → ThreeSceneHost — no reconciler. init()
// builds the scene once; tick(dt) spins the teapot; the host software-renders
// the live scene to a pixel buffer each frame.
// ============================================================================

import * as THREE from "ranger:three";

let _scene = null;
let _camera = null;
let _mesh = null;
let _angle = 0.4;

function init() {
  _scene = new THREE.Scene();

  // Camera on +Z looking down -Z; pulled back to frame the teapot (its
  // geometry spans a few units around the origin).
  _camera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 200);
  _camera.setPose(0.0, 0.6, 9.5, 0.0, 0.0, 0.0);

  // TeapotGeometry(size, segments, bottom, lid, body, fitLid, blinn).
  const geo = new THREE.TeapotGeometry(2.2, 8, true, true, true, false, true);
  const mat = new THREE.MeshLambertMaterial(3512575); // 0x3597ff vivid blue
  _mesh = new THREE.Mesh(geo, mat);
  _scene.add(_mesh);
  // Tilt the pot down a touch so the lid/spout read against the camera.
  _mesh.setTransform(0.0, -1.0, 0.0, 0.0, 0.0, 0.0);

  // Soft ambient + three coloured directionals so the curved surface shades to
  // many distinct pixel colours (a single flat hue would read near-uniform).
  const amb = new THREE.AmbientLight(16777215, 0.32);
  _scene.add(amb);
  const key = new THREE.DirectionalLight(16777215, 1.15, 0.5, 0.8, 0.6);
  _scene.add(key);
  const warm = new THREE.DirectionalLight(16745300, 0.8, -0.8, 0.2, 0.4);
  _scene.add(warm);
  const cool = new THREE.DirectionalLight(5286143, 0.75, 0.2, -0.7, -0.6);
  _scene.add(cool);

  return 1;
}

function tick(dt) {
  // dt in ms; spin about Y so the spout/handle sweep through view.
  _angle = _angle + dt * 0.0013;
  _mesh.setTransform(0.0, -1.0, 0.0, 0.12, _angle, 0.0);
  return 1;
}

function sceneGuestId() { return _scene.id; }
function cameraGuestId() { return _camera.id; }
