# ABI_V2_PROPOSAL — target layouts & breaking changes (proposed)

**Status of this document: PROPOSED / NON-NORMATIVE.** Nothing here is the current
contract. Implement against [`ABI_V1.md`](./ABI_V1.md) for anything shipping today.
This file collects the *target* ABI: new blocks, breaking layout changes, and the
cross-cutting rules (versioning, result semantics, determinism, identity) that V1
does not yet specify. Motivation for each shape is in [`IDEAL.md`](./IDEAL.md).

**Every entry is [PROPOSED] unless it says [RESERVED]** (a slot already defined in
a shipped header for future use). When a proposal *breaks* a V1 layout it says so
explicitly and gives the migration.

**Cross-reference notation.** `API §x` = a section of `ABI_V1.md`. `V2 §x` = a
section of *this* file. `IDEAL §x` = `IDEAL.md`. `HOST §x` = `HOST_ARCHITECTURE.md`.

**Table of proposals (referenced from `ABI_V1.md`):**

| Ref | Proposal |
|-----|----------|
| V2 §1 | Single-writer block model (retire mixed-writer RGW1) |
| V2 §2 | RGCQ string-answer value region |
| V2 §3 | Contact record widening (manifold: depth + tangent) |
| V2 §4 | Contact overflow safety with three-phase lifecycle |
| V2 §5 | Polygon side-vertex table (block/offset/owner) |
| V2 §6 | `rg_ui_event_v2` + TEXT event buffer |
| V2 §7 | Atomics / memory-ordering contract |
| V2 §8 | Pose `skeleton_schema_id` generalisation |
| V2 §9 | `time_ms` width / wrap contract |
| V2 §10 | Pointer normalisation for replay |
| V2 §11 | Deterministic record/replay protocol |
| V2 §12 | Unified entity-identity model |
| V2 §13 | Conformance for V2 blocks |
| V2 §14 | Per-block versioning & compatibility rules |
| V2 §15 | Common result model (`RgResult`) & error taxonomy |
| V2 §16 | Proposed blocks (camera, sound, view fields) |
| V2 §17 | Proposed host imports (dynamic UI, resources, storage, animation, haptics, particles, views, logging) |
| V2 §18 | RGMO — device motion / orientation block (mobile sensors) |
| V2 §19 | Networking host imports (`rg_net_*`) — backend request/response + multiplayer sessions |
| V2 §20 | In-app purchase host imports (`rg_iap_*`) — products & entitlements |

---

## V2 §1. Single-writer block model — retire mixed-writer RGW1

**Breaks:** RGW1 v1 header (`API §3.1`).

The shipped RGW1 is a **mixed-writer** block: the guest owns most words, but the
host writes `dt_ms`, `time_ms`, `input`, `input_p2` into the same block
(`API §1.2`). That works only because the guest is called synchronously; it makes
validation and snapshotting harder than they should be, and it blocks moving the
host writes to another thread.

**Target: one writer per block.**

- **RGW1 v2** becomes **guest-write-only** (world/physics results the guest
  publishes). It gains a `revision` word and becomes a pattern-B block
  (`API §1.3`).
- The host's per-frame inputs move to blocks that already exist or are added:
  `input`/`input_p2` → **RGIN** (`API §3.8`, already the typed input surface);
  `dt_ms`/`time_ms`/viewport → a small **host-status block** `RG_HS` (host-write-
  only, guest-read), header + `dt_ms, time_ms, step_id (V2 §11), view_w, view_h,
  safe_area…`.
- A guest that only needs the five digital bits keeps reading `RGIN.record[0/1]
  .BUTTONS`; RGW1's `input`/`input_p2` header words become **[RESERVED]** (host
  writes 0), removing the last host write to RGW1.

Migration: RGW1 v2 keeps every guest-owned offset in place, so a guest that
already writes bodies/contacts/events is unchanged except that it now reads
timing/input from `RG_HS`/RGIN instead of RGW1 header words, and bumps `revision`.
Host advertises RGW1 v2 via `rg_abi_version` gating (`API §2.1`).

**Viewport fields** (the "RGW1 gains view fields" note in `IDEAL §2.14`) live in
`RG_HS`, not scattered into RGW1 — a physics guest sizes/letterboxes itself from
`RG_HS.view_w/view_h`, mirroring RGSP1's shipped `VIEW_W/VIEW_H`.

---

## V2 §2. RGCQ string-answer value region

**Fixes gap in `API §2.2`.** Today a `STRING` capability answer has `sLen` but no
offset to its bytes. Proposal: split the RGCQ pool into a guest **key** pool and a
host **value** pool, and add a value offset to the entry.

```c
/* entry grows from 20 B to 24 B (RG_WASM_CAPQ_ENTRY_SIZE 24):
 *   keyOff(u16) keyLen(u16) present(u8) type(u8) _(u16)
 *   ival(i32) fval(f32) sOff(u16) sLen(u16)
 *   guest writes keyOff/keyLen; host writes present/type/ival/fval/sOff/sLen.  */
#define RG_WASM_CAPQ_VAL_POOL  <base>  /* host-owned value bytes; sOff is relative here */
```

