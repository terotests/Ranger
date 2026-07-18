// ============================================================================
// sponza.tsx — the light-probe-volume (Sponza) scene, run 1:1 in the TSX
// interpreter on the Ranger Three façade, edits hot-reloading. This is a faithful
// port of the upstream three.js example (webgl_lightprobe_cubecamera / Sponza):
// the model is loaded, its bounds measured, a bounds-derived shadow-casting sun +
// a diffuse-GI light-probe volume are set up, and the volume is baked by CAPTURING
// the real scene — `probes.bake(renderer, scene, {...})`. There is NO model-named
// host recipe: the generic ThreeTsxBridge reconciles everything declared here and
// runs the capture bake (no analytic tints).
//
// Carve-outs from the upstream example (host plumbing, exactly as teapot.tsx carves
// out OrbitControls + lil-gui + the resize listener — the interpreter has no async /
// DOM / rAF):
//   * the async network glTF download + embedded-light stripping run HOST-side —
//     here the model is `new THREE.GLTFModel('Sponza')` and the host attaches the
//     decoded geometry and publishes its world bounds as `__hostBounds` before
//     init(), so `_box.setFromObject(model)` reads real numbers;
//   * the render loop, FirstPersonControls and the lil-gui panel are the host's —
//     the GUI drives the exported hooks below (which re-bake), the loop calls update().
// Everything else — camera pose, sky, the bounds-derived sun + shadow camera, the
// probe volume and the capture bake — is declared here and hot-reloads.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let sky, dirLight, model, probes;

const sun = new THREE.Vector3();
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

// bounds-derived metrics (filled in init once the host bounds are known).
let modelSize, modelCenter;
let targetY = 0;
let lightBaseDistance = 1;
let probeFar = 1;

const DEG2RAD = 0.017453292519943295;

// Math.max is not in the interpreter — tiny local reducers instead.
function max2(a, b) { if (a > b) { return a; } return b; }
function max3(a, b, c) { return max2(max2(a, b), c); }

const params = {
  enabled: true,
  showProbes: false,
  probeSize: 0.2,
  boundsX: -0.5,
  boundsY: 6,
  boundsZ: -0.3,
  sizeX: 21,
  sizeY: 11,
  sizeZ: 9,
  countX: 10,
  countY: 7,
  countZ: 7,
  bounces: 1,
  lightAzimuth: -45,
  lightElevation: 55,
  lightIntensity: 100.0,
  shadows: true
};

export function init() {

  // CAMERA (the example's logged pose)
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(-10.25, 4.99, 0.40);
  camera.rotation.set(1.6505, -1.5008, 1.6507);

  scene = new THREE.Scene();

  // SKY (Preetham)
  sky = new THREE.Sky();
  sky.scale.setScalar(450000);
  sky.turbidity = 10;
  sky.rayleigh = 2;
  sky.mieCoefficient = 0.005;
  sky.mieDirectionalG = 0.8;
  scene.add(sky);

  // RENDERER (HDR: ACES tone mapping + shadows)
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // MODEL — the host decodes Sponza and publishes its bounds (__hostBounds).
  model = new THREE.GLTFModel('Sponza');
  scene.add(model);

  // BOUNDS -> composition metrics (light distance, target height, probe far),
  // exactly like the upstream example's _box.setFromObject(model).
  _box.setFromObject(model);
  modelSize = _box.getSize(_size).clone();
  modelCenter = _box.getCenter(_center).clone();
  targetY = modelCenter.y + modelSize.y * 0.2;
  lightBaseDistance = max2(modelSize.x, modelSize.z);
  probeFar = max3(modelSize.x, modelSize.y, modelSize.z) * 2.0;

  // SUN — a shadow-casting directional light with a bounds-derived shadow camera.
  dirLight = new THREE.DirectionalLight(0xfff2dc, params.lightIntensity);
  dirLight.castShadow = params.shadows;
  dirLight.shadow.mapSize = 2048;
  const shadowExtent = max2(modelSize.x, modelSize.z) * 0.7;
  dirLight.shadow.camera.left = -shadowExtent;
  dirLight.shadow.camera.right = shadowExtent;
  dirLight.shadow.camera.top = shadowExtent;
  dirLight.shadow.camera.bottom = -shadowExtent;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = modelSize.y * 4.0;
  scene.add(dirLight.target);
  scene.add(dirLight);

  // LIGHT PROBE VOLUME (diffuse GI).
  probes = new THREE.LightProbeGrid(params.sizeX, params.sizeY, params.sizeZ, params.countX, params.countY, params.countZ);
  probes.position.set(params.boundsX, params.boundsY, params.boundsZ);
  probes.probeSize = params.probeSize;
  probes.showProbes = params.showProbes;
  probes.visible = params.enabled;
  scene.add(probes);

  updateLightPosition();
  bakeWithSettings();
}

