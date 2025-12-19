# EVG Component System - Lightweight TSX Engine

## Overview

Create a lightweight TypeScript/JSX evaluation engine that enables component reuse across TSX files. The engine will support React-like import syntax, runtime JSX evaluation, and basic ES6 operations.

## Goals

1. **Component Imports** - Import components/functions from other files
2. **Runtime Evaluation** - Evaluate `render()` functions with JSX calls
3. **Lightweight ES6** - Support basic JavaScript operations (not full ES6)
4. **EVG Output** - Return EVG element trees for PDF rendering

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TSX Source File                         │
│  import { Star, Heart } from './shapes';                     │
│  function render() { return <Star color="red" />; }          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    1. Import Resolver                        │
│  - Parse import statements                                   │
│  - Load referenced files                                     │
│  - Build symbol table of exported components/functions       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    2. TSX Parser                             │
│  - Parse function definitions                                │
│  - Parse JSX elements and expressions                        │
│  - Build AST with component references                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    3. Expression Evaluator                   │
│  - Evaluate {expressions} in JSX attributes                  │
│  - Call imported functions                                   │
│  - Basic operators: +, -, *, /, %, &&, ||, !, ?:             │
│  - String interpolation, array/object literals               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    4. Component Expander                     │
│  - Resolve <Component /> to its render output                │
│  - Pass props to component functions                         │
│  - Recursively expand nested components                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    5. EVG Element Tree                       │
│  - Final tree of primitive EVG elements                      │
│  - Ready for layout and PDF rendering                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Import System

### Import Syntax Support

```tsx
// Named imports
import { Star, Heart } from "./shapes";
import { formatDate, formatCurrency } from "./utils";

// Default import (optional, Phase 2)
import Header from "./Header";

// Aliased imports
import { Star as StarIcon } from "./shapes";
```

### File Resolution

```
import { Star } from './shapes'
  → Look for: ./shapes.tsx, ./shapes.ts, ./shapes/index.tsx

import { utils } from '../common/utils'
  → Relative path resolution from current file
```

### Export Syntax Support

```tsx
// Named exports
export function Star(props) { ... }
export const Heart = (props) => { ... };

// Inline export
export { Star, Heart, createPath };
```

### Implementation

```ranger
class ImportResolver {
    def imports:[ImportedSymbol]
    def basePath:string

    fn resolveImports:void (source:string) {
        ; Parse import statements
        ; Load each file
        ; Extract exported symbols
        ; Build symbol table
    }

    fn getSymbol:ComponentDef (name:string) {
        ; Look up symbol by name
        ; Return component definition or function
    }
}

class ImportedSymbol {
    def name:string           ; Local name in current file
    def originalName:string   ; Name in source file
    def sourcePath:string     ; File path
    def symbolType:string     ; "component" | "function" | "constant"
    def definition:any        ; AST node or evaluated value
}
```

---

## Phase 2: Expression Evaluator

### Supported Operations

| Category         | Operations                                     |
| ---------------- | ---------------------------------------------- |
| Arithmetic       | `+`, `-`, `*`, `/`, `%`                        |
| Comparison       | `==`, `!=`, `<`, `>`, `<=`, `>=`, `===`, `!==` |
| Logical          | `&&`, `\|\|`, `!`                              |
| Ternary          | `condition ? a : b`                            |
| Member Access    | `obj.prop`, `arr[0]`                           |
| Function Call    | `func(arg1, arg2)`                             |
| Template Literal | `` `Hello ${name}` ``                          |

### Literals

```tsx
// Supported literals
42                    // number
3.14                  // float
"hello"               // string
'world'               // string
true / false          // boolean
null                  // null
[1, 2, 3]             // array
{ x: 1, y: 2 }        // object
```

### NOT Supported (Phase 1)

- `async/await`
- `class` definitions
- `for/while` loops (use map instead)
- `try/catch`
- Destructuring in parameters
- Spread operator `...`
- Regular expressions
- `new` operator
- Prototype chains

### Implementation

