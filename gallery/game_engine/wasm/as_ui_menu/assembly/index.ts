// ============================================================================
// as_ui_menu — an AssemblyScript "WASM text example" with a SELECTABLE menu.
// ============================================================================
//
// A minimal WASM guest that builds a text menu the host can navigate with the
// gamepad/keyboard D-pad (no pointer) and highlight, and that reacts to the
// action button. It reuses the shared RGU1 builder from as_autopeli/assembly/
// ui.ts — including the interactivity helpers added there:
//
//     ui.button(id, parent, order, "New Game", color, size)
//       .onActivate()        // selectable + subscribes to the ACTIVATE event
//       .defaultSelected();  // host highlights this one first
//
// Host flow (see gallery/game_engine/ui/WasmUiSelect.rgr):
//   1. host reads this document, lays it out, tracks a selection cursor over the
//      nodes tagged selectable, and draws a highlight border on the selected one
//   2. D-pad up/down moves the cursor (spatially nearest selectable node)
//   3. action button -> host calls rg_ui_event(selectedId, EVENT_ACTIVATE, 0)
//   4. we react (bump a counter), bump the revision, and rebuild — the next
//      frame's document reflects the change ("plays: N").
//
// Build:  bash gallery/game_engine/wasm/as_ui_menu/build.sh
// (produces build/logic.wasm; the host loads it via wasm_call_i32 on native).
// ============================================================================

import { ui, UI_SIZE, uiPtr, EVENT_ACTIVATE } from "../../as_autopeli/assembly/ui";

// ---- host imports (module "env") ----
// The guest triggers a host-run, GPU-accelerated effect; the host owns the
// timeline (see gallery/game_engine/ui/UIAnimator.rgr), renders it on the GPU
// (gfx_fx overlay in gfx_sdl.rgr), and calls rg_ui_effect_done back when it
// finishes. This is the WASM-side equivalent of the host-code fluent call
//   ANIMATOR.animation().glow(id).duration(..).delay(..).after(cb).start().
//   kind    : 1 = glow (single flash), 2 = pulse (repeated beats)
//   target  : 0 = a UI node (node id), 1 = the whole screen
//   node    : target RGU1 node id (target == node)
//   durMs   : effect duration, ms
//   delayMs : delay before it starts, ms
//   r,g,b   : effect tint, 0..255
//   tag     : opaque value echoed back to rg_ui_effect_done (which effect fired)
@external("env", "rg_ui_effect")
declare function rg_ui_effect(kind: u32, target: u32, node: u32, durMs: u32,
                              delayMs: u32, r: u32, g: u32, b: u32, tag: u32): void;

const FX_GLOW: u32 = 1;
const FX_PULSE: u32 = 2;
const TGT_NODE: u32 = 0;
const TGT_SCREEN: u32 = 1;

// tiny guest-side helpers over the one general import
function glowNode(node: u32, durMs: u32, delayMs: u32, r: u32, g: u32, b: u32, tag: u32): void {
  rg_ui_effect(FX_GLOW, TGT_NODE, node, durMs, delayMs, r, g, b, tag);
}
function pulseScreen(durMs: u32, delayMs: u32, r: u32, g: u32, b: u32, tag: u32): void {
  rg_ui_effect(FX_PULSE, TGT_SCREEN, 0, durMs, delayMs, r, g, b, tag);
}

// effect tags — which follow-up the completion callback should run
const TAG_FLASH: u32 = 0;    // a plain acknowledging flash, no follow-up
const TAG_TO_DEMO: u32 = 1;  // flash, then "navigate" once the effect completes

// node ids
const ROOT: u32 = 1;
const CARD: u32 = 2;
const TITLE: u32 = 10;
const BTN_NEW: u32 = 20;
const BTN_CONT: u32 = 21;
const BTN_OPTS: u32 = 22;
const BTN_QUIT: u32 = 23;
const STATUS: u32 = 90;

// colors 0xRRGGBBAA
const C_TITLE: u32 = 0xffffffff;
const C_ITEM: u32 = 0xd0dcf0ff;
const C_STATUS: u32 = 0x8fb0d0ff;
const C_QUIT: u32 = 0xff6a6aff;
const C_CARD: u32 = 0x242a40ff;      // 36,42,64
const C_BORDER: u32 = 0x7896d2ff;    // 120,150,210
const C_BORDER_QUIT: u32 = 0xc86e6eff; // 200,110,110
const C_BTN_BG: u32 = 0x78a5e62e;    // light blue, ~18% alpha
const C_BTN_BG_QUIT: u32 = 0xdc787828; // light red, ~16% alpha

// The guest picks its target screen width; buttons are 50% of it (uniform).
const SCREEN_W: i32 = 360;
const BTN_W: i32 = SCREEN_W / 2;     // 180 = 50% screen

