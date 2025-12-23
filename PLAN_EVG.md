# EVG Rendering System - Development Plan

## Implementation Status Summary

This section summarizes what is currently implemented in the PDF renderer vs. what's defined in the EVG SPEC (`gallery/evg/SPEC.md`).

### ✅ IMPLEMENTED (Working in PDF Renderer)

| Feature | Status | Notes |
|---------|--------|-------|
| **Elements** | | |
| `<View>` / `<div>` | ✅ Full | Container element |
| `<Label>` / `<span>` | ✅ Full | Text element |
| `<Image>` / `<img>` | ✅ Full | JPEG with EXIF orientation, resize |
| `<Path>` / `<path>` | ✅ Full | SVG path rendering |
| `<Rect>` | ✅ Full | Rectangle element |
| `<Print>`, `<Section>`, `<Page>` | ✅ Full | Multi-page document structure |
| **Dimensions** | | |
| `width`, `height` | ✅ Full | px, %, em, hp, fill units |
| `minWidth`, `minHeight` | ✅ Full | |
| `maxWidth`, `maxHeight` | ✅ Full | |
| **Spacing** | | |
| `margin` (all sides) | ✅ Full | margin-top/right/bottom/left |
| `padding` (all sides) | ✅ Full | padding-top/right/bottom/left |
| **Position** | | |
| `left`, `top`, `right`, `bottom` | ✅ Full | Absolute positioning |
| `position: absolute/relative` | ✅ Full | |
| **Layout** | | |
| `display: flex/block` | ✅ Full | |
| `flexDirection` | ✅ Full | row, column |
| `justifyContent` | ✅ Full | flex-start, center, flex-end, space-between |
| `alignItems` | ✅ Full | flex-start, center, flex-end |
| `gap` | ✅ Full | Flexbox gap |
| `align` | ✅ Full | Horizontal alignment |
| `verticalAlign` | ✅ Full | Vertical alignment |
| `overflow: page-break` | ✅ Full | Multi-page content flow |
| **Visual** | | |
| `backgroundColor` | ✅ Full | Solid colors |
| `color` | ✅ Full | Text color |
| `borderWidth` | ✅ Full | All sides |
| `borderColor` | ✅ Full | |
| `borderRadius` | ✅ Full | Rounded corners |
| `clipPath` | ✅ Full | `circle`, `ellipse` clipping |
| **Typography** | | |
| `fontSize` | ✅ Full | px, em units |
| `fontFamily` | ✅ Full | TrueType fonts with Unicode support |
| `fontWeight` | ✅ Partial | Bold via font name (e.g., "Noto Sans Bold") |
| `textAlign` | ✅ Full | left, center, right |
| `lineHeight` | ✅ Full | Line spacing multiplier |
| **Images** | | |
| `src` / `imageUrl` | ✅ Full | Local file paths |
| EXIF Orientation | ✅ Full | Auto-rotate based on camera orientation |
| Image Resize | ✅ Full | `maxImageSize`, `imageQuality` on Print |
| **SVG Paths** | | |
| `d` / `svgPath` | ✅ Full | M, L, C, Q, Z commands |
| `viewBox` | ✅ Full | SVG viewBox scaling |
| `fill` / `fillColor` | ✅ Full | |
| `stroke` / `strokeColor` | ✅ Partial | |

### ⚠️ PARSED BUT NOT RENDERED (In EVGElement but not used by PDF renderer)

| Feature | Status | Notes |
|---------|--------|-------|
| `opacity` | ⚠️ Parsed | Parsed in JSXToEVG.rgr, **NOT rendered in PDF** |
| `rotate` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |
| `scale` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |
| `shadowRadius` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |
| `shadowColor` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |
| `shadowOffsetX` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |
| `shadowOffsetY` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |
| `overflow` | ⚠️ Defined | Defined in EVGElement.rgr, **NOT parsed or rendered** |

### ❌ NOT IMPLEMENTED (In SPEC but missing from implementation)

| Feature | Priority | Notes |
|---------|----------|-------|
| **Transforms** | | |
| `rotate` | HIGH | Rotation in degrees - needs PDF transformation matrix |
| `scale` | HIGH | Scale factor - needs PDF transformation matrix |
| `transform` | MEDIUM | CSS-style transform string |
| **Gradients** | | |
| `linear-gradient` | HIGH | PDF Type 2 (Axial) shading pattern |
| `radial-gradient` | MEDIUM | PDF Type 3 (Radial) shading pattern |
| **Shadows** | | |
| `shadow-radius` | MEDIUM | Box shadow blur - complex in PDF |
| `shadow-color` | MEDIUM | Shadow color |
| `shadow-offset-x/y` | MEDIUM | Shadow position offset |
| **Visual** | | |
| `opacity` | HIGH | PDF ExtGState transparency |
| `overflow: hidden` | HIGH | Clip children to View bounds - needs PDF clipping rect |
| `overflow: scroll` | LOW | Not applicable to PDF |
| **Image Features** | | |
| `viewBox` on Image | HIGH | Crop/zoom into image region (NEW) |
| `backgroundImage` | HIGH | View with background image (NEW) |
| `backgroundViewBox` | MEDIUM | Crop background image (NEW) |
| `backgroundSize` | MEDIUM | cover, contain, stretch (NEW) |
| **New Elements** | | |
| `<Layer>` | HIGH | Stacking layer for overlays (NEW) |
| **New Renderers** | | |
| HTML Renderer | **HIGHEST** | Unit testing, fast preview, development iteration |
| **Interactive** | | |
| `<input>` | LOW | For web renderer only |
| `<textarea>` | LOW | For web renderer only |

### Implementation Complexity

| Feature | PDF Implementation Complexity | Notes |
|---------|-------------------------------|-------|
| `opacity` | Low | ExtGState with `ca` and `CA` operators |
| `rotate` | Medium | PDF `cm` transformation matrix |
| `scale` | Medium | PDF `cm` transformation matrix |
| `overflow: hidden` | Low | PDF `re ... W n` clipping rectangle |
| `linear-gradient` | Medium | PDF Shading Pattern Type 2 |
| `radial-gradient` | Medium-High | PDF Shading Pattern Type 3 |
| `shadow` | High | No native PDF shadow - must fake with blurred shapes |
| `viewBox` on Image | Medium | Calculate source rect, use PDF image matrix |
| `backgroundImage` | Medium | Draw image before content, use clipping |
| `Layer` | Low | Just render order + optional blend mode |

---

## Overview

