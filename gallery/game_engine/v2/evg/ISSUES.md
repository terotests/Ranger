# EVG Layout Engine Known Issues

## Issue #1: Text/Label Elements Don't Auto-Size Width Based on Content

**Status:** RESOLVED (July 19, 2026)
**Severity:** Medium
**Found:** December 19, 2025
**Component:** EVGLayout.rgr

### Resolution

`EVGLayout.estimateChildWidth` (and the matching shrink-wrap in `layoutElement`)
measure a text/label leaf's content width via `measureTextContentWidth` and use
it when no explicit width is set (falling back to the parent width only if the
text is wider). So a `<Label>` in a `flexDirection:"row"` shrink-wraps to its
text and its siblings stay on the same row. Locked by `evg/evg_test.rgr`
`testTextIntrinsicWidth` (a short label + a fixed box in a row: label width <
full, sibling on the same row, sibling.x == label width). The original writeup
below predates this.

### Original description (for reference)

### Description

Text and Label elements in the EVG layout engine do not calculate their width based on text content. Instead, they default to taking the full parent width, which causes layout problems when using `flexDirection="row"`.

### Problem

When laying out elements horizontally with `flexDirection="row"`, text elements without an explicit width will:

1. Take the full available parent width
2. Push subsequent elements to the next row
3. Ignore their actual text content width

This makes it impossible to have inline layouts like:

```tsx
<View flexDirection="row">
  <Label>Some text</Label> {/* Takes full width */}
  <Image src="icon.jpg" /> {/* Wraps to next line */}
</View>
```

### Root Cause

In `EVGLayout.rgr`, the `layoutElement` function (lines 150-172) only calculates **height** for text elements based on text wrapping and line count. It does not calculate **width** based on text content.

Additionally, in `layoutChildren` (lines 240-245), when an element has:

- No explicit width (`width.isSet == false`)
- No flex value (`flex == 0`)

The layout engine treats it as "taking full width":

```ranger
; No width and no flex - treat as taking full width (will wrap)
fixedWidth = fixedWidth + innerWidth + c.box.marginLeftPx + c.box.marginRightPx
```

This assumption works for block-level elements but fails for inline text.

### Current Workaround

## Issue #2: JSX Tokenizer Creates Separate Tokens for Words

**Status:** Resolved (December 19, 2025)  
**Severity:** High  
**Component:** ts_parser_simple.rgr, ComponentEngine.rgr

### Description

The JSX text tokenizer was splitting multi-word text content into separate tokens (one per word), losing whitespace between words. This caused text like "Showcasing custom fonts" to render as "Showcasingcustomfonts".

### Root Cause

The TypeScript parser's lexer tokenizes based on whitespace, creating separate tokens for each word. When the JSX parser processes text content, each word becomes a separate `JSXText` node without the original spacing.

The `ComponentEngine.evaluateTextContent` function was normalizing and trimming each individual token before concatenating, which removed the information about word boundaries.

### Solution

Modified `ComponentEngine.evaluateTextContent` to:

1. Accumulate all JSXText tokens with spaces between them (since they were originally separated by whitespace)
2. Concatenate raw token values first: `result = result + " " + rawText`
3. Apply normalization and trimming to the **complete** accumulated text
4. This preserves word boundaries while still handling newlines and extra whitespace correctly

**Fixed in:** ComponentEngine.rgr, `evaluateTextContent` function (lines 738-780)

---

## Issue #3: SVG Path Elements Not Implemented

**Status:** RESOLVED (July 19, 2026) for the v2 raster path.
**Severity:** Medium
**Found:** December 19, 2025 (via test_features.tsx)
**Component:** SVGPathParser.rgr, EVGElement.rgr, ui/UIContext.rgr, ui/WasmUiSelect.rgr

### Resolution (v2 raster renderer)

