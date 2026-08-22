# What a document costs to edit

`npm run docx:bench` builds a document in memory — a heading every tenth
paragraph, a run of bold in each — and times what an editor does between one
frame and the next. `npm run docx:bench -- 1000` picks the size.

The numbers are from one machine and are only useful against each other. What
matters is **which of them follow the length of the document**, which is the
same question the pptx side asked in its scale phase and answered with
`gallery/pptx/docs/EDITOR_BENCH.md`.

## Before — drawing one page laid out all of them

| per operation | 125 paras | 250 | 500 | 1000 |
| --- | --- | --- | --- | --- |
| page frame | 3.50 ms | 6.04 ms | 13.20 ms | **25.64 ms** |
| keystroke | 12.01 ms | 14.78 ms | 22.53 ms | **35.43 ms** |
| undo | 10.74 ms | 13.16 ms | 20.12 ms | **33.62 ms** |

Every number doubles with the document, and for one reason: `DocxView.present`
called `DocxLayout.layout`, which lays out the WHOLE document, and then drew
one page of it. Typing paid it twice — once to edit, once to draw.

## After — the layout is kept until the document changes

| per operation | 125 paras | 500 | 1000 |
| --- | --- | --- | --- |
| page frame | 0.27 ms | 0.25 ms | 0.25 ms |
| keystroke | 8.69 ms | 7.97 ms | 8.31 ms |
| undo | 8.20 ms | 7.63 ms | 7.81 ms |
| turn the page, between two pages | 7.72 ms | — | 8.21 ms |
| turn the page, 20 different pages | 18.41 ms | 36.62 ms | 36.83 ms |

Nothing follows the length of the document any more. A page frame is **50×
cheaper** at five hundred paragraphs and **100×** at a thousand.

The two paging numbers are there to keep an honest distinction. Turning between
two pages costs the same whatever the document's length — that is the
rasterizer, and it is per-page work. Visiting twenty pages that have never been
drawn costs more because their glyphs are being rasterized for the first time.
Neither is a cost that follows the document; the second follows how much of it
you have looked at.

## How

`RichDocument.revision` is bumped by every mutating primitive in
`RichDocumentEdit`, and `DocxLayout.layoutIfNeeded` lays the document out only
when that number has moved. It is the same mechanism, and the same reasoning,
as the pptx side's shared history: **the dependency is one integer, and an
integer is a dependency that cannot be got wrong**.

Where it CAN be got wrong is a mutation that does not announce itself — a
stale layout draws the old page and nothing else notices. So the bumps are
deliberately over-eager (announcing a change that did not happen costs one
layout; missing one is a bug you find in a screenshot), a document swapped in
front of the layout calls `invalidate` rather than relying on the revision, and
`DocxTest` checks that typing and undoing both move the number.

## What is deliberately not here

Incremental layout — relaying out only the paragraphs after the edit — is the
next thing this bench would justify, and it is not done. A keystroke costs one
whole layout: 8 ms at any length, because the layout itself is dominated by
text measurement that is cached per string. That is under a frame, so the
argument for incremental layout is not yet made by the numbers.
