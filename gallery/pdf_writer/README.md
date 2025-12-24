# Ranger PDF Writer & JPEG Tools

A collection of binary format utilities written in Ranger:

- **EVG PDF Renderer** - TSX → PDF pipeline with flexbox layout, TrueType fonts, and JPEG images
- **EVG HTML Renderer** - TSX → HTML preview with CSS flexbox layout
- **JPEG Decoder** - Full baseline DCT JPEG decoder with Huffman decoding
- **JPEG Encoder** - Baseline JPEG encoder with configurable quality
- **TrueType Parser** - TTF font parsing for glyph metrics and PDF embedding

## Feature Status

### Completed Features

| Feature | PDF | HTML | Notes |
|---------|-----|------|-------|
| Flexbox layout | ✅ | ✅ | Full support |
| TrueType fonts | ✅ | ✅ | Embedded in PDF, CSS in HTML |
| JPEG images | ✅ | ✅ | Embedded/base64 |
| Text wrapping | ✅ | ✅ | Automatic word wrap |
| Border radius | ✅ | ✅ | Bézier curves in PDF |
| Linear gradients | ✅ | ✅ | Strip-based in PDF, CSS in HTML |
| Radial gradients | ⚠️ | ✅ | Falls back to linear in PDF |
| Box shadows | ⚠️ | ✅ | Hard edges in PDF, perfect in HTML |
| Text shadows | ⚠️ | ✅ | Needs raster renderer in PDF |
| Component system | ✅ | ✅ | TSX imports |
| Layer element | ⏳ | ✅ | Absolute overlay for stacking |
| Image viewBox | ⏳ | ✅ | Crop/zoom images |
| Alignment (align/verticalAlign) | ✅ | ✅ | Row alignment |

### Planned: EVG Raster Renderer

To properly support shadows and effects in PDF, a raster (pixel buffer) renderer is planned.
See [EVG_RASTER_PLAN.md](EVG_RASTER_PLAN.md) for details.

## EVG Attributes Reference

TSX uses **camelCase** for all attributes (e.g., `fontSize`, `backgroundColor`, `verticalAlign`).

### Layout & Positioning

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `width` | string | Element width | `"100px"`, `"50%"`, `"100%"` |
| `height` | string | Element height | `"200px"`, `"auto"` |
| `padding` | string | Inner spacing | `"20px"`, `"10px 20px"` |
| `margin` | string | Outer spacing | `"10px"`, `"0 auto"` |
| `marginTop/Right/Bottom/Left` | string | Individual margins | `"20px"` |
| `position` | string | Positioning mode | `"relative"`, `"absolute"` |
| `top/right/bottom/left` | string | Position offset | `"10px"`, `"50%"` |

### Flexbox Layout

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `flexDirection` | string | Main axis direction | `"row"`, `"column"` |
| `flex` | number | Flex grow factor | `1`, `2` |
| `gap` | string | Gap between children | `"10px"`, `"20px"` |
| `align` | string | Horizontal alignment of children | `"left"`, `"center"`, `"right"` |
| `verticalAlign` | string | Vertical alignment of children | `"top"`, `"center"`, `"bottom"` |
| `justifyContent` | string | Main axis distribution | `"flex-start"`, `"center"`, `"space-between"` |
| `alignItems` | string | Cross axis alignment | `"flex-start"`, `"center"`, `"stretch"` |

### Typography

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `fontSize` | string | Font size | `"16px"`, `"1.2em"` |
| `fontWeight` | string | Font weight | `"normal"`, `"bold"`, `"600"` |
| `fontFamily` | string | Font family | `"'Open Sans'"`, `"Helvetica"` |
| `color` | string | Text color | `"#333"`, `"rgb(50,50,50)"` |
| `textAlign` | string | Text alignment | `"left"`, `"center"`, `"right"` |
| `lineHeight` | number | Line spacing factor | `1.2`, `1.6` |

### Visual Styling

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `backgroundColor` | string | Background color | `"#f0f0f0"`, `"rgba(0,0,0,0.5)"` |
| `background` | string | Background (gradients) | `"linear-gradient(180deg, #fff, #000)"` |
| `borderRadius` | string | Corner rounding | `"8px"`, `"50%"` |
| `borderWidth` | string | Border thickness | `"1px"`, `"2px"` |
| `borderColor` | string | Border color | `"#ccc"`, `"transparent"` |

### Shadows (HTML only)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `shadowRadius` | string | Shadow blur radius | `"10px"` |
| `shadowColor` | string | Shadow color | `"rgba(0,0,0,0.3)"` |
| `shadowOffsetX` | string | Horizontal shadow offset | `"2px"`, `"-5px"` |
| `shadowOffsetY` | string | Vertical shadow offset | `"4px"` |

> **Note:** Shadows are fully supported in HTML output but have limited support in PDF (hard edges only). For best results with shadows, use the HTML renderer.

### Images

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `src` | string | Image source path | `"./photo.jpg"` |
| `objectFit` | string | Image scaling mode | `"cover"`, `"contain"`, `"fill"` |
| `imageOffsetX` | string | Horizontal image offset | `"50px"`, `"-20%"` |
| `imageOffsetY` | string | Vertical image offset | `"100px"`, `"-10%"` |
| `imageViewBox` | string | Crop region (x% y% w% h%) | `"25% 25% 50% 50%"` |

