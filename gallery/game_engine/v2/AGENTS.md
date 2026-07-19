# v2 agent instructions

Read this before writing or changing anything under `v2/`. It encodes the
architecture boundaries **and the mistakes already made once** in this tree
(each documented in detail in [`WHYWRONG.md`](./WHYWRONG.md) and
[`games/WHYWRONG.md`](./games/WHYWRONG.md)) so they are not made twice.

## What v2 is

```text
ordinary TSX game content (guest)
    → TSX evaluator (interp/, staged ComponentEngine)
    → ONE table-driven transport (interp/engine/RgRegistryBridge — generated
      from the registry, never hand-authored per domain)
    → typed host arenas (host/, modules/ranger_2d, modules/ranger_core, …)
    → host-owned frame pipeline (runtime/)
    → renderer READS host state (render/ — not a sync boundary)
```

The product is that **ordinary TSX runs with exact JS identity semantics over
host-native objects** (D-IDENTITY and the other D-* decisions in
[`../CODE_CLEANUP.md`](../CODE_CLEANUP.md)). Every layer exists to serve that.

## Boundary map (who may know what)

| Layer | Lives in | May know | Must NOT know |
|---|---|---|---|
| Guest games / menus | `games/<name>/`, `menu/` — **TSX only** | its own world; the `ranger:*` capabilities; the game protocol | anything about the host's internals |
| Guest façades | `games/ranger2d.tsx` (interim → generated) | the generated command names | host state layout |
| Generic host | `runtime/game_host/` | the game protocol; the frame pipeline | **any specific game** |
| Transport | `interp/engine/` | the generated command table | per-command semantics (rows are data) |
| Registry | `registry/` | the semantic interface + ABI profiles ([`BRIDGES.md`](./BRIDGES.md) rev 2) | any single transport as "the" identity |
| Arenas / modules | `host/`, `modules/` | their own domain | which guest is calling |
| Render backends | `render/` | how to read host state | how to mutate anything |

## Rules distilled from this tree's own failures

1. **Games are TSX guests — never Ranger.** A game/menu is a folder of `.tsx`
   (+ assets/metadata). *Adding a TSX game must not require adding or
   compiling a game-specific `.rgr` file.* Per-game host shells are forbidden;
   the one generic host is `runtime/game_host/RgGameHost.rgr`. Strict package
   rules: [`games/AGENTS.md`](./games/AGENTS.md).
   *(Failure prevented: `ylos2_v2_runner.rgr` placed inside the game folder.)*

2. **Mocks are not validation.** A component is done when its **real caller**
   invokes it with data that originated in guest source — not when a
   self-written test passes against a hand-driven slice. Fakes are allowed
   only at true device edges (GPU present, audio DAC, gamepad HID), never for
   the evaluator, adapter, bridge, or arenas.
   *(Failure prevented: 33 green suites while no TSX had ever run.)*

3. **Bridges are generated, never authored per domain.** No if-chain command
   bridges, no game- or domain-named command surfaces, no second command
   table. The authored source is the semantic interface; transports are
   generated per ABI profile — see [`BRIDGES.md`](./BRIDGES.md) rev 2.
   *(Failures prevented: a hand `rg2d_*` if-chain bridge; then a single
   transport-shaped table conflating semantics with wasm32 lowering.)*

4. **Follow the plan's named sources.** When a phase says "port/adapt file X",
   writing a fresh parallel file instead is a decision that needs explicit
   sign-off, not a silent substitution.
   *(Failure prevented: fresh `RgValue` slices while `interp/migrate/src/`
   held the real staged evaluator.)*

5. **Run before writing.** Before designing a piece of this system, execute
   the existing end-to-end path (`tests/run.sh`, the e2e suites, a v1 demo)
   and be able to trace one real guest statement (`new Sprite2D(...)`) through
   parser → evaluator → bridge → arena. If you cannot write that trace, you
   are not ready to modify the layer.

## Working rules

- **Gate:** `bash tests/run.sh` must end `v2 ALL GREEN` before any commit.
  New capabilities need a suite registered there; e2e drivers live under
  `tests/e2e/` (host-side, may be game-aware — game folders may not be
  host-aware).
- **Scope:** edit only inside `v2/` unless unavoidable; v1
  (`../scripting/`, `../games/`, runners) stays untouched and runnable.
- **Registry ids are immutable** once published (golden tests enforce:
  meaning-change / renumber / tombstone-reuse / lowering-change all fail).
- Ranger-language pitfalls (parenthesized nested calls, `idiv`, reserved
  names like `make`/`wrap`, one-statement-per-line): root `/AGENTS.md` and
  `/ai/*.md`.

## Key documents

| Doc | What it governs |
|---|---|
| [`../CODE_CLEANUP.md`](../CODE_CLEANUP.md) | the binding contract (all D-*) |
| [`../CODE_CLEANUP_PLAN.md`](../CODE_CLEANUP_PLAN.md) | phase plan + v1 policy |
| [`BRIDGES.md`](./BRIDGES.md) | bridge/IDL/ABI-profile design (rev 2) |
| [`games/AGENTS.md`](./games/AGENTS.md) | the TSX-only game-package rules |
| [`WHYWRONG.md`](./WHYWRONG.md), [`games/WHYWRONG.md`](./games/WHYWRONG.md) | the full post-mortems behind rules 1–5 |
