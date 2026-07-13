# Pluggable Host Providers — design draft

Status: **draft / pre-implementation**. This document defines a small provider
framework for the Ranger game engine's WASM host, retrofits the existing
resource system onto it, and specs the first *streaming input* provider (pose)
built the same way. It changes no runtime behaviour on its own; it names a seam
that today does not exist.

The whole point is captured in one sentence: **every host capability a guest can
use is currently hand-wired into the runner _and_ into all three guest bridges;
a provider is that wiring named, so a new capability plugs in instead of being
sewn in.**

---

## 1. What already exists (the resource provider)

There is exactly one provider-shaped mechanism in the engine today — resource
declaration — and studying its contract *and its deliberate limits* is what
this framework generalises.

**Contract.** A guest declares resources through a narrow typed vocabulary and
the host reads the resulting manifest once:

- `hostSheet(id, path, fw, fh, scale, feet, dl)` — kind 1, an image sheet
- `hostRect(id, w, h, r, g, b, dl)` — kind 2, a coloured rectangle

Both push into a flat manifest of parallel arrays (`resKinds`, `resIds`,
`resPaths`, `resIvals` — 10 ints per entry). See
`scripting/as_abi_bridge.rgr:265-278`.

**Same contract on all three backends** — this is the property the framework
must preserve:

| Backend | How the call reaches the host |
| --- | --- |
| Rust `.wasm` | host import `rg_host_register_sheet` / `rg_host_register_rect` (`wasm/rust_autopeli/src/lib.rs:602-643`) |
| AssemblyScript `.wasm` | bare import from `@ranger/game` (`games/autopeli_as_src/game.as:5`) |
| Interpreted `.as` | name-dispatch `has()`/`invoke()` on `AsAbiBridge` (`scripting/as_abi_bridge.rgr:341, 504`) |

The host drains the manifest uniformly regardless of backend
(`scripting/wasm_physics_runner.rgr:477-521`), keyed only on `kind`.

**The streaming-world example is part of this provider.** `createStaticBg()`
paints a tall level *once* through a restricted draw vocabulary
(`bgClear` / `bgFillRect` / `bgFillCircle`, `scripting/game_static_bg_bridge.rgr`)
via `staticLevelHeight()`; the host then **streams** that baked level as a
scrolling camera window with culling (`scripting/world_scroll.game.tsx:40-62`,
"the engine applies camera offset and culling"). Same philosophy: the guest
supplies bounded content once, the host owns and streams it.

**The deliberate limitations** (these are features, not bugs — the framework
must let a provider *declare* its limits, not erase them):

1. **Declare-once, not runtime-streamable.** Resources are drained in a dedicated
   lifecycle phase (`declare_resources()` → `loadResourcesFromWasm()`), before the
   loop. There is no runtime add / free / reload.
2. **Fixed, closed vocabulary.** Exactly two kinds; a fixed 10-int metadata shape.
   New kinds are an ABI change, on purpose.
3. **No pointers cross.** The guest gets string ids back, never host objects; the
   host owns pixels and lifetime.
4. **One-way, guest→host.** It is a declaration channel, not a per-frame data path.

### 1.1 The gap

There is **no registry.** Every capability is sewn into two places by hand:

- the runner (`loadResourcesFromWasm` hard-codes the drain loop), and
- every guest bridge (`hostSheet`/`hostRect` are baked into `AsAbiBridge`, mirrored
  in the Rust and AS SDKs).

Adding pose the current way means editing the runner **and all three bridges**
by hand, with nothing enforcing that they agree. A provider framework closes
exactly this gap.

---

## 2. Provider taxonomy

The resource provider is one point in a 2×2 space. Pose is the opposite corner,
which is why generalising the resource shape alone is not enough — the framework
must model both axes.

| | **Guest → Host** | **Host → Guest** |
| --- | --- | --- |
| **Declare-once (setup)** | resources (`hostSheet`/`hostRect`), static-bg bake | environment / capability query (RGCQ, `wasm_game_abi.h:139`) |
| **Per-frame (streaming)** | UI document (RGU1, guest rebuilds each frame), events (`OFF_EVENTS`) | **input** (RGW1 `OFF_INPUT`), **pose (new)** |