#### Image Offset (Positioning)
The `imageOffsetX` and `imageOffsetY` attributes adjust the position of the image within its container. This is useful for fine-tuning the focal point of cropped images.

- **Positive values**: Move image right/down
- **Negative values**: Move image left/up
- **Pixels**: Absolute offset in pixels (e.g., `"50px"`, `"-100px"`)
- **Percentage**: Offset relative to image size (e.g., `"10%"`, `"-20%"`)

```tsx
{/* Move image 100px up to show more of the bottom */}
<Image
  src="./portrait.jpg"
  width="100%"
  height="300px"
  objectFit="cover"
  imageOffsetY="-100px"
/>

{/* Shift image 20% to the right */}
<Image
  src="./landscape.jpg"
  width="400px"
  height="250px"
  objectFit="cover"
  imageOffsetX="20%"
/>
```

### Special Elements

#### Layer Element
A `Layer` is an absolutely positioned overlay that fills its parent completely. Useful for overlaying text on images.

```tsx
<View width="300px" height="200px" position="relative">
  <Image src="./photo.jpg" width="100%" height="100%" objectFit="cover" />
  <Layer
    background="linear-gradient(180deg, transparent, rgba(0,0,0,0.7))"
    align="center"
    verticalAlign="center"
  >
    <Label fontSize="24px" color="#ffffff" textAlign="center">
      Centered Title
    </Label>
  </Layer>
</View>
```

#### Image ViewBox (Cropping)
The `imageViewBox` attribute crops an image to show only a specific region.

```tsx
{/* Show only the center 50% of the image */}
<Image
  src="./photo.jpg"
  imageViewBox="25% 25% 50% 50%"
  width="150px"
  height="100px"
  objectFit="cover"
/>
```

### Alignment Examples

#### Horizontal Centering (align)
```tsx
<View width="100%" flexDirection="row" align="center">
  <Label>This text is horizontally centered</Label>
</View>
```

#### Vertical Centering (verticalAlign)
```tsx
<View width="100%" height="200px" flexDirection="row" verticalAlign="center">
  <Label>This text is vertically centered</Label>
</View>
```

#### Both Centered
```tsx
<View width="100%" height="200px" flexDirection="row" align="center" verticalAlign="center">
  <Label textAlign="center">Centered both ways</Label>
</View>
```

#### Bottom-aligned Text on Image
```tsx
<View width="300px" height="200px" position="relative">
  <Image src="./photo.jpg" width="100%" height="100%" objectFit="cover" />
  <Layer
    background="linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))"
    align="center"
    verticalAlign="bottom"
    padding="20px"
  >
    <Label fontSize="18px" color="#ffffff">Bottom Title</Label>
  </Layer>
</View>
```

## Folder Structure

```
pdf_writer/
├── src/                    # Ranger source files (.rgr)
│   ├── core/              # Core PDF rendering engine
│   │   ├── EVGElement.rgr
│   │   ├── EVGLayout.rgr
│   │   ├── EVGPDFRenderer.rgr
│   │   ├── EVGHTMLRenderer.rgr  # HTML output
│   │   └── ...
│   ├── jsx/               # TSX/JSX parsing and component engine
│   │   ├── ComponentEngine.rgr
│   │   └── ...
│   ├── jpeg/              # JPEG decoder/encoder
│   │   ├── TurboJPEGDecoder.rgr
│   │   ├── TurboJPEGEncoder.rgr
│   │   └── ...
│   ├── fonts/             # TrueType font handling
│   │   └── FontManager.rgr
│   └── tools/             # Command-line tools
│       ├── evg_tool.rgr           # Go: TSX → HTML
│       ├── evg_preview_server.rgr # Go: Live preview server
│       ├── evg_html_tool.rgr      # JS: TSX → HTML
│       ├── evg_pdf_tool.rgr       # JS: TSX → PDF
│       └── evg_component_tool.rgr # JS: TSX → PDF with components
├── bin/                   # Compiled output (JS and Go binaries)
│   ├── evg_tool           # Go binary: fast HTML conversion
│   ├── evg_preview_server # Go binary: live reload server
│   └── *.js               # Node.js tools
├── components/            # Reusable TSX components
│   ├── PhotoLayouts.tsx
│   └── ...
├── examples/              # Example TSX files
│   ├── test_gallery.tsx
│   ├── test_imports.tsx
│   ├── test_shadow_gradient.tsx  # NEW: Shadow/gradient test
│   └── ...
├── assets/                # Static assets
│   ├── fonts/            # TrueType fonts
│   │   ├── Open_Sans/
│   │   ├── Noto_Sans/
│   │   └── ...
│   └── images/           # Sample images
│       └── IMG_6573.jpg
├── output/                # Generated output (gitignored)
│   ├── pdfs/
│   └── html/              # NEW: HTML output
└── docs/                  # Documentation
```

## EVG HTML Tool (TSX → HTML)

Generate HTML previews from TSX files. Useful for rapid development and testing.

### Quick Start

```bash
# Compile the HTML tool
npm run evghtml:compile

# Generate HTML from TSX
node bin/evg_html_tool.js examples/test_simple.tsx output/html/sample_output.html

# Or run the npm script
npm run evghtml
```

