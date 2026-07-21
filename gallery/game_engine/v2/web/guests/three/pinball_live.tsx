// ============================================================================
// pinball_live.tsx — a canonical Three.js pinball table, run 1:1 on the GPU,
// now with a working MECHANISM: attract-mode physics drives every part.
// ============================================================================
// Written in ordinary three.js (`import * as THREE from 'three'`) against the
// Ranger three.tsx façade → ComponentEngine + ThreeTsxBridge + ThreeGLBackend →
// REAL WebGL (hardware Phong lighting, a 2048² PCF shadow map, ACES tone
// mapping, a studio env cube for the chrome ball).
//
// Beyond the visuals, the parts now behave like a real table:
//   • flippers pivot about their shaft and snap up (attract auto-flip), kicking
//     the ball with the rubber edge;
//   • pop bumpers kick the ball radially and "pop" (a scale flash) on contact;
//   • slingshots kick the ball off their bands;
//   • the spinner spins as the ball passes;
//   • the ball obeys gravity down the incline, bounces off the walls, and on
//     draining is re-plunged up the right lane — so the table plays itself.
//
// World: Y up. The table lies flat in XZ; z=-8 is the top (bumpers), z=+6 is the
// flipper/drain end (near the camera). Physics runs in the XZ plane (the incline
// is modelled as a constant "gravity" toward +z).
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let ball, keyLight;

// A stub cube texture: its presence as material.envMap flags the material
// reflective; the host supplies the actual dark-studio cube (enableEnvironment).
const ENV = new THREE.CubeTexture();

function phong(colorHex, specHex, shininess) {
  return new THREE.MeshPhongMaterial({ color: colorHex, specular: specHex, shininess: shininess });
}
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

// ---- physics state ---------------------------------------------------------
const R = 0.5;                 // ball radius
const GRAV = 0.0115;           // incline pull toward +z (down the table)
const WALL_X = 4.45, TOP_Z = -7.9, DRAIN_Z = 6.9;
let bx = 4.2, bz = 5.4, vx = 0.0, vz = -0.85;   // ball pos + velocity (XZ)
let by = R, spin = 0;

// flippers: single-mesh pivots. side=+1 left (extends toward +x), -1 right.
// phi animates rest(-0.5, tip down-inward) → active(+0.5, tip up-inward).
const FLEN = 2.05, FHW = 0.30;
let flippers = [];   // {side, px, pz, phi, target, mesh}
// pop bumpers: circle colliders + pop flash.
let bumpers = [];    // {x, z, r, mesh, base, flash}
// slingshot bands: line colliders (a,b) + a flash mesh.
let slings = [];     // {ax, az, bx, bz, mesh, flash}
let spinner = null;  // {mesh, spin}

