# EVG UI Layer — interactive HUD widgets on top of EVG

> An interactive **UI/HUD layer** for the Ranger game engine that sits **on top
> of the EVG elements**: buttons, text-input boxes, draggable squares (the
> building blocks of an editor), an on-screen **software keyboard**, common UI
> commands, and a **"highlight selected element"** outline. Text is rendered
> with a **loaded TrueType font so it wraps correctly**, through a
> **glyph/line cache** for genuinely accelerated rendering. SVG paths and
> clipping are noted as the next step.
>
> Follows the engine's core rule (see [`../PLAN_GAME_ENGINE.md`](../PLAN_GAME_ENGINE.md),
> [`../RENDERING_EVG.md`](../RENDERING_EVG.md)): **UI logic is pure & portable**,
> all device I/O lives in a thin platform layer.

> Run `npm run engine:ui:demo` to generate the reference screenshots
> `editor_1_start.png` / `editor_2_edit.png` / `editor_3_keyboard.png` in this
> folder (PNGs are git-ignored as generated output). `editor_2_edit.png` shows
> the toolbar, the `Name` field holding *"Player One"*, four boxes with one
> dragged out and wrapped in the orange selection highlight, and a status bar.

## Why a separate interactive layer

`game_hud.rgr`'s `GameHudBlitter` already composites a **static** JSX/EVG tree
(labels, panels) onto the `SoftCanvas`. What was missing is **interaction**:
hit-testing a pointer, focus, dragging, text entry, selection. This layer adds
exactly that, reusing the same framebuffer + font stack, so a game can build an
editor / settings screen / level tool without leaving Ranger.

## Architecture — one input shape, one framebuffer

```
   platform (SDL mouse / canvas events / key queue)   <- the ONLY I/O
        │  fills a UIInput each frame
        ▼
   UILayer.update(input)     ── pure, portable, unit-tested
        │  hit-test · focus · drag · select · route text · UI commands
        │  emits a UIEvent queue the app reads
        ▼
   UILayer.render()          ── draws every widget through a UIContext
        │  (game world drawn first, UI composited on top, keyboard on top)
        ▼
   ctx.canvas.raw()  →  gfx_present (SDL2) / putImageData (canvas)
```

`UIInput` is to the pointer/keyboard what `Buttons` / `PlayerButtons`
(`../scripting/game_input.rgr`) are to the controller: the single data shape the
logic reads. Because everything above the platform is integer/deterministic, a
recorded `UIInput` stream **replays the exact same UI behaviour** on every
target — the same record/replay debugging the engine already relies on.

## Files

| File | Contents |
|------|----------|
| `UIInput.rgr` | Portable pointer + keyboard snapshot. `pointerX/Y`, `pointerDown` with `pointerPressed`/`pointerReleased` **edges**, scroll, a per-frame `textInput` string, and a `specialKeys` queue (`UIKey`: enter/backspace/tab/esc/arrows/del…). |
| `UITextRenderer.rgr` | Font loading (`FontManager`) + correct wrapping (`TTFTextMeasurer.wrapText`) + a **rasterized-line cache** for acceleration. Bitmap 3×5 fallback when no TTF is loaded. |
| `UIContext.rgr` | `UITheme` (colour roles) + paint helpers (alpha fills, stroked rects, text) over the `SoftCanvas`. Widgets draw only through this. |
| `UIWidget.rgr` | Base widget (geometry, state, hit-test, virtual hooks) + `UILabel`, `UIButton`, `UIBox` (draggable square). |
| `UITextInput.rgr` | Editable single-line field: caret, insert/backspace/delete-forward, caret movement, focus ring, blinking caret. |
| `UISoftKeyboard.rgr` | On-screen keyboard grid; answers `tokenAt(x,y)` and `charFor(token)` (case via Shift). No layer dependency (no import cycle). |
| `UILayer.rgr` | The manager: widget list, hit-testing, focus/selection/drag, text routing, common UI commands, `UIEvent` queue, and `render()`. |
| `ui_editor_demo.rgr` | A small **editor** built on the layer (toolbar, name field + keyboard, draggable boxes, selection highlight). Reusable `UiEditorApp` + a headless scripted `main` that writes PNG snapshots. |
| `tests/UITest.rgr` | 29 self-checking unit tests (input edges, hit-test, focus, editing, drag, selection, tab, keyboard, wrapping). |

## Widget catalog

* **UILabel** — text only, no background.
* **UIButton** — hover/pressed states, centered label, emits a `click` event.
* **UITextInput** — focusable, editable, caret + focus ring; receives characters
  from the hardware keyboard **or** the software keyboard.
* **UIBox** — a draggable, selectable square (optional custom fill). The unit an
  editor manipulates.
* **UISoftKeyboard** — QWERTY grid + Shift / Space / ⌫ / OK, drawn on top.

All widgets share the base interface (`contains`, `draw(ctx)`, and the editing
hooks `acceptsText`/`insertText`/`backspace`/`deleteForward`/`moveCaret`), so the
layer routes edits polymorphically with **no downcasting**.

## Accelerated, font-aware text

The request's two text goals:

1. **Correct wrapping via a real font.** `UITextRenderer.loadFont(family, path)`
   loads a `.ttf` through `FontManager`; `wrap()` delegates to
   `TTFTextMeasurer.wrapText`, which uses true glyph advance widths — the same
   metric path `pdf_writer` uses. Long text wraps on word boundaries to a max
   width.
2. **"Genuinely accelerated rendering."** Each **distinct rendered line**
   (text + size + colour) is rasterized **once**: TrueType outline →
   anti-aliased RGBA in a `RasterBuffer`, wrapped as an `ImageBuffer` **sharing
   the same bytes** (bypassing `RasterBuffer.toImageBuffer()`, which pre-blends
   white and would destroy the overlay's alpha). Subsequent frames only
   alpha-blit the cached bitmap. Static labels/buttons therefore cost a
   memcpy-blit per frame instead of a full glyph rasterization. This is the CPU
   analogue of a glyph atlas and the natural hand-off point for the future GPU
   (WebGL/GLES2) path in `../RENDERING_EVG.md §6`.

   As part of this, the hot-path debug `print`s in `RasterText` are now gated
   behind an off-by-default `debug` flag (they previously fired per glyph — see
   the note the render doc already carried: *"strip the debug prints"*).

If no font is loaded the renderer falls back to a compact 3×5 bitmap font (same
glyphs as `game_hud.rgr`), so the UI always draws — handy for headless tests and
a crisp retro look.

## Common UI commands

Handled in `UILayer.update`, mapped from `UIInput`:

| Command | Trigger |
|---------|---------|
| Activate / click | pointer press+release inside a widget |
| Focus a field | click a focusable widget |
| Cycle focus | **Tab** |
| Type / edit | characters, **Backspace**, **Delete**, **←/→** (caret) |
| Submit | **Enter** (or the keyboard's **OK**) on a focused field |
| Select element | click a selectable widget (draws the highlight) |
| Move selection | **←/→/↑/↓** nudge the selected box |
| Delete selection | **Delete** with no field focused |
| Cancel | **Esc** (clears selection & focus, hides keyboard) |
| Drag | press + move on a draggable widget |

The app reads the resulting `UIEvent` queue (`click`, `dragStart/Move/End`,
`select/deselect`, `textChanged`, `submit`) each frame — a retained-mode,
callback-free contract that ports cleanly across every compile target.

## Highlight selected element

The selected widget is drawn with a 2 px accent outline (`theme.accent`) outset
around its bounds, on top of everything except the software keyboard. Focused
text fields additionally draw a focus ring (see `editor_2_edit.png`).

## Run it

```bash
npm run engine:ui:test     # compile + run the 29 unit tests -> "ALL PASS"
npm run engine:ui:demo     # compile + run the editor, writes editor_*.png
```

`editor_1_start.png`, `editor_2_edit.png`, `editor_3_keyboard.png` are the
headless snapshots of the demo session (start → edit → keyboard).

## Platform integration (the one real gap: pointer + text I/O)

The engine today is **digital-button + gamepad only** — there is no mouse /
pointer capture and no character-text channel on the SDL/canvas paths (the SDL
pump reads `SDL_GetKeyboardState` + gamepads; `poll_keypress` exists but the SDL
runner doesn't use it). This layer is deliberately built against the abstract
`UIInput` so it works **today** with any input source (including a virtual
cursor driven by the existing buttons), and so the platform work is small and
isolated:

1. **Add a `gfx_mouse_*` operator family** in `compiler/Lang.rgr`, mirroring the
   `gfx_*` pattern: `gfx_mouse_x`, `gfx_mouse_y`, `gfx_mouse_down`, `gfx_wheel`.
   * `llvm`/`cpp` → `SDL_GetMouseState` / `SDL_MOUSEWHEEL` in
     `gfx_sdl.rgr` (extend `rgfx_pump_events`).
   * `es6` → `mousemove`/`mousedown`/`mouseup`/`wheel` listeners on the canvas.
2. **Add a character-text channel**: feed SDL `SDL_TEXTINPUT` (and a canvas
   `keydown`) into a queue like the existing `poll_keypress`, drained into
   `UIInput.pushText` / `pushKey`.
3. **Inject a UI step** into `GameSdlRunner.runGameLoop` between `pollGameInput`
   and `draw`: fill a `UIInput`, call `uiLayer.update(input)`, and call
   `uiLayer.render()` after the world is drawn (before `gfx_present`).

None of that touches the widget/logic code here.

## Roadmap / next

* **SVG paths** — `EVGElement` already carries `svgPath` and there is a
  `gallery/evg/SVGPathParser.rgr`; a `UIPath` widget can fill/stroke vector
  icons once the raster path-fill lands (EVG SPEC §3.4, currently unchecked).
* **Clipping** — `EVGElement.clipPath` + `overflow: hidden` exist in the model;
  add a scissor rect to `UIContext` (and later an SVG clip path) so scroll
  panels and rounded containers clip their children. This pairs naturally with
  the SVG path work.
* **GPU** — the line cache is already an atlas-shaped hand-off to the
  WebGL/GLES2 backend described in `../RENDERING_EVG.md §6`.
* **More widgets** — checkbox, slider, dropdown, scroll panel (needs clipping).
