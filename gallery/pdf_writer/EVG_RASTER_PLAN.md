# EVG Raster Renderer Plan - ✅ IMPLEMENTATION COMPLETE

## Overview

Create a raster (pixel buffer) renderer for EVG elements that enables:
- ✅ Proper shadow rendering with box blur (approximates Gaussian)
- ✅ Alpha compositing and transparency (Porter-Duff Source Over)
- ✅ Gradient rendering with smooth color transitions
- ✅ Output to JPEG images
- Embedding rasterized content in PDFs (next step)

## Current Status - COMPLETE

### Test Output
- `./gallery/pdf_writer/output/raster_test.jpg` (31KB, 400x300)
- Shadows: soft blurred shadows working correctly
- Gradients: linear and radial gradients working
- Shapes: rectangles, rounded rectangles, circles

### Implemented Modules (in /src/raster/)
1. **RasterBuffer.rgr** - RGBA pixel buffer with binary storage
2. **RasterCompositing.rgr** - Porter-Duff alpha blending
3. **RasterPrimitives.rgr** - Shape drawing (Bresenham lines, circles)
4. **RasterGradient.rgr** - Linear and radial gradient rendering  
5. **RasterBlur.rgr** - Box blur for shadow effects
6. **EVGRasterRenderer.rgr** - Main renderer class

### Completed Features
- ✅ HTML renderer with CSS shadows/gradients (works perfectly)
- ✅ PDF rounded rectangles with Bézier curves
- ✅ PDF linear gradients (strip-based)
- ✅ PDF basic shadow attempt (needs raster approach)
- ✅ JPEG encoder/decoder with MemoryBuffer
- ✅ PNG support in PDF embedding
- ✅ **NEW: EVG Raster Renderer with shadows and gradients**

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     EVGElement                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  EVGRasterRenderer                       │
│  - renderToBuffer(element, width, height) → MemoryBuffer│
│  - Supports: shapes, text, gradients, shadows, blur     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    MemoryBuffer                          │
│  - RGBA pixel data (width × height × 4 bytes)           │
│  - Already exists for JPEG encoding                     │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  JPEG    │ │   PNG    │ │   PDF    │
        │ Encoder  │ │ Encoder  │ │ Embedder │
        └──────────┘ └──────────┘ └──────────┘
```

## Implementation Phases

### Phase R.1: Core Raster Buffer
**Goal:** Basic pixel buffer with drawing primitives

#### Components
1. **RasterBuffer class**
   - `width`, `height`, `pixels` (byte array)
   - `setPixel(x, y, r, g, b, a)`
   - `getPixel(x, y) → (r, g, b, a)`
   - `fill(r, g, b, a)`
   - `clear()`

2. **Basic drawing**
   - `drawRect(x, y, w, h, color)`
   - `drawRoundedRect(x, y, w, h, radius, color)`
   - `fillRect(x, y, w, h, color)`

#### Deliverables
- `RasterBuffer.rgr` - Core buffer class
- `RasterPrimitives.rgr` - Basic shape drawing
- Unit tests for buffer operations

### Phase R.2: Alpha Compositing
**Goal:** Proper transparency and blending

#### Components
1. **Alpha blending modes**
   - Source over (default)
   - Multiply
   - Screen
   - Overlay

2. **Compositing functions**
   - `blendPixel(src, dst, mode) → result`
   - `compositeRect(srcBuffer, dstBuffer, x, y, mode)`

#### Deliverables
- `RasterCompositing.rgr` - Blending functions
- Support for semi-transparent colors

### Phase R.3: Gradients
**Goal:** Smooth gradient rendering

#### Components
1. **Linear gradients**
   - Arbitrary angle support
   - Multi-stop colors
   - Smooth interpolation

2. **Radial gradients**
   - Center point, radius
   - Elliptical support
   - Multi-stop colors

#### Deliverables
- `RasterGradient.rgr` - Gradient rendering
- CSS gradient syntax parsing (reuse from EVGPDFRenderer)

### Phase R.4: Shadows and Blur
**Goal:** Soft shadows with Gaussian blur

#### Components
1. **Box blur** (fast approximation)
   - Horizontal pass
   - Vertical pass
   - Configurable radius

2. **Shadow rendering**
   - Render shape to temp buffer
   - Apply blur
   - Offset and composite

3. **Gaussian blur** (optional, better quality)
   - Kernel-based convolution
   - Separable implementation

#### Deliverables
- `RasterBlur.rgr` - Blur algorithms
- `RasterShadow.rgr` - Shadow rendering
- Soft drop shadows working

### Phase R.5: Text Rendering
**Goal:** Rasterize text with effects

#### Components
1. **Glyph rasterization**
   - Use font metrics from FontMeasurer
   - Render glyphs to buffer
   - Anti-aliasing (optional)

2. **Text shadows**
   - Render text to temp buffer
   - Apply blur
   - Composite with offset

#### Deliverables
- `RasterText.rgr` - Text rasterization
- Text shadow support

### Phase R.6: Image Output
**Goal:** Export raster buffer to image formats

#### Components
1. **JPEG output**
   - Reuse existing JPEGEncoder
   - Convert RGBA → RGB (discard alpha or composite on white)

2. **PNG output** (if needed)
   - Implement PNG encoder
   - Support RGBA with transparency

#### Deliverables
- `RasterExport.rgr` - Export functions
- `evg_raster_tool.rgr` - CLI tool for EVG → image conversion

### Phase R.7: PDF Integration
**Goal:** Use rasterized content in PDFs

#### Components
1. **Selective rasterization**
   - Detect elements needing raster (shadows, complex gradients)
   - Render those elements to buffer
   - Embed as image in PDF

2. **Hybrid rendering**
   - Vector for simple shapes/text
   - Raster for effects
   - Best of both worlds

#### Deliverables
- Updated `EVGPDFRenderer.rgr` with raster fallback
- Automatic detection of raster-needed elements

## File Structure

```
gallery/pdf_writer/src/
├── raster/
│   ├── RasterBuffer.rgr        # Core pixel buffer
│   ├── RasterPrimitives.rgr    # Shape drawing
│   ├── RasterCompositing.rgr   # Alpha blending
│   ├── RasterGradient.rgr      # Gradient rendering
│   ├── RasterBlur.rgr          # Blur algorithms
│   ├── RasterShadow.rgr        # Shadow rendering
│   ├── RasterText.rgr          # Text rasterization
│   └── RasterExport.rgr        # Image export
├── tools/
│   └── evg_raster_tool.rgr     # CLI tool
└── core/
    └── EVGRasterRenderer.rgr   # Main renderer class
