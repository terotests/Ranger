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
| `assembly/abi.ts` | RGW1 bridge: constants, `rd/wr`, body/control/contact accessors, `isPlayer/isWall/…` | `rust_autopeli/src/lib.rs` (top half) |
| `assembly/ui.ts`  | RGU1 bridge: `Doc` builder + `buildHud()` | `rust_autopeli/src/ui.rs` |
| `assembly/index.ts` | the game: `init` / `update`, traffic AI, contacts → HUD | `rust_autopeli/src/lib.rs` |

The `abi.ts` + `ui.ts` pair is the reusable **SDK** — the AssemblyScript
equivalent of the Rust guest's ABI helpers. New AS games import them and never
touch raw offsets.

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

HUD authoring reads like TS too — `doc.text(id, parent, order, "HITS " +
p.hits.toString(), color)`.

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
