# PLAN_FORMATS.md — reading more than three formats

`.docx`, `.xlsx` and `.pptx` are in. This is the plan for what comes after
them, in the order it should be built and with the reason each step comes
where it does.

It is a plan about **layers**, not about a format list. Forty readers bolted
onto three applications is not an engine; the same forty converging on four
internal models, over one container, one encoding layer and one scene, is.

> **Read first:** [`gallery/ooxml/README.md`](gallery/ooxml/README.md) and
> [`gallery/office/README.md`](gallery/office/README.md). This document extends
> the roadmap in those two; where they disagree with this one, they are the
> ones with the code under them.

---

## The two rules this plan is built on

Both were learned here, expensively, and both are quoted from the READMEs of
the directories that learned them.

**1. Merge the infrastructure, not the models.**

> Don't merge Word, Excel and PowerPoint into one document model. Merge the
> infrastructure underneath them.
> — `gallery/ooxml/README.md`

Adding ODF, PDF and HTML makes that rule more important, not less. A
`UniversalDocument` that holds a paginated Word file, a spreadsheet, a slide
deck, a PDF page's graphics and an HTML flow would be worse at all five.

**2. A shared module with one caller is how the old copy survives underneath
it.**

`OfficeId` was built, tested on two targets, and then deleted again because it
had no callers. Every phase below therefore states **who its second caller
is**, and a phase that cannot name one is not scheduled.

---

## 1. The layer stack

Every format this repository will ever read decomposes the same way. Naming
the layers is what makes a new format an addition rather than a new
application.

```text
                bytes
                  │
        ┌─────────▼─────────┐
        │  container        │  ZIP · OCF · OLE2 · plain file · tar
        └─────────┬─────────┘
                  │  named parts / one stream
        ┌─────────▼─────────┐
        │  encoding         │  XML · JSON · CSV · thrift · binary records
        └─────────┬─────────┘
                  │  tags, attributes, spans — no semantics
        ┌─────────▼─────────┐
        │  format reader    │  WordprocessingML · ODF · PDF objects · HTML
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  model            │  RichDocument · WorkbookModel · PptxModel ·
        └─────────┬─────────┘  DataChunk · GraphModel
                  │
        ┌─────────▼─────────┐
        │  resolve          │  styles, themes, inheritance, formulas
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  scene            │  OfficeScene → EVG display list
        └─────────┬─────────┘
                  │
     ┌────────────┼────────────┬───────────┐
     ▼            ▼            ▼           ▼
   HTML          SVG          GPU         PDF        a11y tree
```

Today exactly **one** of those layers is shared: the container, as
`gallery/ooxml/OpcPackage.rgr`. The encoding layer is written four times. That
is the single fact that decides the order of everything below.

---

## 2. What exists today

Written down because a roadmap that starts from a diagram instead of from the
repository plans work that is already done, and skips work that is not.

### Container

| | where | state |
| --- | --- | --- |
| ZIP read + DEFLATE decode | `gallery/zip/ZipReader.rgr`, `Inflate.rgr` | works |
| ZIP write | `gallery/zip/ZipWriter.rgr` | **STORED only** — `addFile` sets `compressionMethod = 0`; there is no deflate compressor in the tree |
| second copy of both | `gallery/game_engine/v2/imaging/zip/` | a duplicate, imported by the PNG decoder |
| OPC (parts, content types, relationships) | `gallery/ooxml/OpcPackage.rgr` (638 lines) | one reader, three formats, one invariant test |
| OLE2 compound file | `gallery/datagrid/src/xlsx/XlsxOfficeCrypto.rgr` | detection + unwrap for encrypted `.xlsx` only |

### Encoding — four XML readers

| | lines | shape | source spans | namespaces |
| --- | --- | --- | --- | --- |
| `gallery/pptx/src/PptxXml.rgr` | 527 | DOM | **yes** (`srcStart`/`srcEnd`) | prefixes stripped from element names |
| `gallery/datagrid/src/xlsx/XmlLite.rgr` | 358 | scanner, reused tag instance | no | stripped |
| `gallery/docx_viewer/src/WordXml.rgr` | 220 | string helpers, no tree | no | n/a |
| `gallery/evg/SvgParser.rgr` | 1736 | importer straight to vector items | no | n/a |
| entity decoding | `gallery/ooxml/OoxmlText.rgr` | shared by the first three | — | — |

