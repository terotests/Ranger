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
| V2 §18 | Mesh geometry block — render vertices + indices (generalises §5 to 3D) |
| V2 §19 | Camera & projection — 2D as the orthographic special case of 3D (extends §16.2) |
| V2 §20 | Scene lighting — global/directional + ambient + per-vertex (Gouraud) |
| V2 §21 | Putting it together: one pipeline for 2D and 3D, a worked cube, and the incremental path |

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

**Scope — this is collision geometry, not render geometry.** The §5 pool feeds the
physics narrow-phase only: 2D, position-only (`x_fp, y_fp`), no z, no normals, no
colour, no texture. It is *not* the block a 3D game draws from. It is, however, the
**seed pattern** for 3D rendering: a guest-owned, declare-once, index-addressed,
host-validated vertex pool. V2 §18 reuses exactly that pattern with a richer vertex
(position + normal + colour + uv) for the renderer, and V2 §19–§21 add the camera
projection and lighting that turn declared meshes into a drawn 3D scene. Collision
and render geometry stay **separate pools** — different consumers (solver vs
rasteriser), different fidelities, different lifetimes — but one discipline. A 3D
body typically declares a cheap collision shape here (BOX/§5 hull) *and* a detailed
render mesh in §18; they need not match, and the host never conflates them.

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

## V2 §18. Mesh geometry block — render vertices + indices

**Generalises V2 §5 to rendering.** `IDEAL §2.7` already says the resource model has
"nothing that says 2D" — "the same ABI serves 2D atlases, 3D mesh LODs, and audio
banks" — but there is no block a guest can use to *declare drawable geometry*. §5 is
the collision analogue; this is its render counterpart. Same discipline as §5
(guest-owned, declare-once, index-addressed, host-validated), a richer vertex, and a
separate index pool so a mesh is `(vertex range, index range)`.

```c
#define RG_MESH_MAGIC     0x424d4752u /* 'RGMB' — mesh block                        */
#define RG_MESH_VERSION   1u
/* Header: magic, version, size, revision (pattern B, guest writes; §7 seqlock). */

/* Interleaved render vertex — 32 B, 4-byte aligned. */
struct RgVertex3 {
    i32 x, y, z;      /* model-local position * FP_SCALE (256). 2D: z = 0.          */
    i32 nx, ny, nz;   /* vertex normal, Q16.16 unit vector (for §20 lighting).      */
    u32 rgba;         /* per-vertex base colour RGBA8888 (modulated by lighting).   */
    u32 uv;           /* packed u16 u, v texcoords * RG_UV_SCALE; 0 = untextured.   */
};

/* Mesh descriptor — one drawable; references the two pools by range, never pointer. */
struct RgMesh {
    u32 kind;         /* RG_MESH_TRIANGLES 1 (only mode for "simple 3D")            */
    u32 vtx_first;    /* first RgVertex3 index into the vertex pool                 */
    u32 vtx_count;    /*   (2..RG_MESH_MAX_VERTS_TOTAL, host-clamped)               */
    u32 idx_first;    /* first index into the index pool                           */
    u32 idx_count;    /* multiple of 3 for TRIANGLES                               */
    u32 material;     /* registered material/texture id (HOST §3); 0 = vertex-col  */
    u32 flags;        /* RG_MESH_UNLIT 1 | RG_MESH_DOUBLE_SIDED 2 | RG_MESH_WIRE 4  */
    u32 _rsv;         /* zeroed (§14)                                              */
};

/* Two guest-owned pools, declared once alongside the mesh descriptors. */
#define RG_MESH_MAX_VERTS_TOTAL   4096u  /* RgVertex3 pool capacity, host-clamped   */
#define RG_MESH_MAX_INDICES_TOTAL 8192u  /* u16 index pool capacity, host-clamped   */
#define RG_UV_SCALE               4096u  /* uv fixed-point unit (u16 → [0,1))       */
```

- **Indices are `u16` into the mesh's own vertex range**, so a cube is 8 vertices +
  36 indices, not 36 duplicated vertices. `u16` caps a single mesh at 65 k verts,
  ample for "simple 3D"; a `RG_MESH_KIND_TRIANGLES32` variant (u32 indices) is
  **[RESERVED]** for later.
- **Winding is CCW = front-facing**, matching §5. Back-faces are culled unless
  `RG_MESH_DOUBLE_SIDED`. The host validates `idx_count % 3 == 0` and every index
  `< vtx_count` as untrusted data (§14), dropping the mesh on violation rather than
  reading out of bounds.
