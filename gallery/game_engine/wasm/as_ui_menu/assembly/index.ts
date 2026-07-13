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
const C_CARD: u32 = 0x242a40ff;   // 36,42,64

let UI_REV: u32 = 0;
let PLAYS: i32 = 0;     // times "New Game" was activated
let LAST_ID: u32 = 0;   // last activated node id

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
  ui.button(BTN_NEW, CARD, 1, "New Game", C_ITEM, 16).onActivate().defaultSelected().radius(8);
  ui.button(BTN_CONT, CARD, 2, "Continue", C_ITEM, 16).onActivate().radius(8);
  ui.button(BTN_OPTS, CARD, 3, "Options", C_ITEM, 16).onActivate().radius(8);
  ui.button(BTN_QUIT, CARD, 4, "Quit", C_QUIT, 16).onActivate().radius(8);

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
    // Continue / Options / Quit would branch here in a real game.
    UI_REV += 1;
    rebuild();
  }
}

export function rg_ui_ptr(): i32 { return <i32>uiPtr(); }
export function rg_ui_size(): i32 { return UI_SIZE; }
export function rg_ui_revision(): i32 { return <i32>UI_REV; }

// Convenience for host tests: how many times New Game fired.
export function plays(): i32 { return PLAYS; }
