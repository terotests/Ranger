# IDEAL — what the game-engine interfaces *should* look like

> Status: **target specification** (companion to [`AGENTS.md`](./AGENTS.md),
> [`scripting/PLAN_PROVIDERS.md`](./scripting/PLAN_PROVIDERS.md) and
> [`scripting/PLAN_PHYSICS_RUNNER_GENERIC.md`](./scripting/PLAN_PHYSICS_RUNNER_GENERIC.md)).
>
> This document does **not** describe today's code. It describes the interfaces
> the engine is *aiming* at, derived from the engine's stated goal, so that every
> refactor has a fixed target to move toward. Where the current code violates the
> target, the violation is shown next to the ideal so the gap is concrete.

---

## 0. The one goal every interface must serve

From [`ROADMAP.md`](./ROADMAP.md):

> Write game logic once → iterate on Mac (Node / TSX / WASM) → run the same logic
> as a native binary on a Raspberry Pi.

That promise holds **only if the engine core contains zero knowledge of any single
game.** The core is the reusable half; a game is the disposable half. The moment a
game's name, entity, world constant, sound id, or player count appears in the core,
the "write once, run on many backends" claim quietly becomes "write once *for
autopeli*." So the north star for every interface below is a single invariant:

> **A hypothetical *second* game of the same genre must be able to reuse a core
> file unchanged.** If it can't, the file is a game, not core.

This is testable, mechanically, and the test is part of the ideal (see §7).

---

## 1. The three layers (the boundary every file is on exactly one side of)

| Layer | Lives in | Knows about | Must NOT know about |
|-------|----------|-------------|---------------------|
| **Engine core** | `scripting/` runtimes, `framebuffer.rgr`, ABI helpers, generic runners | Framebuffers, the ABI *shape*, physics primitives, sprite/HUD *mechanisms* | Any specific game — its entities, world size, sprites, HUD gauges, sound names, player count |
| **Reusable subsystems** | `physics/`, `lpc/`, `menu/`, `ui/`, `pose/` | Their own domain (bodies, spritesheets, UI trees) | *Which* game is using them |
| **A game** | `games/<name>/`, its WASM/`.as`/TSX guest, its `<Name>Scene`/`Render`/`Hud` modules | Everything about itself | Nothing in core needs to know it exists |

The rest of this document specifies the **seams between these layers** — because the
leaks are all seam violations, not internal ones.

---

## 2. The ideal WASM ABI — a *transport*, never a *taxonomy*

The shared ABI (`wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h`,
`wasm/wasm_ui_abi.h`) is the widest seam: it is shared by the Rust guest, the
AssemblyScript guest, the interpreted `.as` guest, and the host. Its ideal is the
strictest.

> **"guest" vs "host" — say it once, precisely.** The **guest is the game itself**,
> compiled to a WASM module — normally written in **Rust** (`wasm/rust_*/src/lib.rs`)
> or **AssemblyScript** (`wasm/as_*/assembly/index.ts`), or run through the interpreted
> `.as` path. The **host** is the Ranger engine (`scripting/` `.rgr` files) that loads
> that module and drives it each frame. The only thing crossing between them is the
> shared linear-memory block described by the ABI header — no pointers, no objects.
>
> So "guest-side" below means **inside the game's own Rust crate / AssemblyScript
> module**, next to `lib.rs` / `index.ts`, compiled into the same `.wasm`. It does
> **not** mean a file that sits in `wasm/` next to the shared headers, and it
> **never** means anything in `scripting/` core. The shared `.h` headers exist only
> because C-style `#define`s are the lowest common denominator all three guests can
> mirror; the constants a game owns do not belong in them, they belong in the game's
> source in the game's own language.

### 2.1 Rule: the ABI defines *bytes and structure*, the guest defines *meaning*

**In the ABI (generic, may stay):**
- Header layout, magic, version, sizes.
- Fixed-point scale for world coordinates (`FP_SCALE`).
- The *shape* of the body / control / contact / event / slot records — offsets and
  widths.
- Count caps (`MAX_BODIES`, `MAX_EVENTS`, …) as buffer bounds.
- The forward-compat handshake (`rg_abi_version` / `rg_required_caps` /
  `rg_check_env`) and the typed capability query (RGCQ).

