# The same document, as slides — a plan

`gallery/markdown` reads a file and lays it out. `gallery/pptx` reads a deck
and lays it out. This is the plan for making the FIRST one produce the second:
one markdown source, a stylesheet per company, and a `.pptx` tab beside the
`.md` one in the viewer that already exists.

The ambition, stated once so the rest can be measured against it:

```
                    report.md
                        │
              ┌─────────┴─────────┐
              │                   │
          MdNode AST         company.css
              │                   │
              └─────────┬─────────┘
                        ↓
                   MdLayout
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   continuous         slides          pages
        ↓               ↓               ↓
    Web / SVG        PPTX            PDF
```

The `.md | .pptx` switch is a **layout policy**, not a conversion. That is the
whole architectural claim, and §2 is the evidence that it can be true here.

---

## Contents

1. [What the repository already has](#1-what-the-repository-already-has)
2. [The finding that decides the design](#2-the-finding-that-decides-the-design)
3. [Goldmark attributes, not MDX](#3-goldmark-attributes-not-mdx)
4. [Where the slide breaks](#4-where-the-slide-breaks)
5. [A template is a stylesheet](#5-a-template-is-a-stylesheet)
6. [The stages](#6-the-stages)
7. [What must not be shared, and what must not be invented](#7-what-must-not-be-shared-and-what-must-not-be-invented)
8. [Risks, stated so they can be checked](#8-risks-stated-so-they-can-be-checked)

---

## 1. What the repository already has

More than this plan assumed before it went looking. Measured, not remembered:

| | |
| --- | --- |
| `MdLayout.layoutPaged` | already paginates: `paginate`, `contentBottom`, `page`, `pageCount`, break-before-overflow. A slide is a page of a different size. |
| `MdStyle` | 40-odd fields, and its own header says why they are there: "the values a stylesheet will set, in one place, so the layout never has a number written into it". |
| `style.breakOnH1` | **already ships**, as a front-matter flag. `split-level` is its generalisation, not a new idea. |
| `MdFrontMatter` | `key: value`, and explicitly nothing else. |
| `gallery/css/CssCore.rgr` | 994 lines: selectors, specificity, cascade, `@media`. Generic — "it has no idea what any of them MEAN." |
| `gallery/pptx/src/PptxCss.rgr` | 514 lines binding `CssCore` to DrawingML. **The pattern to copy**, and its header states the split exactly. |
| `PptxFromEvg` | display list → DrawingML, both ways round already proven. |
| `BookToPptx` | 159 lines, and its header: "This file contains no conversion. That is the point of it." |
| `book_slides.rgr` | a book, as a deck, today. Prior art for the whole trip. |

So the pipe `MdLayout → EVGDisplayList → PptxFromEvg → .pptx` **works now**.
Forty lines of wiring would produce a deck this afternoon.

It is the wrong deck, and §2 is why.

---

## 2. The finding that decides the design

`MdToEvg` emits one text command per placed SEGMENT — `MdLayout.rgr:1560`,
`MdBox.text(seg.text …)`, once per `MdSeg`. `PptxFromEvg.emitText` makes one
PowerPoint text box per text command.

> **A paragraph that wraps across five lines arrives in PowerPoint as five
> text boxes.** Two faces on a line make it six. None of them reflows, none of
> them can be edited into a sentence, and deleting a word leaves a hole.

That is fine for a book page exported to a slide, which is what `BookToPptx`
was for: a page is a picture and nobody edits it afterwards. It is the wrong
answer for a company deck, because the point of a company deck is that
somebody opens it in PowerPoint and changes the number.

So there are two roads, and the plan is about picking per BLOCK rather than
per document:

```
   heading, paragraph, list, table   ──►  MdToPptx    ──►  native text body
                                                           (PowerPoint wraps it)

   mermaid, image, anything drawn    ──►  MdToEvg     ──►  PptxFromEvg
                                          display list      (shapes, as today)
```

`PptxFromEvg` stops being the main road and becomes the **fallback for what
has no PresentationML spelling**. It is not wasted: it is exactly what a
diagram needs, and it already exists.

**The consequence, and it has to be accepted rather than engineered away:**
PowerPoint will break the lines itself, so a native text box does NOT land
where `MdLayout` put it to the point. The deck will differ from the preview by
a line break here and there. The alternative is a deck nobody can edit. The
preview's job becomes "this is what the slide holds and roughly where", not
"this is the file, pixel for pixel" — and that is worth saying out loud in the
tab, because the PDF tab beside it IS pixel for pixel and a reader will assume
the same of this one.

---

## 3. Goldmark attributes, not MDX

The right compatibility target is **CommonMark + GFM + Goldmark block
attributes**, which is what Hugo renders with. Not MDX: MDX brings JSX,
expressions, imports and component resolution, and the need here is a class
name on a list.

```md
A list of items:

- Item 1
- Item 2
- Item 3
{.c .c3}
```

`{.c .c3}` on the line after a block attaches to that block. The same syntax
works on a heading inline (`## Revenue {.section-title}`), which Goldmark also
accepts. A file written this way is a normal markdown file everywhere else —
the attribute line renders as a paragraph of literal text in a reader that
does not know it, which is ugly but not wrong, and that is the price of the
compatibility.

**What it becomes here.** Not an HTML class, because there is no HTML:

```
  MdNode
    classes = ["c", "c3"]
        │
        ↓  CssCore: which rules match, ranked
  column-count: 3
  column-gap:  28pt
        │
        ↓  MdLayout
  a column flow over the item boxes
```

and the same answer reaches WebGL, SVG, PDF and PPTX, because all four are
downstream of the layout. That is the argument for the Goldmark bet: it is one
syntax that the repository's existing CSS engine can already give meaning to.

**The bet stated as a rule, so it can be broken deliberately rather than by
accident:** a plain markdown document written in Ranger renders sensibly in
Hugo, and an attributed markdown document written for Hugo renders sensibly in
Ranger. Not pixel-identical. Sensible.

---

## 4. Where the slide breaks

The hard question, and the plan's answer is that **it is already mostly
answered** — `layoutPaged` breaks on overflow today. Slides need three more
rules on top, in this order:

```
  1  MANDATORY     an explicit {.slide}, or a heading at or above split-level
  2  FORBIDDEN     an explicit {.no-break}
  3  PREFERRED     any other heading, if the slide is more than half full
  4  FALLBACK      overflow — which is what paged layout already does
```

…plus one constraint that is not a break rule and is the thing that makes
automatic decks look hand-made:

```
  KEEP-WITH-NEXT   a heading is never the last thing on a slide
```

### The level is configuration, not a constant

```yaml
---
title: Q3 Strategy
theme: company-2026
slide-split-level: 2
slide-size: 16:9
---
```

`slide-split-level: 2` means `#` and `##` start a slide and `###` does not.
Level `1` means only `#` does.

**Flattened keys, deliberately.** `MdFrontMatter` reads `key: value` and says
so in its header — "A document that wants those wants a configuration file."
Hugo's front matter is nested, so `slides.split-level` would be the
Hugo-shaped spelling; supporting it means teaching the reader one level of
nesting, which is a real change to a file that is proud of not having it.
**Recommendation: flat keys now, and a nested reader only if a real Hugo file
turns up that needs it.** Recorded here so the choice is visible.

The stylesheet can say it too, which is what makes a company template able to
decide it:

```css
@deck {
  split-level: 2;
  aspect-ratio: 16 / 9;
  overflow: split;
}
```

### The explicit override

`---` is taken: it is a thematic break and it opens front matter. So:

```md
## Financial outlook {.slide}
## Small detail {.no-break}
```

An attribute rather than a new syntax, because §3 already has to parse
attributes and a second mechanism is a second thing to explain.

### When a slide is too full

This is the question automatic decks actually fail on, and there is no answer
that is right every time. Three, chosen per deck:

| `overflow:` | what happens |
| --- | --- |
| `split` *(default)* | a continuation slide, its title repeated. Honest and ugly. |
| `shrink` | PowerPoint's own `normAutofit`, which the model already has a field for |
| `clip` | leave it over the edge and REPORT it — for a deck somebody is going to hand-fix anyway |

Whichever is chosen, the count is printed. `book_slides.rgr` already sets that
precedent: "It prints what did NOT survive the trip, per page, because that is
the part a caller has to decide about."

---

## 5. A template is a stylesheet

`MdStyle` was built to be filled from one. `CssCore` already resolves one.
`PptxCss` already shows what binding one to a format looks like, and its header
draws the line this should copy:

> `CssCore` read the text, matched the selectors, ranked them and handed back
> the properties that apply. It has no idea what any of them MEAN. Everything
> below is the meaning.

So `MdCss` is the third such binding: which element names a markdown selector
may use (`h1`…`h6`, `p`, `ul`, `ol`, `li`, `code`, `table`, `blockquote`,
`slide`, `@page`, `@deck`), which properties inherit, and which the layout
cannot honour and says so rather than ignoring.

```css
@page  { width: 13.333in; height: 7.5in; padding: 0.65in 0.8in; }
slide  { background: white; }
h1     { font-size: 42pt; font-weight: 700; }
h2     { font-size: 28pt; margin-bottom: 18pt; }
.lead  { font-size: 22pt; max-width: 80%; }
.c2    { column-count: 2; column-gap: 36pt; }
.c3    { column-count: 3; column-gap: 28pt; }
.diagram { height: 55%; }
```

Two companies are then two files, and the same markdown previews as either
without being touched. **That is a better thing than a PowerPoint template,**
because a master slide positions boxes and this positions *semantics*: it says
what a level-2 heading is, not where a box goes.

### …and there are two CSS engines, which is worth naming

`gallery/css/CssCore.rgr` and `gallery/evg/EVGStyleSheet.rgr` both parse CSS,
written for different consumers — a general cascade with specificity, and a
deliberately small print-safe subset with `@media`, `@vars` and themes. This
plan adds a third CONSUMER and no third engine: **`MdCss` binds `CssCore`**,
because that is the one with a cascade and the one `PptxCss` proved the
binding pattern against.

Whether the two engines should become one is a separate question and a
separate change. Recorded rather than quietly settled, because adding a third
without noticing is exactly what `gallery/PLAN_EDITOR_KERNEL.md` exists to
prevent — and this plan's author has already done it once this month, with
`OfficeMeasure` beside `OfficeTextMeasure`.

---

## 6. The stages

Each is shippable on its own and each names what makes it finished.

### Stage A — the AST carries attributes

`{.class #id key=value}` on the line after a block, and inline on a heading.
`MdNode` gains `classes:[string]`, `nodeId:string`, `attrKeys`/`attrVals`.
`MdBlock` attaches a trailing attribute line to the block it follows;
`MdInline` strips a trailing one from a heading's text.

*Done when:* `markdown:spec` is unchanged at 651/652 — the attribute syntax
must not cost a single CommonMark example — and `markdown:attrs:test` covers
the awkward ones: an attribute line that is really a paragraph (`{not an
attribute}`), one after a fenced block, one inside a list item, and one at the
end of a document.

> **Done.** `MdAttrs.rgr` reads the grammar, `MdNode` carries
> `classes` / `nodeId` / `attrKeys` / `attrVals`, and `MdBlock.startAttributes`
> is a block start that INTERRUPTS a paragraph — which is what makes `{.c .c3}`
> under a list attach to the list rather than become the last words of the last
> item. `foldAttributes` moves it onto the block above and grows that block's
> span to cover the line, so the layout cache notices when a class is edited.
> 55 assertions; both ratchets unmoved.

### Stage B — `MdCss`, and `MdStyle` resolved from a sheet

The binding described in §5. `MdStyle`'s fields stop being assigned from front
matter directly and start being resolved from a sheet whose defaults are
today's numbers — so a document with no stylesheet lays out byte-identically.

*Done when:* `markdown:demo` produces the same PDF page count and the same box
list as before, with the default sheet doing the work the constants did. That
is the check: a refactor that changes a number is not a refactor.

> **Done, with one deliberate difference.** `MdStyle`'s field initialisers are
> still the defaults — there is no default sheet — and `MdCss` only ever
> overwrites what a sheet NAMES. The identity claim is then structural rather
> than measured, and `MdCssTest` asks it the same way regardless: a styled
> `MdStyle` fingerprinted against a fresh one, whole strings, not three fields
> somebody remembered.
>
> Two spellings differ from the sketch above and both are recorded in
> `MdCss.rgr`'s header. `page { }` and `deck { }` are element selectors, not
> `@page` / `@deck`: `CssCore` deliberately refuses at-rules — it records them
> as "not read here" so a consumer cannot silently apply what is inside one —
> and teaching it otherwise would change what `PptxCss` and EVG see. And
> `heading { }` carries the family and margins the six levels share, because
> there is one `headingSpaceBefore` and a per-level `margin-top` is a property
> this layout cannot honour.
>
> It found a bug rather than causing one: the layout's per-block cache keyed a
> block's boxes under its source alone, so switching the template replayed
> boxes measured under the previous one. `MdStyle.fingerprint` is now the
> other half of that key, and the same string is what `MdCssTest` compares.
> 50 assertions.

### Stage C — columns

`column-count` / `column-gap` over a block's boxes. A list of nine items in
three columns, which is the example this plan started from.

*Done when:* the items are in document order DOWN each column, the column
heights differ by at most one item, and the same document prints the same
columns to PDF as the canvas draws. A column flow that only works on screen is
a column flow that will be wrong in the deck.

> **Done.** The block is laid out ONCE at one column's width and the boxes are
> then cut into columns and moved — laying each column out separately would
> re-measure a list's marker width per column and change the balance it was
> being balanced by. The unit is the ITEM: a bullet split across two columns
> is a bullet nobody can follow.
>
> Two things that are not obvious and are written down where they are done.
> Which boxes belong to which item is read off the boxes' own source offsets,
> and a list's BULLET carries the list's offset rather than the item's — and a
> list starts where its first item does, so asking the spans alone put every
> marker in the first item's group and left the bullets behind in column one.
> The groups are emitted in order, so the rule is that a box may never belong
> to an earlier group than the box before it. And a columned block in a
> paginated layout is cut as a whole: it cannot be asked to fit before it has
> been laid out, so it is laid out, and laid out again from the top of the
> next sheet when it does not.
>
> Columns are for a block whose children are blocks — a list or a quote.
> `{.c3}` on a paragraph is a line flow, which is a different feature; it
> stays one column rather than thirding a sentence.
>
> `MarkdownWeb.pdf` builds its own layout, so it is now given the same sheet,
> the same page size and the same mode. That was the half of this stage's
> "done when" that could silently be false.

### Stage D — `layoutSlides`, and the tab

The third layout mode, with §4's four rules, over the pagination
`layoutPaged` already does. The viewer's `setPaged(boolean)` becomes
`setMode("continuous" | "paged" | "slides")` and the page grows a tab.

**No `.pptx` file is produced in this stage**, and that is the point of
splitting it out: the tab shows the EVG slide preview, so the split rules can
be tuned by changing `slide-split-level` and watching the deck reflow. The
serialization is Stage E.

*Done when:* `markdown:slides:test` holds the four rules on a fixture written
to exercise them — a heading that must break, one that must not, one kept with
its first paragraph, and a slide that overflows — and `markdown:web:test`
switches the tab in a browser and sees the command count change.

> **Done.** `layoutSlides` is `layoutPaged` with `slideBreakBefore` asked
> between blocks, and the rules are in §4's order — FORBIDDEN beats MANDATORY,
> because an author who wrote `{.no-break}` on a heading meant it and a flag
> that does nothing whenever it would matter is worse than no flag.
>
> KEEP-WITH-NEXT is asked for the PAIR: a heading's own height plus one line
> of whatever follows. The check counts the noun — slides whose lowest box is
> a heading — because a rule that fires on the wrong block still produces the
> right number of slides.
>
> Overflow is `split` and the count is printed, per the plan; `shrink` and
> `clip` are carried and named rather than silently treated as the default. A
> continuation slide repeats its title, which needed `plainText` rather than
> `literal` — a heading's literal is gone by the time the inline parser has
> finished with it.
>
> `setPaged(boolean)` became `setMode("continuous" | "paged" | "slides")`, the
> page has the third option, and the live page's own selftest switches it and
> checks that the words are the same words and only the sheet count changed —
> which is the claim this whole plan opens with. 33 assertions in
> `markdown:slides:test`, five in the browser.

### Stage E — `MdToPptx`, the native road

§2. Heading → title placeholder; paragraph → body text box; list → a text body
with `buChar` levels; table → a real table; image → a picture; fenced diagram
and anything else drawn → `MdToEvg` + `PptxFromEvg` into a group.

*Done when:* a deck exported from the sample opens in `pptx:test`'s own reader
and comes back with the same heading text, the same bullet count and the same
slide count — and `MdToPptx` reports, per slide, what went the display-list
road, the way `book_slides` does.

> **Done.** `MdToPptx` picks the road per block. A heading at or above the
> split level is the slide's TITLE PLACEHOLDER — `isPlaceholder` as well as
> the type, or the writer emits a bare `<p:nvPr/>` and a title that is not a
> placeholder is an ordinary text box, out of the outline view. A paragraph is
> one text box with one run. A list is ONE text body with one paragraph per
> item, `level` for the nesting and `buAutoNum` for an ordered one, so
> pressing return at the end of a bullet makes another and inserting one
> renumbers the rest. A table is a real `a:tbl`. A diagram is the display-list
> road, and it is counted and named.
>
> The geometry is the layout's and the wrapping is PowerPoint's, per §2.
>
> **Three things were right in the file and wrong on the screen**, which is
> why `markdown:pptx:test` counts what the RENDERER reads and not only what
> comes back through the parser:
>
>   * A table cell is a TEXT BODY. `cell.text` beside it is the shorthand the
>     writer falls back to and nothing that draws a deck reads it — the table
>     came back perfect from the file and drew as a grid of empty boxes.
>   * The grid is the layout's. `MdLayout.tableWidths` was split out of
>     `table` so the deck asks the same function; a width divided by a count
>     writes "Verkkokauppa" across the cell beside it.
>   * A diagram's scene has to be PLACED and LAID OUT before its display list
>     is built: its paths carry an `svgPath` and a `viewBox` and are put where
>     their container's box is. Built straight off the tree the edges came out
>     and every node's label landed in the corner.
>
> **And columns took two tries.** A list the sheet gives `column-count` to is
> given a wide, SHORT rectangle by the layout — as tall as one column — so one
> column of items in it overflows onto whatever is under it.
>
> The first answer was PresentationML's own: `a:bodyPr@numCol` / `@spcCol`, a
> text body that flows down the first column and into the next, which keeps
> the list ONE list. `PptxTextBody` gained `columns` and `columnGapPt`, the
> writer writes them, the parser reads them, and `PptxTextLayout` flows the
> lines into columns by PARAGRAPH so a bullet is never cut from its own words.
>
> It is the better answer and it was not a safe one. A reader that does not
> honour `numCol` stacks every item in the short rectangle and draws the block
> below on top of the overflow — which is what a real one did, from the file
> as shipped. **A deck that is only correct in some readers is not correct**,
> so the GEOMETRY carries it now: one shape per column, each at the rectangle
> the layout put that column's items in, and nothing has to be honoured.
>
> The cost is stated rather than hidden, in the exporter's notes and in its
> header: a bullet added to the end of column one is a fourth bullet in column
> one, not the first of column two. PowerPoint's own two-content layouts are
> two placeholders for the same reason. `numCol` stays in the model, the
> writer, the parser and the renderer — it is a thing PresentationML says and
> this repository could not read before — it is just not what the deck depends
> on.
>
> Which boxes belong to which item needed the rule `MdLayout`'s own column
> flow already needed, for the same reason: a list's BULLET carries the LIST's
> offset and a list starts where its first item does, so asking the source
> spans alone puts every marker in the first item and the first item then
> spans the whole list. The boxes are emitted in order, so a box may never
> belong to an earlier child than the box before it — and only boxes inside
> the block's own span are considered at all, or the heading above the list
> ends up part of its first item and the first column covers the slide.
>
> 38 assertions, through `save()` and `open()` rather than over the model.

### Stage F — themes as files, and the company deck

`theme: company-2026` resolves to a stylesheet; two example themes; the
fixture deck from §5 rendered as both.

*Done when:* one markdown file and two stylesheets give two decks that differ
in every measurement and not in a word of content.

> **Done.** `MdThemes` is the table from a NAME to a stylesheet, and it does
> not read files — `md_demo.rgr` is the only file in the module that touches a
> disk and a browser has no disk at all. A theme arrives as TEXT from whoever
> could fetch it, and the document picks one by name.
>
> Three answers, in order of who is closest to the reading: what the READER
> picked in the page, then what the DOCUMENT asked for in its front matter,
> then nothing. A name nobody registered is NAMED — "no template called
> nobodys" — rather than laid out plain in silence.
>
> The check is both halves at once, because either alone passes on a template
> that did nothing: the same words run for run across the whole deck, and a
> different size, face, position, colour and slide count. The words are
> compared with no mark for where one SHAPE ends, because that is exactly what
> a template is allowed to change — `corporate` puts a list in three boxes and
> `editorial` puts it in one. And the sheet SIZE is checked to be the same
> under both, because `deck.md` states `page: a4 landscape` itself and the
> document beats the template.

### Stage G — export, and what it costs

The `.pptx` written from the tab, plus the honest accounting: images need the
byte registry `gallery/PLAN_EDITOR_KERNEL.md` Stage B0 already lists as open
(`PptxFromEvg` counts pictures it cannot place and says why), and clips are
dropped.

> **Done.** The file is written from the ⬇ PPTX button beside ⬇ PDF, and the
> accounting is complete: pictures named but not carried, clips ignored,
> blocks drawn rather than written, blocks dropped — counted, and each one
> named per slide.
>
> **Pictures do not go, and the reason is upstream of this stage.** A markdown
> layout has no bytes for an image: `MdLayout` draws `![alt](src)` as its ALT
> TEXT in the muted colour, which is the most honest thing to draw when
> nobody read the file. So the deck carries the alt text too, and nothing is
> lost BETWEEN the preview and the deck — both are missing the same picture.
> That is the sentence the accounting makes available, so that a deck of alt
> text cannot be mistaken for a deck of pictures. Fixing it is the byte
> registry, where the layout is rather than in the exporter.
>
> Clips come from the drawings: `PptxFromEvg` counts the ones it cannot
> express and this passes the count on per slide, because a drawing that
> relied on a clip to hide something comes out showing it.

---

## 7. What must not be shared, and what must not be invented

- **No second markdown parser.** The slide layout reads the same `MdNode` tree
  the viewer does. If a slide needs something the AST cannot say, the AST
  gains it.
- **No second CSS engine.** §5.
- **No MDX.** §3.
- **No slide document model.** A deck is a layout of a markdown document, not
  a `SlideDocument` that markdown is converted into. The moment there are two
  models there are two truths and the tab stops being a switch.
- **No normalisation of the source.** `PLAN_WYSIWYG.md` §1 holds: the file is
  the document, and switching to the slides tab must not rewrite a byte.

---

## 8. Risks, stated so they can be checked

1. **The preview will not match the deck, because PowerPoint wraps the text
   itself.** §2. This is a deliberate trade and the biggest one in the plan. If
   it turns out to matter more than editability for the real use, the fallback
   is per-block: `{.flatten}` on a block that must land exactly, which takes
   the display-list road and gives up editing for that block alone.
2. **Goldmark attributes are a moving target.** The syntax is stable; which
   blocks accept one is not entirely. Mitigation: Stage A's test names the
   blocks supported, and anything else is left as literal text rather than
   guessed at.
3. **`markdown:spec` must not move.** An attribute line is a paragraph to
   CommonMark, so the parser has to recognise one without changing what a
   paragraph is. The 651/652 ratchet is the gate and it already exists.
4. **A stylesheet can say things the layout cannot do.** `PptxCss` already had
   this problem and answered it — "which properties this format cannot honour
   at all" — so `MdCss` reports rather than ignores. A silent property is a
   template that looks broken to the person who wrote it.
5. **Slide overflow has no correct answer.** §4. The mitigation is that all
   three answers are available and the count is always printed.
6. **Two CSS engines.** §5. Not this plan's to fix, but this plan is the third
   consumer and therefore the moment it stops being free to ignore.
