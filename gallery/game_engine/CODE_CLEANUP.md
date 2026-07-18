# CODE_CLEANUP — shrink the engine to what earns its keep

> Status: **plan / in progress**. Scope: `gallery/game_engine` only.
> Two goals, done together before more code piles on the pile:
> 1. **Delete dead weight** — files that no longer serve a testing, build, or
>    shipped-game need are pure cognitive load. Remove them.
> 2. **Stabilise entity IDs** — replace volatile array-index handles with a real
>    generation-checked `EntityRegistry` (the ID change). See §4.

## 1. The keep/delete criterion

A file **stays** only if it is one of:
- **Engine core / reusable subsystem** actually imported by a shipped path
  (`scripting/` runtime, `physics/`, `three/src`, `lpc/`, `menu/`, `ui/`,
  `pose/`, `model3d/`, `wasm/` headers, `lib/`).
- **A shipped game** under `games/<name>/` (these are the games that matter).
- **Reachable from a test/build root** — a vitest `.test.ts`, a
  `scripts/*.sh` / `*.mjs`, or a repo-root `package.json` script.

Everything else — Ranger/native re-implementations of games that already exist
as `games/`, one-off `*_demo.rgr` scratch runners nothing imports, debug/bisect
drafts, the `old/` folder, stray root-level scratch files — is a **delete
candidate**.

## 2. Verified constraints (why this can't be a blind `rm`)

Before deleting, reachability was checked against the actual test/build roots.
Two facts change the naive plan:

**A. Part of `ranger_games/` is load-bearing for tests.** The vitest harness
compiles and runs five `ranger_games/` files as the **TSX→Ranger native/host
compile proof**:

| File | Test that loads it |
|------|--------------------|
| `ranger_games/pong_sdl.rgr` | `game-engine-render.test.ts` |
| `ranger_games/counter_native_runner.rgr` | `ts-to-ranger-native.test.ts` / `-host` |
| `ranger_games/invaders_native_runner.rgr` | `ts-to-ranger-native.test.ts` / `-host` |
| `ranger_games/pong_native_runner.rgr` | `ts-to-ranger-native.test.ts` / `-host` |
| `ranger_games/spawner_native_runner.rgr` | `ts-to-ranger-native.test.ts` / `-host` |

So "the Ranger versions serve no testing need" is only *partly* true — these
five are the fixtures that prove TSX can be ahead-of-time compiled to a native
Ranger binary. **Deleting them deletes that test coverage.** That's a real
decision (see §3, open question 1), not an oversight to steamroll.

