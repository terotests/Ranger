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
| Lengths | `px`, `%`, `em`, `rem`, and the absolute print units `pt` / `pc` / `in` / `mm` / `cm`, plus EVG's own `hp` and `fill` | `vw` / `vh`, `ch` / `ex`, `calc()` — all rejected rather than misread |
| Kerning | GPOS pair adjustments (formats 1 and 2, incl. Extension lookups) and the legacy `kern` table, in measurement and in paint | Ligatures and other GPOS features |
| Flex | Grow, per-item `flex-shrink`, `flex-basis`, `flex` shorthand, min/max resolved inside the distribution | — |
| `gap` | Main axis, row + column | No separate `row-gap` / `column-gap` |
| `flex-wrap` | `wrap` (default) / `nowrap` / `wrap-reverse`, with the full `align-content` set including `stretch` | — |
| Alignment | `justifyContent`, `alignItems` (incl. `stretch` and `baseline`), plus legacy `align` / `verticalAlign` | Naming overlap between the CSS and legacy names |
| Text intrinsic size | Shrink-wraps to content measured from the real face | — |
| Grid | `display: grid` with fr/px/%/`auto`/`fit-content()`/repeat/`minmax()` tracks, gaps, spans, `grid-template-areas`, `grid-auto-flow: dense`, `subgrid` on both axes, named lines. 20 fixtures checked against Chromium | Intrinsic sizing of a container item (only definite widths and text leaves contribute) |
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
   Source is decoded as UTF-8 so layout measures real glyphs. The encoder now
   uses the actual WinAnsi repertoire (CP1252) rather than Latin-1, so the
   0x80–0x9F band — em and en dashes, curly quotes, ellipsis, bullet, euro —
   reaches the page as the right byte instead of being refused; see Phase 4.2.
   What WinAnsi genuinely cannot hold is reported with its codepoint (fatal
   under `-strict-fonts`) rather than silently substituted. Embedding a subset
   font, which would lift the repertoire limit rather than report it, is still
   open. (A `/ToUnicode` cmap is already written, and now covers that band too,
   so text extracts correctly — but it does not widen what can be encoded.)

9. **Box model** ✅  
   Padding, margins, gaps, nesting and background colour are checked against
   recorded browser geometry. Building it found two real divergences:
   percentage padding/margin on the vertical axis resolved against the
   containing block's *height* (CSS uses its **width** on all four sides — the
   rule behind the padding-bottom aspect-ratio trick), and a box whose padding
   exceeded its declared size kept that size and gave its children a negative
   content box, where CSS grows the box instead. Both are fixed.

10. **Kerning** ✅  
   EVG reads GPOS pair adjustments — and the legacy `kern` table on a face with
   no GPOS — and applies them in measurement AND in paint. The parity snapshot
   now targets the browser's **kerned** width: worst delta **0.015px** across
   24 fixtures, and **0.006px** against a live Chromium page. Before this, the
   worst was 1.94px on "Helsinki, 2024" in Cinzel at 30px. See Phase 4.3.

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
- **`subgrid`, both axes** — `grid-template-columns: subgrid` and
  `grid-template-rows: subgrid` adopt the enclosing grid's tracks for the span
  the element occupies, so nested cards line their columns *and* their internal
  rows up with each other instead of each dividing its own box. Declared with
  nothing to inherit from, either falls back — one full-width column, or
  content-sized rows — and says so. See Phase 4.5.

- **Named grid lines** — `[full-start] 1fr [main] 2fr [main-end]` labels the
  lines between tracks, and `grid-column: main-start / main-end` places against
  them. One line may carry several names (`[a b]`); a name is resolved against
  the container's template, so the placement is parsed from the item and
  pointed at real lines by the layout, which is the only place that sees both.
  A name the template does not define leaves the item auto-placed and is
  reported.

- **Intrinsic tracks** — `auto` sizes to the content of the items placed in it,
  and `fit-content(limit)` caps that without ever going below min-content. See
  Phase 4.4.

Still out of scope: the intrinsic size of a **container** item, which needs a
recursive pass — see the end of Phase 4.4.

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

### Phase 4.1 — CSS length units ✅

Checking the units against a browser turned up three things that were wrong in
ways nothing would have complained about.

