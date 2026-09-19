# Rust Code Generation - TODO and Progress

## Current Status (December 21, 2025)

**Error Count:** 11 errors (down from 365+ initial errors - 97% reduction)

---

# PLAN: Fixing Remaining Borrow Checker Patterns

## Overview

There are 4 distinct patterns causing the remaining 11 compilation errors. This plan addresses each with:

1. A minimal test case to reproduce
2. Static analyzer improvements
3. Preference for references over cloning

---

## Pattern 1: Assignment from Borrowed Parameter (E0308)

**Count:** 1 error (line 9379)

### Problem

When a parameter is marked as immutable borrow (`&Vec<u8>`), but the function assigns it to an owned field (`Vec<u8>`), there's a type mismatch.

### Test Case: `tests/rust_pattern1.rgr`

```ranger
class Pattern1Test {
  def data:buffer

  ; buf is not mutated → analyzer marks as &Vec<u8>
  ; but data = buf assigns borrowed to owned
  fn setData:void (buf:buffer) {
    data = buf
  }
}
```

### Static Analysis Improvement

**File:** `ng_StaticAnalysis.rgr`

**Detection:** When analyzing a function, check if parameter is:

1. Marked as immutable borrow (`rust_borrow_type == 1`)
2. Used in assignment to a field (LHS of `=`)

**Options (in order of preference):**

**Option A - Don't mark as immutable if assigned:**

```
During mutation analysis:
- If parameter appears on RHS of field assignment, mark as "needs_owned"
- Don't set rust_borrow_type = 1 for these parameters
```

**Option B - Generate clone at assignment:**

```
In assignment CustomOperator:
- If RHS is a parameter with rust_borrow_type == 1
- And LHS is an owned field
- Output: self.field = param.clone()
```

**Preferred:** Option A - keeps parameter owned, avoids clone

### Implementation Steps

1. [ ] Create test file `tests/rust_pattern1.rgr`
2. [ ] In `analyzeBufferMutation`: Add check for "assigned to field"
3. [ ] Add `rust_is_assigned_to_field:boolean` flag to param
4. [ ] Skip immutable borrow marking if `rust_is_assigned_to_field`
5. [ ] Run test: `npm run test:rust:pattern1`

---

## Pattern 2: Local Variable to Immutable Borrow Parameter (E0308)

**Count:** 6 errors (lines 12421, 12533, 12645, 12757, 12869, 12981)

### Problem

Local variables are owned (`Vec<i64>`), but when passed to functions expecting immutable borrow (`&Vec<i64>`), we need to pass `&localVar`.

### Test Case: `tests/rust_pattern2.rgr`

```ranger
class Pattern2Test {
  ; coeffs is not mutated → analyzer marks as &Vec<i64>
  fn processCoeffs:void (coeffs:[int]) {
    def val:int (at coeffs 0)
  }

  fn caller:void () {
    def localCoeffs:[int] (this.getCoeffs())  ; owned local
    this.processCoeffs(localCoeffs)           ; needs &localCoeffs
  }

  fn getCoeffs:[int] () {
    def result:[int]
    return result
  }
}
```

### Static Analysis Improvement

**File:** `ng_RangerRustClassWriter.rgr` - `writeFnCall`

**Current Code Path (standard function call ~line 1570-1630):**

- Handles pre-evaluation for complex expressions
- Handles `&` prefix for immutable borrow of temp vars
- **Missing:** `&` prefix for local variable arguments

**Detection:** When writing argument in function call:

1. Get the target parameter's `rust_borrow_type`
2. If `rust_borrow_type == 1` (immutable borrow)
3. And argument is a local variable (VRef to local)
4. Output `&` prefix

### Implementation Steps

1. [ ] Create test file `tests/rust_pattern2.rgr`
2. [ ] In `writeFnCall` standard path, find local variable handling
3. [ ] Add check: if param has `rust_borrow_type == 1`
4. [ ] Add check: if argument is simple VRef (not temp, not pre-evaluated)
5. [ ] Output `&` before the variable name
6. [ ] Run test: `npm run test:rust:pattern2`

---

## Pattern 3: Transitive Mutable Borrow Requirement (E0596)

**Count:** 2 errors (lines 9823, 9935)

### Problem

Parameter `output` is marked as `&Vec<i64>` (immutable), but it's passed to another function that requires `&mut Vec<i64>`.

### Test Case: `tests/rust_pattern3.rgr`

```ranger
class Pattern3Test {
  ; transform() mutates output → correctly marked &mut
  fn transform:void (input:[int] output:[int]) {
    set output 0 (at input 0)
  }

  ; transformWrapper doesn't directly mutate output
  ; BUT passes it to transform() which needs &mut
  ; → output should be &mut here too (transitive)
  fn transformWrapper:void (input:[int] output:[int]) {
    this.transform(input output)
  }
}
```

