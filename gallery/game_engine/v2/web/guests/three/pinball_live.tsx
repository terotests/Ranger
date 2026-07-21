// ============================================================================
// pinball_live.tsx — a Three.js pinball table on the GPU with true part shapes,
// laid out from a real playfield chart, each part pivoted into place + physical.
// ============================================================================
// Canonical three.js (`import * as THREE from 'three'`) on the Ranger three.tsx
// façade → ComponentEngine + ThreeTsxBridge + ThreeGLBackend → REAL WebGL
// (hardware Phong lighting, a 2048² PCF shadow map, ACES tone mapping, a studio
// env cube for the chrome ball).
//
// Parts are built as their true silhouettes — not bounding boxes — then placed
// at chart coordinates and rotated over their pivots:
//   • flippers = base disc + tapered body + tip disc (the classic bat), pivoting
//     on the shaft; attract auto-flip kicks the ball off the rubber;
//   • pop bumpers = mushroom cap on a skirt, in a diamond cluster; radial kick;
//   • slingshots = triangular prisms; the ball rebounds off the inner face;
//   • standup targets = upright blades; rollover inserts = a disc grid;
//   • guide rails suggest the wireforms; the ball obeys gravity, walls, drain →
//     re-plunge, so the table plays itself.
//
// World: Y up. Table in XZ; z=-7.6 top (bumpers), z=+6 flipper/drain end.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let ball, keyLight;

const ENV = new THREE.CubeTexture();

function phong(colorHex, specHex, shininess) {
  return new THREE.MeshPhongMaterial({ color: colorHex, specular: specHex, shininess: shininess });
}
function chrome(colorHex, specHex, shininess) {
  return new THREE.MeshPhongMaterial({ color: colorHex, specular: specHex, shininess: shininess, envMap: ENV });
}
function sized(w, h, d) { const g = new THREE.BoxGeometry(); g.width = w; g.height = h; g.depth = d; return g; }
function addBox(w, h, d, mat, x, y, z, ry) {
  const m = new THREE.Mesh(sized(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(0, ry, 0); scene.add(m); return m;
}
// a vertical disc (round footprint from top-down)
function disc(r, h, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat);
  m.position.set(x, y, z); scene.add(m); return m;
}
// a triangular prism (3-sided cylinder), vertical axis → triangular footprint
function triPrism(r, h, mat, x, y, z, ry) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 3), mat);
  m.position.set(x, y, z); m.rotation.set(0, ry, 0); scene.add(m); return m;
}

// ---- physics state ---------------------------------------------------------
const R = 0.5;
const GRAV = 0.0115;
const WALL_X = 4.45, TOP_Z = -7.6, DRAIN_Z = 6.6;
let bx = 4.2, bz = 5.2, vx = 0.0, vz = -0.85;
let by = R, spin = 0;

const FLEN = 1.75, FHW = 0.32;
let flippers = [];   // {side, px, pz, phi, target, dphi, base, body, tip}
let bumpers = [];    // {x, z, r, mesh, base, flash}
let slings = [];     // {ax, az, bx, bz, mesh, flash}
let spinner = null;

