# EVG Layout Engine Implementation Plan

**Version:** 1.0  
**Date:** December 2024  
**Language:** Ranger

## 1. Overview

EVG (Extended Vector Graphics) is a declarative layout engine that calculates element positions and dimensions. It separates layout computation from rendering, allowing multiple output targets (PDF, Canvas, SVG, HTML).

### 1.1 Design Goals

- **Layout-only engine**: Calculate coordinates, not render directly
- **Abstract renderer interface**: Call external measurers for font metrics
- **CSS-like box model**: Margins, padding, borders
- **Flow layout**: Automatic wrapping and alignment
- **Absolute positioning**: Support for fixed element placement
- **Book printing**: Multi-page support for pdf_writer integration

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EVG Layout Engine                     │
├─────────────────────────────────────────────────────────┤
│  XML Parser → Element Tree → Layout Calculator → Coords  │
└─────────────────────────────────────────────────────────┘
                            ↓
                    ITextMeasurer interface
                            ↓
┌─────────────────────────────────────────────────────────┐
│          Renderers (separate implementation)             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐    │
│  │ PDFKit  │ │ Canvas  │ │   SVG   │ │ pdf_writer  │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 2. File Structure

```
gallery/evg/
├── PLAN_EVG.md            # This plan
├── README.md              # Usage documentation
├── SPEC.md                # Format specification
├── bin/                   # Compiled output
│   └── evg_test.js
├── original/              # Reference implementations
│   ├── EVGColor.clj
│   ├── EVGColorContext.clj
│   └── SVGPath.clj
│
│ === LIBRARY FILES (no main function) ===
├── EVGUnit.rgr            # Unit parsing (px, %, em, hp, fill)
├── EVGColor.rgr           # Color parsing (hex, rgb, rgba, hsl, named)
├── EVGBox.rgr             # Box model (margin, padding, border)
├── EVGElement.rgr         # Element base class with attributes
├── EVGText.rgr            # Text element with measurement
├── EVGImage.rgr           # Image element
├── EVGContainer.rgr       # Container (div) element
├── EVGParser.rgr          # XML parser to element tree
├── EVGLayout.rgr          # Layout algorithm (flow, absolute)
├── EVGDocument.rgr        # Document root with pages
├── EVGRenderer.rgr        # Abstract renderer interface
│
│ === TEST/CLI FILE (with main function) ===
└── evg_test.rgr           # Test CLI and examples
```

## 3. Implementation Phases

### Phase 1: Core Data Structures

#### 3.1.1 EVGUnit.rgr - Unit System

```ranger
class EVGUnit {
    def value:double 0.0
    def unitType:int 0      ; 0=px, 1=%, 2=em, 3=hp, 4=fill
    def isSet:boolean false
    def pixels:double 0.0   ; Resolved pixel value

    sfn parse:EVGUnit (str:string)
    fn resolve:void (parentSize:double fontSize:double)
}

; Unit type constants
; UNIT_PIXELS = 0
; UNIT_PERCENT = 1
; UNIT_EM = 2
; UNIT_HEIGHT_PERCENT = 3
; UNIT_FILL = 4
```

#### 3.1.2 EVGColor.rgr - Color Parsing

```ranger
class EVGColor {
    def r:double 0.0
    def g:double 0.0
    def b:double 0.0
    def a:double 1.0
    def isSet:boolean false

    sfn parse:EVGColor (str:string)       ; Parse hex, rgb, rgba, hsl, named
    sfn noColor:EVGColor ()               ; Transparent/unset
    fn toCSSString:string ()
    fn toHexString:string ()
    fn toPDFString:string ()              ; For pdf_writer
}
```

#### 3.1.3 EVGBox.rgr - Box Model

```ranger
class EVGBox {
    ; Margins
    def marginTop:EVGUnit
    def marginRight:EVGUnit
    def marginBottom:EVGUnit
    def marginLeft:EVGUnit

    ; Padding
    def paddingTop:EVGUnit
    def paddingRight:EVGUnit
    def paddingBottom:EVGUnit
    def paddingLeft:EVGUnit

    ; Border
    def borderWidth:EVGUnit
    def borderColor:EVGColor
    def borderRadius:EVGUnit

    fn resolveUnits:void (parentWidth:double parentHeight:double fontSize:double)
    fn getInnerWidth:double (outerWidth:double)
    fn getInnerHeight:double (outerHeight:double)
    fn getTotalWidth:double (contentWidth:double)
    fn getTotalHeight:double (contentHeight:double)
}
```

### Phase 2: Element Classes

#### 3.2.1 EVGElement.rgr - Base Element

