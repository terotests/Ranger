# EVG Rendering System - TODO List

Based on priorities from `PLAN_EVG.md`. Updated: December 22, 2024.

---

## 🔴 HIGHEST PRIORITY

### 1. HTML Renderer
**Goal:** Enable unit testing, fast preview, and rapid development iteration.

- [x] **0.1** Basic HTML structure (View, Label) - *DONE*
- [x] **0.2** CSS generation (colors, dimensions, spacing) - *DONE*
- [x] **0.3** Flexbox layout mapping - *DONE (absolute positioning)*
- [x] **0.4** Image rendering with base64 embedding - *DONE*
- [x] **0.5** SVG Path embedding - *DONE*
- [x] **0.6** Font embedding (TTF to base64) - *DONE*
- [ ] **0.7** Gradients and shadows - *TODO*
- [ ] **0.8** Unit test framework (Vitest) - *TODO*
- [ ] **0.9** Preview server with hot reload - *TODO*

**Completed Files:**
```
gallery/pdf_writer/src/
├── core/
│   ├── EVGPDFRenderer.rgr       # Existing PDF renderer
│   └── EVGHTMLRenderer.rgr      # ✅ NEW: HTML/CSS renderer (~970 lines)
├── jsx/
│   └── JSXToEVG.rgr             # ✅ Updated: Fixed punctuation spacing
├── tools/
│   └── evg_html_tool.rgr        # ✅ NEW: CLI tool for TSX→HTML
└── tests/
    └── (TODO: Unit tests)
```

**Added to package.json:**
- `npm run evghtml:compile` - Compile HTML renderer
- `npm run evghtml:run` - Run TSX→HTML conversion
- `npm run evghtml` - Compile and run
- `-embed` flag for base64 embedding of images and fonts

**Lang.rgr Updates:**
- Added `buffer_to_base64` operator for base64 encoding

**Note:** The HTML renderer lives alongside the PDF renderer in `gallery/pdf_writer/` because:
- Both renderers share the same EVG element tree
- Both use the same font metrics from `TrueTypeParser.rgr`
- The `evg` CLI tool will support both `--format=pdf` and `--format=html`
- Unit tests can verify HTML output before PDF generation

**Estimated remaining time:** ~4 days (gradients, shadows, unit tests, hot reload)

---

## 🟠 HIGH PRIORITY

### 2. PDF: overflow: hidden
**Goal:** Clip children to View bounds.

- [ ] Parse `overflow` attribute in `JSXToEVG.rgr`
- [ ] Implement PDF clipping rectangle in `EVGPDFRenderer.rgr`
- [ ] Use `q ... re W n ... Q` graphics state

**Complexity:** Low  
**Estimated time:** 1 day

---

### 3. PDF: opacity
**Goal:** Support transparency for elements.

- [ ] Implement PDF ExtGState with `ca` (fill) and `CA` (stroke) operators
- [ ] Register ExtGState resources in PDF output
- [ ] Apply to elements with `opacity` attribute

**Complexity:** Low  
**Estimated time:** 1 day

---

### 4. PDF: rotate & scale transforms
**Goal:** Rotate and scale elements.

- [ ] Parse `rotate` and `scale` attributes in `JSXToEVG.rgr`
- [ ] Implement PDF `cm` transformation matrix
- [ ] Calculate rotation center (element center by default)
- [ ] Save/restore graphics state around transforms

**Complexity:** Medium  
**Estimated time:** 2 days

---

### 5. PDF: linear-gradient
**Goal:** Gradient backgrounds on View elements.

- [ ] Parse CSS-style gradient syntax: `linear-gradient(45deg, red, blue)`
- [ ] Implement PDF Shading Pattern Type 2 (Axial)
- [ ] Calculate gradient endpoints from angle and bounds
- [ ] Register shading pattern resources

**Complexity:** Medium  
**Estimated time:** 2-3 days

---

### 6. Image viewBox (Crop/Zoom)
**Goal:** Crop/zoom into specific regions of images.

- [ ] Parse `viewBox` attribute on Image elements: `viewBox="10% 10% 80% 80%"`
- [ ] Calculate source rectangle from percentages or pixels
- [ ] Implement PDF image transformation matrix for cropping
- [ ] Support both percentage and pixel values

**Complexity:** Medium  
**Estimated time:** 2 days

---

### 7. Layer Element
**Goal:** Enable stacking content with overlays.

- [ ] Add `<Layer>` element type to parser
- [ ] Implement as absolute-positioned container
- [ ] Support `background` for gradient overlays
- [ ] Render children in order (first = bottom, last = top)

**Complexity:** Low  
**Estimated time:** 1 day

---

### 8. backgroundImage on View
**Goal:** Views with background images.

