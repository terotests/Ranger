# Component inventory

What has been built in this repository, and whether each piece is a
**package** — a directory with a `ranger.json` that names its own
dependencies — or a pile of `.rgr` files that happens to sit next to a demo.

The question matters now because the compiler resolves `Import "pkg:…"` on
its own ([`pkg/README.md`](pkg/README.md), `compiler/PkgImport.rgr`). Until it
did, a directory was the only unit there was and a relative path was the only
way to reach one. Both still work, and nothing here proposes breaking them.
What is new is that a component **can** declare what it needs, and a consumer
**can** name a component instead of counting `../`.

Counted on 2026-09-17: **47 directories under `gallery/`**, 46 of them holding
Ranger source; with `lib/` and `pkg/`, **1 935 `.rgr` files** and about
**875 000 lines**. **Fifteen** carry a manifest — five before this pass. The
gap is what this document is about.

- [How to read the table](#how-to-read-the-table)
- [Libraries](#libraries)
- [Applications and viewers](#applications-and-viewers)
- [Components that are not in a directory of their own](#components-that-are-not-in-a-directory-of-their-own)
- [The same code in more than one place](#the-same-code-in-more-than-one-place)
- [What testing the packaging found](#what-testing-the-packaging-found)
- [What changed in this pass](#what-changed-in-this-pass)
- [What is left, in the order it is worth doing](#what-is-left-in-the-order-it-is-worth-doing)

## How to read the table

**Manifest** — a `ranger.json` in the directory root.

**Reaches into** — imports that resolve *outside* the component's own
directory, counted per target. A library with an empty cell is a package
whether or not anyone has written its manifest yet. A library with six
entries is a component only in the sense that its files are adjacent.

The count is per import site, not per file: `gallery/ui` reaching `evg` 202
times is 202 `Import` lines, and that is the point — every one of them is a
`../../evg/` that a `pkg:evg` would replace.

Regenerate it with:

```bash
node scripts/inventory.mjs           # the tables below
node scripts/inventory.mjs --dups    # the duplicate scan
```

## Libraries

Things other components are *supposed* to depend on. In dependency order:
the further down, the more it is somebody else's foundation.

| Component | What it is | Files | Manifest | Reaches into |
| --- | --- | --: | :-: | --- |
| [`lib/core`](lib/core/README.md) | Ranger Core API — `RgNum`, `RgText`, `RgU32`, checked against Node (MIT) | 4 | — | — |
| [`lib/zip`](lib/zip) | DEFLATE (RFC 1951) and the little-endian buffer ZIP needs (MIT) | 2 | **`zipcore`** | — |
| [`pkg`](pkg/README.md) | `ranger.json` / `ranger.lock` / `pkg:`, and a Git pack client (MIT) | 11 | **`pkg`** | — |
| [`gallery/zip`](gallery/zip/README.md) | PKZIP container: reader, writer, CRC-32 | 5 | **`zip`** | — |
| [`gallery/zstd`](gallery/zstd/README.md) | Zstandard decoder (RFC 8878) | 8 | **`zstd`** | — |
| [`gallery/vfs`](gallery/vfs/README.md) | One place a document engine gets its bytes | 3 | **`vfs`** | — |
| [`gallery/xml`](gallery/xml/XmlCore.rgr) | One XML reader for the document formats: spans, two namespace policies | 1 | — | `ooxml`(1) |
| [`gallery/css`](gallery/css/CssCore.rgr) | CSS parsing the markdown and office trees share | 2 | — | `evg`(2) |
| [`gallery/cpp_parser`](gallery/cpp_parser/README.md) | Declaration-oriented C++17 parser for `uast` | 3 | **`cpp_parser`** | — |
| [`gallery/js_parser`](gallery/js_parser/README.md) | JavaScript ES6+ lexer, parser, pretty-printer | 8 | **`js_parser`** | — |
| [`gallery/ts_parser`](gallery/ts_parser/README.md) | TypeScript / TSX parser | 10 | **`ts_parser`** | — |
| [`gallery/graphql`](gallery/graphql/README.md) | GraphQL parser: queries, mutations, subscriptions, SDL | 7 | **`graphql`** | — |
| [`gallery/rangersql`](gallery/rangersql/README.md) | SQL parser, generator, dialect transpiler | 9 | **`rangersql`** | — |
| [`gallery/rangerdb`](gallery/rangerdb/README.md) | Database API over a columnar engine, SQLite and DuckDB | 28 | **`rangerdb`** | — |
| [`gallery/ooxml`](gallery/ooxml/README.md) | OPC package reader and the XML text rules the OOXML editors share | 6 | — | `docx_viewer`(3) `zip`(2) `datagrid`(2) `pdf_writer`(1) `pptx`(1) `evg`(1) `xml`(1) |
| [`gallery/office`](gallery/office/README.md) | Font face per run, offset↔x, unstated style properties, DrawingML theme | 41 | — | `evg`(9) `pptx`(7) `docx_viewer`(5) `datagrid`(4) `game_engine`(4) `pdf_writer`(3) `markdown`(2) `book`(2) `zip`(1) `text_editor`(1) |
| [`gallery/uast`](gallery/uast/README.md) | Unified analysis model: language plugins → UAST → CodeModel | 24 | — | `codegraph`(4) `lib`(2) `cpp_parser`(1) `compiler`(1) `ts_parser`(1) |
| [`gallery/statechart`](gallery/statechart/README.md) | A statechart as data, and a runner that walks it | 4 | **`statechart`** | `rangerflow`(8) |
| [`gallery/vela`](gallery/vela/README.md) | Vega-compatible visualization runtime: spec in, scene out | 43 | **`vela`** | `pdf_writer`(4) `evg`(3) `game_engine`(1) |
| [`gallery/ui`](gallery/ui/README.md) | EVG controllers measured against Radix | 72 | **`ui`** | `evg`(202) `vela`(4) `lib`(4) `game_engine`(1) |
| [`gallery/evg`](gallery/evg/README.md) | **The layout engine everything draws through** | 91 | **`evg`** | `game_engine`(11) `pdf_writer`(8) |

Two rows deserve to be read twice.

**`gallery/evg` is the bottom of the stack and it imports two applications.**
The JPEG decoder comes from `pdf_writer/src/jpeg/`, the PNG decoder from
`game_engine/lpc/src/`, and text measurement and input from
`game_engine/ui/`. So `evg`'s manifest says it has no dependencies,
**twenty-five** other components import it, and `evg` itself cannot be
checked out without the two largest trees in the gallery. The arrow points
the wrong way, and the manifest does not say so.

**`gallery/ui` has both spellings at once:** 88 `pkg:evg` imports across 41
files, and 202 still written `../../evg/`. That is the intended migration
shape — the compiler folds the two spellings to one file on purpose, so a
tree can move a file at a time — but the manifest currently describes 88
imports out of 290.

## Applications and viewers

Programs, not libraries. A manifest would be a lockfile for a build, not an
offer to be depended on — which is fine, and several of them *are* depended on
today, which is not.

| Component | What it is | Files | Manifest | Reaches into |
| --- | --- | --: | :-: | --- |
| [`game_engine`](gallery/game_engine/README.md) | Retained-mode game runner, SDL launcher, TSX games — and the trees under [Components that are not in a directory of their own](#components-that-are-not-in-a-directory-of-their-own) | 801 | — | `pdf_writer`(132) `evg`(57) `ts_to_ranger`(14) `ts_parser`(7) `lib`(3) `office`(3) `lib/core`(2) `zip`(2) `lib/zip`(1) |
| [`rangerflow`](gallery/rangerflow/README.md) | React Flow-shaped graph editor, ERD/UML editor, PDF export — and five diagram-language readers | 87 | — | `evg`(10) `pdf_writer`(3) `rangerdb`(2) `vela`(2) `datagrid`(2) |
| [`datagrid`](gallery/datagrid/README.md) | EVG DataGrid / Excel-style spreadsheet viewer and editor | 110 | — | `pdf_writer`(35) `evg`(31) `game_engine`(15) `vela`(8) `rangerdb`(8) `ooxml`(8) `office`(6) `text_editor`(4) `zip`(1) `ts_parser`(1) |
| [`pdf_writer`](gallery/pdf_writer/README.md) | EVG document tooling: TSX documents, preview server, HTML and PDF — and the JPEG codec, the font stack, the rasteriser | 82 | — | `evg`(109) `game_engine`(13) `ts_parser`(8) |
| [`pptx`](gallery/pptx/README.md) | PPTX Lite reader/viewer, and an Android twin | 54 | — | `evg`(45) `office`(16) `pdf_writer`(15) `vela`(9) `ooxml`(7) `xml`(5) `game_engine`(4) `odp`(2) `css`(1) `vfs`(1) `zip`(1) `lib`(1) |
| [`realtrainer`](gallery/realtrainer/README.md) | A five-scene application on the GPU, built from `ui` and painted by EVG | 74 | — | `evg`(19) `ui`(14) `vela`(6) `statechart`(5) `datagrid`(2) `game_engine`(1) |
| [`markdown`](gallery/markdown/README.md) | CommonMark + GFM parser and a layout engine EVG can print | 45 | — | `evg`(22) `pptx`(10) `pdf_writer`(7) `docx_viewer`(6) `vfs`(6) `rangerflow`(5) `office`(5) `vela`(5) `css`(1) |
| [`figma`](gallery/figma/README.md) | Figma `.fig` / `.deck` reader: ZIP → kiwi → node tree → EVG | 30 | — | `evg`(25) `zip`(6) `lib`(2) `zstd`(1) |
| [`book`](gallery/book/README.md) | Visual book composition engine and spread editor | 31 | — | `evg`(11) `pdf_writer`(8) `office`(4) `game_engine`(4) `datagrid`(2) `pptx`(2) |
| [`docx_viewer`](gallery/docx_viewer/README.md) | DOCX viewer and editing MVP | 30 | — | `evg`(11) `datagrid`(9) `office`(8) `pdf_writer`(8) `game_engine`(6) `text_editor`(5) `ooxml`(2) `lib`(1) |
| [`rave`](gallery/rave/README.md) | From UI to running app — the editor after Rafi | 17 | — | `evg`(23) `figma`(7) `ui`(1) `office`(1) |
| [`ts_to_ranger`](gallery/ts_to_ranger/README.md) | TypeScript → Ranger translation | 11 | — | `game_engine`(9) `ts_parser`(3) |
| [`firesim`](gallery/firesim/README.md) | Firebase, simulated: Firestore, Identity Toolkit, `firestore.rules` | 14 | — | `evg`(8) `ui`(7) `vela`(2) |
| [`rangerdbviewer`](gallery/rangerdbviewer/README.md) | A database workbench over SQLite / DuckDB / RangerDB | 26 | — | `rangerdb`(31) `rangerflow`(7) `datagrid`(6) `rangerforms`(3) `evg`(1) |
| [`mfiles`](gallery/mfiles/README.md) | An M-Files client and vault, emulated, running UIX extensions | 12 | — | `evg`(9) `ui`(8) `game_engine`(4) |
| [`codegraph`](gallery/codegraph/README.md) | Call-graph explorer of Ranger source | 17 | — | `rangerflow`(16) `datagrid`(8) `uast`(7) `evg`(6) `compiler`(2) `ui`(2) `game_engine`(2) `pdf_writer`(2) |
| [`rangerforms`](gallery/rangerforms) | Form model, expressions, renderer and I/O | 19 | — | `game_engine`(2) `evg`(2) `datagrid`(1) |
| [`ranger_engine`](gallery/ranger_engine/README.md) | Runs **Ranger** source directly: bytecode VM plus a JIT tier | 18 | — | `compiler`(2) |
| [`text_editor`](gallery/text_editor/README.md) | EVG/SoftCanvas multiline text-editor prototype | 10 | — | `game_engine`(4) `evg`(4) `pdf_writer`(2) `office`(1) |
| [`odp`](gallery/odp/README.md) | OpenDocument presentation reader, drawn by the PPTX painter | 6 | — | `office`(4) `xml`(2) `evg`(2) `pptx`(2) `odf`(1) |
| [`odf`](gallery/odf/README.md) | What the ODF readers share: one container for `.odt` / `.ods` / `.odp` | 2 | — | `zip`(2) `pdf_writer`(1) |
| [`r5`](gallery/r5/README.md) | The markdown page as a Ranger app | 4 | — | `evg`(9) `datagrid`(3) `pptx`(3) `markdown`(2) `game_engine`(2) `ui`(1) `docx_viewer`(1) |
| [`watch_evg`](gallery/watch_evg/README.md) | EVG on the watch | 8 | — | `evg`(12) |
| [`invaders`](gallery/invaders) | Terminal Space Invaders, including the LLVM backend | 1 | — | — |
| `process_counter_{ios,android,board}` | Native and React hosts for the same `@process` demo | 1 each | — | — |
| `evg_video`, `unary_minus_test` | No Ranger source / one compiler regression case | 0–1 | — | — |

## Components that are not in a directory of their own

Each of these is a self-contained implementation of a published format or a
general-purpose engine. None is reachable except by counting `../` into a
larger tree, and none can be depended on by name.

| What it is | Where it lives | Files | Who reaches it |
| --- | --- | --: | --- |
| **JavaScript / TypeScript engine** — `ComponentEngine`, `EvalValue`, `Regex`, BigInt, `DateTime`, Unicode case / normalisation / collation, Intl locale data and plurals | `gallery/game_engine/v2/interp/migrate/src` | 14 | `gallery/mfiles` by `../../../game_engine/v2/interp/migrate/src/` |
| **JPEG codec** — baseline and progressive decoder, encoder, EXIF metadata | `gallery/pdf_writer/src/jpeg` | 11 | `gallery/evg`, `gallery/datagrid`, forked into `game_engine/v2/imaging/jpeg` |
| **TrueType stack** — `TrueTypeFont`, `FontManager`, subsetting | `gallery/pdf_writer/src/fonts` | 4 | `evg`, `pptx`, `docx_viewer`, forked into `game_engine/v2/imaging/fonts` |
| **Rasteriser** — vector rasteriser, compositing, blur, gradients, PNG encoder, DEFLATE | `gallery/pdf_writer/src/raster` | 10 | `evg`, `book`, forked into `game_engine/v2/imaging/raster` |
| **PNG decoder** | `gallery/game_engine/v2/imaging/png` | 1 | `evg/tools` — while `evg` itself imports a *different* copy, `game_engine/lpc/src/png_decoder.rgr`; there is a third in `v2/lpc/src` |
| **PlantUML reader** — entities, activities, sequences, and a renderer | `gallery/rangerflow/domains/plantuml` | 5 | `rangerflow` only |
| **Mermaid, D2 and Graphviz readers** | `gallery/rangerflow/domains/{mermaid,d2,graphviz}` | 42 | `rangerflow` only |
| **Graph layout** — layered layout, edge routing, lanes, oriented ports | `gallery/rangerflow/{core,layout}` | 21 | `statechart`, `codegraph`, `rangerdbviewer` |
| **three.js port** | `gallery/game_engine/v2/three/port` | 88 | `game_engine` only |
| **Cannon physics port** | `gallery/game_engine/v2/physics` | 65 | `game_engine` only |
| **LPC sprite pipeline** — sprite packing, palettes, compositing | `gallery/game_engine/v2/lpc`, and again at `gallery/game_engine/lpc` | 20 + 20 | `game_engine`; `evg` takes the PNG decoder out of the older copy |
| **Mesh editor and tessellator** | `gallery/game_engine/v2/mesh_editor` | 2 | `game_engine` only |

The JS engine is the sharpest case. It is a JavaScript interpreter with its
own realm, module isolation, regular expressions, Unicode tables and Intl
data — the thing `gallery/mfiles` runs M-Files UIX extensions on — and its
address is `gallery/game_engine/v2/interp/migrate/src/ComponentEngine.rgr`,
six directories inside a game demo, in a folder called `migrate`.

`game_engine/v2` is already enforcing package boundaries by hand, which is
the clearest argument that it wants a manifest. `v2/tests/check_boundaries.py`
fails the build on any `Import` that resolves outside `v2/`, with
`gallery/evg` sanctioned as a shared root and everything else listed in
`v2/tests/boundary_import_allowlist.txt` — a file whose header reads "NEW
escapes must NOT be added here — fix the Import instead." Seven of its
entries are the JS engine reaching `ts_parser`, and `npm run engine:v2:test`
currently fails the gate on two more that nobody allowlisted: the same
engine's `../../../../../../lib/core/RgNum.rgr` and `RgText.rgr`. That is a
hand-written `ranger.json` with no resolver behind it. Note that a `pkg:`
spelling would not satisfy the gate as written — it resolves import strings
as paths — so teaching it about `pkg:` is part of the work in step 3.

## The same code in more than one place

`scripts/inventory.mjs --dups` reports **264 file names that occur more than
once** under `gallery/`, `lib/`, `pkg/` and `compiler/`, **107 of them with
diverged contents**. Two structures account for most of it.

**`gallery/game_engine` holds two generations at once.** 394 files outside
`v2/`, 407 inside it, **229 sharing a name — 146 byte-identical, 83
diverged**. Both are live: `gallery/evg` imports the v1 PNG decoder while
`gallery/evg/tools` imports the v2 one.

**`game_engine/v2/imaging` is a fork of `pdf_writer`'s imaging stack.**

| File | `pdf_writer` | `game_engine/v2/imaging` | |
| --- | --: | --: | --- |
| `JPEGDecoder.rgr` | 809 | 787 | diverged |
| `JPEGEncoder.rgr` | 1542 | 1515 | diverged |
| `JPEGMetadata.rgr` | 806 | 748 | diverged |
| `ProgressiveJPEGDecoder.rgr` | 1155 | 1094 | diverged |
| `JPEGReader.rgr` | — | — | identical |
| `TrueTypeFont.rgr` | 1871 | 581 | diverged |
| `FontManager.rgr` | 582 | 319 | diverged |
| `RasterText.rgr` | 810 | 1049 | diverged |
| `PNGEncoder.rgr` | 388 | 347 | diverged |
| `Inflate.rgr` (vs `lib/zip`) | 676 | 653 | diverged |
| `ZipReader.rgr` (vs `gallery/zip`) | 339 | 324 | diverged |

It has diverged in **both directions** — `TrueTypeFont` and `FontManager`
are far ahead in `pdf_writer`, `RasterText` is 239 lines ahead in
`game_engine`. So neither copy is the newer one and neither can simply be
deleted. Whoever reconciles these has to read both.

ZIP is in three places at once: `lib/zip` (DEFLATE, buffers),
`gallery/zip` (the container) and `game_engine/v2/imaging/zip` (all six
files again, diverged). The JSX evaluator is in two —
`pdf_writer/src/jsx/ComponentEngine.rgr` at 7 296 lines and
`game_engine/v2/interp/migrate/src/ComponentEngine.rgr` at 44 996.

Not every repeated name is a fork. `graphql/src/core/Parser.rgr` and
`rangersql/src/core/Parser.rgr` are two different parsers that happen to be
named the same, which is normal — and which turned out to be the one thing
in-repo packaging could not do. See below.

## What testing the packaging found

`tests/compiler-pkg-import.test.ts` covered `pkg:` against two fixture
packages written for it. Pointed at the real trees, three things came out.

**1. `pkg/ranger.json` declared a dependency that could not exist.** It read
`"zip": { "path": "../zip" }` — `/zip` from the repository root, which is not
a directory. The real import was a relative `../../lib/zip/Inflate.rgr`, so
nothing had ever tried to resolve the declaration. The same manifest carried
`"license": "AGPL-3.0-or-later"` while `pkg/README.md` and
[`LICENSING.md`](LICENSING.md) both place `pkg/` on the MIT side on purpose.

**2. Two packages could not each have a `Token.rgr`.** This compiled nothing:

```ranger
Import "pkg:rangersql"
Import "pkg:graphql"
```

```text
[FAIL] Unknown type for array values: GqlToken
    27 │     def tokens:[GqlToken]
```

Swap the two imports and it is `SqlToken` that is unknown. Both packages
carry `src/core/{Token,Tokenizer,Parser}.rgr` and each imports its own by the
bare name, and `ctx.already_imported` was keyed on the **import string**:
`rangersql`'s `Import "Token.rgr"` marked `"Token.rgr"` as done, so
`graphql`'s was skipped. What then failed was a type in the dropped file,
reported at its use — pages from the import, with nothing pointing at the
collision.

A second key on the resolved path already existed, added so that
`../../evg/X.rgr` and `pkg:evg/X.rgr` would fold to one file. It was checked
*after* the string key, so it never got the chance.

`compiler/ng_RangerFlowParser.rgr` now keys only on the folded path, at both
import sites. The string is still the key for source an `import_loader`
plugin produced, which has no path to fold. A file already merged no longer
`return`s from `mergeImports` either — it merges an empty source instead, so
the node is neutralised exactly as a real merge leaves it. Returning early
left the node spelled `Import "Token.rgr"`, and `WalkCollectMethods` then
resolved it a second time against the outer library paths, where a name
relative to a package is not findable.

**3. Everything else worked.** Once those were fixed:

- a gallery package by name, `Import "pkg:zstd"`;
- a dependency of a dependency — the project declares `statechart`,
  `statechart`'s manifest declares `vela`, and nothing names `vela`;
- the same one level down — `vela`'s manifest finds `evg`;
- `zip`, `rangersql` and `graphql` in one program, same-named files intact;
- `pkg:` inside a package that is itself reached by a **relative** path, so
  moving a component to `pkg:` does not force its consumers to move;
- and the compiler bootstrapping itself with a `pkg:` import in its own
  source — `compiler/PkgFetch.rgr` → `pkg/src/GitZlib.rgr` →
  `pkg:zipcore/Inflate.rgr` — then compiling and passing the 77-case `pkg`
  suite with the compiler that came out.

The last one is the answer to the question this started with: in-repo
packaging works, including for the compiler's own sources.

## What changed in this pass

Manifests, for the components that are packages today — no file moved and no
relative import broke:

| | Name | Entry |
| --- | --- | --- |
| `lib/zip` | `zipcore` | `Inflate.rgr` |
| `gallery/zip` | `zip` | `ZipReader.rgr` |
| `gallery/zstd` | `zstd` | `src/ZstdDecoder.rgr` |
| `gallery/vfs` | `vfs` | `src/Vfs.rgr` |
| `gallery/cpp_parser` | `cpp_parser` | `cpp_parser.rgr` |
| `gallery/js_parser` | `js_parser` | `js_parser_core.rgr` |
| `gallery/ts_parser` | `ts_parser` | `ts_parser_simple.rgr` |
| `gallery/graphql` | `graphql` | `src/Gql.rgr` |
| `gallery/rangersql` | `rangersql` | `src/core/Sql.rgr` |
| `gallery/rangerdb` | `rangerdb` | `src/RangerDB.rgr` |

`lib/zip` is `zipcore` rather than `zip` because `gallery/zip` is `zip`: the
container reader and the DEFLATE primitives are different things on different
sides of the licence line, and two packages cannot share a name.

Eight imports moved to `pkg:`, chosen because each is a real dependency
between two packages and each is covered by a suite that was run:

- `pkg/src/GitZlib.rgr` → `pkg:zipcore/Inflate.rgr`
- `gallery/zip/ZipReader.rgr` → `pkg:zipcore/{Inflate,ZipBuffer}.rgr`
- `gallery/zip/ZipWriter.rgr` → `pkg:zipcore/ZipBuffer.rgr`
- `gallery/vfs/src/VfsCore.rgr` → `pkg:zip/CRC32.rgr`
- `gallery/rangerdb` (3 sites) → `pkg:rangersql/…`

`gallery/zip` and `pkg` now reach outside themselves zero times.

The compiler change is in `compiler/ng_RangerFlowParser.rgr`, and
`bin/output.js` — the compiled compiler this repository builds with — was
rebuilt from it with `npm run compile`.

`tests/gallery-pkg-import.test.ts` and `tests/fixtures/pkg/gallery_app/` are
the six cases listed above. The `Token.rgr` case is a regression guard, not
a smoke test: it is the one that failed.

`npm run inventory` and `npm run inventory:dups` are `scripts/inventory.mjs`,
which produces every number in this document.

## What is left, in the order it is worth doing

**1. Turn `evg`'s dependencies around.** It is the only item here that makes
the others honest, because `evg` is what twenty-five components import. The
imaging stack it needs — JPEG, PNG, fonts, rasteriser — is in `pdf_writer`
and forked in `game_engine`. Extracting it to `gallery/imaging` as one
package, with the two forks reconciled, turns `evg`'s manifest from a claim
into a fact and drops `pdf_writer`'s 109 `../evg/` imports to a declared
dependency.

**2. Reconcile `game_engine` v1 and v2.** 83 diverged files with the same
name, and `evg` importing across the split. Nothing else in the gallery can
be cleanly packaged while the largest tree in it has two of everything.

**3. Lift the JS engine out.** `gallery/js_engine`, depending on
`ts_parser`, `lib/core` and (for `JSXToEVG` only) `evg`. `mfiles` gets
`pkg:js_engine` in place of `../../../game_engine/v2/interp/migrate/src/`,
and the interpreter stops being a subdirectory of a game.

**4. Finish `gallery/ui`.** 202 imports to convert, mechanically, one file at
a time — the compiler already folds both spellings to the same file. The
manifest is already written.

**5. Package the diagram readers.** `gallery/rangerflow/domains/plantuml`,
`mermaid`, `d2` and `graphviz` read published formats and are useful without
a graph editor. The layout code under `core/` and `layout/` is already
depended on by three other components through `../`.

**6. Then the document formats.** `xml`, `css`, `ooxml`, `odf`, `office` are
small and shared and want manifests; the viewers above them do not need one
until they are asked to be depended upon.

**7. `lib/core` wants an umbrella file before it wants a manifest.** There is
no single import that means "the core": a package needs an `entry`, and
picking `RgText.rgr` for it would be arbitrary.

None of this is urgent. A relative import still compiles, and the gallery has
been built entirely on relative imports. What the manifests buy is that a
component can be taken out and used — and, read together, they are the only
document that says which way the arrows are supposed to point.
