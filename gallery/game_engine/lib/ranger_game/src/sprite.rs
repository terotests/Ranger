//! RGSP1 — ready-character sprite guest bindings (`wasm/wasm_sprite_abi.h`).
//!
//! The guest ships no art: it picks characters from the host catalog by
//! numeric id, sets animation + direction + position per slot, and the host
//! draws and animates. This module owns the shared block and its byte layout;
//! a game implements [`SpriteGame`] and generates the host-facing exports with
//! [`crate::sprite_game!`]:
//!
//! ```ignore
//! struct MyGame { /* plain fields, no static mut */ }
//!
//! impl SpriteGame for MyGame {
//!     fn init() -> Self { /* fresh state */ }
//!     fn tick(&mut self, frame: &Frame, scene: &mut Scene) {
//!         scene.push(Slot::character(1).anim(Anim::Walk).dir(Dir::Down).at(x, y));
//!         scene.set_mode(Mode::Play);
//!     }
//! }
//!
//! ranger_game::sprite_game!(MyGame);
//! ```
//!
//! Per tick the host writes `dt_ms/time_ms/char_count/input/input_p2/view_w/
//! view_h`, calls `sprite_tick()`, then reads `slot_count` + slots + `mode`.
//! The macro turns that into: build a [`Frame`] (with input edges), call your
//! `tick`, write the slot count back.

use crate::block::{Block, Scalar};
use crate::input::Input;

/// `RG_SPR_ABI_MAGIC` — 'RGSP' little-endian.
pub const MAGIC: u32 = 0x5053_4752;
/// `RG_SPR_ABI_VERSION`.
pub const VERSION: i32 = 1;
/// `RG_SPR_ABI_SIZE` in bytes.
pub const SIZE: i32 = 2560;
/// `RG_SPR_MAX_SLOTS`.
pub const MAX_SLOTS: i32 = 64;
/// `RG_SPR_MAX_CAT` — capacity of the host-written catalog id table.
pub const MAX_CATALOG: i32 = 32;

// Header offsets (RG_SPR_OFF_*).
const OFF_MAGIC: usize = 0;
const OFF_VERSION: usize = 4;
const OFF_SIZE: usize = 8;
const OFF_DT_MS: usize = 12;
const OFF_TIME_MS: usize = 16;
const OFF_CHAR_COUNT: usize = 20;
const OFF_SLOT_COUNT: usize = 24;
const OFF_INPUT: usize = 28;
const OFF_INPUT_P2: usize = 32;
const OFF_VIEW_W: usize = 36;
const OFF_VIEW_H: usize = 40;
const OFF_MODE: usize = 44;

// Slot array (RG_SPR_OFF_SLOTS + i * RG_SPR_SLOT_SIZE).
const OFF_SLOTS: usize = 64;
const SLOT_SIZE: usize = 32;
const SLOT_CHARID: usize = 0;
const SLOT_ANIM: usize = 4;
const SLOT_DIR: usize = 8;
const SLOT_FLAGS: usize = 12;
const SLOT_XFP: usize = 16;
const SLOT_YFP: usize = 20;
const SLOT_CLOCK: usize = 24;
const SLOT_FRAME: usize = 28;

// Catalog id table (RG_SPR_OFF_CAT_IDS).
const OFF_CAT_IDS: usize = 2112;

// Slot flag bits (RG_SPR_SLOT_*).
const F_ACTIVE: i32 = 1;
const F_FRAMEOVERRIDE: i32 = 2;
const F_FLIP_X: i32 = 4;

/// Fallback view size when the host has not (yet) written one — matches the
/// engine's base 480×270 layout resolution.
pub const DEFAULT_VIEW: (i32, i32) = (480, 270);

static BLOCK: Block<2560> = Block::new();
static PREV_IN: Scalar<u32> = Scalar::new(0);
static PREV_IN_P2: Scalar<u32> = Scalar::new(0);

/// Animation ids — a default convention for the shipped walk-sheet layout;
/// real rows come from the character's atlas data (`RG_SPR_ANIM_*`).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(i32)]
pub enum Anim {
    Walk = 0,
    /// Falls back to `Walk` until expanded art is baked.
    Run = 1,
    /// Falls back to `Walk` + a synthesised hop until expanded art is baked.
    Jump = 2,
}

/// Facing direction (walk-sheet row order, `RG_SPR_DIR_*`).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(i32)]
pub enum Dir {
    Up = 0,
    Left = 1,
    Down = 2,
    Right = 3,
}

/// Guest mode word (`RG_SPR_MODE_*`): tells the host whether the guest is in
/// its own select/menu screen or playing (affects e.g. BACK feeding).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(i32)]
pub enum Mode {
    Menu = 0,
    Play = 1,
}

