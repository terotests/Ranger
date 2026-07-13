// ============================================================================
// ui_menu_as - an INTERPRETED (.as) EVG UI menu + rendering-technique demo.
// ============================================================================
//
// Same RGU1 UI document the compiled WASM menu builds (see wasm/as_ui_menu),
// but this file runs on Ranger's live .as interpreter (ComponentEngine + the
// AsAbiBridge @ranger/game API) - no `asc` compile, so it doubles as a simple
// interpreter test of the whole UI path.
//
// Unlike the WASM menu (host drives D-pad navigation), this guest reads the
// input edge-mask straight from the shared ABI and drives its OWN selection,
// screen and example state, then rebuilds the document. It writes the currently
// selected node id back to the ABI so the host can draw its glow highlight.
//
// Contract with the host (shared RGW1 ABI, ints via abiRead/abiWrite):
//    abiRead(OFF_INPUT)   edge mask: UP=1 DOWN=2 LEFT=4 RIGHT=8 ACT=16
//    abiWrite(OFF_SEL,id) guest -> host: node id to highlight (0 = none)
//
// Screens:
//    MENU  up/down move selection, action activates ("Demo" opens the demo)
//    DEMO  left/right cycle the EVG technique, action returns to the menu
// ============================================================================

import { abiRead, abiWrite, uiReset, uiNode, uiPropI32, uiPropEnum, uiPropStr, uiPropColorRgba, uiFinish } from "@ranger/game";

// ---- shared ABI offsets ----
const OFF_INPUT: i32 = 20;   // host -> guest: edge mask this frame
const OFF_TIME: i32 = 16;    // host -> guest: monotonic clock (ms) for effects
const OFF_SEL: i32 = 52;     // guest -> host: selected node id (highlight)
// host -> guest: laid-out rect (page px) of the selected node, so we can place
// an absolute overlay effect at real screen coordinates.
const OFF_RECT_X: i32 = 200;
const OFF_RECT_Y: i32 = 204;
const OFF_RECT_W: i32 = 208;
const OFF_RECT_H: i32 = 212;

// input edge bits
const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const IN_ACT: i32 = 16;

// RGU1 node kinds
const K_VIEW: i32 = 1;
const K_TEXT: i32 = 2;
const K_BUTTON: i32 = 5;

// RGU1 property keys
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
const P_GRAD_FROM: i32 = 50;   // linear-gradient start colour
const P_GRAD_TO: i32 = 51;     // linear-gradient end colour
const P_GRAD_DIR: i32 = 52;    // 0 vertical, 1 horizontal
const P_ABS_X: i32 = 53;       // absolute page-x
const P_ABS_Y: i32 = 54;       // absolute page-y
const P_GLOW: i32 = 55;        // animated glow strength 0..1000
const P_BG_IMAGE: i32 = 56;    // background image path (clipped to rounded box)

// enum values
const DIR_COLUMN: i32 = 1;
const ALIGN_CENTER: i32 = 1;
const TEXTALIGN_CENTER: i32 = 1;

// node ids
const ROOT: i32 = 1;
const CARD: i32 = 2;
const BTN_NEW: i32 = 20;
const BTN_CONT: i32 = 21;
const BTN_DEMO: i32 = 22;
const BTN_QUIT: i32 = 23;
const PREVIEW: i32 = 40;
const EFFECT: i32 = 200;   // coord-reported absolute overlay accent

// screens
const SCR_MENU: i32 = 0;
const SCR_DEMO: i32 = 1;

// examples
const EX_BG: i32 = 0;
const EX_FONT_COLOR: i32 = 1;
const EX_FONT_SIZE: i32 = 2;
const EX_GRADIENT: i32 = 3;
const EX_BGIMAGE: i32 = 4;
const EX_COUNT: i32 = 5;

// A background image the guest can name by path; the host decodes it and clips
// it to the rounded box. The guest is sandboxed and never touches the pixels.
const BG_IMAGE_PATH: string = "gallery/game_engine/games/invaders/assets/invaders_bg.png";

// ---- persistent state (module scope, survives update() calls) ----
let SCREEN: i32 = 0;
let SEL: i32 = 0;         // menu selection index 0..3
let EXAMPLE: i32 = 0;     // demo example index 0..EX_COUNT-1
let PLAYS: i32 = 0;
let REV: i32 = 0;

function menuSelId(): i32 {
  if (SEL == 1) return BTN_CONT;
  if (SEL == 2) return BTN_DEMO;
  if (SEL == 3) return BTN_QUIT;
  return BTN_NEW;
}

