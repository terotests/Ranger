# AssemblyScript autopeli guest — same WASM bridge as Rust

This is a second WASM-producing language for the game engine, alongside the Rust
guest. It proves the point behind the two branches of the project:

```
one TypeScript-style game file
├── in development:  Ranger's live evaluator + hot reload
└── at ship time:    AssemblyScript compiler (asc) → game.wasm
```

Both guests talk the **same shared-memory ABI** the host already speaks — RGW1
(world/physics) + RGU1 (retained-mode HUD). The host does not know or care which
language produced the `.wasm`.

## Layout

| File | Role | Rust counterpart |
|------|------|------------------|
| `assembly/abi.ts` | RGW1 bridge: raw `rd/wr` + the **object header** (`World`/`Body`/`Contact`/`Impulses`/`Events` + `Road`/`Vec2`/`Drive`/`ConeLaunch`) | `rust_autopeli/src/lib.rs` (top half) |
| `assembly/ui.ts`  | RGU1 bridge: fluent `Ui` builder (`ui.view().column().padding()`, `ui.label()`) + `buildHud()` | `rust_autopeli/src/ui.rs` |
| `assembly/index.ts` | the game: `init` / `update`, traffic AI, contacts → HUD | `rust_autopeli/src/lib.rs` |

The `abi.ts` + `ui.ts` pair is the reusable **SDK** — the AssemblyScript
equivalent of the Rust guest's ABI helpers. New AS games import them and never
touch raw offsets.

### The object header (`abi.ts` + `ui.ts`)

The bottom half of **both** bridge files is a thin **object layer** over the raw
primitives, so game code reads in objects the way the original `.tsx` reducer /
JSX HUD does — not in scratch globals, index calls, or manual offset math.

`abi.ts` (RGW1 world/physics):

```ts
// before (low-level)                     // after (object header)
roadAt(y); const cx = RCX, h = RHALF;     const r = roadAt(y); r.center, r.half
bodyX(BODY_P1); bodyY(BODY_P1);           P1.x; P1.y
writeControl(0, s, t, b, grip);           P1.control(s, t, b, grip);
contactBodyA(ci); contactPhase(ci);       contact.i = ci; contact.bodyA; contact.phase
IMP_CNT = 0; appendImpulse(id,0,0,a);     impulses.reset(); impulses.angular(id, a);
pushEvent(EVT_SOUND, id, 0,0,0);          events.sound(id);
rd(OFF_HITS); wr(OFF_SCORE, v);           world.hits; world.score = v;
```

`ui.ts` (RGU1 HUD):

```ts
// before (low-level Doc)                       // after (object header)
doc.node(10, 1, VIEW, order);                   ui.view(10, 1, order)
doc.propEnum(K_FLEX_DIRECTION, DIR_COLUMN);        .column()
doc.propI32(K_PADDING, 4);                         .padding(4);
doc.text(base + 2, colId, 2, s, color);         ui.label(base + 2, colId, 2, s, color);
```

Two properties keep this safe on the WASM path:

- **Same emitted arithmetic / bytes.** The views are thin getters/setters over
  the same `rd/wr` (and the fluent `Ui` methods over the same byte writers), so
  the numbers and RGU1 bytes reaching the ABI are identical to the low-level
  version — verified byte-for-byte (see below).
- **Zero per-frame allocation.** Every object is a module-scope singleton
  (`world`, `P1`/`P2`, `contact`, `impulses`, `events`, `ui`), and the value
  structs (`road`/`vel`/`drive`/`coneLaunch`) are mutated-and-returned rather
  than freshly allocated, so `--runtime minimal` (no GC) never grows memory. The
  one rule: copy a returned value struct's fields into locals before calling the
  same producer again (the game code already does).

### Extending the header without breaking old apps

Both layers — the **wire ABI** (RGW1/RGU1, shared with the host and the Rust
guest) and the **guest-side header API** (the classes above) — can grow, but
they evolve under different rules. The guiding principle is the same: *old bytes
and old call sites must keep meaning exactly what they meant.*

**Wire ABI (RGW1/RGU1) — additive, version-gated.** The format is already
self-describing: RGW1 carries `magic` + `version` + `size`; RGU1 carries `magic`
+ `major`/`minor`; every property is `(key, type, value)` and every record has a
published stride. That gives four safe moves:

- *Append, never reorder or resize in place.* New header fields go in the
  reserved tail after `OFF_AIR_P2`; they read back as `0` on guests/hosts that
  predate them, so `0` must be the "old behaviour" default. Existing field
  offsets never move.
- *Grow a record by bumping the stride + a version, not by squeezing.*
  `BODY_SIZE`/`CONTACT_SIZE`/`EVENT_SIZE` are contract constants. To add a field
  to a body, raise `minor`, publish the new stride, and let the host read the
  stride from the header rather than assuming a constant — old guests emit the
  old stride and the host handles both.
