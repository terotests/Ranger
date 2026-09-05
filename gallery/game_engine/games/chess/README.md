# Chess

Two-player or vs-computer chess for the Ranger game engine (480×270).

## Features

- PNG piece spritesheet (`assets/pieces.png`) — SpicyGame CC0 16×16 pixels
- Painted 8×8 board on a felt backdrop
- Legal-move highlights, check / mate / stalemate
- Castling, en passant, auto-queen promotion
- Menu: **vs Tietokone** or **Kaksinpeli**
- Computer: known openings for the first plies, then material + center + capture heuristics

## Controls

| Input | Action |
|-------|--------|
| D-pad / arrows | Move cursor (after select: jump between legal squares only) |
| A / Space | Select own piece, move, or capture enemy under cursor |
| B / Select | Cancel selection |

**Kaksinpeli (hotseat, one board):** white = WASD + gamepad 0, black = arrows +
gamepad 1. Only the side to move steers the cursor, so two pads do not fight.
Vs computer / menu: either pad can navigate.

## Run

```bash
npm run engine:game-sdl:run:chess
npm run engine:chess:runner
```

## Assets

```bash
npm run engine:chess:assets
```

Pieces are vendored from [SpicyGame Pixel Chess Pieces](https://spicygame.itch.io/chess-pieces)
(CC0) under `assets/vendor/spicygame/`. See `assets/CREDITS.md`.

## Notes

Rules and AI live in TSX (`chess_rules.tsx`, `chess_ai.tsx`). A hybrid
TSX-UI + Rust-WASM logic path is not available in the engine yet, so the
playable game follows the same retained-mode GameRunner pattern as Pac-Man /
LittleCiv.