Two axes, therefore two things a provider must declare about itself:

- **direction** — `GUEST_TO_HOST` or `HOST_TO_GUEST`
- **cadence** — `SETUP` (drained once, in a lifecycle phase) or `FRAME`
  (touched every `physicsStep`, in a fixed slot relative to `update()`)

A pose provider is `HOST_TO_GUEST` + `FRAME`. The resource provider is
`GUEST_TO_HOST` + `SETUP`. Same registry, same lifecycle hooks, different corner.

---

## 3. The provider interface

A provider is a host-side object with a stable identity, a required-capability
bit, and lifecycle hooks the runner calls at fixed points. Sketched in Ranger
(`.rgr`) terms so it matches how the runner is actually written:

```
class GameProvider {
    ; identity + negotiation
    fn id:string ()            ; stable slug, e.g. "resource", "pose"
    fn capBit:int ()           ; RG_WASM_HOST_CAP_* this provider satisfies (0 = none)
    fn direction:int ()        ; 1 = guest->host, 2 = host->guest
    fn cadence:int ()          ; 1 = setup (once), 2 = frame (per physicsStep)

    ; lifecycle — the runner calls the ones that apply to this provider
    fn onAttach:void  (rt:WasmPhysicsRunner)     ; wiring: bind ABI base / bridge
    fn onDeclare:void ()                         ; SETUP: drain guest->host manifest
    fn beforeUpdate:void (dtMs:int)              ; FRAME host->guest: write ABI slot
    fn afterUpdate:void  ()                      ; FRAME guest->host: drain ABI slot
    fn onDetach:void  ()                         ; teardown
}
```

Design rules, each inherited from how the resource provider already behaves:

- **The provider owns its ABI region, the runner owns the clock.** A provider
  never calls `update()`; it only reads/writes its bytes in the slot the runner
  gives it. Mirrors `wasm_abi_io.rgr` being pure accessors while
  `wasm_physics_runner.physicsStep` owns ordering.
- **Backend-blind.** A provider reads/writes through `WasmAbiMem`, which already
  dispatches wasm-vs-interpreted behind identical accessors
  (`wasm_abi_io.rgr:28-41`). A provider therefore works on all three guests for
  free — the same property the resource drain has today.
- **A provider declares its limits.** `direction()`/`cadence()` are not decoration:
  the runner uses them to decide which hooks fire and when. A `SETUP` provider is
  never called per-frame; a `HOST_TO_GUEST` provider never has its manifest
  drained. The resource provider's "declare-once, one-way" limits become two
  method return values instead of being implicit in where the code was pasted.

### 3.1 The registry (the missing seam)

```
class ProviderRegistry {
    def providers:[GameProvider]
    fn register:void (p:GameProvider)
    fn declareAll:void ()                 ; onDeclare() for each SETUP guest->host
    fn beforeUpdateAll:void (dtMs:int)    ; beforeUpdate() for each FRAME host->guest
    fn afterUpdateAll:void ()             ; afterUpdate() for each FRAME guest->host
    fn requiredCapsSatisfied:boolean (guestCaps:int)  ; see §5
}
```

The runner holds one `ProviderRegistry` and calls it at the three existing
seams. No provider-specific code lives in the runner after this.

---

## 4. Retrofit: resources as a provider

Proof the framework fits the thing it generalises. `ResourceProvider` wraps the
existing drain with **no behaviour change**:

```
class ResourceProvider extends GameProvider {
    fn id:string ()      { return "resource" }
    fn capBit:int ()     { return 0 }            ; base ABI, always available
    fn direction:int ()  { return 1 }            ; guest -> host
    fn cadence:int ()    { return 1 }            ; setup / declare-once

    fn onDeclare:void () {
        ; body is exactly today's loadResourcesFromWasm():
        ;   wasm_host_res_reset / declare_resources / drain kind==1|2 into GameHost
        ;   (wasm_physics_runner.rgr:477-521)
    }
}
```

The runner's `initAssets()` (`wasm_physics_runner.rgr:425-429`) becomes:

