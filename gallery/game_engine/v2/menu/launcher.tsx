// ============================================================================
// launcher.tsx — the game launcher menu as a v2 TSX guest (virtual modules).
// ============================================================================
// Guest content on the same packages the games use: domain objects from
// `ranger:2d`, capabilities from the `ranger:core` runtime root. Tile pages
// (CATEGORIES → GAMES), retained tile sprites + cursor, D-pad navigation on
// action edges, select → runtime.platform.launch(path) — the host then loads
// that game folder in a fresh realm (menu → game handoff).
// ============================================================================

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";

const CATALOG = [
  { name: "Games", entries: [
    { label: "Pomppija", path: "games/ylos2" },
    { label: "Chess", path: "games/chess" },
    { label: "Breakout", path: "games/breakout" }
  ] },
  { name: "Tests", entries: [
    { label: "Sprites", path: "tests/sprite_char" }
  ] }
];

const TILE_STEP = 40;
const GRID_COLS = 3;

class LauncherMenu {
  layer = null;
  cam = null;
  atlas = null;
  rTile = 0;
  rCursor = 0;
  selectSfx = null;
  page = 0;
  categoryIndex = 0;
  selected = 0;
  tileSprites = [];
  cursorSprite = null;

  currentCount() {
    if (this.page == 0) { return CATALOG.length; }
    return CATALOG[this.categoryIndex].entries.length;
  }

  tileX(i) { return (i % GRID_COLS) * TILE_STEP; }
  tileY(i) { return ((i - (i % GRID_COLS)) / GRID_COLS) * TILE_STEP; }

  // rebuild the retained tiles for the current page (old tiles are RELEASED —
  // page turns must not leak arena slots)
  buildTiles() {
    let i = 0;
    while (i < this.tileSprites.length) {
      this.layer.remove(this.tileSprites[i]);
      this.tileSprites[i].release();
      i = i + 1;
    }
    this.tileSprites = [];
    const n = this.currentCount();
    i = 0;
    while (i < n) {
      const s = new TWO.Sprite2D(this.atlas, this.rTile);
      s.setPos(this.tileX(i), this.tileY(i));
      this.layer.add(s);
      this.tileSprites.push(s);
      i = i + 1;
    }
    this.selected = 0;
    this.moveCursor();
  }

  moveCursor() {
    this.cursorSprite.setPos(this.tileX(this.selected), this.tileY(this.selected));
    this.cam.set(this.tileX(this.selected), this.tileY(this.selected), 1, 0);
  }

  init() {
    runtime.surface.setLayout("single");
    const tex = new TWO.Texture2D(128, 128);
    this.atlas = new TWO.SpriteAtlas(tex);
    this.rTile = this.atlas.addRegion("tile", 0, 0, 32, 32);
    this.rCursor = this.atlas.addRegion("cursor", 32, 0, 36, 36);
    this.layer = new TWO.Layer2D();
    this.cam = new TWO.Camera2D();
    const clip = runtime.audio.createClip();
    this.selectSfx = runtime.audio.createSource(clip);
    this.cursorSprite = new TWO.Sprite2D(this.atlas, this.rCursor);
    this.layer.add(this.cursorSprite);
    runtime.surface.pane(0).setView(this.layer, this.cam);
    this.buildTiles();
    runtime.log.info("launcher-v2 init: categories=" + CATALOG.length);
    return 1;
  }

  update(props) {
    const pad = runtime.input.player(0);
    const n = this.currentCount();
    if (pad.wasPressed("right")) {
      if (this.selected < n - 1) { this.selected = this.selected + 1; this.moveCursor(); }
    }
    if (pad.wasPressed("left")) {
      if (this.selected > 0) { this.selected = this.selected - 1; this.moveCursor(); }
    }
    if (pad.wasPressed("down")) {
      if (this.selected + GRID_COLS < n) { this.selected = this.selected + GRID_COLS; this.moveCursor(); }
    }
    if (pad.wasPressed("up")) {
      if (this.selected - GRID_COLS >= 0) { this.selected = this.selected - GRID_COLS; this.moveCursor(); }
    }
    if (pad.wasPressed("action")) {
      this.selectSfx.playOneShot();
      if (this.page == 0) {
        this.categoryIndex = this.selected;
        this.page = 1;
        this.buildTiles();
      } else {
        runtime.platform.launch(CATALOG[this.categoryIndex].entries[this.selected].path);
        runtime.audio.vocal.play("select");
      }
    }
    if (pad.wasPressed("back")) {
      if (this.page == 1) { this.page = 0; this.buildTiles(); this.selected = this.categoryIndex; this.moveCursor(); }
    }
    return 1;
  }
}

const __menu = new LauncherMenu();
runtime.start(__menu);

// ---- test observations (games/AGENTS.md rule 5) ----------------------------
function selectedIndex(slot) { return __menu.selected; }
function currentPage(slot) { return __menu.page; }
function tileCount(slot) { return __menu.tileSprites.length; }
function selectedLabelIsPomppija(slot) {
  if (__menu.page != 1) { return 0; }
  if (CATALOG[__menu.categoryIndex].entries[__menu.selected].label == "Pomppija") { return 1; }
  return 0;
}
