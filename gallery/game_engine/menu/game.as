// ============================================================================
// Ranger Launcher - the front page authored as a normal .as engine=ui game.
// ============================================================================
// This is "just a game" that happens to live in menu/ and pick the sub-app to
// load. The host injects `gameCatalog` (one entry per game: id/title/path/
// engine/category/icon) exactly like the .tsx menu, and loads whichever game
// this menu reports back via OFF_LAUNCH (a catalog index). Being interpreted
// .as, it hot-reloads like any other game - edit this file and the menu updates.
//
// The UI is authored with a small fluent EVG builder (`ui.view(id,parent,order)
// .column().center().pad(22)`), the same readable style the WASM UI demos use,
// over the flat @ranger/game bridge.
//
// Two screens: category tiles (Games / Tests) -> the games in that category.
//   up/down/left/right   move selection
//   enter/A              open a category, or launch the selected game
//   left/back            games screen -> categories
// ============================================================================
import { abiRead, abiWrite } from "@ranger/game";
import { ui, El } from "./ui";

// shared ABI offsets (ints)
const OFF_INPUT: i32 = 20;    // host -> guest: edge mask this frame
const OFF_SEL: i32 = 52;      // guest -> host: selected node id (highlight)
const OFF_LAUNCH: i32 = 56;   // guest -> host: catalog index + 1 to launch (0 = none)

const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const IN_ACT: i32 = 16;

// category background art (host-resolvable paths; the host loads the pixels)
const ART_GAMES: string = "gallery/game_engine/menu/assets/games.png";
const ART_TESTS: string = "gallery/game_engine/menu/assets/tools.png";

const ROOT: i32 = 1;
const ROW: i32 = 50;
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

// ---- screen builders ----

// A big rounded art tile with a TTF label under it (imgId is what the host
// highlights). `parent` is the row it sits in; `on` = currently selected.
function catTile(parent: El, colId: i32, imgId: i32, lblId: i32, name: string, art: string, on: i32): void {
  let col: El = parent.box(colId).column().center().width(200).margin(12);
  let br: i32 = 120; let bg: i32 = 150; let bb: i32 = 210;
  if (on == 1) { br = 255; bg = 232; bb = 120; }
  col.box(imgId).width(176).height(176).radius(16).image(art).border(3, br, bg, bb, 255);
  col.label(lblId, name).font(20).color(236, 240, 250, 255).margin(6);
}

// A uniform menu button; `parent` is the card it lives in; `on` = selected. The
// caption is a text child (composition), so a highlighted button is just a box.
function gameButton(parent: El, id: i32, capId: i32, s: string, on: i32): void {
  let br: i32 = 120; let bg: i32 = 150; let bb: i32 = 210; let ba: i32 = 40;
  if (on == 1) { br = 255; bg = 232; bb = 120; ba = 70; }
  let b: El = parent.button(id)
    .width(280).pad(12).margin(6).radius(10)
    .border(2, br, bg, bb, 255).bg(120, 165, 230, ba).column().center();
  b.label(capId, s).font(18).color(236, 240, 250, 255).textCenter();
}

function buildCats(root: El): void {
  root.column().center().pad(24);
  root.label(10, "GAMES").font(34).color(236, 240, 250, 255);
  let row: El = root.box(ROW).row().center();
  let on0: i32 = 0; if (SEL == 0) on0 = 1;
  let on1: i32 = 0; if (SEL == 1) on1 = 1;
  catTile(row, 60, 61, 62, "Games", ART_GAMES, on0);
  catTile(row, 70, 71, 72, "Tests", ART_TESTS, on1);
  let selId: i32 = 61; if (SEL == 1) selId = 71;
  abiWrite(OFF_SEL, selId);
}

function buildGames(root: El): void {
  root.column().center().pad(18);
  let card: El = root.box(CARD).column().center().pad(16).width(340).radius(16).bg(30, 34, 52, 255);
  let cat: string = catName(CAT);
  card.label(10, cat).font(24).color(236, 240, 250, 255);
  let n: i32 = countInCat(cat);
  let k: i32 = 0;
  while (k < n) {
    let gi: i32 = nthInCat(cat, k);
    let on: i32 = 0; if (SEL == k) on = 1;
    gameButton(card, 100 + k, 300 + k, gameCatalog[gi].title, on);
    k = k + 1;
  }
  abiWrite(OFF_SEL, 100 + SEL);
}

function build(): void {
  ui.reset();
  let root: El = ui.box(ROOT);
  if (SCREEN == SCR_CATS) { buildCats(root); } else { buildGames(root); }
  ui.finish(REV);
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