```
fn initAssets:void () {
    render.initAssets(assetsDir pw worldH)
    providers.declareAll()          ; was: this.loadResourcesFromWasm()
    render.buildStaticBg(setup)
}
```

The static-bg bake is a natural second `SETUP` provider (`StaticWorldProvider`)
carrying the `bg*` vocabulary and `staticLevelHeight()`; keeping it separate from
`ResourceProvider` is what makes the two independently pluggable. Both keep every
limitation from §1 — the retrofit renames the wiring, it does not loosen the
contract.

---

## 5. Capability gate (must land with, or before, the first HOST_TO_GUEST provider)

Audit finding worth repeating here: the handshake in `wasm_game_abi.h:89-117`
(`rg_abi_version` / `rg_required_caps` / `rg_check_env`) is **documented and
exported by guests** (`wasm/as_autopeli/assembly/index.ts:458-459`) but the host
never calls it — `setupScene()` loads and runs `update()` directly, validating
only `abi.verifyMagic()` (`wasm_physics_runner.rgr:554-567`).

For resources this was harmless (a guest simply got its declared sheets). For a
`HOST_TO_GUEST` provider it is not: a guest that *requires* pose but runs on a
host without the provider would read zeroed pose memory and silently mis-behave.
So the registry owns the gate:

```
need = has(rg_required_caps) ? call(rg_required_caps) : 0
host = OR of capBit() over all registered providers
if (need & ~host) reject("host missing capability")   ; run once, right after load
```

`requiredCapsSatisfied(guestCaps)` computes `host` from the registry, so adding a
provider automatically widens what the host advertises — no second list to keep
in sync.

---

## 6. First streaming provider: pose

Pose is the framework's first `HOST_TO_GUEST` + `FRAME` provider. It is the
mirror image of the resource provider along both axes, which is the whole reason
to have the taxonomy.

- **id** `"pose"`, **capBit** `RG_WASM_HOST_CAP_POSE_INPUT = 0x0010` (next free
  bit; `wasm_game_abi.h:115` reserves `0x0010..`).
- **Block: RGP1**, a separate independently-versioned block exposed by the guest
  exactly like RGU1 (`rg_pose_ptr` / `rg_pose_size` / `rg_pose_revision`,
  modelled on `wasm_ui_abi.h:28-31`). Not crammed into the full 64-byte RGW1
  header, not into the RGCQ tail.
- **Write slot:** `beforeUpdate(dtMs)` writes the current pose sample into RGP1
  in the same pre-`update()` slot where input flags are written today
  (`wasm_physics_runner.rgr:652`, between `setInputFlags` and the `update()` call).
- **Backends:** on wasm, write via `WasmAbiMem` into `rg_pose_ptr()`; on
  interpreted `.as`, `AsAbiBridge` gains a third buffer `pose:[int]` beside
  `abi:[int]`/`ui:[int]` (`as_abi_bridge.rgr:18-19`) with the same LE accessors —
  identical to how the UI block already has an interpreted backend.
- **Source seam:** a `PoseSource` drives the AI model and writes one latest frame
  into a shared buffer; the provider copies that into RGP1. The provider is the
  only thing that touches ABI bytes, so the source is swappable (a recorded-pose
  source for tests, or a smaller/faster model, drops in with no guest change — the
  same way a rect resource stands in for a missing image).

Pose *respects the resource provider's discipline in the other direction*: fixed
typed layout (RGP1), no pointers cross, host owns the transport, guest reads a
bounded snapshot. The limitations are inherited, only the direction and cadence
flip.

### 6.1 Layering & the swap boundary (what recompiles when)

The chain has a **narrow waist** — RGP1. Everything on the source side is
swappable; only RGP1's *shape* is a hard boundary.

```
[ AI model ] → [ PoseSource ] → [ shared buffer ] → [ PoseProvider ] → ‖ RGP1 ‖ → [ game ]
  MediaPipe      adapter:         SharedArrayBuffer     host glue:         stable     guest
  WASM, a        drives model,    (latest-value         copy latest        contract   reads
  black box      writes buffer     snapshot)            frame → RGP1                   RGP1
```

