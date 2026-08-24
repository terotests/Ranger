# Sharing the editors — a plan, and the question it has to answer first

There are now **four** visual editors in this gallery: `pptx`, `docx_viewer`,
`datagrid` and `book`. They do the same things to different documents — select,
drag, resize, rotate, group, align, snap, type, undo — and they measure text
with the same fonts and draw with the same display list.

The obvious move is to share more. This document is about the **less** obvious
question that has to be settled first, because it decides what "share" is even
allowed to mean here:

> When a defect is fixed in shared code, how does the fix reach all four
> applications — and how does anyone *know* it did?

Sharing that cannot answer that is not sharing. It is a fifth copy that happens
to live in a folder called `office/`.

---

## 1. What is already shared, and what that has proved

| layer | modules | consumers |
|---|---|---|
| `gallery/evg` | `EVGDisplayList`, `EVGToolbar` + `View`, `EVGSelectChrome`, `EVGWindow`, `EVGCommands`, `EVGTextEngine`, `EVGTextMeasurer`, `EVGImageDecode`, `EVGCodepoint` | all four, plus `rangerflow`, `pdf_writer`, `game_engine` |
| `gallery/office` | `OfficeText`, `OfficeBidi`, `OfficeArabic`, `OfficeFont`, `OfficeColor`, `OfficeStyle`, `OfficeAsset`, `OfficePresetShapes`, `OfficeHistory`, `OfficeTextMetrics`, `OfficeTextRun`, `OfficeGeomFormula`, `export/EVGListToElements` | uneven — see §3 |

`gallery/office/README.md` already draws the line, and it is the right line:

> Don't merge Word, Excel and PowerPoint into one document model. Merge the
> infrastructure underneath them.

The book is a fourth editor that sentence does not yet mention. It imports
**11** things from `gallery/evg` and **zero** from `gallery/office`.

---

## 2. Three kinds of seam, with very different propagation

This is the core of the analysis. The three are not equally good, and the repo
already has evidence for each.

### Data seam — a fix propagates for free

`EVGDisplayList` is a list of draw commands. Everything upstream produces one;
everything downstream consumes one. There is no shared *behaviour* to keep in
step, so there is nothing to keep in step.

**Evidence:** the SDL host added in `gallery/book/platform/sdl` required *zero*
changes to the editor. The same list that `evg-webgl.js` draws in a browser tab
is drawn by `EvgGlPainter` in a window. A fix to how a rounded rectangle is
emitted reaches the browser, the window, the software canvas and the PDF at
once, because they all read the same commands.

**This is the seam to prefer whenever a choice exists.** Two more pieces of
evidence arrived after this was written, both from work that had nothing to do
with the book:

- `PptxFromEvg` made the display list an **output** format for slides, so it
  runs both ways. `BookToPptx` is forty lines of wiring on top and the book
  exports to PowerPoint — no second renderer, and neither side knew about the
  other.
- `office/export/EVGListToElements` turned it into the PDF writer's input too,
  "deliberately not pptx-specific: the .docx reader and the spreadsheet emit
  the same display lists".

A base class shared between four editors would not have produced either.

### Policy seam — a fix propagates when adopted, and adoption is invisible

`OfficeHistory` shares the *rules* about an undo stack while each editor keeps
its own operations. Its header states the design exactly:

> Not the operations. `SheetSetCell` is not `SlideMoveShape` is not
> `DocInsertText`, and a base class over them would be a place to put nothing.
> […] What IS shared is every rule about that array.

And it names the failure it was written to end:

> They are what happens when the rules live in three places and only one of
> them is complete.

This works — where it is used. Nothing makes it be used. See §3.

### Pattern seam — a fix does not propagate at all

"Copy the shape, not the code" is how most of this gallery has grown. The repo's
own CHANGELOG records what that costs, twice:

> asked whether the pptx work carried across, and the answer was **two thirds no**

> That is the **fourth place** in this repository to meet the identical defect

A pattern is a thing a person has to remember. Four editors × N concerns is more
than anyone remembers.

**Design rule: prefer a data seam; where behaviour must be shared, share policy
and prove the wiring; never rely on a pattern.**

