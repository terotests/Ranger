# TODO: EVGHTMLRenderer vs EVGPDFRenderer Comparison

This document compares the two EVG renderers to identify feature parity, differences, and opportunities for modulization.

## Overview

| Renderer | Lines | Output | Use Case |
|----------|-------|--------|----------|
| EVGHTMLRenderer | ~1900 | HTML/CSS | Fast preview, browser-based, live reload |
| EVGPDFRenderer | ~2200 | PDF binary | Print-ready, embedded fonts/images |

## Feature Comparison Matrix

### Core Rendering Features

| Feature | HTML | PDF | Notes |
|---------|------|-----|-------|
| Background color | ✅ | ✅ | Both use EVGColor |
| Background gradient | ✅ CSS native | ✅ Strip-based | HTML uses CSS, PDF draws gradient strips |
| Border (solid) | ✅ | ✅ | |
| Border radius | ✅ CSS native | ✅ Bézier curves | PDF uses custom `drawRoundedRectPath` |
| Box shadow | ✅ CSS `box-shadow` | ✅ Multi-layer simulation | PDF draws layered rings |
| Text shadow | ✅ CSS `text-shadow` | ✅ Multi-pass rendering | PDF renders shadow text first |
| Opacity | ✅ CSS `opacity` | ❌ Not implemented | TODO: Add PDF transparency |
| Clip path | ❌ | ✅ `applyClipPath` | HTML could use CSS `clip-path` |
| SVG Path rendering | ✅ Inline SVG | ✅ PDF path commands | |
| Overflow hidden | ✅ CSS | ✅ Clipping | |

### Element Types

| Element | HTML | PDF | Notes |
|---------|------|-----|-------|
| View/div | ✅ `<div>` | ✅ Rectangle | |
| Label/span/text | ✅ `<span>` | ✅ `BT...ET` | PDF uses text operators |
| Image | ✅ `<img>` | ✅ XObject | PDF embeds JPEG |
| Path | ✅ `<svg><path>` | ✅ Path commands | |
| Layer | ✅ `<div>` with `inset: 0` | ✅ Same as View | |
| Divider | ✅ | ✅ `renderDivider` | |
| Print/Section/Page | ✅ Document structure | ✅ Multi-page PDF | |

### Text Features

| Feature | HTML | PDF | Notes |
|---------|------|-----|-------|
| Font family | ✅ `font-family` | ✅ TrueType embedding | PDF embeds actual TTF |
| Font size | ✅ | ✅ | |
| Font weight | ✅ CSS | ⚠️ Separate font file | PDF needs bold font file |
| Text color | ✅ | ✅ | |
| Text alignment | ✅ `text-align` | ✅ Manual positioning | |
| Line height | ✅ CSS | ✅ Manual calculation | |
| Word wrap | ✅ Browser native | ✅ `wrapText` function | PDF implements manually |
| Character encoding | ✅ UTF-8 native | ⚠️ WinAnsi + octal | PDF limited to WinAnsi |

### Image Features

| Feature | HTML | PDF | Notes |
|---------|------|-----|-------|
| Image loading | ✅ Browser/URL | ✅ File system + decode | |
| JPEG support | ✅ Native | ✅ `JPEGDecoder` | PDF has full decoder |
| EXIF orientation | ⚠️ Browser varies | ✅ `applyExifOrientation` | PDF handles correctly |
| Image scaling | ✅ CSS `object-fit` | ✅ `scaleToSize` | PDF resizes in code |
| Image quality control | ❌ | ✅ `jpegQuality` setting | PDF re-encodes |
| Max image dimensions | ❌ | ✅ `maxImageWidth/Height` | PDF optimizes for size |
| ViewBox cropping | ✅ Manual CSS | ✅ `imageViewBox` | |
| Image offset (objectPosition) | ✅ CSS transforms | ✅ `imageOffsetX/Y` | |

### Font Handling