```ranger
class ExpressionEvaluator {
    def context:EvalContext

    fn evaluate:any (expr:ASTNode) {
        if (expr.type == "literal") {
            return expr.value
        }
        if (expr.type == "identifier") {
            return context.lookup(expr.name)
        }
        if (expr.type == "binary") {
            def left:any (this.evaluate(expr.left))
            def right:any (this.evaluate(expr.right))
            return this.applyBinaryOp(expr.operator left right)
        }
        if (expr.type == "call") {
            def func:any (this.evaluate(expr.callee))
            def args:[any] (this.evaluateArgs(expr.arguments))
            return this.callFunction(func args)
        }
        if (expr.type == "member") {
            def obj:any (this.evaluate(expr.object))
            return this.getMember(obj expr.property)
        }
        if (expr.type == "ternary") {
            def cond:boolean (this.evaluate(expr.test))
            if cond {
                return (this.evaluate(expr.consequent))
            }
            return (this.evaluate(expr.alternate))
        }
        ; ... more cases
    }
}

class EvalContext {
    def variables:[string:any]
    def parent:EvalContext?

    fn lookup:any (name:string) {
        if (has variables name) {
            return (get variables name)
        }
        if parent {
            return parent.lookup(name)
        }
        ; error: undefined variable
    }

    fn define:void (name:string value:any) {
        set variables name value
    }
}
```

---

## Phase 3: Component System

### Component Definition

```tsx
// Function component
function Star({ color, size = 20 }) {
  return (
    <View width={size} height={size}>
      <Label color={color}>★</Label>
    </View>
  );
}

// Arrow function component
const Heart = ({ color }) => (
  <View>
    <Label color={color}>♥</Label>
  </View>
);
```

### Component Expansion

When parser encounters `<Star color="red" size={30} />`:

1. Look up `Star` in symbol table
2. Create props object: `{ color: "red", size: 30 }`
3. Create new evaluation context with props
4. Evaluate component function body
5. Return resulting EVG element tree

### Props Handling

```ranger
class ComponentExpander {
    def resolver:ImportResolver
    def evaluator:ExpressionEvaluator

    fn expandComponent:EVGElement (node:JSXElement) {
        def tagName:string node.tagName

        ; Check if it's a component (capitalized) or primitive
        if (this.isComponent(tagName)) {
            def component:ComponentDef (resolver.getSymbol(tagName))
            def props:map (this.evaluateProps(node.attributes))
            def childContext:EvalContext (EvalContext.withProps(props))

            ; Evaluate component render
            def result:JSXElement (this.evaluateComponent(component childContext))

            ; Recursively expand result
            return (this.expandElement(result))
        }

        ; Primitive element - convert to EVG
        return (this.createEVGElement(node))
    }

    fn isComponent:boolean (name:string) {
        ; Components start with uppercase
        def first:string (charAt name 0)
        return (first == (toUpper first))
    }
}
```

---

## Phase 4: Children and Composition

### Children Prop

```tsx
function Card({ title, children }) {
  return (
    <View backgroundColor="#fff" padding="20px">
      <Label fontSize="18px" fontWeight="bold">
        {title}
      </Label>
      {children}
    </View>
  );
}

// Usage
<Card title="Hello">
  <Label>Content goes here</Label>
  <Label>More content</Label>
</Card>;
```

### Map for Lists

```tsx
function List({ items }) {
  return (
    <View>
      {items.map((item) => (
        <Label key={item.id}>{item.name}</Label>
      ))}
    </View>
  );
}
```

### Conditional Rendering

```tsx
function Status({ isActive }) {
  return (
    <View>
      {isActive ? (
        <Label color="green">Active</Label>
      ) : (
        <Label color="red">Inactive</Label>
      )}
    </View>
  );
}
```

---

## Example: Shape Components

### shapes.tsx

```tsx
import { View, Label } from "./evg_types";

export function Star({ color = "#FFD700", size = "40px" }) {
  return (
    <Label fontSize={size} color={color}>
      ★
    </Label>
  );
}

export function Heart({ color = "#FF0000", size = "40px" }) {
  return (
    <Label fontSize={size} color={color}>
      ♥
    </Label>
  );
}

export function Badge({ color, children }) {
  return (
    <View backgroundColor={color} padding="5px 10px" borderRadius="10px">
      {children}
    </View>
  );
}

export function createStarPath(points = 5, outerR = 50, innerR = 25) {
  // Generate SVG path for star shape
  let path = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    path += (i === 0 ? "M" : "L") + x + "," + y;
  }
  return path + "Z";
}
```

### document.tsx

