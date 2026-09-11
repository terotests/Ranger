# Markdown — a parser in Ranger, and a document EVG can print

A CommonMark + GFM parser written in Ranger, and a layout engine that turns
what it reads into the box list every EVG painter already draws. The same
document, measured once, comes out as a PDF with its fonts embedded and as a
display list a GPU can paint.

```bash
npm run markdown:test          # 139 assertions on the parser, the layout, the diagrams
npm run markdown:test:go       # …the same 115 compiled to Go (and :python to Python)
npm run markdown:spec          # score against CommonMark's own 652 examples
npm run markdown:demo          # the samples and this repository's README → PDF + HTML
npm run markdown:pdf -- FILE   # …any file you name
npm run markdown:embed         # where every diagram's marks actually landed
npm run markdown:bench         # how long each stage takes, per document
npm run markdown:web:serve     # the EDITOR, in a browser, with no server behind it
npm run markdown:web:test      # …and drive it in headless Chrome
npm run markdown:edit:test     # the caret, the patches, and undo back to the bytes
npm run markdown:semantic:test # …and that every toggle is its own inverse
npm run markdown:srcmap:test   # a character in the picture names one in the file
npm run markdown:srcmap:spec   # …scored over CommonMark's own 652 examples
```

## Editing the drawing

The preview is not a preview any more. Click it and a caret lands on the
character under the pointer; type and the FILE changes; drag to select, press
Ctrl+B and `**` appears in the source pane beside it. The toolbar does
headings, lists, quotes, links and inline code, and every one of them is one
patch on the text and one press of undo.

```
  a keystroke          → MdEditController → one MdEditOp on the source
  a click              → MdLayout.srcAtPoint → a character offset
  Ctrl+B               → MdSemanticEdit → one MdEditOp, decided against the AST
  Ctrl+Z               → OfficeHistory@(MdEditOp), shared with four editors
```

**The file is the document.** There is no rich model behind the drawing, so
nothing renormalises a hand-aligned table, a setext heading or `*` bullets
sitting beside `-` ones. Whatever an edit does, undoing it gives back the
bytes that were there — which is the one promise a markdown editor has to
make and the one a model round trip cannot.

Where the answer is not defined it says so rather than guessing: bolding a
selection that begins inside `**` and ends outside it is refused, with a
sentence saying why.

**And a keystroke may not un-write the markup.** A delimiter run closes
emphasis only when the character before it is not whitespace, so one space at
the inside edge of a bold word turns `**travels**` into four literal
asterisks — the one way ordinary typing takes valid markdown apart, and the
one thing a reader of a WYSIWYG editor should never see. The space goes on
the outside of the run instead, in the same op, so it is still one undo:

```
  **travels|**  + " "   →   **travels**|
  **|travels**  + " "   →    |**travels**
```

Inline code is left alone: a space inside backticks is content.

Typing into this repository's 63 KB README costs **10 ms**, because the
layout remembers per block — the design and the numbers are in
[`PLAN_WYSIWYG.md`](PLAN_WYSIWYG.md) §6.

## A template is a stylesheet

`{.class #id key=value}` — Goldmark's block attributes, which is the syntax a
Hugo site is already written in — parse into the AST, and a stylesheet decides
what they mean:

```md
- Verkkokauppa kasvoi 18 %
- Jälleenmyynti pysyi ennallaan
- Lisenssit laskivat 4 %
{.c3}
```

```css
page      { width: 13.333in; height: 7.5in; padding: 0.7in }
document  { font-family: Open Sans; font-size: 15pt; line-height: 1.4 }
h1        { font-size: 40pt }
heading   { font-family: Open Sans; margin-top: 26pt }
.c3       { column-count: 3; column-gap: 28pt }
```

Two companies are two files, and the same markdown previews as either without
being touched — `fixtures/themes/corporate.css` and `editorial.css` are the
two, and the page's template dropdown switches between them.

