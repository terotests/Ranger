# JavaScript ES5 Parser Implementation Plan

## Overview

Implement a JavaScript ES5 AST parser using the Ranger language. The parser will tokenize and parse JavaScript source code, producing an Abstract Syntax Tree (AST) with node types, children, and source position information.

## Goals

- **ES5 Only**: Keep scope limited to ECMAScript 5.1 specification
- **Written in Ranger**: Parser implemented in `.rgr` files
- **Cross-Platform Output**: Parser can be compiled to JS, Go, Rust, etc.
- **AST Output**: Each node contains type, children, and source positions

## Project Location

```
gallery/js_parser/
├── js_parser.rgr          # Main parser entry point
├── js_lexer.rgr           # Tokenizer/Lexer
├── js_ast.rgr             # AST node definitions
├── js_tokens.rgr          # Token type definitions
├── test_input.js          # Sample JS file to parse
└── README.md              # Usage instructions
```

## Phase 1: Token Definitions

Define all ES5 token types:

### Keywords

```
break, case, catch, continue, debugger, default, delete, do, else,
finally, for, function, if, in, instanceof, new, return, switch,
this, throw, try, typeof, var, void, while, with
```

### Punctuators

```
{ } ( ) [ ] . ; , < > <= >= == != === !== + - * % ++ --
<< >> >>> & | ^ ! ~ && || ? : = += -= *= %= <<= >>= >>>= &= |= ^=
```

### Literals

- Null: `null`
- Boolean: `true`, `false`
- Numeric: integers, floats, hex, octal, exponential
- String: single and double quoted, escape sequences
- RegExp: `/pattern/flags`

### Identifiers

- Start with: `a-z A-Z _ $`
- Continue with: `a-z A-Z 0-9 _ $`

## Phase 2: Lexer Implementation

```ranger
class Token {
    def type:string ""           ; Token type name
    def value:string ""          ; Literal value
    def line:int 0               ; Source line (1-based)
    def column:int 0             ; Source column (1-based)
    def start:int 0              ; Start offset in source
    def end:int 0                ; End offset in source
}

class Lexer {
    def source:string ""
    def pos:int 0
    def line:int 1
    def column:int 1
    def tokens:[Token]

    fn tokenize:void () { ... }
    fn nextToken:Token () { ... }
    fn peek:string (offset:int) { ... }
    fn advance:string () { ... }
    fn skipWhitespace:void () { ... }
    fn readString:Token () { ... }
    fn readNumber:Token () { ... }
    fn readIdentifier:Token () { ... }
    fn readPunctuator:Token () { ... }
}
```

## Phase 3: AST Node Definitions

Each AST node tracks source positions:

```ranger
class ASTNode {
    def type:string ""           ; Node type (e.g., "FunctionDeclaration")
    def children:[ASTNode]       ; Child nodes
    def start:int 0              ; Start offset
    def end:int 0                ; End offset
    def line:int 0               ; Start line
    def column:int 0             ; Start column
}
```

### ES5 Node Types (Subset)

**Program Structure**

- `Program` - Root node, contains body statements

**Statements**

- `EmptyStatement` - `;`
- `BlockStatement` - `{ ... }`
- `ExpressionStatement` - expression followed by `;`
- `IfStatement` - `if (test) consequent [else alternate]`
- `WhileStatement` - `while (test) body`
- `DoWhileStatement` - `do body while (test)`
- `ForStatement` - `for (init; test; update) body`
- `ForInStatement` - `for (left in right) body`
- `BreakStatement` - `break [label]`
- `ContinueStatement` - `continue [label]`
- `ReturnStatement` - `return [argument]`
- `SwitchStatement` - `switch (discriminant) { cases }`
- `ThrowStatement` - `throw argument`
- `TryStatement` - `try block [catch] [finally]`
- `VariableDeclaration` - `var declarations`

**Declarations**

- `FunctionDeclaration` - `function name(params) { body }`
- `VariableDeclarator` - `name [= init]`

**Expressions**

- `Identifier` - variable names
- `Literal` - string, number, boolean, null, regexp
- `ArrayExpression` - `[elements]`
- `ObjectExpression` - `{ properties }`
- `FunctionExpression` - `function [name](params) { body }`
- `UnaryExpression` - `!x`, `typeof x`, etc.
- `BinaryExpression` - `a + b`, `a < b`, etc.
- `LogicalExpression` - `a && b`, `a || b`
- `ConditionalExpression` - `test ? consequent : alternate`
- `AssignmentExpression` - `a = b`, `a += b`, etc.
- `CallExpression` - `callee(arguments)`
- `MemberExpression` - `object.property`, `object[property]`
- `NewExpression` - `new callee(arguments)`
- `SequenceExpression` - `a, b, c`
- `ThisExpression` - `this`
- `UpdateExpression` - `++x`, `x--`, etc.

## Phase 4: Parser Implementation

Recursive descent parser with operator precedence:

```ranger
class Parser {
    def lexer:Lexer
    def tokens:[Token]
    def pos:int 0
    def currentToken:Token

    fn parse:ASTNode () { ... }
    fn parseProgram:ASTNode () { ... }
    fn parseStatement:ASTNode () { ... }
    fn parseExpression:ASTNode () { ... }
    fn parsePrimaryExpression:ASTNode () { ... }
    fn parseBinaryExpression:ASTNode (minPrec:int) { ... }
    fn parseUnaryExpression:ASTNode () { ... }
    fn parseCallExpression:ASTNode (callee:ASTNode) { ... }
    fn parseMemberExpression:ASTNode (object:ASTNode) { ... }
    fn parseFunction:ASTNode () { ... }
    fn parseBlock:ASTNode () { ... }
    fn parseVariableDeclaration:ASTNode () { ... }

    fn expect:Token (type:string) { ... }
    fn match:boolean (type:string) { ... }
    fn peek:Token () { ... }
    fn advance:Token () { ... }
}
```

### Operator Precedence (Low to High)

| Precedence | Operators                                        |
| ---------- | ------------------------------------------------ | --- | --- |
| 1          | `,`                                              |
| 2          | `=` `+=` `-=` etc.                               |
| 3          | `?:`                                             |
| 4          | `                                                |     | `   |
| 5          | `&&`                                             |
| 6          | `                                                | `   |
| 7          | `^`                                              |
| 8          | `&`                                              |
| 9          | `==` `!=` `===` `!==`                            |
| 10         | `<` `>` `<=` `>=` `in` `instanceof`              |
| 11         | `<<` `>>` `>>>`                                  |
| 12         | `+` `-`                                          |
| 13         | `*` `/` `%`                                      |
| 14         | `!` `~` `+` `-` `typeof` `void` `delete` (unary) |
| 15         | `++` `--` (postfix)                              |
| 16         | `.` `[]` `()` `new`                              |

## Phase 5: AST Output Format

Output AST as JSON for easy inspection:

```json
{
  "type": "Program",
  "start": 0,
  "end": 42,
  "body": [
    {
      "type": "VariableDeclaration",
      "start": 0,
      "end": 10,
      "kind": "var",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "start": 4,
          "end": 9,
          "id": {
            "type": "Identifier",
            "start": 4,
            "end": 5,
            "name": "x"
          },
          "init": {
            "type": "Literal",
            "start": 8,
            "end": 9,
            "value": 1,
            "raw": "1"
          }
        }
      ]
    }
  ]
}
```

## Phase 6: Testing

Create test cases for each construct:

```javascript
// test_input.js - Sample file to parse

// Variable declarations
var x = 1;
var name = "hello";
var arr = [1, 2, 3];
var obj = { a: 1, b: 2 };

// Functions
function add(a, b) {
  return a + b;
}

// Control flow
if (x > 0) {
  x = x - 1;
} else {
  x = 0;
}

// Loops
for (var i = 0; i < 10; i++) {
  console.log(i);
}

while (x > 0) {
  x--;
}

// Expressions
var result = add(1, 2) * 3;
var check = x > 0 ? "positive" : "non-positive";
```

## Implementation Order

1. **Week 1: Lexer**

   - [ ] Token class and types
   - [ ] Basic tokenizer (whitespace, identifiers, numbers)
   - [ ] String literals with escapes
   - [ ] Punctuators and operators
   - [ ] Comments (single-line and multi-line)

2. **Week 2: Basic Parser**

   - [ ] AST node classes
   - [ ] Program and statement parsing
   - [ ] Variable declarations
   - [ ] Expression statements
   - [ ] Literal expressions

3. **Week 3: Expressions**

   - [ ] Binary expressions with precedence
   - [ ] Unary expressions
   - [ ] Member expressions
   - [ ] Call expressions
   - [ ] Array and object literals

4. **Week 4: Control Flow**

   - [ ] If/else statements
   - [ ] While/do-while loops
   - [ ] For/for-in loops
   - [ ] Switch statements
   - [ ] Try/catch/finally

5. **Week 5: Functions**

   - [ ] Function declarations
   - [ ] Function expressions
   - [ ] Return statements
   - [ ] Parameter handling

6. **Week 6: Polish**
   - [ ] Error handling and messages
   - [ ] Source position accuracy
   - [ ] JSON output formatting
   - [ ] Test suite

## npm Scripts

Add to package.json:

```json
{
  "jsparser:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/js_parser/js_parser.rgr -d=./gallery/js_parser -o=js_parser.js -nodecli",
  "jsparser:run": "node ./gallery/js_parser/js_parser.js ./gallery/js_parser/test_input.js"
}
```

## Future Extensions (Post-ES5)

- ES6 features: `let`, `const`, arrow functions, classes, template literals
- ES6 modules: `import`, `export`
- Source maps generation
- Pretty printer / code formatter
- Minifier using AST transformations

## References

- [ECMAScript 5.1 Specification](https://262.ecma-international.org/5.1/)
- [ESTree AST Specification](https://github.com/estree/estree/blob/master/es5.md)
- [Acorn Parser](https://github.com/acornjs/acorn) - Reference implementation
