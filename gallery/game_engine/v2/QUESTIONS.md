# QUESTIONS.md — open design questions on the v2 stack

Working notes. Answers below reflect **what the code does today**; items
marked *open* need a design decision before implementation.

Related: [`BRIDGES.md`](./BRIDGES.md) §6 (live call stack),
[`CODE_CLEANUP.md`](../CODE_CLEANUP.md) (D-2D / D-MODULES / frame pipeline).

---

## Q1 — Where are the ylos2 player atlas assets?

Guest loads:

```ts
this.atlas = runtime.assets.loadSpriteAtlas("pkg://player.atlas");
```

The file on disk is only:

[`games/ylos2/player.atlas`](./games/ylos2/player.atlas)

```text
texture 256 256
region idle 0 0 32 48
region walk 32 0 32 48
region plat 64 0 32 8
clip walk idle,walk 120,120
```

### Answer (current)

| Fact | Detail |
|------|--------|
| Package location | `gallery/game_engine/v2/games/ylos2/` — resolved via `pkg://` → `bridge.packageDir` |
| What exists | **One text manifesto** (`.atlas`). No `player.png` / sheet image in the folder |
| What `texture 256 256` creates | Host `RgTexture2D` with `width`/`height` only — **no RGBA pixel store** |
| What regions/clips create | Metadata on `RgSpriteAtlas` (`RgSpriteRegion`, `RgAnimClip2D`) |
| How the e2e “sees” art | `RgSoftwareRenderer2D` plots `color = 100 + regionIndex` — does not sample texels |
| v1 contrast | Playable v1 used real PNGs (`games/ylos2/assets/p1_walk.png`, …); out of scope for this v2 port |

Full call path: [`BRIDGES.md`](./BRIDGES.md) §6.3 Path C.

**Open follow-up:** when a GPU/SW backend starts sampling textures, does the
manifest gain a `image <uri>` line (or separate `pkg://player.png`), and does
`textureCreate` grow a pixel/upload path?

**Plan lean (H1):** yes — `RgTexture2D` grows a real pixel/GPU residency path so
atlas images, RTT color attachments, and later uploads share one type. Atlas
manifest `image <uri>` (or sibling `pkg://…png`) is the asset-side half; see
[`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md) §5.1 / H1.

---

## Q2 — Can the same game add a 3D renderer for effects on top of the 2D surface?

ylos2 today:

```ts
this.renderer = new TWO.Renderer2D();
runtime.surface.attachRenderer(this.renderer);
// …
this.renderer.render(this.layer, this.cam1, 0);
this.renderer.render(this.layer, this.cam2, 1);
```

Desired shape (sketch): keep the 2D climber, and also draw some 3D (particles,
backdrop mesh, celebration burst, …) composited onto the same surface / panes.

### Answer (current — would it work *now*?)

**No — not on the live ylos2 path.**

1. **`attachRenderer` is a guest-only stub.**  
   In [`modules/ranger_core/ranger_core.tsx`](./modules/ranger_core/ranger_core.tsx):

   ```ts
   class __RgSurface {
     renderer = null;
     attachRenderer(r) { this.renderer = r; }  // no rgcore_* call, no host state
   }
   ```

   It does not register a backend with `RgSurface` / `RgGameHost` /
   `Rg2DPresenter`. Presentation is driven by **`renderer.render(…)` →
   `rg2d_render` → pane bind**, then a host-side presenter that only knows 2D.

2. **Present is 2D-only today.**  
   [`Rg2DPresenter`](./runtime/game_host/Rg2DPresenter.rgr) →
   [`RgSoftwareRenderer2D.present2D`](./render/backends/software/RgSoftwareRenderer2D.rgr).
   There is no compose step that blends a 3D pass over the 2D framebuffer.

3. **`ranger:three` is not a live guest module yet.**  
   [`modules/ranger_three/`](./modules/ranger_three/) is scaffold; ylos2’s host
   registers only `ranger:core` + `ranger:2d`
   ([`RgGameHost.load`](./runtime/game_host/RgGameHost.rgr)). Soft 3D demos
   exist under `web/` / `model3d/` as separate hosts, not as a second pass
   inside the generic game host.

### What the architecture *intends* (so a later “yes” is plausible)

From CODE_CLEANUP frame pipeline:

- Guest may issue **multiple** `renderer.render(scene, camera[, pane])` calls
  per update (split panes, offscreen targets).
- Host **presents** afterward and **composes pane results** to the surface.
- `ranger:2d` and `ranger:three` are **sibling** domain packages under one
  `runtime` / `runtime.surface` — not mutually exclusive worlds.

A workable future shape (not implemented):

```text
update:
  twoD.render(layer, cam2d, pane)     → bind / fill 2D view for pane
  three.render(scene, cam3d, pane)    → bind / fill 3D view for same pane
present (host):
  compose 2D + 3D into pane rect      → single surface (depth/overlay policy TBD)
```

`attachRenderer` would need to become real (capability: which backends the
surface will present) — or be dropped in favour of “render calls declare the
passes; the presenter selects backends.” Either way, **one surface / pane
model stays**; games should not grow a second ad-hoc window.

### Open design choices → decided in plan

Full write-up: [`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md) (D1–D8, phases H0–H7).

