//! ylos3d_wasm — a faithful Rust/wasm32 port of games/ylos3d.
//!
//! Same game, same look, same feel as the .tsx — a split-screen LPC climber with
//! moving platforms, skeleton enemies (stomp/hurt), collectible 3D diamonds that
//! grant a super mode, particle FX, a digit HUD, and a summit finish/celebrate
//! sequence with audio. The .tsx runs through the interpreter; this runs the SAME
//! bridge commands from wasm, so a player cannot tell the two apart.
//!
//! Idiomatic Rust underneath (fixed-capacity state arrays instead of JS arrays,
//! explicit integer/float types, libm for sin/cos/floor), but every host command
//! and constant mirrors games/ylos3d/index.tsx one-to-one. Input arrives through
//! RgWasmGameHost's input channel (the host writes each player's mask into the
//! `input_ptr` region before update()).

#![no_std]
#[panic_handler]
fn ph(_: &core::panic::PanicInfo) -> ! { loop {} }

mod rg_abi;
use rg_abi::*;
use libm::{cosf, floorf, sinf};

// ===== tuning (verbatim from index.tsx) ======================================
const BASE_W: f32 = 480.0;
const WORLD_H: f32 = 1890.0;
const GRAV: f32 = 0.00045;
const MOVE: f32 = 0.22;
const JUMP_MIN_V: f32 = 0.28;
const JUMP_MAX_V: f32 = 0.38;
const JUMP_SUPER_MAX_V: f32 = 0.52;
const JUMP_HOLD_LIFT: f32 = 0.00062;
const JUMP_CUT: f32 = 0.42;
const JUMP_HOLD_MAX_MS: f32 = 400.0;
const JUMP_HOLD_MAX_SUPER_MS: f32 = 700.0;
const MOVING_PLAT_SPEED: f32 = 0.06;
const PLAYER_W: f32 = 26.0;
const PLAYER_H: f32 = 44.0;
const SUPER_MS: f32 = 8000.0;
const SUPER_WARN_MS: f32 = 2500.0;
const SUPER_BLINK_MS: f32 = 200.0;
const CELEBRATE_INTERVAL: f32 = 520.0;
const FINISH_PARTICLE_MS: f32 = 2000.0;
const FINISH_CELEBRATE_MS: f32 = 3000.0;
const FINISH_WALK_MS: f32 = 4500.0;
const FINISH_PHASE_DONE: f32 = FINISH_CELEBRATE_MS + FINISH_WALK_MS;
const PLAT_EDGE_H: f32 = 4.0;
const GEM_W: i32 = 40;
const GEM_H: i32 = 72;
const ENEMY_WALK_FRAMES: f32 = 9.0;
const VIEW_H: f32 = 270.0;
const CAM_LEAD: f32 = 120.0;
const SHEET_ROW_RIGHT: i32 = 3;
const SHEET_ROW_LEFT: i32 = 1;
const SHEET_JUMP_COL: i32 = 3;
const GOAL_INDEX: usize = 16;

// ===== level tables (verbatim) ===============================================
struct Rect { x: f32, y: f32, w: f32, h: f32 }
const PLATFORMS: [Rect; 17] = [
    Rect { x: 0.0, y: 1830.0, w: 480.0, h: 60.0 },
    Rect { x: 30.0, y: 1700.0, w: 190.0, h: 14.0 },
    Rect { x: 170.0, y: 1590.0, w: 100.0, h: 14.0 },
    Rect { x: 310.0, y: 1480.0, w: 90.0, h: 14.0 },
    Rect { x: 50.0, y: 1370.0, w: 110.0, h: 14.0 },
    Rect { x: 260.0, y: 1260.0, w: 100.0, h: 14.0 },
    Rect { x: 120.0, y: 1150.0, w: 90.0, h: 14.0 },
    Rect { x: 300.0, y: 1040.0, w: 100.0, h: 14.0 },
    Rect { x: 40.0, y: 930.0, w: 120.0, h: 14.0 },
    Rect { x: 220.0, y: 820.0, w: 110.0, h: 14.0 },
    Rect { x: 80.0, y: 710.0, w: 100.0, h: 14.0 },
    Rect { x: 280.0, y: 600.0, w: 120.0, h: 14.0 },
    Rect { x: 140.0, y: 490.0, w: 100.0, h: 14.0 },
    Rect { x: 320.0, y: 380.0, w: 90.0, h: 14.0 },
    Rect { x: 60.0, y: 270.0, w: 110.0, h: 14.0 },
    Rect { x: 40.0, y: 220.0, w: 95.0, h: 12.0 },
    Rect { x: 200.0, y: 160.0, w: 180.0, h: 20.0 },
];
struct MovDef { x: f32, y: f32, w: f32, h: f32, min: f32, max: f32, dir: f32 }
const MOVING_DEFS: [MovDef; 8] = [
    MovDef { x: 50.0, y: 980.0, w: 100.0, h: 14.0, min: 35.0, max: 310.0, dir: 1.0 },
    MovDef { x: 220.0, y: 880.0, w: 90.0, h: 14.0, min: 70.0, max: 340.0, dir: -1.0 },
    MovDef { x: 60.0, y: 780.0, w: 110.0, h: 14.0, min: 40.0, max: 300.0, dir: 1.0 },
    MovDef { x: 250.0, y: 680.0, w: 85.0, h: 14.0, min: 90.0, max: 350.0, dir: -1.0 },
    MovDef { x: 45.0, y: 560.0, w: 100.0, h: 14.0, min: 30.0, max: 290.0, dir: 1.0 },
    MovDef { x: 230.0, y: 460.0, w: 95.0, h: 14.0, min: 80.0, max: 330.0, dir: -1.0 },
    MovDef { x: 70.0, y: 350.0, w: 90.0, h: 14.0, min: 50.0, max: 280.0, dir: 1.0 },
    MovDef { x: 210.0, y: 220.0, w: 110.0, h: 14.0, min: 60.0, max: 320.0, dir: -1.0 },
];
struct EnDef { x: f32, y: f32, dir: f32, min: f32, max: f32 }
const ENEMY_DEFS: [EnDef; 12] = [
    EnDef { x: 55.0, y: 1700.0, dir: 1.0, min: 35.0, max: 115.0 },
    EnDef { x: 190.0, y: 1590.0, dir: -1.0, min: 175.0, max: 265.0 },
    EnDef { x: 320.0, y: 1480.0, dir: 1.0, min: 315.0, max: 395.0 },
    EnDef { x: 70.0, y: 1370.0, dir: 1.0, min: 55.0, max: 155.0 },
    EnDef { x: 275.0, y: 1260.0, dir: -1.0, min: 265.0, max: 355.0 },
    EnDef { x: 135.0, y: 1150.0, dir: 1.0, min: 125.0, max: 205.0 },
    EnDef { x: 310.0, y: 1040.0, dir: -1.0, min: 305.0, max: 395.0 },
    EnDef { x: 90.0, y: 710.0, dir: 1.0, min: 85.0, max: 175.0 },
    EnDef { x: 165.0, y: 490.0, dir: 1.0, min: 155.0, max: 225.0 },
    EnDef { x: 355.0, y: 380.0, dir: -1.0, min: 335.0, max: 400.0 },
    EnDef { x: 100.0, y: 270.0, dir: 1.0, min: 72.0, max: 158.0 },
    EnDef { x: 75.0, y: 220.0, dir: 1.0, min: 48.0, max: 122.0 },
];
struct DiaDef { x: f32, y: f32, respawn: i32 }
const DIAMOND_DEFS: [DiaDef; 5] = [
    DiaDef { x: 420.0, y: 1775.0, respawn: 1 },
    DiaDef { x: 300.0, y: 1455.0, respawn: 1 },
    DiaDef { x: 130.0, y: 1125.0, respawn: 0 },
    DiaDef { x: 300.0, y: 715.0, respawn: 0 },
    DiaDef { x: 200.0, y: 475.0, respawn: 0 },
];

