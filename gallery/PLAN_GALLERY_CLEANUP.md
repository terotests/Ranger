# Gallery Projects Cleanup Plan

## Overview

The `gallery/` folder contains multiple demonstration projects showcasing Ranger's cross-compilation capabilities. Currently, these projects have inconsistent organization with compiled outputs mixed with source files. This plan standardizes the structure across all gallery projects.

## Current Gallery Projects

1. **invaders** - Space Invaders game (cross-platform)
2. **js_parser** - JavaScript ES6+ parser and pretty-printer
3. **ts_parser** - TypeScript/JSX parser
4. **zip** - ZIP archive reader/writer with DEFLATE support
5. **evg** - Element layout engine (flexbox-like)
6. **pdf_writer** - PDF generation with TSX support (see separate PLAN_CLEANUP.md)

## Common Issues Across Projects

- ✗ Compiled outputs (.js, .cpp, .rs, .go, .swift, .kt, .py) mixed with source (.rgr)
- ✗ Binary executables (.exe, etc.) in project root
- ✗ Test files scattered in root directory
- ✗ Multiple language outputs clutter the directory
- ✗ No clear separation between source, output, and documentation
- ✗ Inconsistent folder structure between projects

## Standardized Structure

Each gallery project should follow this structure:

```
gallery/<project>/
├── README.md              # Project-specific documentation
├── .gitignore            # Ignore compiled outputs
├── package.json          # If Node.js dependencies needed
│
├── docs/                 # Documentation and plans
│   ├── PLAN_*.md
│   ├── TODO.md
│   ├── ISSUES.md
│   └── COMPLIANCE.md
│
├── src/                  # Source .rgr files
│   ├── <main>.rgr
│   └── <modules>.rgr
│
├── test/                 # Test files
│   ├── test_*.js
│   └── *.test.js
│
├── bin/                  # Compiled outputs
│   ├── js/              # JavaScript outputs
│   ├── go/              # Go outputs
│   ├── rust/            # Rust outputs
│   ├── swift/           # Swift outputs
│   ├── cpp/             # C++ outputs
│   ├── kotlin/          # Kotlin outputs
│   └── python/          # Python outputs
│
└── benchmark/           # Performance benchmarks (if applicable)
    └── ...
```

---

## Project-Specific Plans

### 1. Invaders (Space Invaders Game)

#### Current Structure Issues

- All compiled outputs in root (invaders.js, invaders.rs, invaders.cpp, etc.)
- Multiple executables (invaders_rust.exe, invaders_go.exe, etc.)
- Support files (variant.hpp) in root

#### Proposed Structure

```
gallery/invaders/
├── README.md
├── .gitignore
│
├── src/
│   └── invaders.rgr
│
└── bin/
    ├── js/
    │   └── invaders.js
    ├── go/
    │   ├── invaders.go
    │   └── invaders_go.exe
    ├── rust/
    │   ├── invaders.rs
    │   ├── invaders_rust.exe
    │   └── invaders_rust.pdb
    ├── swift/
    │   ├── invaders.swift
    │   ├── invaders_swift.exe
    │   ├── invaders_swift.lib
    │   └── invaders_swift.exp
    ├── cpp/
    │   ├── invaders.cpp
    │   ├── invaders_cpp.exe
    │   └── variant.hpp
    ├── kotlin/
    │   ├── invaders.kt
    │   └── invaders.jar
    └── python/
        └── invaders.py
```

#### Migration Commands

```bash
cd gallery/invaders

# Create structure
mkdir -p src bin/js bin/go bin/rust bin/swift bin/cpp bin/kotlin bin/python

# Move source
mv invaders.rgr src/

# Move JavaScript
mv invaders.js bin/js/

# Move Go
mv invaders.go invaders_go.exe bin/go/

# Move Rust
mv invaders.rs invaders_rust.exe invaders_rust.pdb bin/rust/

# Move Swift
mv invaders.swift invaders_swift.exe invaders_swift.* bin/swift/

# Move C++
mv invaders.cpp invaders_cpp* variant.hpp bin/cpp/

# Move Kotlin
mv invaders.kt invaders.jar bin/kotlin/

# Move Python
mv invaders.py bin/python/
```