| Feature | HTML | PDF | Notes |
|---------|------|-----|-------|
| @font-face | ✅ CSS native | N/A | |
| Font embedding | ✅ Base64 optional | ✅ Always embedded | |
| Font metrics | ❌ Browser handles | ✅ `TrueTypeFont` parser | PDF reads TTF tables |
| ToUnicode CMap | N/A | ✅ For text extraction | |
| Font fallback | ✅ CSS cascade | ✅ Helvetica | |

### Layout & Positioning

| Feature | HTML | PDF | Notes |
|---------|------|-----|-------|
| Absolute positioning | ✅ `position: absolute` | ✅ Direct coordinates | |
| Flexbox | ✅ CSS flex | ✅ EVGLayout calculates | Both use EVGLayout |
| Padding | ✅ | ✅ | |
| Margin | ✅ (in layout) | ✅ (in layout) | |
| Multi-page layout | ✅ | ✅ | Both handle Page/Section |

### Live Preview Features (HTML-specific)

| Feature | Status | Notes |
|---------|--------|-------|
| SSE live reload | ✅ | Server-sent events for updates |
| Font hot reload | ✅ | `/fonts.css` endpoint |
| Book spread view | ✅ | JS arranges pages as spreads |
| Server mode | ✅ | `setImageServer`, `generateShellHTML` |

### PDF-specific Features

| Feature | Status | Notes |
|---------|--------|-------|
| Compression | ❌ | TODO: Add stream compression |
| Metadata | ❌ | TODO: Add document info dict |
| Links/annotations | ❌ | TODO: Could add |
| Page size variations | ✅ | Per-section page sizes |

## Architectural Differences

### HTML Renderer

```
EVGHTMLRenderer
├── EVGResourceLoader (loads image dimensions)
├── EVGLayout (calculates positions)
└── Outputs HTML string with inline CSS
```

### PDF Renderer

```
EVGPDFRenderer
├── PDFImageMeasurer → EVGImageMeasurer
├── EVGLayout (calculates positions)
├── FontManager + TrueTypeFont
├── JPEGReader/Decoder/Encoder
└── Outputs binary PDF with embedded resources
```

## Key Implementation Differences

### 1. Coordinate Systems

- **HTML**: Origin top-left, Y increases downward
- **PDF**: Origin bottom-left, Y increases upward → requires Y flip: `pdfY = pageHeight - y - h`

### 2. Gradient Rendering

**HTML:**
```css
background: linear-gradient(90deg, #ff0000, #0000ff);
```

**PDF:** Draws 50 strips with interpolated colors:
```ranger
def numSteps:int 50
while (stepIdx < numSteps) {
    ; Interpolate color
    ; Draw strip
    streamBuffer.writeString("re\n")
    streamBuffer.writeString("f\n")
}
```

### 3. Shadow Rendering

**HTML:**
```css
box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
```

**PDF:** Multi-layer ring approach:
```ranger
def numLayers:int 8
while (i < numLayers) {
    ; Draw outer rect
    this.drawRoundedRectPath(sx sy sw sh sr)
    ; Draw inner rect (hole)
    this.drawRoundedRectPath(nx ny nw nh nr)
    ; Even-odd fill
    streamBuffer.writeString("f*\n")
}
```

### 4. Border Radius

**HTML:**
```css
border-radius: 10px;
```

**PDF:** Bézier curves with control point approximation (k ≈ 0.5523):
```ranger
fn drawRoundedRectPath:void (x y w h radius) {
    def k:double 0.5523
    ; Draw each corner with cubic Bézier
    streamBuffer.writeString("... c\n")  ; Bézier curve
}
```

## Modulization Opportunities

### 1. Shared Color Handling ✅ (Already done)

Both use `EVGColor` class with:
- `toCSSString()` for HTML
- RGB values / 255.0 for PDF

### 2. Shared Layout Engine ✅ (Already done)