export function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 200);
  camera.position.set(0, 12.6, 15.0);
  camera.rotation.set(-0.64, 0, 0);

  // ---- playfield -------------------------------------------------------------
  const tex = new THREE.TextureLoader().load('playfield.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(10.0, 17.0, 8, 14),
    new THREE.MeshPhongMaterial({ map: tex, color: 0x9a9aa8, specular: 0x0a0c14, shininess: 8 }));
  pf.rotation.set(-1.5707963, 0, 0); scene.add(pf);

  // ---- cabinet frame ---------------------------------------------------------
  const rail = phong(0x10131f, 0x3a4260, 20);
  addBox(0.7, 1.4, 17.6, rail, -5.35, 0.55, 0, 0);
  addBox(0.7, 1.4, 17.6, rail, 5.35, 0.55, 0, 0);
  addBox(11.4, 1.4, 0.7, rail, 0, 0.55, -8.75, 0);
  addBox(11.4, 1.1, 0.7, rail, 0, 0.4, 8.75, 0);

  // ---- backbox + DMD ---------------------------------------------------------
  const boxMat = phong(0x0a0b13, 0x2b3252, 22);
  addBox(7.4, 3.6, 0.7, boxMat, 0, 1.5, -9.7, 0);
  addBox(7.8, 0.5, 1.0, boxMat, 0, 3.35, -9.55, 0);
  const dmdTex = new THREE.TextureLoader().load('dmd.png');
  dmdTex.colorSpace = THREE.SRGBColorSpace;
  const dmd = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.14, 1, 1), new THREE.MeshBasicMaterial({ map: dmdTex }));
  dmd.position.set(0, 2.15, -9.28); dmd.rotation.set(-0.46, 0, 0); scene.add(dmd);

  // ---- pop bumpers: mushroom cap on a skirt, diamond cluster (chart 11/12) ----
  const bdefs = [[0.0, -5.2, 0xff4d6d], [-1.75, -4.0, 0xf5cf46], [1.75, -4.0, 0xf5cf46], [0.0, -2.8, 0xff4d6d]];
  let bi = 0;
  while (bi < bdefs.length) { addBumper(bdefs[bi][0], bdefs[bi][1], bdefs[bi][2]); bi = bi + 1; }

  // ---- rollover-insert grid (chart 13) — flat lit discs, decorative ----------
  const insMat = phong(0x2a3350, 0x90a0d0, 30);
  let rz = 0;
  while (rz < 3) {
    let rxi = 0;
    while (rxi < 4) {
      disc(0.28, 0.06, insMat, -1.05 + rxi * 0.7, 0.03, -1.4 + rz * 0.7);
      rxi = rxi + 1;
    }
    rz = rz + 1;
  }

  // ---- standup targets (chart 25) — upright blades ---------------------------
  addTarget(-3.7, -2.4, 0.5, 0xff5064);
  addTarget(3.7, -2.4, -0.5, 0xff5064);
  addTarget(-2.7, 1.0, 0.35, 0x5ac8ff);
  addTarget(2.7, 1.0, -0.35, 0x50cd82);

  // ---- spinner (extra flourish on the left lane) -----------------------------
  const sp = disc(1.15, 0.22, phong(0xf5cf46, 0xffffff, 60), -3.5, 0.18, -0.9);
  spinner = { mesh: sp, spin: 0 };

  // ---- slingshots: triangular prisms flanking the flippers (chart E) ----------
  const slMat = phong(0xff8a1e, 0xffffff, 40);
  addSling(-1, -3.05, 3.4, -2.1, 2.5, -3.4, 4.7);   // left: inner face A→B
  addSling(1, 3.05, 3.4, 2.1, 2.5, 3.4, 4.7);        // right (mirrored)

  // ---- flippers: base disc + tapered body + tip disc, pivoting (chart 20) -----
  const flipMat = phong(0xe8443f, 0xffd0c0, 44);
  addFlipper(1, -1.75, 5.0, flipMat);
  addFlipper(-1, 1.75, 5.0, flipMat);

  // ---- guide rails: thin wireform rails (chart 14/15/16) ----------------------
  const wire = phong(0xc9d2e6, 0xffffff, 80);
  addBox(0.14, 0.5, 6.4, wire, -4.15, 0.35, -1.6, 0.05);   // left lane rail
  addBox(0.14, 0.5, 6.4, wire, 4.15, 0.35, -1.6, -0.05);   // right lane rail
  addBox(0.14, 0.4, 3.4, wire, -2.15, 0.3, 4.4, 0.38);     // left inlane guide
  addBox(0.14, 0.4, 3.4, wire, 2.15, 0.3, 4.4, -0.38);     // right inlane guide

  // ---- chrome ball -----------------------------------------------------------
  ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 30, 22), chrome(0xe2e6f0, 0xffffff, 200));
  ball.position.set(bx, by, bz); scene.add(ball);

  // ---- lights ----------------------------------------------------------------
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
  const fill = new THREE.DirectionalLight(0x5f7bff, 0.42); fill.position.set(6.5, 8.0, -5.0); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4); rim.position.set(0, 6.0, -11.0); scene.add(rim);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setAnimationLoop(animate);
}

