// ============================================================================
// Autopeli 3D — Cannon + Three.js top-down racer, rewritten as a real 3D scene.
// ============================================================================
//
// Canonical cannon-es + three.js integration pattern:
//   world.fixedStep();
//   mesh.position.copy(body.position);
//   mesh.rotation.y = heading;   // Euler (façade has no Mesh.quaternion yet)
//
// Host plumbing (SDL / web): setControls() each frame, tick() advances physics +
// camera, renderer.render reconciles through ThreeTsxBridge + GL backend.
// ============================================================================

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

let camera, scene, renderer;
let world;
let carBody, carMesh;
let heading = 0;
let speed = 0;
let won = false;
let frames = 0;
let finishZ = -200;

const controls = { up: false, down: false, left: false, right: false };

const ROAD = [
  { z: 10, x: 0, half: 7 },
  { z: -20, x: 0, half: 7 },
  { z: -50, x: 4, half: 6.5 },
  { z: -80, x: 8, half: 6 },
  { z: -110, x: 4, half: 6.5 },
  { z: -140, x: -2, half: 6 },
  { z: -170, x: -6, half: 6.5 },
  { z: -200, x: -2, half: 7 },
  { z: -230, x: 0, half: 8 }
];

const TRAFFIC_SPEC = [
  { z: -35, lane: -0.45, color: 0x29b6f6, speed: 9 },
  { z: -70, lane: 0.4, color: 0xab47bc, speed: 8 },
  { z: -105, lane: -0.2, color: 0xffd600, speed: 10 },
  { z: -145, lane: 0.35, color: 0x26a69a, speed: 7.5 },
  { z: -175, lane: -0.4, color: 0xff8f00, speed: 9.5 }
];

const CONE_SPEC = [
  { z: -42, lane: 0.55 },
  { z: -88, lane: -0.6 },
  { z: -125, lane: 0.15 },
  { z: -158, lane: -0.5 },
  { z: -188, lane: 0.45 }
];

let traffic = [];
let cones = [];
let glbProps = [];
let yAxis;

function clamp(v, lo, hi) {
  if (v < lo) { return lo; }
  if (v > hi) { return hi; }
  return v;
}

function roadAt(z) {
  const first = ROAD[0];
  if (z >= first.z) {
    return { center: first.x, half: first.half };
  }
  const last = ROAD[ROAD.length - 1];
  if (z <= last.z) {
    return { center: last.x, half: last.half };
  }
  let i = 0;
  while (i < ROAD.length - 1) {
    const a = ROAD[i];
    const b = ROAD[i + 1];
    if (z <= a.z && z >= b.z) {
      const span = a.z - b.z;
      let t = 0;
      if (span > 0.001) {
        t = (a.z - z) / span;
      }
      return {
        center: a.x + (b.x - a.x) * t,
        half: a.half + (b.half - a.half) * t
      };
    }
    i = i + 1;
  }
  return { center: last.x, half: last.half };
}

function laneX(z, lane) {
  const r = roadAt(z);
  return r.center + r.half * clamp(lane, -1, 1) * 0.75;
}

function makeBoxMesh(sx, sy, sz, color) {
  const geo = new THREE.BoxGeometry();
  const mat = new THREE.MeshLambertMaterial({ color: color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.set(sx, sy, sz);
  return mesh;
}

function addStaticBox(wx, wy, wz, px, py, pz, color) {
  const mesh = makeBoxMesh(wx * 2, wy * 2, wz * 2, color);
  mesh.position.set(px, py, pz);
  scene.add(mesh);

  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(wx, wy, wz)));
  body.position.set(px, py, pz);
  world.addBody(body);
  return body;
}

function buildGround() {
  const groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(new CANNON.Plane());
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0 - 1.5707963267948966);
  world.addBody(groundBody);

  // Grass plane (visual)
  const grass = makeBoxMesh(80, 0.15, 280, 0x3d8b4a);
  grass.position.set(0, -0.05, -110);
  scene.add(grass);
}

