# EVG + JSX + PDF Integration Plan

## Current Status (December 2024)

### ✅ PHASE 1 COMPLETE - Basic Pipeline Working

The TSX → EVG → PDF pipeline is now functional with the following features:

**Working Features:**

- ✅ TSX parsing with JSX support (View, span elements)
- ✅ Inline style attributes (React-style camelCase converted to CSS kebab-case)
- ✅ Box model: padding, margin, border
- ✅ Flex layout with `flexDirection="row"`
- ✅ Text word wrapping with proper height calculation
- ✅ Background colors
- ✅ Font styling: fontSize, fontWeight, color
- ✅ Nested element hierarchy

**Sample Output:**

- `test_simple.tsx` - Picture book layout with images and wrapped text
- `test_output.pdf` - Generated PDF sample (committed to repo)

**Known Issues (see gallery/ts_parser/ISSUES.md):**

- Apostrophe (`'`) in JSX text content breaks the parser
- Workaround: avoid apostrophes or use word "is" instead of contractions

---

## Overview

Integrate three components to create a TypeScript-based PDF generation pipeline:

1. **ts_parser** (gallery/ts_parser) - Parse TSX files with JSX support
2. **EVG layout engine** (gallery/evg) - Calculate element positions
3. **PDF renderer** (gallery/pdf_writer) - Output final PDF

## Workflow

```
sample.tsx → TSX Parser → JSX Nodes → EVG Elements → Layout → PDF Renderer → output.pdf
     ↓            ↓            ↓           ↓           ↓
  TypeScript   Lexer/     Raw tree    Styled     Positioned
  with types   Parser     no eval     elements   elements
```

## Key Design Decisions

### 1. No JavaScript Evaluation

- Treat JSX as pure XML/HTML structure
- Attributes are string literals only (no expressions like `{value + 1}`)
- This keeps Phase 1 simple and achievable

### 2. TypeScript Types for IDE Support

- Include EVG type definitions in the TSX file
- VSCode provides autocomplete and type checking
- Types are documentation, not runtime code

### 3. Single Page First

- Focus on getting the pipeline working
- Multi-page support in Phase 2

## Sample TSX File Structure

### sample.tsx

```tsx
// =============================================================================
// EVG Type Definitions - Provides VSCode intellisense
// =============================================================================

type Unit = string; // "100px" | "50%" | "2em" | "fill"

interface EVGStyle {
  // Dimensions
  width?: Unit;
  height?: Unit;
  minWidth?: Unit;
  maxWidth?: Unit;
  minHeight?: Unit;
  maxHeight?: Unit;

  // Box Model
  margin?: Unit;
  marginTop?: Unit;
  marginRight?: Unit;
  marginBottom?: Unit;
  marginLeft?: Unit;
  padding?: Unit;
  paddingTop?: Unit;
  paddingRight?: Unit;
  paddingBottom?: Unit;
  paddingLeft?: Unit;

  // Border
  border?: Unit;
  borderColor?: string;
  borderRadius?: Unit;

  // Layout
  display?: "block" | "flex" | "inline";
  flexDirection?: "row" | "column";
  justifyContent?: "start" | "center" | "end" | "space-between";
  alignItems?: "start" | "center" | "end" | "stretch";
  gap?: Unit;

  // Position
  position?: "relative" | "absolute";
  top?: Unit;
  left?: Unit;
  right?: Unit;
  bottom?: Unit;

  // Visual
  backgroundColor?: string;
  color?: string;
  opacity?: number;

  // Text
  fontSize?: Unit;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
}

interface EVGBaseProps {
  id?: string;
  style?: EVGStyle;
  className?: string;
}

interface EVGTextProps extends EVGBaseProps {
  children?: string;
}

interface EVGImageProps extends EVGBaseProps {
  src: string;
  alt?: string;
}

interface EVGPageProps {
  width: number;
  height: number;
  style?: EVGStyle;
}

// JSX type declarations
declare namespace JSX {
  interface IntrinsicElements {
    page: EVGPageProps;
    box: EVGBaseProps;
    text: EVGTextProps;
    image: EVGImageProps;
    row: EVGBaseProps;
    column: EVGBaseProps;
  }
}

// =============================================================================
// Document Content - This is what gets parsed and rendered
// =============================================================================

function render() {
  return (
    <page width={595} height={842}>
      <box
        style={{
          padding: "20px",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Header */}
        <box
          style={{
            marginBottom: "20px",
            borderBottom: "2px",
            borderColor: "#333",
            paddingBottom: "10px",
          }}
        >
          <text
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Document Title
          </text>
        </box>

        {/* Content */}
        <row style={{ gap: "20px" }}>
          <box style={{ width: "50%" }}>
            <text style={{ fontSize: "12px", lineHeight: 1.5 }}>
              This is the left column with some text content. The EVG layout
              engine will calculate positions.
            </text>
          </box>
          <box style={{ width: "50%" }}>
            <text style={{ fontSize: "12px", lineHeight: 1.5 }}>
              This is the right column. We can have multiple boxes arranged in a
              row.
            </text>
          </box>
        </row>

        {/* Image placeholder */}
        <box style={{ marginTop: "20px" }}>
          <image src="./logo.jpg" style={{ width: "200px", height: "100px" }} />
        </box>

        {/* Footer */}
        <box
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            right: "20px",
          }}
        >
          <text
            style={{ fontSize: "10px", textAlign: "center", color: "#666" }}
          >
            Page 1 - Generated with EVG + JSX
          </text>
        </box>
      </box>
    </page>
  );
}
```

