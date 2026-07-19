//! RGP1 — host→guest streaming pose input (`wasm/wasm_pose_abi.h`).
//!
//! A camera + AI model (MediaPipe on the web, TFLite natively) produces a
//! skeleton each frame; the host copies the latest sample into this block
//! **before** calling the guest, and the guest reads where the body is and HOW
//! IT IS MOVING. This is the Rust counterpart of the `.as` pose readers in
//! `scripting/as_abi_bridge.rgr`, so a game compiled to WASM reads pose from the
//! same canonical offsets the interpreted path uses — the parity the shared
//! header exists to guarantee (IDEAL §2.4).
//!
//! Layering (see `gallery/game_engine/AGENTS.md`): this is a TRANSPORT. It
//! mirrors the byte contract in `wasm/wasm_pose_abi.h` and stays game-neutral —
//! it defines POSITION, VELOCITY, SPEED, timing and confidence as bytes. What a
//! `gesture` MEANS, and WHICH landmark drives a game, are the guest's decision
//! and live in the game, never here.
//!
//! Coordinates are NORMALIZED and view-independent: positions are `[0,1] × FP`
//! (`FP = 256`), never multiplied by a screen size. A guest scales into its own
//! world (`x_world = x_fp / FP × world_w`). Velocities/speeds are Q16.16 per
//! second ([`FP_VEL`]).
//!
//! ```ignore
//! use ranger_game::pose::Pose;
//! // inside a SpritePoseGame::tick(&mut self, frame, pose: &Pose, scene):
//! if pose.present() {
//!     let nose = pose.landmark(0);          // BlazePose index is the guest's choice
//!     let x = nose.x_fp * frame.view_w / ranger_game::FP; // → screen px
//! }
//! ```

use crate::block::Block;

/// `RG_POSE_ABI_MAGIC` — 'RGP1' little-endian.
pub const MAGIC: u32 = 0x3150_4752;
/// `RG_POSE_ABI_VERSION`.
pub const VERSION: i32 = 2;
/// `RG_POSE_MAX_LM` — the BlazePose skeleton.
pub const MAX_LM: i32 = 33;
/// `RG_POSE_FP_SCALE` — positions: `normalized[0,1] × 256`.
pub const FP_SCALE: i32 = 256;
/// `RG_POSE_FP_VEL` — velocity/speed Q16.16 per second.
pub const FP_VEL: i32 = 65536;

// Header offsets (RG_POSE_OFF_*).
const OFF_MAGIC: usize = 0;
const OFF_VERSION: usize = 4;
const OFF_SIZE: usize = 8;
const OFF_REVISION: usize = 12;
const OFF_PRESENT: usize = 16;
const OFF_GESTURE: usize = 20;
const OFF_LM_COUNT: usize = 24;
const OFF_TIME_MS: usize = 28;
const OFF_DT_MS: usize = 32;
const OFF_FLAGS: usize = 36;
const OFF_BODY_VX: usize = 40;
const OFF_BODY_VY: usize = 44;
const OFF_BODY_SPEED: usize = 48;
const HEADER_SIZE: usize = 64;

// Landmark array (RG_POSE_OFF_LM0 + i * RG_POSE_LM_SIZE).
const OFF_LM0: usize = 64;
const LM_SIZE: usize = 24;
const LM_OFF_X: usize = 0;
const LM_OFF_Y: usize = 4;
const LM_OFF_VX: usize = 8;
const LM_OFF_VY: usize = 12;
const LM_OFF_SPEED: usize = 16;
const LM_OFF_CONF: usize = 20;

/// `RG_POSE_ABI_SIZE` — header + `MAX_LM` landmark records (856 bytes). Always
/// read the live size from the block header rather than assuming it.
pub const SIZE: i32 = (HEADER_SIZE + MAX_LM as usize * LM_SIZE) as i32;

