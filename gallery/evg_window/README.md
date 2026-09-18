# `evg_window` — EVG on the software rasteriser

The pieces of EVG that need a real font engine and a framebuffer behind
them: a dialog / window layer over the display list (`EVGWindow`), text
that stays inside its box (`EVGTextFit`), a text measurer backed by the
host's own renderer (`EVGContextMeasurer`), and the drawn ruler and
toolbar (`EVGRulerView`, `EVGToolbarView`, `EVGToolbarIcons`). The
gallery's document apps — DataGrid, the DOCX and PPTX viewers, the book
editor, Office — present through them.

They were part of `gallery/evg` until the layout engine moved to `lib/evg`
and to MIT. These files import `gallery/game_engine/ui` (the rasteriser's
`UIContext`, `UITextRenderer`, `UIInput`), which in turn imports the
`pdf_writer` font engine and the Office text stack — so they stay in the
gallery, under the AGPL, as the package `evg_window`.

```json
"dependencies": {
  "evg":        { "path": "../../lib/evg" },
  "evg_window": { "path": "../evg_window" }
}
```

```ranger
Import "pkg:evg_window/EVGWindow.rgr"
Import "pkg:evg_window/EVGToolbarView.rgr"
```

Tests: `npm run evg:a11y:test`, `npm run evg:toolbar:test`.
`npm run evg:icons:dump` traces the toolbar icons through
`tools/icon_trace_dump.rgr`.

**License: AGPL-3.0-or-later**, like the rest of `gallery/`. See
[LICENSING.md](../../LICENSING.md).
