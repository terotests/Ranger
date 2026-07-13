// RGU1 retained-mode UI bridge for AssemblyScript — the counterpart of the Rust
// guest's ui.rs. Builds a flat "virtual DOM" in linear memory that the host
// reads once per frame and turns into an EVG tree. Labels are ordinary TS
// strings (`"HITS " + hits.toString()`), so HUD authoring reads like the .tsx.
//
// Like abi.ts, the bottom half is an **object header**: a fluent `Ui` builder
// (`ui.view(id,parent,order).column().padding(4)`, `ui.label(...)`) over the raw
// byte writers, so HUD code reads in nodes and props the way the .tsx JSX does
// (`<View flexDirection="column"><Label color=…>`), not in manual offset math.
// The builder is a module-scope singleton — zero per-rebuild allocation — and
// emits the exact same RGU1 bytes as the low-level version (see selfcheck.cjs).

export const UI_MAGIC: u32 = 0x31554752; // 'RGU1'
export const UI_MAJOR: u16 = 1;
export const UI_MINOR: u16 = 0;

const UI_NODE_OFFSET: i32 = 64;
const UI_MAX_NODES: i32 = 64;
const UI_NODE_SIZE: i32 = 32;
const UI_PROP_OFFSET: i32 = UI_NODE_OFFSET + UI_MAX_NODES * UI_NODE_SIZE; // 2112
const UI_MAX_PROPS: i32 = 128;
const UI_PROP_SIZE: i32 = 16;
const UI_STRING_OFFSET: i32 = UI_PROP_OFFSET + UI_MAX_PROPS * UI_PROP_SIZE;  // 4160
const UI_STRING_CAP: i32 = 1024;
export const UI_SIZE: i32 = 8192;

// header offsets
const OFF_MAGIC: i32 = 0;
const OFF_MAJOR: i32 = 4;
const OFF_MINOR: i32 = 6;
const OFF_REVISION: i32 = 8;
const OFF_ROOT_ID: i32 = 12;
const OFF_NODE_OFFSET: i32 = 16;
const OFF_NODE_COUNT: i32 = 20;
const OFF_PROP_OFFSET: i32 = 24;
const OFF_PROP_COUNT: i32 = 28;
const OFF_STRING_OFFSET: i32 = 32;
const OFF_STRING_SIZE: i32 = 36;
const OFF_FLAGS: i32 = 40;

// node field offsets
const N_ID: i32 = 0;
const N_PARENT: i32 = 4;
const N_KIND: i32 = 8;
const N_FLAGS: i32 = 10;
const N_FIRST_PROP: i32 = 12;
const N_PROP_COUNT: i32 = 16;
const N_CHILD_ORDER: i32 = 18;
const N_EVENT_MASK: i32 = 20;

// property field offsets
const P_KEY: i32 = 0;
const P_TYPE: i32 = 2;
const P_FLAGS: i32 = 3;
const P_VALUE_A: i32 = 4;
const P_VALUE_B: i32 = 8;

// node kinds
export const VIEW: u16 = 1;
export const TEXT: u16 = 2;
export const BUTTON: u16 = 5;

// node flags (node.flags, u16) — interactivity is opt-in per node
export const NODEFLAG_SELECTABLE: i32 = 0x0001;
export const NODEFLAG_DISABLED: i32 = 0x0002;
export const NODEFLAG_DEFAULT: i32 = 0x0004;

// event mask (node.event_mask, u32) — host->guest callbacks
export const EVENT_ACTIVATE: u32 = 0x0001;
export const EVENT_SELECT: u32 = 0x0002;
export const EVENT_DESELECT: u32 = 0x0004;

// property types
const T_I32: u8 = 1;
const T_COLOR: u8 = 3;
const T_STRING: u8 = 4;
const T_ENUM: u8 = 7;

// property keys
const K_TEXT: u16 = 1;
const K_BACKGROUND: u16 = 2;
const K_COLOR: u16 = 3;
const K_FONT_SIZE: u16 = 4;
const K_WIDTH: u16 = 10;
const K_HEIGHT: u16 = 11;
const K_PADDING: u16 = 12;
const K_BORDER_RADIUS: u16 = 14;
const K_FLEX_DIRECTION: u16 = 21;
const K_ALIGN_ITEMS: u16 = 22;
const K_JUSTIFY: u16 = 23;

