// ============================================================================
// ranger:cannon — minimal rigid-body physics façade (virtual module source).
// ============================================================================
// Registered by the host as `ranger:cannon`. A guest imports it alongside
// ranger:three and drives the real Cannon port through the SAME native command
// path as ranger:2d/three:
//
//     import * as CANNON from "ranger:cannon";
//     const world = new CANNON.World();
//     world.setGravity(0, -9.8, 0);
//     const ground = world.addStaticPlane(0, 1, 0);
//     const box = world.addBox(1, 0, 6, 0, 0.5, 0.5, 0.5);
//     // each frame:
//     world.step(dtMs / 1000);
//     mesh.setTransform(box.posX(), box.posY(), box.posZ(), 0, 0, 0);
//
// Bodies live in the physics arena (D-TYPE, separate from Three); the guest owns
// the physics -> mesh pose copy (the three + cannon loop). Poses come back as
// plain doubles. Handwritten over the generated command names (BRIDGES.md §2.6).
// ============================================================================

// A rigid body. `id` is the guest handle returned by the create command; the
// pose accessors read the live simulation pose back through the bridge.
class Body {
  id = 0;
  constructor(id) { this.id = id; }
  setVelocity(vx, vy, vz) { cannon_body_set_velocity(this.id, vx, vy, vz); }
  posX() { return cannon_body_pos_x(this.id); }
  posY() { return cannon_body_pos_y(this.id); }
  posZ() { return cannon_body_pos_z(this.id); }
}

// The physics world: one arena of bodies stepped under gravity. mass 0 => static.
class World {
  constructor() { }
  setGravity(x, y, z) { cannon_world_gravity(x, y, z); }
  // dt is in SECONDS (a fixed tick; the guest chooses steps per frame).
  step(dt) { cannon_world_step(dt); }
  addSphere(mass, x, y, z, radius) {
    return new Body(cannon_body_sphere(mass, x, y, z, radius));
  }
  addBox(mass, x, y, z, halfX, halfY, halfZ) {
    return new Body(cannon_body_box(mass, x, y, z, halfX, halfY, halfZ));
  }
  addStaticPlane(nx, ny, nz) {
    return new Body(cannon_body_static_plane(nx, ny, nz));
  }
}
