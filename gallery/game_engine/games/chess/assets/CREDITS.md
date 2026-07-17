# Chess assets

## Pieces — SpicyGame “Pixel Chess Pieces” (CC0)

Vendored under `vendor/spicygame/` (16×16 PNG).

- Source: https://spicygame.itch.io/chess-pieces
- Author: SpicyGame
- License: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Assembled into `pieces.png` (6×2 sheet: P N B R Q K × white/black)

Selection used in this game:

| | P | N | B | R | Q | K |
|---|---|---|---|---|---|---|
| White | wP | wN | wB | wR | wQ | wK |
| Black | bP | bN | bB | bR | bQ | bK |

## Board / icon

- `board_bg.png` — generated felt + wood frame + checkerboard (`tools/gen_sprites.py`)
- `image.png` — launcher icon (board snippet + white king)

## Why not Universal LPC?

The [Universal LPC Character Generator](https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator)
is great for walk-cycle characters (an armored “Knight” works), but chess needs
matching Staunton silhouettes for all six piece types — especially the rook
(tower), which LPC does not provide. A dedicated chess pixel pack keeps the set
coherent.

## Regenerate

```bash
npm run engine:chess:assets
```
