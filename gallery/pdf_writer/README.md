# Ranger PDF Writer & JPEG Tools

A collection of binary format utilities written in Ranger:

- **EVG PDF Renderer** - TSX → PDF pipeline with flexbox layout, TrueType fonts, and JPEG images
- **JPEG Decoder** - Full baseline DCT JPEG decoder with Huffman decoding
- **JPEG Encoder** - Baseline JPEG encoder with configurable quality
- **TrueType Parser** - TTF font parsing for glyph metrics and PDF embedding

## EVG PDF Tool (TSX → PDF)

Generate PDFs from TSX files using a React-like syntax with flexbox layout.

### Quick Start

```bash
# Compile the tool
npm run evgpdf:compile

# Generate a PDF from TSX
npm run evgpdf:run

# Or run directly
node ./gallery/pdf_writer/bin/evg_pdf_tool.js input.tsx output.pdf
```

### TSX Syntax

```tsx
const MyDocument = (
  <div width="100%" height="100%" padding="30px">
    <Text fontSize="24px" fontWeight="bold" color="#2c3e50">
      Hello, PDF World!
    </Text>

    <div flexDirection="row" marginTop="20px">
      <Image src="./photo.jpg" width="200px" height="150px" />
      <div flex="1" marginLeft="20px">
        <Text fontSize="14px" lineHeight="1.6">
          This is a paragraph with automatic text wrapping.
        </Text>
      </div>
    </div>
  </div>
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
// test_imports.tsx
import { View, Label, Section, Page, Print } from "./evg_types";
import { Header } from "./components/Header";
import { ListItem } from "./components/ListItem";

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

#### Generate PDF from Components

```bash
# Compile the component-based EVG tool
npm run evgcomp:compile

# Generate PDF from TSX file with components
node ./gallery/pdf_writer/bin/evg_component_tool.js ./test_imports.tsx ./output.pdf
```

The component system enables building sophisticated, maintainable PDF documents using familiar React patterns while maintaining full type safety through TypeScript.

### Supported Elements

| Element     | Description                                      |
| ----------- | ------------------------------------------------ |
| `<Print>`   | Root element for multi-page documents            |
| `<Section>` | Page settings container (dimensions, margins)    |
| `<Page>`    | Individual page boundary                         |
| `<View>`    | Container with flexbox layout (alias: `<div>`)   |
| `<Label>`   | Text element with font styling (alias: `<Text>`) |
| `<Image>`   | JPEG image with automatic resize and orientation |

### Multi-Page Documents

For documents with multiple pages, use the `Print`, `Section`, and `Page` elements:

```tsx
import { Print, Section, Page, View, Label } from "./evg_types";

const MultiPageDocument = (
  <Print title="My Document" author="Author Name">
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
2. **Resize** - Scales large images to max 800×800 (configurable)
3. **Quality** - Re-encodes at 75% JPEG quality (configurable)

This reduces PDF file size significantly (e.g., 8MB photo → 500KB in PDF).

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
const ImageDocument = (
  <div width="100%" height="100%" padding="30px">
    <Text fontSize="28px" fontWeight="bold">
      Image on the left
    </Text>

    <div flexDirection="row" marginTop="30px">
      <Image src="./bin/IMG_6573.jpg" width="250px" height="200px" />
      <div flex="1" marginLeft="20px">
        <Text fontSize="18px" fontWeight="bold">
          Text on the right
        </Text>
        <Text fontSize="14px" marginTop="10px" lineHeight="1.6">
          The image is automatically resized and oriented correctly.
        </Text>
      </div>
    </div>
  </div>
);

export default ImageDocument;
```

### Multiple Fonts

```tsx
// test_fonts.tsx
const FontShowcase = (
  <div width="100%" padding="40px">
    <Text fontFamily="Cinzel" fontSize="32px" fontWeight="bold">
      Elegant Cinzel Heading
    </Text>
    <Text fontFamily="Open Sans" fontSize="16px" marginTop="20px">
      Open Sans body text for readability.
    </Text>
    <Text fontFamily="Great Vibes" fontSize="28px" marginTop="20px">
      Beautiful Script Font
    </Text>
  </div>
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
