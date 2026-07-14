# IDEAL_API — the full game-engine ABI, consolidated

This is the **API reference** for the interfaces proposed in [`IDEAL.md`](./IDEAL.md).
Where `IDEAL.md` argues *why* each interface should look the way it does, this document
collects the *what*: every block layout, host import, guest export, event, registry, and
capability bit in one place, so a guest or host author can implement against a single
contract.

Everything here is a **target specification.** Some of it ships today (RGW1, RGSP1, RGU1);
much of it is proposed. Each entry links back to the chapter of `IDEAL.md` that motivates
it. When the two documents disagree, `IDEAL.md` is the source of intent and this file is
the derived surface.

---

## 0. Conventions

These rules hold for *every* block and import below.

### 0.1 The three-layer boundary

| Layer | Who | Sees |
|-------|-----|------|
| **Host** | engine core (`scripting/`, `gfx_sdl.rgr`, …) | owns memory, devices, rendering, simulation |
| **ABI** | shared `wasm/*.h` byte contracts + host imports | *transport only* — bytes and structure, never game meaning |
| **Guest** | the game (Rust / AssemblyScript `.wasm`, or interpreted `.as`, or TS) | owns *meaning* — names channels, declares its world, registers its vocabulary |

The ABI is a **transport, never a taxonomy** (§2.1). A block defines *bytes and
structure*; the guest assigns meaning. No game name, sound id, character kind, or control
label belongs in a shared header.

### 0.2 Fixed-point

| Constant | Value | Used for |
|----------|-------|----------|
| `FP_SCALE` | `256` | world/screen positions, normalized `[0,1]`, gain/pan/pitch ratios (`FP = unity`) |
| `FP_VEL` (`RG_POSE_FP_VEL`) | `65536` (Q16.16) | velocities and speeds, per second |

Anything fed *back* to the guest that could affect logic (a hit test, an unprojected
pointer, a persisted read) uses fixed-point so results match across CPU, GPU, and replays.

### 0.3 Block discipline (the RGU1 rule — §2.3)

Every block copies RGU1's discipline:

- **Fixed, typed layout** at documented byte offsets; no pointers ever cross the boundary.
- **Snapshot-first**: the writer publishes a complete, self-consistent block.
- **Host validates** the block as untrusted data (magic, version, size, counts clamped).
- **Tear-free** cross-thread reads use a seqlock `revision` (odd = writing, even = stable)
  or a monotonic revision bump.

Standard header words every new block should carry:

```c
#define RG_*_OFF_MAGIC     0   /* u32 four-char block id, little-endian */
#define RG_*_OFF_VERSION   4   /* u32 ABI version the writer wrote      */
#define RG_*_OFF_SIZE      8   /* u32 total block bytes                 */
#define RG_*_OFF_REVISION  12  /* u32 seqlock: odd=writing, even=stable */
```

### 0.4 Handles (§2.6)

Host objects a guest creates and frees are addressed by an **opaque handle**, never a
pointer:

- A handle encodes a **slot index + a generation counter**. A handle used after free fails
  the generation check and becomes a **safe no-op**, not a dangling access.
- Handle **`0` is null / allocation failure**.
- Every handle belongs to the **spawning guest's arena**; on unload/teardown/fault the host
  **bulk-frees the arena**, so a sandboxed guest cannot leak host objects.
- Pools are **bounded**; allocation past capacity returns `0` so the guest back-pressures.

This one discipline backs dynamic UI (§2.6), streamed resources (§2.7), sprite sheets
(§2.8), audio (§2.10), animation (§2.12), and haptics (§2.9).

### 0.5 Direction, cadence, determinism

- **Direction**: `1 = guest→host`, `2 = host→guest`.
- **Cadence**: `1 = setup (once)`, `2 = frame (per step)`.
- **Determinism**: output-only channels (audio, haptics, particles, cosmetic animation,
  logging) **must never feed logic, RNG, or step order**. Inputs (pose, controls, capability
  reads at init, gameplay-animation lifecycle events, persisted reads) are **deterministic**:
  a replay sees the same values at the same step. Genuine runtime changes (resize, hotplug)
  arrive as **events**, never silent mid-step mutations.

### 0.6 Capability gating (§6, §2.14)

- Hard requirements go through the `RG_WASM_HOST_CAP_*` **bitmask**: a guest declares its
  required caps; the host rejects an unsatisfiable guest **once, right after load, before
  the first `update()`**, with a surfaced reason.
- Soft capabilities go through the typed **environment query** (§2.14): the guest asks, the
  host answers, the guest **adapts or degrades** (no GPU → software; no pad → D-pad; no
  storage → no-op writes / absent reads).

---

## 1. Lifecycle & capability handshake (§2.14, §6)

The defined init lifecycle, available on **every** path (WASM / `.as` / TS):