function buildRoad() {
  let i = 0;
  while (i < ROAD.length - 1) {
    const a = ROAD[i];
    const b = ROAD[i + 1];
    const midZ = (a.z + b.z) * 0.5;
    const midX = (a.x + b.x) * 0.5;
    const half = (a.half + b.half) * 0.5;
    const len = a.z - b.z;
    if (len < 0.5) {
      i = i + 1;
      continue;
    }
    // Asphalt strip
    const road = makeBoxMesh(half * 2, 0.12, len, 0x3a3a42);
    road.position.set(midX, 0.02, midZ);
    scene.add(road);

    // Center dashed line (thin bright strip)
    const line = makeBoxMesh(0.18, 0.14, len * 0.85, 0xf0e6a8);
    line.position.set(midX, 0.08, midZ);
    scene.add(line);

    // Barriers
    const wallH = 0.55;
    const wallT = 0.35;
    addStaticBox(wallT, wallH, len * 0.5, midX - half - wallT, wallH, midZ, 0xc45c26);
    addStaticBox(wallT, wallH, len * 0.5, midX + half + wallT, wallH, midZ, 0xc45c26);

    i = i + 1;
  }

  // Finish banner
  const banner = makeBoxMesh(14, 0.2, 0.4, 0xffffff);
  banner.position.set(0, 2.2, finishZ);
  scene.add(banner);
  const postL = makeBoxMesh(0.25, 2.2, 0.25, 0xeeeeee);
  postL.position.set(-7, 1.1, finishZ);
  scene.add(postL);
  const postR = makeBoxMesh(0.25, 2.2, 0.25, 0xeeeeee);
  postR.position.set(7, 1.1, finishZ);
  scene.add(postR);
}

function buildCar() {
  carMesh = makeBoxMesh(1.4, 0.55, 2.4, 0xe53935);
  const cabin = makeBoxMesh(1.1, 0.4, 1.1, 0x212121);
  cabin.position.set(0, 0.45, -0.1);
  carMesh.add(cabin);
  scene.add(carMesh);

  carBody = new CANNON.Body({ mass: 1200 });
  carBody.addShape(new CANNON.Box(new CANNON.Vec3(0.7, 0.28, 1.2)));
  carBody.position.set(0, 0.4, 6);
  world.addBody(carBody);
  heading = 0;
  speed = 0;
}

function buildTraffic() {
  traffic = [];
  let i = 0;
  while (i < TRAFFIC_SPEC.length) {
    const spec = TRAFFIC_SPEC[i];
    const x = laneX(spec.z, spec.lane);
    const mesh = makeBoxMesh(1.3, 0.5, 2.2, spec.color);
    scene.add(mesh);
    const body = new CANNON.Body({ mass: 900 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.65, 0.25, 1.1)));
    body.position.set(x, 0.35, spec.z);
    world.addBody(body);
    traffic.push({ body: body, mesh: mesh, speed: spec.speed, lane: spec.lane });
    i = i + 1;
  }
}

