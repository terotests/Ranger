# EVG showcase

A gallery of what the EVG layout engine can do, built from this directory and
published to `/evg/` on the project's GitHub Pages site.

```
npm run showcase          # -> gallery/evg/showcase/dist/index.html
npm run showcase:gl       # check the WebGL viewer actually drew the pages
```

The index opens with a list of every page, because fourteen sections is more
than a reader should have to scroll past to find one. Each entry opens the rendered
page itself; the *details* link beside it jumps to that page's section, where
its other themes and its PDF, PNG and WebGL versions are.

Each page is rendered under **two themes** — the generated chart pages under
**three**, adding `autumn` — and to **three targets** — PDF (the
print target), PNG (the raster preview) and HTML (the debug view) — from one
source tree and one stylesheet.

### Live pages (not pre-rendered)

Everything else here is drawn ahead of time and published as a file.

[`chart-api/`](../../vela/web/chart_api.html) **runs**: it loads Vela's chart
API — compiled from `gallery/vela/tools/vela_chart_web.rgr` to a browser bundle
— and calls it with what a reader types, redrawing as they edit. The page
speaks **JavaScript** first: the bundle publishes the compiled `VlChart`,
`VlChartMark` and `VlDataset`, and `chart.bar().x("region")` in the editor is
those classes' own methods, with no binding layer in between. **Ranger** is the
second tab, through a small dispatcher, and the same chart in either language
draws the same SVG byte for byte. A PDF proves the API built a chart once on a
build machine; this is what proves the API still runs where the reader is.
`npm run showcase:api` opens it in Chromium and checks all of it — 22 checks.

[`responsive/`](../web/responsive/) is the one whose LAYOUT is what runs. It is
a page as wide as the browser window, laid out again on every resize by the
compiled engine — `@media` blocks resolved against the window, `4vw` margins,
a card grid that goes from four columns to one — and the browser is handed
finished pixels, not a tree to lay out. Drag the window edge and the whole
pipeline runs again. `npm run evg:responsive:web:serve` builds it and serves it
at <http://localhost:8007/>; `npm run evg:responsive:check` asserts the same
breakpoints in Node, by counting where the boxes landed, and
`npm run evg:responsive:web:smoke` drives the built page in Chromium.

[`tracer/`](../web/tracer/) is the third live page: upload a JPEG/PNG, tweak
Potrace-style parameters, and vectorize with the compiled `EvgBitmapTracer`.
To run it on your own machine, `npm run evg:trace:web:serve` builds the page
and serves it at <http://localhost:8006/>. Everything happens in the browser —
decode, quantize, trace — so no image ever leaves the machine. Opening
`dist/index.html` off disk works too for images you drop on it, but the *try the
sample* button needs a real origin, so the served page is the one that works
whole. Build alone with `npm run evg:trace:web` (output lands in
`gallery/evg/web/tracer/dist/`); the showcase build ships the same files to
`/evg/tracer/` on Pages. `npm run evg:trace:web:smoke` opens it in Chromium and
checks it.

The same tracer runs from a command line, with no page and no browser:

```sh
npm run evg:trace:cli -- in.png out.svg --preset broken
npm run evg:trace:cli -- photo.jpg out.svg --colorCount 12 --paletteMute 130
```

The option names are the fields of `EvgTraceOptions`, so there is nothing extra
to learn — `--colorCount 12` sets `colorCount`, and an unrecognised name is
refused rather than ignored. The two paths may come anywhere among the options
(`in.jpg --colorCount 4 out.svg` works), and an option may be written
`--name value` or `--name=value`. Presets are `lineart`, `poster`, `photo`, `print`
and `broken`. PNG and JPEG (baseline and progressive) are decoded by
[`tools/evg_trace_cli.rgr`](../tools/evg_trace_cli.rgr) itself, so the compiled
program is one self-contained file with nothing to install.

Because it is Ranger, that file can be any of them:

| | build | run |
| --- | --- | --- |
| Node | `npm run evg:trace:cli:run` (already built) | ~0.45 s |
| Python | `npm run evg:trace:cli:py` → one `.py`, stdlib only | ~4.8 s |
| C++ | `npm run evg:trace:cli:cpp` → one `.cpp`, then `g++` | ~0.19 s |
| Rust | `npm run evg:trace:cli:rust` → one `.rs`, then `rustc` | ~0.21 s |

