---
title: Word
description: The DOCX viewer and editor. WordprocessingML becomes a paginated page, then an EVG display list. There is no published API yet.
---

The Word gallery reads a `.docx` package, resolves styles and numbering into
a `RichDocument`, paginates it, and paints each page through
[EVG](/Ranger/office/docs/evg/). EVG never sees `w:pStyle`, `w:numId` or
OOXML inheritance — only resolved fonts, colours and placed geometry.

There is **no published API** yet. There is no `gallery/docx_viewer/api/`
facade and no `@ranger/docx` package. This page names the demo, the source
and what works.

```text
hello.docx
     │
     ▼
 DocxPackage / WordMlParser
     │
     ▼
 WordStyleResolver / numbering / relationships
     │
     ▼
 RichDocument          paragraphs, tables, breaks
     │
     ▼
 DocxLayout            pages, headers, footers
     │
     ▼
 DocxInk  →  EVGDisplayList  →  WebGL / PNG
```

The viewer used to rasterize on a server and ship a PNG per page. The layout
did not change. The marks now become draw commands, so a machine with a GPU
draws text as text.

## Demo

The Word viewer is **not** on the GitHub Pages site yet. Build it locally:

```bash
npm run docx_viewer:web         # build gallery/docx_viewer/web/standalone/dist
npm run docx_viewer:web:serve   # serve it on :8002
npm run docx_viewer:web:test    # open it in headless Chrome
npm run docx_viewer:window      # http://127.0.0.1:8770/
npm run docx_viewer:demo        # PNG snapshots under gallery/docx_viewer/
```

Serve the `dist/` directory the build writes. The source directory next to it
holds `index.html` but not the compiled engine. A page that sits at
"starting…" with `DocxWeb is not defined` in the console is that mistake.

The page tests itself at `?selftest=1`: WebGL 2, text runs rather than one
picture, a page turn, typing, and a chart pasted from the spreadsheet.

## What works

- Styles: `docDefaults` → `basedOn` → paragraph / character style → direct
  formatting
- Text: size, bold, italic, underline, colour, alignment, indent, spacing,
  wrap
- Numbering: bullets and decimal lists from `numbering.xml`
- Tables: grid, fill, borders, `gridSpan`
- Pagination: page size, margins, portrait and landscape sections, headers
  and footers
- Images: DrawingML JPEG and PNG
- Editing MVP: Word-style keyboard, multi-paragraph selection, paste a
  spreadsheet selection as a table, paste a chart as geometry

It is not a full Word clone. There is no lossless round-trip writer yet.
Limitations are listed in
[`gallery/docx_viewer/README.md`](https://github.com/terotests/Ranger/blob/master/gallery/docx_viewer/README.md).

## Tests

```bash
npm run docx_viewer:test
npm run docx_viewer:chart:test    # copy a chart in the grid, paste it here
npm run docx_viewer:oracles       # python-docx ↔ inspectJson
```

## Source

| Path | Role |
| --- | --- |
| [`gallery/docx_viewer/`](https://github.com/terotests/Ranger/tree/master/gallery/docx_viewer) | Parser, layout, ink, editor, web host |
| [`gallery/docx_viewer/docs/PLAN.md`](https://github.com/terotests/Ranger/blob/master/gallery/docx_viewer/docs/PLAN.md) | Design notes |
| [`gallery/office/`](https://github.com/terotests/Ranger/tree/master/gallery/office) | Shared fonts, metrics, style flags |

A published facade, when it exists, will follow the PowerPoint pattern: a
headless reader and writer in `gallery/docx_viewer/api/`, documented on this
site from the comments above the declarations.
