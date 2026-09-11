# Editing the preview — a refactor plan

`gallery/markdown` has a parser, a layout and a viewer. The viewer is
**read-only**: a textarea on the left, a canvas on the right, and a click on
the canvas scrolls the textarea. `docx_viewer` and `pptx` have the thing that
is missing — a caret in the picture, a selection you can bold, handles on a
picture, and an undo stack with rules.

**Stages A, B and C are built.** What each of them turned out to cost, and the
two things the building changed about the plan, are recorded in place below
rather than quietly.

This document is the plan for taking those and making the markdown preview
editable. It follows [`../PLAN_EDITOR_KERNEL.md`](../PLAN_EDITOR_KERNEL.md),
which is this gallery's answer to the only question that matters when code is
shared between editors:

> When a defect is fixed in shared code, how does the fix reach all the
> applications — and how does anyone *know* it did?

That document counts **four** editors. Markdown would be the fifth, and it is
the first one whose document is not an object model. That difference decides
almost everything below, so it goes first.

---

## Contents

1. [The question that has to be settled first](#1-the-question-that-has-to-be-settled-first)
2. [What exists today, measured](#2-what-exists-today-measured)
3. [What can actually be taken from docx and pptx](#3-what-can-actually-be-taken-from-docx-and-pptx)
4. [The blocking prerequisite: a source map](#4-the-blocking-prerequisite-a-source-map)
5. [The stages](#5-the-stages)
6. [The performance budget](#6-the-performance-budget)
7. [What must not be shared](#7-what-must-not-be-shared)
8. [Propagation: CI and the wiring tests](#8-propagation-ci-and-the-wiring-tests)
9. [Risks, stated so they can be checked](#9-risks-stated-so-they-can-be-checked)
10. [The one-line version](#10-the-one-line-version)

---

## 1. The question that has to be settled first

**What is the document — the text, or a model of it?**

In `docx_viewer` the truth is `RichDocument`; the `.docx` file is a
serialization of it. In `pptx` the truth is `PptxModel`. Both editors mutate
the model and write the file at the end.

Markdown has no such luxury, because **markdown is the file**. A user's
document contains decisions a model does not hold: whether a list uses `-` or
`*`, whether a heading is ATX or setext, where the line breaks in a hand-wrapped
paragraph are, which columns a table's pipes line up in, and an HTML comment
that nothing renders. Every WYSIWYG markdown editor that has adopted a rich
model has had the same defect reported against it: *"I edited one word and the
whole file changed."*

So:

> **The markdown text is the single source of truth. The preview is a
> projection of it, and every edit made in the preview is translated into a
> replacement of a range of that text.**

This is a *data seam* in the kernel plan's terms — the best of the three it
names — and the shared datum is three fields:

```
MdEditOp { start:int  end:int  removed:string  inserted:string }
```

Everything else in this plan falls out of that choice. A caret is an `int`. A
selection is two `int`s. Undo is a list of ops. "Make this bold" is a function
from (AST, selection) to a patch. The preview never normalises, never
re-serializes, and never touches a byte the user did not ask it to touch.

The alternative — `MdToRich` into `RichDocument`, edit with
`DocxEditController`, serialize back with `MdToMd` — is written down in
[`PLAN.md`](PLAN.md)'s diagram and should be **withdrawn as the editing path**.
It is the shortest route to reusing docx's editor and the longest route to a
markdown file anyone would keep. (`MdToRich` still has a use: handing a
markdown document to the `.docx` *writer*. That is an export, it runs once, and
nothing round-trips through it.)

---

## 2. What exists today, measured

| | |
| --- | --- |
| parser | `MdBlock` 1622 + `MdInline` 1747 lines, 651/652 CommonMark, ratcheted |
| layout | `MdLayout` 1746 lines → `[MdBox]`, points, paginated |
| painters | `MdToEvg` → `EVGElement` (PDF) and `EVGDisplayList` (WebGL) |
| viewer | `markdown_web.rgr` 368 lines, `standalone.mjs` 478 lines |
| editing | **none** — the canvas has no caret, no selection, no input |

Three findings that shape the work, each checked rather than assumed:

**Source offsets stop at the block.** `MdBlock` stamps `node.srcStart` /
`node.srcEnd` on blocks. `MdInline` stamps **nothing** — `grep -c srcStart
src/MdInline.rgr` is `0`. `MdLayout.emit` gives every `MdBox` the *block's*
start, and `MdSeg` (a placed run, with `x` and `w`) carries no offset at all.
So the finest source position the viewer can name today is "the paragraph that
was clicked", which is exactly what `MarkdownWeb.sourceOffsetAt` returns.

**The two-pane sync is O(boxes) per lookup.** `MdLayout.firstBoxOf` is a linear
scan over every box in the document, called once per `topOf`, which
`sourceOffsetAt` calls once per block. Fine for a scroll; not fine for a caret
that moves on every keystroke.

**Markdown is not in the editor CI job.** `scripts/run-gallery-editor-tests.sh`
lists 53 suites across `book`, `pptx`, `docx_viewer`, `datagrid`, `office` and
`evg`. `grep markdown` finds nothing, in that file or in `ci.yml`. The moment
markdown starts importing `gallery/office`, a change there can break it
silently. This is the cheapest item in the plan and it goes first.

---

## 3. What can actually be taken from docx and pptx

Honestly sorted. "Take" means import and call. "Extract" means the useful half
is welded to something markdown cannot have, and has to be cut out — which
makes every existing consumer better too. "Leave" means it is the wrong shape
and copying it would be the fifth application the kernel plan warns about.

| from | what | verdict |
| --- | --- | --- |
| `office/editor/OfficeHistory@(Op)` | every rule about an undo stack — transactions, coalescing, the trim at the limit | **take.** `OfficeHistory@(MdEditOp)`. Markdown becomes the fifth consumer. |
| `evg/EVGCodepoint` | stepping over a surrogate pair so a caret never lands inside one | **take.** Markdown does not use it yet and has the same problem. |
| `office/text/OfficeTextMetrics` | `measureRange` and `offsetAtX` over a line of mixed faces — "how far along a line an offset is, and the inverse" | **extract.** See below; it is bound to `UITextRenderer`. |
| `pptx/PptxTextEdit` `isWordChar` / `stepBack` / `stepForward` / `wordLeft` / `wordRight` | grapheme and word motion over a plain string | **extract** the string half; leave the `PptxTextBody` walk. |
| `docx_viewer/DocxEditController` `hitTest`, `caretPixelX/Y`, `findLineFor`, `caretToLineAtX`, `moveVertical`, `linesPerPage` | caret geometry over laid-out lines, including the sticky desired-x that makes ↑/↓ behave | **extract** over a shared laid-line datum. This is the largest duplication in the gallery. |
| `docx_viewer/ClipboardTable` | clipboard `text/html` → a grid of cells | **take.** Paste a spreadsheet range into markdown and get a GFM table. |
| `evg/EVGSelectChrome` | handles, marquee, hit-testing a handle | **take** for images and diagrams. |
| `docx_viewer/web/docx_web.rgr` | the host seam — `click`, `typeText`, `key`, `paste`, `copySelection`, `caretJson` | **match the names**, do not copy the body. A pattern seam propagates nothing (kernel plan §2); identical names let **one** wiring test drive both hosts. |
| `docx_viewer/RichDocument` + `RichDocumentEdit` | the model | **leave.** §1. |
| `pptx/PptxTextEdit` run-splitting, `PptxModel` paragraph/run tree | the container walk | **leave.** Markdown's runs are a *derived* view; splitting them means nothing to a text file. |
| `docx_viewer/DocxLayout` pagination | page breaking | **leave.** `MdLayout` already paginates. |

### The one that needs cutting first

`OfficeTextMetrics` is the right function with the wrong argument:

```
sfn measureRange:double (tr:UITextRenderer text:string runs:[OfficeTextRun] …)
sfn offsetAtX:int     (tr:UITextRenderer text:string runs:[OfficeTextRun] …)
```

`UITextRenderer` is 580 lines of software rasterizer over `framebuffer.rgr`,
`RasterText`, `SoftCanvas` and a bitmap-font fallback. Markdown measures
through `EVGTextEngine` → `EVGTextMeasurer` → `TTFTextMeasurer`, which is the
same font stack with none of the raster. Importing `OfficeTextMetrics` as it
stands would pull the game engine's framebuffer into the markdown web bundle to
answer a question about a width.

`UITextRenderer` already imports `EVGTextMeasurer`. So the cut is:

> `OfficeTextMetrics` takes an **`EVGTextMeasurer`**. `UITextRenderer` grows a
> method that hands over the one it holds.

That is the kernel plan §7 idiom — "concrete base class with a conservative
default" — and it comes with §6's guard already built: `EVGTextMeasurer`'s
`isFontAccurate()` returns **false** by default, so a caret computed with a
guessed font table can *refuse* rather than sit half a word away from the
glyphs. The markdown editor must assert it: **no accurate measurer, no caret.**

This change is behind `office:metrics:test`, `docx_viewer:test` and
`pptx:text:test`, all three already in CI, so it is a refactor with a net
underneath it.

---

## 4. The blocking prerequisite: a source map

Nothing in §5 can start until a character in the picture can name a character
in the file, both ways. This is the real work, and it is fiddly for reasons
worth writing down rather than discovering.

**(a) Raw offsets are not source offsets.** `MdInline.parse(block raw map)`
receives a string `MdBlock` assembled from lines after stripping list
indentation, block-quote markers and lazy-continuation whitespace. Offset 12 in
`raw` is not offset 12 in the file. Fix: `MdBlock` records, per block, the
pieces it appended — `(rawStart, srcStart, length)` — and `MdSourceMap`
translates in both directions. The map is built where the stripping happens, by
the code that knows how much it stripped.

**(b) Text length is not source length.** `&amp;` is five characters of source
and one of text. So are `\*`, a hard break's two trailing spaces, a collapsed
newline, and the space a code span strips from each end. A node therefore
carries either "verbatim" — length matches, the common case, and the map is
arithmetic — or a short table of the points where the two diverge. Only the
nodes that need it pay for it.

**(c) Emphasis is decided after the fact.** `processEmphasis` walks the
delimiter stack backwards, re-parents text nodes and removes delimiter runs.
Nodes created there inherit their span from the delimiters that made them: a
`strong` runs from the first `*` of its opener to the last `*` of its closer,
and its *content* span excludes both. The editor needs both spans — the outer
one to remove the markers when bold is toggled off, the inner one to place a
caret.

**(d) Layout has to carry it down.** `MdSeg` gains `srcStart` and a length in
source units; `MdLayout.breakRuns` already splits runs at a change of face and
at a break opportunity, so each `MdSeg` is a contiguous piece of one inline
node. `MdBox` keeps the block-level `srcStart` it has (nothing is taken away)
and gains the segment's.

**(e) The lookups have to stop being linear.** `firstBoxOf`'s scan becomes an
index built once per layout: blocks sorted by `srcStart`, boxes grouped by
block, lines indexed by y. A caret move is a binary search, not a walk.

### Why this is testable to a standard

The CommonMark corpus is already in the repository —
`harness/spec/commonmark-0.31.2.txt`, 652 examples — and `markdown:spec`
already runs every one of them. The source map gets the same treatment:

> For every example in the corpus, and every character offset in it: map the
> offset to a point in the layout and back. The answer must be the offset it
> started from, or an explicitly-declared "this offset has no picture"
> (inside a stripped marker, inside an HTML comment).

`markdown:srcmap:test`, ratcheted like the parity file, so coverage cannot
quietly go down. If it cannot reach a high number, **stop** — every stage after
this one is built on it.

*Done when:* the round trip holds over the corpus, and `sourceOffsetAt` returns
the character under the pointer instead of the paragraph's first byte.

---

## 5. The stages

Each names what makes it finished. Stages A–C are refactors with existing
tests behind them; D is where the feature starts to exist.

### Stage A — the floor, no code moves — ✅ done

1. ~~Add to `scripts/run-gallery-editor-tests.sh`~~ — `markdown:test`,
   `markdown:spec`, `markdown:srcmap:test`, `markdown:srcmap:spec` and
   `markdown:web:test` are in the list.
2. ~~`gallery/office/README.md` and `../PLAN_EDITOR_KERNEL.md` name markdown~~
   — both do.

*It cost one thing the plan did not mention.* The runner fails a suite that
prints no pass marker, and two of these printed none. `markdown:spec`'s marker
had to be written carefully: it says the RATCHET held, not that every example
passes, because 651/652 is the score and a line claiming otherwise would be
the kind of check §6 of the kernel plan warns about.

*Done when:* a red markdown suite blocks a merge, before markdown imports a
single thing from `gallery/office`. **It does.**

### Stage B — `OfficeTextMetrics` measures through `EVGTextMeasurer` — ✅ done

§3's cut, as `OfficeMeasure`: a `FontManager` and an `EVGTextMeasurer`, and
nothing else. The closure of `OfficeTextMetrics` is **thirteen files** with no
painter in it.

*Three things fell out that the plan had not seen, each in the direction of
the fact rather than the renderer:*

- `OfficeFont.apply` / `applyNamed` took a `UITextRenderer`, which is what put
  a renderer in `gallery/office/text` in the first place. They are
  `UITextRenderer.useFace` / `useNamedFace` now, beside the state they change.
- `OfficeFont.faceName` delegated **down** to `UITextRenderer.faceName`, for a
  rule about how `FontManager` names a face. The body moved up and the
  renderer's static delegates to it, so the four painters that spell it by
  hand are unchanged and there is still one body.
- `UIMeasure` keeps the bitmap fallback exactly — 8 units under 14pt, 12 at or
  above — because `docx_viewer`, `datagrid` and `pptx` all have suites that
  measure with no faces loaded. The estimate tables are the better number and
  the step is the number those suites were written against; a refactor that
  changes an answer is not a refactor.

*Done when:* `office:metrics:test`, `docx_viewer:test` and `pptx:text:test` are
green, and a markdown build that imports `OfficeTextMetrics` does not pull in
`framebuffer.rgr`. **All four hold**, and the last one is a gate —
`office:metrics:closure` — because nothing else would notice the renderer
coming back: re-adding the import compiles and passes every suite.

### Stage C — the source map — ✅ done

§4, and the ratchet.

| | |
| --- | --- |
| inside the document | **1790/1790** |
| in document order | **1790/1790** |
| verbatim runs read back as themselves | **1337/1337** |
| examples with a problem | **0 / 652** |

Blessed at those numbers in `harness/srcmap-floor.json`, so none of the three
can go down.

The first run scored 100.0% / 99.8% / 99.0% with fourteen examples failing,
and all fourteen were **one** bug: an autolink builds its label as a child
rather than appending it to the flat node list, so the blanket stamp never
reached it and it kept the default span of 0..0. That is the case for the
corpus rather than a fixture file, stated as a number: a fixture holds the
cases the person who wrote the stamping thought of.

*Two things the building changed:*

- **The block half needed no threading.** Every transformation between the raw
  lines and `literal` is a prefix drop or a trim, so the map is built once in
  `addLine` — the only place that still knows both strings — and shifted once
  at finalize. That covers the paragraph, both kinds of heading, the html
  block and both kinds of code block with one function, and it survives
  `stripReferences` rewriting the line array underneath it.
- **A sentinel was needed, and the failure it fixes is the interesting one.**
  The blanket stamp at the end of a parse step was overwriting the link node
  with the span of its own closing bracket. Valid, ordered, and wrong — which
  is precisely why ORDERED is a separate property from VALID, and why it was
  the check that caught it.

`MdSrcMapScan` lives in `src/`, not beside the test: Stage G's incremental
reparse needs exactly this to run both ways and compare.

### Stage D — the shared caret primitives (kernel plan Stage E, for real)

*Next.* Stage B left `OfficeTextMetrics` callable from markdown, and Stage C
left every placed segment carrying a source span; what is missing is the line
navigation over them, and `MdLayout.srcAtPoint` is currently markdown's own
answer to a question `DocxEditController.hitTest` answers separately.

Two new files in `gallery/office/text`, both pure functions over data:

- `OfficeCaretMotion.rgr` — grapheme step, word step, word classes. Cut from
  `PptxTextEdit`; `TextEditCore`'s equivalents redirect to it.
- `OfficeLineNav.rgr` — over `OfficeLaidLine { segs, y, height, ascent }` and
  `OfficeLaidSeg { x, w, text, srcStart, face }`: `offsetAtPoint`,
  `pointAtOffset`, `moveVertical(desiredX)`, `lineStart` / `lineEnd`, and the
  rectangles a selection paints as. `DocxLayout`'s `LaidLine` and `MdLine`
  both project into it; neither gives up its own type.

The kernel plan's Stage E says to model the caret on docx rather than pptx and
to share "the grapheme-level primitives … rather than the container walk".
That is exactly this, and markdown is the consumer that forces it to be data.

*Done when:* `DocxEditController.hitTest`, `caretPixelX/Y`, `caretToLineAtX`
and `moveVertical` are calls into `OfficeLineNav` rather than 200 lines of
their own, and `office:caret:editors:test` — a wiring test in the shape of
`OfficeRtlEditorsTest` — drives the real call site in **docx, pptx and
markdown** and looks at what came out.

### Stage E — the edit model and undo

- `MdEdit.rgr` — `MdEditOp`, `apply`, `invert`, and the coalescing rule for
  typing (one word is one undo, a paste is one undo).
- `MdEditController.rgr` — caret and selection as source offsets; `insertText`,
  `backspace`, `deleteForward`, `splitAtCaret`, `selectAll`, `moveLeft/Right/
  Up/Down/WordLeft/WordRight/LineEdge/DocEdge`, `undo`, `redo`. **The method
  names are `DocxEditController`'s, deliberately**, so one wiring test drives
  both.
- `history:OfficeHistory@(MdEditOp)`.

This also closes the item the kernel plan's Stage C left open — "the wiring
test … one test that drives a transaction through all four editors and asserts
that one action is one undo in each" — now across five.

*Done when:* `markdown:edit:test` types, deletes, pastes and undoes back to a
byte-identical source, and `office:history:editors:test` asserts one action is
one undo in all five.

### Stage F — the semantic edits, which is the WYSIWYG part

`MdSemanticEdit.rgr`: a table from an intent plus a selection to **one**
`MdEditOp`, decided against the AST rather than by a regular expression.

| intent | on | off |
| --- | --- | --- |
| bold / italic / strike | wrap in `**` / `*` / `~~` | delete the two delimiter runs of the enclosing node |
| inline code | wrap in backticks, widening the fence if the text contains one | unwrap |
| link | wrap as `[sel](url)` | unwrap to the label |
| heading 1–6, paragraph | replace the block's leading `#`s | — |
| bullet / ordered / task list | rewrite the block's markers, keeping indent | — |
| block quote | add or remove one `>` level | — |

Two rules keep this honest:

- **Every toggle is its own inverse.** Applying it twice returns bytes
  identical to the input. That is the whole acceptance test, and it is run over
  a fixture file of cases including the awkward ones: a selection that starts
  inside an existing `**` run, one that straddles two blocks, one that covers a
  code span.
- **When the answer is not well defined, refuse and say so.** Bolding a
  selection that starts inside emphasis and ends outside it has no correct
  patch. A controller that guesses produces markdown nobody typed; one that
  declines produces a status line.

*Done when:* `markdown:semantic:test` is green on the fixture, including the
refusals, and every case round-trips to identical bytes.

### Stage G — the preview becomes the editor

- **Chrome.** Caret and selection rectangles become `MdBox`es from
  `OfficeLineNav`, so they travel the existing road to both painters and no
  painter learns anything new.
- **Host seam.** `markdown_web.rgr` grows `click`, `typeText`, `key`, `paste`,
  `copySelection`, `cutSelection`, `undo`, `redo`, `caretJson` — the names
  `docx_web.rgr` already has.
- **The page.** `standalone.mjs` gets the event wiring docx's page has: a
  hidden input for IME and clipboard, pointer drag for selection, `keydown`
  for motion. The textarea stays — as a *second view of the same source*, not
  as the owner of it.
- **Both panes, one truth.** Every edit from either pane is an `MdEditOp`
  applied by the one controller; each pane re-reads after. No pane writes to
  the other, so there is no loop to break.

*Done when:* `markdown:web:test` in headless Chrome types a word into the
**canvas**, sees it in the textarea, presses ⌘B, sees `**` appear in the
source, presses undo twice and gets the original file back.

### Stage H — objects

Images, tables and mermaid fences, in that order.

- An image or diagram box gets `EVGSelectChrome` handles; a resize writes a
  width back into the source (an HTML `<img width>` for an image; an attribute
  comment for a diagram), which is the only lossless place to put it.
- A table cell is a source range: typing in it is an ordinary patch. Column
  re-alignment is an explicit command, never automatic — a hand-aligned table
  is a thing someone did on purpose.
- `ClipboardTable` turns a pasted spreadsheet range into a GFM table. Cheapest
  win in the document and it could be done any time after Stage E.
- A click on a diagram puts the caret in its fence. Direct manipulation of
  diagram geometry is not in this plan.

---

## 6. The performance budget

[`PLAN.md`](PLAN.md) §6b measured a full reparse-and-relayout at **142 ms for a
63 KB document**, down from 382 ms, and calls the remainder "the text
measurement itself". A keystroke cannot cost that. The target is **16 ms**
inside a paragraph of a 63 KB file.

The strategy is dirty-block, and the source map is what makes it possible: an
`MdEditOp` names a range, so the blocks it intersects are the blocks to
reparse. Two cases:

- **Inside a block, no structure change.** Reparse that block only; re-lay it;
  shift the `y` of everything after it by the height delta; repaginate from
  there. Everything else keeps its boxes.
- **The edit changes block structure** — a blank line typed, a ``` opened, a
  `>` added, an indent crossed. Fall back to a full reparse. Detecting this
  cheaply and *conservatively* is the whole trick; when in doubt, full.

**How it is kept honest.** A debug mode runs both paths and compares the box
lists. `markdown:edit:test` runs with it on, over every keystroke in the suite.
An incremental path that silently disagrees with the full one is a stale
picture, which is the worst bug class this feature can have, and the only
defence is to check rather than to trust.

---

## 7. What must not be shared

- **The document models.** A markdown file is not a `RichDocument`, and the
  reason is §1 rather than taste.
- **The layouts.** `MdLayout` and `DocxLayout` paginate different things.
  Shared: the *metrics* and the *line navigation*, both already data.
- **The exporters.** `MdToHtml` exists to be scored against a specification.
  Nothing in the editor may route through it.
- **Normalisation.** The preview never rewrites a byte it was not asked to.
  There is no "format document" in this plan and adding one should be a
  separate, explicit, opt-in command.

---

## 8. Propagation: CI and the wiring tests

New suites, all wired into `scripts/run-gallery-editor-tests.sh` in the stage
that creates them, not later:

| suite | stage | what it would catch |
| --- | --- | --- |
| `markdown:test`, `markdown:spec`, `markdown:web:test` | A | a shared change breaking markdown at all |
| `markdown:srcmap:test` | C | a source offset that does not round-trip |
| `office:caret:editors:test` | D | `OfficeLineNav` correct and called by nobody |
| `markdown:edit:test` | E | an edit that does not undo to identical bytes |
| `office:history:editors:test` | E | one action that is not one undo, in any of five |
| `markdown:semantic:test` | F | a toggle that is not its own inverse |

The two `*:editors:test` suites are the point. The kernel plan §4 says it
better than a restatement would:

> `OfficeBidi`, `OfficeArabic` and `OfficeText` are each checked on their own,
> and each of those tests would pass just as happily if nothing in the gallery
> ever called them. **This is the test that would not.**

---

## 9. Risks, stated so they can be checked

1. **The source map may not reach the corpus.** Escapes, entities, lazy
   continuation and reference links all move offsets, and the delimiter stack
   re-parents nodes after the fact. Mitigation: the ratchet in Stage C, and a
   declared "no picture" answer for offsets that genuinely have none. If the
   number is low, this feature is not available and the plan should stop there
   rather than ship a caret that lands in the wrong word.
2. **Incremental relayout may be wrong in a way tests do not reach.** Mitigated
   by §6's compare-against-full mode, which is cheap to run in tests and
   pointless to trust without.
3. **`OfficeLineNav` may not fit three editors.** Word's painter advances by an
   integer per run and PowerPoint's carries doubles — `OfficeTextMetrics`
   already records that difference as `roundPerRun` rather than averaging it
   away. Markdown is a third rounding regime (points, scaled to a device).
   Check this before Stage D, on paper, not during.
4. **Semantic edits may have more ambiguous cases than the table admits.** The
   refusal path is the mitigation, and the fixture is where the cases get
   collected. A refusal that a user hits often is a bug report about the table,
   not about the rule.
5. **Two editable panes.** One controller owns the source; both panes are
   readers that submit ops. Any design where the textarea's `input` event
   writes the source directly will produce a loop the first time an op changes
   what the user just typed.
6. **The fonts.** `EVGTextMeasurer.isFontAccurate()` is false until real faces
   are attached, and a caret measured against a guessed table looks like a
   line-breaking bug rather than a missing font — the exact failure
   `FontManager.loadFont` cost a whole book for. The editor asserts the flag
   and disables the caret without it.

---

## 10. The one-line version

Markdown's document is its text, so the preview cannot own a model — it owns a
**patch**; and once that is decided, docx and pptx have three things worth
taking (undo's rules, line navigation, caret motion), one of which has to be
cut loose from a software rasterizer first, and none of which is shared until a
test drives the real call site in every editor that claims to use it.
