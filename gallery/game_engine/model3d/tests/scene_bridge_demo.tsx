// ============================================================================
// scene_bridge_demo.tsx — TEST FIXTURE (not a playable game).
// ============================================================================
// The whole "game script" for the host-owned 3D scene: declare what's in the
// scene, once. All heavy lifting (load, GL upload, camera, light, animation,
// render) is host-side. Exercised headlessly by Scene3dBridgeTest.rgr.
// ============================================================================

export function init() {
  const box = addModel("fixture.glb");
  place(box, 2, 0, 0);
  spin(box, 1.0);
}