// the HUD 3x5 numeral glyphs (X = lit), packed as bit rows (bit2 bit1 bit0 = cols)
const HUD_DIGITS: [[u8; 5]; 10] = [
    [0b111, 0b101, 0b101, 0b101, 0b111],
    [0b010, 0b110, 0b010, 0b010, 0b111],
    [0b111, 0b001, 0b111, 0b100, 0b111],
    [0b111, 0b001, 0b111, 0b001, 0b111],
    [0b101, 0b101, 0b111, 0b001, 0b001],
    [0b111, 0b100, 0b111, 0b001, 0b111],
    [0b111, 0b100, 0b111, 0b101, 0b111],
    [0b111, 0b001, 0b001, 0b001, 0b001],
    [0b111, 0b101, 0b111, 0b101, 0b111],
    [0b111, 0b101, 0b111, 0b001, 0b111],
];

// ===== asset paths + audio cues (guest memory; passed as ptr+len) ============
const P_ATLAS: [&[u8]; 2] = [b"p1.atlas", b"p2.atlas"];
const S_ATLAS: [&[u8]; 2] = [b"p1_super.atlas", b"p2_super.atlas"];
const EN_ATLAS_PATH: &[u8] = b"enemy.atlas";
const MODEL_PATH: &[u8] = b"models/diamond.glb";
const SUMMIT_MUSIC: &[u8] =
    b"tempo 152\nbeats 4/4\n\n@melody piano\n0.5:E4 0.5:G4 1:A4 1:G4 1:E4\n0.5:D4 0.5:E4 1:G4 2:E4\n0.5:E4 0.5:G4 1:A4 1:C5 1:B4\n1:A4 1:G4 2:E4\n";
const V_CELEBRATE: &[u8] = b"celebrate";
const V_CHEER: &[u8] = b"cheer";
const V_BRICK: &[u8] = b"brick";
const V_BOUNCE: &[u8] = b"bounce";
const V_CHUCKLE: &[u8] = b"chuckle";
const V_GASP: &[u8] = b"gasp";
const V_WIN: &[u8] = b"win";
const V_LOSE: &[u8] = b"lose";
const V_WALL: &[u8] = b"wall";

// ===== guest-local ids =======================================================
const LAYER: i32 = 1;
const CAM: [i32; 2] = [2, 3];
const CLIP: i32 = 4;
const CEL_SFX: i32 = 5;
const EN_ATLAS: i32 = 6;
fn p_sprite(slot: usize) -> i32 { 10 + slot as i32 * 2 } // 10,12
fn p_super_sprite(slot: usize) -> i32 { 11 + slot as i32 * 2 } // 11,13
fn p_atlas(slot: usize) -> i32 { 20 + slot as i32 } // 20,21
fn s_atlas(slot: usize) -> i32 { 22 + slot as i32 } // 22,23
fn en_sprite(i: usize) -> i32 { 40 + i as i32 } // 40..51
// diamond i: 12 ids from base 60 + i*12
fn dia_base(i: usize) -> i32 { 60 + i as i32 * 12 }
fn dia_scene(i: usize) -> i32 { dia_base(i) }
fn dia_cam(i: usize) -> i32 { dia_base(i) + 1 }
fn dia_mesh(i: usize) -> i32 { dia_base(i) + 2 }
fn dia_rt(i: usize) -> i32 { dia_base(i) + 8 }
fn dia_sprite(i: usize) -> i32 { dia_base(i) + 9 }

// ===== state =================================================================
#[derive(Clone, Copy)]
struct Player {
    slot: usize,
    x: f32, y: f32, vx: f32, vy: f32,
    grounded: i32, facing: f32,
    jump_hold_ms: f32, jump_held: i32,
    last_ground_feet: f32,
    done: i32, finish_ms: f32, finish_pulse_ms: f32, celebrate_bursts: i32,
    super_ms: f32, on_mover: i32, anim_tick: f32,
}
#[derive(Clone, Copy)]
struct MovPlat { x: f32, y: f32, w: f32, h: f32, min: f32, max: f32, dir: f32, vx: f32 }
#[derive(Clone, Copy)]
struct Enemy { x: f32, y: f32, dir: f32, min: f32, max: f32, tick: f32, alive: i32 }
#[derive(Clone, Copy)]
struct Diamond { x: f32, y: f32, respawn: i32, taken: i32, angle: f32 }
#[derive(Clone, Copy)]
struct Fx { x: f32, y: f32, vx: f32, vy: f32, life: f32, rad: f32, r: i32, g: i32, b: i32 }

