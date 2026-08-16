# EVG showcase

A gallery of what the EVG layout engine can do, built from this directory and
published to `/evg/` on the project's GitHub Pages site.

```
npm run showcase          # -> gallery/evg/showcase/dist/index.html
npm run showcase:gl       # check the WebGL viewer actually drew the pages
```

The index opens with a list of every page, because eleven sections is more than
a reader should have to scroll past to find one. Each entry opens the rendered
page itself; the *details* link beside it jumps to that page's section, where
its other themes and its PDF, PNG and WebGL versions are.

Each page is rendered under **two themes** — the generated chart pages under
**three**, adding `autumn` — and to **three targets** — PDF (the
print target), PNG (the raster preview) and HTML (the debug view) — from one
source tree and one stylesheet.

### Three pages are generated

`pages/charts.tsx`, `pages/plots.tsx` and `pages/more.tsx` are written by a
tool, not by hand: `npm run vela:showcase` runs a set of Vega specifications
through the [Vela](../../vela/README.md) runtime and emits the paths and labels
they produce, together with a stylesheet each.

**Charts** is the six chart types most people mean by the word. **Chart types**
is the rest, and the features only some charts have — a size legend whose rows
are all different heights, a stroke legend, a log axis that labels only some of
the ticks it draws, two marks sharing one plot, and text as a mark. **More chart
types** is what the runtime learned most recently, and exercises the most of it:
a continuous colour ramp with a gradient key, a series that is a faceted group,
a stack centred on a common line, a calendar on an axis, and a box plot whose
quartiles are computed.

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