### Features
- Full CSS flexbox layout
- Box shadows and text shadows (CSS native)
- Linear and radial gradients
- Border radius
- Embedded images as base64

---

## EVG Tool (Go Binary - Recommended)

A fast, standalone Go binary for TSX to HTML conversion. Includes component support and configurable paths.

### Quick Start

```bash
# Build the Go binary (one-time)
npm run evg:tool:build:go

# Convert TSX to HTML
cd gallery/pdf_writer
./bin/evg_tool examples/test_gallery.tsx output.html

# With component imports
./bin/evg_tool examples/test_gallery.tsx --assets=../components;../assets

# Self-contained HTML (embedded images/fonts)
./bin/evg_tool examples/test_gallery.tsx output.html --embed
```

### Command Line Options

```
USAGE:
  evg_tool <input.tsx> [output.html] [options]

OPTIONS:
  Input/Output:
    <input.tsx>             TSX file to convert (required)
    [output.html]           Output HTML file (optional, defaults to input.html)

  Components & Assets:
    -a, --assets=PATHS      Semicolon-separated paths for component imports
    -c, --components        Use ComponentEngine even without --assets

  Fonts & Images:
    -f, --fonts=PATH        Path to fonts folder (default: ../assets/fonts/)
    -i, --images=PATH       Base path for images (default: input directory)

  Page Layout:
    --width=N               Page width in points (default: 595 = A4)
    --height=N              Page height in points (default: 842 = A4)

  Output Options:
    -t, --title=TEXT        HTML page title (default: 'EVG Preview')
    -e, --embed             Embed images/fonts as base64 data URIs

  Debug & Info:
    -d, --debug             Print element tree and debug information
    -h, --help              Show help message
    -v, --version           Show version
```

### Default Folder Structure

The tool expects this folder structure (can be overridden with options):

```
project/
├── examples/                 # Your TSX files here
│   └── document.tsx
├── components/               # Reusable components (use --assets)
│   └── PhotoLayouts.tsx
└── assets/
    ├── fonts/                # Font files (default: ../assets/fonts/)
    │   ├── Helvetica/
    │   │   └── Helvetica.ttf
    │   └── Noto_Sans/
    │       └── NotoSans-Regular.ttf
    └── images/               # Image files (referenced in TSX)
        └── photo.jpg
```

---

## EVG Preview Server (Live Reload)

A live-reloading HTTP server for rapid TSX development. Changes to the file automatically refresh the browser.

### Quick Start

```bash
# Build the Go binary (one-time)
npm run evgpreview:build

# Start the preview server
cd gallery/pdf_writer
./bin/evg_preview_server examples/test_gallery.tsx 3006

# Open http://localhost:3006 in your browser
# Edit the TSX file - browser auto-refreshes on save!
```

### Features

- **Live reload** - Browser automatically refreshes when you save
- **Component support** - Import and use reusable TSX components
- **Asset serving** - Images and fonts served from the assets folder
- **Multi-page support** - Preview documents with multiple pages
- **SSE-based updates** - Efficient Server-Sent Events for change detection

### Command Line Options

```
USAGE:
  evg_preview_server <input.tsx> [port] [options]

ARGUMENTS:
  input.tsx         TSX file to preview (required)
  port              Server port (default: 3000)

OPTIONS:
  --assets=PATHS    Semicolon-separated paths for imports
                    Default: ../components;../assets (relative to input)
```

### Examples

```bash
# Basic usage
./bin/evg_preview_server examples/document.tsx 3000

# Custom port
./bin/evg_preview_server examples/document.tsx 8080

# Explicit asset paths
./bin/evg_preview_server my_doc.tsx 3000 --assets=./components;./fonts
```

### Folder Structure

The preview server uses the same folder structure as evg_tool:

```
project/
├── examples/           <- Your TSX files (run server here)
│   └── document.tsx
├── components/         <- Reusable components (auto-discovered)
│   └── PhotoLayouts.tsx
└── assets/
    ├── fonts/          <- Font files (served via /assets/fonts/)
    └── images/         <- Images (served via /assets/images/)
```

---

## EVG PDF Tool (TSX → PDF)

Generate PDFs from TSX files using a React-like syntax with flexbox layout.

### Quick Start

```bash
# Compile the tool
npm run evgpdf:compile

# Generate a PDF from TSX
node bin/evg_pdf_tool.js examples/test_simple.tsx output/pdfs/sample_output.pdf

# Or run the npm script
npm run evgpdf
```

### Advanced: Component Tool

For multi-page documents with imported components:

```bash
# Compile the component tool
npm run evgcomp:compile

# Generate a PDF from TSX (with asset paths for fonts and components)
node bin/evg_component_tool.js examples/test_gallery.tsx output/pdfs/gallery.pdf "--assets=./assets/fonts;./components"

# Or run the npm script
npm run evgcomp:run
```

### Command Line Arguments

```bash
node bin/evg_component_tool.js <input.tsx> <output.pdf> [options]

Options:
  --assets=<paths>   Semicolon-separated list of asset directories
                     (fonts, images, components)
  --quality=<n>      JPEG quality 1-100 (default: 85)
  --maxsize=<n>      Maximum image dimension in pixels (default: 1200)
```

