//! ranger_game — shared guest-side Rust bindings for the Ranger WASM game ABIs.
//!
//! This crate is the Rust counterpart of the AssemblyScript helpers in
//! `gallery/game_engine/lib/` (`abi.as`, `ui.as`): one shared module that owns
//! the raw byte plumbing of the shipped blocks so individual games never
//! re-declare offsets or hand-roll `static mut` buffers. It covers:
//!
//! - [`sprite`] — RGSP1 ready-character sprites (`wasm/wasm_sprite_abi.h`)
//! - [`world`]  — RGW1 world / host-physics (`wasm/wasm_game_abi.h`)
//! - [`ui`]     — RGU1 retained-mode UI document (`wasm/wasm_ui_abi.h`)
//! - [`pose`]   — RGP1 host→guest streaming pose input (`wasm/wasm_pose_abi.h`)
//! - [`scene`]  — host-managed 3D scene commands (`runtime/rg_wasm_bridge.c`, `IDEAL_3D.md`)
//! - [`input`]  — the shared digital input bits + press/release edge tracking
//! - [`resources`] — the `rg_host_register_*` resource-declaration imports
//!
//! A game implements one small trait and asks a macro to generate the exact
//! exports the host calls:
//!
//! ```ignore
//! use ranger_game::sprite::{Frame, Scene, Slot, SpriteGame};
//!
//! struct MyGame { /* your state — no static mut, no offsets */ }
//!
//! impl SpriteGame for MyGame {
//!     fn init() -> Self { MyGame { /* … */ } }
//!     fn tick(&mut self, frame: &Frame, scene: &mut Scene) {
//!         if frame.input.pressed(ranger_game::input::Buttons::ACTION) { /* … */ }
//!         scene.push(Slot::character(1).at(100, 80));
//!     }
//! }
//!
//! ranger_game::sprite_game!(MyGame);
//! ```
//!
//! Layering rules (see `gallery/game_engine/AGENTS.md`): this crate is a
//! TRANSPORT. It mirrors the byte contracts in `wasm/*.h` and `ABI_V1.md` and
//! must stay game-neutral — no game names, no one game's world constants, no
//! frozen taxonomies. Meaning of control channels, body id codes, event
//! sub-ids and catalog character ids stays with each game.
//!
//! Concurrency: the shipped RGSP1/RGW1 blocks are pattern A ("turn-based,
//! single host thread, synchronous guest calls" — `ABI_V1.md` API §1.2), so no
//! seqlock is used and plain reads/writes through an interior-mutable static
//! are sound. RGU1 is guest-written/host-read with a revision word the guest
//! bumps in `finish()`.

#![no_std]

pub mod input;
pub mod pose;
pub mod resources;
pub mod scene;
pub mod sprite;
pub mod ui;
pub mod world;

mod block;

#[doc(hidden)]
pub mod __rt;

/// Shared fixed-point scale (`RG_WASM_FP_SCALE` / `RG_SPR_FP_SCALE`): world
/// coordinates travel as `i32` pixels × 256.
pub const FP: i32 = 256;

/// Pixels → fixed point (`px * FP`).
#[inline]
pub const fn fp(px: i32) -> i32 {
    px * FP
}

/// Fixed point → pixels (truncating `fp / FP`).
#[inline]
pub const fn px(fp: i32) -> i32 {
    fp / FP
}
