# ranger-pdf-tool

PDF, HTML, and PNG generation toolkit with EVG layout engine, TSX/JSX parser, and TrueType font support.

Built with [Ranger](https://github.com/nicebyte/ranger) - a cross-language compiler.

## Features

- 📄 **PDF Generation** - Create PDFs from TSX/JSX templates
- 🌐 **HTML Rendering** - Render documents as HTML with CSS
- 🖼️ **PNG Export** - Rasterize documents to PNG images
- 📐 **EVG Layout Engine** - Flexbox-like layout system
- 🔤 **TrueType Font Support** - Full font rendering with kerning
- 🖼️ **Image Processing** - JPEG/PNG decode/encode
- 🔄 **Live Preview** - Hot-reloading preview server

## Installation

```bash
npm install ranger-pdf-tool
```

## CLI Usage

### Generate PDF from TSX

```bash
evg-pdf input.tsx output.pdf
```

### Generate HTML from TSX

```bash
evg-html input.tsx output.html
```

### Generate PNG from TSX

```bash
evg-png input.tsx output.png
```

### Start Preview Server

```bash
evg-preview input.tsx 3000
```

## Programmatic API

### Basic PDF Generation

```javascript
const { PDFToolAPI } = require('ranger-pdf-tool');

const api = new PDFToolAPI();

// Convert TSX file to PDF
api.convertTSXToPDF('./document.tsx', './output.pdf');

// Convert TSX file to HTML
api.convertTSXToHTML('./document.tsx', './output.html');
```

### In-Memory PDF Generation

```javascript
const { PDFToolAPI } = require('ranger-pdf-tool');

const api = new PDFToolAPI();

// Create PDF from TSX string (returns Buffer)
const tsxContent = `
<Print format="A4">
  <Page>
    <Text style={{ fontSize: 24 }}>Hello, PDF!</Text>
  </Page>
</Print>
`;

const pdfBuffer = api.createPDFFromTSXString(tsxContent);

// Use the buffer directly (no disk I/O)
res.type('application/pdf').send(pdfBuffer);
```

### PDFBuilder API (Fluent Interface)

```javascript
const { PDFBuilder } = require('ranger-pdf-tool');

const pdf = new PDFBuilder()
  .setPageSize(595, 842) // A4 in points
  .setFontDirectory('./fonts/')
  .addPage()
  .addText('Welcome to PDF Generation', { fontSize: 24, fontWeight: 'bold' })
  .addText('This is a paragraph of text.', { fontSize: 12 })
  .addImage('./images/logo.png', { width: 200 })
  .addPage()
  .addText('Page 2 content')
  .build();

// Get PDF as buffer
const buffer = pdf.toBuffer();

// Or save to file
pdf.saveToFile('./output.pdf');
```

### Express.js Integration

```javascript
const express = require('express');
const { createPreviewServer, createPreviewMiddleware } = require('ranger-pdf-tool/express');

const app = express();

// Option 1: Mount preview as middleware
app.use('/preview', createPreviewMiddleware('./document.tsx', {
  assets: './assets',
  pageWidth: 595,
  pageHeight: 842
}));

// Option 2: Standalone preview server
const server = createPreviewServer('./document.tsx', { port: 3000 });
server.start();
```

### Low-Level Components

```javascript
const {
  ComponentEngine,
  EVGPDFRenderer,
  EVGHTMLRenderer,
  EVGLayout,
  FontManager,
  TrueTypeFont,
  JPEGDecoder,
  PNGEncoder
} = require('ranger-pdf-tool');

// Parse TSX file
const engine = new ComponentEngine();
engine.pageWidth = 595;
engine.pageHeight = 842;
const root = engine.parseFile('./examples/', 'document.tsx');

// Render to PDF
const pdfRenderer = new EVGPDFRenderer();
pdfRenderer.setPageSize(595, 842);
const pdfBytes = pdfRenderer.render(root);

// Render to HTML
const htmlRenderer = new EVGHTMLRenderer();
htmlRenderer.setPageSize(595, 842);
const html = htmlRenderer.render(root);

// Work with fonts
const font = new TrueTypeFont();
font.loadFromFile('./fonts/Helvetica.ttf');
const width = font.getStringWidth('Hello', 12);

// Decode JPEG
const jpeg = new JPEGDecoder();
const imageData = jpeg.decodeFile('./image.jpg');

// Encode PNG
const png = new PNGEncoder();
const pngBuffer = png.encode(imageData, width, height);
```

## TSX Document Format

```tsx
<Print format="A4" margin={40}>
  <Page>
    {/* Text with styling */}
    <Text style={{ 
      fontSize: 24, 
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#333333'
    }}>
      Document Title
    </Text>
    
    {/* Flexbox-like layout */}
    <View style={{ 
      display: 'flex', 
      flexDirection: 'row',
      gap: 10 
    }}>
      <View style={{ flex: 1 }}>Left column</View>
      <View style={{ flex: 1 }}>Right column</View>
    </View>
    
    {/* Images */}
    <Image src="./photo.jpg" style={{ width: 200 }} />
  </Page>
</Print>
```

## Page Formats

Supported page formats:
- `A4` - 210mm × 297mm (595 × 842 pt)
- `A5` - 148mm × 210mm (420 × 595 pt)
- `Letter` - 8.5" × 11" (612 × 792 pt)
- `Legal` - 8.5" × 14" (612 × 1008 pt)
- Custom: `{ width: 500, height: 700 }`

## Requirements

- Node.js >= 18.0.0
- Express (optional, for preview server)

## Fonts

This package does **not** include fonts. You need to provide your own TrueType (.ttf) fonts.

Default font search paths:
- `./assets/fonts/`
- `./fonts/`
- System fonts directory

## License

ISC

## Related Projects

- [ranger-compiler](https://www.npmjs.com/package/ranger-compiler) - Cross-language compiler