export const DIR_ROW: u32 = 0;
export const DIR_COLUMN: u32 = 1;

// RgUiAlign
export const ALIGN_START: u32 = 0;
export const ALIGN_CENTER: u32 = 1;
export const ALIGN_END: u32 = 2;
export const ALIGN_SPACE_BETWEEN: u32 = 3;

const FLAG_VALID: u32 = 1;

// default label font size — a named constant so a future override
// (`ui.label(..., fontSize)`) is an additive change, not a magic-number edit.
export const DEFAULT_FONT_SIZE: i32 = 8;

// The RGU1 block, in this module's linear memory.
export const UI = new StaticArray<u8>(UI_SIZE);
export function uiPtr(): usize {
  return changetype<usize>(UI);
}

// byte-wise little-endian writers (match the Rust guest exactly)
function wu8(off: i32, v: i32): void {
  UI[off] = <u8>(v & 0xff);
}
function wu16(off: i32, v: i32): void {
  UI[off] = <u8>(v & 0xff);
  UI[off + 1] = <u8>((v >> 8) & 0xff);
}
function wu32(off: i32, v: u32): void {
  UI[off] = <u8>(v & 0xff);
  UI[off + 1] = <u8>((v >> 8) & 0xff);
  UI[off + 2] = <u8>((v >> 16) & 0xff);
  UI[off + 3] = <u8>((v >> 24) & 0xff);
}
function wu32read(off: i32): u32 {
  return (<u32>UI[off]) | (<u32>UI[off + 1] << 8) | (<u32>UI[off + 2] << 16) | (<u32>UI[off + 3] << 24);
}

// ---- Per-player HUD state (plain typed struct, like the .tsx state) ----
export class PlayerHud {
  hits: i32 = 0;
  last_hit: i32 = 0; // 0 none, 1 wall, 2 bar, 3 car, 4 cone
  grip: i32 = 0;     // 0..1000
  boost: bool = false;
  flash: bool = false;
}

// ---- Object header: fluent RGU1 document builder (port of ui.rs `Doc`) ----
//
// Authoring style:
//   ui.reset();
//   ui.view(1, 0, 0).row();                 // root: <View flexDirection="row">
//   ui.view(10, 1, 0).column().padding(4);  //   <View flexDirection="column" padding=4>
//   ui.label(11, 10, 0, "HITS 3", color);   //     <Label color=…>HITS 3</Label>
//   ui.finish(revision);
//
// The prop-order-sensitive TEXT node (text + font-size + color) is emitted by
// one `label()` call so the byte layout stays fixed; the container props (row/
// column/padding) are fluent because their order is stable by construction.
export class Ui {
  nodeCount: i32 = 0;
  propCount: i32 = 0;
  stringLen: i32 = 0;
  curNode: i32 = 0;
  rootId: u32 = 0;

  reset(): Ui {
    for (let i = 0; i < UI_STRING_OFFSET; i++) UI[i] = 0;
    this.nodeCount = 0;
    this.propCount = 0;
    this.stringLen = 0;
    this.curNode = 0;
    this.rootId = 0;
    return this;
  }

  private node(id: u32, parentId: u32, kind: u16, childOrder: u16): void {
    if (this.nodeCount >= UI_MAX_NODES) return;
    const base = UI_NODE_OFFSET + this.nodeCount * UI_NODE_SIZE;
    wu32(base + N_ID, id);
    wu32(base + N_PARENT, parentId);
    wu16(base + N_KIND, kind);
    wu16(base + N_FLAGS, 0);
    wu32(base + N_FIRST_PROP, <u32>this.propCount);
    wu16(base + N_PROP_COUNT, 0);
    wu16(base + N_CHILD_ORDER, childOrder);
    wu32(base + N_EVENT_MASK, 0);
    if (this.nodeCount == 0) this.rootId = id;
    this.curNode = base;
    this.nodeCount += 1;
  }