// ---- fluent effect/animation system, authored in the guest (.as classes) ----
// A Pixi-style chaining API:
//     ANIMATOR.animation().glow(id).duration(0.42).delay(0.0).after(DONE.bump).start();
// Anim owns one glow: it samples the host clock (abiRead(OFF_TIME)) to produce a
// 0->1000->0 flash and fires its `after` callback once on completion. The host
// renders the GLOW prop; the timing + chaining + callback all live here.

class Counter {
  n: i32 = 0;
  bump(): void { this.n = this.n + 1; }
}

class Anim {
  id: i32 = 0;
  durMs: f64 = 420.0;
  delayMs: f64 = 0.0;
  startMs: i32 = 0;
  active: i32 = 0;
  fired: i32 = 0;
  hasCb: i32 = 0;
  cb: () => void = () => {};

  glow(nodeId: i32): Anim { this.id = nodeId; return this; }
  duration(sec: f64): Anim { this.durMs = sec * 1000.0; return this; }
  delay(sec: f64): Anim { this.delayMs = sec * 1000.0; return this; }
  after(f: () => void): Anim { this.cb = f; this.hasCb = 1; return this; }
  start(): Anim { this.startMs = abiRead(OFF_TIME); this.active = 1; this.fired = 0; return this; }

  // Advance the flash once per frame from the host clock, storing the current
  // 0..1000 strength; fires `after` once and deactivates when it completes. This
  // is time-driven, NOT render-driven, so the callback fires even if the target
  // element is not currently on screen.
  cur: i32 = 0;
  tick(): void {
    if (this.active == 0) { this.cur = 0; return; }
    let now: i32 = abiRead(OFF_TIME);
    let el: f64 = now - this.startMs - this.delayMs;
    if (el < 0.0) { this.cur = 0; return; }
    if (el >= this.durMs) {
      this.active = 0;
      this.cur = 0;
      if (this.hasCb == 1) { if (this.fired == 0) { this.fired = 1; this.cb(); } }
      return;
    }
    let p: f64 = (el * 1000.0) / this.durMs;   // 0..1000
    if (p < 500.0) { this.cur = p * 2; } else { this.cur = (1000.0 - p) * 2; }
  }
  intensityAt(nodeId: i32): i32 {
    if (this.id != nodeId) return 0;
    return this.cur;
  }
}

class Animator {
  cur: Anim = new Anim();
  has: i32 = 0;
  animation(): Anim { this.cur = new Anim(); this.has = 1; return this.cur; }
  // advance the active animation one frame (call once per frame)
  tick(): void { if (this.has == 1) { this.cur.tick(); } }
  // glow strength for a node id (0 if it is not the animating element)
  glowFor(nodeId: i32): i32 {
    if (this.has == 0) return 0;
    return this.cur.intensityAt(nodeId);
  }
}

// Deferred screen transition: an animation's `after` callback records the screen
// to switch to; update() applies it on the next frame. This is how we "react only
// after the effect ran" — the menu->demo switch waits for the glow to finish.
class Nav {
  target: i32 = 0;
  has: i32 = 0;
  toDemo(): void { this.target = SCR_DEMO; this.has = 1; }
  toMenu(): void { this.target = SCR_MENU; this.has = 1; }
}

let ANIMATOR: Animator = new Animator();
let DONE: Counter = new Counter();
let NAV: Nav = new Nav();

// ---- small RGU1 authoring helpers (props apply to the last uiNode) ----
function view(id: i32, parent: i32, order: i32): void {
  uiNode(id, parent, K_VIEW, order);
}
function column(): void {
  uiPropEnum(P_FLEXDIR, DIR_COLUMN);
  uiPropEnum(P_ALIGN, ALIGN_CENTER);
}
function label(id: i32, parent: i32, order: i32, s: string, r: i32, g: i32, b: i32, size: i32): void {
  uiNode(id, parent, K_TEXT, order);
  uiPropStr(P_TEXT, s);
  uiPropI32(P_FONT, size);
  uiPropColorRgba(P_COLOR, r, g, b, 255);
}
// A uniform menu button; `on` = currently selected (host draws the glow, but we
// also brighten the border so it reads on a static screenshot).
function button(id: i32, order: i32, s: string, cr: i32, cg: i32, cb: i32, br: i32, bg: i32, bb: i32): void {
  uiNode(id, CARD, K_BUTTON, order);
  uiPropStr(P_TEXT, s);
  uiPropI32(P_FONT, 16);
  uiPropColorRgba(P_COLOR, cr, cg, cb, 255);
  uiPropI32(P_WIDTH, 180);
  uiPropI32(P_PAD, 10);
  uiPropI32(P_MARGIN, 6);
  uiPropI32(P_RADIUS, 9);
  uiPropI32(P_BORDER_W, 2);
  uiPropColorRgba(P_BORDER_COLOR, br, bg, bb, 255);
  uiPropColorRgba(P_BG, 120, 165, 230, 46);
  uiPropEnum(P_TEXTALIGN, TEXTALIGN_CENTER);
  let gi: i32 = ANIMATOR.glowFor(id);
  if (gi > 0) {
    uiPropI32(P_GLOW, gi);
  }
}