| # | Question | Decision |
|---|----------|----------|
| 1 | Overlay policy: 3D always on top of 2D, or shared depth / offscreen layers? | **Guest-declared pass order** on a compose presenter. Shared 2D↔3D depth in one pass is out of scope for the first cut. Also support **render-to-texture** when 3D must behave like a sprite. |
| 2 | Same `pane` index for both passes, or explicit render targets? | **Both:** pane (or surface) for layer composition; distinct `RenderTarget` (exposing `colorTexture: Texture2D`) for RTT. Same `target:` slot, different object kinds. |
| 3 | `attachRenderer` multi-attach vs infer from `render` commands? | **Infer from `render*` commands** (and loaded packages). Deprecate the stub; do not make multi-attach the primary model. |
| 4 | Split-screen: per-pane 3D camera vs full-bleed? | **Per-pane pass lists** (each pane may bind its own 2D/3D cameras). Full-bleed is game policy (same pass recorded for every pane / pre-pass), not a host special case. |
| 5 | Compose presenter ownership? | **Sibling `RgComposePresenter`** (or renamed surface presenter) used by `RgGameHost`; host stays backend-agnostic and game-agnostic. |

Until H2–H4 land, keep 2D games on `TWO.Renderer2D` + `rg2d_render`; treat 3D
demos as separate hosts. See also [`BRIDGES.md`](./BRIDGES.md) §6.3 Path D
(render bind vs present).

---

## Q3 — Are pane indices `0` / `1` the most portable render target?

ylos2 today:

```ts
runtime.surface.setLayout("split-vertical");
runtime.surface.pane(0).assignPlayer(0);
runtime.surface.pane(1).assignPlayer(1);
// …
this.renderer.render(this.layer, this.cam1, 0);
this.renderer.render(this.layer, this.cam2, 1);
```

Is the third argument as a bare integer the right long-term / portable shape?

### Answer (short)

**The idea is portable; the bare `0`/`1` literals are the least portable
expression of it.**

What *is* portable (and matches CODE_CLEANUP):

- One surface owns **panes** (viewports), not separate windows.
- The game calls `render(scene, camera, …)` once per pane it cares about.
- SW and GPU honour the same pane → scissor/viewport mapping.
- Single-player omits the target (full-surface default).

What is *less* portable about today’s ylos2 form:

| Issue | Why |
|-------|-----|
| Magic indices | `0`/`1` encode layout order; easy to desync from `setLayout` / player binding |
| Wire shape leaked to guest | Schema is `rg2d_render(h,h,i)` — interpreter-friendly, but guest API need not look like that |
| No pane identity object | CODE_CLEANUP’s conceptual API passes a **pane / target**, not a raw int |
| Re-bind every frame | Correct today (bind view each `render`), but games that only need a stable bind could declare once via `pane.setView(layer, cam)` (façade already has it; unused by ylos2) |

CODE_CLEANUP sketch ([`CODE_CLEANUP.md`](../CODE_CLEANUP.md) — Surface viewports):

