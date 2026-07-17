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
| ←↑↓→ | **Aim** (yellow ring = selected unit, cyan square = target tile) |
| Space | **Move** — slides into the aimed tile (combat if enemy) |
| Space (no aim / no moves) | Found city (settler) or skip/fortify |
| Select / ↑ when spent | Cycle units |
| B / Start | End turn |

Flow: pick direction with arrows → yellow tile shows the target → Space to slide.

`game.info` uses `splitScreen=never` so the 480×270 map is not squeezed into a
half-width pane (that made tiles look tall and hid HUD text).

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
