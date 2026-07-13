// ============================================================================
// Ranger Launcher - the front page authored as a normal .as engine=ui game.
// ============================================================================
// This is "just a game" that happens to live in menu/ and pick the sub-app to
// load. The host injects `gameCatalog` (one entry per game: id/title/path/
// engine/category/icon) exactly like the .tsx menu, and loads whichever game
// this menu reports back via OFF_LAUNCH (a catalog index). Being interpreted
// .as, it hot-reloads like any other game - edit this file and the menu updates.
//
// Two screens: category tiles (Games / Tests) -> the games in that category.
//   up/down     move selection
//   enter/A     open a category, or launch the selected game
//   left/back   games screen -> categories
// ============================================================================
import { abiRead, abiWrite, uiReset, uiNode, uiPropI32, uiPropEnum, uiPropStr, uiPropColorRgba, uiFinish } from "@ranger/game";

// shared ABI offsets (ints)
const OFF_INPUT: i32 = 20;    // host -> guest: edge mask this frame
const OFF_SEL: i32 = 52;      // guest -> host: selected node id (highlight)
const OFF_LAUNCH: i32 = 56;   // guest -> host: catalog index + 1 to launch (0 = none)

const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const IN_ACT: i32 = 16;

// RGU1 node kinds + property keys
const K_VIEW: i32 = 1;
const K_TEXT: i32 = 2;
const K_BUTTON: i32 = 5;
const P_TEXT: i32 = 1;
const P_BG: i32 = 2;
const P_COLOR: i32 = 3;
const P_FONT: i32 = 4;
const P_WIDTH: i32 = 10;
const P_HEIGHT: i32 = 11;
const P_PAD: i32 = 12;
const P_MARGIN: i32 = 13;
const P_RADIUS: i32 = 14;
const P_BORDER_COLOR: i32 = 15;
const P_BORDER_W: i32 = 16;
const P_FLEXDIR: i32 = 21;
const P_ALIGN: i32 = 22;
const P_TEXTALIGN: i32 = 24;
const P_BG_IMAGE: i32 = 56;   // background image path, clipped to the rounded box
const DIR_ROW: i32 = 0;
const DIR_COLUMN: i32 = 1;
const ALIGN_CENTER: i32 = 1;
const TEXTALIGN_CENTER: i32 = 1;

// category background art (host-resolvable paths; the host loads the pixels)
const ART_GAMES: string = "gallery/game_engine/menu/assets/games.png";
const ART_TESTS: string = "gallery/game_engine/menu/assets/tools.png";

const ROOT: i32 = 1;
const CARD: i32 = 2;
const SCR_CATS: i32 = 0;
const SCR_GAMES: i32 = 1;

// persistent state (module scope)
let SCREEN: i32 = 0;
let SEL: i32 = 0;      // selection index on the current screen
let CAT: i32 = 0;      // 0 = Games, 1 = Tests
let REV: i32 = 0;

function catName(i: i32): string {
  if (i == 1) return "Tests";
  return "Games";
}