function exampleName(i: i32): string {
  if (i == EX_BG) return "Background color";
  if (i == EX_FONT_COLOR) return "Font color";
  if (i == EX_FONT_SIZE) return "Font size";
  if (i == EX_GRADIENT) return "Linear gradient";
  return "Background image";
}

// ---- document builders ----
function buildMenu(): void {
  view(ROOT, 0, 0); column(); uiPropI32(P_PAD, 22);
  view(CARD, ROOT, 0); column(); uiPropI32(P_PAD, 18); uiPropI32(P_WIDTH, 280);
  uiPropColorRgba(P_BG, 36, 42, 64, 255); uiPropI32(P_RADIUS, 16);

  label(10, CARD, 0, "AS UI - Main Menu", 255, 255, 255, 20);

  button(BTN_NEW, 1, "New Game", 208, 220, 240, 120, 150, 210);
  button(BTN_CONT, 2, "Continue", 208, 220, 240, 120, 150, 210);
  button(BTN_DEMO, 3, "Demo", 208, 220, 240, 120, 150, 210);
  button(BTN_QUIT, 4, "Quit", 255, 106, 106, 200, 110, 110);

  label(90, CARD, 5, "plays: " + PLAYS.toString(), 143, 176, 208, 13);

  // report the selected button id to the host for the glow highlight
  let selId: i32 = BTN_NEW;
  if (SEL == 1) selId = BTN_CONT;
  if (SEL == 2) selId = BTN_DEMO;
  if (SEL == 3) selId = BTN_QUIT;
  abiWrite(OFF_SEL, selId);
}

function buildDemo(): void {
  view(ROOT, 0, 0); column(); uiPropI32(P_PAD, 18);
  view(CARD, ROOT, 0); column(); uiPropI32(P_PAD, 18); uiPropI32(P_WIDTH, 300);
  uiPropColorRgba(P_BG, 30, 34, 52, 255); uiPropI32(P_RADIUS, 16);

  label(100, CARD, 0, "EVG Demo", 255, 255, 255, 20);
  label(101, CARD, 1, (EXAMPLE + 1).toString() + "/" + EX_COUNT.toString() + "  " + exampleName(EXAMPLE), 143, 176, 208, 13);

  // the preview element demonstrates the current technique
  if (EXAMPLE == EX_BG) {
    // background color: a vivid rounded panel
    uiNode(PREVIEW, CARD, K_VIEW, 2);
    uiPropI32(P_WIDTH, 220);
    uiPropI32(P_PAD, 26);
    uiPropI32(P_RADIUS, 12);
    uiPropI32(P_MARGIN, 8);
    uiPropColorRgba(P_BG, 232, 140, 60, 255);
    label(122, PREVIEW, 0, "background", 30, 22, 12, 15);
  } else if (EXAMPLE == EX_FONT_COLOR) {
    // font color: text in a vivid colour on a neutral panel
    uiNode(PREVIEW, CARD, K_VIEW, 2);
    uiPropI32(P_WIDTH, 220);
    uiPropI32(P_PAD, 26);
    uiPropI32(P_RADIUS, 12);
    uiPropI32(P_MARGIN, 8);
    uiPropColorRgba(P_BG, 22, 26, 40, 255);
    label(122, PREVIEW, 0, "Ranger EVG", 80, 220, 130, 22);
  } else if (EXAMPLE == EX_FONT_SIZE) {
    // font size: large glyphs
    uiNode(PREVIEW, CARD, K_VIEW, 2);
    uiPropI32(P_WIDTH, 220);
    uiPropI32(P_PAD, 18);
    uiPropI32(P_RADIUS, 12);
    uiPropI32(P_MARGIN, 8);
    uiPropColorRgba(P_BG, 22, 26, 40, 255);
    label(122, PREVIEW, 0, "Big 42", 220, 224, 236, 42);
  } else if (EXAMPLE == EX_GRADIENT) {
    // linear gradient: a real 2-stop vertical gradient fill in the host EVG renderer
    uiNode(PREVIEW, CARD, K_VIEW, 2);
    uiPropI32(P_WIDTH, 220);
    uiPropI32(P_PAD, 26);
    uiPropI32(P_RADIUS, 12);
    uiPropI32(P_MARGIN, 8);
    uiPropColorRgba(P_GRAD_FROM, 90, 130, 245, 255);   // blue
    uiPropColorRgba(P_GRAD_TO, 210, 90, 200, 255);     // magenta
    uiPropEnum(P_GRAD_DIR, 0);                          // vertical
    label(122, PREVIEW, 0, "linear gradient", 255, 255, 255, 15);
  } else {
    // background image: name a PNG by path; the host decodes it and clips it to
    // the rounded box. This is the .as guest driving a real EVG image fill.
    uiNode(PREVIEW, CARD, K_VIEW, 2);
    uiPropI32(P_WIDTH, 220);
    uiPropI32(P_HEIGHT, 150);
    uiPropI32(P_RADIUS, 14);
    uiPropI32(P_MARGIN, 8);
    uiPropStr(P_BG_IMAGE, BG_IMAGE_PATH);
    uiPropI32(P_BORDER_W, 2);
    uiPropColorRgba(P_BORDER_COLOR, 120, 150, 210, 255);
  }

  label(130, CARD, 3, "< left/right >   enter: back", 143, 176, 208, 12);

  // the preview is the focused element on this screen
  abiWrite(OFF_SEL, PREVIEW);
}

