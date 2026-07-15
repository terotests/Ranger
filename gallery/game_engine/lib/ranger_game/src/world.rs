//! RGW1 — world / host-physics guest bindings (`wasm/wasm_game_abi.h`).
//!
//! The block is one flat integer mailbox: per frame the host writes
//! `dt_ms/time_ms/input/input_p2` (and, when the host runs physics, the body
//! poses + contacts), calls `update()`, then reads back controls, impulses,
//! events and the guest scalars. A game implements [`WorldGame`] and generates
//! the exports (`abi_base` / `init` / `update` / `declare_resources` /
//! `rg_abi_version`) with [`crate::world_game!`]:
//!
//! ```ignore
//! struct MyGame { /* plain fields */ }
//!
//! impl WorldGame for MyGame {
//!     fn init(w: &mut World) -> Self {
//!         w.set_body_count(2);
//!         w.set_body_pos(0, ranger_game::fp(100), ranger_game::fp(200));
//!         MyGame { /* … */ }
//!     }
//!     fn update(&mut self, frame: &Frame, w: &mut World) {
//!         for c in w.contacts() { /* guest-defined body id codes */ }
//!         w.set_control(0, steer, throttle, brake, grip); // meaning is YOURS
//!         w.sound(2);
//!     }
//! }
//!
//! ranger_game::world_game!(MyGame);
//! ```
//!
//! Everything the transport leaves to convention stays with the game: control
//! channel meaning, contact body id codes, event sub-ids, body index roles.
//! This module only removes the offset arithmetic and the `static mut`s.

use crate::block::{Block, Scalar};
use crate::input::Input;

/// `RG_WASM_ABI_MAGIC` — 'RGW1' little-endian.
pub const MAGIC: u32 = 0x3157_4752;
/// `RG_WASM_ABI_VERSION`.
pub const VERSION: i32 = 1;
/// `RG_WASM_ABI_SIZE` in bytes.
pub const SIZE: i32 = 2560;
/// `RG_WASM_MAX_BODIES`.
pub const MAX_BODIES: i32 = 32;
/// `RG_WASM_MAX_IMPULSES`.
pub const MAX_IMPULSES: i32 = 16;
/// `RG_WASM_MAX_CONTACTS`.
pub const MAX_CONTACTS: i32 = 14;
/// `RG_WASM_MAX_EVENTS`.
pub const MAX_EVENTS: i32 = 12;

// Header offsets (RG_WASM_OFF_*).
const OFF_MAGIC: usize = 0;
const OFF_VERSION: usize = 4;
const OFF_SIZE: usize = 8;
const OFF_DT_MS: usize = 12;
const OFF_TIME_MS: usize = 16;
const OFF_INPUT: usize = 20;
const OFF_INPUT_P2: usize = 24;
const OFF_BODY_COUNT: usize = 28;
const OFF_IMPULSE_CNT: usize = 32;
const OFF_CONTACT_CNT: usize = 36;
const OFF_SCORE: usize = 40;
const OFF_HITS: usize = 44;
const OFF_CAMERA_Y: usize = 48;
const OFF_EVENT_CNT: usize = 52;
const OFF_SCALAR0: usize = 56; // generic guest scalar (historical name AIR_P1)
const OFF_SCALAR1: usize = 60; // generic guest scalar (historical name AIR_P2)

// Arrays.
const OFF_BODIES: usize = 64;
const BODY_SIZE: usize = 24;
const OFF_CONTROLS: usize = 832;
const CTRL_SIZE: usize = 16;
const OFF_IMPULSES: usize = 1344;
const IMPULSE_SIZE: usize = 16;
const OFF_CONTACTS: usize = 1600;
const CONTACT_SIZE: usize = 32;
const OFF_EVENTS: usize = 2048;
const EVENT_SIZE: usize = 20;