```ranger
class EVGElement {
    def id:string ""
    def tagName:string "div"
    def parent@(optional):EVGElement
    def children:[EVGElement]

    ; Dimensions
    def width:EVGUnit
    def height:EVGUnit

    ; Position (for absolute)
    def left:EVGUnit
    def top:EVGUnit
    def right:EVGUnit
    def bottom:EVGUnit

    ; Box model
    def box:EVGBox

    ; Visual
    def backgroundColor:EVGColor
    def opacity:double 1.0

    ; Layout properties
    def direction:string "row"        ; row, column
    def align:string "left"           ; left, center, right
    def verticalAlign:string "top"    ; top, center, bottom
    def isInline:boolean false
    def lineBreak:boolean false
    def overflow:string "visible"     ; visible, hidden, page-break

    ; Calculated values (output)
    def calculatedX:double 0.0
    def calculatedY:double 0.0
    def calculatedWidth:double 0.0
    def calculatedHeight:double 0.0
    def calculatedPage:int 0          ; For multi-page
    def isAbsolute:boolean false

    fn setAttribute:void (name:string value:string)
    fn addChild:void (child:EVGElement)
    fn resolveUnits:void (parentWidth:double parentHeight:double fontSize:double)
}
```

#### 3.2.2 EVGText.rgr - Text Element

```ranger
class EVGText {
    Extends(EVGElement)

    def text:string ""
    def fontFamily:string "Helvetica"
    def fontSize:EVGUnit              ; Default 14px
    def color:EVGColor

    ; Calculated text metrics
    def measuredWidth:double 0.0
    def measuredHeight:double 0.0
    def lineCount:int 1
    def lines:[string]                ; Wrapped lines

    fn measureText:void (measurer:ITextMeasurer maxWidth:double)
    fn wrapText:void (measurer:ITextMeasurer maxWidth:double)
}
```

#### 3.2.3 EVGImage.rgr - Image Element

```ranger
class EVGImage {
    Extends(EVGElement)

    def src:string ""
    def naturalWidth:double 0.0
    def naturalHeight:double 0.0
    def imageData@(optional):buffer   ; For embedded images

    fn setImageSize:void (w:double h:double)
}
```

#### 3.2.4 EVGContainer.rgr - Container Element

```ranger
class EVGContainer {
    Extends(EVGElement)

    ; Gradient support
    def linearGradient:string ""
    def radialGradient:string ""

    ; Shadow
    def shadowRadius:EVGUnit
    def shadowColor:EVGColor
    def shadowOffsetX:EVGUnit
    def shadowOffsetY:EVGUnit

    ; Transform
    def rotate:double 0.0
    def scale:double 1.0
}
```

### Phase 3: Text Measurement Interface

#### 3.3.1 EVGRenderer.rgr - Abstract Interface

```ranger
; Interface for text measurement - must be implemented by renderer
class ITextMeasurer {
    fn measureText:EVGTextMetrics (text:string fontFamily:string fontSize:double)
    fn measureTextWidth:double (text:string fontFamily:string fontSize:double)
    fn getLineHeight:double (fontFamily:string fontSize:double)
}

class EVGTextMetrics {
    def width:double 0.0
    def height:double 0.0
    def ascent:double 0.0
    def descent:double 0.0
    def lineHeight:double 0.0
}

; Simple fallback measurer (estimates)
class SimpleTextMeasurer {
    Extends(ITextMeasurer)

    fn measureText:EVGTextMetrics (text:string fontFamily:string fontSize:double) {
        ; Estimate: average character width is ~0.5-0.6 of fontSize
        def avgCharWidth:double (fontSize * 0.55)
        def width:double ((to_double (strlen text)) * avgCharWidth)
        def height:double (fontSize * 1.2)  ; Line height ~1.2x font size
        ; Return metrics...
    }
}
```

### Phase 4: XML Parser

#### 3.4.1 EVGParser.rgr - XML to Element Tree

```ranger
class EVGParser {
    def root@(optional):EVGElement
    def measurer@(optional):ITextMeasurer

    fn parse:EVGElement (xml:string)
    fn parseElement:EVGElement (tagName:string attributes:map children:[EVGElement])
    fn parseAttributes:void (element:EVGElement attrMap:map)

    ; Attribute parsing helpers
    fn parseUnit:EVGUnit (value:string)
    fn parseColor:EVGColor (value:string)
    fn parseBoolean:boolean (value:string)
}
```

### Phase 5: Layout Algorithm

#### 3.5.1 EVGLayout.rgr - Layout Calculator

```ranger
class EVGLayout {
    def measurer:ITextMeasurer
    def pageWidth:double 0.0
    def pageHeight:double 0.0
    def currentPage:int 0

    fn layout:void (root:EVGElement)
    fn layoutElement:void (element:EVGElement parentX:double parentY:double
                           parentWidth:double parentHeight:double)
    fn layoutChildren:double (parent:EVGElement)  ; Returns content height
    fn layoutFlow:double (parent:EVGElement children:[EVGElement])
    fn layoutAbsolute:void (element:EVGElement parent:EVGElement)
    fn alignRow:void (row:[EVGElement] parent:EVGElement rowHeight:double)
    fn measureTextElement:void (text:EVGText maxWidth:double)

    ; Unit resolution
    fn resolveUnit:double (unit:EVGUnit parentSize:double fontSize:double)
}
```

### Phase 6: Document and Pages

#### 3.6.1 EVGDocument.rgr - Multi-page Document

