# EVG: CSS-closer layout + font-correct rendering

**Status:** Phases 0-4 landed  
**Date:** 2026-08-12, updated 2026-08-14  
**Related:** `PLAN_EVG.md`, `SPEC.md`, `ISSUES.md`, `gallery/pdf_writer/TODO_PDF.md`

## 1. Goal

Move EVG closer to a practical HTML/CSS subset so photo-book and print layouts can:

- use familiar **flexbox** (more complete than today)
- use simple **CSS Grid** for album pages
- switch look quickly via **classes / themes** (not only inline props)
- keep **layout and font rendering correct and consistent** across HTML preview, PDF, and raster

The hard requirement is not “full browser CSS”. It is:

> **The same text, with the same font file, must measure and paint to the same box on every target.**

Without that, flex/grid improvements will still look wrong in print.

## 2. Non-goals (for this track)

- Full CSS cascade, specificity wars, or selector engine parity with browsers
- Media queries / responsive breakpoints as a first deliverable
- `:hover`, animations, or interactive pseudo-classes
- Replacing SwiftUI/AppKit for the macOS app chrome
- Perfect PDF vs browser visual identity for shadows/gradients (already known gaps)

## 3. Current state (baseline)

### Layout

| Area | Today | Gap |
| --- | --- | --- |
| Flex | Grow, per-item `flex-shrink`, `flex-basis`, `flex` shorthand, min/max resolved inside the distribution | — |
| `gap` | Main axis, row + column | No separate `row-gap` / `column-gap` |
| `flex-wrap` | `wrap` (default) / `nowrap` / `wrap-reverse`, with the full `align-content` set including `stretch` | — |
| Alignment | `justifyContent`, `alignItems` (incl. `stretch` and `baseline`), plus legacy `align` / `verticalAlign` | Naming overlap between the CSS and legacy names |
| Text intrinsic size | Shrink-wraps to content measured from the real face | — |
| Grid | `display: grid` with fr/px/%/repeat/`minmax()` tracks, gaps, spans, `grid-template-areas`, `grid-auto-flow: dense`, column `subgrid` | Row `subgrid`; `fit-content()` |
| Styles | Mostly inline JSX attributes | No class/theme stylesheet layer |

`min-width` / `max-width` / `min-height` / `max-height` already parse and clamp;
what is missing is ordering them correctly against grow/shrink.

ISSUES #1 (labels taking full parent width in a `row`) is resolved — see that
file for what the fix depended on.

### Fonts

| Path | Role | Risk |
| --- | --- | --- |
| `EVGTextMeasurer` default | Heuristic widths (`fontSize * 0.55`) | Declares `isFontAccurate() == false`; reported, and fatal under `-strict-fonts` |
| `TTFTextMeasurer` + `FontManager` + `TrueTypeFont` | Real advance widths, ascender/descender/lineGap | Installed by every tool via `EVGFontSetup` |
| HTML renderer | Same TTFs via `@font-face`, measured with `TTFTextMeasurer` | Parity checked against Chromium in CI |
| Raster (`RasterText`) | Glyph outlines from same TTF | Layout now measures with the same faces |

All four targets resolve fonts through `EVGFontSetup` and measure through
`EVGTextEngine`, so layout and paint cannot disagree. See Phase 0 below for what
this replaced.

## 4. Design principle: fonts drive layout

```
┌─────────────────────────────────────────────────────────────┐
│  Authoring                                                   │
│  TSX + className / theme  (+ optional inline overrides)      │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Style resolve                                               │
│  stylesheet subset → computed style map on each node         │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Font resolve                                                │
│  family + weight + style → concrete TTF face (FontManager)   │
│  FAIL or explicit fallback if face missing                   │
│  (never silent guess for print metrics)                      │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Text shaping / metrics (shared)                             │
│  width, ascent, descent, lineHeight, wrap breakpoints        │
│  ONE implementation used by layout + all paint backends      │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  EVGLayout (flex v2 + grid v1)                               │
│  uses only resolved metrics + box model                      │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
        ┌──────────────┬──────────────┬──────────────┐
        ▼              ▼              ▼
     PDF paint     Raster paint    HTML preview
   (embed TTF)    (outline TTF)   (@font-face same files)
```

