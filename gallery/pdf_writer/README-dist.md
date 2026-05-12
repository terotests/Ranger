# ranger-pdf-tool

A zero-dependency PDF, HTML, and PNG generation toolkit with TSX layout support. Perfect for server-side document generation, Electron apps, or any Node.js environment.

## Installation

```bash
npm install ranger-pdf-tool
```

## Features

- **PDF Generation** - Create PDFs with TrueType fonts, JPEG images, and flexbox layout
- **HTML Preview** - Generate HTML with CSS flexbox for browser preview
- **PNG/JPEG Export** - Rasterize documents to images
- **TSX Layout** - Use React-like TSX syntax for document structure
- **Component System** - Reusable TSX components with imports
- **Zero Dependencies** - No native modules, runs anywhere Node.js runs

## Quick Start

### Programmatic API

```javascript
const { PDFBuilder, HTMLBuilder, RasterBuilder, ComponentBuilder } = require('ranger-pdf-tool');

// Create a PDF from TSX
const pdfBuilder = new PDFBuilder();
pdfBuilder.setA4Portrait();
pdfBuilder.setFontsDirectory('./assets/fonts');
pdfBuilder.loadFont('Helvetica/Helvetica.ttf');

const tsx = `
<Document>
  <Page style={{ padding: 40 }}>
    <Text style={{ fontSize: 24, fontFamily: 'Helvetica' }}>
      Hello, World!
    </Text>
  </Page>
</Document>
`;

const pdfBuffer = pdfBuilder.renderTSX(tsx);
require('fs').writeFileSync('output.pdf', pdfBuffer);
```

### Using Components

```javascript
const { ComponentBuilder } = require('ranger-pdf-tool');

const builder = new ComponentBuilder();
builder.setPageSize(595, 842);  // A4
builder.setFontsDirectory('./assets/fonts');
builder.setBaseDir('./');
builder.addComponentPath('./components');

// Parse TSX file with component resolution
const root = builder.parseFile('./examples', 'my_document.tsx');

// Render to PDF
const pdfBuffer = builder.renderToPDF(root);

// Or render to HTML for preview
const html = builder.renderToHTML(root);
```

## API Reference

### PDFBuilder

High-level API for creating PDFs from TSX.

```javascript
const builder = new PDFBuilder();

// Page size presets
builder.setA4Portrait();      // 595x842 points
builder.setA4Landscape();     // 842x595 points
builder.setLetterPortrait();  // 612x792 points
builder.setLetterLandscape(); // 792x612 points
builder.setPageSize(width, height);  // Custom size in points

// Font setup
builder.setFontsDirectory('./fonts');
builder.loadFont('FontName/FontName.ttf');

// Rendering
builder.setBaseDir('./');  // For resolving image paths
builder.setDebug(true);    // Enable debug output

const pdfBuffer = builder.renderTSX(tsxString);
const pdfBuffer = builder.renderTSXFile(dirPath, fileName);
const pdfBuffer = builder.renderElement(evgElement);
```

### HTMLBuilder

Generate HTML output for browser preview.

```javascript
const builder = new HTMLBuilder();

builder.setPageSize(595, 842);
builder.setFontsDirectory('./fonts');
builder.loadFont('FontName/FontName.ttf');
builder.setBaseDir('./');

const html = builder.renderTSX(tsxString);
const html = builder.renderElement(evgElement);
```

### RasterBuilder

Render documents to PNG or JPEG images.

```javascript
const builder = new RasterBuilder();

builder.setPageSize(595, 842);
builder.setFontsDirectory('./fonts');
builder.loadFont('FontName/FontName.ttf');
builder.setBaseDir('./');
builder.setScale(2.0);    // 2x resolution (144 DPI)
builder.setQuality(85);   // JPEG quality (1-100)

const pngBuffer = builder.renderTSXToPNG(tsxString);
const pngBuffer = builder.renderElementToPNG(evgElement);
const jpegBuffer = builder.renderElementToJPEG(evgElement);
```

### ComponentBuilder

Full-featured TSX parsing with component imports.

