//! RGU1 HUD authoring for the autopeli guest, over the shared
//! `ranger_game::ui` fluent builder (the flat vDOM writer itself lives in the
//! crate — see `gallery/game_engine/lib/ranger_game/src/ui.rs`).
//!
//! HUD content is authored entirely from data the guest already sees each
//! frame (collision contacts, computed grip, boost) — proving a WASM game can
//! drive dynamic, multi-colored text through the EVG pipeline.
//!
//! GAME vs GAME ENGINE (same split as lib.rs):
//!   * GAME: WHAT the HUD says — the colours, the "HITS/GRIP/BOOST" labels, the
//!     grip thresholds, the two-column layout, the node-id scheme. All of this
//!     is autopeli's UI design.
//!   * GAME ENGINE INTERFACE: the `ranger_game::ui` builder (`ui::reset`,
//!     `ui::root`, `.view()/.row()/.column()/.label()/.font()/.color_rgba()`,
//!     `ui::finish`). It is a generic retained-mode UI writer; it neither knows
//!     nor cares that this is a car game.
//! Lines tagged `// [engine]` call that builder; everything else is the game.

// [engine] the generic RGU1 UI builder — the game's only host-facing dependency here.
use ranger_game::ui;

// == GAME: HUD colors (0xRRGGBBAA) — pure UI design choices ==============
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

/// Per-player HUD state (all derived from data the guest already has).
#[derive(Clone, Copy)]
pub struct PlayerHud {
    pub hits: i32,
    pub last_hit: i32, // 0 none, 1 wall, 2 bar, 3 car(traffic), 4 cone
    pub grip: i32,     // 0..1000
    pub boost: bool,
    pub flash: bool, // recently crashed
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

fn hit_label(kind: i32) -> &'static str {
    match kind {
        1 => "WALL",
        2 => "BAR",
        3 => "CAR",
        4 => "CONE",
        _ => "",
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

fn add_text(parent: &mut ui::El, id: i32, s: &str, color: u32) {
    // [engine] append a label node to the RGU1 document via the ui builder.
    parent.label(id, s).font(8).color_rgba(color);
}

/// Build one player's vertical column: HITS, last-collision, GRIP, BOOST.
/// No panel background — the HUD overlays the game transparently. The host
/// renders one column per split-screen pane (P1 -> id 10, P2 -> id 20).
/// Node ids stay fixed even when a line is absent (they're host contract).
fn player_column(root: &mut ui::El, col_id: i32, p: PlayerHud) {
    let mut col = root.view(col_id); // [engine] add a container node
    col.column().pad(4); // [engine] set layout props on that node

    let base = col_id + 1; // game: this game's node-id numbering scheme

    let mut hbuf = [0u8; 16];
    let hlen = label_num(b"HITS ", p.hits, &mut hbuf);
    let hcolor = if p.flash { C_HITFLASH } else { C_WHITE };
    add_text(
        &mut col,
        base,
        core::str::from_utf8(&hbuf[0..hlen]).unwrap_or(""),
        hcolor,
    );

    let lbl = hit_label(p.last_hit);
    if !lbl.is_empty() {
        add_text(&mut col, base + 1, lbl, hit_color(p.last_hit));
    }

    let mut gbuf = [0u8; 16];
    let glen = label_num(b"GRIP ", p.grip / 10, &mut gbuf);
    add_text(
        &mut col,
        base + 2,
        core::str::from_utf8(&gbuf[0..glen]).unwrap_or(""),
        grip_color(p.grip),
    );

    if p.boost {
        add_text(&mut col, base + 3, "BOOST", C_BOOST);
    }
}

/// Build the two-player HUD into the shared RGU1 block with the given
/// `revision`. The root is a transparent container holding the P1 (id 10) and
/// P2 (id 20) columns; the host picks the column matching the pane it draws.
pub fn build_hud(p1: PlayerHud, p2: PlayerHud, revision: u32) {
    ui::reset(); // [engine] start a fresh RGU1 document
    let mut root = ui::root(1); // [engine] create the root node (id 1)
    root.row(); // [engine] lay children out in a row
    player_column(&mut root, 10, p1); // game: P1 column (engine calls inside)
    player_column(&mut root, 20, p2); // game: P2 column (engine calls inside)
    ui::finish(revision); // [engine] commit the document + bump the revision word
}

#[cfg(test)]
mod tests {
    use super::*;

    // RGU1 offsets under test (mirror wasm/wasm_ui_abi.h).
    const OFF_REVISION: usize = 8;
    const OFF_ROOT_ID: usize = 12;
    const OFF_NODE_COUNT: usize = 20;
    const NODES: usize = 64;
    const NODE_SIZE: usize = 32;
    const PROPS: usize = 2112;
    const PROP_SIZE: usize = 16;
    const STRINGS: usize = 4160;
    const N_ID: usize = 0;
    const N_KIND: usize = 8;
    const N_FIRST_PROP: usize = 12;

    fn sample(hits: i32, last: i32) -> PlayerHud {
        PlayerHud {
            hits,
            last_hit: last,
            grip: 720,
            boost: false,
            flash: false,
        }
    }

    fn read_string(prop_index: usize) -> Vec<u8> {
        let pb = PROPS + prop_index * PROP_SIZE;
        let a = ui::__read_i32(pb + 4) as usize;
        let l = ui::__read_i32(pb + 8) as usize;
        (0..l)
            .map(|i| (ui::__read_i32(STRINGS + a + i) & 0xff) as u8)
            .collect()
    }

    // One test function: the RGU1 block is process-global and Rust runs test
    // functions on threads, so the doc-building sub-cases run sequentially here.
    #[test]
    fn hud_document() {
        // Header + root.
        build_hud(sample(2, 1), sample(0, 0), 7);
        assert_eq!(ui::__read_i32(0) as u32, 0x3155_4752, "magic RGU1");
        assert_eq!(ui::__read_i32(OFF_REVISION), 7);
        assert_eq!(ui::__read_i32(OFF_ROOT_ID), 1);
        assert_eq!(ui::__read_u16(NODES + N_KIND), 1, "root VIEW");

        // Both columns present with stable ids.
        build_hud(sample(2, 3), sample(1, 1), 1);
        let n = ui::__read_i32(OFF_NODE_COUNT) as usize;
        let ids: Vec<i32> = (0..n)
            .map(|i| ui::__read_i32(NODES + i * NODE_SIZE + N_ID))
            .collect();
        assert!(ids.contains(&10) && ids.contains(&20));

        // "HITS 5" lands in the string table (P1 column id 10, HITS = id 11).
        build_hud(sample(5, 1), sample(0, 0), 1);
        let n = ui::__read_i32(OFF_NODE_COUNT) as usize;
        let mut found = false;
        for i in 0..n {
            let nb = NODES + i * NODE_SIZE;
            if ui::__read_i32(nb + N_ID) != 11 {
                continue;
            }
            let fp = ui::__read_i32(nb + N_FIRST_PROP) as usize;
            assert_eq!(read_string(fp), b"HITS 5");
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
