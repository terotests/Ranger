// ============================================================================
// sponza.tsx — the light-probe-volume (Sponza) scene, run 1:1 in the TSX
// interpreter on the Ranger Three façade, edits hot-reloading — the same kind of
// thing teapot.tsx is. This is the *scene declaration*; it drives the Ranger core
// through ThreeSponzaTsxBridge, and edits (sky, light angle, probe grid, GI)
// hot-reload live, exactly like editing the teapot's materials.
//
// Carve-outs from the upstream example (host plumbing, as teapot.tsx carved out
// OrbitControls + the lil-gui panel + the resize listener):
//   * the async network glTF download runs HOST-side — here the model is declared
//     `new THREE.GLTFModel('Sponza')` and the host attaches the decoded geometry
//     + measures its bounds (the interpreter has no fetch/await);
//   * the render loop, FirstPersonControls integration and the lil-gui panel are
//     the host's (they call the exported hooks below);
//   * shadow-camera extents + the light distance derive from the model bounds,
//     which are host-side, so the bridge fills those in.
// Everything else — the sky, the shadow-casting sun, the probe volume config and
// the GUI params — is declared here and hot-reloads. The verbatim upstream script
// (with fetch/await/setTimeout/GUI) is kept in ../IDEAL_SPONZA.md.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let sky, dirLight, model, probes;
const sun = new THREE.Vector3();
const DEG2RAD = 0.017453292519943295;

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

  // MODEL — the host loads Sponza and measures its bounds.
  model = new THREE.GLTFModel('Sponza');
  scene.add(model);

  // SUN — a shadow-casting directional light.
  dirLight = new THREE.DirectionalLight(0xfff2dc, params.lightIntensity);
  dirLight.castShadow = params.shadows;
  dirLight.shadow.mapSize = 2048;
  scene.add(dirLight.target);
  scene.add(dirLight);

  // LIGHT PROBE VOLUME (diffuse GI).
  probes = new THREE.LightProbeGrid(params.sizeX, params.sizeY, params.sizeZ, params.countX, params.countY, params.countZ);
  probes.position.set(params.boundsX, params.boundsY, params.boundsZ);
  probes.bounces = params.bounces;
  probes.visible = params.enabled;
  scene.add(probes);

  updateLightPosition();
}

// Place the sun from azimuth + elevation and drive the sky's sun uniform. The
// direction is bounds-free; the bridge scales it by the model size for the actual
// light position and shadow camera.
export function updateLightPosition() {

  const azimuth = params.lightAzimuth * DEG2RAD;
  const elevation = params.lightElevation * DEG2RAD;
  const horizontal = Math.cos(elevation);
  dirLight.position.set(Math.cos(azimuth) * horizontal, Math.sin(elevation), Math.sin(azimuth) * horizontal);
  dirLight.intensity = params.lightIntensity;

  const phi = (90 - params.lightElevation) * DEG2RAD;
  const theta = params.lightAzimuth * DEG2RAD;
  sun.setFromSphericalCoords(1, phi, theta);
  sky.sunPosition.copy(sun);
}

// --- host hooks (the host's FirstPersonControls + lil-gui panel drive these) ---
export function setLightAzimuth(v) { params.lightAzimuth = v; updateLightPosition(); }
export function setLightElevation(v) { params.lightElevation = v; updateLightPosition(); }
export function setLightIntensity(v) { params.lightIntensity = v; updateLightPosition(); }
export function setShadows(on) { params.shadows = on; dirLight.castShadow = on; }
export function setGI(on) { params.enabled = on; probes.visible = on; }
export function setBounces(v) { params.bounces = v; probes.bounces = v; }
export function setProbeCountX(v) { params.countX = v; probes.countX = v; }
export function setProbeCountY(v) { params.countY = v; probes.countY = v; }
export function setProbeCountZ(v) { params.countZ = v; probes.countZ = v; }
export function setShowProbes(on) { params.showProbes = on; }