const MAX_FX: usize = 96;
struct Game {
    players: [Player; 2],
    movers: [MovPlat; 8],
    enemies: [Enemy; 12],
    diamonds: [Diamond; 5],
    fx: [Fx; MAX_FX],
    fx_n: usize,
    summit_started: i32,
}

// command buffer sized for the busiest frame (sky bands + platforms + sprites +
// enemies + diamonds + HUD + presents).
const MAX_REC: usize = 512;
static mut BUF: [i32; RGC1_HDR + RGC1_WORDS * MAX_REC] = [0; RGC1_HDR + RGC1_WORDS * MAX_REC];
static mut RESULT: [i32; 256] = [0; 256];
static mut INPUT: [i32; 8] = [0; 8];

static mut GAME: Game = Game {
    players: [Player {
        slot: 0, x: 120.0, y: 1830.0 - PLAYER_H, vx: 0.0, vy: 0.0, grounded: 1, facing: 1.0,
        jump_hold_ms: -1.0, jump_held: 0, last_ground_feet: 1830.0, done: 0, finish_ms: 0.0,
        finish_pulse_ms: 0.0, celebrate_bursts: 0, super_ms: 0.0, on_mover: -1, anim_tick: 0.0,
    }; 2],
    movers: [MovPlat { x: 0.0, y: 0.0, w: 0.0, h: 0.0, min: 0.0, max: 0.0, dir: 0.0, vx: 0.0 }; 8],
    enemies: [Enemy { x: 0.0, y: 0.0, dir: 0.0, min: 0.0, max: 0.0, tick: 0.0, alive: 1 }; 12],
    diamonds: [Diamond { x: 0.0, y: 0.0, respawn: 0, taken: 0, angle: 0.6 }; 5],
    fx: [Fx { x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, life: 0.0, rad: 0.0, r: 0, g: 0, b: 0 }; MAX_FX],
    fx_n: 0,
    summit_started: 0,
};

#[no_mangle]
pub extern "C" fn cmd_ptr() -> i32 { core::ptr::addr_of!(BUF) as i32 }
#[no_mangle]
pub extern "C" fn result_ptr() -> i32 { core::ptr::addr_of!(RESULT) as i32 }
#[no_mangle]
pub extern "C" fn input_ptr() -> i32 { core::ptr::addr_of!(INPUT) as i32 }

// ===== helpers (verbatim logic) ==============================================
fn overlaps_x(px: f32, pw: f32, rx: f32, rw: f32) -> bool {
    if px + pw <= rx { return false; }
    if px >= rx + rw { return false; }
    true
}
fn jump_max_v(super_ms: f32) -> f32 { if super_ms > 0.0 { JUMP_SUPER_MAX_V } else { JUMP_MAX_V } }
fn jump_hold_max_ms(super_ms: f32) -> f32 { if super_ms > 0.0 { JUMP_HOLD_MAX_SUPER_MS } else { JUMP_HOLD_MAX_MS } }
fn show_super_sprite(p: &Player) -> bool {
    if p.super_ms <= 0.0 { return false; }
    if p.super_ms > SUPER_WARN_MS { return true; }
    let phase = (p.super_ms / SUPER_BLINK_MS) as i32;
    phase % 2 == 1
}
fn celebrate_y_offset(anim_tick: f32) -> f32 {
    let t = anim_tick / 200.0;
    sinf(t) * 12.0 + sinf(t * 2.7) * 5.0
}
fn hit_pickup(px: f32, py: f32, fx: f32, fy: f32) -> bool {
    let dx = px - fx;
    let dy = py - fy;
    dx * dx + dy * dy <= 18.0 * 18.0
}
// enemy collision kind: 0 none, 1 stomp, 2 hurt
fn enemy_collision_kind(px: f32, py: f32, pvy: f32, ex: f32, ey: f32) -> i32 {
    let dx = px - ex;
    let dy = py - ey;
    if dx < -18.0 || dx > 18.0 || dy < -16.0 || dy > 16.0 { return 0; }
    if pvy > 0.0 && py < ey + 16.0 { return 1; }
    2
}

fn game() -> &'static mut Game { unsafe { &mut *core::ptr::addr_of_mut!(GAME) } }
fn input_down(slot: usize) -> i32 { unsafe { INPUT[slot * 2] } }
fn bit(mask: i32, b: i32) -> bool { mask & b != 0 }

// ===== FX ====================================================================
fn spawn_burst(g: &mut Game, x: f32, y: f32, count: i32, r: i32, gg: i32, b: i32) {
    let mut i = 0;
    while i < count {
        if g.fx_n >= MAX_FX { break; }
        let ang = (i as f32 / count as f32) * 6.28318;
        g.fx[g.fx_n] = Fx {
            x: x + cosf(ang) * 6.0,
            y: y + sinf(ang) * 4.0,
            vx: cosf(ang) * 0.06,
            vy: sinf(ang) * 0.04 - 0.05,
            life: 420.0,
            rad: 3.0 + (i % 3) as f32,
            r, g: gg, b,
        };
        g.fx_n += 1;
        i += 1;
    }
}
fn spawn_finish_particles(g: &mut Game, x: f32, y: f32) {
    spawn_burst(g, x, y - 32.0, 10, 255, 220, 90);
    spawn_burst(g, x - 22.0, y - 16.0, 6, 255, 160, 80);
    spawn_burst(g, x + 22.0, y - 16.0, 6, 120, 220, 255);
}
fn spawn_celebrate_pulse(g: &mut Game, slot: usize, burst: i32) {
    let pl = g.players[slot];
    let phase = burst % 4;
    let hop = if pl.finish_ms < FINISH_CELEBRATE_MS { celebrate_y_offset(pl.anim_tick) } else { 0.0 };
    let px = pl.x + PLAYER_W / 2.0;
    let py = pl.y + PLAYER_H - hop;
    if phase == 0 {
        spawn_burst(g, px, py - 30.0, 8, 255, 230, 120);
    } else if phase == 1 {
        spawn_burst(g, px - 18.0, py - 22.0, 5, 255, 140, 90);
        spawn_burst(g, px + 18.0, py - 22.0, 5, 255, 140, 90);
    } else if phase == 2 {
        spawn_burst(g, px - 10.0, py - 26.0, 5, 140, 230, 255);
        spawn_burst(g, px + 10.0, py - 26.0, 5, 140, 230, 255);
    } else {
        spawn_burst(g, px, py - 34.0, 6, 255, 255, 180);
    }
}
fn update_fx(g: &mut Game, dt: f32) {
    let mut w = 0;
    let mut i = 0;
    while i < g.fx_n {
        let mut p = g.fx[i];
        p.life -= dt;
        if p.life > 0.0 {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.0002 * dt;
            g.fx[w] = p;
            w += 1;
        }
        i += 1;
    }
    g.fx_n = w;
}