/// Body flag bits (`RG_WASM_BODY_*`).
pub mod body_flags {
    pub const ACTIVE: i32 = 1;
    pub const STATIC: i32 = 2;
    pub const SENSOR: i32 = 4;
}

/// Event kinds (`RG_WASM_EVENT_*`). Sub-ids and payloads are game conventions.
pub mod event {
    pub const SOUND: i32 = 1;
    pub const RUMBLE: i32 = 2;
    pub const PARTICLES: i32 = 3;
}

/// Contact phases (`RG_WASM_CONTACT_PHASE_*`). The shipped arcade core emits
/// `BEGIN` only; `PERSIST`/`END` are reserved.
pub mod contact_phase {
    pub const BEGIN: i32 = 1;
    pub const PERSIST: i32 = 2;
    pub const END: i32 = 3;
}

static BLOCK: Block<2560> = Block::new();
static PREV_IN: Scalar<u32> = Scalar::new(0);
static PREV_IN_P2: Scalar<u32> = Scalar::new(0);

/// Host-written words for this frame, with input edges precomputed.
#[derive(Clone, Copy, Debug)]
pub struct Frame {
    /// Milliseconds since the last update (clamped to ≥ 0).
    pub dt_ms: i32,
    /// Host monotonic clock in ms (diff it; don't compare absolutes).
    pub time_ms: i32,
    /// Player 1 input with press/release edges.
    pub input: Input,
    /// Player 2 input with press/release edges.
    pub input_p2: Input,
}

/// One body pose record (all values raw ABI integers; positions ×256 fixed
/// point, angle/speed/ang_vel in the guest↔physics convention).
#[derive(Clone, Copy, Debug, Default)]
pub struct Body {
    pub x_fp: i32,
    pub y_fp: i32,
    pub angle: i32,
    pub speed: i32,
    pub ang_vel: i32,
    pub flags: i32,
}

/// One contact record. `body_a`/`body_b` are GUEST-DEFINED id codes, not array
/// indices — the mapping is a convention your game picked when declaring the
/// scene.
#[derive(Clone, Copy, Debug)]
pub struct Contact {
    pub body_a: i32,
    pub body_b: i32,
    /// One of [`contact_phase`].
    pub phase: i32,
    /// Normal impulse (×256 fixed point).
    pub impulse_fp: i32,
    /// Contact point (×256 fixed point).
    pub x_fp: i32,
    pub y_fp: i32,
    /// Contact normal ×1000.
    pub nx_milli: i32,
    pub ny_milli: i32,
}

/// Handle for reading and writing the guest-owned words of the RGW1 block.
/// Impulse and event writes go through per-frame cursors; the macro publishes
/// the final counts after your `init`/`update` returns.
pub struct World {
    impulses: i32,
    events: i32,
}

impl World {
    // ---- bodies -------------------------------------------------------------

    /// Read body `i`'s pose (out-of-range reads return a zeroed body).
    pub fn body(&self, i: i32) -> Body {
        if i < 0 || i >= MAX_BODIES {
            return Body::default();
        }
        let base = OFF_BODIES + i as usize * BODY_SIZE;
        Body {
            x_fp: BLOCK.read_i32(base),
            y_fp: BLOCK.read_i32(base + 4),
            angle: BLOCK.read_i32(base + 8),
            speed: BLOCK.read_i32(base + 12),
            ang_vel: BLOCK.read_i32(base + 16),
            flags: BLOCK.read_i32(base + 20),
        }
    }

    /// Write body `i`'s full pose record.
    pub fn set_body(&mut self, i: i32, b: Body) {
        if i < 0 || i >= MAX_BODIES {
            return;
        }
        let base = OFF_BODIES + i as usize * BODY_SIZE;
        BLOCK.write_i32(base, b.x_fp);
        BLOCK.write_i32(base + 4, b.y_fp);
        BLOCK.write_i32(base + 8, b.angle);
        BLOCK.write_i32(base + 12, b.speed);
        BLOCK.write_i32(base + 16, b.ang_vel);
        BLOCK.write_i32(base + 20, b.flags);
    }