`MdCss` is the third binding of [`gallery/css`](../css/CssCore.rgr)'s cascade,
after `PptxCss` and EVG's own — not a third engine. `CssCore` matches the
selectors and ranks them; `MdCss` says which element names markdown has, where
each property lands in `MdStyle`, and **which ones this layout cannot honour**,
which are named and counted rather than dropped in a silence that reads as
"applied".

Where it stops today: the document-level style is resolved, and a block's own
`{.lead}` is parsed, carried and resolvable but not yet drawn — that is Stage C
of [`PLAN_SLIDES.md`](PLAN_SLIDES.md), along with columns, the slides tab and
the `.pptx` itself.


**651 of 652** CommonMark 0.31.2 examples, compared as exact strings against
the HTML the specification prints for each one —
[`docs/COMMONMARK_PARITY.md`](docs/COMMONMARK_PARITY.md), regenerated on every
run and ratcheted so it cannot quietly go down.

## The pipeline

```
text ──► MdBlock ──► MdInline ──► MdNode ──► MdLayout ──► MdToEvg ──► EVGElement
         (blocks)    (inlines)    (AST)      ([MdBox])                    │
                                    │                    ┌────────────────┴────────────────┐
                                    ▼                    ▼                                 ▼
                                MdToHtml          EVGPDFRenderer                   EVGDisplayList
                             (the parity oracle)      → PDF                          → WebGL 2
```

Two exporters, and only one of them is the product. `MdToHtml` exists because
HTML is the only form of the answer a specification can check; the viewer
never builds a string of tags.

## What it reads

| | |
| --- | --- |
| blocks | ATX and setext headings, paragraphs, thematic breaks, fenced and indented code, block quotes, bullet and ordered lists with tight/loose flow, HTML blocks (all seven start conditions), link reference definitions |
| inlines | emphasis and strong (the full delimiter stack, including the rule of three), code spans, links and images in all four forms, autolinks, raw HTML, HTML5 named and numeric entities, backslash escapes, hard breaks |
| GFM | tables with column alignment, task lists, strikethrough |
| beyond both | YAML front matter, and ```mermaid, ```plantuml and ```dot fences drawn as diagrams |

Every block carries `srcStart` / `srcEnd` — byte offsets into the text it came
from — so a viewer can put a caret back where a reader clicked.

## The three things worth knowing

**Emphasis is decided after the line has been read, not while.** `*` opens or
closes depending on what is on both sides of it, and which `*` pairs with
which needs the whole line. So the inline pass pushes every run of `*`, `_`
and `~` onto a delimiter stack as plain text, and `processEmphasis` walks it
backwards afterwards. `***a***`, `*a **b** c*` and `*a *b* c*` all fall out of
that one loop; a parser that decides at the first `*` gets all three wrong.

**A line is broken across faces, which EVG could not do.**
`EVGTextEngine.breakLines` breaks a paragraph of one font at one size. A
markdown paragraph is `some **bold** words and `code``: one line, four faces.
`MdLayout.breakRuns` is the same greedy algorithm with the accumulator
carrying a change of face instead of only a width, each segment measured
whole so the real advance of a space is included rather than guessed, and the
line's height and baseline taken as the maximum over its segments.

**A space between two faces is laid as advance, not as text.** It has no
glyph, so nothing is lost — and every consumer that trims the edges of a text
run then draws the same geometry the PDF does. Before that, `[LICENSE]`
followed by ` for details` lost the space in the preview and kept it in
print: one layout, two pictures.

## The files

```
src/
  MdNode.rgr        the AST — CommonMark's own node names, plus source offsets
  MdChar.rgr        the character classes the specification is written in
  MdEntities.rgr    2125 HTML5 named references (GENERATED — tools/gen-entities.mjs)
  MdBlock.rgr       phase 1: a stack of open blocks, one line at a time
  MdInline.rgr      phase 2: code spans, the delimiter stack, brackets
  MdToHtml.rgr      the exporter that exists to be scored
  MdLayout.rgr      the AST laid out: styles, runs, line breaking, pagination
  MdToEvg.rgr       boxes → EVGElement, continuous or `<print>`/`<page>`
  MdEmbed.rgr       the slot a fenced diagram fills, keyed by source and width
  MdCodeHighlight.rgr  a small lexer, fourteen languages, five colours
  MdFrontMatter.rgr    the YAML subset a metadata block actually uses
  MdAttrs.rgr       `{.class #id key=value}` — Goldmark's block attributes
  MdCss.rgr         a stylesheet over the document, through gallery/css
  MdEmbedKinds.rgr  which fence words name a drawing — no imports, read by both
  MdDiagram.rgr     the diagram handler — the only file that knows RangerFlow
  md_demo.rgr       the only file that touches a disk
