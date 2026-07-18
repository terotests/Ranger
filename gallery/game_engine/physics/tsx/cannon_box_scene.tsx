// ============================================================================
// cannon_box_scene.tsx — the canonical cannon-es example, run 1:1 in the TSX
// engine against the Ranger Cannon façade (cannon.tsx). A dynamic box falls
// under gravity while spinning (initial angularVelocity); each frame the mesh
// copies the body's pose — exactly the cannon.js/three.js integration pattern.
//
// The world/body/shape are real host Cannon objects (handles); world.fixedStep()
// calls the real engine and pulls each body's pose back into its view, so
// `mesh.position.copy(body.position)` picks up the simulated pose.
// ============================================================================

import * as CANNON from '../dist/cannon-es.js';

let world, body, mesh;

export function init() {
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
  body = new CANNON.Body({ mass: 1 });
  body.addShape(shape);
  body.angularVelocity.set(0, 10, 0);
  body.angularDamping = 0.5;
  world.addBody(body);

  // Stand-in for the three.js mesh; only the transform matters here.
  mesh = { position: new CANNON.Vec3(), quaternion: new CANNON.Quaternion() };
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}

function animate() {
  // Step the physics world (runs the real Ranger engine via the native binding).
  world.fixedStep();

  // Copy coordinates from cannon to the mesh.
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}

// The host frame loop calls tick() each frame.
export function tick() { animate(); }

// --- introspection hooks (the test reads the simulated pose off the mesh) ---
export function meshX() { return mesh.position.x; }
export function meshY() { return mesh.position.y; }
export function meshZ() { return mesh.position.z; }
export function meshQuatY() { return mesh.quaternion.y; }
export function meshQuatW() { return mesh.quaternion.w; }
export function bodyY() { return body.position.y; }
export function stepCount() { return world.stepCount; }
export function bodyCount() { return world.bodies.length; }
