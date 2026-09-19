# Static Analysis Plan for Rust and C++ Targets

## Status: Phase 1 COMPLETED ✅

The core static analysis infrastructure is now implemented and working for both C++ and Rust targets.

### What's Been Implemented

1. **StaticAnalyzer class** (`ng_StaticAnalysis.rgr`) - Complete

   - Mutation detection for all buffer/array operators
   - Function parameter analysis
   - Member assignment tracking
   - Return statement analysis

2. **C++ Integration** - Complete ✅

   - `needs_cpp_reference` flag on parameters
   - Reference (`&`) added to mutated function parameters
   - Reference added to local variables assigned from members and mutated

3. **Rust Integration** - Complete ✅

   - `rust_borrow_type` flag (0=owned, 1=borrow, 2=mut_borrow)
   - `&mut` added to mutated function parameters
   - Static analysis runs automatically for Rust target

4. **Compiler Integration** - Complete ✅
   - Analysis runs after parsing, before code generation
   - Only runs for C++ and Rust targets
   - Results stored in `RangerAppParamDesc` fields

### Performance Results

After implementing the static analysis:

- **Go**: 2.29s (1.7x faster than JS)
- **C++ Release**: 2.66s (1.5x faster than JS)
- **JavaScript**: 3.96s (baseline)

Binary sizes:

- **C++ Release (stripped)**: 1.82 MB (smallest)
- **Go**: 3.31 MB
- **C++ Debug**: 3.88 MB

---

## Overview

The Ranger compiler currently generates code that works well for garbage-collected languages (JavaScript, Go, Java, Python) but produces suboptimal or incorrect code for languages with explicit ownership semantics (Rust, C++). This plan outlines a static analysis phase to be run **before** code generation for these targets, enabling the compiler to:

1. Track variable mutation to determine `&mut` vs `&` in Rust
2. Identify when values should be passed by reference vs by value in C++
3. Detect ownership transfers and borrowing patterns
4. Generate `.clone()` calls only when necessary
5. Use references (`&`) for read-only access to avoid copies

## Current Problems

### Problem 1: C++ Buffer Copy-by-Value (Critical)

**Issue:** When a buffer/vector is assigned to a local variable from a member field, C++ copies the entire data:

```ranger
; Ranger code
def buf:buffer currentChunk.data
buffer_set buf pos b
```

**Generated C++ (incorrect):**

```cpp
std::vector<uint8_t> buf = currentChunk->data;  // COPIES the vector!
buf[pos] = static_cast<uint8_t>(b);              // Writes to copy, discarded
```

**Root Cause:** The compiler doesn't know that `buf` is used for mutation, so it doesn't generate a reference.

**Required Analysis:** Detect that `buf` is:

1. Assigned from a member field (potential alias)
2. Used with a mutating operation (`buffer_set`)
3. Should be a reference in C++: `std::vector<uint8_t>& buf = currentChunk->data;`

### Problem 2: Rust Borrow Checker Conflicts

**Issue:** Rust requires explicit `&`, `&mut`, or ownership transfer. The compiler currently:

- Uses `.clone()` everywhere (inefficient)
- Uses `&mut self` for all methods (sometimes too restrictive)
- Doesn't track which variables are borrowed

**Example:**

```rust
// Generated Rust - clones everything
fn process(&mut self) {
    let data = self.buffer.clone();  // Unnecessary clone if just reading
    // ...
}
```

### Problem 3: Return Value Ownership

**Issue:** When returning a member field, Rust/C++ need to know if it's:

- A copy (primitives)
- A clone (owned return)
- A reference (borrowed return)

**Current approach:** Clone everything in Rust, copy everything in C++.

### Problem 4: Rust Optional Type Unwrapping (NEW - Critical)

**Issue:** Rust's `Option<T>` type requires explicit unwrapping before accessing methods or fields. Unlike JavaScript/Go where you can call methods on nullable types (with potential runtime errors), Rust requires compile-time handling of the None case.

