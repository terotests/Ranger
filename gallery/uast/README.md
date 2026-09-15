# UAST — unified analysis model for CodeGraph

A **gallery research app**: language plugins that feed one syntax tree
and one semantic graph, at the level CodeGraph can draw (classes, fields,
methods, types, calls).

**License: AGPL-3.0-or-later** — see [`../LICENSE`](../LICENSE).

This is not a universal parser. Frontends emit UAST + hints; a **shared**
pipeline builds a `CodeModel`; CodeGraph remains a *view*. Frontends must
not each grow a private semantic engine.

```text
source  →  frontend.parse  →  FrontendResult { UAST, hints, diagnostics }
                ↓
        shared semantic pipeline
                ↓
            CodeModel       meaning (symbols, refs, relations)
                ↓
            CodeGraph       presentation (already in gallery/codegraph)
```

The plan: [`PLAN_UAST.md`](./PLAN_UAST.md).

## Run

```bash
npm run uast:test      # schema, child roles, dump, dynamic vs exact
npm run uast:ranger    # compatibility vs CodeGraphBuilder + ZipWriter spec
```

`uast:test` does not import the compiler. `uast:ranger` does — same
split as `codegraph:test` / `codegraph:builder`.

`UastModel` / `UastSemantic` / `UastCodeGraph` must not import compiler
types. Only `UastRanger` may.

## What is in the tree

| File | Layer |
| --- | --- |
| `src/UastSource.rgr` | file id, version, span (bytes canonical), origin |
| `src/UastKind.rgr` | ~30 node kinds, child roles, resolution, confidence |
| `src/UastNode.rgr` | `UNode` + `UChild { role, nodeId }` |
| `src/UastFrontend.rgr` | `FrontendResult`, hints, `Workspace` |
| `src/UastSemantic.rgr` | shared pipeline → `CodeModel` |
| `src/UastModel.rgr` | `CodeModel` — what tools consume |
| `src/UastCodeGraph.rgr` | projector onto `gallery/codegraph` IR |
| `src/UastDump.rgr` | the Ranger/TS debug dump |
| `src/UastSample.rgr` | ZipWriter `FrontendResult` fixture |
| `src/UastRanger.rgr` | compiler context → `FrontendResult` |
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

Two tests: **compatibility** with `CodeGraphBuilder` (reference
implementation, not spec) and a **semantic expectation** on those
fields. A dump of `this.crc.compute(...)` must show child roles plus
`resolution: resolved` / `confidence: exact`. The same dump shape is
the TypeScript acceptance criterion later.

A UAST viewer — CodeGraph chrome over this `CodeModel` — comes after
those two frontends agree on ZipWriter.

## See also

- [`gallery/codegraph`](../codegraph/README.md) — the Ranger-only explorer this projects into
- [`gallery/ts_parser`](../ts_parser/README.md) — TypeScript/TSX parser, second frontend
- [`gallery/js_parser`](../js_parser/README.md) — JS substrate