```tsx
import { Print, Section, Page, View, Label } from "./evg_types";
import { Star, Heart, Badge } from "./shapes";

function render() {
  return (
    <Print title="Shape Test">
      <Section pageWidth="595" pageHeight="842" margin="40px">
        <Page>
          <View width="100%" padding="20px">
            <Label fontSize="24px" fontWeight="bold">
              Custom Components
            </Label>

            <View flexDirection="row" marginTop="20px" gap="10px">
              <Star color="#FFD700" size="50px" />
              <Star color="#C0C0C0" size="40px" />
              <Star color="#CD7F32" size="30px" />
            </View>

            <View flexDirection="row" marginTop="20px" gap="10px">
              <Heart color="#FF0000" />
              <Heart color="#FF69B4" />
              <Heart color="#8B0000" />
            </View>

            <View marginTop="20px">
              <Badge color="#3B82F6">
                <Label color="#FFFFFF">New Feature</Label>
              </Badge>
            </View>
          </View>
        </Page>
      </Section>
    </Print>
  );
}
```

---

## Implementation Plan

### Step 1: Import Parser (2-3 days)

- [ ] Parse `import { X } from 'path'` statements
- [ ] Resolve relative file paths
- [ ] Load and parse imported files
- [ ] Build symbol table

### Step 2: Export Parser (1 day)

- [ ] Parse `export function` declarations
- [ ] Parse `export const` declarations
- [ ] Parse `export { }` statements

### Step 3: Expression Evaluator (3-4 days)

- [ ] Literals (number, string, boolean, null)
- [ ] Binary operators (+, -, \*, /, %, comparisons)
- [ ] Logical operators (&&, ||, !)
- [ ] Ternary operator (?:)
- [ ] Member access (obj.prop)
- [ ] Function calls
- [ ] Array literals
- [ ] Object literals

### Step 4: Function Evaluator (2 days)

- [ ] Parse function parameters
- [ ] Default parameter values
- [ ] Create execution context
- [ ] Evaluate function body
- [ ] Return statement handling

### Step 5: Component Expander (2 days)

- [ ] Detect component vs primitive elements
- [ ] Props evaluation
- [ ] Component function invocation
- [ ] Recursive expansion
- [ ] Children prop handling

### Step 6: Array Methods (1-2 days)

- [ ] `.map()` for list rendering
- [ ] `.filter()` for conditional lists
- [ ] `.join()` for string building

### Step 7: Testing & Integration (2 days)

- [ ] Unit tests for evaluator
- [ ] Integration with existing JSXToEVG
- [ ] Example components library

---

## File Structure

```
gallery/pdf_writer/
├── ComponentEngine.rgr      ; Main engine orchestrator
├── ImportResolver.rgr       ; Import/export handling
├── ExpressionEvaluator.rgr  ; JS expression evaluation
├── ComponentExpander.rgr    ; Component expansion logic
├── EvalContext.rgr          ; Variable scope/context
├── components/              ; Reusable component library
│   ├── shapes.tsx
│   ├── layout.tsx
│   ├── typography.tsx
│   └── index.tsx
└── test_components.tsx      ; Test file
```

---

## Limitations (Phase 1)

1. **No loops** - Use `.map()` for iteration
2. **No classes** - Function components only
3. **No async** - Synchronous evaluation only
4. **No destructuring** - Access props via `props.name`
5. **No spread** - Explicit prop passing
6. **No hooks** - Stateless components only
7. **Limited stdlib** - Math, String basics only

---

## Future Enhancements (Phase 2+)

- [ ] Default imports
- [ ] Destructuring in parameters
- [ ] Spread operator for props
- [ ] More array methods (reduce, find, etc.)
- [ ] String methods (split, trim, etc.)
- [ ] Math functions
- [ ] Date formatting
- [ ] SVG path generation utilities
- [ ] Component caching/memoization

---

## Phase 5: JSX to EVG Integration Testing

### Overview

Create a test pipeline that:

1. Parses TSX files using TSParser
2. Evaluates expressions using ExpressionEvaluator
3. Expands components into primitive EVG elements
4. Outputs EVG element tree for PDF rendering

### Test File Structure

