# interp/migrate — moved

ComponentEngine's sources (`src/`), the generators of its Unicode and
locale tables (`tools/`) and the bytecode tier's design notes
(`BYTECODE.md`) moved to
[terotests/componentengine](https://github.com/terotests/componentengine)
(`engine/`, `tools/`, `engine/BYTECODE.md`) in September 2026, and CEr
(`../../cer`) with them (`cer/`).

This tree takes them back as packages: the root `ranger.json` pins that
repository, `npm run deps` puts `engine/` at `gallery/componentengine` and
`cer/` at `gallery/cer`, and code here imports

```ranger
Import "pkg:componentengine/ComponentEngine.rgr"
```

with `"componentengine": { "path": "../componentengine" }` (and
`"ts_parser": { "path": "../ts_parser" }`) in its package's `ranger.json`.
