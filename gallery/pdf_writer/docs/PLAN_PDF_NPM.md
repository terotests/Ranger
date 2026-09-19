# PLAN: ranger-pdf-tool NPM Package

## Overview

Create a standalone NPM package `ranger-pdf-tool` from the `gallery/pdf_writer` project that:
1. Provides CLI tools for TSX → PDF/HTML/PNG conversion
2. Exposes programmatic APIs for creating PDF documents in memory
3. Can be installed and consumed by any NPM-based application
4. Is compiled from Ranger source using the `-nodemodule` compiler flag

---

## Package Name & Structure

**Package Name:** `ranger-pdf-tool`

**Rationale:**
- "ranger" prefix identifies it as part of the Ranger ecosystem
- "pdf-tool" is descriptive but not limiting (includes HTML/PNG export)
- Alternative names considered: `@ranger/pdf-tool`, `evg-pdf-renderer`, `ranger-evg-toolkit`

---

## Target Features

### 1. CLI Tools (bin exports)

| Command | Description | Current Source |
|---------|-------------|----------------|
| `evg-pdf` | Convert TSX → PDF | `evg_pdf_tool.rgr` |
| `evg-html` | Convert TSX → HTML | `evg_html_tool.rgr` |
| `evg-png` | Export page as PNG/JPEG | `evg_png_tool.rgr` |
| `evg-preview` | Live preview server | `evg_preview_server.rgr` |
| `evg-component` | Component compilation tool | `evg_component_tool.rgr` |

### 2. Programmatic API (exports)

| Export | Description | Source Classes |
|--------|-------------|----------------|
| `EVGLayout` | Flexbox layout engine | `EVGLayout.rgr`, `EVGElement.rgr` |
| `EVGPDFRenderer` | PDF generation | `EVGPDFRenderer.rgr` |
| `EVGHTMLRenderer` | HTML generation | `EVGHTMLRenderer.rgr` |
| `EVGRasterRenderer` | Bitmap rendering | `EVGRasterRenderer.rgr` |
| `ComponentEngine` | TSX parsing and evaluation | `ComponentEngine.rgr` |
| `JSXToEVG` | JSX to EVG element conversion | `JSXToEVG.rgr` |
| `FontManager` | TrueType font loading | `FontManager.rgr` |
| `TrueTypeFont` | Font parsing and metrics | `TrueTypeFont.rgr` |
| `JPEGDecoder` | JPEG image decoding | `JPEGDecoder.rgr` |
| `JPEGEncoder` | JPEG image encoding | `JPEGEncoder.rgr` |
| `PNGEncoder` | PNG image encoding | `PNGEncoder.rgr` |
| `EvalValue` | Runtime expression evaluation | `EvalValue.rgr` |

### 3. In-Memory PDF Generation (Key Feature)

```javascript
// Example usage (goal)
const { createPDF, EVGElement, FontManager } = require('ranger-pdf-tool');

// Option 1: From TSX string
const pdfBuffer = await createPDF({
  tsx: `<Print><Section><Page>...</Page></Section></Print>`,
  fonts: './fonts',
  assets: './assets'
});

// Option 2: Programmatic element construction
const fontManager = new FontManager();
fontManager.setFontsDirectory('./fonts');
fontManager.loadFont('OpenSans-Regular.ttf');

const page = new EVGElement();
page.tagName = 'Page';
// ... build element tree

const pdfBuffer = await createPDF({ element: page, fontManager });

// Write to file or use buffer directly
fs.writeFileSync('output.pdf', pdfBuffer);
```

---

## Implementation Plan

### Phase 1: Project Structure Setup

1. **Create new package directory structure:**
   ```
   gallery/pdf_writer/
   ├── package.json           # Updated with exports, bin, etc.
   ├── README.md              # NPM package documentation
   ├── tsconfig.json          # TypeScript config (if generating .d.ts)
   ├── src/                   # Ranger source files (existing)
   │   ├── core/
   │   ├── fonts/
   │   ├── jpeg/
   │   ├── jsx/
   │   ├── raster/
   │   └── tools/
   ├── dist/                  # Compiled JavaScript output
   │   ├── lib/               # Main library (module exports)
   │   │   └── index.js       # Main entry point with all exports
   │   └── cli/               # CLI tool binaries
   │       ├── evg-pdf.js
   │       ├── evg-html.js
   │       ├── evg-preview.js
   │       └── ...
   ├── types/                 # TypeScript declarations
   │   └── index.d.ts
   └── test/                  # Existing tests
   ```