#### Updated Scripts (root package.json)

```json
{
  "game:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -es6 ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/js -o=invaders.js -nodecli",
  "game:compile:rust": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -l=rust ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/rust -o=invaders.rs -nodecli",
  "game:compile:go": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -l=go ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/go -o=invaders.go -nodecli",
  "game:compile:swift": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -l=swift6 ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/swift -o=invaders.swift -nodecli",
  "game:compile:cpp": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -l=cpp ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/cpp -o=invaders.cpp -nodecli",
  "game:compile:kotlin": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -l=kotlin ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/kotlin -o=invaders.kt -nodecli",
  "game:compile:python": "cross-env RANGER_LIB=./compiler/Lang.rgr;./lib/stdops.rgr node bin/output.js -l=python ./gallery/invaders/src/invaders.rgr -d=./gallery/invaders/bin/python -o=invaders.py -nodecli",
  "game:build:rust": "npm run game:compile:rust && rustc gallery/invaders/bin/rust/invaders.rs -o gallery/invaders/bin/rust/invaders_rust.exe",
  "game:build:go": "npm run game:compile:go && cd gallery/invaders/bin/go && go build -o invaders_go.exe invaders.go",
  "game:build:swift": "npm run game:compile:swift && swiftc -parse-as-library gallery/invaders/bin/swift/invaders.swift -o gallery/invaders/bin/swift/invaders_swift.exe",
  "game:build:cpp": "npm run game:compile:cpp && g++ -std=c++17 -pthread gallery/invaders/bin/cpp/invaders.cpp -o gallery/invaders/bin/cpp/invaders_cpp.exe",
  "game:build:kotlin": "npm run game:compile:kotlin && kotlinc gallery/invaders/bin/kotlin/invaders.kt -include-runtime -d gallery/invaders/bin/kotlin/invaders.jar",
  "game:run": "node ./gallery/invaders/bin/js/invaders.js",
  "game:run:rust": "./gallery/invaders/bin/rust/invaders_rust.exe",
  "game:run:go": "./gallery/invaders/bin/go/invaders_go.exe",
  "game:run:swift": "./gallery/invaders/bin/swift/invaders_swift.exe",
  "game:run:cpp": "./gallery/invaders/bin/cpp/invaders_cpp.exe",
  "game:run:kotlin": "java -jar ./gallery/invaders/bin/kotlin/invaders.jar"
}
```

---

### 2. JS Parser (JavaScript ES6+ Parser)

#### Current Structure Issues

- Source files mixed with compiled outputs (js_parser.js, js_parser.rs, etc.)
- Test files in root (test.js, simple.js, test_output.js, etc.)
- Multiple documentation files in root (PERFORMANCE.md, RUST_TODO.md, SWIFT_TODO.md)
- Compiled executables scattered (js_parser_rust.exe, js_parser_cpp.exe, etc.)

#### Proposed Structure

```
gallery/js_parser/
├── README.md
├── .gitignore
│
├── docs/
│   ├── PERFORMANCE.md
│   ├── RUST_TODO.md
│   └── SWIFT_TODO.md
│
├── src/
│   ├── js_parser_main.rgr
│   ├── js_parser_core.rgr
│   ├── js_parser_simple.rgr
│   ├── js_lexer.rgr
│   ├── js_ast.rgr
│   ├── js_token.rgr
│   └── js_printer.rgr
│
├── test/
│   ├── test.js
│   ├── simple.js
│   ├── simple2.js
│   ├── simple_test.js
│   ├── test_simple.js
│   ├── test_comments.js
│   ├── test_es_modules.js
│   ├── test_input.js
│   ├── test_output.js
│   ├── test_output2.js
│   └── temp_test.js
│
├── bin/
│   ├── js/
│   │   ├── js_parser.js
│   │   └── js_parser_module.js
│   ├── cpp/
│   │   ├── js_parser.cpp
│   │   ├── js_parser_cpp.exe
│   │   ├── js_parser_cpp_wsl.exe
│   │   ├── variant.hpp
│   │   └── output_cpp.js
│   ├── rust/
│   │   ├── js_parser.rs
│   │   ├── js_parser_rust.exe
│   │   ├── js_parser_rust.pdb
│   │   ├── js_parser_rust_release.exe
│   │   └── output_rust.js
│   ├── swift/
│   │   ├── js_parser.swift
│   │   ├── js_parser_fixed.swift
│   │   ├── js_parser_swift.exe
│   │   ├── js_parser_swift_debug
│   │   ├── output_swift.js
│   │   └── test_lexer*
│   └── go/
│       └── js_parser.go
│
└── benchmark/
    └── (existing benchmark files)
```

