# EVG Layout Engine Known Issues

## Issue #1: Text/Label Elements Don't Auto-Size Width Based on Content

**Status:** Open  
**Severity:** Medium  
**Found:** December 19, 2025  
**Component:** EVGLayout.rgr

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

**Status:** Open  
**Severity:** Medium  
**Found:** December 19, 2025 (via test_features.tsx)  
**Component:** ComponentEngine.rgr, EVGElement.rgr, EVGPDFRenderer.rgr

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

**Status:** Open
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

**Status:** Open
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