This document outlines the plan for enhancing the EVG (Element Visual Graph) rendering system with:
1. **HTML Renderer** - Fast HTML/CSS output for unit testing and live preview (HIGH PRIORITY)
2. **Web-based Visual Debugger** - Preview and debug layouts in browser before PDF/JPEG export
3. **New Visual Features** - Gradients, layers, enhanced image handling
4. **Metadata System** - Image EXIF data integration, GPS coordinates
5. **Map Components** - GPS-based image positioning

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TSX/JSX Source                              │
│   <Print><Page><View>...<Image src="photo.jpg"/>...</View></Page>   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Component Engine                                │
│              (gallery/pdf_writer/src/jsx/)                          │
│         Parses TSX → EVG Element Tree with metadata                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EVG Element Tree                             │
│              (gallery/evg/EVGElement.rgr)                           │
│    - Auto-generated IDs / User-defined IDs                          │
│    - Image metadata (EXIF, GPS) attached to elements                │
│    - Gradient definitions, Layer stacking                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │ Web Renderer │ │ PDF Renderer │ │ JPEG Renderer│
         │   (HTML5)    │ │   (existing) │ │  (existing)  │
         │   Debug UI   │ │              │ │              │
         └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Phase 0: HTML Renderer (HIGH PRIORITY)

### 0.1 Why HTML First?

The HTML renderer should be implemented **before** enhancing the PDF renderer because:

1. **Unit Testing** - HTML output can be parsed and validated programmatically
2. **Fast Preview** - No PDF generation overhead, instant browser preview
3. **Debugging** - Browser DevTools for inspecting layout issues
4. **Reference Implementation** - Verify layout algorithm correctness before PDF
5. **Development Speed** - Iterate quickly on new features

### 0.2 HTML/CSS vs SVG vs Canvas

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **HTML/CSS (DIV)** | Native flexbox, easy debugging, testable | Font metrics differ from PDF | Unit tests, preview |
| **SVG** | Vector, precise positioning, clipPath support | No text wrapping, complex layout | Icons, paths |
| **Canvas** | Pixel-perfect, closest to PDF | Not inspectable, no DOM | Final preview |

**Recommendation:** Start with **HTML/CSS** for testing, add **Canvas** later for pixel-accurate preview.

### 0.3 Feature Comparison: HTML vs PDF

| Feature | HTML/CSS Support | Notes |
|---------|------------------|-------|
| **Layout** | | |
| Flexbox | ✅ Native | `display: flex` |
| Absolute positioning | ✅ Native | `position: absolute` |
| Margin/Padding | ✅ Native | CSS box model |
| `overflow: hidden` | ✅ Native | CSS `overflow: hidden` |
| `overflow: page-break` | ✅ Supported | Use layout data to split into page divs |
| **Text & Fonts** | | |
| Font metrics | ✅ Supported | Use same TTF parser data as PDF renderer |
| Text measurement | ✅ Supported | Pre-computed from TTF or Canvas API |
| TrueType fonts | ✅ Supported | `@font-face` with same TTF files |
| **Visual** | | |
| `backgroundColor` | ✅ Native | CSS `background-color` |
| `borderRadius` | ✅ Native | CSS `border-radius` |
| `opacity` | ✅ Native | CSS `opacity` |
| `linear-gradient` | ✅ Native | CSS `linear-gradient()` |
| `radial-gradient` | ✅ Native | CSS `radial-gradient()` |
| `shadow` | ✅ Native | CSS `box-shadow` |
| CMYK colors | ✅ Converted | CMYK→RGB math conversion |
| **Transforms** | | |
| `rotate` | ✅ Native | CSS `transform: rotate()` |
| `scale` | ✅ Native | CSS `transform: scale()` |
| **Images** | | |
| `<Image>` | ✅ Native | `<img>` tag |
| `viewBox` (crop) | ✅ CSS | `object-fit` + `object-position` |
| `backgroundImage` | ✅ Native | CSS `background-image` |
| EXIF orientation | ⚠️ Browser | Modern browsers auto-rotate |
| **Paths** | | |
| SVG `<Path>` | ✅ Inline SVG | Embed `<svg>` element |
| `clipPath` | ✅ CSS/SVG | `clip-path: circle()` or SVG `<clipPath>` |
| Custom SVG paths | ✅ SVG | Inline SVG with `<clipPath>` element |
| **Multi-page** | | |
| Multiple pages | ✅ Supported | Each page as `<div class="evg-page">` |
| Page breaks | ✅ Supported | Layout engine provides page assignments |

### 0.4 Font Rendering: CSS vs PDF Attributes

To ensure identical text rendering between HTML and PDF, we must understand which attributes affect text measurement and rendering in each system.

#### 0.4.1 Text Measurement Attributes Comparison

| Attribute | CSS Property | PDF Operator/Property | Affects Measurement? | Notes |
|-----------|--------------|----------------------|---------------------|-------|
| **Font Selection** | | | | |
| Font family | `font-family` | `/FontName Tf` | ✅ Yes | Must use same TTF file |
| Font size | `font-size` | `fontSize Tf` | ✅ Yes | Direct scaling factor |
| Font weight | `font-weight` | Different font file | ✅ Yes | Bold = different glyphs |
| Font style | `font-style` | Different font file | ✅ Yes | Italic = different glyphs |
| **Spacing** | | | | |
| Letter spacing | `letter-spacing` | `Tc` (char spacing) | ✅ Yes | Added to each glyph advance |
| Word spacing | `word-spacing` | `Tw` (word spacing) | ✅ Yes | Added to space character |
| Line height | `line-height` | `TL` (leading) | ✅ Yes | Vertical spacing between lines |
| **Rendering** | | | | |
| Text color | `color` | `rg` / `RG` (fill) | ❌ No | Visual only |
| Text shadow | `text-shadow` | N/A (simulate) | ❌ No | Visual only |
| Text decoration | `text-decoration` | Manual lines | ❌ No | Visual only |
| **Transform** | | | | |
| Text scale X | `transform: scaleX()` | `Tm` matrix | ⚠️ Complex | Horizontal scaling |
| Text rotation | `transform: rotate()` | `Tm` matrix | ⚠️ Complex | Rotation matrix |
| **Alignment** | | | | |
| Text align | `text-align` | Manual positioning | ❌ No | Layout, not measurement |
| Vertical align | `vertical-align` | Manual positioning | ❌ No | Layout, not measurement |

#### 0.4.2 TrueType Font Tables for Measurement

| Table | Purpose | Used For |
|-------|---------|----------|
| `head` | Font header | `unitsPerEm` - scaling factor |
| `hhea` | Horizontal header | `ascender`, `descender`, `lineGap` |
| `hmtx` | Horizontal metrics | Glyph advance widths |
| `cmap` | Character map | Unicode → Glyph ID mapping |
| `kern` | Kerning (optional) | Pair-wise spacing adjustments |
| `GPOS` | Glyph positioning (optional) | Advanced kerning, ligatures |
| `OS/2` | OS/2 metrics | `sTypoAscender`, `sTypoDescender`, `sxHeight` |

#### 0.4.3 Text Width Calculation Formula

