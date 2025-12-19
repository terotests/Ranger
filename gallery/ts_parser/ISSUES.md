# TSX Parser Known Issues

## Issue #1: Apostrophe in JSX Text Content Breaks Parsing

**Status:** Open  
**Severity:** Medium  
**Date Discovered:** 2024-12-17

### Description

When JSX text content contains an apostrophe character (`'`), the parser produces multiple parse errors and fails to correctly parse subsequent elements.

### Reproduction

```tsx
function render() {
  return (
    <View>
      <span>Rusty's heart raced</span> {/* This breaks parsing */}
      <View>This element may not be parsed correctly</View>
    </View>
  );
}
```

### Error Output

```
Parse error: expected '<' but got ''
Parse error: expected '/' but got ''
Parse error: expected '>' but got ''
...
```

### Workaround

Avoid using apostrophes in text content. Rewrite text to not use contractions or possessives:

```tsx
// Instead of:
<span>Rusty's heart</span>

// Use:
<span>Rusty felt his heart</span>
```

### Root Cause Analysis

The TSX lexer likely treats the apostrophe as a string delimiter, causing it to incorrectly tokenize the remaining content. The JSXText parsing logic may not properly handle single quotes within text content.

### Suggested Fix

In `ts_lexer.rgr` or `ts_parser_simple.rgr`:

1. When in JSX context (between `>` and `</`), treat text content differently
2. Only recognize `<` and `{` as special characters that end JSXText
3. Do not treat `'` as a string delimiter within JSXText nodes

### Related Files

- `gallery/ts_parser/ts_lexer.rgr` - Tokenizer
- `gallery/ts_parser/ts_parser_simple.rgr` - Parser with JSX support

---

## Issue #2: Line Spacing in Multi-line Wrapped Text

**Status:** Open  
**Severity:** Low  
**Date Discovered:** 2024-12-17

### Description

When text wraps across multiple lines, the vertical spacing between wrapped lines appears inconsistent or overlapping in PDF output.

### Possible Causes

1. Layout engine height calculation doesn't account for actual wrapped line count
2. PDF renderer line spacing calculation may need adjustment
3. Text baseline positioning may be incorrect

### Related Files

- `gallery/pdf_writer/EVGPDFRenderer.rgr` - `renderText()` and `wrapText()` functions
- `gallery/evg/EVGLayout.rgr` - Text height calculation

---

## Issue #3: Ternary/Conditional Expression Not Parsed

**Status:** ✅ FIXED (2024-12-19)  
**Severity:** High  
**Date Discovered:** 2024-12-19

### Description

The parser does not recognize ternary/conditional expressions (`condition ? trueValue : falseValue`). Instead of producing a `ConditionalExpression` node, it returns only the condition part as an `Identifier`.

### Reproduction

```typescript
a ? 1 : 2;
```

### Expected AST

```json
{
  "nodeType": "ConditionalExpression",
  "test": { "nodeType": "Identifier", "name": "a" },
  "consequent": { "nodeType": "NumericLiteral", "value": "1" },
  "alternate": { "nodeType": "NumericLiteral", "value": "2" }
}
```

### Actual AST

```json
{
  "nodeType": "Identifier",
  "name": "a"
}
```

The `? 1 : 2` part is completely ignored.

### Impact

- Expression evaluation in component systems cannot use ternary operators
- Common patterns like `{condition ? <A/> : <B/>}` in JSX won't work correctly
- Template expressions with conditional logic fail

### Suggested Fix

In `ts_parser_simple.rgr`, add ternary operator parsing after binary expression parsing:

1. After parsing a primary/binary expression, check if next token is `?`
2. If so, parse the consequent expression
3. Expect `:` token
4. Parse the alternate expression
5. Return `ConditionalExpression` node with test, consequent, alternate

### Related Files

- `gallery/ts_parser/ts_parser_simple.rgr` - Expression parsing

---

## Issue #4: Multiple Binary Operators Not Supported

**Status:** ✅ FIXED (2024-12-19)  
**Severity:** High  
**Date Discovered:** 2024-12-19

### Description

Several important binary operators are not parsed correctly. The parser returns only the left operand and ignores the operator and right operand.

### Affected Operators

