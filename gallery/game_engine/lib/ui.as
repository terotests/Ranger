// ============================================================================
// Shared fluent EVG builder for .as games, over the flat RGU1 bridge.
// ============================================================================
// `ui.view/label/button(id, parent, order)` opens an RGU1 node and returns an
// `El` whose chained setters style that SAME node:
//
//   ui.view(imgId, colId, 0).width(176).height(176).radius(16).image(art)
//     .border(3, br, bg, bb, 255);
//   ui.label(lblId, colId, 1).text(name).font(20).color(236, 240, 250, 255).margin(6);
//
// `uiProp*()` always applies to whichever node `uiNode()` opened LAST, so `El`
// carries no node identity of its own - it is a stateless chain API. That is
// why every open() call below hands back the SAME shared `CURRENT` instance
// instead of allocating a fresh `El` per node.
//
// IMPORTANT: a chain must be used right after the `ui.view/label/button(...)`
// call that produced it - do NOT hold a reference across a second open() call:
//   let a = ui.view(10, ROOT, 0);
//   ui.view(20, ROOT, 1);
//   a.width(100);   // restyles node 20 (the last one opened), not node 10
//
// Import into a game with:
//   import { ui } from "./ui";
// (falls back to this shared file when the game's own folder has no ui.as -
// see as_source_runner.rgr's engine.addAssetPath("gallery/game_engine/lib")).
// ============================================================================

import { uiReset, uiNode, uiPropI32, uiPropEnum, uiPropStr, uiPropColorRgba, uiFinish } from "@ranger/game";

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
const P_BG_IMAGE: i32 = 56;   // background image path, clipped to the rounded box

const DIR_ROW: i32 = 0;
const DIR_COLUMN: i32 = 1;
const ALIGN_CENTER: i32 = 1;
const TEXTALIGN_CENTER: i32 = 1;

class El {
  row(): El { uiPropEnum(P_FLEXDIR, DIR_ROW); return this; }
  column(): El { uiPropEnum(P_FLEXDIR, DIR_COLUMN); return this; }
  center(): El { uiPropEnum(P_ALIGN, ALIGN_CENTER); return this; }
  pad(v: i32): El { uiPropI32(P_PAD, v); return this; }
  margin(v: i32): El { uiPropI32(P_MARGIN, v); return this; }
  width(v: i32): El { uiPropI32(P_WIDTH, v); return this; }
  height(v: i32): El { uiPropI32(P_HEIGHT, v); return this; }
  radius(v: i32): El { uiPropI32(P_RADIUS, v); return this; }
  font(v: i32): El { uiPropI32(P_FONT, v); return this; }
  text(s: string): El { uiPropStr(P_TEXT, s); return this; }
  image(path: string): El { uiPropStr(P_BG_IMAGE, path); return this; }
  textCenter(): El { uiPropEnum(P_TEXTALIGN, TEXTALIGN_CENTER); return this; }
  bg(r: i32, g: i32, b: i32, a: i32): El { uiPropColorRgba(P_BG, r, g, b, a); return this; }
  color(r: i32, g: i32, b: i32, a: i32): El { uiPropColorRgba(P_COLOR, r, g, b, a); return this; }
  border(w: i32, r: i32, g: i32, b: i32, a: i32): El {
    uiPropI32(P_BORDER_W, w);
    uiPropColorRgba(P_BORDER_COLOR, r, g, b, a);
    return this;
  }
}

// One shared, allocation-free chain instance - see the file header for why a
// fresh `El` per node is unnecessary (and wasteful on a managed heap at ship
// time): uiProp*() is stateless from El's point of view, it always targets
// whatever node uiNode() opened last.
const CURRENT: El = new El();

class Ui {
  reset(): void { uiReset(); }
  finish(rev: i32): void { uiFinish(rev); }
  view(id: i32, parent: i32, order: i32): El { uiNode(id, parent, K_VIEW, order); return CURRENT; }
  label(id: i32, parent: i32, order: i32): El { uiNode(id, parent, K_TEXT, order); return CURRENT; }
  button(id: i32, parent: i32, order: i32): El { uiNode(id, parent, K_BUTTON, order); return CURRENT; }
}

export const ui: Ui = new Ui();