**`font-size` never inherited.** Every element was constructed carrying a 14px
font-size, so `inheritProperties` copied the parent's size in and the default
immediately overwrote it — a `font-size` only ever applied to the element that
declared it, never to anything below. The root had the opposite problem: it has
no parent, so `inheritProperties` never ran on it at all and a size set on a
`Page` or `Print` was dropped outright. `fontSize` now starts *unset*, layout
fills it in from the inherited size (remembering that it did, so a re-layout
does not mistake its own fill-in for an authored value), and `EVGLayout.layout`
applies the root's own size before anything descends. This is what `em` needs,
and it fixes inherited text size at the same time.

**`2rem` silently meant `2em`.** The parser tested the two-character suffix
first, so `rem` was chopped to `"2r"` — and `to_double` stops at the first
character it cannot use, so that reads as 2. `rem` is now a unit of its own,
resolved against the root's font size, which is threaded down the tree
alongside the inherited one (a unit cannot reach the root on its own, so
whoever resolves it hands the value over).

**Any unknown unit became pixels.** The same `to_double` behaviour meant `10vw`
resolved to 10px and `calc(100% - 20px)` to 100px. An unrecognised suffix now
leaves the length unset — i.e. `auto`, which is what a browser does with a
declaration it cannot parse. `vw`/`vh` (a print page has no viewport), `ch`/`ex`
(they need font metrics the unit layer cannot reach) and `calc()` stay out of
scope, but they now stay out loudly.

The absolute print units — `pt`, `pc`, `in`, `mm`, `cm` — landed in the same
pass. They are pinned to CSS's reference pixel (`1in = 96px`) and folded to px
at parse time, so nothing downstream has to know about them. `12pt` used to
measure 12px.

Verification: 12 unit fixtures in the box-model gate (121 boxes, up from 60),
covering `rem` against a root size that differs from the local one, `em` on
`font-size` itself chaining down a tree, the box model in `em`, gaps in `rem`,
and all five absolute units resolving to the same 96px. All 22 examples that
render still produce byte-identical HTML.

### Phase 4.2 — Saying so out loud ✅

Three things the engine could not do, each of which it had been doing quietly.

