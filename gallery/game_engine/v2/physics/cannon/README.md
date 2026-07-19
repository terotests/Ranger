# physics/cannon — staged Cannon.js port

**Copied from:** `gallery/game_engine/physics/src/` (v1 kept).

Well-tested modular physics kernels (`cannon_*` + `*_test.rgr`). The v1
`physics/tsx/` reconciler-style bridge was **not** copied.

**Plan phase:** 9 (kernels usable earlier for headless step tests).

## Binding decisions

- D-TYPE (physics arenas separate from Three)
- D-MODULES (`ranger:cannon`)

## Status

- **Staged copy.** Import paths inside `.rgr` files still assume the old
  `physics/src/` layout; rewire to `v2/host/arenas/physics` + registry commands
  before treating this as the live path.
- Run upstream-style tests via the existing `physics/src` runners until the
  v2 runner is wired; keep both trees green during the port.

## Unit / contract tests that gate this folder

- Existing `*_test.rgr` suites in `src/` (23 files copied)
- Later: `host/arenas/physics/*` create/release + `physics/step` pose sync

## Do not

- Import v1 `physics/tsx` bridges into v2 games
