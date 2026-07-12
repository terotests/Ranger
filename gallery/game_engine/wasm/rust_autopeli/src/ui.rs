//! RGU1 UI document — a flat, retained-mode "virtual DOM" that this guest
//! builds in linear memory and the host reads once per frame (see
//! `wasm/wasm_ui_abi.h`). The guest owns the document; the host owns EVG and
//! rendering. No host pointers or EVG objects ever cross into the guest.
//!
//! Phase 1 (read-only HUD): the guest rewrites the whole document whenever the
//! rendered content changes and bumps `revision`; the host validates the block
//! as untrusted data, then builds an EVG tree from it.

// ---- ABI constants (mirror wasm/wasm_ui_abi.h) -------------------------
pub const UI_MAGIC: u32 = 0x3155_4752; // 'RGU1' little-endian
pub const UI_MAJOR: u16 = 1;
pub const UI_MINOR: u16 = 0;

pub const UI_HEADER_SIZE: usize = 48;
pub const UI_NODE_OFFSET: usize = 64;
pub const UI_MAX_NODES: usize = 64;
pub const UI_NODE_SIZE: usize = 32;
pub const UI_PROP_OFFSET: usize = UI_NODE_OFFSET + UI_MAX_NODES * UI_NODE_SIZE; // 2112
pub const UI_MAX_PROPS: usize = 128;
pub const UI_PROP_SIZE: usize = 16;
pub const UI_STRING_OFFSET: usize = UI_PROP_OFFSET + UI_MAX_PROPS * UI_PROP_SIZE; // 4160
pub const UI_STRING_CAP: usize = 1024;
pub const UI_SIZE: usize = 8192;

// header field offsets
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

// node field offsets
const N_ID: usize = 0;
const N_PARENT: usize = 4;
const N_KIND: usize = 8;
const N_FLAGS: usize = 10;
const N_FIRST_PROP: usize = 12;
const N_PROP_COUNT: usize = 16;
const N_CHILD_ORDER: usize = 18;
const N_EVENT_MASK: usize = 20;

// property field offsets
const P_KEY: usize = 0;
const P_TYPE: usize = 2;
const P_FLAGS: usize = 3;
const P_VALUE_A: usize = 4;
const P_VALUE_B: usize = 8;
const P_VALUE_C: usize = 12;

// node kinds
pub const VIEW: u16 = 1;
pub const TEXT: u16 = 2;
pub const IMAGE: u16 = 3;
pub const PROGRESS_BAR: u16 = 4;
pub const SPACER: u16 = 6;

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
const K_FLEX: u16 = 20;
const K_FLEX_DIRECTION: u16 = 21;
const K_VALUE: u16 = 40;
const K_MAX_VALUE: u16 = 41;

// flex-direction enum values
pub const DIR_ROW: u32 = 0;
pub const DIR_COLUMN: u32 = 1;

const FLAG_VALID: u32 = 1;

// ---- Byte writers ------------------------------------------------------
fn wr_u32(buf: &mut [u8], off: usize, v: u32) {
    buf[off] = (v & 0xff) as u8;
    buf[off + 1] = ((v >> 8) & 0xff) as u8;
    buf[off + 2] = ((v >> 16) & 0xff) as u8;
    buf[off + 3] = ((v >> 24) & 0xff) as u8;
}

fn wr_u16(buf: &mut [u8], off: usize, v: u16) {
    buf[off] = (v & 0xff) as u8;
    buf[off + 1] = ((v >> 8) & 0xff) as u8;
}

/// Builder over a caller-owned buffer, so it is unit-testable without touching
/// the guest's static UI block. Enforces the invariant that a node's
/// properties are written contiguously, right after `node(...)`.
pub struct Doc<'a> {
    buf: &'a mut [u8],
    node_count: usize,
    prop_count: usize,
    string_len: usize,
    cur_node: usize, // byte offset of the node currently receiving properties
    root_id: u32,
}