**Current Generated Code (FAILS TO COMPILE):**

```rust
// In evg_component_tool.rs - 50+ errors like this:
self.marginTop.resolve(parentHeight, fontSize);     // ERROR: no method `resolve` on Option<EVGUnit>
self.marginTopPx = self.marginTop.pixels;           // ERROR: no field `pixels` on Option<EVGUnit>
```

**Rust Compilation Errors:**

```
error[E0599]: no method named `resolve` found for enum `Option<T>` in the current scope
    --> evg_component_tool.rs:5130:20
     |
5130 |     self.marginTop.resolve(parentHeight, fontSize);
     |                    ^^^^^^^ method not found in `Option<EVGUnit>`

error[E0609]: no field `pixels` on type `Option<EVGUnit>`
    --> evg_component_tool.rs:5131:39
     |
5131 |     self.marginTopPx = self.marginTop.pixels;
     |                                       ^^^^^^ unknown field
```

**Root Cause:** The Rust code generator (`ng_RangerRustClassWriter.rgr`) wraps optional types in `Option<T>` but doesn't unwrap them when accessing methods/fields.

**Required Analysis:**

1. Track which variables/fields are optional (`@(optional)` annotation)
2. Detect when a method is called on an optional type → emit `.as_ref().unwrap()` or `.as_mut().unwrap()`
3. Detect when a field is accessed on an optional type → emit unwrap first
4. Determine if access is mutable (needs `as_mut()`) or read-only (needs `as_ref()`)
5. Handle null checks - if preceded by `if (x != null)`, the unwrap is safe

**Correct Rust Patterns:**

```rust
// Read-only method call on optional
self.marginTop.as_ref().unwrap().get_value()

// Mutating method call on optional
self.marginTop.as_mut().unwrap().resolve(parentHeight, fontSize);

// Field read on optional
self.marginTopPx = self.marginTop.as_ref().unwrap().pixels;

// Safe pattern with null check
if let Some(ref margin) = self.marginTop {
    margin.resolve(parentHeight, fontSize);
}
```

## Proposed Static Analysis Phases

### Phase 1: Variable Usage Analysis

Run after parsing, before code generation. For each variable in each scope:

```
VariableUsageInfo {
    name: string
    type: TypeInfo

    // Assignment tracking
    is_assigned: boolean           // Was it ever assigned to?
    assignment_count: int          // How many times assigned
    is_assigned_from_member: boolean  // Assigned from obj.field?
    source_member: MemberRef?      // Which member it came from

    // Usage tracking
    is_read: boolean               // Used in read context
    is_mutated: boolean            // Used in mutating operation
    mutating_operations: [OpRef]   // Which operations mutate it

    // Scope tracking
    escapes_scope: boolean         // Returned or stored elsewhere
    is_captured: boolean           // Used in closure/lambda

    // Derived flags
    needs_reference: boolean       // Should be & or &mut
    needs_mutable_ref: boolean     // Should be &mut specifically
    needs_clone: boolean           // Must be cloned for ownership
}
```

### Phase 2: Function Parameter Analysis

For each function parameter:

```
ParameterUsageInfo {
    name: string
    type: TypeInfo

    // Mutation tracking
    is_mutated_directly: boolean   // param = newValue
    is_mutated_via_method: boolean // param.mutatingMethod()
    is_mutated_via_operator: boolean // buffer_set param ...

    // Usage tracking
    is_passed_to_mutating_fn: boolean  // Passed to fn that mutates it
    is_returned: boolean               // Returned from function
    is_stored: boolean                 // Assigned to member/global

    // Derived flags (for Rust)
    rust_needs_mut: boolean        // Parameter needs &mut T
    rust_needs_owned: boolean      // Parameter needs T (takes ownership)
    rust_can_borrow: boolean       // Parameter can be &T
}
```

### Phase 3: Function Return Analysis

For each function:

```
FunctionReturnInfo {
    return_type: TypeInfo

    // What is returned?
    returns_member_field: boolean    // Returns self.field
    returns_parameter: boolean       // Returns a parameter
    returns_local: boolean           // Returns locally created value
    returns_computed: boolean        // Returns computed value

    // For member field returns
    returned_member: MemberRef?
    member_is_mutated_after: boolean // Is field used mutably later?

    // Derived flags (for Rust)
    rust_return_clone: boolean     // Need .clone() on return
    rust_return_ref: boolean       // Can return &T
    rust_return_owned: boolean     // Return owned T
}
```

## Implementation Plan

### Step 1: Add Analysis Data Structures

Add new fields to existing compiler structures:

**In `ng_RangerAppParamDesc.rgr`:**

```ranger
; Already exists
def is_mutating:boolean false
def is_set:boolean false

; Add new fields
def mutation_count:int 0
def read_count:int 0
def is_assigned_from_member:boolean false
def source_member_name:string ""
def escapes_function:boolean false
def needs_cpp_reference:boolean false
def rust_borrow_type:int 0  ; 0=owned, 1=borrow, 2=mut_borrow
```

**In `ng_RangerAppFunctionDesc.rgr`:**

```ranger
; Add new fields
def returns_member_field:boolean false
def returned_member_name:string ""
def all_paths_return:boolean false
def mutates_self:boolean false
```

### Step 2: Create Analysis Walker

Create new file `compiler/ng_StaticAnalysis.rgr`:

```ranger
class StaticAnalyzer {
    def ctx:RangerAppWriterContext
    def currentFunction:RangerAppFunctionDesc
    def currentClass:RangerAppClassDesc

    ; Run full analysis on a class
    fn analyzeClass:void (cl:RangerAppClassDesc) {
        currentClass = cl

        ; Analyze each method
        for cl.methods m:RangerAppFunctionDesc i {
            this.analyzeFunction(m)
        }
    }

    fn analyzeFunction:void (fn:RangerAppFunctionDesc) {
        currentFunction = fn

        ; First pass: collect all variable usages
        this.walkForUsages(fn.fnBody)

        ; Second pass: determine mutation patterns
        this.walkForMutations(fn.fnBody)

        ; Third pass: analyze return patterns
        this.analyzeReturns(fn.fnBody)

        ; Derive borrow/reference requirements
        this.deriveBorrowRequirements()
    }

    ; Walk AST and track variable reads
    fn walkForUsages:void (node:CodeNode) {
        ; ... implementation
    }

    ; Walk AST and track mutations
    fn walkForMutations:void (node:CodeNode) {
        ; Check for mutating operators
        if (this.isMutatingOperator(node)) {
            def target:CodeNode (this.getMutationTarget(node))
            this.markAsMutated(target)
        }

        ; Recurse to children
        for node.children child:CodeNode i {
            this.walkForMutations(child)
        }
    }

    ; Check if operator mutates its first argument
    fn isMutatingOperator:boolean (node:CodeNode) {
        if (node.expression == false) { return false }
        def opName:string (node.getFirst().vref)

        ; Mutating buffer/array operators
        if (opName == "buffer_set") { return true }
        if (opName == "int_buffer_set") { return true }
        if (opName == "double_buffer_set") { return true }
        if (opName == "push") { return true }
        if (opName == "set") { return true }
        if (opName == "clear") { return true }

        ; Assignment is mutation
        if (opName == "=") { return true }

        return false
    }
}
```

### Step 3: Identify Mutating Operators

Create a registry of operators that mutate their arguments:

```ranger
; In Lang.rgr or new file
; Operators that mutate argument 1:
;   buffer_set, int_buffer_set, double_buffer_set
;   int_buffer_fill, double_buffer_fill
;   push, set, clear, remove
;
; Operators that mutate the target (assignment):
;   =
;
; Methods that mutate self (need &mut self in Rust):
;   Any method containing mutating operators on this.field
```

### Step 4: Modify Code Generation