```
gallery/pdf_writer/
├── test/
│   ├── jsx_to_evg.test.js       ; Integration tests
│   └── fixtures/
│       ├── simple_component.tsx  ; Single component test
│       ├── nested_components.tsx ; Component composition
│       ├── props_test.tsx        ; Props passing
│       ├── expressions.tsx       ; Expression evaluation
│       └── shapes/
│           └── Star.tsx          ; Importable component
```

### Test Case 1: Simple Component Rendering

**Input: `simple_component.tsx`**

```tsx
function render() {
  return (
    <View width="100" height="50" backgroundColor="#f0f0f0">
      <Label fontSize="16" color="#333">
        Hello World
      </Label>
    </View>
  );
}
```

**Expected EVG Output:**

```json
{
  "type": "View",
  "props": {
    "width": "100",
    "height": "50",
    "backgroundColor": "#f0f0f0"
  },
  "children": [
    {
      "type": "Label",
      "props": {
        "fontSize": "16",
        "color": "#333"
      },
      "children": ["Hello World"]
    }
  ]
}
```

### Test Case 2: Expression Evaluation in Props

**Input: `expressions.tsx`**

```tsx
function render() {
  const width = 100;
  const height = width * 0.5;
  const isLarge = width > 50;

  return (
    <View
      width={width}
      height={height}
      backgroundColor={isLarge ? "#blue" : "#gray"}
    >
      <Label fontSize={width / 5}>
        Size: {width}x{height}
      </Label>
    </View>
  );
}
```

**Expected EVG Output:**

```json
{
  "type": "View",
  "props": {
    "width": 100,
    "height": 50,
    "backgroundColor": "#blue"
  },
  "children": [
    {
      "type": "Label",
      "props": { "fontSize": 20 },
      "children": ["Size: 100x50"]
    }
  ]
}
```

### Test Case 3: Component Import and Expansion

**Input: `shapes/Star.tsx`**

```tsx
export function Star({ color = "#FFD700", size = 40 }) {
  return (
    <Label fontSize={size} color={color}>
      ★
    </Label>
  );
}
```

**Input: `nested_components.tsx`**

```tsx
import { Star } from "./shapes/Star";

function render() {
  return (
    <View flexDirection="row" gap="10">
      <Star color="#FFD700" size={50} />
      <Star color="#C0C0C0" size={40} />
      <Star color="#CD7F32" size={30} />
    </View>
  );
}
```

**Expected EVG Output:**

```json
{
  "type": "View",
  "props": {
    "flexDirection": "row",
    "gap": "10"
  },
  "children": [
    {
      "type": "Label",
      "props": { "fontSize": 50, "color": "#FFD700" },
      "children": ["★"]
    },
    {
      "type": "Label",
      "props": { "fontSize": 40, "color": "#C0C0C0" },
      "children": ["★"]
    },
    {
      "type": "Label",
      "props": { "fontSize": 30, "color": "#CD7F32" },
      "children": ["★"]
    }
  ]
}
```

### Test Case 4: Children Prop

**Input: `children_test.tsx`**

```tsx
function Card({ title, children }) {
  return (
    <View backgroundColor="#fff" padding="20">
      <Label fontSize="18" fontWeight="bold">
        {title}
      </Label>
      <View marginTop="10">{children}</View>
    </View>
  );
}

function render() {
  return (
    <Card title="My Card">
      <Label>First line</Label>
      <Label>Second line</Label>
    </Card>
  );
}
```

**Expected EVG Output:**

```json
{
  "type": "View",
  "props": { "backgroundColor": "#fff", "padding": "20" },
  "children": [
    {
      "type": "Label",
      "props": { "fontSize": "18", "fontWeight": "bold" },
      "children": ["My Card"]
    },
    {
      "type": "View",
      "props": { "marginTop": "10" },
      "children": [
        { "type": "Label", "props": {}, "children": ["First line"] },
        { "type": "Label", "props": {}, "children": ["Second line"] }
      ]
    }
  ]
}
```

### Test Case 5: Array.map() for Lists

**Input: `list_test.tsx`**

```tsx
function render() {
  const items = ["Apple", "Banana", "Cherry"];

  return (
    <View>
      {items.map((item) => (
        <Label>• {item}</Label>
      ))}
    </View>
  );
}
```

**Expected EVG Output:**

