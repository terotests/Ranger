---
title: API reference
description: Generated pages for the published Office APIs. PowerPoint and Charts exist today. Word, Excel and diagrams do not yet have a facade.
sidebar:
  order: 1
---

The pages under this heading are generated from the Ranger sources that
declare each API. Do not edit them. Edit the comments above the declarations
instead, then run `npm run office:docs:generate`.

| API | Generated page | Facade |
| --- | --- | --- |
| PowerPoint | [PowerPoint](/Ranger/office/docs/reference/pptx/) | `gallery/pptx/api/PptxApi.rgr`, `PptxRenderApi.rgr`, `PptxChartApi.rgr` |
| Charts | [Charts](/Ranger/office/docs/reference/charts/) | `gallery/vela/src/VlChart.rgr` |

Guides that sit above these pages:

- [PowerPoint](/Ranger/office/docs/powerpoint/)
- [Charts](/Ranger/office/docs/charts/)
- [Word](/Ranger/office/docs/word/) — demo only, no facade
- [Excel](/Ranger/office/docs/excel/) — demo only, no facade
- [Diagrams](/Ranger/office/docs/diagrams/) — demo only, no facade

The HTML dump without this site is [`/office/reference/`](/Ranger/office/reference/).
