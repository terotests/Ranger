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
npm run uast:test      # schema, scopes/refs, workspace imports, shared calls
npm run uast:ranger    # compatibility vs CodeGraphBuilder + ZipWriter spec
npm run uast:ts        # ts_parser → ZipWriter.ts + fromDir (no tsc)
npm run uast:cpp       # cpp_parser → zip_writer.hpp (C++17, no clang)
npm run uast:analyze -- gallery/uast/fixtures
npm run uast:analyze -- gallery/uast/fixtures/cpp
```

`uast:test` does not import the compiler. `uast:ranger` does — same
split as `codegraph:test` / `codegraph:builder`. `uast:ts` imports
`gallery/ts_parser` and walks `fixtures/zip_writer.ts`.

Do **not** change `CodeGraphBuilder` or the CodeGraph UI. UAST projects
into the existing graph; it does not replace it.

Comments immediately above a Ranger `def` / `fn` are that member’s
documentation overview. They must not land on the class. See
`fixtures/sheet_view.rgr` (`sortHeadRows`, `sortKind`).

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
| `src/UastQuery.rgr` | class / method / field lookup, `refTarget` |
| `src/UastTypeScript.rgr` | `TSNode.nodeType` → UAST kind |
| `src/UastTs.rgr` | ts_parser → `FrontendResult` (no compiler, no `tsc`); `fromDir` |
| `src/UastCpp.rgr` | cpp_parser → `FrontendResult` (no compiler, no `clang`); `fromDir` |
| `src/UastReport.rgr` | PLAN §11 metrics |
| `tools/UastAnalyze.rgr` | CLI: TypeScript or C++ tree → report + CodeGraph projector |
| `fixtures/zip_writer.ts` | the TypeScript twin of that fixture |
| `fixtures/cpp/zip_writer.hpp` | the C++17 twin (`this->crc.update`) |
| `fixtures/foo_a.ts`, `foo_b.ts` | two-file import/export + missing module |
| `fixtures/shapes.ts` | interface, `extends`, `function`, `export default` |
| `fixtures/card.tsx`, `page.tsx`, `banner.tsx`, `panel.tsx` | function / arrow / class React components |
| `fixtures/client.tsx` | `'use client'`, typed rest, qualified types, member generic calls |
| `fixtures/dts_app/` | fake `node_modules/react` + `react-dom` `.d.ts`; `App.tsx` is [koodisampo](https://github.com/terotests/koodisampo) `web/src/App.tsx` (hooks, `./components`, `./hooks`, `./db`, `./types`) |

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

## Apps without gallery sources

Ranger has no `ranger install`. An app that writes `Import "WindowCtl.rgr"`
or `Import "../evg/EVGElement.rgr"` only compiles when those `.rgr` files
are on disk (this repo’s `gallery/ui`, `lib/evg`, `gallery/statechart`,
or a `RANGER_LIB` that points at them). A training repo that ships a
precompiled EVG `.mjs` and not the sources will fail with `Could not
import file …` — the web demo can still run. UAST cannot invent the
missing tree; see [PLAN_UAST.md §14](./PLAN_UAST.md).

## See also

- [`gallery/codegraph`](../codegraph/README.md) — the Ranger-only explorer this projects into
- [`gallery/ts_parser`](../ts_parser/README.md) — TypeScript/TSX parser, second frontend
- [`gallery/cpp_parser`](../cpp_parser/README.md) — C++17 parser, third frontend
- [`gallery/js_parser`](../js_parser/README.md) — JS substrate
