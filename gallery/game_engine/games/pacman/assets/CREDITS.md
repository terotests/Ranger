# Pac-Man assets

Character spritesheets (`pac.png`, `ghost_*.png`) are generated pixel-art
(classic Pac-Man style, not Nintendo/Namco artwork) by
`tools/gen_sprites.py`. Regenerate with:

```bash
npm run engine:pacman:assets
```

`image.png` is the launcher tile. It is a composed menu art frame (large
ghost + Pac-Man on a maze motif) so the characters stay readable at tile size;
regenerate character sheets with `npm run engine:pacman:assets` if you change
the sprites, then refresh the tile to match.
