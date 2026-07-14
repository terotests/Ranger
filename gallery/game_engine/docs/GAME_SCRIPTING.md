# Game scripting: TypeScript/TSX game screens on top of the engine

> Follow-up to [`../RENDERING_EVG.md`](../RENDERING_EVG.md). Author game logic,
> controllers, HUDs and screens as **TypeScript/TSX**, evaluated at runtime by the
> gallery **ComponentEngine**. A **Game API** is injected into the script namespace;
> editor typings live in [`game.d.ts`](../scripting/game.d.ts) (which re-exports
> [`engine.d.ts`](../scripting/engine.d.ts)).
>
> Design rationale for the retained-mode + JSX-HUD split lives in
> [`GAME_ENGINE_DESIGN.md`](./GAME_ENGINE_DESIGN.md). Engine quirks/fixes:
> [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md).

The compiled engine is fast but recompiling Ranger to change screen flow, menus or
HUD is slow. Scripting lets you iterate **without recompiling**: the host loads a
`games/<name>/index.tsx` (or `scripting/*.game.tsx`) script and drives it.

## The model: pure reducers + injected globals

A game script is a set of **optional top-level functions** the host calls. State
transitions return the *next* state (reducer style), keeping everything
deterministic and portable. All functions take a single React-style props object.

| Function | Called | Returns |
|----------|--------|---------|
| `initState()` | once at start | initial state object |
| `sprites({ screen })` | once (per screen) | retained sprite definitions |
| `update({ state, dt, time, up, down, left, right, action, input })` | each tick | next state |
| `hud({ state })` | each frame | JSX HUD overlay (optional) |
| `onButton({ state, button })` | on each input event | next state |
| `render({ state })` | each frame | a JSX/EVG UI tree (menu/screen path) |

Optional hooks: `screens()`, `resources()`, `backgroundImage()`, `entities()`,
`camera()`, `config()`. See [`GameScript`](../scripting/engine.d.ts) for the full list.

Host-injected **globals** (no import needed):

| Global | Type | Purpose |
|--------|------|---------|
| `game` | `Game` | `title`, `maxScore`, field `width`/`height` |
| `screen` | `Framebuffer` | pixel `width`/`height` of the frame buffer (**not** `state.screen`) |
| `Buttons` | consts | `Buttons.UP / DOWN / ACTION / QUIT` |
| `console` | `{ log, warn }` | prints to host stdout as `[tsx] …` |

Host side (`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`): `registerGlobal`
binds a global, `loadScript` registers a script's imports/functions/vars, and
`callFunction` / `callRender` dispatch by name with one props object (`callRender`
evaluates a JSX body into an `EVGElement` tree). Minimal demo:
[`game_script_demo.rgr`](../scripting/game_script_demo.rgr), test
[`tests/game-scripting.test.ts`](../../../tests/game-scripting.test.ts).

## Retained-mode runner (GameRunner)

[`game_runtime.rgr`](../scripting/game_runtime.rgr) is the real-time path used by
almost all games:

- **`sprites()` runs once** and defines on-screen objects; the runner creates one
  retained `GameEntity` per sprite. Shapes are never rebuilt.
- **each frame** calls `update()` with `time` + `dt` + inputs; it returns the next
  state. The runner applies `state.entities[id] = { x, y, … }` to the existing
  entities — moving objects **without re-rendering the sprite**.
- **HUD:** if the script defines `hud()`, its JSX is composited on top each frame
  (`game_hud.rgr`); otherwise scores render via a built-in 3×5 digit font.
- the frame is drawn into the RGBA `SoftCanvas` — the same buffer the SDL/HDMI
  present path blits (see [`../pong_sdl.rgr`](../pong_sdl.rgr)).

Example games (each `games/<name>/index.tsx`, mirrored by a
`scripting/*.game.tsx` + `*_runner_demo.rgr` node harness):

| Game | Shows |
|------|-------|
| [`pong.game.tsx`](../scripting/pong.game.tsx) | minimal 3-entity reducer, digit-font HUD |
| [`invaders.game.tsx`](../scripting/invaders.game.tsx) | many `kind: "bitmap"` sprites, animation frames |
| [`breakout.game.tsx`](../scripting/breakout.game.tsx) | JSX `hud()` + named `play`/`gameOver` screens |
| [`pacman.game.tsx`](../scripting/pacman.game.tsx) | `kind: "wedge"` mouth animation; maze/AI in pure TS |

