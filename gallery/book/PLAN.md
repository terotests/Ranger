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

## Stage 4 — the editor

The model is deliberately host-agnostic; the editor is a separate program that
draws `api.toJson()` and calls back into the API. What it needs:

1. A **spread canvas** on EVG, with frame selection, drag, resize — the same
   machinery `rangerflow` and `datagrid` already use.
2. A **pages panel** showing spreads, with drag-to-reorder (which is a document
   operation the model does not have yet: moving a page must re-mirror its
   master frames).
3. A **story view** — editing the text, not the page. Editing a story should
   re-flow and show which pages changed.
4. **Overset made visible.** The red frame edge is already in the renderer
   (`options.showFrames`); the editor needs to surface it as a place to go.
5. **Master page editing**, and re-applying a master to pages that have
   overrides.

## Stage 5 — output that a printer accepts

1. **CMYK and ICC.** Currently everything is RGB. This is a PDF writer change,
   not a book engine change, but preflight is where it gets checked.
2. **Crop marks, bleed marks, a slug area.** The model already carries a bleed
   value; nothing draws it yet.
3. **PDF/X-ready output** — the flag a print shop asks for.
4. **EPUB**, which is the same story model with the pagination thrown away, and
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
