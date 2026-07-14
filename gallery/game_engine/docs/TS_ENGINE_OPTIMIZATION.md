# TS engine performance (ComponentEngine)

Performance notes for the gallery **ComponentEngine**
(`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`), which evaluates `*.game.tsx`
scripts at runtime. See [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) for how hosts
load and drive scripts.

## Current characteristics

- The expensive path is **level / field initialization** — building large
  module-level `const` arrays of object literals and nested loops that create many
  small entity objects — not steady-state game ticks.
- Always run with **`engine.quiet = true`** (game hosts set this). With tracing on,
  the evaluator builds debug strings on every op and is dramatically slower.
- Every runtime value is a heap `EvalValue` (a `shared_ptr` on the C++ target).
  Immutable constants (`null` / `undefined` / `true` / `false`) are shared via the
  `EvalConstPool` singleton (`EvalValue.rgr`) rather than reallocated per use.

## Known remaining cost (native C++)

The dominant native cost is the value representation itself: each number/string/
bool/object is a heap `EvalValue`, and every expression step pays refcount atomics
plus virtual dispatch. Recursion depth is high on init-heavy scripts. Further large
gains would need a value-type or arena representation for `EvalValue`, not more
micro-optimization of the current model.
