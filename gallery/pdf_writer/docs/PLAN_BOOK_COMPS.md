# Photo Album Book Components Plan

A comprehensive set of Higher-Order Components (HOC) for creating beautiful printed photo books using the EVG PDF generator.

## Design Philosophy

1. **Interface-first**: All components declare their props as TypeScript interfaces for documentation and type safety
2. **Composable**: Components can be nested and combined freely
3. **Print-optimized**: Designed for A4/Letter print output with proper margins and bleed
4. **Themeable**: Support for consistent styling across the book

---

## Core Interfaces

### Base Types

```typescript
interface BookTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  headingFontFamily: string;
  captionFontFamily: string;
}

interface PhotoSource {
  src: string;
  caption?: string;
  date?: string;
  location?: string;
}

interface TextStyle {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
}
```

---

## Page Layout Components

### 1. BookPage

The base wrapper for all book pages with consistent margins and optional page numbers.

```typescript
interface BookPageProps {
  children: JSX.Element | JSX.Element[];
  pageNumber?: number;
  showPageNumber?: boolean;
  backgroundColor?: string;
  margin?: string;
  header?: JSX.Element;
  footer?: JSX.Element;
}
```

**Features:**

- Consistent page margins (default 40px)
- Optional page numbering (bottom center/corner)
- Optional header/footer slots
- Full bleed option for edge-to-edge photos

### 2. TitlePage

A dramatic opening page for the book or chapters.

```typescript
interface TitlePageProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundOverlay?: string; // rgba color for image overlay
  author?: string;
  date?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  verticalAlign?: "top" | "center" | "bottom";
}
```

**Variants:**

- `TitlePageCentered` - Title centered vertically and horizontally
- `TitlePageBottom` - Title at bottom with gradient overlay
- `TitlePageMinimal` - Simple text-only title page

### 3. ChapterDivider

Separates sections of the book.

```typescript
interface ChapterDividerProps {
  chapterNumber?: number;
  title: string;
  subtitle?: string;
  icon?: JSX.Element; // Optional decorative icon/path
  backgroundColor?: string;
  accentColor?: string;
}
```

---

## Photo Layout Components

### 4. SinglePhoto

Full-page or large single photo with optional caption.

```typescript
interface SinglePhotoProps {
  photo: PhotoSource;
  frameStyle?: "none" | "simple" | "shadow" | "polaroid" | "vintage";
  captionPosition?: "below" | "overlay-bottom" | "overlay-top" | "side";
  captionStyle?: TextStyle;
  borderRadius?: string;
  fullBleed?: boolean;
}
```

### 5. PhotoPair

Two photos side by side or stacked.

```typescript
interface PhotoPairProps {
  photos: [PhotoSource, PhotoSource];
  layout?: "horizontal" | "vertical" | "diagonal";
  gap?: string;
  equalSize?: boolean;
  frameStyle?: "none" | "simple" | "shadow";
  showCaptions?: boolean;
}
```

### 6. PhotoGrid

Flexible grid of photos.

```typescript
interface PhotoGridProps {
  photos: PhotoSource[];
  columns?: 2 | 3 | 4;
  rows?: number;
  gap?: string;
  frameStyle?: "none" | "simple" | "rounded";
  showCaptions?: boolean;
  aspectRatio?: "square" | "4:3" | "3:2" | "original";
}
```

### 7. PhotoCollage

Artistic arrangement of photos with varying sizes.

```typescript
interface PhotoCollageProps {
  photos: PhotoSource[];
  layout: "mosaic" | "scattered" | "overlap" | "featured";
  featuredIndex?: number; // For layouts with one prominent photo
  rotation?: boolean; // Allow slight rotation for artistic effect
  gap?: string;
}
```

**Layout Types:**

- `mosaic` - Pinterest-style varied heights
- `scattered` - Polaroid-style scattered arrangement
- `overlap` - Photos slightly overlapping
- `featured` - One large photo with smaller ones around it

### 8. PhotoStrip

Horizontal or vertical strip of photos (good for timelines).

```typescript
interface PhotoStripProps {
  photos: PhotoSource[];
  direction?: "horizontal" | "vertical";
  photoSize?: string;
  gap?: string;
  showDates?: boolean;
  frameStyle?: "none" | "polaroid" | "film";
}
```

---

## Frame & Border Components

### 9. PhotoFrame

Decorative frame wrapper for any photo.

```typescript
interface PhotoFrameProps {
  children: JSX.Element;
  style: "simple" | "double" | "shadow" | "polaroid" | "vintage" | "ornate";
  borderColor?: string;
  borderWidth?: string;
  backgroundColor?: string; // For polaroid-style frames
  padding?: string;
  rotation?: number; // Degrees of rotation
}
```