**Example with multiple asset paths:**

```bash
node bin/evg_component_tool.js examples/doc.tsx output/pdfs/doc.pdf "--assets=./assets/fonts;./assets/images;./components"
```

### TSX Syntax

```tsx
import { View, Label, Image } from "./evg_types";

const MyDocument = (
  <View width="100%" height="100%" padding="30px">
    <Label fontSize="24px" fontWeight="bold" color="#2c3e50">
      Hello, PDF World!
    </Label>

    <View flexDirection="row" marginTop="20px">
      <Image src="./photo.jpg" width="200px" height="150px" />
      <View flex="1" marginLeft="20px">
        <Label fontSize="14px" lineHeight="1.6">
          This is a paragraph with automatic text wrapping.
        </Label>
      </View>
    </View>
  </View>
);

export default MyDocument;
```

### Component System

The PDF Writer now supports **reusable components** with TSX, allowing you to build modular, maintainable PDF layouts by extracting common UI patterns into separate components.

#### Creating Components

Components are TypeScript functions that accept props and return TSX elements. Create them in separate `.tsx` files:

```tsx
// components/Header.tsx
import { View, Label } from "../evg_types";

export function Header({
  text,
  backgroundColor = "#3b82f6",
}: {
  text: string;
  backgroundColor?: string;
}) {
  return (
    <View padding={20} backgroundColor={backgroundColor}>
      <Label fontSize={24} fontWeight="bold" color="#ffffff">
        {text}
      </Label>
    </View>
  );
}
```

```tsx
// components/ListItem.tsx
import { View, Label } from "../evg_types";

export function ListItem({ label, index }: { label: string; index: number }) {
  return (
    <View
      padding={8}
      marginBottom={4}
      backgroundColor={index % 2 === 0 ? "#f0f0f0" : "#ffffff"}
    >
      <Label fontSize={14} color="#333333">
        {index + 1}. {label}
      </Label>
    </View>
  );
}
```

#### Using Components

Import your components and use them like built-in elements:

```tsx
// examples/test_imports.tsx
import { View, Label, Section, Page, Print } from "../evg_types";
import { Header } from "../components/Header";
import { ListItem } from "../components/ListItem";

const title = "Component Import Test";
const items = ["Apple", "Banana", "Cherry", "Date"];

function render() {
  return (
    <Print>
      <Page>
        <Section>
          <Header text={title} />

          <View padding={16}>
            <Label fontSize={16} fontWeight="bold" marginBottom={8}>
              Fruit List:
            </Label>

            {items.map((item, i) => (
              <ListItem label={item} index={i} />
            ))}
          </View>
        </Section>
      </Page>
    </Print>
  );
}
```

#### Component Best Practices

- **Type Safety**: Use TypeScript interfaces for props to catch errors early
- **Default Props**: Provide sensible defaults for optional properties
- **Composability**: Build complex layouts by combining simple components
- **Reusability**: Extract repeated patterns into components
- **Organization**: Keep components in a `components/` directory

### Photo Album Components

The `components/PhotoLayouts.tsx` file provides pre-built Higher-Order Components for creating photo album layouts:

#### Full Page Layouts

```tsx
import { FullPagePhoto, FullPagePhotoWithCaption } from "./components/PhotoLayouts";

// Edge-to-edge photo
<FullPagePhoto src="./photo.jpg" />

// Full page with caption overlay
<FullPagePhotoWithCaption
  src="./photo.jpg"
  caption="Summer sunset at the beach"
/>
```

#### Multi-Photo Grids

```tsx
import { FourPhotoGrid, TwoPhotoHorizontal, TwoPhotoVertical } from "./components/PhotoLayouts";

// 2x2 grid with background color
<FourPhotoGrid
  src1="./photo1.jpg"
  src2="./photo2.jpg"
  src3="./photo3.jpg"
  src4="./photo4.jpg"
  backgroundColor="#e8f4f8"
  gap="15px"
  padding="30px"
/>

// Two photos side by side
<TwoPhotoHorizontal
  src1="./left.jpg"
  src2="./right.jpg"
  backgroundColor="#ffffff"
/>

// Two photos stacked vertically
<TwoPhotoVertical
  src1="./top.jpg"
  src2="./bottom.jpg"
/>
```

#### Photo with Caption

```tsx
import { PhotoCaptionBelow, PhotoCaptionOverlay, PhotoCaptionRight, PhotoCaptionLeft } from "./components/PhotoLayouts";

// Caption below the image
<PhotoCaptionBelow
  src="./photo.jpg"
  caption="A memorable moment from our trip."
/>

// Caption overlaid on the image
<PhotoCaptionOverlay
  src="./photo.jpg"
  caption="Summer 2024"
  overlayColor="rgba(0,0,0,0.6)"
/>

// Photo left, caption right
<PhotoCaptionRight
  src="./photo.jpg"
  title="Beach Day"
  caption="We finally made it to the coast..."
  accentColor="#2980b9"
/>

// Caption left, photo right
<PhotoCaptionLeft
  src="./photo.jpg"
  title="Golden Hour"
  caption="There's something magical about sunset..."
  accentColor="#e67e22"
/>
```

#### Three Photo Feature