#### Migration Commands

```bash
cd gallery/js_parser

# Create structure
mkdir -p src docs test bin/js bin/cpp bin/rust bin/swift bin/go

# Move documentation
mv PERFORMANCE.md RUST_TODO.md SWIFT_TODO.md docs/

# Move source files
mv js_parser_main.rgr js_parser_core.rgr js_parser_simple.rgr src/
mv js_lexer.rgr js_ast.rgr js_token.rgr js_printer.rgr src/
mv test_lexer.rgr src/

# Move test files
mv test*.js simple*.js temp_test.js test/

# Move JavaScript outputs
mv js_parser.js js_parser_module.js bin/js/

# Move C++ outputs
mv js_parser.cpp js_parser_cpp* variant.hpp output_cpp.js bin/cpp/
mv js_parser.obj bin/cpp/ 2>/dev/null || true

# Move Rust outputs
mv js_parser.rs js_parser_rust* output_rust.js bin/rust/

# Move Swift outputs
mv js_parser*.swift test_lexer* output_swift.js bin/swift/

# Move Go outputs
mv js_parser*.go bin/go/ 2>/dev/null || true
```

#### Updated Scripts (root package.json)

```json
{
  "jsparser:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/js_parser/src/js_parser_main.rgr -d=./gallery/js_parser/bin/js -o=js_parser.js -nodecli",
  "jsparser:compile:cpp": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=cpp ./gallery/js_parser/src/js_parser_main.rgr -d=./gallery/js_parser/bin/cpp -o=js_parser.cpp -nodecli",
  "jsparser:compile:swift": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=swift6 ./gallery/js_parser/src/js_parser_main.rgr -d=./gallery/js_parser/bin/swift -o=js_parser.swift -nodecli",
  "jsparser:compile:go": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./gallery/js_parser/src/js_parser_main.rgr -d=./gallery/js_parser/bin/go -o=js_parser.go -nodecli",
  "jsparser:compile:rust": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=rust ./gallery/js_parser/src/js_parser_main.rgr -d=./gallery/js_parser/bin/rust -o=js_parser.rs -nodecli",
  "jsparser:module": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodemodule ./gallery/js_parser/src/js_parser_main.rgr -d=./gallery/js_parser/benchmark -o=js_parser_module.cjs",
  "jsparser:build:rust": "npm run jsparser:compile:rust && rustc -O gallery/js_parser/bin/rust/js_parser.rs -o gallery/js_parser/bin/rust/js_parser_rust.exe",
  "jsparser:build:cpp": "wsl x86_64-w64-mingw32-g++-posix -std=c++17 -static -O3 gallery/js_parser/bin/cpp/js_parser.cpp -o gallery/js_parser/bin/cpp/js_parser_cpp.exe",
  "jsparser:build:swift": "swiftc -O -parse-as-library gallery/js_parser/bin/swift/js_parser.swift -o gallery/js_parser/bin/swift/js_parser_swift.exe",
  "jsparser:run": "node ./gallery/js_parser/bin/js/js_parser.js",
  "jsparser:test": "node ./gallery/js_parser/bin/js/js_parser.js ./gallery/js_parser/test/test.js"
}
```

