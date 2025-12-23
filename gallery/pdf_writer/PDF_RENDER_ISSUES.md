# PDF Renderer Known Issues

This document tracks known issues and limitations with the EVG PDF Renderer.

## Shadow Rendering

### Issue: Box shadows render as hard-edged outlines
**Status:** Open  
**Severity:** Medium  
**Workaround:** Use HTML renderer for preview; PDF shadows are decorative only

**Description:**  
Box shadows in PDF appear as thick black borders/outlines instead of soft, blurred shadows like in CSS.

**Root Cause:**  
PDF does not have native shadow or blur support. The current implementation draws multiple concentric shapes with decreasing opacity, but this creates visible "rings" instead of smooth gradients.

**Screenshot:**  
![Box shadow issue](docs/images/shadow_issue.png)

**Attempted Solutions:**
1. ❌ Ring-based approach with even-odd fill rule - creates hard edges
2. ❌ Multiple overlapping shapes with alpha blending - PDF doesn't support true alpha
3. ❌ Color blending towards background - visible stepping artifacts

**Proper Solution:**  
Requires raster rendering - render the shadow to a pixel buffer with Gaussian blur, then embed as an image. See [EVG_RASTER_PLAN.md](EVG_RASTER_PLAN.md).

---

### Issue: Text shadows appear as black rectangles
**Status:** Open  
**Severity:** Medium  
**Workaround:** Use HTML renderer for text shadow preview

**Description:**  
Text shadows in PDF were rendering as solid black rectangles behind text instead of blurred text shadows.

**Root Cause:**  
Initial implementation was applying box shadow logic to text elements. Fixed to skip box shadows for text, but proper text shadow requires rendering duplicate text with blur effect.

**Proper Solution:**  
Raster text rendering with blur, then composite. See [EVG_RASTER_PLAN.md](EVG_RASTER_PLAN.md) Phase R.5.

---

## Gradient Rendering

### Issue: Radial gradients fall back to linear
**Status:** Open  
**Severity:** Low  
**Workaround:** Use linear gradients in PDF, or accept simplified rendering

**Description:**  
Radial gradients (`radial-gradient(circle, ...)`) are parsed but rendered as vertical linear gradients.

**Root Cause:**  
True radial gradients in PDF require either:
1. PDF shading patterns (Type 3) - complex to implement
2. Raster rendering - draw concentric circles with color interpolation

**Current Behavior:**
```
radial-gradient(circle, #ff0000, #0000ff)
→ Renders as vertical gradient from red to blue
```

**Proper Solution:**  
Either implement PDF Type 3 shading patterns, or use raster rendering.

---

### Issue: Diagonal gradients have visible banding
**Status:** Open  
**Severity:** Low  
**Workaround:** Use horizontal (90deg) or vertical (180deg) gradients

**Description:**  
Gradients at angles other than 0°, 90°, 180°, 270° show visible stepping/banding because they're rendered as horizontal/vertical strips.

**Root Cause:**  
The strip-based rendering approach draws horizontal or vertical rectangles. For diagonal gradients, this creates a "staircase" effect.

**Proper Solution:**  
Either rotate the coordinate system before drawing strips, or use raster rendering.

---

## Font Rendering

### Issue: Font loading fails with relative paths
**Status:** Open  
**Severity:** Low  
**Workaround:** Use absolute paths or run from correct working directory

**Description:**  
The PDF tool fails to load fonts when run from certain directories:
```
FontManager: Failed to load font: Open_Sans/OpenSans-Regular.ttf
```

**Root Cause:**  
Font paths are relative to the working directory, not the tool location.

**Fix Required:**  
Update `evg_pdf_tool.rgr` to resolve font paths relative to the tool's location.

---

### Issue: Missing font fallback
**Status:** Open  
**Severity:** Low  
**Workaround:** Ensure all used fonts are available

**Description:**  
If a requested font is not found, text may render with wrong metrics or fail silently.

**Expected Behavior:**  
Should fall back to Helvetica (PDF built-in) with a warning.

---

## Layout Issues

### Issue: Percentage widths in nested flex containers
**Status:** Open  
**Severity:** Low  
**Workaround:** Use pixel values for deeply nested elements

**Description:**  
`width="50%"` in deeply nested flex containers may not calculate correctly.

**Root Cause:**  
Percentage calculation depends on parent's computed width, which may not be finalized during layout pass.

---

## Image Handling

### Issue: Large images slow down PDF generation
**Status:** Open  
**Severity:** Low  
**Workaround:** Pre-scale images or use `--maxsize` option

**Description:**  
Very large JPEG images (4000x3000+) significantly slow down PDF generation due to JPEG re-encoding.

**Mitigation:**  
The tool has `--maxsize` option to automatically downscale images:
```bash
node bin/evg_pdf_tool.js input.tsx output.pdf --maxsize=1200
```

---

## Comparison: PDF vs HTML Renderer

| Feature | HTML Renderer | PDF Renderer | Notes |
|---------|---------------|--------------|-------|
| Box shadows | ✅ Perfect | ⚠️ Hard edges | CSS native vs approximation |
| Text shadows | ✅ Perfect | ❌ Not working | Needs raster |
| Linear gradients | ✅ Perfect | ✅ Good | Strip-based in PDF |
| Radial gradients | ✅ Perfect | ⚠️ Falls back | Needs raster or PDF shading |
| Border radius | ✅ Perfect | ✅ Good | Bézier curves |
| Alpha transparency | ✅ Perfect | ⚠️ Limited | PDF alpha is complex |
| Blur effects | ✅ Perfect | ❌ Not supported | Needs raster |

---

## Recommended Workflow

1. **Development:** Use HTML renderer for rapid iteration
   ```bash
   npm run evghtml:compile
   node bin/evg_html_tool.js input.tsx output.html
   ```

2. **Preview:** Open HTML in browser to verify shadows/gradients

3. **Production:** Generate PDF (shadows will be simplified)
   ```bash
   npm run evgpdf:compile
   node bin/evg_pdf_tool.js input.tsx output.pdf
   ```

4. **Complex Effects:** Wait for EVG Raster Renderer (planned)

---

## Future Improvements

### Short Term
- [ ] Fix font path resolution
- [ ] Add font fallback mechanism
- [ ] Improve diagonal gradient rendering

### Medium Term (EVG Raster Renderer)
- [ ] Proper soft shadows with Gaussian blur
- [ ] Text shadow support
- [ ] Radial gradient support
- [ ] Alpha compositing

### Long Term
- [ ] PDF shading patterns for native gradients
- [ ] PDF transparency groups for alpha
- [ ] Hardware-accelerated raster rendering

---

## Reporting New Issues

When reporting a new PDF rendering issue, please include:

1. **TSX source code** that demonstrates the issue
2. **Expected output** (screenshot from HTML renderer)
3. **Actual output** (screenshot from PDF)
4. **Ranger version** and **Node.js version**

File issues at: https://github.com/terotests/Ranger/issues