| Operator | Description      | Test Code         | Result                           |
| -------- | ---------------- | ----------------- | -------------------------------- |
| `==`     | Equality         | `5 == 5`          | Returns `5` (NumericLiteral)     |
| `!=`     | Inequality       | `5 != 3`          | Returns `5` (NumericLiteral)     |
| `<=`     | Less or equal    | `5 <= 5`          | Returns `5` (NumericLiteral)     |
| `>=`     | Greater or equal | `5 >= 5`          | Returns `5` (NumericLiteral)     |
| `%`      | Modulo           | `17 % 5`          | Returns `17` (NumericLiteral)    |
| `&&`     | Logical AND      | `true && false`   | Returns `true` (BooleanLiteral)  |
| `\|\|`   | Logical OR       | `false \|\| true` | Returns `false` (BooleanLiteral) |

### Working Operators

These operators work correctly: `+`, `-`, `*`, `/`, `<`, `>`

### Impact

- Cannot use equality comparisons in expressions
- Cannot use logical operators for conditional logic
- Cannot use modulo operator for arithmetic
- Breaks common expression patterns like `a == b`, `x && y`, `count % 2`

### Suggested Fix

In `ts_parser_simple.rgr`, extend the binary operator parsing to include:

1. Add `==`, `!=`, `===`, `!==` to comparison operators
2. Add `<=`, `>=` to comparison operators (may need two-character token handling)
3. Add `%` to arithmetic operators
4. Add `&&`, `||` as logical operators (may need lower precedence than comparison)

### Related Files

- `gallery/ts_parser/ts_parser_simple.rgr` - Expression parsing
- `gallery/ts_parser/ts_lexer.rgr` - Token recognition

---

## Issue #5: Object Literals Parsed as Block Statements

**Status:** ✅ WORKAROUND DOCUMENTED  
**Severity:** Medium  
**Date Discovered:** 2024-12-19

### Description

Object literal expressions like `{}` or `{ name: "test" }` are incorrectly parsed as `BlockStatement` nodes instead of `ObjectExpression` nodes when used as standalone expressions.

### Reproduction

```typescript
{}
{ name: "test", value: 42 }
```

### Expected AST

```json
{
  "nodeType": "ObjectExpression",
  "properties": [...]
}
```

### Actual AST

```json
{
  "nodeType": "BlockStatement",
  "children": [
    { "nodeType": "LabeledStatement", "name": "name", ... }
  ]
}
```

### Impact

- Cannot use inline object literals in expressions
- Breaks patterns like `const obj = { a: 1 }` at expression level
- JSX attribute objects may not work: `<Comp style={{ color: "red" }} />`

### Workaround

Wrap object literals in parentheses to force expression context:

```typescript
({ name: "test" });
```

### Suggested Fix

This is a common parser ambiguity. Options:

1. In expression context, prefer `ObjectExpression` over `BlockStatement`
2. Look ahead after `{` to distinguish: if followed by `identifier:`, parse as object

### Related Files

- `gallery/ts_parser/ts_parser_simple.rgr` - Statement/expression parsing

---

## Issue #6: Exponentiation Operator (\*\*) Precedence Incorrect

**Status:** Open  
**Severity:** Low  
**Date Discovered:** 2024-12-19

### Description

The exponentiation operator (`**`) is parsed with the same precedence as multiplication (`*`, `/`, `%`), but in JavaScript it should have higher precedence and be right-associative.

### Reproduction

```typescript
2 * 3 ** 2;
```

### Expected Behavior

Should parse as `2 * (3 ** 2)` = `2 * 9` = `18`

AST structure:

```
BinaryExpression (*)
├── left: 2
└── right: BinaryExpression (**)
    ├── left: 3
    └── right: 2
```

### Actual Behavior

Parses as `(2 * 3) ** 2` = `6 ** 2` = `36`

AST structure:

```
BinaryExpression (**)
├── left: BinaryExpression (*)
│   ├── left: 2
│   └── right: 3
└── right: 2
```

### Impact

- Mathematical expressions using `**` with `*` or `/` will compute incorrectly
- Relatively rare in practice, most code uses parentheses or `Math.pow()`

### Workaround

Use explicit parentheses:

```typescript
2 * 3 ** 2;
```

### Suggested Fix

Add a separate `parseExponentiation()` function between `parseMultiplicative()` and `parseUnary()`:

```ranger
fn parseExponentiation:TSNode () {
  def left (this.parseUnary())

  if (this.peekValue() == "**") {
    this.advance()
    ; Right-associative: recurse to parseExponentiation, not parseUnary
    def right (this.parseExponentiation())

    def expr (new TSNode())
    expr.nodeType = "BinaryExpression"
    expr.value = "**"
    expr.left = left
    expr.right = right
    return expr
  }

  return left
}
```