```
textWidth = Σ (glyphAdvance[char] + letterSpacing) × (fontSize / unitsPerEm)
          + (wordCount - 1) × wordSpacing

Where:
- glyphAdvance[char] = from hmtx table
- letterSpacing = CSS letter-spacing / PDF Tc
- fontSize = CSS font-size / PDF Tf size
- unitsPerEm = from head table (typically 1000 or 2048)
- wordSpacing = CSS word-spacing / PDF Tw
```

#### 0.4.4 Line Height Calculation

```
lineHeight = (ascender - descender + lineGap) × (fontSize / unitsPerEm) × lineHeightMultiplier

CSS:
  line-height: 1.5;  /* multiplier */
  line-height: 24px; /* absolute */

PDF:
  TL operator sets leading (line spacing)
  T* moves to next line using TL value
```

#### 0.4.5 Critical CSS Properties for Matching PDF

```css
/* Reset browser defaults that affect text measurement */
.evg-text {
  /* Font selection - MUST match PDF font exactly */
  font-family: 'Noto Sans', sans-serif;
  font-size: 16px;
  font-weight: 400;  /* normal */
  font-style: normal;
  
  /* Spacing - affects measurement */
  letter-spacing: 0;  /* or specific value */
  word-spacing: 0;    /* or specific value */
  line-height: 1.2;   /* must match PDF TL calculation */
  
  /* Text rendering hints */
  text-rendering: geometricPrecision;  /* prioritize accurate positioning */
  -webkit-font-smoothing: antialiased;
  
  /* Disable browser adjustments */
  font-kerning: normal;        /* or 'none' to disable */
  font-feature-settings: normal;
  text-size-adjust: 100%;      /* prevent mobile scaling */
  
  /* Whitespace handling */
  white-space: pre-wrap;       /* preserve spaces, wrap lines */
  word-break: break-word;
  
  /* Box model for text containers */
  margin: 0;
  padding: 0;
  border: 0;
}
```

#### 0.4.6 PDF Text Operators Reference

| Operator | Syntax | Description | CSS Equivalent |
|----------|--------|-------------|----------------|
| `Tf` | `/FontName size Tf` | Select font and size | `font-family`, `font-size` |
| `Tc` | `spacing Tc` | Character spacing | `letter-spacing` |
| `Tw` | `spacing Tw` | Word spacing | `word-spacing` |
| `TL` | `leading TL` | Line leading (height) | `line-height` |
| `Tr` | `mode Tr` | Render mode (fill/stroke) | `color`, `-webkit-text-stroke` |
| `Ts` | `rise Ts` | Text rise (baseline shift) | `vertical-align` |
| `Tm` | `a b c d e f Tm` | Text matrix (transform) | `transform` |
| `Tj` | `(text) Tj` | Show text | N/A |
| `TJ` | `[(text) kern (text)] TJ` | Show text with positioning | `letter-spacing` per char |
| `T*` | `T*` | Move to next line | N/A (implicit in HTML) |

#### 0.4.7 Verification Test Cases

```ranger
class FontMetricsTest {
    fn testSingleCharWidth:boolean () {
        ; Measure single character in both systems
        def font "Noto Sans"
        def size 16.0
        def char "A"
        
        def pdfWidth (pdfMeasureText char font size)
        def htmlWidth (htmlMeasureText char font size)
        
        ; Allow 0.1px tolerance for rounding
        assert (abs(pdfWidth - htmlWidth) < 0.1)
        return true
    }
    
    fn testMultilineHeight:boolean () {
        ; Verify line height matches
        def text "Line 1\nLine 2\nLine 3"
        def font "Noto Sans"
        def size 16.0
        def lineHeight 1.5
        
        def pdfHeight (pdfMeasureTextHeight text font size lineHeight)
        def htmlHeight (htmlMeasureTextHeight text font size lineHeight)
        
        assert (abs(pdfHeight - htmlHeight) < 0.5)
        return true
    }
    
    fn testKerning:boolean () {
        ; Test kerning pairs like "AV", "To", "WA"
        def pairs ["AV" "To" "WA" "VA" "Ty"]
        ; ... verify kerning affects width consistently
    }
    
    fn testLetterSpacing:boolean () {
        ; Verify letter-spacing / Tc behaves identically
        def text "Hello"
        def spacing 2.0  ; 2px letter spacing
        
        def pdfWidth (pdfMeasureText text font size spacing)
        def htmlWidth (htmlMeasureText text font size spacing)
        
        ; spacing adds (strlen - 1) * spacing to width
        assert (abs(pdfWidth - htmlWidth) < 0.1)
        return true
    }
}
```

#### 0.4.8 Known Differences to Handle

| Issue | Cause | Solution |
|-------|-------|----------|
| **Sub-pixel rendering** | Browsers round to device pixels | Use `text-rendering: geometricPrecision` |
| **Font hinting** | TTF hints adjust at small sizes | May cause ±1px differences |
| **Kerning tables** | GPOS vs kern table priority | Explicitly enable/disable kerning |
| **Default line-height** | Browsers use ~1.2, varies by font | Always set explicit `line-height` |
| **Whitespace collapse** | HTML collapses multiple spaces | Use `white-space: pre-wrap` |
| **Word breaking** | Different break algorithms | May cause line wrapping differences |

### 0.5 Font Metrics & Text Measurement

The HTML renderer can achieve **pixel-perfect text layout** by using the same font metrics system as the PDF renderer:

**Approach 1: TrueType Font Parsing (Server-side / Pre-computed)**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    TrueType Font File (.ttf)                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TrueTypeParser.rgr (existing)                    │
│  - Parse cmap table (character to glyph mapping)                    │
│  - Parse hmtx table (horizontal metrics - advance widths)           │
│  - Parse head table (unitsPerEm)                                    │
│  - Calculate: charWidth = (advanceWidth / unitsPerEm) * fontSize    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Font Metrics Lookup Table                        │
│  {                                                                  │
│    "Noto Sans": {                                                   │
│      "unitsPerEm": 1000,                                            │
│      "ascender": 1069,                                              │
│      "descender": -293,                                             │
│      "glyphWidths": { "A": 633, "B": 653, "C": 698, ... }          │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
         ┌──────────────────┐       ┌──────────────────┐
         │   PDF Renderer   │       │   HTML Renderer  │
         │  (same metrics)  │       │  (same metrics)  │
         └──────────────────┘       └──────────────────┘
```

**Approach 2: Canvas API (Browser runtime)**
```javascript
// Browser-side font measurement using Canvas API
function measureText(text, fontFamily, fontSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px "${fontFamily}"`;
    const metrics = ctx.measureText(text);
    return {
        width: metrics.width,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent
    };
}
```

**Recommended Strategy:**
1. **Pre-compute** font metrics from TTF files using existing `TrueTypeParser.rgr`
2. **Embed metrics** in HTML output as JSON or generate CSS with exact measurements
3. **Fallback** to Canvas API for dynamic/unknown fonts in browser

This ensures **identical text layout** between PDF and HTML renderers.

### 0.6 Page Breaks in HTML

Page breaks ARE possible in HTML because we control the layout engine:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EVG Layout Engine                               │
│  - Already calculates element positions                             │
│  - Already tracks page assignments (calculatedPage)                 │
│  - Knows exact page dimensions and margins                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     HTML Page Rendering                             │
│                                                                     │
│  Page 1:                        Page 2:                             │
│  ┌─────────────────────┐       ┌─────────────────────┐             │
│  │ <div class="page-1">│       │ <div class="page-2">│             │
│  │   Element A         │       │   Element D         │             │
│  │   Element B         │       │   Element E         │             │
│  │   Element C         │       │   (continued...)    │             │
│  │   (page ends here)  │       │                     │             │
│  └─────────────────────┘       └─────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```html
<div class="evg-document">
  <!-- Page 1 -->
  <div class="evg-page" style="width: 595px; height: 842px;">
    <!-- Elements with calculatedPage == 0 -->
  </div>
  
  <!-- Page 2 -->
  <div class="evg-page" style="width: 595px; height: 842px;">
    <!-- Elements with calculatedPage == 1 -->
  </div>
</div>
```

### 0.7 CMYK Color Conversion

CMYK to RGB conversion is straightforward mathematics:

```ranger
class ColorConverter {
    ; CMYK to RGB (simple conversion)
    sfn cmykToRgb:EVGColor (c:double m:double y:double k:double) {
        ; Formula: R = 255 × (1-C) × (1-K)
        def r:int (to_int (255.0 * (1.0 - c) * (1.0 - k)))
        def g:int (to_int (255.0 * (1.0 - m) * (1.0 - k)))
        def b:int (to_int (255.0 * (1.0 - y) * (1.0 - k)))
        return (EVGColor.create(r g b 255))
    }
    
    ; RGB to CMYK
    sfn rgbToCmyk:[double] (r:int g:int b:int) {
        def rn:double ((to_double r) / 255.0)
        def gn:double ((to_double g) / 255.0)
        def bn:double ((to_double b) / 255.0)
        
        def k:double (1.0 - (max3 rn gn bn))
        if (k == 1.0) {
            return [0.0 0.0 0.0 1.0]  ; Pure black
        }
        
        def c:double ((1.0 - rn - k) / (1.0 - k))
        def m:double ((1.0 - gn - k) / (1.0 - k))
        def y:double ((1.0 - bn - k) / (1.0 - k))
        
        return [c m y k]
    }
}
```

**For accurate CMYK preview:**
- Convert CMYK to RGB for browser display
- Show warning indicator for CMYK colors (since RGB gamut differs)
- Optional: Use ICC color profiles for more accurate conversion

### 0.8 What CAN'T Be Done in HTML?

| Feature | Issue | Solution |
|---------|-------|----------|
| **PDF-specific metadata** | Title, author, keywords | N/A for preview (PDF only) |
| **Embedded fonts** | PDF embeds font subsets | Use `@font-face` with TTF/WOFF |
| **Exact CMYK gamut** | Browsers use RGB | Convert + show indicator |
| **PDF encryption** | Security features | N/A for preview |

**Everything else CAN be done** - font metrics, page breaks, and color conversion are all solvable.

### 0.9 Implementation Plan

**Files to create:**
```
gallery/evg/web/
├── EVGHTMLRenderer.rgr      # Main HTML renderer
├── EVGCSSGenerator.rgr      # CSS style generation
├── EVGHTMLDocument.rgr      # HTML document wrapper
└── tests/
    ├── html_render_test.rgr # Unit tests
    └── expected/            # Expected HTML output files
```

**EVGHTMLRenderer Interface:**
```ranger
class EVGHTMLRenderer {
    def indentLevel:int 0
    def cssStyles:[string]       ; Collected CSS rules
    def usedFonts:[string]       ; Fonts to include as web fonts
    
    fn render:string (root:EVGElement)
    fn renderElement:string (el:EVGElement)
    fn renderView:string (el:EVGElement)
    fn renderLabel:string (el:EVGElement)
    fn renderImage:string (el:EVGElement)
    fn renderPath:string (el:EVGElement)
    
    fn generateCSS:string (el:EVGElement)
    fn generateInlineStyle:string (el:EVGElement)
    
    ; Output options
    def outputMode:string "inline"  ; "inline" | "stylesheet" | "both"
    def prettyPrint:boolean true
}
```

### 0.10 HTML Output Example

**Input TSX:**
```tsx
<Page width="595px" height="842px" padding="40px">
  <View backgroundColor="#f5f5f5" padding="20px" borderRadius="10px">
    <Label fontSize="24px" color="#2c3e50">Hello World</Label>
    <Image src="photo.jpg" width="200px" height="150px" />
  </View>
</Page>
```

**Output HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @font-face {
      font-family: 'Noto Sans';
      src: url('./fonts/NotoSans-Regular.ttf');
    }
    .evg-page {
      width: 595px;
      height: 842px;
      padding: 40px;
      box-sizing: border-box;
      background: white;
      position: relative;
      overflow: hidden;
    }
    .evg-view-1 {
      background-color: #f5f5f5;
      padding: 20px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
    }
    .evg-label-1 {
      font-size: 24px;
      color: #2c3e50;
      font-family: 'Noto Sans', sans-serif;
    }
    .evg-image-1 {
      width: 200px;
      height: 150px;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <div class="evg-page">
    <div class="evg-view-1">
      <span class="evg-label-1">Hello World</span>
      <img class="evg-image-1" src="photo.jpg" alt="">
    </div>
  </div>
</body>
</html>
```

### 0.11 Unit Testing with HTML

**Test approach:**
```ranger
Import "EVGHTMLRenderer.rgr"
Import "JSXToEVG.rgr"

class HTMLRenderTest {
    fn testSimpleView:boolean () {
        def tsx "<View width=\"100px\" height=\"50px\" backgroundColor=\"#ff0000\"></View>"
        def parser (new JSXToEVG())
        def root:EVGElement (parser.parse(tsx))
        
        def renderer (new EVGHTMLRenderer())
        def html:string (renderer.render(root))
        
        ; Verify output contains expected CSS
        assert (contains html "width: 100px")
        assert (contains html "height: 50px")
        assert (contains html "background-color: #ff0000")
        
        return true
    }
    
    fn testFlexLayout:boolean () {
        def tsx "<View display=\"flex\" justifyContent=\"center\" alignItems=\"center\">...</View>"
        ; ... verify flex CSS output
    }
    
    fn testGradient:boolean () {
        def tsx "<View background=\"linear-gradient(45deg, red, blue)\">...</View>"
        ; ... verify gradient CSS output
    }
}
```

### 0.12 Live Preview Server

```ranger
class EVGPreviewServer {
    def port:int 8080
    def watchPath:string ""
    def renderer:EVGHTMLRenderer
    
    fn start:void () {
        ; Start HTTP server
        ; Watch TSX files for changes
        ; WebSocket for hot reload
    }
    
    fn handleRequest:string (path:string) {
        if (path == "/") {
            return this.renderPreview()
        }
        if (startsWith path "/fonts/") {
            return this.serveFont(path)
        }
        if (startsWith path "/images/") {
            return this.serveImage(path)
        }
    }
}
```

**Usage:**
```bash
evg preview example.tsx --port=8080
# Opens browser at http://localhost:8080
# Auto-refreshes on file changes
```

### 0.13 Implementation Priority

1. **Phase 0.1:** Basic HTML structure (View, Label) - 1 day
2. **Phase 0.2:** CSS generation (colors, dimensions, spacing) - 1 day
3. **Phase 0.3:** Flexbox layout mapping - 1 day
4. **Phase 0.4:** Image rendering with viewBox - 1 day
5. **Phase 0.5:** SVG Path embedding - 1 day
6. **Phase 0.6:** Gradients and shadows - 1 day
7. **Phase 0.7:** Unit test framework - 1 day
8. **Phase 0.8:** Preview server with hot reload - 2 days

**Total: ~10 days**

---

## Phase 1: Web-based Visual Debugger

### 1.1 HTML5/Canvas Renderer

Create a new renderer that outputs the EVG tree as HTML/CSS or Canvas drawings for browser preview.

**Files to create:**
- `gallery/evg/web/EVGWebRenderer.rgr` - Renders EVG to HTML/CSS
- `gallery/evg/web/EVGCanvasRenderer.rgr` - Renders EVG to Canvas commands
- `gallery/evg/web/evg_preview_server.rgr` - Simple HTTP server for preview

**Features:**
- Real-time preview of layout
- Element inspector (click to see properties)
- Highlight element boundaries and padding/margins
- Show calculated sizes vs. specified sizes
- Export to PDF/JPEG from preview

### 1.2 Debug UI Components

```
┌─────────────────────────────────────────────────────────────────────┐
│  EVG Visual Debugger                                    [Export ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐ ┌───────────────────────────┐ │
│ │                                   │ │ Element Inspector         │ │
│ │                                   │ ├───────────────────────────┤ │
│ │      [Page Preview]               │ │ ID: header-title          │ │
│ │                                   │ │ Type: Label               │ │
│ │                                   │ │ Position: (40, 40)        │ │
│ │                                   │ │ Size: 515 x 32            │ │
│ │                                   │ │ Font: Noto Sans 24px      │ │
│ │                                   │ │ Color: #2c3e50            │ │
│ │                                   │ │                           │ │
│ │                                   │ │ ─── Computed ───          │ │
│ │                                   │ │ Padding: 0                │ │
│ │                                   │ │ Margin: 0 0 20 0          │ │
│ └───────────────────────────────────┘ └───────────────────────────┘ │
│ Page: [1] [2] [3] [4]                          Zoom: [100%]         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1.5: Incremental Rendering & Live Preview

### 1.5.1 Problem Statement

Current PDF rendering:
- Regenerates entire PDF on every change
- Slow for large documents (100+ pages)
- No live preview during development
- Must export and open externally to see results

Goal: **Sub-second preview updates** during development

### 1.5.2 Incremental PDF Rendering Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TSX Source (File Watch)                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Change Detection Engine                          │
│  - Parse TSX to AST                                                 │
│  - Diff against previous AST                                        │
│  - Identify changed pages/elements                                  │
│  - Track dependency graph (shared styles, images)                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              No Changes    Page Changed    Global Change
                    │             │             │
                    │             ▼             ▼
                    │       Re-render      Full Re-render
                    │       affected       all pages
                    │       pages only
                    │             │             │
                    └─────────────┴─────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PDF Update Strategy                               │
│  Option A: Page-level PDF replacement                               │
│  Option B: Render to PNG per page + composite                       │
│  Option C: Hybrid preview (web) + full export (PDF)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.5.3 Change Detection Strategy

**Page-level hashing:**
```
Page 1: hash("content...") = "a1b2c3"  → unchanged
Page 2: hash("content...") = "d4e5f6"  → CHANGED (was "x7y8z9")
Page 3: hash("content...") = "g7h8i9"  → unchanged
```

**What triggers full re-render:**
- Shared style changes (affects all pages using that style)
- Font changes
- Global variable changes
- Page count changes (PDF cross-reference table must update)

**What triggers partial re-render:**
- Single page content change
- Image replacement (same dimensions)
- Text edits within a page

### 1.5.4 Live Preview Implementation Options

#### Option A: Native PDF Viewer Wrapper (macOS)

Wrap `evg` binary with a native macOS app that:
1. Watches TSX files for changes (FSEvents)
2. Calls `evg` to render changed pages to PNG
3. Displays PNGs in scrollable preview
4. Full PDF export on demand

**Pros:**
- Native performance
- True WYSIWYG (same renderer)
- No browser needed

**Cons:**
- macOS only initially
- Requires Swift/Objective-C wrapper

```
┌─────────────────────────────────────────────────────────────────────┐
│  EVG Live Preview (macOS)                               [Export]    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │    ┌────────────────────────────────────────────────────┐    │   │
│  │    │                                                    │    │   │
│  │    │              Page 1 (PNG preview)                  │    │   │
│  │    │                                                    │    │   │
│  │    └────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │    ┌────────────────────────────────────────────────────┐    │   │
│  │    │                                                    │    │   │
│  │    │              Page 2 (PNG preview)                  │    │   │
│  │    │              *** UPDATED ***                       │    │   │
│  │    └────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  Page 2 of 10   |   Last update: 0.3s   |   Watching: example.tsx   │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation (Swift):**
```swift
// EVGPreviewApp.swift
class EVGPreviewController {
    var pageCache: [Int: NSImage] = [:]
    var pageHashes: [Int: String] = [:]
    
    func onFileChanged(path: String) {
        let changedPages = detectChangedPages(path)
        for pageNum in changedPages {
            // Render only changed page to PNG
            let png = renderPageToPNG(pageNum)
            pageCache[pageNum] = png
            updatePreview(pageNum)
        }
    }
    
    func renderPageToPNG(_ page: Int) -> NSImage {
        // Call evg binary with --page=N --format=png
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/local/bin/evg")
        task.arguments = [sourcePath, "--page=\(page)", "--format=png", "-o", "-"]
        // ... capture stdout as PNG data
    }
}
```

#### Option B: Electron/Tauri Wrapper (Cross-platform)

**Pros:**
- Cross-platform (macOS, Windows, Linux)
- Web technologies for UI
- Hot-reload built-in

**Cons:**
- Larger bundle size (Electron)
- Tauri requires Rust knowledge

#### Option C: VS Code Extension

Integrate preview directly into VS Code:

**Pros:**
- No separate app needed
- Side-by-side with code
- Familiar environment

**Cons:**
- Limited to VS Code users
- WebView has some limitations

```
┌─────────────────────────────────────────────────────────────────────┐
│  VS Code                                                            │
├─────────────────────────────────────────────────────────────────────┤
│  example.tsx          │  EVG Preview                                │
│ ──────────────────────│─────────────────────────────────────────────│
│  <Print>              │  ┌────────────────────────────────────────┐ │
│    <Page>             │  │                                        │ │
│      <View>           │  │        [Live Page Preview]             │ │
│        <Label>Hello   │  │                                        │ │
│        ...            │  │                                        │ │
│                       │  └────────────────────────────────────────┘ │
│                       │  Page: [1] [2] [3]    [Export PDF]          │
└─────────────────────────────────────────────────────────────────────┘
```

#### Option D: Browser-based with WebSocket Hot Reload

**Pros:**
- No installation (just open browser)
- Works on any OS
- Easy to share previews remotely

**Cons:**
- Requires running server
- Slight rendering differences from PDF

### 1.5.5 Recommended Approach: Hybrid System

**Development workflow:**
1. **Primary: Web preview** (fast, cross-platform, hot-reload)
2. **Verification: PNG per-page** (pixel-accurate to PDF)
3. **Final: Full PDF export** (production output)

**Implementation phases:**

**Phase 1.5a: Single-page PNG render mode**
```bash
# New CLI option: render single page to PNG
evg example.tsx --page=2 --format=png -o page2.png

# Render all pages as PNGs to directory
evg example.tsx --format=png --pages-dir=./preview/
```

**Phase 1.5b: File watcher with incremental render**
```bash
# Watch mode with live preview server
evg example.tsx --watch --preview-port=8080

# Opens browser at http://localhost:8080
# WebSocket pushes updates on file change
```

**Phase 1.5c: Native preview app (optional)**
```bash
# macOS app that uses evg internally
EVGPreview.app
```

### 1.5.6 PDF Incremental Update (Advanced)

PDF format allows incremental updates (appending changes without rewriting):

```
Original PDF:
┌─────────────────────────────────────────┐
│ Header                                  │
│ Object 1 (Page 1 content)               │
│ Object 2 (Page 2 content)               │
│ Object 3 (Page 3 content)               │
│ XRef Table                              │
│ Trailer                                 │
└─────────────────────────────────────────┘

After incremental update (Page 2 changed):
┌─────────────────────────────────────────┐
│ [Original PDF bytes unchanged]          │
│ ...                                     │
│ ─────── Incremental Update ───────      │
│ Object 2' (New Page 2 content)          │
│ XRef Table (updated)                    │
│ Trailer (updated)                       │
└─────────────────────────────────────────┘
```

**Challenges:**
- PDF viewers may not support incremental updates well
- File size grows with each update
- Complex implementation

**Recommendation:** Use PNG preview for development, full PDF for export.

### 1.5.7 Performance Targets

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Detect changes | < 50ms | AST diff |
| Render single page to PNG | < 200ms | Typical page |
| WebSocket push to browser | < 10ms | PNG base64 |
| **Total update latency** | **< 300ms** | From save to preview |

---

## Phase 2: New Visual Features

### 2.1 Linear Gradients

**TSX Syntax:**
```tsx
<View
  width="100%"
  height="200px"
  background="linear-gradient(45deg, #ff6b6b, #4ecdc4)"
/>

// Or with explicit stops
<View
  width="100%"
  height="200px"
  background="linear-gradient(to right, #ff6b6b 0%, #feca57 50%, #4ecdc4 100%)"
/>
```

**Implementation:**
- `EVGGradient.rgr` - Gradient definition class
- PDF: Use shading patterns (Type 2 - Axial)
- Web: CSS `linear-gradient()`

### 2.2 Radial Gradients

**TSX Syntax:**
```tsx
<View
  width="200px"
  height="200px"
  background="radial-gradient(circle at center, #ffffff, #000000)"
/>

// Elliptical
<View
  width="300px"
  height="200px"
  background="radial-gradient(ellipse at 30% 50%, #ff6b6b 0%, transparent 70%)"
/>
```

**Implementation:**
- PDF: Use shading patterns (Type 3 - Radial)
- Web: CSS `radial-gradient()`

### 2.3 Layer Element

A `Layer` element renders on top of its parent with the same dimensions, enabling stacking of content.

**TSX Syntax:**
```tsx
<View width="400px" height="300px">
  {/* Base layer - image */}
  <Layer>
    <Image src="photo.jpg" width="100%" height="100%" />
  </Layer>
  
  {/* Overlay layer - gradient */}
  <Layer>
    <View 
      width="100%" 
      height="100%" 
      background="linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
    />
  </Layer>
  
  {/* Text layer */}
  <Layer verticalAlign="bottom" padding="20px">
    <Label fontSize="24px" color="white">Photo Title</Label>
    <Label fontSize="14px" color="white" opacity="0.8">Subtitle text</Label>
  </Layer>
</View>
```

**Properties:**
- `verticalAlign`: "top" | "center" | "bottom"
- `align`: "left" | "center" | "right"
- `padding`: Inset from parent edges
- `opacity`: Layer transparency

**Implementation:**
- Layer inherits parent's calculated width/height
- Layers are rendered in order (first = bottom, last = top)
- PDF: Save/restore graphics state for each layer

### 2.4 Image viewBox (Crop/Zoom)

The `viewBox` attribute allows cropping/zooming into a specific region of an image using relative percentages.

**TSX Syntax:**
```tsx
// Full image (default)
<Image src="photo.jpg" width="400px" height="300px" />

// Zoom into center 80% of image (10% crop from each edge)
<Image 
  src="photo.jpg" 
  width="400px" 
  height="300px" 
  viewBox="10% 10% 80% 80%"
/>

// Zoom into top-left quadrant
<Image 
  src="photo.jpg" 
  width="400px" 
  height="300px" 
  viewBox="0% 0% 50% 50%"
/>

// Zoom into bottom-right area
<Image 
  src="photo.jpg" 
  width="400px" 
  height="300px" 
  viewBox="40% 40% 60% 60%"
/>

// Also supports pixel values
<Image 
  src="photo.jpg" 
  width="400px" 
  height="300px" 
  viewBox="100px 100px 800px 600px"
/>
```

**viewBox Format:** `"x y width height"`
- `x` - Horizontal offset (% or px from left edge)
- `y` - Vertical offset (% or px from top edge)  
- `width` - Width of visible area (% or px)
- `height` - Height of visible area (% or px)

**Implementation:**
- Calculate source rectangle in original image pixels
- Scale/stretch source rectangle to fill element dimensions
- PDF: Use image clipping and transformation matrix
- Web: Use CSS `object-position` and `object-fit`, or Canvas `drawImage()` with source rect

**Use Cases:**
- Portrait crop from landscape photo
- Focus on face/subject
- Create zoom effects
- Ken Burns style animations (future)

### 2.5 Image Element as Container

`Image` element children render inside a virtual layer over the image.

**TSX Syntax:**
```tsx
<Image src="photo.jpg" width="400px" height="300px">
  <View 
    position="absolute" 
    bottom="0" 
    width="100%" 
    padding="10px"
    background="rgba(0,0,0,0.5)"
  >
    <Label color="white">{image.date}</Label>
  </View>
</Image>
```

### 2.6 Background Images

Views can have background images with optional viewBox cropping.

**TSX Syntax:**
```tsx
// Simple background image
<View 
  width="100%" 
  height="400px"
  backgroundImage="photo.jpg"
  backgroundSize="cover"
>
  <Label fontSize="32px" color="white">Title Text</Label>
</View>

// Background with viewBox zoom
<View 
  width="100%" 
  height="400px"
  backgroundImage="photo.jpg"
  backgroundViewBox="20% 10% 60% 80%"
  backgroundSize="cover"
>
  <Label fontSize="32px" color="white">Zoomed Background</Label>
</View>

// Combined with gradient overlay
<View 
  width="100%" 
  height="400px"
  backgroundImage="photo.jpg"
  backgroundSize="cover"
>
  <Layer background="linear-gradient(to top, rgba(0,0,0,0.8), transparent)">
    <View padding="20px" verticalAlign="bottom">
      <Label fontSize="32px" color="white">Hero Title</Label>
      <Label fontSize="16px" color="white" opacity="0.8">Subtitle</Label>
    </View>
  </Layer>
</View>
```

**backgroundSize options:**
- `"cover"` - Scale to cover entire element (may crop)
- `"contain"` - Scale to fit within element (may have gaps)
- `"stretch"` - Stretch to fill exactly (may distort)
- `"100% 100%"` - Explicit size

---

## Phase 3: Element ID System

### 3.1 Automatic ID Generation

Every element gets a unique ID automatically.

**Format:** `{elementType}_{index}` or `{elementType}_{parentId}_{index}`

```tsx
// Auto-generated IDs
<View>              {/* id: "view_0" */}
  <Label>Text</Label>  {/* id: "label_view_0_0" */}
  <Image src="..." />  {/* id: "image_view_0_1" */}
</View>
```

### 3.2 User-defined IDs

Users can set custom IDs for elements they need to reference.

**TSX Syntax:**
```tsx
<View id="main-container">
  <Label id="title">Hello World</Label>
  <Image id="hero-image" src="photo.jpg" />
</View>
```

### 3.3 ID Registry API

```typescript
// Get element by ID
const element = evg.getElementById("hero-image");

// Get all elements of type
const allImages = evg.getElementsByType("image");

// Get element metadata
const metadata = evg.getElementMetadata("hero-image");
```

---

## Phase 4: Image Metadata System

### 4.1 EXIF Data Extraction

Extend existing `JPEGMetadata.rgr` to provide structured metadata.

**Available metadata:**
```typescript
interface ImageMetadata {
  // Basic
  width: number;
  height: number;
  orientation: number;
  
  // Camera
  make?: string;
  model?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  
  // Date/Time
  dateTime?: string;           // "2024:06:15 14:32:45"
  dateTimeOriginal?: string;
  
  // GPS
  gps?: {
    latitude: number;          // Decimal degrees (positive = N)
    longitude: number;         // Decimal degrees (positive = E)
    altitude?: number;         // Meters
    timestamp?: string;
  };
}
```

### 4.2 Context Access in TSX

**Option A: Context Provider**
```tsx
<Image src="photo.jpg" width="400px" height="300px">
  <ImageContext>
    {(meta) => (
      <View position="absolute" bottom="0" padding="10px">
        <Label color="white">{meta.dateTime}</Label>
        {meta.gps && (
          <Label color="white" fontSize="12px">
            📍 {meta.gps.latitude.toFixed(4)}, {meta.gps.longitude.toFixed(4)}
          </Label>
        )}
      </View>
    )}
  </ImageContext>
</Image>
```

**Option B: Special Variables**
```tsx
<Image src="photo.jpg" width="400px" height="300px">
  <Label color="white">${image.dateTime}</Label>
  <Label color="white">${image.gps.latitude}</Label>
</Image>
```

### 4.3 Metadata API by Element ID

```typescript
// Get metadata for specific image element
const meta = evg.getImageMetadata("hero-image");
console.log(meta.gps.latitude, meta.gps.longitude);

// Get all images with GPS data
const geoImages = evg.getImagesWithGPS();
```

---

## Phase 5: MapBox Component

### 5.1 Concept

A `MapBox` component that:
1. Takes a list of images with GPS coordinates
2. Calculates bounding box from coordinate extremes
3. Positions images relative to their GPS location within the box
4. Optionally draws route/path between images

### 5.2 TSX Syntax

**Basic Usage:**
```tsx
<MapBox 
  width="600px" 
  height="400px"
  images={[
    "IMG_001.jpg",
    "IMG_002.jpg", 
    "IMG_003.jpg"
  ]}
  markerSize="60px"
  showRoute={true}
  routeColor="#3498db"
/>
```

**Advanced Usage:**
```tsx
<MapBox 
  width="600px" 
  height="400px"
  padding="20px"
  backgroundColor="#f0f0f0"
  borderRadius="10px"
>
  {/* Images auto-positioned by GPS */}
  <MapImage src="IMG_001.jpg" markerStyle="circle" />
  <MapImage src="IMG_002.jpg" markerStyle="square" />
  <MapImage src="IMG_003.jpg" markerStyle="circle" />
  
  {/* Route line connecting images by time order */}
  <MapRoute color="#3498db" width="2px" dashed={true} />
  
  {/* Custom marker at specific coordinates */}
  <MapMarker lat={60.1699} lon={24.9384}>
    <View padding="5px" backgroundColor="red" borderRadius="50%">
      <Label color="white" fontSize="12px">Start</Label>
    </View>
  </MapMarker>
</MapBox>
```

### 5.3 Implementation Details

**Coordinate Transformation:**
```
GPS Bounds:
  minLat = min(all latitudes)
  maxLat = max(all latitudes)
  minLon = min(all longitudes)
  maxLon = max(all longitudes)

Mapping function:
  x = (lon - minLon) / (maxLon - minLon) * boxWidth
  y = (maxLat - lat) / (maxLat - minLat) * boxHeight  // Inverted Y
```

**Features:**
- Auto-calculate bounds from image GPS or manual bounds
- Padding to prevent markers at edges
- Scale bar showing distance
- North arrow indicator
- Optional background map tile integration (future)

### 5.4 MapBox Props

```typescript
interface MapBoxProps {
  // Dimensions
  width: string | number;
  height: string | number;
  
  // Content
  images?: string[];           // Array of image paths
  
  // Bounds (optional - auto-calculated if not specified)
  bounds?: {
    north: number;             // Max latitude
    south: number;             // Min latitude
    east: number;              // Max longitude
    west: number;              // Min longitude
  };
  
  // Markers
  markerSize?: string | number;
  markerStyle?: "circle" | "square" | "thumbnail";
  
  // Route
  showRoute?: boolean;
  routeColor?: string;
  routeWidth?: string | number;
  routeDashed?: boolean;
  sortBy?: "time" | "none";    // How to order route points
  
  // Visual
  backgroundColor?: string;
  padding?: string | number;
  showScale?: boolean;
  showNorthArrow?: boolean;
}
```

---

## Phase 6: Implementation Priority

### Sprint 1: Foundation (Week 1-2)
- [ ] Element ID system (auto + manual)
- [ ] Image metadata extraction enhancement
- [ ] Metadata API by element ID

### Sprint 2: Visual Features (Week 3-4)
- [ ] Linear gradient support (PDF + Web)
- [ ] Radial gradient support (PDF + Web)
- [ ] Layer element implementation

### Sprint 3: Web Debugger (Week 5-6)
- [ ] HTML/CSS renderer for EVG
- [ ] Debug UI with element inspector
- [ ] Hot-reload preview

### Sprint 4: MapBox (Week 7-8)
- [ ] GPS coordinate extraction from images
- [ ] Coordinate transformation
- [ ] MapBox component with route drawing
- [ ] MapImage and MapMarker sub-components

---

## File Structure

```
gallery/
├── evg/
│   ├── EVGElement.rgr          # Core element (add ID, metadata)
│   ├── EVGLayout.rgr           # Layout engine
│   ├── EVGGradient.rgr         # NEW: Gradient definitions
│   ├── EVGLayer.rgr            # NEW: Layer element
│   ├── EVGMapBox.rgr           # NEW: Map component
│   └── web/
│       ├── EVGWebRenderer.rgr  # NEW: HTML/CSS output
│       ├── EVGCanvasRenderer.rgr # NEW: Canvas output
│       └── evg_debug_server.rgr  # NEW: Preview server
│
├── pdf_writer/
│   ├── src/
│   │   ├── core/
│   │   │   ├── EVGPDFRenderer.rgr  # Update for gradients, layers
│   │   │   └── PDFGradient.rgr     # NEW: PDF gradient patterns
│   │   ├── jpeg/
│   │   │   └── JPEGMetadata.rgr    # Enhance EXIF parsing
│   │   └── jsx/
│   │       └── ComponentEngine.rgr # Add Layer, MapBox components
│   └── examples/
│       ├── test_gradients.tsx      # NEW: Gradient examples
│       ├── test_layers.tsx         # NEW: Layer examples
│       └── test_mapbox.tsx         # NEW: MapBox examples
```

---

## Notes

- **Backward Compatibility**: All existing TSX files must continue to work
- **Performance**: Lazy-load image metadata only when accessed
- **Memory**: Cache parsed metadata to avoid re-reading files
- **Web Debugger**: Should work without requiring Node.js (pure Ranger HTTP server)

---

## Priority Implementation Order

Based on critical use cases (text overlays, image cropping, backgrounds), here is the recommended implementation order:

### HIGH PRIORITY (Implement First)

1. **Layer Element** (Phase 2.3)
   - Essential for text overlays on images
   - Background image + gradient overlay patterns
   - Stacking multiple visual elements
   - *Implementation:* Add Layer to component parser, update all renderers

2. **Image viewBox** (Phase 2.4)
   - Crop/zoom into specific image regions
   - Portrait crop from landscape photos
   - Focus on subjects without pre-processing images
   - *Implementation:* Add viewBox parsing, calculate source rectangles

3. **Background Images** (Phase 2.6)
   - Views with background images
   - Combined with viewBox for background cropping
   - Essential for hero sections, cards, etc.
   - *Implementation:* Add backgroundImage/backgroundViewBox attributes

4. **Linear Gradients** (Phase 2.1)
   - Gradient overlays for readability
   - Visual effects and transitions
   - *Implementation:* Parse gradient syntax, implement in PDF/Canvas

### MEDIUM PRIORITY (Implement Second)

5. **Image as Container** (Phase 2.5)
   - Child elements overlay on images
   - Alternative to Layer for simple cases
   - *Implementation:* Handle Image children as overlay layer

6. **Radial Gradients** (Phase 2.2)
   - Spotlight/vignette effects
   - *Implementation:* Similar to linear but with radial math

7. **Web Debugger** (Phase 1)
   - Interactive preview without PDF export
   - Layout debugging tools
   - *Implementation:* HTML/CSS renderer, debug server

### LOWER PRIORITY (Implement Later)

8. **Element IDs** (Phase 3)
   - Debugging and referencing
   - *Implementation:* Auto-generate or parse id attribute

9. **Image Metadata** (Phase 4)
   - EXIF, GPS extraction
   - Context for templates
   - *Implementation:* Enhance JPEG parser

10. **MapBox Component** (Phase 5)
    - GPS-based image positioning
    - *Implementation:* MapBox API integration

---

## Quick Start Examples

### Text on Image (Layer + Background)
```tsx
<View width="600px" height="400px" backgroundImage="sunset.jpg" backgroundSize="cover">
  <Layer background="linear-gradient(to top, rgba(0,0,0,0.7), transparent)">
    <View verticalAlign="bottom" padding="20px">
      <Label fontSize="28px" color="white" fontWeight="bold">Beautiful Sunset</Label>
      <Label fontSize="14px" color="white" opacity="0.8">Location: Finland</Label>
    </View>
  </Layer>
</View>
```

### Cropped Portrait Image
```tsx
<Image 
  src="landscape_photo.jpg" 
  width="200px" 
  height="300px"
  viewBox="25% 10% 50% 80%"
/>
```

### Image Gallery Card
```tsx
<View width="300px" height="200px" borderRadius="10px" overflow="hidden">
  <Image src="photo.jpg" width="100%" height="100%" viewBox="10% 0% 80% 100%">
    <View position="absolute" bottom="0" width="100%" background="rgba(0,0,0,0.6)" padding="10px">
      <Label color="white">Photo Title</Label>
    </View>
  </Image>
</View>
```