Run a game headless and dump a PNG (Node harness):

```bash
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 ./gallery/game_engine/tests/pong_runner_demo.rgr \
  -d=./tests/.output -o=pong_runner_demo.js -nodecli
node ./tests/.output/pong_runner_demo.js 300
ffmpeg -f rawvideo -pixel_format rgba -video_size 480x270 \
  -i gallery/game_engine/scripting/pong_frame.rgba -y pong.png
```

SDL window (real-time): `npm run engine:game-sdl:run:breakout` (or `:pong`,
`:invaders`, `:ylos2`, …). Covered by
[`tests/game-runner.test.ts`](../../../tests/game-runner.test.ts).

## Generic sprite protocol (`game_sprite.rgr`)

Visuals are **not** hard-coded in the engine. Scripts declare shapes; the runner
syncs pose each frame.

**Definition (`sprites()` — once):**

| Field | Role |
|-------|------|
| `id` | Entity id (matches `state.entities[id]`) |
| `kind` | `rect` \| `circle` \| `wedge` \| `ghost` \| `bitmap` \| `sheet` |
| `w`, `h` | Rectangle size (centered at `x,y`) |
| `rad` | Circle / wedge / ghost radius |
| `r`, `g`, `b` | Default colour |
| `p0`, `p1`, `p2` | Kind-specific params (e.g. wedge direction + opening) |
| `px`, `br/bg/bb`, `er/eg/eb`, `frames` | **`bitmap`:** pixel size, body/eye palette, animated frame set (array of row-string arrays) |
| `path`, `frameW`, `frameH`, `cols`, `rows`, `scale`, `jumpFrame` | **`sheet`:** PNG spritesheet (LPC walk cycle etc.) |

**Runtime pose (`update()` → `state.entities[id]`, type `EntityPose`):**

| Field | Role |
|-------|------|
| `x`, `y` | Center position (pixels) |
| `visible` | `0` hides sprite (runner skips draw + sync) |
| `r`, `g`, `b`, `rad` | Optional runtime overrides |
| `p0`, `p1`, `p2` | Runtime params — `bitmap`: `p0` = frame index; `sheet`: `p0` = frame col, `p1` = direction row, `p2` = jump flag; `wedge`: `p0` = facing |
| `angle` | Rotation in degrees (physics sandboxes) |

**State flags:** `showNet` (`0` hides the Pong-style centre net), and `score1` /
`score2` drive the built-in digit HUD when no `hud()` is present.

**Audio & effects** are engine-level: emit events from `update()` via
`state.events` — `{ kind: "playSound", id }` (built-in ids `blip`/`brick`/`bounce`/
`wall`/`lose`/`win`/`celebrate`), plus `playMusic` (soundscore), `playVoice`
(vocal FX) and `particles`. See `game_audio.rgr`, `game_soundscore.rgr`,
`game_particles.rgr`, [`VOCAL_FX.md`](./VOCAL_FX.md).

## Hot reload (runtime option, TS-interpreter path)

TS-interpreter games reload **in-process** without restarting SDL:

```ranger
def runner:GameRunner (new GameRunner)
runner.trackScriptFile("gallery/game_engine/scripting/pong.game.tsx")
runner.setHotReload(true)
; each frame:
runner.maybeHotReload()
```

On save, `ComponentEngine.patchScript()` re-parses the file, diffs top-level AST
declarations, and swaps changed function/const bindings
(`gallery/ts_parser/ts_ast_patch.rgr`). `GameRunner.hotReloadScript()` rebuilds the
scene only when `initState`, `sprites`, `resources` or a module `const` changes;
editing only `update()` / `hud()` preserves game state.

SDL host defaults hot reload **on** (interactive) and **off** when `maxFrames > 0`
(CI/smoke). Override with `--hot-reload` / `--no-hot-reload`:

```bash
npm run engine:game:watch:invaders          # dev launcher, hot reload on
npm run engine:game-sdl:smoke:breakout      # headless smoke, hot reload off
./tmp/game-sdl/game_sdl --no-hot-reload gallery/game_engine/games/pong/index.tsx
```

The native compiled path does not support hot reload — rebuild + restart.

## Imports and TypeScript typings

Annotations are for editor tooling only; the runtime ignores them. Reference the
typings and import siblings with triple-slash directives at the top of each file
(the parser does not evaluate `import type` yet):