// mushroom bumper: wide skirt + cap wider at the top
function addBumper(x, z, col) {
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.16, 28), phong(0x0c1020, 0x556, 30));
  skirt.position.set(x, 0.1, z); scene.add(skirt);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.6, 0.55, 28), phong(col, 0x6a6a6a, 40));
  cap.position.set(x, 0.5, z); scene.add(cap);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), phong(col, 0xffffff, 70));
  knob.position.set(x, 0.78, z); scene.add(knob);
  bumpers.push({ x: x, z: z, r: 1.05, mesh: cap, knob: knob, base: 0.5, flash: 0 });
}

// upright standup target blade
function addTarget(x, z, ry, col) {
  const m = addBox(0.9, 0.7, 0.22, phong(col, 0xffffff, 50), x, 0.35, z, ry);
  bumpers.push({ x: x, z: z, r: 0.62, mesh: m, knob: null, base: 0.35, flash: 0 });
}

// triangular slingshot; store the inner-face segment (A→B) for physics
function addSling(side, ax, az, bx2, bz2, cx, cz) {
  const slMat = phong(0xff8a1e, 0xffffff, 40);
  // prism centred just outside the inner face, flat face toward the playfield
  const faceAng = Math.atan2(-(bz2 - az), bx2 - ax);
  const m = triPrism(0.95, 0.55, slMat, cx, 0.3, cz, faceAng + side * 0.4);
  slings.push({ ax: ax, az: az, bx: bx2, bz: bz2, mesh: m, flash: 0 });
}

function addFlipper(side, px, pz, mat) {
  const base = disc(0.44, 0.44, mat, px, 0.32, pz);
  const body = new THREE.Mesh(sized(FLEN, 0.42, 0.5), mat); scene.add(body);
  const tip = disc(0.2, 0.44, mat, px, 0.32, pz);
  const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 20), phong(0x141824, 0x8090b0, 40));
  bush.position.set(px, 0.24, pz); scene.add(bush);
  const fl = { side: side, px: px, pz: pz, phi: -0.5, target: -0.5, dphi: 0, base: base, body: body, tip: tip };
  flippers.push(fl); placeFlipper(fl);
}
function flipTip(fl) {
  return { x: fl.px + fl.side * FLEN * Math.cos(fl.phi), z: fl.pz - FLEN * Math.sin(fl.phi) };
}
function placeFlipper(fl) {
  const t = flipTip(fl);
  fl.tip.position.set(t.x, 0.32, t.z);
  fl.body.position.set((fl.px + t.x) * 0.5, 0.32, (fl.pz + t.z) * 0.5);
  fl.body.rotation.set(0, Math.atan2(-(t.z - fl.pz), t.x - fl.px), 0);
}

function closestOnSeg(ax, az, bx2, bz2, px, pz) {
  const dx = bx2 - ax, dz = bz2 - az, L2 = dx * dx + dz * dz;
  let t = L2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / L2 : 0;
  if (t < 0) t = 0; if (t > 1) t = 1;
  return { x: ax + t * dx, z: az + t * dz, t: t };
}
function reflect(nx, nz, restitution) {
  const vn = vx * nx + vz * nz;
  if (vn < 0) { vx = vx - (1 + restitution) * vn * nx; vz = vz - (1 + restitution) * vn * nz; }
}