```
load → negotiate → init → loop
```

### 1.1 Handshake exports (guest → host)

| Export | Purpose |
|--------|---------|
| `rg_abi_version() -> u32` | ABI version the guest was built against. |
| `rg_ui_abi() -> u32` | RGU1 version, if the guest uses UI. |
| `rg_required_caps() -> u32` | OR of `RG_WASM_HOST_CAP_*` bits the guest *must* have. Host rejects if unmet. |
| `rg_declare_queries(...)` | Guest declares the soft-capability keys it wants answered. |
| `rg_check_env(...)` | Guest reads the resolved environment (see §1.3). |

The host's advertised caps are the **OR of every attached provider's `capBit()`** (§6), so
adding a provider automatically widens what the host offers — there is no second list.

### 1.2 Environment descriptor (host → guest, read once at init)

A typed key/value block the host publishes; keys are **open and typed**, but the core set is
documented convention (§2.14), not per-host invention:

```
screen.width / screen.height / screen.dpi / screen.refreshHz / screen.safeArea
device.type        # 0=desktop 1=handheld 2=tv 3=phone 4=embedded
input.keyboard / input.pointer / input.touch / input.gamepads(count) / input.pose
audio / haptics / gpu / storage / network      # present + limits
locale / clock.monotonic
log.level                                       # global log level (§2.16)
```

Capabilities are **read once at init** (stable inputs). Runtime changes (resize, gamepad
hotplug) arrive as **events**, not silent value swaps. Viewport is a first-class field on
*every* block (RGW1 gains view fields), and a **resize** is a lifecycle event.

---

## 2. Blocks (data layouts)

Shipping blocks are marked **shipped**; proposed blocks/fields are marked **proposed**.

### 2.1 Overview

| Block | Header | Purpose | Size | Direction | Status |
|-------|--------|---------|------|-----------|--------|
| **RGW1** | `wasm/wasm_game_abi.h` | world / physics | 2560 B | mostly guest→host | shipped |
| **RGSP1** | `wasm/wasm_sprite_abi.h` | ready-character sprites | 2560 B | host writes catalog+input, guest writes slots | shipped |
| **RGU1** | `wasm/wasm_ui_abi.h` | retained-mode UI | 8192 B | guest→host (+ optional `rg_ui_event`) | shipped |
| **RGP1** | `wasm/wasm_pose_abi.h` | pose / body tracking | (v2) | host→guest | proposed header (§2.4) |
| **RGO1** | `wasm/*.h` | game observation snapshot | — | host→worker | proposed (§2.7) |
| **RGX1** | `wasm/*.h` | streaming worker observation/results | 2560 B | host↔worker | proposed header (§2.7) |
| **RGLD** | `wasm/*.h` | resource loader requests/responses | — | host↔worker | proposed header (§2.7) |
| **RG_CAM** | `wasm/*.h` | camera + view matrix | — | guest→host (+ matrix back) | proposed (§2.17) |

RGW1 layout (shipped): 64-byte header, then `bodies[32]×24`, `controls[32]×16`,
`impulses[16]×16`, `contacts[14]×32`, `events[12]×20` (@2048), RGCQ tail (@2304).
Today the **host→guest** channel in RGW1 is only four header words: `dt_ms`, `time_ms`,
`input`, `input_p2`.

### 2.2 Control record (RGW1 `controls[]`, 16 B) — §2.2

Genre-neutral: four opaque scalar channels. The **guest** names them in its own source.

```c
#define RG_WASM_CTRL_OFF_CH0    0   /* i32 fixed-point control channel 0 */
#define RG_WASM_CTRL_OFF_CH1    4   /* i32 fixed-point control channel 1 */
#define RG_WASM_CTRL_OFF_CH2    8   /* i32 fixed-point control channel 2 */
#define RG_WASM_CTRL_OFF_CH3    12  /* i32 fixed-point control channel 3 */
```

Host side stays neutral: `readControlChannel(bodyIdx, ch)` / indexed `writeControl` — never
`steer/throttle/brake/grip`.

### 2.3 Physics: body, shape, contact (RGW1) — §2.5

The **24-byte body record streams pose only** (`x, y, angle, speed, angVel, flags`).
Collision **geometry is declared once** (guest-owned), not carried per frame.