  private beginProp(key: u16, ty: u8): i32 {
    if (this.nodeCount == 0 || this.propCount >= UI_MAX_PROPS) return -1;
    const pbase = UI_PROP_OFFSET + this.propCount * UI_PROP_SIZE;
    wu16(pbase + P_KEY, key);
    wu8(pbase + P_TYPE, ty);
    wu8(pbase + P_FLAGS, 0);
    wu32(pbase + P_VALUE_A, 0);
    wu32(pbase + P_VALUE_B, 0);
    wu32(pbase + 12, 0);
    // grow the current node's contiguous property run
    const pcOff = this.curNode + N_PROP_COUNT;
    const n = <i32>UI[pcOff] | (<i32>UI[pcOff + 1] << 8);
    wu16(pcOff, n + 1);
    this.propCount += 1;
    return pbase;
  }

  private propI32(key: u16, v: i32): void {
    const p = this.beginProp(key, T_I32);
    if (p >= 0) wu32(p + P_VALUE_A, <u32>v);
  }
  private propColor(key: u16, rgba: u32): void {
    const p = this.beginProp(key, T_COLOR);
    if (p >= 0) wu32(p + P_VALUE_A, rgba);
  }
  private propEnum(key: u16, v: u32): void {
    const p = this.beginProp(key, T_ENUM);
    if (p >= 0) wu32(p + P_VALUE_A, v);
  }
  // ASCII string property (HUD labels are ASCII).
  private propStr(key: u16, s: string): void {
    const p = this.beginProp(key, T_STRING);
    if (p < 0) return;
    const start = this.stringLen;
    const len = s.length;
    if (start + len > UI_STRING_CAP) return;
    for (let i = 0; i < len; i++) {
      UI[UI_STRING_OFFSET + start + i] = <u8>(s.charCodeAt(i) & 0xff);
    }
    this.stringLen += len;
    wu32(p + P_VALUE_A, <u32>start);
    wu32(p + P_VALUE_B, <u32>len);
  }

  // ---- fluent node openers + prop setters (apply to the current node) ----
  view(id: u32, parent: u32, order: u16): Ui {
    this.node(id, parent, VIEW, order);
    return this;
  }
  row(): Ui { this.propEnum(K_FLEX_DIRECTION, DIR_ROW); return this; }
  column(): Ui { this.propEnum(K_FLEX_DIRECTION, DIR_COLUMN); return this; }
  padding(v: i32): Ui { this.propI32(K_PADDING, v); return this; }
  width(v: i32): Ui { this.propI32(K_WIDTH, v); return this; }
  height(v: i32): Ui { this.propI32(K_HEIGHT, v); return this; }
  background(rgba: u32): Ui { this.propColor(K_BACKGROUND, rgba); return this; }
  radius(v: i32): Ui { this.propI32(K_BORDER_RADIUS, v); return this; }
  alignItems(a: u32): Ui { this.propEnum(K_ALIGN_ITEMS, a); return this; }
  justify(a: u32): Ui { this.propEnum(K_JUSTIFY, a); return this; }
  // Horizontally centre children of a column (cross-axis center).
  center(): Ui { this.propEnum(K_ALIGN_ITEMS, ALIGN_CENTER); return this; }

  // ---- interactivity (fluent, apply to the current node) ----
  // OR a bit into the current node's u16 flags field.
  private orFlags(bit: i32): void {
    if (this.nodeCount == 0) return;
    const off = this.curNode + N_FLAGS;
    const cur = <i32>UI[off] | (<i32>UI[off + 1] << 8);
    wu16(off, cur | bit);
  }
  // OR a bit into the current node's u32 event_mask field.
  private orEvent(bit: u32): void {
    if (this.nodeCount == 0) return;
    const off = this.curNode + N_EVENT_MASK;
    const cur = wu32read(off);
    wu32(off, cur | bit);
  }

  // Mark the current node selectable by the host's D-pad/keyboard cursor.
  selectable(): Ui { this.orFlags(NODEFLAG_SELECTABLE); return this; }
  // Mark it the initial selection (host picks it on the first frame).
  defaultSelected(): Ui { this.orFlags(NODEFLAG_DEFAULT); return this; }
  // Skip in navigation and render dimmed.
  disabled(): Ui { this.orFlags(NODEFLAG_DISABLED); return this; }
  // Subscribe to the ACTIVATE callback (action button while selected).
  onActivate(): Ui { this.selectable(); this.orEvent(EVENT_ACTIVATE); return this; }

