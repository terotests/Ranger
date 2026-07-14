# ABI_V1 — the shipped Ranger game-engine ABI (normative)

**Status of this document: NORMATIVE.** This file describes *exactly* the byte
contract that ships and runs today. If an implementer needs to know "what is the
current, binding guest/host contract", it is this file and the generated headers
under [`wasm/`](./wasm/). Nothing here is aspirational.

- Rationale and motivation for these shapes live in [`IDEAL.md`](./IDEAL.md).
- Proposed layouts, breaking changes, and everything not yet shipped live in
  [`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md) — **do not implement against those
  as if they were current.**
- Host-side Ranger interfaces that are *not* a byte-level ABI (providers, scene
  seam, registries) live in [`HOST_ARCHITECTURE.md`](./HOST_ARCHITECTURE.md).
- Shared conventions and the status legend are in [`IDEAL_API.md`](./IDEAL_API.md).

**Source of truth precedence.** When this document and a generated header under
[`wasm/`](./wasm/) disagree, **the header wins** and this document has a bug to
fix. The header is machine-checkable; prose is not. `IDEAL.md` never overrides a
shipped byte layout — it explains intent only.

**Cross-reference notation.** `API §x` refers to a section of *this* file or of
`ABI_V2_PROPOSAL.md` (stated which). `IDEAL §x` refers to `IDEAL.md`. `HOST §x`
refers to `HOST_ARCHITECTURE.md`. A bare `§` is never used.

Every symbol and field below is tagged **[SHIPPED]** (present in a `wasm/*.h`
header and honoured by the runtime) or **[RESERVED]** (a defined slot/constant
that ships in the header but is not yet acted on by the runtime — safe to write,
currently ignored on read). Anything that would be **[PROPOSED]** is not in this
file; it is in `ABI_V2_PROPOSAL.md`.

---

## API §1. Concurrency & ownership model (as shipped)

This is the single most important section for a correct implementation, and the
one the ABI historically under-specified. The shipped blocks do **not** share one
uniform model; there are two, and they differ in whether a `revision` seqlock is
present.

### API §1.1 Two shipped patterns

| Pattern | Blocks | Writer(s) | Reader | Synchronisation |
|---------|--------|-----------|--------|-----------------|
| **A — turn-based, single-threaded, no seqlock** | RGW1, RGSP1 | both host and guest write *different words of the same block*, but never at the same time | the other party | frame turn order (below); **no** `revision` word exists |
| **B — cross-thread, single-writer, seqlock** | RGP1, RGIN, RGU1 | exactly one party writes the whole block | the other party, possibly on another thread | a `revision` seqlock word |

**There is no shipped block in which two parties write concurrently.** Pattern A
blocks are mixed-writer but strictly ordered within a frame; pattern B blocks
have a single writer.

### API §1.2 Pattern A: RGW1 / RGSP1 turn order (normative)

RGW1 and RGSP1 are one linear-memory block each, driven by a single host thread
that calls the guest synchronously. Per frame the host runs this exact order:

```
1. host writes its header words   (RGW1: dt_ms, time_ms, input, input_p2;
                                    RGSP1: dt_ms, time_ms, char_count, input,
                                    input_p2, view_w, view_h, catalog ids)
2. host calls guest update()/tick() — SYNCHRONOUS, host is blocked
3.   guest reads host words, writes its words
       (RGW1: body_count + bodies[], impulses[], contacts[], events[], scalars;
        RGSP1: slot_count + slots[], mode)
4. update() returns
5. host reads the guest words it needs (and RGSP1 host MAY write slot.frame back)
```

Because step 2 is synchronous and single-threaded, **neither party ever reads a
word while the other is writing it**, and no seqlock is needed. A conforming host
MUST NOT run the guest's `update()` concurrently with its own writes to the same
block. A conforming host MUST NOT retain a guest pointer past `update()` return.

Ownership per word is fixed and documented in the layout tables (API §3): a word
is either host-owned or guest-owned; the other party treats it as read-only.

> **[Known divergence — resolved in ABI_V2_PROPOSAL API §V2-1]** The shared
> convention (`IDEAL_API` status legend, `IDEAL §2.3`) recommends offset 12 be a
> `revision` seqlock word for *new* blocks. RGW1 and RGSP1 predate that rule and
> use **offset 12 = `dt_ms`** (a host-written scalar). This is intentional and
> correct for pattern A, which needs no seqlock. Do not add a seqlock read to
> RGW1/RGSP1 — offset 12 is `dt_ms`, full stop.

### API §1.3 Pattern B: RGP1 / RGIN / RGU1 seqlock (normative)

These blocks have a single writer that may run on a different thread from the
reader (pose from a camera/AI worker; input from an OS input thread; UI read by a
render thread). They carry a `revision` word and use a **seqlock**:

- **Writer**, before touching payload: `revision += 1` (now **odd** = writing).
  After the payload is fully written: `revision += 1` (now **even** = stable).
- **Reader**: read `revision` (r1); if odd, retry. Copy the payload. Read
  `revision` again (r2); if `r1 != r2` or either is odd, retry.

`revision` is a `u32` and wraps; readers MUST compare for equality, never
ordering. The word offset differs by block and MUST be read from the constant,
not assumed:

| Block | `revision` offset | Writer | Reader |
|-------|-------------------|--------|--------|
| RGP1 | 12 (`RG_POSE_OFF_REVISION`) | host | guest |
| RGIN | 12 (`RG_IN_OFF_REVISION`) | host | guest |
| RGU1 | 8 (`RG_UI_OFF_REVISION`) | guest | host |

RGU1's `revision` is *also* a change-token: the guest bumps it only when rendered
content changes, so the host may skip re-parsing an unchanged document (`IDEAL
§2.3`). Both roles are served by the same monotone bump; the odd/even seqlock read
still applies during the bump.

> The shipped memory-ordering guarantee is **"single host thread, synchronous
> guest calls" for pattern A** and **"seqlock with full copy between matched even
> revisions" for pattern B.** The ABI does not yet specify C11 `memory_order`
> tags; a host that publishes pattern-B blocks across real threads MUST use at
> least release-on-writer-second-bump / acquire-on-reader-first-read fencing. A
> precise atomics contract is proposed in `ABI_V2_PROPOSAL API §V2-7`.

---

## API §2. Lifecycle & capability handshake (shipped subset)

```
load → negotiate → init → loop
```

### API §2.1 Handshake exports (guest → host) [SHIPPED]

A guest MAY export these pure, side-effect-free probes. A host calls them after
load and before the first `init()`/`update()`.

| Export | Returns | Meaning |
|--------|---------|---------|
| `i32 rg_abi_version(void)` | RGW1 version the guest built against | absent ⇒ treat as v1 |
| `i32 rg_ui_abi(void)` | `(RGU1_major << 16) \| RGU1_minor` | absent ⇒ guest uses no UI |
| `i32 rg_required_caps(void)` | OR of `RG_WASM_HOST_CAP_*` the guest must have | absent ⇒ 0 |

**Export-presence detection is required.** A legacy guest that omits
`rg_abi_version` MUST read as v1, *not* as "exported and returned 0". The wasm3
bridge provides `rg_wasm_has_export`; a host that cannot probe presence treats a
`0` return as legacy v1 / caps 0.

Recommended gate (run once, after load, before `init()`):

```c
ver  = has(rg_abi_version)   ? call(rg_abi_version)   : 1;   /* legacy = v1  */
need = has(rg_required_caps) ? call(rg_required_caps) : 0;
if (ver > RG_WASM_ABI_VERSION) reject("needs newer host");   /* layout gap   */
if (need & ~RG_WASM_HOST_CAPS) reject("missing capability");  /* feature gap  */
/* then init(): verify RGW1 magic + size, clamp every count to its MAX_*.    */
```

`RG_WASM_HOST_CAPS` (what this host advertises) is the OR of every attached
provider's `capBit()` (`HOST §1`); it is a host-build value, not a header
constant.

### API §2.2 RGCQ typed capability query [SHIPPED]

The soft-capability channel lives in the reserved RGW1 tail (`2304..2560`) so
`RG_WASM_ABI_SIZE` is unchanged. A host that ignores it degrades to "nothing
answered" and the guest reads its own defaults.

```c
#define RG_WASM_OFF_CAPQ         2304        /* block base                      */
#define RG_WASM_CAPQ_MAGIC       0x51434752u /* 'RGCQ'                          */
#define RG_WASM_CAPQ_OFF_MAGIC   0   /* u32 guest writes once declared          */
#define RG_WASM_CAPQ_OFF_COUNT   4   /* u32 guest: number of requested keys (≤6)*/
#define RG_WASM_CAPQ_OFF_READY   8   /* u32 host: 1 when answers are filled     */
#define RG_WASM_CAPQ_OFF_POOL_USED 12/* u32 guest: key bytes used in the pool   */
#define RG_WASM_CAPQ_ENTRIES     2320        /* entry[] base (CAPQ + 16)        */
#define RG_WASM_CAPQ_MAX         6
#define RG_WASM_CAPQ_ENTRY_SIZE  20
#define RG_WASM_CAPQ_POOL        2440        /* string pool base, to ABI_SIZE   */
/* entry (20 B): keyOff(u16) keyLen(u16) present(u8) type(u8) _(u16)
 *               ival(i32) fval(f32) sLen(i32)
 *   guest writes keyOff/keyLen (into the pool); host writes present/type/value. */
#define RG_WASM_CAP_NONE 0u
#define RG_WASM_CAP_BOOL 1u
#define RG_WASM_CAP_INT  2u
#define RG_WASM_CAP_FLOAT 3u
#define RG_WASM_CAP_STRING 4u
```

Flow: host calls `rg_declare_queries()` → guest writes keys into the pool and sets
`COUNT`/`POOL_USED`/`MAGIC`; host resolves each key, writes `present`/`type`/value,
sets `READY = 1`; host calls `i32 rg_check_env()` → guest returns `0` (run) or
`!= 0` (abort reason).

> **[Known gap — resolved in ABI_V2_PROPOSAL API §V2-2]** For a **string** answer,
> the entry carries `sLen` (byte length) but **no offset** to the value bytes. The
> shipped runtime therefore answers `BOOL`/`INT`/`FLOAT` keys only; a `STRING`
> answer has no defined location and MUST NOT be relied on. `type = STRING` is
> **[RESERVED]** until V2 defines the value region.

Key strings are a convention, not ABI (`"physics"`, `"screen.width"`, `"gpu"`,
`"debugmode"`, …). Absence of `rg_declare_queries`/`rg_check_env` means the guest
does not negotiate soft capabilities.

---

## API §3. Shipped blocks (byte layouts)

Every block: 4-char little-endian `magic`, `version`, `size` in the first 12
bytes; host validates magic + version + size and clamps every count to its
`MAX_*` before trusting the block (untrusted-data discipline, `IDEAL §2.3`).

### API §3.1 RGW1 — world / physics [SHIPPED]

`wasm/wasm_game_abi.h`, magic `0x31574752` `'RGW1'`, **v1**, **2560 B**,
`FP_SCALE 256`. Pattern **A** (API §1.2). Header (64 B), all `i32`:

| Off | Field | Owner | Off | Field | Owner |
|-----|-------|-------|-----|-------|-------|
| 0 | `magic 'RGW1'` | guest | 32 | `impulse_count` | guest |
| 4 | `version` | guest | 36 | `contact_count` | guest |
| 8 | `size` (2560) | guest | 40 | `score` | guest |
| **12** | **`dt_ms`** | **host** | 44 | `hits` | guest |
| 16 | `time_ms` | host | 48 | `camera_y` | guest |
| 20 | `input` | host | 52 | `event_count` | guest |
| 24 | `input_p2` | host | 56 | `air_p1` *(generic guest scalar)* | guest |
| 28 | `body_count` | guest | 60 | `air_p2` *(generic guest scalar)* | guest |

Host-owned header words are exactly the four: `dt_ms`, `time_ms`, `input`,
`input_p2`. `air_p1`/`air_p2` are **generic opaque guest scalars** the host
transports without meaning (`IDEAL §2.1`) — the names are historical.

Arrays (offsets derived from the `MAX_*`/`*_SIZE` constants in the header):

| Array | Off | Count × stride | Record fields (`i32`) | Owner |
|-------|-----|----------------|-----------------------|-------|
| `bodies` | 64 | 32 × 24 | `x, y, angle, speed, angVel, flags` | guest |
| `controls` | 832 | 32 × 16 | `ch0..ch3` (API §3.2) | host |
| `impulses` | 1344 | 16 × 16 | `bodyIdx, ix, iy, _` | guest |
| `contacts` | 1600 | 14 × 32 | API §3.3 | guest |
| `events` | 2048 | 12 × 20 | `kind, sub, a, b, c` | guest |
| RGCQ tail | 2304 | — | API §2.2 | mixed |

`MAX_BODIES 32`, `MAX_IMPULSES 16`, `MAX_CONTACTS 14`, `MAX_EVENTS 12`. Counts are
host-clamped to these. Event `kind`: `1 = sound` (`RG_WASM_EVENT_SOUND`),
`2 = rumble`, `3 = particles`; `sub` and `a/b/c` are guest conventions.

> `time_ms` is a **signed `i32`** in milliseconds. Wrap/overflow behaviour past
> ~24.8 days is currently **undefined**; a widening/wrap contract is proposed in
> `ABI_V2_PROPOSAL API §V2-9`. Guests should treat it as monotonic within a
> session and diff it, not compare absolute values across long sessions.

### API §3.2 RGW1 control record (16 B) [SHIPPED]

Four opaque `i32` fixed-point channels; the guest names them in its own source.

```c
#define RG_WASM_CTRL_OFF_CH0  0
#define RG_WASM_CTRL_OFF_CH1  4
#define RG_WASM_CTRL_OFF_CH2  8
#define RG_WASM_CTRL_OFF_CH3  12
```

Host side stays neutral: `readControlChannel(bodyIdx, ch)` — never
`steer/throttle/brake/grip`.

### API §3.3 RGW1 contact record (32 B) [SHIPPED]

The record is **fully allocated to eight `i32` fields — there is no free slack.**

```c
#define RG_WASM_CT_OFF_BODYA    0   /* i32 body id code (guest convention)      */
#define RG_WASM_CT_OFF_BODYB    4   /* i32 body id code                         */
#define RG_WASM_CT_OFF_PHASE    8   /* i32 RG_WASM_CONTACT_PHASE_*              */
#define RG_WASM_CT_OFF_IMPULSE  12  /* i32 normal impulse (fp)                  */
#define RG_WASM_CT_OFF_X        16  /* i32 contact point x (fp)                 */
#define RG_WASM_CT_OFF_Y        20  /* i32 contact point y (fp)                 */
#define RG_WASM_CT_OFF_NX       24  /* i32 normal x * 1000 (milli)              */
#define RG_WASM_CT_OFF_NY       28  /* i32 normal y * 1000 (milli)              */
```

Contact phases are defined constants:

```c
#define RG_WASM_CONTACT_PHASE_BEGIN   1
#define RG_WASM_CONTACT_PHASE_PERSIST 2   /* [RESERVED] arcade core emits BEGIN only */
#define RG_WASM_CONTACT_PHASE_END     3   /* [RESERVED]                              */
```

**[SHIPPED behaviour]** The shipped arcade core emits **`BEGIN` only**;
`PERSIST`/`END` are defined constants but not yet produced. `MAX_CONTACTS` (14)
overflow uses **drop-lowest-impulse**.

> **[Known hazard — resolved in ABI_V2_PROPOSAL API §V2-3 and §V2-4]** Because the
> record has no free field, penetration depth and tangent (friction) impulse
> cannot be added without widening the record and bumping the block version.
> Separately, once `PERSIST`/`END` are produced, "drop-lowest-impulse" is unsafe
> (a low-impulse `END` could be dropped, stranding the guest in a
> permanently-touching state). Both are addressed in V2; today, with `BEGIN`-only
> semantics, the drop policy is acceptable but must not be carried into the
> three-phase model unchanged.

Collision **geometry is declared once (guest-owned), never streamed per frame.**
Shape kinds are defined constants:

```c
#define RG_WASM_SHAPE_CIRCLE   1   /* a = radius (fp)            */
#define RG_WASM_SHAPE_BOX      2   /* a = halfW, b = halfH (fp)  */
#define RG_WASM_SHAPE_SEGMENT  3   /* a..d = x1,y1,x2,y2 (fp)    */
#define RG_WASM_SHAPE_POLYGON  4   /* a = vertex count -> side vertex table */
```

> **[Incomplete — resolved in ABI_V2_PROPOSAL API §V2-5]** `RG_WASM_SHAPE_POLYGON`
> references a "side vertex table" for which **no block, offset, handle, capacity,
> or owner is defined** in the shipped ABI. Polygon shapes therefore **cannot be
> implemented portably today**; CIRCLE/BOX/SEGMENT are the shipped shape set.

`body.flags` bits (additive): `RG_WASM_BODY_ACTIVE 1`, `RG_WASM_BODY_STATIC 2`,
`RG_WASM_BODY_SENSOR 4`.

### API §3.4 RGSP1 — ready-character sprites [SHIPPED]

`wasm/wasm_sprite_abi.h`, magic `0x50534752` `'RGSP'`, **v1**, **2560 B**,
`FP_SCALE 256`. Pattern **A**. Host writes header + catalog + input; guest writes
`slot_count` + slots + `mode`; host resolves `charId → sheet/rows`, animates, and
MAY write the resolved `frame` back.

```
Header (64 B): MAGIC 0, VERSION 4, SIZE 8 (guest);  DT_MS 12, TIME_MS 16 (host);
  CHAR_COUNT 20 (host), SLOT_COUNT 24 (guest), INPUT 28, INPUT_P2 32 (host),
  VIEW_W 36, VIEW_H 40 (host), MODE 44 (guest).
Slots @64: MAX_SLOTS 64 × SLOT_SIZE 32, i32 fields:
  CHARID 0 (0 = empty), ANIM 4, DIR 8, FLAGS 12, XFP 16, YFP 20 (feet),
  CLOCK 24 (anim ms), FRAME 28.
Catalog id table (host) @2112: RG_SPR_OFF_CAT_IDS, i32[RG_SPR_MAX_CAT 32].
```

- Slot flags: `ACTIVE 1`, `FRAMEOVERRIDE 2`, `FLIP_X 4`.
- `DIR`: `UP 0, LEFT 1, DOWN 2, RIGHT 3`.
- Exports: `sprite_ptr/size/init/tick` (MAY also export `rg_abi_version`).
- Note offset 12 = `dt_ms` (pattern A; see API §1.2), same as RGW1.

**[SHIPPED behaviour]** `RG_SPR_ANIM_WALK 0` works; `RUN 1`/`JUMP 2` are
**[RESERVED]** constants that currently fall back to `WALK` (+ a synthesised hop)
until expanded art is baked. The roster is the **catalog id table**
(`RG_SPR_OFF_CAT_IDS`), data — never a frozen `RG_SPR_CHAR_*` enum (there is none).

### API §3.5 RGU1 — retained-mode UI [SHIPPED]

`wasm/wasm_ui_abi.h`, magic `0x31554752` `'RGU1'`, **v1.0**, **8192 B**. Pattern
**B** (guest writes, host reads; `revision` @8). A flat vDOM: `parent_id +
child_order` describe structure; strings live in a table referenced by
`(offset,len)`; colors are `0xRRGGBBAA`. The host validates the whole block as
untrusted (magic, version, bounds, unique ids, valid/acyclic parents, utf-8) and
rebuilds its element tree on a `revision` bump. Exports: `rg_ui_ptr/size/revision`.

```
Header (48 B): MAGIC 0, MAJOR 4(u16), MINOR 6(u16), REVISION 8, ROOT_ID 12,
  NODE_OFFSET 16, NODE_COUNT 20, PROP_OFFSET 24, PROP_COUNT 28,
  STRING_OFFSET 32, STRING_SIZE 36, FLAGS 40 (RG_UI_FLAG_VALID 1), RESERVED0 44.
Node table @64: MAX_NODES 64 × NODE_SIZE 32:
  id 0, parent_id 4, kind 8(u16), flags 10(u16), first_property 12,
  property_count 16(u16), child_order 18(u16), event_mask 20, reserved 24/28.
Property table @2112: MAX_PROPS 128 × PROP_SIZE 16:
  key 0(u16), type 2(u8), flags 3(u8), value_a 4, value_b 8, value_c 12.
String table @4160: STRING_CAP 1024.
```

- **Node kinds**: `VIEW 1, TEXT 2, IMAGE 3, PROGRESS_BAR 4, BUTTON 5, SPACER 6,
  CUSTOM 100`.
- **Node flags** (u16): `SELECTABLE 0x1, DISABLED 0x2, DEFAULT 0x4`.
- **Property types**: `I32 1, F32 2, COLOR 3, STRING 4 (a=off, b=len), VEC2 5,
  RECT 6, ENUM 7, BOOL 8`.
- **Property keys**: `TEXT 1, BACKGROUND 2, COLOR 3, FONT_SIZE 4, FONT_FAMILY 5;
  WIDTH 10, HEIGHT 11, PADDING 12, MARGIN 13, BORDER_RADIUS 14, BORDER_COLOR 15,
  BORDER_WIDTH 16; FLEX 20, FLEX_DIRECTION 21, ALIGN_ITEMS 22, JUSTIFY 23,
  TEXT_ALIGN 24; IMAGE_RESOURCE 30; VALUE 40, MAX_VALUE 41`. Enums:
  `FlexDirection {ROW 0, COLUMN 1}`, `Align {START 0, CENTER 1, END 2,
  SPACE_BETWEEN 3}`.
- **Events** (`event_mask`, shipped subset): `ACTIVATE 0x1, SELECT 0x2,
  DESELECT 0x4`. Selection state lives on the host, keyed by stable node id, and
  survives rebuilds.

### API §3.6 RGU1 event callback (host → guest) [SHIPPED]

The **shipped** signature is exactly three parameters:

```c
void rg_ui_event(uint32_t node_id, uint32_t event, uint32_t value);
/*   event = one of RG_UI_EVENT_* (ACTIVATE / SELECT / DESELECT)
 *   value = event-specific payload (0 for ACTIVATE; reserved otherwise)        */
```

If the guest does not export `rg_ui_event`, the host still navigates and
highlights; activation is simply not delivered.

> **[Breaking change ahead — resolved in ABI_V2_PROPOSAL API §V2-6]** The target
> pointer/text-capable UI needs a wider payload. Because the export name cannot
> carry two signatures and export-presence does not reveal arity, the shipped
> 3-arg `rg_ui_event` is **frozen**; the 4-arg form ships under a **new name**
> (`rg_ui_event_v2`). Do not redefine `rg_ui_event`'s arity.

### API §3.7 RGP1 — pose / body tracking [SHIPPED]

`wasm/wasm_pose_abi.h`, magic `0x31504752` `'RGP1'`, **v2**, **856 B** (read
`RG_POSE_OFF_SIZE`, never assume). Pattern **B** (host writes, guest reads;
`revision` @12). Host→guest streaming skeleton with motion/speed as first-class
channels.

```
Header (64 B): MAGIC 0, VERSION 4, SIZE 8, REVISION 12, PRESENT 16, GESTURE 20,
  LM_COUNT 24, TIME_MS 28, DT_MS 32, FLAGS 36, BODY_VX 40, BODY_VY 44,
  BODY_SPEED 48, (52..63 reserved).
Landmark[i] @64, LM_SIZE 24: X 0, Y 4, VX 8, VY 12, SPEED 16, CONF 20.
FP: positions [0,1]*FP_SCALE(256); velocity/speed Q16.16 (FP_VEL 65536), per sec.
Flags: VALID 1, HAS_VEL 2, SMOOTHED 4, JUST_APPEARED 8.
```

Motion (`vx/vy`), speed (`|v|`), and aggregate body velocity/speed are
host-provided (computed from consecutive smoothed frames), gated by
`RG_POSE_FLAG_HAS_VEL` and `RG_WASM_HOST_CAP_POSE_INPUT`. Coordinates are
normalized and view-independent; the guest scales into its own world. Velocity
definition is precise in the header comment (differenced from the *smoothed*
signal, `dt = DT_MS/1000`).

> `RG_POSE_MAX_LM = 33` documents the BlazePose landmark count in the header. That
> constant is a *capacity*, not a taxonomy the guest must obey; which landmark
> means what stays the guest's decision. A `skeleton_schema_id + landmark_count`
> generalisation (so 33 is one registered schema, not the only one) is proposed in
> `ABI_V2_PROPOSAL API §V2-8`.

### API §3.8 RGIN — typed per-player input [SHIPPED]

`wasm/wasm_input_abi.h`, magic `0x4e494752` `'RGIN'`, **v1**. Pattern **B** (host
writes, guest reads; `revision` @12). A 20-byte header + `record[player_count]`,
each **40 B** (`RG_IN_STRIDE`).

```
Header (20 B): MAGIC 0, VERSION 4, SIZE 8, REVISION 12, PLAYER_COUNT 16.
record[p] @ 20 + p*40:
  BUTTONS 0 (u32), LSTICK_X 4, LSTICK_Y 8, RSTICK_X 12, RSTICK_Y 16,
  TRIG_L 20, TRIG_R 24, POINTER_X 28, POINTER_Y 32, FLAGS 36 (u32).
FP_SCALE 256 (normalized axes -FP..+FP; triggers 0..FP).
MAX_PLAYERS 8; host clamps PLAYER_COUNT.
```

- Digital bits: `UP 1, DOWN 2, LEFT 4, RIGHT 8, ACTION 16, BACK 32`. These mirror
  RGW1's `input`/`input_p2` (five bits × two players → `record[0]`/`record[1]`
  `BUTTONS`).
- Record flags: `CONNECTED 1, POINTER_DOWN 2, HAS_ANALOG 4, HAS_POINTER 8`.
- The digital `BUTTONS` bitfield is the simple default; analog/pointer are
  additive (a guest reading only `BUTTONS` is unaffected).

> `POINTER_X/Y` are **integer view pixels** (`-1 = none`), not fixed-point. Whether
> a pointer value fed back into game logic is deterministic across replays depends
> on a normalization rule that the shipped ABI does not define; see
> `ABI_V2_PROPOSAL API §V2-10`. Today, treat pointer as a presentation-space input,
> not a replay-stable logic input.

---

## API §4. Capability bits (`RG_WASM_HOST_CAP_*`) [SHIPPED values]

A guest ORs the bits it requires into `rg_required_caps()`. The host advertises
the OR of its providers' `capBit()`s (`RG_WASM_HOST_CAPS`, a host-build value) and
rejects an unsatisfiable guest at load.

| Bit | Value | Gates |
|-----|-------|-------|
| `RG_WASM_HOST_CAP_PHYSICS` | `0x0001` | host runs `GamePhysics` for the guest |
| `RG_WASM_HOST_CAP_RUMBLE` | `0x0002` | gamepad rumble events honoured |
| `RG_WASM_HOST_CAP_PARTICLES` | `0x0004` | particle events honoured |
| `RG_WASM_HOST_CAP_RGU1` | `0x0008` | retained-mode HUD (RGU1) parsed |
| `RG_WASM_HOST_CAP_POSE_INPUT` | `0x0010` | RGP1 pose streaming + motion/speed |
| `RG_WASM_HOST_CAP_UI_DYNAMIC` | `0x0020` | handle-based dynamic EVG UI (`rg_evg_*`) — **[RESERVED]**, API surface is PROPOSED (V2) |
| `RG_WASM_HOST_CAP_RES_STREAM` | `0x0040` | `rg_res_*` streaming resources / workers — **[RESERVED]**, API surface is PROPOSED (V2) |

Bits `0x0001`–`0x0010` gate shipped surfaces. `0x0020`/`0x0040` are **defined
header values** whose *guest-facing APIs* (`rg_evg_*`, `rg_res_*`) are proposed —
the bit exists so a host that later ships the provider can advertise it, but a
guest requiring one of these bits against today's runtime is correctly rejected.
Bits `0x0080` and up are unassigned; assign additively, never reuse a retired bit.

---

## API §5. Determinism — what the shipped ABI actually guarantees

The shipped ABI guarantees **fixed-point transport** (positions, velocities, hit
tests, and any logic-affecting value fed back to the guest are integers, so they
match bit-for-bit across CPU/GPU/replay). It does **not** yet guarantee
end-to-end deterministic replay. Honestly stated:

| Channel | Shipped guarantee |
|---------|-------------------|
| Fixed-point world/pose values | ✅ identical across platforms |
| RGW1 `input`/`input_p2`, RGIN buttons | deterministic *if* the host feeds identical inputs per step (the host does not yet record/replay them for you) |
| Pose (RGP1) | values are fixed-point, but sampling cadence vs. `step` is host-dependent; no replay protocol |
| Storage reads (none shipped) | n/a |
| Audio / rumble / particle events | output-only; must never feed logic/RNG/step order |
| Resize / hotplug | surfaced as events, not silent mutation |

A full, testable record/replay protocol (`step_id`, per-step event ordering, pose
resampling, storage snapshot, hotplug capture, callback delivery point, worker
results) is **proposed** in `ABI_V2_PROPOSAL API §V2-11`. Until it lands,
determinism is a *design goal supported by fixed-point*, not a checkable ABI
guarantee — do not promise frame-accurate replay to a guest against V1.

---

## API §6. Entity identity — the shipped reality

The shipped surfaces address entities **three different ways**, and an implementer
must not assume they are interchangeable:

| Surface | Identifier | Kind |
|---------|-----------|------|
| RGW1 `impulses[].bodyIdx` | array index into `bodies[]` | frame-local slot |
| RGW1 `contacts[].bodyA/bodyB` | guest-defined **body id code** | guest convention |
| RGSP1 slots | array slot + `charId` | frame-local slot + catalog id |

A **body array index is valid only within one snapshot**; a **body id code** is
whatever mapping the guest chose (`HOST §2`, `contactBodyCode`/`bodyCodeToId`).
There is no shipped persistent `EntityId` and no generation counter on game
entities (generation counters exist only on the *proposed* host-object handles,
which are not shipped). A unified `EntityId` model (persistent id, local index,
resource handle with generation, reuse rules) is proposed in
`ABI_V2_PROPOSAL API §V2-12`.

---

## API §7. Conformance (shipped blocks)

A host or guest claims V1 conformance for a block by passing that block's test
vectors. The following are **required deliverables** for each shipped block
(RGW1, RGSP1, RGU1, RGP1, RGIN); they are the machine-checkable complement to this
prose and, together with the headers, are the real contract:

1. **Golden byte fixtures** — a canonical valid block, byte-for-byte, that a
   conforming reader parses to a known structure.
2. **Validator vectors** — malformed blocks (bad magic, wrong version, count past
   `MAX_*`, out-of-bounds string offset, cyclic/duplicate RGU1 parent ids,
   non-utf8 string) each with the expected host verdict (reject / clamp).
3. **A reference encoder + decoder** for at least one block, so two independent
   implementations can be diffed against the same bytes.

These vectors live alongside the headers (proposed location `wasm/tests/`); until
present, treat the headers plus this document as the contract and add fixtures as
blocks stabilise. The V2 blocks carry the same conformance requirement from day
one (`ABI_V2_PROPOSAL API §V2-13`).

---

*Normative for the shipped ABI. Motivation: [`IDEAL.md`](./IDEAL.md). Target and
breaking changes: [`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md).*