/// Everything the host wrote for this tick, in guest-friendly form.
#[derive(Clone, Copy, Debug)]
pub struct Frame {
    /// Milliseconds since the last tick (clamped to ≥ 0).
    pub dt_ms: i32,
    /// Host monotonic clock in ms.
    pub time_ms: i32,
    /// View width in px (defaults to [`DEFAULT_VIEW`] if the host wrote ≤ 0).
    pub view_w: i32,
    /// View height in px (defaults to [`DEFAULT_VIEW`] if the host wrote ≤ 0).
    pub view_h: i32,
    /// Number of characters in the host catalog.
    pub char_count: i32,
    /// Player 1 input with press/release edges.
    pub input: Input,
    /// Player 2 input with press/release edges.
    pub input_p2: Input,
}

impl Frame {
    /// Catalog character id at index `i` (host-written table), or 0 when out
    /// of range. Enumerate `0..char_count` to discover the roster — ids are
    /// data, never a frozen enum.
    #[inline]
    pub fn catalog_id(&self, i: i32) -> i32 {
        if i < 0 || i >= self.char_count || i >= MAX_CATALOG {
            return 0;
        }
        BLOCK.read_i32(OFF_CAT_IDS + i as usize * 4)
    }
}

/// One sprite to draw, built fluently and pushed into the [`Scene`].
///
/// Positions are the character's ground/feet point. `at()` takes pixels and
/// converts to the ABI's ×256 fixed point; `at_fp()` is the raw escape hatch.
#[derive(Clone, Copy, Debug)]
pub struct Slot {
    char_id: i32,
    anim: i32,
    dir: i32,
    flags: i32,
    x_fp: i32,
    y_fp: i32,
    clock_ms: i32,
    frame: i32,
}

impl Slot {
    /// A visible slot for catalog character `char_id` (walk, facing down, at
    /// the origin). `char_id` 0 means "empty" in the ABI, so pass a real id.
    #[inline]
    pub const fn character(char_id: i32) -> Slot {
        Slot {
            char_id,
            anim: Anim::Walk as i32,
            dir: Dir::Down as i32,
            flags: F_ACTIVE,
            x_fp: 0,
            y_fp: 0,
            clock_ms: 0,
            frame: 0,
        }
    }

    #[inline]
    pub const fn anim(mut self, a: Anim) -> Slot {
        self.anim = a as i32;
        self
    }

    #[inline]
    pub const fn dir(mut self, d: Dir) -> Slot {
        self.dir = d as i32;
        self
    }

    /// Position in pixels (converted to fixed point).
    #[inline]
    pub const fn at(mut self, x_px: i32, y_px: i32) -> Slot {
        self.x_fp = x_px * crate::FP;
        self.y_fp = y_px * crate::FP;
        self
    }

    /// Position in raw ×256 fixed point.
    #[inline]
    pub const fn at_fp(mut self, x_fp: i32, y_fp: i32) -> Slot {
        self.x_fp = x_fp;
        self.y_fp = y_fp;
        self
    }

    /// Per-slot animation clock in ms (the host resolves it to a frame).
    #[inline]
    pub const fn clock(mut self, ms: i32) -> Slot {
        self.clock_ms = ms;
        self
    }

    /// Mirror horizontally (e.g. reuse LEFT art for RIGHT).
    #[inline]
    pub const fn flip_x(mut self) -> Slot {
        self.flags |= F_FLIP_X;
        self
    }

    /// Freeze on an explicit sheet frame instead of host timing
    /// (sets `RG_SPR_SLOT_FRAMEOVERRIDE`).
    #[inline]
    pub const fn fixed_frame(mut self, frame: i32) -> Slot {
        self.flags |= F_FRAMEOVERRIDE;
        self.frame = frame;
        self
    }
}

/// The guest's answer for this tick: the slots to draw plus the mode word.
/// Created empty by the macro before `tick`; `push` slots in draw order.
pub struct Scene {
    count: i32,
}

impl Scene {
    /// Append a slot (silently ignored past [`MAX_SLOTS`], mirroring the
    /// host's clamp).
    pub fn push(&mut self, s: Slot) {
        if self.count >= MAX_SLOTS {
            return;
        }
        let base = OFF_SLOTS + self.count as usize * SLOT_SIZE;
        BLOCK.write_i32(base + SLOT_CHARID, s.char_id);
        BLOCK.write_i32(base + SLOT_ANIM, s.anim);
        BLOCK.write_i32(base + SLOT_DIR, s.dir);
        BLOCK.write_i32(base + SLOT_FLAGS, s.flags);
        BLOCK.write_i32(base + SLOT_XFP, s.x_fp);
        BLOCK.write_i32(base + SLOT_YFP, s.y_fp);
        BLOCK.write_i32(base + SLOT_CLOCK, s.clock_ms);
        BLOCK.write_i32(base + SLOT_FRAME, s.frame);
        self.count += 1;
    }

