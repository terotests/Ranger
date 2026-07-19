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

### Open design choices

| # | Question |
|---|----------|
| 1 | Overlay policy: 3D always on top of 2D, or shared depth / offscreen layers? |
| 2 | Same `pane` index for both passes, or explicit render targets? |
| 3 | Does `attachRenderer` become multi-attach (`attachRenderer(twoD)`, `attachRenderer(three)`), or does the host infer backends from which `render` commands ran? |
| 4 | Split-screen: does each pane get its own 3D camera, or is 3D full-bleed under/over the split? |
| 5 | Does the generic `RgGameHost` gain a compose presenter, or a sibling `RgHybridPresenter`, without taking game knowledge? |

Until those land, keep 2D games on `TWO.Renderer2D` + `rg2d_render`; treat 3D
demos as separate hosts. See also [`BRIDGES.md`](./BRIDGES.md) §6.3 Path D
(render bind vs present).