Only `PptxXml` carries spans, and that is exactly why `.pptx` is the only
format with full source-preserving save. The capability is a property of the
XML layer, and two of three OOXML readers do not have one.

JSON is in better shape: `lib/JSON.rgr` plus per-consumer readers
(`gallery/vela/src/VlJson.rgr`, `gallery/game_engine/v2/model3d/GltfJson.rgr`).
CSV does not exist at all — there are `.csv` files under `gallery/vela/web/data/`
and nothing in the tree that reads one.

### Models

| model | where | what it is |
| --- | --- | --- |
| `RichDocument` | `gallery/docx_viewer/src/RichDocument.rgr` | blocks, runs, tables, styles — a paginated rich document |
| `WorkbookModel` / `SpreadsheetModel` | `gallery/datagrid/src/` | sheets, cells, formulas, styles |
| `PptxModel` | `gallery/pptx/src/PptxModel.rgr` | slides, shapes, masters — DrawingML-shaped |
| `DataChunk` / `ValueVector` | `gallery/rangerdb/src/DataChunk.rgr` | columnar, chunk at a time |
| `GraphModel` | `gallery/rangerflow/core/GraphModel.rgr` | nodes and edges, with ERD/UML/flowchart domains on it |

**Four of the five internal models already exist.** What does not exist is the
resolved scene between them and EVG — `OfficeScene`, item 10 of the ooxml
roadmap — which is why it turns up as a gate below rather than as a wish.

### Shared machinery already lifted

`OfficeFont`, `OfficeTextMetrics`, `OfficeStyle` (the unset / inherited /
explicitly-false tri-state), `OfficeColor`, `OfficeHistory`, `OfficeAsset`,
`OfficeGeomFormula` + 187 presets, `OfficeShapePicker`, `CssCore` (parser,
selectors, specificity, cascade — with two consumers already: EVG and
`PptxCss`), `EVGDisplayList` (one walk, many backends), `EVGA11yTree`.

### Output side

PDF **write** exists (`gallery/pdf_writer/EVGPDFRenderer.rgr`), as do HTML
write (`EVGHTMLRenderer`), PNG write (`raster/PNGEncoder`), SVG write
(`gallery/vela/src/VlSvg.rgr`) and JPEG encode. Reading is the thin side of
this repository, which is what this plan is about.

---

## 3. The four internal models, and where a format lands

```text
DOCX · ODT · EPUB · HTML · Markdown · RTF
                    ↓
              RichDocument                 (paragraphs, runs, tables, floats)

XLSX · ODS · CSV · Arrow · Parquet · SQL
                    ↓
              DataChunk / WorkbookModel    (cells and columns)

PPTX · ODP · SVG · PDF page graphics
                    ↓
              OfficeScene                  (resolved, paintable, hit-testable)

DBML · GraphML · database metadata
                    ↓
              GraphModel                   (nodes and edges)
```

Three consequences worth stating before any of it is built, because each one
is a decision that is cheap now and expensive later.

**ODT joins `RichDocument`; ODP does not join `PptxModel`.** `RichDocument` is
already close to neutral — `DocxA11y` builds the accessibility tree from its
*blocks*, not from WordprocessingML — so an ODT reader targeting it is a
reader, not a merge. `PptxModel` is not neutral: it holds DrawingML preset
shape **names**, `p:ph` placeholder types and colour map overrides. ODP states
all three differently. Pointing an ODP reader at `PptxModel` would either
corrupt the model with a second vocabulary or lose the ODP file's meaning. ODP
therefore gets its own reader and converges at `OfficeScene`, which is where
two presentation formats genuinely have something in common: a page of
resolved, positioned, painted things.

