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

// Smooth UV sphere. widthSegments/heightSegments default to a round 24x16.
class SphereGeometry {
  id = 0;
  constructor(radius, wSeg, hSeg) {
    this.id = rg3d_geometry_sphere(radius, wSeg || 24, hSeg || 16);
  }
}

// Cylinder (radiusTop, radiusBottom, height, radialSegments default 24).
class CylinderGeometry {
  id = 0;
  constructor(radiusTop, radiusBottom, height, radialSeg) {
    this.id = rg3d_geometry_cylinder(radiusTop, radiusBottom, height, radialSeg || 24);
  }
}

// Flat plane primitive (floor). width/height, then optional segment counts.
class PlaneGeometry {
  id = 0;
  constructor(width, height, wSeg, hSeg) {
    this.id = rg3d_geometry_plane(width, height, wSeg || 1, hSeg || 1);
  }
}

// Utah teapot (Three.js addons TeapotGeometry). A leaf resource — no membership.
// The 5 part/shape flags are booleans; the bridge carries them as i32 0/1.
class TeapotGeometry {
  id = 0;
  constructor(size, seg, bottom, lid, body, fitLid, blinn) {
    // The 5 shape flags are i32 in the schema; a JS boolean does not coerce
    // through the native-bridge int decode, so normalise here (accepts true/false
    // OR 1/0 from callers).
    this.id = rg3d_geometry_teapot(size, seg,
      bottom ? 1 : 0, lid ? 1 : 0, body ? 1 : 0, fitLid ? 1 : 0, blinn ? 1 : 0);
  }
}

class MeshBasicMaterial {
  id = 0;
  constructor(colorHex) { this.id = rg3d_material_basic(colorHex); }
}

// Smooth-shaded material with a specular highlight (shiny metal / glossy caps).
class MeshPhongMaterial {
  id = 0;
  constructor(colorHex, specularHex, shininess) {
    this.id = rg3d_material_phong(colorHex, specularHex, shininess);
  }
  // apply a diffuse texture from a pkg-relative PNG (e.g. printed art)
  setMap(path) { rg3d_material_map(this.id, path); }
}

class MeshLambertMaterial {
  id = 0;
  constructor(colorHex) { this.id = rg3d_material_lambert(colorHex); }
  setOpacity(opacity) {
    rg3d_material_set_opacity(this.id, opacity);
  }
  setMap(path) { rg3d_material_map(this.id, path); }
}

// D-SYNC: create the light DETACHED (no scene membership). Establish membership
// separately via scene.add(light) — lights are plain scene children the renderer
// collects by walking the tree, so scene.add registers them for rendering.
class AmbientLight {
  id = 0;
  constructor(colorHex, intensity) {
    this.id = rg3d_light_ambient(colorHex, intensity);
  }
}

// D-SYNC: create DETACHED; establish membership via scene.add(light).
class DirectionalLight {
  id = 0;
  constructor(colorHex, intensity, dx, dy, dz) {
    this.id = rg3d_light_directional(colorHex, intensity, dx, dy, dz);
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

// THREE.Group — a transform-only node that owns children. D-SYNC: created
// DETACHED (no scene membership); establish membership via scene.add(group).
// A group is a first-class entity: usable AS a child (scene.add(group)) and AS a
// parent (group.add(mesh)). setTransform/setScale move the whole subtree.
//
// Group.remove(child) is intentionally OMITTED: rg3d_entity_remove takes a SCENE
// handle (host.entityRemove(sceneH, entH) removes from a scene root), so it cannot
// express "detach a child from a group". To move a child out of a group, reparent
// it with scene.add(child) / otherGroup.add(child) — entity_set_parent detaches
// from the current parent first, which covers the group case correctly.
class Group {
  id = 0;
  constructor() { this.id = rg3d_group_create(); }
  add(obj) { rg3d_entity_set_parent(obj.id, this.id); }
  setTransform(px, py, pz, ex, ey, ez) {
    rg3d_mesh_transform(this.id, px, py, pz, ex, ey, ez);
  }
  setScale(sx, sy, sz) {
    rg3d_mesh_set_scale(this.id, sx, sy, sz);
  }
}

// Package-relative .glb host-decoded via ThreeGLTFFile. Games pass any pkg:// uri
// — the engine has no asset- or game-specific loaders.
// D-SYNC: create DETACHED; establish membership separately via scene.add(model).
class GLTFModel {
  id = 0;
  constructor(uri) {
    this.id = rg3d_model_load(uri);
  }
  setTransform(px, py, pz, ex, ey, ez) {
    rg3d_mesh_transform(this.id, px, py, pz, ex, ey, ez);
  }
  setScale(sx, sy, sz) {
    rg3d_mesh_set_scale(this.id, sx, sy, sz);
  }
}

// Spherical orbit-camera controller (Three.js addons OrbitControls), bound to a
// camera at construction. The game feeds pointer/wheel events + viewport/target;
// apply() writes the bound camera's pose. phase: 0=down, 1=move, 2=up.
class OrbitControls {
  id = 0;
  constructor(camera) { this.id = rg3d_orbit_create(camera.id); }
  setViewport(w, h) { rg3d_orbit_viewport(this.id, w, h); }
  setTarget(x, y, z) { rg3d_orbit_target(this.id, x, y, z); }
  pointerDown(x, y, button) { rg3d_orbit_pointer(this.id, 0, x, y, button); }
  pointerMove(x, y) { rg3d_orbit_pointer(this.id, 1, x, y, 0); }
  pointerUp() { rg3d_orbit_pointer(this.id, 2, 0, 0, 0); }
  wheel(delta) { rg3d_orbit_wheel(this.id, delta); }
  apply() { rg3d_orbit_apply(this.id); }
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