---

## 3. The measured state of adoption — this is the actual problem

Not "too little is shared". **What is shared is unevenly wired**, and nothing
reports that.

| shared module | used by | not used by |
|---|---|---|
| `OfficeHistory` | **all four** — since generics | — |
| `OfficeTextMetrics` | docx_viewer | pptx, datagrid, book |
| `OfficePresetShapes` | pptx | book |
| `OfficeGeomFormula` | `OfficePresetShapes`, so pptx transitively | — |

One consequence still stands:

- **`gallery/office/text/OfficeTextMetrics.rgr` (217 lines) and
  `gallery/docx_viewer/src/DocxTextMetrics.rgr` (217 lines)** solve the same
  problem, and *both* open by calling themselves the single authority — "ONE
  measurement authority for paragraph text" against "how far along a line an
  offset is, and the inverse". Neither is wrong. There are simply two of them.

> **Correction, and it makes this document's own point.** The first draft of
> this table said `OfficeGeomFormula` was used by **nobody** and called it dead
> shared code. It is not: `OfficePresetShapes` imports it and calls it at a
> dozen sites, so pptx reaches it transitively. The error was in how the table
> was measured — consumers were counted by grepping *outside* `gallery/office`,
> which scores a shared module used by another shared module as unused. That is
> §6's rule biting its own author: **a check must count the noun the failure is
> about.** The undo row was measured the same way and happened to be right.

---

## 4. The mechanism that already works here: the wiring test

`gallery/office/text/tests/OfficeRtlEditorsTest.rgr` is the answer to the
propagation question, and it already exists — for exactly one concern. Its
header is the clearest statement of the idea in this repository:

> `OfficeBidi`, `OfficeArabic` and `OfficeText` are each checked on their own,
> and each of those tests would pass just as happily if nothing in the gallery
> ever called them. **This is the test that would not.**
>
> It drives the exact function in each of the three editors where a string
> becomes marks — `DocxInk.textStyled`, `PptxToEvg.pushTextCmd`,
> `GridView.pushText` — and looks at what came out the other end.

It even enumerates both wiring failures: *not called*, and *called twice*.

**Generalise this.** Every shared concern gets one test that imports every
consumer and drives the real call site. A module's own unit test proves the
module is correct; it says nothing about whether anyone calls it. The wiring
test is the only thing that turns "shared" into "shared".

The rule this implies is cheap to state and easy to enforce in review:

> A module in `gallery/office` or `gallery/evg` that is behaviour rather than
> data ships with a wiring test naming every consumer. A consumer added later
> is added to that test in the same change.

---

## 5. The mechanism that was missing — now landed ✅

**Done.** `.github/workflows/ci.yml` has a `gallery-editors` job running
`npm run gallery:editors:test`: nineteen suites, ~90 s, **ungated** — "a
compiler change breaks these exactly as easily as a gallery change does" — and
wired into `test-gate`, so a red editor suite blocks the merge rather than
merely printing.

`scripts/run-gallery-editor-tests.sh` is better than the sketch that was here.
It catches the trap a naive chain would have walked into, in its own words:

> the compiler prints `[FAIL]` and still exits 0. A chain of npm scripts
> therefore runs the STALE build from the previous compile and reports a pass —
> which is the one way a CI job can be worse than no CI job.

So each suite is failed on `[FAIL]` in the output, on a missing pass marker,
**and** on a non-zero exit. What follows is kept as the reasoning that argued
for it.

---

*(originally, when none of this ran)*

`.github/workflows/ci.yml` ran `test:es6`, `test:go`, `test:python`,
`test:dart`, `test:runtime`, and — for gallery-only PRs — `engine:pong:runner`.

**No gallery editor suite ran in CI at all.** Not `book:test`, not `pptx:test`,
not `docx_viewer:test`, not `datagrid:test`, not any `office:*:test`.

So today a fix propagates because a human remembers to run five suites. That is
not hypothetical: changing `JPEGDecoder` this week meant hand-running
`datagrid`, `datagrid:gl`, `datagrid:editor:web`, `pptx:web` and `docx_viewer`
to find out whether a shared change had broken anything. It had not — but the
only reason anyone knows is that someone thought to look.