**PDF has no document model, only a scene**, and that is what makes it the
right first customer for `OfficeScene`. A PDF content stream is graphics
operators. There is no paragraph in it to recover — recovering one is a
separate, lossy, later feature. So PDF read does not need a document model at
all, and building one for it would be inventing the wrong thing.

**`OfficeScene` must never grow back into a document model.** The ooxml README
already calls this the hard rule. With PDF, ODP and SVG all landing on it the
pressure to add "just a paragraph" will be constant, and every time it is
answered the layer stops being paintable output.

---

## 4. What "supported" means — four levels

A format list without this column is how a roadmap lies. ODT at L0 is a
week; ODT at L2 is a quarter, and it is the same row in the table.

| | level | the contract | what it costs |
| --- | --- | --- | --- |
| **L0** | extract | text and data come out, structure approximate | a reader |
| **L1** | view | renders faithfully enough to recognise | reader + resolve + scene |
| **L2** | edit | opens, edits, saves — **and does not damage what it did not understand** | + source preservation, + writer, + round-trip corpus |
| **L3** | author | creates one from scratch | + defaults, templates, a UI |

L2 is the level that is not a bigger version of L1. It requires the encoding
layer to carry spans, an opaque-node mechanism (`PptxOpaque`, `SheetOpaque`),
and a resolver whose output can be recognised as *unchanged inheritance*
rather than as a baked value — the signature mechanism described in the ooxml
README. Where a phase below targets L2, it inherits that whole apparatus, and
that is why the encoding layer comes first.

Where the existing three stand today: `.pptx` L2, `.xlsx` L2, `.docx` L1 with
editing and a save that is not yet source-preserving.

---

## 5. The phases

Each phase names its **second caller** and its **gate**. A gate is what must be
true before the next phase starts — not a wish, a test that runs.

---

### Phase 0 — the encoding layer and the registry

**Nothing user-visible ships in this phase.** It is here because every phase
after it is twice the size without it, and because ODF alone would otherwise
add a fifth, sixth and seventh XML reader to a tree that already has four.

**0a. `gallery/xml/XmlCore.rgr` — one XML reader.**

Modelled on `gallery/css/CssCore.rgr`: a leaf module in its own directory,
shared by consumers that do completely different things with the result.

Requirements, each one taken from a reader that needs it and does not have it:

- **Source spans on every node**, as `PptxXml` has them. This is what L2 is
  built on, and `.docx` and `.xlsx` cannot reach L2 without it.
- **Real namespace handling.** `PptxXml` strips prefixes (`p:sp` → `sp`) and
  that is survivable in OOXML. It is not survivable in ODF, where
  `text:style-name`, `draw:style-name` and `style:name` are three different
  attributes and `text:p` and `draw:p` are different elements.
- **A scanning mode as well as a DOM mode.** `XmlLite` exists because a
  worksheet with a million cells must not become a million node objects. One
  reader, two traversal APIs over the same tokenizer — not two readers.
- **The XXE-safe entity policy** already in `OoxmlText`: the five predefined
  entities and numeric references, no external entities, ever.

*Second caller:* three on day one — `PptxXml`, `WordXml` and `XmlLite` are
retired onto it, in that order, `PptxXml` first because it is the reference
shape.

*Not retired:* `gallery/evg/SvgParser.rgr`. `gallery/evg` may not import
`gallery/office` or the office side of the gallery, and that boundary is worth
more than removing one duplicate. If a consumer outside the office stack ever
needs the core, that is the moment to move it to `lib/` under MIT — and the
moment to decide, not now.

**0b. `DocumentFormatAdapter` — the registry.**

Ooxml roadmap item 12, promoted to Phase 0 because from here on every phase is
"register an adapter" and without it every phase is also "teach the shell about
one more extension".

```text
DocumentFormatAdapter
    sniff(bytes) -> confidence      content first, extension only as a tiebreak
    load(bytes)  -> model
    save(model)  -> bytes           optional
    capabilities                    canEditShapes, canEditFormulas, hasPages …
    createEmpty()                   optional
```

The point is the third line. `doc.capabilities.canEditShapes` replaces
`fileExtension == ".pptx"`, and a new format stops being a change to the shell.

