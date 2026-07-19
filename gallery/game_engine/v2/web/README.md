# web — staged browser publishing framework

**Copied from:** `gallery/game_engine/web/` (`node_modules/`, `dist/` excluded).

VFS + canvas host + build scripts for running the engine in the browser / Pages.

**Plan phase:** after v2 headless gates; point builds at v2 modules gradually.

## Unit / contract tests that gate this folder

- `node build.mjs` produces a runnable `dist` (CI later)
- VFS mount/read smoke in `src/vfs.js`
