// ============================================================================
// ranger:three — minimal 3D domain objects (virtual module source).
// ============================================================================
// Registered by the host as `ranger:three`. First live surface for
// PLAN_2D_EMBED_3D: Scene / Camera / Mesh / Renderer3D.render→RTT and the
// ergonomic SceneSprite3D (RT + texture-backed Sprite2D). Software path A:
// SW 3D → CPU Texture2D → SW 2D sampling.
//
// INTERIM (BRIDGES.md §2.6): handwritten over the generated command names.
// No extends/super (interpreter limits).
// ============================================================================

class Scene {
  id = 0;
  constructor() { this.id = rg3d_scene_create(); }
}

class PerspectiveCamera {
  id = 0;
  constructor(fov, aspect, near, far) {
    this.id = rg3d_camera_create();
    rg3d_camera_set(this.id, fov, aspect, near, far);
  }
  setPose(px, py, pz, ex, ey, ez) {
    rg3d_camera_pose(this.id, px, py, pz, ex, ey, ez);
  }
}

class BoxGeometry {
  id = 0;
  constructor(w, h, d) { this.id = rg3d_geometry_box(w, h, d); }
}

class OctahedronGeometry {
  id = 0;
  constructor(radius) { this.id = rg3d_geometry_octahedron(radius); }
}

class MeshBasicMaterial {
  id = 0;
  constructor(colorHex) { this.id = rg3d_material_basic(colorHex); }
}

class Mesh {
  id = 0;
  constructor(scene, geometry, material) {
    this.id = rg3d_mesh_create(scene.id, geometry.id, material.id);
  }
  setTransform(px, py, pz, ex, ey, ez) {
    rg3d_mesh_transform(this.id, px, py, pz, ex, ey, ez);
  }
}

class Renderer3D {
  // Render into a RenderTarget / Texture2D (appends + executes SW RTT).
  render(scene, camera, target) {
    const tex = target.colorTexture != null ? target.colorTexture : target;
    const w = target.width != null ? target.width : tex.width;
    const h = target.height != null ? target.height : tex.height;
    rg3d_render_to(scene.id, camera.id, tex.id, w, h);
  }
}

// Ergonomic embedded 3D view (PLAN D10 / H4): owns an RT + texture-backed
// Sprite2D. update: "everyFrame" | "manual"; call invalidate() on manual.
class SceneSprite3D {
  target = null;
  sprite = null;
  scene = null;
  camera = null;
  mesh = null;
  width = 64;
  height = 64;
  updateMode = "everyFrame";
  dirty = 1;
  angle = 0.0;

  constructor(opts) {
    this.scene = opts.scene;
    this.camera = opts.camera;
    this.mesh = opts.mesh != null ? opts.mesh : null;
    if (opts.resolution != null) {
      this.width = opts.resolution.width;
      this.height = opts.resolution.height;
    }
    if (opts.update != null) { this.updateMode = opts.update; }
    this.target = opts.target;
    // Sprite is created by the game after importing ranger:2d, OR via the
    // pre-built sprite handle when the host helper is used. Games normally
    // pass a ready texture-backed Sprite2D as opts.sprite.
    this.sprite = opts.sprite;
    this.dirty = 1;
  }

  invalidate() { this.dirty = 1; }

  // Rotate the mesh (if any) and ensure the RT is fresh for this frame.
  sync(renderer3d, dtMs) {
    if (this.mesh != null) {
      this.angle = this.angle + dtMs * 0.002;
      this.mesh.setTransform(0.0, 0.0, 0.0, 0.35, this.angle, 0.2);
      this.dirty = 1;
    }
    if (this.updateMode == "everyFrame") { this.dirty = 1; }
    if (this.dirty != 0) {
      renderer3d.render(this.scene, this.camera, this.target);
      this.dirty = 0;
    }
  }
}