*Second caller:* the three existing apps, registered as three adapters.

**0c. The container, tidied.**

- **One `Inflate`.** `gallery/game_engine/v2/imaging/zip/` is a copy; retire it
  onto `gallery/zip`.
- **A deflate compressor** for `ZipWriter`. Today every package this repository
  writes is stored uncompressed. That is defensible for a fixture and not for
  a deck with photographs in it.
- **First-entry and stored-entry control** in `ZipWriter`. ODF requires
  `mimetype` to be the first entry, STORED, with no extra field. EPUB requires
  exactly the same of its own `mimetype`. Two formats, one small API.
- **`Ocf`**, the EPUB/ODF container convention (`META-INF/container.xml`), as a
  thin layer beside `OpcPackage` rather than inside it. It is not OPC: no
  content types part, no relationship graph.

**Gate for Phase 0.**
1. `pptx`, `docx`, `datagrid` suites green on **both** JavaScript and C++ — the
   two targets that disagree about what a string is, which is how `OoxmlText`
   came to exist in the first place.
2. `pptx_oracle_dump`, `docx_oracle_dump`, `xlsx_oracle_dump` byte-identical
   before and after. This phase moves a walk; it must not change what anyone
   sees.
3. `pptx:writer:verify` still resolves every reference in a written package.
4. Grep proves it: no `<` scanning left in `pptx/src`, `docx_viewer/src` or
   `datagrid/src/xlsx` outside the retired facades.

---

### Phase 1 — ODF: ODT, ODS, ODP

First because it is the phase Phase 0 was built for, because three target
models already exist, and because it is the difference between a Microsoft
OOXML engine and an office engine.

ODF is ZIP + XML + styles + assets. The container is `Ocf`, the encoding is
`XmlCore`, the styles resolve through `OfficeStyle`'s tri-state, colours
through `OfficeColor`, fonts through `OfficeFont`, images through
`OfficeAsset`. The reader is the only new part, which is the whole point of
Phase 0.

**1a. ODT → `RichDocument`.** Smallest jump: `office:text` is a flow of
`text:p` / `text:h` with `text:span` runs, `text:list` and `table:table`, and
`RichDocument` already holds all four. Target **L1**, then L2.

**1b. ODS → `WorkbookModel`.** `table:table-cell` with `office:value-type`,
repeated columns and rows as `table:number-columns-repeated` — the compression
scheme is the one real surprise, and it is a reader detail. The formula
language is not: ODF writes `of:=SUM([.A1:.A5])` where SpreadsheetML writes
`SUM(A1:A5)`. `FormulaEngine` should not learn a second syntax; the ODS reader
translates references at read time and the workbook holds one language.

**1c. ODP → its own model, converging at `OfficeScene`.** Explicitly last, and
explicitly not pointed at `PptxModel`, for the reasons in §3. Target **L1** —
L2 for ODP means an opaque-node design of its own and should be scheduled
separately with evidence from real files.

**Gate for Phase 1.** `OoxmlPackageTest` today reads *one sentence, identically,
out of all three OOXML packages.* Extend it to six. That single test is what
proves the reader/model separation is real rather than drawn, and it is the
cheapest test in this plan.

Plus: an ODF conformance corpus, and an `.odt` written by this repository that
LibreOffice opens without a repair dialog — the ODF equivalent of
`tools/check_preserve.py` opening our `.xlsx` files with openpyxl. A reader
that has never seen our model is the only honest referee.

---

### Phase 2 — PDF read, and `OfficeScene`

The largest single capability jump in this plan, and much cheaper than it
looks, because **PDF's three hardest decoders are already in this repository**:

| PDF filter | what it needs | where it already is |
| --- | --- | --- |
| `FlateDecode` | raw DEFLATE | `gallery/zip/Inflate.rgr` |
| `DCTDecode` | baseline + progressive JPEG | `gallery/pdf_writer/src/jpeg/JPEGDecoder.rgr`, `ProgressiveJPEGDecoder.rgr` |
| embedded fonts | TrueType glyph outlines, `cmap`, metrics | `gallery/pdf_writer/src/fonts/TrueTypeFont.rgr` |

