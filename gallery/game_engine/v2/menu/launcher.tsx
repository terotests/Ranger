// ============================================================================
// launcher.tsx — the game launcher menu, recreated as a v2 TSX guest.
// ============================================================================
// The v2 answer to ui/EvgLauncherMenu.rgr, but as guest content on the same
// ranger2d.tsx façade the games use: two tile pages (CATEGORIES → GAMES),
// retained tile sprites + a highlight cursor, pointer-free D-pad navigation on
// ranger:core action edges, and selection reporting the game's launch path
// back to the host via the launch capability — the host then loads that game
// guest (menu → game handoff).
// ============================================================================

// catalog: categories → entries { label, path }  ("Games" mirrors game.info)
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

const TILE_STEP = 40;   // grid spacing (world units)
const GRID_COLS = 3;

let layer = null;
let cam = null;
let atlas = null;
let rTile = 0;
let rCursor = 0;
let selectSfx = null;

let page = 0;           // 0 = categories, 1 = games in the open category
let categoryIndex = 0;
let selected = 0;
let tileSprites = [];   // retained tiles for the current page
let cursorSprite = null;
let launchedPath = "";

function currentCount() {
  if (page == 0) { return CATALOG.length; }
  return CATALOG[categoryIndex].entries.length;
}

function tileX(i) { return (i % GRID_COLS) * TILE_STEP; }
function tileY(i) { return ((i - (i % GRID_COLS)) / GRID_COLS) * TILE_STEP; }

// rebuild the retained tiles for the current page (old tiles are RELEASED —
// page turns must not leak arena slots)
function buildTiles() {
  let i = 0;
  while (i < tileSprites.length) {
    layer.remove(tileSprites[i]);
    tileSprites[i].release();
    i = i + 1;
  }
  tileSprites = [];
  const n = currentCount();
  i = 0;
  while (i < n) {
    const s = new Sprite2D(atlas, rTile);
    s.setPos(tileX(i), tileY(i));
    layer.add(s);
    tileSprites.push(s);
    i = i + 1;
  }
  selected = 0;
  moveCursor();
}

function moveCursor() {
  cursorSprite.setPos(tileX(selected), tileY(selected));
  cam.set(tileX(selected), tileY(selected), 1, 0);
}

function init() {
  surfaceSetLayout(0);   // launcher is single-pane
  const tex = new Texture2D(128, 128);
  atlas = new SpriteAtlas(tex);
  rTile = atlas.addRegion("tile", 0, 0, 32, 32);
  rCursor = atlas.addRegion("cursor", 32, 0, 36, 36);
  layer = new Layer2D();
  cam = new Camera2D();
  selectSfx = new AudioSource();
  cursorSprite = new Sprite2D(atlas, rCursor);
  layer.add(cursorSprite);
  surfacePaneView(0, layer, cam);
  buildTiles();
  log("launcher-v2 init: categories=" + CATALOG.length);
  return 1;
}

function update(props) {
  const n = currentCount();
  if (inputWasPressed(0, "right")) {
    if (selected < n - 1) { selected = selected + 1; moveCursor(); }
  }
  if (inputWasPressed(0, "left")) {
    if (selected > 0) { selected = selected - 1; moveCursor(); }
  }
  if (inputWasPressed(0, "down")) {
    if (selected + GRID_COLS < n) { selected = selected + GRID_COLS; moveCursor(); }
  }
  if (inputWasPressed(0, "up")) {
    if (selected - GRID_COLS >= 0) { selected = selected - GRID_COLS; moveCursor(); }
  }
  if (inputWasPressed(0, "action")) {
    selectSfx.playOneShot();
    if (page == 0) {
      // drill into the category
      categoryIndex = selected;
      page = 1;
      buildTiles();
    } else {
      // select the game: report its launch path to the host
      launchedPath = CATALOG[categoryIndex].entries[selected].path;
      launch(launchedPath);
      vocal("select");
    }
  }
  if (inputWasPressed(0, "back")) {
    if (page == 1) { page = 0; buildTiles(); selected = categoryIndex; moveCursor(); }
  }
  return 1;
}

// ---- test-observation accessors (games/AGENTS.md rule 5) -------------------
function selectedIndex(slot) { return selected; }
function currentPage(slot) { return page; }
function tileCount(slot) { return tileSprites.length; }
function selectedLabelIsPomppija(slot) {
  if (page != 1) { return 0; }
  if (CATALOG[categoryIndex].entries[selected].label == "Pomppija") { return 1; }
  return 0;
}