### 10. PolaroidFrame

Classic polaroid-style frame with space for handwritten-style caption.

```typescript
interface PolaroidFrameProps {
  photo: PhotoSource;
  caption?: string;
  captionFont?: string; // Handwriting font
  rotation?: number;
  shadowDepth?: "none" | "light" | "medium" | "heavy";
}
```

---

## Text & Caption Components

### 11. Caption

Styled caption for photos.

```typescript
interface CaptionProps {
  text: string;
  style?: "minimal" | "elegant" | "handwritten" | "typewriter";
  position?: "below" | "above" | "overlay";
  align?: "left" | "center" | "right";
  maxLines?: number;
}
```

### 12. Quote

Large decorative quote block.

```typescript
interface QuoteProps {
  text: string;
  author?: string;
  style?: "simple" | "elegant" | "modern";
  quoteMarks?: boolean;
  backgroundColor?: string;
}
```

### 13. StoryBlock

Paragraph of text for storytelling alongside photos.

```typescript
interface StoryBlockProps {
  text: string;
  title?: string;
  dropcap?: boolean;
  columns?: 1 | 2;
  textStyle?: TextStyle;
}
```

### 14. DateStamp

Decorative date display.

```typescript
interface DateStampProps {
  date: string;
  format?: "full" | "month-year" | "year" | "custom";
  style?: "minimal" | "badge" | "banner" | "corner";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}
```

---

## Decorative Components

### 15. Divider

Horizontal or vertical decorative divider.

```typescript
interface DividerProps {
  style?: "line" | "dots" | "ornate" | "gradient" | "double";
  color?: string;
  width?: string;
  margin?: string;
}
```

### 16. PageBorder

Decorative border around page content.

```typescript
interface PageBorderProps {
  children: JSX.Element;
  style?: "simple" | "double" | "ornate" | "corner-only";
  color?: string;
  width?: string;
  cornerStyle?: "square" | "rounded" | "decorative";
}
```

### 17. Icon

SVG path-based icons for decoration.

```typescript
interface IconProps {
  name:
    | "heart"
    | "star"
    | "camera"
    | "location"
    | "calendar"
    | "flower"
    | "leaf";
  size?: string;
  color?: string;
}
```

---

## Layout Templates

### 18. SplitLayout

Page split into sections.

```typescript
interface SplitLayoutProps {
  left: JSX.Element;
  right: JSX.Element;
  ratio?: "50-50" | "60-40" | "70-30" | "40-60" | "30-70";
  gap?: string;
  divider?: boolean;
}
```

### 19. StackLayout

Vertically stacked sections.

```typescript
interface StackLayoutProps {
  children: JSX.Element[];
  gap?: string;
  align?: "left" | "center" | "right" | "stretch";
}
```

### 20. OverlayLayout

Content layered over background.

```typescript
interface OverlayLayoutProps {
  background: JSX.Element;
  overlay: JSX.Element;
  overlayPosition?:
    | "center"
    | "bottom"
    | "top"
    | "bottom-left"
    | "bottom-right";
  overlayPadding?: string;
  darkenBackground?: boolean;
}
```

---

## Preset Page Templates

### Full Page Photo with Caption

```tsx
<BookPage>
  <SinglePhoto
    photo={{ src: "./photo.jpg", caption: "Summer 2024" }}
    frameStyle="none"
    captionPosition="below"
    fullBleed={true}
  />
</BookPage>
```

### Two Photos with Story

```tsx
<BookPage>
  <StackLayout gap="20px">
    <PhotoPair photos={[photo1, photo2]} layout="horizontal" />
    <StoryBlock
      title="Our Adventure"
      text="The story of this day..."
      dropcap={true}
    />
  </StackLayout>
</BookPage>
```

### Photo Grid Page

```tsx
<BookPage>
  <StackLayout>
    <DateStamp date="June 2024" style="banner" />
    <PhotoGrid photos={photos} columns={3} gap="10px" aspectRatio="square" />
  </StackLayout>
</BookPage>
```

### Collage with Quote

```tsx
<BookPage>
  <SplitLayout ratio="60-40">
    <PhotoCollage photos={photos} layout="mosaic" />
    <StackLayout align="center">
      <Quote text="Life is about the moments..." style="elegant" />
      <Icon name="heart" color="#e74c3c" />
    </StackLayout>
  </SplitLayout>
</BookPage>
```

---

## Implementation Priority

### Phase 1: Core Components