### 4.1 Font correctness rules

1. **Same face file for measure and paint**  
   Layout never uses the heuristic measurer when a document declares custom fonts.

2. **Metrics come from TTF tables**  
   - advance widths from `hmtx` (via existing `TrueTypeFont.measureText`)  
   - `ascent` / `descent` / `lineGap` from `hhea` (already exposed)  
   - optional later: OS/2 `sTypo*` vs `hhea` policy documented and fixed

3. **`line-height` semantics**  
   Support CSS-like:
   - unitless multiplier (`1.2`) → relative to font size / content box policy (pick one, document it)
   - absolute (`18px`, `14pt`)  
   Default should match current print-friendly behavior, not browser quirks mode.

4. **Baseline alignment** ✅  
   `align-items: baseline` is implemented against real ascent metrics; text
   nodes carry `calculatedBaseline` / `calculatedDescent`.

5. **Wrapping**  
   Word wrap must use the same width measurement as final paint. PDF `wrapText` and layout height calculation must call the shared shaper, not duplicate heuristics.

6. **Weight / style mapping**  
   `font-weight: 700` / `bold` resolves to a loaded face (e.g. `"Open Sans Bold"`), not a synthetic stroke in layout. If bold face is missing → warning + regular face (measurable), never “pretend bold” for width.

7. **HTML parity** ✅  
   Preview loads the same TTF files through `@font-face`, and the widths a
   browser measures for a set of golden strings are recorded into
   `test/fixtures/browser_parity.snapshot` so the check runs **without a
   browser**. `--update-snapshot` re-records; `--verify-snapshot` confirms the
   stored numbers still match a live Chromium.

8. **Encoding honesty** ✅  
   PDF WinAnsi limits remain. Source is decoded as UTF-8 so layout measures real
   glyphs, and anything WinAnsi cannot encode is reported with its codepoint
   (fatal under `-strict-fonts`) rather than silently substituted. Embedding a
   subset with a `/ToUnicode` cmap, which would lift the limit rather than
   report it, is still open.

9. **Box model** ✅  
   Padding, margins, gaps, nesting and background colour are checked against
   recorded browser geometry. Building it found two real divergences:
   percentage padding/margin on the vertical axis resolved against the
   containing block's *height* (CSS uses its **width** on all four sides — the
   rule behind the padding-bottom aspect-ratio trick), and a box whose padding
   exceeded its declared size kept that size and gave its children a negative
   content box, where CSS grows the box instead. Both are fixed.

10. **Kerning** (open)  
   EVG sums raw `hmtx` advances and applies no kerning. The parity snapshot
   records both the unkerned width (which EVG matches to 0.014px) and the
   browser's kerned width, so the size of the gap is measured rather than
   assumed: 8 of 24 fixtures kern at all, and the worst is **1.94px on
   "Helsinki, 2024" in Cinzel at 30px** — about 0.9%. Display faces kern hardest;
   Open Sans digits and punctuation do not kern at all. This matters for
   centred and right-aligned text, where the error shifts the whole run.
   Implementing it means reading GPOS (or `kern` where present) in
   `TrueTypeFont` and applying pair adjustments in `EVGTextEngine`.

## 5. Style layer (quick theme changes)

### 5.1 Authoring model

Keep JSX components; add:

```tsx
<Document theme="classic">
  <Page className="spread">
    <Label className="caption">Helsinki, 2024</Label>
    <View className="grid-2">
      <Image className="photo" src={a} />
      <Image className="photo" src={b} />
    </View>
  </Page>
</Document>
```

