//! rust_sprite_char — a WASM guest that drives the ready character set over the
//! RGSP1 sprite ABI. It owns the whole little game (character-select menu + play)
//! and ships NO art: it picks characters from the host catalog by numeric id, the
//! same way a guest plays a sound by RG_WASM_SOUND_*. The host writes dt / input /
//! view size into the block, calls sprite_tick, then reads the slot list and draws
//! each slot as a spritesheet frame. Layout mirrors ../wasm_sprite_abi.h.
//!
//! Exports: sprite_ptr / sprite_size / sprite_init / sprite_tick, plus
//! rg_abi_version so an older host can reject a newer guest.

// ---- RGSP1 offsets (wasm_sprite_abi.h) -------------------------------------
const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_DT_MS: i32 = 12;
const OFF_SLOT_COUNT: i32 = 24;
const OFF_INPUT: i32 = 28;
const OFF_VIEW_W: i32 = 36;
const OFF_VIEW_H: i32 = 40;
const OFF_MODE: i32 = 44;
const OFF_SLOTS: i32 = 64;
const SLOT_SIZE: i32 = 32;

const SLOT_CHARID: i32 = 0;
const SLOT_ANIM: i32 = 4;
const SLOT_DIR: i32 = 8;
const SLOT_FLAGS: i32 = 12;
const SLOT_XFP: i32 = 16;
const SLOT_YFP: i32 = 20;
const SLOT_CLOCK: i32 = 24;

const MAGIC: i32 = 0x5053_4752; // 'RGSP'
const VERSION: i32 = 1;
const SIZE: i32 = 2560;
const FP: i32 = 256;

const CHAR_COUNT: i32 = 4;
const ANIM_WALK: i32 = 0;
const ANIM_JUMP: i32 = 2;
const DIR_UP: i32 = 0;
const DIR_LEFT: i32 = 1;
const DIR_DOWN: i32 = 2;
const DIR_RIGHT: i32 = 3;
const F_ACTIVE: i32 = 1;

// input bits (RG_SPR_IN_*)
const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const IN_ACTION: i32 = 16;
const IN_BACK: i32 = 32;

const JUMP_MS: i32 = 500;
const CELL: i32 = 64;

// ---- guest state -----------------------------------------------------------
const MODE_MENU: i32 = 0;
const MODE_PLAY: i32 = 1;

static mut BLOCK: [u8; 2560] = [0u8; 2560];
static mut MODE: i32 = MODE_MENU;
static mut CURSOR: i32 = 0; // 0..3 highlighted character in the menu
static mut SEL: i32 = 1; // committed character id
static mut PLAY_ANIM: i32 = ANIM_WALK;
static mut PLAY_DIR: i32 = DIR_DOWN;
static mut PLAY_CLOCK: i32 = 0;
static mut MENU_CLOCK: i32 = 0;
static mut PREV_IN: i32 = 0;
// Require ACTION to be released once before a menu confirm counts, so the
// button still held from launching the game doesn't instantly skip the menu.
static mut MENU_ARMED: bool = false;

#[inline]
unsafe fn rd(off: i32) -> i32 {
    let b = off as usize;
    i32::from_le_bytes([BLOCK[b], BLOCK[b + 1], BLOCK[b + 2], BLOCK[b + 3]])
}

#[inline]
unsafe fn wr(off: i32, v: i32) {
    let b = off as usize;
    BLOCK[b..b + 4].copy_from_slice(&v.to_le_bytes());
}

#[inline]
fn slot_off(i: i32, field: i32) -> i32 {
    OFF_SLOTS + i * SLOT_SIZE + field
}

unsafe fn put_slot(i: i32, char_id: i32, anim: i32, dir: i32, x: i32, y: i32, clock: i32) {
    wr(slot_off(i, SLOT_CHARID), char_id);
    wr(slot_off(i, SLOT_ANIM), anim);
    wr(slot_off(i, SLOT_DIR), dir);
    wr(slot_off(i, SLOT_FLAGS), F_ACTIVE);
    wr(slot_off(i, SLOT_XFP), x * FP);
    wr(slot_off(i, SLOT_YFP), y * FP);
    wr(slot_off(i, SLOT_CLOCK), clock);
}

#[inline]
unsafe fn edge(input: i32, bit: i32) -> bool {
    (input & bit) != 0 && (PREV_IN & bit) == 0
}

#[no_mangle]
pub extern "C" fn sprite_ptr() -> i32 {
    unsafe { BLOCK.as_ptr() as i32 }
}

#[no_mangle]
pub extern "C" fn sprite_size() -> i32 {
    SIZE
}