```c
/* body.flags — additive, genre-neutral */
#define RG_WASM_BODY_ACTIVE    1u
#define RG_WASM_BODY_STATIC    2u  /* infinite mass                          */
#define RG_WASM_BODY_SENSOR    4u  /* report overlaps, apply NO response      */
/* + a u16 layer + u16 mask per body: "which layers am I, which do I hit"    */

/* Per-body collision descriptor (declared once, guest-owned) */
#define RG_WASM_SHAPE_CIRCLE   1   /* a = radius (fp)                         */
#define RG_WASM_SHAPE_BOX      2   /* a = halfW, b = halfH (fp)               */
#define RG_WASM_SHAPE_SEGMENT  3   /* a..d = x1,y1,x2,y2 (fp)                 */
#define RG_WASM_SHAPE_POLYGON  4   /* a = vertex count -> side vertex table   */

/* Contact phases (RGW1) — complete three-phase model */
#define RG_WASM_CONTACT_PHASE_BEGIN   1   /* pair started touching this step  */
#define RG_WASM_CONTACT_PHASE_PERSIST 2   /* still touching                   */
#define RG_WASM_CONTACT_PHASE_END     3   /* separated this step              */
```

The contact record carries a full manifold: `bodyA/B`, point, normal, **penetration depth**,
normal impulse, and **tangent (friction) impulse**. `MAX_CONTACTS` overflow policy is
documented (drop-lowest-impulse), not a silent clamp. Simulation sits behind a
`PhysicsWorld` interface (`addBody` / `setBounds` / `step(dt)` / `contacts()`) so the arcade
core, the `cannon` rigid-body port, or a host-native engine are selectable with **no ABI
change** — the ABI transports *results* (poses + contacts), never engine internals.

### 2.4 Pose block (RGP1 v2) — §2.4

Host→guest streaming skeleton with **motion and speed as first-class channels**. Replaces
the drifting per-host layouts with one shared `wasm/wasm_pose_abi.h`.

```c
#define RG_POSE_ABI_MAGIC   0x31504752u /* 'RGP1' little-endian */
#define RG_POSE_ABI_VERSION 2u
#define RG_POSE_MAX_LM      33u          /* BlazePose skeleton              */
#define RG_POSE_FP_SCALE    256          /* positions: normalized[0,1]*256  */
#define RG_POSE_FP_VEL      65536        /* velocity/speed: Q16.16 per sec  */

/* Header */
#define RG_POSE_OFF_MAGIC      0   /* u32 'RGP1'                                  */
#define RG_POSE_OFF_VERSION    4   /* u32 ABI version the host wrote              */
#define RG_POSE_OFF_SIZE       8   /* u32 total block bytes                       */
#define RG_POSE_OFF_REVISION   12  /* u32 seqlock: odd=writing, even=stable       */
#define RG_POSE_OFF_PRESENT    16  /* u32 1 if a pose was detected this sample    */
#define RG_POSE_OFF_GESTURE    20  /* i32 guest-defined gesture id (0 = none)     */
#define RG_POSE_OFF_LM_COUNT   24  /* u32 landmarks written this sample           */
#define RG_POSE_OFF_TIME_MS    28  /* i32 capture timestamp, monotonic ms         */
#define RG_POSE_OFF_DT_MS      32  /* i32 ms since the previous published sample   */
#define RG_POSE_OFF_FLAGS      36  /* u32 RG_POSE_FLAG_*                           */
#define RG_POSE_OFF_BODY_VX    40  /* i32 aggregate body velocity x (FP_VEL)      */
#define RG_POSE_OFF_BODY_VY    44  /* i32 aggregate body velocity y (FP_VEL)      */
#define RG_POSE_OFF_BODY_SPEED 48  /* i32 aggregate body speed |v| (FP_VEL)       */
#define RG_POSE_HEADER_SIZE    64

/* Landmark array */
#define RG_POSE_OFF_LM0        64
#define RG_POSE_LM_SIZE        24
#define RG_POSE_LM_OFF_X       0   /* i32 normalized x * FP_SCALE  (+x = right)    */
#define RG_POSE_LM_OFF_Y       4   /* i32 normalized y * FP_SCALE  (+y = down)     */
#define RG_POSE_LM_OFF_VX      8   /* i32 velocity x, normalized/sec * FP_VEL     */
#define RG_POSE_LM_OFF_VY      12  /* i32 velocity y, normalized/sec * FP_VEL     */
#define RG_POSE_LM_OFF_SPEED   16  /* i32 |velocity|, normalized/sec * FP_VEL     */
#define RG_POSE_LM_OFF_CONF    20  /* i32 visibility/confidence, 0..FP_SCALE      */

/* Flags */
#define RG_POSE_FLAG_VALID         1u /* host finished a full frame               */
#define RG_POSE_FLAG_HAS_VEL       2u /* velocity/speed are host-provided         */
#define RG_POSE_FLAG_SMOOTHED      4u /* landmarks passed the host filter         */
#define RG_POSE_FLAG_JUST_APPEARED 8u /* present flipped 0->1; velocity zeroed     */
```

Motion (`vx/vy`), speed (`|v|`), and an aggregate body velocity/speed are **host-provided**
(the host computes them from consecutive frames and smooths them), gated by
`RG_POSE_FLAG_HAS_VEL` and `RG_WASM_HOST_CAP_POSE_INPUT`.