`<Path>` elements now rasterize in the live UI path:
`SVGPathParser.flatten(steps)` flattens the command list to a polygon outline
(C/Q beziers sampled into segments; A approximated as a line to the endpoint);
`UIContext.fillPolygon` does an even-odd scanline fill (clip-stack aware);
`EVGElement.svgPath` holds the `d`/`svgPath`/`path` attribute, and
`WasmUiSelect.drawElement` fills the path — scaled into the element box — with
`backgroundColor` in place of the rectangular background. Gated by
`ui/tests/svg_path_test` (a triangle fills its interior, leaves the exterior,
and a plain element still fills its rect). The original writeup below refers to
the separate PDF renderer (`EVGPDFRenderer`), which is a different backend.

### Original description (for reference)

### Description

SVG `<Path>` elements are not implemented in the EVG component system. When used in TSX files, they are treated as unknown components and rendered as empty `<div>` elements.

### Problem

When attempting to use SVG paths for icons or vector graphics:

```tsx
<Path
  d="M10,6.5c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S12.2,6.5,10,6.5"
  width="80"
  height="80"
  viewBox="0 0 20 20"
  backgroundColor="#27ae60"
/>
```

The system outputs:

- **Warning:** "Unknown component: Path"
- Renders as: `<div>` with no visual output

### Impact

- Cannot render vector icons or SVG graphics
- Must use raster images instead (PNG/JPG)
- Limits design flexibility for scalable icons and shapes

### Required Implementation

1. **Add Path to evg_types.tsx:**

   ```tsx
   export function Path(props: PathProps): JSX.Element;

   interface PathProps extends EVGStyle {
     d: string; // SVG path data
     svgPath?: string; // Alias for d
     viewBox?: string; // ViewBox for scaling
     fill?: Color; // Fill color
     stroke?: Color; // Stroke color
     strokeWidth?: number; // Stroke width
   }
   ```

2. **Update ComponentEngine.rgr:** Add "path" to known element types (currently recognizes: View, Label, Image, Section, Page, Print)

3. **Implement path rendering in EVGPDFRenderer.rgr:** Parse SVG path commands (M, L, C, Z, etc.) and render using PDF drawing primitives

4. **Add path rendering to EVGElement.rgr:** Store path data (d attribute, viewBox) as element properties

### Workaround

Use raster image formats (PNG, JPG) for icons and graphics instead of vector SVG paths.

---

Explicitly set a width percentage or fixed width on text elements in row layouts:

```tsx
<View flexDirection="row">
  <Label width="80%">Some text</Label>
  <Image src="icon.jpg" width={20} height={20} />
</View>
```

Or use flex values:

```tsx
<View flexDirection="row">
  <Label flex={1}>Some text</Label>
  <Image src="icon.jpg" width={20} height={20} />
</View>
```

### Proper Solution

Text/Label elements should calculate their intrinsic width based on:

1. Text content length
2. Font size and family
3. Font metrics from the text measurer

The layout algorithm should:

1. Check if element is a text/label type
2. If no explicit width is set, measure the text content
3. Use the measured width instead of defaulting to parent width
4. Still respect `maxWidth` constraints for wrapping

### Suggested Code Changes

In `EVGLayout.rgr`, around line 290-300, add text width measurement:

```ranger
; Calculate child dimensions
def childWidth:double innerWidth
if child.width.isSet {
    childWidth = child.width.pixels
} {
    ; NEW: For text elements, measure content width
    if ((child.tagName == "text") || (child.tagName == "span")) {
        def fontSize:double child.inheritedFontSize
        if child.fontSize.isSet {
            fontSize = child.fontSize.pixels
        }
        if (fontSize <= 0.0) {
            fontSize = 14.0
        }
        def fontFamily:string child.inheritedFontFamily
        childWidth = (measurer.measureTextWidth(child.textContent fontFamily fontSize))
        ; Add some padding for safety
        childWidth = childWidth + 4.0
    } {
        ; Check if this child has a calculated flex width
        if (child.calculatedFlexWidth > 0.0) {
            childWidth = child.calculatedFlexWidth
        }
    }
}
```