// Place the sun from azimuth + elevation (scaled by the model size), aim it at the
// model centre, and drive the sky's sun uniform — verbatim upstream math.
export function updateLightPosition() {

  const azimuth = params.lightAzimuth * DEG2RAD;
  const elevation = params.lightElevation * DEG2RAD;
  const radius = lightBaseDistance;
  const horizontal = Math.cos(elevation) * radius;
  const vertical = Math.sin(elevation) * radius;

  dirLight.position.set(
    modelCenter.x + Math.cos(azimuth) * horizontal,
    targetY + vertical,
    modelCenter.z + Math.sin(azimuth) * horizontal
  );
  dirLight.target.position.set(modelCenter.x, targetY, modelCenter.z);
  dirLight.target.updateMatrixWorld();
  dirLight.intensity = params.lightIntensity;

  const phi = (90 - params.lightElevation) * DEG2RAD;
  const theta = params.lightAzimuth * DEG2RAD;
  sun.setFromSphericalCoords(1, phi, theta);
  sky.sunPosition.copy(sun);
}

// Bake the diffuse-GI probe volume by capturing the real scene at each probe
// (probes.bake -> the bridge runs ThreeLightProbeVolume.bakeFromScene). Called on
// init and whenever a GUI knob that affects the bake changes (the host debounces).
export function bakeWithSettings() {
  probes.position.set(params.boundsX, params.boundsY, params.boundsZ);
  probes.visible = params.enabled;
  probes.bake(renderer, scene, { cubemapSize: 32, near: 0.05, far: probeFar, bounces: params.bounces });
}

// --- host hooks (the host's FirstPersonControls + lil-gui panel drive these) ---
export function setLightAzimuth(v) { params.lightAzimuth = v; updateLightPosition(); bakeWithSettings(); }
export function setLightElevation(v) { params.lightElevation = v; updateLightPosition(); bakeWithSettings(); }
export function setLightIntensity(v) { params.lightIntensity = v; dirLight.intensity = v; bakeWithSettings(); }
export function setShadows(on) { params.shadows = on; dirLight.castShadow = on; bakeWithSettings(); }
export function setGI(on) { params.enabled = on; probes.visible = on; }
export function setBounces(v) { params.bounces = v; bakeWithSettings(); }
export function setProbeCountX(v) { params.countX = v; probes.countX = v; bakeWithSettings(); }
export function setProbeCountY(v) { params.countY = v; probes.countY = v; bakeWithSettings(); }
export function setProbeCountZ(v) { params.countZ = v; probes.countZ = v; bakeWithSettings(); }
export function setShowProbes(on) { params.showProbes = on; probes.showProbes = on; }

// --- game-controller navigation ---------------------------------------------
// Read the STANDARD Web Gamepad API — the same navigator.getGamepads() call a
// browser three.js scene makes — from the per-frame update loop, and return a
// movement/look intent the host folds into the first-person camera alongside WASD
// and mouse-look. Left stick + d-pad move, right stick looks, shoulder buttons
// (LB/RB) fly down/up. Nothing here is engine-specific: any pad-reading three.js
// snippet works because the host fills navigator.getGamepads() like the browser.
export function update(dt) {
  const pads = navigator.getGamepads();
  const p = pads[0];
  let moveX = 0;
  let moveZ = 0;
  let moveY = 0;
  let lookX = 0;
  let lookY = 0;
  if (p) {
    const ax = p.axes;
    const b = p.buttons;
    moveX = ax[0];        // left stick X -> strafe
    moveZ = 0 - ax[1];    // left stick Y (up = -1) -> forward
    lookX = ax[2];        // right stick -> look
    lookY = ax[3];
    if (b[12] && b[12].pressed) { moveZ = 1; }       // d-pad up
    if (b[13] && b[13].pressed) { moveZ = 0 - 1; }   // d-pad down
    if (b[14] && b[14].pressed) { moveX = 0 - 1; }   // d-pad left
    if (b[15] && b[15].pressed) { moveX = 1; }       // d-pad right
    if (b[4] && b[4].pressed) { moveY = 0 - 1; }     // LB -> down
    if (b[5] && b[5].pressed) { moveY = 1; }         // RB -> up
  }
  return { moveX: moveX, moveZ: moveZ, moveY: moveY, lookX: lookX, lookY: lookY };
}
