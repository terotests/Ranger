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
13. Preset + `custGeom` fills as SVG path data through EVG's `SVGPathParser`
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

## Editing

The viewer's model was always meant to drive an editor — see `PLAN_EDITOR.md`
for the phases, and for the licence rule: the feature list is read off what a
web editor like PPTist does, none of the code is.

| Phase | Items |
| --- | --- |
| E1 | Editing core: selection, hit test, transforms, snapping, z-order, group, align, insert / delete, styles, slide ops, undo / redo, host seam — **done** |
| E2 | A caret inside a shape, run-splitting styles, measured hit test — **done** |
| E2b | One shared wrap pass, so the caret follows a wrapped line; real bullets |
| E3 | Writing `.pptx` back out on `ZipWriter`, round-tripped and verified from outside — **done, flat** |
| E3b | Saving the file you opened: original parts kept, only touched slides rewritten — **done** |
| E4 | Marquee select, clipboard, format painter, flip / lock, crop, rulers |
| E4b | The slide panel: rendered thumbnails, click to go, drag to reorder |
| E5 | Themes, layouts, master editing, sections, notes |
| E6 | Transitions, animations, presenter view |
| E7 | Op-log history, dirty-rect paint, benches |

## Non-goals (for now)

Pixel-perfect PowerPoint parity, SmartArt, equations, media playback.