Then update `parseMultiplicative()` to call `parseExponentiation()` instead of `parseUnary()`.

### Related Files

- `gallery/ts_parser/ts_parser_simple.rgr` - `parseMultiplicative()` function

---

## Issue #7: Object Pattern Destructuring in Function Parameters Not Parsed

**Status:** ✅ FIXED (2024-12-19)  
**Severity:** High  
**Date Discovered:** 2024-12-19

### Description

When a function uses object destructuring in its parameters (common React/component pattern), the parser incorrectly breaks the destructuring pattern into separate `Parameter` nodes instead of recognizing it as an `ObjectPattern`.

### Reproduction

```typescript
function Star({ color = "#FFD700", size = 40 }) {
  return color + size;
}
```

### Expected AST

```json
{
  "nodeType": "FunctionDeclaration",
  "name": "Star",
  "params": [
    {
      "nodeType": "ObjectPattern",
      "children": [
        {
          "nodeType": "Property",
          "name": "color",
          "left": { "nodeType": "StringLiteral", "value": "#FFD700" }
        },
        {
          "nodeType": "Property",
          "name": "size",
          "left": { "nodeType": "NumericLiteral", "value": "40" }
        }
      ]
    }
  ]
}
```

### Actual AST

```json
{
  "nodeType": "FunctionDeclaration",
  "name": "Star",
  "params": [
    { "nodeType": "Parameter", "name": "{" },
    { "nodeType": "Parameter", "name": "=" },
    { "nodeType": "Parameter", "name": "," },
    { "nodeType": "Parameter", "name": "=" },
    { "nodeType": "Parameter", "name": "}" }
  ]
}
```

The destructuring is completely broken into individual tokens.

### Impact

- **Component props cannot be destructured** - Very common React pattern
- **Default prop values don't work** - Can't use `{ color = "red" }` syntax
- Blocks idiomatic React/JSX component patterns
- Forces workaround of using `props.xxx` access

### Workaround

Use simple `props` parameter and access properties directly:

```typescript
// Instead of:
function Star({ color = "#FFD700" }) {
  return <Label color={color}>★</Label>;
}

// Use:
function Star(props) {
  const color = props.color || "#FFD700";
  return <Label color={color}>★</Label>;
}
```

### Suggested Fix

In `ts_parser_simple.rgr`, the function parameter parsing needs to detect `{` as the start of an `ObjectPattern` and parse it accordingly:

```ranger
fn parseParam:TSNode () {
  if (this.peekValue() == "{") {
    return (this.parseObjectPattern())
  }
  ; ... existing parameter parsing
}
```

The `parseObjectPattern()` function already exists for variable declarations but may need to handle:

1. Default values with `=`
2. Shorthand properties
3. Nested destructuring

### Related Files

- `gallery/ts_parser/ts_parser_simple.rgr` - Function parameter parsing
- Look for `parseParams` or similar function

### Fix Applied

Modified `parseParam()` to detect `{` and call `parseObjectPattern()`. Also updated `parseObjectPattern()` to set both `init` and `left` for default values.

---

## Issue #8: TypeScript Type Keywords Not Usable as Variable Names

**Status:** FIXED (2024-12-19)  
**Severity:** Medium  
**Date Discovered:** 2024-12-19

### Description

TypeScript primitive type keywords (`symbol`, `string`, `number`, `boolean`, `object`, `undefined`, `never`, `unknown`, `any`) could not be used as variable names in expression context because the lexer categorizes them as `TSType` tokens, and `parsePrimary()` only handled `Identifier` tokens.

### Reproduction

```ypescript
function Icon({ symbol }) {
  return <Label>{symbol}</Label>;
}
```

### Expected Behavior

`symbol` should be recognized as an identifier variable name when used in expression context like `{symbol}`.

### Actual Behavior

The parser returned an error node with `name: "error"` because `parsePrimary()` didn't recognize `TSType` tokens.

### Fix Applied

Updated `parsePrimary()` to also accept `TSType` tokens as identifiers:

```
anger
fn parsePrimary:TSNode () {
  ; Identifier (including TSType keywords used as variable names)
  if ((tokType == "Identifier") || (tokType == "TSType")) {
    ; ...parse as identifier
  }
}
```

### Related Files

- `gallery/ts_parser/ts_parser_simple.rgr` - `parsePrimary()` function (line ~3778)