| Change | Game recompile? | What you do |
| --- | --- | --- |
| Model weights, same family (lite→heavy `.task`) | **No** | load a different asset |
| Whole inference engine (MediaPipe→ONNX→custom) | **No** | write/swap the `PoseSource` adapter; host module only |
| Transport (SAB↔WebSocket↔native mmap) | **No** | swap the source/transport half |
| **RGP1 layout** (new landmarks, new scale) | **Yes** | ABI change: bump RGP1 version, gate with the cap bit |

Interpretation has a deliberate degree of freedom: RGP1 carries **both** raw
landmarks **and** a computed gesture enum. A game that reads the enum lets the
*source side* own gesture detection — so a better classifier ships without
recompiling games; a game that reads raw landmarks interprets for itself, at the
cost of a rebuild to change that logic. Push interpretation to the source and
have games read the enum when you want model improvements to be runtime-only.

### 6.2 Transport: SharedArrayBuffer is primary; WebSocket is a niche adapter

Game input is a **register read** ("what is the pose right now"), not a message
stream: each frame wants the latest value and to skip whatever it missed.

- **SharedArrayBuffer (primary).** A MediaPipe Web Worker writes landmarks into a
  SAB; the host reads the latest complete frame guarded by a **seqlock** (odd
  while writing, even when stable) and copies it into RGP1. This is drop-to-latest
  by construction, the lowest-latency handoff, single-process, and the *same shape
  RGW1 input already uses* — RGP1's `revision` field (offset 8) is exactly that
  seqlock counter. The payload is a few hundred bytes, so the per-frame copy is
  negligible. Its one requirement is cross-origin isolation (`COOP`/`COEP`) to
  enable `SharedArrayBuffer` — a config line on a kiosk you serve yourself.
- **WebSocket (niche only).** Justified *solely* when inference cannot share the
  runtime — native MediaPipe in a separate process, a remote/edge inference box.
  It is a message-queue primitive, so getting latest-only means fighting it
  (drain/coalesce/drop), it adds serialize→hop→deserialize latency and jitter, and
  a second process to supervise — all for a payload that gains nothing from a
  socket. Do **not** default to it.

Because transport lives behind the `PoseSource` seam, this is not a one-way door:
SAB now; a WebSocket `PoseSource` slots in later *iff* a remote/native source ever
appears, with RGP1 and every game untouched.

Two SAB flavors, for later: (a) a **separate** SAB for RGP1 + a small copy into
the guest's linear memory each frame — simple, no special guest build, the PoC
choice; (b) the guest's own `WebAssembly.Memory({shared:true})` *is* the SAB and
the worker writes RGP1 in place — true zero-copy, but needs a shared-memory guest
build. Start with (a); (b) is an optimization.

---

## 7. Non-goals / respected limits

- **Not** a general RPC or arbitrary runtime resource streaming — declare-once
  stays declare-once; providers do not gain the ability to hand the guest host
  pointers.
- **Not** a new ABI transport — providers ride the existing RGW1 header slots,
  RGU1/RGP1 side blocks, and host-import manifest. No new marshalling layer.
