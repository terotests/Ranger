// RGU1 retained-mode UI bridge for AssemblyScript — the counterpart of the Rust
// guest's ui.rs. Builds a flat "virtual DOM" in linear memory that the host
// reads once per frame and turns into an EVG tree. Labels are ordinary TS
// strings (`"HITS " + hits.toString()`), so HUD authoring reads like the .tsx.

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

// property types
const T_I32: u8 = 1;
const T_COLOR: u8 = 3;
const T_STRING: u8 = 4;
const T_ENUM: u8 = 7;

// property keys
const K_TEXT: u16 = 1;
const K_COLOR: u16 = 3;
const K_FONT_SIZE: u16 = 4;
const K_PADDING: u16 = 12;
const K_FLEX_DIRECTION: u16 = 21;

export const DIR_ROW: u32 = 0;
export const DIR_COLUMN: u32 = 1;

const FLAG_VALID: u32 = 1;

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

// ---- Per-player HUD state (plain typed struct, like the .tsx state) ----
export class PlayerHud {
  hits: i32 = 0;
  last_hit: i32 = 0; // 0 none, 1 wall, 2 bar, 3 car, 4 cone
  grip: i32 = 0;     // 0..1000
  boost: bool = false;
  flash: bool = false;
}

// ---- Document builder (port of ui.rs `Doc`) ----
class Doc {
  nodeCount: i32 = 0;
  propCount: i32 = 0;
  stringLen: i32 = 0;
  curNode: i32 = 0;
  rootId: u32 = 0;

  reset(): void {
    for (let i = 0; i < UI_STRING_OFFSET; i++) UI[i] = 0;
    this.nodeCount = 0;
    this.propCount = 0;
    this.stringLen = 0;
    this.curNode = 0;
    this.rootId = 0;
  }

  node(id: u32, parentId: u32, kind: u16, childOrder: u16): void {
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

  propI32(key: u16, v: i32): void {
    const p = this.beginProp(key, T_I32);
    if (p >= 0) wu32(p + P_VALUE_A, <u32>v);
  }
  propColor(key: u16, rgba: u32): void {
    const p = this.beginProp(key, T_COLOR);
    if (p >= 0) wu32(p + P_VALUE_A, rgba);
  }
  propEnum(key: u16, v: u32): void {
    const p = this.beginProp(key, T_ENUM);
    if (p >= 0) wu32(p + P_VALUE_A, v);
  }
  // ASCII string property (HUD labels are ASCII).
  propStr(key: u16, s: string): void {
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

  text(id: u32, parent: u32, order: u16, s: string, color: u32): void {
    this.node(id, parent, TEXT, order);
    this.propStr(K_TEXT, s);
    this.propI32(K_FONT_SIZE, 8);
    this.propColor(K_COLOR, color);
  }
}

const doc = new Doc();

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
  doc.node(colId, 1, VIEW, order);
  doc.propEnum(K_FLEX_DIRECTION, DIR_COLUMN);
  doc.propI32(K_PADDING, 4);

  const base = colId + 1;
  doc.text(base, colId, 0, "HITS " + p.hits.toString(), p.flash ? C_HITFLASH : C_WHITE);

  const lbl = hitLabel(p.last_hit);
  if (lbl.length > 0) {
    doc.text(base + 1, colId, 1, lbl, hitColor(p.last_hit));
  }

  doc.text(base + 2, colId, 2, "GRIP " + (p.grip / 10).toString(), gripColor(p.grip));

  if (p.boost) {
    doc.text(base + 3, colId, 3, "BOOST", C_BOOST);
  }
}

// Build the two-player HUD; host renders column id 10 (P1) / 20 (P2) per pane.
export function buildHud(p1: PlayerHud, p2: PlayerHud, revision: u32): void {
  doc.reset();
  doc.node(1, 0, VIEW, 0);
  doc.propEnum(K_FLEX_DIRECTION, DIR_ROW);
  playerColumn(10, 0, p1);
  playerColumn(20, 1, p2);
  doc.finish(revision);
}
