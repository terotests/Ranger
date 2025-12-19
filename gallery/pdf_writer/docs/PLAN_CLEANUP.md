# PDF Writer Folder Cleanup Plan

## Current Issues

The `gallery/pdf_writer` folder currently contains:

- 100+ files in the root directory
- Mixed source files (.rgr, .tsx, .js)
- Test files scattered throughout
- Compiled outputs mixed with source
- Sample images and PDFs in root
- Planning documents in root
- No clear separation of concerns

## Proposed Structure

```
gallery/pdf_writer/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.js
├── .gitignore
│
├── docs/                          # Documentation and planning
│   ├── PLAN_COMPONENTS.md
│   ├── PLAN_EVG_JSX.md
│   ├── PLAN_PDF_WRITER.md
│   └── JPEG_PLAN.md
│
├── src/                           # Source code (Ranger .rgr files)
│   ├── core/                      # Core PDF generation
│   │   ├── PDFWriter.rgr
│   │   ├── EVGPDFRenderer.rgr
│   │   └── Buffer.rgr
│   │
│   ├── layout/                    # Layout engine
│   │   ├── EVGElement.rgr (from ../evg/)
│   │   └── EVGLayout.rgr (from ../evg/)
│   │
│   ├── jsx/                       # JSX processing
│   │   ├── JSXToEVG.rgr
│   │   ├── ComponentEngine.rgr
│   │   └── EvalValue.rgr
│   │
│   ├── jpeg/                      # JPEG processing
│   │   ├── JPEGDecoder.rgr
│   │   ├── JPEGEncoder.rgr
│   │   ├── JPEGReader.rgr
│   │   ├── JPEGMetadata.rgr
│   │   ├── HuffmanDecoder.rgr
│   │   ├── DCT.rgr
│   │   ├── BitReader.rgr
│   │   ├── ImageBuffer.rgr
│   │   ├── ProgressiveJPEGDecoder.rgr
│   │   └── PPMImage.rgr
│   │
│   ├── fonts/                     # Font handling
│   │   ├── FontManager.rgr
│   │   └── TrueTypeFont.rgr
│   │
│   └── tools/                     # CLI tools
│       ├── evg_pdf_tool.rgr
│       ├── evg_component_tool.rgr
│       ├── jpeg_encoder_test.rgr
│       ├── jpeg_decoder_test.rgr
│       ├── jpeg_scaler.rgr
│       ├── progressive_jpeg_test.rgr
│       ├── font_test.rgr
│       ├── exif_orientation_test.rgr
│       ├── simple_test.rgr
│       ├── minimal_test.rgr
│       ├── test_import.rgr
│       ├── test_eval_value.rgr
│       └── eval_value_module.rgr
│
├── components/                    # Reusable TSX components
│   ├── Header.tsx
│   ├── ListItem.tsx
│   ├── Star.tsx
│   ├── Rating.tsx
│   └── ProductCard.tsx
│
├── examples/                      # Example TSX files
│   ├── test_simple.tsx
│   ├── test_fonts.tsx
│   ├── test_image.tsx
│   ├── test_layout.tsx
│   ├── test_multipage.tsx
│   ├── test_row.tsx
│   ├── test_imports.tsx
│   ├── test_component_simple.tsx
│   ├── test_catalog_complete.tsx
│   ├── product_catalog.tsx
│   └── evg_types.tsx             # Type definitions
│
├── test/                          # Unit tests
│   ├── eval_value.test.js
│   ├── expression_evaluator.test.js
│   └── jsx_to_evg.test.js
│
├── assets/                        # Static assets
│   ├── images/                    # Sample images
│   │   ├── Canon_40D.jpg
│   │   ├── Canon_40D_scaled.jpg
│   │   ├── Example.jpg
│   │   ├── Example_150.jpg
│   │   ├── Example_scaled.jpg
│   │   ├── GPS_test.jpg
│   │   ├── e2.jpg
│   │   ├── js_test.jpg
│   │   ├── test_canon.jpg
│   │   ├── test_debug.jpg
│   │   ├── test_encoded.jpg
│   │   ├── sample.png
│   │   ├── sample2.png
│   │   ├── sample_base_prog.png
│   │   ├── sample_prog.png
│   │   └── sample_prog_example.png
│   │
│   └── fonts/                     # TrueType fonts
│       ├── OpenSans-Regular.ttf
│       ├── OpenSans-Bold.ttf
│       ├── Cinzel-Regular.ttf
│       ├── (etc...)
│
├── output/                        # Generated files (gitignored)
│   ├── pdfs/
│   │   ├── hello_world.pdf
│   │   ├── multipage_test.pdf
│   │   ├── test_multipage.pdf
│   │   ├── test_output.pdf
│   │   ├── canon_with_metadata.pdf
│   │   ├── gps_with_metadata.pdf
│   │   └── output.pdf
│   │
│   └── images/
│       ├── orientation_1.ppm
│       ├── orientation_2.ppm
│       ├── (orientation_3-8.ppm...)
│       ├── orientation_corrected.ppm
│       ├── progressive_baseline_output.ppm
│       ├── progressive_example_output.ppm
│       └── progressive_example_output.png
│
└── bin/                           # Compiled JavaScript outputs
    ├── evg_pdf_tool.js
    ├── evg_component_tool.js
    ├── font_test.js
    ├── jpeg_encoder_test.js
    ├── jpeg_scaler.js
    ├── jpeg_scaler.go
    ├── jpeg_scaler.exe
    ├── progressive_jpeg_test.js
    ├── eval_value_module.cjs
    ├── IMG_6573.jpg              # Test image
    ├── test.jpg
    ├── test_good.jpg
    ├── test_output.jpg
    ├── catalog_complete.pdf      # Test outputs
    ├── catalog_output.pdf
    ├── catalog_test.pdf
    ├── component_output.pdf
    ├── component_test.pdf
    ├── import_test.pdf
    ├── sample_output.pdf
    ├── test_fonts_output.pdf
    ├── test_image_output.pdf
    ├── test_layout.pdf
    ├── test_row.pdf
    └── test_simple_output.pdf
```

