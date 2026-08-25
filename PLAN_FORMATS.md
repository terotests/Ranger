# PLAN_FORMATS.md — reading more than three formats

`.docx`, `.xlsx` and `.pptx` are in. This is the plan for what comes after
them, in the order it should be built and with the reason each step comes
where it does.

It is a plan about **layers**, not about a format list. Forty readers bolted
onto three applications is not an engine; the same forty converging on a few
internal models, over one container, one encoding layer and one scene, is.

> **Read first:** [`gallery/ooxml/README.md`](gallery/ooxml/README.md) and
> [`gallery/office/README.md`](gallery/office/README.md). This document extends
> the roadmap in those two; where they disagree with this one, they are the
> ones with the code under them.

---

## The concrete goal: `.pptx` and `.odp` on one stack

**Phase 1 is ODF, and ODP first within it.** Not because a presentation is the
most wanted format — it is not; ODT is — but because **PPTX + ODP is the pair
that proves or disproves this architecture**, and it should be run as an
experiment before anything is built on the answer.

The claim this whole document rests on is §3's: *two formats converge at the
resolved scene, not at the document model.* ODP is the sharpest possible test
of it:

- It is the ODF format with the **least** in common with its OOXML twin. ODT
  and `RichDocument` agree about almost everything; ODP and `PptxModel`
  disagree about units, geometry vocabulary, colour, indirection and
  inheritance — see the mapping table in Phase 1. If the architecture survives
  ODP, ODT and ODS are downhill.
- It is the one where the wrong answer is **cheap to reach and expensive to
  leave**. Pointing an ODP reader at `PptxModel` looks like it works for a week.
- It has a **finished twin to be measured against**. `.pptx` is at L2 with an
  oracle dump, a writer verifier, visual shots and an accessibility tree. Every
  step below can be checked by asking whether the deck reader still produces
  exactly what it produced yesterday.

So Phase 1 is a single deliverable with a single sentence for a definition of
done:

> **One viewer opens a `.pptx` and an `.odp`, draws both through one scene and
> one painter, publishes one accessibility tree for both — and neither model
> imports the other, and nothing about the deck reader's output changed.**

Everything in Phase 1 that is not ODP is there because ODP needs it and because
`.pptx` is its second caller. That is the rule in §2, applied.

---

## 1. The two rules this plan is built on

Both were learned here, expensively, and both are quoted from the READMEs of
the directories that learned them.

**Rule 1 — merge the infrastructure, not the models.**

> Don't merge Word, Excel and PowerPoint into one document model. Merge the
> infrastructure underneath them.
> — `gallery/ooxml/README.md`

Adding ODF, PDF and HTML makes that rule more important, not less. A
`UniversalDocument` holding a paginated Word file, a spreadsheet, a slide deck,
a PDF page's graphics and an HTML flow would be worse at all five.

**Rule 2 — a shared module with one caller is how the old copy survives
underneath it.**

`OfficeId` was built, tested on two targets, and then deleted again because it
had no callers. Every phase below therefore states **who its second caller
is**, and a phase that cannot name one is not scheduled.

---

## 2. The layer stack

Every format this repository will ever read decomposes the same way. Naming the
layers is what makes a new format an addition rather than a new application.

```text
                bytes
                  │
        ┌─────────▼─────────┐
        │  container        │  ZIP · OPC · OCF · OLE2 · plain file
        └─────────┬─────────┘
                  │  named parts / one stream
        ┌─────────▼─────────┐
        │  encoding         │  XML · JSON · CSV · thrift · binary records
        └─────────┬─────────┘
                  │  tags, attributes, spans — no semantics
        ┌─────────▼─────────┐
        │  format reader    │  PresentationML · ODF · PDF objects · HTML
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  model            │  PptxModel · OdpModel · RichDocument ·
        └─────────┬─────────┘  WorkbookModel · DataChunk · GraphModel
                  │
        ┌─────────▼─────────┐
        │  resolve          │  styles, masters, themes, inheritance, formulas
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  scene            │  OfficeScene → EVGDisplayList
        └─────────┬─────────┘
                  │
     ┌────────────┼────────────┬───────────┐
     ▼            ▼            ▼           ▼
   HTML          SVG          GPU         PDF        a11y tree
```

