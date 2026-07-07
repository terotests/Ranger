# Ranger Game Engine base — design

> **TL;DR (Suomeksi):** Peruskuvaus pelienginen pohjalle, joka kirjoitetaan
> **Ranger-kielellä** kerran. Pelilogiikka on täysin **porttautuvaa** ja
> testataan Macilla (JS/Node), minkä jälkeen sama logiikka käännetään
> **natiiviksi binääriksi Raspberry Pi:lle** (HDMI → televisio) ja siihen
> liitetään **peliohjaimen** tuki. Avainidea: pelilogiikka ei koskaan kutsu
> I/O-operaatioita suoraan, vaan kaikki laitekohtainen on ohuessa
> *platform-kerroksessa* (terminaali nyt, SDL2 Pi:llä). Toimiva
> esimerkkipeli: [`pong.rgr`](./pong.rgr). Natiivipolun aikana löydetyt ja
> korjatut LLVM-kääntäjän viat: [`LLVM_BUGS.md`](./LLVM_BUGS.md).

## 1. Goals & constraints

* **One language, one game logic.** Gameplay is written once in Ranger and
  compiled to whatever the platform needs.
* **Develop on Mac, deploy on Pi.** Fast iteration under Node on the desktop;
  a native binary on a Raspberry Pi 4/5 outputting to a TV over **HDMI**.
* **Game-controller support.** USB or Bluetooth gamepad, abstracted so the
  game logic is input-device agnostic (keyboard on the desktop maps to the same
  abstraction).
* **Determinism.** Identical behaviour on every target: integer-only
  simulation, no floats, no reliance on target-specific division/overflow.

Non-goals for the base: a full scene graph, physics engine, or asset pipeline.
Those layer on top of the abstractions defined here.

## 2. Architecture — layered, with one hard boundary

```
        ┌─────────────────────────────────────────────┐
        │  Game logic  (PURE Ranger, portable)         │
        │    Pong.step(input) -> mutates state         │   <- unit-testable,
        │    Pong.cellAt(x,y) / render queries         │      identical on all
        │    Buttons (abstract controller snapshot)    │      targets
        └───────────────▲───────────────┬─────────────┘
      reads Buttons      │               │  exposes state / draw queries
                         │               ▼
        ┌────────────────┴─────────────────────────────┐
        │  Platform layer  (per-target, the ONLY I/O)   │
        │    init / shutdown / readInput / render / loop│
        └───────┬───────────────┬───────────────┬───────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼───────┐ ┌─────▼─────────┐
        │ Terminal     │ │ SDL2 (Pi)    │ │ Canvas (web)  │
        │ ANSI + keys  │ │ HDMI + pad   │ │ browser kiosk │
        │ (all targets)│ │ (native)     │ │ (optional)    │
        └──────────────┘ └──────────────┘ └───────────────┘
```

**The boundary that makes portability real:** game logic communicates with the
outside world through exactly two data shapes:

1. **`Buttons`** — an input snapshot (`up`, `down`, `action`, `quit`, …). Every
   device maps onto it: keyboard WASD/arrows, or a gamepad D-pad + face buttons.
2. **Render queries** — the platform asks the game *what* to draw
   (`Pong.cellAt(x, y)` in the reference), rather than the game *doing* the
   drawing. The renderer converts that to ANSI cells (terminal) or filled rects
   / sprites (SDL2).

Because the logic never calls `write`/`move_cursor`/`poll_keypress`, swapping
the platform layer requires **zero** changes to gameplay code.

## 3. Reference implementation — `pong.rgr`

* `Buttons` — abstract controller state.
* `Pong` — pure logic: paddles, ball, scoring, a beatable AI paddle. Motion uses
  integer **Bresenham-style accumulators** (`axAcc/ayAcc` vs `STEP`) so speed and
  bounce angle vary without floats or division. Geometry is derived with a
  portable `half()` helper (repeated subtraction) — see `LLVM_BUGS.md` Bug&nbsp;2
  for why `to_int` / `/` are avoided.
* `Terminal` — the platform backend: `init/shutdown`, `readInput` (drains the
  key queue into a `Buttons`), `render` (builds ANSI rows from `cellAt`), and the
  frame `run` loop. This is the class you replace per platform.

Verified: builds and runs under **ES6/Node**, **LLVM+C-runtime (native)**,
**C++**, and **Rust**. (See README target matrix.)

## 4. Input abstraction & controller mapping

`Buttons` is the contract. Concrete backends fill it each frame:

| Abstract | Desktop keyboard | Gamepad (SDL GameController) |
|----------|------------------|------------------------------|
| `up` / `down` | `W`/`S` (or arrows) | D-pad up/down, left stick Y |
| `action` | space | `A` (south) button |
| `quit` | `Q` | `Start` |

Terminals only deliver key-*press* events (no key-up), so held movement is
approximated as one step per event. The SDL2 backend reports **true held
button state** each frame (`SDL_GameControllerGetButton`), which is strictly
better and requires no logic change.

## 5. Rendering abstraction — two tiers

* **Tier 1 — cell grid (works today).** The game answers `cellAt(x, y) -> char`.
  The terminal backend paints it with ANSI. This already runs on the Pi console
  over HDMI with zero extra dependencies and is the reference for logic tests.
