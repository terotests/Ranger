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
npm run pptx:test         # unit tests → ALL PASS
npm run pptx:harness      # feature matrix over all fixtures
npm run pptx:demo         # PNG snapshots in gallery/pptx/
npm run pptx:window       # WebGL present + fixture picker
npm run pptx:window:smoke
```

Open a specific deck:

```bash
npm run pptx:module
node gallery/pptx/web/serve.mjs --open --file gallery/pptx/fixtures/09-kitchen.pptx
```

## Feature harness

`harness/manifest.json` lists fixtures and declarative expectations (slide
count, text, fills, presets, groups, images, display-list depth, …). The
runner loads each deck through `PptxApp.inspectJson()`:

```bash
npm run pptx:harness
node gallery/pptx/harness/run.mjs --fixture 06-text-runs.pptx
node gallery/pptx/harness/run.mjs --json
```

Add a new feature by dropping a `.pptx` into `fixtures/`, extending
`tools/make_fixtures.py`, and appending an entry to the manifest.

## Oracles (OOXML correctness stack)

Three layers, matching the planned OSS test pile:

| Layer | Tool | Script |
| --- | --- | --- |
| A. Feature / model | Ranger `inspectJson` + manifest | `npm run pptx:harness` |
| B. Semantic | **python-pptx** vs Ranger inspect | `harness/oracles/semantic.py` |
| C. Visual | **LibreOffice** headless → PDF → `pdftoppm` vs Ranger SoftCanvas PNG | `harness/oracles/visual.py` |

```bash
# Needs: python-pptx, Pillow, soffice, pdftoppm (poppler-utils)
pip install python-pptx Pillow
sudo apt-get install libreoffice-impress poppler-utils

npm run pptx:oracles                 # A+B hard-fail, C advisory
npm run pptx:oracles:visual          # also fail on visual MAE
node gallery/pptx/harness/run_oracles.mjs --fixture 01-text.pptx
```

Artifacts land in `gallery/pptx/harness/out/<fixture>/`:

```text
ranger/slide-000.png      SoftCanvas @ 96dpi
libreoffice/slide-000.png LibreOffice reference
diff/slide-000-diff.png   side-by-side + amplified delta
python-pptx.json          semantic oracle dump
inspect.json              Ranger model summary
```

Visual compare uses mean absolute channel error (default limit 45/255). Font
rasterisation will differ — treat C as a regression signal, not pixel-perfect
truth, until shared fonts / higher fidelity land. Open XML SDK + Apache POI
`PPTX2PNG` can plug in later as layers A0 / D.## Design notes

`PptxResolver` is the long-term fidelity bottleneck (master → layout →
placeholder → theme). The first cut resolves theme colors and major/minor
fonts so business slides with `accent1` fills already look right. The same
`PptxModel` is intended to back a future slide editor on top of EVG absolute
layout — viewer and editor share the resolved scene.