### Impact

- **High**: Affects all horizontal layouts with text
- **Workaround Available**: Yes (explicit width or flex)
- **Breaking Change**: Potentially, as existing layouts may rely on current behavior

### Related Code

- `gallery/evg/EVGLayout.rgr` - Lines 200-400 (layoutChildren function)
- `gallery/evg/EVGTextMeasurer.rgr` - Text measurement utilities
- `gallery/pdf_writer/FontManager.rgr` - Font metrics for accurate measurement

### Test Case

See `gallery/pdf_writer/components/ListItem.tsx` for a component that demonstrates this issue.

### Notes

- The current behavior may be intentional for some use cases (e.g., full-width text blocks)
- A proper fix should distinguish between "inline" and "block" text elements
- Consider adding a `display: inline` or similar property to control this behavior
- Text measurement requires access to font metrics (FontManager in PDF writer context)

---

## Issue #4: `shadow*` (box-shadow / text-shadow) Modeled But Not Rendered

**Status:** RESOLVED (July 19, 2026). `UIContext.shadowRoundRect` (offset rounded
silhouette + quadratic outward falloff) is drawn before the fill in
`WasmUiSelect.drawElement`, reading `el.shadow*` (gated on `shadowColor.isSet` +
nonzero offset/blur so no-shadow UIs are byte-identical); text is drawn once in
the shadow colour at the offset. RGU1 keys 57-60 transmit it. Gated by
`ui/tests/box_shadow_test`.

**Original status:** Open
**Severity:** Medium
**Found:** July 19, 2026 (render-path characterization)
**Component:** ui/UIContext.rgr, ui/WasmUiSelect.rgr, scripting/wasm_ui_io.rgr

### Description

The element model declares `shadowRadius` / `shadowColor` / `shadowOffsetX` /
`shadowOffsetY` (`evg/EVGElement.rgr:169-172`, initialized `:226-229`,
unit-resolved `:478-480`, CSS-parsed `:794-807`), but **no rasterizer ever
reads them**. `WasmUiRenderer.drawElement` (the pixel entry, `ui/WasmUiSelect.rgr`)
has zero `shadow*` references, `ui/UIContext.rgr` has no shadow primitive, and
`scripting/wasm_ui_io.rgr` has **no RGU1 key for shadow** (keys jump 55
`glowIntensity` → 56 `BG_IMAGE`), so a WASM guest cannot even transmit them.

A text drop-shadow primitive `RasterText.renderTextWithShadow`
(`imaging/raster/RasterText.rgr:958`) exists but is unused — `UITextRenderer.drawLine`
calls plain `renderText`.

### Required Implementation

1. Add a shadow primitive to `ui/UIContext.rgr` (offset + blurred rounded-rect
   under the element fill).
2. Call it from `WasmUiRenderer.drawElement` before the fill (~`WasmUiSelect.rgr:508`,
   next to the existing `glowRoundRect` call).
3. Add an RGU1 key for `shadow*` in `scripting/wasm_ui_io.rgr` so guests can
   transmit the fields.

### Notes

- Glow (`glowIntensity`) IS rendered (`UIContext.glowRoundRect`, `ui/UIContext.rgr:333`),
  so this is specifically the *shadow* fields that are dead, not the whole
  effect family.

---

## Issue #5: Rounded-Corner Fills Are Not Anti-Aliased

**Status:** RESOLVED (July 19, 2026). `UIContext.roundedCoverage` (4x4 supersample)
+ `covAlpha` scale corner-boundary alpha in `fillRoundRectA` and the ring in
`strokeRoundRect`/`strokeRoundRectA`; interiors stay opaque, exteriors skipped
(so exact-color region asserts are unaffected), `rad<=0` keeps the fast path.
Gated by `ui/tests/rounded_aa_test`.

**Original status:** Open
**Severity:** Low (quality)
**Found:** July 19, 2026 (render-path characterization)
**Component:** ui/UIContext.rgr