```tsx
import { ThreePhotoFeatureLeft, ThreePhotoFeatureRight } from "./components/PhotoLayouts";

// Large photo on left, two small on right
<ThreePhotoFeatureLeft
  src1="./main.jpg"
  src2="./small1.jpg"
  src3="./small2.jpg"
  backgroundColor="#fafafa"
/>

// Two small on left, large on right
<ThreePhotoFeatureRight
  src1="./main.jpg"
  src2="./small1.jpg"
  src3="./small2.jpg"
/>
```

#### Title Pages

```tsx
import { TitlePage, TitlePageWithPhoto } from "./components/PhotoLayouts";

// Solid color title page
<TitlePage
  title="Summer Memories"
  subtitle="2024"
  backgroundColor="#34495e"
/>

// Photo background title page
<TitlePageWithPhoto
  title="Our Adventures"
  subtitle="A Year in Photos"
  backgroundSrc="./cover.jpg"
  overlayColor="rgba(0,0,0,0.5)"
/>
```

#### Generate PDF from Components

```bash
# Compile the component-based EVG tool
npm run evgcomp:compile

# Generate PDF from TSX file with components
node bin/evg_component_tool.js examples/test_imports.tsx output/pdfs/imports.pdf "--assets=./assets/fonts;./components"
```

The component system enables building sophisticated, maintainable PDF documents using familiar React patterns while maintaining full type safety through TypeScript.

### Supported Elements

| Element     | Description                                      |
| ----------- | ------------------------------------------------ |
| `<Print>`   | Root element for multi-page documents            |
| `<Section>` | Page settings container (dimensions, margins)    |
| `<Page>`    | Individual page boundary                         |
| `<View>`    | Container with flexbox layout                    |
| `<Label>`   | Text element with font styling                   |
| `<Image>`   | JPEG image with automatic resize and orientation |
| `<Path>`    | SVG path element with fill color                 |
| `<Rect>`    | Rectangle with optional border radius            |

### Multi-Page Documents

For documents with multiple pages, use the `Print`, `Section`, and `Page` elements:

```tsx
import { Print, Section, Page, View, Label } from "./evg_types";

const MultiPageDocument = (
  <Print
    title="My Document"
    author="Author Name"
    imageQuality="85"
    maxImageSize="1200"
  >
    <Section pageWidth="595" pageHeight="842" margin="40px">
      <Page>
        <View width="100%" height="100%" backgroundColor="#f0f0f0">
          <Label fontSize="24px" fontWeight="bold">
            Page 1
          </Label>
          <Label fontSize="14px" marginTop="20px">
            First page content...
          </Label>
        </View>
      </Page>

      <Page>
        <View width="100%" height="100%">
          <Label fontSize="24px" fontWeight="bold">
            Page 2
          </Label>
          <Label fontSize="14px" marginTop="20px">
            Second page content...
          </Label>
        </View>
      </Page>
    </Section>
  </Print>
);
```

#### Print Element Attributes

| Attribute      | Example    | Description                                       |
| -------------- | ---------- | ------------------------------------------------- |
| `title`        | `"My Doc"` | PDF document title (metadata)                     |
| `author`       | `"Name"`   | PDF document author (metadata)                    |
| `imageQuality` | `"85"`     | JPEG quality 1-100 (default: 75, higher = better) |
| `maxImageSize` | `"1200"`   | Max image dimension in pixels (default: 800)      |

**Image Quality Guidelines:**

| Quality | Use Case                        | File Size |
| ------- | ------------------------------- | --------- |
| `50-60` | Web/screen viewing, drafts      | Smallest  |
| `70-80` | Standard print, good balance    | Medium    |
| `85-95` | High-quality print, photo books | Larger    |
| `100`   | Maximum quality (rarely needed) | Largest   |

#### Section Attributes

| Attribute    | Example  | Description                      |
| ------------ | -------- | -------------------------------- |
| `pageWidth`  | `"595"`  | Page width in points (A4 = 595)  |
| `pageHeight` | `"842"`  | Page height in points (A4 = 842) |
| `margin`     | `"40px"` | Page margin (all sides)          |

Standard page sizes:

- **A4**: 595 × 842 points
- **Letter**: 612 × 792 points
- **Legal**: 612 × 1008 points

### Supported Styles

| Style                       | Example                   | Description                       |
| --------------------------- | ------------------------- | --------------------------------- |
| `width` / `height`          | `100%`, `200px`           | Dimensions (percentage or pixels) |
| `padding`                   | `20px`                    | Internal spacing                  |
| `margin` / `marginTop` etc. | `10px`                    | External spacing                  |
| `flexDirection`             | `row`, `column`           | Layout direction                  |
| `flex`                      | `1`                       | Flex grow factor                  |
| `fontSize`                  | `14px`                    | Font size in pixels               |
| `fontWeight`                | `bold`, `normal`          | Font weight                       |
| `fontFamily`                | `Open Sans`               | Font family name                  |
| `color`                     | `#333333`                 | Text color (hex)                  |
| `backgroundColor`           | `#f5f5f5`                 | Background color                  |
| `lineHeight`                | `1.6`                     | Line height multiplier            |
| `textAlign`                 | `left`, `center`, `right` | Text alignment                    |
| `borderRadius`              | `5px`                     | Rounded corners                   |
| `clipPath`                  | `circle`, `ellipse`       | Clip content to shape             |
| `opacity`                   | `0.5`                     | Element transparency              |