web/
  markdown_web.rgr  the host seam: the only file a browser talks to
  standalone/       build.sh, index.html, standalone.mjs, smoke.mjs
tests/
  MarkdownTest.rgr  153 assertions, run on three targets
  MdSpecDump.rgr    renders the specification's examples for the harness
  MdEmbedProbe.rgr  what landed inside each diagram's box, off the display list
harness/
  spec/             CommonMark 0.31.2, pinned (CC-BY-SA-4.0)
  floor.json        the ratchet: a section may not score lower than this
bench/
  md_bench.rgr      four stages, timed separately
tools/
  markdown-parity.mjs   the score, and docs/COMMONMARK_PARITY.md
  gen-entities.mjs      regenerates the entity table
  repl.mjs              a scratch console: parse something, print HTML or XML
```

## Diagrams

A ```mermaid, ```plantuml or ```dot fence is not code and not an image: it is
a drawing that has to be **measured** before the page can be laid out around
it and **drawn** afterwards.

```
fence text ──► <notation>Render.sceneOf ──► FlowScene ──► toEvgTree()
                                                              │
                                             the same elements the rest of
                                             the document is made of
```

Nothing is rasterised on either path. In the PDF the diagram is vector
geometry with the document's fonts embedded; on a canvas it is the same
display-list commands the RangerFlow editor draws. And it is laid out at the
width of the column it lands in — a printed diagram is laid out at the
printed width rather than scaled up from a screen, which is the whole reason
to keep it as geometry.

**Three notations, one branch.** Each has exactly one door on the RangerFlow
side — text and a width in, a `FlowScene` out, no editor — and the dispatch
between a notation's own dialects happens behind that door:

| fence | door | behind it |
| --- | --- | --- |
| ```mermaid | [`MermaidRender`](../rangerflow/domains/mermaid/MermaidRender.rgr) | twenty-six dialects |
| ```plantuml, ```puml | [`PlantUmlRender`](../rangerflow/domains/plantuml/PlantUmlRender.rgr) | class, sequence, activity, component |
| ```dot, ```graphviz | [`DotRender`](../rangerflow/domains/graphviz/DotRender.rgr) | one grammar, `docs/GRAPHVIZ_PARITY.md` |

`MdDiagram` branches on the notation rather than the fence word, so `plantuml`
and `puml` are one path. The table saying which word is which lives in
`MdEmbedKinds`, which has **no imports**: the parser reads it to decide that a
fence is a slot and not code, and the renderer reads it to pick a door. A
parser that says "code" while the renderer says "diagram" leaves a hole
nobody fills, so there is one table and both read it.

`d2` is deliberately absent — RangerFlow has no D2 reader, and a fence listed
as drawable that nothing draws is worse than one left as code: it turns a
highlighted block into an empty box with an apology in it.

**How it is checked.** Not by looking at the preview — the HTML exporter
cannot draw a scene's paths (see below). `npm run markdown:embed` builds the
page, lays it out, builds the display list and reports what landed inside
each diagram's box:

```
embed mermaid at 56,143 708x160
  marks inside  26
  of them path  5
  stroke        5
  text          6
  their bounds  56,143 .. 647,259