What is actually new is the object layer and the interpreter.

```text
2a  object layer     lexer, xref table AND xref streams, object streams,
                     indirect references, streams, linearized files
2b  filters          Flate ✓, DCT ✓, ASCIIHex, ASCII85, LZW, RunLength
2c  content stream   the operator interpreter: graphics state stack, path
                     construction and painting, text state, Tj/TJ/Tm,
                     XObjects (Form and Image), inline images, colour spaces
2d  fonts            standard 14 widths, embedded TrueType ✓, Type1/CFF,
                     CID fonts and CMaps — this is where text extraction
                     either works or produces mojibake
2e  scene            content stream → OfficeScene → EVGDisplayList → viewer
2f  on top           text extraction (L0), page thumbnails, AcroForm fields
```

**`OfficeScene` is built here**, not before, because this is where it gets a
caller that is not a refactor. `SceneText`, `SceneImage`, `ScenePath`,
`SceneGroup`, each carrying `bounds`, `transform`, `style`, `entityId` and
`semanticRole`. PDF produces it directly; `PptxResolver`'s resolved scene and
DOCX's `LaidPage`/`LaidLine` move onto it after, one at a time, each with its
oracle dump unchanged.

That ordering also settles ooxml roadmap item 11 — hit testing, thumbnails,
print, selection overlays and the accessibility tree stop being three walks
and become one, but only once there is a third producer to prove the shape.

**Out of scope for the first landing, and stated so it is not discovered
later:** encrypted PDFs, JBIG2, JPX/JPEG 2000, CCITT G3/G4, tagged-PDF
structure recovery, and JavaScript in forms.

**Gate for Phase 2.** A corpus of real PDFs rendered against a reference
renderer, compared the way `gallery/vela` compares its scene against Vega's
own SVG: flatten both and compare the geometry. Golden files pin what changed;
they cannot say what was never right.

---

### Phase 3 — HTML/CSS, Markdown, EPUB

One phase, because the second and third are small once the first exists.

`CssCore` is already here with two consumers. `EVGLayout` already does block
and flex layout, `EVGTextEngine` already does line breaking, `EVGDisplayList`
already reaches every backend. What is missing is the **HTML tree builder** —
tokenizer, implied tags, the small pile of parse-error recovery that makes
real-world HTML readable — and the mapping from element + computed style to
`EVGElement`.

```text
3a  HtmlParser     markup → element tree (error-tolerant)
3b  CSS binding    CssCore cascade → EVGElement style, honestly reporting
                   what is not supported (PptxCss.unsupported is the pattern)
3c  Markdown       CommonMark subset → the same element tree, ~600 lines
3d  EPUB           Ocf container → OPF spine → XHTML per chapter → paginate
                   through EVG's existing page-break flow
```

The strategic argument is not EPUB. It is that this phase closes the loop in
both directions at once:

```text
HTML ─┐                      ┌─► HTML   (EVGHTMLRenderer, exists)
MD   ─┤                      ├─► SVG    (exists)
EPUB ─┼─► EVGElement ────────┼─► PDF    (EVGPDFRenderer, exists)
DOCX ─┘      + CssCore       ├─► PNG    (exists)
                             └─► GPU    (exists)
```

Every arrow on the right already works. This phase adds three on the left.

**Gate for Phase 3.** `DOCX → HTML` and `HTML → PDF` both go through this one
path, and an EPUB paginates without EPUB knowing anything about pagination.
If EPUB needs a special case in the layout engine, the mapping in 3b is wrong.

---

### Phase 4 — data: CSV, Arrow, Parquet

`DataChunk` and `ValueVector` are the target and they already exist. The
adapter shape mirrors Phase 0b: `DataSourceAdapter { sniff, open, schema,
scan }` handing back chunks.

**4a. CSV/TSV.** Cheap, immediately useful, and the consumer is already
built — DataGrid renders whatever `WorkbookModel` holds. The work is dialect
detection (delimiter, quoting, embedded newlines, BOM), type inference that
can be overridden, and being honest about ambiguity rather than guessing a
date format silently.

