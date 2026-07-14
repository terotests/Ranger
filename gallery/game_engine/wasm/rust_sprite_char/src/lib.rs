//! rust_sprite_char — a WASM guest that drives the RGSP1 sprite ABI.
//!
//! It ships NO art and NO animation code: it picks characters from the host's
//! ready catalog by numeric id (exactly like a guest plays a sound by writing
//! RG_WASM_SOUND_*), positions them, and sets an animation + direction. The host
//! (scripting/wasm_sprite_runner.rgr) resolves each slot to a spritesheet frame
//! and draws it. Layout mirrors gallery/game_engine/wasm/wasm_sprite_abi.h.
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
const OFF_SLOTS: i32 = 64;
const SLOT_SIZE: i32 = 32;

const SLOT_CHARID: i32 = 0;
const SLOT_ANIM: i32 = 4;
const SLOT_DIR: i32 = 8;
const SLOT_FLAGS: i32 = 12;
const SLOT_XFP: i32 = 16;
const SLOT_YFP: i32 = 20;
const SLOT_CLOCK: i32 = 24;

const MAGIC: i32 = 0x5053_4752; // 'RGSP' little-endian
const VERSION: i32 = 1;
const SIZE: i32 = 2560;
const FP: i32 = 256;

// Catalog ids (mirror lpc_char_catalog.rgr)
const CHAR_HERO: i32 = 1;
const CHAR_KNIGHT: i32 = 2;
const CHAR_MAGE: i32 = 3;
const CHAR_ROGUE: i32 = 4;

// Animation ids
const ANIM_WALK: i32 = 0;
const ANIM_JUMP: i32 = 2;

// Directions
const DIR_LEFT: i32 = 1;
const DIR_DOWN: i32 = 2;
const DIR_RIGHT: i32 = 3;
const DIR_UP: i32 = 0;

// slot.flags
const F_ACTIVE: i32 = 1;

// input bits
const IN_UP: i32 = 1;
const IN_DOWN: i32 = 2;
const IN_LEFT: i32 = 4;
const IN_RIGHT: i32 = 8;
const IN_ACTION: i32 = 16;

const JUMP_MS: i32 = 500;
const SLOTS: i32 = 4;

static mut BLOCK: [u8; 2560] = [0u8; 2560];

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

unsafe fn put_slot(i: i32, char_id: i32, anim: i32, dir: i32, x: i32, y: i32) {
    wr(slot_off(i, SLOT_CHARID), char_id);
    wr(slot_off(i, SLOT_ANIM), anim);
    wr(slot_off(i, SLOT_DIR), dir);
    wr(slot_off(i, SLOT_FLAGS), F_ACTIVE);
    wr(slot_off(i, SLOT_XFP), x * FP);
    wr(slot_off(i, SLOT_YFP), y * FP);
    wr(slot_off(i, SLOT_CLOCK), 0);
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

/// Stamp the header and seed the four catalog characters. Slot 0 (hero) is the
/// player-controlled one; the rest walk in place facing different ways so the
/// whole ready set is visible at once.
#[no_mangle]
pub extern "C" fn sprite_init() {
    unsafe {
        wr(OFF_MAGIC, MAGIC);
        wr(OFF_VERSION, VERSION);
        wr(OFF_SIZE, SIZE);
        wr(OFF_SLOT_COUNT, SLOTS);
        put_slot(0, CHAR_HERO, ANIM_WALK, DIR_RIGHT, 24, 64);
        put_slot(1, CHAR_KNIGHT, ANIM_WALK, DIR_DOWN, 88, 64);
        put_slot(2, CHAR_MAGE, ANIM_WALK, DIR_LEFT, 152, 64);
        put_slot(3, CHAR_ROGUE, ANIM_WALK, DIR_UP, 216, 64);
    }
}

/// Advance every character's animation clock, and steer slot 0 from host input:
/// arrow keys turn it (and keep it walking), ACTION starts a jump that reverts to
/// walk when the hop finishes.
#[no_mangle]
pub extern "C" fn sprite_tick() {
    unsafe {
        let dt = rd(OFF_DT_MS).max(0);
        let input = rd(OFF_INPUT);

        // advance all clocks
        let mut i = 0;
        while i < SLOTS {
            let c = rd(slot_off(i, SLOT_CLOCK)) + dt;
            wr(slot_off(i, SLOT_CLOCK), c);
            i += 1;
        }

        // steer the player (slot 0)
        let anim0 = rd(slot_off(0, SLOT_ANIM));
        if anim0 == ANIM_JUMP {
            // finish the jump, then fall back to walking
            if rd(slot_off(0, SLOT_CLOCK)) >= JUMP_MS {
                wr(slot_off(0, SLOT_ANIM), ANIM_WALK);
                wr(slot_off(0, SLOT_CLOCK), 0);
            }
        } else {
            if input & IN_ACTION != 0 {
                wr(slot_off(0, SLOT_ANIM), ANIM_JUMP);
                wr(slot_off(0, SLOT_CLOCK), 0);
            } else if input & IN_LEFT != 0 {
                wr(slot_off(0, SLOT_DIR), DIR_LEFT);
            } else if input & IN_RIGHT != 0 {
                wr(slot_off(0, SLOT_DIR), DIR_RIGHT);
            } else if input & IN_UP != 0 {
                wr(slot_off(0, SLOT_DIR), DIR_UP);
            } else if input & IN_DOWN != 0 {
                wr(slot_off(0, SLOT_DIR), DIR_DOWN);
            }
        }
    }
}