    /// Write only body `i`'s position (spawn placement under host physics).
    pub fn set_body_pos(&mut self, i: i32, x_fp: i32, y_fp: i32) {
        if i < 0 || i >= MAX_BODIES {
            return;
        }
        let base = OFF_BODIES + i as usize * BODY_SIZE;
        BLOCK.write_i32(base, x_fp);
        BLOCK.write_i32(base + 4, y_fp);
    }

    pub fn set_body_count(&mut self, n: i32) {
        BLOCK.write_i32(OFF_BODY_COUNT, n);
    }

    pub fn body_count(&self) -> i32 {
        BLOCK.read_i32(OFF_BODY_COUNT)
    }

    // ---- controls (four opaque channels; meaning is the game's) --------------

    /// Write body `i`'s control record. What ch0..ch3 mean (steer/throttle/…,
    /// aimX/aimY/…) is your game's convention — the transport doesn't care.
    pub fn set_control(&mut self, i: i32, ch0: i32, ch1: i32, ch2: i32, ch3: i32) {
        if i < 0 || i >= MAX_BODIES {
            return;
        }
        let base = OFF_CONTROLS + i as usize * CTRL_SIZE;
        BLOCK.write_i32(base, ch0);
        BLOCK.write_i32(base + 4, ch1);
        BLOCK.write_i32(base + 8, ch2);
        BLOCK.write_i32(base + 12, ch3);
    }

    /// Read one control channel back (`ch` 0..3).
    pub fn control(&self, i: i32, ch: i32) -> i32 {
        if i < 0 || i >= MAX_BODIES || ch < 0 || ch > 3 {
            return 0;
        }
        BLOCK.read_i32(OFF_CONTROLS + i as usize * CTRL_SIZE + ch as usize * 4)
    }

    // ---- impulses -------------------------------------------------------------

    /// Queue an impulse on body index `body` (linear x/y + angular, all fixed
    /// point). Returns false when the frame's [`MAX_IMPULSES`] are used up.
    pub fn push_impulse(&mut self, body: i32, ix_fp: i32, iy_fp: i32, ang_fp: i32) -> bool {
        if self.impulses >= MAX_IMPULSES {
            return false;
        }
        let base = OFF_IMPULSES + self.impulses as usize * IMPULSE_SIZE;
        BLOCK.write_i32(base, body);
        BLOCK.write_i32(base + 4, ix_fp);
        BLOCK.write_i32(base + 8, iy_fp);
        BLOCK.write_i32(base + 12, ang_fp);
        self.impulses += 1;
        true
    }

    // ---- contacts -------------------------------------------------------------

    /// Number of host-written contacts this frame (clamped to
    /// [`MAX_CONTACTS`]).
    pub fn contact_count(&self) -> i32 {
        let n = BLOCK.read_i32(OFF_CONTACT_CNT);
        if n > MAX_CONTACTS {
            MAX_CONTACTS
        } else if n < 0 {
            0
        } else {
            n
        }
    }

    /// Read contact `i` (zeroed record when out of range). Index form of
    /// [`World::contacts`] for loops that also need `&mut World` in the body
    /// (e.g. pushing impulses per contact).
    pub fn contact(&self, i: i32) -> Contact {
        if i < 0 || i >= self.contact_count() {
            return Contact {
                body_a: 0,
                body_b: 0,
                phase: 0,
                impulse_fp: 0,
                x_fp: 0,
                y_fp: 0,
                nx_milli: 0,
                ny_milli: 0,
            };
        }
        let base = OFF_CONTACTS + i as usize * CONTACT_SIZE;
        Contact {
            body_a: BLOCK.read_i32(base),
            body_b: BLOCK.read_i32(base + 4),
            phase: BLOCK.read_i32(base + 8),
            impulse_fp: BLOCK.read_i32(base + 12),
            x_fp: BLOCK.read_i32(base + 16),
            y_fp: BLOCK.read_i32(base + 20),
            nx_milli: BLOCK.read_i32(base + 24),
            ny_milli: BLOCK.read_i32(base + 28),
        }
    }