### 2.5 Input record (host → guest) — §2.9

One typed per-player input record, transported for N players. The digital
`Buttons`/`PlayerButtons` model stays the simple default; analog/pointer are additive.

```c
#define RG_IN_OFF_BUTTONS   0   /* u32 digital bitfield (D-pad, face, start/select) */
#define RG_IN_OFF_LSTICK_X  4   /* i32 left stick x,  -FP..+FP (normalized * FP)    */
#define RG_IN_OFF_LSTICK_Y  8   /* i32 left stick y                                 */
#define RG_IN_OFF_RSTICK_X  12  /* i32 right stick x                                */
#define RG_IN_OFF_RSTICK_Y  16  /* i32 right stick y                                */
#define RG_IN_OFF_TRIG_L    20  /* i32 left trigger,  0..FP                         */
#define RG_IN_OFF_TRIG_R    24  /* i32 right trigger, 0..FP                         */
#define RG_IN_OFF_POINTER_X 28  /* i32 pointer/touch x in view px (-1 = none)       */
#define RG_IN_OFF_POINTER_Y 32  /* i32 pointer/touch y                              */
#define RG_IN_OFF_FLAGS     36  /* u32 pointerDown, connected, ...                  */
```

Games declare **semantic actions** ("jump", "steer") and the host maps physical inputs →
actions through a **remappable table** the guest (or a settings UI) supplies. Device
connect/disconnect is surfaced as an event (hotplug).

### 2.6 Sound event (guest → host) — §2.10

Same record on RGW1, `.as`, and TS. The id references a **game-registered palette** (§4),
never a frozen enum.

```c
#define RG_SND_OFF_KIND     0   /* u32 0=sfx 1=voice 2=music-start 3=music-stop */
#define RG_SND_OFF_ID       4   /* u32 registered sound id (see §4 palette)     */
#define RG_SND_OFF_GAIN     8   /* i32 gain 0..FP (FP = unity)                  */
#define RG_SND_OFF_PAN      12  /* i32 pan -FP..+FP (0 = centre)                */
#define RG_SND_OFF_PITCH    16  /* i32 pitch ratio * FP (FP = no shift)         */
#define RG_SND_OFF_FLAGS    20  /* u32 loop, positional, ...                    */
#define RG_SND_OFF_X        24  /* i32 world x (positional, * FP_SCALE)         */
#define RG_SND_OFF_Y        28  /* i32 world y                                  */
```

One-shots are fire-and-forget by id; loops/music/long voices return a **handle** (§0.4) for
gain/stop/crossfade. Music (`kind = 2/3`) may be a decoded track *or* a **soundscore**
(§3.5). Sounds are §2.7 resources behind one decoder (WAV + a compressed format).

### 2.7 Camera block (RG_CAM) — §2.17

Guest declares the camera; host writes back the resolved matrix and viewport.

```c
/* Camera block (guest -> host); fixed-point per §0.2 */
#define RG_CAM_OFF_X       0   /* i32 camera world x (* FP_SCALE)          */
#define RG_CAM_OFF_Y       4   /* i32 camera world y                       */
#define RG_CAM_OFF_ZOOM    8   /* i32 zoom (* FP; FP = 1x)                 */
#define RG_CAM_OFF_ROT     12  /* i32 rotation (* FP radians)             */
#define RG_CAM_OFF_FOLLOW  16  /* u32 follow entity id (0 = free)          */
/* host writes back the resolved 3x3 view matrix + viewport for the guest  */
#define RG_CAM_OFF_VIEW_M  32  /* 6×i32 affine (a b c d e f), host-written */
```

One camera model → one affine `Mat3` view matrix applied on **software and GPU**
(`screen = view · world`). The host also exposes the **inverse** (screen ↔ world) for
pointer/touch picking and world-anchored HUD. A shared per-object local transform
(translation, rotation, scale, pivot, optional parent/child) generalises the stranded
`cannon_mat3`/`cannon_transform` math into the 2D engine.

### 2.8 Resource / streaming blocks — §2.7

- **RGO1** (host→worker, revision-gated snapshot): camera transform + view volume, world
  bounds/grid, time, and an optional `wishlist[]` of `(resourceKey, priority)`.
- **RGX1** (host↔worker, 2560 B): host writes an observation (camera transform, view size,
  world grid, entity list); the worker writes back visibility flags + cell **load/free**
  requests, driven by a residency ring with hysteresis (`preload` < `retire`).
- **RGLD** (host↔worker): a request `(cell + kind = load/generate)` → the worker **produces**
  a resource; a free request → it **releases** it, reporting `live/peak/gen/freed`.

Invariant (the streaming regression fixture, §5): **`gen − freed = live`** — bounded live
memory under unbounded travel.