`npm run evg:trace:cli:smoke` builds all four and asserts they produce the
same SVG byte for byte — which is the claim worth testing, since a difference
in integer division or float printing between targets would otherwise surface
as a picture somebody notices months later.

The page does not stop at the trace. *Esikäsittely* edits the bitmap before
anything is quantized, and *Muokkaa* edits the drawing afterwards: **Tarkennin**
re-vectorizes what you drag over with a palette taken from that spot alone,
**Yhdistä** gives a shape the color in the picker, **Pehmennä** takes the
corners out of an outline, and **Taikasauva** picks an object out — click
to grow a selection by color, or draw a rough outline by hand and let the
shapes decide where the edge really is — and then cuts everything else away,
leaving the object alone on transparency, which is how you get an icon out of a
photograph. Every one of them is one undo step per gesture, and *Palauta* goes
back to the trace.

### Eight pages are generated

`pages/charts.tsx`, `plots.tsx`, `more.tsx`, `views.tsx`, `variants.tsx`,
`tables.tsx`, `drawing.tsx` and `chart_api.tsx` are written by a tool, not by
hand: `npm run vela:showcase` runs a set of Vega specifications
through the [Vela](../../vela/README.md) runtime and emits the paths and labels
they produce, together with a stylesheet each.

**Charts** is the six chart types most people mean by the word. **Chart types**
is the rest, and the features only some charts have — a size legend whose rows
are all different heights, a stroke legend, a log axis that labels only some of
the ticks it draws, two marks sharing one plot, and text as a mark. **More chart
types** is what the runtime learned most recently, and exercises the most of it:
a continuous colour ramp with a gradient key, a series that is a faceted group,
a stack centred on a common line, a calendar on an axis, and a box plot whose
quartiles are computed. **More than one chart** is the multi-view grammar: a
trellis by column, by row, and wrapped onto a grid whose shape is computed from
the data, plus two plots concatenated.

**Charts, called** is the only page here that no specification was written
for. Every chart on it is built by CALLING Vela's chart API
([`VlChart.rgr`](../../vela/src/VlChart.rgr)), and the lines printed above each
chart are the calls that built it — read out of
[`vela_chart_page.rgr`](../../vela/tools/vela_chart_page.rgr)'s own source at
the markers around each chart's calls, so the code the page shows and the code
that drew the page cannot drift apart. It is also the page that says what the
API is for: a view's encoding is inherited by its marks, so an area and the
line over it are two marks with one set of axes, and no channel on the page
states its type — a column of ISO dates is an instant and a column of numbers
is a quantity, read off the data.

**Variants** is the same marks drawn a different way — bars that go down as well
as up, bars on their side, a bar between two values rather than from a baseline,
a line that steps instead of sloping, a line showing its own vertices, a single
row of ticks, a shape legend, and a mean drawn across the plot. It is the
variants that break a runtime rather than the types. **Tables** is the plots
where the cell is the datum: both axes categories, or both bins, and the value
carried by the cell's colour, its area, or the number printed in it.

*More than one chart* is the page whose size is not a size anyone declared. A trellis is
as wide as its panels and the furniture between them, so it is *shaped* to fit a
printed column rather than sized to fit one — nine panels three across is three
rows and fits; two across is five rows and does not. A concatenation has no
width of its own to hand down either, so each pane says how big it is.

They exist to be varied rather than pretty, and they earn their keep: four
defects in the runtime were sitting in charts that differ from the tested ones
only by being smaller.

It follows the same rule as the hand-written pages. A chart's series are
numbered in the order it draws them — `chartFill0`, `chartStroke0` — and the
stylesheet paints them, so the same charts come out in every palette. The
generated stylesheet carries the colours the specifications asked for as
*unscoped* rules, which makes them the default: a theme's scoped rules override
them, and a build with no chart theme still draws the chart the spec described.

The charts have no background of their own; the page shows through.

## The rule the gallery follows

