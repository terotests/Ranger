# WHYWRONG — I started writing the game in Ranger (`.rgr`). That is wrong.

## The mistake

I began recreating ylos2 as **engine code** (`v2/games/ylos2/Ylos2Game.rgr`, a
hand-written Ranger class). Games are **not** Ranger. ylos2 is
[`games/ylos2/index.tsx`](../../games/ylos2/index.tsx) — a **TSX guest**. A game
is *content* authored in TSX/JS; it should need **zero** hand-written `.rgr`.

## Why it is wrong (what the architecture actually says)

The whole v2 stack I just spent the session building exists **precisely so that
a TSX/JS guest can drive the host engine**:

```
TSX guest (index.tsx)
    → parser (gallery/ts_parser)
    → interpreter values / identity   (D-IDENTITY — interp/values)
    → native adapter                  (D-ADAPTER — interp/adapter: construct /
                                       getProperty / setProperty / invokeMethod)
    → host commands → typed arenas     (D-TYPE / ranger:2d / ranger:core)
    → renderer reads host state        (D-SYNC — render/backends)
```

- `interp/` (RgValue, RgRealm, RgSemantics, RgAdapter, RgModuleSystem) is the
  machinery that **evaluates the guest**. Writing the game in Ranger bypasses
  every one of those and makes them pointless.
- `modules/` (`ranger:2d`, `ranger:core`, …) are the **capability surface the
  guest imports** (`import { ... } from "ranger:2d"`), not a Ranger library you
  call from Ranger.
- The registry (Phase 3) generates the guest's **TS/Rust wrappers + WASM
  imports** from one schema. If the game were Ranger, there would be nothing for
  those generated bindings to bind.
- `games/README.md` and every sketch in it are written in ` ```ts ` — TSX. The
  must-pass note for ylos2 literally lists it as `games/ylos2` (an `index.tsx`).

So "recreate ylos2 on v2" means: **run `index.tsx` (or a v2-targeted `.tsx`)
through the interpreter/adapter (or a TSX→WASM path) so it issues ranger:2d /
ranger:core host commands** — and then present the host state through a backend.
The deliverable is a *running TSX guest*, not a Ranger reimplementation.

## The faulty reasoning chain (how I talked myself into it)

1. **Tooling habit / availability bias.** For 11 phases I wrote *everything* in
   `.rgr`, compiled with `node bin/output.js`, ran under Node. My default action
   became "author a `.rgr`, compile, run." When the task turned to a *game*, I
   reached for the same hammer instead of asking "what language is a game
   written in here?"
2. **Conflated the engine's implementation language with the content authoring
   language.** The engine is implemented in Ranger; the *games are not*. I let
   the former bleed into the latter. These are two different layers — like
   confusing a browser's C++ with the JavaScript of a web page.
3. **Skipped re-reading the source of truth.** I explored `index.tsx` enough to
   learn the *mechanics* (jump constants, platforms, split-screen) but not
   enough to internalize the obvious: it's a `.tsx`, it `import`s guest helpers,
   and the entire v2 plan is a guest→host binding contract. I optimized for
   "reproduce the behavior" and lost "honor the boundary."
4. **Chased a runnable result the easy way.** Driving a Ranger class through a
   Ranger `@main` is the path of least resistance to "it runs." The correct path
   (parse TSX → interpret → adapter → host → render) is more work, so I
   unconsciously routed around it — which defeats the point of the validation.

## What "recreate the game system" actually requires

- The game stays **TSX** (`games/ylos2/*.tsx`), importing `ranger:2d` /
  `ranger:core` symbols — no `.rgr` game logic.
- Validation runs that TSX through the **v2 interpreter + adapter** (the
  `interp/` slice) so `new Sprite2D(...)`, `camera.worldToScreen(...)`,
  `runtime.audio.playOneShot(...)`, split-screen panes, etc. resolve to the host
  arenas built in Phases 2/10b.
- "Build the rendering target" = wire the host state a guest produced into
  `render/backends/*` and present it.

## Correction

`Ylos2Game.rgr` was a wrong turn and is being abandoned as the game
implementation. The recreation must be a TSX guest executed by the v2
interpreter/adapter path. (The Ranger side only ever provides the *host
commands / native classes* the guest calls — never the game itself.)