---

## 3. Host imports (guest → host functions)

All handles follow §0.4. All string/byte pointers are copied *out of* guest memory — the
host never retains a guest pointer. Every call validates its handle; an invalid handle is a
no-op, not a crash.

### 3.1 Dynamic UI / EVG objects — §2.6

```c
/* Guest -> host. All ids are opaque handles, never pointers. */
uint32_t rg_evg_create(uint32_t kind);                 /* RG_UI_* kind -> handle (0=OOM) */
void     rg_evg_set_i32  (uint32_t h, uint32_t key, int32_t  v);
void     rg_evg_set_color(uint32_t h, uint32_t key, uint32_t rgba);
void     rg_evg_set_str  (uint32_t h, uint32_t key, uint32_t str_off, uint32_t len);
void     rg_evg_append   (uint32_t parent, uint32_t child);  /* build the tree      */
void     rg_evg_remove   (uint32_t h);                 /* detach, keep the object     */
void     rg_evg_destroy  (uint32_t h);                 /* free h and its subtree      */
void     rg_evg_set_root (uint32_t h);                 /* which handle is the root     */
```

`destroy(h)` frees `h` and its descendants and bumps each freed slot's generation (safe
double-free / use-after-free). The same eight ops may instead be written into a shared
**command block** and applied once per frame — the *delta* counterpart to RGU1's *snapshot*.
Gated by `RG_WASM_HOST_CAP_UI_DYNAMIC`; snapshot RGU1 (§2.3) stays the zero-dependency
default.

### 3.2 Resources — §2.7

```c
uint32_t rg_res_begin (uint32_t kind, uint32_t w, uint32_t h, uint32_t fmt); /* -> staging buffer */
uint64_t rg_res_commit(uint32_t staging_id, uint32_t key);  /* filled buffer -> u64 handle */
void     rg_res_free  (uint64_t handle);                    /* refcounted release          */
uint64_t rg_res_lookup(uint32_t key);                       /* dedup / cache by key        */
/* kind in { texture2D, mesh, audioClip, tilemap, ... } — nothing says "2D". */
```

A file **loader** and a procedural **generator** both fill a staging buffer and call
`rg_res_commit` — "load" and "generate" are one path. Handles are **refcounted** and
arena-owned (bulk-freed on worker shutdown/fault). `rg_res_begin` past capacity returns null
(back-pressure). Gated by `RG_WASM_HOST_CAP_RES_STREAM`; the declare-once manifest
(`rg_host_register_sheet` / `rg_host_register_rect`) remains the default for small games.

Worker plugin contract (a worker is "just another guest"):

```c
void rg_worker_init(...);
void rg_worker_tick(...);
void rg_worker_shutdown(...);
uint32_t rg_spawn_worker(ptr, len);   /* a game guest spawns a loader from its own WASM */
```

### 3.3 Storage — §2.11

```c
/* scope: 0 = per-game, 1 = global/shared. Values are opaque byte blobs. */
i32  rg_store_get(u32 scope, ptr keyUtf8, u32 keyLen, ptr outBuf, u32 outCap);
                                   /* -> byte length (or -1 = absent)          */
void rg_store_set(u32 scope, ptr keyUtf8, u32 keyLen, ptr valBuf, u32 valLen);
void rg_store_delete(u32 scope, ptr keyUtf8, u32 keyLen);
u32  rg_store_list(u32 scope, ptr prefix, u32 prefixLen, ptr outBuf, u32 outCap);
void rg_store_commit(u32 scope);   /* atomically flush pending set/delete       */
```

Keyed and transactional (atomic temp-and-rename on `commit`). Scopes (per-game / global),
optional named slots, host-enforced isolation, a format/version tag for migration, and a
host-reported quota. Backend is pluggable (FS / `localStorage` / IndexedDB / in-memory /
cloud) behind the same imports; the interface is **async-shaped** (awaitable `commit`).
`loadGameData` / `saveGameData` become a thin whole-object wrapper over `get`/`set` on one
well-known key. Gated via §6. A **read is a deterministic input**; a write must not alter
logic mid-frame.

### 3.4 Animation — §2.12

```c
/* Guest -> host; returns an opaque handle. */
u32  rg_anim_start(u32 target, u32 clipOrTweenId, ptr paramsBuf, u32 paramsLen);
void rg_anim_set(u32 handle, u32 key, i32 value);   /* speed, weight, seek, ... */
void rg_anim_stop(u32 handle, u32 flags);           /* finish | cancel | hold   */
```

One model (clip or tween) drives a §2.6 UI node, a §2.8 sprite frame, or a §2.5
`BodyVisual` transform — the difference is only the `target`. Tween
`x/y/scale/rotation/opacity/color` (and sprite frame) over **keyframe tracks** with a
registered **easing** set (linear, quad, cubic, elastic, …) and `loop`/`pingpong`/`reverse`.
Clips/easings are **game-registered** (`register("glow", …)`), so `glow/pulse` and
`WALK/RUN/JUMP` dissolve into guest data. Animations advance on the negotiated timestep so a
replay animates identically.

