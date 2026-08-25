---
title: Charts
description: Vela compiles Vega and Vega-Lite. VlChart builds a chart by calling methods. PowerPoint can put the result on a slide as shapes.
---

Charts in this gallery have two published surfaces, and they meet at EVG.

**Vela** is a Vega-compatible runtime written in Ranger. A specification goes
in. A scene comes out. The scene is compared against official Vega, item for
item. An EVG backend then draws PDF, PNG and HTML.

**`VlChart`** is the other front door: a program calls methods, and the API
writes the same Vega-Lite value a parser would have produced. Nothing in
`VlChart` draws, measures or knows what a pixel is. `toSpec()` hands the
specification to the runtime that already does all three.

**`@ranger/pptx/chart`** takes that specification (or one you wrote by hand)
and puts it on a PowerPoint slide as DrawingML shapes.

```text
          VlChart.bar().x("q").y("sales")     a Vega / Vega-Lite JSON
                         │                              │
                         └──────────┬───────────────────┘
                                    ▼
                                  Vela
                     compile → scene → draw commands
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                 EVG path         SVG         PPTX shapes
              PDF / PNG / HTML              (@ranger/pptx/chart)
```

## The chart API (Vela)

There is no npm package yet. A Ranger program imports the source. The live
page on the EVG showcase loads the compiled classes into the browser, so
`chart.bar().x("region")` is those classes' own methods.

```lisp
def data (VlDataset.create())
data.row().str("region" "North").num("sales" 120.0)
data.row().str("region" "South").num("sales" 93.0)

def chart (VlChart.create(data))
chart.size(300 200)
chart.bar().x("region").y("sales")

def spec:VlJson (chart.toSpec())
```

Four rules the API follows:

1. The fluent surface is not the engine. Every call writes into a
   specification. The runtime draws.
2. A view's encoding is inherited by its marks. `chart.x(...)` is said once
   and every mark reads it.
3. A channel need not state its type. A column of numbers is a quantity. A
   column of ISO dates is an instant. Anything else is a name.
4. The data is a value beside the chart. One dataset can feed several charts.

The full method list is the [Charts API reference](/Ranger/office/docs/reference/charts/).
It is generated from `gallery/vela/src/VlChart.rgr`.

## Demos that are on the public site

| Demo | URL | What it is |
| --- | --- | --- |
| EVG showcase | [`/evg/`](/Ranger/evg/) | Fifty charts on printed pages, two or three themes, PDF / PNG / HTML / WebGL from one tree. |
| Chart API, live | [`/evg/chart-api/`](/Ranger/evg/chart-api/) | Type `chart.bar().x("region")` in the browser. JavaScript and Ranger tabs. |
| Paste a specification | [`/vela/`](/Ranger/vela/) | Paste Vega or Vega-Lite JSON and see what this commit's runtime draws. |
| Chart on a slide | [`/office/`](/Ranger/office/) | The PowerPoint API playground. `@ranger/pptx/chart` is on that surface. |

The showcase page **Charts, called** is generated from the calls in
`gallery/vela/tools/vela_chart_page.rgr`. The lines printed above each chart
are read out of that file, so the code the page shows and the code that drew
the page cannot drift apart.

## Charts on a PowerPoint slide

```js
import { Chart } from "@ranger/pptx/chart";

new Chart().font("Calibri").addTo(slide, {
  width: 460, height: 260,
  data: { values: [{ q: "Q1", revenue: 28 }, { q: "Q2", revenue: 55 }] },
  mark: "bar",
  encoding: {
    x: { field: "q", type: "nominal" },
    y: { field: "revenue", type: "quantitative" },
  },
}, 70, 110, 620, 380);
```

This is not a PowerPoint chart part (`c:chart` plus an embedded workbook).
It is a group of shapes. Ungrouping in PowerPoint leaves the bars and the
labels behind as shapes, which is the point of not shipping a picture.

The methods are in the [PowerPoint API reference](/Ranger/office/docs/reference/pptx/#chart)
under Charts.

## Charts in the spreadsheet

The Excel editor can hold a chart on a sheet. The chart is a Vela
specification drawn into the grid's own display list. There is no published
facade for that path yet. See [Excel](/Ranger/office/docs/excel/) for the
demo commands.

A chart copied in the grid can be pasted into the Word viewer. Both speak
display list, so the paste is geometry, not a bitmap.

## Local commands

```bash
npm run vela:web              # the paste-a-specification page
npm run showcase              # the EVG gallery, including generated chart pages
npm run showcase:api          # the live VlChart page, checked in Chromium
npm run vela:chart            # build charts from VlChart calls, write SVG
```

## Source

| Path | Role |
| --- | --- |
| [`gallery/vela/src/VlChart.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/vela/src/VlChart.rgr) | The chart API |
| [`gallery/vela/src/`](https://github.com/terotests/Ranger/tree/master/gallery/vela/src) | Compiler, runtime, SVG and EVG backends |
| [`gallery/pptx/api/PptxChartApi.rgr`](https://github.com/terotests/Ranger/blob/master/gallery/pptx/api/PptxChartApi.rgr) | Vega onto a slide as shapes |
| [`gallery/vela/README.md`](https://github.com/terotests/Ranger/blob/master/gallery/vela/README.md) | Status, parity numbers, what is not there yet |