Stylesheet (CSS subset or JSON equivalent — CSS surface preferred for familiarity):

```css
.theme-classic .spread { padding: 24px; gap: 16px; }
.theme-classic .caption {
  font-family: "Cinzel";
  font-size: 14px;
  line-height: 1.3;
  color: #222;
}
.theme-classic .grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.theme-classic .photo { object-fit: cover; width: 100%; height: 100%; }
```

### 5.2 Supported CSS subset (v1)

**Selectors:** `.class`, `.theme-x .class`, element type optional later  
**Properties (style resolve → existing EVG fields):**

- box: `width`, `height`, `min/max-width/height`, `margin`, `padding`, `border-*`, `border-radius`
- flex: `display: flex|block`, `flex-direction`, `flex` / `flex-grow|shrink|basis`, `justify-content`, `align-items`, `align-content`, `flex-wrap`, `gap`
- grid (v1): `display: grid`, `grid-template-columns`, `grid-template-rows`, `gap`, `grid-column`, `grid-row` (simple span)
- text/font: `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, `text-align`, `color`
- visual: `background`, `background-color`, `opacity` (where backend allows), `object-fit`

**Cascade v1:** theme defaults < class < inline attributes. No IDs, no `!important`.

### 5.3 Why not full CSS?

Print albums need predictable pages. A small stylesheet with themes gives fast visual iteration without implementing a browser. The resolve step outputs the same computed props PDF already understands.

## 6. Layout: Flexbox v2

Bring `EVGLayout` closer to CSS Flexbox without rewriting callers.

### 6.1 Must-have

| Feature | Notes |
| --- | --- |
| ~~`flex-grow` / `flex-basis`~~ ✅ | `flex` shorthand parses `1`, `1 1 auto`, `2 0 120px` |
| `flex-wrap` | Row/column wrap with correct line packing |
| `min-width` / `max-width` / `min-height` / `max-height` | Clamp before grow/shrink |
| Intrinsic text width | Fix ISSUES #1: content-sized labels in `row` |
| `gap` on both axes | Already partly present; define wrapping interaction |
| Shorthand `flex` | Parse `1`, `1 1 auto`, etc. |

### 6.2 Should-have soon after

- `align-content` for wrapped lines
- `align-items: baseline` (depends on font ascent)
- Deprecate dual naming: prefer CSS names; map legacy `align` / `verticalAlign`

### 6.3 Algorithm note

Keep one deterministic pass (or two-pass grow/shrink) in Ranger. Do not call into browser layout for PDF. HTML preview may either:

- **A (preferred for parity):** use precomputed EVG frames (absolute positions), or
- **B:** emit real CSS flex and **diff** against EVG frames in tests

For print trust, A or test-gated B is required; never “HTML looks fine so PDF must be fine”.

## 7. Layout: Grid v1

Target photo-book pages, not full CSS Grid Level 2.

### 7.1 v1 features

- `display: grid`
- `grid-template-columns` / `grid-template-rows` with:
  - fixed (`120px`, `40%`)
  - `fr`
  - `repeat(n, 1fr)` (limited)
- `gap` / `row-gap` / `column-gap`
- child placement: auto flow row, plus `grid-column: span 2` / explicit line numbers (simple)
- stretch alignment default for images

### 7.2 Example (replaces nested HOC grids)

```tsx
<View className="page-grid">
  <Image className="photo" src={a} />
  <Image className="photo" src={b} />
  <Image className="photo span-2" src={c} />