#[no_mangle]
pub extern "C" fn rg_abi_version() -> i32 {
    VERSION
}

#[no_mangle]
pub extern "C" fn sprite_init() {
    unsafe {
        wr(OFF_MAGIC, MAGIC);
        wr(OFF_VERSION, VERSION);
        wr(OFF_SIZE, SIZE);
        MODE = MODE_MENU;
        CURSOR = 0;
        SEL = 1;
        PLAY_ANIM = ANIM_WALK;
        PLAY_DIR = DIR_DOWN;
        PLAY_CLOCK = 0;
        MENU_CLOCK = 0;
        PREV_IN = 0;
        MENU_ARMED = false;
        wr(OFF_MODE, MODE_MENU);
    }
}

#[no_mangle]
pub extern "C" fn sprite_tick() {
    unsafe {
        let dt = rd(OFF_DT_MS).max(0);
        let input = rd(OFF_INPUT);
        let mut vw = rd(OFF_VIEW_W);
        let mut vh = rd(OFF_VIEW_H);
        if vw <= 0 {
            vw = 480;
        }
        if vh <= 0 {
            vh = 270;
        }

        if MODE == MODE_MENU {
            tick_menu(dt, input, vw, vh);
        } else {
            tick_play(dt, input, vw, vh);
        }

        wr(OFF_MODE, MODE);
        PREV_IN = input;
    }
}

unsafe fn tick_menu(dt: i32, input: i32, vw: i32, vh: i32) {
    // arm the confirm only once ACTION has been released (ignores the button
    // still held from launching the game)
    if input & IN_ACTION == 0 {
        MENU_ARMED = true;
    }
    if edge(input, IN_LEFT) {
        CURSOR = (CURSOR + CHAR_COUNT - 1) % CHAR_COUNT;
    }
    if edge(input, IN_RIGHT) {
        CURSOR = (CURSOR + 1) % CHAR_COUNT;
    }
    if MENU_ARMED && edge(input, IN_ACTION) {
        MODE = MODE_PLAY;
        SEL = CURSOR + 1;
        PLAY_ANIM = ANIM_WALK;
        PLAY_DIR = DIR_DOWN;
        PLAY_CLOCK = 0;
        return;
    }

    MENU_CLOCK += dt;

    // four characters in a row; the highlighted one walks in place + sits higher
    let base_y = vh / 2 - CELL / 2;
    wr(OFF_SLOT_COUNT, CHAR_COUNT);
    let mut i = 0;
    while i < CHAR_COUNT {
        let x = vw * (i + 1) / (CHAR_COUNT + 1) - CELL / 2;
        if i == CURSOR {
            put_slot(i, i + 1, ANIM_WALK, DIR_DOWN, x, base_y - 10, MENU_CLOCK);
        } else {
            put_slot(i, i + 1, ANIM_WALK, DIR_DOWN, x, base_y, 0);
        }
        i += 1;
    }
}

unsafe fn tick_play(dt: i32, input: i32, vw: i32, vh: i32) {
    // Back (host feeds IN_BACK when the player presses Q/Esc in play) returns to
    // the character-select menu instead of quitting to the launcher.
    if edge(input, IN_BACK) {
        MODE = MODE_MENU;
        MENU_ARMED = false;
        tick_menu(dt, input, vw, vh);
        return;
    }
    if PLAY_ANIM == ANIM_JUMP {
        PLAY_CLOCK += dt;
        if PLAY_CLOCK >= JUMP_MS {
            PLAY_ANIM = ANIM_WALK;
            PLAY_CLOCK = 0;
        }
    } else if edge(input, IN_ACTION) {
        PLAY_ANIM = ANIM_JUMP;
        PLAY_CLOCK = 0;
    } else {
        let mut moving = false;
        if input & IN_LEFT != 0 {
            PLAY_DIR = DIR_LEFT;
            moving = true;
        }
        if input & IN_RIGHT != 0 {
            PLAY_DIR = DIR_RIGHT;
            moving = true;
        }
        if input & IN_UP != 0 {
            PLAY_DIR = DIR_UP;
            moving = true;
        }
        if input & IN_DOWN != 0 {
            PLAY_DIR = DIR_DOWN;
            moving = true;
        }
        if moving {
            PLAY_CLOCK += dt;
        } else {
            PLAY_CLOCK = 0;
        }
    }

    let x = vw / 2 - CELL / 2;
    let y = vh * 2 / 3 - CELL / 2;
    wr(OFF_SLOT_COUNT, 1);
    put_slot(0, SEL, PLAY_ANIM, PLAY_DIR, x, y, PLAY_CLOCK);
}
