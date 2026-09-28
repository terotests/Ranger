# Compiler v4 (research probe)

Feasibility sketch: can a Ranger syntax AST be a `shape`?
See [`PLAN_COMPILER_V4.md`](../../PLAN_COMPILER_V4.md) §2.5.

**Product recommendation: do not replace shipping `CodeNode` with shapes**
under the gate “full macro parity + all tests green, no half-landed
compiler.” That gate makes this a second mid-end, not an AST-local change.
Shapes pay off better on domain tagged unions (`EvalPayload`, etc.).

`compiler/ng_*.rgr` remains the product compiler. This tree is evidence only.

## What’s here

| File | Role |
|---|---|
| `AstNode.rgr` | `shape AstNode` — syntax-only closed family |
| `Parser.rgr` / `Source.rgr` | Small Lisp parser → AstNode |
| `Probe.rgr` / `ParseProbe.rgr` | Smoke mains |

```bash
npx vitest run tests/compiler-v4-ast.test.ts
```
