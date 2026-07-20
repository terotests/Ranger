// ============================================================================
// pinball_live.tsx — a canonical Three.js pinball table, run 1:1 on the GPU.
// ============================================================================
// Written in ordinary three.js (`import * as THREE from 'three'`) against the
// Ranger three.tsx façade, so it runs through ComponentEngine + ThreeTsxBridge +
// ThreeGLBackend and renders with REAL WebGL on a <canvas>: hardware-lit Phong
// materials, a 2048² PCF shadow map cast by the key light, and ACES tone
// mapping. Same table the software v2 game draws (playfield art, pop bumpers,
// targets, spinner, flippers, chrome ball) — now on the GPU with real shadows.
//
// World: Y up. The table lies flat in XZ; z = -8 is the top (bumpers, far end),
// z = +7 is the flipper end (near the camera). The ball wanders the playfield so
// any grabbed frame shows it in play.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let ball, keyLight;
let t = 0;

// A stub cube texture: its mere presence as material.envMap flags the material
// reflective; the host supplies the actual dark-studio cube (enableEnvironment).
const ENV = new THREE.CubeTexture();

// glossy shiny cap / metal
function phong(colorHex, specHex, shininess) {
  return new THREE.MeshPhongMaterial({ color: colorHex, specular: specHex, shininess: shininess });
}
// reflective metal (samples the studio env cube) — chrome ball, glossy caps
function chrome(colorHex, specHex, shininess) {
  return new THREE.MeshPhongMaterial({ color: colorHex, specular: specHex, shininess: shininess, envMap: ENV });
}
function sized(w, h, d) {
  const g = new THREE.BoxGeometry();
  g.width = w; g.height = h; g.depth = d;
  return g;
}
function addBox(w, h, d, mat, x, y, z, ry) {
  const m = new THREE.Mesh(sized(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(0, ry, 0);
  scene.add(m);
  return m;
}

export function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);

  // Angled cabinet view: above and behind the flipper end, tilted down the table.
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 200);
  camera.position.set(0, 12.6, 15.0);
  camera.rotation.set(-0.64, 0, 0);

  // ---- playfield: flat plane with the printed art, near-matte so real shadows
  // (the GPU shadow map) read against the bright baked art ----------------------
  const tex = new THREE.TextureLoader().load('playfield.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  const pfGeo = new THREE.PlaneGeometry(10.0, 17.0, 8, 14);
  const pfMat = new THREE.MeshPhongMaterial({ map: tex, color: 0x9a9aa8, specular: 0x0a0c14, shininess: 8 });
  const pf = new THREE.Mesh(pfGeo, pfMat);
  pf.rotation.set(-1.5707963, 0, 0);
  scene.add(pf);

  // ---- cabinet frame: dark brushed-metal rails standing proud ----------------
  // low specular so the frame reads as a dark matte cabinet, not glary chrome.
  const rail = phong(0x10131f, 0x3a4260, 20);
  addBox(0.7, 1.4, 17.6, rail, -5.35, 0.55, 0, 0);   // left
  addBox(0.7, 1.4, 17.6, rail, 5.35, 0.55, 0, 0);    // right
  addBox(11.4, 1.4, 0.7, rail, 0, 0.55, -8.75, 0);   // top
  addBox(11.4, 1.1, 0.7, rail, 0, 0.4, 8.75, 0);     // apron (flipper end)

  // ---- backbox + DMD at the far (top) end ------------------------------------
  // A dark cabinet head standing up behind the top rail, carrying an amber
  // dot-matrix score panel drawn UNLIT (MeshBasicMaterial) so it self-glows.
  const boxMat = phong(0x0a0b13, 0x2b3252, 22);
  addBox(7.4, 3.6, 0.7, boxMat, 0, 1.5, -9.7, 0);          // head body
  addBox(7.8, 0.5, 1.0, boxMat, 0, 3.35, -9.55, 0);        // head lip
  const dmdTex = new THREE.TextureLoader().load('dmd.png');
  dmdTex.colorSpace = THREE.SRGBColorSpace;
  const dmd = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.14, 1, 1),
    new THREE.MeshBasicMaterial({ map: dmdTex }));
  dmd.position.set(0, 2.15, -9.28);
  dmd.rotation.set(-0.46, 0, 0);
  scene.add(dmd);

  // ---- pop bumpers: glossy round caps, shadow casters ------------------------
  const bumpers = [
    [-2.4, -5.2, 0x2f7bff],
    [0.0, -6.2, 0xff4d6d],
    [2.4, -5.2, 0xba5cff],
  ];
  let bi = 0;
  while (bi < bumpers.length) {
    const b = bumpers[bi];
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.7, 28), phong(b[2], 0x6a6a6a, 34));
    cap.position.set(b[0], 0.55, b[1]);
    scene.add(cap);
    // a slim base ring under the cap
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 0.18, 28), phong(0x0c1020, 0x556, 30));
    base.position.set(b[0], 0.12, b[1]);
    scene.add(base);
    bi = bi + 1;
  }

  // ---- spinner + bank targets: glossy studs ---------------------------------
  const spin = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.24, 30), phong(0xf5cf46, 0xffffff, 60));
  spin.position.set(-3.35, 0.2, -1.3);
  scene.add(spin);

  const targets = [
    [-1.6, -2.3, 0xffd23c], [1.6, -2.3, 0x5ac8ff],
    [-2.9, 0.0, 0xff5064], [2.9, 0.0, 0x50cd82], [0.0, 1.1, 0xfadc50],
  ];
  let ti = 0;
  while (ti < targets.length) {
    const g = targets[ti];
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 16), phong(g[2], 0xffffff, 60));
    s.position.set(g[0], 0.46, g[1]);
    scene.add(s);
    ti = ti + 1;
  }

  // ---- flippers + centre lane arrows ----------------------------------------
  const flipMat = phong(0xe8443f, 0xffd0c0, 40);
  addBox(2.3, 0.42, 0.7, flipMat, -1.35, 0.32, 5.4, 0.42);
  addBox(2.3, 0.42, 0.7, flipMat, 1.35, 0.32, 5.4, -0.42);
  const arrowMat = phong(0xffb020, 0xffffff, 30);
  addBox(0.5, 0.22, 2.0, arrowMat, -0.9, 0.2, 3.1, 0);
  addBox(0.5, 0.22, 2.0, arrowMat, 0.0, 0.2, 3.1, 0);
  addBox(0.5, 0.22, 2.0, arrowMat, 0.9, 0.2, 3.1, 0);

  // ---- the chrome ball -------------------------------------------------------
  ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 30, 22), chrome(0xe2e6f0, 0xffffff, 200));
  ball.position.set(0, 0.5, -3);
  scene.add(ball);

  // ---- lights: ambient fill + shadow-casting key + cool fill -----------------
  const amb = new THREE.AmbientLight(0xffffff, 0.30);
  scene.add(amb);

  keyLight = new THREE.DirectionalLight(0xfff3e2, 1.5);
  keyLight.position.set(-5.5, 15.0, 3.5);
  keyLight.target.position.set(0, 0, -1.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize = 2048;
  keyLight.shadow.camera.left = -11;
  keyLight.shadow.camera.right = 11;
  keyLight.shadow.camera.top = 13;
  keyLight.shadow.camera.bottom = -13;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 60;
  scene.add(keyLight);

  const fill = new THREE.DirectionalLight(0x5f7bff, 0.42);
  fill.position.set(6.5, 8.0, -5.0);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(0, 6.0, -11.0);
  scene.add(rim);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setAnimationLoop(animate);
}

function animate() {
  t = t + 0.016;
  // the ball wanders a lively figure-eight across the playfield, staying in play
  const bx = 2.7 * Math.sin(t * 1.6);
  const bz = -3.4 + 3.6 * Math.sin(t * 1.05);
  ball.position.set(bx, 0.5, bz);
  ball.rotation.set(t * 2.3, t * 1.7, 0);
  renderer.render(scene, camera);
}

// --- host frame hooks (the GL host calls tick() each requestAnimationFrame) ---
export function tick() { animate(); }
export function frames() { return renderer.frames; }
export function sceneReady() { return scene.children.length; }
