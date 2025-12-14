# JavaScript ES5 Parser

A JavaScript ES5 parser written in Ranger that outputs AST with source positions.

## Status

🚧 **In Development**

## Features

- Tokenizes JavaScript ES5 source code
- Produces ESTree-compatible AST
- Tracks source positions (line, column, offset)
- Cross-platform: compiles to JS, Go, Rust, etc.

## Usage

```bash
# Compile the parser
npm run jsparser:compile

# Parse a JavaScript file
npm run jsparser:run
# or
node gallery/js_parser/js_parser.js <input.js>
```

## Output Format

The parser outputs JSON AST:

```json
{
  "type": "Program",
  "start": 0,
  "end": 10,
  "line": 1,
  "column": 1,
  "body": [...]
}
```

## Supported ES5 Constructs

- Variable declarations (`var`)
- Function declarations and expressions
- Control flow (`if`, `while`, `for`, `switch`, `try/catch`)
- All ES5 operators and expressions
- Object and array literals
- Comments (preserved as metadata)

## Files

- `js_parser.rgr` - Main parser entry point
- `js_lexer.rgr` - Tokenizer
- `js_ast.rgr` - AST node definitions
- `js_tokens.rgr` - Token type definitions
- `test_input.js` - Sample test file