- **`RG_MESH_UNLIT`** makes §20 a no-op for that mesh: the rasteriser uses `rgba`
  (× texture) directly. This is the flag a **2D sprite** sets — see §21, where a
  sprite is just a two-triangle quad at `z = 0` with `UNLIT`.
- **Capability:** `RG_WASM_HOST_CAP_MESH3D 0x0080`. A host without it advertises the
  bit off; a guest that needs meshes degrades (§14) — e.g. falls back to §2.8 sprites
  — or hard-requires via `rg_required_caps` and is rejected at load.
- **Determinism:** geometry is declared data, not per-step logic, so it is **not** in
  the replay stream (like §17 worker output); rendering it is output-only (§11).

Meshes are declared once like §5 shapes; a *dynamic* mesh (procedural, deforming)
uses the §17 dynamic-resource staging path instead, so the declare-once pool stays
declare-once.

---

## V2 §19. Camera & projection — 2D as the orthographic special case of 3D

**Extends V2 §16.2 (RG_CAM).** The core design principle the guest asked for:
**a 2D scene is a 3D scene viewed orthographically, with `z = 0` and unlit
materials.** So there is **one camera block**, not a 2D one and a 3D one. §16.2's 3×3
affine `Mat3` is retained unchanged as the `AFFINE2D` projection mode — the fast path
every current 2D game already wants — and 3D is added as two more projection modes on
the *same* block. `IDEAL §2.17` already resolves the camera "to one affine view
matrix … `screen = view · world`"; this makes that matrix the bottom-left corner of a
4×4 `clip = Projection · View · world`, of which the affine `Mat3` is the
`z = 0, orthographic` collapse.

```c
/* Guest-written projection selector (appended to the §16.2 header; §14 minor bump). */
#define RG_CAM_OFF_PROJ     92  /* u32: 0 AFFINE2D | 1 ORTHO3D | 2 PERSPECTIVE       */

/* 3D camera params — read only when PROJ != AFFINE2D (else the §16.2 X/Y/ZOOM/ROT). */
#define RG_CAM_OFF_EYE      96  /* 3×i32 world eye xyz  * FP_SCALE                    */
#define RG_CAM_OFF_TARGET   108 /* 3×i32 look-at target * FP_SCALE                    */
#define RG_CAM_OFF_UP       120 /* 3×i32 up vector, Q16.16 unit (default 0,1,0)       */
#define RG_CAM_OFF_FOVY     132 /* i32 vertical FOV radians * FP_SCALE (PERSPECTIVE)  */
#define RG_CAM_OFF_ORTHO_H  136 /* i32 ortho view height, world units * FP_SCALE      */
#define RG_CAM_OFF_NEAR     140 /* i32 near plane * FP_SCALE                          */
#define RG_CAM_OFF_FAR      144 /* i32 far plane  * FP_SCALE                          */

/* Host-written resolved transforms (Q16.16, RG_CAM_FP_MTX). */
#define RG_CAM_OFF_VP_M4    148 /* 16×i32 view·projection, row-major: clip = VP · world */
#define RG_CAM_OFF_VP_INV4  212 /* 16×i32 inverse, for unproject / picking             */
#define RG_CAM_SIZE_V2      276
```

- **`AFFINE2D` (default) is byte-for-byte §16.2.** The host still fills
  `RG_CAM_OFF_VIEW_M` / `VIEW_INV` (the 3×3). A pure-2D guest never touches the new
  fields and works on any host, exactly as today. So this is a **minor** RG_CAM bump
  (append-only, §14), not a break.
