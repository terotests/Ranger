// ============================================================================
// ranger:2d — retained 2D domain objects (virtual module source).
// ============================================================================
// Registered by the host as the `ranger:2d` virtual package; a game reaches it
// ONLY via `import * as TWO from "ranger:2d"` (constructors resolve through
// member-new: `new TWO.Sprite2D(...)`). Domain objects live here; platform
// capabilities (surface/input/audio/…) live on the ranger:core runtime root.
//
// INTERIM (BRIDGES.md §2.6): handwritten over the generated command names;
// replaced by a codegen-emitted wrapper. No extends/super (interpreter limits).
// ============================================================================

class Texture2D {
  id = 0;
  constructor(w, h) { this.id = rg2d_texture_create(w, h); }
}

class SpriteAtlas {
  id = 0;
  constructor(texture) { this.id = rg2d_atlas_create(texture.id); }
  addRegion(name, x, y, w, h) { return rg2d_atlas_add_region(this.id, name, x, y, w, h); }
  addClip(name, frames, durations) { return rg2d_atlas_add_clip(this.id, name, frames, durations); }
  regionIndex(name) { return rg2d_atlas_region_index(this.id, name); }
}

class Sprite2D {
  id = 0;
  constructor(atlas, regionIndex) { this.id = rg2d_sprite_create(atlas.id, regionIndex); }
  setPos(x, y) { rg2d_sprite_set_pos(this.id, x, y); }
  setRegion(regionIndex) { rg2d_sprite_set_region(this.id, regionIndex); }
  release() { return rg2d_sprite_release(this.id); }
}

class Layer2D {
  id = 0;
  constructor() { this.id = rg2d_layer_create(); }
  add(sprite) { rg2d_layer_add(sprite.id, this.id); }
  remove(sprite) { rg2d_layer_remove(sprite.id); }
}

class Camera2D {
  id = 0;
  constructor() { this.id = rg2d_camera_create(); }
  set(x, y, zoom, rotation) { rg2d_camera_set(this.id, x, y, zoom, rotation); }
}

class Renderer2D {
  // frame pipeline step 6: the GAME calls render; each call binds
  // (scene/layer, camera) to a pane; the host presents at step 7.
  render(scene, cam, pane) { rg2d_render(scene.id, cam.id, pane); }
}

class AnimPlayer2D {
  id = 0;
  constructor(sprite, clipIndex) { this.id = rg2d_player_create(sprite.id, clipIndex); }
  frameAt(time) { return rg2d_player_frame_at(this.id, time); }
}