## File Structure

```
gallery/pdf_writer/
├── PLAN_EVG_JSX.md          # This file
├── evg_types.tsx            # Standalone type definitions (importable)
├── sample.tsx               # Original example document
├── test_simple.tsx          # Picture book test (working sample)
├── test_output.pdf          # Generated PDF sample
├── JSXToEVG.rgr             # Convert JSX AST to EVG elements
├── EVGPDFRenderer.rgr       # Render EVG to PDF
├── evg_pdf_tool.rgr         # CLI tool
└── bin/
    └── evg_pdf_tool.js      # Compiled tool (ES6)
```

## Usage

```bash
# Compile the tool
npm run evgpdf:compile

# Run with a TSX file
node ./gallery/pdf_writer/bin/evg_pdf_tool.js input.tsx output.pdf

# With debug output
node ./gallery/pdf_writer/bin/evg_pdf_tool.js input.tsx output.pdf -debug
```

## Implementation Phases

### Phase 1: JSX to EVG Conversion (Week 1)

#### JSXToEVG.rgr

```ranger
Import "../ts_parser/TSLexer.rgr"
Import "../ts_parser/TSParser.rgr"
Import "../evg/EVGElement.rgr"
Import "../evg/EVGUnit.rgr"
Import "../evg/EVGBox.rgr"

class JSXNode {
    def tagName:string ""
    def attributes:[JSXAttribute]
    def children:[JSXNode]
    def textContent:string ""    ; For text nodes
    def isText:boolean false
}

class JSXAttribute {
    def name:string ""
    def value:string ""          ; Raw string value
}

class JSXToEVG {
    def parser:TSParser

    fn parseFile:JSXNode (dirPath:string fileName:string)
    fn parseJSX:JSXNode (source:string)

    ; Find the render() function and extract its JSX return
    fn findRenderFunction:JSXNode (ast:TSNode)

    ; Convert JSX tree to EVG elements
    fn convertToEVG:EVGElement (jsxNode:JSXNode)
    fn convertChildren:void (parent:EVGElement jsxNode:JSXNode)

    ; Parse style object from JSX attribute
    fn parseStyleAttribute:void (element:EVGElement styleStr:string)
    fn parseUnitValue:EVGUnit (value:string)
}
```