    /// Iterate the host-written contacts for this frame (count clamped to
    /// [`MAX_CONTACTS`]).
    pub fn contacts(&self) -> impl Iterator<Item = Contact> {
        let n = self.contact_count();
        (0..n).map(|i| {
            let base = OFF_CONTACTS + i as usize * CONTACT_SIZE;
            Contact {
                body_a: BLOCK.read_i32(base),
                body_b: BLOCK.read_i32(base + 4),
                phase: BLOCK.read_i32(base + 8),
                impulse_fp: BLOCK.read_i32(base + 12),
                x_fp: BLOCK.read_i32(base + 16),
                y_fp: BLOCK.read_i32(base + 20),
                nx_milli: BLOCK.read_i32(base + 24),
                ny_milli: BLOCK.read_i32(base + 28),
            }
        })
    }

    // ---- events ---------------------------------------------------------------

    /// Queue a generic event. `kind` is one of [`event`]; `sub`/`a`/`b`/`c`
    /// are your game's convention. Returns false when the frame's
    /// [`MAX_EVENTS`] are used up.
    pub fn push_event(&mut self, kind: i32, sub: i32, a: i32, b: i32, c: i32) -> bool {
        if self.events >= MAX_EVENTS {
            return false;
        }
        let base = OFF_EVENTS + self.events as usize * EVENT_SIZE;
        BLOCK.write_i32(base, kind);
        BLOCK.write_i32(base + 4, sub);
        BLOCK.write_i32(base + 8, a);
        BLOCK.write_i32(base + 12, b);
        BLOCK.write_i32(base + 16, c);
        self.events += 1;
        true
    }

    /// Play sound `id` from the game-registered sound palette.
    pub fn sound(&mut self, id: i32) -> bool {
        self.push_event(event::SOUND, id, 0, 0, 0)
    }

    // ---- guest scalars ----------------------------------------------------------

    pub fn score(&self) -> i32 {
        BLOCK.read_i32(OFF_SCORE)
    }

    pub fn set_score(&mut self, v: i32) {
        BLOCK.write_i32(OFF_SCORE, v);
    }

    pub fn hits(&self) -> i32 {
        BLOCK.read_i32(OFF_HITS)
    }

    pub fn set_hits(&mut self, v: i32) {
        BLOCK.write_i32(OFF_HITS, v);
    }

    /// Camera scroll target (×256 fixed point).
    pub fn set_camera_y(&mut self, y_fp: i32) {
        BLOCK.write_i32(OFF_CAMERA_Y, y_fp);
    }

    /// Generic opaque guest scalar `slot` 0 or 1 (transported by the host
    /// without meaning; historical header names AIR_P1/AIR_P2).
    pub fn scalar(&self, slot: i32) -> i32 {
        match slot {
            0 => BLOCK.read_i32(OFF_SCALAR0),
            1 => BLOCK.read_i32(OFF_SCALAR1),
            _ => 0,
        }
    }

    pub fn set_scalar(&mut self, slot: i32, v: i32) {
        match slot {
            0 => BLOCK.write_i32(OFF_SCALAR0, v),
            1 => BLOCK.write_i32(OFF_SCALAR1, v),
            _ => {}
        }
    }
}

/// An RGW1 game. Implement this and call [`crate::world_game!`] on the type.
pub trait WorldGame: Sized {
    /// Build the initial state and declare the scene (body count, spawn
    /// positions, initial scalars). Called from the `init()` export.
    fn init(w: &mut World) -> Self;

    /// One frame: read the [`Frame`] + contacts, write controls / impulses /
    /// events / scalars.
    fn update(&mut self, frame: &Frame, w: &mut World);

