// ============================================================================
// Shared fluent EVG builder for .as games, over the flat RGU1 bridge.
// ============================================================================
// Everything is a BOX (an EVG div). You open a box, style it, and hang children
// off it - a button is just a box that is interactive, a label is just a box
// that carries text:
//
//   const card = ui.box(ROOT);              // the root box (parent 0)
//   const menu = card.box(CARD).column().center().pad(SPACE_LARGE)
//     .bg(36, 42, 64, 255).radius(16);
//   menu.label(TITLE, "Main Menu").font(20).color(255, 255, 255, 255);
//   menu.button(BTN_NEW).width(180).pad(10).radius(9)
//     .label(CAP_NEW, "New Game").font(16).textCenter();   // caption is a child
//
// - `parent.box(id)`     opens a plain container child (an EVG div).
// - `parent.button(id)`  opens an INTERACTIVE box child (RGU1 kind BUTTON). It is
//                        the same El with the same setters - "a view + a handler".
//                        (RGU1 fixes a node's kind at creation, so this is an
//                        opener, not a `.button()` you bolt onto an existing box.)
// - `parent.label(id,s)` opens a TEXT box child already carrying `s`, and returns
//                        it so you can style the text (`.font()`, `.color()`).
//
// Child ORDER is assigned automatically in call order (each parent counts its
// own children), so you never pass an order. IDs stay explicit: the host maps a
// selection cursor / glow highlight back to a node by id, and the guest reports
// that id to the host, so those ids are part of the contract - not incidental.
//
// The style setters (`.column()`, `.pad()`, `.color()`, ...) apply to whichever
// node the bridge opened LAST. Opening a child re-arms that "last" node, so the
// one authoring rule is: STYLE A NODE (and set its glow / gradient / ... props)
// BEFORE OPENING ITS CHILDREN. Written parent-first / top-down this is automatic:
//   const b = card.button(BTN).width(180);  // style the button...
//   b.propI32(P_GLOW, g);                    // ...and its own props...
//   b.label(CAP, "Go").font(16);             // ...THEN open its caption child.
//
// Import into a game with:
//   import { ui, El } from "./ui";
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

// A handle to one opened RGU1 box. It carries its own `id` (so children hang off
// it) and an auto-incrementing child `order`; its style setters chain over the
// bridge's last-opened node (see the file header for the one authoring rule).
// Exported so games can type the container handles they pass into their own
// authoring helpers.
export class El {
  id: i32 = 0;
  order: i32 = 0;   // next child order; bumped by every box/button/label opened

  // ---- children: open a box parented to THIS one, return the child's handle --
  // A plain container.
  box(id: i32): El { let o: i32 = this.order; this.order = o + 1; uiNode(id, this.id, K_VIEW, o); return newEl(id); }
  // An interactive box (RGU1 BUTTON kind) - same El surface, just activatable.
  button(id: i32): El { let o: i32 = this.order; this.order = o + 1; uiNode(id, this.id, K_BUTTON, o); return newEl(id); }
  // A text box already carrying `s`; returned so the caller styles the text.
  label(id: i32, s: string): El { let o: i32 = this.order; this.order = o + 1; uiNode(id, this.id, K_TEXT, o); uiPropStr(P_TEXT, s); return newEl(id); }

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

// El allocates per opened node (each carries its own id + child counter) -
// constructors with args aren't relied on here, so a tiny factory sets the id.
function newEl(id: i32): El { let e: El = new El(); e.id = id; return e; }

class Ui {
  reset(): void { uiReset(); }
  finish(rev: i32): void { uiFinish(rev); }
  // Open the root box (parent 0, order 0) and return its handle; children hang
  // off it via .box()/.button()/.label().
  box(id: i32): El { uiNode(id, 0, K_VIEW, 0); return newEl(id); }
}

export const ui: Ui = new Ui();
