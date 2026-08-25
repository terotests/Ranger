---
title: PowerPoint
description: Read, write, draw and edit .pptx decks. The published API is @ranger/pptx. The editor runs in the browser with no server.
---

The PowerPoint gallery reads a `.pptx` package, resolves theme → master →
layout → slide, and paints the result through [EVG](/Ranger/office/docs/evg/).
It is also a published JavaScript API: a program can open a deck, change it
and write it back without constructing the editor.

```text
presentation.pptx
      │
      ▼
 ZIP / OPC package          gallery/ooxml
      │
      ▼
 PresentationML / DrawingML PptxParser
      │
      ▼
 PptxModel
      │
      ▼
 PptxResolver               theme + master + layout + placeholders
      │
      ▼
 PptxToEvg  →  EVGDisplayList  →  WebGL / PNG / PDF
```

EVG never sees relationship ids, masters, `schemeClr` or placeholder rules —
only resolved geometry, sRGB, fonts and image bytes.

## The published API

Install the package:

```js
import { Pptx } from "@ranger/pptx";

const deck = Pptx.open(bytes);
deck.slide(0).shapeNamed("Title").setText("Q3 review");
const out = deck.save();
```

Three entry points, because in Ranger an import is not lazy. The one you
import decides what you carry:

| Import | Bundle | What it is for |
| --- | --- | --- |
| `@ranger/pptx` | ZIP, XML, model, writer | Headless edit. No canvas and no fonts. |
| `@ranger/pptx/render` | + rasterizer, fonts, PDF | PNG and PDF. |
| `@ranger/pptx/chart` | + Vela | A Vega specification onto a slide as DrawingML shapes. |

`save()` writes over the package the deck was opened from. Every part the API
does not model is copied through byte for byte. `saveNew()` builds a package
from the model alone. Use `save()` on a deck you opened and `saveNew()` on a
deck you created.

The full method list is the [PowerPoint API reference](/Ranger/office/docs/reference/pptx/).
It is generated from `gallery/pptx/api/PptxApi.rgr`, `PptxRenderApi.rgr` and
`PptxChartApi.rgr`.

A shorter walkthrough lives in
[`gallery/pptx/api/js/README.md`](https://github.com/terotests/Ranger/blob/master/gallery/pptx/api/js/README.md).

## Demos

| Demo | URL or command | What it is |
| --- | --- | --- |
| Editor, JavaScript | [`/pptx/`](/Ranger/pptx/) | Parse a deck in the page, draw it with WebGL, edit it. No server. |
| Editor, WebAssembly | [`/pptx-wasm/`](/Ranger/pptx-wasm/) | The same editor, compiled Ranger → C++ → WASM. |
| API playground | [`/office/`](/Ranger/office/) | Code on the left writes a deck. The editor on the right opens the bytes. |
| API reference (HTML dump) | [`/office/reference/pptx/`](/Ranger/office/reference/pptx/) | The same generated reference, without this site around it. |

The playground is the check that the writer and the reader agree. A unit test
on either alone does not prove that.

```bash
npm run pptx:web              # build gallery/pptx/web/standalone/dist
npm run pptx:web:serve        # serve it on :8001
npm run pptx:web:test         # open it in headless Chrome
```

## Charts on a slide

`@ranger/pptx/chart` compiles a Vega or Vega-Lite specification and puts it on
the slide as ordinary DrawingML shapes — not as a picture. Bars are
rectangles, labels are text boxes, areas are custom geometry. They scale
without blurring, and the numbers are in `slide.text`.

That API is documented with the rest of the PowerPoint surface, and the
[Charts](/Ranger/office/docs/charts/) guide describes Vela, which compiles the
specification.

## Source

| Path | Role |
| --- | --- |
| [`gallery/pptx/api/`](https://github.com/terotests/Ranger/tree/master/gallery/pptx/api) | The published facades and the JavaScript wrapper |
| [`gallery/pptx/src/`](https://github.com/terotests/Ranger/tree/master/gallery/pptx/src) | Parser, model, resolver, writer, editor, painter |
| [`gallery/pptx/web/`](https://github.com/terotests/Ranger/tree/master/gallery/pptx/web) | Browser hosts: standalone editor, API playground, WASM |
| [`gallery/office/`](https://github.com/terotests/Ranger/tree/master/gallery/office) | Fonts, metrics, preset geometry, history |

```bash
npm run pptx:test             # Ranger tests
npm run pptx:web:test         # the standalone page in headless Chrome
```