## Path Resolution for Examples

**Important**: The structure keeps shared resources at the `pdf_writer/` level so examples can access them via relative paths:

```
pdf_writer/
├── components/       <- Shared TSX components
├── assets/
│   ├── fonts/       <- Shared fonts
│   └── images/      <- Shared images
└── examples/        <- Example TSX files
```

### From example files (`examples/test_gallery.tsx`):

**Component imports:**

```tsx
import Header from "../components/Header.tsx";
import { PhotoGrid } from "../components/PhotoLayouts.tsx";
```

**Image paths:**

```tsx
<Image src="../assets/images/photo1.jpg" />
```

### Font Resolution

Currently, fonts are resolved relative to the working directory (where you run `node`).
The tool has hardcoded `fontsDir = "./Fonts"`.

**Current structure (running from repo root):**

```
Ranger/                          <- Working directory
└── gallery/pdf_writer/
    └── Fonts/                   <- Tool expects ./Fonts - FAILS
```

**After migration - Option A: Absolute path in npm scripts (Recommended)**

Update `fontsDir` to accept a command-line argument or use full path from repo root:

```bash
# In package.json
"evgcomp:run": "node ./gallery/pdf_writer/bin/evg_component_tool.js --fonts=./gallery/pdf_writer/assets/fonts"
```

Or update the tool to compute fontsDir relative to the tool's own location.

**After migration - Option B: Update tool to use basePath**

Change `evg_component_tool.rgr` to resolve fonts relative to TSX file:

```ranger
; In initFonts, compute fontsDir relative to input file
; If input is examples/test.tsx, fontsDir = examples/../assets/fonts = assets/fonts
def inputDir:string (this.getDirectory(inputPath))
fontsDir = inputDir + "/../assets/fonts"
```

This way, from `examples/test_gallery.tsx`:

- Input dir: `examples/`
- Fonts dir: `examples/../assets/fonts` = `assets/fonts`

### Code Changes Required

1. **evg_component_tool.rgr**: Update `fontsDir` calculation
2. **evg_pdf_tool.rgr**: Same change
3. **font_test.rgr**: Update hardcoded paths
4. **FontManager.rgr**: No change (already uses `fontsDir` parameter)

## Migration Steps

### Phase 1: Create Directory Structure

