# PPTX viewer (Ranger + EVG)

Read `.pptx` packages through the gallery ZIP stack, normalize them into a
PowerPoint scene model, resolve theme → master → layout → slide inheritance,
then paint with EVG / SoftCanvas — the same present seam as the text editor
(display list → WebGL or CPU framebuffer).

```text
presentation.pptx
      ↓
 ZIP / OPC package          (OpcPackage + gallery/zip)
      ↓
 PresentationML / DrawingML (PptxXml + PptxParser)
      ↓
 PptxModel                  (shapes, text runs, pictures, placeholders)
      ↓
 PptxResolver               (theme + master/layout/placeholder merge)
      ↓
 ResolvedSlideScene
      ↓
 PptxToEvg  →  EVGElement tree   (export / layout path)
            →  EVGDisplayList    (viewer SoftCanvas / WebGL)
      ↓
 SoftCanvas (PNG/JPEG blit) / WebGL / …
```

EVG never sees relationship IDs, masters, `schemeClr`, or placeholder rules —
only resolved geometry, sRGB, fonts, and image part paths.

## Layout

```text
gallery/pptx/
  src/
    OpcPackage.rgr      OPC ZIP + relationships
    PptxXml.rgr         tiny XML DOM (preserves a:t leading spaces)
    PptxModel.rgr       EMU→pt scene types + placeholders
    PptxParser.rgr      presentation / slide / theme / master / layout
    PptxResolver.rgr    theme → master → layout → slide
    PptxImageDecode.rgr PNG/JPEG bytes → ImageBuffer
    PptxGeom.rgr        Preset / custGeom unit polygons
    PptxChartVela.rgr   ChartML → VL JSON → Vela → display list
    PptxToEvg.rgr       ResolvedSlide → EVG + display list
    PptxView.rgr        SoftCanvas / sceneJson (+ image cache)
    PptxEdit.rgr        editing core: selection, transforms, history
    PptxApp.rgr         UIInput navigation + editing host
    pptx_demo.rgr       headless PNG demo
    pptx_oracle_dump.rgr  inspect.json + oracle PNGs
  harness/              feature + semantic + visual oracles
  fixtures/             OOXML decks 01–26
  tools/make_fixtures.py
  web/                  interactive WebGL present host
```

## Fidelity (current)

- [x] Slide order + `sldSz` (including widescreen)
- [x] Rect / ellipse / preset shapes + groups
- [x] Theme `schemeClr` / major-minor fonts
- [x] Master + layout backgrounds and chrome shapes
- [x] Placeholder match by `type` / `idx` with geometry + style inheritance
- [x] PNG + JPEG SoftCanvas blit (`PptxImageDecode` + `blitImageRectScaled`)
- [x] WebGL host serves OPC media via `/part/ppt/media/…` + `loadImages`
- [x] Text: align L/C/R (measured), font size, bold/italic/bold-italic faces,
      run color, insets, wrap, vertical anchor (top/middle/bottom estimate)
- [x] Two-stop linear gradients + outer shadow under SoftCanvas rects
- [x] Bullets (`buChar` / `buAutoNum`) as indented prefixes
- [x] Preset + `custGeom` path fills (triangle / diamond / chevron / star / …)
- [x] Tables (`graphicFrame` / `a:tbl`) as cell grid + text
- [x] Charts → Vela PoC (bar ChartML → VL → SoftCanvas)
- [x] UIInput navigation + fixture picker; chrome shows deck name + slide index
- [x] Oracles: feature harness, python-pptx semantic, LibreOffice visual MAE

Still later: multi-stop gradients, crop/transparency, table merges, richer
ChartML (pie/line/multi-series), curve geom, animations, embedded fonts.

## Editing

The viewer is a mode away from being an editor. `PptxEdit.rgr` is the editing
core — host-agnostic, in slide points — and `PptxApp` is the only place a
window pixel becomes one:

- [x] Edit mode (`edit.toggle`, Ctrl+E). A deck opened to read stays read-only
- [x] Click to select, shift-click to add, Ctrl+A for the lot; master / layout
      chrome is drawn but never selectable
- [x] Drag to move, eight handles to resize, rotation-aware hit testing
- [x] Alignment guides: shape edges, shape centres and the slide's own thirds
- [x] Align 6 ways, distribute across / down, z-order, group / ungroup
- [x] Insert box / ellipse / text box / picture, delete, duplicate
- [x] Fill, outline, opacity, preset, and bold / italic / size / colour / align
      on a shape's text
- [x] Slides: add, duplicate, delete, reorder
- [x] Undo / redo — a drag is one step, a burst of typing is one step
- [x] The selection outline and its handles are pushed into the same
      `EVGDisplayList` as the slide, so WebGL and SoftCanvas both draw them and
      an export has none of them

Not yet: a text caret (typing appends), saving back to `.pptx`, clipboard,
crop, animations. `PLAN_EDITOR.md` has the phases, and the licence rule that
governs them — none of this is derived from another editor's source.

```bash
npm run pptx:editor:test        # the editing core
npm run pptx:editor:host:test   # pointer, keys, overlay, commands
```

## Running it in a browser, with no host

```bash
npm run pptx:web         # build gallery/pptx/web/standalone/dist
npm run pptx:web:serve   # …and serve it on :8001
npm run pptx:web:test    # open it in headless Chrome and page through a deck
```

The viewer always built a display list and the host always drew it with WebGL;
HTTP was the only thing in between, and Ranger compiles to JavaScript, so the
viewer can be in the page instead. What is left of the host is a static file
server.

A browser cannot read files, so the fonts and the deck arrive as bytes
(`OpcPackage.openBytes` over `ZipReader.openBytes`). The deck's pictures come
out of the package with it — the parser already leaves the bytes on the model —
so the page turns those into textures directly rather than asking a server for
them, which is also why pictures appear in the WebGL path at all now.

## Run

```bash
npm run pptx:fixtures
npm run pptx:test
npm run pptx:editor:test
npm run pptx:editor:host:test
npm run pptx:harness
npm run pptx:oracles          # A+B+C (LibreOffice visual)
npm run pptx:oracles:visual   # fail on visual MAE
npm run pptx:demo
npm run pptx:window           # WebGL + fixture picker
```

Open the business deck:

```bash
npm run pptx:module
node gallery/pptx/web/serve.mjs --open --file gallery/pptx/fixtures/20-business-deck.pptx
```

## Fixtures

| # | Focus |
|---|---|
| 01–10 | MVP unit decks (text, shapes, image, group, theme, kitchen, widescreen) |
| 11–15 | Master / layout / placeholder inheritance |
| 16–18 | PNG / JPEG / mixed SoftCanvas images |
| 19 | Text align, sizes, wrap, run styles |
| 20 | Widescreen business deck (5 slides, mixed layouts) |