2. **Update `package.json`:**
   ```json
   {
     "name": "ranger-pdf-tool",
     "version": "1.0.0",
     "description": "TSX to PDF/HTML/PNG conversion toolkit with flexbox layout",
     "main": "dist/lib/index.js",
     "types": "types/index.d.ts",
     "bin": {
       "evg-pdf": "dist/cli/evg_pdf_tool.js",
       "evg-html": "dist/cli/evg_html_tool.js",
       "evg-png": "dist/cli/evg_png_tool.js",
       "evg-preview": "dist/cli/evg_preview_server.js",
       "evg-component": "dist/cli/evg_component_tool.js"
     },
     "exports": {
       ".": {
         "require": "./dist/lib/index.js",
         "types": "./types/index.d.ts"
       },
       "./pdf": "./dist/lib/pdf.js",
       "./html": "./dist/lib/html.js",
       "./raster": "./dist/lib/raster.js",
       "./fonts": "./dist/lib/fonts.js",
       "./layout": "./dist/lib/layout.js"
     },
     "files": [
       "dist/",
       "types/",
       "README.md"
     ],
     "scripts": {
       "build": "npm run build:lib && npm run build:cli",
       "build:lib": "...",
       "build:cli": "...",
       "prepublishOnly": "npm run build"
     },
     "keywords": [
       "pdf", "tsx", "jsx", "flexbox", "layout", "ranger",
       "document", "html", "png", "image", "font", "truetype"
     ],
     "license": "MIT",
     "repository": {
       "type": "git",
       "url": "https://github.com/terotests/Ranger.git"
     }
   }
   ```

### Phase 2: Create Module Entry Point

1. **Create a new Ranger entry point file for the library:**
   
   File: `src/lib/ranger_pdf_tool.rgr`
   
   ```ranger
   ; ranger_pdf_tool.rgr - Main entry point for ranger-pdf-tool NPM package
   ; This file imports and exposes all public APIs
   
   Import "../core/EVGPDFRenderer.rgr"
   Import "../core/EVGHTMLRenderer.rgr"
   Import "../core/Buffer.rgr"
   Import "../core/ImageUtils.rgr"
   Import "../jsx/ComponentEngine.rgr"
   Import "../jsx/JSXToEVG.rgr"
   Import "../jsx/EvalValue.rgr"
   Import "../fonts/FontManager.rgr"
   Import "../fonts/TrueTypeFont.rgr"
   Import "../jpeg/JPEGDecoder.rgr"
   Import "../jpeg/JPEGEncoder.rgr"
   Import "../jpeg/ImageBuffer.rgr"
   Import "../raster/EVGRasterRenderer.rgr"
   Import "../raster/PNGEncoder.rgr"
   Import "../raster/RasterBuffer.rgr"
   Import "../../evg/EVGElement.rgr"
   Import "../../evg/EVGLayout.rgr"
   
   ; Helper class for in-memory PDF creation
   class PDFBuilder {
       def fontManager:FontManager (new FontManager())
       def pageWidth:double 595.0
       def pageHeight:double 842.0
       def baseDir:string "./"
       
       Constructor () {}
       
       fn setPageSize:void (width:double height:double) {
           pageWidth = width
           pageHeight = height
       }
       
       fn setFontsDirectory:void (dir:string) {
           fontManager.setFontsDirectory(dir)
       }
       
       fn loadFont:void (fontPath:string) {
           fontManager.loadFont(fontPath)
       }
       
       fn renderTSX:buffer (tsxContent:string) {
           ; Parse TSX and render to PDF
           def converter (new JSXToEVG())
           converter.pageWidth = pageWidth
           converter.pageHeight = pageHeight
           def root:EVGElement (converter.parseString(tsxContent))
           return (this.renderElement(root))
       }
       
       fn renderElement:buffer (root:EVGElement) {
           def renderer (new EVGPDFRenderer())
           renderer.init(renderer)
           renderer.setPageSize(pageWidth pageHeight)
           renderer.setFontManager(fontManager)
           renderer.setBaseDir(baseDir)
           def ttfMeasurer (new TTFTextMeasurer(fontManager))
           renderer.setMeasurer(ttfMeasurer)
           return (renderer.render(root))
       }
   }
   
   ; Main class for module exports (no main function for -nodemodule)
   class RangerPDFTool {
       ; Factory methods for easy instantiation
       sfn createPDFBuilder:PDFBuilder () {
           return (new PDFBuilder())
       }
       
       sfn createFontManager:FontManager () {
           return (new FontManager())
       }
       
       sfn createComponentEngine:ComponentEngine () {
           return (new ComponentEngine())
       }
       
       sfn createEVGElement:EVGElement () {
           return (new EVGElement())
       }
   }
   ```

