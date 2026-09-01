# marked → ComponentEngine smoke

Loads the standalone [marked](https://github.com/markedjs/marked) **v4.3.0** UMD
bundle into Ranger `ComponentEngine` and compares `marked.parse(...)` against
Node running the same library.

## Why v4.3.0

| Version | Loads in engine? | Notes |
| --- | --- | --- |
| 18.x UMD | No | Parse error in minified bootstrap / modern syntax |
| 9.x UMD | Loads | `parse` path returns `undefined` here |
| **4.3.0 UMD** | **Yes** | Invokes parse; output currently corrupted (see below) |

## Run

```bash
# from repo root
bash scripts/build-engine-module.sh   # if bin/engine_module.cjs is missing

# CLI — tiny cases + marked@4.3.0 fixtures (original / new / gfm) vs Node
npm run jsengine:marked
npm run jsengine:marked -- --json=/tmp/marked-smoke.json
npm run jsengine:marked -- --fail-on-diff   # exit 1 on HTML mismatch
npm run jsengine:marked -- --quick            # tiny cases only

# vitest — load/API smoke + full fixture Node-parity unit tests
npm run jsengine:marked:test

# vitest — tiny parse probes only (MARKED_SMOKE_PARSE=1)
npm run jsengine:marked:parse

# marked fixtures + lodash complex pipelines together
npm run jsengine:libs:test
```


The harness loads the UMD once, then calls `__marked_parse__(md)` per case via
`EvalValue.string` (fixtures stay on disk; not embedded into the script).

## Fixtures

Under `fixtures/` (from marked v4.3.0 `test/specs`):

- `original/` — Markdown.pl / docs suites (incl. `markdown_documentation_syntax`)
- `new/` — marked-specific edges (tables, nested emphasis, lists, images, …)
- `gfm/gfm.0.29.json` — GFM extension examples

Oracle is always Node `marked.cjs` `parse`, not the checked-in `.html` files.
Both sides run with `mangle: false` so randomized mailto entity encoding does
not show up as false DIFF.

## What “success” means today

1. **Load** — UMD evaluates without a parse/runtime abort.
2. **API** — `marked` is an object with `parse` / `marked`.
3. **Invoke** — `parse("# Hello")` returns a string (not throw / undefined).
4. **Parity** — string equals Node’s output (currently **fails**: engine
   produces a huge corrupted string, ~1e6 chars for a 26-char Node result).

The suite keeps (1)–(3) as hard gates and records (4) as `KNOWN_WRONG` so a
future fix cannot land silently.