### Description

Rounded corners DO render — `UIContext.fillRoundRectA` (`ui/UIContext.rgr:153`)
clips per-pixel via `roundedInside` (`:130`), which tests `dx*dx + dy*dy <= r*r`
against `borderRadiusPx`; the same test backs gradient/image fills and the
border stroke, so the whole box honours the radius. But the corner test is a
**hard boolean** — no sub-pixel coverage — so corner edges are aliased/jagged
while the glyphs (TrueType) are anti-aliased, giving a visible sharpness
asymmetry.

### Required Implementation

Add sub-pixel coverage (edge-distance → alpha) to `roundedInside` /
`fillRoundRectA` so corner edges blend like the AA text.

### Notes

- Not a correctness bug — corners appear and are the right shape; this is a
  pixel-quality gap only.

---

## Issue #6: No Clipping — `overflow` Modeled But Not Rendered

**Status:** RESOLVED (July 19, 2026) — both `overflow` and `clipPath`.
**Severity:** High
**Found:** July 19, 2026 (border/clip/flex characterization)
**Component:** ui/WasmUiSelect.rgr (`WasmUiRenderer.drawElement`), ui/UIContext.rgr

### Resolution

`UIContext` now owns a **clip stack** (`UIContext.rgr`): `pushClip(x,y,w,h,rad)` /
`popClip()` maintain a list of (rounded) clip regions, and every paint is
confined to their intersection. `blendPixel` rejects any pixel failing
`clipAllows` (each stacked region tested; rounded regions via `roundedInside`),
and the opaque `fillRectA` fast path is bypassed while a clip is active so solid
fills are clipped too. Cached text-glyph blits bypass `blendPixel`, so
`UIContext.text` routes through `UITextRenderer.drawLineClipped` (a sub-rect
blit to the clip bounding box) when a clip is active.

`WasmUiRenderer.drawElement` pushes the element's **padding box** (with inner
corner radius = outer − border) as a clip around its own text + all descendants
whenever `overflow != "visible"`, and pops it after the children loop. The
element's own background/border/glow are painted first, so they define the box
and are not clipped by it. Nested overflow boxes intersect automatically.

Gated regression suite: `ui/tests/clip_overflow_test` (7 asserts) — a green
child that overflows a rounded `overflow:hidden` parent is clipped at the bottom
edge AND out of the rounded corners, while an `overflow:visible` parent leaves
it un-clipped (so existing visible-overflow UIs are unaffected).

**clip-path (also resolved):** `UIContext` now supports a polygon clip region
(`pushClipPoly` + ray-cast `pointInPoly`, consulted by `blendPixel` alongside the
rect/rounded entries). `WasmUiRenderer.drawElement` parses `el.clipPath` as an
SVG-path silhouette (via `SVGPathParser.flatten`, scaled to the box) and pushes
it BEFORE the background so the fill itself is clipped to an arbitrary shape.
Gated by `ui/tests/clip_path_test`. The `clipPath` value is interpreted as SVG
path data (the CSS `polygon()`/`circle()`/`inset()` shorthands are not parsed).

**Remaining (micro):** glyph clipping is rectangular only — rounded/polygon clip
edges are not applied to cached text bitmaps (negligible for text near a clip
edge).

### Original description (for reference)

There was **no scissor/clip mechanism anywhere** in the render path.
`WasmUiRenderer.drawElement` (`ui/WasmUiSelect.rgr:474-589`) draws each child
recursively at its own absolute `calculatedX/Y` (`:582-588`) with **zero
intersection against the parent box**. `blendPixel` (`ui/UIContext.rgr:64-84`)
clips only to the **canvas** bounds (`:69-71`); fills/bg-images clip only to
*their own* rounded path via `roundedInside` (`:517`, `:534`), never to an
ancestor.

Consequences (both reproduced with evidence PNGs):