`sOff` is an offset into the host-owned value pool (kept separate from the guest
key pool so the two writers never overlap, per V2 §1). Because this changes
`ENTRY_SIZE` and adds a pool, it is a **minor RGCQ bump** gated by the RGW1
version and negotiated so a host that only speaks the 20-byte entry still answers
BOOL/INT/FLOAT keys. Until then, `type = STRING` stays **[RESERVED]** (`API §2.2`).

---

## V2 §3. Contact record widening — manifold data

**Breaks:** RGW1 contact stride (`API §3.3`). The shipped 32-byte record is fully
used by eight `i32` fields; there is **no slack** for penetration depth or tangent
impulse. Adding them requires a new stride and a block-version bump.

```c
/* Contact record v2: 40 B (RG_WASM_CONTACT_SIZE 40). First 32 B are byte-identical
 * to v1 so a v1 reader on a v2 block still reads the normal-impulse manifold. */
#define RG_WASM_CT_OFF_BODYA    0
#define RG_WASM_CT_OFF_BODYB    4
#define RG_WASM_CT_OFF_PHASE    8
#define RG_WASM_CT_OFF_IMPULSE  12
#define RG_WASM_CT_OFF_X        16
#define RG_WASM_CT_OFF_Y        20
#define RG_WASM_CT_OFF_NX       24
#define RG_WASM_CT_OFF_NY       28
#define RG_WASM_CT_OFF_DEPTH    32  /* i32 penetration depth (fp)  — NEW */
#define RG_WASM_CT_OFF_TANGENT  36  /* i32 tangent/friction impulse (fp) — NEW */
```

Because the array base and stride change, `RG_WASM_OFF_CONTACTS` and everything
after it move; this is a **major RGW1 change** (new `RG_WASM_ABI_VERSION`, new
`RG_WASM_ABI_SIZE`). The version gate (`API §2.1`) rejects a v1-only host for a
v2-requiring guest. `MAX_CONTACTS` may also be renegotiated here (V2 §14 min-size
rules).

---

## V2 §4. Contact overflow safety with three-phase lifecycle

**Fixes hazard in `API §3.3`.** Once the core emits `PERSIST`/`END`, the shipped
"drop-lowest-impulse" policy is unsafe: an `END` event often has near-zero
impulse, so dropping the lowest-impulse contact can drop exactly the `END`,
leaving the guest permanently believing two bodies still touch.

Target policy when more than `MAX_CONTACTS` pairs are active in a step:

1. **Never drop `END`.** Lifecycle transitions (`BEGIN`, `END`) rank above
   `PERSIST`; among droppable contacts, prefer dropping `PERSIST` by lowest
   impulse. An `END` is emitted even if it means dropping a `PERSIST` to make room.
2. **Signal truncation.** Add `RG_WASM_CT_FLAG_OVERFLOW` (a header status bit in
   RGW1, e.g. a `contact_flags` word) so the guest knows the contact set was
   truncated this step and must not treat "absent" as "separated".
