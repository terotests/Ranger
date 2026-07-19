# lpc — staged LPC spritesheet compositor

**Copied from:** `gallery/game_engine/lpc/` (`output/` bake cache excluded).

Modular compositor (`src/`), embedded `pack/`, and `fixtures/`. Integrates with
**2D sprites** (`v2/sprites/`) and selected character games.

**Plan phase:** with sprites (see CODE_CLEANUP_PLAN 2D section); not required
for Phase 1–5 bridge gates.

## Unit / contract tests that gate this folder

- Existing compose runners / demos under `src/`
- Pack presets remain small enough for CI

## Notes

- Art licensing stays as in upstream `lpc/README.md` / CREDITS
- Do not vendor the full Universal LPC tree