let UI_REV: u32 = 0;
let PLAYS: i32 = 0;     // times "New Game" was activated
let LAST_ID: u32 = 0;   // last activated node id
let NAVS: i32 = 0;      // times a TAG_TO_DEMO effect completed ("navigated")
let FLASHES: i32 = 0;   // times a TAG_FLASH effect completed

function statusText(): string {
  if (LAST_ID == 0) return "plays: " + PLAYS.toString();
  return "plays: " + PLAYS.toString() + "   last: #" + LAST_ID.toString();
}

function rebuild(): void {
  ui.reset();
  // Outer root fills the frame and centres its child horizontally. All visual
  // attributes (layout, size, colour, radius) are declared HERE in the guest;
  // the host EVG layout/renderer just resolves them.
  ui.view(ROOT, 0, 0).column().center().padding(22);

  // The menu "card": fixed width, padded, rounded, translucent panel, with its
  // items centred (cross-axis center on the column).
  ui.view(CARD, ROOT, 0).column().center().padding(18).width(280).background(C_CARD).radius(16);

  ui.label(TITLE, CARD, 0, "WASM UI - Main Menu", C_TITLE, 20);

  // Selectable menu items. onActivate() marks them selectable AND subscribes to
  // the ACTIVATE callback; defaultSelected() picks the first host highlight;
  // radius() rounds the host's selection border to match.
  // Uniform buttons: width = 50% screen, bordered, extra vertical padding,
  // centred label — every attribute declared here in the guest.
  ui.button(BTN_NEW, CARD, 1, "New Game", C_ITEM, 16)
    .onActivate().defaultSelected().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);
  ui.button(BTN_CONT, CARD, 2, "Continue", C_ITEM, 16)
    .onActivate().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);
  ui.button(BTN_OPTS, CARD, 3, "Options", C_ITEM, 16)
    .onActivate().width(BTN_W).padding(10).background(C_BTN_BG).border(2, C_BORDER).radius(9).textCenter().margin(6);
  ui.button(BTN_QUIT, CARD, 4, "Quit", C_QUIT, 16)
    .onActivate().width(BTN_W).padding(10).background(C_BTN_BG_QUIT).border(2, C_BORDER_QUIT).radius(9).textCenter().margin(6);

  // Non-selectable status line — proves selectable is opt-in per node.
  ui.label(STATUS, CARD, 5, statusText(), C_STATUS, 13);

  ui.finish(UI_REV);
}

// ---- exports the host calls ------------------------------------------------
export function init(): void {
  PLAYS = 0;
  LAST_ID = 0;
  UI_REV = 0;
  rebuild();
}

// "Button recognition": the host forwards the action button here for whichever
// node the selection cursor is on (and that subscribed to ACTIVATE).
export function rg_ui_event(nodeId: u32, event: u32, value: u32): void {
  if (event == EVENT_ACTIVATE) {
    LAST_ID = nodeId;
    if (nodeId == BTN_NEW) PLAYS += 1;

    // Effects from WASM (all host-run + GPU-accelerated). "New Game" flashes the
    // button white and navigates once the flash completes (TAG_TO_DEMO); "Quit"
    // fires a red whole-screen pulse; the rest a soft blue whole-screen pulse.
    // The guest only triggers — the host owns the timeline and notifies us on
    // completion via rg_ui_effect_done.
    if (nodeId == BTN_NEW) {
      glowNode(nodeId, 420, 0, 255, 255, 255, TAG_TO_DEMO);
    } else if (nodeId == BTN_QUIT) {
      pulseScreen(600, 0, 255, 80, 80, TAG_FLASH);
    } else {
      pulseScreen(600, 0, 120, 180, 255, TAG_FLASH);
    }

    UI_REV += 1;
    rebuild();
  }
}

// The host calls this when a glow started via rg_ui_glow finishes, echoing back
// the node and the tag we passed. This is where the old host-side `.after(cb)`
// lands: branch on the tag to run the follow-up (navigate, bump a counter, ...).
export function rg_ui_effect_done(nodeId: u32, tag: u32): void {
  if (tag == TAG_TO_DEMO) {
    // A real game would switch screens here; we record that the navigation fired.
    NAVS += 1;
  } else {
    FLASHES += 1;
  }
  UI_REV += 1;
  rebuild();
}

export function rg_ui_ptr(): i32 { return <i32>uiPtr(); }
export function rg_ui_size(): i32 { return UI_SIZE; }
export function rg_ui_revision(): i32 { return <i32>UI_REV; }

// Convenience for host tests: how many times New Game fired.
export function plays(): i32 { return PLAYS; }

// Convenience for host tests: completed effects, by tag.
export function navs(): i32 { return NAVS; }
export function flashes(): i32 { return FLASHES; }