</View>
```

```css
.page-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  width: 100%;
  height: 100%;
}
.span-2 { grid-column: span 2; }
```

### 7.3 Beyond v1 — landed

- **`minmax(min, max)`** sizes as its max and clamps into the range. A track
  that hits a bound is pinned and the space it did not take is offered to the
  rest, the same freeze-and-redistribute the flex axis uses — so
  `minmax(120px, 1fr)` holds its floor without silently starving a neighbour.
  Works inside `repeat()`, which is how a responsive album grid is written.
- **`grid-template-areas`** draws the page as a picture of names, and
  `grid-area` claims a region. Each name must form a rectangle; a ragged or
  bent one is reported rather than guessed at. With no explicit column template
  the column count comes from the picture.
- **`grid-auto-flow: row dense`** restarts the scan from the top for each item,
  so a later small item backfills a hole a wider one left behind. The default
  only moves forward, which keeps source order but can leave gaps.
- **Column `subgrid`** — `grid-template-columns: subgrid` adopts the enclosing
  grid's tracks for the span the element occupies, so nested cards line their
  columns up with each other instead of each splitting its own width. Declared
  with nothing to inherit from, it falls back to one full-width column.

Still out of scope: **row `subgrid`** (row sizes are only known after the items
are measured, so inheriting them needs a second pass the engine does not have),
`fit-content()`, and named grid lines.

## 8. Shared text engine API (contract)

Centralize in one module used by layout + PDF + raster (+ HTML measurement debug):

```text
resolveFace(family, weight, style) -> FontFace
measureRun(face, text, fontSize) -> { width, ascent, descent, lineHeight }
breakLines(face, text, fontSize, maxWidth, lineHeight) -> [Line]
  Line: { text, width, ascent, descent }
