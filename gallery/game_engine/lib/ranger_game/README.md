# ranger_game — shared Rust guest bindings for the Ranger WASM ABIs

The Rust counterpart of the shared AssemblyScript helpers in this directory
(`abi.as`, `ui.as`): **one crate that owns the byte plumbing of the shipped
guest↔host blocks**, so individual Rust games stop re-declaring offsets and
hand-rolling `static mut` buffers. A game is a plain struct + one trait impl;
a macro generates the exact exports the host calls.

| Module | Block | Header | Game-facing surface |
|--------|-------|--------|---------------------|
| `sprite` | RGSP1 ready-character sprites | [`wasm/wasm_sprite_abi.h`](../../wasm/wasm_sprite_abi.h) | `SpriteGame` trait + `sprite_game!(MyGame)` → `sprite_ptr/size/init/tick`, `rg_abi_version` |
| `world` | RGW1 world / host physics | [`wasm/wasm_game_abi.h`](../../wasm/wasm_game_abi.h) | `WorldGame` trait + `world_game!(MyGame)` → `abi_base/init/update/declare_resources`, `rg_abi_version` |
| `ui` | RGU1 retained-mode UI | [`wasm/wasm_ui_abi.h`](../../wasm/wasm_ui_abi.h) | fluent `El` box builder (same shape as `ui.as`) + `ui_exports!()` → `rg_ui_ptr/size/revision` |
| `input` | shared digital bits | RGW1/RGSP1/RGIN `IN_*` | `Buttons` + `Input` with `held/pressed/released` edges (no more `PREV_IN` statics) |
| `resources` | host imports | `rg_host_register_*` | `resources::sheet(...)` / `resources::rect(...)` |

## A sprite game in full

```rust
use ranger_game::input::Buttons;
use ranger_game::sprite::{Anim, Dir, Frame, Mode, Scene, Slot, SpriteGame};

struct MyGame { x: i32 }

impl SpriteGame for MyGame {
    fn init() -> Self { MyGame { x: 100 } }

    fn tick(&mut self, f: &Frame, s: &mut Scene) {
        if f.input.held(Buttons::RIGHT) { self.x += f.dt_ms / 4; }
        s.push(Slot::character(1).anim(Anim::Walk).dir(Dir::Right)
            .at(self.x, f.view_h / 2).clock(f.time_ms));
        s.set_mode(Mode::Play);
    }
}

ranger_game::sprite_game!(MyGame);
```

`Frame` carries everything the host wrote for the tick (`dt_ms`, `time_ms`,
view size with the 480×270 fallback applied, catalog access, both players'
input). Input edges are precomputed: `pressed()` / `released()` compare
against the previous tick automatically. The `Scene` writer clamps to
`MAX_SLOTS` and publishes `slot_count` after your `tick` returns.

Wire it into a game crate with a path dependency:

```toml
[dependencies]
ranger_game = { path = "../../../lib/ranger_game" }
```

First user: [`games/sprite_char`](../../games/sprite_char/) — its guest went
from ~250 lines of offset arithmetic to just the game state machine, and
`verify.mjs` passes unchanged.

## An RGW1 (host-physics) game

```rust
use ranger_game::world::{Frame, World, WorldGame};

struct Racer;

impl WorldGame for Racer {
    fn init(w: &mut World) -> Self {
        w.set_body_count(2);
        w.set_body_pos(0, ranger_game::fp(240), ranger_game::fp(5860));
        Racer
    }

    fn update(&mut self, f: &Frame, w: &mut World) {
        for c in w.contacts() { /* c.body_a/b are YOUR id codes */ }
        w.set_control(0, steer, throttle, brake, grip); // meaning is yours
        w.sound(2);
        w.set_camera_y(w.body(0).y_fp - ranger_game::fp(120));
    }

    fn declare_resources() {
        ranger_game::resources::sheet("p1", "assets/car1.png", 471, 909, 4, 454, 10);
    }
}

ranger_game::world_game!(Racer);
```

Impulse/event writes go through per-frame cursors clamped to the `MAX_*`
capacities; the macro publishes the final counts after `update` returns
(matching the shipped per-frame semantics).

## RGU1 HUD

Same fluent "everything is a box" surface as `ui.as`, with the same one
authoring rule (a node's props are contiguous in the flat table, so **style a
node before opening its children** — debug builds assert on violations):

```rust
ranger_game::ui_exports!();          // rg_ui_ptr / rg_ui_size / rg_ui_revision

fn rebuild_hud(rev: u32) {
    use ranger_game::ui;
    ui::reset();
    let mut root = ui::root(1);
    root.row();
    let mut col = root.view(10);
    col.column().pad(6);
    col.label(11, "HITS 3").font(16).color(255, 255, 255, 255);
    ui::finish(rev);                 // bump rev only when content changed
}
```

## Rules this crate lives by

- **Transport only, game-neutral** (see [`AGENTS.md`](../../AGENTS.md)): it
  mirrors the byte contracts of [`ABI_V1.md`](../../ABI_V1.md) and the
  `wasm/*.h` headers — no game names, no one game's world constants, no frozen
  taxonomies. Control-channel meaning, contact id codes, event sub-ids and
  catalog ids stay conventions of each game.
- **Header wins.** If this crate and a generated header disagree, the header
  is right and the crate has a bug: `tests/layout.rs` asserts the exact bytes
  a host reads, at the exact offsets, for all three blocks (`cargo test`).
- **Pattern-A concurrency as shipped** (`ABI_V1.md` API §1.2): single host
  thread, synchronous guest calls — hence plain interior-mutable statics and
  no seqlock. Don't reuse these bindings for pattern-B blocks (RGP1/RGIN)
  without adding the revision-word protocol.
- `#![no_std]`, zero dependencies, everything `i32`/fixed-point like the wire
  format (`fp()` / `px()` convert; `FP = 256`).
