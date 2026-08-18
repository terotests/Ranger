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
    PptxToEvg.rgr       ResolvedSlide → EVG + display list
    PptxView.rgr        SoftCanvas / sceneJson (+ image cache)
    PptxApp.rgr         UIInput navigation host
    pptx_demo.rgr       headless PNG demo
    pptx_oracle_dump.rgr  inspect.json + oracle PNGs
  harness/              feature + semantic + visual oracles
  fixtures/             OOXML decks 01–20
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
- [x] Text: align L/C/R (measured), font size, bold/italic flags, run color,
      insets, wrap, vertical anchor (top/middle/bottom estimate)
- [x] UIInput navigation + fixture picker; chrome shows deck name + slide index
- [x] Oracles: feature harness, python-pptx semantic, LibreOffice visual MAE

Still later: gradients, shadows, bullets, tables, charts→Vela, true multi-face
bold paint, animations, embedded fonts, full DrawingML geom paths.

## Run

```bash
npm run pptx:fixtures
npm run pptx:test
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