---

### 3. TS Parser (TypeScript/JSX Parser)

#### Current Structure Issues

- Source and compiled files mixed in root
- Multiple todo/compliance docs in root
- Test files scattered
- Node_modules present but no clear organization

#### Proposed Structure

```
gallery/ts_parser/
├── README.md
├── .gitignore
├── package.json
├── package-lock.json
├── vitest.config.js
│
├── docs/
│   ├── TODO.md
│   ├── ISSUES.md
│   └── COMPLIANCE.md
│
├── src/
│   ├── ts_parser_main.rgr
│   ├── ts_parser_impl.rgr
│   ├── ts_parser_simple.rgr
│   ├── ts_lexer.rgr
│   ├── ts_lexer_main.rgr
│   ├── ts_ast.rgr
│   └── ts_token.rgr
│
├── test/
│   ├── test_jsx.js
│   ├── _test.js
│   └── _test.cjs
│
├── bin/
│   ├── js/
│   │   ├── ts_parser_main.js
│   │   ├── ts_lexer_main.js
│   │   └── output.js
│   ├── cpp/
│   │   ├── ts_parser_main.cpp
│   │   ├── ts_parser_cpp.exe
│   │   └── variant.hpp
│   ├── rust/
│   │   ├── ts_parser_main.rs
│   │   ├── ts_parser_rust.exe
│   │   └── ts_parser_rust.pdb
│   ├── swift/
│   │   ├── ts_parser_main.swift
│   │   └── (outputs)
│   └── go/
│       ├── ts_parser_main.go
│       └── ts_parser_go.exe
│
└── benchmark/
    └── (existing benchmark files)
```

#### Migration Commands

```bash
cd gallery/ts_parser

# Create structure
mkdir -p src docs test bin/js bin/cpp bin/rust bin/swift bin/go

# Move documentation
mv TODO.md ISSUES.md COMPLIANCE.md docs/

# Move source files
mv ts_parser_main.rgr ts_parser_impl.rgr ts_parser_simple.rgr src/
mv ts_lexer.rgr ts_lexer_main.rgr ts_ast.rgr ts_token.rgr src/

# Move test files
mv test_jsx.js _test.js _test.cjs test/

# Move JavaScript outputs
mv ts_parser_main.js ts_lexer_main.js bin/js/
mv bin/output.js bin/js/ 2>/dev/null || true

# Move C++ outputs
mv bin/ts_parser_main.cpp bin/ts_parser_cpp.exe bin/variant.hpp bin/cpp/

# Move Rust outputs
mv bin/ts_parser_main.rs bin/ts_parser_rust.exe bin/ts_parser_rust.pdb bin/rust/

# Move Swift outputs
mv bin/ts_parser_main.swift bin/swift/

# Move Go outputs
mv bin/ts_parser_main.go bin/ts_parser_go.exe bin/go/
```

#### Updated Scripts (root package.json)

```json
{
  "tsparser:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/ts_parser/src/ts_parser_main.rgr -d=./gallery/ts_parser/bin/js -o=ts_parser_main.js -nodecli",
  "tsparser:compile:rust": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=rust ./gallery/ts_parser/src/ts_parser_main.rgr -d=./gallery/ts_parser/bin/rust -o=ts_parser_main.rs -nodecli",
  "tsparser:compile:go": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./gallery/ts_parser/src/ts_parser_main.rgr -d=./gallery/ts_parser/bin/go -o=ts_parser_main.go -nodecli",
  "tsparser:compile:swift": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=swift6 ./gallery/ts_parser/src/ts_parser_main.rgr -d=./gallery/ts_parser/bin/swift -o=ts_parser_main.swift -nodecli",
  "tsparser:compile:cpp": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=cpp ./gallery/ts_parser/src/ts_parser_main.rgr -d=./gallery/ts_parser/bin/cpp -o=ts_parser_main.cpp -nodecli",
  "tsparser:module": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodemodule ./gallery/ts_parser/src/ts_parser_main.rgr -d=./gallery/ts_parser/benchmark -o=ts_parser_module.cjs",
  "tsparser:build:rust": "npm run tsparser:compile:rust && rustc -O gallery/ts_parser/bin/rust/ts_parser_main.rs -o gallery/ts_parser/bin/rust/ts_parser_rust.exe",
  "tsparser:build:go": "npm run tsparser:compile:go && cd gallery/ts_parser/bin/go && go build -o ts_parser_go.exe ts_parser_main.go",
  "tsparser:build:swift": "npm run tsparser:compile:swift && swiftc -O -parse-as-library gallery/ts_parser/bin/swift/ts_parser_main.swift -o gallery/ts_parser/bin/swift/ts_parser_swift.exe",
  "tsparser:build:cpp": "npm run tsparser:compile:cpp && wsl g++ -std=c++17 -O2 -o gallery/ts_parser/bin/cpp/ts_parser_cpp.exe gallery/ts_parser/bin/cpp/ts_parser_main.cpp",
  "tsparser:run": "node ./gallery/ts_parser/bin/js/ts_parser_main.js -d"
}
```