// ===== audio (playSfx and playVoice both go through rgcore_vocal) ============
fn vocal(cb: &mut RgCmdBuf, cue: &[u8]) { cb.rgcore_vocal(cue.as_ptr() as i32, cue.len() as i32); }
fn rumble(cb: &mut RgCmdBuf, slot: usize, strength: i32, ms: i32) {
    cb.rgcore_input_rumble(slot as i32, strength, ms);
}

// ===== init ==================================================================
#[no_mangle]
pub extern "C" fn init() -> i32 {
    let g = game();
    // players
    g.players[0].slot = 0; g.players[0].x = 120.0; g.players[0].facing = 1.0;
    g.players[1].slot = 1; g.players[1].x = 330.0; g.players[1].facing = -1.0;
    // movers, enemies, diamonds from the level tables
    let mut i = 0;
    while i < 8 {
        let m = &MOVING_DEFS[i];
        g.movers[i] = MovPlat { x: m.x, y: m.y, w: m.w, h: m.h, min: m.min, max: m.max, dir: m.dir, vx: MOVING_PLAT_SPEED * m.dir };
        i += 1;
    }
    i = 0;
    while i < 12 {
        let d = &ENEMY_DEFS[i];
        g.enemies[i] = Enemy { x: d.x, y: d.y, dir: d.dir, min: d.min, max: d.max, tick: 0.0, alive: 1 };
        i += 1;
    }
    i = 0;
    while i < 5 {
        let d = &DIAMOND_DEFS[i];
        g.diamonds[i] = Diamond { x: d.x, y: d.y, respawn: d.respawn, taken: 0, angle: 0.6 };
        i += 1;
    }

    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });
    // split-screen + world layer + two follow cameras
    cb.rgcore_surface_set_layout(2); // split-vertical
    cb.rgcore_surface_pane_player(0, 0);
    cb.rgcore_surface_pane_player(1, 1);
    cb.rg2d_layer_create(LAYER);
    cb.rg2d_camera_create(CAM[0]);
    cb.rg2d_camera_create(CAM[1]);
    // celebrate one-shot source (clip != source, D-LIFE)
    // schema: (freqHz:d, durationMs:i, volume:d, wave:i) — defaults match
    // ranger_core.tsx AudioClip (440 Hz / 80 ms / 0.35 / wave 0).
    cb.rgcore_audio_clip_create(CLIP, 440.0, 80, 0.35, 0);
    cb.rgcore_audio_source_create(CEL_SFX, CLIP);

    // player sprites: LPC walk + super sheet, one per player
    let mut s = 0;
    while s < 2 {
        let row = if g.players[s].facing < 0.0 { SHEET_ROW_LEFT } else { SHEET_ROW_RIGHT };
        cb.rgcore_assets_load_atlas(p_atlas(s), P_ATLAS[s].as_ptr() as i32, P_ATLAS[s].len() as i32);
        cb.rg2d_sprite_create(p_sprite(s), p_atlas(s), 0);
        cb.rg2d_sprite_set_size(p_sprite(s), PLAYER_H, PLAYER_H);
        cb.rg2d_sprite_set_z(p_sprite(s), 3);
        cb.rg2d_sprite_set_cell(p_sprite(s), 0, row);
        cb.rg2d_sprite_set_pane(p_sprite(s), s as i32);
        cb.rg2d_layer_add(p_sprite(s), LAYER);

        cb.rgcore_assets_load_atlas(s_atlas(s), S_ATLAS[s].as_ptr() as i32, S_ATLAS[s].len() as i32);
        cb.rg2d_sprite_create(p_super_sprite(s), s_atlas(s), 0);
        cb.rg2d_sprite_set_size(p_super_sprite(s), PLAYER_H, PLAYER_H);
        cb.rg2d_sprite_set_z(p_super_sprite(s), 3);
        cb.rg2d_sprite_set_cell(p_super_sprite(s), 0, row);
        cb.rg2d_sprite_set_pane(p_super_sprite(s), s as i32);
        cb.rg2d_sprite_set_pos(p_super_sprite(s), -1000.0, -1000.0);
        cb.rg2d_layer_add(p_super_sprite(s), LAYER);
        s += 1;
    }

    // enemies: shared LPC skeleton sheet, one retained sprite each
    cb.rgcore_assets_load_atlas(EN_ATLAS, EN_ATLAS_PATH.as_ptr() as i32, EN_ATLAS_PATH.len() as i32);
    i = 0;
    while i < 12 {
        cb.rg2d_sprite_create(en_sprite(i), EN_ATLAS, 0);
        cb.rg2d_sprite_set_size(en_sprite(i), 40.0, 40.0);
        cb.rg2d_sprite_set_z(en_sprite(i), 2);
        let row = if g.enemies[i].dir > 0.0 { SHEET_ROW_RIGHT } else { SHEET_ROW_LEFT };
        cb.rg2d_sprite_set_cell(en_sprite(i), 0, row);
        cb.rg2d_layer_add(en_sprite(i), LAYER);
        i += 1;
    }

    // 3D diamonds: each a lit gem rendered to a target-backed 2D sprite (the same
    // SceneSprite3D composition as makeDiamondSprite), positioned at its world spot.
    i = 0;
    while i < 5 {
        build_diamond(&mut cb, i);
        cb.rg2d_sprite_set_pos(dia_sprite(i), g.diamonds[i].x, g.diamonds[i].y);
        cb.rg2d_layer_add(dia_sprite(i), LAYER);
        i += 1;
    }
    cb.finish()
}