Today exactly **one** of those layers is shared: the container, as
`gallery/ooxml/OpcPackage.rgr`. The encoding layer is written four times, and
the scene layer does not exist. Those two facts are Phase 1's work list.

---

## 3. What exists today

Written down because a roadmap that starts from a diagram instead of from the
repository plans work that is already done, and skips work that is not.

### Container

| | where | state |
| --- | --- | --- |
| ZIP read + DEFLATE decode | `gallery/zip/ZipReader.rgr`, `Inflate.rgr` | works |
| ZIP write | `gallery/zip/ZipWriter.rgr` | **STORED only** — `addFile` sets `compressionMethod = 0`; there is no deflate compressor in the tree |
| second copy of both | `gallery/game_engine/v2/imaging/zip/` | a duplicate, imported by the PNG decoder |
| OPC (parts, content types, relationships) | `gallery/ooxml/OpcPackage.rgr` (638 lines) | one reader, three formats, one invariant test |
| OCF (`mimetype` + `META-INF/`) | — | does not exist; ODF and EPUB both need it |
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
CSV does not exist at all.

### Models

| model | where | what it is |
| --- | --- | --- |
| `PptxModel` | `gallery/pptx/src/PptxModel.rgr` | slides, shapes, masters — DrawingML-shaped |
| `RichDocument` | `gallery/docx_viewer/src/RichDocument.rgr` | blocks, runs, tables, styles |
| `WorkbookModel` / `SpreadsheetModel` | `gallery/datagrid/src/` | sheets, cells, formulas, styles |
| `DataChunk` / `ValueVector` | `gallery/rangerdb/src/DataChunk.rgr` | columnar, chunk at a time |
| `GraphModel` | `gallery/rangerflow/core/GraphModel.rgr` | nodes and edges, with ERD/UML/flowchart domains on it |

**Four of the five internal models already exist.** What does not exist is the
resolved scene between them and EVG — `OfficeScene`, item 10 of the ooxml
roadmap — which is why Phase 1 builds it.

### Shared machinery already lifted

`OfficeFont`, `OfficeTextMetrics`, `OfficeStyle` (the unset / inherited /
explicitly-false tri-state), `OfficeColor`, `OfficeHistory`, `OfficeAsset`,
`OfficeGeomFormula` + 187 presets, `OfficeShapePicker`, `CssCore` (parser,
selectors, specificity, cascade — with two consumers already: EVG and
`PptxCss`), `EVGDisplayList` (one walk, many backends), `EVGA11yTree`.

### Output side

PDF **write** exists (`gallery/pdf_writer/EVGPDFRenderer.rgr`), as do HTML
write (`EVGHTMLRenderer`), PNG write, SVG write (`gallery/vela/src/VlSvg.rgr`)
and JPEG encode. Reading is the thin side of this repository, which is what
this plan is about.

---

## 4. Where a format lands

```text
PPTX · ODP · SVG · PDF page graphics
                    ↓
              OfficeScene                  (resolved, paintable, hit-testable)

DOCX · ODT · EPUB · HTML · Markdown
                    ↓
              RichDocument                 (paragraphs, runs, tables, floats)

XLSX · ODS · CSV · Arrow · Parquet · SQL
                    ↓
              DataChunk / WorkbookModel    (cells and columns)

DBML · GraphML · database metadata
                    ↓
              GraphModel                   (nodes and edges)
```

Three consequences worth stating before any of it is built, because each is
cheap now and expensive later.

**ODT joins `RichDocument`; ODP does not join `PptxModel`.** `RichDocument` is
already close to neutral — `DocxA11y` builds the accessibility tree from its
*blocks*, not from WordprocessingML — so an ODT reader targeting it is a
reader, not a merge. `PptxModel` is not neutral, and the mapping table in Phase
1 is the evidence.

**PDF has no document model, only a scene.** A PDF content stream is graphics
operators; there is no paragraph in it to recover, and recovering one is a
separate, lossy, later feature. PDF is the third `OfficeScene` producer, and
the one that proves the layer was not built for two presentation formats that
happened to look alike.

**`OfficeScene` must never grow back into a document model.** The ooxml README
already calls this the hard rule. With ODP, PPTX, PDF and SVG all landing on
it, the pressure to add "just a paragraph" will be constant, and every time it
is answered the layer stops being paintable output.

---

## 5. What "supported" means — four levels

A format list without this column is how a roadmap lies. ODT at L0 is a week;
ODT at L2 is a quarter, and it is the same row in the table.

