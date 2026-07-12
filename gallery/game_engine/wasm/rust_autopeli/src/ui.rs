//! RGU1 UI document — a flat, retained-mode "virtual DOM" that this guest
//! builds in linear memory and the host reads once per frame (see
//! `wasm/wasm_ui_abi.h`). The guest owns the document; the host owns EVG and
//! rendering. No host pointers or EVG objects ever cross into the guest.
//!
//! HUD content is authored entirely from data the guest already sees each
//! frame (collision contacts, computed grip, boost) — proving a WASM game can
//! drive dynamic, multi-colored text through the EVG pipeline.

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

// flex-direction enum values
pub const DIR_ROW: u32 = 0;
pub const DIR_COLUMN: u32 = 1;

const FLAG_VALID: u32 = 1;

// ---- HUD colors (0xRRGGBBAA) ------------------------------------------
const C_WHITE: u32 = 0xFFFF_FFFF;
const C_HITFLASH: u32 = 0xFF30_30FF; // red flash right after a crash
const C_WALL: u32 = 0xB0B0_B0FF; // gray
const C_BAR: u32 = 0x40D0_FFFF; // cyan
const C_CAR: u32 = 0xFF90_28FF; // orange
const C_CONE: u32 = 0xFFD0_30FF; // yellow
const C_GRIP_HI: u32 = 0x40D0_60FF; // green
const C_GRIP_MID: u32 = 0xE0D0_40FF; // yellow
const C_GRIP_LO: u32 = 0xFF60_40FF; // red
const C_BOOST: u32 = 0x40E0_E0FF; // cyan

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

/// Per-player HUD state (all derived from data the guest already has).
#[derive(Clone, Copy)]
pub struct PlayerHud {
    pub hits: i32,
    pub last_hit: i32, // 0 none, 1 wall, 2 bar, 3 car(traffic), 4 cone
    pub grip: i32,     // 0..1000
    pub boost: bool,
    pub flash: bool,   // recently crashed
}

/// Builder over a caller-owned buffer, so it is unit-testable without touching
/// the guest's static UI block. A node's properties are written contiguously,
/// right after `node(...)`.
pub struct Doc<'a> {
    buf: &'a mut [u8],
    node_count: usize,
    prop_count: usize,
    string_len: usize,
    cur_node: usize,
    root_id: u32,
}

