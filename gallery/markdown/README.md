# Markdown — a parser in Ranger, and a document EVG can print

A CommonMark + GFM parser written in Ranger, and a layout engine that turns
what it reads into the box list every EVG painter already draws. The same
document, measured once, comes out as a PDF with its fonts embedded and as a
display list a GPU can paint.

```bash
npm run markdown:test          # 62 assertions on the parser, the layout, the EVG tree
npm run markdown:test:go       # …the same 62 compiled to Go (and :python to Python)
npm run markdown:spec          # score against CommonMark's own 652 examples
npm run markdown:demo          # the sample and this repository's README → PDF + HTML
npm run markdown:pdf -- FILE   # …any file you name
```

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
| beyond both | YAML front matter |

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
  md_demo.rgr       the only file that touches a disk
tests/
  MarkdownTest.rgr  62 assertions, run on three targets
  MdSpecDump.rgr    renders the specification's examples for the harness
harness/
  spec/             CommonMark 0.31.2, pinned (CC-BY-SA-4.0)
  floor.json        the ratchet: a section may not score lower than this
tools/
  markdown-parity.mjs   the score, and docs/COMMONMARK_PARITY.md
  gen-entities.mjs      regenerates the entity table
  repl.mjs              a scratch console: parse something, print HTML or XML
```

## Where it stops

- **One CommonMark example fails**: `[ẞ]` matching `[SS]`. Reference labels
  are matched with Unicode case folding and `ẞ` folds to two characters;
  `MdChar.foldCase` is one code point in and one out. ASCII, Latin-1, Greek
  and Cyrillic fold correctly, which is every label anybody writes.
- **No monospace face.** `gallery/pdf_writer/assets/fonts` has no monospaced
  font, so code is set in the sans face that is there. It is measured and
  painted with the same one — the geometry is honest — but it is not
  monospaced. A missing asset, not a layout decision.
- **`mermaid` fences are a slot, not a drawing.** `MdLayout` reserves the
  box and marks it; nothing fills it in yet. The reader that would —
  `rangerflow/domains/mermaid` — needs its dispatch lifted out of the web
  facade first. [`PLAN.md`](PLAN.md) §5.2.
- **Images are their alt text.** No bytes are loaded and no picture is drawn.
- **Raw HTML is shown, not obeyed.** `MdToHtml` passes it through, because
  that is what the specification scores. The viewer draws it as a dimmed code
  block: a canvas has nothing to hand a `<div>` to.
- **No page furniture.** Front matter is parsed and kept, and nothing yet
  reads `page:` or `margin:` out of it. Running heads, page numbers and a
  table of contents are not written.
- **No page yet.** The GitHub Pages viewer — a source pane, a WebGL canvas
  and a PDF built in the tab — is the next phase, and the layout above is
  what it will draw.

The design these are measured against is [`PLAN.md`](PLAN.md).