**4b. Arrow IPC.** The one to look at carefully before writing, because
`ValueVector` is *close to* Arrow and not the same:

| | `ValueVector` | Arrow |
| --- | --- | --- |
| nulls | `nulls:[boolean]` | validity **bitmap** |
| strings | `strings:[string]` | offsets buffer + one data buffer |
| layout | tagged struct-of-arrays | typed buffers, zero-copy |

The decision is whether Arrow is *converted into* `ValueVector` or whether
`ValueVector` grows an Arrow-compatible buffer layout. Converting is simpler
and forfeits the zero-copy property that is the entire reason Arrow exists.
Recommended: convert first, so Parquet and Arrow both land; revisit the layout
only when there is a measured scan that the copy dominates.

**4c. Parquet.** Genuinely large, and one dependency is missing: Parquet's
usual codec is **Snappy**, which is not in this tree. `Inflate` covers the GZIP
codec only. Snappy decompression is small (~200 lines) and must be written
before Parquet reads a file anyone else produced. The rest is thrift-encoded
metadata, dictionary pages, RLE/bit-packed hybrid encoding, and definition and
repetition levels for nested columns.

**Gate for Phase 4.** The same table read from `.xlsx`, `.csv`, `.parquet` and
an Arrow stream produces the same `DataChunk`, and the DataGrid cannot tell
which one it got.

---

### Phase 5 — SQLite as a file, and GeoPackage

`gallery/rangerdb` reaches SQLite through `host/driver_sqlite.cjs`, and that
host is a Node process. The browser build of `rangerdbviewer` says so honestly
on the page: pressing SQLite there reports that it needs a host.

A **pure-Ranger SQLite file reader** — header, b-tree pages, the record format,
`sqlite_schema` — removes that limit, and it compiles to every target Ranger
has, so a static page can open a real database and a Swift or C++ build can
too. Read-only first: reading a page format is a bounded problem, writing one
with a rollback journal is not.

**GeoPackage** is then close to free: it is SQLite with agreed table names and
a binary geometry blob. That is Phase 7 work done in Phase 5's shadow.

*Second caller:* `rangerdbviewer`'s browser build and `RangerDB`'s introspection
tests, both of which exist and both of which currently stop at the host
boundary.

---

### Phase 6 — the shared decode surface, and raster assets

The office README names the blocker precisely: `RichDocument` imports the PDF
writer's `ImageBuffer` directly, and lifting it "needs a shared decode surface
that does not exist yet".

```text
ImageCodec
    sniff(bytes) -> format
    decode(bytes) -> ImageBuffer          RGBA, premultiplied, known origin
    metadata(bytes) -> size, dpi, orientation, colour profile
```

- **PNG** — `PNGDecoder` exists in `gallery/game_engine/v2/imaging/png/`; lift
  it, and retire the second `Inflate` with it (Phase 0c did half of this).
- **JPEG** — exists, baseline and progressive, with EXIF orientation.
- **WebP** — lossy is a VP8 intra decoder, lossless is a different format
  sharing a container. Two jobs, not one.
- **AVIF** — an AV1 intra decoder. Honestly: this is the largest single item in
  this document, larger than PDF read, and it should be a host codec or
  nothing until something needs it.
- **SVG in a document** — `gallery/evg/SvgParser.rgr` already produces resolved
  vector items. What is missing is the bridge that lets a `.docx` or a slide
  hold one, which is an `OfficeScene` producer and therefore waits for Phase 2.

---

### Phase 7 — the domain formats

Small, each one landing on a model that already exists. Order within the phase
should follow whichever application asks first; none of them blocks another.