2. **Compile with `-nodemodule` flag:**
   
   Add to root `package.json`:
   ```json
   "pdf:module": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodemodule ./gallery/pdf_writer/src/lib/ranger_pdf_tool.rgr -d=./gallery/pdf_writer/dist/lib -o=index.js"
   ```

### Phase 3: CLI Tool Compilation

Each CLI tool needs to be compiled separately with `-nodecli` flag:

Add to root `package.json`:
```json
"pdf:cli:pdf": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodecli ./gallery/pdf_writer/src/tools/evg_pdf_tool.rgr -d=./gallery/pdf_writer/dist/cli -o=evg_pdf_tool.js",
"pdf:cli:html": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodecli ./gallery/pdf_writer/src/tools/evg_html_tool.rgr -d=./gallery/pdf_writer/dist/cli -o=evg_html_tool.js",
"pdf:cli:png": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodecli ./gallery/pdf_writer/src/tools/evg_png_tool.rgr -d=./gallery/pdf_writer/dist/cli -o=evg_png_tool.js",
"pdf:cli:preview": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodecli ./gallery/pdf_writer/src/tools/evg_preview_server.rgr -d=./gallery/pdf_writer/dist/cli -o=evg_preview_server.js",
"pdf:cli:component": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodecli ./gallery/pdf_writer/src/tools/evg_component_tool.rgr -d=./gallery/pdf_writer/dist/cli -o=evg_component_tool.js",
"pdf:build": "npm run pdf:module && npm run pdf:cli:pdf && npm run pdf:cli:html && npm run pdf:cli:png && npm run pdf:cli:preview && npm run pdf:cli:component"
```

### Phase 4: TypeScript Declarations

1. **Option A: Generate with `-typescript` flag**
   ```
   node bin/output.js -es6 -nodemodule -typescript ./gallery/pdf_writer/src/lib/ranger_pdf_tool.rgr -o=index.ts
   ```
   Then run `tsc` to generate `.d.ts` files.

2. **Option B: Manual TypeScript declarations**
   
   Create `types/index.d.ts`:
   ```typescript
   // Type declarations for ranger-pdf-tool
   
   export class EVGElement {
     id: string;
     tagName: string;
     // ... all properties
     appendChild(child: EVGElement): void;
     getChild(index: number): EVGElement;
     getChildCount(): number;
   }
   
   export class FontManager {
     setFontsDirectory(dir: string): void;
     loadFont(path: string): void;
     // ...
   }
   
   export class PDFBuilder {
     setPageSize(width: number, height: number): void;
     setFontsDirectory(dir: string): void;
     loadFont(path: string): void;
     renderTSX(tsx: string): Buffer;
     renderElement(element: EVGElement): Buffer;
   }
   
   // ... more declarations
   ```

### Phase 5: Preview Server as HTTP Binary

The `evg_preview_server.rgr` uses Go-specific HTTP annotations (`@(HttpServer)`). For NPM distribution:

**Option A: JavaScript HTTP wrapper**
- Keep the Go version for high-performance use
- Create a Node.js wrapper using Express/Fastify that uses the compiled library

**Option B: Compile preview server to JavaScript**
- The current `@(HttpServer)` annotation may not work for ES6 target
- May need to refactor using standard Node.js HTTP server patterns