#### Key Conversion Logic

```ranger
fn convertToEVG:EVGElement (jsxNode:JSXNode) {
    def element (new EVGElement())

    ; Map JSX tag to EVG element type
    if (jsxNode.tagName == "page") {
        element.tagName = "page"
        ; Extract width/height from attributes
    }
    if (jsxNode.tagName == "box") {
        element.tagName = "div"
    }
    if (jsxNode.tagName == "text") {
        element.tagName = "text"
    }
    if (jsxNode.tagName == "row") {
        element.tagName = "div"
        element.style.display = "flex"
        element.style.flexDirection = "row"
    }
    if (jsxNode.tagName == "column") {
        element.tagName = "div"
        element.style.display = "flex"
        element.style.flexDirection = "column"
    }
    if (jsxNode.tagName == "image") {
        element.tagName = "image"
        ; Extract src attribute
    }

    ; Parse id attribute
    def idAttr (this.findAttribute(jsxNode "id"))
    if (idAttr != "") {
        element.id = idAttr
    }

    ; Parse style attribute
    def styleAttr (this.findAttribute(jsxNode "style"))
    if (styleAttr != "") {
        this.parseStyleAttribute(element styleAttr)
    }

    ; Convert children
    this.convertChildren(element jsxNode)

    return element
}
```

### Phase 2: Style Parsing (Week 1)

Parse JSX style objects like `{{ fontSize: "24px", color: "#333" }}`:

```ranger
fn parseStyleAttribute:void (element:EVGElement styleStr:string) {
    ; styleStr is like: { fontSize: "24px", color: "#333" }
    ; Simple key-value parsing (no expressions)

    ; Remove outer braces
    ; Split by comma
    ; For each property:
    ;   Extract name and value
    ;   Apply to element

    ; Example properties:
    if (propName == "width") {
        element.width = (EVGUnit.parse(propValue))
    }
    if (propName == "fontSize") {
        element.fontSize = (EVGUnit.parse(propValue))
    }
    if (propName == "backgroundColor") {
        element.backgroundColor = (EVGColor.parse(propValue))
    }
    ; ... etc
}
```

### Phase 3: PDF Rendering (Week 2)

#### EVGRenderer.rgr

```ranger
Import "PDFWriter.rgr"
Import "../evg/EVGLayout.rgr"
Import "../evg/EVGElement.rgr"

class EVGRenderer {
    def pdf:PDFWriter
    def layout:EVGLayout

    fn renderToPDF:void (root:EVGElement outputPath:string)
    fn renderElement:void (element:EVGElement)
    fn renderBox:void (element:EVGElement)
    fn renderText:void (element:EVGElement)
    fn renderImage:void (element:EVGElement)
}

fn renderToPDF:void (root:EVGElement outputPath:string) {
    ; Get page dimensions from root
    def pageWidth:double root.width.resolve(0)
    def pageHeight:double root.height.resolve(0)

    ; Run layout to calculate positions
    layout.layoutElement(root pageWidth pageHeight)

    ; Create PDF
    pdf = (new PDFWriter())
    pdf.init(pageWidth pageHeight)

    ; Render all elements
    this.renderElement(root)

    ; Save
    pdf.save("." outputPath)
}

fn renderElement:void (element:EVGElement) {
    ; Render based on element type
    if (element.tagName == "div") {
        this.renderBox(element)
    }
    if (element.tagName == "text") {
        this.renderText(element)
    }
    if (element.tagName == "image") {
        this.renderImage(element)
    }

    ; Render children
    def i 0
    while (i < (array_length element.children)) {
        def child:EVGElement (at element.children i)
        this.renderElement(child)
        i = i + 1
    }
}

fn renderBox:void (element:EVGElement) {
    ; Draw background if set
    if (element.backgroundColor.isSet) {
        pdf.setFillColor(
            element.backgroundColor.r
            element.backgroundColor.g
            element.backgroundColor.b
        )
        pdf.fillRect(
            element.computedX
            element.computedY
            element.computedWidth
            element.computedHeight
        )
    }

    ; Draw border if set
    if (element.borderWidth > 0) {
        pdf.setStrokeColor(
            element.borderColor.r
            element.borderColor.g
            element.borderColor.b
        )
        pdf.setLineWidth(element.borderWidth)
        pdf.strokeRect(
            element.computedX
            element.computedY
            element.computedWidth
            element.computedHeight
        )
    }
}

fn renderText:void (element:EVGElement) {
    pdf.setFont(element.fontFamily element.fontSize.resolve(16))
    pdf.setFillColor(
        element.color.r
        element.color.g
        element.color.b
    )
    pdf.drawText(
        element.textContent
        element.computedX
        element.computedY
    )
}

fn renderImage:void (element:EVGElement) {
    ; Load and embed JPEG
    pdf.embedJPEG(
        element.src
        element.computedX
        element.computedY
        element.computedWidth
        element.computedHeight
    )
}
```

