# Game scripting: TypeScript/TSX game screens on top of the engine

> Follow-up to [`../RENDERING_EVG.md`](../RENDERING_EVG.md). This layer lets you
> author **game logic, controllers and simple screens as TypeScript/TSX**,
> evaluated at runtime by the gallery **ComponentEngine**, with a **Game API**
> injected into the script namespace and **TypeScript typings** for editor
> tooling ([`game.d.ts`](./game.d.ts)).

## Why

The compiled engine (`pong_core.rgr` + backends) is fast and portable, but
changing screen flow, menus or HUD means recompiling Ranger. A scripting layer
lets you iterate on **screens and game flow without recompiling**: the host
loads a `*.game.tsx` script and drives it, so designers can tweak menus, scoring
and transitions quickly.

## The model (pure reducers + injected globals)

A game script is a set of **pure functions** the host calls. State transitions
return the *next* state (reducer style), which keeps everything deterministic
and portable — the same rule as `Pong.step()`.

| Function | Called | Returns |
|----------|--------|---------|
| `initState()` | once at start | initial state object |
| `onButton({ state, button })` | on each input event | next state |
| `update({ state, dt })` | each tick | next state |
| `render({ state })` | each frame | a JSX/EVG UI tree |

The host injects **globals** into the script namespace (no import needed):

| Global | Type | Purpose |
|--------|------|---------|
| `game` | `Game` | title, `maxScore`, field `width`/`height` |
| `screen` | `Screen` | pixel `width`/`height` of the frame buffer |
| `Buttons` | consts | `Buttons.UP / DOWN / ACTION / QUIT` |

See [`game.d.ts`](./game.d.ts) for the full types and [`menu.game.tsx`](./menu.game.tsx)
for an example screen.

## How the host injects and drives it (Ranger)

The mechanism is a small public API on `ComponentEngine`
(`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`):

```ranger
def engine (new ComponentEngine())

; 1. Inject globals into the script namespace
engine.registerGlobal("game" (EvalValue.object(gameKeys gameValues)))

; 2. Load the script (registers its functions; does NOT require render())
engine.loadScript(scriptSource)

; 3. Drive it from the host game loop
def state (engine.callFunction("initState" (EvalValue.null())))
; ... each input:
def next (engine.callFunction("onButton" props))   ; props = { state, button }
; ... each frame:
def ui (engine.callRender("render" props))          ; -> EVGElement tree
```

- `registerGlobal(name, value)` binds a value into the top-level eval scope.
- `getGlobal(name)` reads a binding back.
- `loadScript(src)` parses + registers the script's imports/functions/vars.
- `callFunction(name, props)` invokes a script function with a single props
  object and returns its `EvalValue` (object/array/primitive).
- `callRender(name, props)` invokes a function whose body returns JSX and
  evaluates it into an `EVGElement` tree (hand to `EVGLayout` + the raster/SDL
  renderer described in `RENDERING_EVG.md`).

A working end-to-end demo is [`game_script_demo.rgr`](./game_script_demo.rgr)
(compile with `-es6`, run with Node); it is covered by
[`tests/game-scripting.test.ts`](../../../tests/game-scripting.test.ts).

## Language support notes (evaluator)

The ComponentEngine evaluator supports the subset needed for screen/reducer
scripts: object literals, member access, `if/else` with **value-returning
`return` (including inside branches)**, binary/logical/ternary operators,
function calls, and JSX. Known constraints:

- Use `const`/`let`, **not `var`**, for locals.
- Return the next state (reducers); avoid mutating shared state.
- `**` operator precedence is off (`ISSUES.md` #6) — parenthesise.
- Value-returns from *inside a `for` loop* are not propagated; structure screen
  logic with `if`/early `return` at statement level.

## TypeScript typings

`game.d.ts` gives editor autocomplete/type-checking while authoring. The runtime
ignores annotations (the parser records them but the evaluator does not use
them), exactly like the existing `evg_types.tsx` intellisense file. Reference it
from a script with:

```tsx
/// <reference path="./game.d.ts" />
```

## Roadmap

1. **Done:** namespace injection (`registerGlobal`), script loading + function
   dispatch (`loadScript` / `callFunction` / `callRender`), value-returning
   control flow, TS typings, apostrophe-in-JSX-text parser fix.
2. **Next:** a `GameScriptRunner` backend that wires the injected `Buttons` from
   the engine's `Buttons` snapshot and renders `render()` output through the SDL
   framebuffer each frame.
3. **Later:** native (C++) evaluation once the EVG/eval stack builds for the C++
   target (see `RENDERING_EVG.md`); host-callback `EvalValue` for richer APIs.
