# JavaScript ES6+ Parser

A comprehensive JavaScript ES6+ parser written in Ranger with a pretty-printer that can parse and re-emit formatted JavaScript code.

## Status

✅ **Functional** - Parses and prints most ES6+ features
✅ **Multi-target** - Compiles to JavaScript, Swift, and more

## Features

- **Full lexer** with support for all JavaScript token types
- **Recursive descent parser** with proper operator precedence
- **Pretty printer** that outputs formatted JavaScript from AST
- **Comment preservation** - line comments, block comments, and JSDoc
- **Source positions** tracked (line, column, offset)
- **Cross-platform** - compiles to JS, Swift, Go, Python, etc.

## Usage

### JavaScript Version

```bash
# Compile the parser (from Ranger root)
node bin/output.js gallery/js_parser/js_parser_main.rgr -o=js_parser.js -d=gallery/js_parser

# Parse and pretty-print a JavaScript file
node gallery/js_parser/js_parser.js -i input.js -o output.js

# Show AST instead of pretty-printed code
node gallery/js_parser/js_parser.js -i input.js --ast

# Use demo mode with built-in test code
node gallery/js_parser/js_parser.js -d

# Show help
node gallery/js_parser/js_parser.js -h
```

### Swift Version

```bash
# Compile to Swift (from gallery/js_parser directory)
node ../../bin/output.js js_parser_main.rgr -l=swift6 -o js_parser.swift

# Fix line endings for macOS (CRLF -> LF)
sed -i '' $'s/\r$//' bin/js_parser_main.swift

# Compile Swift binary
swiftc -o js_parser_swift bin/js_parser_main.swift

# Run the Swift binary
./js_parser_swift -i input.js --ast
./js_parser_swift -d
```

### CLI Options

| Option      | Description                                        |
| ----------- | -------------------------------------------------- |
| `-i <file>` | Input JavaScript file                              |
| `-o <file>` | Output file (default: stdout)                      |
| `-d`        | Use default files (test_input.js → test_output.js) |
| `--ast`     | Output AST tree instead of formatted code          |
| `-h`        | Show help                                          |

## Supported JavaScript Features

### ES5 Features

- Variable declarations (`var`)
- Function declarations and expressions
- Control flow (`if`/`else`, `while`, `for`, `for-in`, `switch`, `try`/`catch`/`finally`)
- All operators (arithmetic, comparison, logical, bitwise, assignment)
- Unary operators (`!`, `-`, `+`, `~`, `typeof`, `void`, `delete`)
- Update expressions (`++`, `--` prefix and postfix)
- Object and array literals
- Member expressions (dot and bracket notation)
- Call expressions
- Ternary conditional (`? :`)
- `new` expressions
- `this` keyword

### ES6+ Features

- `let` and `const` declarations
- Arrow functions (`=>`) with expression and block bodies
- Template literals with interpolation (`` `Hello ${name}` ``)
- Classes with `constructor`, methods, `static`, getters, `extends`, `super`
- `for-of` loops
- Spread operator in arrays (`[...arr]`)
- Spread operator in objects (`{...obj}`)
- Spread in function calls (`fn(...args)`)
- Rest parameters (`function(...args)`)
- Destructuring assignments (array and object patterns)
- Shorthand property names (`{ x, y }`)
- Computed property names (`{ [expr]: value }`)
- Generator functions (`function*`, `yield`, `yield*`)
- Async/await (`async function`, `await`)
- Async arrow functions (`async () => {}`)
- Async generators (`async function*`)

### ES6 Modules

- Import declarations (`import x from "module"`)
- Default imports (`import React from "react"`)
- Named imports (`import { x, y } from "module"`)
- Namespace imports (`import * as utils from "module"`)
- Import aliases (`import { x as y } from "module"`)
- Side-effect imports (`import "polyfill"`)
- Combined imports (`import React, { useState } from "react"`)
- Export declarations (`export const x = 1`)
- Default exports (`export default function() {}`)
- Named exports (`export { x, y }`)
- Export aliases (`export { x as y }`)
- Re-exports (`export { x } from "module"`)
- Export all (`export * from "module"`)
- Export all as namespace (`export * as utils from "module"`)

### Modern Operators

- Optional chaining (`?.`) for property access (`obj?.prop`)
- Optional chaining for bracket notation (`obj?.["key"]`)
- Optional chaining for method calls (`obj?.method?.()`)
- Nullish coalescing (`??`) operator (`value ?? default`)

### Regular Expressions

- Regex literals (`/pattern/flags`)
- All standard flags (`g`, `i`, `m`, `s`, `u`, `y`)
- Character classes (`[abc]`, `[^0-9]`, `[a-z]`)
- Escape sequences (`\d`, `\w`, `\s`, `\b`, etc.)
- Quantifiers (`+`, `*`, `?`, `{n}`, `{n,m}`)
- Anchors and groups (`^`, `$`, `()`, `(?:)`, `|`)
- Regex in expressions, conditions, and as arguments

### Comments

- Single-line comments (`// ...`)
- Multi-line block comments (`/* ... */`)
- JSDoc comments (`/** ... */`)
- Comments are attached to AST nodes and preserved in output

## Architecture

The parser uses a unified `JSNode` AST structure where node type is stored in `nodeType` field:

```
JSNode {
  nodeType: string      // "Identifier", "BinaryExpression", etc.
  strValue: string      // Primary value (name, operator, literal value)
  strValue2: string     // Secondary value (literal type, property access type)
  left: JSNode          // Left child / callee / object
  right: JSNode         // Right child / property expression
  test: JSNode          // Condition expression
  body: JSNode          // Body (function, loop, class)
  alternate: JSNode     // Else branch
  children: [JSNode]    // Array of children (params, elements, properties)
  leadingComments: [JSNode]  // Attached comments
}
```

## Files

| File                 | Description                                |
| -------------------- | ------------------------------------------ |
| `js_parser_main.rgr` | CLI entry point with argument parsing      |
| `js_parser_core.rgr` | Core parser with JSNode and SimpleParser   |
| `js_lexer.rgr`       | Tokenizer for JavaScript                   |
| `js_token.rgr`       | Token class definition                     |
| `js_printer.rgr`     | Pretty-printer (AST → formatted JS)        |
| `js_parser.js`       | Compiled JavaScript output                 |
| `js_parser.swift`    | Compiled Swift output                      |
| `js_parser_swift`    | Compiled Swift binary (macOS)              |
| `test_input.js`      | Comprehensive test file with ES6+ features |
| `test_output.js`     | Parser output for comparison               |

## Example

Input:

```javascript
// Arrow function
const double = (x) => x * 2;

// Class with extends
class Dog extends Animal {
  constructor(name) {
    super(name);
  }
  speak() {
    return this.name + " barks";
  }
}

// Async/await
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

// Spread and computed properties
const merged = { ...obj1, [key]: value };
console.log(...args);
```

Output (pretty-printed):

```javascript
// Arrow function
const double = (x) => x * 2;

// Class with extends
class Dog extends Animal {
  constructor(name) {
    super(name);
  }
  speak() {
    return this.name + " barks";
  }
}

// Async/await
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

// Spread and computed properties
const merged = { ...obj1, [key]: value };
console.log(...args);
```

## Limitations

Features not yet supported:

- Private class fields (`#field`)
- Decorators
- Tagged template literals

## Development

```bash
# Run tests
node gallery/js_parser/js_parser.js -d

# Check for parse errors (displayed on stderr)
node gallery/js_parser/js_parser.js -i myfile.js -o /dev/null
```
