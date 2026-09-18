# Erazer

A **bitmap UI screenshot → EVG layout** tool. The gallery already has
[`EvgBitmapTracer`](../evg/EvgBitmapTracer.rgr) for photographs: it follows ink
and emits paths. Erazer looks at the same pixels and asks a different question —
which **widgets** are here, how they nest, and what EVG tree would reconstruct
the screen.

**License: AGPL-3.0-or-later** (Gallery).

## What it looks for

| Kind | How it is guessed |
| --- | --- |
| Nested panels | Connected components of similar colour, then bbox containment |
| Text | Small ink runs clustered onto a baseline; font size from glyph height, colour from the ink |
| Characters | A 5×7 atlas (the same face the tests paint with). On a real screenshot the run, size and colour still land even when the glyph is not in the atlas |
| Button | Compact rectangle, centred label, often an accent fill |
| Text field | Wide light rectangle, left-aligned text or empty interior, optional border |
| Checkbox | Small square, solid or a hollow frame |
| Tabs | Three or more sibling labelled bars on one row |
| Menu | Three or more stacked labelled rows |
| Form | A panel that holds two or more fields |
| Icon | A small non-text mark; vectorized with `EvgBitmapTracer` to SVG / EVG paths |

The EVG tree uses `position: absolute` so the reconstruction keeps the
screenshot's geometry. Each node carries `class-name` `erazer-button`,
`erazer-textfield`, `erazer-checkbox`, `erazer-tab`, `erazer-menu`, …
so a later pass can restyle it.

## Commands

```sh
npm run erazer:test                 # synthetic UI fixtures (form, tabs, menu, icon)
npm run erazer -- in.png out.evg.json
npm run erazer -- in.png out.evg.json --overlay boxes.svg --outline
npm run erazer:web:serve            # live page at http://localhost:8008/
```

`--ocr false` still reports where the text is and how tall and what colour;
it skips the atlas. `--vectorizeIcons false` leaves icons as labelled boxes.

The live page paints the same fixtures the tests use — a form, tabs, a menu,
a plus icon — and also accepts a PNG/JPEG drop. Nothing is uploaded.

## Files

| File | |
| --- | --- |
| `Erazer.rgr` | region grow, nesting, heuristics, EVG emit |
| `ErazerTypes.rgr` | options, regions, the result tree |
| `ErazerFont.rgr` | 5×7 face: paint and read |
| `ErazerPaint.rgr` | synthetic UI-library screenshots |
| `erazer_cli.rgr` | PNG/JPEG in, `.evg.json` out |
| `ErazerTest.rgr` | the fixtures, asserted |
| `web/` | the live page |

It is a heuristic. A photograph of a Mac settings panel will not come back as
production TSX. The claim the tests make is narrower and checkable: when the
input is a form, the tree has fields, a button, a checkbox and the labels
`Name` / `Email` / `OK`; when the input is three tabs, there are three tabs.