### SVG Path and Graphics

The `<Path>` element allows drawing custom vector graphics with SVG path syntax:

```tsx
// Star icon
<Path
  d="M10,2 L12,8 L18,8 L13,12 L15,18 L10,14 L5,18 L7,12 L2,8 L8,8 Z"
  width="20px"
  height="20px"
  fill="#f1c40f"
/>

// Heart icon
<Path
  d="M10,18 C10,18 2,12 2,7 C2,4 4,2 7,2 C9,2 10,4 10,4 C10,4 11,2 13,2 C16,2 18,4 18,7 C18,12 10,18 10,18 Z"
  width="20px"
  height="20px"
  fill="#e74c3c"
/>
```

**Path Properties:**

| Property | Description                                    |
| -------- | ---------------------------------------------- |
| `d`      | SVG path data (M, L, C, Q, Z commands)         |
| `width`  | Required: explicit width (viewBox not enough)  |
| `height` | Required: explicit height (viewBox not enough) |
| `fill`   | Fill color (hex or named color)                |
| `stroke` | Stroke color                                   |

### Clip Paths

Clip content to shapes using `clipPath`:

```tsx
// Circular avatar
<View width="100px" height="100px" clipPath="circle">
  <Image src="./avatar.jpg" width="100%" height="100%" />
</View>

// Ellipse clip
<View width="200px" height="100px" clipPath="ellipse">
  <Image src="./banner.jpg" width="100%" height="100%" />
</View>
```

### Font Support

Fonts are loaded from `./gallery/pdf_writer/fonts/`. The following are included:

- **Open Sans** (Regular, Bold) - Default sans-serif
- **Helvetica** (Regular)
- **Cinzel** (Regular, Bold) - Elegant serif
- **Josefin Sans** (Regular, Bold) - Modern geometric
- **Great Vibes** (Regular) - Script/cursive
- **Noto Sans** (Regular, Bold) - Unicode coverage

TrueType fonts are embedded in the PDF with proper glyph metrics for accurate text measurement and layout.

### Image Processing

Images are automatically processed:

1. **EXIF Orientation** - Rotates/flips based on camera orientation tag
2. **Resize** - Scales large images to max dimension (default: 800px, configurable via `maxImageSize`)
3. **Quality** - Re-encodes at configurable JPEG quality (default: 75, set via `imageQuality`)

Configure image settings on the `<Print>` element:

```tsx
<Print
  title="Photo Book"
  imageQuality="90"     // Higher quality for print (1-100)
  maxImageSize="1200"   // Larger images for better detail
>
```

This reduces PDF file size significantly (e.g., 8MB photo → 500KB in PDF at default settings, or ~1.5MB at quality 90 / size 1200).

---

## Legacy PDF Writer

Simple PDF generation without layout engine.

```bash
npm run pdf
```

## JPEG Tools

### JPEG Metadata Parser

```bash
npm run jpegmeta
```

### JPEG Decoder

```bash
npm run jpegdec
```

Decodes `Canon_40D.jpg` and outputs `decoded_output.ppm`.

---

## File Reference

### EVG PDF Pipeline

| File                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `evg_pdf_tool.rgr`   | CLI tool for TSX → PDF conversion              |
| `EVGPDFRenderer.rgr` | PDF rendering engine with font/image embedding |
| `EVGLayout.rgr`      | Flexbox layout algorithm                       |
| `EVGElement.rgr`     | Element tree and style model                   |
| `JSXToEVG.rgr`       | TSX parser to EVG element tree                 |
| `FontManager.rgr`    | TrueType font loading and management           |
| `TrueTypeParser.rgr` | TTF file parser (cmap, glyf, hmtx tables)      |

### JPEG Processing

| File                 | Description                            |
| -------------------- | -------------------------------------- |
| `JPEGDecoder.rgr`    | Full baseline DCT decoder              |
| `JPEGEncoder.rgr`    | Baseline JPEG encoder                  |
| `JPEGReader.rgr`     | Quick JPEG dimension/metadata reader   |
| `JPEGMetadata.rgr`   | EXIF/JFIF/GPS metadata parser          |
| `ImageBuffer.rgr`    | RGB buffer with resize and orientation |
| `BitReader.rgr`      | Bit-level stream reader                |
| `HuffmanDecoder.rgr` | Huffman table building and decoding    |
| `DCT.rgr`            | 8×8 IDCT and DCT transforms            |

### Utilities

| File           | Description                       |
| -------------- | --------------------------------- |
| `Buffer.rgr`   | GrowableBuffer with linked chunks |
| `PPMImage.rgr` | PPM image file writer             |

---

## Examples

### Generate PDF with Image

```tsx
// test_image.tsx
import { View, Label, Image } from "./evg_types";

const ImageDocument = (
  <View width="100%" height="100%" padding="30px">
    <Label fontSize="28px" fontWeight="bold">
      Image on the left
    </Label>

    <View flexDirection="row" marginTop="30px">
      <Image src="./bin/IMG_6573.jpg" width="250px" height="200px" />
      <View flex="1" marginLeft="20px">
        <Label fontSize="18px" fontWeight="bold">
          Text on the right
        </Label>
        <Label fontSize="14px" marginTop="10px" lineHeight="1.6">
          The image is automatically resized and oriented correctly.
        </Label>
      </View>
    </View>
  </View>
);

export default ImageDocument;
```

