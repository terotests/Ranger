//! RGU1 — retained-mode UI document (`wasm/wasm_ui_abi.h`), with the same
//! fluent "everything is a box" builder as the shared AssemblyScript
//! `lib/ui.as`.
//!
//! The guest owns an 8 KiB flat vDOM block the host re-parses whenever the
//! revision word bumps. Author it top-down:
//!
//! ```ignore
//! use ranger_game::ui;
//!
//! ui::reset();
//! let mut card = ui::root(ROOT);
//! card.column().center().pad(12).bg(36, 42, 64, 255).radius(16);
//! card.label(TITLE, "Main Menu").font(20).color(255, 255, 255, 255);
//! let mut btn = card.button(BTN_NEW);
//! btn.width(180).pad(10).radius(9);
//! btn.label(CAP_NEW, "New Game").font(16).text_center();
//! ui::finish(rev); // bump rev ONLY when content changed
//! ui::exports!();  // once, at module scope: rg_ui_ptr/size/revision
//! ```
//!
//! ONE AUTHORING RULE (inherited from the flat prop table: a node's properties
//! are contiguous, so they must be written before the next node opens): STYLE
//! A NODE BEFORE OPENING ITS CHILDREN. Written parent-first / top-down this is
//! automatic; debug builds assert on violations.
//!
//! Node ids are part of the host↔guest contract (selection/highlight maps back
//! by id), so they stay explicit. Child order is assigned automatically in
//! call order, like `ui.as`.

use crate::block::{Block, Scalar};

/// `RG_UI_ABI_MAGIC` — 'RGU1' little-endian.
pub const MAGIC: u32 = 0x3155_4752;
pub const MAJOR: u16 = 1;
pub const MINOR: u16 = 0;
/// Total document size in bytes.
pub const SIZE: i32 = 8192;
pub const MAX_NODES: usize = 64;
pub const MAX_PROPS: usize = 128;
pub const STRING_CAP: usize = 1024;

// Layout.
const NODE_OFFSET: usize = 64;
const NODE_SIZE: usize = 32;
const PROP_OFFSET: usize = NODE_OFFSET + MAX_NODES * NODE_SIZE; // 2112
const PROP_SIZE: usize = 16;
const STRING_OFFSET: usize = PROP_OFFSET + MAX_PROPS * PROP_SIZE; // 4160

// Header offsets.
const OFF_MAGIC: usize = 0;
const OFF_MAJOR: usize = 4;
const OFF_MINOR: usize = 6;
const OFF_REVISION: usize = 8;
const OFF_ROOT_ID: usize = 12;
const OFF_NODE_OFFSET: usize = 16;
const OFF_NODE_COUNT: usize = 20;
const OFF_PROP_OFFSET: usize = 24;
const OFF_PROP_COUNT: usize = 28;
const OFF_STRING_OFFSET: usize = 32;
const OFF_STRING_SIZE: usize = 36;
const OFF_FLAGS: usize = 40;

// Node record fields.
const N_ID: usize = 0;
const N_PARENT: usize = 4;
const N_KIND: usize = 8;
const N_FLAGS: usize = 10;
const N_FIRST_PROP: usize = 12;
const N_PROP_COUNT: usize = 16;
const N_CHILD_ORDER: usize = 18;
const N_EVENT_MASK: usize = 20;

// Property record fields.
const P_KEY: usize = 0;
const P_TYPE: usize = 2;
const P_FLAGS: usize = 3;
const P_VALUE_A: usize = 4;
const P_VALUE_B: usize = 8;

// Node kinds.
const K_VIEW: u16 = 1;
const K_TEXT: u16 = 2;
const K_BUTTON: u16 = 5;

// Property types.
const T_I32: u8 = 1;
const T_COLOR: u8 = 3;
const T_STRING: u8 = 4;
const T_ENUM: u8 = 7;

