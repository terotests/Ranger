# JavaScript ES6+ Parser

A comprehensive JavaScript ES6+ parser written in Ranger with a pretty-printer that can parse and re-emit formatted JavaScript code.

## Status

✅ **Functional** - Parses and prints most ES6+ features

## Features

- **Full lexer** with support for all JavaScript token types
- **Recursive descent parser** with proper operator precedence
- **Pretty printer** that outputs formatted JavaScript from AST
- **Comment preservation** - line comments, block comments, and JSDoc
- **Source positions** tracked (line, column, offset)
- **Cross-platform** - compiles to JS, Go, Rust, Python, etc.

## Usage

```bash
# Compile the parser (from Ranger root)
$env:RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr"
node bin/output.js gallery/js_parser/js_parser_main.rgr -o=js_parser.js -d=gallery/js_parser

# Parse and pretty-print a JavaScript file
node gallery/js_parser/js_parser.js -i input.js -o output.js

# Show AST instead of pretty-printed code
node gallery/js_parser/js_parser.js -i input.js --ast

# Use default test files (test_input.js -> test_output.js)
node gallery/js_parser/js_parser.js -d

# Show help
node gallery/js_parser/js_parser.js -h
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-i <file>` | Input JavaScript file |
| `-o <file>` | Output file (default: stdout) |
| `-d` | Use default files (test_input.js → test_output.js) |
| `--ast` | Output AST tree instead of formatted code |
| `-h` | Show help |

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

| File | Description |
|------|-------------|
| `js_parser_main.rgr` | CLI entry point with argument parsing |
| `js_parser_core.rgr` | Core parser with JSNode and SimpleParser |
| `js_lexer.rgr` | Tokenizer for JavaScript |
| `js_token.rgr` | Token class definition |
| `js_printer.rgr` | Pretty-printer (AST → formatted JS) |
| `js_parser.js` | Compiled JavaScript output |
| `test_input.js` | Comprehensive test file with ES6+ features |
| `test_output.js` | Parser output for comparison |

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
const double = x => (x * 2);

// Class with extends
class Dog extends Animal {
  constructor(name) {
    super(name);
  }
  speak() {
    return (this.name + ' barks');
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
- `import`/`export` (ES modules)
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Private class fields (`#field`)
- Decorators
- Regular expression literals
- Tagged template literals

## Development

```bash
# Run tests
node gallery/js_parser/js_parser.js -d

# Check for parse errors (displayed on stderr)
node gallery/js_parser/js_parser.js -i myfile.js -o /dev/null
```