1. **`overflow:hidden` ignored** — a child taller/wider than its parent bleeds
   past the parent edge. `overflow` is modeled (`EVGElement.rgr:86`) and parsed
   (`:726-729`) but never read.
2. **Rounded parents don't clip children** — a square child fills in the
   rounded-off corners of a `borderRadius` parent (the parent's own fill is
   rounded, but the child is an independent draw call).

`clipPath` is likewise modeled (`EVGElement.rgr:155`) and parsed (`:812-815`)
but never used.

### Required Implementation (rasterizer)

Push a clip rect (and, for rounded parents, a rounded-corner mask) in
`drawElement` before recursing into children, and honor it inside
`blendPixel` / the fill loops. `overflow:hidden` and rounded-corner child
clipping both fall out of the same clip-stack. Highest-impact item in this
batch.

---

## Issue #7: `gap` Modeled + Parsed But Not Applied

**Status:** RESOLVED (July 19, 2026). `EVGLayout.layoutChildren` resolves `gap`
and applies it between consecutive in-flow children on the main axis (row +
column), and accounts for it in flex-available-space + `totalHeight`. RGU1 key 25
transmits it. Gated by `evg/evg_test.rgr` `testGap`.

**Original status:** Open
**Severity:** Medium
**Found:** July 19, 2026 (border/clip/flex characterization)
**Component:** evg/EVGLayout.rgr (+ scripting/wasm_ui_io.rgr for authorability)

### Description

The flex `gap` field is modeled (`EVGElement.rgr:103`) and CSS-parsed (`:743`)
but **never read in `EVGLayout.rgr`** — the child-cursor advance
(`layoutChildren`, `:442`,`:446`) does not add `gap` between children. Measured:
three 80px children with `gap=20` lay out at x=0/80/160 (should be 0/100/200).

### Required Implementation

Add `gap` to the main-axis cursor advance in `layoutChildren` (both row and
column). Also add an RGU1 key for `gap` in `scripting/wasm_ui_io.rgr` — there is
**no key for it** (keys jump 16→20→…→24→50), so a WASM/TSX guest cannot
currently transmit it even once layout honors it. Cheap layout fix.

---

## Issue #8: Flexbox Incomplete — Column Grow / Shrink / Stretch / Wrap

**Status:** RESOLVED (July 19, 2026). Column-axis flex grow (leftover height to
`flex>0` children), flex-shrink (nowrap: overflowing fixed children scale to fit,
row + column), `alignItems:stretch` (new `EVGElement.calculatedFlexHeight`,
honored by `layoutElement`), and a `flexWrap` field (row auto-wrap gated on it;
default "wrap" keeps historical behavior, "nowrap" enables one-line + shrink) are
all implemented in `EVGLayout.rgr`. `space-around`/`space-evenly`/`stretch` now
reach the RGU1 path via the extended `alignName`; `flexWrap` via key 26. Gated by
`evg/evg_test.rgr` (testFlexGrowRow/Column, testFlexShrink, testAlignStretch,
testFlexWrap, testJustifyDistribution, testRowSideBySide). Deliberately NOT
changed (parity, no regressions): the `flexDirection` default stays "column"
(CSS is "row") and the dead `direction` field is left as-is — both documented.

**Original status:** Open
**Severity:** Medium
**Found:** July 19, 2026 (border/clip/flex characterization)
**Component:** evg/EVGLayout.rgr

### Description

Main-axis flex is solid (**verified correct**, see below), but several flex
behaviors are missing or hardcoded:

- **Column-axis `flex` grow — MISSING.** The flex-distribution block is guarded
  `if (isColumn == false)` (`EVGLayout.rgr:298`), so `flex:1` children in a
  column get `h=0`. Only row-direction grow works.
- **`flex` shrink — MISSING.** `availableForFlex` is clamped to 0
  (`:324`); fixed items are never shrunk, so over-full containers overflow.
- **`alignItems:stretch` — MISSING.** No stretch branch in `alignRow`
  (`:662`) / `alignColumn` (`:492`); children keep their own cross-axis size.