fn build_diamond(cb: &mut RgCmdBuf, i: usize) {
    let base = dia_base(i);
    cb.rg3d_scene_create(dia_scene(i));
    cb.rg3d_light_ambient(base + 3, 0x00FF_FFFF, 0.38);
    cb.rg3d_light_directional(base + 4, 0x00FF_FFFF, 1.25, 0.4, 1.2, 0.5);
    cb.rg3d_light_directional(base + 5, 0x00C0_FFFF, 0.55, -0.85, 0.3, -0.5);
    cb.rg3d_light_directional(base + 6, 0x00E0_FFFF, 0.7, -0.3, 0.4, -1.0);
    cb.rg3d_light_directional(base + 7, 0x00A0_A0A0, 0.55, 0.2, -1.0, 0.3);
    cb.rg3d_camera_create(dia_cam(i));
    cb.rg3d_camera_set(dia_cam(i), 32.0, 0.55, 0.5, 40.0);
    cb.rg3d_camera_pose(dia_cam(i), 0.0, 0.0, 3.8, 0.0, 0.0, 0.0);
    cb.rg3d_model_load(dia_mesh(i), MODEL_PATH.as_ptr() as i32, MODEL_PATH.len() as i32);
    cb.rg3d_mesh_transform(dia_mesh(i), 0.0, 0.0, 0.0, 0.12, 0.6, 0.08);
    cb.rg3d_mesh_set_scale(dia_mesh(i), 1.55, 1.55, 1.55);
    cb.rg3d_entity_set_parent(dia_mesh(i), dia_scene(i));
    cb.rgcore_graphics_rt_create(dia_rt(i), GEM_W, GEM_H);
    cb.rg2d_sprite_create_tex(dia_sprite(i), dia_rt(i));
    cb.rg2d_sprite_set_size(dia_sprite(i), GEM_W as f32, GEM_H as f32);
    cb.rg2d_sprite_set_z(dia_sprite(i), 5);
}

// ===== per-player update =====================================================
fn respawn_player(g: &mut Game, slot: usize) {
    let start_x = if slot == 0 { 120.0 } else { 330.0 };
    let p = &mut g.players[slot];
    p.x = start_x; p.y = 1830.0 - PLAYER_H; p.vx = 0.0; p.vy = 0.0; p.grounded = 1;
    p.facing = if slot == 0 { 1.0 } else { -1.0 };
    p.jump_hold_ms = -1.0; p.jump_held = 0; p.last_ground_feet = 1830.0; p.on_mover = -1;
    p.super_ms = 0.0; p.anim_tick = 0.0;
}
fn respawn_marked_diamonds(g: &mut Game) {
    let mut i = 0;
    while i < 5 {
        if g.diamonds[i].respawn == 1 && g.diamonds[i].taken == 1 { g.diamonds[i].taken = 0; }
        i += 1;
    }
}
fn goal_platform() -> &'static Rect { &PLATFORMS[GOAL_INDEX] }

fn enter_finish(cb: &mut RgCmdBuf, g: &mut Game, slot: usize) {
    if g.players[slot].done == 1 { return; }
    let gp = goal_platform();
    let feet_y = gp.y;
    let cx = if slot == 1 { gp.x + gp.w * 0.62 - PLAYER_W / 2.0 } else { gp.x + gp.w * 0.38 - PLAYER_W / 2.0 };
    {
        let p = &mut g.players[slot];
        p.x = cx; p.y = feet_y - PLAYER_H; p.vx = 0.0; p.vy = 0.0; p.grounded = 1; p.on_mover = -1;
        p.jump_hold_ms = -1.0; p.facing = if slot == 1 { -1.0 } else { 1.0 };
        p.done = 1; p.finish_ms = 0.0; p.finish_pulse_ms = 0.0; p.celebrate_bursts = 0;
    }
    cb.rgcore_audio_one_shot(CEL_SFX);
    vocal(cb, V_CELEBRATE);
    vocal(cb, V_CHEER);
    rumble(cb, slot, 125, 220);
    spawn_finish_particles(g, cx + PLAYER_W / 2.0, feet_y);
    if g.summit_started == 0 {
        g.summit_started = 1;
        cb.rgcore_music_play(SUMMIT_MUSIC.as_ptr() as i32, SUMMIT_MUSIC.len() as i32);
    }
}

fn update_movers(g: &mut Game, dt: f32) {
    let mut i = 0;
    while i < 8 {
        let m = &mut g.movers[i];
        m.x += MOVING_PLAT_SPEED * m.dir * dt;
        if m.x < m.min { m.x = m.min; m.dir = 1.0; }
        if m.x + m.w > m.max { m.x = m.max - m.w; m.dir = -1.0; }
        m.vx = MOVING_PLAT_SPEED * m.dir;
        i += 1;
    }
}