### Multiple Fonts

```tsx
// test_fonts.tsx
import { View, Label } from "./evg_types";

const FontShowcase = (
  <View width="100%" padding="40px">
    <Label fontFamily="Cinzel" fontSize="32px" fontWeight="bold">
      Elegant Cinzel Heading
    </Label>
    <Label fontFamily="Open Sans" fontSize="16px" marginTop="20px">
      Open Sans body text for readability.
    </Label>
    <Label fontFamily="Great Vibes" fontSize="28px" marginTop="20px">
      Beautiful Script Font
    </Label>
  </View>
);

export default FontShowcase;
```

### JPEG Decoder (Programmatic)

```ranger
Import "JPEGDecoder.rgr"
Import "PPMImage.rgr"

class Main {
    sfn m@(main):void () {
        def decoder (new JPEGDecoder())
        def img:ImageBuffer (decoder.decode("./photos" "photo.jpg"))

        ; Apply EXIF orientation
        img = (img.applyExifOrientation(decoder.metaInfo.orientation))

        ; Resize
        img = (img.scaleToSize(800 600))

        ; Save as PPM
        def ppm (new PPMImage())
        ppm.save(img "./output" "resized.ppm")
    }
}
```

---

## Technical Notes

### TrueType Font Embedding

Fonts are embedded as PDF font subsets with:

- **cmap table** - Character to glyph mapping (format 4)
- **glyf table** - Glyph outlines for rendering
- **hmtx table** - Horizontal metrics for text layout
- **Widths array** - Per-character widths for PDF text positioning

### JPEG Processing Pipeline

1. **Decode** - Parse markers, Huffman decode, IDCT, YCbCr→RGB
2. **Orient** - Apply EXIF orientation (rotation/flip)
3. **Resize** - Bilinear interpolation to target size
4. **Encode** - DCT, quantization, Huffman encode at specified quality

### PDF Image Embedding

Uses `/Filter /DCTDecode` to embed JPEG data natively without transcoding.

### Flexbox Layout

The layout engine implements a subset of CSS flexbox:

- Main axis distribution (row/column)
- Cross axis alignment
- Flex grow for remaining space
- Percentage and pixel dimensions
- Margin and padding

### JPEG Decoder Architecture

Supports baseline DCT JPEG (SOF0):

1. **Marker Parsing** - JPEG structure (SOI, DQT, DHT, SOF0, SOS, EOI)
2. **Huffman Decoding** - Entropy-coded scan data
3. **Dequantization** - Apply quantization tables
4. **IDCT** - 8×8 Inverse Discrete Cosine Transform
5. **YCbCr→RGB** - Color space conversion

**Supported:**

- Baseline DCT (SOF0)
- YCbCr and grayscale
- Chroma subsampling (4:4:4, 4:2:2, 4:2:0)
- EXIF orientation

**Not supported:**

- Progressive JPEG
- Arithmetic coding

---

## TypeScript Expression Evaluator

The component system includes a TypeScript expression evaluator that executes TypeScript/JavaScript expressions at compile-time to enable dynamic PDF content generation.

### Supported Operations

**Literals:**

- Numbers: `42`, `3.14`
- Strings: `"hello"`, `'world'`
- Booleans: `true`, `false`
- Null: `null`
- Arrays: `[1, 2, 3]`, `["a", "b", "c"]`
- Objects: `{ name: "John", age: 30 }`

**Operators:**

| Type           | Operators                               | Description                 |
| -------------- | --------------------------------------- | --------------------------- | ----- | -------------------------------------------------- |
| **Arithmetic** | `+` `-` `*` `/` `%`                     | Basic math operations       |
| **Comparison** | `<` `>` `<=` `>=` `==` `===` `!=` `!==` | Comparison operators        |
| **Logical**    | `&&` `                                  |                             | ` `!` | Logical AND, OR, NOT with short-circuit evaluation |
| **Unary**      | `+` `-` `!`                             | Unary plus, minus, negation |

**Expressions:**

- **Variables**: Variable lookup from scope (`title`, `items`)
- **Member access**: Object/array property access (`obj.prop`, `arr[0]`)
- **Ternary operator**: Conditional expressions (`condition ? true : false`)
- **Array methods**: `array.map((item, index) => ...)` for iteration
- **Conditional rendering**: `condition && <Element />` for conditional elements

**Control Flow:**

- Variable declarations with `const`, `let`, `var`
- Function parameters with destructuring: `{ text, color = "#000" }`
- Default parameter values
- Array iteration with `.map()`

### Parser Limitations

The TSX parser has some limitations compared to full TypeScript/React:

| Pattern                       | Status            | Workaround                              |
| ----------------------------- | ----------------- | --------------------------------------- |
| `{condition && <Element />}`  | ⚠️ Limited        | May not work reliably in all contexts   |
| `{condition ? <A /> : <B />}` | ⚠️ Limited        | Create separate components instead      |
| `{array.map(...)}`            | ✅ Works          | Use in main render function             |
| `{obj.prop}`                  | ✅ Works          | Direct property access                  |
| `{arr[0].prop}`               | ❌ Not supported  | Use individual props (src1, src2, etc.) |
| `/* JSDoc */` comments        | ⚠️ Parse warnings | Use `//` comments instead               |

