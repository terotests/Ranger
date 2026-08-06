# Compiler v4 (sketch)

Parallel rewrite of the Ranger compiler using **shapes** for the AST.
See [`PLAN_COMPILER_V4.md`](../../PLAN_COMPILER_V4.md).

The shipping compiler remains `compiler/ng_*.rgr` (product 3.3.x).
Nothing here replaces `ng_Compiler.rgr` until self-host (G3).

## First goals

Not “compile the whole gallery.” The first acceptance targets are:

| Goal | Program |
|---|---|
| **G1** | JPEG scaler — `gallery/pdf_writer/src/tools/jpeg_scaler.rgr` |
| **G2** | TypeScript engine — `ComponentEngine.rgr` + `gallery/ts_parser/` |
| **G3** | Self-host — v4 compiles `compiler/v4/**`, then a host that builds G1 |

## Layout

| File | Stage | Role |
|---|---|---|
| `AstNode.rgr` | C0 | `shape AstNode` — syntax-only closed family |
| `Probe.rgr` | C0 | Builds nodes and pretty-prints via exhaustive `match` |
| `Source.rgr` | C1 | Source buffer |
| `Parser.rgr` | C1 | Lisp parser → `AstNode` |
| `ParseProbe.rgr` | C1 | Parse strings and pretty-print |

## Run probes

From the repo root (uses the current host compiler):

```bash
node bin/output.js -es6 ./compiler/v4/Probe.rgr -d=./tests/.output -o=v4_probe.js
node tests/.output/v4_probe.js

node bin/output.js -es6 ./compiler/v4/ParseProbe.rgr -d=./tests/.output -o=v4_parse_probe.js
node tests/.output/v4_parse_probe.js
```

Or via vitest:

```bash
npx vitest run tests/compiler-v4-ast.test.ts
```