```ranger
class EVGPage {
    def pageNumber:int 0
    def width:double 0.0
    def height:double 0.0
    def elements:[EVGElement]        ; Elements on this page
}

class EVGDocument {
    def pages:[EVGPage]
    def defaultWidth:double 612.0    ; Letter size in points
    def defaultHeight:double 792.0
    def root@(optional):EVGElement

    fn addPage:EVGPage ()
    fn layoutDocument:void (measurer:ITextMeasurer)
    fn getElementsForPage:array (pageNum:int)
}
```

## 4. Layout Algorithm Details

### 4.1 Flow Layout

```
1. Start at (paddingLeft, paddingTop)
2. For each child:
   a. Resolve child's units based on parent dimensions
   b. If child has left/top/right/bottom → absolute positioning
   c. Check if child fits in current row
   d. If not, wrap to next row
   e. Position child at (currentX + marginLeft, currentY + marginTop)
   f. Advance currentX by child's total width
   g. Track max row height
3. After all children, apply horizontal alignment to each row
4. Apply vertical alignment within rows
5. Return total content height
```

### 4.2 Page Breaking

```
1. Layout normally until element exceeds page height
2. When overflow="page-break":
   a. Split element to next page
   b. Mark calculatedPage on each element
3. Document collects elements per page for rendering
```

## 5. Integration with pdf_writer

### 5.1 PDF Renderer Interface

```ranger
class EVGPDFRenderer {
    def writer:PDFWriter
    def document:EVGDocument

    fn render:buffer ()
    fn renderPage:void (page:EVGPage)
    fn renderElement:void (element:EVGElement)
    fn renderText:void (text:EVGText)
    fn renderImage:void (image:EVGImage)
    fn renderContainer:void (container:EVGContainer)

    ; ITextMeasurer implementation using PDF font metrics
    fn measureText:EVGTextMetrics (text:string fontFamily:string fontSize:double)
}
```

### 5.2 Usage Example

```ranger
Import "EVGDocument.rgr"
Import "EVGParser.rgr"
Import "EVGLayout.rgr"
Import "EVGPDFRenderer.rgr"

main {
    def xml "<div width=\"612\" height=\"792\" padding=\"72\">
        <span font-size=\"24\">Chapter 1</span>
        <div margin-top=\"20\">
            <span font-size=\"12\">Lorem ipsum dolor sit amet...</span>
        </div>
        <img src=\"./image.jpg\" width=\"200\" />
    </div>"

    def parser (new EVGParser())
    def root:EVGElement (parser.parse(xml))

    def renderer (new EVGPDFRenderer())
    def document (new EVGDocument())
    document.root = root
    document.layoutDocument(renderer)

    def pdfData:buffer (renderer.render())
    buffer_write_file "." "output.pdf" pdfData
}
```

## 6. npm Scripts

Add to package.json:

```json
{
  "evg:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/evg/evg_test.rgr -d=./gallery/evg/bin -o=evg_test.js -nodecli",
  "evg:run": "node ./gallery/evg/bin/evg_test.js",
  "evg": "npm run evg:compile && npm run evg:run"
}
```

## 7. Implementation Order

### Week 1: Core Types

1. [ ] EVGUnit.rgr - Unit parsing and resolution
2. [ ] EVGColor.rgr - Color parsing (port from original/EVGColor.clj)
3. [ ] EVGBox.rgr - Box model calculations

### Week 2: Elements

4. [ ] EVGElement.rgr - Base element class
5. [ ] EVGText.rgr - Text element
6. [ ] EVGImage.rgr - Image element
7. [ ] EVGContainer.rgr - Container with gradients/shadows

### Week 3: Parser & Layout

8. [ ] EVGParser.rgr - Simple XML parser
9. [ ] EVGLayout.rgr - Flow layout algorithm
10. [ ] EVGDocument.rgr - Multi-page support

### Week 4: Renderer Integration

11. [ ] EVGRenderer.rgr - Abstract interface
12. [ ] evg_test.rgr - Test CLI
13. [ ] Integration with pdf_writer (future)

## 8. Testing Strategy

### 8.1 Unit Tests (in evg_test.rgr)

- Unit parsing: "100px", "50%", "2em", "fill"
- Color parsing: "#FF5733", "rgb(255,87,51)", "rgba(...)", "red"
- Box model calculations
- Layout positioning

### 8.2 Visual Tests

- Generate test PDFs with known layouts
- Compare coordinates to expected values

### 8.3 Example Documents

- Simple card layout
- Multi-column layout
- Text wrapping test
- Image with caption
- Multi-page book chapter

## 9. Future Enhancements

- [ ] SVG path rendering (port from original/SVGPath.clj)
- [ ] Gradient parsing and rendering
- [ ] Component system (reusable templates)
- [ ] CSS stylesheet support
- [ ] EPUB output (multi-page HTML)
- [ ] Canvas renderer for browser
- [ ] Interactive elements (for browser)

## 10. References

- [SPEC.md](SPEC.md) - Full EVG format specification
- [original/EVGColor.clj](original/EVGColor.clj) - Reference color implementation
- [original/SVGPath.clj](original/SVGPath.clj) - Reference SVG path parser
- [PDF Reference](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf)