---

### 4. ZIP (Archive Reader/Writer)

#### Current Structure Issues

- Already relatively clean!
- Minor: test_output could be better organized
- Plan document in root

#### Proposed Structure

```
gallery/zip/
├── README.md
├── .gitignore
│
├── docs/
│   ├── PLAN_ZIP.md
│   └── ISSUES.md
│
├── src/
│   ├── zip_tool.rgr
│   ├── ZipReader.rgr
│   ├── ZipWriter.rgr
│   ├── ZipEntry.rgr
│   ├── ZipBuffer.rgr
│   ├── Inflate.rgr
│   └── CRC32.rgr
│
├── test/
│   └── test_output/
│
└── bin/
    └── zip_tool.js
```

#### Migration Commands

```bash
cd gallery/zip

# Create structure
mkdir -p src docs test

# Move documentation
mv PLAN_ZIP.md ISSUES.md docs/

# Move source files
mv zip_tool.rgr ZipReader.rgr ZipWriter.rgr ZipEntry.rgr src/
mv ZipBuffer.rgr Inflate.rgr CRC32.rgr src/

# Move test outputs
mv test_output test/
```

#### Updated Scripts (root package.json)

```json
{
  "zip:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/zip/src/zip_tool.rgr -d=./gallery/zip/bin -o=zip_tool.js -nodecli",
  "zip:run": "node ./gallery/zip/bin/zip_tool.js"
}
```

---

### 5. EVG (Element Layout Engine)

#### Current Structure Issues

- Already quite clean!
- PLAN and SPEC docs in root
- Original folder with old code

#### Proposed Structure

```
gallery/evg/
├── README.md
├── .gitignore
│
├── docs/
│   ├── PLAN_EVG.md
│   ├── SPEC.md
│   └── original/
│
├── src/
│   ├── evg_test.rgr
│   ├── EVGElement.rgr
│   ├── EVGLayout.rgr
│   ├── EVGBox.rgr
│   ├── EVGColor.rgr
│   ├── EVGUnit.rgr
│   ├── EVGText.rgr
│   ├── EVGTextMeasurer.rgr
│   └── EVGImageMeasurer.rgr
│
└── bin/
    └── evg_test.js
```

#### Migration Commands

```bash
cd gallery/evg

# Create structure
mkdir -p src docs

# Move documentation
mv PLAN_EVG.md SPEC.md docs/
mv original docs/

# Move source files
mv evg_test.rgr EVGElement.rgr EVGLayout.rgr EVGBox.rgr src/
mv EVGColor.rgr EVGUnit.rgr EVGText.rgr src/
mv EVGTextMeasurer.rgr EVGImageMeasurer.rgr src/
```

#### Updated Scripts (root package.json)

```json
{
  "evg:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/evg/src/evg_test.rgr -d=./gallery/evg/bin -o=evg_test.js -nodecli",
  "evg:run": "node ./gallery/evg/bin/evg_test.js"
}
```

