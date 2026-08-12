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

# CLI — load + parse all cases vs Node (slow while output is corrupted ~minutes)
npm run jsengine:marked
npm run jsengine:marked -- --json=/tmp/marked-smoke.json

# vitest — fast hard gates (load + API only)
npm run jsengine:marked:test

# vitest — also run parse / known-wrong parity probes
npm run jsengine:marked:parse
```

The harness loads the UMD once, then calls a helper per case (reloading the
bundle per parse is too slow when output is corrupted).

## What “success” means today

1. **Load** — UMD evaluates without a parse/runtime abort.
2. **API** — `marked` is an object with `parse` / `marked`.
3. **Invoke** — `parse("# Hello")` returns a string (not throw / undefined).
4. **Parity** — string equals Node’s output (currently **fails**: engine
   produces a huge corrupted string, ~1e6 chars for a 26-char Node result).

The suite keeps (1)–(3) as hard gates and records (4) as `KNOWN_WRONG` so a
future fix cannot land silently.