```ts
runtime.surface.setLayout("split-horizontal")
const left = runtime.surface.pane(0)
const right = runtime.surface.pane(1)

renderer2d.render(scene, cameraP1, { target: left })
renderer2d.render(scene, cameraP2, { target: right })
```

That is the more portable *guest* shape: hold the pane you got from the
surface after layout, pass it as the render target. Under the hood the
interpreter/wasm profile may still lower to a pane index or a handle — that
is a profile detail (§2), not what games should author.

### Ranking (guest API)

| Form | Portability | Status |
|------|-------------|--------|
| `render(scene, cam)` — single full surface | Best for 1P | Intended; ylos2 is 2P so N/A |
| `render(scene, cam, { target: pane })` or `render(scene, cam, pane)` | Best for split-screen | **Contract intent**; not what ylos2 calls today |
| `pane.setView(layer, cam)` once + present | Good when view is stable | Façade method exists; host stores real handles |
| `render(scene, cam, 0)` / `…, 1)` | Works; brittle authorship | **What ylos2 does now** (`argSpec "h:h:i"`) |

### What stays true either way

- Targeting a **surface-owned pane** (not a platform window, not a GPU
  texture name invented by the game) is the portable model across Mac/SDL,
  Pi, wasm, software present.
- Indices are a fine *lowering* (and fine in headless tests). They should
  not be the only guest-facing vocabulary once pane objects exist.
- Player binding (`pane(i).assignPlayer(j)`) is separate from the render
  target — input routing vs where pixels go. Don’t collapse “player 0” with
  “pane 0” in the render API even when ylos2 happens to use the same numbers.

### Open / decided

| # | Question | Status |
|---|----------|--------|
| 1 | Freeze guest signature as `render(scene, cam, pane\|options)` and keep `i` only in the interpreter/wasm lowering? | **Lean yes** — pane object / options at authorship; `i` stays a profile lowering (ylos2 may keep indices until a façade pass). |
| 2 | Prefer declare-once `pane.setView` + implicit present, or keep explicit per-frame `render(…, pane)` (current frame-pipeline step 6)? | **Keep explicit per-frame `render`** as the pipeline contract; `setView` may remain sugar for stable binds but must not replace step 6 for hybrid pass lists. |
| 3 | Offscreen targets: same `target:` slot, or a different object type beside panes? | **Decided** — same `target:` slot; distinct `RenderTarget` type (not a pane index). See [`PLAN_2D_EMBED_3D.md`](./PLAN_2D_EMBED_3D.md) D3 / H1. |

---

## Q4 — How much of v1 Pomppija must the v2 ylos2 guest reproduce?

v2 [`games/ylos2/index.tsx`](./games/ylos2/index.tsx) states a split:

```text
Faithful: platforms, jump constants, land-on-top, per-player camera,
          goal → celebration, split-screen, summit music score
Out of scope: enemies, bullets, fruits/diamonds, super mode, LPC art
```

A functional diff against v1 [`games/ylos2/index.tsx`](../games/ylos2/index.tsx)
showed the “faithful” slice itself was incomplete (stub summit score, mover
bounds, jump edge-trigger, platform carry, goal proximity). Some of that is
now restored; several celebration / SFX / visual pieces are still missing.

### Answer (current)

| Area | Status |
|------|--------|
| Level tables + jump numbers | Present |
| Summit `SUMMIT_MUSIC` text | Restored to v1 verbatim (duration:pitch + four phrases); start-once |
| Mover clamp / carry / landing slack / jump edge | Aligned with v1 |
| Finish timeline (bounce → walk → particles, 7.5 s) | **Missing** — goal only sets `reachedGoal` + cheer + music |
| SFX vocabulary (`bounce` / `wall` / `celebrate`) | **Missing** — `celebrateSfx` is `createClip()` with no samples |
| Sprite facing / LPC sheets / HUD / flag / sky | **Missing** (facing: no `Sprite2D` flip API yet) |
| Enemies / pickups / super / bullets | Explicitly out of scope |
| Victory banner + restart + `stopMusic` | **Missing** |

E2E (`tests/e2e/ylos2_e2e_test`) gates climb + cheer + music **score text**,
not celebration choreography or SFX content.

### Open

