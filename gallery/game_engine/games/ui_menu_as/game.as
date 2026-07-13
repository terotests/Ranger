// ============================================================================
// ui_menu_as — an INTERPRETED (.as) EVG UI menu + rendering-technique demo.
// ============================================================================
//
// Same RGU1 UI document the compiled WASM menu builds (see wasm/as_ui_menu),
// but this file runs on Ranger's live .as interpreter (ComponentEngine + the
// AsAbiBridge @ranger/game API) — no `asc` compile, so it doubles as a simple
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
const OFF_SEL: i32 = 52;     // guest -> host: selected node id (highlight)

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
const P_PAD: i32 = 12;
const P_MARGIN: i32 = 13;
const P_RADIUS: i32 = 14;
const P_BORDER_COLOR: i32 = 15;
const P_BORDER_W: i32 = 16;
const P_FLEXDIR: i32 = 21;
const P_ALIGN: i32 = 22;
const P_TEXTALIGN: i32 = 24;

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

// screens
const SCR_MENU: i32 = 0;
const SCR_DEMO: i32 = 1;

// examples
const EX_BG: i32 = 0;
const EX_FONT_COLOR: i32 = 1;
const EX_FONT_SIZE: i32 = 2;
const EX_GRADIENT: i32 = 3;
const EX_COUNT: i32 = 4;

// ---- persistent state (module scope, survives update() calls) ----
let SCREEN: i32 = 0;
let SEL: i32 = 0;         // menu selection index 0..3
let EXAMPLE: i32 = 0;     // demo example index 0..EX_COUNT-1
let PLAYS: i32 = 0;
let REV: i32 = 0;

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
}

function exampleName(i: i32): string {
  if (i == EX_BG) return "Background color";
  if (i == EX_FONT_COLOR) return "Font color";
  if (i == EX_FONT_SIZE) return "Font size";
  return "Linear gradient";
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
  } else {
    // linear gradient (real gradient fill lands in the next slice)
    uiNode(PREVIEW, CARD, K_VIEW, 2);
    uiPropI32(P_WIDTH, 220);
    uiPropI32(P_PAD, 26);
    uiPropI32(P_RADIUS, 12);
    uiPropI32(P_MARGIN, 8);
    uiPropColorRgba(P_BG, 40, 60, 120, 255);
    label(122, PREVIEW, 0, "gradient (soon)", 200, 214, 240, 15);
  }

  label(130, CARD, 3, "< left/right >   enter: back", 143, 176, 208, 12);

  // the preview is the focused element on this screen
  abiWrite(OFF_SEL, PREVIEW);
}

function build(): void {
  uiReset();
  if (SCREEN == SCR_MENU) {
    buildMenu();
  } else {
    buildDemo();
  }
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
  let inp: i32 = abiRead(OFF_INPUT);
  let changed: i32 = 0;

  if (SCREEN == SCR_MENU) {
    if ((inp & IN_UP) != 0) {
      SEL = SEL - 1; if (SEL < 0) SEL = 3; changed = 1;
    }
    if ((inp & IN_DOWN) != 0) {
      SEL = SEL + 1; if (SEL > 3) SEL = 0; changed = 1;
    }
    if ((inp & IN_ACT) != 0) {
      if (SEL == 0) { PLAYS = PLAYS + 1; }
      if (SEL == 2) { SCREEN = SCR_DEMO; EXAMPLE = 0; }
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
      SCREEN = SCR_MENU; changed = 1;
    }
  }

  if (changed != 0) {
    REV = REV + 1;
  }
  build();
}