fn update_player(cb: &mut RgCmdBuf, g: &mut Game, slot: usize, dt: f32) {
    let down = input_down(slot);
    let left = bit(down, 1);
    let right = bit(down, 2);
    let jump = bit(down, 4);

    if g.players[slot].super_ms > 0.0 {
        g.players[slot].super_ms -= dt;
        if g.players[slot].super_ms < 0.0 { g.players[slot].super_ms = 0.0; }
    }
    let pl_super = g.players[slot].super_ms;
    let max_v = jump_max_v(pl_super);
    let hold_max = jump_hold_max_ms(pl_super);

    let mut p = g.players[slot];
    p.vx = 0.0;
    if left { p.vx = -MOVE; p.facing = -1.0; }
    if right { p.vx = MOVE; p.facing = 1.0; }
    p.x += p.vx * dt;
    if p.x < 0.0 { p.x = 0.0; }
    if p.x > BASE_W - PLAYER_W { p.x = BASE_W - PLAYER_W; }

    p.vy += GRAV * dt;
    let fall_vy = p.vy;

    if jump {
        if p.grounded == 1 {
            if p.jump_held == 0 {
                p.vy = -JUMP_MIN_V; p.grounded = 0; p.on_mover = -1; p.jump_hold_ms = 0.0;
                vocal(cb, V_BOUNCE);
            }
        } else if p.jump_hold_ms >= 0.0 && p.jump_hold_ms < hold_max && p.vy < 0.0 {
            p.vy -= JUMP_HOLD_LIFT * dt;
            if p.vy < -max_v { p.vy = -max_v; }
            p.jump_hold_ms += dt;
        }
    } else {
        if p.jump_hold_ms > 0.0 && p.vy < 0.0 { p.vy *= JUMP_CUT; }
        p.jump_hold_ms = -1.0;
    }
    p.jump_held = if jump { 1 } else { 0 };

    let prev_feet = p.y + PLAYER_H;
    let mut new_y = p.y + p.vy * dt;
    let new_feet = new_y + PLAYER_H;
    let was_airborne = if p.grounded == 0 { 1 } else { 0 };
    p.grounded = 0;
    p.on_mover = -1;
    let mut hit_goal = false;
    if p.vy >= 0.0 {
        let mut i = 0;
        while i < 17 {
            let pf = &PLATFORMS[i];
            if overlaps_x(p.x, PLAYER_W, pf.x, pf.w) && prev_feet <= pf.y + 4.0 && new_feet >= pf.y {
                new_y = pf.y - PLAYER_H; p.vy = 0.0; p.grounded = 1; p.last_ground_feet = pf.y;
                if i == GOAL_INDEX { hit_goal = true; }
            }
            i += 1;
        }
        let mut k = 0;
        while k < 8 {
            let m = g.movers[k];
            if overlaps_x(p.x, PLAYER_W, m.x, m.w) && prev_feet <= m.y + 4.0 && new_feet >= m.y {
                new_y = m.y - PLAYER_H; p.vy = 0.0; p.grounded = 1; p.on_mover = k as i32; p.last_ground_feet = m.y;
            }
            k += 1;
        }
    }
    p.y = new_y;

    if p.grounded == 1 && p.on_mover >= 0 {
        let m = g.movers[p.on_mover as usize];
        p.x += m.vx * dt;
        if p.x < 0.0 { p.x = 0.0; }
        if p.x > BASE_W - PLAYER_W { p.x = BASE_W - PLAYER_W; }
        if !overlaps_x(p.x, PLAYER_W, m.x, m.w) { p.grounded = 0; p.on_mover = -1; }
    }

    if p.grounded == 1 && was_airborne == 1 && fall_vy > 0.12 { vocal(cb, V_WALL); }

    let mut do_finish = false;
    if p.done == 0 && p.y + PLAYER_H <= goal_platform().y + 22.0 { do_finish = true; }

    let mut do_respawn = false;
    if p.y > WORLD_H { do_respawn = true; }

    if p.vx != 0.0 { p.anim_tick += dt; }
    g.players[slot] = p;

    if hit_goal || do_finish { enter_finish(cb, g, slot); }
    if do_respawn {
        respawn_player(g, slot);
        respawn_marked_diamonds(g);
        vocal(cb, V_LOSE);
        vocal(cb, V_GASP);
    }
    seat_player_sprites(cb, g, slot);
}

fn stomp_bounce(g: &mut Game, slot: usize, ey: f32) {
    let p = &mut g.players[slot];
    p.y = ey - 2.0 - PLAYER_H; p.vy = -JUMP_MAX_V * 0.55; p.grounded = 0; p.on_mover = -1; p.jump_hold_ms = 0.0;
}
fn apply_enemy_hits(cb: &mut RgCmdBuf, g: &mut Game, slot: usize) {
    if g.players[slot].done == 1 { return; }
    let px = g.players[slot].x + PLAYER_W / 2.0;
    let py = g.players[slot].y + PLAYER_H;
    let pvy = g.players[slot].vy;
    let super_on = g.players[slot].super_ms > 0.0;
    let mut ei = 0;
    while ei < 12 {
        if g.enemies[ei].alive == 1 {
            let e = g.enemies[ei];
            let kind = enemy_collision_kind(px, py, pvy, e.x, e.y);
            if kind == 1 {
                g.enemies[ei].alive = 0;
                stomp_bounce(g, slot, e.y);
                vocal(cb, V_BRICK); vocal(cb, V_BOUNCE); vocal(cb, V_CHUCKLE);
                rumble(cb, slot, 70, 90);
                spawn_burst(g, e.x, e.y - 10.0, 6, 220, 220, 220);
            } else if kind == 2 {
                if super_on {
                    g.enemies[ei].alive = 0;
                    vocal(cb, V_BRICK);
                    rumble(cb, slot, 47, 60);
                    spawn_burst(g, e.x, e.y - 10.0, 8, 120, 230, 255);
                } else {
                    respawn_player(g, slot);
                    respawn_marked_diamonds(g);
                    vocal(cb, V_LOSE); vocal(cb, V_GASP);
                    rumble(cb, slot, 156, 280);
                    break;
                }
            }
        }
        ei += 1;
    }
}
fn collect_diamonds(cb: &mut RgCmdBuf, g: &mut Game, slot: usize) {
    if g.players[slot].done == 1 { return; }
    let px = g.players[slot].x + PLAYER_W / 2.0;
    let py = g.players[slot].y + PLAYER_H;
    let mut i = 0;
    while i < 5 {
        if g.diamonds[i].taken == 0 && hit_pickup(px, py, g.diamonds[i].x, g.diamonds[i].y) {
            g.diamonds[i].taken = 1;
            g.players[slot].super_ms = SUPER_MS;
            vocal(cb, V_WIN);
            rumble(cb, slot, 110, 160);
            spawn_burst(g, g.diamonds[i].x, g.diamonds[i].y, 10, 120, 230, 255);
        }
        i += 1;
    }
}