impl<'a> Doc<'a> {
    pub fn new(buf: &'a mut [u8]) -> Doc<'a> {
        // Clear the header + table region so stale bytes never leak.
        for b in buf[0..UI_STRING_OFFSET].iter_mut() {
            *b = 0;
        }
        Doc {
            buf,
            node_count: 0,
            prop_count: 0,
            string_len: 0,
            cur_node: 0,
            root_id: 0,
        }
    }

    /// Append a node. The first node added becomes the document root.
    /// Subsequent `prop_*` calls attach to this node until the next `node`.
    pub fn node(&mut self, id: u32, parent_id: u32, kind: u16, child_order: u16) -> &mut Self {
        if self.node_count >= UI_MAX_NODES {
            return self;
        }
        let base = UI_NODE_OFFSET + self.node_count * UI_NODE_SIZE;
        wr_u32(self.buf, base + N_ID, id);
        wr_u32(self.buf, base + N_PARENT, parent_id);
        wr_u16(self.buf, base + N_KIND, kind);
        wr_u16(self.buf, base + N_FLAGS, 0);
        wr_u32(self.buf, base + N_FIRST_PROP, self.prop_count as u32);
        wr_u16(self.buf, base + N_PROP_COUNT, 0);
        wr_u16(self.buf, base + N_CHILD_ORDER, child_order);
        wr_u32(self.buf, base + N_EVENT_MASK, 0);
        if self.node_count == 0 {
            self.root_id = id;
        }
        self.cur_node = base;
        self.node_count += 1;
        self
    }

    fn begin_prop(&mut self, key: u16, ty: u8) -> Option<usize> {
        if self.node_count == 0 || self.prop_count >= UI_MAX_PROPS {
            return None;
        }
        let pbase = UI_PROP_OFFSET + self.prop_count * UI_PROP_SIZE;
        wr_u16(self.buf, pbase + P_KEY, key);
        self.buf[pbase + P_TYPE] = ty;
        self.buf[pbase + P_FLAGS] = 0;
        wr_u32(self.buf, pbase + P_VALUE_A, 0);
        wr_u32(self.buf, pbase + P_VALUE_B, 0);
        wr_u32(self.buf, pbase + P_VALUE_C, 0);
        // Grow the current node's contiguous property run.
        let n = self.buf[self.cur_node + N_PROP_COUNT] as u16
            | ((self.buf[self.cur_node + N_PROP_COUNT + 1] as u16) << 8);
        wr_u16(self.buf, self.cur_node + N_PROP_COUNT, n + 1);
        self.prop_count += 1;
        Some(pbase)
    }

    pub fn prop_i32(&mut self, key: u16, v: i32) -> &mut Self {
        if let Some(p) = self.begin_prop(key, T_I32) {
            wr_u32(self.buf, p + P_VALUE_A, v as u32);
        }
        self
    }

    pub fn prop_color(&mut self, key: u16, rgba: u32) -> &mut Self {
        if let Some(p) = self.begin_prop(key, T_COLOR) {
            wr_u32(self.buf, p + P_VALUE_A, rgba);
        }
        self
    }

    pub fn prop_enum(&mut self, key: u16, v: u32) -> &mut Self {
        if let Some(p) = self.begin_prop(key, T_ENUM) {
            wr_u32(self.buf, p + P_VALUE_A, v);
        }
        self
    }

    pub fn prop_str(&mut self, key: u16, s: &[u8]) -> &mut Self {
        // Reserve the property slot first so a full string table still leaves a
        // consistent (empty) property rather than a dangling run.
        if let Some(p) = self.begin_prop(key, T_STRING) {
            let start = self.string_len;
            if start + s.len() <= UI_STRING_CAP {
                let dst = UI_STRING_OFFSET + start;
                for (i, &b) in s.iter().enumerate() {
                    self.buf[dst + i] = b;
                }
                self.string_len += s.len();
                wr_u32(self.buf, p + P_VALUE_A, start as u32);
                wr_u32(self.buf, p + P_VALUE_B, s.len() as u32);
            }
        }
        self
    }

    /// Finalize: write the header. `revision` is chosen by the caller.
    pub fn finish(&mut self, revision: u32) {
        wr_u32(self.buf, OFF_MAGIC, UI_MAGIC);
        wr_u16(self.buf, OFF_MAJOR, UI_MAJOR);
        wr_u16(self.buf, OFF_MINOR, UI_MINOR);
        wr_u32(self.buf, OFF_REVISION, revision);
        wr_u32(self.buf, OFF_ROOT_ID, self.root_id);
        wr_u32(self.buf, OFF_NODE_OFFSET, UI_NODE_OFFSET as u32);
        wr_u32(self.buf, OFF_NODE_COUNT, self.node_count as u32);
        wr_u32(self.buf, OFF_PROP_OFFSET, UI_PROP_OFFSET as u32);
        wr_u32(self.buf, OFF_PROP_COUNT, self.prop_count as u32);
        wr_u32(self.buf, OFF_STRING_OFFSET, UI_STRING_OFFSET as u32);
        wr_u32(self.buf, OFF_STRING_SIZE, self.string_len as u32);
        wr_u32(self.buf, OFF_FLAGS, FLAG_VALID);
    }
}

/// Format a non-negative integer into `out`, returning the used length.
/// Allocation-free (the crate builds without an allocator).
fn u32_to_dec(mut v: u32, out: &mut [u8]) -> usize {
    if v == 0 {
        out[0] = b'0';
        return 1;
    }
    let mut tmp = [0u8; 10];
    let mut n = 0;
    while v > 0 {
        tmp[n] = b'0' + (v % 10) as u8;
        v /= 10;
        n += 1;
    }
    for i in 0..n {
        out[i] = tmp[n - 1 - i];
    }
    n
}

/// Build the HUD tree into `buf` with the given `revision`.
/// Layout: a top row [ "SCORE <n>"  <spacer flex:1>  <progress bar> ].
pub fn build_hud_into(buf: &mut [u8], score: i32, progress_pct: i32, revision: u32) {
    let mut d = Doc::new(buf);

    // root: row strip, translucent black, 8px padding, 28px tall
    d.node(1, 0, VIEW, 0)
        .prop_enum(K_FLEX_DIRECTION, DIR_ROW)
        .prop_i32(K_PADDING, 8)
        .prop_i32(K_HEIGHT, 28)
        .prop_color(K_BACKGROUND, 0x0000_00AA);

    // "SCORE <n>" label
    let mut label = [0u8; 24];
    let prefix = b"SCORE ";
    let mut len = 0;
    for &c in prefix {
        label[len] = c;
        len += 1;
    }
    let sv = if score < 0 { 0 } else { score as u32 };
    len += u32_to_dec(sv, &mut label[len..]);
    d.node(2, 1, TEXT, 0)
        .prop_str(K_TEXT, &label[0..len])
        .prop_i32(K_FONT_SIZE, 14)
        .prop_color(K_COLOR, 0xFFFF_FFFF);

    // flexible spacer pushes the bar to the right
    d.node(3, 1, SPACER, 1).prop_i32(K_FLEX, 1);

    // progress bar: fill color in COLOR, track in BACKGROUND
    let pct = if progress_pct < 0 {
        0
    } else if progress_pct > 100 {
        100
    } else {
        progress_pct
    };
    d.node(4, 1, PROGRESS_BAR, 2)
        .prop_i32(K_VALUE, pct)
        .prop_i32(K_MAX_VALUE, 100)
        .prop_i32(K_WIDTH, 160)
        .prop_i32(K_HEIGHT, 16)
        .prop_color(K_COLOR, 0x38C8_6EFF)
        .prop_color(K_BACKGROUND, 0x2030_28FF);

    d.finish(revision);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rd_u32(buf: &[u8], off: usize) -> u32 {
        (buf[off] as u32)
            | ((buf[off + 1] as u32) << 8)
            | ((buf[off + 2] as u32) << 16)
            | ((buf[off + 3] as u32) << 24)
    }
    fn rd_u16(buf: &[u8], off: usize) -> u16 {
        (buf[off] as u16) | ((buf[off + 1] as u16) << 8)
    }

    #[test]
    fn header_and_counts_roundtrip() {
        let mut buf = [0u8; UI_SIZE];
        build_hud_into(&mut buf, 1230, 73, 17);

        assert_eq!(rd_u32(&buf, OFF_MAGIC), UI_MAGIC);
        assert_eq!(rd_u16(&buf, OFF_MAJOR), UI_MAJOR);
        assert_eq!(rd_u32(&buf, OFF_REVISION), 17);
        assert_eq!(rd_u32(&buf, OFF_ROOT_ID), 1);
        assert_eq!(rd_u32(&buf, OFF_NODE_OFFSET), UI_NODE_OFFSET as u32);
        assert_eq!(rd_u32(&buf, OFF_NODE_COUNT), 4);
        assert_eq!(rd_u32(&buf, OFF_PROP_OFFSET), UI_PROP_OFFSET as u32);
        assert_eq!(rd_u32(&buf, OFF_FLAGS), FLAG_VALID);
    }

    #[test]
    fn nodes_have_stable_ids_and_parents() {
        let mut buf = [0u8; UI_SIZE];
        build_hud_into(&mut buf, 0, 0, 1);
        let node = |i: usize, off: usize| UI_NODE_OFFSET + i * UI_NODE_SIZE + off;

        assert_eq!(rd_u32(&buf, node(0, N_ID)), 1);
        assert_eq!(rd_u32(&buf, node(0, N_PARENT)), 0);
        assert_eq!(rd_u16(&buf, node(0, N_KIND)), VIEW);

        assert_eq!(rd_u32(&buf, node(1, N_ID)), 2);
        assert_eq!(rd_u32(&buf, node(1, N_PARENT)), 1);
        assert_eq!(rd_u16(&buf, node(1, N_KIND)), TEXT);

        assert_eq!(rd_u32(&buf, node(3, N_ID)), 4);
        assert_eq!(rd_u16(&buf, node(3, N_KIND)), PROGRESS_BAR);
    }

    #[test]
    fn score_text_lands_in_string_table() {
        let mut buf = [0u8; UI_SIZE];
        build_hud_into(&mut buf, 42, 10, 1);

        // node 2 (index 1) is the text node; read its first string property.
        let nbase = UI_NODE_OFFSET + 1 * UI_NODE_SIZE;
        let first_prop = rd_u32(&buf, nbase + N_FIRST_PROP) as usize;
        let pbase = UI_PROP_OFFSET + first_prop * UI_PROP_SIZE;
        assert_eq!(rd_u16(&buf, pbase + P_KEY), K_TEXT);
        assert_eq!(buf[pbase + P_TYPE], T_STRING);
        let soff = rd_u32(&buf, pbase + P_VALUE_A) as usize;
        let slen = rd_u32(&buf, pbase + P_VALUE_B) as usize;
        let s = &buf[UI_STRING_OFFSET + soff..UI_STRING_OFFSET + soff + slen];
        assert_eq!(s, b"SCORE 42");
    }

    #[test]
    fn integer_formatting() {
        let mut out = [0u8; 10];
        let n = u32_to_dec(0, &mut out);
        assert_eq!(&out[..n], b"0");
        let mut out = [0u8; 10];
        let n = u32_to_dec(1230, &mut out);
        assert_eq!(&out[..n], b"1230");
    }
}