```

## API Design

### RasterBuffer
```ranger
class RasterBuffer {
    def width:int
    def height:int
    def pixels:[int]  ; RGBA packed as integers or byte array
    
    fn create:void (w:int h:int)
    fn setPixel:void (x:int y:int r:int g:int b:int a:int)
    fn getPixel:[int] (x:int y:int)  ; returns [r, g, b, a]
    fn clear:void ()
    fn fill:void (r:int g:int b:int a:int)
}
```

### EVGRasterRenderer
```ranger
class EVGRasterRenderer {
    def buffer:RasterBuffer
    
    fn renderElement:void (el:EVGElement x:double y:double w:double h:double)
    fn renderShadow:void (el:EVGElement x:double y:double w:double h:double)
    fn renderGradient:void (el:EVGElement x:double y:double w:double h:double)
    fn toJPEG:[int] ()  ; returns JPEG bytes
    fn toPNG:[int] ()   ; returns PNG bytes
}
```

## Dependencies

### Existing Components to Reuse
- `MemoryBuffer` - From JPEG encoder/decoder
- `JPEGEncoder` - For JPEG output
- `FontMeasurer` - For text metrics
- `EVGColor` - Color parsing

### New Dependencies
- None expected (pure Ranger implementation)

## Performance Considerations

1. **Memory usage**
   - 1920×1080 RGBA = 8.3 MB per buffer
   - Consider tile-based rendering for large documents

2. **Speed**
   - Box blur is O(n) per pixel with sliding window
   - Gaussian blur is O(r²) per pixel, use separable version

3. **Quality vs Speed tradeoffs**
   - Box blur: fast, acceptable quality
   - Gaussian blur: slower, better quality
   - Make configurable

## Success Criteria

- [ ] Soft drop shadows rendering correctly
- [ ] Text shadows with blur
- [ ] Smooth gradients (linear and radial)
- [ ] JPEG/PNG export working
- [ ] PDF with embedded rasterized effects
- [ ] Performance acceptable (< 1s for typical page)

## Timeline Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| R.1 | Core Raster Buffer | 2-3 hours |
| R.2 | Alpha Compositing | 1-2 hours |
| R.3 | Gradients | 2-3 hours |
| R.4 | Shadows and Blur | 3-4 hours |
| R.5 | Text Rendering | 3-4 hours |
| R.6 | Image Output | 1-2 hours |
| R.7 | PDF Integration | 2-3 hours |
| **Total** | | **14-21 hours** |

## Notes

- This feature enables many future possibilities:
  - Image filters (brightness, contrast, etc.)
  - Image manipulation tools
  - Charts and visualizations
  - Game graphics
  - Screenshot/thumbnail generation
