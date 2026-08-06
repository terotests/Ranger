# Compiler v4 (sketch)

Parallel rewrite of the Ranger compiler using **shapes** for the AST.
See [`PLAN_COMPILER_V4.md`](../../PLAN_COMPILER_V4.md).

The shipping compiler remains `compiler/ng_*.rgr` (product 3.3.x).
Nothing here replaces `ng_Compiler.rgr` yet.

## Layout

| File | Stage | Role |
|---|---|---|
| `AstNode.rgr` | C0 | `shape AstNode` — syntax-only closed family |
| `Probe.rgr` | C0 | Builds nodes and pretty-prints via exhaustive `match` |
| `Source.rgr` | C1 | Source buffer |
| `Parser.rgr` | C1 | Lisp parser → `AstNode` |
| `ParseProbe.rgr` | C1 | Parse strings and pretty-print |

## Run the probe

From the repo root (uses the current host compiler):

```bash
node bin/output.js -es6 ./compiler/v4/Probe.rgr -d=./tests/.output -o=v4_probe.js
node tests/.output/v4_probe.js
```

Or via the vitest suite:

```bash
npx vitest run tests/compiler-v4-ast.test.ts
```