impl<'a> Doc<'a> {
    pub fn new(buf: &'a mut [u8]) -> Doc<'a> {
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

/// Format a non-negative integer, returning the used length. Allocation-free.
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

/// Append `prefix` then the decimal of `v` into `out`; returns used length.
fn label_num(prefix: &[u8], v: i32, out: &mut [u8]) -> usize {
    let mut len = 0;
    for &c in prefix {
        out[len] = c;
        len += 1;
    }
    let uv = if v < 0 { 0 } else { v as u32 };
    len += u32_to_dec(uv, &mut out[len..]);
    len
}

fn hit_label(kind: i32) -> &'static [u8] {
    match kind {
        1 => b"WALL",
        2 => b"BAR",
        3 => b"CAR",
        4 => b"CONE",
        _ => b"",
    }
}

fn hit_color(kind: i32) -> u32 {
    match kind {
        1 => C_WALL,
        2 => C_BAR,
        3 => C_CAR,
        4 => C_CONE,
        _ => C_WHITE,
    }
}

fn grip_color(grip: i32) -> u32 {
    if grip >= 650 {
        C_GRIP_HI
    } else if grip >= 350 {
        C_GRIP_MID
    } else {
        C_GRIP_LO
    }
}

fn add_text(d: &mut Doc, id: u32, parent: u32, order: u16, s: &[u8], color: u32) {
    d.node(id, parent, TEXT, order)
        .prop_str(K_TEXT, s)
        .prop_i32(K_FONT_SIZE, 8)
        .prop_color(K_COLOR, color);
}

/// Build one player's vertical column: HITS, last-collision, GRIP, BOOST.
/// No panel background — the HUD overlays the game transparently. The host
/// renders one column per split-screen pane (P1 -> id 10, P2 -> id 20).
fn player_column(d: &mut Doc, col_id: u32, order: u16, p: PlayerHud) {
    d.node(col_id, 1, VIEW, order)
        .prop_enum(K_FLEX_DIRECTION, DIR_COLUMN)
        .prop_i32(K_PADDING, 4);

    let base = col_id + 1;

    let mut hbuf = [0u8; 16];
    let hlen = label_num(b"HITS ", p.hits, &mut hbuf);
    let hcolor = if p.flash { C_HITFLASH } else { C_WHITE };
    add_text(d, base, col_id, 0, &hbuf[0..hlen], hcolor);

    let lbl = hit_label(p.last_hit);
    if !lbl.is_empty() {
        add_text(d, base + 1, col_id, 1, lbl, hit_color(p.last_hit));
    }

    let mut gbuf = [0u8; 16];
    let glen = label_num(b"GRIP ", p.grip / 10, &mut gbuf);
    add_text(d, base + 2, col_id, 2, &gbuf[0..glen], grip_color(p.grip));

    if p.boost {
        add_text(d, base + 3, col_id, 3, b"BOOST", C_BOOST);
    }
}

/// Build the two-player HUD into `buf` with the given `revision`. The root is a
/// transparent container holding the P1 (id 10) and P2 (id 20) columns; the
/// host picks the column matching the pane it is drawing.
pub fn build_hud_into(buf: &mut [u8], p1: PlayerHud, p2: PlayerHud, revision: u32) {
    let mut d = Doc::new(buf);

    d.node(1, 0, VIEW, 0).prop_enum(K_FLEX_DIRECTION, DIR_ROW);

    player_column(&mut d, 10, 0, p1);
    player_column(&mut d, 20, 1, p2);

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

    fn sample(hits: i32, last: i32) -> PlayerHud {
        PlayerHud { hits, last_hit: last, grip: 720, boost: false, flash: false }
    }

    #[test]
    fn header_and_root() {
        let mut buf = [0u8; UI_SIZE];
        build_hud_into(&mut buf, sample(2, 1), sample(0, 0), 7);
        assert_eq!(rd_u32(&buf, OFF_MAGIC), UI_MAGIC);
        assert_eq!(rd_u32(&buf, OFF_REVISION), 7);
        assert_eq!(rd_u32(&buf, OFF_ROOT_ID), 1);
        assert_eq!(rd_u16(&buf, UI_NODE_OFFSET + N_KIND), VIEW);
    }

    #[test]
    fn both_columns_present_with_stable_ids() {
        let mut buf = [0u8; UI_SIZE];
        build_hud_into(&mut buf, sample(2, 3), sample(1, 1), 1);
        let mut saw_p1 = false;
        let mut saw_p2 = false;
        let n = rd_u32(&buf, OFF_NODE_COUNT) as usize;
        for i in 0..n {
            let id = rd_u32(&buf, UI_NODE_OFFSET + i * UI_NODE_SIZE + N_ID);
            if id == 10 {
                saw_p1 = true;
            }
            if id == 20 {
                saw_p2 = true;
            }
        }
        assert!(saw_p1 && saw_p2);
    }

    #[test]
    fn hits_label_lands_in_string_table() {
        let mut buf = [0u8; UI_SIZE];
        build_hud_into(&mut buf, sample(5, 1), sample(0, 0), 1);
        // find the "HITS 5" text (P1 column id 10, first child HITS = id 11).
        let n = rd_u32(&buf, OFF_NODE_COUNT) as usize;
        let str_off = rd_u32(&buf, OFF_STRING_OFFSET) as usize;
        let prop_off = rd_u32(&buf, OFF_PROP_OFFSET) as usize;
        let mut found = false;
        for i in 0..n {
            let nb = UI_NODE_OFFSET + i * UI_NODE_SIZE;
            if rd_u32(&buf, nb + N_ID) != 11 {
                continue;
            }
            let fp = rd_u32(&buf, nb + N_FIRST_PROP) as usize;
            let pb = prop_off + fp * UI_PROP_SIZE;
            let a = rd_u32(&buf, pb + P_VALUE_A) as usize;
            let l = rd_u32(&buf, pb + P_VALUE_B) as usize;
            assert_eq!(&buf[str_off + a..str_off + a + l], b"HITS 5");
            found = true;
        }
        assert!(found);
    }

    #[test]
    fn grip_color_thresholds() {
        assert_eq!(grip_color(900), C_GRIP_HI);
        assert_eq!(grip_color(500), C_GRIP_MID);
        assert_eq!(grip_color(100), C_GRIP_LO);
    }
}
