# EVG Hooks Implementation Plan

## Overview

Implement React-like "hooks" for the EVG ComponentEngine that allow TSX components to access runtime context information such as print settings and image metadata. These hooks enable responsive layouts and dynamic content based on document and asset properties.

## Proposed Hooks

### 1. `usePrintSettings()` - Print Settings Hook

Returns information about the current print/page configuration from the `<Print>` element.

```tsx
interface PrintSettings {
  width: number;        // Page width in points (1 pt = 1/72 inch)
  height: number;       // Page height in points
  isPortrait: boolean;  // true if height > width
  isLandscape: boolean; // true if width > height
  format: string;       // Page format name (e.g., "A4", "Letter", "Custom")
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Usage
function render() {
  const print = usePrintSettings();
  
  return (
    <Print>
      <Section>
        <Page>
          {print.isLandscape ? (
            <View flexDirection="row">
              <Image src="./photo.jpg" width="50%" />
              <View width="50%">
                <Label>Landscape layout - {print.width}x{print.height}</Label>
              </View>
            </View>
          ) : (
            <View flexDirection="column">
              <Image src="./photo.jpg" width="100%" height="60%" />
              <Label>Portrait layout</Label>
            </View>
          )}
        </Page>
      </Section>
    </Print>
  );
}
```

### 2. `useImage(src)` - Image Metadata Hook

Returns JPEG/image metadata for a given image path. Metadata is loaded during the resource loading phase.

```tsx
interface ImageMetadata {
  // Basic properties
  width: number;           // Image width in pixels
  height: number;          // Image height in pixels
  aspectRatio: number;     // width / height
  
  // EXIF metadata (JPEG only, may be null)
  createdAt: string | null;      // DateTime original (e.g., "2024-12-25 14:30:00")
  camera: string | null;         // Camera make and model
  orientation: number;           // EXIF orientation (1-8)
  
  // GPS data (may be null)
  gps: {
    latitude: number;
    longitude: number;
  } | null;
  
  // Technical
  colorSpace: string;      // "RGB", "CMYK", etc.
  bitsPerComponent: number;
}

// Usage
function PhotoCard({ src }: { src: string }) {
  const img = useImage(src);
  
  return (
    <View padding={16} backgroundColor="#f5f5f5">
      <Image src={src} width="100%" objectFit="cover" />
      <View padding={8}>
        <Label fontSize={12} color="#666">
          {img.width} × {img.height} pixels
        </Label>
        {img.createdAt && (
          <Label fontSize={10} color="#999">
            Taken: {img.createdAt}
          </Label>
        )}
        {img.camera && (
          <Label fontSize={10} color="#999">
            Camera: {img.camera}
          </Label>
        )}
      </View>
    </View>
  );
}
```

## Implementation Architecture

### Phase 1: Hook Registration in evg_types.tsx

Add hook function declarations to `evg_types.tsx`:

```tsx
// =============================================================================
// EVG Hooks
// =============================================================================

export interface PrintSettings {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  format: string;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  createdAt: string | null;
  camera: string | null;
  orientation: number;
  gps: { latitude: number; longitude: number } | null;
  colorSpace: string;
  bitsPerComponent: number;
}

// Hook declarations (implemented by ComponentEngine)
export declare function usePrintSettings(): PrintSettings;
export declare function useImage(src: string): ImageMetadata;
```

### Phase 2: ComponentEngine Hook Evaluation

Modify `ComponentEngine.rgr` to recognize and evaluate hook calls:

1. **Detect hook calls** in `evaluateCallExpr`:
   - Check if function name starts with "use" (convention)
   - Handle `usePrintSettings()` and `useImage(src)` specially

2. **Provide hook context**:
   - `usePrintSettings()`: Return print settings from Print element (pageWidth, pageHeight, format, margins)
   - `useImage(src)`: Return metadata from ResourceLoader's image cache

3. **Return EvalValue objects**:
   - Create object EvalValue with hook result properties
   - Allow property access like `settings.width`, `img.createdAt`

### Phase 3: ResourceLoader Integration

The `ResourceLoader.rgr` already parses JPEG files for embedding. Extend it to:

1. **Extract EXIF metadata** during image loading
2. **Cache metadata** in a map keyed by image path
3. **Expose metadata** via a getter method for ComponentEngine

### Phase 4: Print Settings Extraction

Extract settings from the `<Print>` element:

1. **Parse format prop** (e.g., `format="A4"`, `format="Letter"`)
2. **Store dimensions** from pageWidth/pageHeight
3. **Make available** before render function is called

## Implementation Steps

