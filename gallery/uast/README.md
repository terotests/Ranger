# UAST — unified analysis model for CodeGraph

A **gallery research app**: language plugins that feed one syntax tree
and one semantic graph, at the level CodeGraph can draw (classes, fields,
methods, types, calls).

**License: AGPL-3.0-or-later** — see [`../LICENSE`](../LICENSE).

This is not a universal parser. Language frontends adapt into a small
UAST and a `CodeModel`; CodeGraph remains a *view*. The existing Ranger
CodeGraph is the golden test, not something this tree replaces.

```text
source  →  language frontend  →  native AST
                ↓
              UAST          syntax
                ↓
            CodeModel       meaning (symbols, relations, confidence)
                ↓
            CodeGraph       presentation (already in gallery/codegraph)
```

The plan: [`PLAN_UAST.md`](./PLAN_UAST.md).

## Run

```bash
npm run uast:test      # schema, ZipWriter fixture, TS kind mapping
npm run uast:ranger    # golden: Ranger adapter vs CodeGraphBuilder
```

`uast:test` does not import the compiler. `uast:ranger` does — same
split as `codegraph:test` / `codegraph:builder`.

## What is in the tree

| File | Layer |
| --- | --- |
| `src/UastSource.rgr` | file id + source span |
| `src/UastKind.rgr` | ~30 node kinds, relations, confidence |
| `src/UastNode.rgr` | `UNode` (syntax; `LanguageSpecific` escape hatch) |
| `src/UastSymbol.rgr` | symbols and references |
| `src/UastRelation.rgr` | edges + diagnostics |
| `src/UastModel.rgr` | `CodeModel` — what tools consume |
| `src/UastCodeGraph.rgr` | projector onto `gallery/codegraph` IR |
| `src/UastSample.rgr` | ZipWriter fixture (no parser) |
| `src/UastRanger.rgr` | `RangerAppWriterContext` → `CodeModel` |
| `src/UastTypeScript.rgr` | `TSNode.nodeType` → UAST kind |
| `fixtures/zip_writer.ts` | the TypeScript twin of that fixture |

## Ranger first, TypeScript second

`gallery/zip/ZipWriter.rgr` is the picture we reproduce:

```text
ZipWriter
    entries : [ZipEntry]
    output  : GrowableZipBuffer
    crc     : CRC32
```

The Ranger adapter must match `CodeGraphBuilder` on
`gallery/codegraph/fixtures/calls.rgr` and `gallery/zip/zip_tool.rgr`.
Only then does a TS adapter have a target to aim at.

A UAST viewer — CodeGraph chrome over this `CodeModel` — comes after
those two frontends agree on ZipWriter. Do not build it in this
directory first.

## See also

- [`gallery/codegraph`](../codegraph/README.md) — the Ranger-only explorer this projects into
- [`gallery/ts_parser`](../ts_parser/README.md) — TypeScript/TSX parser, second frontend
- [`gallery/js_parser`](../js_parser/README.md) — JS substrate
