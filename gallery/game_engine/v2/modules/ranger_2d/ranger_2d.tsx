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
  // destination extent in world units (unset = native region size): a platform
  // stretches one region across its span; a background covers the view.
  setSize(w, h) { rg2d_sprite_set_size(this.id, w, h); }
  // painter order within the layer (bg < platforms < players)
  setZ(z) { rg2d_sprite_set_z(this.id, z); }
  // horizontal mirror for facing
  setFlipX(on) { rg2d_sprite_set_flip(this.id, on ? 1 : 0); }
  // spritesheet cell: sample frame (col,row) of a sheet atlas (v1 "sheet")
  setCell(col, row) { rg2d_sprite_set_cell(this.id, col, row); }
  // split-screen ownership: draw only in pane p (-1 = every pane)
  setPane(p) { rg2d_sprite_set_pane(this.id, p); }
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
  // Static environment (v1 createStaticBg model): the game paints world-space
  // primitives once per frame between beginBackground() and its render() calls;
  // a backend rasterises them through each pane's camera UNDER the sprites.
  // fillRect/fillCircle take world coordinates and 8-bit r,g,b — the same
  // vocabulary v1's bgFillRect / bgFillCircle expose.
  beginBackground() { rg2d_bg_begin(); }
  fillRect(x, y, w, h, r, g, b) { rg2d_bg_rect(x, y, w, h, r, g, b); }
  fillCircle(cx, cy, rad, r, g, b) { rg2d_bg_circle(cx, cy, rad, r, g, b); }
  // frame pipeline step 6: the GAME calls render; each call binds
  // (scene/layer, camera) to a pane; the host presents at step 7.
  render(scene, cam, pane) { rg2d_render(scene.id, cam.id, pane); }
}

class AnimPlayer2D {
  id = 0;
  constructor(sprite, clipIndex) { this.id = rg2d_player_create(sprite.id, clipIndex); }
  frameAt(time) { return rg2d_player_frame_at(this.id, time); }
}