```javascript
const builder = new ComponentBuilder();

builder.setPageSize(595, 842);
builder.setFontsDirectory('./fonts');
builder.loadFont('FontName/FontName.ttf');
builder.setBaseDir('./');
builder.addComponentPath('./components');

// Parse TSX with component resolution
const root = builder.parseFile('./examples', 'document.tsx');
const root = builder.parse(tsxString);

// Render to different formats
const pdfBuffer = builder.renderToPDF(root);
const html = builder.renderToHTML(root);
```

### Factory Methods

```javascript
const { RangerPDFTool } = require('ranger-pdf-tool');

const pdfBuilder = RangerPDFTool.createPDFBuilder();
const htmlBuilder = RangerPDFTool.createHTMLBuilder();
const rasterBuilder = RangerPDFTool.createRasterBuilder();
const componentBuilder = RangerPDFTool.createComponentBuilder();
const fontManager = RangerPDFTool.createFontManager();
const evgElement = RangerPDFTool.createEVGElement();
const evgLayout = RangerPDFTool.createEVGLayout();
```

## TSX Document Structure

Documents use a React-like TSX syntax:

```tsx
<Document>
  <Page style={{ 
    padding: 40,
    backgroundColor: '#ffffff'
  }}>
    <View style={{ 
      flexDirection: 'row',
      gap: 20
    }}>
      <Text style={{ 
        fontSize: 18,
        fontFamily: 'Helvetica',
        color: '#333333'
      }}>
        Column 1
      </Text>
      <Text style={{ fontSize: 18 }}>
        Column 2
      </Text>
    </View>
    
    <Image 
      src="./images/photo.jpg"
      style={{ 
        width: 200,
        height: 150,
        objectFit: 'cover'
      }}
    />
  </Page>
</Document>
```

### Supported Elements

| Element | Description |
|---------|-------------|
| `<Document>` | Root container |
| `<Page>` | Page container with page break |
| `<View>` | Flexbox container |
| `<Text>` | Text content |
| `<Image>` | JPEG/PNG images |
| `<Layer>` | Absolute positioning overlay |

### Supported Style Properties

| Property | Values |
|----------|--------|
| `width`, `height` | Number (points) or string ('100%') |
| `padding`, `margin` | Number or object `{ top, right, bottom, left }` |
| `flexDirection` | 'row', 'column' |
| `justifyContent` | 'flex-start', 'center', 'flex-end', 'space-between' |
| `alignItems` | 'flex-start', 'center', 'flex-end', 'stretch' |
| `gap` | Number |
| `backgroundColor` | Hex color string |
| `color` | Hex color string |
| `fontSize` | Number |
| `fontFamily` | Font name string |
| `textAlign` | 'left', 'center', 'right' |
| `objectFit` | 'cover', 'contain', 'fill' |
| `borderRadius` | Number |
| `boxShadow` | CSS box-shadow string |

## Electron Integration

Use `ranger-pdf-tool` in an Electron app for desktop document generation:

```javascript
// main.js
const { PDFBuilder } = require('ranger-pdf-tool');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

ipcMain.handle('generate-pdf', async (event, tsxContent) => {
  const builder = new PDFBuilder();
  builder.setA4Portrait();
  builder.setFontsDirectory(path.join(__dirname, 'assets/fonts'));
  builder.loadFont('Helvetica/Helvetica.ttf');
  builder.setBaseDir(__dirname);
  
  const pdfBuffer = builder.renderTSX(tsxContent);
  
  const outputPath = path.join(app.getPath('documents'), 'output.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  
  return outputPath;
});
```

```javascript
// renderer.js
const { ipcRenderer } = require('electron');

async function generatePDF() {
  const tsx = document.getElementById('editor').value;
  const outputPath = await ipcRenderer.invoke('generate-pdf', tsx);
  console.log('PDF saved to:', outputPath);
}
```

## CLI Tools

The package also includes command-line tools:

```bash
# Generate PDF from TSX
evg-pdf input.tsx -o output.pdf --fonts ./assets/fonts

# Generate HTML preview
evg-html input.tsx -o output.html

# Generate PNG image
evg-png input.tsx -o output.png --scale 2

# Process TSX with components
evg-component input.tsx -o output.pdf --components ./components
```

## License

ISC
