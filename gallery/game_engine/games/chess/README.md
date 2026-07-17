# Chess

Two-player or vs-computer chess for the Ranger game engine (480×270).

## Features

- PNG piece spritesheet (`assets/pieces.png`)
- Painted 8×8 board on a felt backdrop
- Legal-move highlights, check / mate / stalemate
- Castling, en passant, auto-queen promotion
- Menu: **vs Tietokone** or **Kaksinpeli**
- Computer: known openings for the first plies, then material + center + capture heuristics

## Controls

| Input | Action |
|-------|--------|
| Arrows | Move cursor |
| Space / Action | Select piece / move |
| B / Select | Cancel selection |

## Run

```bash
npm run engine:game-sdl:run:chess
npm run engine:chess:runner
```

## Assets

```bash
npm run engine:chess:assets
```

## Notes

Rules and AI live in TSX (`chess_rules.tsx`, `chess_ai.tsx`). A hybrid
TSX-UI + Rust-WASM logic path is not available in the engine yet, so the
playable game follows the same retained-mode GameRunner pattern as Pac-Man /
LittleCiv.
