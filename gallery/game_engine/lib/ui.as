// ============================================================================
// Shared fluent EVG builder for .as games, over the flat RGU1 bridge.
// ============================================================================
// A node is opened AND styled AND given its children through one `El` handle:
//
//   const card = ui.view(CARD, ROOT, 0)      // open CARD under ROOT
//     .column().center().pad(SPACE_LARGE)    // ...style THIS node...
//     .bg(36, 42, 64, 255).radius(16);
//   card.label(TITLE, 0).text("Main Menu").font(20).color(255, 255, 255, 255);
//   card.button(BTN_NEW, 1).text("New Game").font(16).textCenter();
//   card.button(BTN_CONT, 2).text("Continue").font(16).textCenter();
//
// `ui.view/label/button(id, parent, order)` opens a node with an explicit parent
// and returns its `El`. `el.view/label/button(childId, order)` opens a CHILD of
// that node (parent = el.id) - so a container is authored as a value you keep and
// hang children off, instead of repeating the parent id at every call.
//
// The style setters (`.column()`, `.pad()`, `.color()`, ...) apply to whichever
// node the bridge opened LAST via uiNode(). Opening a child re-arms that "last"
// node, so the one authoring rule is: STYLE A NODE BEFORE OPENING ITS CHILDREN.
//   const v = ui.view(10, ROOT, 0).column();  // ok: styles node 10
//   v.button(20, 0).text("A");                // ok: opens 20, .text styles 20
//   v.pad(8);   // WRONG: pads node 20 (last opened), not node 10
// Written parent-first / top-down (as above) this rule is automatic.
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

// A handle to one opened RGU1 node. It carries its own `id` so children can be
// hung off it (`el.button(...)`), and its style setters chain over the bridge's
// last-opened node (see the file header for the one authoring rule). Exported so
// games can type container handles they pass into their own authoring helpers.
export class El {
  id: i32 = 0;

  // ---- children: open a node parented to THIS one, return the child's handle --
  view(id: i32, order: i32): El { uiNode(id, this.id, K_VIEW, order); return newEl(id); }
  label(id: i32, order: i32): El { uiNode(id, this.id, K_TEXT, order); return newEl(id); }
  button(id: i32, order: i32): El { uiNode(id, this.id, K_BUTTON, order); return newEl(id); }

  // ---- style setters (target the last-opened node, i.e. this one) ------------
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

  // ---- escape hatches: chain a game-specific RGU1 property on this node ------
  // Keeps app-defined props (gradient/glow/absolute placement/...) inside the
  // fluent chain instead of a bare uiProp*() call breaking out of it.
  propI32(key: i32, v: i32): El { uiPropI32(key, v); return this; }
  propEnum(key: i32, v: i32): El { uiPropEnum(key, v); return this; }
  propStr(key: i32, s: string): El { uiPropStr(key, s); return this; }
  propColor(key: i32, r: i32, g: i32, b: i32, a: i32): El { uiPropColorRgba(key, r, g, b, a); return this; }
}

// El allocates per opened node (each carries its own id) - constructors with
// args aren't relied on here, so a tiny factory sets the field instead.
function newEl(id: i32): El { let e: El = new El(); e.id = id; return e; }

class Ui {
  reset(): void { uiReset(); }
  finish(rev: i32): void { uiFinish(rev); }
  view(id: i32, parent: i32, order: i32): El { uiNode(id, parent, K_VIEW, order); return newEl(id); }
  label(id: i32, parent: i32, order: i32): El { uiNode(id, parent, K_TEXT, order); return newEl(id); }
  button(id: i32, parent: i32, order: i32): El { uiNode(id, parent, K_BUTTON, order); return newEl(id); }
}

export const ui: Ui = new Ui();
