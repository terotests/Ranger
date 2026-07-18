// ============================================================================
// cannon.tsx — 1:1 TSX façade for the Ranger Cannon port (capability: 'cannon').
// ============================================================================
//
// NOT a per-demo data mirror. Each CANNON.* object here is a thin HANDLE to
// exactly one host Cannon* object (physics/src), reached through the native
// bridge (cannon_native_bridge.rgr) by bare calls (cannon_world_new, …). The
// host is the single source of truth: constructors create the host object,
// methods delegate to it, and there is no duplicated physics state on the guest.
// So any cannon-es program drives the real engine — there is no reconciliation
// step that only understands the fields one demo happens to use.
//
// The one guest-held state is the transform VIEW (body.position / .quaternion):
// the interpreter has no native property interception, so World.step() pulls each
// body's pose from the host into its view once per step (generic over all bodies).
// Setting an input (body.angularVelocity.set / world.gravity.set) forwards to the
// host immediately.
//
// Interpreter constraints honoured: no `extends`/`super`, no `=== undefined`.
// ============================================================================

// Body type constants (cannon-es: DYNAMIC=1, STATIC=2, KINEMATIC=4).
const BODY_DYNAMIC = 1;
const BODY_STATIC = 2;
const BODY_KINEMATIC = 4;

// A 3-vector. Unbound (e.g. a Box's halfExtents) it is plain data. Bound to a
// host body field (__bodyOwner + __field) or the world gravity (__worldOwner),
// set/copy also push the value to the host.
class Vec3 {
  x = 0;
  y = 0;
  z = 0;
  __bodyOwner = 0;   // host body handle, 0 = unbound
  __field = 0;       // 1=position 2=velocity 3=angularVelocity
  __worldOwner = 0;  // host world handle for gravity, 0 = unbound
  constructor(x, y, z) {
    if (x) { this.x = x; }
    if (y) { this.y = y; }
    if (z) { this.z = z; }
  }
  set(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    if (this.__bodyOwner) { cannon_body_set_vec(this.__bodyOwner, this.__field, x, y, z); }
    if (this.__worldOwner) { cannon_world_set_gravity(this.__worldOwner, x, y, z); }
    return this;
  }
  copy(v) { return this.set(v.x, v.y, v.z); }
  clone() { const o = new Vec3(); o.x = this.x; o.y = this.y; o.z = this.z; return o; }
}

class Quaternion {
  x = 0;
  y = 0;
  z = 0;
  w = 1;
  __owner = 0;   // host body handle, 0 = unbound
  set(x, y, z, w) {
    this.x = x; this.y = y; this.z = z; this.w = w;
    if (this.__owner) { cannon_body_set_quat(this.__owner, x, y, z, w); }
    return this;
  }
  copy(q) { return this.set(q.x, q.y, q.z, q.w); }
  setFromAxisAngle(axis, angle) {
    const s = Math.sin(angle * 0.5);
    return this.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(angle * 0.5));
  }
}

// --- Shapes: each creates one host shape and holds its handle -----------------
class Box {
  isShape = true;
  __h = 0;
  constructor(halfExtents) {
    let hx = 1; let hy = 1; let hz = 1;
    if (halfExtents) { hx = halfExtents.x; hy = halfExtents.y; hz = halfExtents.z; }
    this.__h = cannon_box_new(hx, hy, hz);
  }
}

class Sphere {
  isShape = true;
  __h = 0;
  constructor(radius) {
    let r = 1;
    if (radius) { r = radius; }
    this.__h = cannon_sphere_new(r);
  }
}

class Plane {
  isShape = true;
  __h = 0;
  constructor() {
    this.__h = cannon_plane_new();
  }
}

class Body {
  isBody = true;
  __h = 0;
  mass = 0;
  type = 2;
  shapes = [];
  constructor(params) {
    let mass = 0;
    if (params) { if (params.mass) { mass = params.mass; } }
    this.__h = cannon_body_new(mass);
    this.mass = mass;
    if (mass > 0) { this.type = 1; } else { this.type = 2; }

    // Transform views bound to this host body.
    this.position = new Vec3();
    this.position.__bodyOwner = this.__h;
    this.position.__field = 1;
    this.velocity = new Vec3();
    this.velocity.__bodyOwner = this.__h;
    this.velocity.__field = 2;
    this.angularVelocity = new Vec3();
    this.angularVelocity.__bodyOwner = this.__h;
    this.angularVelocity.__field = 3;
    this.quaternion = new Quaternion();
    this.quaternion.__owner = this.__h;

    if (params) {
      if (params.position) { this.position.copy(params.position); }
      if (params.velocity) { this.velocity.copy(params.velocity); }
      if (params.shape) { this.addShape(params.shape); }
    }
  }
  addShape(shape) {
    this.shapes.push(shape);
    cannon_body_add_shape(this.__h, shape.__h);
    return this;
  }
}

class World {
  isWorld = true;
  __h = 0;
  bodies = [];
  stepCount = 0;
  time = 0;
  constructor(params) {
    this.__h = cannon_world_new();
    this.gravity = new Vec3();
    this.gravity.__worldOwner = this.__h;
    if (params) {
      if (params.gravity) { this.gravity.copy(params.gravity); }
    }
  }
  addBody(body) {
    this.bodies.push(body);
    cannon_world_add_body(this.__h, body.__h);
    return this;
  }
  // Step the real engine, then pull every body's pose from the host into its
  // view (generic — no per-shape / per-demo knowledge).
  step(dt) {
    cannon_world_step(this.__h, dt);
    this.stepCount = this.stepCount + 1;
    this.time = this.time + dt;
    let i = 0;
    while (i < this.bodies.length) {
      const b = this.bodies[i];
      b.position.x = cannon_body_get(b.__h, 0);
      b.position.y = cannon_body_get(b.__h, 1);
      b.position.z = cannon_body_get(b.__h, 2);
      b.quaternion.x = cannon_body_get(b.__h, 3);
      b.quaternion.y = cannon_body_get(b.__h, 4);
      b.quaternion.z = cannon_body_get(b.__h, 5);
      b.quaternion.w = cannon_body_get(b.__h, 6);
      i = i + 1;
    }
    return this;
  }
  fixedStep() { return this.step(1 / 60); }
}