```tsx
/// <reference path="./game.d.ts" />
import { brickId, BRICK_COUNT } from "./breakout_bricks";
```

- Generic types (`GameState`, `MultiScreenState`, `SpriteDef`, `GameScript`,
  `EntityPose`, `Framebuffer`, …) live in `engine.d.ts`; `game.d.ts` is the usual
  entry reference. Per-game screen state (e.g. `BreakoutState`) belongs in a
  sibling `*.d.ts` — see [`breakout.d.ts`](../scripting/breakout.d.ts).
- Relative `import` (`./…`, `../…`) is resolved from the script dir on disk
  (`runner.setScriptDir(...)` before `loadScript()`); exported `function`/`const`
  bindings register into the module scope. `import … from "./game.d.ts"` is
  type-only and stripped at runtime.
- Multi-screen games should use [`game_helpers.tsx`](../scripting/game_helpers.tsx)
  (`getScreen`, `activeScreen`, `isActiveScreen`) instead of raw
  `state.screens[name]` — avoids confusing `state.screen` (active screen name)
  with the injected `screen` global (framebuffer size).
- Strict type-check: `cd gallery/game_engine/scripting && npx tsc --noEmit`.

### Evaluator constraints

The evaluator supports the subset needed for reducer/screen scripts: object
literals, member access/assignment, `if/else` with value-returning `return`
(including inside branches), `while` loops, binary/logical/ternary operators,
function calls, JSX, and top-level `const`/array/object structures. Known limits:

- Use `const`/`let`, **not `var`**.
- Return the next state; avoid mutating shared state.
- `**` operator precedence is off — parenthesise (`TSX_ENGINE_ISSUES.md`).
- A value-`return` from *inside a `for` loop* is not propagated; structure logic
  with `if` / early `return` at statement level.

## Multi-file screens and per-game storage

Beyond the in-script multi-screen model (`state.screen` + `state.screens`, see
Breakout and [`GAME_ENGINE_DESIGN.md`](./GAME_ENGINE_DESIGN.md)), a game can split
levels/overlays into multiple `.tsx` files in its folder and navigate with
host-native globals (no import):

| API | Role |
|-----|------|
| `loadGame(path)` | Replace current screen; clear nav stack |
| `pushGame(path)` | Push current path, open another screen |
| `popGame()` | Return to previous screen (or launcher menu when stack empty) |
| `loadGameData()` / `saveGameData(obj)` / `resetGameData()` | Read/write/delete `gamedata.json` in the game folder |

Paths are relative to the game directory (`"level2.tsx"`, `"win.tsx"`); each screen
file is a full GameRunner script with its own `resources()`, `sprites()`,
`initState()`, etc. Shared logic lives in imported modules (e.g.
`./invaders_shared.tsx`). Full walkthrough:
[`GAME_SCREENS_AND_STORAGE.md`](./GAME_SCREENS_AND_STORAGE.md).

## World-mode entities and engine camera

Legacy games (Pong, Ylos, …) keep using `sprites()` + `state.entities` in **screen
space**. New optional hooks separate **world simulation** from **rendering**:

| Function | Role |
|----------|------|
| `entities()` | Spawn list in **world coordinates** (`id`, `sprite`, `position`, `tags`) |
| `camera()` | Engine follow camera (`follow`, `mode`, `offsetY`, `smoothing`, `bounds`) |
| `config()` | `physics.fixedStep` (ms) for fixed-timestep updates; `world.height` for bounds |

Per frame the game updates **`state.worldEntities[id]`** (same shape as
`EntityPose`, world `x`/`y`). The runner applies the camera offset, culls
off-screen entities, and syncs retained sprites.

```tsx
function entities() {
  return [{ id: "player", sprite: "hero", position: { x: 240, y: 730 }, tags: ["player"] }];
}
function camera() {
  return { follow: "player", mode: "vertical", offsetY: -40, smoothing: 0.18 };
}
function update(props) {
  const we = props.state.worldEntities;
  // simulate in world space, return { worldEntities: { player: { x, y } } }
}
```

Minimal example: [`world_scroll.game.tsx`](../scripting/world_scroll.game.tsx)
(headless: [`world_scroll_runner_demo.rgr`](../tests/world_scroll_runner_demo.rgr)).
Interpreter perf notes: [`TS_ENGINE_OPTIMIZATION.md`](./TS_ENGINE_OPTIMIZATION.md).