Both use `EVGLayout` for position calculation.

### 3. Potential: Abstract Renderer Interface

```ranger
trait EVGRenderer {
    fn renderElement(el:EVGElement)
    fn renderBackground(x y w h color)
    fn renderBorder(el x y w h)
    fn renderText(el x y w h)
    fn renderImage(el x y w h)
}
```

### 4. Potential: Gradient Parser Module

Extract gradient parsing to shared module:
```ranger
class GradientParser {
    fn parse(gradientStr:string) -> GradientInfo
    ; Returns: angle, colors[], type
}
```

### 5. Potential: Shadow Configuration Module

```ranger
class ShadowConfig {
    def offsetX:double
    def offsetY:double
    def blur:double
    def color:EVGColor
    
    fn fromElement(el:EVGElement)
}
```

## TODO Items

### High Priority

- [ ] **PDF Opacity**: Implement transparency using PDF ExtGState
- [ ] **HTML Clip Path**: Add CSS `clip-path` support for parity
- [ ] **PDF Compression**: Add stream compression for smaller files
- [ ] **PDF Metadata**: Add document title, author, creation date

### Medium Priority

- [ ] **Gradient Parser**: Extract to shared module
- [ ] **Shadow Config**: Extract to shared module  
- [ ] **PDF Links**: Add hyperlink annotations
- [ ] **HTML Image EXIF**: Consider server-side EXIF handling

### Low Priority

- [ ] **Abstract Renderer**: Define common interface
- [ ] **PDF Radial Gradients**: Currently only linear
- [ ] **PDF Font Subsetting**: Only embed used glyphs
- [ ] **PDF Blend Modes**: Support CSS blend modes

## Print-Ready Book Design Guidelines

These guidelines are important for professional print output (e.g., KDP, IngramSpark):

### Cover Design

- [ ] **Create cover last**: Design the cover after your final page count is known (spine width depends on page count)

### Page Setup

- [ ] **Correct dimensions**: Ensure files use the exact dimensions required by the print service
- [x] **Even page count**: Files must have an even number of pages ✅ *Preview app validates this*
- [ ] **Page count divisibility**: For 5×8 and 6×9 books, page count must be divisible by six
- [x] **Spread layout**: Design with single page on right, two-page spreads in middle, single page on left at end ✅ *Preview app enforces this*

### Color & Ink

- [ ] **100% black text**: Use only 100% black (K=100, not rich black) for text
- [ ] **No spot colors**: Do not use spot or registration colors
- [ ] **ICC profile support**: For advanced users, implement ICC profile color management

### Graphics & Images

- [ ] **Rasterize complex vectors**: Convert overly complex vector art (Illustrator, CAD) to raster images
- [ ] **Full-bleed support**: For full-bleed printing, ensure images extend to the trim edge (+ bleed area)
- [ ] **Bleed area handling**: Add 3mm/0.125" bleed beyond trim for full-bleed elements

## Testing Recommendations

### Visual Parity Tests

1. Create test document with all features
2. Render to both HTML and PDF
3. Compare visually or with image diff

### Feature Coverage Tests

```
test_backgrounds.tsx    - solid, gradient
test_borders.tsx       - solid, radius
test_shadows.tsx       - box, text
test_text.tsx          - fonts, alignment, wrap
test_images.tsx        - cover, contain, offset
test_multipage.tsx     - sections, pages
```

## Summary

The two renderers share:
- **Same layout engine** (EVGLayout)
- **Same element model** (EVGElement)
- **Same color model** (EVGColor)
- **Same document structure** (Print/Section/Page)

Key differences:
- HTML leverages browser/CSS for rendering
- PDF implements everything from primitives
- PDF has better image processing (EXIF, resize, quality)
- HTML has better live development features

Parity is generally good, with main gaps being:
- PDF needs opacity/transparency support
- HTML could benefit from server-side EXIF handling
- Some features (clip-path, links) are renderer-specific
