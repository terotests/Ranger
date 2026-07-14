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

## The ABI today — current state, problems, and what it does not expose

Before the target: a snapshot of what the shared ABI actually *is* right now, why
it leaks, and which capabilities a game needs but the ABI never hands it (or hands
it only through an ad-hoc, path-specific side channel). This grounds every "ideal"
in §2–§6 against the concrete surface as of today.

### The current surface

Three shared headers under [`wasm/`](./wasm/) define the transport, and every guest
(compiled Rust/AssemblyScript via [`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr),
or interpreted `.as` via [`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)) mirrors
the same byte offsets:

| Block | Header | Purpose | Size | Direction |
|-------|--------|---------|------|-----------|
| **RGW1** | [`wasm_game_abi.h`](./wasm/wasm_game_abi.h) | world / physics | 2560 B | mostly guest→host |
| **RGSP1** | [`wasm_sprite_abi.h`](./wasm/wasm_sprite_abi.h) | ready-character sprites | 2560 B | host writes catalog + input, guest writes slots |
| **RGU1** | [`wasm_ui_abi.h`](./wasm/wasm_ui_abi.h) | retained-mode UI | 8192 B | guest→host (+ optional `rg_ui_event` back) |

Concretely, RGW1 is a fixed 2560-byte block: a 64-byte header, then
`bodies[32]×24`, `controls[32]×16`, `impulses[16]×16`, `contacts[14]×32`,
`events[12]×20` (at 2048), and a capability-query tail (RGCQ, at 2304). World
coordinates are fixed-point (`FP_SCALE 256`). A forward-compat handshake is
*declared* (`rg_abi_version` / `rg_ui_abi` / `rg_required_caps` /
`rg_declare_queries` / `rg_check_env`, plus `RG_WASM_HOST_CAP_*` bits and the typed
RGCQ query).

**The host→guest channel in RGW1 is only four header words:** `dt_ms`, `time_ms`,
`input`, `input_p2`. Everything else — bodies, controls, impulses, contacts,
events, `score`, `hits`, `camera_y`, `air_p1/p2` — flows guest→host.

