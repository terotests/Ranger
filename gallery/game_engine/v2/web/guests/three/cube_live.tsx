// ============================================================================
// cube_live.tsx — a LIVE (method-call) ranger:three spinning cube.
// ============================================================================
// The keystone guest for RETIRE-RECONCILE: it drives the ranger:three façade
// DIRECTLY (Scene / PerspectiveCamera / BoxGeometry / MeshLambertMaterial /
// Mesh / lights), so every construction is an immediate host method-call through
// RgRegistryBridge → RgRangerThree → ThreeSceneHost. No reconciler, no needsUpdate
// diff: init() builds the scene once, tick(dt) mutates the mesh transform each
// frame, and the host software-renders the live scene to a pixel buffer.
//
// The host resolves the scene/camera to their ThreeSceneHost indices via the two
// tiny accessors below (sceneGuestId / cameraGuestId), which return the guest
// handle ids the bridge minted for this scene's exactly-one Scene and Camera.
// ============================================================================

import * as THREE from "ranger:three";

let _scene = null;
let _camera = null;
let _mesh = null;
let _angle = 0.6;

function init() {
  _scene = new THREE.Scene();

  // setPose = (position x/y/z, EULER rotation x/y/z). Sit the camera on +Z
  // looking down -Z at the cube; the cube's own tick() rotation shows faces.
  _camera = new THREE.PerspectiveCamera(50, 1.0, 0.1, 100);
  _camera.setPose(0.0, 0.0, 4.2, 0.0, 0.0, 0.0);

  const geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const mat = new THREE.MeshLambertMaterial(3512575); // 0x3597ff, a vivid blue
  _mesh = new THREE.Mesh(geo, mat);
  _scene.add(_mesh);

  // A soft white ambient plus three COLOURED directionals — each visible face
  // catches a different mix, so a single-hue cube still resolves to many
  // distinct pixel colours (a plain flat cube would read as near-uniform).
  const amb = new THREE.AmbientLight(16777215, 0.34);
  _scene.add(amb);
  const key = new THREE.DirectionalLight(16777215, 1.15, 0.5, 0.8, 0.6);
  _scene.add(key);
  const warm = new THREE.DirectionalLight(16745300, 0.85, -0.8, 0.2, 0.4);
  _scene.add(warm);
  const cool = new THREE.DirectionalLight(5286143, 0.8, 0.2, -0.7, -0.6);
  _scene.add(cool);

  return 1;
}

function tick(dt) {
  // dt arrives in milliseconds; advance a compound rotation so several faces
  // sweep through view over the demo window.
  _angle = _angle + dt * 0.0016;
  _mesh.setTransform(0.0, 0.0, 0.0, _angle * 0.55, _angle, _angle * 0.32);
  return 1;
}

// Handle-id accessors: the host resolves these guest ids to ThreeSceneHost
// indices via bridge.resolveGuestId → d3.sceneH / d3.cameraH.
function sceneGuestId() { return _scene.id; }
function cameraGuestId() { return _camera.id; }
