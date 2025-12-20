# Static Analysis Plan for Rust and C++ Targets

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

### Phase 1: Critical C++ Fixes (1-2 days)

- Implement basic mutation detection for `buffer_set`, `int_buffer_set`, `push`, `set`
- Add `needs_cpp_reference` flag
- Modify C++ writer to emit references when needed
- Test with `GrowableBuffer.rgr`

### Phase 2: Rust Borrow Improvements (2-3 days)

- Implement parameter mutation analysis
- Add `rust_borrow_type` flag
- Modify Rust writer to use `&T` vs `&mut T` appropriately
- Remove unnecessary `.clone()` calls

### Phase 3: Return Value Analysis (1-2 days)

- Implement return statement analysis
- Track member field returns vs computed returns
- Generate `&T` returns in Rust where possible

### Phase 4: Advanced Analysis (future)

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