```bash
mkdir -p src/core src/layout src/jsx src/jpeg src/fonts src/tools
mkdir -p docs examples output/pdfs output/images assets/images
```

### Phase 2: Move Documentation

```bash
mv PLAN_*.md docs/
mv JPEG_PLAN.md docs/
```

### Phase 3: Organize Source Files

#### Core PDF

```bash
mv PDFWriter.rgr src/core/
mv EVGPDFRenderer.rgr src/core/
mv Buffer.rgr src/core/
```

#### JSX Processing

```bash
mv JSXToEVG.rgr src/jsx/
mv ComponentEngine.rgr src/jsx/
mv EvalValue.rgr src/jsx/
```

#### JPEG Processing

```bash
mv JPEGDecoder.rgr src/jpeg/
mv JPEGEncoder.rgr src/jpeg/
mv JPEGReader.rgr src/jpeg/
mv JPEGMetadata.rgr src/jpeg/
mv HuffmanDecoder.rgr src/jpeg/
mv DCT.rgr src/jpeg/
mv BitReader.rgr src/jpeg/
mv ImageBuffer.rgr src/jpeg/
mv ProgressiveJPEGDecoder.rgr src/jpeg/
mv PPMImage.rgr src/jpeg/
```

#### Font Handling

```bash
mv FontManager.rgr src/fonts/
mv TrueTypeFont.rgr src/fonts/
```

#### Tools

```bash
mv evg_pdf_tool.rgr src/tools/
mv evg_component_tool.rgr src/tools/
mv jpeg_encoder_test.rgr src/tools/
mv jpeg_decoder_test.rgr src/tools/
mv jpeg_scaler.rgr src/tools/
mv progressive_jpeg_test.rgr src/tools/
mv font_test.rgr src/tools/
mv exif_orientation_test.rgr src/tools/
mv simple_test.rgr src/tools/
mv minimal_test.rgr src/tools/
mv test_import.rgr src/tools/
mv test_eval_value.rgr src/tools/
mv eval_value_module.rgr src/tools/
```

### Phase 4: Move Example Files

```bash
mv test_*.tsx examples/
mv product_catalog.tsx examples/
mv evg_types.tsx examples/
```

### Phase 5: Move Assets

```bash
mv *.jpg assets/images/
mv *.png assets/images/
# Keep fonts folder as assets/fonts (or move fonts/* to assets/fonts/)
```

### Phase 6: Move Output Files

```bash
mv *.pdf output/pdfs/
mv *.ppm output/images/
```

### Phase 7: Clean JavaScript Outputs

```bash
# These stay in bin/ but may need cleanup
# Remove: jpeg_decoder.js, jpeg_encoder.js, pdf_writer.js (old generated files)
rm bin/jpeg_decoder.js
rm bin/jpeg_encoder.js
rm bin/pdf_writer.js
```

### Phase 8: Update .gitignore

Add to `.gitignore`:

```
output/
bin/*.js
bin/*.exe
bin/*.pdf
bin/*.jpg
node_modules/
*.zip
```

### Phase 9: Update Import Paths

After moving files, update all `Import` statements in `.rgr` files to reflect new paths:

**Example changes:**

- `Import "JPEGDecoder.rgr"` → `Import "jpeg/JPEGDecoder.rgr"`
- `Import "EVGPDFRenderer.rgr"` → `Import "core/EVGPDFRenderer.rgr"`
- `Import "../evg/EVGElement.rgr"` → `Import "layout/EVGElement.rgr"`

**Tools to update:**

- All files in `src/tools/`
- Component engine imports
- Test files

### Phase 10: Update package.json Scripts

Update compilation scripts to use new paths:

```json
{
  "scripts": {
    "evgpdf:compile": "node ../../bin/output.js src/tools/evg_pdf_tool.rgr -l=es6 -o=bin/evg_pdf_tool.js",
    "evgcomp:compile": "node ../../bin/output.js src/tools/evg_component_tool.rgr -l=es6 -o=bin/evg_component_tool.js",
    "jpeg:encode": "node ../../bin/output.js src/tools/jpeg_encoder_test.rgr -l=es6 -o=bin/jpeg_encoder_test.js",
    "jpeg:scaler": "node ../../bin/output.js src/tools/jpeg_scaler.rgr -l=es6 -o=bin/jpeg_scaler.js",
    "progressive": "node ../../bin/output.js src/tools/progressive_jpeg_test.rgr -l=es6 -o=bin/progressive_jpeg_test.js",
    "font:compile": "node ../../bin/output.js src/tools/font_test.rgr -l=es6 -o=bin/font_test.js"
  }
}
```