* **Tier 2 — pixel/blit (SDL2, for a real "game" look on the TV).** The game
  emits a small **draw list** of primitives (filled rect, sprite, text). A
  `Renderer` interface abstracts it:

  ```
  class Renderer {
      fn clear:void (r:int g:int b:int)
      fn fillRect:void (x:int y:int w:int h:int r:int g:int b:int)
      fn blit:void (spriteId:int x:int y:int)
      fn present:void ()
  }
  ```

  `Pong` would gain a `draw(r:Renderer)` method built from the same state as
  `cellAt`; the terminal renderer implements `fillRect` as block characters,
  the SDL2 renderer as real pixels. Gameplay code stays identical.

## 6. Raspberry Pi + HDMI + gamepad backend (SDL2) — the target path

**Why SDL2:** on Raspberry Pi OS, SDL2 renders through **KMS/DRM** so it drives
the HDMI framebuffer directly (no desktop/X required — ideal for a kiosk/console
boot), and its **GameController** API handles USB/Bluetooth pads with a shared
mapping database.

**Hardware:** Raspberry Pi 4/5, HDMI to TV, USB or BT gamepad.

**What must be added to the compiler (new operators in `compiler/Lang.rgr`).**
Following the existing terminal-operator pattern (`move_cursor`, `poll_keypress`
emit per-target templates and, for `llvm`, call C runtime functions), add a
graphics/input operator family whose `llvm`/`cpp` templates call a new
`runtime/ranger_gfx.c` (SDL2) and whose `es6` templates target `<canvas>`:

| Operator | Meaning | native (llvm/cpp) → C runtime | es6 (dev) |
|----------|---------|-------------------------------|-----------|
| `gfx_init w h title` | open HDMI window/framebuffer | `ranger_gfx_init` (SDL_CreateWindow, KMSDRM) | create `<canvas>` |
| `gfx_clear r g b` | clear frame | `SDL_SetRenderDrawColor`+`SDL_RenderClear` | `ctx.fillRect` |
| `gfx_fill_rect x y w h r g b` | draw rect | `SDL_RenderFillRect` | `ctx.fillRect` |
| `gfx_present` | swap buffers | `SDL_RenderPresent` | rAF |
| `gfx_shutdown` | close | `SDL_Quit` | — |
| `pad_poll` | pump events | `SDL_GameControllerUpdate` | gamepad API poll |
| `pad_button i btn` → bool | held state | `SDL_GameControllerGetButton` | `navigator.getGamepads()` |
| `pad_axis i axis` → int | stick value | `SDL_GameControllerGetAxis` | gamepad axes |

The `Renderer`/input platform class (section 5) is implemented in Ranger on top
of these operators, so **the operators are the only C/SDL glue**, and only the
platform layer uses them — the game logic stays pure.

**Build/link:** `clang pong.ll runtime/ranger_rt.c runtime/ranger_gfx.c \
$(pkg-config --cflags --libs sdl2)`. On the Pi: `sudo apt install libsdl2-dev`.

## 7. Build & deploy pipeline

* **Desktop dev (Mac):** `npm run engine:compile && npm run engine:run` (ES6).
* **On-device (Pi):** `gallery/game_engine/scripts/build-native.sh` → LLVM →
  `clang` + `runtime/ranger_rt.c` → a ~20 KB static-ish ELF. Cross-compile from
  the Mac with an aarch64 `clang`/sysroot, or just build on the Pi.
* **Autostart on the TV:** a `systemd` unit (or `~/.bash_profile` on tty1) that
  runs the binary on boot for a console-style experience.

## 8. Testing strategy

* **Pure-logic tests (fast, host):** compile the logic to ES6 and assert on
  state after scripted `Buttons` sequences — e.g. "ball served left, no paddle
  → right score increments". No rendering needed because logic is pure.
* **Determinism/golden tests:** run N deterministic frames and hash the state
  (or a `cellAt` grid dump); compare across ES6 and native to prove the targets
  agree bit-for-bit.
* **Backend smoke tests:** compile+link+run the native binary for a couple of
  frames (as the LLVM suite already does) to catch codegen/runtime breakage —
  this is how Bug&nbsp;1 in `LLVM_BUGS.md` is now guarded
  (`tests/compiler-llvm.test.ts` + `tests/fixtures/llvm_bool_field.rgr`).

## 9. Status & roadmap

**Done (this change):**
* Portable `Pong` reference (pure logic + terminal backend), integer-deterministic.
* Verified on ES6, **native LLVM+C**, C++, Rust.
* **Fixed** the LLVM boolean-field-store miscompile that blocked *all* native
  game builds (incl. `gallery/invaders`); added regression tests.
* Documented remaining LLVM gaps (`to_int`, field-less class struct) and the
  Go keyboard-polyfill limitation, all with reproductions.

**Next:**
1. Compiler: add `llvm` template for `to_int`; emit a struct for field-less
   classes (removes the two workarounds).
2. Add the `gfx_*` / `pad_*` operator family + `runtime/ranger_gfx.c` (SDL2)
   and a `<canvas>` es6 backend.
3. Implement the `Renderer` platform class and give `Pong` a `draw(Renderer)`.
4. Two-player + real gamepad; `systemd` autostart recipe for the Pi.