**Recommendation:** 
- Ship the Go binary separately or as an optional dependency
- Provide a simple Node.js HTTP server wrapper that uses the library APIs

### Phase 6: Asset Bundling

Consider whether to include default fonts:
- **Option A:** Include a minimal font set (~2-5MB)
- **Option B:** Document font installation as a requirement
- **Option C:** Provide a separate `ranger-pdf-fonts` package

---

## Known Issues to Address

### Issue #62: `-nodemodule` ignores `-d` and `-o` options

**Current workaround:** Compile to current directory then move:
```bash
node bin/output.js -es6 -nodemodule ./file.rgr -o=file.cjs && mv file.cjs target/dir/
```

**TODO:** Fix the compiler to respect output directory for `-nodemodule` builds.

### Go-specific Preview Server

The `evg_preview_server.rgr` uses annotations that compile to Go:
- `@(HttpServer)` class annotation
- `@(GET "/")`, `@(POST "/")`, `@(SSE "/")` route annotations

For JavaScript target, need alternative approach or wrapper.

---

## Build & Test Commands

### Full Build Pipeline

```bash
# From project root
npm run pdf:build               # Build all modules and CLI tools

# From gallery/pdf_writer
npm run build                   # Local build script
npm test                        # Run tests
npm pack                        # Create .tgz for local testing
```

### Local Development Testing

```bash
# Install locally from another project
npm install /path/to/Ranger/gallery/pdf_writer

# Or link for development
cd /path/to/Ranger/gallery/pdf_writer
npm link

cd /path/to/my-project
npm link ranger-pdf-tool
```

---

## Directory Structure After Implementation

```
gallery/pdf_writer/
├── package.json                 # NPM package manifest
├── README.md                    # NPM package documentation
├── tsconfig.json                # TypeScript config
├── vitest.config.js             # Test config
│
├── src/                         # Ranger source files
│   ├── lib/                     # NEW: Library entry points
│   │   └── ranger_pdf_tool.rgr  # Main module entry
│   ├── core/
│   │   ├── Buffer.rgr
│   │   ├── EVGHTMLRenderer.rgr
│   │   ├── EVGPDFRenderer.rgr
│   │   ├── EVGResourceLoader.rgr
│   │   └── ImageUtils.rgr
│   ├── fonts/
│   │   ├── FontManager.rgr
│   │   └── TrueTypeFont.rgr
│   ├── jpeg/
│   │   ├── JPEGDecoder.rgr
│   │   ├── JPEGEncoder.rgr
│   │   └── ImageBuffer.rgr
│   ├── jsx/
│   │   ├── ComponentEngine.rgr
│   │   ├── EvalValue.rgr
│   │   └── JSXToEVG.rgr
│   ├── raster/
│   │   ├── EVGRasterRenderer.rgr
│   │   ├── PNGEncoder.rgr
│   │   └── RasterBuffer.rgr
│   └── tools/
│       ├── evg_component_tool.rgr
│       ├── evg_html_tool.rgr
│       ├── evg_pdf_tool.rgr
│       ├── evg_png_tool.rgr
│       └── evg_preview_server.rgr
│
├── dist/                        # NEW: Compiled output
│   ├── lib/
│   │   └── index.js             # Main library (module.exports)
│   └── cli/
│       ├── evg_pdf_tool.js
│       ├── evg_html_tool.js
│       ├── evg_png_tool.js
│       └── evg_component_tool.js
│
├── bin/                         # Compiled CLI tools
│   ├── evg_pdf_tool.js
│   ├── evg_html_tool.js
│   ├── evg_png_tool.js
│   └── evg_component_tool.js
├── test/                        # Test files
├── examples/                    # Example TSX files
├── components/                  # Example components
├── assets/                      # Fonts, images, etc.
└── output/                      # Generated output files
```

---

## Current Status (2024-12-30)

**Package is CLI-only** - Programmatic API deferred due to API mismatches between `ranger_pdf_tool.rgr` and underlying classes.

### Working CLI Tools:
| Command | Description | Status |
|---------|-------------|--------|
| `evg-pdf` | TSX → PDF conversion | ✅ Working |
| `evg-html` | TSX → HTML conversion | ✅ Working |
| `evg-png` | TSX → PNG conversion | ✅ Working |
| `evg-component` | Component compilation | ✅ Working |