export function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 200);
  camera.position.set(0, 12.6, 15.0);
  camera.rotation.set(-0.64, 0, 0);

  // ---- playfield: printed art, near-matte so real shadows read --------------
  const tex = new THREE.TextureLoader().load('playfield.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(10.0, 17.0, 8, 14),
    new THREE.MeshPhongMaterial({ map: tex, color: 0x9a9aa8, specular: 0x0a0c14, shininess: 8 }));
  pf.rotation.set(-1.5707963, 0, 0);
  scene.add(pf);

  // ---- cabinet frame: dark matte rails --------------------------------------
  const rail = phong(0x10131f, 0x3a4260, 20);
  addBox(0.7, 1.4, 17.6, rail, -5.35, 0.55, 0, 0);
  addBox(0.7, 1.4, 17.6, rail, 5.35, 0.55, 0, 0);
  addBox(11.4, 1.4, 0.7, rail, 0, 0.55, -8.75, 0);
  addBox(11.4, 1.1, 0.7, rail, 0, 0.4, 8.75, 0);

  // ---- backbox + DMD at the far (top) end ------------------------------------
  const boxMat = phong(0x0a0b13, 0x2b3252, 22);
  addBox(7.4, 3.6, 0.7, boxMat, 0, 1.5, -9.7, 0);
  addBox(7.8, 0.5, 1.0, boxMat, 0, 3.35, -9.55, 0);
  const dmdTex = new THREE.TextureLoader().load('dmd.png');
  dmdTex.colorSpace = THREE.SRGBColorSpace;
  const dmd = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.14, 1, 1),
    new THREE.MeshBasicMaterial({ map: dmdTex }));
  dmd.position.set(0, 2.15, -9.28);
  dmd.rotation.set(-0.46, 0, 0);
  scene.add(dmd);

  // ---- pop bumpers: glossy caps, shadow casters, physical colliders ----------
  const bdefs = [[-2.4, -5.2, 0x2f7bff], [0.0, -6.2, 0xff4d6d], [2.4, -5.2, 0xba5cff]];
  let bi = 0;
  while (bi < bdefs.length) {
    const d = bdefs[bi];
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.7, 28), phong(d[2], 0x6a6a6a, 34));
    cap.position.set(d[0], 0.55, d[1]);
    scene.add(cap);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 0.18, 28), phong(0x0c1020, 0x556, 30));
    base.position.set(d[0], 0.12, d[1]);
    scene.add(base);
    bumpers.push({ x: d[0], z: d[1], r: 1.15, mesh: cap, base: 0.55, flash: 0 });
    bi = bi + 1;
  }

  // ---- spinner + bank targets -----------------------------------------------
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.24, 30), phong(0xf5cf46, 0xffffff, 60));
  sp.position.set(-3.35, 0.2, -1.3);
  scene.add(sp);
  spinner = { mesh: sp, spin: 0 };

  const targets = [[-1.6, -2.3, 0xffd23c], [1.6, -2.3, 0x5ac8ff],
    [-2.9, 0.0, 0xff5064], [2.9, 0.0, 0x50cd82], [0.0, 1.1, 0xfadc50]];
  let ti = 0;
  while (ti < targets.length) {
    const g = targets[ti];
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 16), phong(g[2], 0xffffff, 60));
    s.position.set(g[0], 0.46, g[1]);
    scene.add(s);
    bumpers.push({ x: g[0], z: g[1], r: 0.85, mesh: s, base: 0.46, flash: 0 });
    ti = ti + 1;
  }

  // ---- slingshots: angled kicker bodies flanking the flippers ----------------
  const slMat = phong(0xff8a1e, 0xffffff, 40);
  addSling(-3.7, 3.2, -2.6, 4.9, slMat);
  addSling(3.7, 3.2, 2.6, 4.9, slMat);

  // ---- flippers: red rubber bats pivoting on their shafts --------------------
  const flipMat = phong(0xe8443f, 0xffd0c0, 44);
  addFlipper(1, -1.45, 5.05, flipMat);
  addFlipper(-1, 1.45, 5.05, flipMat);
  // shaft bushings (visual anchor for each pivot)
  const bush = phong(0x141824, 0x8090b0, 40);
  const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 20), bush);
  bl.position.set(-1.45, 0.21, 5.05); scene.add(bl);
  const br = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 20), bush);
  br.position.set(1.45, 0.21, 5.05); scene.add(br);

  // ---- the chrome ball -------------------------------------------------------
  ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 30, 22), chrome(0xe2e6f0, 0xffffff, 200));
  ball.position.set(bx, by, bz);
  scene.add(ball);

  // ---- lights ---------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.30));
  keyLight = new THREE.DirectionalLight(0xfff3e2, 1.5);
  keyLight.position.set(-5.5, 15.0, 3.5);
  keyLight.target.position.set(0, 0, -1.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize = 2048;
  keyLight.shadow.camera.left = -11; keyLight.shadow.camera.right = 11;
  keyLight.shadow.camera.top = 13; keyLight.shadow.camera.bottom = -13;
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 60;
  scene.add(keyLight);
  const fill = new THREE.DirectionalLight(0x5f7bff, 0.42);
  fill.position.set(6.5, 8.0, -5.0); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(0, 6.0, -11.0); scene.add(rim);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setAnimationLoop(animate);
}

