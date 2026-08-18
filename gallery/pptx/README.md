# PPTX Lite viewer (Ranger + EVG)

Read `.pptx` packages through the gallery ZIP stack, normalize them into a
PowerPoint scene model, resolve theme colors, then paint with EVG /
SoftCanvas — the same present seam as the text editor (display list → WebGL or
CPU framebuffer).

```text
presentation.pptx
      ↓
 ZIP / OPC package          (OpcPackage + gallery/zip)
      ↓
 PresentationML / DrawingML (PptxXml + PptxParser)
      ↓
 PptxModel                  (shapes, text runs, pictures)
      ↓
 PptxResolver               (theme / scheme colors, fonts)
      ↓
 ResolvedSlide
      ↓
 PptxToEvg  →  EVGElement tree   (export / layout path)
            →  EVGDisplayList    (viewer SoftCanvas / WebGL)
      ↓
 SDL2 / PNG / WebGL / …
```

## Layout

```text
gallery/pptx/
  src/
    OpcPackage.rgr      OPC ZIP + relationships
    PptxXml.rgr         tiny XML DOM (namespace-aware local names)
    PptxModel.rgr       EMU→pt scene types
    PptxParser.rgr      presentation / slide / theme parse
    PptxResolver.rgr    schemeClr → sRGB, +mj-lt fonts
    PptxToEvg.rgr       ResolvedSlide → EVG + display list
    PptxView.rgr        SoftCanvas / sceneJson chrome
    PptxApp.rgr         UIInput navigation host
    pptx_demo.rgr       headless PNG demo
  tests/PptxTest.rgr
  fixtures/             tiny OOXML decks (STORED/DEFLATE ZIP)
  tools/make_fixtures.py
  web/                  interactive WebGL present host
```

## MVP acceptance (this PR)

- [x] Unzip PPTX via `ZipReader`
- [x] Discover slide order + `sldSz`
- [x] Rectangles / ellipses / basic preset shapes
- [x] Text boxes with runs (font size, bold, color)
- [x] Theme `schemeClr` resolution (`accent1`, `dk1`, …)
- [x] PNG/JPEG relationship targets (bytes loaded; SoftCanvas shows placeholder)
- [x] Absolute positioning + rotation field
- [x] Groups (nested child transform mapping)
- [x] Slide navigation (← → / click sides)
- [x] EVG display list → SoftCanvas PNG + WebGL host

Deliberately later: gradients, shadows, bullets, tables, charts→Vela,
masters/placeholders beyond theme colors, animations, embedded fonts.

## Run

From the repo root:

```bash
npm run pptx:fixtures     # regenerate fixtures/
npm run pptx:test         # ALL PASS
npm run pptx:demo         # PNG snapshots in gallery/pptx/
npm run pptx:window       # WebGL present (← → navigate)
npm run pptx:window:smoke
```

Open a specific deck:

```bash
npm run pptx:module
node gallery/pptx/web/serve.mjs --open --file gallery/pptx/fixtures/04-multi.pptx
```

## Design notes

`PptxResolver` is the long-term fidelity bottleneck (master → layout →
placeholder → theme). The first cut resolves theme colors and major/minor
fonts so business slides with `accent1` fills already look right. The same
`PptxModel` is intended to back a future slide editor on top of EVG absolute
layout — viewer and editor share the resolved scene.