### Phase 11: Update README.md

Update all file references in README.md to reflect new structure:

- Update file paths in "File Reference" section
- Update example commands to use new paths
- Add note about folder structure

## Benefits

1. **Clear Separation**: Source, examples, assets, and outputs are clearly separated
2. **Easier Navigation**: Related files grouped by functionality
3. **Better Git Management**: Output files properly ignored
4. **Cleaner Root**: Only essential config files in root
5. **Scalability**: Easy to add new modules or components
6. **Documentation**: All planning docs in one place
7. **Testing**: Test files clearly separated
8. **Assets**: Fonts and images organized separately

## Implementation Priority

1. **High Priority**: Create folders, move docs, move assets (non-breaking)
2. **Medium Priority**: Move source files, update imports (requires testing)
3. **Low Priority**: Clean up old generated files, optimize .gitignore

## Testing After Cleanup

### Understanding Ranger Compilation

Ranger uses the **Ranger compiler** (located in the root `bin/output.js`) to compile `.rgr` source files to target languages. The compilation process:

1. **Compiler Location**: `bin/output.js` at repository root
2. **Environment Variable**: `RANGER_LIB` sets the library path for imports
3. **Cross-platform**: Uses `cross-env` for Windows/Linux/Mac compatibility
4. **Target Language**: Specified with `-l=es6`, `-l=go`, `-l=rust`, etc.

### Compilation Command Structure

```bash
# General pattern from repository root
cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=<target> <source.rgr> -d=<output-dir> -o=<output-file> -nodecli

# Example for PDF writer (from repo root)
cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/evg_pdf_tool.rgr -d=./gallery/pdf_writer/bin -o=evg_pdf_tool.js -nodecli
```

**Flags:**

- `-l=es6` or `-es6`: Target JavaScript ES6
- `-l=go`: Target Go
- `-l=rust`: Target Rust
- `-l=swift6`: Target Swift 6
- `-nodecli`: Generate module instead of CLI wrapper
- `-nodemodule`: Generate Node.js module
- `-typescript`: Generate TypeScript (.ts) instead of JavaScript
- `-d=<dir>`: Output directory
- `-o=<file>`: Output filename

### Pre-Migration Testing Baseline

Before starting the cleanup, establish baseline functionality:

#### 1. Test Current EVG Component Tool

```bash
# From repository root
cd gallery/pdf_writer

# Compile component tool (current structure)
cross-env RANGER_LIB=../../compiler/Lang.rgr node ../../bin/output.js -es6 ./evg_component_tool.rgr -d=./bin -o=evg_component_tool.js -nodecli

# Run test
node ./bin/evg_component_tool.js ./test_imports.tsx ./bin/import_test.pdf

# Verify PDF was created
ls -l ./bin/import_test.pdf
```

#### 2. Test EVG PDF Tool (Non-Component)

```bash
# Compile
cross-env RANGER_LIB=../../compiler/Lang.rgr node ../../bin/output.js -es6 ./evg_pdf_tool.rgr -d=./bin -o=evg_pdf_tool.js -nodecli

# Run with example
node ./bin/evg_pdf_tool.js ./test_simple.tsx ./bin/test_simple_output.pdf
```

#### 3. Test JPEG Encoder

```bash
# Compile
cross-env RANGER_LIB=../../compiler/Lang.rgr node ../../bin/output.js -es6 ./jpeg_encoder_test.rgr -d=./bin -o=jpeg_encoder_test.js -nodecli

# Run
node ./bin/jpeg_encoder_test.js
```

#### 4. Test Progressive JPEG

```bash
# Compile
cross-env RANGER_LIB=../../compiler/Lang.rgr node ../../bin/output.js -es6 ./progressive_jpeg_test.rgr -d=./bin -o=progressive_jpeg_test.js -nodecli

# Run
node ./bin/progressive_jpeg_test.js
```

#### 5. Test Font Tool