Beyond those three headers, several blocks exist **only by convention in code, with
no shared `wasm/*.h`**: `RGP1` pose input (a 128-byte host→guest block wired in
[`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr) and `pose/`), the `RGS1` guest
sprite draw list, the host resource manifest (`hostSheet` / `hostRect`), and a guest
sound queue — the last three are **native-array APIs on the interpreted `.as` path
only**. `RGX1` (streaming) and `RGLD` (loader) are named as siblings but likewise
have no canonical header.

### Problems with the ABI as it stands

| # | Problem | Evidence | Fixed by |
|---|---------|----------|----------|
| 1 | **Game taxonomy frozen into the transport header.** | `RG_WASM_GRIP_SCALE`, `RG_WASM_STEER_SCALE`, `RG_WASM_ID_CONE0`, `RG_WASM_ID_BAR0`, `RG_WASM_BODY_TRAFFIC0`, `RG_WASM_TRAFFIC_COUNT 15`, `RG_WASM_SOUND_WALL/BOUNCE/WIN` in `wasm_game_abi.h`; `RG_SPR_CHAR_HERO/KNIGHT/MAGE/ROGUE` in `wasm_sprite_abi.h`. | §2.1 |
| 2 | **The control record is car-shaped.** The 16-byte record is `steer/throttle/brake/grip`, and that vocabulary leaks host-side into `readControlSteer/Throttle/Brake/Grip` ([`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr)) and `writeControl(steer,throttle,brake,grip)` ([`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)). | §2.2 |
| 3 | **Autopeli scalars sit in the shared header.** `RG_WASM_OFF_AIR_P1/P2` are one game's values living in a header every game must include. | §2.1 |
| 4 | **A comment names a game in a shared header.** `/* Standard body indices (autopeli) */`. A game name in a transport header *is* the bug. | §2.1 |
| 5 | **The capability gate is dead.** Guests may export `rg_abi_version` / `rg_required_caps` / `rg_check_env`, but nothing in `scripting/` ever calls them (grep = 0 hits), so a guest that needs a missing cap reads zeroed memory instead of being rejected at load. | §6 |
| 6 | **The world is encoded twice.** The road + traffic live in both `wasm_autopeli_setup.rgr` (host) and `rust_autopeli/src/lib.rs` (guest); they agree only by convention. | §5 |
| 7 | **RGCQ negotiation is inert.** The typed query tail exists, but no host resolves `rg_declare_queries` / `rg_check_env`, so every guest silently falls back to its own defaults. | §6 |

### Interfaces the ABI does not expose, or exposes only partially

These are capabilities a game realistically needs that the shared ABI hands over
incompletely — or not at all — today. Each is a candidate seam the ideal must open
without re-widening the leaks above.

| Capability a game needs | Status today | Limitation | Ideal home |
|-------------------------|--------------|------------|------------|
| Declare its own **world** (bodies, bounds, world size, player count, camera hints, static-bg) | Partial | The guest declares *resources* (sheets/rects) through the manifest, but **not** bodies/bounds/world-size/player-count; those come from the host's own copy. No `worldSize()`/`playerCount()` channel. | §3, §5 |
| Know the **viewport / screen size** in a physics guest | Missing | RGSP1 has `VIEW_W`/`VIEW_H`, but RGW1 has no view fields, so a physics guest cannot size or letterbox itself. | §2.1 (RGCQ `screen.*`) |
| **Richer input** (analog sticks, pointer/touch, text, per-player remap) | Minimal | Only two i32 bitfields (`input`, `input_p2`); no analog axes, no pointer, no text entry. | §2.1 |
| **Pose / body-tracking input** | Ad-hoc | Exists as an undocumented 128-byte `RGP1` block on the `.as` path only; no shared header, fixed to `present`/`gesture`/landmarks. | §2.3, §6 |
| **Game-defined sound palette** | Rigid | A fixed enum (`RG_WASM_SOUND_WALL/BOUNCE/WIN`) in the header; the `.as` path bolts on an integer `playSound` queue instead. No way to register a per-game palette through the ABI. | §4 |
| **Generic guest scalar slots** | Missing | Only `air_p1/air_p2` are hard-coded; there is no documented generic "guest scalar" the host transports opaquely. | §2.1 |
| **Genre-neutral control channels** | Missing | Only the four named car channels; no indexed `readControlChannel(body, ch)`. | §2.2 |
| **Data-driven sprite roster & animations** | Partial | A catalog-id table (`RG_SPR_OFF_CAT_IDS`) exists, but character ids are still frozen constants, and animations are limited to `WALK/RUN/JUMP` with `RUN`/`JUMP` falling back to `WALK`. | §2.1 |
| **Guest draw list / resource manifest / sound queue as first-class ABI** | Path-specific | `RGS1`, the resource manifest, and the sound queue are native-array APIs on the interpreted `.as` path only — not a shared byte block, so compiled-WASM guests cannot use them uniformly. | §2, §5 |
| **Streaming (`RGX1`) and loader (`RGLD`)** | Unheadered | Referenced as siblings of RGW1 but have no canonical `wasm/*.h`, so their offsets are not a stable contract. | §2 |
| **Save-state / persistence, networking, clock/RNG seed, config negotiation** | Absent | Nothing beyond `dt_ms`/`time_ms`; no deterministic seed, no persistence, no negotiated timestep/config. | §2.1 (RGCQ), §6 |
| **RGU1 interactivity** | Optional | The document is guest→host; `rg_ui_event` (activate/select) is an optional export and selection state lives on the host. | §2.3 |

---

## Affected areas — the work to reach better organisation and interface parity

The state above exposes two kinds of gap, and every affected area below is chosen to
close one or both:

- **Parity across ABI *blocks*.** RGW1 / RGSP1 / RGU1 each earned a header, a
  magic/version/size, and (for RGU1) a validation contract; `RGP1`, `RGS1`, `RGLD`,
  `RGX1` did not. Parity means *every* block shares the same discipline — a
  `wasm/*.h` offset header, a versioned magic, a host validator, and a capability
  bit — so no block is a second-class citizen.
- **Parity across guest *paths*.** The compiled-WASM path
  ([`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr)) and the interpreted `.as` path
  ([`as_abi_bridge.rgr`](./scripting/as_abi_bridge.rgr)) must expose the *same*
  capabilities against the *same* offsets. Today pose, the sprite draw list, the
  resource manifest, and the sound queue exist only on the `.as` path — a game
  written once does not behave identically on both backends.

The areas, ordered roughly by how much they unblock the rest:

| # | Affected area | Files | Organisation gain | Parity gain | Target § |
|---|---------------|-------|-------------------|-------------|----------|
| 1 | **Split game taxonomy out of the shared headers** | `wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h` → guest crates (`wasm/rust_autopeli/`, `wasm/as_autopeli/`) | Header holds only bytes/offsets/handshake; no game name or comment | — | §2.1 |
| 2 | **Generic control channels** | `wasm/wasm_game_abi.h`, `scripting/wasm_abi_io.rgr` (`readControlSteer/…` → `readControlChannel`), `scripting/as_abi_bridge.rgr` (`writeControl`) | One record shape for all genres | Both guest paths read/write the same indexed channels | §2.2 |
| 3 | **Give every informal block a header** (`RGP1` pose, `RGS1` draw list, `RGLD` loader, `RGX1` streaming) | new `wasm/wasm_pose_abi.h`, `wasm/wasm_sprite_list_abi.h`, `wasm/wasm_loader_abi.h`, `wasm/wasm_stream_abi.h` (siblings of the three existing headers) | Every block has one canonical offset table + versioned magic | The compiled-WASM path can implement what only `.as` has today | §2, §2.3 |
| 4 | **Bring `.as`-only APIs to parity on both paths** (pose, draw list, resource manifest, sound queue) | `scripting/wasm_abi_io.rgr` (add readers), `scripting/as_abi_bridge.rgr` (back native-array APIs with the documented byte blocks) | One accessor per block, per path, sharing offsets | A guest runs identically compiled or interpreted | §2 |
| 5 | **Activate the capability handshake + gate** | `scripting/wasm_physics_runner.rgr`, `scripting/wasm_game_runner.rgr`, `scripting/wasm_sprite_runner.rgr`, `scripting/as_source_runner.rgr` (shared gate helper) | One place calls `rg_abi_version`/`rg_required_caps`/`rg_check_env` + resolves RGCQ | Same gate for every guest/block/path; a missing cap rejects instead of reading zeros | §6 |
| 6 | **Uniform block validation** (magic/version/bounds/utf-8), copying RGU1's discipline | `scripting/wasm_abi_io.rgr` (`verifyMagic` generalised), a shared validator for RGW1/RGSP1/RGP1/RGS1 | One validator, not per-block ad-hoc checks | Every block is validated the same before use, on both paths | §2.3 |
| 7 | **Provider registry for host↔guest capabilities** | `scripting/PLAN_PROVIDERS.md`, `scripting/game_pose_provider.rgr`, `scripting/game_image_loader.rgr`, the runners in row 5 | Capabilities wire at fixed seams, not by hand | Adding a block = registering a provider (capBit/direction/cadence); parity is enforced by construction | §6 |
| 8 | **Generic scene seam** (`GameSceneProvider` instead of concrete autopeli types) | `scripting/wasm_physics_runner.rgr`, `scripting/wasm_game_runner.rgr` (drop `Import "./wasm_autopeli_setup.rgr"` / `wasm_autopeli_render.rgr`), logic → `games/autopeli_wasm/scene/` | Core compiles against an interface, not a game | A second physics game reuses the runner unchanged | §3 |
| 9 | **Single world owner** (guest declares bodies/bounds/world-size/camera via the declare-once channel) | `scripting/wasm_autopeli_setup.rgr` (deleted), guest `lib.rs`, the resource-manifest block from row 3 | World lives in exactly one place | Same declaration works on both paths | §5 |
| 10 | **Data-driven sprite roster & animations** | `wasm/wasm_sprite_abi.h` (drop `RG_SPR_CHAR_*`), `lpc/src/lpc_char_catalog.rgr`, `lpc/pack/**/catalog.json` | Roster is data (`RG_SPR_OFF_CAT_IDS`), not frozen constants | Same catalog visible to every guest/path; documented anim fallbacks | §2.1 |
| 11 | **Unified sound palette** (fold RGW1 sound enum + `.as` sound queue into one registered per-game palette) | `scripting/game_audio.rgr`, `scripting/wasm_abi_io.rgr`, `scripting/as_abi_bridge.rgr`, `wasm/wasm_game_abi.h` | Core owns a synth; names are game data | One sound mechanism on both paths, no fixed ids | §4 |
| 12 | **Richer, uniform host→guest input** (analog/pointer/pose beyond two bitfields; add view size to RGW1) | `wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h`, the runners in row 5 | Input is one typed surface, not scattered header words | RGW1 and RGSP1 carry the same input + viewport fields | §2.1 |
| 13 | **ABI index + CI leak guard** | new `wasm/README.md` (block/version/direction/header index), CI wiring of the §7 grep | One document enumerates every block; drift is caught mechanically | The guard runs against every core file and header equally | §7 |
| 14 | **Cross-path & second-game conformance fixtures** | `games/<second_physics_game>/`, a test that runs one guest on WASM *and* `.as` and diffs the block bytes | Proof the abstraction holds becomes a permanent test | Guarantees the two paths stay byte-identical | §7 |

Rows 1–4 are the ABI-surface cleanup, rows 5–7 the wiring/enforcement layer, rows
8–11 the seam/ownership moves, and rows 12–14 the input, documentation, and proof
that lock parity in. They map onto the concrete changes in §8 (rows 1/2/8/11/9
correspond to summary changes 1–5) plus the parity-specific additions (rows 3–7,
10, 12–14) that this analysis surfaces.

---

## Use cases — what a developer wants, and how the interface answers

The point of the whole design is that each of these is *additive*: something the
game or its own guest supplies, with no edit to `scripting/` core. If a use case
below forces a core edit today, that is the leak the referenced section removes.

| Use case | What the developer does | How the interface answers | § |
|----------|-------------------------|---------------------------|---|
| Add a second physics game (e.g. a bumper arena) beside autopeli | Write a `GameSceneProvider` + a guest under `games/<name>/` | Core (`WasmPhysicsRunner`) is compiled against the interface, so it drives the new game with **zero core edits**; the leak-grep + "second game" fixture prove it. | §3, §7 |
| Port a game from Rust to AssemblyScript (or add a C guest) | Recompile the guest against the same ABI offsets; leave the host untouched | The ABI is a byte transport shared by every guest language; the game's *names* live in its own source, so the host reads identical channels regardless of guest. | §2.1–§2.2 |
| Change the track layout or traffic count | Edit constants in the guest source only | The world has a **single owner** (the guest); the host-side copy is deleted, so nothing can drift out of sync. | §5 |
| Add a host capability (pose input, rumble, particles) | Register a `GameProvider` with its `capBit` / direction / cadence | The registry wires it at the three fixed seams and advertises the cap; a guest that *requires* it is gated at load instead of reading zeroed memory. | §6 |
| A game needs a new on-screen shape (a ghost) or sound | Call `registerShape("ghost", fn)` / `registerSound("brick", spec)` at setup | Core dispatches by table lookup and ships only primitives; no `kind=="ghost"` / `"brick"` branch is added to `game_sprite.rgr` / `game_audio.rgr`. | §4 |
| A game needs a custom HUD (score, gauges, menu) | Build a retained-mode RGU1 document each frame in the guest | The guest owns the UI document and the host renders it; no per-game HUD branch in `game_runtime.rgr`. | §2.3, §4 |
| Ship a new playable character in the sprite game | Add it to the character pack + catalog table; select it by numeric id | The sprite ABI carries a runtime catalog (`RG_SPR_OFF_CAT_IDS`), so the roster is data — not an `RG_SPR_CHAR_*` constant frozen into the header. | §2.1 |
| Run a game on a device missing a feature (no GPU / gamepad / pose camera) | Nothing extra — the guest queries capabilities and adapts or aborts cleanly | The typed capability query (RGCQ) + `rg_check_env` let the guest narrow behaviour or reject with a reason, instead of crashing on absent hardware. | §2.1, §6 |

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

§7 turns this invariant into a grep + a regression fixture.

---

## 1. The three layers (the boundary every file is on exactly one side of)

| Layer | Lives in | Knows about | Must NOT know about |
|-------|----------|-------------|---------------------|
| **Engine core** | `scripting/` runtimes, `framebuffer.rgr`, ABI helpers, generic runners | Framebuffers, the ABI *shape*, physics primitives, sprite/HUD *mechanisms* | Any specific game — its entities, world size, sprites, HUD gauges, sound names, player count |
| **Reusable subsystems** | `physics/`, `lpc/`, `menu/`, `ui/`, `pose/` | Their own domain (bodies, spritesheets, UI trees) | *Which* game is using them |
| **A game** | `games/<name>/`, its WASM/`.as`/TSX guest, its `<Name>Scene`/`Render`/`Hud` modules | Everything about itself | Nothing in core needs to know it exists |

Every leak in this codebase is a violation at a *seam* between two of these layers,
so §2–§6 each specify one seam. §2 is the widest (the ABI, shared by three guest
languages and the host), so it gets the most detail.

---

## 2. The ideal WASM ABI — a *transport*, never a *taxonomy*

The shared ABI is three headers: `wasm/wasm_game_abi.h` (RGW1, world/physics),
`wasm/wasm_sprite_abi.h` (RGSP1, characters), `wasm/wasm_ui_abi.h` (RGU1, UI).

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

(A C or C++ guest, if one is ever added, would use a `.h`; the common guests are
Rust and AssemblyScript.)

Consequently the host side stays genre-neutral too: `wasm_abi_io.rgr` exposes
`readControlChannel(bodyIdx, ch)` — **not** `readControlSteer/Throttle/Brake/Grip` —
and `as_abi_bridge.rgr`'s `writeControl` takes indexed channels.

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

The registration table lives in core; its entries come from the game at load time
(the game calls `registerShape("ghost", fn)` / `registerSound("brick", spec)` during
setup). Adding a shape, sound, or HUD gauge is then a call from the game, with no
edit to `game_sprite.rgr` / `game_audio.rgr` / `game_runtime.rgr`.

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

The target is met when these three checks pass:

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

## 8. Summary — the five concrete changes

| # | Change | Files it touches | Section |
|---|--------|------------------|---------|
| 1 | Move each game-specific constant out of the shared headers into the owning guest's Rust/AS source; leave only byte offsets, record shapes, and the handshake in `wasm/*.h`. | `wasm/wasm_game_abi.h`, `wasm/wasm_sprite_abi.h` → guest crates | §2.1 |
| 2 | Replace the `steer/throttle/brake/grip` control record with four indexed channels; `wasm_abi_io.rgr` / `as_abi_bridge.rgr` read/write channels by index. | `wasm_game_abi.h`, `wasm_abi_io.rgr`, `as_abi_bridge.rgr` | §2.2 |
| 3 | Give `wasm_physics_runner.rgr` a `provider:GameSceneProvider` field instead of concrete `setup`/`render` autopeli types and imports; move that logic to `games/autopeli_wasm/scene/`. | `wasm_physics_runner.rgr`, `wasm_game_runner.rgr` | §3 |
| 4 | Turn the `if (layout=="pong")`, `kind=="ghost"`, and `"brick"`-sound branches into game-supplied registrations. | `game_runtime.rgr`, `game_sprite.rgr`, `game_audio.rgr`, `engine.d.ts` | §4 |
| 5 | Make the guest the single owner of its world (bodies/bounds/camera declared through the resource channel); delete the host-side `setupPhysics()` copy. | `wasm_autopeli_setup.rgr` (deleted), guest `lib.rs` | §5 |

Enforcement (§7): a CI grep guard fails when a core file names a game, and a second
host-physics game running through the same `WasmPhysicsRunner` is the regression
fixture that proves the seam holds.