Nothing in `pages/*.tsx` carries a visual attribute. No colours, no sizes, no
spacing. The pages say *what is on the page*; `themes/showcase.css` says how it
looks. That is the whole demonstration: swapping `-theme editorial` for
`-theme studio` re-skins every page without touching a line of the tree.

```
evg-pdf pages/album.tsx album.pdf -css themes/showcase.css -theme editorial
evg-png pages/album.tsx album.png -css themes/showcase.css -theme studio
```

The supported CSS subset is documented in `gallery/evg/EVGStyleSheet.rgr`:
`.class`, `.theme-<name> .class`, selector lists, and a cascade of
unscoped < theme-scoped < attributes authored in the TSX.

## Pages

| Page | Shows |
| --- | --- |
| `album` | `grid-template-areas`, spans, `object-fit: cover`, gaps |
| `cards` | **row `subgrid`** — three captions of different lengths on one baseline |
| `typography` | real TTF metrics, GPOS kerning, `align-items: baseline`, UTF-8 → WinAnsi |
| `units` | `px % em rem`, and `pt pc in mm cm` all pinned to the reference pixel |
| `flex` | `flex` shorthand, `flex-shrink: 0`, `justify-content`, `flex-wrap` |
| `emoji` | grapheme clusters, GSUB ligatures, Type0/Identity-H embedding, `emoji-color` |
| `boxmodel` | padding, per-side padding, borders, nesting, margins |
| `charts` | **generated** — Vega specs run by [`gallery/vela`](../../vela/README.md) and drawn as path data; series colours come from the theme, in three palettes |

`units` is the one worth reading twice: five bars declared in five different
units come out exactly the same length, because CSS defines them all against
the reference pixel. `em` follows the block's own font-size while `rem` stays
with the root, which is why those two differ on purpose.

## Adding a page

1. Drop `pages/<name>.tsx` in, using classes only.
2. Add the classes it needs to `themes/showcase.css`, under both themes.
3. Add an entry to the `PAGES` array in `build.mjs` — its title, one sentence
   on what it demonstrates, and the tags shown under the heading.

The build prints every warning the engine emitted while rendering, and the
gallery page lists them. A page that provokes a warning is a page that found
something; the index says so rather than hiding it.

## Known limits, visible here

- **JPEG decode quality on the raster target.** The PNG preview decodes photos
  with the repository's own decoder, which shows visible block artefacts. The
  PDF path embeds the original file untouched, so print output is unaffected.
  The gallery renders the same page both ways, so the difference is easy to see.
- The raster preview samples nearest-neighbour when scaling a photo into its
  box, which is honest for a layout preview and not what a printer does.

## What building this found

The gallery was not only a way to show the engine off — rendering real pages
turned up five bugs that every existing test had missed, because each one was
silent:

- **Composite glyphs were never drawn.** `ä`, `ö`, `å`, `é` are a base letter
  plus a diacritic in most fonts, and the raster path skipped that whole glyph
  kind while still reserving its advance. Finnish text came out with holes in
  it: *päivää* rendered as *piv*.
- **Bold was measured in the regular cut.** The renderers append `-Bold` to the
  family at paint time; layout never did. A bold heading was measured narrow
  and drawn wide, so it wrapped a line later than the box it had been given —
  and in PDF, `font-weight` did nothing at all because the bold face was never
  embedded.
- **Grid items resolved percentages against the grid, not their cell.** Every
  `width: 100%` item in a spread was laid out at the full grid width and they
  all overlapped.
- **The raster target had no image support**, so a photo book rendered to PNG
  came out with the text and none of the pictures.
- **An explicit `grid-template-rows` was dropped** when the container had no
  declared height, so `170px auto` on an auto-height deck sized every row from
  content and the fixed band disappeared.
- **The browser re-broke a line EVG had already fitted.** The `emoji` page's
  tinted rows are shrink-wrapped, so the box carries EVG's own measurement to a
  few decimals — and Chromium, summing the same advances, landed 288.719 against
  a declared 288.701. A hundredth of a pixel wrapped the last glyph onto a
  second line and pushed every absolutely-positioned box below it out of place.
  A label the engine fitted on one line now says `white-space: nowrap`, so the
  browser overflows rather than deciding the break again.

Each is now covered by the browser-parity gates in `gallery/pdf_writer/test/`.