| | level | the contract | what it costs |
| --- | --- | --- | --- |
| **L0** | extract | text and data come out, structure approximate | a reader |
| **L1** | view | renders faithfully enough to recognise | reader + resolve + scene |
| **L2** | edit | opens, edits, saves — **and does not damage what it did not understand** | + source preservation, + writer, + round-trip corpus |
| **L3** | author | creates one from scratch | + defaults, templates, a UI |

L2 is not a bigger version of L1. It requires the encoding layer to carry
spans, an opaque-node mechanism (`PptxOpaque`, `SheetOpaque`), and a resolver
whose output can be recognised as *unchanged inheritance* rather than as a
baked value — the signature mechanism described in the ooxml README.

Where the existing three stand today: `.pptx` L2, `.xlsx` L2, `.docx` L1 with
editing and a save that is not yet source-preserving.

**Phase 1 targets ODP at L1.** L2 for ODP needs an opaque design of its own and
is scheduled separately, after the architecture question has an answer.

---

# Phase 1 — PPTX + ODP on one stack

The concrete goal. Everything here is either ODP, or something ODP needs whose
second caller is the deck reader that already exists.

## 1.0 The two formats, side by side

This table is the argument. It is what the work has to survive, and it is why
the answer is a shared *scene* and separate *models*.

| concept | PPTX | ODP |
| --- | --- | --- |
| package | OPC: `[Content_Types].xml`, `_rels` **relationship graph**, ids | OCF: `mimetype` first and stored, `META-INF/manifest.xml`, **no relationship graph** |
| reference | `r:embed="rId3"` → part rels → part path | `xlink:href="Pictures/x.png"` — direct, relative to package root |
| a slide | one `p:sld` **part** each | one `draw:page` element, all of them in one `content.xml` |
| masters | `p:sldMaster` → `p:sldLayout` → slide (two levels) | `style:master-page` + `style:presentation-page-layout` |
| placeholder | `p:ph type="title"` | `presentation:class="title"` |
| shape | `p:sp` with `a:prstGeom prst="star5"` | `draw:custom-shape` with `draw:enhanced-geometry draw:type="star5"` |
| geometry language | guides + path in `a:gdLst` / `a:custGeom` | `draw:equation` + `draw:enhanced-path` — same **idea**, different syntax |
| units | EMU: integers, 914400 to the inch | length **strings**: `"2.54cm"`, `"0.5in"`, `"12pt"` |
| transform | `a:xfrm` with `off`/`ext`/`rot`/`flipH` | `svg:x/y/width/height` + `draw:transform="rotate(…) translate(…)"` |
| text | `a:p` → `a:r` → `a:rPr` | `text:p` → `text:span` → a named `style:style` |
| inheritance | list level + placeholder + layout + master | `style:parent-style-name` chain, plus automatic styles per document |
| colour | theme scheme + `tint`/`shade`/`lumMod` modifier chain | literal `#rrggbb`; **no scheme** at all in classic ODF |
| notes | a separate `notesSlide` part | `presentation:notes` inside the `draw:page` |

Read the rows in order and the shape of the answer appears: **the two formats
differ most exactly where a shared model would have to choose one of them**
(units, indirection, colour, inheritance) and agree exactly where a scene lives
(a positioned, filled, stroked, text-bearing box on a page).

Two practical notes that fall straight out of the table:

