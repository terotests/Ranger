// ============================================================================
// model3d_bridge_demo.tsx — TEST FIXTURE (not a playable game).
// ============================================================================
// Drives host-side GLB loading + GL-mesh creation entirely from the TSX
// interpreter, through the Model3dScriptBridge native seam. No WASM, no shared
// memory block — the script just calls host functions.
//
// Exercised headlessly by ./Model3dScriptBridgeTest.rgr, which wires the bridge,
// materialises a real .glb on disk, injects `assetDir`, and calls run().
//
// Host functions supplied by Model3dScriptBridge (resolved at call time by the
// interpreter's native-bridge seam — no import/declare needed):
//   loadModel(dir, file) : number   — parse .glb, prepare GL-ready buffers (-1 err)
//   modelInfo(id)        : object    — asset counts + geometry stats
//   buildGLMesh(id)      : object    — create GL buffers (simulated when headless)
//   modelError()         : string    — last error
// Injected global: assetDir (string) — directory holding fixture.glb.
// ============================================================================

export function run() {
  const id = loadModel(assetDir, "fixture.glb");
  if (id < 0) {
    return { ok: 0, error: modelError() };
  }

  const info = modelInfo(id);
  const gl = buildGLMesh(id);

  return {
    ok: 1,
    modelId: id,
    nodes: info.nodes,
    meshes: info.meshes,
    textures: info.textures,
    verts: gl.vertexCount,
    indices: gl.indexCount,
    tris: gl.triCount,
    hasTexture: gl.hasTexture,
    texW: gl.texWidth,
    texH: gl.texHeight,
    glMeshId: gl.glMeshId,
    glTexId: gl.glTexId,
    glReal: gl.glReal,
    checksum: gl.checksum,
  };
}
