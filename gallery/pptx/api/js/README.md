# @ranger/pptx

Open a `.pptx`, read it, change it, write it back — and draw it to PNG or PDF.

```js
import { Pptx } from "@ranger/pptx";

const deck = Pptx.open(await fs.readFile("template.pptx"));
deck.slide(0).shapeNamed("Title").setText("Q3 review");
await fs.writeFile("out.pptx", deck.save());
```

`save()` writes over the package the deck was opened from. Every part this API
does not model — animations, embedded workbooks, custom XML, whatever a later
PowerPoint adds — is copied through byte for byte, and only the slides that
changed are rewritten. `saveNew()` builds a package from the model alone, which
is right for a deck this API created and wrong for one it opened.

## Building a deck

```js
const deck = Pptx.create();               // 960 × 540 points, no slides
const slide = deck.addSlide().background("FFFFFF");

slide.addTextBox(60, 60, 840, 120, "Quarterly review")
     .setName("Title")
     .run(0, 0).font("Calibri", 40).bold().color("#1F3864");

slide.addShape("roundRect", 60, 220, 300, 160)
     .fill("4472C4")
     .line("1F3864", 2);
```

Positions are in **points** from the slide's top left — the file stores English
Metric Units and nothing above this line ever sees one. `addShape` takes any of
the 187 preset geometries ECMA-376 defines.

## Drawing

The renderer is a separate entry point because its bundle is five times the
size: the document API is a ZIP reader, an XML parser and a writer, and the
renderer adds a canvas, a font manager, image decoders and a PDF writer.

```js
import { Renderer } from "@ranger/pptx/render";

const r = new Renderer().useFontDir("path/to/fonts");
await fs.writeFile("slide.png", r.toPng(deck, 0, 2));   // 2 × 96dpi
await fs.writeFile("deck.pdf", r.toPdfDeck(deck));      // a page per slide
```

Fonts are passed in rather than found, because this has to run in a browser
too: `addFont(family, bytes)` and `addFace(bytes)` take them from anywhere.
`scale` multiplies 96 dots per inch rather than naming a pixel width, because a
deck's pages can differ in size.

The PDF is vector: the text is text a reader can select and search, drawn in
the face the deck was measured in and embedded once for the whole document.

Pictures print too. A `.pptx` names its pictures by package part and carries
the bytes inside the ZIP, so they are handed to the PDF writer directly rather
than looked for on disk — which means this works in a browser as well.
`renderer.imagesPrinted` reports whether the last PDF carried them.

## Charts, as shapes rather than as a picture

```js
import { Chart } from "@ranger/pptx/chart";

new Chart().font("Calibri").addTo(slide, {
  width: 460, height: 260,
  data: { values: [{ q: "Q1", revenue: 28 }, { q: "Q2", revenue: 55 }] },
  mark: "bar",
  encoding: { x: { field: "q", type: "nominal" },
              y: { field: "revenue", type: "quantitative" } },
}, 70, 110, 620, 380);
```

A Vega or Vega-Lite specification, compiled and put on the slide as DrawingML:
`prstGeom` rectangles for the bars, lines for the gridlines, `custGeom` for the
areas and the wedges, text boxes for the labels. Not a picture — which is what
"export chart to PowerPoint" normally means, and what costs you the resolution,
the editability and the text.

Measured on a four-bar chart with both axes: 35 shapes, 14.5 KB of slide XML
that deflates to 1.4 KB, against 30.7 KB for a 1280×720 PNG of the same slide.
Every bar is selectable, every label is editable, and the numbers are in
`slide.text`, so a search index and a screen reader both reach them.

It is a third entry point for the same reason `render` is a second one: the
bundle behind it carries a Vega compiler, its expression language and its
scales, and a build step that only fills in a template should not.

`addTo` returns the GROUP. The chart keeps the aspect ratio the specification
asked for and is centred in the box, so state the size in the specification and
the room in the box.

## What throws

A failure is an exception, not a value nobody checked: bytes that are not a
readable package, an index past the end of the slides or shapes, a slide that
could not be drawn. `shapeNamed` answers `null` when nothing matches, because
that is a question with a legitimate negative answer.