**For C++, in `ng_RangerCppClassWriter.rgr`:**

```ranger
fn writeLocalVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def param:RangerAppParamDesc node.paramDesc

    ; Check if this needs to be a reference
    if (param.needs_cpp_reference) {
        ; Generate reference instead of copy
        ; std::vector<uint8_t>& buf = chunk->data;
        wr.out(this.getTypeString(param) + "& " + param.compiledName + " = " false)
    } {
        ; Normal value copy
        wr.out(this.getTypeString(param) + " " + param.compiledName + " = " false)
    }
    ; ... rest of definition
}
```

**For Rust, in `ng_RangerRustClassWriter.rgr`:**

```ranger
fn writeFunctionParams:void (fn:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fn.params param:RangerAppParamDesc i {
        if (i > 0) { wr.out(", " false) }

        switch param.rust_borrow_type {
            case 0 {
                ; Owned - take ownership
                wr.out(param.compiledName + ": " + this.getTypeString(param) false)
            }
            case 1 {
                ; Borrow - read only
                wr.out(param.compiledName + ": &" + this.getTypeString(param) false)
            }
            case 2 {
                ; Mutable borrow
                wr.out(param.compiledName + ": &mut " + this.getTypeString(param) false)
            }
        }
    }
}
```

### Step 5: Handle Return Values

Analyze what each function returns and generate appropriate code:

```ranger
fn analyzeReturns:void (fnBody:CodeNode) {
    ; Find all return statements
    def returns:[CodeNode] (this.findReturnStatements(fnBody))

    for returns ret:CodeNode i {
        def retValue:CodeNode (ret.getSecond())

        ; Is it returning a member field?
        if (retValue.hasParentDot) {
            if (retValue.getFirst().vref == "this") {
                currentFunction.returns_member_field = true
                currentFunction.returned_member_name = retValue.getSecond().vref
            }
        }

        ; Is it returning a parameter?
        if (this.isParameter(retValue.vref)) {
            currentFunction.returns_parameter = true
        }
    }
}
```

## Specific Fixes Enabled by This Analysis

### Fix 1: C++ Buffer Reference

**Before (broken):**

```cpp
std::vector<uint8_t> buf = currentChunk->data;
buf[pos] = b;  // Writes to copy!
```

**After (correct):**

```cpp
std::vector<uint8_t>& buf = currentChunk->data;
buf[pos] = b;  // Writes to original!
```

**Detection:** Variable assigned from member + used with mutating operator → needs reference.

### Fix 2: Rust Selective Cloning

**Before (inefficient):**

```rust
fn get_name(&self) -> String {
    self.name.clone()  // Always clones
}
```

**After (smart):**

```rust
// If caller just reads it:
fn get_name(&self) -> &String {
    &self.name  // Returns borrow
}

// If caller needs ownership:
fn get_name_owned(&self) -> String {
    self.name.clone()  // Clone only when needed
}
```

**Detection:** Return analysis + caller usage analysis.

### Fix 3: Rust Method Self Type

**Before (too restrictive):**

```rust
fn get_value(&mut self) -> i64 {  // Always &mut
    self.value
}
```

**After (correct):**

```rust
fn get_value(&self) -> i64 {  // Just & since we don't mutate
    self.value
}
```

**Detection:** Method doesn't contain mutating operations on self → use `&self`.

### Fix 4: C++ toBuffer Reference Chain

**The specific bug we found:**

```ranger
fn toBuffer:buffer () {
    def chunk:BufferChunk firstChunk
    while (done == false) {
        def chunkData:buffer chunk.data    ; <- This becomes a copy!
        def b:int (buffer_get chunkData i) ; <- Reads from copy (OK)
        buffer_set result pos b            ; <- Writes to result (OK)
    }
}
```

**Analysis detects:**

1. `chunkData` is assigned from `chunk.data` (member access)
2. `chunkData` is used with `buffer_get` (read-only)
3. `chunkData` does NOT need reference (only reads)
4. But if it had `buffer_set chunkData ...` it WOULD need reference