// Property keys (shared subset; games chain extras via prop_* escape hatches).
const P_TEXT: u16 = 1;
const P_BG: u16 = 2;
const P_COLOR: u16 = 3;
const P_FONT: u16 = 4;
const P_WIDTH: u16 = 10;
const P_HEIGHT: u16 = 11;
const P_PAD: u16 = 12;
const P_MARGIN: u16 = 13;
const P_RADIUS: u16 = 14;
const P_BORDER_COLOR: u16 = 15;
const P_BORDER_W: u16 = 16;
const P_FLEXDIR: u16 = 21;
const P_ALIGN: u16 = 22;
const P_TEXTALIGN: u16 = 24;

const DIR_ROW: u32 = 0;
const DIR_COLUMN: u32 = 1;
const ALIGN_CENTER: u32 = 1;
const TEXTALIGN_CENTER: u32 = 1;

const FLAG_VALID: u32 = 1;

static BLOCK: Block<8192> = Block::new();
static NODE_COUNT: Scalar<usize> = Scalar::new(0);
static PROP_COUNT: Scalar<usize> = Scalar::new(0);
static STRING_LEN: Scalar<usize> = Scalar::new(0);
static CUR_NODE: Scalar<usize> = Scalar::new(0); // byte base of the last-opened node
static CUR_NODE_ID: Scalar<i32> = Scalar::new(0);
static ROOT_ID: Scalar<i32> = Scalar::new(0);

/// Start a fresh document (clears nodes/props; strings are re-appended).
pub fn reset() {
    BLOCK.zero(0, STRING_OFFSET);
    NODE_COUNT.set(0);
    PROP_COUNT.set(0);
    STRING_LEN.set(0);
    CUR_NODE.set(0);
    CUR_NODE_ID.set(0);
    ROOT_ID.set(0);
}

/// Open the root box (parent 0) and return its handle.
pub fn root(id: i32) -> El {
    open_node(id, 0, K_VIEW, 0)
}

/// Publish the document: writes the header, marks it VALID and bumps the
/// revision the host watches. Bump `revision` only when content changed so
/// the host can skip re-parsing.
pub fn finish(revision: u32) {
    BLOCK.write_u32(OFF_MAGIC, MAGIC);
    BLOCK.write_u16(OFF_MAJOR, MAJOR);
    BLOCK.write_u16(OFF_MINOR, MINOR);
    BLOCK.write_u32(OFF_REVISION, revision);
    BLOCK.write_i32(OFF_ROOT_ID, ROOT_ID.get());
    BLOCK.write_u32(OFF_NODE_OFFSET, NODE_OFFSET as u32);
    BLOCK.write_u32(OFF_NODE_COUNT, NODE_COUNT.get() as u32);
    BLOCK.write_u32(OFF_PROP_OFFSET, PROP_OFFSET as u32);
    BLOCK.write_u32(OFF_PROP_COUNT, PROP_COUNT.get() as u32);
    BLOCK.write_u32(OFF_STRING_OFFSET, STRING_OFFSET as u32);
    BLOCK.write_u32(OFF_STRING_SIZE, STRING_LEN.get() as u32);
    BLOCK.write_u32(OFF_FLAGS, FLAG_VALID);
}

/// Current revision word (what `rg_ui_revision` returns).
pub fn revision() -> u32 {
    BLOCK.read_u32(OFF_REVISION)
}

fn open_node(id: i32, parent: i32, kind: u16, child_order: u16) -> El {
    let n = NODE_COUNT.get();
    if n < MAX_NODES {
        let base = NODE_OFFSET + n * NODE_SIZE;
        BLOCK.write_i32(base + N_ID, id);
        BLOCK.write_i32(base + N_PARENT, parent);
        BLOCK.write_u16(base + N_KIND, kind);
        BLOCK.write_u16(base + N_FLAGS, 0);
        BLOCK.write_u32(base + N_FIRST_PROP, PROP_COUNT.get() as u32);
        BLOCK.write_u16(base + N_PROP_COUNT, 0);
        BLOCK.write_u16(base + N_CHILD_ORDER, child_order);
        BLOCK.write_u32(base + N_EVENT_MASK, 0);
        if n == 0 {
            ROOT_ID.set(id);
        }
        CUR_NODE.set(base);
        CUR_NODE_ID.set(id);
        NODE_COUNT.set(n + 1);
    }
    El { id, order: 0 }
}