### 3.5 Audio (see also the sound event §2.6)

Emitting a sound writes the §2.6 sound-event record. Loading a sound acquires a §2.7
resource handle. The **built-in synth**, the **soundscore player** (text-based multi-voice
procedural music), and the **vocal synth** become §2.7 **"generate" producers**: a score
(inline or by resource id) → a music handle, so the same procedural-music engine serves
every path and scores can layer (the "one score at a time" limit lifts). Loop/duck/crossfade
are parameters; live handles adjust tempo or per-track gain.

### 3.6 Haptics — §2.9

Fired as an event addressing a **target** (pad index, or `-1` = all; optionally
L/R/trigger). Both motors are honoured (`low` = heavy/low-freq, `high` = sharp/high-freq) —
never collapsed to one `strength`.

```c
/* Base command; both motors distinct. */
struct RgHaptic { i32 target; i32 low; i32 high; i32 ms; };
```

Optional **envelope** (attack/sustain/release) or a small named **pattern** (`bump`, `hit`,
`engine`, `click`) with an intensity — pattern names are a per-game vocabulary the host maps
(§4), not a frozen enum. Overlapping effects **mix or arbitrate by priority**; a sustained
effect is updated/stopped **by handle** (§0.4). Gated by `RG_WASM_HOST_CAP_RUMBLE`;
output-only (never feeds logic/RNG).

### 3.7 View navigation — §2.13

```c
/* Guest -> host; route is a registered name (see §4). Safe end-of-frame semantics. */
void rg_view_load(u32 route, ptr argsBuf, u32 argsLen);  /* replace, clear stack  */
void rg_view_push(u32 route, ptr argsBuf, u32 argsLen);  /* suspend cur, open new */
void rg_view_pop(ptr resultBuf, u32 resultLen);          /* resume caller w/ result */
```

`push` **suspends** the current view (state stays alive, paused) and overlays the new one;
`pop` **resumes** it exactly where it left off, delivering a **typed result**. `load` is a
full replace that clears the stack. Views can be **modal** (input captured). Routes are
**game-registered names**, not file paths. Full-reload remains a fallback mode for
memory-bounded hosts. Deterministic control-flow input (a replay visits the same views with
the same args in the same order).

### 3.8 Logging — §2.16

```c
/* Guest -> host; one stream shared by host and guest. */
#define RG_LOG_TRACE 0
#define RG_LOG_DEBUG 1
#define RG_LOG_INFO  2
#define RG_LOG_WARN  3
#define RG_LOG_ERROR 4
#define RG_LOG_FATAL 5
void rg_log(u32 level, u32 channel, ptr msgUtf8, u32 msgLen);
```

Per-channel level filtering (`audio=WARN`, `physics=DEBUG`), set from the `log.level` env key
(§1.2) and adjustable at runtime — filtered `TRACE`/`DEBUG` cost nothing. Pluggable
**output-only** sinks (stdout / file / ring buffer / on-screen console / test capture).
Errors are typed results carrying **severity + code + channel + message** (`FATAL` ties into
the §1 abort-with-reason), propagated to the guest and surfaceable in a HUD/console.

### 3.9 Particles & effects — §2.18

Spawns/triggers use the same **event + handle** shape as audio (§3.5) and animation (§3.4):
one-shot bursts are fire-and-forget by id; continuous emitters and live filters return a
**handle** to update/stop; completion arrives on the host→guest event channel
(`rg_ui_effect_done` generalised, §4.x). Particle textures come from §2.7/§2.8 resources.

- **Emitters** are game-registered descriptors: emission rate / burst count, lifetime, spawn
  shape, direction + spread, initial speed, gravity/forces, **size and colour curves over
  life**, blend mode, optional textured/sprite particles.
- **Effects** (glow / pulse / screen-wash generalised) are §2.12 animations over a target
  (node / screen / world-region).
- **Filters** are ordered stages in a per-frame or per-layer post chain (blur, bloom, colour
  grade, vignette, CRT/scanline, chromatic aberration, distortion).

Software/GPU parity; particle RNG uses the engine's **seeded, fixed-point** convention so a
burst replays identically; output-only; capability-gated (`max particles`, available
filters, GPU vs software).

---

## 4. Events (host → guest exports)

The guest optionally exports these; the host calls them. One shared host→guest event path.

