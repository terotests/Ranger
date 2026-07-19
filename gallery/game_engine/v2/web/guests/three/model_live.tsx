// ============================================================================
// model_live.tsx — a LIVE (method-call) ranger:three real glTF MODEL demo.
// ============================================================================
// The first browser-verified demo of the LIVE model-load path. Unlike the
// cube / teapot / courtyard guests (which build primitives from geometry +
// material), this one loads a REAL in-tree GLB through the same seam ylos3d
// uses in the running engine:
//
//   new THREE.GLTFModel("pkg://models/diamond.glb")
//       → rg3d_model_load(uri)
//       → RgRegistryBridge.loadModelAsset  (buffer_read_file packageDir rel,
//         decode GLB via ThreeGLTFFile, decode embedded PNGs, attach root)
//
// The GLB is packaged into the mounted VFS zip at its repo-relative path and the
// host's bridge.packageDir is set (by the viewer) to the model's package root,
// so `pkg://models/diamond.glb` resolves EXACTLY like ylos3d's diamond sprite —
// only here the loaded root is rendered straight to the full-frame canvas.
//
// init() builds Scene / PerspectiveCamera framed on the model, loads the model,
// and adds ambient + directional lights so the facets shade to distinct colours.
// tick(dt) spins the model about Y so it sweeps through many hues each frame.
// ============================================================================

import * as THREE from "ranger:three";

let _scene = null;
let _camera = null;
let _model = null;
let _angle = 0.4;

// Diamond framing: the diamond.glb is a small gem (~unit scale). Scale it up and
// sit the camera back so it fills a good part of the 480² frame. Values adapted
// from ylos3d's makeDiamondSprite (which frames the same GLB in a 40×72 sprite),
// widened to a square full-frame view.
const MODEL_SCALE = 2.4;
const CAM_Z = 5.2;
const TILT_X = 0.16; // fixed downward tilt so top facets catch the key light

function init() {
  _scene = new THREE.Scene();

  // Square aspect (the host renders w==h); a moderate FOV frames the gem large.
  _camera = new THREE.PerspectiveCamera(36, 1.0, 0.1, 100);
  // Look straight down -Z from CAM_Z; the model sits at the origin.
  _camera.setPose(0.0, 0.0, CAM_Z, 0.0, 0.0, 0.0);

  // The REAL model. rg3d_model_load reads the GLB out of the mounted VFS zip via
  // the bridge's packageDir (set by the viewer to the model's package root).
  _model = new THREE.GLTFModel("pkg://models/diamond.glb");
  _scene.add(_model);
  _model.setTransform(0.0, 0.0, 0.0, TILT_X, _angle, 0.0);
  _model.setScale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

  // Ambient fill + a bright key + two coloured fills so the gem's facets shade
  // to many distinct colours instead of one flat hue (mirrors ylos3d's rig).
  const amb = new THREE.AmbientLight(16777215, 0.38);
  _scene.add(amb);
  const key = new THREE.DirectionalLight(16777215, 1.25, 0.4, 1.2, 0.5);
  _scene.add(key);
  const fill = new THREE.DirectionalLight(12648447, 0.55, -0.85, 0.3, -0.5); // 0xc0f0ff cool
  _scene.add(fill);
  const rim = new THREE.DirectionalLight(14745599, 0.70, -0.3, 0.4, -1.0);   // 0xe0f0ff rim
  _scene.add(rim);

  return 1;
}

function tick(dt) {
  // dt in ms; spin the model about Y (~a full turn every ~3s at 0.002 rad/ms).
  _angle = _angle + dt * 0.002;
  _model.setTransform(0.0, 0.0, 0.0, TILT_X, _angle, 0.0);
  _model.setScale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
  return 1;
}

function sceneGuestId() { return _scene.id; }
function cameraGuestId() { return _camera.id; }