    /// Optional: declare spritesheets/rects via [`crate::resources`]. The host
    /// calls the `declare_resources` export once after load.
    fn declare_resources() {}
}

// ---- macro plumbing (doc(hidden): referenced via $crate) --------------------

#[doc(hidden)]
pub fn __ptr() -> i32 {
    BLOCK.as_mut_ptr() as usize as i32
}

#[doc(hidden)]
pub fn __init_block() {
    BLOCK.write_u32(OFF_MAGIC, MAGIC);
    BLOCK.write_i32(OFF_VERSION, VERSION);
    BLOCK.write_i32(OFF_SIZE, SIZE);
    BLOCK.write_i32(OFF_IMPULSE_CNT, 0);
    BLOCK.write_i32(OFF_CONTACT_CNT, 0);
    BLOCK.write_i32(OFF_EVENT_CNT, 0);
    BLOCK.write_i32(OFF_SCORE, 0);
    BLOCK.write_i32(OFF_HITS, 0);
    BLOCK.write_i32(OFF_SCALAR0, 0);
    BLOCK.write_i32(OFF_SCALAR1, 0);
    PREV_IN.set(0);
    PREV_IN_P2.set(0);
}

#[doc(hidden)]
pub fn __world() -> World {
    World {
        impulses: 0,
        events: 0,
    }
}

#[doc(hidden)]
pub fn __begin_update() -> (Frame, World) {
    let dt = BLOCK.read_i32(OFF_DT_MS);
    let raw = BLOCK.read_u32(OFF_INPUT);
    let raw2 = BLOCK.read_u32(OFF_INPUT_P2);
    let frame = Frame {
        dt_ms: if dt < 0 { 0 } else { dt },
        time_ms: BLOCK.read_i32(OFF_TIME_MS),
        input: Input::new(raw, PREV_IN.get()),
        input_p2: Input::new(raw2, PREV_IN_P2.get()),
    };
    PREV_IN.set(raw);
    PREV_IN_P2.set(raw2);
    (frame, __world())
}

#[doc(hidden)]
pub fn __end_update(w: World) {
    BLOCK.write_i32(OFF_IMPULSE_CNT, w.impulses);
    BLOCK.write_i32(OFF_EVENT_CNT, w.events);
}

/// Test-only escape hatches mirroring the sprite module's.
#[doc(hidden)]
pub fn __read_i32(off: usize) -> i32 {
    BLOCK.read_i32(off)
}

#[doc(hidden)]
pub fn __write_i32(off: usize, v: i32) {
    BLOCK.write_i32(off, v);
}

/// Generate the RGW1 exports (`abi_base` / `init` / `update` /
/// `declare_resources` / `rg_abi_version`) for a [`WorldGame`] type.
#[macro_export]
macro_rules! world_game {
    ($ty:ty) => {
        static __RANGER_WORLD_GAME: $crate::__rt::GameCell<$ty> = $crate::__rt::GameCell::new();

        #[no_mangle]
        pub extern "C" fn abi_base() -> i32 {
            $crate::world::__ptr()
        }

        #[no_mangle]
        pub extern "C" fn rg_abi_version() -> i32 {
            $crate::world::VERSION
        }

        #[no_mangle]
        pub extern "C" fn declare_resources() {
            <$ty as $crate::world::WorldGame>::declare_resources();
        }

        #[no_mangle]
        pub extern "C" fn init() {
            $crate::world::__init_block();
            let mut world = $crate::world::__world();
            let game = <$ty as $crate::world::WorldGame>::init(&mut world);
            $crate::world::__end_update(world);
            __RANGER_WORLD_GAME.set(game);
        }

        #[no_mangle]
        pub extern "C" fn update() {
            let (frame, mut world) = $crate::world::__begin_update();
            __RANGER_WORLD_GAME
                .with(|g| <$ty as $crate::world::WorldGame>::update(g, &frame, &mut world));
            $crate::world::__end_update(world);
        }
    };
}