```bash
# Compile
cross-env RANGER_LIB=../../compiler/Lang.rgr node ../../bin/output.js -es6 ./font_test.rgr -d=./bin -o=font_test.js -nodecli

# Run
node ./bin/font_test.js
```

### Post-Migration Testing with New Structure

After completing the migration, test with updated paths:

#### Updated package.json Scripts (from repo root)

Add these to root `package.json`:

```json
{
  "scripts": {
    "evgpdf:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/src/tools/evg_pdf_tool.rgr -d=./gallery/pdf_writer/bin -o=evg_pdf_tool.js -nodecli",
    "evgpdf:run": "node ./gallery/pdf_writer/bin/evg_pdf_tool.js",
    "evgcomp:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/src/tools/evg_component_tool.rgr -d=./gallery/pdf_writer/bin -o=evg_component_tool.js -nodecli",
    "evgcomp:run": "node ./gallery/pdf_writer/bin/evg_component_tool.js",
    "pdf:jpeg:encode": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/src/tools/jpeg_encoder_test.rgr -d=./gallery/pdf_writer/bin -o=jpeg_encoder_test.js -nodecli",
    "pdf:jpeg:scaler": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./gallery/pdf_writer/bin -o=jpeg_scaler.js -nodecli",
    "pdf:progressive": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/src/tools/progressive_jpeg_test.rgr -d=./gallery/pdf_writer/bin -o=progressive_jpeg_test.js -nodecli",
    "pdf:font:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/pdf_writer/src/tools/font_test.rgr -d=./gallery/pdf_writer/bin -o=font_test.js -nodecli",
    "pdf:evalvalue:module": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodemodule ./gallery/pdf_writer/src/tools/eval_value_module.rgr -d=./gallery/pdf_writer/bin -o=eval_value_module.cjs",
    "pdf:test": "npm run pdf:evalvalue:module && vitest run --config gallery/pdf_writer/vitest.config.js"
  }
}
```

#### 1. Test Component System (Primary Feature)

```bash
# From repository root
npm run evgcomp:compile

# Test with basic imports
node ./gallery/pdf_writer/bin/evg_component_tool.js \
  ./gallery/pdf_writer/examples/test_imports.tsx \
  ./gallery/pdf_writer/output/pdfs/import_test.pdf

# Test with product catalog (complex example)
node ./gallery/pdf_writer/bin/evg_component_tool.js \
  ./gallery/pdf_writer/examples/test_catalog_complete.tsx \
  ./gallery/pdf_writer/output/pdfs/catalog_test.pdf

# Verify PDFs exist and have reasonable file sizes (> 1KB)
ls -lh ./gallery/pdf_writer/output/pdfs/
```

#### 2. Test EVG PDF Tool (Non-Component)

```bash
npm run evgpdf:compile

# Test simple layout
node ./gallery/pdf_writer/bin/evg_pdf_tool.js \
  ./gallery/pdf_writer/examples/test_simple.tsx \
  ./gallery/pdf_writer/output/pdfs/simple_output.pdf

# Test fonts
node ./gallery/pdf_writer/bin/evg_pdf_tool.js \
  ./gallery/pdf_writer/examples/test_fonts.tsx \
  ./gallery/pdf_writer/output/pdfs/fonts_output.pdf

# Test images
node ./gallery/pdf_writer/bin/evg_pdf_tool.js \
  ./gallery/pdf_writer/examples/test_image.tsx \
  ./gallery/pdf_writer/output/pdfs/image_output.pdf

# Test multi-page
node ./gallery/pdf_writer/bin/evg_pdf_tool.js \
  ./gallery/pdf_writer/examples/test_multipage.tsx \
  ./gallery/pdf_writer/output/pdfs/multipage_output.pdf
```

#### 3. Test JPEG Processing

```bash
# Compile and run encoder test
npm run pdf:jpeg:encode
node ./gallery/pdf_writer/bin/jpeg_encoder_test.js

# Compile and run scaler
npm run pdf:jpeg:scaler
node ./gallery/pdf_writer/bin/jpeg_scaler.js

# Compile and test progressive JPEG
npm run pdf:progressive
node ./gallery/pdf_writer/bin/progressive_jpeg_test.js

# Verify output images exist
ls ./gallery/pdf_writer/output/images/*.ppm
```