```json
{
  "type": "View",
  "props": {},
  "children": [
    { "type": "Label", "props": {}, "children": ["• Apple"] },
    { "type": "Label", "props": {}, "children": ["• Banana"] },
    { "type": "Label", "props": {}, "children": ["• Cherry"] }
  ]
}
```

### Test Case 6: Conditional Rendering

**Input: `conditional_test.tsx`**

```tsx
function render() {
  const showDetails = true;
  const count = 5;

  return (
    <View>
      <Label>Count: {count}</Label>
      {showDetails && <Label color="#666">Details visible</Label>}
      {count > 3 ? (
        <Label color="green">High</Label>
      ) : (
        <Label color="red">Low</Label>
      )}
    </View>
  );
}
```

**Expected EVG Output:**

```json
{
  "type": "View",
  "props": {},
  "children": [
    { "type": "Label", "props": {}, "children": ["Count: 5"] },
    {
      "type": "Label",
      "props": { "color": "#666" },
      "children": ["Details visible"]
    },
    { "type": "Label", "props": { "color": "green" }, "children": ["High"] }
  ]
}
```

---

## Implementation: JSX to EVG Converter

### Core Module: `jsx_to_evg.js`

```javascript
/**
 * JSXToEVG - Converts parsed TSX AST to EVG element tree
 *
 * Dependencies:
 * - TSParser (ts_parser_module.cjs)
 * - EvalValue (eval_value_module.cjs)
 */

class JSXToEVG {
  constructor() {
    this.context = {}; // Variable context
    this.components = {}; // Registered components
    this.imports = {}; // Imported symbols
  }

  // Parse and evaluate a TSX file
  evaluate(source, basePath = ".") {
    // 1. Parse the source
    const ast = this.parse(source);

    // 2. Process imports
    this.processImports(ast, basePath);

    // 3. Register local components
    this.registerComponents(ast);

    // 4. Find and evaluate render()
    const renderFn = this.findRenderFunction(ast);
    if (!renderFn) {
      throw new Error("No render() function found");
    }

    // 5. Evaluate render function body
    return this.evaluateFunction(renderFn);
  }

  // Convert JSX element to EVG
  jsxToEVG(jsxNode) {
    const tagName = jsxNode.tagName;

    // Check if it's a component (capitalized)
    if (this.isComponent(tagName)) {
      return this.expandComponent(tagName, jsxNode);
    }

    // Primitive element - convert directly
    return this.createEVGElement(jsxNode);
  }

  // Expand a component call
  expandComponent(name, jsxNode) {
    const component = this.components[name] || this.imports[name];
    if (!component) {
      throw new Error(`Unknown component: ${name}`);
    }

    // Evaluate props
    const props = this.evaluateProps(jsxNode.attributes);

    // Add children to props
    if (jsxNode.children && jsxNode.children.length > 0) {
      props.children = jsxNode.children.map((c) => this.processChild(c));
    }

    // Call component function with props
    const result = this.callComponent(component, props);

    // Recursively convert result to EVG
    return this.jsxToEVG(result);
  }

  // Create EVG element from primitive JSX
  createEVGElement(jsxNode) {
    return {
      type: jsxNode.tagName,
      props: this.evaluateProps(jsxNode.attributes),
      children: (jsxNode.children || []).map((c) => this.processChild(c)),
    };
  }

  // Process a child node (text, expression, or element)
  processChild(child) {
    if (child.nodeType === "JSXText") {
      return child.value.trim();
    }
    if (child.nodeType === "JSXExpressionContainer") {
      return this.evaluateExpression(child.expression);
    }
    if (child.nodeType === "JSXElement") {
      return this.jsxToEVG(child);
    }
    return null;
  }
}
```

### Test Runner: `test/jsx_to_evg.test.js`