- **`flexWrap` — NOT MODELED; wrap hardcoded ON.** There is no `flexWrap`
  field anywhere, and row layout auto-wraps (`:412-423`). CSS default is
  `nowrap`, so this is both a missing feature and a wrong default.
- **`flexDirection` default is `column`** (`EVGElement.rgr:100`); CSS default
  is `row`. The separate `direction` field (`EVGElement.rgr:81`) is **dead** —
  layout reads only `flexDirection` (`:295`,`:611`).

### Related plumbing / coverage gaps (not layout bugs)

- **RGU1 reachability ceiling** (`scripting/wasm_ui_io.rgr:373-378`):
  `alignName` maps only 0/1/2/3 → flex-start/center/flex-end/space-between, so
  `space-around`, `space-evenly`, and `alignItems:stretch` are
  **implemented-but-unreachable** through the RGU1/`.as`/TSX byte path
  (reachable only by direct `EVGElement` authoring).
- **`evg_test.rgr` coverage:** `testSimpleLayout`/`testNestedLayout`/
  `testAlignment` only assert vertical stacking + one centered box.
  `testNestedLayout` sets `content.direction="row"` (`:219`) but layout ignores
  `direction`, so it silently tests column stacking and never asserts
  `leftCol.x != rightCol.x`. No test covers flex grow, `justifyContent`
  distribution, row side-by-side, `gap`, or wrap — the pixel-correct behavior
  that WAS verified here is otherwise untested. Add regression coverage when
  fixing the above.
- **Absolute children never sized:** `layoutChildren` (`:353-385`) calls
  `layoutAbsolute` + recurses but never `layoutElement`, so a `position:absolute`
  child's `calculatedWidth/Height` stay 0 (only the `absX/absY` overlay path
  sizes them).

---

## Verified-Correct (no action needed)

The July 19, 2026 characterization confirmed, with evidence PNGs, that two
frequently-suspected areas are actually **correct** in the raster path
(`ui/WasmUiSelect.rgr` → `ui/UIContext.rgr` → `imaging/raster/PNGEncoder.rgr`):

- **Text centering (H + V).** `textAlign:"center"` measures real glyph pixel
  width (`ctx.measureWidth`) and offsets by `(contentW - tw)/2` within the
  content box (`WasmUiSelect.rgr:569-577`); vertical centering is
  `(contentH - lineHeight)/2` (`:578`). Container `alignItems:"center"` centers
  a shrink-wrapped text box in layout (`EVGLayout.rgr:574-585`). Any residual
  mis-centering is the Issue #1 authoring case (a full-width text element with
  default `textAlign:"left"` and no container `alignItems:center`) — a layout
  matter, not the rasterizer.
- **Glow.** `glowIntensity` is read and drawn as a soft halo
  (`UIContext.glowRoundRect`). Correct (a ring-stack approximation, not a true
  gaussian — a minor quality note only).

The July 19, 2026 border/clip/flex pass additionally confirmed:

- **Border rounding.** `strokeRoundRectA` (`UIContext.rgr:303-328`) draws a
  geometrically-correct concentric ring — inner corner radius = outer radius −
  thickness (`innerRad = rad - t`, `:307`) — on all four corners, no gaps /
  overshoot / double-draw, concentric with the fill (`border-box` semantics).
  Color/width parse and reach the stroke end-to-end. Only defect is corner
  aliasing (= Issue #5). Per-side border width and per-corner radius are
  modeled-but-unread (low-priority missing features, not bugs).
- **Flex main axis.** Row-direction `flex` grow is correct (fixed80 + flex:1 +
  flex:1 → x=0/80/240; flex:1/flex:2 → w=100/200), and `justifyContent`
  distribution math (center / flex-end / space-between / space-around /
  space-evenly) is correct on the main axis (space-between 3×80 → x=0/160/320).
  Pixel-verified.