| format | model | notes |
| --- | --- | --- |
| **GeoJSON** | scene / `GraphModel` | JSON is in; the work is projection and simplification, not parsing |
| **iCalendar `.ics`** | domain | line unfolding, RRULE, and time zones — RRULE is the whole job |
| **vCard `.vcf`** | domain | same folding rules as ICS; write them once |
| **DBML** | `GraphModel` | RangerFlow's ERD editor is the consumer, and it exists |
| **GraphML** | `GraphModel` | XML on `XmlCore`; a day's work after Phase 0 |
| **glTF / GLB** | 3D | `GltfJson.rgr` and `GlbImporter.rgr` already exist in `game_engine/v2/model3d/` |
| **MusicXML** | scene | the best layout benchmark in the list — it is typography with rules |
| **WebVTT / SRT** | timed text | small; `gallery/evg_video` is the consumer |
| **DXF** | scene | large, entity-by-entity, and only worth it with a CAD-shaped consumer |
| **TAR** | container | trivial beside ZIP, and it makes `.tar.gz` fixtures possible |

---

## 6. The whole table, in order

| Phase | Format | Level target | Container | Encoding | Model | New work is |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | — | — | ZIP, OCF | `XmlCore` | — | the layers themselves |
| 1 | ODT | L1 → L2 | OCF | XML | `RichDocument` | reader |
| 1 | ODS | L1 → L2 | OCF | XML | `WorkbookModel` | reader + formula translation |
| 1 | ODP | L1 | OCF | XML | own → `OfficeScene` | reader + scene |
| 2 | PDF | L0 + L1 | plain | binary | `OfficeScene` | objects + interpreter + `OfficeScene` |
| 3 | HTML/CSS | L1 | plain | markup | `EVGElement` | tree builder + CSS binding |
| 3 | Markdown | L1 | plain | text | `EVGElement` | small parser |
| 3 | EPUB | L1 | OCF | XHTML | `EVGElement` | spine + pagination |
| 4 | CSV/TSV | L1 | plain | text | `DataChunk` | dialects + inference |
| 4 | Arrow | L0 | plain | binary | `DataChunk` | IPC + layout bridge |
| 4 | Parquet | L0 | plain | binary | `DataChunk` | thrift + encodings + **Snappy** |
| 5 | SQLite | L0 | plain | pages | `DataChunk` | b-tree reader |
| 5 | GeoPackage | L0 | SQLite | pages | `DataChunk` | geometry blob |
| 6 | PNG/JPEG | L1 | plain | binary | `ImageBuffer` | lift + one surface |
| 6 | SVG-in-doc | L1 | plain | XML | `OfficeScene` | bridge |
| 6 | WebP/AVIF | L0 | plain | binary | `ImageBuffer` | large; host codec first |
| 7 | the rest | L0/L1 | various | various | existing | one reader each |

---

## 7. What this plan refuses to do

- **No universal document model.** Rule 1. The convergence points are
  `RichDocument`, `WorkbookModel`, `OfficeScene`, `DataChunk` and `GraphModel`,
  and they stay five.
- **No shared module without a second caller.** Rule 2. `OfficeId` was deleted
  for this and the deletion was right.
- **No format without a consumer application.** A reader nobody opens a file
  with is surface that rots. Every phase above names the app that will use it.
- **No L2 without source preservation.** A writer that silently drops the parts
  it did not understand is worse than no writer, because the damage is invisible
  until someone else opens the file. `.xlsx` proved this: a plain save was
  dropping the drawing, both media parts, the comments and three `docProps`
  parts.
- **No fifth XML reader, no third Inflate, no second CSS parser.** The whole
  reason Phase 0 comes first.
- **No format-specific special case in the layout engine.** If EPUB needs one,
  the HTML mapping is wrong; if ODP needs one, `OfficeScene` is wrong.

---

## 8. Conformance, as an architecture component

Ooxml roadmap item 15, and the thing that will decide whether this plan
produced an engine or a feature list. Every format added above is measured the
same way, and the measurements are the roadmap:

```text
corpus/     real files, from real producers
oracle/     what our reader says about them, dumped and diffed
semantic/   the same sentence, the same table, the same shape,
            read identically out of every format that can hold it
visual/     rendered against a reference renderer, geometry compared
roundtrip/  open → edit → save → reopen, parts and elements counted
```

Four numbers per format — **open fidelity, edit fidelity, save preservation,
reopen fidelity** — steer this architecture far better than a checklist of
forty names does. A format at L1 with a corpus behind it is worth more than
three at L0 without one.
