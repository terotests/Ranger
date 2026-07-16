// ============================================================================
// model_viewer_tsx — a real 3D scene declared in a few lines of TSX.
// ============================================================================
// ALL heavy lifting is host-side: GLB parsing, GL-buffer creation, camera,
// lighting, animation and the render loop live in the host (tsx3d_sdl_runner +
// Scene3dBridge, no WASM). This script only declares WHAT is in the scene, once.
//
// Host functions (Scene3dBridge):
//   addModel(file)          -> number   load models/<file>, upload to GL, place at origin
//   place(i, x, y, z)                   position an instance
//   spin(i, radiansPerSec)              host auto-rotates it about Y
//
// Run:  gallery/game_engine/scripts/build-tsx3d-sdl.sh --run
//       (up/down zoom, Q/Esc quit)
// ============================================================================

export function init() {
  const box = addModel("BoxTextured.glb");
  spin(box, 0.6);
}