fn tick_finish_player(cb: &mut RgCmdBuf, g: &mut Game, slot: usize, dt: f32) {
    g.players[slot].finish_ms += dt;
    g.players[slot].anim_tick += dt;
    if g.players[slot].finish_ms <= FINISH_PARTICLE_MS {
        g.players[slot].finish_pulse_ms += dt;
        if g.players[slot].finish_pulse_ms >= CELEBRATE_INTERVAL {
            g.players[slot].finish_pulse_ms = 0.0;
            g.players[slot].celebrate_bursts += 1;
            let b = g.players[slot].celebrate_bursts;
            spawn_celebrate_pulse(g, slot, b);
        }
    } else {
        g.players[slot].finish_pulse_ms = 0.0;
    }
    let feet_y = goal_platform().y;
    let fm = g.players[slot].finish_ms;
    if fm < FINISH_CELEBRATE_MS {
        let off = celebrate_y_offset(g.players[slot].anim_tick);
        g.players[slot].y = feet_y - PLAYER_H - off;
        g.players[slot].vx = 0.0;
    } else if fm < FINISH_PHASE_DONE {
        // tickGoalWalk
        let gp = goal_platform();
        let min_x = gp.x + 18.0;
        let max_x = gp.x + gp.w - 18.0 - PLAYER_W;
        let mut x = g.players[slot].x;
        let mut face = g.players[slot].facing;
        if face == 0.0 { face = 1.0; }
        let speed = MOVE * 0.9;
        x += face * speed * dt;
        if x < min_x { x = min_x; face = 1.0; }
        if x > max_x { x = max_x; face = -1.0; }
        g.players[slot].x = x; g.players[slot].facing = face;
        g.players[slot].y = feet_y - PLAYER_H;
        g.players[slot].vx = MOVE * 0.9 * face;
    } else {
        g.players[slot].y = feet_y - PLAYER_H;
        g.players[slot].vx = 0.0;
    }
    g.players[slot].vy = 0.0;
    g.players[slot].grounded = 1;
    seat_player_sprites(cb, g, slot);
}

fn seat_player_sprites(cb: &mut RgCmdBuf, g: &mut Game, slot: usize) {
    let pl = g.players[slot];
    let sx = pl.x + PLAYER_W / 2.0;
    let sy = pl.y + PLAYER_H / 2.0 + 3.0;
    let super_on = show_super_sprite(&pl);
    if super_on {
        cb.rg2d_sprite_set_pos(p_sprite(slot), -1000.0, -1000.0);
        cb.rg2d_sprite_set_pos(p_super_sprite(slot), sx, sy);
    } else {
        cb.rg2d_sprite_set_pos(p_sprite(slot), sx, sy);
        cb.rg2d_sprite_set_pos(p_super_sprite(slot), -1000.0, -1000.0);
    }
    let row = if pl.facing < 0.0 { SHEET_ROW_LEFT } else { SHEET_ROW_RIGHT };
    let mut col = 0;
    if pl.done == 1 {
        if pl.finish_ms < FINISH_CELEBRATE_MS {
            col = (floorf(pl.anim_tick / 90.0) as i32) % 9;
        } else if pl.finish_ms < FINISH_PHASE_DONE {
            col = (floorf(pl.anim_tick / 70.0) as i32) % 9;
        } else {
            col = 0;
        }
    } else if pl.grounded == 0 {
        col = SHEET_JUMP_COL;
    } else if pl.vx != 0.0 {
        col = (floorf(pl.anim_tick / 70.0) as i32) % 9;
    }
    cb.rg2d_sprite_set_cell(p_sprite(slot), col, row);
    cb.rg2d_sprite_set_cell(p_super_sprite(slot), col, row);
}

fn update_enemies(cb: &mut RgCmdBuf, g: &mut Game, dt: f32) {
    let mut i = 0;
    while i < 12 {
        if g.enemies[i].alive == 0 {
            cb.rg2d_sprite_set_pos(en_sprite(i), -1000.0, -1000.0);
        } else {
            let e = &mut g.enemies[i];
            e.x += e.dir * dt * 0.08;
            if e.x < e.min { e.x = e.min; e.dir = 1.0; }
            if e.x > e.max { e.x = e.max; e.dir = -1.0; }
            e.tick += dt;
            let anim = (floorf(e.tick / 110.0) as i32) % (ENEMY_WALK_FRAMES as i32);
            let row = if e.dir < 0.0 { SHEET_ROW_LEFT } else { SHEET_ROW_RIGHT };
            cb.rg2d_sprite_set_pos(en_sprite(i), e.x, e.y - 14.0);
            cb.rg2d_sprite_set_cell(en_sprite(i), anim, row);
        }
        i += 1;
    }
}

fn update_diamonds(cb: &mut RgCmdBuf, g: &mut Game, dt: f32) {
    let mut i = 0;
    while i < 5 {
        if g.diamonds[i].taken == 0 {
            g.diamonds[i].angle += dt * 0.002;
            let a = g.diamonds[i].angle;
            cb.rg3d_mesh_transform(dia_mesh(i), 0.0, 0.0, 0.0, 0.12, a, 0.08);
            cb.rg3d_mesh_set_scale(dia_mesh(i), 1.55, 1.55, 1.55);
            cb.rg3d_render_to(dia_scene(i), dia_cam(i), dia_rt(i), GEM_W, GEM_H);
            cb.rg2d_sprite_set_pos(dia_sprite(i), g.diamonds[i].x, g.diamonds[i].y);
        } else {
            cb.rg2d_sprite_set_pos(dia_sprite(i), -1000.0, -1000.0);
        }
        i += 1;
    }
}