// number of catalog entries in category `cat`
function countInCat(cat: string): i32 {
  let n: i32 = 0;
  let i: i32 = 0;
  while (i < gameCatalog.length) {
    if (gameCatalog[i].category == cat) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

// global catalog index of the k-th entry in category `cat` (-1 if none)
function nthInCat(cat: string, k: i32): i32 {
  let seen: i32 = 0;
  let i: i32 = 0;
  while (i < gameCatalog.length) {
    if (gameCatalog[i].category == cat) {
      if (seen == k) { return i; }
      seen = seen + 1;
    }
    i = i + 1;
  }
  return -1;
}

// ---- RGU1 authoring helpers ----
function column(): void {
  uiPropEnum(P_FLEXDIR, DIR_COLUMN);
  uiPropEnum(P_ALIGN, ALIGN_CENTER);
}
function label(id: i32, parent: i32, order: i32, s: string, size: i32): void {
  uiNode(id, parent, K_TEXT, order);
  uiPropStr(P_TEXT, s);
  uiPropI32(P_FONT, size);
  uiPropColorRgba(P_COLOR, 236, 240, 250, 255);
}
function button(id: i32, order: i32, s: string, on: i32): void {
  uiNode(id, CARD, K_BUTTON, order);
  uiPropStr(P_TEXT, s);
  uiPropI32(P_FONT, 18);
  uiPropColorRgba(P_COLOR, 236, 240, 250, 255);
  uiPropI32(P_WIDTH, 280);
  uiPropI32(P_PAD, 12);
  uiPropI32(P_MARGIN, 6);
  uiPropI32(P_RADIUS, 10);
  uiPropI32(P_BORDER_W, 2);
  if (on == 1) {
    uiPropColorRgba(P_BORDER_COLOR, 255, 232, 120, 255);
    uiPropColorRgba(P_BG, 120, 165, 230, 70);
  } else {
    uiPropColorRgba(P_BORDER_COLOR, 120, 150, 210, 255);
    uiPropColorRgba(P_BG, 120, 165, 230, 40);
  }
  uiPropEnum(P_TEXTALIGN, TEXTALIGN_CENTER);
}

// A big rounded image tile with a TTF label under it. colId is a column holding
// the image (imgId) and the label (lblId); the host highlights imgId.
function catTile(colId: i32, imgId: i32, lblId: i32, order: i32, name: string, art: string, on: i32): void {
  uiNode(colId, 50, K_VIEW, order);
  uiPropEnum(P_FLEXDIR, DIR_COLUMN);
  uiPropEnum(P_ALIGN, ALIGN_CENTER);
  uiPropI32(P_WIDTH, 200);
  uiPropI32(P_MARGIN, 12);
  // image square (background art clipped to the rounded box)
  uiNode(imgId, colId, K_VIEW, 0);
  uiPropI32(P_WIDTH, 176);
  uiPropI32(P_HEIGHT, 176);
  uiPropI32(P_RADIUS, 16);
  uiPropStr(P_BG_IMAGE, art);
  uiPropI32(P_BORDER_W, 3);
  if (on == 1) {
    uiPropColorRgba(P_BORDER_COLOR, 255, 232, 120, 255);
  } else {
    uiPropColorRgba(P_BORDER_COLOR, 120, 150, 210, 255);
  }
  // label under it
  uiNode(lblId, colId, K_TEXT, 1);
  uiPropStr(P_TEXT, name);
  uiPropI32(P_FONT, 20);
  uiPropColorRgba(P_COLOR, 236, 240, 250, 255);
  uiPropI32(P_MARGIN, 6);
}

function buildCats(): void {
  uiNode(ROOT, 0, K_VIEW, 0); column(); uiPropI32(P_PAD, 24);
  label(10, ROOT, 0, "GAMES", 34);
  // a row of two big art tiles
  uiNode(50, ROOT, K_VIEW, 1);
  uiPropEnum(P_FLEXDIR, DIR_ROW);
  uiPropEnum(P_ALIGN, ALIGN_CENTER);
  let on0: i32 = 0; if (SEL == 0) on0 = 1;
  let on1: i32 = 0; if (SEL == 1) on1 = 1;
  catTile(60, 61, 62, 0, "Games", ART_GAMES, on0);
  catTile(70, 71, 72, 1, "Tests", ART_TESTS, on1);
  let selId: i32 = 61; if (SEL == 1) selId = 71;
  abiWrite(OFF_SEL, selId);
}

function buildGames(): void {
  uiNode(ROOT, 0, K_VIEW, 0); column(); uiPropI32(P_PAD, 18);
  uiNode(CARD, ROOT, K_VIEW, 0); column(); uiPropI32(P_PAD, 16); uiPropI32(P_WIDTH, 340);
  uiPropColorRgba(P_BG, 30, 34, 52, 255); uiPropI32(P_RADIUS, 16);
  let cat: string = catName(CAT);
  label(10, CARD, 0, cat, 24);
  let n: i32 = countInCat(cat);
  let k: i32 = 0;
  while (k < n) {
    let gi: i32 = nthInCat(cat, k);
    let on: i32 = 0; if (SEL == k) on = 1;
    button(100 + k, k + 1, gameCatalog[gi].title, on);
    k = k + 1;
  }
  abiWrite(OFF_SEL, 100 + SEL);
}

function build(): void {
  uiReset();
  if (SCREEN == SCR_CATS) { buildCats(); } else { buildGames(); }
  uiFinish(REV);
}

// ---- exports the host calls ----
export function init(): void {
  SCREEN = SCR_CATS;
  SEL = 0;
  CAT = 0;
  REV = 0;
  abiWrite(OFF_LAUNCH, 0);
  build();
}

export function update(): void {
  let changed: i32 = 0;
  let inp: i32 = abiRead(OFF_INPUT);
  abiWrite(OFF_LAUNCH, 0);   // clear each frame; set only when a game is activated

  if (SCREEN == SCR_CATS) {
    let count: i32 = 2;
    // the two category tiles sit side by side: left/right (or up/down) move
    if (((inp & IN_UP) != 0) || ((inp & IN_LEFT) != 0)) { SEL = SEL - 1; if (SEL < 0) SEL = count - 1; changed = 1; }
    if (((inp & IN_DOWN) != 0) || ((inp & IN_RIGHT) != 0)) { SEL = SEL + 1; if (SEL >= count) SEL = 0; changed = 1; }
    if ((inp & IN_ACT) != 0) {
      CAT = SEL;
      SCREEN = SCR_GAMES;
      SEL = 0;
      changed = 1;
    }
  } else {
    let cat: string = catName(CAT);
    let count: i32 = countInCat(cat);
    if (count < 1) count = 1;
    if ((inp & IN_UP) != 0) { SEL = SEL - 1; if (SEL < 0) SEL = count - 1; changed = 1; }
    if ((inp & IN_DOWN) != 0) { SEL = SEL + 1; if (SEL >= count) SEL = 0; changed = 1; }
    if ((inp & IN_LEFT) != 0) { SCREEN = SCR_CATS; SEL = CAT; changed = 1; }
    if ((inp & IN_ACT) != 0) {
      let gi: i32 = nthInCat(cat, SEL);
      if (gi >= 0) {
        abiWrite(OFF_LAUNCH, gi + 1);   // host loads gameCatalog[gi]
      }
      changed = 1;
    }
  }

  if (changed != 0) { REV = REV + 1; }
  build();
}
