# LittleCiv

A small turn-based civilization demo for the Ranger game engine.

Inspired by the 4X / Civilization genre and free projects such as
[Freeciv](https://github.com/freeciv/freeciv) (GPL-2.0). This is **original**
engine-script code — not a Freeciv port or derivative of Freeciv sources.

## Play

```bash
npm run engine:game-sdl:run:littleciv
# or pick LittleCiv from the launcher:
npm run engine:game-sdl:launcher
```

## Controls

| Input | Action |
|-------|--------|
| ←↑↓→ | Move selected unit (while it has moves) |
| Space / Action | Found city (settler) / skip or fortify |
| ↑ while idle / Select | Cycle to next unit |
| ↓ while idle / Start / B | End turn |

Note: the engine aliases gamepad **A** to Action/Space, so cycling uses
Select or idle ↑ — not A.

## Goal

Found cities, grow production, and eliminate the rival civilization's last city.