### Static Analysis Improvement

**File:** `ng_StaticAnalysis.rgr`

**Two-Pass Analysis:**

**Pass 1 (current):** Detect direct mutations

- `set array index value` → marks array as mutated
- `push array value` → marks array as mutated
- etc.

**Pass 2 (new):** Detect transitive mutations

- For each function call in the function body
- Look up the called function's parameter borrow types
- If we pass parameter X to a `&mut` parameter
- Mark X as needing `&mut` (transitive mutation)

**Algorithm:**

```
for each function F:
  for each call site in F:
    for each argument A at position i:
      if A is a parameter P of F:
        called_param = get_param_at(called_fn, i)
        if called_param.rust_borrow_type == 2:  ; &mut
          P.rust_borrow_type = 2  ; propagate &mut requirement
```

**Note:** This may need multiple iterations until fixed point (if A calls B which calls C which mutates).

### Implementation Steps

1. [ ] Create test file `tests/rust_pattern3.rgr`
2. [ ] In `ng_StaticAnalysis.rgr`, add `analyzeTransitiveMutations` function
3. [ ] After direct mutation pass, run transitive pass
4. [ ] For each call: check if argument is a parameter of current function
5. [ ] Look up called function's param borrow types
6. [ ] Propagate `&mut` requirement upward
7. [ ] Loop until no changes (fixed point)
8. [ ] Run test: `npm run test:rust:pattern3`

---

## Pattern 4: Moved Value in Loop (E0382)

**Count:** 2 errors (lines 14687, 14695)

### Problem

Parameter `props` is used multiple times inside a loop. Each use moves ownership, so subsequent iterations fail.

### Test Case: `tests/rust_pattern4.rgr`

```ranger
class Pattern4Test {
  fn processItems:void (items:[Item] props:EvalValue) {
    def i:int 0
    while (i < (array_length items)) {
      def item:Item (at items i)

      ; First use of props in loop
      this.processWithProps(item props)

      ; Second use of props in loop - ERROR if props was moved
      this.logProps(props)

      i = i + 1
    }
  }

  fn processWithProps:void (item:Item props:EvalValue) {
    ; uses props
  }

  fn logProps:void (props:EvalValue) {
    ; uses props
  }
}
```

### Static Analysis Improvement

**File:** `ng_StaticAnalysis.rgr`

**Detection:** Identify parameters used inside loops

1. Track if we're inside a loop (`while`, `for`)
2. If parameter is used inside loop body
3. And parameter is not a primitive type
4. Mark as `rust_used_in_loop = true`

**Solution (prefer references):**

- If `rust_used_in_loop == true`, mark parameter as reference
- This allows borrowing instead of moving

**File:** `ng_RangerRustClassWriter.rgr`

**Code Generation:**

- For parameters with `rust_used_in_loop`:
  - Output `&EvalValue` or `&mut EvalValue` depending on mutation
  - At call sites, output `&props` or `&mut props`

### Alternative Solution (if reference not possible)

If the called functions require owned values:

- Clone on each use inside the loop
- `this.processWithProps(item, props.clone())`

### Implementation Steps

1. [ ] Create test file `tests/rust_pattern4.rgr`
2. [ ] In `ng_StaticAnalysis.rgr`, add loop tracking
3. [ ] Add `rust_used_in_loop:boolean` flag to parameters
4. [ ] During analysis: track loop depth, mark params used in loops
5. [ ] In `writeArgsDef`: if `rust_used_in_loop`, output reference type
6. [ ] In `writeFnCall`: if calling with loop-used param, add `&`
7. [ ] Run test: `npm run test:rust:pattern4`

---

## Implementation Order

**Recommended sequence (easiest to hardest):**

1. **Pattern 2** (Local var → immutable borrow) - Simple addition of `&` prefix
2. **Pattern 1** (Assignment from borrowed) - Skip immutable marking for assigned params
3. **Pattern 4** (Loop usage) - Add loop tracking and reference types
4. **Pattern 3** (Transitive mutation) - Requires multi-pass analysis

## Test Commands

```bash
# Compile the Ranger compiler with changes
npm run compile

# Build specific test
npm run test:rust:pattern1   # Add to package.json

# Full Rust build test
npm run evgcomp:build:rust
```

## Success Criteria

- [ ] Pattern 1: 0 E0308 errors for field assignment
- [ ] Pattern 2: 0 E0308 errors for local var arguments
- [ ] Pattern 3: 0 E0596 errors for transitive mutation
- [ ] Pattern 4: 0 E0382 errors for loop usage
- [ ] Total: 0 compilation errors
- [ ] Runtime: evg_component_tool.exe runs successfully

---

# Previous Documentation (Archive)

## Completed Fixes (Historical)

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
