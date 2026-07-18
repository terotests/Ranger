// ============================================================================
// cannon.tsx — thin TSX façade for the Ranger Cannon port (capability: 'cannon').
// ============================================================================
//
// Layer 1 (mirrors three.tsx): the CANNON.* classes the TSX interpreter sees, so
// a canonical cannon-es script runs 1:1. These are THIN — plain data + trivial
// methods. The simulation is the Ranger core (physics/src, the Cannon* classes),
// reached by CannonTsxBridge: each frame the bridge reconciles this façade world
// into the real CannonWorld, steps it, and writes the resulting body.position /
// body.quaternion back onto these objects. So the interpreted
// `mesh.position.copy(body.position)` reads simulated values.
//
// Interpreter constraints honoured: no `extends`/`super` (each shape is its own
// flat class), no `=== undefined` (params guarded by truthiness).
// ============================================================================

class Vec3 {
  x = 0;
  y = 0;
  z = 0;
  constructor(x, y, z) {
    if (x) { this.x = x; }
    if (y) { this.y = y; }
    if (z) { this.z = z; }
  }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { const v = new Vec3(); v.x = this.x; v.y = this.y; v.z = this.z; return v; }
}

class Quaternion {
  x = 0;
  y = 0;
  z = 0;
  w = 1;
  set(x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; return this; }
  copy(q) { this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w; return this; }
  // axis (Vec3), angle (radians) -> unit quaternion.
  setFromAxisAngle(axis, angle) {
    const s = Math.sin(angle * 0.5);
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(angle * 0.5);
    return this;
  }
}

// --- Shapes (flat — the interpreter has no `extends`) ------------------------
// A discriminating field (`shapeType`) lets the bridge tell them apart without
// instanceof: 1=Box, 2=Sphere, 4=Plane (matches cannon-es Shape.types bits).
class Box {
  isShape = true;
  shapeType = 1;
  halfExtents = new Vec3(1, 1, 1);
  constructor(halfExtents) {
    if (halfExtents) { this.halfExtents = halfExtents; }
  }
}

class Sphere {
  isShape = true;
  shapeType = 2;
  radius = 1;
  constructor(radius) {
    if (radius) { this.radius = radius; }
  }
}

class Plane {
  isShape = true;
  shapeType = 4;
}

// Body type constants (cannon-es: DYNAMIC=1, STATIC=2, KINEMATIC=4).
const BODY_DYNAMIC = 1;
const BODY_STATIC = 2;
const BODY_KINEMATIC = 4;

class Body {
  isBody = true;
  mass = 0;
  type = 2;
  position = new Vec3();
  velocity = new Vec3();
  angularVelocity = new Vec3();
  quaternion = new Quaternion();
  linearDamping = 0.01;
  angularDamping = 0.01;
  allowSleep = true;
  shapes = [];
  constructor(params) {
    if (params) {
      if (params.mass) { this.mass = params.mass; }
      if (params.type) { this.type = params.type; }
      if (params.position) { this.position.copy(params.position); }
      if (params.velocity) { this.velocity.copy(params.velocity); }
      if (params.shape) { this.shapes.push(params.shape); }
    }
    // Derive dynamic/static from mass the way cannon-es does, unless type given.
    if (params) {
      if (params.type) { this.type = params.type; }
      else { if (this.mass > 0) { this.type = 1; } else { this.type = 2; } }
    }
  }
  addShape(shape) { this.shapes.push(shape); return this; }
  applyForce(force, point) { return this; }
}

class Material {
  isMaterial = true;
  friction = -1;
  restitution = -1;
  constructor(params) {
    if (params) {
      if (params.friction) { this.friction = params.friction; }
      if (params.restitution) { this.restitution = params.restitution; }
    }
  }
}

class ContactMaterial {
  isContactMaterial = true;
  friction = 0.3;
  restitution = 0.3;
  constructor(m1, m2, params) {
    if (params) {
      if (params.friction) { this.friction = params.friction; }
      if (params.restitution) { this.restitution = params.restitution; }
    }
  }
}

class World {
  isWorld = true;
  gravity = new Vec3(0, 0, 0);
  bodies = [];
  contactMaterials = [];
  // Counters so the interpreted script (and tests) can confirm the loop drove it.
  stepCount = 0;
  time = 0;
  constructor(params) {
    if (params) {
      if (params.gravity) { this.gravity.copy(params.gravity); }
    }
  }
  addBody(body) { this.bodies.push(body); return this; }
  addContactMaterial(cm) { this.contactMaterials.push(cm); return this; }
  // The real integration runs Ranger-side (CannonTsxBridge.stepFrame). These are
  // markers: they advance the façade clock so control flow / logging is sane. The
  // bridge does the physics and writes body.position/quaternion back before the
  // script reads them.
  step(dt) { this.stepCount = this.stepCount + 1; this.time = this.time + dt; return this; }
  fixedStep() { return this.step(1 / 60); }
}