function buildCones() {
  cones = [];
  let i = 0;
  while (i < CONE_SPEC.length) {
    const spec = CONE_SPEC[i];
    const x = laneX(spec.z, spec.lane);
    const geo = new THREE.ConeGeometry(0.28, 0.7, 10);
    const mat = new THREE.MeshLambertMaterial({ color: 0xff6f00 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    const body = new CANNON.Body({ mass: 3 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.22, 0.35, 0.22)));
    body.position.set(x, 0.4, spec.z);
    world.addBody(body);
    cones.push({ body: body, mesh: mesh });
    i = i + 1;
  }
}

function syncMesh(mesh, body, yaw) {
  mesh.position.copy(body.position);
  mesh.rotation.y = yaw;
}

function drivePlayer() {
  if (won) {
    carBody.velocity.set(0, carBody.velocity.y, 0);
    carBody.angularVelocity.set(0, 0, 0);
    return;
  }

  const steer = 1.8;
  const accel = 14;
  const brake = 22;
  const drag = 3.5;
  const maxSpeed = 28;

  if (controls.left) { heading = heading + steer * (1 / 60); }
  if (controls.right) { heading = heading - steer * (1 / 60); }

  if (controls.up) {
    speed = speed + accel * (1 / 60);
  } else if (controls.down) {
    speed = speed - brake * (1 / 60);
  } else {
    if (speed > 0) {
      speed = speed - drag * (1 / 60);
      if (speed < 0) { speed = 0; }
    }
    if (speed < 0) {
      speed = speed + drag * (1 / 60);
      if (speed > 0) { speed = 0; }
    }
  }
  speed = clamp(speed, -8, maxSpeed);

  const vx = Math.sin(heading) * speed;
  const vz = (0 - Math.cos(heading)) * speed;
  carBody.velocity.set(vx, carBody.velocity.y, vz);
  carBody.angularVelocity.set(0, 0, 0);
  carBody.quaternion.setFromAxisAngle(yAxis, heading);

  if (carBody.position.z < finishZ) {
    won = true;
    speed = 0;
  }
}

function driveTraffic() {
  let i = 0;
  while (i < traffic.length) {
    const t = traffic[i];
    const z = t.body.position.z;
    const targetX = laneX(z, t.lane);
    const dx = targetX - t.body.position.x;
    let yaw = 0;
    if (dx > 0.15) { yaw = 0 - 0.25; }
    if (dx < -0.15) { yaw = 0.25; }
    const sp = t.speed;
    t.body.velocity.set(Math.sin(yaw) * sp + dx * 1.2, t.body.velocity.y, (0 - Math.cos(yaw)) * sp);
    t.body.angularVelocity.set(0, 0, 0);
    t.body.quaternion.setFromAxisAngle(yAxis, yaw);
    // Soft wrap: recycle traffic ahead of the player when far behind
    if (z > carBody.position.z + 30) {
      const nz = carBody.position.z - 40 - i * 12;
      t.body.position.set(laneX(nz, t.lane), 0.35, nz);
      t.body.velocity.set(0, 0, 0 - sp);
    }
    i = i + 1;
  }
}

function updateCamera() {
  const back = 8.5;
  const up = 4.2;
  const cx = carBody.position.x - Math.sin(heading) * back;
  const cz = carBody.position.z + Math.cos(heading) * back;
  camera.position.set(cx, carBody.position.y + up, cz);
  // Look along drive direction (Euler Y then slight pitch)
  camera.rotation.y = heading;
  camera.rotation.x = 0 - 0.35;
  camera.rotation.z = 0;
}

// Real Khronos / pack .glb models (host preloads models/*.glb and attaches by name).
function buildGlbProps() {
  glbProps = [];

  // Pedestals so the spinning props read as roadside attractions.
  const pedDuck = makeBoxMesh(1.6, 0.35, 1.6, 0x8d6e63);
  pedDuck.position.set(-11.5, 0.2, -28);
  scene.add(pedDuck);
  const pedBox = makeBoxMesh(1.4, 0.35, 1.4, 0x6d4c41);
  pedBox.position.set(11.5, 0.2, -75);
  scene.add(pedBox);

  const duck = new THREE.GLTFModel('Duck');
  duck.position.set(-11.5, 0.9, -28);
  // Khronos Duck is authored in centimetres (~100 units tall).
  duck.scale.set(0.012, 0.012, 0.012);
  scene.add(duck);
  glbProps.push({ model: duck, spin: 0.9 });

  const crate = new THREE.GLTFModel('BoxTextured');
  crate.position.set(11.5, 1.0, -75);
  crate.scale.set(1.4, 1.4, 1.4);
  scene.add(crate);
  glbProps.push({ model: crate, spin: 1.15 });

  const bush = new THREE.GLTFModel('bush_1');
  bush.position.set(-12.0, 0.0, -120);
  bush.scale.set(2.2, 2.2, 2.2);
  scene.add(bush);
  glbProps.push({ model: bush, spin: 0.4 });
}

function spinGlbProps() {
  const dt = 1 / 60;
  let i = 0;
  while (i < glbProps.length) {
    const p = glbProps[i];
    p.model.rotation.y = p.model.rotation.y + p.spin * dt;
    i = i + 1;
  }
}

export function init() {
  yAxis = new CANNON.Vec3(0, 1, 0);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 5, 14);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6ec6ff);

  scene.add(new THREE.AmbientLight(0x667788, 0.85));
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.15);
  sun.position.set(8, 18, 6);
  scene.add(sun);

  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  buildGround();
  buildRoad();
  buildCar();
  buildTraffic();
  buildCones();
  buildGlbProps();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);

  won = false;
  frames = 0;
}

export function setControls(c) {
  controls.up = c.up;
  controls.down = c.down;
  controls.left = c.left;
  controls.right = c.right;
}

function animate() {
  frames = frames + 1;

  drivePlayer();
  driveTraffic();
  world.fixedStep();

  syncMesh(carMesh, carBody, heading);

  let i = 0;
  while (i < traffic.length) {
    const t = traffic[i];
    // Approximate yaw from velocity for traffic visuals
    let yaw = 0;
    const vx = t.body.velocity.x;
    const vz = t.body.velocity.z;
    if ((vx * vx + vz * vz) > 0.01) {
      // heading 0 => -Z; use cos-dominant approximation without atan2
      yaw = vx * 0.08;
      yaw = clamp(yaw, -0.6, 0.6);
    }
    syncMesh(t.mesh, t.body, yaw);
    i = i + 1;
  }

  i = 0;
  while (i < cones.length) {
    const c = cones[i];
    c.mesh.position.copy(c.body.position);
    // Light spin from lateral velocity for readability after hits
    c.mesh.rotation.y = c.body.velocity.x * 0.15;
    i = i + 1;
  }

  spinGlbProps();
  updateCamera();
  renderer.render(scene, camera);
}

export function tick() { animate(); }

// --- introspection (headless smoke + PoC hooks) ---
export function carX() { return carBody.position.x; }
export function carY() { return carBody.position.y; }
export function carZ() { return carBody.position.z; }
export function carSpeed() { return speed; }
export function hasWon() { if (won) { return 1; } return 0; }
export function stepCount() { return world.stepCount; }
export function bodyCount() { return world.bodies.length; }
export function frameCount() { return frames; }
export function trafficCount() { return traffic.length; }
export function coneCount() { return cones.length; }
export function glbPropCount() { return glbProps.length; }