- *Unknown keys/kinds degrade, they don't fault.* Because props are typed, a
  host can skip a `key` it doesn't recognise (the `type` gives its size). New
  node kinds and event kinds follow the same contract: an unknown kind is
  ignored (or rendered as an empty `View`), never a hard error. That makes a new
  guest safe in front of an old host and vice-versa.
- *Version is a capability gate, not a kill switch.* The host reads `version` /
  `minor` and lights up new behaviour only when the guest advertises it; the
  common subset always works.

**Guest-side header API (`abi.ts` / `ui.ts`) — purely additive.** This is
ordinary TypeScript source compatibility:

- *Add methods and classes; don't change or remove existing signatures.* A new
  `Body.setAngle(...)` or a new `Particles` accumulator can't break a game that
  never calls it.
- *Extend a call with a defaulted parameter.* `ui.label(id, parent, order, s,
  color, fontSize = 8)` is the worked example in `ui.ts`: every existing call
  keeps the 8-px RGU1 look and emits identical bytes, while new games pass a
  size. Default-valued params are the header's main non-breaking growth lever.
- *Introduce, deprecate, delete — in that order, across versions.* Keep an old
  method delegating to the new one for a release rather than deleting it under
  callers.
- *Add singletons, don't repurpose them.* Re-binding an existing singleton to a
  new meaning is a silent break; a new named singleton is not.

The safety net for all of this is `tools/selfcheck.cjs`: keep a pre-change
`build/baseline.wasm`, and any change that is *meant* to be behaviour-preserving
(a refactor, or an additive method left uncalled) must still print `10/10
regions identical`. A change that legitimately alters output will diff there
first — which is exactly where you want to notice it.

### The reverse direction: old host, newer guest (don't crash)

The dangerous case isn't a new host reading an old game — additive rules cover
that. It's an **old device running a game built for a newer ABI**: a guest that
moved an offset, emits an event kind the host never heard of, or imports a host
function that doesn't exist. Left unchecked, that surfaces as a wrong-offset
read, a `switch` with no default, or — for a missing import — a wasm3 link trap
the *first time the guest calls it* (often mid-`declare_resources`/`update`, not
at load). The defence is a **handshake at startup**, before the host trusts any
shared memory or enters the loop. Four layers, cheapest first:

1. **Catalog metadata (no instantiation).** `game.info` already carries
   `engine=`/`abi=`; a `minHostAbi=` / `caps=` line lets the launcher gray out or
   annotate a game it can't run *without even loading the module*. This is the
   only layer that also protects against a broken/malicious module, since no
   guest code runs.
2. **Load guard.** Wrap module load so a failed instantiation (and a missing
   *export* the host needs — `abi_base`/`init`/`update`/`rg_ui_ptr`) is caught
   and the game is skipped with a message, never faulting the launcher. Give
   forward-declared host imports safe no-op stubs so a missing import degrades to
   "feature does nothing" instead of a link trap.
3. **Version + capability probe (before `init`).** The guest exports three pure,
   side-effect-free functions — `rg_abi_version()`, `rg_ui_abi()`,
   `rg_required_caps()` (see `index.ts`; registry in `wasm/wasm_game_abi.h`). The
   host reads them and rejects cleanly:

   ```
   ver  = exports rg_abi_version   ? rg_abi_version()   : 1   // legacy = v1
   need = exports rg_required_caps ? rg_required_caps() : 0
   if (ver  >  HOST_ABI_VERSION)  reject "game needs a newer host"
   if (need & ~HOST_CAPS)         reject "host missing capability: <bits>"
   ```

   They touch no shared memory, so they're safe to call on an otherwise
   incompatible guest — unlike `init()`, which assumes host features exist. And
   because *absence* of the export means "v1, no caps", the probe is itself
   backward-compatible with every guest already shipped (the Rust build, the
   pre-handshake AS build).
4. **Post-init + runtime bounds.** After `init()`, verify the RGW1 `magic` and
   that `size` fits the host's read window before rendering; then **clamp every
   count** (`event_cnt`, `contact_cnt`, `impulse_cnt`, RGU1 node/prop counts) to
   the `RG_WASM_MAX_*` maxima before iterating, and **skip unknown** event/node
   kinds and prop keys rather than asserting. A guest can always write a larger
   count than an old host expects; clamping turns that from an out-of-bounds read
   into a dropped tail.