// ===== rendering: static environment + HUD ===================================
fn draw_platform(cb: &mut RgCmdBuf, x: f32, y: f32, w: f32, h: f32) {
    cb.rg2d_bg_rect(x, y, w, h, 72, 150, 64);
    cb.rg2d_bg_rect(x, y, w, PLAT_EDGE_H, 110, 190, 86);
    cb.rg2d_bg_rect(x, y + h - PLAT_EDGE_H, w, PLAT_EDGE_H, 42, 96, 38);
}
fn draw_cloud(cb: &mut RgCmdBuf, cx: f32, cy: f32) {
    cb.rg2d_bg_circle(cx, cy, 14.0, 240, 245, 255);
    cb.rg2d_bg_circle(cx - 16.0, cy + 4.0, 10.0, 235, 240, 250);
    cb.rg2d_bg_circle(cx + 16.0, cy + 4.0, 10.0, 235, 240, 250);
}
fn draw_static_env(cb: &mut RgCmdBuf, g: &Game) {
    cb.rg2d_bg_begin();
    let mut y = 0.0f32;
    while y < WORLD_H {
        let t = y / WORLD_H;
        let sr = (30.0 + t * 50.0) as i32;
        let sg = (70.0 + t * 90.0) as i32;
        let sb = (140.0 + t * 60.0) as i32;
        cb.rg2d_bg_rect(-260.0, y, 1000.0, 32.0, sr, sg, sb);
        y += 32.0;
    }
    draw_cloud(cb, 80.0, 1500.0);
    draw_cloud(cb, 360.0, 1300.0);
    draw_cloud(cb, 120.0, 980.0);
    draw_cloud(cb, 300.0, 560.0);
    draw_cloud(cb, 90.0, 300.0);
    let mut i = 0;
    while i < 17 { let p = &PLATFORMS[i]; draw_platform(cb, p.x, p.y, p.w, p.h); i += 1; }
    i = 0;
    while i < 8 { let m = g.movers[i]; draw_platform(cb, m.x, m.y, m.w, m.h); i += 1; }
    // goal flag
    let gp = &PLATFORMS[GOAL_INDEX];
    let fx = gp.x + gp.w / 2.0;
    cb.rg2d_bg_rect(fx - 2.0, gp.y - 44.0, 4.0, 44.0, 160, 120, 70);
    cb.rg2d_bg_rect(fx + 2.0, gp.y - 44.0, 24.0, 14.0, 255, 90, 90);
    cb.rg2d_bg_rect(fx + 2.0, gp.y - 30.0, 20.0, 8.0, 255, 210, 60);
    // fx particles
    let mut k = 0;
    while k < g.fx_n {
        let p = g.fx[k];
        cb.rg2d_bg_circle(p.x, p.y, p.rad, p.r, p.g, p.b);
        k += 1;
    }
}
fn climb_score(p: &Player) -> i32 {
    let s = floorf((1830.0 - p.y) / 28.0) as i32;
    if s < 0 { 0 } else { s }
}
fn draw_digit(cb: &mut RgCmdBuf, dgt: usize, nx: f32, ny: f32, cw: f32, ch: f32, pane: i32) {
    let g = &HUD_DIGITS[dgt];
    let mut ry = 0;
    while ry < 5 {
        let line = g[ry];
        let mut cx = 0;
        while cx < 3 {
            // glyph cols are bit2..bit0 (leftmost col = bit2)
            if line & (1 << (2 - cx)) != 0 {
                cb.rg2d_ov_rect(nx + cx as f32 * cw, ny + ry as f32 * ch, cw, ch, 235, 235, 235, pane);
            }
            cx += 1;
        }
        ry += 1;
    }
}
fn draw_number(cb: &mut RgCmdBuf, value: i32, nx: f32, ny: f32, cw: f32, ch: f32, pane: i32) {
    let mut digits = [0usize; 8];
    let mut n = 0;
    let mut v = value;
    if v <= 0 { digits[0] = 0; n = 1; }
    while v > 0 && n < 8 { digits[n] = (v % 10) as usize; v /= 10; n += 1; }
    let mut col = 0;
    let mut k = n as i32 - 1;
    while k >= 0 {
        draw_digit(cb, digits[k as usize], nx + col as f32 * (4.0 * cw), ny, cw, ch, pane);
        col += 1;
        k -= 1;
    }
}

// ===== frame =================================================================
#[no_mangle]
pub extern "C" fn update(dt_ms: i32) -> i32 {
    let g = game();
    let dt = dt_ms as f32;
    let mut cb = RgCmdBuf::new(unsafe { &mut BUF });

    update_movers(g, dt);
    update_enemies(&mut cb, g, dt);
    update_fx(g, dt);

    let mut si = 0;
    while si < 2 {
        if g.players[si].done == 1 {
            tick_finish_player(&mut cb, g, si, dt);
        } else {
            update_player(&mut cb, g, si, dt);
            if g.players[si].done == 0 {
                apply_enemy_hits(&mut cb, g, si);
                collect_diamonds(&mut cb, g, si);
            }
        }
        si += 1;
    }

    update_diamonds(&mut cb, g, dt);

    // cameras: X fixed at world centre, Y follows each player (clamped at floor)
    let cx = BASE_W / 2.0;
    let cy0 = cam_center_y(&g.players[0]);
    let cy1 = cam_center_y(&g.players[1]);
    cb.rg2d_camera_set(CAM[0], cx, cy0, 1.0, 0.0);
    cb.rg2d_camera_set(CAM[1], cx, cy1, 1.0, 0.0);

    draw_static_env(&mut cb, g);
    cb.rg2d_render(LAYER, CAM[0], 0);
    cb.rg2d_render(LAYER, CAM[1], 1);

    // HUD: each pane shows its player's climb score
    cb.rg2d_ov_begin();
    draw_number(&mut cb, climb_score(&g.players[0]), 0.42, 0.9, 0.016, 0.02, 0);
    draw_number(&mut cb, climb_score(&g.players[1]), 0.42, 0.9, 0.016, 0.02, 1);
    cb.finish()
}

fn cam_center_y(p: &Player) -> f32 {
    let feet = p.y + PLAYER_H;
    let mut top = feet - CAM_LEAD;
    let max_top = WORLD_H - VIEW_H;
    if top < 0.0 { top = 0.0; }
    if top > max_top { top = max_top; }
    top + VIEW_H / 2.0
}
