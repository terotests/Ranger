# IDEAL_API — index & shared conventions for the game-engine ABI

This is the entry point to the Ranger game-engine ABI. It used to be a single
document that mixed the current contract, the v2 plan, a roadmap, and host-internal
architecture. Following review, that content is now split so an implementer can
always tell **what is binding right now** from **what is proposed**:

| Document | Status | Contents |
|----------|--------|----------|
| **[`ABI_V1.md`](./ABI_V1.md)** | **NORMATIVE** | Exactly what ships and runs today: block byte-layouts (RGW1, RGSP1, RGU1, RGP1, RGIN, RGCQ), the concurrency/ownership model, handshake, capability bits, and honest current result/determinism/identity semantics. |
| **[`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md)** | **PROPOSED** | Target layouts and breaking changes: new blocks, widened records, `rg_ui_event_v2`, versioning rules, the `RgResult` model, the replay protocol, the identity model, and the **mobile** surfaces (RGMO device motion `V2 §18`, networking `rg_net_*` `V2 §19`, in-app purchases `rg_iap_*` `V2 §20`). **Not the current contract.** |
| **[`HOST_ARCHITECTURE.md`](./HOST_ARCHITECTURE.md)** | Informative | Host-internal Ranger interfaces (`GameProvider`, `GameSceneProvider`, `BodyVisual`, registries). Function-passing interfaces, **not a byte-level ABI.** |
| **[`IDEAL.md`](./IDEAL.md)** | Rationale | Why each interface should look the way it does. The source of *intent*; never overrides a shipped byte layout. |

**Where to start:** implementing a guest or host against today's runtime → read
`ABI_V1.md` and the generated headers under [`wasm/`](./wasm/). Planning the next
version → `ABI_V2_PROPOSAL.md`. Understanding a design choice → `IDEAL.md`.
Targeting **mobile** (device motion/orientation, haptics, networking/multiplayer with
OpenAPI-subset backend schema validation, in-app purchases, and the Apple/Xcode host
packaging) → `IDEAL §2.9`, `§2.19`–`§2.22` for rationale and `ABI_V2_PROPOSAL.md §18`–`§20`
(schema validation in `§19.1`) for the proposed byte/import surfaces.

---

## Status legend

Every symbol, field, and layout in the ABI documents is tagged:

- **[SHIPPED]** — present in a `wasm/*.h` header and honoured by the runtime. Bind
  to it. (Only in `ABI_V1.md`.)
- **[RESERVED]** — a slot or constant that exists in a shipped header for future
  use but is **not yet acted on**. Safe to write; currently ignored on read.
- **[PROPOSED]** — a target shape not in any shipped header. **Do not implement as
  if current.** (Only in `ABI_V2_PROPOSAL.md`.)

Tagging is **per symbol**, not per section: a shipped block may contain reserved
fields, and a shipped constant (e.g. a capability bit) may gate a proposed API.

## Source-of-truth precedence

1. **Generated headers** under [`wasm/`](./wasm/) — machine-checkable, and the
   real contract. If a doc disagrees with a header, the header wins.
2. **`ABI_V1.md`** — normative prose for the shipped surface.
3. **`ABI_V2_PROPOSAL.md`** — proposed, non-binding.
4. **`IDEAL.md`** — intent/rationale. Explains, never defines a byte.

Conformance is ultimately defined by **test vectors** (golden byte fixtures,
validator vectors, a reference encoder/decoder, and — for v2 — a record/replay
harness), not by prose. See `ABI_V1 §7` and `ABI_V2_PROPOSAL §13`.

---

## Cross-reference notation

Section references are always prefixed with the document, so a `§` is never
ambiguous:

- **`API §x`** → a section of `ABI_V1.md`.
- **`V2 §x`** → a section of `ABI_V2_PROPOSAL.md`.
- **`HOST §x`** → a section of `HOST_ARCHITECTURE.md`.
- **`IDEAL §x`** → a section of `IDEAL.md`.

A bare `§x` with no prefix is a bug — report it. (The old convention, where a bare
`§` sometimes meant `IDEAL.md` and sometimes meant a local section, is retired.)

---

## Shared conventions (invariant across V1 and V2)

These hold for every block and import in both ABI documents.

### The three-layer boundary (`IDEAL §1`)

| Layer | Who | Sees |
|-------|-----|------|
| **Host** | engine core (`scripting/`, `gfx_sdl.rgr`, …) | owns memory, devices, rendering, simulation |
| **ABI** | shared `wasm/*.h` byte contracts + host imports | *transport only* — bytes and structure, never game meaning |
| **Guest** | the game (Rust / AssemblyScript `.wasm`, interpreted `.as`, or TS) | owns *meaning* — names channels, declares its world, registers its vocabulary |

The ABI is a **transport, never a taxonomy** (`IDEAL §2.1`): a block defines bytes
and structure; the guest assigns meaning. No game name, sound id, character kind,
or control label belongs in a shared header.

### Fixed-point (`IDEAL §0.2`)

| Constant | Value | Used for |
|----------|-------|----------|
| `FP_SCALE` | `256` | world/screen positions, normalized `[0,1]`, gain/pan/pitch ratios (`FP = unity`) |
| `FP_VEL` (`RG_POSE_FP_VEL`) | `65536` (Q16.16) | velocities and speeds, per second |

Anything fed *back* to the guest that could affect logic (a hit test, an
unprojected pointer, a persisted read) uses fixed-point so results match across
CPU, GPU, and replays. (The camera view matrix uses its own Q16.16 scale,
`RG_CAM_FP_MTX`, distinct from `FP_SCALE`; see `V2 §16.2`.)

### Direction & cadence encoding (`IDEAL §0.5`)

- **Direction:** `1 = guest→host`, `2 = host→guest`.
- **Cadence:** `1 = setup (once)`, `2 = frame (per step)`.

These integers appear both on the wire and on the host-side provider interface
(`HOST §1`).

### Determinism principle (`IDEAL §0.5`)

Output-only channels (audio, haptics, particles, cosmetic animation, logging)
**must never feed logic, RNG, or step order.** Inputs (pose, controls, capability
reads at init, gameplay-animation lifecycle events, persisted reads) are
**deterministic**: a replay sees the same values at the same step. Genuine runtime
changes (resize, hotplug) arrive as **events**, never silent mid-step mutations.

What the shipped ABI actually guarantees today (fixed-point transport, but no
end-to-end replay protocol yet) is stated honestly in `API §5`; the checkable
record/replay protocol is proposed in `V2 §11`.

### Block discipline (the RGU1 rule — `IDEAL §2.3`)

Every block follows RGU1's discipline: a fixed, typed layout at documented byte
offsets (no pointers ever cross the boundary); snapshot-first publication; the host
validates the block as untrusted data (magic, version, size, counts clamped); and
tear-free cross-thread reads use a `revision` seqlock **where the block's writer
model requires one**. Note that the shipped RGW1/RGSP1 blocks are single-threaded
turn-based and carry `dt_ms` (not a seqlock) at offset 12 — the seqlock rule
applies to cross-thread blocks (RGP1, RGIN, RGU1); see `API §1` for the precise,
per-block model.

---

*Index. Shipped contract: [`ABI_V1.md`](./ABI_V1.md). Proposals:
[`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md). Host internals:
[`HOST_ARCHITECTURE.md`](./HOST_ARCHITECTURE.md). Rationale:
[`IDEAL.md`](./IDEAL.md).*
