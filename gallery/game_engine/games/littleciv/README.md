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
| ←↑↓→ | Move selected unit |
| Space / Action | Found city (settler) / skip unit |
| Select / A | Cycle units with moves left |
| Start / B / Down while idle | End turn |

## Goal

Found cities, grow production, and eliminate the rival civilization's last city.