**WinAnsi is not Latin-1.** The encoder's repertoire check was `codepoint >
255`, which is the Latin-1 boundary. WinAnsi is CP1252, and the band Latin-1
leaves as control codes is exactly where CP1252 keeps the punctuation a book
sets: `—` `–` `“” ‘’` `…` `•` `€` `†` `‰`. Every one of them was refused,
written as `?`, and — under `-strict-fonts` — fatal, on text the format can
carry perfectly well. `Utf8.toWinAnsi` / `fromWinAnsi` now hold the real
mapping; the encoder uses it, the font's `/Widths` array looks each glyph up by
its true codepoint instead of by the byte, and the `/ToUnicode` cmap gained the
27 `bfchar` entries for the band so the text also extracts correctly.

Fixing that exposed a second bug behind it. The JSX parser hands text back one
token at a time, so `100% sure` arrives as three fragments and the joiner
decides what goes between them. It was guessing from a whitelist of characters
allowed to follow a word with no space — `, . ! ? : ; - ) ]` — which got
`Hello, world!` right and mangled everything else: `100 % sure`, `a / b`,
`a ( b) c`, `Kämp- hotellissa`, `Gallen- Kallelan`, `usePrintSettings ()`, and
every curly quote as `“ x ”`. The tokens carry source offsets, so adjacency is
a fact to read, not a guess: a space is written iff the next token starts past
where the previous one ended. Twelve of the 22 rendering examples changed, all
of them corrections.

**Grid rejections were invisible.** `fit-content()`, row `subgrid`, a bent
`grid-template-areas` and a missing `grid-area` name all set an error that was
handed to `this.log()` — a no-op unless `debug` is on. In a normal run the page
simply came out with the wrong number of columns. `EVGLayout` now collects
these, deduplicated, and every tool prints them:

```
Layout warning: grid-template-columns: Unsupported track size: fit-content(100px)
Layout warning: grid-template-rows: Unsupported track size: subgrid
```

**Named grid lines said nothing at all.** `grid-column: sidebar` went through
`to_double`, came back 0, and 0 is auto — indistinguishable from not having
written anything. `EVGGridPlacement` now rejects any token that is neither a
positive line number nor `span N` (which also catches negative line numbers,
CSS's count-from-the-end form, equally unsupported), keeps the auto placement,
and reports it.

The raster tool reported none of this before — not even font warnings — and now
reports both.

Verification: 12 new WinAnsi assertions plus a round-trip over all 27 assigned
codes, 12 text-spacing assertions, and 12 grid-warning assertions covering the
report, the dedup, and silence on a grid the engine fully understands.

> **Compiling is not a passing build.** `node bin/output.js` prints
> `Compilation FAILED` and still exits 0, so `npm run <tool>:compile && echo OK`
> reports success on a broken tool. Grep the output for `Compilation FAILED`.
> This cost a round here: a tool that had not rebuilt looked like a feature
> that had not worked.

### Phase 4.3 — Kerning ✅

The last open rule in §4.1, and the one that needed the most care to not make
things worse.

**Reading it.** `TrueTypeFont` walks GPOS: FeatureList for a `kern` feature,
its lookups, and the pair-adjustment subtables underneath — including
LookupType 9 (Extension), which large faces use to reach past the 64K offset
limit, so skipping it would have missed kerning in exactly the fonts that need
it most. Both PairPos formats are read: format 1 (per-glyph pair sets, binary
searched) and format 2 (class pairs). Coverage and ClassDef tables are binary
searched rather than expanded — a class subtable is a few hundred bytes that
expands to tens of thousands of pairs, almost none of which a given page uses.

Two things the browser snapshot caught that reading the spec alone did not:

- **Subtables within one lookup are first-match-wins**, not additive. Summing
  every subtable double-counted any pair listed in more than one, which made
  Noto Sans measure narrower than Chromium draws it. Separate lookups still
  accumulate.
- **A face with GPOS is positioned by GPOS alone.** Open Sans has a GPOS table
  with no `kern` feature *and* 18694 legacy `kern` pairs. Falling back to those
  made EVG kern a run a browser leaves alone. OpenType says GPOS wins outright;
  the fallback now only applies when there is no GPOS table at all.

**Painting it.** Measuring kerned while painting unkerned would have been worse
than not kerning: the box right and the ink wrong. A PDF viewer advances by the
`/Widths` entry and kerns nothing itself, so the renderer emits a `TJ` array
instead of `Tj` when the face kerns — `[(H) 15 (e) 10 (lsinki, 20) 25 (2) 15
(4)] TJ`, which is 65/1000 em at 30px, exactly the 1.95px the measurement
moved. A run that does not kern still emits a plain `Tj`. The raster pen kerns
between glyphs the same way; A/B-ing the PNG shows the right edge of that
Cinzel line moving 2px left with the left edge unchanged, which is kerning
between glyphs and not a shifted origin.

Results:

| | before | after |
| --- | --- | --- |
| worst vs browser (24 snapshot fixtures) | 1.94px | **0.015px** |
| worst vs live Chromium page | 0.375px | **0.006px** |

All 19 rendering examples that contain text moved, every diff a width or a
position — no text and no structure changed.

### Phase 4.4 — Grid, against a browser ✅

The box-model parity gate learned `display: grid`, so the grid work stopped
being checked against hand-computed expectations and started being checked
against Chromium. Sixteen fixtures: fr tracks, mixed px/fr/%, gaps, `repeat()`,
spans, explicit lines, named lines, `minmax()` both clamped and not, percentage
tracks, and a padded container. The gate is now **894 assertions over 161
boxes**, and it needs no browser to run.

The existing grid passed all of it on the first recording. That is the useful
kind of result — it says the earlier phases were right, and it is what made the
two genuine gaps stand out.

**`auto` was a disguised `1fr`.** Predictable, documented, and not what CSS
does: an `auto` track sizes to the content of the items in it, and only then is
leftover space handed to the `fr` tracks. Column sizing is now deferred until
after placement — the tracks cannot be sized until it is known what lands in
them — and each intrinsic track takes the widest item placed in it.

**`fit-content(limit)`** is the same track with a ceiling on the max-content
side, floored at min-content. That floor is the whole subtlety: Chromium
measures `fit-content(100px)` around a 200px box as **200**, because a box with
a definite width cannot be squeezed and the clamp would push it out of its own
cell. The limit only bites on something that *can* be squeezed — text — which
is why `EVGTextEngine` gained `minLineWidth` (break at every opportunity, take
the widest line: CSS's min-content) to sit beside `maxLineWidth`.

What contributes to an intrinsic track is deliberately narrow: an item with a
definite width (which is both its min- and max-content size) and a text leaf.
A container item contributes nothing rather than a guess — sizing one to its
subtree needs a real recursive intrinsic pass, and a made-up number would
silently misplace every neighbour instead of merely leaving a track narrow.
Items spanning several tracks are left out for the same reason: there is no one
track to charge them to.

### Phase 4.5 — Row subgrid ✅

Columns landed in §7.3; rows were left out because "row sizes are only known
after the items are measured". True, but the conclusion was wrong: the tracks
are handed to a subgrid child at *final placement*, and by then the parent's
rows are settled — whether they came from its own template or from its content
pass. The handoff is the same code as columns, one axis over.

What actually made rows harder is that a row subgrid **always spans** several
of its parent's rows, and spanning items are excluded from content-based row
sizing (there is no one row to charge them to). With only subgrid cards in a
grid, every row measured zero and the cards collapsed. The fix is the thing
that defines subgrid: it is the *grandchildren* that size those rows. Rather
than see through the card, the parent measures it once — a subgrid with nothing
inherited falls back to content-sized rows, which is exactly the measurement
wanted — and adopts the rows it came up with, one for one, via
`computedRowSizes`.

Fixing this also turned up a bug in what column subgrid had been reporting. A
subgrid child is laid out during its parent's content-measuring pass, before
any tracks can exist, and it was announcing "subgrid has no enclosing grid to
inherit tracks from" every time — which was simply untrue. The enclosing grid
now claims the child (`subgridPending`) as soon as it collects it, well before
it can size anything, so a child that is merely early is told apart from one
that really is orphaned.

Verification: four subgrid fixtures against Chromium — rows over an explicit
parent template, rows over content-sized parent rows, columns, and both axes at
once — plus 10 assertions on the case subgrid exists for: two cards, spanning
the same rows, whose captions line up without either card knowing about the
other. The box-model gate is now **1019 assertions over 203 boxes**.

One harness note recorded in the fixtures: a card that subgrids only its rows
has a template-less column axis, which CSS sizes as a single `auto` track. EVG
defaults that to `1fr`. Under this harness's `justify-content: start` an auto
track does not stretch, so the two disagree; with the CSS default of `normal`
they coincide. The fixtures pin the column axis rather than paper over it.

### Phase 4.6 — The showcase, and the five bugs it found ✅

`gallery/evg/showcase/` renders six example pages under two themes and to three
targets, and publishes them to `/evg/` on the project's Pages site
(`npm run showcase`). Nothing in `pages/*.tsx` carries a visual attribute:
the pages say what is on the page, one stylesheet says how it looks, and
swapping `-theme editorial` for `-theme studio` re-skins all six.

Rendering real pages found five bugs that every gate had missed, because each
one was silent:

- **Composite glyphs were never drawn.** `ä`, `ö`, `å`, `é` are a base letter
  plus a diacritic, and the raster path skipped that entire glyph kind while
  still reserving its advance — *päivää* rendered as *piv*. `RasterText` now
  reads the component table, applies each component's 2×2 transform and offset,
  and recurses for components that are themselves composite.
- **Bold was measured in the regular cut.** The renderers append `-Bold` at
  paint time; layout never did, so a bold heading was measured narrow and drawn
  wide, wrapping a line later than its box. Chromium lays "A Mysterious
  Discovery" out at 18px as 196.02 regular and **209.25** bold; EVG reported
  196.00 for both. `EVGElement.effectiveFontFamily()` is now the one resolver
  layout, the PDF renderer and the raster pen all go through — which also means
  `font-weight` finally does something in a PDF, since the bold face is now
  embedded rather than silently replaced by the regular one.
- **A grid item resolved percentages against the grid, not its cell.** Every
  `width: 100%` item in a spread was laid out at the full grid width and they
  overlapped. A grid item's containing block is its grid area.
- **The raster target had no image support at all**, so a photo book rendered
  to PNG came out with the text and none of the pictures. It draws them now,
  with `object-fit: cover`, a decode cache, and the progressive-JPEG decoder
  for files the baseline one rejects — `Example.jpg` is progressive, and used
  to fail with nothing but a line in the log.
- **An explicit `grid-template-rows` was dropped** when the container had no
  declared height, so `170px auto` on an auto-height deck sized every row from
  content. Tracks that need no container height to resolve are applied now;
  `%` and `fr` genuinely do need one and stay content-sized.

Each is covered by the gates: three new browser-verified fixtures (percentage
items in a cell, with and without padding; an explicit row template on an
auto-height container) and six assertions pinning the bold face to the width a
browser actually draws.

Known limit the gallery shows rather than hides: the raster target's JPEG
decode has visible block artefacts, and the PDF path — which embeds the
original file untouched — does not. Both are on the page, side by side.

### Phase 4.7 — Codepoints, and emoji that actually print ✅

**Text is stepped by codepoint.** `charAt` returns a UTF-16 code *unit*, so
everything outside the BMP — emoji, CJK extensions, most maths symbols — was
seen as two characters, and neither half is a real codepoint. On a page
containing `a😀b`:

| | before |
| --- | --- |
| measured width | 47.53px — the emoji was charged **two** `.notdef` advances |
| JSON display list | `ed a0 bd ed b8 80`, CESU-8 surrogate halves; a strict UTF-8 parser refuses the file |
| PDF | two encoding warnings, at U+D83D and U+DE00, which are not characters |

`EVGCodepoint` is now the one place that knows how to walk a string —
`codeAt`, `unitsAt`, `count`, `toArray`, `toStr`, `encodeUtf8` — and it is
threaded through every site that looks up a glyph or writes bytes.

**Emoji reach the page.** Three things had to be true at once, and each was
false:

- **A face that has the glyphs.** `Noto_Emoji/NotoEmoji-Regular.ttf` is loaded
  last, so it is never picked as a substitute for a missing *text* face. It is
  the monochrome `glyf` cut on purpose: the colour formats are bitmaps
  (CBDT/sbix) or layered vectors (COLR/CPAL), and neither the outline
  rasterizer nor the PDF font path can read those. Ordinary outlines mean the
  same file works on all three targets with no new machinery.
- **A cmap that reaches past the BMP.** Format 4 is 16-bit and cannot address
  U+1F600 at all. `TrueTypeFont` now prefers a format 12 subtable — `(3,10)`
  or `(0,4)`/`(0,6)` — and binary-searches its groups.
- **A run that can cross faces.** A text face has no emoji and an emoji face
  has no letters, so `Ready 🎉` cannot be measured or drawn from one file.
  `FontManager.faceForCodepoint` resolves per codepoint, the primary family
  winning whatever it can draw, so ordinary text takes exactly the same path it
  did before. Kerning is applied only between two codepoints from the same
  face — a pair spanning the boundary has no kern pair by definition.

Each target then does the one thing it has to:

- **PNG** — `RasterText` swaps face mid-run for a missing glyph and keeps the
  primary face's baseline, so the line does not step where the face changes.
- **PDF** — WinAnsi is one byte wide and has no room for U+1F389 at any price,
  so a fallback span is drawn through a **Type0 / Identity-H** resource
  (`/E1..`, alongside the WinAnsi `/F1..`) whose strings are glyph ids, with a
  `/W` array and a `/ToUnicode` cmap built from what was actually drawn. The
  existing fonts are untouched: converting everything to Identity-H would
  change the encoding, `/Widths` and cmap of text that is currently correct in
  order to fix text that currently cannot be written at all.
- **HTML** — the fallback face is named in the `font-family` stack and
  `@font-face`d, but *only when the document needs it*: without that the
  browser substitutes its own emoji font, whose advances are not the ones EVG
  measured with, and the line wraps where the PDF did not.

Emoji in a rendered PDF now extract as their real codepoints (`U+1F389`,
`U+1F600`, …) rather than as `?`.

One bug this surfaced, in code written the same afternoon: `unitsPerEm` is born
`1000`, so a *blank* `TrueTypeFont` — the "no face has this codepoint" answer —
passed a `unitsPerEm > 0` test and was used as if it were a font. `✓` (U+2713,
which nothing bundled actually has) came out as `.notdef` drawn from a face
that had never been opened, with no warning. `TrueTypeFont.isLoaded()` is the
test now, and the unencodable character is reported again.

### Phase 4.8 — Clusters, ligatures, and a font that is only as big as the page ✅

Two of Phase 4.7's three known limits, closed.

**The embedded font carries the glyphs the page used.** `TTFSubset` keeps head,
hhea, maxp, hmtx, loca and glyf, and drops everything else — `cmap` included,
because a Type0/Identity-H font never consults it, which takes GSUB, post,
name and vmtx with it. It deliberately **keeps glyph ids**: a dense
renumbering would invalidate every string already written, since Identity-H
puts glyph ids in the content stream. Composite glyphs pull their components
in transitively.

| | before | after |
| --- | --- | --- |
| a page with three emoji | 1 298 067 | 429 332 |
| `test_for_loop_simple` | 1 717 604 | 840 059 |

The remainder in each is the WinAnsi text face, which is **not** subset: a
simple TrueType font is read through its cmap, so that path needs a different
set of tables kept.

**Text is stepped by grapheme cluster.** A codepoint is not what a reader calls
a character: 🇫🇮 is two, 👍🏽 is two, 1️⃣ is three, 👨‍👩‍👧 is five, and each is one
glyph, one advance, and one place a line may not break. Stepping by codepoint
cost three separate things — the face was chosen per codepoint, so a keycap put
its digit in the text face and its box in the emoji face and the ligature never
saw all three parts; the width was the sum of the parts, so a family measured
four advances wide and drew one; and the `/ToUnicode` entry named one codepoint
for a glyph made of five.

`EVGGrapheme` is the cluster rule — a deliberate subset of UAX #29: the
emoji-relevant rules and the combining marks, not the full property tables.
`TrueTypeFont.shape()` is the shaper: drop the variation selectors, then take
the longest GSUB **LookupType 4** ligature, with the Extension (type 7) wrapper
unwrapped. That is not a general OpenType shaper — no contextual lookups, no
reordering — but it is exactly what emoji sequences need, and it runs only on a
run already known to belong to one face, so it can never disturb ordinary text.
Measured on Noto Emoji, it resolves every case that matters:

```
👨‍👩‍👧  5 codepoints -> 1 glyph      🇫🇮  2 -> 1        1️⃣  3 -> 1
👍🏽  2 -> 1                          🏳️‍🌈  4 -> 1
```

A cluster the primary face draws is measured and painted exactly as before —
per codepoint, with kerning — because those two must not part company. Only a
cluster handed to a fallback face goes through the shaper. All 28 example PDFs
re-render **byte-identical** across this change.

One bug it turned up in its own first draft: a fallback segment was *measured*
through the ordinary per-codepoint path and *drawn* shaped, so a joined family
was charged five advances and drew one, pushing everything after it on the line
to the right. A segment's width now comes from the same walk that draws it.

HTML needed one more thing. Chromium treats U+FE0F as an instruction to use its
own colour emoji font whatever the `font-family` stack says, so keycaps and the
rainbow flag came out of the system font, in colour, at advances that were not
the ones EVG measured with. The HTML renderer now writes the text as the engine
shaped it — selectors dropped — because the engine has already chosen the
presentation by choosing the face. All three targets agree glyph for glyph.

### Phase 4.9 — `emoji-color` ✅

A monochrome emoji face is outlines, so it takes whatever colour it is filled
with. Every target already tinted emoji with the element's `color` — the one
thing the engine could not do was give them a **different** colour from the
sentence they sit in, because EVG has no inline spans to hang a second colour
on.

```css
.caption { color: #1f2937; emoji-color: #e11d48 }
```

Inherited like `color`, so a deck sets it once. Unset it is the text colour and
every existing document is byte-identical — all 28 example PDFs confirm that.

- **PDF** — the fill colour is chosen per segment, and a fallback segment is
  already its own `BT`/`ET` block, so this is one `rg` operator.
- **PNG** — the raster pen carries a second colour for fallback clusters.
- **HTML** — fallback runs are wrapped in a `<span>` with their own colour,
  which is also the first thing in this engine that needs the renderer to know
  the faces rather than just their filenames.

### Multi-colour emoji — sized, deliberately not built

Noto Color Emoji is **COLRv1 with no v0 layer records at all**, so there is no
simple layered-glyph path to take. Measured on the v40 face:

| | |
| --- | --- |
| file | 25 MB, of which the `SVG ` table is 19 MB |
| base colour glyphs | 3 993 |
| using a gradient | **2 278 (57%)** |
| deepest glyph | 230 layers |
| paint formats | `PaintGlyph` 64 637, `PaintSolid` 51 493, transforms 29 107, gradients 8 630, `PaintComposite` 314 |

Two facts decide it. Gradients are not a rounding error — flattening them to a
single stop would visibly degrade more than half the set — and PDF has no COLR
support at all, so colour glyphs must become vector artwork with invisible text
behind them for extraction. That is a paint-graph interpreter, a glyph
outline → PDF path converter, axial and radial shading patterns on both the PDF
and the raster side, and a subsetter that follows COLR layer references. It is
tractable and it is scoped here; it is not a variation on what `emoji-color`
does.

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
| `test:evg:frontend` | `gallery/pdf_writer/test/run_print.sh` | UTF-8 decoding, the WinAnsi repertoire, page boxes, JSX text spacing, and the JSX attribute surface |

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
margins, row and column gaps, nesting, background colour, and every supported
length unit across 121 boxes. Both sides build their tree from the same
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