**Out of the ABI (a specific game's meaning — belongs guest-side):**

In the "Ideal home" column, *guest source* means the game's own Rust crate or
AssemblyScript module (`wasm/rust_autopeli/src/`, `wasm/as_autopeli/assembly/`) —
compiled into the game's `.wasm`, never added to the shared `wasm/*.h` and never to
`scripting/` core.

| Currently in the header | Why it's a game, not a transport | Ideal home |
|-------------------------|----------------------------------|------------|
| `RG_WASM_GRIP_SCALE`, `RG_WASM_STEER_SCALE` | grip/steer are a driving game's dynamics | a `const` in the autopeli guest source (Rust `const` / AS `const`) |
| `RG_WASM_ID_CONE0`, `RG_WASM_ID_BAR0` | cones/bars are autopeli entities | autopeli guest source |
| `Standard body indices (autopeli)` — `RG_WASM_BODY_TRAFFIC0`, `RG_WASM_TRAFFIC_COUNT 15` | "traffic" and a 15-count are game design | autopeli guest source |
| `RG_WASM_SOUND_WALL / BOUNCE / WIN` | one game's sound vocabulary | a guest enum; host maps ids opaquely (§4) |
| `RG_WASM_OFF_AIR_P1/P2` | an autopeli scalar | a **generic** "guest scalar slot" the ABI documents as guest-defined |
| `RG_SPR_CHAR_HERO / KNIGHT / MAGE / ROGUE` | a character roster | the character pack + its runtime catalog table (already exists: `RG_SPR_OFF_CAT_IDS`) |

The header's own comments should read *"body-index meaning, id-code ranges, and
event sub-ids are **conventions the guest defines**"* — never *"Standard body
indices (autopeli)."* A comment that names a game in a shared header is the bug.

### 2.2 The per-body control record must be genre-neutral

Today the 16-byte control record is `steer / throttle / brake / grip` — a car. That
vocabulary then leaks all the way up the stack (see §3, §6). The ideal control
record is **four opaque scalar channels** plus a bitfield, with meaning assigned by
the guest:

```c
/* Generic per-body control (16 bytes). Channels are guest-defined; the host only
 * transports them. A racing guest reads ch0 as steer, ch1 as throttle, …; a
 * top-down shooter reads them as aimX/aimY/fire — the ABI does not care. */
#define RG_WASM_CTRL_OFF_CH0    0   /* i32 fixed-point control channel 0 */
#define RG_WASM_CTRL_OFF_CH1    4   /* i32 fixed-point control channel 1 */
#define RG_WASM_CTRL_OFF_CH2    8   /* i32 fixed-point control channel 2 */
#define RG_WASM_CTRL_OFF_CH3    12  /* i32 fixed-point control channel 3 */
```

The generic channel *offsets* above are the only thing the shared ABI defines. The
game names *its* channels **inside its own guest source**, in whatever language the
guest is written in — the naming is compiled into the `.wasm`, so it costs the host
nothing and reaches no core file:

```rust
// wasm/rust_autopeli/src/lib.rs — the game (Rust guest), compiled to .wasm.
// These names live in the game, NOT in wasm/wasm_game_abi.h and NOT in scripting/.
const CTRL_STEER:    usize = RG_WASM_CTRL_OFF_CH0;
const CTRL_THROTTLE: usize = RG_WASM_CTRL_OFF_CH1;
const CTRL_BRAKE:    usize = RG_WASM_CTRL_OFF_CH2;
const CTRL_GRIP:     usize = RG_WASM_CTRL_OFF_CH3;
```

```ts
// wasm/as_autopeli/assembly/abi.ts — the same game as an AssemblyScript guest.
// Same generic offsets, same game-local names; also compiled into the .wasm.
export const CTRL_STEER:    i32 = RG_WASM_CTRL_OFF_CH0;
export const CTRL_THROTTLE: i32 = RG_WASM_CTRL_OFF_CH1;
export const CTRL_BRAKE:    i32 = RG_WASM_CTRL_OFF_CH2;
export const CTRL_GRIP:     i32 = RG_WASM_CTRL_OFF_CH3;
```

(A C or C++ guest, if one is ever added, is the only case that would use a
`.h`; it is not the norm — the norm is Rust or AssemblyScript.)

Consequently the host side stays genre-neutral too: `wasm_abi_io.rgr` exposes
`readControlChannel(bodyIdx, ch)` — **not** `readControlSteer/Throttle/Brake/Grip` —
and `as_abi_bridge.rgr`'s `writeControl` takes indexed channels. The host transports
four numbers; only the guest knows one of them is "steer".

### 2.3 The UI ABI (RGU1) is the model to imitate

`wasm/wasm_ui_abi.h` is already correct and should be cited as the reference: a flat
retained-mode document the guest owns, the host renders; *"No host pointers or EVG
objects ever cross into the guest,"* the host treats the block as untrusted and
validates it. Every future block (RGP1 pose, a scene block, …) should copy this
discipline: **fixed typed layout, no pointers cross, snapshot-first, host validates.**

---

## 3. The ideal engine-core ↔ game seam: `GameSceneProvider`

A generic runner must obtain *everything game-specific from an interface it is
compiled against* — never from concrete game types, imports, or constants. This is
the seam that turns `wasm_physics_runner.rgr` from "the autopeli game wearing a
generic name" into a real host.

```
interface GameSceneProvider {
    ; --- world (the guest is the preferred source; a provider is the fallback) ---
    fn buildScene(phys:GamePhysics bodyIds:[string]) : void   ; bodies + bounds
    fn worldSize() : (int, int)                                ; w, h  (no 6000 in core)
    fn playerCount() : int                                     ; no fixed "2" in core

    ; --- presentation ---
    fn initAssets(render:GenericRender pw:int) : void          ; sprite templates
    fn buildStaticBg(render:GenericRender) : void              ; background
    fn spriteFor(id:string) : string                           ; entity id -> template
    fn drawHud(target:SoftCanvas paneIdx:int abi:WasmAbiMem) : void  ; HUD, or emit RGU1

    ; --- ABI conventions THIS guest chose (§2.1) ---
    fn contactBodyCode(id:string) : int
    fn bodyCodeToId(code:int) : string
    fn mapEvent(kind:int sub:int) : GameEventNative            ; sound/particle ids

    ; --- camera policy ---
    fn cameraFor(paneIdx:int phys:GamePhysics) : int
}
```

Rules the interface encodes:

- The core holds `provider:GameSceneProvider`, **never** `setup:WasmAutopeliSetup`.
- The core imports the interface, **never** `wasm_autopeli_setup.rgr`.
- Adding a second physics game = writing a second provider. Zero core edits.

The autopeli implementation is exactly today's setup/render/HUD logic *moved
verbatim behind this interface*, relocated to `games/autopeli_wasm/scene/`.

---

## 4. Game vocabulary is *data the guest declares*, not branches in core

The core runtime, sprite renderer, and audio engine must be **data-driven**. Every
`if (game == "…")` / `if (kind == "<game-shape>")` / hard-coded sound-id in core is
a leak; the ideal replaces each with a registration the game supplies.

| Current leak (core file) | Ideal |
|--------------------------|-------|
| `game_runtime.rgr`: `if (layout == "pong") showNet` / `if (layout == "invaders")` HUD branch | a generic `hud()`/RGU1 overlay the *game* builds; core renders whatever tree it's given |
| `game_sprite.rgr`: `kind == "wedge"` (Pac-Man mouth), `kind == "ghost"` (Pac-Man ghost) | a **registered shape-drawer table**: a game registers `("ghost", fn)`; core dispatches by lookup, ships only primitives (rect/circle/line/poly) |
| `game_audio.rgr`: builtin ids `"brick"`, `"bounce"`, `"wall"` | core owns a synth; **sound *names* are a per-game palette** the game registers; core maps id→spec via that table |
| `engine.d.ts`: `SpriteKind` includes `"wedge"|"ghost"`; `showNet?`; `BuiltinSoundId` = `brick|bounce|wall`; `declare const peerCar {…, steer, finishTick}` | the type surface names **mechanisms** only; game-specific kinds/sounds/globals live in a per-game `<game>.d.ts` (the pattern `breakout.d.ts` already establishes) |

Principle: **core provides a mechanism and a registration point; the game provides
the content.** A new shape, sound, or HUD gauge is a call into core, not an edit of
core.

---

## 5. One world, one owner

A world must be described in exactly one place. Today autopeli's road+traffic is
encoded **twice** — host `wasm_autopeli_setup.rgr` *and* guest
`rust_autopeli/src/lib.rs` — and they agree only by convention; change one and the
other silently disagrees.

Ideal ownership, in priority order:

1. **The guest owns the world.** It already declares resources
   (`declare_resources()` → `host_sheet`/`host_rect`). Extend the *same* declare-once
   channel so the guest also declares **bodies, bounds, world size, camera hints, and
   static-bg spec**. The default `GameSceneProvider` reads that generically, and the
   host-side `setupPhysics()` copy is **deleted**. The world lives only in the guest.
2. **A too-simple game** may instead ship a tiny `.rgr` provider in its own folder.
   Both routes satisfy the same interface; neither puts the world in core.

The declare-once discipline is inherited from the resource provider and must keep its
limits: declare-once (not runtime-streamable), fixed typed vocabulary, no pointers
cross, one-way guest→host.

---

## 6. Providers, not hand-wiring (the capability seam)

Every host capability a guest uses should plug into a **registry**, not be sewn into
the runner and all three guest bridges by hand (see `PLAN_PROVIDERS.md`). A provider
declares its own direction and cadence so the runner knows which hooks fire:

```
class GameProvider {
    fn id:string ()        ; "resource", "pose", "scene", …
    fn capBit:int ()       ; RG_WASM_HOST_CAP_* it satisfies (0 = base ABI)
    fn direction:int ()    ; 1 = guest->host, 2 = host->guest
    fn cadence:int ()      ; 1 = setup (once), 2 = frame (per physicsStep)
    fn onAttach / onDeclare / beforeUpdate / afterUpdate / onDetach
}
```

And the capability gate must actually run: the handshake
(`rg_required_caps` / `rg_check_env`) is exported by guests today but the host never
calls it. In the ideal, the registry computes the host's advertised caps as the OR of
every provider's `capBit()`, and rejects a guest whose required caps aren't met —
**once, right after load, before `update()`**. Adding a provider automatically widens
what the host advertises; there is no second list to keep in sync.

---

## 7. "Done" is mechanically checkable

The ideal is not reached by taste; it is reached when these pass:

1. **The leak-guard grep returns nothing** for every file that claims to be core:

   ```bash
   grep -rniE 'autopeli|\bpong\b|pacman|invaders|breakout|\bghost\b|\bwedge\b|steer|throttle|\bbrick\b' \
     gallery/game_engine/scripting/wasm_physics_runner.rgr \
     gallery/game_engine/scripting/wasm_game_runner.rgr \
     gallery/game_engine/scripting/game_runtime.rgr \
     gallery/game_engine/scripting/game_sprite.rgr \
     gallery/game_engine/scripting/game_audio.rgr \
     gallery/game_engine/scripting/wasm_abi_io.rgr \
     gallery/game_engine/scripting/engine.d.ts
   ```

   (Wire it into CI, allow-listing today's known offenders and tightening as each
   phase lands — `PLAN_PHYSICS_RUNNER_GENERIC.md` §5.)

2. **A shared header names no game.** `grep -i 'autopeli\|traffic\|cone\|hero\|knight'
   wasm/*.h` is empty; the remaining names live in guest-side headers.

3. **The second-game test passes.** A second, non-autopeli host-physics game (e.g. a
   bumper arena) loads through the *same* `WasmPhysicsRunner` with its own
   provider/guest, and runs. This is the real proof the abstraction holds, and it
   becomes a permanent regression fixture.

When all three hold, the core is genuinely write-once, and a new game is purely
additive: a folder under `games/`, a provider, and a guest — with not one line
changed in `scripting/` core.

---

## 8. One-line summary

**The ABI transports bytes and the guest owns their meaning; the core asks a
`GameSceneProvider` for the world instead of being one game; game vocabulary is data
a game registers, never a branch in core — and a grep guard plus a second game prove
it stays that way.**
