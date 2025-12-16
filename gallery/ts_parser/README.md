# TypeScript Parser

A fast TypeScript parser written in Ranger, cross-compilable to JavaScript, Rust, C++, Go, and Swift.

## Features

- **Lexer**: Full tokenization with TypeScript keywords and type annotations
- **Parser**: Recursive descent parser producing AST
- **CLI**: Command-line interface for parsing files and listing declarations
- **Cross-compilation**: Single codebase compiles to multiple languages

## Supported TypeScript Syntax

- Interface declarations with properties
- Type aliases (including union types)
- Function declarations with type annotations
- Variable declarations (let, const, var)
- Optional properties and parameters (`?`)
- Readonly modifiers
- Basic type annotations (string, number, boolean, etc.)
- Array types (`T[]` and `Array<T>`)
- Generic type references

## Installation

```bash
# Compile to JavaScript
npm run tsparser:compile

# Compile to all targets
npm run tsparser:compile:all
```

## Usage

```bash
# Show help
node gallery/ts_parser/bin/ts_parser_main.js --help

# Parse a TypeScript file
node gallery/ts_parser/bin/ts_parser_main.js -i script.ts

# List all interfaces
node gallery/ts_parser/bin/ts_parser_main.js -i script.ts --show-interfaces

# List all type aliases
node gallery/ts_parser/bin/ts_parser_main.js -i script.ts --show-types

# List all functions
node gallery/ts_parser/bin/ts_parser_main.js -i script.ts --show-functions

# Run demo
node gallery/ts_parser/bin/ts_parser_main.js -d
```

## Native Builds

```bash
# Build Rust executable
npm run tsparser:build:rust

# Build C++ executable (requires WSL with MinGW)
wsl bash -c "cd /mnt/c/Users/terok/proj/Ranger && \
  sed -i 's/\r$//' gallery/ts_parser/bin/ts_parser_main.cpp && \
  x86_64-w64-mingw32-g++-posix -std=c++17 -O3 -static \
  gallery/ts_parser/bin/ts_parser_main.cpp -o gallery/ts_parser/bin/ts_parser_cpp.exe"
```

## Benchmarks

### JavaScript Parsers Comparison

Parsing performance compared to other JavaScript/TypeScript parsers:

| Parser             | Small File  | Large File  | Notes       |
| ------------------ | ----------- | ----------- | ----------- |
| **Ranger (JS)**    | **0.030ms** | **0.686ms** | Fastest     |
| Acorn + TS plugin  | 0.079ms     | 1.304ms     | 2.6x slower |
| TypeScript         | 0.162ms     | 2.087ms     | 5.4x slower |
| @typescript-eslint | 0.167ms     | 2.748ms     | 5.6x slower |
| Babel              | 0.182ms     | 2.858ms     | 6.1x slower |
| ts-morph           | 0.182ms     | 3.170ms     | 6.1x slower |

The Ranger parser is **2.6x to 6x faster** than established parsers.

### Native Builds: Rust vs C++

Both compiled to native Windows executables with full optimizations:

| File                | Rust    | C++     | Winner                |
| ------------------- | ------- | ------- | --------------------- |
| Small (~40 lines)   | 12.4ms  | 15.1ms  | **Rust 1.22x faster** |
| Large (~1500 lines) | 142.9ms | 482.7ms | **Rust 3.38x faster** |

**Rust is significantly faster**, especially on larger files where it's 3.4x faster than C++.

> **Note**: The native build times include process startup overhead. The JavaScript version has lower total time because Node.js is already running. For raw parsing speed, native builds would be faster in sustained workloads.

### Running Benchmarks

```bash
# JavaScript parser comparison
npm run tsparser:benchmark

# Native Rust vs C++ comparison
powershell -ExecutionPolicy Bypass -File gallery\ts_parser\benchmark\benchmark_native.ps1 -Iterations 50
```

## Architecture

### Files

| File                   | Description                       |
| ---------------------- | --------------------------------- |
| `ts_token.rgr`         | Token class definition            |
| `ts_lexer.rgr`         | Lexer/tokenizer implementation    |
| `ts_parser_simple.rgr` | Parser using unified TSNode class |
| `ts_parser_main.rgr`   | CLI entry point                   |

### Design Decisions

1. **Unified Node Class**: Uses a single `TSNode` class with a `nodeType` field instead of separate classes per node type. This avoids Ranger's strict type checking issues with optional parent class fields.

2. **Quiet Mode**: Parser supports a `quiet` mode to suppress parse errors when using `--show-*` options for clean output.

3. **Cross-compilation**: All code is written in idiomatic Ranger that compiles cleanly to ES6, Rust, C++, Go, and Swift.

## See Also

- [TODO.md](TODO.md) - Missing TypeScript features
- [PLAN_TS_PARSER.md](../../PLAN_TS_PARSER.md) - Original implementation plan
- [benchmark/README.md](benchmark/README.md) - Detailed benchmark information
