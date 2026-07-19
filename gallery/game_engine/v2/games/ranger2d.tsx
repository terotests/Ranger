// ============================================================================
// ranger2d.tsx — guest façade for ranger:2d + ranger:core (v2, INTERIM).
// ============================================================================
// The 2D analog of three/tsx/three.tsx: thin guest classes over the bare
// registry commands (rg2d_* / rgcore_*) served by RgRegistryBridge. Games
// import nothing else and contain no engine knowledge beyond these classes.
//
// INTERIM per BRIDGES.md §2.6: hand-written sugar over generated command
// names only; replaced by a codegen-emitted wrapper in step 6. Interpreter
// constraints honoured: no extends/super, no `=== undefined`.
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

class AnimPlayer2D {
  id = 0;
  constructor(sprite, clipIndex) { this.id = rg2d_player_create(sprite.id, clipIndex); }
  frameAt(time) { return rg2d_player_frame_at(this.id, time); }
}

class AudioSource {
  id = 0;
  constructor() {
    const clip = rgcore_audio_clip_create();
    this.id = rgcore_audio_source_create(clip);
  }
  playOneShot() { rgcore_audio_one_shot(this.id); }
}

// runtime.* capability sugar (module-level commands)
function inputIsDown(player, action) { return rgcore_input_is_down(player, action) > 0; }
function inputWasPressed(player, action) { return rgcore_input_was_pressed(player, action) > 0; }
function surfaceSetLayout(mode) { rgcore_surface_set_layout(mode); }
function surfacePanePlayer(pane, player) { rgcore_surface_pane_player(pane, player); }
function vocal(name) { rgcore_vocal(name); }
function musicPlay(score) { rgcore_music_play(score); }
function musicStop() { rgcore_music_stop(); }
function timeNow() { return rgcore_time_now(); }
function log(msg) { rgcore_log(msg); }
function launch(path) { rgcore_launch(path); }