| Export | From | Signature / payload |
|--------|------|---------------------|
| `rg_ui_event` | §2.6 / §2.15 | `void rg_ui_event(u32 target, u32 event, u32 a, u32 b)` — `target` = §2.6 handle or RGU1 node id; `event` ∈ `ACTIVATE / FOCUS / BLUR / POINTER_DOWN / POINTER_UP / POINTER_MOVE / POINTER_ENTER / POINTER_LEAVE / DRAG / SCROLL / TEXT / VALUE_CHANGED / SELECT / DESELECT`; `a,b` = typed payload (pointer x/y, scroll dx/dy, text off/len). |
| `rg_anim_event` | §2.12 | `void rg_anim_event(u32 handle, u32 event, u32 value)` — `event: 0=END 1=LOOP 2=FRAME(value=frame) 3=LABEL(value=labelId)`. |
| view lifecycle | §2.13 | `onEnter` / `onExit` / `onPause` / `onResume` (with the returned result on resume). |
| `rg_ui_effect_done` | §2.18 | effect/particle/filter completion (generalised across the "make it flashy" paths). |
| resize / hotplug | §2.14 | viewport resize and gamepad connect/disconnect arrive as events, not silent mutations. |

RGU1 nodes opt into events via `event_mask` (a node receives only what it subscribes to), so
the guest is never spammed. Node flags: `RG_UI_NODEFLAG_SELECTABLE`, `RG_UI_NODEFLAG_DEFAULT`.

Shipped RGU1 event constants (the minimal subset the widened taxonomy extends):

```c
#define RG_UI_EVENT_ACTIVATE  0x0001u  /* action button pressed while selected */
#define RG_UI_EVENT_SELECT    0x0002u  /* selection cursor moved onto the node */
#define RG_UI_EVENT_DESELECT  0x0004u  /* selection cursor left the node       */
```

---

## 5. Sprites, atlases, and HUD (data shapes)

### 5.1 Atlas (data the guest/provider declares) — §2.8

```
Atlas (the runtime shape of today's atlas.json)
  frameW, frameH, sheetW, sheetH
  directions: [ up, left, down, right ]          ; row order; FLIP_X may reuse LEFT
  animations: { <id>: { row, frameCount, cycle[], fps, loop } }
```

Animation ids, rows, and cycles are **data** (LPC emits them); a `slash`/`cast` row needs no
new `RG_SPR_ANIM_*` constant, and the roster is the catalog table (`RG_SPR_OFF_CAT_IDS`),
never `RG_SPR_CHAR_*`.

### 5.2 Sprite instance — §2.8

```
Sprite = { visual:   sheetHandle + atlas   (or a registered shape-drawer, §6)
           transform: x, y, angle, scale, flipX
           anim:      animId, clockMs | frameOverride, dir }
```

`GameEntity` kinds, RGSP1 slots, and the RGS1 draw list all become *this*. Pose comes from
the guest directly or from a physics body (§5.3). Animation is **one clock over the atlas**.
Sheets load through the §2.7 resource path (decode PNG *and* JPEG through one decoder →
upload → refcounted handle). Runtime LPC composition is a §2.7 "generate" producer. GPU
(`shGpuTexId`) and software (`ImageBuffer`) resolve behind one interface, capability-gated.

### 5.3 Body → visual binding — §2.5

One declared contract the game provides (not three code paths):

```
interface BodyVisual {                 ; provided by the game (§7), not core
    fn visualFor(bodyId:string) : VisualRef        ; template id | RGSP1 charId
    fn animFor(bodyId:string st:BodyState) : (anim dir flip)  ; guest rule, §6
}
; Host loop, backend-agnostic:
;   for each active body: read (x,y,angle) from RGW1,
;     resolve BodyVisual.visualFor(id),
;     write that transform into the sprite template OR the RGSP1 slot xFp/yFp,
;     pick anim/dir from BodyVisual.animFor(id, {speed, vx, vy, lastContact}).
```

### 5.4 HUD — §2.15

The HUD is an EVG/RGU1 document the game declares, drawn by the **one EVG renderer** (TTF
glyph/line cache, backgrounds, borders/radius, images, clip, GPU path) used for both HUD and
menus — the limited `GameHudBlitter` and the hand-drawn `fillRect` fallback are deleted. The
HUD is **interactive** via the one typed input (§2.4 input record) delivered back over
`rg_ui_event` (§4): a HUD button, an in-game slider, and a text field fire the same events on
every path. Layout via `EVGLayout`; styling is guest-declared, host-resolved; the HUD sizes
itself from the negotiated viewport (§1.2). HUD updates use the §2.6 handle/mutation model
for cheap incremental changes.

---

## 6. Registries (data the guest declares, not branches in core) — §4

Game vocabulary is **registration**, not `if (kind == "…")` in core. The registration table
lives in core; entries come from the game at load (setup).

