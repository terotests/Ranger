# EVG: CSS-closer layout + font-correct rendering

**Status:** Sketch / design outline  
**Date:** 2026-08-12  
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
| Flex direction / grow | Row + column grow, main-axis shrink-to-fit | No `flex-basis`; shrink is proportional scaling, not CSS shrink factors |
| `gap` | Main axis, row + column | No separate `row-gap` / `column-gap` |
| `flex-wrap` | `wrap` (default) / `nowrap` | No `wrap-reverse`; no `align-content` for wrapped lines |
| Alignment | `justifyContent`, `alignItems` (incl. `stretch`), plus legacy `align` / `verticalAlign` | Naming overlap; no `baseline` |
| Text intrinsic size | Shrink-wraps to measured content | Measurement still heuristic unless a TTF measurer is installed |
| Grid | `display: grid` with fr/px/%/repeat tracks, gaps, spans | No `grid-template-areas`, dense packing, subgrid, `minmax()` |
| Styles | Mostly inline JSX attributes | No class/theme stylesheet layer |

`min-width` / `max-width` / `min-height` / `max-height` already parse and clamp;
what is missing is ordering them correctly against grow/shrink.

Note on ISSUES #1 (labels taking full parent width in a `row`): the shrink-wrap
path now exists in `EVGLayout` and is covered by the `evg_test` cases
"text label shrink-wraps" and "sibling stays on the same row". The issue file
still describes the old behavior and needs re-verifying against the current
engine before any work is planned against it.

### Fonts

| Path | Role | Risk |
| --- | --- | --- |
| `EVGTextMeasurer` default | Heuristic widths (`fontSize * 0.55`) | **Must not drive print layout** |
| `TTFTextMeasurer` + `FontManager` + `TrueTypeFont` | Real advance widths, ascender/descender/lineGap | Correct path for PDF/tools |
| HTML renderer | Browser CSS fonts | Can diverge unless same TTF is served/`@font-face` |
| Raster (`RasterText`) | Glyph outlines from same TTF | Must use same metrics as layout |

Today PDF/tools can already measure with TTF. The sketch hardens that into a **single font pipeline** that layout always uses.

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

4. **Baseline alignment**  
   Flex/grid cross-axis `align-items: baseline` needs real ascent metrics. Defer full baseline alignment to flex v2.1, but store ascent/descent on laid-out text nodes from day one.

5. **Wrapping**  
   Word wrap must use the same width measurement as final paint. PDF `wrapText` and layout height calculation must call the shared shaper, not duplicate heuristics.

6. **Weight / style mapping**  
   `font-weight: 700` / `bold` resolves to a loaded face (e.g. `"Open Sans Bold"`), not a synthetic stroke in layout. If bold face is missing → warning + regular face (measurable), never “pretend bold” for width.

7. **HTML parity**  
   Preview must load the **same TTF/OTF files** through `@font-face` (preview server already has font endpoints). Add a debug overlay: measured box vs DOM box for golden strings.

8. **Encoding honesty**  
   PDF WinAnsi limits remain. Layout may accept Unicode; paint path must either subset/cmap correctly or fail clearly for unsupported glyphs (no silent missing-letter width collapse).

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
| `flex-grow` / `flex-shrink` / `flex-basis` | Expand today’s single `flex` number |
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

### 7.3 Out of scope for v1

`grid-template-areas`, dense packing, subgrid, `minmax()` beyond simple cases, named lines.

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

### Phase 0 — Font/layout correctness foundation

- Mandate `TTFTextMeasurer` for any document that uses custom fonts
- Fix intrinsic text width in flex row (ISSUES #1)
- Unify wrap: layout + PDF call shared `breakLines`
- Golden tests: measure/paint widths for fixture strings (Open Sans, Cinzel, bold face)
- HTML preview: ensure same font files; add metrics debug flag

### Phase 1 — Flexbox v2

- ~~row/column grow, main-axis shrink, wrap gating, `gap`, `alignItems: stretch`~~
  (landed with the engine unification — see §11.1)
- `flex-basis` and real per-item shrink factors (today shrink scales fixed sizes
  proportionally rather than by `flex-shrink`)
- min/max clamped in the right order relative to grow/shrink
- CSS property names as source of truth
- Widen the JSX attribute surface: `parseAttributes` in `JSXToEVG.rgr` is an
  explicit whitelist, so a property the engine supports is silently dropped
  unless it is listed there. `gap` and `flex-wrap` are wired up;
  `justify-content` and `align-items` are still reachable only through
  `style={{ ... }}`, not as JSX attributes.
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

### Phase 2.5 — Attribute surface (carried over)

Every phase so far has turned up a property that parses but never reaches the
engine, because there are **two** independent whitelists a property must appear
in — `parseAttributes` in `JSXToEVG.rgr` for JSX attributes, and
`EVGElement.setAttribute` for the stylesheet and `ComponentEngine` paths. A
property missing from either is silently dropped on that path only:

| Property | Was dropped from | Found during |
| --- | --- | --- |
| `gap` | JSX attributes | Phase 1 |
| `className` | JSX attributes (compared to `"className"`, arrives as `"class-name"`) | Phase 2 |
| `display` | `setAttribute` — so a stylesheet could set every grid property and still lay out as a block | Phase 3 |

All three are fixed. The hazard itself is structural and still there:
`justify-content` and `align-items` remain reachable only through
`style={{ ... }}`. A single shared property table, or a test that asserts both
paths accept the same names, would close it for good.

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

Still out of scope (§7.3): `grid-template-areas`, dense packing, subgrid,
`minmax()`, named lines. `auto` in a track list is accepted but behaves as
`1fr` — sizing it properly needs per-track content measurement.

### Phase 4 — Baseline + polish

- `align-items: baseline`
- clearer missing-glyph / encoding errors
- bleed-aware page boxes (coordinate with `TODO_PDF.md` print guidelines)

## 11. File / module impact (expected)

| Area | Likely touch points |
| --- | --- |
| Layout | `gallery/evg/EVGLayout.rgr`, `EVGElement.rgr`, `EVGText.rgr`, `EVGGrid.rgr` |
| Fonts | `pdf_writer/src/fonts/FontManager.rgr`, `TrueTypeFont.rgr`, shared shaper module |
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

The layout suite is the gate for this engine:

```
bash gallery/game_engine/v2/evg/run.sh
```

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