#### 4. Test Font Handling

```bash
npm run pdf:font:compile
node ./gallery/pdf_writer/bin/font_test.js

# Should print font metrics and glyph information
```

#### 5. Test Expression Evaluator (Unit Tests)

```bash
npm run pdf:test

# Should run vitest tests for:
# - eval_value.test.js
# - expression_evaluator.test.js
# - jsx_to_evg.test.js
```

### Comprehensive Test Suite

Create a test script `gallery/pdf_writer/test_all.sh` (or `.bat` for Windows):

```bash
#!/bin/bash
# Test all PDF writer functionality after migration

echo "=== Testing PDF Writer Components ==="
set -e  # Exit on error

cd "$(dirname "$0")/../.."  # Go to repo root

echo ""
echo "1. Compiling EVG Component Tool..."
npm run evgcomp:compile

echo ""
echo "2. Testing Component System..."
node ./gallery/pdf_writer/bin/evg_component_tool.js \
  ./gallery/pdf_writer/examples/test_imports.tsx \
  ./gallery/pdf_writer/output/pdfs/test_imports.pdf

echo ""
echo "3. Compiling EVG PDF Tool..."
npm run evgpdf:compile

echo ""
echo "4. Testing Basic PDF Generation..."
node ./gallery/pdf_writer/bin/evg_pdf_tool.js \
  ./gallery/pdf_writer/examples/test_simple.tsx \
  ./gallery/pdf_writer/output/pdfs/test_simple.pdf

echo ""
echo "5. Testing JPEG Encoder..."
npm run pdf:jpeg:encode
node ./gallery/pdf_writer/bin/jpeg_encoder_test.js

echo ""
echo "6. Testing Font System..."
npm run pdf:font:compile
node ./gallery/pdf_writer/bin/font_test.js

echo ""
echo "7. Running Unit Tests..."
npm run pdf:test

echo ""
echo "=== All tests passed! ==="
echo ""
echo "Generated PDFs:"
ls -lh ./gallery/pdf_writer/output/pdfs/
```

### Verification Checklist

After migration, verify:

- [ ] All `.rgr` files compile without errors
- [ ] All generated PDFs open correctly in a PDF viewer
- [ ] Component imports work (test_imports.tsx)
- [ ] Font rendering works (test_fonts.tsx)
- [ ] Image embedding works (test_image.tsx)
- [ ] Multi-page documents work (test_multipage.tsx)
- [ ] Complex layouts work (test_catalog_complete.tsx)
- [ ] JPEG encoding/decoding produces valid images
- [ ] Unit tests pass
- [ ] No broken import paths in `.rgr` files
- [ ] README examples still work

### Common Issues & Solutions

**Issue**: `Error: Cannot find module`

- **Solution**: Check import paths in `.rgr` files match new structure
- Update `Import "JPEGDecoder.rgr"` → `Import "jpeg/JPEGDecoder.rgr"`

**Issue**: `RANGER_LIB not set`

- **Solution**: Use `cross-env` in npm scripts
- Ensure `cross-env` is installed: `npm install --save-dev cross-env`

**Issue**: Compilation errors about missing files

- **Solution**: Verify all dependent `.rgr` files exist at expected paths
- Check that `../evg/` files are copied to `src/layout/`

**Issue**: Generated PDFs are corrupt or empty

- **Solution**: Check that font files exist in `assets/fonts/`
- Verify image paths in examples point to `assets/images/`

### Manual Smoke Test

Open generated PDFs and verify:

1. Text renders correctly
2. Fonts are embedded (try copying text from PDF)
3. Images display with correct orientation
4. Multi-page documents have all pages
5. Layout matches expected output
6. No console errors during generation

## Notes

- Keep a backup before starting the migration
- Update imports incrementally and test after each major move
- Consider creating a migration script for automated file moving
- The `components/` folder already has good structure - keep as is
- Consider symlinks for frequently accessed assets during development
- May want to create a `src/index.rgr` or similar entry point file

## Future Improvements

- Create barrel exports for common imports
- Add a `types/` folder for TypeScript type definitions
- Consider splitting examples into `examples/basic/` and `examples/advanced/`
- Add `scripts/` folder for build/migration automation
- Create `docs/api/` for API documentation