function addSling(ax, az, bxp, bzp, mat) {
  const mx = (ax + bxp) * 0.5, mz = (az + bzp) * 0.5;
  const len = Math.sqrt((bxp - ax) * (bxp - ax) + (bzp - az) * (bzp - az));
  const m = new THREE.Mesh(sized(len, 0.55, 0.5), mat);
  m.position.set(mx, 0.3, mz);
  m.rotation.set(0, Math.atan2(-(bzp - az), bxp - ax), 0);
  scene.add(m);
  slings.push({ ax: ax, az: az, bx: bxp, bz: bzp, mesh: m, flash: 0 });
}

function addFlipper(side, px, pz, mat) {
  const m = new THREE.Mesh(sized(FLEN, 0.42, 2 * FHW), mat);
  scene.add(m);
  const fl = { side: side, px: px, pz: pz, phi: -0.5, target: -0.5, mesh: m };
  flippers.push(fl);
  placeFlipper(fl);
}

// derive a flipper's tip, mesh centre and rotation from its pivot + angle phi.
function flipTip(fl) {
  return { x: fl.px + fl.side * FLEN * Math.cos(fl.phi), z: fl.pz - FLEN * Math.sin(fl.phi) };
}
function placeFlipper(fl) {
  const t = flipTip(fl);
  fl.mesh.position.set((fl.px + t.x) * 0.5, 0.32, (fl.pz + t.z) * 0.5);
  fl.mesh.rotation.set(0, Math.atan2(-(t.z - fl.pz), t.x - fl.px), 0);
}

// closest point on segment (a→b) to point p, returned as {x,z,t}
function closestOnSeg(ax, az, bx2, bz2, px, pz) {
  const dx = bx2 - ax, dz = bz2 - az;
  const L2 = dx * dx + dz * dz;
  let t = L2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / L2 : 0;
  if (t < 0) t = 0; if (t > 1) t = 1;
  return { x: ax + t * dx, z: az + t * dz, t: t };
}

function reflect(nx, nz, restitution) {
  const vn = vx * nx + vz * nz;
  if (vn < 0) {
    vx = vx - (1 + restitution) * vn * nx;
    vz = vz - (1 + restitution) * vn * nz;
  }
}