fn begin_prop(for_id: i32, key: u16, ty: u8) -> Option<usize> {
    // Props are contiguous per node: setters must target the LAST-OPENED node.
    // (The one authoring rule — style a node before opening its children.)
    debug_assert!(
        for_id == CUR_NODE_ID.get(),
        "ui: style a node before opening its children"
    );
    let _ = for_id;
    let n = NODE_COUNT.get();
    let p = PROP_COUNT.get();
    if n == 0 || p >= MAX_PROPS {
        return None;
    }
    let pbase = PROP_OFFSET + p * PROP_SIZE;
    BLOCK.write_u16(pbase + P_KEY, key);
    BLOCK.write_u8(pbase + P_TYPE, ty);
    BLOCK.write_u8(pbase + P_FLAGS, 0);
    BLOCK.write_u32(pbase + P_VALUE_A, 0);
    BLOCK.write_u32(pbase + P_VALUE_B, 0);
    BLOCK.write_u32(pbase + P_VALUE_B + 4, 0);
    let cur = CUR_NODE.get();
    let count = BLOCK.read_u16(cur + N_PROP_COUNT);
    BLOCK.write_u16(cur + N_PROP_COUNT, count + 1);
    PROP_COUNT.set(p + 1);
    Some(pbase)
}

fn prop_u32(for_id: i32, key: u16, ty: u8, v: u32) {
    if let Some(p) = begin_prop(for_id, key, ty) {
        BLOCK.write_u32(p + P_VALUE_A, v);
    }
}

fn prop_string(for_id: i32, key: u16, s: &str) {
    if let Some(p) = begin_prop(for_id, key, T_STRING) {
        let bytes = s.as_bytes();
        let start = STRING_LEN.get();
        if start + bytes.len() <= STRING_CAP {
            BLOCK.write_bytes(STRING_OFFSET + start, bytes);
            STRING_LEN.set(start + bytes.len());
            BLOCK.write_u32(p + P_VALUE_A, start as u32);
            BLOCK.write_u32(p + P_VALUE_B, bytes.len() as u32);
        }
    }
}

const fn rgba(r: i32, g: i32, b: i32, a: i32) -> u32 {
    ((r as u32 & 0xff) << 24)
        | ((g as u32 & 0xff) << 16)
        | ((b as u32 & 0xff) << 8)
        | (a as u32 & 0xff)
}

/// A handle to one opened RGU1 box. Children hang off it via
/// [`El::view`]/[`El::button`]/[`El::label`] (child order auto-assigned);
/// style setters chain on the node itself, before its children open.
#[derive(Clone, Copy, Debug)]
pub struct El {
    id: i32,
    order: u16,
}

impl El {
    #[inline]
    pub fn id(&self) -> i32 {
        self.id
    }

    // ---- children ------------------------------------------------------------

    /// Open a plain container child.
    pub fn view(&mut self, id: i32) -> El {
        let o = self.order;
        self.order += 1;
        open_node(id, self.id, K_VIEW, o)
    }

    /// Open an interactive child (RGU1 BUTTON kind) — same surface, activatable.
    pub fn button(&mut self, id: i32) -> El {
        let o = self.order;
        self.order += 1;
        open_node(id, self.id, K_BUTTON, o)
    }

    /// Open a text child already carrying `s`; style the returned handle
    /// (`.font()`, `.color()`, …).
    pub fn label(&mut self, id: i32, s: &str) -> El {
        let o = self.order;
        self.order += 1;
        let el = open_node(id, self.id, K_TEXT, o);
        prop_string(el.id, P_TEXT, s);
        el
    }

    // ---- style setters (target this node; call before opening children) -------

    pub fn row(self) -> Self {
        prop_u32(self.id, P_FLEXDIR, T_ENUM, DIR_ROW);
        self
    }