### Phase 4: CLI Tool (Week 2)

#### evg_pdf_tool.rgr

```ranger
Import "JSXToEVG.rgr"
Import "EVGRenderer.rgr"

class EVGPDFTool {
    sfn m@(main):void () {
        def argc:int (shell_arg_cnt)

        if (argc < 2) {
            print "Usage: evg_pdf <input.tsx> [output.pdf]"
            print ""
            print "Renders a TSX file with JSX content to PDF"
            print ""
            print "Example:"
            print "  evg_pdf sample.tsx document.pdf"
            return
        }

        def inputFile:string (shell_arg 0)
        def outputFile:string "output.pdf"
        if (argc >= 2) {
            outputFile = (shell_arg 1)
        }

        def tool (new EVGPDFTool())
        tool.render(inputFile outputFile)
    }

    fn render:void (inputFile:string outputFile:string) {
        print ("EVG PDF Generator")
        print ("Input:  " + inputFile)
        print ("Output: " + outputFile)
        print ""

        ; Parse TSX file
        print "Parsing TSX..."
        def converter (new JSXToEVG())
        def jsxRoot:JSXNode (converter.parseFile("." inputFile))

        ; Convert to EVG
        print "Converting to EVG..."
        def evgRoot:EVGElement (converter.convertToEVG(jsxRoot))

        ; Render to PDF
        print "Rendering to PDF..."
        def renderer (new EVGRenderer())
        renderer.renderToPDF(evgRoot outputFile)

        print ""
        print "Done!"
    }
}
```

## Integration with Existing Code

### From ts_parser

- `TSLexer.rgr` - Tokenize TSX source
- `TSParser.rgr` - Parse to AST (has JSX support)
- `TSNode.rgr` - AST node types

### From evg

- `EVGElement.rgr` - Element structure
- `EVGUnit.rgr` - Unit parsing (px, %, em)
- `EVGColor.rgr` - Color parsing
- `EVGBox.rgr` - Box model
- `EVGLayout.rgr` - Layout calculation
- `EVGTextMeasurer.rgr` - Text measurement

### From pdf_writer

- `PDFWriter.rgr` - PDF generation
- `JPEGDecoder.rgr` - Image loading

## NPM Scripts

```json
{
  "evgpdf:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./gallery/pdf_writer/evg_pdf_tool.rgr -d=./gallery/pdf_writer/bin -o=evg_pdf_tool.go -nodecli",
  "evgpdf:build": "npm run evgpdf:compile && cd gallery/pdf_writer/bin && go build -o evg_pdf_tool.exe evg_pdf_tool.go",
  "evgpdf:test": "cd gallery/pdf_writer && ./bin/evg_pdf_tool.exe sample.tsx output.pdf"
}
```

## Supported JSX Elements (Phase 1)

