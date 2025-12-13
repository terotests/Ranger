# Incremental Compilation Support for Ranger Compiler

## Executive Summary

This document outlines the plan for adding incremental compilation support to the Ranger compiler, enabling fast re-compilation of modified code ranges. This feature is particularly valuable for IDE integration (VSCode extension) where rapid feedback during editing is critical.

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [How the VSCode Extension Currently Works](#how-the-vscode-extension-currently-works)
3. [Incremental Compilation Design](#incremental-compilation-design)
4. [Context Preservation Strategy](#context-preservation-strategy)
5. [Delta Change Handling](#delta-change-handling)
6. [Unit Testing Strategy](#unit-testing-strategy)
7. [Implementation Phases](#implementation-phases)
8. [Risk Analysis](#risk-analysis)

---

## 1. Current Architecture Overview

### 1.1 Compilation Phases

The Ranger compiler uses a multi-phase approach:

```
Source Code → Parser → AST → CollectMethods → WalkNode → Code Generation
                              (Phase 1)      (Phase 2)     (Phase 3)
```

**Phase 1: CollectMethods**

- Scans all classes, methods, and properties
- Builds the class descriptor table (`definedClasses`)
- Populates method signatures and parameter information
- Registers enums and type definitions
- Location: [ng_FlowWork.clj](compiler/ng_FlowWork.clj)

**Phase 2: WalkNode (StartWalk)**

- Performs type inference and validation
- Fills `eval_type_name` in CodeNodes
- Validates method calls and variable references
- Sets up execution context (`flow_ctx`) for each node
- Location: [ng_FlowWork.clj](compiler/ng_FlowWork.clj#L2524)

**Phase 3: Code Generation**

- Uses `LiveCompiler.WalkNode` to generate target code
- Each language has its own ClassWriter (e.g., `RangerJavaScriptClassWriter`)
- Location: [ng_LiveCompiler.clj](compiler/ng_LiveCompiler.clj#L360)

### 1.2 Key Data Structures

#### RangerAppWriterContext

The central context object that holds all compilation state:

```clojure
class RangerAppWriterContext {
  def langOperators:CodeNode           ; Language-specific operators
  def definedClasses:[string:RangerAppClassDesc]  ; All class definitions
  def definedClassList:[string]        ; Ordered class names
  def definedEnums:[string:RangerAppEnum]  ; Enum definitions
  def localVariables:[string:RangerAppParamDesc]  ; Variables in scope
  def localVarNames:[string]           ; Ordered variable names
  def currentClassName:string          ; Currently processing class
  def currentClass:RangerAppClassDesc  ; Current class descriptor
  def currentMethod:RangerAppFunctionDesc  ; Current method being processed
  def parent:RangerAppWriterContext    ; Parent context (for forking)
  def compilerErrors:[RangerCompilerMessage]  ; Accumulated errors
  ; ... many more fields
}
```

Key methods for context management:

- `fork()` - Creates child context inheriting parent's state
- `getRoot()` - Returns the root context
- `defineVariable(name, desc)` - Adds variable to current scope
- `findClass(name)` - Looks up class definition
- `findVariable(name)` - Searches variable in scope hierarchy

#### CodeNode

The AST node structure with rich metadata:

```clojure
interface CodeNode {
  sp: int              ; Start position in source
  ep: int              ; End position in source
  row: int             ; Line number
  col: int             ; Column number
  vref: string         ; Variable/keyword reference
  type_name: string    ; Declared type
  eval_type_name: string  ; Inferred type (filled by WalkNode)
  value_type: int      ; Node type enum
  children: [CodeNode] ; Child nodes
  flow_done: boolean   ; Whether WalkNode has processed this
  flow_ctx: RangerAppWriterContext  ; Context at this node
  paramDesc: RangerAppParamDesc  ; Parameter info if applicable
  hasParamDesc: boolean
  ; ... more fields
}
```

#### RangerAppFunctionDesc

Method descriptor containing:

- `fnBody: CodeNode` - The method body AST
- `params: [RangerAppParamDesc]` - Parameter list
- `fnCtx: RangerAppWriterContext` - Context when entering the method
- `nameNode: CodeNode` - The method name node
- `return_type: string` - Return type

### 1.3 VirtualCompiler Usage

From TypeScript/JavaScript, the compiler is used as:

```typescript
import * as R from "ranger-compiler";

const compilerInput = new R.InputEnv();
const folder = new R.InputFSFolder();
const addFile = (name: string, contents: string) => {
  const newFile = new R.InputFSFile();
  newFile.name = name;
  newFile.data = contents;
  folder.files.push(newFile);
};

// Add source code and required libraries
addFile("input.clj", sourceCode);
addFile("Lang.clj", langContent);
addFile("stdlib.clj", stdlibContent);

compilerInput.filesystem = folder;

const params = new R.CmdParams();
params.params["l"] = "es6";
params.values.push("input.clj");
compilerInput.commandLine = params;

const vComp = new R.VirtualCompiler();
const result = await vComp.run(compilerInput);

// result.ctx contains the RangerAppWriterContext with all definitions
// result.fileSystem contains the generated output files
```

---

## 2. How the VSCode Extension Currently Works

### 2.1 Document Validation Flow

```
User Types → onDidChangeContent → (debounce 300ms) → validateTextDocument
                                                            ↓
                                              parseRangerCode(code, uri)
                                                            ↓
                                              VirtualCompiler.run(input)
                                                            ↓
                                              ASTAnalyzer(rootNode, ctx)
                                                            ↓
                                              Cache results + send diagnostics
```

Location: [server/src/server.ts](ranger-vscode-extension/server/src/server.ts#L155-L169)

### 2.2 Finding AST Nodes at Position

The extension finds AST nodes for hover/completion using `ASTAnalyzer.findNodeAtOffset()`:

```typescript
// From server/src/astAnalyzer.ts
findNodeAtOffset(offset: number, node?: CodeNode): CodeNode | null {
  const currentNode = node || this.rootNode;
  if (!currentNode) return null;

  // Check if offset is within this node's range
  if (offset >= currentNode.sp && offset <= currentNode.ep) {
    // Check children first (most specific match)
    if (currentNode.children && currentNode.children.length > 0) {
      for (const child of currentNode.children) {
        const found = this.findNodeAtOffset(offset, child);
        if (found) return found;
      }
    }
    // If no child matched, this is the node
    return currentNode;
  }
  return null;
}
```

### 2.3 Hover Information

When hovering over code, the extension:

1. Calculates offset from position
2. Finds the AST node at that offset
3. Reads `eval_type_name` (inferred type) and `type_name` (declared type)
4. Uses `TypeResolver` to provide additional context

From [server/src/server.ts](ranger-vscode-extension/server/src/server.ts#L401-L450):

```typescript
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const cached = documentCache.get(params.textDocument.uri);
  if (!cached) return null;

  const offset = document.offsetAt(params.position);
  const node = cached.analyzer.findNodeAtOffset(offset);

  // Node contains: vref, eval_type_name, type_name, value_type, etc.
  const hoverInfo = cached.typeResolver.resolveHoverInfo(offset);
  // ...
});
```

### 2.4 Compilation Cache Strategy

The extension caches successful compilations:

```typescript
// From server/src/rangerCompiler.ts
interface SuccessfulCompilation {
  code: string;
  rootNode: CodeNode | null;
  context: any | null;
  timestamp: number;
}

const compilationCache: Map<string, SuccessfulCompilation> = new Map();
```

On compilation errors, it falls back to cached results if the code change is small (within 50 characters).

---

## 3. Incremental Compilation Design

### 3.1 Core Concept

Instead of re-running the full compilation pipeline, incremental compilation:

1. **Identifies the affected scope** (function/method/class)
2. **Restores the context** from when that scope was first entered
3. **Re-parses only the changed code**
4. **Re-runs WalkNode** on the affected scope
5. **Updates the AST** in-place

### 3.2 Scope Detection Algorithm

```
Given: change at offset O with delta D

1. Find enclosing function:
   - Search for CodeNode with vref="fn" or vref="sfn" containing O
   - This is the "affected function"

2. If change is within function body only:
   - Can do function-level incremental compile

3. If change affects function signature:
   - Need class-level re-compile

4. If change affects class definition:
   - Need file-level re-compile

5. If change affects imports:
   - Need full re-compile
```

### 3.3 Re-compilation Entry Point

New method to add to `RangerFlowParser`:

```clojure
fn RecompileFunction:void (
  methodNode:CodeNode          ; The fn/sfn node to recompile
  newBodyCode:string           ; New source code for body
  ctx:RangerAppWriterContext   ; Saved context from method entry
  wr:CodeWriter
) {
  ; 1. Parse the new body code
  def newBodyAst:CodeNode (parseBody(newBodyCode))

  ; 2. Reset flow_done on all nodes in the function
  methodNode.resetFlowState()

  ; 3. Replace the body AST
  methodNode.replaceBody(newBodyAst)

  ; 4. Re-run WalkNode with the saved context
  this.WalkNode(methodNode ctx wr)
}
```

### 3.4 Context Snapshot Points

Contexts must be preserved at these entry points:

| Location          | What to Save        | Used For                  |
| ----------------- | ------------------- | ------------------------- |
| Method entry      | Local context fork  | Re-compiling method body  |
| Class entry       | Class-level context | Re-compiling entire class |
| Constructor entry | Constructor context | Re-compiling constructor  |
| Lambda entry      | Captured context    | Re-compiling lambdas      |

---

## 4. Context Preservation Strategy

### 4.1 Required Changes to WalkNode

The `WalkNode` function must be modified to preserve context at function boundaries.

Current code in [ng_FlowWork.clj](compiler/ng_FlowWork.clj#L2524):

```clojure
fn WalkNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  ; ... current implementation
  if (node.isFirstVref("fn")) {
    this.EnterMethod(node ctx wr)
    return true
  }
}
```

Required modification:

```clojure
fn WalkNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  ; Store the context at node level for incremental recompilation
  node.flow_ctx = ctx
  node.flow_done = true

  if (node.isFirstVref("fn")) {
    ; Create and preserve the method entry context
    def methodCtx:RangerAppWriterContext (ctx.fork())
    methodCtx.setInMethod()

    ; Store on the function descriptor for later retrieval
    def methodDesc:RangerAppFunctionDesc (this.EnterMethod(node methodCtx wr))
    methodDesc.fnCtx = methodCtx  ; CRITICAL: preserve for incremental

    return true
  }
}
```

### 4.2 Context Restoration API

New methods to add to `RangerAppWriterContext`:

```clojure
extension RangerAppWriterContext {
  ; Snapshot current context state for later restoration
  fn snapshot:RangerContextSnapshot () {
    def snap (new RangerContextSnapshot)
    snap.localVarNames = (clone this.localVarNames)
    snap.localVariables = (cloneMap this.localVariables)
    snap.currentClassName = this.currentClassName
    snap.currentClass = this.currentClass
    snap.currentMethod = this.currentMethod
    snap.in_method = this.in_method
    snap.is_function = this.is_function
    return snap
  }

  ; Restore context from snapshot
  fn restoreFrom:void (snap:RangerContextSnapshot) {
    this.localVarNames = (clone snap.localVarNames)
    this.localVariables = (cloneMap snap.localVariables)
    this.currentClassName = snap.currentClassName
    this.currentClass = snap.currentClass
    this.currentMethod = snap.currentMethod
    this.in_method = snap.in_method
    this.is_function = snap.is_function
  }
}

class RangerContextSnapshot {
  def localVarNames:[string]
  def localVariables:[string:RangerAppParamDesc]
  def currentClassName:string
  def currentClass@(weak):RangerAppClassDesc
  def currentMethod@(weak):RangerAppFunctionDesc
  def in_method:boolean
  def is_function:boolean
}
```

### 4.3 Function Context Retrieval

From the VSCode extension perspective:

```typescript
function getMethodContextAtOffset(
  offset: number,
  analyzer: ASTAnalyzer,
  context: RangerAppWriterContext
): { methodNode: CodeNode; methodContext: any } | null {
  // Find the node at offset
  const node = analyzer.findNodeAtOffset(offset);
  if (!node) return null;

  // Walk up to find enclosing method
  let current = node;
  while (current) {
    if (current.vref === "fn" || current.vref === "sfn") {
      // Found method - retrieve its saved context
      const className = getEnclosingClassName(current);
      const classDesc = context.definedClasses[className];
      if (classDesc && classDesc.methods) {
        const methodName = getMethodName(current);
        const methodDesc = classDesc.methods[methodName];
        if (methodDesc && methodDesc.fnCtx) {
          return {
            methodNode: current,
            methodContext: methodDesc.fnCtx,
          };
        }
      }
    }
    current = current.parent;
  }
  return null;
}
```

---

## 5. Delta Change Handling

### 5.1 Text Document Changes

VSCode sends incremental text changes through LSP:

```typescript
interface TextDocumentContentChangeEvent {
  range: Range; // Start/end position of change
  rangeLength: number; // Length of replaced text
  text: string; // New text
}
```

### 5.2 Source Code Position Mapping

The Ranger parser's `SourceCode` class tracks positions:

```clojure
class SourceCode {
  def code:string        ; Full source text
  def filename:string    ; File name
  def sp:int             ; Current parse position
  def lines:[string]     ; Lines array for error reporting
}
```

### 5.3 Delta Application Strategy

```typescript
interface IncrementalUpdate {
  // Original positions
  rangeStart: number;
  rangeEnd: number;

  // New text to insert
  newText: string;

  // Position delta for nodes after change
  delta: number; // newText.length - (rangeEnd - rangeStart)
}

function applyDeltaToAST(rootNode: CodeNode, update: IncrementalUpdate): void {
  function updateNode(node: CodeNode) {
    // Node is completely before change - no update needed
    if (node.ep < update.rangeStart) return;

    // Node is completely after change - shift positions
    if (node.sp > update.rangeEnd) {
      node.sp += update.delta;
      node.ep += update.delta;
    }
    // Node contains the change - needs re-parse
    else if (node.sp <= update.rangeStart && node.ep >= update.rangeEnd) {
      node.ep += update.delta;
      node.needsReparse = true;
    }
    // Node overlaps change start - invalidate
    else if (node.ep >= update.rangeStart && node.sp < update.rangeStart) {
      node.needsReparse = true;
    }

    // Recurse to children
    for (const child of node.children) {
      updateNode(child);
    }
  }

  updateNode(rootNode);
}
```

### 5.4 Incremental Parse Integration

```typescript
async function incrementalParse(
  cachedResult: SuccessfulCompilation,
  newCode: string,
  change: TextDocumentContentChangeEvent
): Promise<IncrementalParseResult> {
  const update: IncrementalUpdate = {
    rangeStart: positionToOffset(newCode, change.range.start),
    rangeEnd: positionToOffset(newCode, change.range.end),
    newText: change.text,
    delta: change.text.length - change.rangeLength,
  };

  // Apply position deltas to cached AST
  applyDeltaToAST(cachedResult.rootNode, update);

  // Find affected scope
  const affectedScope = findAffectedScope(
    cachedResult.rootNode,
    update.rangeStart
  );

  if (affectedScope.type === "function") {
    // Can do incremental function recompile
    return await recompileFunction(
      cachedResult,
      affectedScope.node,
      newCode,
      update
    );
  }

  // Fall back to full recompile
  return await fullRecompile(newCode);
}
```

---

## 6. Unit Testing Strategy

### 6.1 Current Test Infrastructure

The project uses Vitest for testing with the pattern:

```
tests/
├── compiler.test.ts      # ES6 target tests
├── compiler-go.test.ts   # Go target tests
├── compiler-python.test.ts
├── compiler-rust.test.ts
├── fixtures/             # .clj test files
└── helpers/
    └── compiler.ts       # Test utilities
```

Tests compile Ranger source to JavaScript and run the output:

```typescript
import { compileAndRun } from "./helpers/compiler";

it("should compile and run array push", () => {
  const { compile, run } = compileAndRun("tests/fixtures/array_push.clj");
  expect(compile.success).toBe(true);
  expect(run?.output).toContain("Done");
});
```

### 6.2 New Test Categories for Incremental Compilation

#### 6.2.1 Parser Unit Tests

Test the parser in isolation:

```typescript
// tests/parser.test.ts
import { RangerLispParser, SourceCode } from "../bin/output.js";

describe("Parser", () => {
  it("should parse simple class", () => {
    const code = new SourceCode(`
      class Test {
        def x:int 0
        fn foo:int () { return x }
      }
    `);
    const parser = new RangerLispParser(code);
    parser.parse();

    expect(parser.rootNode).not.toBeNull();
    expect(parser.rootNode.children.length).toBe(1);
    expect(parser.rootNode.children[0].vref).toBe("class");
  });

  it("should maintain source positions", () => {
    const code = `class Test { def x:int 0 }`;
    const sourceCode = new SourceCode(code);
    const parser = new RangerLispParser(sourceCode);
    parser.parse();

    const classNode = parser.rootNode.children[0];
    expect(classNode.sp).toBe(0);
    expect(classNode.ep).toBe(code.length - 1);
  });
});
```

#### 6.2.2 Context Unit Tests

Test context forking and variable resolution:

```typescript
// tests/context.test.ts
import { RangerAppWriterContext, RangerAppParamDesc } from "../bin/output.js";

describe("Context", () => {
  it("should fork with inherited variables", () => {
    const parent = new RangerAppWriterContext();
    const param = new RangerAppParamDesc();
    param.name = "x";
    param.type_name = "int";
    parent.defineVariable("x", param);

    const child = parent.fork();

    expect(child.hasVariable("x")).toBe(true);
    expect(child.getVariableDef("x").type_name).toBe("int");
  });

  it("should isolate child variables from parent", () => {
    const parent = new RangerAppWriterContext();
    const child = parent.fork();

    const param = new RangerAppParamDesc();
    param.name = "y";
    child.defineVariable("y", param);

    expect(parent.hasVariable("y")).toBe(false);
    expect(child.hasVariable("y")).toBe(true);
  });
});
```

#### 6.2.3 Incremental Compilation Tests

```typescript
// tests/incremental.test.ts
import { VirtualCompiler, IncrementalCompiler } from "../bin/output.js";

describe("Incremental Compilation", () => {
  let baseCompilation: any;

  beforeAll(async () => {
    // Compile base code
    baseCompilation = await compileCode(`
      class Calculator {
        def value:int 0
        fn add:int (x:int) {
          value = (value + x)
          return value
        }
      }
    `);
  });

  it("should recompile modified function body", async () => {
    const change = {
      range: { start: { line: 4, char: 10 }, end: { line: 4, char: 22 } },
      text: "(value - x)", // Changed + to -
    };

    const result = await incrementalRecompile(baseCompilation, change);

    expect(result.success).toBe(true);
    expect(result.recompiledScopes).toContain("Calculator.add");
    expect(result.fullRecompile).toBe(false);
  });

  it("should fall back to full recompile on signature change", async () => {
    const change = {
      range: { start: { line: 3, char: 16 }, end: { line: 3, char: 21 } },
      text: "(x:int y:int)", // Added parameter
    };

    const result = await incrementalRecompile(baseCompilation, change);

    expect(result.success).toBe(true);
    expect(result.fullRecompile).toBe(true);
  });
});
```

#### 6.2.4 VirtualCompiler Integration Tests

```typescript
// tests/virtual-compiler.test.ts
import {
  VirtualCompiler,
  InputEnv,
  InputFSFolder,
  InputFSFile,
  CmdParams,
} from "../bin/output.js";

describe("VirtualCompiler", () => {
  function createTestEnv(sourceCode: string): InputEnv {
    const env = new InputEnv();
    env.use_real = false;

    const folder = new InputFSFolder();
    const file = new InputFSFile();
    file.name = "test.clj";
    file.data = sourceCode;
    folder.files.push(file);

    // Add required compiler files
    addFile(folder, "Lang.clj", langContent);
    addFile(folder, "stdlib.clj", stdlibContent);

    env.filesystem = folder;

    const params = new CmdParams();
    params.params["l"] = "es6";
    params.values.push("test.clj");
    env.commandLine = params;

    return env;
  }

  it("should compile simple class", async () => {
    const env = createTestEnv(`
      class Hello {
        sfn main@(main):void () {
          print "Hello"
        }
      }
    `);

    const compiler = new VirtualCompiler();
    const result = await compiler.run(env);

    expect(result.hasErrors).toBe(false);
    expect(result.ctx.definedClasses["Hello"]).toBeDefined();
  });

  it("should preserve method contexts", async () => {
    const env = createTestEnv(`
      class Test {
        fn foo:int (x:int) {
          def y:int (x + 1)
          return y
        }
      }
    `);

    const compiler = new VirtualCompiler();
    const result = await compiler.run(env);

    const testClass = result.ctx.definedClasses["Test"];
    const fooMethod = testClass.methods["foo"];

    expect(fooMethod.fnCtx).toBeDefined();
    expect(fooMethod.fnCtx.hasVariable("x")).toBe(true);
    expect(fooMethod.fnCtx.hasVariable("y")).toBe(true);
  });
});
```

### 6.3 Test Infrastructure Improvements

#### 6.3.1 Direct Module Testing

Create a test harness that imports the compiled JavaScript directly:

```typescript
// tests/helpers/direct-test.ts
const compiler = require("../../bin/output.js");

export function createParser(code: string) {
  const sourceCode = new compiler.SourceCode(code);
  sourceCode.filename = "test.clj";
  return new compiler.RangerLispParser(sourceCode);
}

export function createContext() {
  return new compiler.RangerAppWriterContext();
}

export function createFlowParser() {
  return new compiler.RangerFlowParser();
}

export { compiler };
```

#### 6.3.2 Snapshot Testing

For AST structure verification:

```typescript
// tests/ast-snapshots.test.ts
import { createParser } from "./helpers/direct-test";

describe("AST Snapshots", () => {
  it("should produce consistent AST for class definition", () => {
    const parser = createParser(`
      class Point {
        def x:double 0.0
        def y:double 0.0
        Constructor (x:double y:double) {
          this.x = x
          this.y = y
        }
      }
    `);
    parser.parse();

    expect(astToSnapshot(parser.rootNode)).toMatchSnapshot();
  });
});

function astToSnapshot(node: any): any {
  return {
    vref: node.vref,
    type_name: node.type_name,
    value_type: node.value_type,
    children: node.children?.map(astToSnapshot) || [],
  };
}
```

---

## 7. Implementation Phases

### Phase 1: Foundation (2-3 weeks)

**Goal:** Establish context preservation without breaking existing functionality

1. **Add context snapshot capability**

   - Implement `RangerContextSnapshot` class
   - Add `snapshot()` and `restoreFrom()` methods to context
   - Preserve method context in `RangerAppFunctionDesc.fnCtx`

2. **Modify WalkNode to save contexts**

   - Store `flow_ctx` on each CodeNode
   - Ensure method descriptors get their entry context saved

3. **Create unit test infrastructure**

   - Direct module testing setup
   - Parser unit tests
   - Context unit tests

4. **Validation**
   - All existing tests must pass
   - Verify context is properly saved and retrievable

### Phase 2: Incremental Parser (2-3 weeks)

**Goal:** Enable partial AST updates

1. **Implement delta tracking**

   - Position adjustment for AST nodes
   - Change detection algorithm
   - Scope identification (function/class/file level)

2. **Add incremental parse API**

   ```clojure
   fn incrementalParse:CodeNode (
     existingAst:CodeNode
     change:SourceChange
     ctx:RangerAppWriterContext
   )
   ```

3. **Create `SourceChange` data structure**

   - Range (start/end positions)
   - New text
   - Type of change (insert/delete/replace)

4. **Unit tests for delta handling**

### Phase 3: Incremental WalkNode (3-4 weeks)

**Goal:** Re-run type inference on changed scopes only

1. **Implement `RecompileFunction`**

   - Reset flow state on affected nodes
   - Restore method context
   - Re-run WalkNode on function body

2. **Implement `RecompileClass`**

   - Handle signature changes
   - Re-walk all methods if needed

3. **Error recovery**

   - Handle incomplete code during editing
   - Graceful fallback to full compile

4. **Integration tests**

### Phase 4: VSCode Extension Integration (2 weeks)

**Goal:** Use incremental compilation in the language server

1. **Update rangerCompiler.ts**

   - Add `incrementalParse()` function
   - Integrate with existing cache

2. **Optimize validation flow**

   - Detect change scope
   - Use incremental compile when possible
   - Update diagnostics for changed regions only

3. **Performance testing**
   - Measure improvement in typing latency
   - Memory usage validation

### Phase 5: Polish and Documentation (1 week)

1. **Performance optimization**

   - Profile and optimize hot paths
   - Memory usage tuning

2. **Documentation**

   - API documentation
   - Usage examples
   - Architecture guide updates

3. **Final testing**
   - Edge case testing
   - Stress testing with large files

---

## 8. Risk Analysis

### 8.1 Technical Risks

| Risk                              | Impact | Mitigation                                           |
| --------------------------------- | ------ | ---------------------------------------------------- |
| Context state corruption          | High   | Extensive snapshot testing, immutable context design |
| Position mapping errors           | Medium | Comprehensive delta calculation tests                |
| Memory leaks from cached contexts | Medium | Weak references, explicit cleanup                    |
| Performance regression            | Medium | Benchmark suite, fallback to full compile            |
| Breaking existing tests           | High   | Run full test suite on every change                  |

### 8.2 Architecture Risks

| Risk                                       | Impact | Mitigation                                     |
| ------------------------------------------ | ------ | ---------------------------------------------- |
| Changes to core compiler break incremental | High   | Feature flag for incremental, clean separation |
| AST structure changes                      | Medium | AST versioning, migration path                 |
| Threading issues (Node.js)                 | Low    | Single-threaded design, async boundaries       |

### 8.3 Integration Risks

| Risk                       | Impact | Mitigation                       |
| -------------------------- | ------ | -------------------------------- |
| VSCode API changes         | Low    | Abstract LSP layer               |
| TypeScript version issues  | Low    | Pin TypeScript version           |
| Cross-platform differences | Low    | CI testing on multiple platforms |

---

## Appendix A: Reference Implementation Examples

### A.1 Finding Enclosing Function

```typescript
// TypeScript implementation for VSCode extension
function findEnclosingFunction(
  node: CodeNode,
  offset: number
): { node: CodeNode; type: "fn" | "sfn" | "constructor" } | null {
  function search(current: CodeNode): CodeNode | null {
    if (offset < current.sp || offset > current.ep) {
      return null;
    }

    // Check if this is a function node
    if (
      current.vref === "fn" ||
      current.vref === "sfn" ||
      current.vref === "Constructor"
    ) {
      return current;
    }

    // Search children
    for (const child of current.children || []) {
      const found = search(child);
      if (found) return found;
    }

    return null;
  }

  const fnNode = search(node);
  if (!fnNode) return null;

  return {
    node: fnNode,
    type: fnNode.vref as "fn" | "sfn" | "constructor",
  };
}
```

### A.2 Context Restoration Example

```clojure
; Example of restoring context for recompilation
fn recompileMethod:void (
  methodNode:CodeNode
  newBody:CodeNode
  savedCtx:RangerAppWriterContext
  wr:CodeWriter
) {
  ; Create fresh context from saved state
  def freshCtx:RangerAppWriterContext (savedCtx.fork())

  ; Clear old body
  def oldBody:CodeNode (methodNode.getFnBody())
  clear oldBody.children

  ; Insert new body nodes
  for newBody.children ch:CodeNode i {
    ch.flow_done = false
    ch.flow_ctx = (r.null)
    push oldBody.children ch
  }

  ; Re-walk the function
  this.WalkNode(methodNode freshCtx wr)
}
```

---

## Appendix B: Performance Targets

| Metric                              | Current | Target             |
| ----------------------------------- | ------- | ------------------ |
| Full parse time (1000 lines)        | ~200ms  | ~200ms (unchanged) |
| Incremental parse (function change) | N/A     | <20ms              |
| Incremental WalkNode (function)     | N/A     | <10ms              |
| Memory per cached context           | ~50KB   | ~10KB (optimized)  |
| Max cached contexts per file        | N/A     | 50 (methods)       |

---

## Appendix C: Related Files

| File                                                                                                         | Purpose                        |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| [compiler/ng_FlowWork.clj](compiler/ng_FlowWork.clj)                                                         | Main WalkNode implementation   |
| [compiler/ng_LiveCompiler.clj](compiler/ng_LiveCompiler.clj)                                                 | Code generation WalkNode       |
| [compiler/ng_RangerAppWriterContext.clj](compiler/ng_RangerAppWriterContext.clj)                             | Context class definition       |
| [compiler/ng_CodeNode.clj](compiler/ng_CodeNode.clj)                                                         | AST node definition            |
| [compiler/VirtualCompiler.clj](compiler/VirtualCompiler.clj)                                                 | Main compiler entry point      |
| [compiler/ng_parser.clj](compiler/ng_parser.clj)                                                             | Lisp parser                    |
| [ranger-vscode-extension/server/src/rangerCompiler.ts](ranger-vscode-extension/server/src/rangerCompiler.ts) | Extension compiler integration |
| [ranger-vscode-extension/server/src/astAnalyzer.ts](ranger-vscode-extension/server/src/astAnalyzer.ts)       | AST analysis utilities         |

---

## Conclusion

Incremental compilation support will significantly improve the developer experience when using the Ranger VSCode extension. By preserving compilation contexts at function boundaries and implementing smart change detection, we can reduce re-compilation time from hundreds of milliseconds to under 30ms for typical edits.

The phased implementation approach ensures that:

1. Existing functionality is not broken
2. Each phase delivers measurable value
3. Risks are identified and mitigated early
4. The codebase remains maintainable

The unit testing strategy ensures that both the incremental compilation logic and the existing compiler behavior are thoroughly validated, giving confidence in the implementation quality.