```javascript
import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { join } from "path";

const require = createRequire(import.meta.url);
const {
  TSLexer,
  TSParserSimple,
} = require("../../ts_parser/benchmark/ts_parser_module.cjs");
const { EvalValue } = require("../bin/eval_value_module.cjs");

// ... JSXToEVG implementation

describe("JSX to EVG Conversion", () => {
  let converter;

  beforeEach(() => {
    converter = new JSXToEVG();
  });

  describe("Simple Elements", () => {
    it("converts View with props", () => {
      const source = `
        function render() {
          return <View width="100" height="50" />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.props.width).toBe("100");
      expect(evg.props.height).toBe("50");
    });

    it("converts nested elements", () => {
      const source = `
        function render() {
          return (
            <View>
              <Label>Hello</Label>
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.children).toHaveLength(1);
      expect(evg.children[0].type).toBe("Label");
    });
  });

  describe("Expression Evaluation", () => {
    it("evaluates numeric expressions in props", () => {
      const source = `
        function render() {
          const width = 100;
          return <View width={width * 2} />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.width).toBe(200);
    });

    it("evaluates ternary in props", () => {
      const source = `
        function render() {
          const dark = true;
          return <View backgroundColor={dark ? "#000" : "#fff"} />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.backgroundColor).toBe("#000");
    });

    it("evaluates string interpolation", () => {
      const source = `
        function render() {
          const name = "World";
          return <Label>Hello {name}!</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children.join("")).toContain("World");
    });
  });

  describe("Component Expansion", () => {
    it("expands local component", () => {
      const source = `
        function Star({ color }) {
          return <Label color={color}>★</Label>;
        }
        
        function render() {
          return <Star color="#gold" />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("Label");
      expect(evg.props.color).toBe("#gold");
      expect(evg.children[0]).toBe("★");
    });

    it("handles default props", () => {
      const source = `
        function Star({ color = "#FFD700", size = 40 }) {
          return <Label fontSize={size} color={color}>★</Label>;
        }
        
        function render() {
          return <Star />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.color).toBe("#FFD700");
      expect(evg.props.fontSize).toBe(40);
    });
  });

  describe("Children Handling", () => {
    it("passes children to component", () => {
      const source = `
        function Box({ children }) {
          return <View padding="10">{children}</View>;
        }
        
        function render() {
          return (
            <Box>
              <Label>Inside</Label>
            </Box>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.children[0].type).toBe("Label");
    });
  });

  describe("Array.map()", () => {
    it("renders list with map", () => {
      const source = `
        function render() {
          const items = ["A", "B", "C"];
          return (
            <View>
              {items.map(x => <Label>{x}</Label>)}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(3);
      expect(evg.children[0].children[0]).toBe("A");
    });
  });

  describe("Conditional Rendering", () => {
    it("renders with && operator", () => {
      const source = `
        function render() {
          const show = true;
          return (
            <View>
              {show && <Label>Visible</Label>}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(1);
    });

    it("skips with && when false", () => {
      const source = `
        function render() {
          const show = false;
          return (
            <View>
              {show && <Label>Hidden</Label>}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      // false should not render
      expect(evg.children.filter((c) => c && c.type)).toHaveLength(0);
    });
  });
});
```

---

## Implementation Checklist

### Step 1: Basic JSX to EVG (Current Focus)

- [ ] Create `jsx_to_evg.js` test file
- [ ] Parse simple JSX with TSParser
- [ ] Extract render function from AST
- [ ] Convert JSXElement to EVG object structure
- [ ] Handle string props
- [ ] Handle expression props with evaluator
- [ ] Handle text children

### Step 2: Variable Context

- [ ] Parse variable declarations (const, let)
- [ ] Build context from statements before return
- [ ] Lookup variables in expressions
- [ ] Support basic assignment

### Step 3: Local Components

- [ ] Detect function declarations
- [ ] Register as components
- [ ] Parse function parameters
- [ ] Handle default parameter values
- [ ] Create props object from JSX attributes
- [ ] Invoke component with context

### Step 4: Children and Nesting

- [ ] Pass children array to components
- [ ] Support `{children}` in JSX
- [ ] Handle multiple children
- [ ] Handle mixed text and element children

### Step 5: Array Methods

- [ ] Implement `.map()` evaluation
- [ ] Support arrow function callbacks
- [ ] Handle implicit return in arrows
- [ ] Flatten mapped results into children

### Step 6: Import System

- [ ] Parse import statements
- [ ] Resolve file paths
- [ ] Load and parse imported files
- [ ] Extract exports
- [ ] Register imported components

---

## Next Immediate Actions

1. **Create test file**: `gallery/pdf_writer/test/jsx_to_evg.test.js`
2. **Start with simplest case**: `<View width="100" />` → `{ type: "View", props: { width: "100" } }`
3. **Add nested elements**: Parent with children
4. **Add expression props**: Using existing expression evaluator
5. **Add local components**: Single-file components first