**A shared codebase whose cross-module tests only run when someone remembers is
four codebases with a shared folder.** This was the cheapest and
highest-leverage item in this document, and the argument for landing it before
any code moved. Roughly:

```yaml
- run: npm run office:history:test && npm run office:metrics:test
- run: npm run office:rtl:editors:test        # the wiring test
- run: npm run book:test && npm run pptx:test && npm run docx_viewer:test
- run: npm run datagrid:test
```

Sequencing matters: extracting a kernel *without* this makes the blast radius
of every future change larger with no compensating signal.

---

## 6. The third mechanism: make the un-wired state loud

Shared code should make the wrong call impossible, or noisy — not merely offer
a right call beside a wrong one.

`EVGTextMeasurer` does this well. Its default `isFontAccurate()` returns
**false**, so a measurer that never opened a font cannot silently drive print
layout; the engine asks and refuses.

`FontManager.loadFont` does the opposite, and it cost a whole book. The native
host called `tr.fm.loadFont(path)`; it loaded the file, **returned true**, and
logged `Loaded font 'Cinzel' (Regular)` — while binding nothing to the
rasterizer. Every glyph in the window came out of the built-in bitmap font while
the layout was measured with real metrics, so the line breaks were right and only
the letterforms were wrong. The host's own guard passed, because it counted
*files that loaded* rather than asking whether anything was *bound*
(`gallery/book/ISSUES.md` #16).

Two lessons for anything extracted from here on:

- A shared API that can be half-wired must **report** its wiring
  (`hasFont`, `isFontAccurate`), and callers should assert it.
- A check must count the noun the failure is about. Counting the wrong noun is
  worse than no check: it reports the failure as fine.

---

## 7. The language constraint that shapes the kernel

**Ranger has generics now** — `class History @params(Op)`, `History@(int)` —
so a shared kernel *can* be parameterised over the app's node type, and
`OfficeHistory` is the proof. There are still no bounds and no interfaces,
which was the recommendation and remains the constraint: a kernel may hold a
`T`, and it may not ask anything of one. Where it needs to compare, hash or
order, the comparison is passed in.

The two older idioms are still the right answer where a type parameter is not
what is wanted:

> **Generics arrived**, so the kernel holds its own operations and the rows
> below are choices rather than workarounds. What was asked for, what shipped,
> and the one warning still open — the representation of `@(optional)`, which a
> `Maybe<T>` would inherit — are in [`PLAN_GENERICS.md`](../PLAN_GENERICS.md).

| idiom | example | use it for |
|---|---|---|
| rules over **ids and indices**, app keeps its own arrays | `OfficeHistory` | undo, selection sets, z-order, grouping |
| concrete base class with a **conservative default**, subclassed | `EVGTextMeasurer` | measurement, hit-testing, anything with an app-specific answer |

A third is available and is the best of the three where it fits: **compute into
a shared data type** (`EVGDisplayList`, `EVGBox`). Transform maths should go
here — a rotation is a matrix and a rectangle, and neither knows what a slide is.

---

## 8. What to share, in order of value ÷ risk

Nothing below is started. Each stage names what would make it *finished*.

### Stage A — the floor (no code moves) — ✅ done

1. ~~Gallery suites in CI~~ — landed, see §5.
2. ~~`gallery/office/README.md` names the book as a fourth editor~~ — landed.
3. ~~Delete or adopt `OfficeGeomFormula`~~ — withdrawn: it was never dead. See
   the correction in §3.

*Done when:* a red gallery suite blocks a merge. **It does** — `test-gate`
fails on `gallery-editors`.

### Stage B0 — the display list both ways — ✅ arrived on its own

Not planned here, and it is the strongest evidence in the document.
`gallery/pptx/src/PptxFromEvg.rgr` converts a display list *to* DrawingML, so
anything that draws can be put on a slide. `gallery/book/src/BookToPptx.rgr`
cashes that in for the book in forty lines.

*Open, and it is shared work rather than book work:* `PptxFromEvg` drops IMAGE
commands (it counts them in `unresolvedImages` and says why — a display list
names a picture, it does not carry the bytes) and ignores clips, including the
one that crops an image frame. A byte registry on the converter plus `a:srcRect`
on the blip fixes both, for every producer at once — a Vela chart, a data grid,
a .docx page and a book page.

### Stage B — transform maths (a data seam, lowest risk)

Rotation, flip, the bounding box of a rotated rect, hit-testing a rotated
shape, group bounds. Pure functions over numbers; `pptx` has 22 rotation sites
and `book` has **none**, so the book gains rotation rather than trading anything
away.

*Done when:* `PptxEdit` computes no rotation itself, and a book frame can be
rotated with the same call.

### Stage C — undo (a policy seam, proven design) — ✅ done

Landed with generics. `OfficeHistory` is now `@params(Op)` and holds the
operations; all four editors use it — `OfficeHistory@(DocEditOp)`,
`@(SpreadsheetUndoOp)`, `@(BookDocument)`, `@(PptxEditSnapshot)` — and
`PptxEdit` gave up its own history array and cursor. That was the acceptance
test named in [`PLAN_GENERICS.md`](../PLAN_GENERICS.md), and it is met.

*Still open:* the **wiring test** — one test that drives a transaction through
all four editors and asserts that one action is one undo in each. Four
instantiations prove the type-checker is happy; they do not prove the rules are
reached. This is §4's rule, and it is the one part of Stage C not yet done.

### Stage D — selection and manipulation (the biggest win the user named)

Move, resize with handles, snap, align, distribute, group/ungroup, z-order.
`EVGSelectChrome` already shares the *chrome*; the *behaviour* is duplicated.
Rules over ids (§7), so each editor keeps its own node arrays.

*Done when:* `BookEdit` and `PptxEdit` both shrink, and the wiring test drags a
handle in each of the four.

### Stage E — the caret (largest, and the one to model on docx, not pptx)

`PptxTextEdit` is 968 lines of caret, selection and run-splitting over
`PptxTextBody → PptxParagraph → PptxTextRun`. The book's text is **not** that
shape: a `BookStory` flows across linked frames and pages, so a caret has to
answer "which page am I on" through the flow result — which is Word's problem,
not PowerPoint's. Model the book's caret on `docx_viewer`'s and share the
grapheme-level primitives (left/right by grapheme, word jumps, selection
normalisation, run splitting on insert) rather than the container walk.

`EVGCodepoint` and `OfficeText` already hold the grapheme layer. This stage is
mostly about *not* sharing the wrong thing.

*Done when:* the two 217-line "single authority" metrics files are one file.

### Not to be shared, at any stage

The document models. A slide is not a page is not a sheet is not a book. Flow
and pagination belong to `book` and `docx_viewer` only; master/layout
inheritance to `pptx`; formulas to `datagrid`. `gallery/office/README.md`'s line
holds.

---

## 9. The riskiest assumptions in this plan

Stated so they can be checked rather than discovered.

1. **That `OfficeHistory` fits pptx.** It was written against the spreadsheet's
   rules and adopted by docx. `PptxEdit` is 4450 lines and may have transaction
   semantics that do not fit. Check before Stage C, not during.
2. **That rotation is genuinely app-independent.** `pptx` rotation carries
   `flipH`/`flipV` and connector-endpoint semantics from DrawingML. The maths is
   shared; the DrawingML meaning is not, and the boundary needs drawing on paper
   first.
3. **That a wiring test can drive four editors without becoming a fifth
   application.** `OfficeRtlEditorsTest` drives three and stays short because it
   calls one function in each. A wiring test that has to build a document per
   editor will rot. If a stage cannot be wired-tested cheaply, that is evidence
   the seam is wrong.
4. **That C++ stays a target for all of this.** Compiling the book natively this
   week surfaced three defects that three other targets had not
   (`ISSUES.md` #13–#15). A shared kernel doubles the value of that and also
   doubles the cost of getting it wrong.

---

## 10. The one-line version

The gallery does not need more shared code as much as it needs **proof that the
shared code it already has is actually called**. Ship §5 and §4 first; then B,
C, D, E are ordinary work.