**B. `ranger_games/pong.rgr` is wired into repo-root `package.json`.** The
`engine:compile`, `engine:compile:cpp`, `engine:compile:rust`, and `engine:run`
scripts all target `ranger_games/pong.rgr` — the ES6/C++/Rust portability PoC.
Removing the folder means also removing those npm scripts (a repo-root edit,
just outside this dir's scope) and the doc sections in `README.md` / `AGENTS.md`
/ `tests/README.md` that describe `ranger_games/` as the "write-once → native
binary" proof.

**Consequence:** the cleanup is done in *tranches*, each verified by running the
affected tests, not one sweep. The clearly-orphaned files go first; anything
that removes test coverage or shipped npm scripts is called out for an explicit
yes/no.

## 3. Deletion tranches

> The exact per-file inventory is being finalised from a reachability survey and
> will be filled into the tables below. Ordering is safest-first.

### Tranche 1 — provably orphaned (no import, no test, no script)
- `old/` folder (`old/ylos`).
- Stray root-level scratch files under `gallery/game_engine/` (loose test
  `.rgr`, generated `.js`, `.zip`) — **only** those no root references.
- `scripting/*_demo.rgr` files that no `.test.ts`/`.sh` loads and no `.rgr`
  imports. *(The vitest harness DOES load ~15 of the scripting demos — those
  stay; only the orphans go.)*

_Inventory table: pending survey._

### Tranche 2 — Ranger/native game duplicates
- `ranger_games/` files **not** in the §2.A test set and **not** the
  `pong.rgr` PoC entrypoint.
- `games/ranger_autopeli`, `games/ranger_pong`, `games/rust_pong` — Ranger/native
  variants of games that also exist as TSX/WASM — *iff* unreferenced by a root.

_Inventory table: pending survey._ **Requires the §3 open-question answers.**

### Tranche 3 — superseded engine drafts
- Debug/bisect scratch (`autopeli_debug_*.rgr`, `autopeli_bisect.rgr`, …) if
  unimported.
- Duplicate autopeli host copies (`wasm_autopeli_setup.rgr`,
  `wasm_autopeli_render.rgr`) — the world-encoded-twice leak AGENTS.md flags;
  removal is coupled to the `IDEAL.md` §8 seam work, so it's a refactor, not a
  plain delete. Tracked, not done blindly here.

### Open questions (need your call)
1. **The TSX→native test fixtures** (`ranger_games/*_native_runner.rgr` +
   `pong_sdl.rgr`): keep them (and their `ts-to-ranger-*` tests), or delete the
   fixtures *and* those tests together? They're the only proof the AOT-native
   compile path works.
2. **The `pong.rgr` portability PoC** + its `engine:compile*` / `engine:run` npm
   scripts + the README/AGENTS sections: remove all together, or keep as the
   documented backend-portability demo?
3. **`games/ranger_*` and `games/rust_pong`**: delete, or keep as reference
   ports?

## 4. The ID change — stable `EntityRegistry` (do this too, now)

The Three host keys objects by raw array index and never frees on remove, so the
reconciler leaks entities and stale handles silently alias live objects.

### Problem (verified)
- `three/src/three_scene_host.rgr` returns `(array_length …)` as the handle for
  `scenes/cameras/geometries/materials/entities`; the handle **is** the index.
- `entityRemove` (`three_scene_host.rgr:255`) only does `scene.remove(obj)` — it
  never frees the slot. The reconciler (`three/tsx/three_tsx_bridge.rgr:586`)
  calls `entityRemove` then pushes a new entry → the `entities` array grows
  unbounded with orphaned dead slots and the old handle keeps resolving.
- `model3d/EntityModel.rgr` hand-rolls a **second** index-based `EntityRegistry`
  (same no-free, no-generation design) — duplication to unify.
- `IDEAL_3D.md` §12.3.3 already prescribes: "wrap these with a generation
  counter … so stale handles are rejected."

### Design (32-bit, per your call)
Generation-tagged handle `= (generation << 20) | (slotIndex + 1)`, backed by a
slot pool + free-list:
- `create` reuses freed slots → no unbounded growth.
- `resolve` checks generation → stale handles rejected, never aliased.
- Public handle API (`meshNew`, `entityAt`, `entityRemove`, …) stays identical,
  so all bridges/tests compile unchanged; only `entityRemove` gains a slot-free.

### Wiring & tests
- New `three/src/three_entity_registry.rgr` + `three_entity_registry_test.rgr`.
- Route `ThreeSceneHost.entities` through it; `entityRemove` frees the slot.
- Reconciler regression: N signature-change rebuilds keep live count bounded.
- Later: retire `model3d/EntityModel.rgr`'s parallel registry onto the shared
  core (bigger blast radius — separate step).

## 5. Order of execution
1. Land deletion tranches 1–2 (after §3 answers), running affected vitest suites
   after each tranche.
2. Land the ID change (§4) — self-contained, additive to the Three host.
3. Update `README.md` / `AGENTS.md` / `tests/README.md` for whatever
   `ranger_games/` decision lands.
4. Defer tranche-3 draft removals into the `IDEAL.md` §8 seam refactor.

---
*Living document. Deletion inventory tables are being finalised from the
reachability survey before any file is removed.*