## Configuration

Enable static analysis only for targets that benefit:

```ranger
; In VirtualCompiler.rgr or compiler startup
def needsStaticAnalysis:boolean false

if ((targetLang == "rust") || (targetLang == "cpp")) {
    needsStaticAnalysis = true
}

if needsStaticAnalysis {
    def analyzer:StaticAnalyzer (new StaticAnalyzer())
    analyzer.ctx = ctx

    ; Run analysis on all classes
    for ctx.definedClasses cl:RangerAppClassDesc i {
        analyzer.analyzeClass(cl)
    }
}
```

## Performance Considerations

The static analysis adds compilation time but:

1. Only runs for Rust/C++ targets
2. Single pass over AST for most analysis
3. Results cached in existing param/function descriptors
4. No runtime overhead in generated code

## Testing Strategy

1. **Unit tests for analysis:**

   - Test that mutating operators are detected
   - Test that member assignments are tracked
   - Test that return patterns are identified

2. **Integration tests:**

   - Compile `GrowableBuffer.rgr` to C++ and verify PDF generation works
   - Compile existing Rust tests and verify no unnecessary clones
   - Compare generated code size before/after

3. **Regression tests:**
   - Ensure JavaScript/Go/Python output unchanged
   - Ensure no performance regression in compilation time for non-Rust/C++ targets

## Phases of Implementation

### Phase 1: Critical C++ Fixes ✅ COMPLETED

- ✅ Implement basic mutation detection for `buffer_set`, `int_buffer_set`, `push`, `set`
- ✅ Add `needs_cpp_reference` flag
- ✅ Modify C++ writer to emit references when needed
- ✅ Test with `GrowableBuffer.rgr` - PDF generation works correctly

### Phase 2: Rust Borrow Improvements ✅ COMPLETED

- ✅ Implement parameter mutation analysis (uses same StaticAnalyzer as C++)
- ✅ Add `rust_borrow_type` flag (0=owned, 1=borrow, 2=mut_borrow)
- ✅ Modify Rust writer to use `&T` vs `&mut T` appropriately
- ⏳ Remove unnecessary `.clone()` calls (future optimization)

### Phase 3: Return Value Analysis (1-2 days)

- Implement return statement analysis
- Track member field returns vs computed returns
- Generate `&T` returns in Rust where possible

### Phase 4: Rust Optional Unwrapping ⏳ IN PROGRESS

**Problem Discovered:** Rust's `Option<T>` requires explicit unwrapping before method calls or field access.

**Partial Implementation Completed (Dec 2024):**

Two fixes were added to `ng_RangerRustClassWriter.rgr`:

1. **Chained field access through optionals** (in `WriteVRef`):

   - When accessing `self.marginTop.pixels`, automatically insert `.as_ref().unwrap()` after optional fields
   - **Before:** `self.marginTop.pixels` → Error: no field `pixels` on `Option<EVGUnit>`
   - **After:** `self.marginTop.as_ref().unwrap().pixels` → Works

2. **Local variable assignment from optional fields** (in `writeVarDef`):
   - When `def m:EVGUnit section.box.marginTop`, unwrap the RHS and use non-optional type
   - **Before:** `let mut m : Option<EVGUnit> = section.box.marginTop;` → Error on `m.isSet`
   - **After:** `let mut m : EVGUnit = section.box.marginTop.clone().unwrap();` → Works

**Results:**

- Option-related errors reduced from ~50 to ~19
- Many field access patterns now work correctly

**Remaining Issues (need additional fixes):**

1. Method calls on optional class members: `self.buffer.clear()` where buffer is optional
2. Passing optional values as non-optional function arguments
3. Complex optional chains in expressions

**What We Need:**