- **Not** hot-pluggable at runtime in v1 — providers are registered at load,
  gated once, then fixed for the session (matches today's lifecycle).

---

## 8. Milestone order

1. `GameProvider` + `ProviderRegistry`, runner holds one, three call sites wired
   (`declareAll` / `beforeUpdateAll` / `afterUpdateAll`) — no behaviour change.
2. Retrofit `ResourceProvider` (and `StaticWorldProvider`) onto it; verify the
   autopeli / world_scroll demos are byte-identical.
3. Wire the capability gate through `requiredCapsSatisfied` (§5).
4. RGP1 block header + guest exports; interpreted `pose:[int]` backend;
   `SharedPoseBuffer` (seqlock) + `PoseSource` seam + `PoseProvider.pump()`.
   *(done — §9.)*
5. Browser transport: `SharedPoseBuffer` becomes a real `SharedArrayBuffer`, and a
   `MediaPipeWorkerSource` (MediaPipe WASM in a Web Worker) replaces
   `FakePoseSource` — first fed static test images (no camera), then the USB
   camera. `FakePoseSource` / a recorded-pose source stay as the headless-test
   sources. A WebSocket source is added later *only if* out-of-process/remote
   inference is ever required (§6.2).

Steps 1–3 are pure refactor + the already-specified gate; the pose-specific work
(4–5) only begins once the seam exists and is proven by the retrofit.

---

## 9. Working prototype (interpreted path)

A first end-to-end slice of §6 is implemented and runs headless on the
interpreted `.as` engine — no asc, no camera, no registry retrofit yet. It
proves the RGP1 block + a host→guest streaming provider work through the exact
bridge the compiled guest would use.

Pieces:

- **RGP1 block** on `AsAbiBridge` (`scripting/as_abi_bridge.rgr`): a 128-byte
  `pose:[int]` buffer beside `abi:[int]`/`ui:[int]`, with LE `ppw`/`ppr`, host
  writers (`poseWriteHeader`/`poseWriteLandmark`/`poseBump`) and guest readers
  (`posePresent`/`poseGesture`/`poseX`/`poseY`/`poseRevision`) wired into the
  native `has()`/`invoke()` dispatch. Layout: `0` magic `RGP1`, `4` version,
  `8` revision, `12` present, `16` gesture, `20` landmark count, `32..`
  landmark[i] = xFp, yFp (world units ×256). Gesture enum: `0` none, `1`
  arms_up, `2` lean_left, `3` lean_right.
- **Source / shared buffer / provider** (`scripting/game_pose_provider.rgr`),
  the three layers from §6.1 wired but decoupled:
  - `SharedPoseBuffer` — the SharedArrayBuffer analog: a byte buffer holding one
    latest frame (present, gesture, count, landmarks) plus a **seqlock** at
    offset 12 (odd while writing, even when stable). Single-threaded here, but the
    write (`beginWrite`/`endWrite`) and read (`seqValue` before/after) protocol is
    what the browser build uses once this becomes a real SAB.
  - `PoseSource` / `FakePoseSource` — the swappable source seam. `FakePoseSource`
    fabricates a deterministic pose (nose sweep + periodic arms_up) into the shared
    buffer; a `MediaPipeWorkerSource` later overrides `produce()` with real
    landmarks and nothing else changes.
  - `PoseProvider` — host→guest + frame provider (`id="pose"`, `capBit=16`,
    `direction=2`, `cadence=2`). `pump()` does *only* the seqlock read of the
    latest frame and the copy into RGP1 — no fabrication, no model knowledge.
- **pose_demo game** (`games/pose_demo/game.as`, ylos2 sprites): moves the hero
  sprite (body 0) to the tracked head position and spawns a super sprite
  (body 1) on each ARMS_UP gesture, building a pose-driven RGU1 HUD.
- **pose_provider_demo** (`scripting/pose_provider_demo.rgr`): wires
  `source.produce → shared buffer → provider.pump → RGP1 → callUpdate()`, then
  reads RGW1 back and prints the reaction each frame. Verified: the game's hero X
  tracks the nose the source published into the shared buffer (120→348), `bodies`
  flips 1↔2 with arms_up, the HUD shows `POSE ARMS_UP` / `SUPERS n`.

### Tokenizer fix landed while building this (non-ASCII source truncation)

Building the prototype surfaced a real lexer bug, now fixed in
`gallery/ts_parser/ts_lexer.rgr`. `TSLexer` set its end-of-input `len` to a
code-*point* count (`countCodeUnits`, which groups each multi-byte UTF-8
sequence into one), but `peek`/`advance`/`at` walk the source one unit at a
time over the space `strlen` counts — raw *bytes* when a `.as`/`.tsx` file is
read from disk via `buffer_to_string`. So any non-ASCII byte (an em-dash `—` in
a `//` comment, a `"…"` smart-quote, accented text) made `len` smaller than the
byte-indexed source and the lexer stopped short, silently dropping the file's
final tokens — the missing closing `}` then surfaced downstream as
`Parse error: expected '}' but got ''`. The fix is `len = strlen(src)`, which is
correct for both a decoded JS string (code units) and a byte string (bytes);
it is a no-op for pure-ASCII sources (`strlen == countCodeUnits` there). `.as`
comments may now contain quotes and non-ASCII freely.