- [ ] Parse `backgroundImage` attribute
- [ ] Parse `backgroundSize` (cover, contain, stretch)
- [ ] Parse `backgroundViewBox` for cropping
- [ ] Draw image before rendering children
- [ ] Apply clipping if `overflow: hidden`

**Complexity:** Medium  
**Estimated time:** 2 days

---

## 🟡 MEDIUM PRIORITY

### 9. PDF: radial-gradient
**Goal:** Radial gradient backgrounds.

- [ ] Parse CSS-style syntax: `radial-gradient(red, blue)`
- [ ] Implement PDF Shading Pattern Type 3 (Radial)
- [ ] Calculate center and radius from bounds

**Complexity:** Medium-High  
**Estimated time:** 2 days

---

### 10. PDF: shadow effects
**Goal:** Box shadows on elements.

- [ ] Parse `shadowRadius`, `shadowColor`, `shadowOffsetX`, `shadowOffsetY`
- [ ] Implement shadow simulation (no native PDF shadows)
- [ ] Option A: Draw blurred offset shapes
- [ ] Option B: Rasterize shadow as image

**Complexity:** High  
**Estimated time:** 3-4 days

---

### 11. Incremental PDF Rendering
**Goal:** Fast preview with only changed pages re-rendered.

- [ ] Implement page content hashing
- [ ] Detect changed pages on file save
- [ ] Render single page to PNG: `evg example.tsx --page=2 --format=png`
- [ ] WebSocket push updates to preview

**Complexity:** Medium  
**Estimated time:** 3 days

---

### 12. Live Preview Server
**Goal:** Hot-reload preview in browser.

- [ ] File watcher for TSX changes
- [ ] HTTP server for preview HTML
- [ ] WebSocket for live updates
- [ ] Font serving from assets

**Complexity:** Medium  
**Estimated time:** 2 days

---

## 🟢 LOW PRIORITY

### 13. Interactive elements (Web only)
- [ ] `<input>` text input element
- [ ] `<textarea>` multi-line input

---

### 14. VS Code Extension
- [ ] Preview panel in VS Code
- [ ] Side-by-side editing

---

### 15. Native macOS Preview App
- [ ] Swift wrapper around `evg` binary
- [ ] FSEvents file watching
- [ ] Per-page PNG cache

---

## 📊 Progress Summary

| Priority | Tasks | Completed | Remaining |
|----------|-------|-----------|-----------|
| 🔴 HIGHEST | 9 | 6 | 3 |
| 🟠 HIGH | 7 | 0 | 7 |
| 🟡 MEDIUM | 4 | 0 | 4 |
| 🟢 LOW | 3 | 0 | 3 |
| **TOTAL** | **23** | **6** | **17** |

---

## Quick Reference: Feature Status

### Currently Working ✅
- View, Label, Image, Path, Rect elements
- Flexbox layout (flex, justifyContent, alignItems, gap)
- Absolute positioning
- Margin, padding, border
- borderRadius, clipPath (circle, ellipse)
- TrueType fonts with Unicode
- JPEG with EXIF orientation
- Multi-page documents
- **HTML Renderer** (View, Label, Image, Path)
- **Base64 embedding** (images, fonts)
- **Font mapping** (Google Fonts: Amatic SC, Gloria Hallelujah, Josefin Slab, etc.)

### Defined but Not Working ⚠️
- `opacity` - parsed, not rendered
- `rotate` - defined, not parsed
- `scale` - defined, not parsed
- `overflow` - defined, not parsed
- `shadow*` - defined, not parsed

### Not Implemented ❌
- Linear/radial gradients (HTML & PDF)
- Image viewBox (crop/zoom)
- backgroundImage on View
- Layer element
- Incremental rendering
- Unit test framework
- Hot reload preview server

---

## Next Actions

### ✅ COMPLETED: HTML Renderer Phase 0.1-0.6
- Created `EVGHTMLRenderer.rgr` (~970 lines)
- Created `evg_html_tool.rgr` CLI tool
- Added `buffer_to_base64` to Lang.rgr
- Font embedding (TTF to base64)
- Image embedding (JPEG to base64)
- Fixed punctuation spacing in JSXToEVG.rgr

### 🔄 IN PROGRESS: HTML Renderer Phase 0.7-0.9
1. **Gradients and shadows** (0.7)
   - CSS `linear-gradient()` support
   - CSS `box-shadow` support

2. **Unit test framework** (0.8)
   - Vitest for JavaScript testing
   - Compare HTML output snapshots

3. **Preview server with hot reload** (0.9)
   - File watcher for TSX changes
   - WebSocket for live updates

### 📋 NEXT: PDF Improvements
1. **`overflow: hidden`** - Simple clipping rectangle
2. **`opacity`** - PDF ExtGState transparency
3. **`rotate` & `scale`** - PDF transformation matrix

---

