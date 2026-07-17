// ============================================================================
// model_viewer_tsx — a real 3D scene declared in a few lines of TSX.
// ============================================================================
// ALL heavy lifting is host-side: GLB parsing, mesh/GL-buffer creation, camera,
// lighting, animation and the render loop live in the host. This script only
// declares WHAT is in the scene, once. The SAME script runs on two hosts:
//   • native SDL2/OpenGL  — tsx3d_sdl_runner.rgr + Scene3dBridge (real GL upload)
//   • browser (software)  — web/web_tsx3d_host.rgr + SoftScene3dBridge (SoftRenderer3D)
//
// Host functions (addModel / place / spin):
//   addModel(file)          -> number   load models/<file> host-side, add to scene
//   place(i, x, y, z)                   position an instance
//   spin(i, radiansPerSec)              host rotates it about Y each frame
//
// Run native:  gallery/game_engine/scripts/build-tsx3d-sdl.sh --run  (up/down zoom, Q quit)
// Run in web:  it appears as "3D Scene (TSX)" in gallery/game_engine/web (drag to rotate)
// ============================================================================

export function init() {
  const box = addModel("BoxTextured.glb");
  spin(box, 0.6);
}