### Step 1: Add Types to evg_types.tsx
- [ ] Add `PrintSettings` interface
- [ ] Add `ImageMetadata` interface  
- [ ] Add `usePrintSettings()` declaration
- [ ] Add `useImage(src)` declaration

### Step 2: Implement usePrintSettings() in ComponentEngine
- [ ] Add `currentPrintSettings` field to ComponentEngine class
- [ ] Set print settings when entering Print element
- [ ] Handle `usePrintSettings` call in `evaluateCallExpr`
- [ ] Return object EvalValue with print/page properties

### Step 3: Implement useImage() in ComponentEngine
- [ ] Add `imageMetadataCache` map to ComponentEngine
- [ ] Populate cache from ResourceLoader after image loading
- [ ] Handle `useImage` call in `evaluateCallExpr`
- [ ] Return object EvalValue with image metadata

### Step 4: Extract EXIF in ResourceLoader
- [ ] Parse EXIF APP1 segment in JPEG decoder
- [ ] Extract DateTime, Make, Model, Orientation, GPS
- [ ] Store in ImageMetadata structure
- [ ] Make available to ComponentEngine

### Step 5: Testing
- [ ] Create `test_hooks.tsx` example file
- [ ] Test `usePrintSettings()` with portrait/landscape layouts
- [ ] Test `useImage()` with JPEG metadata display
- [ ] Test conditional rendering based on hook values

## Example Use Cases

### 1. Responsive Photo Layout

```tsx
function render() {
  const settings = usePrintSettings();
  const photosPerRow = settings.orientation === "landscape" ? 3 : 2;
  
  return (
    <Print>
      <Section>
        <Page>
          <View flexDirection="row" flexWrap="wrap">
            {photos.map((photo, i) => (
              <View width={`${100 / photosPerRow}%`} padding={4}>
                <Image src={photo} objectFit="cover" />
              </View>
            ))}
          </View>
        </Page>
      </Section>
    </Print>
  );
}
```

### 2. Photo Gallery with Metadata

```tsx
function PhotoWithInfo({ src }: { src: string }) {
  const img = useImage(src);
  
  return (
    <View marginBottom={16}>
      <Image src={src} width="100%" />
      <View padding={8} backgroundColor="#f0f0f0">
        <Label fontSize={14} fontWeight="bold">
          {img.width} × {img.height}
        </Label>
        {img.createdAt && (
          <Label fontSize={12} color="#666">📅 {img.createdAt}</Label>
        )}
        {img.camera && (
          <Label fontSize={12} color="#666">📷 {img.camera}</Label>
        )}
        {img.gps && (
          <Label fontSize={12} color="#666">
            📍 {img.gps.latitude.toFixed(4)}, {img.gps.longitude.toFixed(4)}
          </Label>
        )}
      </View>
    </View>
  );
}
```

### 3. Conditional Page Formatting

```tsx
function render() {
  const settings = usePrintSettings();
  
  // Different header sizes based on page size
  const headerSize = settings.width > 600 ? 24 : 18;
  const bodySize = settings.width > 600 ? 14 : 12;
  
  return (
    <Print>
      <Section>
        <Page>
          <Label fontSize={headerSize} fontWeight="bold">
            Document Title
          </Label>
          <Label fontSize={bodySize}>
            This is the body text that adapts to page size.
          </Label>
        </Page>
      </Section>
    </Print>
  );
}
```

## Technical Considerations

### Hook Call Timing

Hooks are evaluated during the component render phase, AFTER:
1. Resource loading (images are loaded and metadata extracted)
2. Print settings context is established from <Print> element

This ensures all metadata is available when hooks are called.

### Caching

- `usePrintSettings()` returns cached print context (no computation needed)
- `useImage(src)` looks up cached metadata by normalized path

### Error Handling

- `useImage(src)` returns default/empty metadata if image not found
- All optional fields are explicitly nullable in TypeScript types

## Files to Modify

1. `gallery/pdf_writer/examples/evg_types.tsx` - Add type definitions
2. `gallery/pdf_writer/src/jsx/ComponentEngine.rgr` - Implement hook evaluation
3. `gallery/pdf_writer/src/tools/ResourceLoader.rgr` - Extract EXIF metadata
4. `gallery/pdf_writer/src/jpeg/JPEGMetadata.rgr` - EXIF parsing (may exist)

## Timeline

- **Phase 1**: Type definitions (1 hour)
- **Phase 2**: `usePrintSettings()` implementation (2-3 hours)
- **Phase 3**: `useImage()` basic implementation (2-3 hours)
- **Phase 4**: EXIF metadata extraction (4-6 hours)
- **Phase 5**: Testing and documentation (2 hours)

Total estimated: 11-15 hours
