// ============================================================================
// as_ui_effects — a WASM UI "effects showcase": every button triggers a
// distinct host-run, GPU-accelerated effect.
// ============================================================================
//
// Same bridge as as_ui_menu: the guest builds an RGU1 selectable menu, the host
// navigates it and forwards the action button to rg_ui_event, and the guest
// asks the host to run an effect via env.rg_ui_effect. The host owns the
// timeline (gallery/game_engine/ui/UIAnimator.rgr), renders the effect on the
// GPU (the gfx_fx overlay in gfx_sdl.rgr), and calls rg_ui_effect_done back when
// it completes. Each menu item demonstrates one effect:
//
//   Glow                — a warm single-flash glow on the button (node target)
//   Pulse               — a green multi-beat pulse on the button (node target)
//   Screen Pulse (red)  — a red whole-screen pulse
//   Screen Pulse (blue) — a blue whole-screen pulse
//
// Build:  bash gallery/game_engine/wasm/as_ui_effects/build.sh
// Runs as the `EVG Effects Demo` app (games/ui_effects, category=Tests).
// ============================================================================

import { ui, UI_SIZE, uiPtr, EVENT_ACTIVATE } from "../../as_autopeli/assembly/ui";

// ---- host import: trigger a host-run effect (see as_ui_menu for the contract).
//   kind: 1 glow, 2 pulse | target: 0 node, 1 screen | r,g,b: tint 0..255
@external("env", "rg_ui_effect")
declare function rg_ui_effect(kind: u32, target: u32, node: u32, durMs: u32,
                              delayMs: u32, r: u32, g: u32, b: u32, tag: u32): void;

const FX_GLOW: u32 = 1;
const FX_PULSE: u32 = 2;
const TGT_NODE: u32 = 0;
const TGT_SCREEN: u32 = 1;

// node ids
const ROOT: u32 = 1;
const CARD: u32 = 2;
const TITLE: u32 = 10;
const BTN_GLOW: u32 = 20;
const BTN_PULSE: u32 = 21;
const BTN_SCR_RED: u32 = 22;
const BTN_SCR_BLUE: u32 = 23;
const STATUS: u32 = 90;

// colors 0xRRGGBBAA
const C_TITLE: u32 = 0xffffffff;
const C_ITEM: u32 = 0xd0dcf0ff;
const C_STATUS: u32 = 0x8fb0d0ff;
const C_CARD: u32 = 0x242a40ff;
const C_BORDER: u32 = 0x7896d2ff;
const C_BTN_BG: u32 = 0x78a5e62e;

const SCREEN_W: i32 = 360;
const BTN_W: i32 = 240;

let UI_REV: u32 = 0;
let FIRED: i32 = 0;     // effects triggered
let DONE: i32 = 0;      // effects the host reported complete
let LAST_ID: u32 = 0;   // last activated node id

function statusText(): string {
  return "fired: " + FIRED.toString() + "   done: " + DONE.toString();
}

function rebuild(): void {
  ui.reset();
  ui.view(ROOT, 0, 0).column().center().padding(22);
  ui.view(CARD, ROOT, 0).column().center().padding(18).width(300).background(C_CARD).radius(16);
  ui.label(TITLE, CARD, 0, "EVG Effects Demo", C_TITLE, 20);

  ui.button(BTN_GLOW, CARD, 1, "Glow", C_ITEM, 16)
    .onActivate().defaultSelected().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);
  ui.button(BTN_PULSE, CARD, 2, "Pulse", C_ITEM, 16)
    .onActivate().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);
  ui.button(BTN_SCR_RED, CARD, 3, "Screen Pulse (red)", C_ITEM, 16)
    .onActivate().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);
  ui.button(BTN_SCR_BLUE, CARD, 4, "Screen Pulse (blue)", C_ITEM, 16)
    .onActivate().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);

  ui.label(STATUS, CARD, 5, statusText(), C_STATUS, 13);
  ui.finish(UI_REV);
}

// ---- exports the host calls ------------------------------------------------
export function init(): void {
  FIRED = 0;
  DONE = 0;
  LAST_ID = 0;
  UI_REV = 0;
  rebuild();
}

// The host forwards the action button here; we ask it to run the effect this
// button demonstrates. tag = the activated node id, echoed back on completion.
export function rg_ui_event(nodeId: u32, event: u32, value: u32): void {
  if (event != EVENT_ACTIVATE) return;
  LAST_ID = nodeId;
  if (nodeId == BTN_GLOW) {
    rg_ui_effect(FX_GLOW, TGT_NODE, nodeId, 500, 0, 255, 220, 120, nodeId);
  } else if (nodeId == BTN_PULSE) {
    rg_ui_effect(FX_PULSE, TGT_NODE, nodeId, 700, 0, 120, 255, 160, nodeId);
  } else if (nodeId == BTN_SCR_RED) {
    rg_ui_effect(FX_PULSE, TGT_SCREEN, 0, 600, 0, 255, 80, 80, nodeId);
  } else if (nodeId == BTN_SCR_BLUE) {
    rg_ui_effect(FX_PULSE, TGT_SCREEN, 0, 600, 0, 120, 180, 255, nodeId);
  } else {
    return;
  }
  FIRED += 1;
  UI_REV += 1;
  rebuild();
}

// The host calls this when an effect finishes (echoing node + tag).
export function rg_ui_effect_done(nodeId: u32, tag: u32): void {
  DONE += 1;
  UI_REV += 1;
  rebuild();
}

export function rg_ui_ptr(): i32 { return <i32>uiPtr(); }
export function rg_ui_size(): i32 { return UI_SIZE; }
export function rg_ui_revision(): i32 { return <i32>UI_REV; }

// Convenience for host tests.
export function fired(): i32 { return FIRED; }
export function done(): i32 { return DONE; }