function animate() {
  // ---- flipper actuation (attract mode): flip the flipper on the side the
  // descending ball is approaching; otherwise return to rest. --------------
  let fi = 0;
  while (fi < flippers.length) {
    const fl = flippers[fi];
    const near = (bz > 3.4) && (fl.side > 0 ? bx < 0.2 : bx > -0.2) && (vz > -0.05);
    fl.target = near ? 0.62 : -0.5;
    const before = fl.phi;
    fl.phi = fl.phi + (fl.target - fl.phi) * 0.35;   // fast coil snap
    fl.dphi = fl.phi - before;
    placeFlipper(fl);
    fi = fi + 1;
  }

  // ---- integrate ball -------------------------------------------------------
  vz = vz + GRAV;
  vx = vx * 0.996; vz = vz * 0.999;
  // clamp speed
  const sp2 = vx * vx + vz * vz, MX = 0.9;
  if (sp2 > MX * MX) { const s = MX / Math.sqrt(sp2); vx = vx * s; vz = vz * s; }
  bx = bx + vx; bz = bz + vz;

  // ---- walls ----------------------------------------------------------------
  if (bx < -WALL_X) { bx = -WALL_X; if (vx < 0) vx = -vx * 0.82; }
  if (bx > WALL_X) { bx = WALL_X; if (vx > 0) vx = -vx * 0.82; }
  if (bz < TOP_Z) { bz = TOP_Z; if (vz < 0) vz = -vz * 0.82; }

  // ---- bumpers / targets ----------------------------------------------------
  let ci = 0;
  while (ci < bumpers.length) {
    const b = bumpers[ci];
    const dx = bx - b.x, dz = bz - b.z;
    const d = Math.sqrt(dx * dx + dz * dz), min = R + b.r;
    if (d < min && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      bx = b.x + nx * min; bz = b.z + nz * min;
      const kick = b.r > 1.0 ? 0.34 : 0.22;     // pop bumpers kick harder
      const vn = vx * nx + vz * nz;
      vx = vx - 2 * vn * nx + nx * kick;
      vz = vz - 2 * vn * nz + nz * kick;
      b.flash = 6;
    }
    if (b.flash > 0) {
      const s = 1 + 0.12 * b.flash;
      b.mesh.setScale(s, 1 + 0.30 * b.flash, s);
      b.mesh.position.set(b.x, b.base + 0.05 * b.flash, b.z);
      b.flash = b.flash - 1;
    } else {
      b.mesh.setScale(1, 1, 1);
      b.mesh.position.set(b.x, b.base, b.z);
    }
    ci = ci + 1;
  }

  // ---- slingshots -----------------------------------------------------------
  let si = 0;
  while (si < slings.length) {
    const s = slings[si];
    const c = closestOnSeg(s.ax, s.az, s.bx, s.bz, bx, bz);
    const dx = bx - c.x, dz = bz - c.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < R + 0.28 && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      bx = c.x + nx * (R + 0.28); bz = c.z + nz * (R + 0.28);
      reflect(nx, nz, 0.3);
      vx = vx + nx * 0.34; vz = vz + nz * 0.34;   // band kick
      s.flash = 5;
    }
    if (s.flash > 0) { s.mesh.setScale(1, 1 + 0.4 * s.flash, 1 + 0.15 * s.flash); s.flash = s.flash - 1; }
    else s.mesh.setScale(1, 1, 1);
    si = si + 1;
  }

  // ---- flippers (collision + rubber kick) -----------------------------------
  let ffi = 0;
  while (ffi < flippers.length) {
    const fl = flippers[ffi];
    const t = flipTip(fl);
    const c = closestOnSeg(fl.px, fl.pz, t.x, t.z, bx, bz);
    const dx = bx - c.x, dz = bz - c.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < R + FHW && d > 0.0001) {
      let nx = dx / d, nz = dz / d;
      bx = c.x + nx * (R + FHW); bz = c.z + nz * (R + FHW);
      reflect(nx, nz, 0.25);
      // rubber kick: a snapping flipper (dphi>0) launches the ball up-table
      if (fl.dphi > 0.01) {
        const kick = 6.0 * fl.dphi * (1 - c.t * 0.4);
        vx = vx + nx * kick * 0.5;
        vz = vz - kick;                 // up the table (toward -z)
      }
    }
    ffi = ffi + 1;
  }

  // ---- drain → re-plunge (attract keeps playing) ----------------------------
  if (bz > DRAIN_Z) { bx = 4.2; bz = 5.4; vx = 0.0; vz = -0.85; }

  // ---- spinner: idles slowly, whirs when the ball is passing over it --------
  const sdx = bx - spinner.mesh.position.x, sdz = bz + 1.3;
  const near = Math.sqrt(sdx * sdx + sdz * sdz) < 1.6;
  spinner.spin = spinner.spin * 0.94 + (near ? 0.9 : 0.02);
  spinner.mesh.rotation.set(0, spinner.mesh.rotation.y + spinner.spin, 0);

  // ---- present the ball -----------------------------------------------------
  spin = spin + Math.sqrt(vx * vx + vz * vz);
  ball.position.set(bx, by, bz);
  ball.rotation.set(spin * 0.6, spin * 0.4, 0);

  renderer.render(scene, camera);
}

// --- host frame hooks -------------------------------------------------------
export function tick() { animate(); }
export function frames() { return renderer.frames; }
export function sceneReady() { return scene.children.length; }
