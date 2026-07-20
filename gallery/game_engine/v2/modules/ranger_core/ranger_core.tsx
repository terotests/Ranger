// ============================================================================
// ranger:core — the guest-side capability root (virtual module source).
// ============================================================================
// Registered by the host as the `ranger:core` virtual package; a game reaches
// it ONLY via `import { runtime } from "ranger:core"`. One root object carries
// the capabilities (CODE_CLEANUP "Capability root"): runtime.surface / input /
// audio / time / log / platform — never unrelated bare globals. Every method
// lowers to the same registry commands the WASM profile uses.
//
// Lifecycle: a game defines `class MyGame { init() update(frame) }` and calls
// runtime.start(new MyGame()). The host drives the stored instance through the
// __rgGameInit / __rgGameUpdate shims (the interpreter profile's transport of
// the host-owned tick — a wasm guest exports the same two entry points).
//
// INTERIM (BRIDGES.md §2.6): handwritten over the generated command names;
// replaced by a codegen-emitted wrapper. No extends/super (interpreter limits).
// ============================================================================

class __RgPane {
  index = 0;
  constructor(index) { this.index = index; }
  assignPlayer(player) { rgcore_surface_pane_player(this.index, player); }
  // declare this pane's presentation resources once (host stores real handles)
  setView(layer, cam) { rgcore_surface_pane_view(this.index, layer.id, cam.id); }
}

class __RgSurface {
  renderer = null;
  attachRenderer(r) { this.renderer = r; }
  setLayout(mode) {
    let m = 0;
    if (mode == "split-horizontal") { m = 1; }
    if (mode == "split-vertical") { m = 2; }
    if (mode == 1) { m = 1; }
    if (mode == 2) { m = 2; }
    rgcore_surface_set_layout(m);
  }
  pane(index) { return new __RgPane(index); }
}

class __RgPlayerInput {
  index = 0;
  constructor(index) { this.index = index; }
  isDown(action) { return rgcore_input_is_down(this.index, action) > 0; }
  wasPressed(action) { return rgcore_input_was_pressed(this.index, action) > 0; }
  // haptics (CODE_CLEANUP: player.rumble) — strength 0..255, duration ms
  rumble(strength, ms) { rgcore_input_rumble(this.index, strength, ms); }
}

class __RgInput {
  player(index) { return new __RgPlayerInput(index); }
}

class AudioClip {
  id = 0;
  // A clip carries a synth spec (freqHz, durationMs, volume, wave). The spec is
  // optional so existing createClip() callers keep a neutral default tone, while
  // a game can pass a real sound: createClip({ freqHz: 660, durationMs: 220 }).
  constructor(spec) {
    const s = spec || {};
    this.id = rgcore_audio_clip_create(s.freqHz || 440, s.durationMs || 80, s.volume || 0.35, s.wave || 0);
  }
}

class AudioSource {
  id = 0;
  // clip ≠ source (D-LIFE): a source is created FROM a clip, never implicitly.
  constructor(clip) { this.id = rgcore_audio_source_create(clip.id); }
  playOneShot() { rgcore_audio_one_shot(this.id); }
}

class __RgVocal {
  play(name) { rgcore_vocal(name); }
}

class __RgMusic {
  play(score) { rgcore_music_play(score); }
  stop() { rgcore_music_stop(); }
}

class __RgAudio {
  vocal = new __RgVocal();
  music = new __RgMusic();
  createClip(spec) { return new AudioClip(spec); }
  createSource(clip) { return new AudioSource(clip); }
}

// An atlas loaded through runtime.assets: same host object the ranger:2d
// SpriteAtlas wraps (sprites take it by .id); regions/clips come from the
// package's .atlas data, resolved by name.
class __RgLoadedAtlas {
  id = 0;
  constructor(id) { this.id = id; }
  regionIndex(name) { return rg2d_atlas_region_index(this.id, name); }
}

class __RgAssets {
  // interpreter profile: resolves synchronously; wasm profile lowers to the
  // D-ASYNC begin/poll pair. URI is package-relative ("pkg://player.atlas").
  loadSpriteAtlas(uri) { return new __RgLoadedAtlas(rgcore_assets_load_atlas(uri)); }
}

class __RgTime {
  now() { return rgcore_time_now(); }
}

class __RgLog {
  info(msg) { rgcore_log(msg); }
}

class __RgPlatform {
  launch(path) { rgcore_launch(path); }
}

// Shared graphics (PLAN_2D_EMBED_3D H1): RenderTarget owns a colour Texture2D
// initialised to transparent pixels. colorTexture.view() is a TextureView2D.
class __RgTexture2D {
  id = 0;
  width = 0;
  height = 0;
  constructor(id, w, h) {
    this.id = id;
    this.width = w;
    this.height = h;
  }
  view() { return { texture: this }; }
}

class __RgRenderTarget {
  id = 0;
  width = 0;
  height = 0;
  colorTexture = null;
  constructor(w, h) {
    this.width = w;
    this.height = h;
    // Host returns the colour attachment handle; RT identity is that texture
    // for this thin H1 slice (ownership rules match D11 for sampling).
    this.id = rgcore_graphics_rt_create(w, h);
    this.colorTexture = new __RgTexture2D(this.id, w, h);
  }
}

class __RgGraphics {
  createRenderTarget(opts) {
    let w = 64;
    let h = 64;
    if (opts != null) {
      if (opts.width != null) { w = opts.width; }
      if (opts.height != null) { h = opts.height; }
    }
    return new __RgRenderTarget(w, h);
  }
}

let __rgGame = null;

class __RgRuntime {
  surface = new __RgSurface();
  input = new __RgInput();
  audio = new __RgAudio();
  assets = new __RgAssets();
  time = new __RgTime();
  log = new __RgLog();
  platform = new __RgPlatform();
  graphics = new __RgGraphics();
  // host owns the tick: start() stores the game; the host drives it through
  // the __rgGameInit / __rgGameUpdate entry points below.
  start(game) { __rgGame = game; }
}

const runtime = new __RgRuntime();

// ---- host-driven lifecycle entry points (interpreter-profile transport) ----
function __rgGameInit() {
  if (__rgGame == null) { return 0; }
  return __rgGame.init();
}
function __rgGameUpdate(props) {
  if (__rgGame == null) { return 0; }
  return __rgGame.update(props);
}
