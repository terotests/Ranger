# AI-Generated Ranger Examples

This folder contains Ranger source code examples that were generated using the AI instructions from the `ai/` folder.

## Purpose

This folder serves as a test bed for validating that the AI documentation in `ai/INSTRUCTIONS.md`, `ai/GRAMMAR.md`, and `ai/EXAMPLES.md` is sufficient for an AI to correctly generate Ranger code.

## Contents

### SimpleChessBoard.clj

A simple ASCII chess board using only print statements. Demonstrates:

- Basic class structure
- Main entry point (`sfn m@(main):void`)
- Print statements

### ChessBoard.clj

A more complex ASCII chess board renderer that demonstrates:

- Class definitions with constructors
- Static factory methods
- Instance methods
- Arrays and indexing
- Control flow (if/else, while loops)
- String concatenation
- Ternary operators
- Main entry point

## Building and Running

From the project root directory:

```bash
# Compile and run SimpleChessBoard (recommended)
npm run gen:simple:run

# Compile SimpleChessBoard only
npm run gen:simple

# Compile ChessBoard (advanced)
npm run gen:chess

# Compile all generated examples
npm run gen:all

# Run all tests
npm run gen:test
```

**Note**: Requires `cross-env` package (already in devDependencies).

## Output

The compiled JavaScript files are placed in `generated/output/`.

## Expected Output

When running `npm run gen:chess:run`, you should see:

```
=====================================
  Ranger Chess Board Demo
  Generated using AI instructions
=====================================

    ASCII Chess Board
    =================

    a   b   c   d   e   f   g   h
  +---+---+---+---+---+---+---+---+
8 | r |.n.| b |.q.| k |.b.| n |.r.| 8
  +---+---+---+---+---+---+---+---+
7 |.p.| p |.p.| p |.p.| p |.p.| p | 7
  +---+---+---+---+---+---+---+---+
...
```
