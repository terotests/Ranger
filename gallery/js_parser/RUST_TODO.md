# Rust Compilation TODO

This document tracks the work needed to compile the JS parser to Rust.

## Status: Compiles to Rust, rustc fails

The Ranger compiler now successfully generates `js_parser.rs`, but `rustc` compilation fails with several errors.

## ✅ Completed

### 1. Added Rust Templates to Lang.rgr

The following standard library functions now have Rust templates:

- `shell_arg` - Command line arguments: `std::env::args().nth(...)`
- `shell_arg_cnt` - Argument count: `std::env::args().len()`
- `read_file` - File reading: `std::fs::read_to_string(...)`
- `write_file` - File writing: `std::fs::write(...)`
- `strlen` - String length: `.len() as i64`
- `charAt` - Character code at index: `.chars().nth(...).unwrap_or('\0') as i64`
- `at` - Character at index (as string): `.chars().nth(...).map(|c| c.to_string())`
- `substring` - String slicing: `.chars().skip(...).take(...).collect::<String>()`

### 2. Renamed Reserved Keyword

Changed `Token.type` to `Token.tokenType` to avoid Rust reserved keyword conflict.

### 3. Added npm Scripts

```json
"jsparser:compile:rust": "...",
"jsparser:build:rust": "...",
"jsparser:run:rust": "..."
```

### 4. Fixed entry point

Must use `js_parser_main.rgr` not `js_parser.rgr` for compilation.

## 🔴 rustc Compilation Errors

### 1. Missing Semicolon (line 4563)

```rust
r_write_file(&".".to_string(), &outputFile, &output)  // Missing semicolon
println!(...);
```

**Fix needed:** Rust code generator must add semicolon after `write_file` call.

### 2. Recursive Type Without Box<T> (line 702)

```rust
struct JSNode {
  left: Option<JSNode>,  // Should be Option<Box<JSNode>>
}
```

**Fix needed:** `ng_RangerRustClassWriter.rgr` `writeTypeDef` needs to detect self-referential types.

### 3. Field Name Mismatch (line 46)

```rust
len:0,  // Should be __len:0
```

**Fix needed:** Check how field names are compiled vs used.

### 4. Missing Fields in Struct Initialization (lines 722, 749)

```rust
let mut me = JSNode { ... }  // missing alternate, body, left, right, test, declarations
let mut me = SimpleParser { ... }  // missing currentToken, lexer
```

**Fix needed:** Generate `None` for all `Option<T>` fields, `Vec::new()` for arrays.

### 5. Type Mismatch: T vs Option<T> (lines 762, 769, 772)

```rust
self.currentToken = toks[0 as usize].clone();  // Returns Token, expects Option<Token>
self.lexer = Lexer::new(src);  // Returns Lexer, expects Option<Lexer>
```

**Fix needed:** Wrap assignment in `Some(...)` when assigning to Optional field.

### 6. Type Mismatch: i64 vs usize (line 805)

```rust
if self.pos < (self.tokens.len()) {  // len() returns usize, pos is i64
```

**Fix needed:** Add `as i64` cast to `.len()` comparisons.

### 7. While True Loop

```rust
while true { }  // Should be loop { }
```

**Fix needed:** Replace `while true` with `loop` in Rust code generator.

## How to Test

```bash
# Compile .rgr to .rs (now works!)
npm run jsparser:compile:rust

# Try to compile .rs (currently fails)
npm run jsparser:build:rust

# The JavaScript version works
npm run jsparser:compile
node gallery/js_parser/js_parser.js -i gallery/js_parser/test_es_modules.js
```

## Files to Modify

- `compiler/ng_RangerRustClassWriter.rgr` - Fix code generation issues