**Array Props Workaround:**

Instead of passing arrays of objects:

```tsx
// ❌ NOT WORKING - array index access
<MyComponent photos={[{ src: "a.jpg" }, { src: "b.jpg" }]} />;
function MyComponent({ photos }) {
  return <Image src={photos[0].src} />;
}
```

Use individual props:

```tsx
// ✅ WORKING - individual props
<MyComponent src1="a.jpg" src2="b.jpg" />;
function MyComponent({ src1, src2 }) {
  return (
    <View>
      <Image src={src1} />
      <Image src={src2} />
    </View>
  );
}
```

### Example Usage

```tsx
import { View, Label } from "./evg_types";

const title = "Shopping List";
const items = ["Milk", "Eggs", "Bread"];
const showHeader = true;
const count = items.length;

function render() {
  return (
    <View padding={20}>
      {showHeader && <Label fontSize={24}>{title}</Label>}

      <Label fontSize={14} marginTop={10}>
        Total items: {count}
      </Label>

      {items.map((item, i) => (
        <View padding={8} backgroundColor={i % 2 === 0 ? "#f0f0f0" : "#ffffff"}>
          <Label>
            {i + 1}. {item}
          </Label>
        </View>
      ))}
    </View>
  );
}
```

All expressions are evaluated during PDF compilation, allowing for dynamic content generation while maintaining the performance benefits of static compilation. The evaluator supports variable scoping, function parameters, and complex expressions, making it possible to create sophisticated, data-driven PDF documents.

---

## Multi-Language Compilation

The EVG Component Tool can be compiled from the same Ranger source code to multiple target languages. This demonstrates Ranger's cross-language compilation capabilities.

### Building Different Versions

```bash
# JavaScript (Node.js)
npm run evgcomp:compile

# C++ (requires g++ with C++17)
npm run evgcomp:build:cpp

# Go
npm run evgcomp:build:go

# Rust (experimental)
npm run evgcomp:build:rust
```

### Performance Benchmarks

Benchmarks run on test_gallery.tsx (multi-page photo album with JPEG processing):

| Language       | Avg Time | Speedup         | PDF Size |
| -------------- | -------- | --------------- | -------- |
| **JavaScript** | 3.78s    | 1.0x (baseline) | 1,323 KB |
| **C++**        | 2.65s    | **1.4x faster** | 739 KB   |
| **Go**         | 2.02s    | **1.9x faster** | 739 KB   |

Key observations:

- **Go is fastest** due to efficient goroutine scheduling and native compilation
- **C++ is competitive** with -O3 optimization
- **All versions produce identical output** (same PDF rendering)
- Compiled versions produce smaller PDFs due to JPEG encoder differences

### Running Compiled Versions

```bash
# JavaScript
node bin/evg_component_tool.js input.tsx output.pdf "--assets=./assets/fonts;./components"

# C++ (Windows)
.\bin\evg_component_tool_cpp.exe input.tsx output.pdf "--assets=./assets/fonts;./components"

# Go (Windows)
.\bin\evg_component_tool.exe input.tsx output.pdf "--assets=./assets/fonts;./components"
```

---

## Technical Details

### Static Analysis for C++/Rust

The Ranger compiler includes a **static analysis pass** that detects mutation patterns to generate proper C++ references and Rust borrows. This ensures correct behavior when compiling to languages with value semantics.

#### The Problem

In Ranger, arrays and buffers are passed by reference semantically. JavaScript and Go handle this naturally, but C++ passes `std::vector` by value by default:

```cpp
// Generated without analysis - WRONG
void buildCodes(std::vector<int> codes) {
    codes[0] = value;  // Lost when function returns!
}

// Generated with analysis - CORRECT
void buildCodes(std::vector<int>& codes) {
    codes[0] = value;  // Properly modifies caller's vector
}
```

#### How It Works

The static analyzer (`ng_StaticAnalysis.rgr`) scans function bodies for:

1. **Mutating operators**: `set`, `push`, `int_buffer_set`, `buffer_set`, etc.
2. **Function parameters**: Distinguishes parameters from local variables
3. **Type detection**: Identifies arrays (`[T]`), hashes (`[K:V]`), and buffer types

When a function parameter is both:

- A collection type (array, hash, buffer)
- Mutated inside the function body

The analyzer marks it with `needs_cpp_reference = true`, and the C++ code generator adds `&` to make it a reference parameter.

#### Affected Types

| Ranger Type  | C++ Without Analysis      | C++ With Analysis       |
| ------------ | ------------------------- | ----------------------- |
| `[int]`      | `std::vector<int>`        | `std::vector<int>&`     |
| `[string:T]` | `std::map<std::string,T>` | `std::map<...>&`        |
| `int_buffer` | `std::vector<int64_t>`    | `std::vector<int64_t>&` |
| `buffer`     | `std::vector<uint8_t>`    | `std::vector<uint8_t>&` |

This analysis is critical for the JPEG encoder/decoder which heavily uses buffer parameters for DCT transforms and Huffman table building.
