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

import { abiRead, abiWrite } from "@ranger/game";
import { ui, El } from "./ui";
import { OFF_INPUT, OFF_TIME, OFF_SEL, OFF_RECT_X, OFF_RECT_Y, OFF_RECT_W, OFF_RECT_H, IN_UP, IN_DOWN, IN_LEFT, IN_RIGHT, IN_ACT } from "./abi";
import { P_GRAD_FROM, P_GRAD_TO, P_GRAD_DIR, P_ABS_X, P_ABS_Y, P_GLOW } from "./uiProtocol";

// node ids
const ROOT: i32 = 1;
const CARD: i32 = 2;
const BTN_NEW: i32 = 20;
const BTN_CONT: i32 = 21;
const BTN_DEMO: i32 = 22;
const BTN_QUIT: i32 = 23;
// caption text nodes (one per button; a free id range next to the buttons)
const CAP_NEW: i32 = 24;
const CAP_CONT: i32 = 25;
const CAP_DEMO: i32 = 26;
const CAP_QUIT: i32 = 27;
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
const EX_COUNT: i32 = 4;

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

// ---- small authoring helpers over the shared `ui` builder (./ui.as) ----
// Both take the container `El` and hang a child off it, so callers read top-down
// from the card they opened. A label is a text box; a button is an interactive
// box whose caption is a text child (composition, not a text-carrying button).
function label(parent: El, id: i32, s: string, r: i32, g: i32, b: i32, size: i32): void {
  parent.label(id, s).font(size).color(r, g, b, 255);
}
// A uniform menu button. The host draws the glow highlight, but we also brighten
// the border so selection reads on a static screenshot. The animated P_GLOW is
// this demo's own protocol property; it rides the fluent chain via the El escape
// hatch (.propI32) and MUST be set on the button before its caption child opens.
function button(parent: El, id: i32, capId: i32, s: string, cr: i32, cg: i32, cb: i32, br: i32, bg: i32, bb: i32): void {
  let b: El = parent.button(id)
    .width(180).pad(10).margin(6).radius(9)
    .border(2, br, bg, bb, 255).bg(120, 165, 230, 46).column().center();
  let gi: i32 = ANIMATOR.glowFor(id);
  if (gi > 0) {
    b.propI32(P_GLOW, gi);
  }
  b.label(capId, s).font(16).color(cr, cg, cb, 255).textCenter();
}

function exampleName(i: i32): string {
  if (i == EX_BG) return "Background color";
  if (i == EX_FONT_COLOR) return "Font color";
  if (i == EX_FONT_SIZE) return "Font size";
  return "Linear gradient";
}

// ---- document builders ----
function buildMenu(root: El): void {
  root.column().center().pad(22);
  let card: El = root.box(CARD).column().center().pad(18).width(280).bg(36, 42, 64, 255).radius(16);

  label(card, 10, "AS UI - Main Menu", 255, 255, 255, 20);

  button(card, BTN_NEW, CAP_NEW, "New Game", 208, 220, 240, 120, 150, 210);
  button(card, BTN_CONT, CAP_CONT, "Continue", 208, 220, 240, 120, 150, 210);
  button(card, BTN_DEMO, CAP_DEMO, "Demo", 208, 220, 240, 120, 150, 210);
  button(card, BTN_QUIT, CAP_QUIT, "Quit", 255, 106, 106, 200, 110, 110);

  label(card, 90, "plays: " + PLAYS.toString(), 143, 176, 208, 13);

  // report the selected button id to the host for the glow highlight
  let selId: i32 = BTN_NEW;
  if (SEL == 1) selId = BTN_CONT;
  if (SEL == 2) selId = BTN_DEMO;
  if (SEL == 3) selId = BTN_QUIT;
  abiWrite(OFF_SEL, selId);
}

function buildDemo(root: El): void {
  root.column().center().pad(18);
  let card: El = root.box(CARD).column().center().pad(18).width(300).bg(30, 34, 52, 255).radius(16);

  label(card, 100, "EVG Demo", 255, 255, 255, 20);
  label(card, 101, (EXAMPLE + 1).toString() + "/" + EX_COUNT.toString() + "  " + exampleName(EXAMPLE), 143, 176, 208, 13);

  // the preview element demonstrates the current technique
  if (EXAMPLE == EX_BG) {
    // background color: a vivid rounded panel
    let preview: El = card.box(PREVIEW).width(220).pad(26).radius(12).margin(8).bg(232, 140, 60, 255);
    label(preview, 122, "background", 30, 22, 12, 15);
  } else if (EXAMPLE == EX_FONT_COLOR) {
    // font color: text in a vivid colour on a neutral panel
    let preview: El = card.box(PREVIEW).width(220).pad(26).radius(12).margin(8).bg(22, 26, 40, 255);
    label(preview, 122, "Ranger EVG", 80, 220, 130, 22);
  } else if (EXAMPLE == EX_FONT_SIZE) {
    // font size: large glyphs
    let preview: El = card.box(PREVIEW).width(220).pad(18).radius(12).margin(8).bg(22, 26, 40, 255);
    label(preview, 122, "Big 42", 220, 224, 236, 42);
  } else {
    // linear gradient: a real 2-stop vertical gradient fill in the host EVG
    // renderer. P_GRAD_* are this demo's own protocol props, so they ride the
    // fluent chain through the El escape hatches (.propColor/.propEnum).
    let preview: El = card.box(PREVIEW).width(220).pad(26).radius(12).margin(8)
      .propColor(P_GRAD_FROM, 90, 130, 245, 255)   // blue
      .propColor(P_GRAD_TO, 210, 90, 200, 255)     // magenta
      .propEnum(P_GRAD_DIR, 0);                     // vertical
    label(preview, 122, "linear gradient", 255, 255, 255, 15);
  }

  label(card, 130, "< left/right >   enter: back", 143, 176, 208, 12);

  // the preview is the focused element on this screen
  abiWrite(OFF_SEL, PREVIEW);
}

// Coord-reported effect: read the selected node's laid-out rect (the host wrote
// it last frame) and drop a small absolute accent at its top-right corner. The
// guest never sees the layout, only the reported rect.
function emitEffect(root: El): void {
  let rw: i32 = abiRead(OFF_RECT_W);
  if (rw > 0) {
    let rx: i32 = abiRead(OFF_RECT_X);
    let ry: i32 = abiRead(OFF_RECT_Y);
    let ex: i32 = rx + rw - 7;
    let ey: i32 = ry - 7;
    // opened last among ROOT's children -> drawn on top; P_ABS_* place it at the
    // reported screen coords
    root.box(EFFECT).width(14).height(14).radius(7).bg(255, 230, 120, 235)
      .propI32(P_ABS_X, ex).propI32(P_ABS_Y, ey);
  }
}

function build(): void {
  ANIMATOR.tick();          // advance effects once per frame (time-driven)
  ui.reset();
  let root: El = ui.box(ROOT);
  if (SCREEN == SCR_MENU) {
    buildMenu(root);
  } else {
    buildDemo(root);
  }
  emitEffect(root);
  ui.finish(REV);
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
