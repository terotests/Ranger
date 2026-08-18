# PPTX Lite — plan

## Goal

PPTX → normalized `PptxModel` → `ResolvedSlide` → EVG, so the same scene can
drive a viewer today and a slide editor later.

## Done (MVP)

1. OPC package reader on `gallery/zip`
2. PresentationML / DrawingML XML walker
3. Slide order, size, shapes, text runs, pictures, groups
4. Theme color + major/minor font resolution
5. SoftCanvas PNG demo + WebGL present host (`UIInput` navigation)
6. Feature harness (`harness/manifest.json` + `run.mjs`) with 10 fixtures
7. Oracles: python-pptx semantic + LibreOffice/`pdftoppm` visual diff

## Next

| Phase | Items |
| --- | --- |
| 2 | Gradients, image decode on SoftCanvas, crop, transparency, shadows, bullets |
| 2b | Master / layout / placeholder inheritance (`PptxResolver` depth) |
| 3 | Tables, more DrawingML presets, custom geometry → EVG Path |
| 3b | Charts → Vela → EVG |
| 4 | Transitions / animations (static final state only until then) |

## Non-goals for MVP

Pixel-perfect PowerPoint parity, SmartArt, equations, media playback.