```

The same check is two assertions in the test suite, and the PDF carries it
out: `mermaid.pdf` has 40 movetos, 224 linetos and 92 curves where the
diagram-free `sample.pdf` has none.

**Where the diagram sits in the tree.** The scene's root is kept, not
unwrapped. Flattening the diagram's elements into the page with their
coordinates shifted is the obvious thing to do and it silently loses every
edge: a scene's paths carry their geometry in an `svgPath` and a `viewBox`
and are placed by the box their container gives them, not by a left and a top
of their own.

**The cache is keyed by width.** Typing a sentence three paragraphs below a
diagram must not re-run a graph layout; re-flowing the document *narrower*
must. `MdEmbedCache` holds only `EVGElement` and two doubles, so `MdLayout`
and `MdToEvg` never learn that a graph editor exists — `MdDiagram` is the
only file in the module that imports one.

**And it is swept.** The key is the fence's *text*, so typing INSIDE a
diagram changes it on every keystroke: a store meant to hold one diagram held
one per character typed, each with an element tree hanging off it, and the
status line — which counts this store — said a one-diagram document had sixty
in it. A render is now a pass: every entry the document still wants is
touched during it, and what was not touched is dropped at the end. A pass in
which nothing changed touches everything and drops nothing.

## The page

**[terotests.github.io/Ranger/markdown/](https://terotests.github.io/Ranger/markdown/)** —
source on the left, the document on the right on a WebGL 2 canvas, and a
button that builds a PDF in the tab. No host process: a keystroke is a
function call.

```
┌──────────────────────────────────────────────────────────────────────┐
│ with diagrams ▾  open .md…  continuous ▾  ⬇ PDF  ⬇ HTML   10 blocks… │
├───────────────────────────┬──────────────────────────────────────────┤
│ # A document with…        │  A document with diagrams in it          │
│                           │  ────────────────────────────────        │
│ ```mermaid                │    ┌─────┐      ◇        yes   ┌───────┐ │
│ flowchart LR              │    │Write├─────►Render?├───────►│ Print │ │
│   A[Write] --> B{Render?} │    └─────┘      │              └───────┘ │
│ ```                       │                                          │
│  (a textarea)             │        (a WebGL 2 canvas)                 │
└───────────────────────────┴──────────────────────────────────────────┘
```

The two panes are kept in step by the character offsets the parser recorded
and nothing else: a click on the drawing puts the caret in the source, and
moving the caret scrolls the drawing. **continuous** is one column as tall as
the document; **paged** is A4 sheets with the breaks the PDF will have, so a
reader can see where page four starts before printing it.

**The PDF is built in the tab**, from the same layout the canvas is showing,
with the faces the reader's own browser fetched embedded in it. Not the
browser's print dialog: a canvas is one page as far as `window.print()` is
concerned, so that route gives a single clipped sheet.

**The faces are fetched, not named.** The layout measures with the TTF the PDF
embeds, so the line breaks on the canvas and the line breaks on the page are
the same line breaks. Ask the system for "Open Sans" instead and the three
disagree — and it looks like a bug in the line breaker.

**The page checks itself.** `?selftest=1` runs fourteen assertions inside the
page and writes the verdict into the DOM; `npm run markdown:web:test` reads it
back out of headless Chrome. They are the checks a screenshot cannot make:

```
PASS webgl2                    PASS paged has sheets (2 sheets)
PASS fonts attached            PASS paged redraws (98 commands)
PASS commands (95 commands)    PASS pdf header (%PDF-)
PASS drawn as text runs (34)   PASS pdf pages (2 page objects)
PASS diagram is geometry (18)  PASS pdf embeds fonts
PASS diagrams read (3)         PASS pdf size (137181 bytes)
PASS typing redraws (95 → 98)  PASS scrolling moves it
```

"Drawn as text runs" is there because a page that rasterized on a server and
shipped a PNG would also have draw commands.

## Where it stops

- **One CommonMark example fails**: `[ẞ]` matching `[SS]`. Reference labels
  are matched with Unicode case folding and `ẞ` folds to two characters;
  `MdChar.foldCase` is one code point in and one out. ASCII, Latin-1, Greek
  and Cyrillic fold correctly, which is every label anybody writes.
- **No monospace face.** `gallery/pdf_writer/assets/fonts` has no monospaced
  font, so code is set in the sans face that is there. It is measured and
  painted with the same one — the geometry is honest — but it is not
  monospaced. A missing asset, not a layout decision.
- **A shared EVG bug this module found, and fixed.**
  `EVGTextEngine.breakLines` returned *no lines on Go*, at any width, because
  it filled a list it had been passed rather than returning one — and on Go
  an array parameter is a slice, so the append landed on a copy. Every
  display list built from an element tree drew no text on that target.
  Nothing caught it because EVG's own suites run on JavaScript only; this
  one runs on three, and `MarkdownTest.textEngine` is the canary that keeps
  it caught.
- **The HTML preview cannot draw a diagram's edges.** `EVGHTMLRenderer`
  emits every `<svg>` at 24 pixels in the corner; RangerFlow's own HTML
  export has the same hole, so this is a defect in a shared exporter rather
  than in the embedding. The PDF and the display list are correct — see
  **Diagrams** above for how that is checked.
- **Images are their alt text.** No bytes are loaded and no picture is drawn.
- **Raw HTML is shown, not obeyed.** `MdToHtml` passes it through, because
  that is what the specification scores. The viewer draws it as a dimmed code
  block: a canvas has nothing to hand a `<div>` to.
- **A large document is slow to retype, though less than it was.**
  `npm run markdown:bench` times the stages separately:

  ```
  file             bytes   parse  layout  diagrams    tree   list   total
  sample.md          938     6.0    11.4       0.7     5.9    1.2    25.2
  code.md           1229     0.4     9.3       0.1     1.0    0.2    11.0
  README.md        63196    20.6   116.1       0.8    80.5    5.1   223.0
  ISSUES.md       137676    31.3   191.9       1.2   150.8    5.2   380.4
  CHANGELOG.md    371166    49.0   469.1       1.8   193.9    20.6  734.5
  ```

  `tree` is the `EVGElement` tree, and **only the PDF pays it** — the canvas
  goes straight from the boxes to the draw commands. So retyping README costs
  parse + layout + list = **142 ms**, down from 382 when this was first
  measured. Three things got it there, each checked rather than assumed:

  - Everything this module hands over is absolutely placed with a box the
    layout already decided, so `MdToEvg` writes the box down as the *result*
    as well as the style and `EVGLayout` need not re-derive it.
  - The canvas never wanted a tree. `MdToEvg.toDisplayList` emits the marks
    directly; `MarkdownTest.presized` compares the two roads command by
    command, which is what caught the one place they disagreed (a text
    command's height is the font's line box, not the line's).
  - `breakRuns` no longer re-measures the whole open segment once per word.
    It did, and that was quadratic in the segment — CHANGELOG.md, whose
    paragraphs are long, spent 880 ms in layout for it. A kern pair depends
    only on the two codepoints either side of the join, so measuring
    `prevAtom + word` charges the same advance and the same pair the whole
    string would be charged: the running total is the number the whole-string
    measurement gives, and within a point of the break the whole string is
    measured anyway. Layout went 880 → 460 ms there and 153 → 125 ms on this
    file, with every box in four documents landing on the same coordinate as
    before — that equality is how the change was checked.

  What is left is the layout itself — 116 ms of measuring segments whole,
  which is what makes the break land where the painter draws it. `PLAN.md`
  §9's one-frame budget is still missed, by three rather than by forty, and
  the scoped reparse is the remaining answer.
- **The source pane is a `<textarea>`.** Correct and unglamorous, which keeps
  the interesting half — parse, layout, paint, print — the only thing that
  can be wrong. Swapping in `gallery/text_editor` on the same canvas is the
  next step there.

The design these are measured against is [`PLAN.md`](PLAN.md).
