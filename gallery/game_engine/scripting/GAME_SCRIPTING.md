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

## Retained-mode runner (GameRunner)

[`game_runtime.rgr`](./game_runtime.rgr) turns the above into a working
**retained-mode runner** for real-time games:

- **`sprites()` runs once** and defines the on-screen objects; the runner
  creates a retained `GameEntity` per sprite. Their shapes are never rebuilt.
- **each frame gets `time` + `dt`** and calls `update({ time, dt, up, down, state })`,
  which returns the next state (pure reducer). The runner just applies
  `state.entities[id] = { x, y }` to the existing entities — **moving objects
  without re-rendering the sprite**.
- **scores render as text** via a tiny built-in 3x5 digit font.
- the frame is drawn into the RGBA `SoftCanvas`, i.e. the same buffer the SDL /
  HDMI present path blits (see [`../pong_sdl.rgr`](../pong_sdl.rgr)).

Working example: [`pong.game.tsx`](./pong.game.tsx) (scripted, time-based Pong)
driven by [`pong_runner_demo.rgr`](./pong_runner_demo.rgr), covered by
[`tests/game-runner.test.ts`](../../../tests/game-runner.test.ts). Run it and
dump a PNG:

```bash
# compile + run on Node (writes pong_frame.rgba next to the script)
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 ./gallery/game_engine/scripting/pong_runner_demo.rgr \
  -d=./tests/.output -o=pong_runner_demo.js -nodecli
node ./tests/.output/pong_runner_demo.js 300
ffmpeg -f rawvideo -pixel_format rgba -video_size 480x270 \
  -i gallery/game_engine/scripting/pong_frame.rgba -y pong.png
```

Space Invaders variant: [`invaders.game.tsx`](./invaders.game.tsx) via
[`invaders_runner_demo.rgr`](./invaders_runner_demo.rgr) (same runner API; many
retained pixel sprites).

Breakout + JSX HUD + screens: [`breakout.game.tsx`](./breakout.game.tsx) via
[`breakout_runner_demo.rgr`](./breakout_runner_demo.rgr) — `play` and `gameOver`
screens with lazy per-screen sprites (see [`GAME_ENGINE_DESIGN.md`](./GAME_ENGINE_DESIGN.md)).

Engine quirks and fixes: [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md).

Top-level **`const` / array / object** structures are supported — define them at module scope and read them from any script function (see issue log for `moduleScope` vs `hostScope`).

## Generic sprite protocol (`game_sprite.rgr`)

Game-specific visuals are **not** hard-coded in the engine. Scripts declare shapes;
the runner syncs pose each frame.

**Definition (`sprites()` — once):**

| Field | Role |
|-------|------|
| `id` | Entity id (matches `state.entities[id]`) |
| `kind` | `rect` \| `circle` \| `wedge` \| `ghost` \| `bitmap` |
| `w`, `h` | Rectangle size (centered at `x,y`) |
| `rad` | Circle / wedge / ghost radius |
| `r`, `g`, `b` | Default colour |
| `p0`, `p1`, `p2` | Kind-specific params (e.g. wedge: direction + opening) |
| `px`, `br/bg/bb`, `er/eg/eb`, `frames` | **bitmap only:** pixel size, body/eye palette, animated frame set (array of row-string arrays) |

**Runtime pose (`update()` → `state.entities[id]`):**

| Field | Role |
|-------|------|
| `x`, `y` | Center position (pixels) |
| `visible` | `0` hides sprite |
| `r`, `g`, `b`, `rad` | Optional runtime overrides |
| `p0`, `p1`, `p2` | Optional runtime params (**bitmap:** `p0` = animation frame index) |

**State flags (any game):**

| Field | Role |
|-------|------|
| `showNet` | `0` = hide centre net (default `1` for Pong layout) |
| `score1`, `score2` | Built-in digit HUD when no `hud()` |

Pac-Man ([`pacman.game.tsx`](./pacman.game.tsx)) uses `kind: "wedge"` + `p0`/`p1` for
mouth animation; maze, ghost AI, tunnels and modes are **pure TypeScript**.

Space Invaders ([`invaders.game.tsx`](./invaders.game.tsx)) uses `kind: "bitmap"` — one
retained sprite per alien with two cached animation frames (`p0` toggles frame), not
one rect per pixel. Audio is reserved for a future engine-level API (not per-game).

## Hot reload (runtime option, Path A)

TS-interpreter games can reload **in-process** without restarting SDL:

```ranger
def runner:GameRunner (new GameRunner)
runner.trackScriptFile("gallery/game_engine/scripting/pong.game.tsx")
runner.setHotReload(true)
; each frame:
runner.maybeHotReload()
```

On save, `ComponentEngine.patchScript()` re-parses the file, diffs top-level AST
declarations, and swaps changed `functionNode` / const bindings. `GameRunner.hotReloadScript()`
rebuilds the scene only when `initState`, `sprites`, `resources`, or module `const`s change.

SDL host (`game_sdl_runner.rgr`):

```bash
npm run engine:game-sdl:run:pacman          # hot reload on by default
npm run engine:game:watch:invaders          # dev launcher (same behaviour)
./tmp/game-sdl/game_sdl --no-hot-reload ... # disable
npm run engine:game-sdl:smoke:pacman        # maxFrames → hot reload off
```

Native compiled path (Path B) does not support this — rebuild + restart required.

## Roadmap

1. **Done:** namespace injection (`registerGlobal`), script loading + function
   dispatch (`loadScript` / `callFunction` / `callRender`), value-returning
   control flow, TS typings, apostrophe-in-JSX-text parser fix.
2. **Done:** retained-mode `GameRunner` (time/dt-driven `update`, retained
   sprites moved via returned state, text scores) + scripted Pong demo.
3. **Next:** drive the runner from the native SDL backend (feed `up`/`down` from
   the engine's `Buttons`, present each frame in the window); a JSX `hud()` path
   through `callRender` + `EVGLayout` for richer text/UI (**done for Breakout**,
   see `game_hud.rgr`).
4. **Later:** native (C++) evaluation once the EVG/eval stack builds for the C++
   target (see `RENDERING_EVG.md`); host-callback `EvalValue` for richer APIs.
