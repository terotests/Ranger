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
  // D-SYNC: membership is independent of object lifetime. add() establishes
  // membership for an already-created object; remove() detaches it WITHOUT
  // destroying the object (it can be re-added to this or another scene later).
  add(obj) { rg3d_entity_set_parent(obj.id, this.id); }
  remove(obj) { rg3d_entity_remove(this.id, obj.id); }
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

class MeshLambertMaterial {
  id = 0;
  constructor(colorHex) { this.id = rg3d_material_lambert(colorHex); }
  setOpacity(opacity) {
    rg3d_material_set_opacity(this.id, opacity);
  }
}

class AmbientLight {
  id = 0;
  constructor(scene, colorHex, intensity) {
    this.id = rg3d_light_ambient(scene.id, colorHex, intensity);
  }
}

class DirectionalLight {
  id = 0;
  constructor(scene, colorHex, intensity, dx, dy, dz) {
    this.id = rg3d_light_directional(scene.id, colorHex, intensity, dx, dy, dz);
  }
}

class Mesh {
  id = 0;
  // D-SYNC: create the object DETACHED (no scene membership). Establish
  // membership separately via scene.add(mesh).
  constructor(geometry, material) {
    this.id = rg3d_mesh_create(geometry.id, material.id);
  }
  setTransform(px, py, pz, ex, ey, ez) {
    rg3d_mesh_transform(this.id, px, py, pz, ex, ey, ez);
  }
  setScale(sx, sy, sz) {
    rg3d_mesh_set_scale(this.id, sx, sy, sz);
  }
}

// Package-relative .glb attached under a scene (host-decoded via ThreeGLTFFile).
// Games pass any pkg:// uri — the engine has no asset- or game-specific loaders.
class GLTFModel {
  id = 0;
  constructor(scene, uri) {
    this.id = rg3d_model_load(scene.id, uri);
  }
  setTransform(px, py, pz, ex, ey, ez) {
    rg3d_mesh_transform(this.id, px, py, pz, ex, ey, ez);
  }
  setScale(sx, sy, sz) {
    rg3d_mesh_set_scale(this.id, sx, sy, sz);
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

// Embedded 3D view: owns an RT + texture-backed Sprite2D. Does not animate
// meshes — the game owns transforms and calls invalidate()/sync as needed.
// update: "everyFrame" | "manual".
class SceneSprite3D {
  target = null;
  sprite = null;
  scene = null;
  camera = null;
  width = 64;
  height = 64;
  updateMode = "everyFrame";
  dirty = 1;

  constructor(opts) {
    this.scene = opts.scene;
    this.camera = opts.camera;
    if (opts.resolution != null) {
      this.width = opts.resolution.width;
      this.height = opts.resolution.height;
    }
    if (opts.update != null) { this.updateMode = opts.update; }
    // Prefer caller-supplied target/sprite (games that import ranger:2d
    // explicitly); otherwise leave null for host helpers to fill later.
    this.target = opts.target != null ? opts.target : null;
    this.sprite = opts.sprite != null ? opts.sprite : null;
    this.dirty = 1;
  }

  invalidate() { this.dirty = 1; }

  // Refresh the RT when everyFrame or after invalidate(). No mesh mutation.
  sync(renderer3d) {
    if (this.updateMode == "everyFrame") { this.dirty = 1; }
    if (this.dirty != 0) {
      renderer3d.render(this.scene, this.camera, this.target);
      this.dirty = 0;
    }
  }
}