- **`ORTHO3D` and `PERSPECTIVE`** use `EYE/TARGET/UP` (a look-at) plus
  `NEAR/FAR` and either `FOVY` (perspective) or `ORTHO_H` (orthographic view height).
  The host resolves the 4×4 `VP_M4` and writes it back — the guest never builds the
  matrix (mirrors §16.2's "the inverse is transported, not left to the guest").
- **Aspect ratio** comes from `RG_HS.view_w/view_h` (§1/§16.1), not a camera field, so
  a resize re-resolves `VP_M4` without the guest touching the camera — the §2.14
  "viewport is a first-class field, and it can change" rule.
- **Unproject differs by mode, and the contract says so.** For `AFFINE2D`/`ORTHO3D`,
  `VP_INV4 · screen` is a **world point**. For `PERSPECTIVE`, a 2D screen point
  unprojects to a **world ray** (origin = `EYE`, direction through the unprojected
  near-plane point); the guest intersects that ray with world geometry for picking
  (§2.9/§2.15). This is stated explicitly because perspective picking is a ray, not a
  point — a correctness trap if left implied.
- **Fixed-point matrices, both backends.** `VP_M4` is Q16.16 (`RG_CAM_FP_MTX`), the
  same scale §16.2 already fixed, applied identically on the software framebuffer and
  the GPU — the `IDEAL §2.17` "one camera model, both backends" guarantee extended to
  the third dimension. Reuse the existing, tested `physics/src/cannon_mat3` /
  `cannon_vec3` / `cannon_quaternion` math (today "walled off in unwired 3D physics",
  `IDEAL §2.17`) to build `VP_M4` host-side — the library `IDEAL` says the 2D engine
  should already be reusing.
- **Software rasteriser needs a depth buffer for 3D.** Under `PERSPECTIVE`/`ORTHO3D`
  the host maintains a per-pixel z-buffer (painter's-order alone is insufficient for
  intersecting triangles). This is a host rendering concern, not ABI, but it is the
  one real cost of promoting the CPU path from 2D blit to 3D raster; noted so it is
  not a surprise. `AFFINE2D` keeps the current z-free blit path.

---

## V2 §20. Scene lighting — global + per-vertex (Gouraud)

**New — no lighting model exists in V1 or the earlier V2 draft.** "Simple 3D" needs
exactly two things the guest named: **global light settings** (a scene-wide sun +
ambient) and **vertex lighting**. The baseline is **per-vertex Gouraud**: shade at
each vertex using its §18 normal, interpolate the colour across the triangle. It is
cheap (fits the software rasteriser), deterministic (fixed-point), and enough for lit
cubes, terrain, and low-poly props. Lighting is **guest-declared** (it is part of
"the guest owns the world", `IDEAL §5`) and **host-consumed** when shading.

```c
#define RG_LIT_MAGIC   0x544c4752u /* 'RGLT' — scene lighting (pattern B, guest writes) */
#define RG_LIT_VERSION 1u
/* Header: magic, version, size, revision. Then: */

/* Global settings — the "global light" the guest asked for. */
#define RG_LIT_OFF_AMBIENT_RGB  16  /* u32 ambient colour RGBA8888                     */
#define RG_LIT_OFF_AMBIENT_I    20  /* i32 ambient intensity * FP_SCALE (0..FP)        */

/* One directional "sun" — the primary global light. */
#define RG_LIT_OFF_SUN_DIR      24  /* 3×i32 direction TO light, Q16.16 unit           */
#define RG_LIT_OFF_SUN_RGB      36  /* u32 sun colour RGBA8888                         */
#define RG_LIT_OFF_SUN_I        40  /* i32 sun intensity * FP_SCALE                    */

/* Optional point lights — capability-gated; default MAX = 4, 0 keeps it sun+ambient. */
#define RG_LIT_OFF_NUM_POINT    44  /* u32 active point-light count (0..RG_LIT_MAX_PT) */
#define RG_LIT_OFF_POINTS       48  /* RgPointLight[RG_LIT_MAX_PT]                     */
#define RG_LIT_MAX_PT           4u
struct RgPointLight {              /* 24 B */
    i32 x, y, z;      /* world position * FP_SCALE                                     */
    u32 rgba;         /* colour RGBA8888                                               */
    i32 intensity;    /* * FP_SCALE                                                    */
    i32 range;        /* attenuation radius * FP_SCALE (0 past range)                  */
};
```

Per-vertex lit colour, computed host-side, deterministic in fixed-point:

```
lit(v) = base(v) · ( ambient
                    + sun_i   · max(0, N·L_sun)            · sun_rgb
                    + Σ_p  point_i(p) · atten(p,v) · max(0, N·L_p) · rgb(p) )
   where base(v) = v.rgba × material/texture sample, N = v.normal.
```

- **`RG_MESH_UNLIT` short-circuits this** to `lit = base` — so a 2D sprite quad (§18)
  is unaffected and draws exactly as today. **2D opts out; 3D opts in; one pipeline.**
- **Baseline is sun + ambient** (`NUM_POINT = 0`), which is all a first lit cube
  needs. Point lights are `RG_WASM_HOST_CAP_LIGHTING 0x0100`, degrade to sun-only on a
  host that lacks them (§14).
- **Output-only, not replay logic.** Like §17 particles/§2.18, lighting affects only
  pixels, never world logic, so it is **not** in the replay stream (§11) — a light
  can flicker per frame without breaking determinism.
- **Normals are the guest's job** (baked into §18 vertices at declare-time). A guest
  that ships zero normals gets flat ambient-only shading, a safe degenerate, not a
  crash. Per-face flat shading is "declare each face's verts with that face's normal";
  smooth shading is "share averaged normals" — a data choice, no ABI change (the
  "transport, never taxonomy" rule, `IDEAL §2.1`).

---

## V2 §21. One pipeline for 2D and 3D — worked cube and incremental path

The through-line of §18–§20 is the guest's own principle: **2D is the orthographic,
`z = 0`, unlit special case of 3D.** Concretely, one path serves both:

| Stage | 2D (today, as a special case) | 3D (added) |
|-------|-------------------------------|------------|
| **Vertex** (§18) | quad, `z = 0`, uv set, normals unused | mesh, real `z`, normals for lighting |
| **Camera** (§19) | `AFFINE2D` → the §16.2 `Mat3` | `ORTHO3D` / `PERSPECTIVE` → `VP_M4` |
| **Lighting** (§20) | `RG_MESH_UNLIT` → colour passthrough | sun + ambient (+ points) per vertex |
| **Raster** | z-free blit (unchanged CPU path) | triangle raster + z-buffer |

A 2D game sets none of the new fields and is byte-compatible with §16.2 — it simply
*is* the corner of the 3D pipeline it always used. A 3D game flips three switches
(projection mode, mesh normals, unlit off) on the same blocks.

**Worked example — a lit, spinning cube** (what the guest declares; a natural first
§13 conformance fixture):

1. **Geometry (§18):** 8 vertices in the mesh vertex pool (cube corners, `±1·FP_SCALE`,
   with per-corner or per-face normals), 36 `u16` indices (12 CCW triangles), one
   `RgMesh { kind=TRIANGLES, material=0, flags=0 }` (vertex-colour, lit).
2. **Camera (§19):** `PROJ = PERSPECTIVE`, `EYE = (0,0,4·FP)`, `TARGET = 0`,
   `UP = (0,1,0)`, `FOVY ≈ 60° in radians·FP`, `NEAR/FAR`. The host writes `VP_M4`.
3. **Lighting (§20):** `AMBIENT_I ≈ 0.2·FP`, one sun `DIR = (−1,−1,−1) normalised`,
   white, `SUN_I ≈ 0.9·FP`, `NUM_POINT = 0`.
4. **Spin:** each step the guest bumps the body/model rotation (reuse the §2.5 body
   `angle`, generalised to a quaternion via the existing `cannon_quaternion`); the
   host re-shades and re-rasters. No per-frame geometry re-declare.

**Incremental path to actually run it** (each step independently testable, in order):

1. **Host-side matrix math first, no ABI.** Wire `cannon_mat3/vec3/quaternion` (already
   tested, `IDEAL §2.17`) into a `buildViewProjection(eye,target,up,fov,near,far)` and
   a software triangle rasteriser with a z-buffer. Prove it draws a hard-coded cube.
2. **Land RG_CAM v2 (§19).** Add the projection modes + `VP_M4`; keep `AFFINE2D`
   passing every current 2D golden fixture unchanged (that is the regression that
   proves 2D is untouched).
3. **Land the mesh block (§18).** Declare-once vertex/index pools + validator vectors
   (§13), reusing the §5 bounds-checking harness. Draw the guest-declared cube.
4. **Land lighting (§20).** Sun + ambient per-vertex; `UNLIT` passthrough proves 2D
   sprites still match their goldens. Add point lights last, capability-gated.
5. **Conformance (§13):** golden bytes for the cube's pools + camera + lights, a
   malformed-mesh validator vector (bad index, odd `idx_count`, degenerate normal),
   and a replay assertion that the *scene* replays byte-identically while lighting is
   free to vary (proving §11's output-only invariant for rendering).

This keeps every V2 rule intact — declare-once (§5/`IDEAL §5`), fixed-point transport
(§16.2/§9), pattern-B seqlock (§7), per-block major/minor gating (§14), output-only
rendering excluded from replay (§11), capabilities negotiated not assumed (§14/§6) —
and reaches a lit 3D object without a single new *mechanism*, only richer data on the
patterns §5 and §16.2 already established. That is the test of the "2D is a special
case of 3D" claim: if it were false, 3D would need a parallel pipeline; here it needs
only three more fields and one more pool.

---

*Proposed. None of this is the current contract — see [`ABI_V1.md`](./ABI_V1.md).
Motivation: [`IDEAL.md`](./IDEAL.md).*