---

## Universal .gitignore for Gallery Projects

Add to each project's `.gitignore`:

```gitignore
# Compiled outputs
bin/**/*.js
bin/**/*.exe
bin/**/*.rs
bin/**/*.cpp
bin/**/*.go
bin/**/*.swift
bin/**/*.kt
bin/**/*.py
bin/**/*.jar
bin/**/*.pdb
bin/**/*.lib
bin/**/*.exp
bin/**/*.obj
*.exe
*.pdb
*.lib
*.exp
*.obj

# Node modules
node_modules/

# Build artifacts
*.o
*.out
*.class

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Test outputs
test_output/
output/
```

---

## Migration Strategy

### Phase 1: Create Structure (Safe)

```bash
# For each project, create the folders without moving files
cd gallery/<project>
mkdir -p src docs test bin/js bin/cpp bin/rust bin/swift bin/go bin/kotlin bin/python
```

### Phase 2: Move Documentation (Safe)

```bash
# Move all PLAN_*.md, TODO.md, ISSUES.md to docs/
# No code impact
```

### Phase 3: Move Test Files (Safe)

```bash
# Move all test_*.js and similar to test/
# Update test scripts if needed
```

### Phase 4: Move Compiled Outputs (Safe)

```bash
# Move all .js, .exe, .rs, etc. to appropriate bin/ subdirectories
# No source code impact
```

### Phase 5: Move Source Files (Requires Import Updates)

```bash
# Move .rgr files to src/
# Update Import statements in .rgr files
# Update package.json scripts
```

### Phase 6: Test All Projects

```bash
# Run compilation and execution tests for each project
# Verify all targets work (JS, Rust, Go, Swift, C++, etc.)
```

---

## Testing Commands After Migration

### Test All Gallery Projects

```bash
# From repository root

# Invaders
npm run game:compile && npm run game:run

# JS Parser
npm run jsparser:compile && npm run jsparser:test

# TS Parser
npm run tsparser:compile && npm run tsparser:run

# ZIP
npm run zip:compile && npm run zip:run

# EVG
npm run evg:compile && npm run evg:run

# PDF Writer
npm run evgcomp:compile
node ./gallery/pdf_writer/bin/evg_component_tool.js \
  ./gallery/pdf_writer/examples/test_imports.tsx \
  ./gallery/pdf_writer/output/pdfs/test.pdf
```

### Test Cross-Compilation

```bash
# Test each project compiles to multiple targets
npm run game:build:rust && npm run game:run:rust
npm run jsparser:build:cpp && ./gallery/js_parser/bin/cpp/js_parser_cpp.exe
npm run tsparser:build:go && ./gallery/ts_parser/bin/go/ts_parser_go.exe
```

---

## Benefits of Standardization

1. **Consistency**: All projects follow the same structure
2. **Clarity**: Clear separation of source, tests, docs, and outputs
3. **Git Management**: Compiled outputs properly ignored
4. **Multi-Target**: Easy to see which languages are supported
5. **Collaboration**: Easier for contributors to navigate
6. **Maintenance**: Simpler to update and refactor
7. **Documentation**: All planning docs in one place
8. **CI/CD Ready**: Consistent structure for automated testing

---

## Priority Order

1. **High**: ZIP and EVG (already mostly clean)
2. **Medium**: Invaders (single source file, straightforward)
3. **Low**: JS Parser and TS Parser (many files, more complex imports)

---

## Notes

- **Backup First**: Create a git commit before starting migration
- **One Project at a Time**: Complete and test each project before moving to the next
- **Import Paths**: Most critical step - ensure all `Import` statements are updated
- **Cross-Platform**: Test on both Windows and Unix-like systems if possible
- **Performance**: File organization shouldn't impact runtime performance
- **Benchmarks**: Keep benchmark folders at project root for easy access

## Future Improvements

- Create shared utilities folder for common code
- Add automated migration scripts
- Generate project templates for new gallery items
- Add CI/CD for all gallery projects
- Create gallery-wide test suite
