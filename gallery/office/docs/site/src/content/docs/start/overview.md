---
title: The Office stack
description: What the Office applications share, and what they keep apart.
---

There are three OOXML editors in the gallery — Word, Excel and PowerPoint —
and they are three different applications. A fourth editor, the book composer,
uses the same infrastructure and is not an OOXML application at all.

> Do not merge Word, Excel and PowerPoint into one document model. Merge the
> infrastructure underneath them.

## What they share

```text
                    application
              (Word / Excel / PowerPoint /
               diagrams / book / charts)
                         │
                         │  own document model
                         ▼
              gallery/office  (fonts, metrics,
              history, colour, preset geometry)
                         │
                         ▼
                      EVG
              element tree  or  display list
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       WebGL        SoftCanvas         PDF
      (browser)      (PNG)           (print)
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                   SVG / HTML / SDL2
```

| Layer | Directory | What it does |
| --- | --- | --- |
| Document model | `gallery/docx_viewer`, `gallery/datagrid`, `gallery/pptx`, `gallery/rangerflow` | The format. Each application owns this. |
| Package | [`gallery/ooxml`](https://github.com/terotests/Ranger/tree/master/gallery/ooxml) | OPC ZIP: parts, content types, relationships. |
| Infrastructure | [`gallery/office`](https://github.com/terotests/Ranger/tree/master/gallery/office) | Fonts, text metrics, style flags, theme colour, preset geometry, undo rules. |
| Paint | [`gallery/evg`](https://github.com/terotests/Ranger/tree/master/gallery/evg) | Layout, display list, windows, backends. |

EVG never sees a relationship id, a master slide, a formula or a `w:pStyle`.
It sees resolved geometry, sRGB, fonts and draw commands. That cut is the
reason one painter can draw every application.

## What they do not share

| Application | Model | Hard problem |
| --- | --- | --- |
| Word | `RichDocument` → paginated `DocxLayout` | Flow across pages, styles, numbering |
| Excel | `WorkbookModel` + formula engine → virtualized `DataGrid` | Cells, freeze, formulas, 100 000 rows |
| PowerPoint | `PptxModel` → theme / master / layout / slide | Placeholders, DrawingML geometry |
| Diagrams | `FlowScene` | Ports, edge routing, large graphs |
| Charts | Vega scene → Vela commands | Scales, marks, the grammar |

## Published APIs

A published API is a facade in `gallery/*/api/` that a program outside this
repository can call. The editor is not that facade: `PptxApp` owns a view, a
selection, a scroll offset, an undo history and a text caret. A build server
that rewrites a title should not construct any of that.

| API | Package | Status |
| --- | --- | --- |
| PowerPoint document, render, chart-on-slide | `@ranger/pptx` | Published. See [PowerPoint](/Ranger/office/reference/powerpoint/) and the [API reference](/Ranger/office/reference/pptx/). |
| Charts (Vela) | `gallery/vela/src/VlChart.rgr` | Ranger API, live in the browser. See [Charts](/Ranger/office/reference/charts/) and the [API reference](/Ranger/office/reference/vela/). |
| Word | — | Editor and demo. No facade yet. |
| Excel | — | Editor and demo. No facade yet. |
| Diagrams | — | Editor and demo. No facade yet. |

## Source

The Office directory is [`gallery/office`](https://github.com/terotests/Ranger/tree/master/gallery/office).
The applications sit beside it. Gallery code uses the AGPL. See
[Licenses](/Ranger/office/reference/start/licenses/).