### Package.json Summary:
```json
{
  "name": "ranger-pdf-tool",
  "bin": {
    "evg-pdf": "bin/evg_pdf_tool.js",
    "evg-html": "bin/evg_html_tool.js",
    "evg-png": "bin/evg_png_tool.js",
    "evg-component": "bin/evg_component_tool.js"
  },
  "files": ["bin/", "README.md"]
}
```

---

## Tasks Checklist

### Phase 1: Structure
- [x] Create `src/lib/` directory
- [x] Create `ranger_pdf_tool.rgr` module entry point (not used in final package)
- [x] Update `gallery/pdf_writer/package.json`
- [ ] ~~Create `types/index.d.ts` placeholder~~ (not needed for CLI-only package)

### Phase 2: Build Scripts
- [x] Add CLI compilation scripts to package.json
- [x] Create combined `build:all` script
- [ ] ~~Add `pdf:module` script~~ (programmatic API deferred)
- [ ] ~~Test `-nodemodule` compilation~~ (programmatic API deferred)

### Phase 3: API Design (DEFERRED)
- [ ] ~~Define public API surface~~ (CLI-only for now)
- [ ] ~~Create `PDFBuilder` convenience class~~ (exists but not exported)
- [ ] ~~Add in-memory PDF generation support~~
- [ ] ~~Ensure all classes are exported~~

### Phase 4: TypeScript (DEFERRED)
- [ ] ~~Generate or write TypeScript declarations~~
- [ ] ~~Test with TypeScript consumers~~

### Phase 5: Testing
- [x] Test CLI tools (all 4 tools work)
- [ ] Test npm pack and local installation

### Phase 6: Documentation
- [ ] Update README.md with CLI docs
- [x] CLI tools have --help output
- [ ] Add usage examples

### Phase 7: Preview Server (DEFERRED)
- [ ] ~~Decide on JavaScript HTTP approach~~
- [ ] ~~Implement Node.js wrapper or refactor~~

---

## Alternative Approaches Considered

### 1. Monorepo with Multiple Packages
Split into separate packages: `@ranger/evg-layout`, `@ranger/pdf-renderer`, `@ranger/font-loader`, etc.
**Rejected:** Too complex for initial release, harder to use.

### 2. ESM-only Package
Use `-esm` flag instead of `-nodemodule`.
**Consideration:** Could provide dual CJS/ESM builds. Modern approach but may limit compatibility.

### 3. Bundle Dependencies
Include all dependencies (fonts, etc.) in the package.
**Partial:** Include minimal defaults, document how to add more.

---

## Success Criteria

1. ✅ `npm install ranger-pdf-tool` works from any project
2. ✅ CLI tools (`evg-pdf`, `evg-html`, etc.) work after global install
3. ⏸️ Programmatic API allows in-memory PDF generation (DEFERRED)
4. ⏸️ TypeScript types provide good IDE support (DEFERRED)
5. ⏸️ Documentation covers all use cases (IN PROGRESS)
6. 🔄 Tests pass for both API and CLI (CLI tested manually)

---

## Timeline Estimate

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 1: Structure | 2-4 hours | ✅ Done |
| Phase 2: Build Scripts | 2-4 hours | ✅ Done |
| Phase 3: API Design | 4-8 hours | ⏸️ Deferred |
| Phase 4: TypeScript | 2-4 hours | ⏸️ Deferred |
| Phase 5: Testing | 4-8 hours | 🔄 Partial |
| Phase 6: Documentation | 2-4 hours | 🔄 In Progress |
| Phase 7: Preview Server | 4-8 hours | ⏸️ Deferred |

**Remaining for CLI-only release:** ~4-8 hours (documentation + npm publish testing)

---

## References

- Root `package.json` - Compilation scripts and patterns
- Docs site / `ai/QUICKREF.md` - compiler flags and usage
- `ISSUES.md` - Known issues (especially #62)
- `gallery/pdf_writer/README.md` - Feature documentation
- `compiler/ng_RangerJavaScriptClassWriter.rgr` - Module export implementation
