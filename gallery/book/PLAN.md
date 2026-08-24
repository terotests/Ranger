# PLAN — the Ranger book engine

What exists, what comes next, and why in that order.

## The position

Ranger already has the hard half of a publishing tool: an EVG scene model with
CSS-ish layout, a text engine that measures with real font faces, a PDF writer
that embeds subsets, HTML and PNG renderers, a JPEG codec, a rasterizer, and
document tooling that reads DOCX and PPTX. What it did not have is the part
that makes those into a *book*: a document model where text is independent of
the pages it lands on, and an engine that decides which page each line lands on.

That is what `gallery/book` adds, and it is deliberately the smaller half.

> Not an InDesign clone. A **visual book composition engine**.

## Reference split

| Reference | License | Role here |
| --- | --- | --- |
| Scribus | GPL | behaviour, UI and data-model reference **only** — never a source of code |
| Paged.js | MIT | the pagination question: measure, fill, overflow, next |
| Typst | Apache-2.0 | one layout model shared by editor and exporter |
| Graphite | Apache-2.0 | vector objects, layers, transforms — already covered by EVG |

Scribus is the one to study and the one not to copy. Everything portable is
taken from the permissively licensed three, and the vector half is EVG, which
Ranger owns outright.

## Stage 1 — the core (done)

| Piece | File | State |
| --- | --- | --- |
| Document model: pages, spreads, masters, frames, stories, styles, assets | `BookModel.rgr` | done |
| Master pages, mirrored across the spine, folios | `BookModel.rgr` | done |
| Flow engine: columns, linked frames, hard breaks, overset | `BookFlow.rgr` | done |
| Orphans, widows, keep-with-next, start-on-new-page | `BookFlow.rgr` | done |
| Image fit: cover / contain / fill / none, with a crop focus | `BookRender.rgr` | done |
| SVG output, page and spread | `BookRender.rgr` | done |
| TSX output → PDF / HTML / PNG through the existing tools | `BookRender.rgr` | done |
| Auto layout that grows the book until the story fits | `BookAutoLayout.rgr` | done |
| Signature padding, title page | `BookAutoLayout.rgr` | done |
| Preflight: resolution, bleed, safety, overset, signatures, fonts | `BookPreflight.rgr` | done |
| One-object API and a JSON projection for a host UI | `BookApi.rgr` | done |
| 76 assertions on JavaScript, Go and Python | `tests/BookTest.rgr` | done |

## Stage 1b — the editor (done)

| Piece | Where | State |
| --- | --- | --- |
| Placed lines → `EVGDisplayList` (WebGL, OpenGL, software canvas) | `BookToEvg.rgr` | done |
| Selection, hit test, marquee; master frames are drawn, not selectable | `BookEdit.rgr` | done |
| Move, resize from 8 handles, measured from where the drag began | `BookEdit.rgr` | done |
| Snapping to margins, page edges and centres, and other frames | `BookEdit.rgr` | done |
| Insert text / picture / shape frames; delete, duplicate, z-order, align | `BookEdit.rgr` | done |
| **Link and unlink the story flow** — the gesture a slide editor has no use for | `BookEdit.rgr` | done |
| Pages: add, duplicate, delete, reorder; deleting one joins the chain | `BookEdit.rgr` | done |
| Undo / redo over whole-document snapshots; a drag is one edit | `BookEdit.rgr` | done |
| Every geometry edit re-flows | `BookEdit.rgr` | done |
| Host seam: window pixel → point on the left or right page of a spread | `BookApp.rgr` | done |
| Shared toolbar, pages panel, status line, command table, preflight window | `BookApp.rgr` | done |
| Selection chrome in the same display list as the pages | `BookApp.rgr` | done |
| Each page clipped to its own sheet; the bleed drawn and veiled | `BookToEvg.rgr` | done |
| A spread's sheets held two bleeds apart, with a toggle | `BookApp.rgr` | done |
| A click on a page selects and edits; only the desk turns the spread | `BookApp.rgr` | done |
| The canvas measures with the faces it paints with | `BookView.rgr`, `EVGContextMeasurer.rgr` | done |
| Serverless browser build — the whole engine in the page, WebGL 2 | `web/standalone/` | done |
| Node-hosted variant, for driving the editor from a script | `web/serve.mjs` | done |
| 64 editor assertions, 17 in a real browser | `tests/`, `web/standalone/smoke.mjs` | done |