  // Emit a complete TEXT node (text -> font-size -> color, fixed order).
  // `fontSize` is a defaulted parameter: old call sites keep the RGU1 8px look,
  // new games can override without any signature break.
  label(id: u32, parent: u32, order: u16, s: string, color: u32, fontSize: i32 = DEFAULT_FONT_SIZE): void {
    this.node(id, parent, TEXT, order);
    this.propStr(K_TEXT, s);
    this.propI32(K_FONT_SIZE, fontSize);
    this.propColor(K_COLOR, color);
  }

  // Like label(), but a BUTTON node that RETURNS the builder so interactivity
  // chains fluently: `ui.button(...).onActivate().defaultSelected()`.
  button(id: u32, parent: u32, order: u16, s: string, color: u32, fontSize: i32 = DEFAULT_FONT_SIZE): Ui {
    this.node(id, parent, BUTTON, order);
    this.propStr(K_TEXT, s);
    this.propI32(K_FONT_SIZE, fontSize);
    this.propColor(K_COLOR, color);
    return this;
  }

  finish(revision: u32): void {
    wu32(OFF_MAGIC, UI_MAGIC);
    wu16(OFF_MAJOR, <i32>UI_MAJOR);
    wu16(OFF_MINOR, <i32>UI_MINOR);
    wu32(OFF_REVISION, revision);
    wu32(OFF_ROOT_ID, this.rootId);
    wu32(OFF_NODE_OFFSET, <u32>UI_NODE_OFFSET);
    wu32(OFF_NODE_COUNT, <u32>this.nodeCount);
    wu32(OFF_PROP_OFFSET, <u32>UI_PROP_OFFSET);
    wu32(OFF_PROP_COUNT, <u32>this.propCount);
    wu32(OFF_STRING_OFFSET, <u32>UI_STRING_OFFSET);
    wu32(OFF_STRING_SIZE, <u32>this.stringLen);
    wu32(OFF_FLAGS, FLAG_VALID);
  }
}

// The reusable builder singleton — the RGU1 half of the object header.
export const ui = new Ui();

// ---- HUD colors (0xRRGGBBAA) — same palette as the Rust guest ----
const C_WHITE: u32 = 0xffffffff;
const C_HITFLASH: u32 = 0xff3030ff;
const C_WALL: u32 = 0xb0b0b0ff;
const C_BAR: u32 = 0x40d0ffff;
const C_CAR: u32 = 0xff9028ff;
const C_CONE: u32 = 0xffd030ff;
const C_GRIP_HI: u32 = 0x40d060ff;
const C_GRIP_MID: u32 = 0xe0d040ff;
const C_GRIP_LO: u32 = 0xff6040ff;
const C_BOOST: u32 = 0x40e0e0ff;

function hitLabel(kind: i32): string {
  if (kind == 1) return "WALL";
  if (kind == 2) return "BAR";
  if (kind == 3) return "CAR";
  if (kind == 4) return "CONE";
  return "";
}
function hitColor(kind: i32): u32 {
  if (kind == 1) return C_WALL;
  if (kind == 2) return C_BAR;
  if (kind == 3) return C_CAR;
  if (kind == 4) return C_CONE;
  return C_WHITE;
}
function gripColor(grip: i32): u32 {
  if (grip >= 650) return C_GRIP_HI;
  if (grip >= 350) return C_GRIP_MID;
  return C_GRIP_LO;
}

function playerColumn(colId: u32, order: u16, p: PlayerHud): void {
  ui.view(colId, 1, order).column().padding(4);

  const base = colId + 1;
  ui.label(base, colId, 0, "HITS " + p.hits.toString(), p.flash ? C_HITFLASH : C_WHITE);

  const lbl = hitLabel(p.last_hit);
  if (lbl.length > 0) {
    ui.label(base + 1, colId, 1, lbl, hitColor(p.last_hit));
  }

  ui.label(base + 2, colId, 2, "GRIP " + (p.grip / 10).toString(), gripColor(p.grip));

  if (p.boost) {
    ui.label(base + 3, colId, 3, "BOOST", C_BOOST);
  }
}

// Build the two-player HUD; host renders column id 10 (P1) / 20 (P2) per pane.
export function buildHud(p1: PlayerHud, p2: PlayerHud, revision: u32): void {
  ui.reset();
  ui.view(1, 0, 0).row();
  playerColumn(10, 0, p1);
  playerColumn(20, 1, p2);
  ui.finish(revision);
}