function animate() {
  // flipper actuation
  let fi = 0;
  while (fi < flippers.length) {
    const fl = flippers[fi];
    const near = (bz > 3.0) && (fl.side > 0 ? bx < 0.2 : bx > -0.2) && (vz > -0.05);
    fl.target = near ? 0.62 : -0.5;
    const before = fl.phi;
    fl.phi = fl.phi + (fl.target - fl.phi) * 0.35;
    fl.dphi = fl.phi - before;
    placeFlipper(fl);
    fi = fi + 1;
  }

  // integrate
  vz = vz + GRAV; vx = vx * 0.996; vz = vz * 0.999;
  const sp2 = vx * vx + vz * vz, MX = 0.9;
  if (sp2 > MX * MX) { const s = MX / Math.sqrt(sp2); vx = vx * s; vz = vz * s; }
  bx = bx + vx; bz = bz + vz;

  // walls
  if (bx < -WALL_X) { bx = -WALL_X; if (vx < 0) vx = -vx * 0.82; }
  if (bx > WALL_X) { bx = WALL_X; if (vx > 0) vx = -vx * 0.82; }
  if (bz < TOP_Z) { bz = TOP_Z; if (vz < 0) vz = -vz * 0.82; }

  // bumpers / targets
  let ci = 0;
  while (ci < bumpers.length) {
    const b = bumpers[ci];
    const dx = bx - b.x, dz = bz - b.z, d = Math.sqrt(dx * dx + dz * dz), min = R + b.r;
    if (d < min && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      bx = b.x + nx * min; bz = b.z + nz * min;
      const kick = b.r > 1.0 ? 0.34 : 0.18;
      const vn = vx * nx + vz * nz;
      vx = vx - 2 * vn * nx + nx * kick; vz = vz - 2 * vn * nz + nz * kick;
      b.flash = 6;
    }
    if (b.knob != null) {
      if (b.flash > 0) { const s = 1 + 0.10 * b.flash; b.mesh.setScale(s, 1 + 0.22 * b.flash, s); b.flash = b.flash - 1; }
      else b.mesh.setScale(1, 1, 1);
    } else if (b.flash > 0) { b.flash = b.flash - 1; }
    ci = ci + 1;
  }

  // slingshots
  let si = 0;
  while (si < slings.length) {
    const s = slings[si];
    const c = closestOnSeg(s.ax, s.az, s.bx, s.bz, bx, bz);
    const dx = bx - c.x, dz = bz - c.z, d = Math.sqrt(dx * dx + dz * dz);
    if (d < R + 0.28 && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      bx = c.x + nx * (R + 0.28); bz = c.z + nz * (R + 0.28);
      reflect(nx, nz, 0.3); vx = vx + nx * 0.32; vz = vz + nz * 0.32;
      s.flash = 5;
    }
    if (s.flash > 0) { s.mesh.setScale(1.06, 1 + 0.18 * s.flash, 1.06); s.flash = s.flash - 1; }
    else s.mesh.setScale(1, 1, 1);
    si = si + 1;
  }

  // flippers (collision + rubber kick)
  let ffi = 0;
  while (ffi < flippers.length) {
    const fl = flippers[ffi];
    const t = flipTip(fl);
    const c = closestOnSeg(fl.px, fl.pz, t.x, t.z, bx, bz);
    const dx = bx - c.x, dz = bz - c.z, d = Math.sqrt(dx * dx + dz * dz);
    if (d < R + FHW && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      bx = c.x + nx * (R + FHW); bz = c.z + nz * (R + FHW);
      reflect(nx, nz, 0.25);
      if (fl.dphi > 0.01) { const kick = 6.0 * fl.dphi * (1 - c.t * 0.4); vx = vx + nx * kick * 0.5; vz = vz - kick; }
    }
    ffi = ffi + 1;
  }

  // drain → re-plunge
  if (bz > DRAIN_Z) { bx = 4.2; bz = 5.2; vx = 0.0; vz = -0.85; }

  // spinner
  const sdx = bx - spinner.mesh.position.x, sdz = bz + 0.9;
  const nr = Math.sqrt(sdx * sdx + sdz * sdz) < 1.5;
  spinner.spin = spinner.spin * 0.94 + (nr ? 0.9 : 0.02);
  spinner.mesh.rotation.set(0, spinner.mesh.rotation.y + spinner.spin, 0);

  // ball
  spin = spin + Math.sqrt(vx * vx + vz * vz);
  ball.position.set(bx, by, bz);
  ball.rotation.set(spin * 0.6, spin * 0.4, 0);

  renderer.render(scene, camera);
}

export function tick() { animate(); }
export function frames() { return renderer.frames; }
export function sceneReady() { return scene.children.length; }
