# EVG/PDF Writer - Known Issues

## Layout Issues

### 1. Image height="100%" does not respect parent container percentage height

**Status**: Open  
**Priority**: Medium  
**Discovered**: 2024-12-27

**Description**:
When an image has `height="100%"` inside a container with percentage-based height (e.g., `height="60%"`), the layout engine calculates the image height based on the image's aspect ratio instead of the parent container's resolved height.

**Example TSX**:
```tsx
<View width="100%" height="100%">
  <View width="100%" height="60%" marginBottom="12px">
    <Image src={src} width="100%" height="100%" objectFit="cover" />
  </View>
  <View>
    <Label>Text content</Label>
  </View>
</View>
```

**Expected behavior**:
- Parent View height = 100% of page
- Image container height = 60% of parent
- Image height = 100% of image container (which is 60% of page)

**Actual behavior**:
- Image height is calculated from image's native aspect ratio
- Image overflows the 60% container
- Text content below gets covered by the image

**Generated HTML shows**:
```html
<div style="height: 91.200000px;">  <!-- Parent should define the constraint -->
  <div style="height: 334.222219px; overflow: hidden;">  <!-- Calculated from aspect ratio, not 60% -->
    <img style="height: 334.222219px;">
  </div>
</div>
```

**Root cause**:
The layout engine in `EVGLayout.rgr` likely resolves percentage heights for images by falling back to aspect ratio calculation when the parent's height is also percentage-based (creating a circular dependency).

**Workaround**:
Use fixed pixel heights instead of percentages for image containers.

**Files to investigate**:
- `evg/EVGLayout.rgr` - Layout calculation logic
- `jsx/ComponentEngine.rgr` - TSX to EVG conversion

---

## Rendering Issues

### 2. Go slice pass-by-value in text rendering (FIXED)

**Status**: Fixed  
**Fixed**: 2024-12-27

**Description**:
Text was not rendering because the `flattenContour` function passed the `edges` slice as a parameter. In Go, slices are pass-by-value, so `append()` inside the function didn't modify the caller's slice.

**Solution**:
Created `flattenContourToField` and `addEdgeToField` methods that use a class-level `currentEdges` field instead of passing the slice as a parameter.

---

## Image Rendering Issues

### 3. Image clipping when container height is 0

**Status**: Partially Fixed  
**Updated**: 2024-12-27

**Description**:
When an image element has `calculatedHeight = 0` (due to percentage-based sizing), the renderer needs to determine how to clip the image. Current solution walks up the parent chain to find an ancestor with actual dimensions.

**Current behavior**:
- Finds first ancestor with both width and height > 0
- Uses ancestor dimensions for clipping bounds

**Remaining issue**:
This doesn't always produce correct results when multiple nested containers have percentage-based heights.

---

## Future Improvements

- [ ] Implement proper CSS-like percentage height resolution
- [ ] Add `min-height` and `max-height` support
- [ ] Improve `objectFit: cover` centering for tall images
- [ ] Add support for `aspect-ratio` CSS property