```

Rules:

- Layout heights for text nodes come only from `breakLines`
- PDF draw uses the same lines (no second wrap pass with different widths)
- Raster draw uses the same face + fontSize scaling (`unitsPerEm`)
- Snapshot tests lock glyph advances for a fixture string/font

## 9. Target parity matrix (definition of done)

| Concern | HTML preview | PDF | Raster |
| --- | --- | --- | --- |
| Face files | `@font-face` same TTF | embedded TTF | parsed TTF outlines |
| Advance widths | measured via shared engine (or DOM diff ≤ tolerance) | shared engine | shared engine |
| Line breaks | same breaks as PDF | shared engine | shared engine |
| Flex/grid frames | same boxes (or asserted) | EVGLayout | EVGLayout |
| Theme swap | change stylesheet only | same | same |

Tolerance: integer pixel/pt rounding policy documented (e.g. round half-up to 1/100 pt for PDF).

## 10. Phased delivery

### Phase 0 — Font/layout correctness foundation ✅

Landed last, which is why the earlier phases carried a caveat. The starting
state was worse than this plan assumed: **no target was measuring with real font
metrics at all.**

- The PDF tool's fonts directory was `./gallery/pdf_writer/Fonts` — a path that
  does not exist (the files are under `assets/fonts`) and resolved against the
  process working directory rather than the document. Every `loadFont` failed,
  so `FontManager.measureText` fell through to `strlen * fontSize * 0.5`.
- The HTML tool never constructed a `FontManager` at all and measured with
  `fontSize * 0.55`.
- The PNG tool loaded fonts, painted real glyph outlines, and laid out with the
  heuristic measurer.

So preview and print disagreed with each other *and* with the faces being
painted. Measured against Chromium loading the same TTF, the title in
`test_theme.tsx` was 8.31px (4.3%) too wide.

What landed:

- **`EVGTextEngine.rgr`** — the §8 contract (`measureRun`, `breakLines`,
  `lineCount`, `maxLineWidth`) in one place. There were four wrap
  implementations; layout's and the PDF's broke lines in different places, so
  the height layout reserved did not match the lines paint drew. The PDF's
  algorithm won (it measures the whole candidate line, including the real space
  advance, instead of adding a guessed `fontSize * 0.3`) and everything else
  calls it.
- **The element's own font family is threaded through.** Layout passed a
  hardcoded `"Helvetica"` to the measurer for every string, so a document set in
  Cinzel was laid out with Helvetica widths even once a TTF measurer was
  installed.
- **`EVGFontSetup.rgr`** — one font-resolution path for all four tools,
  anchored on the document's directory. `-fonts DIR` overrides it and is
  authoritative rather than merely first, since falling back after a typo is
  exactly the silent substitution this is meant to prevent.
- **Honesty instead of fallback.** `FontManager.hasFont` distinguishes a real
  hit from `getFont`'s substitution chain; measurers declare `isFontAccurate`;
  the engine reports each unbacked family once and `-strict-fonts` refuses to
  write output rather than guessing.
- **ISSUES #1 closed**, with the family and measurement caveats fixed.

Verification:

```
bash gallery/pdf_writer/test/run_fonts.sh
```

`font_metrics_test.rgr` locks advance widths, vertical metrics and wrap
positions against the real TTFs (29 assertions). `font_parity.js` renders a page
in Chromium with the same faces via `@font-face` and compares EVG's boxes to the
browser's — the check that catches EVG agreeing with itself while both sides are
wrong. Worst delta is now **0.375px against 8.31px before**.

### Phase 1 — Flexbox v2

- ~~row/column grow, main-axis shrink, wrap gating, `gap`, `alignItems: stretch`~~
  (landed with the engine unification — see §11.1)
- ~~`flex-basis` and the `flex` shorthand~~ — landed. `flex: 1` sets basis 0, so
  an item shares the line even when it also carries a width; `flex: 2 1 120px`,
  `flex: auto` and `flex: 120px` parse. This removed the wart both bundled
  themes had to document.
- ~~Widen the JSX attribute surface~~ — see Phase 2.5.
- ~~Real per-item `flex-shrink` factors~~ — landed. Overflow is shared by
  `flex-shrink x size`, so `flex-shrink: 0` holds an item's size while its
  siblings absorb the whole overflow. With every factor at the CSS default of 1
  this is the same uniform scale as before, which is why no existing page moved.
- ~~min/max clamped in the right order relative to grow/shrink~~ — landed.
  Limits are resolved inside the distribution: an item that hits one is frozen
  there and the space it did not use is offered back to the others, instead of
  being clamped afterwards and leaving a hole in the row.
- ~~`align-content` for wrapped lines~~ — landed: `flex-start`, `flex-end`,
  `center`, `space-between`, `space-around`, `space-evenly`. It applies only
  when the content wrapped and the container height is definite, following the
  same rule as the rest of the engine. `stretch` would have to grow each line
  and re-lay its children out, so it currently behaves as `flex-start`.
- ~~`wrap-reverse`~~ — landed: the lines stack from the far edge, with the wrap
  points unchanged.
- ~~`align-content: stretch`~~ — landed: each line grows by an equal share of
  the spare space, and items that did not ask for a specific height grow with
  their line and re-lay their own children inside the taller box.
- Update `PhotoLayouts` only where behavior changes

### Phase 2 — Style layer ✅

Landed. Open decision #1 was settled in favour of a **real CSS subset parser**
rather than JSON style maps: the property names were already CSS-shaped, and
`EVGElement.setAttribute` already accepted both `font-size` and `fontSize`, so
the parser only had to tokenize and dispatch — no second authoring vocabulary.

- `EVGStyleSheet.rgr` parses `.class`, `.theme-<name> .class`, selector lists
  and `/* comments */`, and applies rules over a tree
- Cascade: unscoped class < theme-scoped class < inline attributes, with source
  order breaking ties inside each group
- Inline precedence is explicit, not positional: front-ends call
  `EVGElement.markInline()` for every authored attribute and the applier skips
  those properties. `toKebab` normalizes so `fontSize` and `font-size` are one key
- `-css FILE` (repeatable) and `-theme NAME` on the PDF and HTML tools, via the
  shared `EVGStyleLoader` so both targets resolve identically
- Unsupported selectors are collected and printed, not silently dropped
- `examples/themes/classic.css` + `minimal.css` declare the same class names, so
  `examples/test_theme.tsx` swaps look with no TSX edit:

```
evg-html test_theme.tsx out.html -css themes/classic.css -theme classic
evg-html test_theme.tsx out.html -css themes/minimal.css -theme minimal
```

Not in this subset: element/ID selectors, multi-level descendants, pseudo-classes,
`!important`, shorthand expansion beyond what `setAttribute` already does.

### Phase 2.5 — Attribute surface ✅

Every phase turned up a property that parsed but never reached the engine,
because a property had to appear in **two** independent whitelists —
`parseAttributes` in `JSXToEVG.rgr` for JSX attributes, and
`EVGElement.setAttribute` for the stylesheet and `ComponentEngine` paths. Missing
from either meant silently dropped on that path only:

| Property | Was dropped from | Found during |
| --- | --- | --- |
| `gap` | JSX attributes | Phase 1 |
| `className` | JSX attributes (compared to `"className"`, arrives as `"class-name"`) | Phase 2 |
| `display` | `setAttribute` — so a stylesheet could set every grid property and still lay out as a block | Phase 3 |
| `justify-content`, `align-items`, `border-width`, `border-color` | JSX attributes | closing this gap |

`parseAttributes` now calls `setAttribute` first and the special cases refine
the result, so the two surfaces cannot drift: anything the element understands
is reachable from JSX. Unknown names are ignored, so component props like `key`
pass through harmlessly.

`gallery/pdf_writer/test/attrs_test.rgr` is the guard — it sets each property as
a JSX attribute and asserts it landed, so a refactor that reintroduces a
whitelist fails there rather than in someone's print run.

The examples show the cost of the old behaviour: `test_scandinavian`'s cover page
authored `justifyContent="center" alignItems="center"` and was never centred, and
`test_simple` authored a border that never drew.

### Phase 3 — Grid v1 ✅

Landed in `EVGGrid.rgr` (track lists + placement parsing) and
`EVGLayout.layoutGrid` (auto-flow placement). `layoutChildren` branches to it on
`display: grid`, keeping the same "returns content height" contract, so a grid
nests inside flex and vice versa.

- `grid-template-columns` / `grid-template-rows`: fixed px, `%`, `fr`,
  `repeat(n, …)`. Fixed and percentage tracks are taken first, `fr` splits the
  remainder in proportion
- `gap`, plus `row-gap` / `column-gap` overriding it per axis
- `grid-column` / `grid-row` accepting `span N`, `N`, `N / M`, `N / span M`
- Auto-flow row placement over an occupancy map, so column *and* row spans
  reserve their cells and later items flow around them
- Items stretch to their cell by default (§7.1); an explicit `height` still wins,
  because `layoutElement` only consults the stretch height when `height.isSet`
  is false
- Row sizing mirrors the Phase 1 auto-height rule: `grid-template-rows` is only
  used when the container's height is definite. Otherwise rows are
  content-sized from a measuring pass, so a grid in normal document flow grows
  to its content instead of being squeezed into a stale inner height
- A grid with no column template is a single full-width column, rather than
  collapsing to zero

`components/PhotoLayouts.tsx` `FourPhotoGrid` is now a real 2×2 grid. The old
version faked it with `48%` widths and `4%` margins, which made the horizontal
and vertical gutters different sizes; one `gap` value now drives both axes.

`examples/themes/album.css` + `examples/test_album_grid.tsx` are the print
fixtures — one tree, three compositions:

```
evg-html test_album_grid.tsx a4.html      -css themes/album.css -theme album   -w 595 -h 842
evg-html test_album_grid.tsx land.html    -css themes/album.css -theme album   -w 842 -h 595
evg-html test_album_grid.tsx contact.html -css themes/album.css -theme contact -w 595 -h 842
```

`grid-template-areas`, `grid-auto-flow: dense`, `minmax()` and column `subgrid`
landed afterwards — see §7.3. Still out of scope: row `subgrid`, `fit-content()`
and named lines. `auto` in a track list is accepted but behaves as `1fr` —
sizing it properly needs per-track content measurement.

### Phase 4 — Baseline + polish ✅

**`align-items: baseline`.** Text nodes record `calculatedBaseline` (leading +
ascent from the real face) and `calculatedDescent`; containers inherit the first
in-flow child's baseline, so wrapping a label in a `View` does not break the
alignment. A box with no text baseline aligns on its bottom margin edge, which
is what CSS does and what makes an image sit on a caption's baseline. Row
alignment takes the max baseline offset and shifts each item down to meet it.
This is why the rule waited for Phase 0 — it is meaningless without real ascents.

**Encoding honesty (§4.1 rule 8).** The starting point was not the expected
"unsupported codepoint becomes `?`" — it was that `buffer_to_string` builds a
string with one character per *byte*, i.e. it reads UTF-8 source as Latin-1. So
`ä` arrived as two characters and `—` as three. Layout measured two or three
glyph advances for one character, and the PDF wrote each byte as its own WinAnsi
escape, printing `Ã¤` where the source said `ä`. Nothing complained, because the
mangled bytes are all inside the byte range.

`Utf8.decode` now runs at every source-read boundary (TSX, components,
stylesheets). Text carries real codepoints, so measurement counts real glyphs,
Latin-1-range characters encode correctly, and characters genuinely outside
WinAnsi are reported with their codepoint and context instead of being hidden:

```
Encoding warning: U+2014 in "Hyvää yötä — Kaivopuisto" is outside WinAnsi and was written as '?'
```

`-strict-fonts` makes that fatal. Invalid byte sequences pass through unchanged,
so a file that really is Latin-1 keeps working.

**Bleed-aware page boxes.** `-bleed PT` grows the sheet by that much on every
side, translates the page content into the middle of it, and declares
`TrimBox`/`BleedBox` so a printer knows where the finished page is cut. Layout
keeps working in trim coordinates and knows nothing about bleed. With no bleed
the output is byte-identical to before — a single `MediaBox`, no translate.

```
evg-pdf album.tsx out.pdf -bleed 8.5     # 3mm trade bleed
```

Verification: `bash gallery/pdf_writer/test/run_print.sh` (23 assertions covering
UTF-8 decoding, WinAnsi detection and page boxes at both orientations), plus the
baseline cases in `evg_test`.

## 11. File / module impact (expected)

| Area | Likely touch points |
| --- | --- |
| Layout | `gallery/evg/EVGLayout.rgr`, `EVGElement.rgr`, `EVGText.rgr`, `EVGGrid.rgr` |
| Fonts | `pdf_writer/src/fonts/FontManager.rgr`, `TrueTypeFont.rgr`, `EVGFontSetup.rgr`, `gallery/evg/EVGTextEngine.rgr` |
| JSX bridge | `pdf_writer/src/jsx/JSXToEVG.rgr`, component engine |
| Style | `gallery/evg/EVGStyleSheet.rgr` (parse/resolve), `pdf_writer/src/core/EVGStyleLoader.rgr` (CLI wiring) |
| Renderers | `EVGPDFRenderer`, `EVGHTMLRenderer`, `EVGRasterRenderer` / `RasterText` |
| Examples | `components/PhotoLayouts.tsx`, new theme CSS, album fixtures |
| Docs | this plan → later SPEC sections for flex/grid/style |

### 11.1 One engine, one location

`gallery/evg/` is the single EVG engine. It was previously forked — the game
engine carried its own copy under `gallery/game_engine/v2/evg/` that had drifted
~200 lines ahead (main-axis `gap`, column grow, shrink-to-fit, `alignItems:
stretch`, `flexWrap`, `SVGPathParser.flatten`). That copy has been promoted into
`gallery/evg/` and deleted, so pdf_writer, the game engine (v1 and v2) and
`watch_evg` all compile against the same files.

Only `EvElementToEVG.rgr` (which depends on the interpreter's `EvalValue`) and
`evg_test.rgr` (which uses the v2 `RgTest` harness) remain under
`game_engine/v2/evg/`. **Layout changes belong in `gallery/evg/` only** — do not
re-fork.

### 11.2 Gates

```
npm run test:evg:all
```

runs all three, or individually:

| Script | Suite | Covers |
| --- | --- | --- |
| `test:evg` | `gallery/game_engine/v2/evg/run.sh` | layout engine: units, box model, flex, grid, stylesheet, text engine, baseline |
| `test:evg:fonts` | `gallery/pdf_writer/test/run_fonts.sh` | advance-width goldens against the real TTFs, plus EVG-vs-browser parity from a recorded snapshot |
| `test:evg:layout` | `gallery/pdf_writer/test/run_layout.sh` | box-model parity against the browser: padding, margins, gaps, nesting, background colour |
| `test:evg:frontend` | `gallery/pdf_writer/test/run_print.sh` | UTF-8 decoding, WinAnsi reporting, page boxes, and the JSX attribute surface |

**None of these need a browser.** The browser-measured widths live in
`gallery/pdf_writer/test/fixtures/browser_parity.snapshot`, so the parity gate
runs anywhere. Chromium is only needed to change that file:

```
bash gallery/pdf_writer/test/run_fonts.sh  --verify-snapshot   # still matches a live browser?
bash gallery/pdf_writer/test/run_fonts.sh  --update-snapshot   # re-record it
bash gallery/pdf_writer/test/run_fonts.sh  --page-parity       # measure a whole rendered page
bash gallery/pdf_writer/test/run_layout.sh --verify-snapshot   # same, for the box model
bash gallery/pdf_writer/test/run_layout.sh --update-snapshot
```

The box-model gate compares padding, per-side padding, margins, per-side
margins, row and column gaps, nesting, percentage sizes and background colour
across 60 boxes. Both sides build their tree from the same
`fixtures/box_model.fixtures`, and the browser side is configured to EVG's model
rather than CSS defaults — `box-sizing: border-box` because EVG's width includes
padding, and `display: flex` because EVG's flow is flex (block flow would
collapse adjacent vertical margins and the two would disagree for a reason that
has nothing to do with EVG).

Re-record only when the font files change. A snapshot diff with unchanged fonts
means the browser disagreed with itself, which is worth reading before
committing.

## 12. Test plan (fonts first)

1. **Advance width fixtures** — fixed strings per font; assert widths stable across PDF measure API and raster measure API  
2. **Wrap fixtures** — paragraph + maxWidth → identical line arrays in layout and PDF  
3. **Flex intrinsic text** — `row` + Label + Image does not force-wrap incorrectly  
4. **Theme swap** — same TSX tree, two stylesheets → different fonts/spacing, still valid layout  
5. **Grid album page** — 2×2 + span row; no overlap; gaps respected  
6. **Cross-target visual** — HTML vs raster/PDF page render diff under tolerance for text blocks  

## 13. Open decisions

1. ~~Stylesheet syntax: real CSS subset parser vs JSON style maps~~ — **decided:
   CSS subset parser** (`EVGStyleSheet.rgr`), see Phase 2  
2. HTML preview strategy: precomputed frames (parity) vs native CSS (speed) + CI diffs  
3. Default `line-height` policy when property omitted (font `lineGap` vs `1.2`)  
4. ~~Whether Grid v1 lands before or after theme CSS~~ — **done in that order**: flex → themes → grid

## 14. Summary

EVG should grow toward HTML/CSS **as a print-safe subset**, not as a browser. The order that protects quality is:

1. **Shared TTF metrics + wrap** (layout and paint cannot disagree)  
2. **Flexbox v2 + intrinsic text**  
3. **Class/theme styles** for fast visual iteration  
4. **Grid v1** for album pages  

Fonts are not a side feature here: they are the constraint that makes flex/grid trustworthy on paper.
