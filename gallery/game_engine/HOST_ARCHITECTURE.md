# HOST_ARCHITECTURE — host-internal Ranger interfaces (not the ABI)

**Status: informative, host-internal.** Everything in this document is a **Ranger
host-side interface** — a set of functions the engine core calls *inside one
address space*. **None of it is a byte-level guest/host ABI.** It cannot be
implemented across the Rust / WASM / AssemblyScript / TS boundary as written,
because it passes function pointers and object references, not bytes at fixed
offsets.

It lives here, separate from [`ABI_V1.md`](./ABI_V1.md) and
[`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md), precisely so the ABI documents
contain only what crosses the byte boundary: memory layouts, imports/exports,
wire types, lifecycle, result/error semantics, and capability/versioning rules.

**How this relates to the ABI.** These interfaces *sit behind* the ABI: a provider
is how a host wires a capability up internally, and its `capBit()` is what the host
then advertises over the byte-level capability bitmask (`API §4`). Registries
are how the host resolves guest-declared vocabulary (ids, names) that the ABI
transports opaquely. The ABI is the contract; this is one host's implementation
shape.

**Cross-reference notation.** `API §x` = `ABI_V1.md`. `V2 §x` =
`ABI_V2_PROPOSAL.md`. `IDEAL §x` = `IDEAL.md`. `HOST §x` = this file.

---

## HOST §1. Providers & the capability seam — `IDEAL §6`

Every host capability plugs into a **registry**, not hand-wired into the runner and
three bridges. A provider is a host-side object:

```
class GameProvider {
    fn id:string ()        ; "resource", "pose", "scene", …
    fn capBit:int ()       ; RG_WASM_HOST_CAP_* it satisfies (0 = base ABI)
    fn direction:int ()    ; 1 = guest->host, 2 = host->guest
    fn cadence:int ()      ; 1 = setup (once), 2 = frame (per physicsStep)
    fn onAttach / onDeclare / beforeUpdate / afterUpdate / onDetach
}
```

The host's advertised capability set — the `RG_WASM_HOST_CAPS` value the
byte-level gate consumes (`API §2.1`, `API §4`) — is the **OR of every attached
provider's `capBit()`**. Adding a provider automatically widens what the host
advertises; there is no second capability list. The gate itself (reject an
unsatisfiable guest once, right after load, before `update()`) is ABI and lives in
`API §2.1`; *this* interface is how the host assembles the number the gate checks.

`direction` and `cadence` here are the host-internal mirror of the wire-level
direction/cadence encoding (`IDEAL_API` shared conventions). RGP1, for example,
plugs in as a provider (`direction = host→guest`, `cadence = frame`, `capBit =
RG_WASM_HOST_CAP_POSE_INPUT`), and *that* is what makes the shipped RGP1 byte block
(`API §3.7`) available to a guest.

---

## HOST §2. Engine-core ↔ game seam — `GameSceneProvider` (`IDEAL §3`)

A generic runner obtains **everything game-specific from an interface it is
compiled against** — never from concrete game types, imports, or constants:

```
interface GameSceneProvider {              ; provided by the game, held by the core runner
    ; world (guest is the preferred source; a provider is the fallback)
    fn buildScene(phys:GamePhysics bodyIds:[string]) : void   ; bodies + bounds
    fn worldSize() : (int, int)                               ; no 6000 baked in core
    fn playerCount() : int                                    ; no fixed 2 in core
    ; presentation
    fn initAssets(render:GenericRender pw:int) : void
    fn buildStaticBg(render:GenericRender) : void
    fn spriteFor(id:string) : string                          ; entity id -> template
    fn drawHud(target:SoftCanvas paneIdx:int abi:WasmAbiMem) : void  ; HUD, or emit RGU1
    ; ABI conventions this guest chose (transport, not taxonomy — IDEAL §2.1)
    fn contactBodyCode(id:string) : int
    fn bodyCodeToId(code:int) : string
    fn mapEvent(kind:int sub:int) : GameEventNative           ; sound / particle ids
    ; camera policy
    fn cameraFor(paneIdx:int phys:GamePhysics) : int
}
```

`contactBodyCode`/`bodyCodeToId` bridge the host's internal representation to the
**guest-defined body id codes** the ABI transports opaquely in RGW1 contacts
(`API §3.3`). Under the V2 identity model these collapse into a single
`EntityId ↔ guest name` mapping (`V2 §12`), removing the parallel body-code space.

`mapEvent` turns the ABI's opaque `event.kind/sub` (`API §3.1`) into a
host-native sound/particle action — again, meaning assigned host-side, transport
kept neutral.

**Proposed — not yet in code (`IDEAL §5`).** `wasm_physics_runner.rgr` still
imports `wasm_autopeli_setup.rgr` / `wasm_autopeli_render.rgr` and holds a concrete
`setup:WasmAutopeliSetup`. The target ("one world, one owner"): the *guest* owns
the world — it declares bodies, bounds, world size, camera hints, and static-bg
through the same declare-once channel it already uses for resources, and the
host-side `setupPhysics()` copy is deleted. The `GameSceneProvider` above is the
fallback for hosts/paths where the guest is not the world source.

---

## HOST §3. Game-declared data shapes resolved host-side

These are structures a game declares and a host resolves; they travel as
guest-declared data (ids, atlas rows, registered names) that the ABI transports,
but the *interfaces* that consume them are host-side.

### HOST §3.1 Body → visual binding (`IDEAL §2.5`)

One declared contract the game provides (not three code paths):

```
interface BodyVisual {                 ; provided by the game, not core
    fn visualFor(bodyId:string) : VisualRef        ; template id | RGSP1 charId
    fn animFor(bodyId:string st:BodyState) : (anim dir flip)  ; guest rule
}
; Host loop, backend-agnostic:
;   for each active body: read (x,y,angle) from RGW1 (API §3.1),
;     resolve BodyVisual.visualFor(id),
;     write that transform into the sprite template OR the RGSP1 slot xFp/yFp,
;     pick anim/dir from BodyVisual.animFor(id, {speed, vx, vy, lastContact}).
```

The *values* here cross the ABI (RGW1 body pose in, RGSP1 slot out); the
`BodyVisual` interface that maps between them is host-side.

### HOST §3.2 Sprite / atlas / HUD shapes (`IDEAL §2.8`, `IDEAL §2.15`)

- **Atlas** — the runtime shape of `atlas.json` (`frameW/H`, `sheetW/H`,
  direction rows, `animations{ id: { row, frameCount, cycle[], fps, loop } }`).
  Animation ids/rows/cycles are **data** (LPC emits them); the roster is the RGSP1
  catalog id table (`API §3.4`), never a frozen `RG_SPR_CHAR_*` enum.
- **Sprite instance** — `{ visual: sheetHandle + atlas, transform: x,y,angle,
  scale,flipX, anim: animId, clockMs|frameOverride, dir }`. `GameEntity` kinds,
  RGSP1 slots, and the draw list all reduce to this host-side shape; sheets load
  through the resource path (`V2 §17`).
- **HUD** — an EVG/RGU1 document the game declares, drawn by the one EVG renderer
  used for both HUD and menus; interactive via the typed input record delivered
  back over `rg_ui_event`/`rg_ui_event_v2` (`API §3.6`, `V2 §6`). The document and
  events are ABI; the renderer and layout engine are host-side.

---

## HOST §4. Registries — game vocabulary as data (`IDEAL §4`)

Game vocabulary is **registration**, not `if (kind == "…")` in core. The
registration table lives in the host; entries come from the game at setup. The
*registered names/ids* are guest data the ABI transports opaquely; the registry
that resolves them is host-side.

| Registry | Call (at setup) | Replaces |
|----------|-----------------|----------|
| Shape drawers | `registerShape("ghost", fn)` | `kind == "wedge"` / `"ghost"` branches |
| Sound palette | `registerSound("brick", spec)` | builtin ids `brick`/`bounce`/`wall` |
| Animation clips / easings | `register("walk", …)` / `register("glow", …)` | `WALK/RUN/JUMP`, `glow/pulse` enums |
| Haptic patterns | pattern-name registration | frozen rumble presets |
| View routes | route-name registration | raw file paths |
| Emitters / effects / filters | descriptor registration | canned particle presets |
| Feature flags | named/typed flag registry | ad-hoc `verbose` / `useWasmHud` |

`registerShape("ghost", fn)` and friends pass a **function** to the host — the
clearest reason these are host-internal and not ABI: a byte layout cannot transport
a drawer callback across the WASM boundary. A guest on the far side of the boundary
instead registers *data* (an emitter descriptor, an atlas row, a sound spec) that
the host interprets; only an in-process (TS/`.as`-interpreted) guest can hand the
host an actual `fn`.

Feature flags are named, typed values (bool/int/enum) with a defined **source
precedence** — build default → config/`game.info` → env/CLI → persisted →
runtime override — queryable by host *and* guest over the RGCQ / env key/value
channel (`API §2.2`), scoped per-game or global. Flags read at init are stable
inputs; runtime toggles arrive as events.

---

*Host-internal. The byte-level contract is [`ABI_V1.md`](./ABI_V1.md) (shipped) and
[`ABI_V2_PROPOSAL.md`](./ABI_V2_PROPOSAL.md) (proposed). Rationale:
[`IDEAL.md`](./IDEAL.md).*
