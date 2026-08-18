# PPTX viewer — plan

## Goal

PPTX → normalized `PptxModel` → `PptxResolver` → resolved slide scene → EVG,
so the same scene can drive a viewer today and a slide editor later.

## Done

1. OPC package reader on `gallery/zip`
2. PresentationML / DrawingML XML walker
3. Slide order, size, shapes, text runs, pictures, groups
4. Theme color + major/minor font resolution
5. SoftCanvas PNG demo + WebGL present host (`UIInput` navigation)
6. Feature harness + fixtures 01–26
7. Oracles: python-pptx semantic + LibreOffice/`pdftoppm` visual diff
8. Master / layout / placeholder inheritance (type + idx)
9. SoftCanvas PNG/JPEG blit via `PptxImageDecode`
10. Text fidelity: align, size, run color, wrap, insets, vertical anchor
11. Two-stop linear gradients + outer shadow under SoftCanvas rects
12. Bullets (`buChar` / `buAutoNum`) as prefixed paragraph paint
13. Preset + `custGeom` path fills (`PptxGeom` + display-list kind 6)
14. DrawingML tables (`graphicFrame` / `a:tbl`) as cell grid
15. Charts → Vela PoC (`PptxChartVela`: ChartML → VL → SoftCanvas bars)
16. True multi-face bold / italic / bold-italic SoftCanvas paint

## Next

| Phase | Items |
| --- | --- |
| 3d | Multi-stop gradients, crop, transparency, richer shadows |
| 3e | Table borders/merges, more DrawingML presets, curve geom |
| 3f | Charts: pie/line polish, multi-series ChartML coverage |
| 4 | Transitions / animations (static final state only until then) |
| 4b | Embedded fonts, UTF-8 inspect dump |

## Non-goals (for now)

Pixel-perfect PowerPoint parity, SmartArt, equations, media playback.