**The honest limitation.** Forward-compat detection only works if the host
already contains the check — a host *already in the field* that predates layer 3
cannot be taught to probe a future guest. So the realistic strategy is: land the
handshake now so every *future* host is safe, lean on layer 1 (catalog metadata)
as the retrofit-friendly gate for simpler/older launchers, and treat a bumped
`RG_WASM_ABI_VERSION` as the one-way signal that old hosts must refuse. The
guest can't make an old host clever; it can only make itself *legible* — which
is what the three exports and the `game.info` metadata are for.

## Build & run

```bash
bash gallery/game_engine/wasm/as_autopeli/build.sh
```

This runs `asc`, writes `games/autopeli_as/logic.wasm`, and copies the shared
art. The launcher auto-discovers the folder (via `game.info`, `engine=wasm`), so
**AssemblyScript Autopeli (WASM)** appears next to the Rust one:

```bash
npm run engine:game-sdl:run     # pick "AssemblyScript Autopeli (WASM)"
```

Exports match the Rust guest exactly: `abi_base`, `init`, `update`,
`declare_resources`, `rg_ui_ptr`, `rg_ui_size`, `rg_ui_revision`, `memory`.
Imports are only the two host asset-registration functions (`abort` is compiled
out with `--use abort=` so the wasm3 host needs no extra imports).

## How close is it to the original `.tsx`?

Very close, because AssemblyScript *is* a strict TypeScript subset. The contact
handling the `.tsx` does in its reducer ports almost verbatim — compare the
`.tsx`:

```ts
if (c && c.phase === "begin") {
  if (isPlayer(c.bodyA)) { playerId = c.bodyA; otherId = c.bodyB; }
  else if (isPlayer(c.bodyB)) { playerId = c.bodyB; otherId = c.bodyA; }
}
```

with the AssemblyScript (`index.ts`):

```ts
if (contactPhase(ci) == 1) {
  const bodyA = contactBodyA(ci), bodyB = contactBodyB(ci);
  if (isPlayer(bodyA)) { player = bodyA; other = bodyB; }
  else if (isPlayer(bodyB)) { player = bodyB; other = bodyA; }
}
```

HUD authoring reads like the `.tsx` JSX too — `ui.view(10, 1, order).column()`
then `ui.label(id, colId, order, "HITS " + p.hits.toString(), color)`.

### The differences that matter (Ranger GameScript "Profile 1")

The one structural change from the reducer-style `.tsx` is **state lives in
module globals + a shared buffer**, not in a returned state object:

```ts
// .tsx (dynamic reducer):        function update(props): GameState { return next }
// AS / WASM (mutable module):     export function update(): void { /* mutate ABI */ }
```

That is inherent to the WASM path and matches the project's own analysis. The
subset that compiles on *both* the evaluator and `asc` is:

- types: `i32`, `u32`, `f32`, `f64`, `bool`, `string`, `void`
- explicit function signatures, `let`/`const`, `if/for/while`, classes, arrays
- bitwise operators, `<i32>x` casts
- **no** `any`, dynamic property add, heterogeneous arrays, or arbitrary object
  literals as gameplay state

## Scope of this port

**Full feature parity with the Rust guest.** Ported 1:1 from
`rust_autopeli/src/lib.rs`: body placement, input → player controls, traffic AI,
road grip, oil spin/recovery, ramp jumps + air boost, cone-launch impulses
(including the `sin/cos` velocity math), collision sounds/rumble/particles, brake
screech, win detection, and the per-player RGU1 HUD.

## Verified — byte-for-byte parity

Both guests are booted from the same ABI, driven with identical inputs and
injected contacts (wall/cone/traffic, with a car angle+speed so the cone-launch
`Math.sin/cos` path runs), then every output region is compared:

```
OK  controls (17 bodies)     OK  events         OK  camera_y
OK  impulse count            OK  score          OK  air p1/p2
OK  impulses                 OK  hits           OK  RGU1 HUD block
OK  event count
10/10 regions identical — FULL PARITY
```

The AssemblyScript guest is a **byte-exact drop-in** for the Rust guest — same
i32/f64 results, same impulses, same HUD. Re-run the check with:

```bash
node gallery/game_engine/wasm/as_autopeli/tools/parity.cjs \
  gallery/game_engine/wasm/rust_autopeli/target/wasm32-unknown-unknown/release/rust_autopeli.wasm \
  gallery/game_engine/games/autopeli_as/logic.wasm
```

When refactoring the AS guest (e.g. moving code onto the object header) you can
prove the change is behaviour-preserving **without** rebuilding the Rust guest,
by comparing two AS builds against each other over the same drive+contacts:

```bash
# keep a pre-change build, then compare the new one against it
node gallery/game_engine/wasm/as_autopeli/tools/selfcheck.cjs \
  build/baseline.wasm gallery/game_engine/games/autopeli_as/logic.wasm
# → 10/10 regions identical — IDENTICAL BEHAVIOUR
```