| Element    | Description       | Key Attributes         |
| ---------- | ----------------- | ---------------------- |
| `<page>`   | Document page     | width, height          |
| `<box>`    | Generic container | style                  |
| `<text>`   | Text content      | style, children (text) |
| `<image>`  | Image embed       | src, style             |
| `<row>`    | Horizontal flex   | style (gap)            |
| `<column>` | Vertical flex     | style (gap)            |

## Supported Style Properties (Phase 1)

### Dimensions

- width, height, minWidth, maxWidth, minHeight, maxHeight

### Box Model

- margin, marginTop/Right/Bottom/Left
- padding, paddingTop/Right/Bottom/Left
- border, borderColor

### Layout

- display (block, flex)
- flexDirection (row, column)
- gap
- position (relative, absolute)
- top, left, right, bottom

### Visual

- backgroundColor
- color
- opacity

### Text

- fontSize
- fontFamily
- fontWeight
- textAlign
- lineHeight

## Not Supported (Phase 1)

- JavaScript expressions in JSX (`{variable}`, `{1 + 2}`)
- Conditional rendering (`{condition && <box/>}`)
- Loops (`{items.map(...)}`)
- External imports (types must be inline)
- Multiple pages
- Custom components

These will be added in future phases.

## Timeline

| Week | Tasks                                                 | Status  |
| ---- | ----------------------------------------------------- | ------- |
| 1    | JSXToEVG.rgr - Parse TSX, extract JSX, convert to EVG | ✅ Done |
| 2    | EVGPDFRenderer.rgr - Render EVG to PDF, CLI tool      | ✅ Done |
| 2    | Testing with sample.tsx                               | ✅ Done |

## Next Steps (Phase 2)

### Priority 1: Fix Parser Issues

- [ ] Fix apostrophe parsing in JSX text content
- [ ] Handle special characters properly

### Priority 2: Accurate Font Metrics

- [ ] Parse TrueType/OpenType font files for actual glyph widths
- [ ] Implement `AFMTextMeasurer` using Adobe Font Metrics files
- [ ] Or embed pre-computed width tables for core PDF fonts (Helvetica, Times, Courier)
- [ ] Support kerning pairs for proper letter spacing

**Font Metrics Approach Options:**

1. **AFM Files** - Adobe Font Metrics are text files with character widths
   - Helvetica.afm, Times-Roman.afm, Courier.afm
   - Easy to parse, widely available
2. **TrueType Parsing** - Read .ttf files directly
   - Parse 'cmap' table for character mapping
   - Parse 'hmtx' table for horizontal metrics (advance widths)
   - More complex but supports any font
3. **Embedded Tables** - Hardcode width tables for PDF core 14 fonts
   - No external dependencies
   - Limited to standard fonts
   - Smallest implementation

### Priority 3: Image Support

- [ ] Implement `<Image src="...">` element
- [ ] Load and embed JPEG images using existing JPEGDecoder
- [ ] Scale images to fit dimensions

### Priority 4: Multi-page Support

- [ ] Auto page breaks when content overflows
- [ ] `<Page>` element for explicit page breaks
- [ ] Page numbering

### Priority 5: Enhanced Text

- [ ] Bold/italic font variants
- [ ] Text alignment (center, right, justify)
- [ ] Line height support

### Priority 6: Border Rendering

- [ ] Render border rectangles
- [ ] Border color and width

## Example Output

For the sample.tsx above, the generated PDF would have:

- A4 page (595x842 points)
- Light gray background
- "Document Title" header with border
- Two-column text layout
- Image placeholder
- Footer with page number

## Future Phases

### Phase 2: Multi-page Support

- `<document>` wrapper element
- Multiple `<page>` children
- Page breaks

### Phase 3: Expression Support

- Parse `{expression}` in JSX
- Simple variable substitution
- Basic math operations

### Phase 4: Components

- Custom component definitions
- Props passing
- Component reuse