| # | Question |
|---|----------|
| 1 | Is “must-pass ylos2” **climb + split + vocal/music façades**, or **play-feel parity** on the faithful slice (finish phase, landing/jump SFX, ride movers under real input)? |
| 2 | Should remaining faithful gaps become e2e assertions (finishMs phases, `music.stop` on restart), or stay manual / follow-up PRs? |
| 3 | When (if ever) do out-of-scope systems (enemies, diamonds/super) re-enter the v2 guest — after `ranger:2d` bitmap/sheet APIs, or never (v1 stays the full game)? |

---

## Q5 — What is the guest contract for `runtime.audio.music.play(score)`?

v1 emits scored music via helpers:

```ts
musicScoreEvent(SUMMIT_MUSIC, false)  // loop === false → amount 0
stopMusicEvent()                      // only on post-victory restart
```

v2 ylos2:

```ts
runtime.audio.music.play(SUMMIT_MUSIC);  // no loop flag
// no music.stop() on any path yet
```

The façade today ([`ranger_core.tsx`](./modules/ranger_core/ranger_core.tsx)):

```ts
play(score) { rgcore_music_play(score); }
stop() { rgcore_music_stop(); }
```

Headless bridge only stores `musicPlaying` + `musicScore` string — it does
**not** parse or schedule notes. Real playback (when wired) must use the same
`game_soundscore` grammar as v1 (`tempo` / `beats` / `@melody` lines,
`beats:pitch` tokens). A one-line stub without durations is silent / wrong
under that parser — which is why the port’s score was restored verbatim.

### Open

| # | Question |
|---|----------|
| 1 | Does `music.play` take `(score, opts?: { loop?: boolean })` (or a second `loop` arg), matching v1’s non-looping summit line? |
| 2 | Is **start-once / replace / layer** policy host-owned (second `play` no-ops or restarts), or must every guest keep a `summitMusicStarted` flag? |
| 3 | Who owns score identity for tests — exact string equality, or “parser accepts and schedules N beats”? |
| 4 | When the real synth path lands, does the headless bridge grow a tiny scheduler (so e2e can assert audible structure), or stay a record-only stub? |

---

## Q6 — Celebration: one-shot clip vs vocal cue vs particles?

On goal, v2 today:

```ts
this.celebrateSfx.playOneShot();       // empty clip from createClip()
runtime.audio.vocal.play("cheer");
this.tryStartSummitMusic();            // once per run
```

v1 fires `soundEvent("celebrate")`, rumble, a burst of particle events, then
a timed finish phase (celebrate hop → goal walk → victory ready).

### Answer (current)

- E2E asserts `oneShotCount` and vocal `"cheer"` — so the **façade calls**
  matter more than clip bytes today.
- `createClip()` with no upload means the one-shot is a **lifecycle probe**,
  not an audible celebrate sample.
- Particles / rumble are not on the ylos2 guest path yet (no
  `runtime.particles` / `runtime.input.rumble` usage in this port).

### Open

| # | Question |
|---|----------|
| 1 | Is `vocal.play("cheer")` the canonical celebrate cue on v2, with `playOneShot` only proving D-LIFE — or should a real celebrate buffer be packaged (`pkg://…`)? |
| 2 | Do finish particles/rumble wait on new `ranger:core` capabilities, or can the guest approximate with `ranger:2d` sprites until then? |
| 3 | Should reaching the goal **lock** the player into a finish state machine (v1), or keep free physics after `reachedGoal` (current v2)? |

---

## Q7 — Attract / autopilot vs v1 jump edge-trigger?

Grounded jumps are edge-triggered (v1 `jumpHold`). Attract feeds actions every
frame via `autopilotBits` → `RgAttractDriver` → `setAction(…, "jump", …)`.

A constant jump bit (always `+4`) never re-jumps after the first takeoff.
The guest now pulses jump: set while grounded or rising, clear while falling.

### Open

| # | Question |
|---|----------|
| 1 | Is pulse-on-fall the permanent attract contract, or should the driver synthesize edges (press/release) so games can keep level-triggered bits? |
| 2 | Should `autopilotBits` stay a game export, or move to a shared attract helper that understands edge-triggered jump? |
| 3 | Does human input need the same documentation (hold ≠ auto-rejump) in the must-pass writeup / games README? |