// Coord-reported effect: read the selected node's laid-out rect (the host wrote
// it last frame) and drop a small absolute accent at its top-right corner. The
// guest never sees the layout, only the reported rect.
function emitEffect(): void {
  let rw: i32 = abiRead(OFF_RECT_W);
  if (rw > 0) {
    let rx: i32 = abiRead(OFF_RECT_X);
    let ry: i32 = abiRead(OFF_RECT_Y);
    let ex: i32 = rx + rw - 7;
    let ey: i32 = ry - 7;
    uiNode(EFFECT, ROOT, K_VIEW, 999);   // high order -> drawn on top
    uiPropI32(P_WIDTH, 14);
    uiPropI32(P_HEIGHT, 14);
    uiPropI32(P_RADIUS, 7);
    uiPropColorRgba(P_BG, 255, 230, 120, 235);
    uiPropI32(P_ABS_X, ex);
    uiPropI32(P_ABS_Y, ey);
  }
}

function build(): void {
  ANIMATOR.tick();          // advance effects once per frame (time-driven)
  uiReset();
  if (SCREEN == SCR_MENU) {
    buildMenu();
  } else {
    buildDemo();
  }
  emitEffect();
  uiFinish(REV);
}

// ---- exports the host calls ----
export function init(): void {
  SCREEN = SCR_MENU;
  SEL = 0;
  EXAMPLE = 0;
  PLAYS = 0;
  REV = 0;
  build();
}

export function update(): void {
  let changed: i32 = 0;

  // apply a deferred transition that an animation's `after` callback requested
  // once its effect finished (menu<->demo switch happens AFTER the glow).
  if (NAV.has == 1) {
    SCREEN = NAV.target;
    if (SCREEN == SCR_DEMO) { EXAMPLE = 0; }
    NAV.has = 0;
    changed = 1;
  }

  let inp: i32 = abiRead(OFF_INPUT);

  if (SCREEN == SCR_MENU) {
    if ((inp & IN_UP) != 0) {
      SEL = SEL - 1; if (SEL < 0) SEL = 3; changed = 1;
    }
    if ((inp & IN_DOWN) != 0) {
      SEL = SEL + 1; if (SEL > 3) SEL = 0; changed = 1;
    }
    if ((inp & IN_ACT) != 0) {
      if (SEL == 0) { PLAYS = PLAYS + 1; }
      if (SEL == 2) {
        // Demo: flash the button, then switch screens when the effect completes
        ANIMATOR.animation().glow(menuSelId()).duration(0.42).delay(0.0).after(NAV.toDemo).start();
      } else {
        // other buttons: just flash
        ANIMATOR.animation().glow(menuSelId()).duration(0.42).delay(0.0).after(DONE.bump).start();
      }
      changed = 1;
    }
  } else {
    if ((inp & IN_LEFT) != 0) {
      EXAMPLE = EXAMPLE - 1; if (EXAMPLE < 0) EXAMPLE = EX_COUNT - 1; changed = 1;
    }
    if ((inp & IN_RIGHT) != 0) {
      EXAMPLE = EXAMPLE + 1; if (EXAMPLE >= EX_COUNT) EXAMPLE = 0; changed = 1;
    }
    if ((inp & IN_ACT) != 0) {
      // flash the preview, then return to the menu when the effect completes
      ANIMATOR.animation().glow(PREVIEW).duration(0.42).delay(0.0).after(NAV.toMenu).start();
      changed = 1;
    }
  }

  if (changed != 0) {
    REV = REV + 1;
  }
  build();
}
