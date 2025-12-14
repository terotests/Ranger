# Ranger 3.0 Roadmap

## Executive Summary

Ranger 3.0 represents a major evolution of the Ranger cross-language compiler, transitioning from an experimental tool to a production-ready development environment. This plan outlines the transition from version 2.x to 3.0, including modernization of the toolchain, a web-based IDE, improved language target support, and ecosystem enhancements.

---

## Table of Contents

1. [Version 3.0 Goals](#version-30-goals)
2. [Phase 1: Foundation (Immediate)](#phase-1-foundation-immediate)
3. [Phase 2: Web IDE Development](#phase-2-web-ide-development)
4. [Phase 3: Language Target Improvements](#phase-3-language-target-improvements)
5. [Phase 4: VSCode Extension Finalization](#phase-4-vscode-extension-finalization)
6. [Phase 5: Incremental Compilation](#phase-5-incremental-compilation)
7. [Phase 6: Advanced Features](#phase-6-advanced-features)
8. [Language Target Strategy](#language-target-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Release & Publishing](#release--publishing)
11. [Future Considerations](#future-considerations)

---

## Version 3.0 Goals

### Primary Objectives

1. **Modernize the Developer Experience** - Web-based IDE, VSCode extension, Monaco editor
2. **Production-Ready Toolchain** - NPM publishing, CI/CD pipelines, comprehensive testing
3. **File Extension Standardization** - Transition from `.clj` to `.rgr`
4. **Simplified Import System** - Auto-load standard library, clearer path resolution, better error messages
5. **Improved Language Targets** - Focus on Python, JavaScript/TypeScript, Swift, Rust, C++
6. **Developer Productivity** - Source maps, incremental compilation, module packaging

### Non-Goals for 3.0

- Mobile app development tooling (deferred)
- Visual programming interfaces (deferred)
- Cloud compilation service (deferred)

---

## Phase 1: Foundation (Immediate)

**Timeline: Week 1-2**

### 1.1 Version Bump & Package Updates

- [ ] Update `package.json` version from `2.1.70` to `3.0.0-alpha.1`
- [ ] Update all documentation to reflect version 3.0
- [ ] Create `CHANGELOG.md` with version history
- [ ] Update `README.md` with 3.0 features and migration guide

### 1.2 File Extension Change (`.clj` → `.rgr`)

This is a high-priority change to establish Ranger's identity and enable proper tooling.

**Implementation Steps:**

1. **Parser Updates**

   - [ ] Update `RangerLispParser` to accept both `.clj` and `.rgr` extensions
   - [ ] Add deprecation warning when `.clj` files are compiled
   - [ ] Update all `Import` statement handling to resolve `.rgr` files

2. **Compiler Updates**

   - [ ] Update file extension detection in `ng_Compiler.clj`
   - [ ] Update `InputFileSystem.clj` to recognize `.rgr`
   - [ ] Modify output file extension logic if input-based

3. **Library Migration**

   - [ ] Rename all files in `compiler/` from `.clj` to `.rgr`
   - [ ] Rename all files in `lib/` from `.clj` to `.rgr`
   - [ ] Update all internal `Import` statements

4. **Documentation Updates**

   - [ ] Update `ai/INSTRUCTIONS.md` with new extension
   - [ ] Update `ai/QUICKREF.md`
   - [ ] Update `ai/EXAMPLES.md`
   - [ ] Update all code examples in `README.md`

5. **Backward Compatibility**
   - [ ] Support both extensions during transition period (3.0.x)
   - [ ] Add compiler flag `--legacy-extension` to suppress warnings
   - [ ] Plan deprecation of `.clj` support for 4.0

### 1.3 NPM Publish Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Tasks:**

- [ ] Create `.github/workflows/publish.yml`
- [ ] Create `.github/workflows/test.yml` for PR testing
- [ ] Set up NPM token as GitHub secret
- [ ] Configure package for scoped publishing if needed (`@ranger/compiler`)
- [ ] Add pre-publish hook to run tests

### 1.4 Project Structure Cleanup

- [ ] Remove deprecated files and examples
- [ ] Organize `examples/` folder by complexity
- [ ] Create `docs/` folder for extended documentation
- [ ] Add `.nvmrc` for Node.js version specification

### 1.5 Import System Improvements

The current import system causes significant confusion for users and GenAI assistants. The handling of `Lang.clj`/`Lang.rgr` and other standard library imports needs to be simplified and better documented.

**Current Problems:**

1. **Unclear Lang.rgr inclusion** - Users don't know how to include the standard library
2. **Path resolution confusion** - Different behaviors in CLI vs programmatic usage
3. **Virtual vs real filesystem** - Imports work differently in browser vs Node.js
4. **GenAI confusion** - AI assistants frequently fail to set up imports correctly
5. **No auto-discovery** - Standard library must be manually specified

**Implementation Steps:**

1. **Automatic Standard Library Loading**

   - [ ] Auto-load `Lang.rgr` when compiler initializes (unless `--no-stdlib` flag)
   - [ ] Bundle `Lang.rgr` content directly in the compiled `output.js`
   - [ ] Add `RANGER_LIB_PATH` environment variable for custom library location

2. **Simplified CLI Usage**

   ```bash
   # Current (confusing)
   node bin/output.js -l es6 -o output.js Lang.clj myfile.clj

   # New (simple - Lang.rgr auto-included)
   rgrc -l es6 -o output.js myfile.rgr

   # Explicit no-stdlib for advanced users
   rgrc -l es6 -o output.js --no-stdlib myfile.rgr
   ```

3. **Import Path Resolution**

   - [ ] Support relative imports: `Import "./utils.rgr"`
   - [ ] Support absolute imports from project root: `Import "/lib/helpers.rgr"`
   - [ ] Support library imports: `Import "std:collections"` (future)
   - [ ] Clear error messages when imports fail with suggested fixes

4. **VirtualCompiler API Improvements**

   ```typescript
   // Current (confusing)
   const env = new InputEnv();
   env.use_real = false;
   // Must manually add Lang.clj content...

   // New (simple)
   const compiler = new VirtualCompiler({
     autoLoadStdlib: true, // default: true
     stdlibPath: "custom/Lang.rgr", // optional override
   });
   ```

5. **Documentation & Error Messages**

   - [ ] Add clear import documentation in `ai/INSTRUCTIONS.md`
   - [ ] Improve error messages: "Cannot find module 'X'. Did you mean...?"
   - [ ] Add troubleshooting section for common import issues
   - [ ] Create import resolution flowchart for documentation

6. **Web IDE Integration**
   - [ ] Pre-load `Lang.rgr` in browser virtual filesystem
   - [ ] Show import resolution in IDE (hover to see resolved path)
   - [ ] Auto-complete for available imports

**Tasks:**

- [ ] Bundle `Lang.rgr` content into `output.js` at build time
- [ ] Add `--no-stdlib` CLI flag
- [ ] Implement `RANGER_LIB_PATH` environment variable
- [ ] Update `VirtualCompiler` constructor for simpler API
- [ ] Improve import error messages with suggestions
- [ ] Update all documentation with new import patterns
- [ ] Add import examples to `ai/EXAMPLES.md`

---

## Phase 2: Web IDE Development

**Timeline: Week 3-8**

### 2.1 Project Setup

**Technology Stack:**

- **Framework**: Vite + React + TypeScript
- **Editor**: Monaco Editor (same as VSCode)
- **UI Components**: Tailwind CSS + Headless UI or Radix UI
- **State Management**: Zustand or Jotai
- **Storage**: IndexedDB via Dexie.js
- **Build**: Vite with WASM support for potential future optimizations

**Project Structure:**

```
ranger-playground/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── MonacoEditor.tsx
│   │   │   ├── EditorTabs.tsx
│   │   │   └── EditorToolbar.tsx
│   │   ├── FileExplorer/
│   │   │   ├── FileTree.tsx
│   │   │   ├── FileTreeItem.tsx
│   │   │   └── FileContextMenu.tsx
│   │   ├── Output/
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── CompilerOutput.tsx
│   │   │   └── ErrorList.tsx
│   │   └── Layout/
│   │       ├── MainLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── StatusBar.tsx
│   ├── compiler/
│   │   ├── BrowserCompiler.ts
│   │   ├── VirtualFileSystem.ts
│   │   └── CompilerWorker.ts
│   ├── storage/
│   │   ├── db.ts
│   │   ├── ProjectStore.ts
│   │   └── FileStore.ts
│   ├── hooks/
│   │   ├── useCompiler.ts
│   │   ├── useFileSystem.ts
│   │   └── useProject.ts
│   └── App.tsx
├── public/
│   └── samples/
│       ├── hello-world.rgr
│       ├── algorithms/
│       └── data-structures/
└── package.json
```

**Setup Tasks:**

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint + Prettier
- [ ] Add Monaco Editor package
- [ ] Configure Vite for web worker support

### 2.2 Virtual File System

**IndexedDB Schema (using Dexie.js):**

```typescript
// storage/db.ts
import Dexie, { Table } from "dexie";

interface Project {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}

interface File {
  id?: number;
  projectId: number;
  path: string; // e.g., "/src/main.rgr"
  name: string;
  content: string;
  isFolder: boolean;
  parentPath: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CompilationCache {
  id?: number;
  projectId: number;
  filePath: string;
  targetLanguage: string;
  compiledCode: string;
  sourceMap?: string;
  compiledAt: Date;
}

class RangerDB extends Dexie {
  projects!: Table<Project>;
  files!: Table<File>;
  compilationCache!: Table<CompilationCache>;

  constructor() {
    super("RangerPlayground");
    this.version(1).stores({
      projects: "++id, name, createdAt",
      files: "++id, projectId, path, parentPath, [projectId+path]",
      compilationCache: "++id, projectId, [projectId+filePath+targetLanguage]",
    });
  }
}
```

**Virtual File System Interface:**

```typescript
// compiler/VirtualFileSystem.ts
interface VirtualFileSystem {
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;

  // Directory operations
  createDirectory(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<FileEntry[]>;

  // Project operations
  exportProject(): Promise<Blob>; // ZIP download
  importProject(file: File): Promise<void>;

  // Compiler integration
  getFileForCompiler(path: string): string;
  getAllFiles(): Map<string, string>;
}
```

**Tasks:**

- [ ] Implement Dexie.js database schema
- [ ] Create `VirtualFileSystem` class
- [ ] Implement file CRUD operations
- [ ] Implement directory operations
- [ ] Add ZIP export/import functionality
- [ ] Create file system hooks for React

### 2.3 Monaco Editor Integration

**Ranger Language Definition:**

```typescript
// editor/rangerLanguage.ts
import * as monaco from "monaco-editor";

export const rangerLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: ";",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
};

export const rangerTokensProvider: monaco.languages.IMonarchLanguage = {
  keywords: [
    "class",
    "def",
    "fn",
    "sfn",
    "if",
    "else",
    "while",
    "for",
    "return",
    "new",
    "this",
    "true",
    "false",
    "null",
    "Import",
    "Extends",
    "Enum",
    "Constructor",
    "switch",
    "case",
    "default",
    "break",
    "continue",
    "try",
    "catch",
    "throw",
    "operators",
  ],
  typeKeywords: [
    "int",
    "double",
    "string",
    "boolean",
    "void",
    "char",
    "charbuffer",
  ],
  operators: [
    "=",
    ">",
    "<",
    "!",
    "~",
    "?",
    ":",
    "==",
    "<=",
    ">=",
    "!=",
    "&&",
    "||",
    "++",
    "--",
    "+",
    "-",
    "*",
    "/",
    "&",
    "|",
    "^",
    "%",
  ],
  tokenizer: {
    root: [
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": "keyword",
            "@typeKeywords": "type",
            "@default": "identifier",
          },
        },
      ],
      [/"([^"\\]|\\.)*"/, "string"],
      [/;.*$/, "comment"],
      [/\d+\.\d*/, "number.float"],
      [/\d+/, "number"],
      [/[{}()\[\]]/, "@brackets"],
      [/@\w+/, "annotation"],
    ],
  },
};
```

**Tasks:**

- [ ] Register Ranger language with Monaco
- [ ] Implement syntax highlighting
- [ ] Add code folding support
- [ ] Implement bracket matching
- [ ] Add basic autocomplete for keywords
- [ ] Integrate with compiler for error highlighting

### 2.4 Browser Compiler Integration

**Web Worker Setup:**

```typescript
// compiler/CompilerWorker.ts
import {
  VirtualCompiler,
  InputEnv,
  InputFSFolder,
  InputFSFile,
  CmdParams,
} from "./output.js";

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case "compile":
      try {
        const result = await compileCode(payload);
        self.postMessage({ type: "success", payload: result });
      } catch (error) {
        self.postMessage({ type: "error", payload: error.message });
      }
      break;
  }
};

async function compileCode(options: CompileOptions): Promise<CompileResult> {
  const { files, entryFile, targetLanguage, libraries } = options;

  const env = new InputEnv();
  env.use_real = false;

  const folder = new InputFSFolder();

  // Add all project files
  for (const [path, content] of Object.entries(files)) {
    const file = new InputFSFile();
    file.name = path;
    file.data = content;
    folder.files.push(file);
  }

  // Add compiler libraries
  for (const [name, content] of Object.entries(libraries)) {
    const file = new InputFSFile();
    file.name = name;
    file.data = content;
    folder.files.push(file);
  }

  env.filesystem = folder;

  const params = new CmdParams();
  params.params["l"] = targetLanguage;
  params.params["o"] = "output." + getExtension(targetLanguage);
  params.values.push(entryFile);
  env.commandLine = params;

  const compiler = new VirtualCompiler();
  const result = await compiler.run(env);

  return {
    success: !result.hasErrors,
    output: result.generatedCode,
    errors: result.errors || [],
    sourceMap: result.sourceMap,
  };
}
```

**Tasks:**

- [ ] Bundle compiler for browser usage
- [ ] Create Web Worker for compilation
- [ ] Implement compilation API
- [ ] Add target language selection
- [ ] Implement real-time error checking
- [ ] Add compilation progress indicator

### 2.5 UI Components

**File Explorer Features:**

- [ ] Tree view with expand/collapse
- [ ] File/folder icons
- [ ] Context menu (new file, new folder, rename, delete)
- [ ] Drag and drop reordering
- [ ] Search/filter files

**Editor Features:**

- [ ] Multi-tab editing
- [ ] Split view support
- [ ] Find and replace
- [ ] Go to line/symbol
- [ ] Minimap

**Output Panel Features:**

- [ ] Compiled code viewer (read-only Monaco)
- [ ] Error list with clickable locations
- [ ] Target language tabs
- [ ] Copy to clipboard
- [ ] Download button

**Tasks:**

- [ ] Implement FileTree component
- [ ] Implement EditorTabs component
- [ ] Implement OutputPanel component
- [ ] Add keyboard shortcuts
- [ ] Implement responsive layout

### 2.6 Sample Projects

**Included Samples:**

```
samples/
├── hello-world/
│   └── main.rgr
├── algorithms/
│   ├── sorting/
│   │   ├── quicksort.rgr
│   │   └── mergesort.rgr
│   └── search/
│       └── binary-search.rgr
├── data-structures/
│   ├── linked-list.rgr
│   ├── stack.rgr
│   └── queue.rgr
├── patterns/
│   ├── factory.rgr
│   └── observer.rgr
└── cross-platform/
    └── file-processor.rgr
```

- [ ] Create sample projects
- [ ] Add "Load Sample" dropdown
- [ ] Include comments explaining Ranger concepts

---

## Phase 3: Language Target Improvements

**Timeline: Week 9-14**

### 3.1 Priority Tier 1: Core Targets

**JavaScript/ES6 (Maintained)**

- [x] Full support - production ready
- [ ] Add source map generation (see Phase 6)
- [ ] Improve module export patterns
- [ ] Add ESM output option

**TypeScript (Maintained)**

- [x] Full support via `-typescript` flag
- [ ] Improve generic type output
- [ ] Add strict mode support
- [ ] Better interface generation

**Python (Enhanced)**

- [x] Good support
- [ ] Fix inheritance constructor issues
- [ ] Add type hints (Python 3.9+)
- [ ] Improve module/package structure
- [ ] Add `__init__.py` generation
- [ ] Support dataclasses for simple classes

**Rust (Major Enhancement)**

- [x] Preliminary support
- [ ] Improve ownership/borrowing patterns
- [ ] Add lifetime annotations where needed
- [ ] Better error handling with Result types
- [ ] Cargo.toml generation
- [ ] Module structure (`mod.rs`)
- [ ] Support for traits

### 3.2 Priority Tier 2: Important Targets

**Swift 6 (Enhanced)**

- [x] Basic support
- [ ] Improve protocol conformance
- [ ] Better optional handling
- [ ] Swift Package Manager integration
- [ ] async/await support
- [ ] Actor support for concurrency

**C++ (Enhanced)**

- [x] Partial support
- [ ] Modern C++17/20 features
- [ ] Smart pointer usage (unique_ptr, shared_ptr)
- [ ] CMake generation
- [ ] Header/implementation file split
- [ ] Template support improvements

### 3.3 Priority Tier 3: Secondary Targets

**Go (Maintained)**

- [x] Good support
- [ ] Fix integer division type conversion
- [ ] Better error handling patterns
- [ ] Go modules support (go.mod)
- [ ] Interface generation

**Java (Maintained)**

- [x] Good support (Java 7+)
- [ ] Update to Java 17+ features
- [ ] Record classes for data types
- [ ] Maven/Gradle build file generation
- [ ] Better generics support

**Kotlin (New Target)**

- [ ] New implementation
- [ ] Data classes
- [ ] Null safety mapping
- [ ] Coroutines for async
- [ ] Extension functions
- [ ] Gradle integration

**Dart (New Target - Evaluation)**

- [ ] Evaluate feasibility
- [ ] Flutter compatibility
- [ ] Null safety
- [ ] async/await patterns
- [ ] pubspec.yaml generation

### 3.4 Priority Tier 4: Maintenance Mode

**PHP (Updated)**

- [x] Basic support
- [ ] Update to PHP 8.x features
- [ ] Type declarations
- [ ] Composer integration
- [ ] Namespace support improvements

**C# (Maintained)**

- [x] Good support
- [ ] .NET 6+ features (if demand exists)
- [ ] Record types
- [ ] NuGet package generation

**Scala (Deprecated)**

- [x] Current support
- [ ] Mark as deprecated in docs
- [ ] Remove in Ranger 4.0
- [ ] Provide migration guide to Kotlin

---

## Phase 4: VSCode Extension Finalization

**Timeline: Week 15-18**

### 4.1 Extension Updates

**File Extension Support:**

- [ ] Register `.rgr` file extension
- [ ] Keep `.clj` support with deprecation notice
- [ ] Update language configuration

**Syntax Highlighting:**

- [ ] Update TextMate grammar for `.rgr`
- [ ] Improve operator highlighting
- [ ] Add semantic token support

**Language Features:**

- [ ] Autocomplete for keywords and types
- [ ] Hover information for variables/methods
- [ ] Go to definition
- [ ] Find all references
- [ ] Rename symbol
- [ ] Code folding
- [ ] Breadcrumbs support

### 4.2 Language Server Protocol (LSP) Implementation

Implement a full Language Server to provide IDE features across editors (VSCode, Neovim, etc.).

**Core Navigation Features:**

- [ ] **Go to Definition** - Jump to class, method, or variable definition
- [ ] **Go to Declaration** - Navigate to where symbol is declared
- [ ] **Go to Type Definition** - Jump to the type of a variable/parameter
- [ ] **Go to Implementation** - Find implementations of interfaces/abstract methods
- [ ] **Find All References** - List all usages of a symbol across the project
- [ ] **Peek Definition** - Inline preview without leaving current file

**Code Intelligence:**

- [ ] **Hover Information** - Show type, documentation, and signature on hover
- [ ] **Signature Help** - Parameter hints when typing function calls
- [ ] **Autocomplete** - Context-aware completions for:
  - Keywords and operators
  - Class names and types
  - Method names (including inherited)
  - Variable names in scope
  - Import paths
- [ ] **Document Symbols** - Outline view of classes, methods, variables
- [ ] **Workspace Symbols** - Search symbols across all files

**Refactoring Support:**

- [ ] **Rename Symbol** - Rename across all files with preview
- [ ] **Extract Method** - Extract selection to new method
- [ ] **Extract Variable** - Extract expression to variable
- [ ] **Inline Variable** - Replace variable with its value
- [ ] **Organize Imports** - Sort and remove unused imports

**Diagnostics & Validation:**

- [ ] **Real-time Error Checking** - Syntax and semantic errors as you type
- [ ] **Warning Highlights** - Unused variables, deprecated features
- [ ] **Quick Fixes** - Suggested fixes for common errors:
  - Add missing import
  - Fix typo in identifier
  - Add missing method parameter
  - Convert type automatically

**Code Actions:**

- [ ] **Generate Constructor** - Create constructor from class fields
- [ ] **Generate Getters/Setters** - Auto-generate accessors
- [ ] **Implement Interface** - Stub out interface methods
- [ ] **Override Method** - Generate override with super call

**Implementation Approach:**

```typescript
// Leverage existing introspection infrastructure
import {
  getTypeAtPosition,
  getClassProperties,
  getClassMethods,
  findDefinitionLocation,
} from "./introspection";

// Language Server handlers
server.onDefinition((params) => {
  const position = params.position;
  const symbolInfo = getTypeAtPosition(document, position);
  return findDefinitionLocation(symbolInfo);
});

server.onHover((params) => {
  const typeInfo = getTypeAtPosition(document, params.position);
  return {
    contents: formatHoverContent(typeInfo),
  };
});
```

**Tasks:**

- [ ] Set up `vscode-languageserver` package
- [ ] Create Language Server entry point
- [ ] Integrate with compiler's introspection API (see [ai/INTROSPECTION.md](ai/INTROSPECTION.md))
- [ ] Implement document synchronization
- [ ] Add incremental parsing for performance
- [ ] Cache symbol tables per file
- [ ] Support multi-root workspaces

### 4.3 Compilation Integration

- [ ] Build task integration
- [ ] Problem matcher for errors
- [ ] Output channel for compiler messages
- [ ] Target language selection in settings
- [ ] Multi-target compilation support

### 4.4 Debugging Support (Future)

- [ ] Debug adapter protocol (DAP) research
- [ ] Source map consumption
- [ ] Breakpoint support (JavaScript target initially)

### 4.5 Extension Publishing

- [ ] Create VS Code Marketplace account
- [ ] Package extension (vsce)
- [ ] Write marketplace description
- [ ] Add screenshots and demos
- [ ] Set up auto-publish workflow

---

## Phase 5: Incremental Compilation

**Timeline: Week 19-24**

_See [INCREMENTAL_PLAN.md](INCREMENTAL_PLAN.md) for detailed implementation plan._

### 5.1 Summary of Phases

1. **Context Serialization** - Save/restore compilation state
2. **Method-Level Recompilation** - Recompile only changed methods
3. **Dependency Tracking** - Track cross-file dependencies
4. **IDE Integration** - Real-time error checking in VSCode

### 5.2 Integration Points

- [ ] Web IDE: Real-time compilation feedback
- [ ] VSCode Extension: Incremental error checking
- [ ] CLI: Watch mode with incremental builds

---

## Phase 6: Advanced Features

**Timeline: Week 25-30**

### 6.1 JavaScript Source Maps

**Implementation Plan:**

```typescript
interface SourceMapGenerator {
  addMapping(
    generated: Position,
    original: Position,
    source: string,
    name?: string
  ): void;
  toJSON(): RawSourceMap;
  toString(): string;
}

// Integration in RangerJavaScriptClassWriter
class SourceMapWriter {
  private generator: SourceMapGenerator;

  addMapping(jsLine: number, jsCol: number, rangerNode: CodeNode) {
    this.generator.addMapping(
      { line: jsLine, column: jsCol },
      { line: rangerNode.row, column: rangerNode.col },
      rangerNode.sourceFile
    );
  }
}
```

**Tasks:**

- [ ] Add `source-map` library dependency
- [ ] Modify code writers to track positions
- [ ] Emit inline or external source maps
- [ ] Add `-sourcemap` compiler flag
- [ ] Test with browser dev tools
- [ ] Test with Node.js debugging

### 6.2 Module Packaging

**JavaScript/TypeScript:**

- [ ] ES modules (import/export)
- [ ] CommonJS modules (require/module.exports)
- [ ] UMD bundles
- [ ] package.json generation

**Python:**

- [ ] `setup.py` / `pyproject.toml`
- [ ] Package structure with `__init__.py`
- [ ] pip installable packages

**Rust:**

- [ ] Cargo.toml generation
- [ ] Crate structure
- [ ] Library vs binary targets

**Go:**

- [ ] go.mod generation
- [ ] Package structure

### 6.3 Documentation Generator

- [ ] Generate API documentation from Ranger source
- [ ] Markdown output
- [ ] HTML output (via template)
- [ ] Include in compilation output

---

## Language Target Strategy

### Target Language Priority Matrix

| Language   | Priority | Current Status | 3.0 Goal    | Use Case                |
| ---------- | -------- | -------------- | ----------- | ----------------------- |
| JavaScript | P0       | ✅ Production  | Source Maps | Web, Node.js            |
| TypeScript | P0       | ✅ Production  | Strict Mode | Web, Node.js with types |
| Python     | P1       | ✅ Good        | Type Hints  | ML, scripting, backends |
| Rust       | P1       | ⚠️ Preliminary | Production  | Systems, performance    |
| Swift      | P1       | ✅ Good        | SwiftPM     | iOS, macOS              |
| C++        | P2       | ⚠️ Partial     | C++17       | Performance, systems    |
| Go         | P2       | ✅ Good        | Maintenance | Cloud, microservices    |
| Java       | P2       | ✅ Good        | Java 17+    | Enterprise, Android     |
| Kotlin     | P3       | ❌ New         | Basic       | Android, multiplatform  |
| Dart       | P3       | ❌ Evaluate    | TBD         | Flutter                 |
| PHP        | P3       | ✅ Basic       | PHP 8.x     | Web backends            |
| C#         | P3       | ✅ Good        | Maintenance | .NET, Unity             |
| Scala      | P4       | ✅ Good        | Deprecate   | (Migration to Kotlin)   |

### New Language Considerations

**Kotlin** - Recommended

- Modern, concise syntax similar to Ranger
- Strong type system
- Excellent Java interoperability
- Growing Android ecosystem
- Multiplatform capabilities

**Dart** - Evaluate

- Flutter is very popular
- Good type system
- May have limited non-Flutter use cases

**Zig** - Future Consideration

- Systems programming
- No hidden allocations
- C interoperability
- Growing community

**Nim** - Future Consideration

- Python-like syntax
- Compiles to C/JS
- Metaprogramming support

---

## Testing Strategy

### 9.1 Compiler Tests (Current)

```bash
npm test              # All tests
npm run test:es6      # JavaScript target
npm run test:python   # Python target
npm run test:go       # Go target
npm run test:rust     # Rust target
```

### 9.2 Ranger Application Testing

**Recommended Approach: JavaScript Ecosystem**

Since Ranger compiles to JavaScript, use the JavaScript testing ecosystem:

```typescript
// tests/ranger-app.test.ts
import { describe, it, expect } from "vitest";

// Import compiled Ranger code
import { MyClass } from "../compiled/myapp.js";

describe("MyClass", () => {
  it("should calculate correctly", () => {
    const instance = new MyClass();
    expect(instance.calculate(5, 3)).toBe(8);
  });
});
```

**Testing Workflow:**

1. Write Ranger source (`.rgr`)
2. Compile to JavaScript
3. Run Vitest tests against compiled code
4. Use source maps for debugging

**Future: Cross-Language Testing**

- [ ] Test harness that compiles and runs in multiple targets
- [ ] Golden output comparison
- [ ] Performance benchmarks across languages

### 9.3 Web IDE Tests

- [ ] Unit tests for components (Vitest + Testing Library)
- [ ] Integration tests for file system
- [ ] E2E tests (Playwright)
- [ ] Compiler integration tests

### 9.4 VSCode Extension Tests

- [ ] Extension host tests
- [ ] Language feature tests
- [ ] Integration tests with sample projects

---

## Release & Publishing

### 10.1 Version Numbering

```
3.0.0-alpha.1  - Initial 3.0 with file extension change
3.0.0-alpha.2  - Web IDE MVP
3.0.0-beta.1   - Feature complete
3.0.0-rc.1     - Release candidate
3.0.0          - Stable release
```

### 10.2 NPM Publishing

**Package Configuration:**

```json
{
  "name": "ranger-compiler",
  "version": "3.0.0",
  "description": "Cross-language compiler for portable algorithms",
  "main": "dist/bin/api.js",
  "types": "dist/bin/api.d.ts",
  "bin": {
    "ranger-compiler": "bin/output.js",
    "rgrc": "bin/output.js"
  },
  "files": ["bin/", "dist/", "lib/", "compiler/Lang.rgr"],
  "keywords": [
    "compiler",
    "cross-platform",
    "transpiler",
    "javascript",
    "python",
    "rust",
    "swift"
  ]
}
```

### 10.3 Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Git tag created
- [ ] NPM published
- [ ] GitHub release created
- [ ] VSCode extension published
- [ ] Web IDE deployed

---

## Future Considerations

### 11.1 Deferred Features

- **WASM Compilation Target** - Compile Ranger to WebAssembly
- **Language Server Protocol (LSP)** - Standalone LSP server
- **Cloud Compilation Service** - API for online compilation
- **Visual Debugger** - Integrated debugging experience
- **Package Manager** - Ranger-specific package management
- **Target Fallback System** - Automatic template fallback chain for related targets:
  - If target-specific template not found, try fallback target (e.g., swift6 → swift3)
  - Then try wildcard "\*" template
  - Would reduce code duplication in Lang.rgr for similar targets

### 11.2 Community Building

- [ ] GitHub Discussions enabled
- [ ] Contributing guide
- [ ] Code of conduct
- [ ] Example project gallery
- [ ] Tutorial series

### 11.3 Long-Term Vision

Ranger 3.x establishes the foundation for a mature cross-language development environment. Future versions (4.x) will focus on:

- Advanced IDE features
- Machine learning code generation assistance
- More sophisticated incremental compilation
- Extended standard library
- Plugin system for custom targets

---

## Implementation Timeline Summary

| Phase | Timeline   | Key Deliverables                          |
| ----- | ---------- | ----------------------------------------- |
| 1     | Week 1-2   | Version 3.0, .rgr extension, NPM pipeline |
| 2     | Week 3-8   | Web IDE with Monaco, VFS, IndexedDB       |
| 3     | Week 9-14  | Language target improvements              |
| 4     | Week 15-18 | VSCode extension finalization             |
| 5     | Week 19-24 | Incremental compilation                   |
| 6     | Week 25-30 | Source maps, module packaging             |

**Total Estimated Timeline: ~30 weeks (7-8 months)**

---

## Appendix A: Migration Guide (2.x → 3.0)

### File Extension Change

```bash
# Rename all .clj files to .rgr
find . -name "*.clj" -exec rename 's/\.clj$/.rgr/' {} \;

# Update imports in your code
sed -i 's/Import "\(.*\)\.clj"/Import "\1.rgr"/g' *.rgr
```

### Breaking Changes

1. **File Extension** - `.clj` deprecated, use `.rgr`
2. **Scala Target** - Deprecated, will be removed in 4.0

### New Features

1. **Source Maps** - Enable with `-sourcemap` flag
2. **Web IDE** - Available at playground.ranger-lang.org (TBD)
3. **Improved Targets** - Better Python, Rust, Swift support

---

## Appendix B: Web IDE Deployment

**Recommended Hosting:**

- **Vercel** - Easy deployment, good CDN
- **Netlify** - Alternative with good features
- **GitHub Pages** - Free, integrated with repo

**Domain:**

- `playground.ranger-lang.org` (recommended)
- `ranger-playground.vercel.app` (development)

**CI/CD:**

```yaml
# .github/workflows/deploy-playground.yml
name: Deploy Playground

on:
  push:
    branches: [main]
    paths:
      - "ranger-playground/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd ranger-playground && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```