/// Flag bits (`RG_POSE_FLAG_*`, read via [`Pose::has_flag`]).
pub mod flag {
    /// Host finished a full frame.
    pub const VALID: u32 = 1;
    /// Velocity/speed are host-provided (else zero — difference positions).
    pub const HAS_VEL: u32 = 2;
    /// Landmarks passed the host filter.
    pub const SMOOTHED: u32 = 4;
    /// `present` flipped 0→1 this sample; velocity zeroed (don't register a jump).
    pub const JUST_APPEARED: u32 = 8;
}

/// `RG_WASM_HOST_CAP_POSE_INPUT` — the capability a guest requires so a host
/// without a camera rejects it at load instead of feeding zeros.
pub const HOST_CAP_POSE_INPUT: i32 = 0x0010;

/// One landmark's pose + motion, all raw ABI integers.
///
/// `x_fp`/`y_fp` are normalized `[0,1] × FP` (`+x` right, `+y` down). `vx`/`vy`/
/// `speed` are normalized-units-per-second `× FP_VEL` (zero unless
/// [`flag::HAS_VEL`]). `conf` is visibility/confidence `0..FP`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Landmark {
    pub x_fp: i32,
    pub y_fp: i32,
    pub vx: i32,
    pub vy: i32,
    pub speed: i32,
    pub conf: i32,
}

static BLOCK: Block<{ SIZE as usize }> = Block::new();

/// A read-only view over the RGP1 block the host filled this tick. The
/// accessors read the shared bytes live; the sprite/world host writes the whole
/// block before the synchronous guest call, so plain reads are tear-free
/// (pattern A — `ABI_V1.md` §1.2).
pub struct Pose {
    _priv: (),
}

impl Pose {
    /// True if a pose was detected this sample.
    #[inline]
    pub fn present(&self) -> bool {
        BLOCK.read_i32(OFF_PRESENT) != 0
    }

    /// The host's magic word — `MAGIC` once the host has written a frame. Lets
    /// a guest ignore an uninitialised block (all zero) defensively.
    #[inline]
    pub fn magic(&self) -> u32 {
        BLOCK.read_u32(OFF_MAGIC)
    }

    /// The ABI version the host wrote.
    #[inline]
    pub fn version(&self) -> i32 {
        BLOCK.read_i32(OFF_VERSION)
    }

    /// The block size the host advertised (read this, never assume [`SIZE`]).
    #[inline]
    pub fn size(&self) -> i32 {
        BLOCK.read_i32(OFF_SIZE)
    }

    /// Seqlock revision (even = stable). Bumps once per published sample.
    #[inline]
    pub fn revision(&self) -> u32 {
        BLOCK.read_u32(OFF_REVISION)
    }

    /// The guest-defined gesture id (0 = none). Meaning is the game's.
    #[inline]
    pub fn gesture(&self) -> i32 {
        BLOCK.read_i32(OFF_GESTURE)
    }

    /// Landmarks written this sample, clamped to `0..=MAX_LM`.
    #[inline]
    pub fn landmark_count(&self) -> i32 {
        let n = BLOCK.read_i32(OFF_LM_COUNT);
        if n < 0 {
            0
        } else if n > MAX_LM {
            MAX_LM
        } else {
            n
        }
    }

    /// Capture timestamp, monotonic ms (diff it; don't compare absolutes).
    #[inline]
    pub fn time_ms(&self) -> i32 {
        BLOCK.read_i32(OFF_TIME_MS)
    }

    /// Ms since the previous published sample.
    #[inline]
    pub fn dt_ms(&self) -> i32 {
        BLOCK.read_i32(OFF_DT_MS)
    }

    /// Raw flag word ([`flag`] bits).
    #[inline]
    pub fn flags(&self) -> u32 {
        BLOCK.read_u32(OFF_FLAGS)
    }

    /// True if `f` (one of [`flag`]) is set.
    #[inline]
    pub fn has_flag(&self, f: u32) -> bool {
        self.flags() & f != 0
    }

    /// Aggregate body velocity (hip midpoint / visible-landmark mean) — "how
    /// much is the player moving overall", `× FP_VEL`.
    #[inline]
    pub fn body_vx(&self) -> i32 {
        BLOCK.read_i32(OFF_BODY_VX)
    }