| Registry | Call (at setup) | Replaces |
|----------|-----------------|----------|
| Shape drawers | `registerShape("ghost", fn)` | `kind == "wedge"` / `kind == "ghost"` in `game_sprite.rgr` |
| Sound palette | `registerSound("brick", spec)` | builtin ids `brick`/`bounce`/`wall` in `game_audio.rgr` |
| Animation clips / easings | `register("walk", …)` / `register("glow", …)` | `WALK/RUN/JUMP`, `glow/pulse` enums |
| Haptic patterns | pattern-name registration | frozen rumble presets |
| View routes | route-name registration | raw file paths |
| Emitters / effects / filters | emitter/effect/filter descriptors | four canned particle presets, `"sparkle"` |
| Feature flags | named/typed flag registry | ad-hoc `verbose` / `useWasmHud` / `debugmode` |

Feature flags are named, typed values (bool/int/enum) with a defined **source precedence** —
build default → config / `game.info` → env / CLI → persisted (§2.11) → runtime override —
queryable by host *and* guest over the §1.2 key/value channel, scoped per-game or global.
Flags read at init are stable inputs; runtime toggles arrive as events.

---

## 7. Providers & the capability seam — §6

Every host capability plugs into a **registry**, not hand-wired into the runner and three
bridges:

```
class GameProvider {
    fn id:string ()        ; "resource", "pose", "scene", …
    fn capBit:int ()       ; RG_WASM_HOST_CAP_* it satisfies (0 = base ABI)
    fn direction:int ()    ; 1 = guest->host, 2 = host->guest
    fn cadence:int ()      ; 1 = setup (once), 2 = frame (per physicsStep)
    fn onAttach / onDeclare / beforeUpdate / afterUpdate / onDetach
}
```

The host's advertised caps = the OR of every provider's `capBit()`; the gate runs **once,
right after load, before `update()`**, rejecting a guest whose required caps are unmet.
Adding a provider automatically widens what the host advertises.

The engine-core ↔ game seam is `GameSceneProvider` (§3 of `IDEAL.md`): a generic runner
obtains **everything game-specific from an interface it is compiled against** — never from
concrete game types, imports, or constants. The **guest owns the world** (§5 of `IDEAL.md`):
it declares bodies, bounds, world size, camera hints, and static-bg through the same
declare-once channel it already uses for resources; the host-side `setupPhysics()` copy is
deleted. One world, one owner.

---

## 8. Capability bits (`RG_WASM_HOST_CAP_*`)

A guest ORs the bits it requires into `rg_required_caps()`; the host advertises the OR of its
providers' `capBit()`s and rejects an unsatisfiable guest at load (§7).

| Bit (name) | Value | Gates | Chapter |
|------------|-------|-------|---------|
| `RG_WASM_HOST_CAP_POSE_INPUT` | `0x0010` | RGP1 pose streaming + motion/speed | §2.4 |
| `RG_WASM_HOST_CAP_UI_DYNAMIC` | — | handle-based dynamic EVG UI (`rg_evg_*`) | §2.6 |
| `RG_WASM_HOST_CAP_RES_STREAM` | — | `rg_res_*` streaming resources / workers | §2.7 |
| `RG_WASM_HOST_CAP_RUMBLE` | — | dual-motor haptics (+ trigger/waveform caps) | §2.9 |
| GPU sheets / GPU camera / GPU fx | — | GPU sprite/camera/effect/filter paths | §2.8, §2.17, §2.18 |
| audio / voice / music / file-decode / positional | — | audio playback classes | §2.10 |
| storage (scopes / binary / size) | — | persistence classes | §2.11 |
| animation (targets / easings / labels) | — | animation classes | §2.12 |
| navigation (stack depth / suspend-resume / modal) | — | view-stack classes | §2.13 |

(Only `RG_WASM_HOST_CAP_POSE_INPUT = 0x0010` has a concrete value in the current design; the
rest are named seams whose exact bit values are assigned when the provider lands. Soft
capabilities that a guest can *adapt* to are answered through the typed environment query
(§1.2) rather than the hard bitmask.)

---

## 9. Determinism summary

| Channel | Kind | Rule |
|---------|------|------|
| Pose (§2.4), controls (§2.9), env reads at init (§1.2), persisted reads (§2.11) | input | deterministic — a replay sees the same values at the same step |
| Gameplay animation lifecycle events (§2.12) | input | deterministic — fire at the same step every run |
| Audio (§2.10), haptics (§2.9), particles/effects/filters (§2.18), cosmetic animation (§2.12), logging (§2.16) | output | never feed logic, RNG, or step order |
| Streaming residency (§2.7) | output | affects only rendering + resource lifetime, never the game outcome |
| Resize / hotplug / runtime flag toggles (§1.2, §2.14, §4) | event | arrive as events, never silent mid-step mutations |

---

*Derived from [`IDEAL.md`](./IDEAL.md). Section numbers (§) refer to that document.*