3. **Resync path.** When overflow occurs, the next step MUST publish a **full
   snapshot of all currently-active contacts** (or an explicit "these pairs are no
   longer touching" resync list) so the guest's contact state machine can recover.

This makes the collision state machine robust: a guest that tracks
begin/persist/end can always reconstruct truth within one step of an overflow.

---

## V2 §5. Polygon side-vertex table

**Fixes incomplete `API §3.3`.** `RG_WASM_SHAPE_POLYGON` references a "side vertex
table" with no defined storage. Proposal: a **guest-owned, declare-once vertex
block**, addressed from the shape descriptor by an index, never a pointer.

```c
struct RgShape { u32 kind; u16 layer; u16 mask; i32 a, b, c, d; };
/* For kind = RG_WASM_SHAPE_POLYGON:
 *   a = vertex count (2..RG_WASM_POLY_MAX_VERTS)
 *   b = first-vertex index into the polygon vertex block (below)               */

/* Guest-owned polygon vertex block (declared once, like the shape descriptor):
 *   header: magic 'RGPV', version, size, revision (pattern B, guest writes)
 *   verts[]: RG_WASM_POLY_MAX_VERTS_TOTAL × { i32 x_fp, i32 y_fp }             */
#define RG_WASM_POLY_MAX_VERTS        16u   /* per polygon               */
#define RG_WASM_POLY_MAX_VERTS_TOTAL  256u  /* pool capacity, host-clamped */
```

Vertices are convex, CCW, in body-local fixed-point coordinates; the host
validates count and index bounds as untrusted data and clamps to the pool
capacity. Ownership: guest writes the pool once at declare-time (`HOST §2`
declare-once channel); the host reads it when building collision geometry. This
makes POLYGON portable; CIRCLE/BOX/SEGMENT are unaffected.

---

## V2 §6. `rg_ui_event_v2` + TEXT event buffer

**Fixes breaking change in `API §3.6`.** The shipped `rg_ui_event(node_id, event,
value)` is frozen. The pointer/text-capable callback ships under a **new name and
its own UI-event ABI minor version** so export-presence disambiguates arity:

```c
/* Guest OPTIONALLY exports one of these; the host prefers _v2 if present. */
void rg_ui_event   (uint32_t node_id, uint32_t event, uint32_t value);        /* v1, frozen */
void rg_ui_event_v2(uint32_t target,  uint32_t event, uint32_t a, uint32_t b);/* v2 */
```

`target` = an RGU1 node id *or* a dynamic-UI handle (V2 §17). `event` widens the
shipped `ACTIVATE/SELECT/DESELECT` to `FOCUS / BLUR / POINTER_DOWN / POINTER_UP /
POINTER_MOVE / POINTER_ENTER / POINTER_LEAVE / DRAG / SCROLL / TEXT /
VALUE_CHANGED`. `a,b` is a typed payload per event: pointer `x,y`; scroll `dx,dy`;
value `newValue,_`.

**TEXT event buffer.** For `event = TEXT`, `a,b` are `(offset, len)` **into a
host-owned UI-event string block whose base is published in `RG_HS`/the UI ABI
header** (never a bare offset relative to nothing). The host writes the utf-8 text
there before the callback and it is valid only for the duration of the call; the
guest copies what it needs. Reporting arity/version: `rg_ui_abi()` gains a minor
bump when `_v2` is offered.

---

## V2 §7. Atomics / memory-ordering contract

**Tightens `API §1.3`.** Pattern-B blocks published across real threads need an
explicit ordering contract, not just "seqlock". Proposal:

- `revision` is accessed with atomic loads/stores.
- **Writer:** `revision.store(odd, relaxed)` → write payload →
  `atomic_thread_fence(release)` → `revision.store(even, relaxed)`.
- **Reader:** `r1 = revision.load(acquire)`; if odd retry; copy payload;
  `atomic_thread_fence(acquire)` (paired) → `r2 = revision.load(relaxed)`; accept
  iff `r1 == r2 && even`.
- **"Monotonic revision" and "odd/even seqlock" are the same mechanism**, not
  alternatives: the writer's two bumps produce the odd (writing) and even (stable)
  states, and the even values are monotone so a reader can also detect "unchanged
  since last frame". `API §1` and this section replace the earlier text that
  presented them as two options with different read algorithms.

RGW1 v2 / RGSP1 v2 adopt pattern B under this contract (V2 §1). Pattern-A turn
ordering remains valid for a purely single-threaded host but is no longer the only
model a block may use.

---

## V2 §8. Pose `skeleton_schema_id` generalisation

**Generalises `API §3.7`.** `RG_POSE_MAX_LM = 33` bakes the BlazePose landmark
count. To keep "transport, never taxonomy" (`IDEAL §2.1`), add to the RGP1 header:

```c
#define RG_POSE_OFF_SCHEMA_ID  <n>  /* u32 registered skeleton schema id */
/* landmark_count already exists as RG_POSE_OFF_LM_COUNT; capacity stays a
 * compile-time max but the MEANING of each index is defined by SCHEMA_ID.     */
```

`schema_id` names a registered skeleton (BlazePose-33 is *one* schema, e.g. id 1);
hand (21), face-mesh, or a custom rig are other ids. The guest reads `schema_id +
landmark_count` and interprets indices per that schema, instead of assuming 33
BlazePose joints. `RG_POSE_MAX_LM` becomes a pure capacity bound.

---

## V2 §9. `time_ms` width / wrap contract

**Fixes note in `API §3.1`.** `time_ms` is a signed `i32` ms (wraps ~24.8 days;
overflow currently undefined). Options, in order of preference:

1. **Widen to `i64` monotonic ms** in the header (new RGW1/`RG_HS` version). Clean,
   no wrap for practical sessions.
2. If 32-bit is kept, define it as **unsigned monotonic ms with explicit modular
   wrap**; guests compute deltas with `(u32)(now - prev)` and never compare
   absolute values.

The determinism protocol (V2 §11) uses `step_id`, not wall time, for ordering, so
`time_ms` is presentation/telemetry only and its wrap never affects logic.

---

## V2 §10. Pointer normalisation for replay

**Fixes note in `API §3.8`.** `POINTER_X/Y` are integer view pixels — resolution-
and viewport-dependent, so not replay-stable. Proposal: alongside the pixel
fields, transport a **normalised, fixed-point pointer** (`[0,1] * FP_SCALE`
relative to the negotiated viewport) whenever the pointer feeds game logic, and
declare which one is the deterministic input:

- **Replay-stable logic input:** normalised fixed-point pointer (recorded in the
  input snapshot, V2 §11).
- **Presentation only:** the raw pixel pointer (for cursor drawing), never
  recorded, never fed to logic.

A guest picks the normalised field for anything that affects the world; the host
records only that in the replay stream.

---

## V2 §11. Deterministic record/replay protocol

**Fills the gap in `API §5`.** Fixed-point transport is necessary but not
sufficient for replay. The protocol makes determinism a *checkable* property:

- **`step_id`** — a monotic `u64` on every input snapshot and every event
  (published in `RG_HS`). Replay is "feed the recorded snapshot/events for each
  `step_id` and expect identical guest output".
- **Intra-step event ordering** — events within a step are delivered in a defined
  stable order (by `(kind, source_index)`), recorded and replayed in that order.
- **Pose sampling** — pose is resampled to the fixed step: each `step_id` sees the
  pose snapshot valid at that step (recorded), not a free-running camera rate.
- **Storage snapshot** — a replay begins from a recorded storage snapshot (V2 §17
  storage); reads during replay come from that snapshot, not live disk.
- **Resize / hotplug capture** — resize and gamepad connect/disconnect are
  recorded as events keyed to a `step_id` and re-injected at the same step.
- **Callback delivery point** — every host→guest callback (UI events, anim events,
  view lifecycle) is delivered at a **defined phase** of the step (proposal:
  *before* `update()`, so `update()` sees a consistent world) and recorded there.
- **Worker results** — streaming/loader worker outputs (V2 §17) affect only
  rendering and resource lifetime, never logic/step order, so they are **not**
  part of the replay stream; the protocol asserts this invariant.

A conformance replay harness (V2 §13) records a session and asserts byte-identical
guest output on replay.

---

## V2 §12. Unified entity-identity model

**Fixes the scatter in `API §6`.** One model, three distinct concepts kept
distinct:

| Concept | Type | Lifetime | Rule |
|---------|------|----------|------|
| **EntityId** | `u32` (or `u64`) stable id | whole entity lifetime | the persistent identity used in contacts, visuals, events |
| **array index** | slot in a per-frame array | one snapshot | a *location*, never stored across frames |
| **host handle** | slot index + generation | resource lifetime | a resource lease (`rg_evg_*`, `rg_res_*`), not a game entity |

- Contacts, impulses, visuals, and events all key on **EntityId**, not array
  index (indices become a per-snapshot lookup only).
- **EntityId reuse** requires a **generation** field so a stale id fails a
  generation check (same discipline as host handles); an id is never silently
  reused within a session without bumping generation.
- `contactBodyCode`/`bodyCodeToId` (`HOST §2`) collapse into "EntityId ↔ guest
  name", removing the parallel body-code space.

---

## V2 §13. Conformance for V2 blocks

Every V2 block ships with the `API §7` deliverables **from day one**: golden byte
fixtures, malformed-input validator vectors, and a reference encoder/decoder,
plus — new for V2 — a **record/replay conformance harness** (V2 §11) that asserts
byte-identical guest output on replay of a recorded session. A V2 block is not
"shipped" (promoted into `ABI_V1.md`) until its vectors exist and pass.

---

## V2 §14. Per-block versioning & compatibility rules

**Fills the gap in the shipped gate** (which only checks `guest_version >
host_version`). Each independently-versioned block (RGW1, RGSP1, RGU1, RGP1, RGIN,
RGCQ, RG_CAM, …) carries **major.minor** semantics:

- **Major** = incompatible layout (moved/removed field, changed stride, changed
  meaning). A reader MUST reject a block whose major it does not implement.
- **Minor** = backward-compatible addition. **A minor bump may only append fields
  at the end of a record/header**, never move or repurpose an existing offset. A
  reader of an older minor reads the prefix it knows and ignores the tail.
- **Minimum block size per version** is published (`RG_*_MIN_SIZE_Vn`); a reader
  rejects a block smaller than the minimum for the version it claims.
- **Unknown events / property keys / node kinds are ignored**, not errors — a
  forward-compatible reader skips what it does not recognise (RGU1 already does
  this for `event_mask`).
- **Fields a writer does not set MUST be zeroed** (reserved words, unused record
  tails), so a reader can rely on zero-means-absent.
- **Old guest on newer host:** allowed when the host implements the guest's major
  (the host reads the older minor's prefix). This is the common case and MUST work.
- **New guest on older host:** allowed only via **capability degradation** — the
  guest queries (RGCQ / env, `API §2.2`) and adapts; a *hard* requirement it
  cannot degrade goes through `rg_required_caps` and is rejected at load
  (`API §2.1`). A guest MUST NOT assume a newer block layout without either a
  version check or a capability answer.

---

## V2 §15. Common result model & error taxonomy

**Fixes the silent-no-op semantics** (`rg_store_commit`/`set`/`delete` and most
handle ops return `void`; a bad handle is a silent no-op — safe against crashes,
bad for debugging and reliability). Target: a shared result and a defined error
set.

```c
typedef struct { i32 code; i32 detail; } RgResult;   /* code 0 = OK */

enum RgErr {
    RG_OK              = 0,
    RG_ERR_UNSUPPORTED = 1,  /* capability not present                     */
    RG_ERR_INVALID_ARG = 2,  /* malformed argument                         */
    RG_ERR_BAD_HANDLE  = 3,  /* invalid / stale (generation-failed) handle */
    RG_ERR_QUOTA       = 4,  /* storage/quota exceeded                     */
    RG_ERR_POOL_FULL   = 5,  /* handle pool / arena exhausted              */
    RG_ERR_TOO_SMALL   = 6,  /* output buffer too small (detail = needed)  */
    RG_ERR_PENDING     = 7,  /* async op accepted, completion later        */
    RG_ERR_IO          = 8   /* backend I/O failure                        */
};
```

- Handle-returning creators still return `0` for null/OOM (`IDEAL §2.6`), but the
  *reason* is retrievable via a companion `RgResult` (or an `rg_last_error()` on
  paths that cannot widen their return).
- **Async-shaped ops** (`rg_store_commit`, resource loads) either return
  `RG_ERR_PENDING` with a **request handle** whose completion arrives as a
  host→guest event, or expose an awaitable completion — the API must not *look*
  async (`IDEAL §2.11` "awaitable commit") while returning `void`. Pick one; the
  proposal is request-handle + completion event, which fits the existing
  event/handle machinery.
- A silent no-op remains the crash-safe *fallback* when a guest ignores results,
  but the information is always available.

---

## V2 §16. Proposed blocks

### V2 §16.1 RGW1 view fields → `RG_HS` host-status block [PROPOSED]

See V2 §1. `dt_ms`, `time_ms`, `step_id`, `view_w`, `view_h`, `safe_area`, and
`log.level` live in a host-write-only block the guest reads; RGW1 v2 stops
carrying host words.

### V2 §16.2 RG_CAM — camera + view matrix [PROPOSED]

Guest declares the camera; host writes back the resolved matrix and its inverse.
A **full block header** and an explicit **matrix fixed-point scale** are part of
the contract (both missing from the earlier sketch):

```c
#define RG_CAM_MAGIC       0x4d434752u /* 'RGCM' */
#define RG_CAM_VERSION     1u
#define RG_CAM_FP_MTX      65536        /* matrix entries are Q16.16 (NOT FP_SCALE) */
/* Header (pattern B; guest writes camera, host writes matrices): */
#define RG_CAM_OFF_MAGIC     0
#define RG_CAM_OFF_VERSION   4
#define RG_CAM_OFF_SIZE      8
#define RG_CAM_OFF_REVISION  12   /* seqlock */
/* Guest-written camera params: */
#define RG_CAM_OFF_X       16  /* i32 world x (* FP_SCALE)          */
#define RG_CAM_OFF_Y       20  /* i32 world y                       */
#define RG_CAM_OFF_ZOOM    24  /* i32 zoom (* FP_SCALE; FP = 1x)    */
#define RG_CAM_OFF_ROT     28  /* i32 rotation (* FP_SCALE radians) */
#define RG_CAM_OFF_FOLLOW  32  /* u32 follow EntityId (0 = free)    */
/* Host-written matrices (3x3 affine as 6 entries a b c d e f, Q16.16): */
#define RG_CAM_OFF_VIEW_M  40  /* 6×i32 forward: screen = view · world */
#define RG_CAM_OFF_VIEW_INV 64 /* 6×i32 inverse: world = view⁻¹ · screen (picking) */
#define RG_CAM_SIZE        88
```

One camera model → one affine `Mat3`, applied identically on software and GPU. The
inverse is transported (not left for the guest to compute) for pointer/touch
picking and world-anchored HUD. Matrix entries use `RG_CAM_FP_MTX` (Q16.16), which
is distinct from position `FP_SCALE` (256) — stated explicitly because the earlier
sketch omitted the matrix scale.

### V2 §16.3 Sound event record — 32 B + response for handles [PROPOSED]

**Reconciles two sizes.** RGW1's shipped event record is **20 B** (`kind, sub, a,
b, c`; `API §3.1`). A richer sound record is **32 B**. These do not fit the same
slot, so a 32-B sound event is **not** an RGW1 `events[]` entry — it is either its
own sound block/ring or a host import, versioned separately:

```c
#define RG_SND_OFF_KIND     0   /* u32 0=sfx 1=voice 2=music-start 3=music-stop */
#define RG_SND_OFF_ID       4   /* u32 registered sound id (HOST §3 palette)    */
#define RG_SND_OFF_GAIN     8   /* i32 gain 0..FP (FP = unity)                  */
#define RG_SND_OFF_PAN      12  /* i32 pan -FP..+FP (0 = centre)                */
#define RG_SND_OFF_PITCH    16  /* i32 pitch ratio * FP                         */
#define RG_SND_OFF_FLAGS    20  /* u32 loop, positional, ...                    */
#define RG_SND_OFF_X        24  /* i32 world x (positional, * FP_SCALE)         */
#define RG_SND_OFF_Y        28  /* i32 world y                                  */
```

**Handles for loops/music cannot be returned by a fire-and-forget event.** A
one-shot is fire-and-forget by id. A loop/music/long-voice needs a handle, so it
uses one of:

1. a **host import** `u32 rg_sound_play(const RgSound* rec)` that returns the
   handle synchronously (preferred — the guest gets the handle immediately), or
2. a **command/response id**: the guest writes a `request_id` with the event and
   the host returns `{request_id → handle}` on the host→guest event channel.

The earlier text's "loops/music return a handle" is only realisable through (1) or
(2), never through a bare event record; this proposal makes that explicit.

---

## V2 §17. Proposed host imports

All handles follow the handle discipline (`IDEAL §2.6`): opaque `slot index +
generation`, `0` = null/OOM, arena-owned and bulk-freed on guest teardown, pools
bounded (allocation past capacity returns `0`). All results follow V2 §15. All
string/byte pointers are copied *out of* guest memory; the host never retains a
guest pointer.

- **Dynamic UI / EVG** [PROPOSED, `RG_WASM_HOST_CAP_UI_DYNAMIC 0x0020`] —
  `rg_evg_create/set_i32/set_color/set_str/append/remove/destroy/set_root`, the
  *delta* counterpart to RGU1's snapshot; same kinds/keys, same "no pointers cross,
  host validates" discipline. Callbacks via `rg_ui_event_v2` (V2 §6).
- **Resources / streaming** [PROPOSED, `RG_WASM_HOST_CAP_RES_STREAM 0x0040`] —
  `rg_res_begin/commit/free/lookup`; load and generate are one staging path;
  handles refcounted and arena-owned. Blocks RGO1 (host→worker observation), RGX1
  (host↔worker residency ring), RGLD (loader requests). Invariant `gen − freed =
  live` (the `streaming_world` regression fixture, `IDEAL §2.7`).
- **Storage** [PROPOSED] — `rg_store_get/set/delete/list/commit` returning
  `RgResult` (not `void`, V2 §15). Keyed, scoped (per-game / global), atomic
  temp-and-rename `commit`, host-enforced isolation and quota; a read is a
  deterministic input (recorded in the replay snapshot, V2 §11).
- **Animation** [PROPOSED] — `rg_anim_start/set/stop` → handle; one clip/tween
  model over a UI node, sprite frame, or body-visual transform; keyframe tracks +
  registered easings; advances on the fixed step so a replay animates identically.
  Lifecycle events (`END/LOOP/FRAME/LABEL`) via `rg_anim_event`.
- **Haptics** [PROPOSED, `RG_WASM_HOST_CAP_RUMBLE`] — `RgHaptic { i32 target, low,
  high, ms }` (both motors distinct, never one `strength`); optional
  envelope/named pattern; sustained effect updated/stopped by handle; output-only.
  One vocabulary, two back-ends: on a gamepad `low`/`high` drive the two rumble
  motors; on a **mobile** single-actuator device the host maps `low` → Core Haptics
  *intensity* (continuous), `high` → *sharpness* (transient), and a named pattern
  (`bump`/`hit`/`click`) → the closest platform primitive (`UIImpactFeedbackGenerator`
  / an AHAP pattern, or Android `VibrationEffect`); `target` collapses to "the
  device". `RG_WASM_HOST_CAP_RUMBLE` generalises from "gamepad rumble" to "haptics"
  and is the bit a Taptic-Engine host advertises — no separate mobile bit
  (`IDEAL §2.9`).
- **View navigation** [PROPOSED] — `rg_view_load/push/pop`; `push` suspends,
  `pop` resumes with a typed result; routes are registered names; deterministic
  control-flow input.
- **Logging** [PROPOSED] — `rg_log(level, channel, msg, len)`; per-channel
  filtering from `log.level`; output-only sinks; `FATAL` ties into abort-with-
  reason (`API §2.1`).
- **Particles / effects / filters** [PROPOSED, `RG_WASM_HOST_CAP_PARTICLES`] —
  event+handle shape like audio/animation; seeded fixed-point RNG so a burst
  replays identically; output-only.

Sprite/atlas/HUD data shapes and the body→visual binding are game-declared
structures resolved by host-side interfaces; they are documented in `HOST §3`
because they are not byte-level guest/host ABI.

---

## V2 §18. RGMO — device motion / orientation block [PROPOSED, `RG_WASM_HOST_CAP_MOTION 0x0080`]

**Motivation:** `IDEAL §2.19`. A host→guest streaming input block for handheld
inertial sensors (accelerometer, gyroscope, fused attitude), on the RGP1 pattern:
pattern-B (seqlock `revision`), host-write-only, per-frame, host-validated. The host
runs the sensor fusion (Apple **Core Motion** `CMMotionManager`, Android
`SensorManager`) and publishes clean, view-independent channels; the guest reads and
scales into its own world. Nothing here is a game vocabulary — it is pure transport.

**Fixed-point.** Acceleration in **g** and rotation rate in **rad/s** use `FP_VEL`
(Q16.16); quaternion components (normalized `[-1,1]`) and roll/pitch/yaw (radians) use
`FP_SCALE` (256) — the same "scale sized to the quantity" rule as RGP1 velocity vs
position.

```c
/* wasm/wasm_motion_abi.h — RGMO: host->guest device motion/orientation (PROPOSED). */
#define RG_MO_ABI_MAGIC   0x4f4d4752u /* 'RGMO' little-endian */
#define RG_MO_ABI_VERSION 1u
#define RG_MO_FP_SCALE    256          /* quaternion/angles: value * 256          */
#define RG_MO_FP_ACCEL    65536        /* accel (g) & rot-rate (rad/s): Q16.16     */

/* Header (32 bytes) — standard block words + timing + orientation/reference. */
#define RG_MO_OFF_MAGIC       0   /* u32 'RGMO'                                    */
#define RG_MO_OFF_VERSION     4   /* u32 ABI version the host wrote                */
#define RG_MO_OFF_SIZE        8   /* u32 total block bytes                         */
#define RG_MO_OFF_REVISION    12  /* u32 seqlock: odd=writing, even=stable         */
#define RG_MO_OFF_FLAGS       16  /* u32 RG_MO_FLAG_*                              */
#define RG_MO_OFF_ORIENT      20  /* u32 interface orientation (RG_MO_ORIENT_*)    */
#define RG_MO_OFF_REFERENCE   24  /* u32 attitude reference frame (RG_MO_REF_*)    */
#define RG_MO_OFF_TIME_MS     28  /* i32 capture timestamp, monotonic ms          */
#define RG_MO_HEADER_SIZE     32

/* Sensor channels — device (body) frame: +x right, +y top, +z out of screen,
 * right-handed, natural(portrait) orientation. */
#define RG_MO_OFF_ACC_X       32  /* i32 total acceleration x, g * FP_ACCEL        */
#define RG_MO_OFF_ACC_Y       36  /* i32 (includes gravity)                        */
#define RG_MO_OFF_ACC_Z       40
#define RG_MO_OFF_UACC_X      44  /* i32 user acceleration x (gravity removed)     */
#define RG_MO_OFF_UACC_Y      48
#define RG_MO_OFF_UACC_Z      52
#define RG_MO_OFF_GRAV_X      56  /* i32 gravity vector x, g * FP_ACCEL            */
#define RG_MO_OFF_GRAV_Y      60
#define RG_MO_OFF_GRAV_Z      64
#define RG_MO_OFF_ROT_X       68  /* i32 rotation rate x (gyro), rad/s * FP_ACCEL  */
#define RG_MO_OFF_ROT_Y       72
#define RG_MO_OFF_ROT_Z       76
/* Fused attitude (device -> reference frame), normalized quaternion + euler. */
#define RG_MO_OFF_QUAT_W      80  /* i32 quaternion w, [-1,1] * FP_SCALE           */
#define RG_MO_OFF_QUAT_X      84
#define RG_MO_OFF_QUAT_Y      88
#define RG_MO_OFF_QUAT_Z      92
#define RG_MO_OFF_ROLL        96  /* i32 roll  (radians * FP_SCALE)                */
#define RG_MO_OFF_PITCH       100 /* i32 pitch                                     */
#define RG_MO_OFF_YAW         104 /* i32 yaw                                       */
#define RG_MO_SIZE            108

/* flags (RG_MO_OFF_FLAGS) */
#define RG_MO_FLAG_VALID      1u /* host published a full sample this frame        */
#define RG_MO_FLAG_HAS_ACCEL  2u /* accelerometer channels are real                */
#define RG_MO_FLAG_HAS_GYRO   4u /* gyroscope / rotation-rate channels are real    */
#define RG_MO_FLAG_HAS_ATT    8u /* fused attitude (quaternion/euler) is real      */

/* interface orientation (RG_MO_OFF_ORIENT) — coarse; CHANGES arrive as a §2.14
 * lifecycle event, this field is the current value. */
#define RG_MO_ORIENT_PORTRAIT        0u
#define RG_MO_ORIENT_PORTRAIT_DOWN   1u
#define RG_MO_ORIENT_LANDSCAPE_LEFT  2u
#define RG_MO_ORIENT_LANDSCAPE_RIGHT 3u
#define RG_MO_ORIENT_FACE_UP         4u
#define RG_MO_ORIENT_FACE_DOWN       5u

/* attitude reference frame (RG_MO_OFF_REFERENCE) — which world frame the quaternion
 * rotates the device INTO; published because it is negotiable, not universal. */
#define RG_MO_REF_ARBITRARY_Z_VERTICAL 0u /* z up (gravity), x arbitrary          */
#define RG_MO_REF_Z_VERTICAL_X_NORTH   1u /* z up, x toward magnetic/true north    */
```

Determinism: the sample valid at each `step_id` is recorded and re-fed on replay
(V2 §11); the native sensor rate is decimated to the fixed step **host-side**, and a
motion read may drive logic/RNG because it is a recorded input, not an output.
Capability: attaches as a provider (`direction = host→guest`, `cadence = frame`,
`capBit = RG_WASM_HOST_CAP_MOTION`); a host without an IMU advertises the bit off and a
motion-requiring guest is rejected at load (`API §2.1`).

---

## V2 §19. Networking host imports (`rg_net_*`) [PROPOSED, `RG_WASM_HOST_CAP_NET 0x0100`]

**Motivation:** `IDEAL §2.20`. Host-owned, **async** networking: a backend
request/response surface and a multiplayer session/message surface. Every call is
non-blocking, returns `RG_ERR_PENDING` + a request/session handle (V2 §15), and
completions / incoming messages / connection-state changes arrive as **host→guest
events at defined step boundaries** (V2 §11), so non-determinism is captured, not
smeared into logic. All payloads are **opaque byte blobs** copied across the boundary
(no guest pointers retained, no fixed message taxonomy — the game owns the protocol,
`IDEAL §4`). **Data and assets only — never executable code / new game modules** (App
Review 2.5.2; `IDEAL §2.20`, `§2.22`).

```c
/* Endpoints/sessions are named by REGISTERED id (like routes/sounds), not raw URLs
 * baked into the guest; the host owns the connection, TLS, and destination policy. */

/* Backend request/response (cloud save, leaderboard, remote config, net resources). */
u32 rg_net_request(u32 endpoint_id, ptr reqBuf, u32 reqLen);  /* -> request handle (0=OOM) */
/* Completion -> host->guest event carrying { request handle, RgResult, respOff, respLen }
 * into a host-owned net-response buffer (base published like the UI-event text block). */

/* Multiplayer sessions. */
u32  rg_net_session_open (u32 config_id);                 /* create/join -> session handle  */
void rg_net_session_close(u32 session);
u32  rg_net_send(u32 session, u32 channel, ptr buf, u32 len, u32 flags); /* RG_NET_RELIABLE… */
i32  rg_net_recv(u32 session, ptr outBuf, u32 outCap);    /* drain queue: bytes, -1 empty   */

/* send flags */
#define RG_NET_RELIABLE   1u   /* ordered+reliable (else best-effort datagram)     */
#define RG_NET_BROADCAST  2u   /* to all peers in the session/room                 */

/* Events (host -> guest, on the shared event channel): REQUEST_DONE, MESSAGE,
 * PEER_JOIN, PEER_LEAVE, SESSION_STATE. Keyed to a step_id and recorded (V2 §11). */
```

- **Determinism / multiplayer.** Replies and messages enter the sim only as
  step-keyed events (recorded, re-injected on replay). Deterministic **lockstep** is
  built on the fixed-step + `step_id` protocol (V2 §11): peers exchange *inputs* per
  step and each simulates identically (the fixed-point transport is what makes this
  bit-reproducible); rollback/prediction is a guest netcode layer. Worker/streaming
  results already sit outside the replay stream (V2 §11); network *inputs* are inside
  it. Authority for cheat-sensitive state stays server-side.
- **Capability.** `RG_WASM_HOST_CAP_NET`; an offline/networkless host fails requests
  fast (`RG_ERR_UNSUPPORTED`) and a net-requiring guest is rejected at load — most
  guests declare it optional and fall back to single-player.
- **Relation to storage/resources.** Cloud save is the §2.11 store with a
  `scope = cloud` backend over this transport; a network-sourced asset is a §2.7
  resource whose staging buffer is filled from a `rg_net_request` response.

---

## V2 §20. In-app purchase host imports (`rg_iap_*`) [PROPOSED, `RG_WASM_HOST_CAP_IAP 0x0200`]

**Motivation:** `IDEAL §2.21`. A thin, safe seam over StoreKit / Play Billing. The
guest names **product ids** (its own vocabulary); catalog metadata (localized title/
price, product type) lives in store/app config, not the `.wasm`. Purchases are
**async** (user-driven, out-of-process): `RG_ERR_PENDING` + handle, outcome and later
renewal/refund/revocation delivered as **host→guest events at step boundaries**
(V2 §15, §11). The guest never sees payment credentials or receipts; it receives only a
**verified entitlement** (ideally server-validated via `rg_net_*`).

```c
/* Product info is written into a host-owned buffer (base published like other event
 * buffers); the guest reads localized title/price + kind but never a raw receipt.  */
u32  rg_iap_list_products(ptr idsBuf, u32 idsLen);  /* registered product ids -> request handle */
u32  rg_iap_purchase(u32 product_id);               /* -> request handle; host runs store sheet  */
u32  rg_iap_restore(void);                          /* -> request handle (App Store requirement)  */
i32  rg_iap_entitlements(ptr outBuf, u32 outCap);   /* current owned/active set -> bytes (or -1)  */

/* product kinds (in list_products result) */
#define RG_IAP_CONSUMABLE     0u
#define RG_IAP_NON_CONSUMABLE 1u
#define RG_IAP_SUBSCRIPTION   2u

/* Events (host -> guest): PRODUCTS_READY, PURCHASE_OK, PURCHASE_CANCEL,
 * PURCHASE_FAIL, ENTITLEMENT_CHANGED — each { request handle, RgResult, product_id }. */
```

- **Trust boundary.** Host owns the wallet, the sheet, the receipt, and validation;
  the guest owns only the *request* and the *unlock logic*. A guest that merely
  *claims* an entitlement is not believed — the host (or a server via `rg_net_*`) is
  the source of truth (`IDEAL §2.21`).
- **Determinism.** An entitlement *read* is a stable input like a persisted read
  (§2.11) and replays identically; the *purchase* is an external side effect captured
  as a recorded event (V2 §11). Entitlements gate content/presentation, not simulation
  logic, so gameplay replay is store-independent.
- **Capability.** `RG_WASM_HOST_CAP_IAP`; a host with no store returns empty products
  and fails `purchase` cleanly, and the guest hides its store UI. Rarely a hard
  requirement — degrades to "store unavailable".

---

*Proposed. None of this is the current contract — see [`ABI_V1.md`](./ABI_V1.md).
Motivation: [`IDEAL.md`](./IDEAL.md).*