Extracted into `gallery/evg` on the way, because the book editor was the second
caller: `EVGImageDecode` (PNG/JPEG bytes → pixels), `EVGSelectChrome` (handle
geometry and which edges each handle owns), `EVGContextMeasurer` (EVG text
measurement backed by a host's own renderer), and
`EVGDisplayList.offsetBy` / `.appendFrom`.

## Stage 2 — typography that survives a proof

The current line breaker is greedy, and justification is done by the renderer
stretching a line the engine measured. That is honest and it is not good enough
for a printed book. In order of visible improvement:

1. **Hyphenation.** Greedy wrapping without hyphenation is what makes a
   justified column look torn. Needs a Liang-style pattern table; the dictionary
   is data, the algorithm is small.
2. **Justification as a break decision, not a paint trick.** Measure the word
   spaces, then choose the break that gives the column even colour — the
   Knuth-Plass line-breaking idea, even if only its first-fit-with-badness half.
   The flow engine already works paragraph-at-a-time, which is the shape this
   needs.
3. **Baseline grid.** Facing pages whose baselines do not align is the
   difference a reader notices without being able to name it. The engine already
   places lines on an explicit leading, so this is a snap on entry to the column.
4. **Optical margin alignment** for the punctuation at a justified edge.

## Stage 3 — frames that are not rectangles

1. **Text wrap around an image** — the frame's usable width becomes a function
   of y instead of a constant. This is a change to one function
   (`fillColumn`) and a new "obstacle" list per frame.
2. **Non-rectangular text frames**, via the same y → width function.
3. **Vector decoration on the page**, already possible through `kind = "path"`,
   but with EVG's path editing rather than hand-written path data.

## Stage 4 — the editor, continued

The canvas, the panel and the editing core are in (stage 1b). What is left is
the half that needs a caret and a properties panel:

1. **A caret in a text frame.** Typing into a story, not into a box: the
   position is a paragraph and a column of the STORY, and the caret's rectangle
   has to be found from the flow's placed lines. `PptxTextEdit` solves the same
   problem against OOXML runs and is the shape to copy, not the code.
2. **A properties panel** — style, fill, fit, focus, columns — in the shared
   window layer, so the commands that exist (`image.fit`, `edit.fill`,
   `frame.columns`) get a surface.
3. **Drag-to-reorder in the pages panel.** `movePage` is there; the panel only
   selects.
4. **The story view** — editing the text away from the page, with the flow
   showing which pages changed.
5. **Master page editing**, and re-applying a master to pages with overrides.
6. **Saving.** The document is data; a `.book` file is a serializer and a
   parser, and `toJson` is already most of the first one.

## Stage 4b — bringing pictures in (done, for Apple)

An empty book is not the thing anybody wants to make. `ApplePlist` +
`BookAppleAlbum` + `BookAlbumImport` + `BookAlbumMeasure` take an iPhoto or
Aperture library index — or, for a modern Photos library that has no index, a
list of file names the host enumerated — and answer with a laid-out book:
`npm run book:album` on the command line, a drop on the serverless page.

The parts of that worth keeping when the next source is added:

- The **reader** (an album: names, paths, captions, ratings, dates) is separate
  from the **import** (an album: pages), which is separate from **measuring**
  (pixel sizes off the file). Only the third touches a disk, which is why the
  first two run in a browser.
- Sizes are known **before** the layout, because the layout asks each picture
  which way up it is. A source that cannot answer that keeps the rotation's
  page and is reported by preflight as unknown rather than assumed fine.
- The picture's own metadata is not automatically a caption. A file name under
  a photograph is worse than nothing.

Since then the second source is in as well: `PhotoIndex` + `PhotoScan` index a
folder of photographs and search it by date range, by radius and by text, and
`tools/mac_photos.mjs` reaches a real Photos library through Photos.app and
Spotlight and converts what was chosen out of HEIC. The editor searches the
same index in the page.

Left, in the order it would be worth doing:

1. **Google Photos Takeout**, which is a folder of JPEGs beside a `.json` per
   picture — the same reader shape, a different index.
2. **HEIC read directly**, so a Mac is not needed to see an iPhone photograph.
   It is a HEIF container around HEVC; the metadata alone would be enough for
   indexing and is much less work than decoding one.
3. **Place names**, which needs a gazetteer — or, more cheaply, the names the
   library already knows: Photos stores reverse-geocoded place names per
   picture and AppleScript does not expose them, but an export does.
4. **Faces**, which iPhoto's index carries and a photo book uses for its
   chapter openings.
5. **A picture the reader has cropped in the editor**, written back to the
   album rather than only to the book.

## Stage 5 — output that a printer accepts

Done (stage 5a): `BookPrintSpec` holds a supplier's requirements as data and
preflight checks against it — trim size, extent (minimum, maximum, multiple),
bleed, outer and **gutter** safety, dpi. `BookCover` computes the spine from
the extent and the paper and builds the cover as its own landscape document.
`npm run book:print` writes the interior at trim + bleed with a TrimBox, the
cover, a `print.json` manifest carrying the fields a print-on-demand API asks
for, and the render commands with the computed sizes in them.

Done (stage 5b): the exported PDF finishes itself. `%PDF-1.6`, an XMP packet
identifying PDF/X-4 or X-1a, an `/OutputIntents` naming the printing condition,
`/Trapped /False`, and an `/Info` dictionary — written only when the file is
asked to claim conformance, so an ordinary PDF is unchanged. `-colors cmyk`
separates fills, strokes and glyphs to process ink with maximum black
generation, so pure black is 100% K. Images are the remaining gap and are
counted and reported rather than assumed away; `-strict-print` refuses to write
a file that claims PDF/X it does not meet.

Left:

1. **An ICC transform behind the CMYK conversion.** What is there is a device
   conversion, declared as one. A profiled one needs an ICC engine.
2. **CMYK image data.** Decoding a JPEG and re-encoding it as a four-component
   Adobe JPEG is the missing piece; the decoder and the encoder both exist.
3. **An embedded output profile** (`DestOutputProfile`), rather than the
   registered characterization name that stands in for it now.
4. **Crop and registration marks**, for the suppliers that want them. Off by
   default and it should stay that way: an unwanted set of marks is a reprint.
4. **A supplier's own cover template as input**, so the generated arithmetic can
   be checked against their file rather than replacing it.
5. **EPUB**, which is the same story model with the pagination thrown away, and
   is therefore nearly free once stories and styles are the source of truth.

## Design rules that should not be traded away

- **The story is not on the page.** Anything that makes text belong to a page
  breaks re-flow, and re-flow is the whole product.
- **The renderer never lays out.** It transcribes placed lines. Two layout
  implementations is how a preview and a proof drift apart.
- **One measurement.** Everything measures through `EVGTextEngine`. If a face
  cannot be measured, that is an error to report, not a default to fall back on.
- **Nothing generated stays special.** Auto layout produces ordinary frames; an
  author drags one and it stays dragged.
- **Preflight tells the truth.** A check that is easy to pass is worth nothing.
