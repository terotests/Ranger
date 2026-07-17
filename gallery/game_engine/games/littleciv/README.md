# LittleCiv

A small turn-based civilization demo for the Ranger game engine.

Inspired by the 4X / Civilization genre and free projects such as
[Freeciv](https://github.com/freeciv/freeciv) (GPL-2.0). This is **original**
engine-script code — not a Freeciv port.

## Play

```bash
npm run engine:game-sdl:run:littleciv
# or pick LittleCiv from the launcher:
npm run engine:game-sdl:launcher
```

## World

- Map is **48×30** tiles; the camera shows a **16×10** viewport that follows
  the selected unit (~3× larger world than the visible area).
- **Fog of war:** unexplored tiles stay dark. Terrain stays revealed once seen;
  enemy units/cities appear only inside current sight.

## Controls

| Input | Action |
|-------|--------|
| ←↑↓→ | Move selected unit (while it has moves) |
| Space / Action | Found city (settler) / skip or fortify |
| ↑ while idle / Select | Cycle to next unit |
| ↓ while idle / Start / B | End turn |

Note: the engine aliases gamepad **A** to Action/Space, so cycling uses
Select or idle ↑ — not A.

## Art

| Asset | Role |
|-------|------|
| `assets/chrome.png` | UI panel / map frame background |
| `assets/tiles.png` | Terrain + fog tile spritesheet |
| `assets/pieces.png` | Cities + selection cursor |
| `assets/settler_p.png` etc. | LPC walk cycles for units |

Unit characters are baked [Universal LPC](https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator)
spritesheets already vendored under `gallery/game_engine/lpc/pack/characters/`
(and ylos enemy sheet). Layer credits: `assets/lpc_credits_*.json`.

Regenerate chrome/tiles/pieces:

```bash
bash gallery/game_engine/games/littleciv/build-assets.sh
```

## Goal

Found cities, grow production, and eliminate the rival civilization's last city.
