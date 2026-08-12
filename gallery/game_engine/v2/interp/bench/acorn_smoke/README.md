# acorn → ComponentEngine smoke

Loads [acorn](https://github.com/acornjs/acorn) **v8.14.1** into Ranger
`ComponentEngine` and compares structural AST summaries against Node.

## Run

```bash
bash scripts/build-engine-module.sh   # if needed
npm run jsengine:acorn
npm run jsengine:acorn:test
```

## Prepare (engine only)

The vendored UMD is rewritten before `loadScript`:

1. Unwrap UMD into `var acorn = {}; (function (exports) { … })(acorn)`
2. Rewrite `new this(` → `new Parser(` (engine rejects `new this`)

Node uses `vendor/acorn.js` unchanged. The old `type`→`tokType` rename is no
longer needed after `ba3e5fdd` (`type` opens a type alias only when a name follows).

## Cases

Arrow + class, async/await + for-of + template, module import/export,
object spread/rest, optional chaining + nullish coalescing, and a denser
`buildReport` program — each summarized to JSON and matched to Node.