- **`OfficeColor` will not carry ODP far.** Its value is the theme scheme and
  the DrawingML modifier chain, and classic ODF has neither — colours are
  literal. (LibreOffice's `loext:theme` is a recent extension and out of scope.)
  Expect that entry in the shared-machinery list to *not* pay here, and do not
  pretend otherwise in the code.
- **`OfficeGeomFormula` might.** Its header already says "one evaluator, two
  sources" — `prstGeom` and `custGeom`. ODF's `draw:equation` /
  `draw:enhanced-path` is the same idea with different spelling. **Whether the
  evaluator generalises or only the concept does is the first thing step 1.3
  should measure**, and the answer decides whether the presets are shared or
  twinned. It is a measurement, not an assumption.

## 1.1 `gallery/xml/XmlCore.rgr` — one XML reader

Modelled on `gallery/css/CssCore.rgr`: a leaf module in its own directory,
shared by consumers that do completely different things with the result.

Requirements, each taken from a reader that needs it and does not have it:

- **Source spans on every node**, as `PptxXml` has them. L2 is built on this,
  and `.docx` and `.xlsx` cannot reach L2 without it.
- **Real namespace handling.** `PptxXml` strips prefixes (`p:sp` → `sp`) and
  that is survivable in OOXML. It is not survivable in ODF: `text:p` and
  `draw:p` are different elements, and `style:name`, `draw:name` and
  `text:style-name` are three different attributes.
- **A scanning mode as well as a DOM mode.** `XmlLite` exists because a
  worksheet with a million cells must not become a million node objects. One
  reader, two traversal APIs over one tokenizer — not two readers.
- **The XXE-safe entity policy** already in `OoxmlText`: the five predefined
  entities and numeric references, no external entities, ever.

*Second caller:* `PptxXml` is retired onto it **in this step**, before ODP
exists. That is Rule 2 satisfied at the moment the module is written rather
than promised for later, and it is also the cheapest possible regression test —
the deck reader has an oracle dump.

*Not retired:* `gallery/evg/SvgParser.rgr`. `gallery/evg` may not import the
office side of the gallery, and that boundary is worth more than removing one
duplicate. If a consumer outside the office stack ever needs the core, that is
the moment to move it to `lib/` under MIT — the moment to decide, not now.
`XmlLite` and `WordXml` follow in Phase 2, where ODS and ODT need them.

**Gate.** `pptx` suites green on **both** JavaScript and C++ — the two targets
that disagree about what a string is, which is how `OoxmlText` came to exist.
`pptx_oracle_dump` byte-identical. `pptx:writer:verify` still resolves every
reference in a written package. This step moves a walk; it must not change what
anyone sees.

## 1.2 `Ocf` and `OdfPackage` — the container ODF actually has

Beside `OpcPackage`, not inside it. **ODF is not OPC** and an `OpcPackage` that
learned to pretend would be worse at both:

```text
gallery/odf/
    Ocf.rgr           mimetype, META-INF/, the convention EPUB shares
    OdfPackage.rgr    manifest.xml → media types; xlink:href → member
```

There are no relationships and no ids. A reference is a package-relative path,
which is *simpler* than OPC and is the thing most likely to be over-engineered
by someone who has just finished reading `OpcPackage`.

**Gate.** The invariant `OpcPackageTest` holds for OPC, restated for OCF: walk
every entry in the manifest, resolve every `xlink:href` in every part, and
require each answer to name a member the ZIP actually contains. One test, and
it is the one none of the three hand-written OOXML readers could hold.

## 1.3 `OdpModel` + `OdpParser` — the reader

Its own model, in `gallery/odp/`, importing nothing from `gallery/pptx`.

```text
1.3a  pages          draw:page, draw:name, master-page-name, page-layout-name
1.3b  frames         draw:frame + draw:text-box / draw:image / draw:object
1.3c  shapes         draw:custom-shape, draw:rect, draw:ellipse, draw:line,
                     draw:polygon, draw:path, draw:connector, draw:g
1.3d  geometry       draw:enhanced-geometry — and the measurement above:
                     does OfficeGeomFormula generalise, or only the idea
1.3e  units          "2.54cm" / "0.5in" / "12pt" → one length type, once.
                     PptxUnits is EMU-shaped; this is a second unit reader and
                     it belongs in gallery/odf, not in either model
1.3f  text           text:p, text:span, text:list, text:line-break, tabs
1.3g  images         xlink:href → OfficeAsset (content identity, not path —
                     the bug that store exists for is format-independent)
1.3h  notes          presentation:notes
```

**Gate.** `OoxmlPackageTest` today reads *one sentence, identically, out of all
three OOXML packages.* Add `.odp` to it. That single test is what proves the
reader/model separation is real rather than drawn, and it is the cheapest test
in this plan.

## 1.4 `OdfStyles` — inheritance, through the tri-state

Automatic styles (`office:automatic-styles`, per document), common styles
(`office:styles` in `styles.xml`), master pages (`office:master-styles`), and
the `style:parent-style-name` chain — resolved through **`OfficeStyle`** and
its `applyOver`, because ODF has the identical *unset / inherited / explicitly
false* problem that cost this repository three bugs in three formats.

*Second caller:* `OfficeStyle` has three already. This step is the fourth, and
it is the one that tests whether the carrier is OOXML-shaped or actually
general. If ODF needs a fifth `StyleValue` variant, that is a finding worth
writing down.

**Gate.** The tri-state test, restated in ODF: a run explicitly not bold, under
a parent style that is bold, comes back not bold — in the model, through the
resolver, and in what is drawn.

## 1.5 `OfficeScene` — the resolved slide, built here

Built now, because now it has two callers that are not each other's refactor.

```text
SceneNode      bounds · transform · style · entityId · semanticRole
  SceneText
  SceneImage
  ScenePath
  SceneTable
  SceneGroup
```

`OdpResolver` produces it. `PptxResolver` — which already produces a resolved
`PptxPresentation` for exactly this purpose — is **migrated** to produce it.
That migration is the risky half of Phase 1 and it has the best safety net in
the repository: the deck reader's oracle dump, its visual shots and its writer
verifier all have to come back unchanged.

**The hard rule, restated because this is the step that will be tempted to
break it:** `OfficeScene` is resolved, paintable, hit-testable output and
nothing else. If ODP or PPTX needs something in it that a PDF page could not
also produce, it belongs in that format's model.

**Gate.** `pptx_oracle_dump` byte-identical after the migration. Not "close" —
identical. Anything else means the scene lost something, and finding out which
thing three phases later is how a rewrite happens.

## 1.6 `SceneToEvg` — one painter

`PptxToEvg` walks the resolved deck and emits EVG. After 1.5 it walks a scene
instead, and ODP gets a painter without one being written for it.

**Gate.** The `pptx` visual shots, unchanged. Then the same for `.odp`: a
fixture deck rendered and looked at by a person, the way
`npm run office:shapes:sheet` exists to be looked at — because no assertion
answers *does this slide look like the slide.*

## 1.7 `SceneA11y` — one accessibility tree

`PptxA11y.build` currently walks `PptxPresentation` and produces an
`EVGA11yTree`: the deck as a **list** of slides, reading order from shape
order, titles from `p:ph type="title"`, alt text from `p:cNvPr/@descr`.

Every one of those is a scene-level fact once `semanticRole` carries it, which
is why `SceneNode` has that field in 1.5 and not later. ODP's
`presentation:class="title"` and its own alt text land in the same slots, and
the deck's tree keeps working.

**Gate.** An `.odp` publishes "Slide 7 of 30" through `posInSet`/`setSize`, and
the existing assertion that a tree built twice is identical passes for it. A
screen reader cannot read a canvas; a viewer without this is not a degraded
experience, it is a blank window.

## 1.8 `DocumentFormatAdapter` — the registry

Ooxml roadmap item 12, landed here because Phase 1's definition of done needs
it: *one viewer opens both.*

```text
DocumentFormatAdapter
    sniff(bytes) -> confidence      content first, extension only as a tiebreak
    load(bytes)  -> model
    save(model)  -> bytes           optional
    capabilities                    canEditShapes, canEditFormulas, hasPages …
    createEmpty()                   optional
```

`doc.capabilities.canEditShapes` replaces `fileExtension == ".pptx"`, and a new
format stops being a change to the shell. Sniffing is content-first for a
reason ODF makes concrete: a `.odp`'s first ZIP entry is a stored `mimetype`
naming the format exactly, which is a better answer than any file extension.

**Gate.** Grep: zero occurrences of `".pptx"` or `".odp"` compared against a
filename above the adapter layer.

## Phase 1 — the definition of done, as tests

1. One sentence, read identically out of a `.pptx` and an `.odp`
   (`OoxmlPackageTest`, extended).
2. One viewer opens both, with no format check above the adapter.
3. `gallery/odp` imports nothing from `gallery/pptx`, and the reverse. Grep.
4. `pptx_oracle_dump` byte-identical from 1.1 through 1.8.
5. `pptx` visual shots unchanged; `pptx:writer:verify` still green.
6. An `.odp` publishes an accessibility tree, identical when built twice.
7. All of it compiles and passes on **JavaScript and C++**.
8. An ODP corpus: files from LibreOffice Impress, from Google Slides' export,
   and from PowerPoint's own "save as ODP" — three producers, because a reader
   tested against one writer's habits is tested against nothing.

**And the honest failure condition.** If `OfficeScene` cannot hold both without
growing a format-shaped field, this document is wrong and the finding is worth
more than the phase. Write it down in `gallery/odp/ISSUES.md` and re-plan —
that is what running the experiment first was for.

---

# The phases after it

## Phase 2 — ODT and ODS

Cheap once Phase 1 is done: the container, the encoding layer, the style
inheritance, the unit reader and the asset store are all built and proven.

- **ODT → `RichDocument`.** `office:text` is a flow of `text:p` / `text:h` with
  `text:span` runs, `text:list` and `table:table`, and `RichDocument` holds all
  four. Retire `WordXml` onto `XmlCore` in the same phase. Target L1, then L2.
- **ODS → `WorkbookModel`.** `table:table-cell` with `office:value-type`;
  `table:number-columns-repeated` is the one real surprise and it is a reader
  detail. The formula language is not: ODF writes `of:=SUM([.A1:.A5])` where
  SpreadsheetML writes `SUM(A1:A5)`. `FormulaEngine` must not learn a second
  syntax — the ODS reader translates references at read time and the workbook
  holds one language. Retire `XmlLite` onto `XmlCore` here.

**Gate.** The one-sentence test now spans **six** formats. And an `.odt` written
by this repository opens in LibreOffice without a repair dialog — the ODF
equivalent of `tools/check_preserve.py` opening our `.xlsx` files with
openpyxl. A reader that has never seen our model is the only honest referee.

## Phase 3 — PDF read, the third scene producer

The largest single capability jump in this plan, and much cheaper than it
looks, because **PDF's three hardest decoders are already in this repository**:

| PDF filter | what it needs | where it already is |
| --- | --- | --- |
| `FlateDecode` | raw DEFLATE | `gallery/zip/Inflate.rgr` |
| `DCTDecode` | baseline + progressive JPEG | `gallery/pdf_writer/src/jpeg/JPEGDecoder.rgr` |
| embedded fonts | TrueType outlines, `cmap`, metrics | `gallery/pdf_writer/src/fonts/TrueTypeFont.rgr` |

What is new is the object layer and the interpreter:

```text
3a  object layer     lexer, xref table AND xref streams, object streams,
                     indirect references, streams
3b  filters          Flate ✓, DCT ✓, ASCIIHex, ASCII85, LZW, RunLength
3c  content stream   graphics state stack, path construction and painting,
                     text state, Tj/TJ/Tm, Form and Image XObjects, inline
                     images, colour spaces
3d  fonts            standard 14 widths, embedded TrueType ✓, Type1/CFF,
                     CID fonts and CMaps — where text extraction either works
                     or produces mojibake
3e  scene            content stream → OfficeScene → EVGDisplayList → viewer
3f  on top           text extraction (L0), thumbnails, AcroForm fields
```

This is also what settles ooxml roadmap item 11: hit testing, thumbnails,
print, selection overlays and the accessibility tree stop being three walks,
but only once a **third** producer proves the shape was not fitted to two.

**Out of scope for the first landing, stated so it is not discovered later:**
encrypted PDFs, JBIG2, JPX, CCITT G3/G4, tagged-PDF structure recovery, and
JavaScript in forms.

**Gate.** A corpus of real PDFs compared against a reference renderer the way
`gallery/vela` compares its scene against Vega's own SVG: flatten both and
compare the geometry. Golden files pin what changed; they cannot say what was
never right.

## Phase 4 — HTML/CSS, Markdown, EPUB

One phase, because the second and third are small once the first exists.

`CssCore` is here with two consumers. `EVGLayout` does block and flex layout,
`EVGTextEngine` does line breaking, `EVGDisplayList` reaches every backend.
What is missing is the **HTML tree builder** — tokenizer, implied tags, the
pile of parse-error recovery that makes real-world HTML readable — and the
mapping from element + computed style to `EVGElement`.

```text
4a  HtmlParser     markup → element tree (error-tolerant)
4b  CSS binding    CssCore cascade → EVGElement style, honestly reporting what
                   is not supported (PptxCss.unsupported is the pattern)
4c  Markdown       CommonMark subset → the same element tree
4d  EPUB           Ocf (built in Phase 1) → OPF spine → XHTML per chapter →
                   paginate through EVG's existing page-break flow
```

```text
HTML ─┐                      ┌─► HTML   (EVGHTMLRenderer, exists)
MD   ─┤                      ├─► SVG    (exists)
EPUB ─┼─► EVGElement ────────┼─► PDF    (EVGPDFRenderer, exists)
DOCX ─┘      + CssCore       ├─► PNG    (exists)
                             └─► GPU    (exists)
```

Every arrow on the right already works. This phase adds three on the left.

**Gate.** `DOCX → HTML` and `HTML → PDF` both go through this one path, and an
EPUB paginates without EPUB knowing anything about pagination. If EPUB needs a
special case in the layout engine, the mapping in 4b is wrong.

## Phase 5 — data: CSV, Arrow, Parquet

`DataChunk` and `ValueVector` are the target and they exist. The adapter shape
mirrors 1.8: `DataSourceAdapter { sniff, open, schema, scan }` handing back
chunks.

- **CSV/TSV.** Cheap, immediately useful, consumer already built. The work is
  dialect detection (delimiter, quoting, embedded newlines, BOM) and type
  inference that can be overridden — and being honest about ambiguity rather
  than guessing a date format silently.
- **Arrow IPC.** Look carefully before writing: `ValueVector` is *close to*
  Arrow and not the same.

  | | `ValueVector` | Arrow |
  | --- | --- | --- |
  | nulls | `nulls:[boolean]` | validity **bitmap** |
  | strings | `strings:[string]` | offsets buffer + one data buffer |
  | layout | tagged struct-of-arrays | typed buffers, zero-copy |

  Converting is simpler and forfeits the zero-copy property that is the entire
  reason Arrow exists. Recommended: convert first so both land, and revisit the
  layout only when there is a measured scan the copy dominates.
- **Parquet.** Large, and one dependency is missing: Parquet's usual codec is
  **Snappy**, which is not in this tree — `Inflate` covers the GZIP codec only.
  Snappy decompression is small (~200 lines) and must exist before Parquet
  reads a file anyone else produced. The rest is thrift-encoded metadata,
  dictionary pages, RLE/bit-packed hybrid encoding, and definition and
  repetition levels.

**Gate.** The same table read from `.xlsx`, `.ods`, `.csv`, `.parquet` and an
Arrow stream produces the same `DataChunk`, and the DataGrid cannot tell which
one it got.

## Phase 6 — SQLite as a file, and GeoPackage

`gallery/rangerdb` reaches SQLite through `host/driver_sqlite.cjs`, and that
host is a Node process. The browser build of `rangerdbviewer` says so honestly
on the page: pressing SQLite there reports that it needs a host.

A **pure-Ranger SQLite file reader** — header, b-tree pages, the record format,
`sqlite_schema` — removes that limit and compiles to every target Ranger has,
so a static page can open a real database and a Swift or C++ build can too.
Read-only first: reading a page format is a bounded problem, writing one with a
rollback journal is not.

**GeoPackage** is then close to free: SQLite with agreed table names and a
binary geometry blob.

## Phase 7 — the shared decode surface, and raster assets

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
  it, and retire the second `Inflate` with it.
- **JPEG** — exists, baseline and progressive, with EXIF orientation.
- **WebP** — lossy is a VP8 intra decoder, lossless is a different format
  sharing a container. Two jobs, not one.
- **AVIF** — an AV1 intra decoder. Honestly: the largest single item in this
  document, larger than PDF read. Host codec or nothing until something needs it.
- **SVG in a document** — `SvgParser` already produces resolved vector items;
  what is missing is the bridge that lets a slide or a `.docx` hold one, which
  is an `OfficeScene` producer and therefore waits for Phase 3.

## Phase 8 — the domain formats

Small, each landing on a model that already exists. Order within the phase
follows whichever application asks first; none blocks another.

| format | model | notes |
| --- | --- | --- |
| **GeoJSON** | scene / `GraphModel` | JSON is in; the work is projection and simplification |
| **iCalendar `.ics`** | domain | line unfolding, RRULE, time zones — RRULE is the whole job |
| **vCard `.vcf`** | domain | same folding rules as ICS; write them once |
| **DBML** | `GraphModel` | RangerFlow's ERD editor is the consumer, and it exists |
| **GraphML** | `GraphModel` | XML on `XmlCore`; a day's work |
| **glTF / GLB** | 3D | `GltfJson.rgr` and `GlbImporter.rgr` already exist |
| **MusicXML** | scene | the best layout benchmark in the list — typography with rules |
| **WebVTT / SRT** | timed text | small; `gallery/evg_video` is the consumer |
| **DXF** | scene | large, entity-by-entity, worth it only with a CAD-shaped consumer |
| **TAR** | container | trivial beside ZIP, and it makes `.tar.gz` fixtures possible |

## Housekeeping, to do when it hurts

Not blocking Phase 1, which is read-only, but named so it is not rediscovered:

- **One `Inflate`.** `gallery/game_engine/v2/imaging/zip/` is a copy.
- **A deflate compressor** for `ZipWriter`. Every package this repository
  writes is stored uncompressed today — defensible for a fixture, not for a
  deck with photographs in it.
- **First-entry and stored-entry control** in `ZipWriter`. ODF requires
  `mimetype` first, STORED, no extra field; EPUB requires exactly the same.
  Two formats, one small API — needed the day ODP writing starts.

---

## The whole table, in order

| Phase | Format | Level target | Container | Encoding | Model | New work is |
| --- | --- | --- | --- | --- | --- | --- |
| **1** | **ODP** | **L1** | **OCF** | **`XmlCore`** | **`OdpModel` → `OfficeScene`** | **the stack itself, proven against `.pptx`** |
| 2 | ODT | L1 → L2 | OCF | XML | `RichDocument` | reader |
| 2 | ODS | L1 → L2 | OCF | XML | `WorkbookModel` | reader + formula translation |
| 3 | PDF | L0 + L1 | plain | binary | `OfficeScene` | objects + interpreter |
| 4 | HTML/CSS | L1 | plain | markup | `EVGElement` | tree builder + CSS binding |
| 4 | Markdown | L1 | plain | text | `EVGElement` | small parser |
| 4 | EPUB | L1 | OCF | XHTML | `EVGElement` | spine + pagination |
| 5 | CSV/TSV | L1 | plain | text | `DataChunk` | dialects + inference |
| 5 | Arrow | L0 | plain | binary | `DataChunk` | IPC + layout bridge |
| 5 | Parquet | L0 | plain | binary | `DataChunk` | thrift + encodings + **Snappy** |
| 6 | SQLite | L0 | plain | pages | `DataChunk` | b-tree reader |
| 6 | GeoPackage | L0 | SQLite | pages | `DataChunk` | geometry blob |
| 7 | PNG/JPEG | L1 | plain | binary | `ImageBuffer` | lift + one surface |
| 7 | SVG-in-doc | L1 | plain | XML | `OfficeScene` | bridge |
| 7 | WebP/AVIF | L0 | plain | binary | `ImageBuffer` | large; host codec first |
| 8 | the rest | L0/L1 | various | various | existing | one reader each |

---

## What this plan refuses to do

- **No universal document model.** Rule 1. The convergence points are
  `OfficeScene`, `RichDocument`, `WorkbookModel`, `DataChunk` and `GraphModel`,
  and they stay five.
- **No shared module without a second caller.** Rule 2. `OfficeId` was deleted
  for this and the deletion was right. `XmlCore` and `OfficeScene` each take
  their second caller in the step that creates them, not in a later phase.
- **No format without a consumer application.** A reader nobody opens a file
  with is surface that rots.
- **No L2 without source preservation.** A writer that silently drops what it
  did not understand is worse than no writer, because the damage is invisible
  until someone else opens the file. `.xlsx` proved it: a plain save was
  dropping the drawing, both media parts, the comments and three `docProps`
  parts.
- **No fifth XML reader, no third Inflate, no second CSS parser.**
- **No format-specific special case in the layout engine or the scene.** If ODP
  needs one, `OfficeScene` is wrong; if EPUB needs one, the HTML mapping is.

---

## Conformance, as an architecture component

Ooxml roadmap item 15, and what will decide whether this plan produced an
engine or a feature list. Every format above is measured the same way, and the
measurements are the roadmap:

```text
corpus/     real files, from real producers — three per format, not one
oracle/     what our reader says about them, dumped and diffed
semantic/   the same sentence, the same table, the same shape, read
            identically out of every format that can hold it
visual/     rendered against a reference renderer, geometry compared
roundtrip/  open → edit → save → reopen, parts and elements counted
```

Four numbers per format — **open fidelity, edit fidelity, save preservation,
reopen fidelity** — steer this architecture far better than a checklist of
forty names. A format at L1 with a corpus behind it is worth more than three at
L0 without one.
