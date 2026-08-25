---
title: EVG
description: EVG is the layout engine and the display list that every Office application paints through.
---

EVG (Extended Vector Graphics) is the glue. Each Office application keeps its
own document model. Each one paints through the same engine, so a Word page, a
spreadsheet, a slide, a chart and a diagram can share one WebGL painter, one
PDF writer and one software rasterizer.

Without EVG, every application would walk its own tree and decide again what a
box means. Border radius would work in PDF and silently not in PNG. A sixth
backend would be a sixth copy of the walk.

## What EVG is not

EVG is not a document format for Word, Excel or PowerPoint. It does not read
`.docx`, `.xlsx` or `.pptx`. It does not know a formula, a master slide or a
style id.

EVG is a layout tree and a list of draw commands. The application resolves its
own model into geometry, colour and text, then hands that to EVG.

## Two ways in

An application can feed EVG in two ways. Both end at the same display list.

```text
  JSX / XML / TSX page                  application painter
  (PDF writer, showcase, book)          (Word, Excel, PowerPoint, diagrams)
           │                                         │
           ▼                                         │
      EVGElement tree                                │
           │                                         │
           ▼                                         │
       EVGLayout                                     │
           │                                         │
           └────────────►  EVGDisplayList  ◄─────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
              WebGL      SoftCanvas       PDF
              SVG/HTML      PNG          print
```

**The element tree** is the print and page path. A TSX or XML document becomes
`EVGElement` nodes. `EVGLayout` measures text, wraps lines, runs flex and
grid, and places boxes. The showcase at [`/evg/`](/Ranger/evg/) is this path:
one source tree, one stylesheet, two themes, and PDF / PNG / HTML from the
same page.

**The display list** is the editor path. Word, Excel, PowerPoint and Ranger
Flow do not ask EVG to paginate a CSS page. They already know where a cell, a
glyph or a shape sits. They emit `EVGDrawCmd` records — filled boxes, glyph
runs, paths, clips — and a backend consumes them.

The PDF writer for a slide uses the display list, not the element tree. The
element tree is a coarser approximation. The display list is what the software
canvas, the WebGL backend and the browser all paint, so it is where every
fidelity fix has gone.

## The display list

`EVGDisplayList` walks a laid-out tree once, or accepts commands that an
application pushed, and stores a flat array of draw commands. A command is
deliberately dumb: absolute pixels, resolved colours, no tree, no units. That
is what a GPU backend wants — quads it can batch, glyph runs it can look up
in an atlas, and clip rectangles it can push and pop.

The module is pure. It allocates no device resources, so it compiles to every
Ranger target. The same list drives WebGL in a browser and SDL2 on a desktop.

| Kind | Meaning |
| --- | --- |
| `RECT` | Filled box, possibly rounded, optional gradient and shadow |
| `BORDER` | Stroked outline |
| `IMAGE` | Textured quad |
| `TEXT` | One run on one line, already at its baseline |
| `PUSH_CLIP` / `POP_CLIP` | Scissor rectangle |
| `PATH` | Filled vector outline, as flattened rings |
| `STROKE` | Stroked vector outline |

`EVGListToElements` converts a list back into a coarse element tree so the PDF
writer needs no second input format. Word, Excel and PowerPoint emit the same
lists, so a PDF of a slide and a PDF of a sheet go through the same conversion.

## Layout (the page path)

`EVGLayout` implements a print-safe CSS subset: flex, grid, margins, padding,
absolute placement, wrapping text, and page breaks. Units include `px`, `%`,
`em`, `hp` and `fill`. Text measurement goes through `EVGTextEngine` so layout
and paint break lines at the same offsets.

The format is specified in
[`gallery/evg/SPEC.md`](https://github.com/terotests/Ranger/blob/master/gallery/evg/SPEC.md).
The showcase is the living check: every page is rendered from this checkout,
so the gallery shows what the engine in that commit actually does.

## Windows and commands

`EVGWindow` is a small dialog layer over a display list: a draggable title
bar, buttons, inputs, and a content region the owner paints itself. The
spreadsheet, the document viewer and the slide editor all present through a
display list, so a dialog that paints into one works on every backend they
use.

`EVGCommands` is a table of named commands a host can enumerate and invoke by
string (`edit.copy`, `insert.row.above`). Ranger has no closures to hand a
host, so a custom tool carries a name, not a function. The host polls the
mailbox. That shape survives a socket, where a callback could not go.

## What paints through EVG

| Application | How it reaches EVG | Demo |
| --- | --- | --- |
| PowerPoint | `PptxToEvg` writes a display list from the resolved slide | [`/pptx/`](/Ranger/pptx/) |
| Word | `DocxInk` writes a display list from the laid-out page | `npm run docx_viewer:web:serve` |
| Excel | `DataGrid` virtualizes cells onto a display list | `npm run datagrid:web:serve` |
| Diagrams | `FlowScene` draws nodes and edges onto a display list | `npm run rangerflow:demo:web` |
| Charts | Vela's `VlEvg` turns scene commands into EVG paths | [`/evg/`](/Ranger/evg/), [`/vela/`](/Ranger/vela/) |
| PDF / book | JSX → `EVGElement` → layout → PDF / PNG / HTML | [`/evg/`](/Ranger/evg/) |

A chart pasted from the spreadsheet into a Word document is the test of the
seam: the chart already spoke display list, so on the document path its
commands join the page's. Nothing is rasterized. A difference between the
backends would have to be a difference in EVG.

## Backends

| Backend | Where | What it is for |
| --- | --- | --- |
| WebGL 2 | Browser editors | Interactive paint, GPU batches |
| SoftCanvas | Tests, PNG export, headless | CPU pixels, oracles |
| PDF | `gallery/pdf_writer` | Vector print, selectable text |
| SVG / HTML | Export and debug | A picture a browser opens without WebGL |
| SDL2 + OpenGL | Native desktop | The same editor as a window |

Fonts are passed in rather than found. There is no file system in a browser.
A renderer with no faces still draws, in a bitmap fallback, rather than
refusing. That fallback is visibly wrong, which is the intended outcome.

## Source

| File | Role |
| --- | --- |
| [`gallery/evg/EVGElement.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/evg/EVGElement.rgr) | The layout tree |
| [`gallery/evg/EVGLayout.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/evg/EVGLayout.rgr) | Flex, grid, wrapping, page breaks |
| [`gallery/evg/EVGDisplayList.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/evg/EVGDisplayList.rgr) | The command list |
| [`gallery/evg/EVGWindow.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/evg/EVGWindow.rgr) | Dialogs over a display list |
| [`gallery/evg/EVGCommands.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/evg/EVGCommands.rgr) | Named commands for a host |
| [`gallery/evg/SPEC.md`](https://github.com/terotests/Ranger/blob/master/gallery/evg/SPEC.md) | The layout format |
| [`gallery/evg/showcase`](https://github.com/terotests/Ranger/tree/master/gallery/evg/showcase) | The published gallery |

```bash
npm run showcase          # build the EVG showcase
npm run showcase:gl       # check the WebGL viewer drew the pages
```

The published showcase is [`https://terotests.github.io/Ranger/evg/`](/Ranger/evg/).
