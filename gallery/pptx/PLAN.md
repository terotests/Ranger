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
6. Feature harness + fixtures 01–20
7. Oracles: python-pptx semantic + LibreOffice/`pdftoppm` visual diff
8. Master / layout / placeholder inheritance (type + idx)
9. SoftCanvas PNG/JPEG blit via `PptxImageDecode`
10. Text fidelity: align, size, run color, wrap, insets, vertical anchor

## Next

| Phase | Items |
| --- | --- |
| 3 | Gradients, crop, transparency, shadows, bullets |
| 3b | Tables, more DrawingML presets, custom geometry → EVG Path |
| 3c | Charts → Vela → EVG (stretch) |
| 4 | Transitions / animations (static final state only until then) |
| 4b | Multi-face bold/italic paint, embedded fonts, UTF-8 inspect dump |

## Non-goals (for now)

Pixel-perfect PowerPoint parity, SmartArt, equations, media playback.