1. `BookPage` - Base page wrapper
2. `SinglePhoto` - Single photo display
3. `PhotoFrame` - Basic framing
4. `Caption` - Text captions
5. `StackLayout` - Vertical stacking

### Phase 2: Multi-Photo Layouts

6. `PhotoPair` - Two photo layouts
7. `PhotoGrid` - Grid layouts
8. `SplitLayout` - Side-by-side layouts
9. `Divider` - Visual separators

### Phase 3: Advanced Components

10. `TitlePage` - Book/chapter titles
11. `PhotoCollage` - Artistic arrangements
12. `PolaroidFrame` - Decorative frames
13. `Quote` - Quote blocks
14. `StoryBlock` - Text paragraphs

### Phase 4: Polish & Extras

15. `ChapterDivider` - Section breaks
16. `DateStamp` - Date displays
17. `Icon` - SVG icons
18. `PageBorder` - Decorative borders
19. `PhotoStrip` - Timeline strips
20. `OverlayLayout` - Layered content

---

## Theme Presets

### Classic

```typescript
const classicTheme: BookTheme = {
  primaryColor: "#2c3e50",
  secondaryColor: "#7f8c8d",
  accentColor: "#c0392b",
  backgroundColor: "#ffffff",
  fontFamily: "Open Sans",
  headingFontFamily: "Cinzel",
  captionFontFamily: "Great Vibes",
};
```

### Modern Minimal

```typescript
const modernTheme: BookTheme = {
  primaryColor: "#1a1a1a",
  secondaryColor: "#666666",
  accentColor: "#3498db",
  backgroundColor: "#fafafa",
  fontFamily: "Josefin Sans",
  headingFontFamily: "Josefin Sans",
  captionFontFamily: "Josefin Sans",
};
```

### Vintage

```typescript
const vintageTheme: BookTheme = {
  primaryColor: "#5d4e37",
  secondaryColor: "#8b7355",
  accentColor: "#b8860b",
  backgroundColor: "#f5f0e6",
  fontFamily: "Noto Sans",
  headingFontFamily: "Cinzel",
  captionFontFamily: "Gloria Hallelujah",
};
```

### Playful

```typescript
const playfulTheme: BookTheme = {
  primaryColor: "#e74c3c",
  secondaryColor: "#3498db",
  accentColor: "#f39c12",
  backgroundColor: "#ffffff",
  fontFamily: "Open Sans",
  headingFontFamily: "Gloria Hallelujah",
  captionFontFamily: "Kaushan Script",
};
```

---

## File Structure

```
components/
  book/
    BookPage.tsx
    TitlePage.tsx
    ChapterDivider.tsx
  photos/
    SinglePhoto.tsx
    PhotoPair.tsx
    PhotoGrid.tsx
    PhotoCollage.tsx
    PhotoStrip.tsx
  frames/
    PhotoFrame.tsx
    PolaroidFrame.tsx
  text/
    Caption.tsx
    Quote.tsx
    StoryBlock.tsx
    DateStamp.tsx
  decorative/
    Divider.tsx
    PageBorder.tsx
    Icon.tsx
  layout/
    SplitLayout.tsx
    StackLayout.tsx
    OverlayLayout.tsx
  themes/
    index.ts
    classic.ts
    modern.ts
    vintage.ts
    playful.ts
  types/
    index.ts  // All interfaces
```

---

## Example Book Structure

```tsx
<Print title="Family Album 2024" author="Smith Family">
  <Section pageWidth="595" pageHeight="842" margin="0">
    {/* Cover */}
    <Page>
      <TitlePage
        title="Our Year"
        subtitle="2024"
        backgroundImage="./cover.jpg"
        backgroundOverlay="rgba(0,0,0,0.3)"
      />
    </Page>

    {/* Chapter 1 */}
    <Page>
      <ChapterDivider
        chapterNumber={1}
        title="Spring Adventures"
        icon={<Icon name="flower" />}
      />
    </Page>

    {/* Content Pages */}
    <Page>
      <BookPage pageNumber={1}>
        <SinglePhoto photo={springPhoto1} frameStyle="shadow" />
      </BookPage>
    </Page>

    <Page>
      <BookPage pageNumber={2}>
        <PhotoGrid photos={springPhotos} columns={3} />
      </BookPage>
    </Page>

    {/* ... more pages ... */}
  </Section>
</Print>
```

---

## Next Steps

1. Implement Phase 1 components as a proof of concept
2. Create a sample photo album using the components
3. Refine interfaces based on real-world usage
4. Add more frame styles and decorative elements
5. Create a theme editor/picker
6. Add page number auto-increment functionality