    #[inline]
    pub fn body_vy(&self) -> i32 {
        BLOCK.read_i32(OFF_BODY_VY)
    }

    /// Aggregate body speed `|v|`, `× FP_VEL`.
    #[inline]
    pub fn body_speed(&self) -> i32 {
        BLOCK.read_i32(OFF_BODY_SPEED)
    }

    /// Read landmark `i` (a zeroed record when out of range). Which index a
    /// game reads (nose, wrist, …) is the game's convention.
    #[inline]
    pub fn landmark(&self, i: i32) -> Landmark {
        if i < 0 || i >= MAX_LM {
            return Landmark::default();
        }
        let base = OFF_LM0 + i as usize * LM_SIZE;
        Landmark {
            x_fp: BLOCK.read_i32(base + LM_OFF_X),
            y_fp: BLOCK.read_i32(base + LM_OFF_Y),
            vx: BLOCK.read_i32(base + LM_OFF_VX),
            vy: BLOCK.read_i32(base + LM_OFF_VY),
            speed: BLOCK.read_i32(base + LM_OFF_SPEED),
            conf: BLOCK.read_i32(base + LM_OFF_CONF),
        }
    }

    /// Landmark `i`'s normalized x (`[0,1] × FP`), or 0 out of range.
    #[inline]
    pub fn x_fp(&self, i: i32) -> i32 {
        self.landmark(i).x_fp
    }

    /// Landmark `i`'s normalized y (`[0,1] × FP`), or 0 out of range.
    #[inline]
    pub fn y_fp(&self, i: i32) -> i32 {
        self.landmark(i).y_fp
    }
}

// ---- macro plumbing (doc(hidden): referenced via $crate) --------------------

#[doc(hidden)]
pub fn __ptr() -> i32 {
    BLOCK.as_mut_ptr() as usize as i32
}

/// Publish a valid, empty RGP1 header so a guest that reads before the host has
/// streamed a frame sees magic/version/size (and `present == 0`) rather than
/// zeroes it might mistake for a stale-but-real sample.
#[doc(hidden)]
pub fn __init_block() {
    BLOCK.write_u32(OFF_MAGIC, MAGIC);
    BLOCK.write_i32(OFF_VERSION, VERSION);
    BLOCK.write_i32(OFF_SIZE, SIZE);
    BLOCK.write_i32(OFF_REVISION, 0);
    BLOCK.write_i32(OFF_PRESENT, 0);
    BLOCK.write_i32(OFF_GESTURE, 0);
    BLOCK.write_i32(OFF_LM_COUNT, 0);
    BLOCK.write_i32(OFF_FLAGS, 0);
}

#[doc(hidden)]
pub fn __pose() -> Pose {
    Pose { _priv: () }
}

/// Test-only escape hatches, mirroring the sprite/world modules', so a host
/// (or a layout test) can author the exact bytes a guest reads.
#[doc(hidden)]
pub fn __read_i32(off: usize) -> i32 {
    BLOCK.read_i32(off)
}

#[doc(hidden)]
pub fn __write_i32(off: usize, v: i32) {
    BLOCK.write_i32(off, v);
}

/// Author a full landmark record at index `i` (test/host helper).
#[doc(hidden)]
pub fn __write_landmark(i: i32, x_fp: i32, y_fp: i32, vx: i32, vy: i32, speed: i32, conf: i32) {
    if i < 0 || i >= MAX_LM {
        return;
    }
    let base = OFF_LM0 + i as usize * LM_SIZE;
    BLOCK.write_i32(base + LM_OFF_X, x_fp);
    BLOCK.write_i32(base + LM_OFF_Y, y_fp);
    BLOCK.write_i32(base + LM_OFF_VX, vx);
    BLOCK.write_i32(base + LM_OFF_VY, vy);
    BLOCK.write_i32(base + LM_OFF_SPEED, speed);
    BLOCK.write_i32(base + LM_OFF_CONF, conf);
}