    pub fn column(self) -> Self {
        prop_u32(self.id, P_FLEXDIR, T_ENUM, DIR_COLUMN);
        self
    }

    pub fn center(self) -> Self {
        prop_u32(self.id, P_ALIGN, T_ENUM, ALIGN_CENTER);
        self
    }

    pub fn pad(self, v: i32) -> Self {
        prop_u32(self.id, P_PAD, T_I32, v as u32);
        self
    }

    pub fn margin(self, v: i32) -> Self {
        prop_u32(self.id, P_MARGIN, T_I32, v as u32);
        self
    }

    pub fn width(self, v: i32) -> Self {
        prop_u32(self.id, P_WIDTH, T_I32, v as u32);
        self
    }

    pub fn height(self, v: i32) -> Self {
        prop_u32(self.id, P_HEIGHT, T_I32, v as u32);
        self
    }

    pub fn radius(self, v: i32) -> Self {
        prop_u32(self.id, P_RADIUS, T_I32, v as u32);
        self
    }

    pub fn font(self, v: i32) -> Self {
        prop_u32(self.id, P_FONT, T_I32, v as u32);
        self
    }

    pub fn text(self, s: &str) -> Self {
        prop_string(self.id, P_TEXT, s);
        self
    }

    pub fn text_center(self) -> Self {
        prop_u32(self.id, P_TEXTALIGN, T_ENUM, TEXTALIGN_CENTER);
        self
    }

    pub fn bg(self, r: i32, g: i32, b: i32, a: i32) -> Self {
        prop_u32(self.id, P_BG, T_COLOR, rgba(r, g, b, a));
        self
    }

    pub fn color(self, r: i32, g: i32, b: i32, a: i32) -> Self {
        prop_u32(self.id, P_COLOR, T_COLOR, rgba(r, g, b, a));
        self
    }

    pub fn border(self, w: i32, r: i32, g: i32, b: i32, a: i32) -> Self {
        prop_u32(self.id, P_BORDER_W, T_I32, w as u32);
        prop_u32(self.id, P_BORDER_COLOR, T_COLOR, rgba(r, g, b, a));
        self
    }

    // ---- escape hatches: chain a game-specific RGU1 property -------------------

    pub fn prop_i32(self, key: u16, v: i32) -> Self {
        prop_u32(self.id, key, T_I32, v as u32);
        self
    }

    pub fn prop_enum(self, key: u16, v: u32) -> Self {
        prop_u32(self.id, key, T_ENUM, v);
        self
    }

    pub fn prop_color(self, key: u16, r: i32, g: i32, b: i32, a: i32) -> Self {
        prop_u32(self.id, key, T_COLOR, rgba(r, g, b, a));
        self
    }

    pub fn prop_str(self, key: u16, s: &str) -> Self {
        prop_string(self.id, key, s);
        self
    }
}

// ---- exports macro -----------------------------------------------------------

#[doc(hidden)]
pub fn __ptr() -> i32 {
    BLOCK.as_mut_ptr() as usize as i32
}

/// Test-only escape hatch.
#[doc(hidden)]
pub fn __read_i32(off: usize) -> i32 {
    BLOCK.read_i32(off)
}

#[doc(hidden)]
pub fn __read_u16(off: usize) -> u16 {
    BLOCK.read_u16(off)
}

/// Generate the RGU1 exports (`rg_ui_ptr` / `rg_ui_size` / `rg_ui_revision`)
/// for a guest that authors a UI document with this module.
#[macro_export]
macro_rules! ui_exports {
    () => {
        #[no_mangle]
        pub extern "C" fn rg_ui_ptr() -> i32 {
            $crate::ui::__ptr()
        }

        #[no_mangle]
        pub extern "C" fn rg_ui_size() -> i32 {
            $crate::ui::SIZE
        }

        #[no_mangle]
        pub extern "C" fn rg_ui_revision() -> i32 {
            $crate::ui::revision() as i32
        }
    };
}

pub use crate::ui_exports as exports;
