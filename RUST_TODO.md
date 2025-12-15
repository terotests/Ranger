# Rust Code Generation - TODO and Progress

## Current Status (December 15, 2025)

**Error Count:** 16 errors (down from 352 initial errors - 95.5% reduction)

## Completed Fixes

### 1. Self-Referential Types with Box<T>
- **Issue:** Structs with optional fields of their own type cause infinite struct size
- **Solution:** Wrap self-referential optional fields with `Option<Box<T>>`
- **Location:** `writeTypeDef` in ng_RangerRustClassWriter.rgr

### 2. Optional Field Assignments
- **Issue:** Assigning to optional fields requires `Some()` wrapper, `Box::new()` for boxed types
- **Solution:** CustomOperator handles `=` command with special logic for optional targets
- **Location:** `CustomOperator` in ng_RangerRustClassWriter.rgr

### 3. Unwrap Operations for Boxed Types  
- **Issue:** `.unwrap()` on `Option<Box<T>>` returns `Box<T>`, needs deref for value access
- **Solution:** Add `*` dereference when unwrapping boxed optional types
- **Location:** `CustomOperator` (unwrap handler) in ng_RangerRustClassWriter.rgr

### 4. Clone for Self Field Unwrap
- **Issue:** `self.field.clone().unwrap()` needed to avoid moving out of self
- **Solution:** Add `.clone()` before `.unwrap()` for self field access
- **Location:** `CustomOperator` (unwrap handler) in ng_RangerRustClassWriter.rgr

### 5. String/Object Cloning for Function Arguments
- **Issue:** Strings and objects passed to functions are moved, can't be used after
- **Solution:** Add `.clone()` for VRef arguments of string/object type in function calls
- **Location:** `writeFnCall`, `writeNewCall` in ng_RangerRustClassWriter.rgr

### 6. Mutable Parameters for Objects
- **Issue:** Function parameters receiving objects may need mutation (field assignment)
- **Solution:** Add `mut` prefix for object/array/hash parameters
- **Location:** `writeArgsDef` in ng_RangerRustClassWriter.rgr

### 7. For-Loop Item Reassignment
- **Issue:** For-loop items were moved then reassigned causing use-after-move
- **Solution:** Removed item reassignment from Rust for-loop template in Lang.rgr
- **Location:** Line ~1774 in Lang.rgr

### 8. Optional Variable Initialization
- **Issue:** Optional variables need explicit `None` initialization
- **Solution:** Add `= None` for optional variable definitions without value
- **Location:** `writeVarDef` in ng_RangerRustClassWriter.rgr

### 9. Clone for Push Operations
- **Issue:** Pushing objects to arrays moves them, can't be used after
- **Solution:** Add `.clone()` for non-primitive types when pushing to arrays
- **Location:** `CustomOperator` (push handler) in ng_RangerRustClassWriter.rgr

### 10. Clone for String Field Access in Variable Init
- **Issue:** Initializing from string field moves the value
- **Solution:** Add `.clone()` when initializing string variables from field access
- **Location:** `writeVarDef` in ng_RangerRustClassWriter.rgr

## Remaining Errors (16 total)

### Category 1: Double Mutable Borrow (4 errors)
**Error types:** E0499, E0502
**Pattern:** `self.method1(self.method2())` - can't borrow self twice
**Examples:**
```rust
self.makeToken(self.identType(value.clone()), ...)
```
**Solution needed:** Extract inner self calls to temporary variables

### Category 2: Use After Move (12 errors)
**Error types:** E0382
**Patterns:**
- `paramTok.value` used after being passed to function (2)
- `keyTok.value` used after being passed to function (2)
- `src` used after assignment (2)
- `toks` used after being passed (2)
- `program` used after assignment (1)
- `fullValue` used after being moved (1)
- `nameTok.value` used after being moved (1)
- `specifier` partially moved (1)

**Solution needed:** Track variable usage after operations that move values

## Implementation Plan

### Phase 1: Context Tracking Infrastructure
Add Rust-specific tracking fields to the compiler context:

1. **In RangerAppWriterContext:** Add hash maps for tracking:
   - `rust_moved_vars:[string:boolean]` - Variables that have been moved
   - `rust_borrowed_vars:[string:boolean]` - Variables currently borrowed
   - `rust_usage_after_move:[string:int]` - Count of uses after potential move

2. **Tracking Functions:**
   - `rustMarkMoved(varName:string)` - Mark a variable as moved
   - `rustMarkBorrowed(varName:string)` - Mark a variable as borrowed  
   - `rustIsMoved(varName:string):boolean` - Check if variable was moved
   - `rustNeedsClone(varName:string):boolean` - Check if clone needed
   - `rustResetScope()` - Reset tracking at scope boundaries

### Phase 2: Flow Analysis Integration
During code generation, track operations:

1. **Assignment Operations:** Mark LHS as potentially moved
2. **Function Call Arguments:** Mark passed variables as moved (unless primitive)
3. **Variable References:** Check if accessing moved variable, add clone if so
4. **Scope Entry/Exit:** Reset tracking appropriately

### Phase 3: Double Borrow Fix
For patterns like `self.method1(self.method2())`:

1. Detect nested self method calls in arguments
2. Generate temporary variable for inner call result
3. Use temp variable in outer call

## Files Modified

- `compiler/ng_RangerRustClassWriter.rgr` - Main Rust code writer
- `compiler/Lang.rgr` - Language templates (for-loop fix)
- `compiler/ng_RangerAppWriterContext.rgr` - Context (to be modified for tracking)

## Testing

```bash
npm run compile
npm run jsparser:compile:rust
rustc gallery/js_parser/js_parser.rs -o gallery/js_parser/js_parser_rust.exe
```

## Notes

- The Ranger compiler generates code for multiple languages
- Rust's ownership semantics are fundamentally different from other targets
- Current approach uses heuristic cloning which works but may not be optimal
- Proper tracking would allow smarter decisions about when to clone vs borrow
