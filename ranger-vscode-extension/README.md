# Ranger Language Support for VS Code

Language support for the **Ranger** programming language - a cross-platform compiler that transpiles to multiple target languages including JavaScript, Python, Go, Java, Swift, C#, and more.

## Features

### Syntax Highlighting

Full syntax highlighting for Ranger language constructs:

- Keywords (`class`, `fn`, `sfn`, `def`, `if`, `while`, etc.)
- Types (`int`, `string`, `boolean`, etc.)
- Built-in functions (`print`, `push`, `get`, etc.)
- Operators
- Comments
- Strings
- Annotations (`@(main)`, `@(optional)`, etc.)

### Auto-Completion

- **Keywords**: Control flow, declarations, etc.
- **Types**: Primitive types and collection types
- **Built-in functions**: Array, map, string operations
- **Annotations**: Function and variable annotations
- **Context-aware**: Different suggestions based on cursor position

### Code Snippets

Quick snippets for common patterns:

- `class` - Create a new class
- `main` - Create main entry point
- `fn` / `sfn` - Create instance/static function
- `if` / `ife` - If and if-else statements
- `for` / `while` - Loop constructs
- `def` / `defarr` / `defmap` - Variable declarations

### Diagnostics

- Unmatched brackets/parentheses detection
- Basic syntax error reporting

### Hover Information

Hover over keywords, types, and built-in functions to see documentation.

### Document Outline

View classes, methods, and properties in the outline view.

## File Extension

Ranger files use the `.rgr` or `.ranger` file extension.

## Installation

### From VSIX (Local Installation)

1. Build the extension: `npm run package`
2. In VS Code, press `Ctrl+Shift+P` and select "Extensions: Install from VSIX..."
3. Select the generated `.vsix` file

### Development Mode

1. Open this folder in VS Code
2. Run `npm install` to install dependencies
3. Press `F5` to launch the Extension Development Host

## Project Structure

```
ranger-vscode-extension/
├── client/                    # VS Code extension client
│   ├── src/
│   │   └── extension.ts      # Extension entry point
│   └── package.json
├── server/                    # Language Server Protocol server
│   ├── src/
│   │   ├── server.ts         # LSP server entry point
│   │   ├── rangerCompiler.ts # Real Ranger compiler integration
│   │   ├── astAnalyzer.ts    # AST analysis and symbol extraction
│   │   └── keywords.ts       # Language definitions
│   ├── INCREMENTAL_COMPILATION_STRATEGY.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   └── package.json
├── syntaxes/
│   └── ranger.tmLanguage.json # TextMate grammar
├── snippets/
│   └── ranger.json           # Code snippets
├── language-configuration.json
├── package.json              # Extension manifest
└── README.md
```

## Architecture & Implementation Notes

### Real Ranger Compiler Integration

The language server uses the **real Ranger compiler** (v2.1.71) from `bin/output.js` via the `VirtualCompiler` API. This ensures accurate parsing and type inference.

#### Two-Pass Compilation

1. **CollectMethods**: Builds the symbol table from the AST
2. **StartWalk**: Performs type inference and populates `CodeNode.eval_type_name`

#### Incremental Compilation & Caching

To handle incomplete code during editing without crashing:

- Maintains a compilation cache (80% prefix similarity threshold)
- Falls back to last successful compilation when compiler encounters errors
- See `server/INCREMENTAL_COMPILATION_STRATEGY.md` for details

### AST Node Discovery

**Root Node Location**: The compiler doesn't directly expose a traditional root AST node. Instead, use a **synthetic root** constructed from class nodes:

```typescript
// res.ctx.rootFile is just a string (filename)
// res.ctx.parser.lastProcessedNode exists but has 0 children
// Solution: Synthetic root from defined classes
const syntheticRoot = new compiler.CodeNode();
syntheticRoot.children = [];
for (const className in res.ctx.definedClasses) {
  if (res.ctx.definedClasses[className]?.node) {
    syntheticRoot.children.push(res.ctx.definedClasses[className].node);
  }
}
```

**Class Properties Storage**: Class properties are NOT stored in `classDesc.properties`. They are stored in `classDesc.variables`:

```typescript
// res.ctx.definedClasses['Vec2'].variables contains class properties
// Variable names are indexed numerically: ['0', '1', '2', ...]
for (const propName in classDesc.variables) {
  const propDesc = classDesc.variables[propName];
  // propDesc contains the actual variable descriptor
}
```

### Language Features

- **Hover**: Shows type information using `eval_type_name` from type inference
- **Autocomplete**: Provides member completions based on inferred types
- **Document Symbols**: Extracts classes, methods, and properties from compilation context
- **Diagnostics**: Reports compilation errors (when code is complete enough to compile)

## Ranger Language Quick Reference

### Class Definition

```ranger
class MyClass {
    def name:string ""
    def count:int 0

    Constructor (n:string) {
        name = n
    }

    fn greet:string () {
        return ("Hello " + name)
    }

    sfn createDefault:MyClass () {
        return (new MyClass("default"))
    }
}
```

### Main Entry Point

```ranger
class Main {
    sfn m@(main):void () {
        print "Hello, World!"
    }
}
```

### Variables

```ranger
def x:int 42
def name:string "John"
def items:[string]
def scores:[string:int]
def maybeValue@(optional):string
```

### Control Flow

```ranger
if (x > 0) {
    print "positive"
} {
    print "non-positive"
}

while (i < 10) {
    i = i + 1
}

for items item:string idx {
    print item
}
```

## Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package
```

## License

MIT

## Related Links

- [Ranger Compiler](https://github.com/terotests/Ranger)
- [VS Code Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
