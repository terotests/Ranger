# EVG Layout Format Specification

**Version:** 1.0  
**Status:** Draft  
**Date:** December 2024

## Table of Contents

1. [Introduction](#1-introduction)
2. [Document Structure](#2-document-structure)
3. [Element Types](#3-element-types)
4. [Attributes Reference](#4-attributes-reference)
5. [Unit System](#5-unit-system)
6. [Layout Algorithm](#6-layout-algorithm)
7. [Font Integration](#7-font-integration)
8. [Rendering Targets](#8-rendering-targets)
9. [Components](#9-components)
10. [Examples](#10-examples)

---

## 1. Introduction

### 1.1 Overview

EVG (Extended Vector Graphics) is an XML-based declarative layout format designed for creating visual layouts that can be rendered to multiple output formats including PDF, images (PNG, JPEG), video frames, SVG, and HTML/CSS.

### 1.2 Design Goals

- **Declarative**: Describe *what* should be rendered, not *how*
- **Cross-platform**: XML input can be rendered by implementations in any language
- **Multi-target**: Single source renders to PDF, images, video, HTML, or SVG
- **CSS-like**: Familiar box model with margins, padding, and borders
- **Flexible layout**: Flow-based layout with wrapping, alignment, and absolute positioning
- **Typography-aware**: First-class font support with text measurement

### 1.3 Basic Example

```xml
<div width="400" height="300" background-color="#ffffff">
  <div padding="20" background-color="#3498db" border-radius="10">
    <span font-size="24" font-family="Helvetica" color="#ffffff">
      Hello, EVG!
    </span>
  </div>
</div>
```

---

## 2. Document Structure

### 2.1 Root Element

An EVG document is a well-formed XML document. The root element is typically a `<div>` or `<View>` element that defines the canvas dimensions.

```xml
<div width="800" height="600" background-color="#ffffff">
  <!-- Child elements -->
</div>
```

### 2.2 Element Hierarchy

EVG uses a hierarchical tree structure where:
- Container elements (`<div>`, `<View>`) can have child elements
- Leaf elements (`<span>`, `<img>`, `<path>`) typically do not have children
- Elements inherit certain properties from their parent (e.g., font settings)

### 2.3 Coordinate System

- Origin (0, 0) is at the **top-left** corner
- X-axis increases to the **right**
- Y-axis increases **downward**
- All position and dimension values are in logical pixels (can be scaled)

---

## 3. Element Types

### 3.1 Container Elements

#### `<div>` / `<View>`

A rectangular container that can hold child elements. Supports all layout and styling attributes.

```xml
<div width="200" height="100" background-color="#f0f0f0" padding="10">
  <!-- children -->
</div>
```

**Aliases:** `div`, `View`

---

### 3.2 Text Elements

#### `<span>` / `<Label>`

Renders text content. Text can be provided as element content or via the `text` attribute.

```xml
<span font-size="16" font-family="Arial" color="#333333">
  This is text content
</span>

<!-- Or using attribute -->
<span font-size="16" text="This is text content" />
```

**Key behaviors:**
- Text wraps within the parent's available width
- Height is auto-calculated based on text measurement
- Supports `inline="true"` for inline-block behavior
- Preserves whitespace (pre-line behavior)

**Aliases:** `span`, `Label`

---

### 3.3 Image Elements

#### `<img>` / `<Image>`

Displays an image from a URL or embedded source.

```xml
<img src="https://example.com/image.png" width="200" height="150" />
<img src="./local/image.jpg" border-radius="10" />
```

**Attributes:**
- `src` or `imageUrl`: Image source (URL or file path)
- Standard dimension and styling attributes apply

**Aliases:** `img`, `Image`

---

### 3.4 SVG Path Elements

#### `<path>` / `<Path>`

Renders an SVG path definition. Used for vector graphics, icons, and shapes.

```xml
<path 
  d="M10,6.5c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S12.2,6.5,10,6.5"
  width="20" 
  height="20"
  background-color="#333333"
  viewBox="0 0 20 20"
/>
```

**Attributes:**
- `d` or `svgPath`: SVG path data string (M, L, C, Z commands, etc.)
- `viewBox`: SVG viewBox for scaling ("minX minY width height")
- `background-color`: Fill color
- `border-color`: Stroke color
- `opacity`: Fill and stroke opacity

**Aliases:** `path`, `Path`

---

### 3.5 Input Elements (Interactive)

For interactive applications (browser rendering):

#### `<input>` / `<Input>`
Single-line text input.

#### `<textarea>` / `<TextField>`
Multi-line text input.

---

## 4. Attributes Reference

### 4.1 Dimension Attributes

| Attribute | Type | Description | Default |
|-----------|------|-------------|---------|
| `width` | unit | Element width | 100% of parent |
| `height` | unit | Element height | Auto (content-based) |
| `innerWidth` | read-only | Computed inner width (after padding/border) | - |
| `innerHeight` | read-only | Computed inner height (after padding/border) | - |

### 4.2 Position Attributes

| Attribute | Type | Description | Effect |
|-----------|------|-------------|--------|
| `x` | unit | X position | For absolute positioning |
| `y` | unit | Y position | For absolute positioning |
| `left` | unit | Distance from parent's left edge | Enables absolute positioning |
| `top` | unit | Distance from parent's top edge | Enables absolute positioning |
| `right` | unit | Distance from parent's right edge | Enables absolute positioning |
| `bottom` | unit | Distance from parent's bottom edge | Enables absolute positioning |

**Note:** When `left`, `top`, `right`, or `bottom` is set, the element uses **absolute positioning** and is removed from the flow layout.

### 4.3 Spacing Attributes

#### Margin (outer spacing)

| Attribute | Type | Description |
|-----------|------|-------------|
| `margin` | unit | All sides margin |
| `margin-left` | unit | Left margin |
| `margin-right` | unit | Right margin |
| `margin-top` | unit | Top margin |
| `margin-bottom` | unit | Bottom margin |

#### Padding (inner spacing)

| Attribute | Type | Description |
|-----------|------|-------------|
| `padding` | unit | All sides padding |
| `padding-left` | unit | Left padding |
| `padding-right` | unit | Right padding |
| `padding-top` | unit | Top padding |
| `padding-bottom` | unit | Bottom padding |

### 4.4 Layout Attributes

| Attribute | Type | Values | Description |
|-----------|------|--------|-------------|
| `direction` | string | `row` (default), `column`, `bottom-to-top` | Child layout direction |
| `align` | string | `left` (default), `center`, `right` | Horizontal alignment |
| `vertical-align` | string | `top` (default), `center`, `bottom` | Vertical alignment |
| `inline` | boolean | `true`, `false` | Inline-block behavior |
| `line-break` | boolean | `true`, `false` | Force line break after element |
| `overflow` | string | `visible`, `hidden`, `clip`, `page-break` | Overflow behavior |

### 4.5 Visual Attributes

#### Colors

| Attribute | Type | Description |
|-----------|------|-------------|
| `color` | color | Text/foreground color |
| `background-color` | color | Background fill color |

#### Gradients

| Attribute | Type | Description |
|-----------|------|-------------|
| `linear-gradient` | string | Linear gradient fill (see format below) |
| `radial-gradient` | string | Radial gradient fill (see format below) |

**Linear Gradient Format:**
```
linear-gradient="[angle,] color1 [stop1], color2 [stop2], ..."
```

- **angle** (optional): Direction in degrees (e.g., `90deg`, `135deg`, `-20deg`)
- **color**: Any valid color value
- **stop** (optional): Position as percentage (e.g., `20%`, `80%`)

**Examples:**
```xml
<!-- Simple two-color gradient (top to bottom) -->
<View linear-gradient="#31a6ED, #51C6ED" />

<!-- With angle (135 degrees) -->
<View linear-gradient="135deg, red, yellow 20%, black, blue" />

<!-- Multiple colors with stops -->
<View linear-gradient="90deg, green, blue, red 20%, yellow, black, blue" />

<!-- With rgba colors -->
<View linear-gradient="-20deg, #f2a2f2, #121232 80%, rgba(242, 162, 242, 0.7)" />
```

**Radial Gradient Format:**
```
radial-gradient="color1 [stop1], color2 [stop2], ..."
```

Radial gradients radiate from the center outward.

**Examples:**
```xml
<!-- Simple two-color radial -->
<View radial-gradient="red, blue" />

<!-- Multiple colors -->
<View radial-gradient="red, green, blue" />

<!-- With color stops -->
<View radial-gradient="red, green 50%, blue" />

<!-- With rgba and multiple stops (halo effect) -->
<View radial-gradient="white, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.5) 30%, rgba(0,0,255,0.1)" 
      border-radius="50%" />
```

#### Border

| Attribute | Type | Description |
|-----------|------|-------------|
| `border-width` | unit | Border thickness |
| `border-color` | color | Border color |
| `border-radius` | unit | Corner radius (supports percentage, e.g., `50%` for circle) |

#### Shadow Effects

| Attribute | Type | Description |
|-----------|------|-------------|
| `shadow-radius` | unit | Box shadow blur radius |
| `shadow-color` | color | Box shadow color (default: `rgba(0,0,0,0.75)`) |
| `shadow-offset-x` | unit | Shadow horizontal offset |
| `shadow-offset-y` | unit | Shadow vertical offset |
| `shadow-opacity` | float | Shadow opacity (0.0 to 1.0) |

**Shadow Examples:**
```xml
<!-- Simple shadow -->
<View shadow-radius="10px" background-color="#222222" />

<!-- Shadow with custom color -->
<View shadow-radius="2px" shadow-color="rgba(0,0,0,0.2)" />

<!-- Shadow on a card-like panel -->
<View padding="20" background-color="white" border-radius="10" 
      shadow-radius="5" shadow-color="rgba(0,0,0,0.1)" />
```

#### Opacity

| Attribute | Type | Description |
|-----------|------|-------------|
| `opacity` | float | Element transparency (0.0 = fully transparent, 1.0 = fully opaque) |

### 4.6 Typography Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `font-size` | unit | Text size |
| `font-family` | string | Font family name |
| `text` | string | Text content (alternative to element content) |
| `align` | string | Text alignment (left, center, right) |

### 4.7 Transform Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `rotate` | number | Rotation in degrees |
| `scale` | number | Scale factor (1.0 = 100%) |

### 4.8 Identification Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique identifier for element lookup |
| `cname` | string | Component name for registration |

---

## 5. Unit System

### 5.1 Supported Units

EVG supports multiple unit types for dimension and position values:

| Unit | Suffix | Description | Example |
|------|--------|-------------|---------|
| Pixels | `px` or none | Absolute pixel values | `100`, `100px` |
| Percentage | `%` | Percentage of parent's dimension | `50%` |
| Em | `em` | Relative to font size | `1.5em` |
| Height-relative Percentage | `hp` | Percentage of parent's height | `50hp` |
| Fill | `fill` | Flexible fill (like CSS flex: 1) | `fill` |

### 5.2 Unit Resolution

Units are resolved during the layout phase in this order:

1. **Pixels (px):** Used directly
2. **Percentage (%):** Calculated against parent's `innerWidth`
3. **Em (em):** Calculated as `fontSize × value`
4. **Height Percentage (hp):** Calculated against parent's `innerHeight`
5. **Fill:** Expands to fill available space

### 5.3 Parsing Logic

```
Function parseUnit(value: string) -> {value: number, type: UnitType}:
  If value ends with "%":
    return {parseFloat(value), PERCENTAGE}
  If value ends with "em":
    return {parseFloat(value), EM}
  If value ends with "px":
    return {parseFloat(value), PIXELS}
  If value ends with "hp":
    return {parseFloat(value), HEIGHT_PERCENTAGE}
  If value equals "fill":
    return {100, FILL}
  Else:
    return {parseFloat(value), PIXELS}  // Default to pixels
```

---

## 6. Layout Algorithm

### 6.1 Overview

EVG uses a **flow-based layout algorithm** similar to CSS block/inline layout:

1. **Parse:** Convert XML to element tree with property values
2. **Adjust:** Resolve units to pixel values based on parent dimensions
3. **Layout:** Calculate positions using flow algorithm
4. **Render:** Draw elements in tree order

### 6.2 Box Model

Each element follows the CSS box model:

```
+------------------------------------------+
|                 MARGIN                   |
|  +------------------------------------+  |
|  |              BORDER                |  |
|  |  +------------------------------+  |  |
|  |  |           PADDING            |  |  |
|  |  |  +------------------------+  |  |  |
|  |  |  |                        |  |  |  |
|  |  |  |        CONTENT         |  |  |  |
|  |  |  |    (innerWidth x       |  |  |  |
|  |  |  |     innerHeight)       |  |  |  |
|  |  |  +------------------------+  |  |  |
|  |  +------------------------------+  |  |
|  +------------------------------------+  |
+------------------------------------------+
```

**Dimension calculations:**

```
innerWidth = width - paddingLeft - paddingRight - (borderWidth × 2)
innerHeight = height - paddingTop - paddingBottom - (borderWidth × 2)
totalWidth = width + marginLeft + marginRight
totalHeight = height + marginTop + marginBottom
```

### 6.3 Flow Layout Algorithm

```
Function layoutChildren(parent, children):
  currentX = parent.paddingLeft
  currentY = parent.paddingTop
  rowHeight = 0
  currentRow = []
  
  For each child in children:
    // Resolve child dimensions
    adjustLayoutParams(child, parent)
    
    // Check if child uses absolute positioning
    If child.left.is_set OR child.top.is_set OR child.bottom.is_set:
      child.calculated.absolute = true
      positionAbsoluteChild(child, parent)
      Continue
    
    // Calculate child's total width
    childTotalWidth = child.width.pixels + child.marginLeft + child.marginRight
    
    // Check if we need to wrap to next row
    If currentX + childTotalWidth > parent.innerWidth AND currentRow.length > 0:
      // Apply row alignment
      alignRow(currentRow, parent, rowHeight)
      
      // Move to next row
      currentY += rowHeight
      currentX = parent.paddingLeft
      rowHeight = 0
      currentRow = []
    
    // Position child
    child.calculated.x = currentX + child.marginLeft
    child.calculated.y = currentY + child.marginTop
    
    // Update row tracking
    currentX += childTotalWidth
    rowHeight = max(rowHeight, child.calculated.height)
    currentRow.push(child)
    
    // Handle explicit line breaks
    If child.lineBreak.b_value:
      alignRow(currentRow, parent, rowHeight)
      currentY += rowHeight
      currentX = parent.paddingLeft
      rowHeight = 0
      currentRow = []
  
  // Handle last row
  alignRow(currentRow, parent, rowHeight)
  
  Return currentY + rowHeight + parent.paddingBottom
```

### 6.4 Alignment

#### Horizontal Alignment (`align`)

```
Function alignRow(row, parent, rowHeight):
  If parent.align.s_value == "center":
    rowWidth = sum of all children widths
    offset = (parent.innerWidth - rowWidth) / 2
    For each child in row:
      child.calculated.x += offset
      
  Else If parent.align.s_value == "right":
    rowWidth = sum of all children widths
    offset = parent.innerWidth - rowWidth
    For each child in row:
      child.calculated.x += offset
```

#### Vertical Alignment (`vertical-align`)

```
Function alignRowVertically(row, rowHeight):
  For each child in row:
    If parent.verticalAlign.s_value == "center":
      offset = (rowHeight - child.calculated.height) / 2
      child.calculated.y += offset
      
    Else If parent.verticalAlign.s_value == "bottom":
      offset = rowHeight - child.calculated.height
      child.calculated.y += offset
```

### 6.5 Absolute Positioning

When `left`, `top`, `right`, or `bottom` is set:

```
Function positionAbsoluteChild(child, parent):
  If child.left.is_set:
    child.calculated.x = child.marginLeft + child.left.pixels
  Else If child.right.is_set:
    child.calculated.x = parent.innerWidth - child.right.pixels - child.width.pixels
  
  If child.top.is_set:
    child.calculated.y = child.marginTop + child.top.pixels
  Else If child.bottom.is_set:
    child.calculated.y = parent.innerHeight - child.bottom.pixels - child.height.pixels
```

### 6.6 Text Measurement

For text elements (`<span>`, `<Label>`), the layout algorithm must measure text to determine height:

```
Function measureText(text, fontFamily, fontSize, maxWidth) -> {width, height}:
  // Implementation depends on rendering target
  // Must handle:
  // - Multi-line text wrapping at maxWidth
  // - Font metrics (ascent, descent, line height)
  // - Unicode and special characters
```

---

## 7. Font Integration

### 7.1 Font Provider Interface

Implementations must provide a font provider that supports:

```
Interface IFontProvider:
  // Register a font with a name
  registerFont(name: string, source: FontSource): void
  
  // Get font source by name
  getFont(name: string): FontSource | null
  
  // Check if font is available
  hasFont(name: string): boolean
  
  // List all registered fonts
  listFonts(): string[]
```

### 7.2 Font Sources

Fonts can be provided as:
- **File path:** `"/fonts/MyFont.ttf"` (for file system access)
- **URL:** `"https://example.com/fonts/MyFont.woff2"`
- **ArrayBuffer:** Binary font data loaded in memory
- **Uint8Array:** Binary font data

### 7.3 Font Registration

Fonts must be registered before use:

```javascript
// Node.js example
EVG.registerFont("CustomFont", "/path/to/font.ttf");

// Browser example
const fontData = await fetch('/fonts/custom.woff2').then(r => r.arrayBuffer());
EVG.registerFont("CustomFont", fontData);
```

### 7.4 Font Fallback

When a specified font is not available:
1. Check registered fonts
2. Fall back to system fonts
3. Use default font (implementation-specific, typically "Helvetica" or "Arial")

### 7.5 Font Metrics for Text Measurement

Text measurement requires access to font metrics:

```
Interface ITextMeasurer:
  measureText(text: string, fontFamily: string, fontSize: number): {
    width: number,
    height: number
  }
```

Different renderers provide their own measurement:
- **PDF:** Use PDFKit's text measurement
- **Canvas:** Use CanvasRenderingContext2D.measureText()
- **Browser:** Use DOM-based measurement with actual fonts

---

## 8. Rendering Targets

### 8.1 Renderer Interface

All renderers must implement:

```
Interface IRenderer:
  // Document lifecycle
  beginDocument(width: number, height: number): void
  endDocument(): void
  addPage(width?: number, height?: number): void
  
  // Drawing primitives
  drawRect(x, y, width, height, options): void
  drawRoundedRect(x, y, width, height, radius, options): void
  drawText(text, x, y, options): void
  drawImage(source, x, y, width, height): void
  drawPath(pathData, x, y, width, height, options): void
  
  // Gradient rendering
  drawLinearGradient(x, y, width, height, gradient): void
  drawRadialGradient(x, y, width, height, gradient): void
  
  // Shadow rendering
  drawShadow(x, y, width, height, shadowOptions): void
  
  // State management
  save(): void
  restore(): void
  translate(x, y): void
  rotate(angle): void
  scale(sx, sy): void
  setClipRect(x, y, width, height): void
  setOpacity(opacity): void
  
  // Text measurement
  measureText(text, fontFamily, fontSize): {width, height}
```

### 8.2 Gradient Rendering

#### Linear Gradient Data Structure

```
Interface LinearGradient:
  angle: number          // Rotation angle in degrees (0 = left-to-right)
  stops: GradientStop[]  // Color stops

Interface GradientStop:
  offset: number   // Position from 0.0 to 1.0
  color: string    // Color value (hex, rgb, rgba)
```

**Rendering Algorithm:**
1. Parse gradient string to extract angle and color stops
2. Calculate gradient start and end points based on angle and bounding box
3. Create gradient fill with color stops
4. Apply to element background

**Example Implementation (Canvas):**
```javascript
function drawLinearGradient(ctx, x, y, width, height, gradient) {
  // Calculate gradient line based on angle
  const angleRad = (gradient.angle - 90) * Math.PI / 180;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const length = Math.sqrt(width * width + height * height) / 2;
  
  const x1 = centerX - Math.cos(angleRad) * length;
  const y1 = centerY - Math.sin(angleRad) * length;
  const x2 = centerX + Math.cos(angleRad) * length;
  const y2 = centerY + Math.sin(angleRad) * length;
  
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.stops.forEach(stop => {
    grad.addColorStop(stop.offset, stop.color);
  });
  
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
}
```

#### Radial Gradient Data Structure

```
Interface RadialGradient:
  centerX: number        // Center X (default: 50% of width)
  centerY: number        // Center Y (default: 50% of height)
  radius: number         // Radius (default: max dimension / 2)
  stops: GradientStop[]  // Color stops
```

**Rendering Algorithm:**
1. Parse gradient string to extract color stops
2. Center gradient at element center
3. Set radius to cover the element (typically half the diagonal)
4. Create radial gradient fill

**Example Implementation (Canvas):**
```javascript
function drawRadialGradient(ctx, x, y, width, height, gradient) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.max(width, height) / 2;
  
  const grad = ctx.createRadialGradient(
    centerX, centerY, 0,        // Inner circle (center point)
    centerX, centerY, radius    // Outer circle
  );
  
  gradient.stops.forEach(stop => {
    grad.addColorStop(stop.offset, stop.color);
  });
  
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
}
```

### 8.3 Shadow Rendering

#### Shadow Data Structure

```
Interface ShadowOptions:
  radius: number         // Blur radius in pixels
  color: string          // Shadow color (default: rgba(0,0,0,0.75))
  offsetX: number        // Horizontal offset (default: 0)
  offsetY: number        // Vertical offset (default: 0)
  opacity: number        // Shadow opacity (default: 1.0)
```

**Rendering Algorithm:**
1. Save current rendering state
2. Set shadow properties before drawing the element
3. Draw the element (shadow is rendered automatically by the graphics context)
4. Restore state

**Example Implementation (Canvas):**
```javascript
function drawWithShadow(ctx, drawFn, shadowOptions) {
  ctx.save();
  
  ctx.shadowColor = shadowOptions.color || 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = shadowOptions.radius || 0;
  ctx.shadowOffsetX = shadowOptions.offsetX || 0;
  ctx.shadowOffsetY = shadowOptions.offsetY || 0;
  
  drawFn();  // Execute the actual drawing
  
  ctx.restore();
}
```

**Example Implementation (SVG):**
```xml
<defs>
  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="rgba(0,0,0,0.75)"/>
  </filter>
</defs>
<rect filter="url(#shadow)" ... />
```

**Example Implementation (CSS):**
```css
box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.75);
```

### 8.4 PDF Rendering

PDF output uses libraries like PDFKit (Node.js) or jsPDF (browser).

**Considerations:**
- Fonts must be embedded for custom fonts
- Use actual PDF units (72 DPI by default)
- Support multi-page documents via `overflow="page-break"`
- Gradients require native PDF gradient support or rasterization
- Shadows may need to be simulated with multiple offset shapes

### 8.5 Image Rendering (PNG, JPEG)

Image output uses canvas APIs (node-canvas, browser Canvas).

**Considerations:**
- Set pixel ratio for high-DPI output
- Support transparency (PNG) or no transparency (JPEG)
- Flatten layers to single raster output
- Native shadow and gradient support via Canvas API

### 8.6 SVG Rendering

SVG output generates an XML SVG document.

**Considerations:**
- Embed fonts as base64 or reference external fonts
- Convert all elements to SVG equivalents
- Preserve vector quality (no rasterization)
- Use `<linearGradient>` and `<radialGradient>` elements in `<defs>`
- Use `<filter>` with `<feDropShadow>` for shadows

### 8.7 HTML/CSS Rendering

HTML output generates semantic HTML with CSS styling.

**Considerations:**
- Choose CSS strategy: inline styles, CSS classes, or CSS-in-JS
- Use flexbox or absolute positioning for layout
- Support responsive output with percentage-based dimensions
- Use CSS `linear-gradient()`, `radial-gradient()` for gradients
- Use CSS `box-shadow` for shadow effects

---

## 9. Components

### 9.1 Component Definition

Components are reusable EVG fragments registered by name:

```xml
<!-- Define a component -->
<div cname="Button">
  <div padding="10" background-color="#3498db" border-radius="5">
    <span id="content" color="white" font-size="14" />
  </div>
</div>
```

### 9.2 Component Registration

```javascript
EVG.registerComponent("Button", buttonXML);
```

### 9.3 Component Usage

```xml
<Button>Click Me</Button>
```

When parsed, the component's XML replaces the custom element, with content inserted at the `id="content"` slot.

### 9.4 Content Slot

Components can define content slots using `id="content"` or `<content>` element:

```xml
<div cname="Card">
  <div padding="20" background-color="white" shadow-radius="10">
    <div id="content" />
  </div>
</div>
```

---

## 10. Examples

### 10.1 Simple Card

```xml
<div width="400" height="300" background-color="#ecf0f1">
  <div margin="20" padding="20" background-color="white" 
       border-radius="10" shadow-radius="5" shadow-color="rgba(0,0,0,0.1)">
    <span font-size="24" font-family="Helvetica" color="#2c3e50">
      Card Title
    </span>
    <div margin-top="10">
      <span font-size="14" color="#7f8c8d">
        This is the card description text that can wrap to multiple lines.
      </span>
    </div>
  </div>
</div>
```

### 10.2 Horizontal Layout with Alignment

```xml
<div width="600" height="100" background-color="#34495e" 
     align="center" vertical-align="center">
  <div width="80" height="80" background-color="#e74c3c" 
       border-radius="10" margin="10" />
  <div width="80" height="80" background-color="#e67e22" 
       border-radius="10" margin="10" />
  <div width="80" height="80" background-color="#f1c40f" 
       border-radius="10" margin="10" />
</div>
```

### 10.3 Icon with SVG Path

```xml
<div width="200" height="200" background-color="#ffffff" 
     align="center" vertical-align="center">
  <path 
    d="M10,6.5c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S12.2,6.5,10,6.5M10,13.9c-1.8,0-3.2-1.5-3.2-3.2S8.2,7.4,10,7.4c1.8,0,3.2,1.5,3.2,3.2S11.8,13.9,10,13.9M17.1,5.7l-3.2,0L12.5,3.7c-0.1-0.1-0.2-0.2-0.3-0.2H7.8c-0.1,0-0.3,0.1-0.3,0.2L6.1,5.7H2.9c-1,0-1.7,0.7-1.7,1.7v7.4c0,1,0.8,1.7,1.7,1.7h14.2c1,0,1.7-0.8,1.7-1.7V7.2C18.8,6.2,18.1,5.7,17.1,5.7"
    width="100"
    height="100"
    viewBox="0 0 20 20"
    background-color="#3498db"
  />
</div>
```

### 10.4 Absolute Positioning

```xml
<div width="400" height="300" background-color="#2c3e50">
  <!-- Centered content -->
  <div width="200" height="100" background-color="white" 
       left="100" top="100" border-radius="10">
    <span>Centered Box</span>
  </div>
  
  <!-- Bottom-right badge -->
  <div width="50" height="50" background-color="#e74c3c" 
       right="20" bottom="20" border-radius="25" 
       align="center" vertical-align="center">
    <span font-size="20" color="white">!</span>
  </div>
</div>
```

### 10.5 Container Component Example

From `components/container.xml`:

```xml
<div margin="10" border-radius="5" background-color="#337799" 
     color="white" padding="10">
  <div font-size="16" color="#ffee77">
    This is a container component from components/container.xml
  </div>
  <div id="content" font-size="12" margin-top="10" />
</div>
```

---

## Appendix A: Color Format

EVG supports the following color formats:

| Format | Example | Description |
|--------|---------|-------------|
| Hex 6-digit | `#FF5733` | RGB in hexadecimal |
| Hex 3-digit | `#F53` | Shorthand RGB |
| Hex 8-digit | `#FF573388` | RGBA with alpha |
| RGB | `rgb(255, 87, 51)` | RGB functional notation |
| RGBA | `rgba(255, 87, 51, 0.5)` | RGB with alpha channel |
| Named | `red`, `blue`, `white` | CSS named colors |

---

## Appendix B: SVG Path Commands

The `d` attribute in `<path>` elements supports standard SVG path commands:

| Command | Parameters | Description |
|---------|------------|-------------|
| `M` | x,y | Move to absolute position |
| `m` | dx,dy | Move relative |
| `L` | x,y | Line to absolute position |
| `l` | dx,dy | Line relative |
| `H` | x | Horizontal line to absolute X |
| `h` | dx | Horizontal line relative |
| `V` | y | Vertical line to absolute Y |
| `v` | dy | Vertical line relative |
| `C` | x1,y1 x2,y2 x,y | Cubic Bézier curve |
| `c` | dx1,dy1 dx2,dy2 dx,dy | Cubic Bézier relative |
| `S` | x2,y2 x,y | Smooth cubic Bézier |
| `Q` | x1,y1 x,y | Quadratic Bézier curve |
| `A` | rx ry rotation large-arc sweep x y | Arc |
| `Z` | - | Close path |

---

## Appendix C: Implementation Checklist

When implementing an EVG renderer in a new language, ensure support for:

### Required
- [ ] XML parsing with attribute extraction
- [ ] Unit value parsing (px, %, em, hp, fill)
- [ ] Box model calculations (margin, padding, border)
- [ ] Flow layout algorithm with wrapping
- [ ] Absolute positioning
- [ ] Horizontal and vertical alignment
- [ ] Rectangle rendering (with rounded corners)
- [ ] Text rendering with font support
- [ ] Text measurement for layout calculations
- [ ] Basic color parsing (hex, rgb, rgba)

### Recommended
- [ ] SVG path rendering
- [ ] Image rendering
- [ ] Opacity and transparency
- [ ] Box shadows
- [ ] Linear gradients
- [ ] Transforms (rotate, scale)
- [ ] Component registration and expansion

### Optional
- [ ] Page breaks for multi-page documents
- [ ] Interactive elements (input, textarea)
- [ ] Event handling
- [ ] Animation support

---

## Appendix D: Attribute Name Aliases

EVG supports both camelCase and kebab-case for attribute names:

| Canonical | Alias |
|-----------|-------|
| `background-color` | `backgroundColor` |
| `border-radius` | `borderRadius` |
| `border-width` | `borderWidth` |
| `border-color` | `borderColor` |
| `font-size` | `fontSize` |
| `font-family` | `fontFamily` |
| `margin-left` | `marginLeft` |
| `margin-right` | `marginRight` |
| `margin-top` | `marginTop` |
| `margin-bottom` | `marginBottom` |
| `padding-left` | `paddingLeft` |
| `padding-right` | `paddingRight` |
| `padding-top` | `paddingTop` |
| `padding-bottom` | `paddingBottom` |
| `vertical-align` | `verticalAlign` |
| `line-break` | `lineBreak` |
| `shadow-radius` | `shadowRadius` |
| `shadow-color` | `shadowColor` |
| `shadow-offset-x` | `shadowOffsetX` |
| `shadow-offset-y` | `shadowOffsetY` |
| `linear-gradient` | `linearGradient` |
| `radial-gradient` | `radialGradient` |

---

## Appendix E: Default Values

| Property | Default Value |
|----------|---------------|
| `width` | 100% of parent |
| `height` | Auto (content-based) |
| `font-size` | 14px |
| `font-family` | Implementation-specific (typically "Arial" or "Helvetica") |
| `color` | #000000 (black) |
| `background-color` | transparent |
| `opacity` | 1.0 |
| `margin` | 0 |
| `padding` | 0 |
| `border-width` | 0 |
| `border-radius` | 0 |
| `align` | left |
| `vertical-align` | top |
| `direction` | row |
| `overflow` | visible |
| `shadow-color` | rgba(0,0,0,0.75) |
| `shadow-radius` | 0 |
| `shadow-offset-x` | 0 |
| `shadow-offset-y` | 0 |

---

## Appendix F: Gradient String Parsing

### Linear Gradient Parsing Algorithm

```
Function parseLinearGradient(value: string) -> LinearGradient:
  tokens = tokenize(value)  // Split by comma, respecting parentheses
  angle = 180               // Default: top to bottom
  stops = []
  
  For each token in tokens:
    token = trim(token)
    
    // Check if first token is an angle
    If isAngle(token):  // ends with "deg"
      angle = parseFloat(token)
      Continue
    
    // Parse color stop: "color [position]"
    parts = splitByWhitespace(token)
    color = parts[0]
    position = null
    
    If parts.length > 1 AND isPercentage(parts[1]):
      position = parseFloat(parts[1]) / 100
    
    stops.push({color, position})
  
  // Fill in missing positions (evenly distributed)
  fillMissingPositions(stops)
  
  Return {angle, stops}

Function fillMissingPositions(stops):
  // First stop defaults to 0, last to 1
  If stops[0].position is null:
    stops[0].position = 0
  If stops[last].position is null:
    stops[last].position = 1
  
  // Interpolate missing positions between defined ones
  For i from 1 to stops.length - 1:
    If stops[i].position is null:
      // Find next defined position
      nextDefined = findNextDefinedPosition(stops, i)
      prevDefined = findPrevDefinedPosition(stops, i)
      
      // Linear interpolation
      range = nextDefined.position - prevDefined.position
      count = nextDefined.index - prevDefined.index
      stops[i].position = prevDefined.position + range * (i - prevDefined.index) / count
```

### Radial Gradient Parsing Algorithm

```
Function parseRadialGradient(value: string) -> RadialGradient:
  tokens = tokenize(value)  // Split by comma, respecting parentheses
  stops = []
  
  For each token in tokens:
    token = trim(token)
    
    // Parse color stop: "color [position]"
    parts = splitByWhitespace(token)
    color = parts[0]
    position = null
    
    If parts.length > 1 AND isPercentage(parts[1]):
      position = parseFloat(parts[1]) / 100
    
    stops.push({color, position})
  
  // Fill in missing positions
  fillMissingPositions(stops)
  
  Return {stops}
```

### Example Parsing Results

**Input:** `"135deg, red, yellow 20%, black, blue"`
```json
{
  "angle": 135,
  "stops": [
    {"color": "red", "position": 0},
    {"color": "yellow", "position": 0.2},
    {"color": "black", "position": 0.6},
    {"color": "blue", "position": 1.0}
  ]
}
```

**Input:** `"red, green 50%, blue"` (radial)
```json
{
  "stops": [
    {"color": "red", "position": 0},
    {"color": "green", "position": 0.5},
    {"color": "blue", "position": 1.0}
  ]
}
```

---

*This specification is maintained as part of the EVG project.*