*This TODO list is derived from PLAN_EVG.md. See that document for detailed implementation notes and architecture diagrams.*

---

## ⚠️ Implementation Guidelines

### Avoiding Circular References

When implementing EVG components, **avoid circular references** to ensure compatibility with languages like Rust that have strict ownership rules.

#### Problem: Parent-Child Circular References

```ranger
; BAD: Circular reference - child.parent = this
class EVGElement {
    def parent@(optional):EVGElement  ; Points to parent
    def children:[EVGElement]          ; Parent points to children
    
    fn addChild:void (child:EVGElement) {
        child.parent = this  ; ❌ Creates circular reference!
        push children child
    }
}
```

**Issues in Rust:**
- Cannot have `Rc<RefCell<T>>` with parent pointing to child and child pointing to parent
- Causes memory leaks (reference count never reaches 0)
- Requires `Weak<RefCell<T>>` for parent references

#### Solution 1: Weak References for Parent

```ranger
; GOOD: Use weak reference annotation for parent
class EVGElement {
    def parent@(optional weak):EVGElement  ; Weak reference - won't prevent deallocation
    def children:[EVGElement]               ; Strong references to children
    
    fn addChild:void (child:EVGElement) {
        child.parent = this  ; OK - parent is weak reference
        push children child
    }
}
```

**Rust translation:**
```rust
struct EVGElement {
    parent: Option<Weak<RefCell<EVGElement>>>,  // Weak reference
    children: Vec<Rc<RefCell<EVGElement>>>,     // Strong references
}
```

#### Solution 2: Index-Based Parent References

```ranger
; GOOD: Use index instead of direct reference
class EVGElement {
    def parentIndex:int -1           ; Index in element array, -1 = no parent
    def childIndices:[int]           ; Indices of children
}

class EVGDocument {
    def elements:[EVGElement]        ; Flat array of all elements
    
    fn getParent:EVGElement (el:EVGElement) {
        if (el.parentIndex < 0) {
            return null
        }
        return (itemAt elements el.parentIndex)
    }
}
```

#### Solution 3: Visitor Pattern (No Parent Reference Needed)

```ranger
; GOOD: Pass parent as parameter during traversal
class EVGRenderer {
    fn renderElement:void (el:EVGElement parent@(optional):EVGElement depth:int) {
        ; Parent available as parameter, not stored in element
        
        ; Render this element
        this.drawElement(el)
        
        ; Recurse to children
        def i:int 0
        while (i < (array_length el.children)) {
            def child:EVGElement (itemAt el.children i)
            this.renderElement(child el (depth + 1))  ; Pass current as parent
            i = i + 1
        }
    }
}
```

#### Solution 4: Separate Parent Map

```ranger
; GOOD: Store parent relationships in separate map
class EVGDocument {
    def root:EVGElement
    def parentMap:[string:EVGElement]  ; childId -> parent mapping
    
    fn setParent:void (child:EVGElement parent:EVGElement) {
        set parentMap child.id parent
    }
    
    fn getParent:EVGElement (child:EVGElement) {
        return (get parentMap child.id)
    }
}
```

### Guidelines for EVG Implementation

1. **Prefer Solution 1 (Weak References)** when parent access is frequently needed
2. **Prefer Solution 3 (Visitor Pattern)** for rendering/traversal operations
3. **Never store `this` in child** without weak reference annotation
4. **Document circular dependencies** in class comments

### Affected Files

When implementing new features, check these files for circular reference issues:

| File | Location | Current Issue | Recommended Fix |
|------|----------|---------------|-----------------|
| `EVGElement.rgr` | `gallery/evg/` | `parent` is direct reference | Add `@(weak)` annotation |
| `EVGLayout.rgr` | `gallery/evg/` | May store parent during layout | Use visitor pattern |
| `EVGPDFRenderer.rgr` | `gallery/pdf_writer/src/core/` | May store element refs | Use visitor pattern |
| `EVGHTMLRenderer.rgr` | `gallery/pdf_writer/src/core/` | NEW - avoid circular refs | Use visitor pattern |
| `JSXToEVG.rgr` | `gallery/pdf_writer/src/jsx/` | Builds element tree | Set parent with weak ref |

### Ranger Compiler Enhancement Needed

To fully support Rust output, the Ranger compiler should:

1. **Recognize `@(weak)` annotation** on reference types
2. **Generate `Weak<RefCell<T>>`** for weak references in Rust
3. **Generate `Rc<RefCell<T>>`** for strong references in Rust
4. **Warn about potential circular references** during compilation

```ranger
; Example of enhanced annotations
class Node {
    def parent@(optional weak):Node    ; -> Option<Weak<RefCell<Node>>>
    def children:[Node]                 ; -> Vec<Rc<RefCell<Node>>>
    def data:string                     ; -> String
}
```