```rust
// Correct Rust code
if let Some(ref mut margin) = self.marginTop {
    margin.resolve(parentHeight, fontSize);
}
self.marginTopPx = self.marginTop.as_ref().map(|m| m.pixels).unwrap_or(0.0);
// OR for mutable access:
self.marginTop.as_mut().unwrap().resolve(parentHeight, fontSize);
```

**Analysis Required:**

1. **Track Optional Types** - When a variable/field is declared with `@(optional)` annotation
2. **Detect Optional Method Calls** - When calling a method on an optional variable
3. **Detect Optional Field Access** - When accessing a field on an optional variable
4. **Mutation Detection on Optionals** - Determine if we need `as_ref()` vs `as_mut()`

**Implementation Approach:**

```ranger
; In WriteVRef or writeFnCall, check if the variable is optional
fn isOptionalAccess:boolean (node:CodeNode ctx:RangerAppWriterContext) {
    ; Check if we're accessing through an optional
    if ((array_length node.nsp) > 0) {
        for node.nsp p:RangerAppParamDesc i {
            if (!null? p.nameNode) {
                def nameN:CodeNode (unwrap p.nameNode)
                if (nameN.hasFlag("optional")) {
                    return true
                }
            }
        }
    }
    return false
}

; When generating method call on optional:
fn writeOptionalMethodCall (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter needsMut:boolean) {
    ; Write base variable
    this.WriteVRef(node.getFirst() ctx wr)

    if needsMut {
        wr.out(".as_mut().unwrap()." false)
    } {
        wr.out(".as_ref().unwrap()." false)
    }

    ; Write method name and args
    ; ...
}
```

**New Flags Needed on RangerAppParamDesc:**

```ranger
def rust_optional_accessed:boolean false     ; Was this optional accessed?
def rust_optional_mutated:boolean false      ; Was this optional mutated through?
def rust_optional_checked:boolean false      ; Was null check done before access?
```

**Integration Points in ng_RangerRustClassWriter.rgr:**

1. `WriteVRef` - Check if path goes through optional, add `.as_ref().unwrap()` or `.as_mut().unwrap()`
2. `writeFnCall` - Check if method is called on optional type
3. `writeExpression` - Check if field is accessed on optional type

**Patterns to Handle:**

| Pattern                   | Current Output   | Correct Output                    |
| ------------------------- | ---------------- | --------------------------------- |
| `opt.method()`            | `opt.method()`   | `opt.as_ref().unwrap().method()`  |
| `opt.method()` (mutating) | `opt.method()`   | `opt.as_mut().unwrap().method()`  |
| `opt.field`               | `opt.field`      | `opt.as_ref().unwrap().field`     |
| `opt.field = x`           | `opt.field = x`  | `opt.as_mut().unwrap().field = x` |
| `if (opt != null)`        | `if opt != None` | `if let Some(v) = &opt`           |

**Priority:** HIGH - This blocks Rust compilation of most real-world code

### Phase 5: Advanced Analysis (future)

- Escape analysis for closures
- Lifetime analysis for complex borrowing
- Cross-function mutation tracking

## Appendix: Mutating Operators Reference

| Operator             | Mutates Arg # | Notes                  |
| -------------------- | ------------- | ---------------------- |
| `buffer_set`         | 1             | `buf[offset] = value`  |
| `int_buffer_set`     | 1             | `buf[offset] = value`  |
| `double_buffer_set`  | 1             | `buf[offset] = value`  |
| `int_buffer_fill`    | 1             | Fills range with value |
| `double_buffer_fill` | 1             | Fills range with value |
| `push`               | 1             | Appends to array       |
| `set`                | 1             | `array[index] = value` |
| `clear`              | 1             | Empties array          |
| `remove`             | 1             | Removes from array     |
| `=`                  | target        | Assignment             |
| `put`                | 1             | Dictionary put         |

## Related Issues

- Issue #58: Go slice pass-by-value (similar problem, different solution)
- Issue #13: Rust comprehensive fixes (many workarounds this analysis would improve)
- Issue #16: Function return analysis (partial overlap)