    /// Slots pushed so far this tick.
    #[inline]
    pub fn len(&self) -> i32 {
        self.count
    }

    #[inline]
    pub fn is_empty(&self) -> bool {
        self.count == 0
    }

    /// Publish the guest mode word (menu vs play).
    #[inline]
    pub fn set_mode(&mut self, m: Mode) {
        BLOCK.write_i32(OFF_MODE, m as i32);
    }
}

/// A sprite-ABI game. Implement this and call [`crate::sprite_game!`] on the
/// type; the macro owns the exports and the block bookkeeping.
pub trait SpriteGame: Sized {
    /// Build the initial state. Called from `sprite_init()` — also on restart,
    /// so return a genuinely fresh state.
    fn init() -> Self;

    /// One host tick: read the [`Frame`], push [`Slot`]s into the [`Scene`].
    fn tick(&mut self, frame: &Frame, scene: &mut Scene);
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
    BLOCK.write_i32(OFF_SLOT_COUNT, 0);
    BLOCK.write_i32(OFF_MODE, Mode::Menu as i32);
    PREV_IN.set(0);
    PREV_IN_P2.set(0);
}

#[doc(hidden)]
pub fn __begin_tick() -> (Frame, Scene) {
    let dt = BLOCK.read_i32(OFF_DT_MS);
    let raw = BLOCK.read_u32(OFF_INPUT);
    let raw2 = BLOCK.read_u32(OFF_INPUT_P2);
    let mut vw = BLOCK.read_i32(OFF_VIEW_W);
    let mut vh = BLOCK.read_i32(OFF_VIEW_H);
    if vw <= 0 {
        vw = DEFAULT_VIEW.0;
    }
    if vh <= 0 {
        vh = DEFAULT_VIEW.1;
    }
    let frame = Frame {
        dt_ms: if dt < 0 { 0 } else { dt },
        time_ms: BLOCK.read_i32(OFF_TIME_MS),
        view_w: vw,
        view_h: vh,
        char_count: BLOCK.read_i32(OFF_CHAR_COUNT),
        input: Input::new(raw, PREV_IN.get()),
        input_p2: Input::new(raw2, PREV_IN_P2.get()),
    };
    PREV_IN.set(raw);
    PREV_IN_P2.set(raw2);
    (frame, Scene { count: 0 })
}

#[doc(hidden)]
pub fn __end_tick(scene: Scene) {
    BLOCK.write_i32(OFF_SLOT_COUNT, scene.count);
}

/// Test-only escape hatch: raw header/slot words, so layout tests can assert
/// the exact bytes a host would read.
#[doc(hidden)]
pub fn __read_i32(off: usize) -> i32 {
    BLOCK.read_i32(off)
}

/// Test-only escape hatch: write a host-owned header word.
#[doc(hidden)]
pub fn __write_i32(off: usize, v: i32) {
    BLOCK.write_i32(off, v);
}

/// Generate the RGSP1 exports (`sprite_ptr` / `sprite_size` / `sprite_init` /
/// `sprite_tick` / `rg_abi_version`) for a [`SpriteGame`] type.
#[macro_export]
macro_rules! sprite_game {
    ($ty:ty) => {
        static __RANGER_SPRITE_GAME: $crate::__rt::GameCell<$ty> = $crate::__rt::GameCell::new();

        #[no_mangle]
        pub extern "C" fn sprite_ptr() -> i32 {
            $crate::sprite::__ptr()
        }

        #[no_mangle]
        pub extern "C" fn sprite_size() -> i32 {
            $crate::sprite::SIZE
        }

        #[no_mangle]
        pub extern "C" fn rg_abi_version() -> i32 {
            $crate::sprite::VERSION
        }

        #[no_mangle]
        pub extern "C" fn sprite_init() {
            $crate::sprite::__init_block();
            __RANGER_SPRITE_GAME.set(<$ty as $crate::sprite::SpriteGame>::init());
        }

        #[no_mangle]
        pub extern "C" fn sprite_tick() {
            let (frame, mut scene) = $crate::sprite::__begin_tick();
            __RANGER_SPRITE_GAME
                .with(|g| <$ty as $crate::sprite::SpriteGame>::tick(g, &frame, &mut scene));
            $crate::sprite::__end_tick(scene);
        }
    };
}
