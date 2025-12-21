# Rust Code Generation Issues

This document describes the current status and remaining issues with Rust code generation in Ranger, specifically for the `evg_component_tool` project.

## Current Status (December 2025)

### Error Count Progression

| Phase                  | Errors | Key Changes                      |
| ---------------------- | ------ | -------------------------------- |
| Initial                | 365+   | No static analysis               |
| After trait fixes      | 50+    | Trait-based polymorphism working |
| After static analysis  | 19     | Mutation detection, borrow types |
| After immutable borrow | 11     | Proper `&` vs `&mut` handling    |
| **Current**            | **11** | See remaining issues below       |

### What's Working ✅

1. **Trait-based polymorphism** using `Rc<RefCell<dyn Trait>>`
2. **Interior mutability** for trait methods using `&mut self`
3. **Optional object fields** in trait-related classes wrapped in `RefCell`
4. **Transitive mutation analysis** for method signatures
5. **Call graph analysis** for detecting indirect mutations
6. **Static method detection** - methods that don't use `this` are emitted as `ClassName::method()`
7. **Immutable borrow parameters** (`&Vec<T>`) for non-mutated buffer/array parameters
8. **Pre-evaluation of arguments** to avoid borrow conflicts with self members
9. **Optional field access** uses `as_ref().unwrap()` for reading, `as_mut().unwrap()` for writing

---

## Static Analysis System

The Rust code generator now includes a comprehensive static analysis phase that runs before code generation. See [PLAN_STATIC_ANALYSIS.md](PLAN_STATIC_ANALYSIS.md) for full details.

### Key Components

**1. StaticAnalyzer class** (`compiler/ng_StaticAnalysis.rgr`)

- Mutation detection for buffer/array operators (`buffer_set`, `push`, `set`, etc.)
- Function parameter analysis (detects which params are mutated)
- Field assignment tracking (`obj.field = value` mutations)
- Method call mutation tracking (`obj.method()` where method mutates)
- Return statement analysis

**2. Borrow Type System**

```
rust_borrow_type values:
  0 = owned (T) - default
  1 = immutable borrow (&T) - for non-mutated buffers/arrays
  2 = mutable borrow (&mut T) - for mutated parameters
```

**3. Context Tracking**

- `ctx.isInLhs()` - tracks if we're on left side of assignment
- `ctx.setInLhs()` / `ctx.unsetInLhs()` - for proper `as_mut()` vs `as_ref()` in optional fields

**4. Static Method Detection**

- Methods that don't use `this` are called as `ClassName::method()`
- Avoids E0499 double mutable borrow errors when passing `&mut self.field` as argument

---

## Current Remaining Errors (11 total)

### E0308: Type Mismatches (7 errors)

**Issue 1: Assignment from borrowed parameter**

```rust
// Line 9379
self.data = buf;  // ERROR: expected Vec<u8>, found &Vec<u8>
```

**Cause**: Parameter `buf` is an immutable borrow (`&Vec<u8>`) but we're assigning to an owned field.
**Fix needed**: When assigning borrowed param to owned field, add `.clone()`: `self.data = buf.clone();`

**Issue 2: Local variables passed to immutable borrow parameters**

```rust
// Lines 12421, 12438, 12455, 12508, 12525, 12542
self.encodeBlock(&mut writer, yCoeffs, ...);
//                            ^^^^^^^ expected &Vec<i64>, found Vec<i64>
```

**Cause**: `yCoeffs`, `cbCoeffs`, `crCoeffs` are local variables (not temp vars). The function expects `&Vec<i64>` but we're passing `Vec<i64>`.
**Fix needed**: Add `&` prefix when passing local variables to immutable borrow parameters.

### E0596: Borrow Mutability (2 errors)

**Issue: Mutable borrow of immutable reference parameter**

```rust
// Line 9823
fn transformFast(&mut self, coeffs: &Vec<i64>, output: &Vec<i64>) {
    self.transform(&coeffs, &mut output);  // ERROR: cannot borrow as mutable
}
```

**Cause**: Parameter `output` is `&Vec<i64>` (immutable) but we try to pass `&mut output`.
**Fix needed**: Static analysis should detect that `output` is passed to a `&mut` parameter and mark it as needing mutable borrow in the function signature.

### E0382: Moved Value (2 errors)

**Issue: Variable moved in loop**

```rust
// Lines 14687, 14695
fn bindFunctionParams(&mut self, fnNode: TSNode, props: EvalValue) {
    while i < fnNode.params.len() {
        self.bindObjectPattern(&param, &mut props);  // ERROR: props moved here
        // ...
        self.setSymbol(paramName, props.clone());    // ERROR: use of moved value
    }
}
```

**Cause**: `props` is an owned `EvalValue` passed to functions multiple times in a loop.
**Fix needed**: Either:

1. Pass `props` as `&mut EvalValue` (mutable reference)
2. Clone `props` each iteration
3. Mark `EvalValue` as needing `&mut` when used in loops

---

## Implementation Details

### Where Fixes Are Needed

**1. For E0308 (assignment from borrowed param)**
File: `ng_RangerRustClassWriter.rgr`, in `CustomOperator` assignment handling.
Add check: if RHS is an immutable borrow parameter and LHS is owned field, add `.clone()`.

**2. For E0308 (local vars to immutable borrow params)**  
File: `ng_RangerRustClassWriter.rgr`, in `writeFnCall` standard path.
When passing a local variable (not temp var) to a parameter with `rust_borrow_type == 1`, add `&` prefix.

**3. For E0596 (mutable borrow of immutable ref)**
File: `ng_StaticAnalysis.rgr`, in `analyzeFunction`.
Detect when a parameter is passed to a function requiring `&mut` and upgrade the parameter's borrow type.

**4. For E0382 (moved value in loop)**
File: `ng_StaticAnalysis.rgr`, in `walkForMutations`.
Detect when a variable is used multiple times in a loop body and either:

- Mark it for cloning
- Mark it as needing reference parameter type

---

## Detailed Code Examples: Ranger → Rust → Problem

### Example 1: Assignment from Borrowed Parameter (E0308)

**Ranger Source** (`JPEGHuffman.setData`):

```ranger
class JPEGHuffman {
  def data:buffer  ; owned Vec<u8>

  fn setData:void (buf:buffer) {
    data = buf  ; assign parameter to field
  }
}
```

**Generated Rust** (with immutable borrow optimization):

```rust
impl JPEGHuffman {
  // Static analysis detected: buf is not mutated → use &Vec<u8>
  fn setData(&mut self, buf: &Vec<u8>) -> () {
    self.data = buf;  // ❌ ERROR: expected Vec<u8>, found &Vec<u8>
  }
}
```

**The Problem**: Static analysis correctly saw that `buf` is not mutated (no `buffer_set`, `push`, etc.), so it marked it as immutable borrow. But the assignment `data = buf` needs an owned value, not a reference.

**Correct Rust**:

```rust
fn setData(&mut self, buf: &Vec<u8>) -> () {
    self.data = buf.clone();  // ✅ Clone the borrowed data
}
```

---

### Example 2: Local Variable to Immutable Borrow Parameter (E0308)

**Ranger Source** (`JPEGEncoder.writeSOSSegment`):

```ranger
class JPEGEncoder {
  fn writeSOSSegment:void (writer:BitWriter) {
    def yCoeffs:[int] (this.getDCTCoeffs(0))   ; local variable
    def cbCoeffs:[int] (this.getDCTCoeffs(1))
    def crCoeffs:[int] (this.getDCTCoeffs(2))

    ; These calls pass local variables to encodeBlock
    this.encodeBlock(writer yCoeffs dcY acY dcTableY acTableY prevDcY 0)
    this.encodeBlock(writer cbCoeffs dcC acC dcTableC acTableC prevDcCb 1)
    this.encodeBlock(writer crCoeffs dcC acC dcTableC acTableC prevDcCr 2)
  }

  ; coeffs parameter is not mutated - analyzed as immutable borrow
  fn encodeBlock:void (writer:BitWriter coeffs:[int] ...) {
    ; read-only access to coeffs
    def dc:int (at coeffs 0)
  }
}
```

**Generated Rust**:

```rust
fn writeSOSSegment(&mut self, writer: &mut BitWriter) -> () {
    let yCoeffs: Vec<i64> = self.getDCTCoeffs(0);   // owned local
    let cbCoeffs: Vec<i64> = self.getDCTCoeffs(1);
    let crCoeffs: Vec<i64> = self.getDCTCoeffs(2);

    // encodeBlock expects &Vec<i64> but we pass Vec<i64>
    self.encodeBlock(&mut writer, yCoeffs, ...);  // ❌ expected &Vec<i64>, found Vec<i64>
}

fn encodeBlock(&mut self, writer: &mut BitWriter, coeffs: &Vec<i64>, ...) -> () {
    // coeffs is correctly &Vec<i64> here
}
```

**The Problem**: Local variables `yCoeffs`, `cbCoeffs`, `crCoeffs` are owned `Vec<i64>`. When calling `encodeBlock` which expects `&Vec<i64>`, we need to pass a reference.

**Correct Rust**:

```rust
self.encodeBlock(&mut writer, &yCoeffs, ...);  // ✅ Pass reference to local
```

---

### Example 3: Transitive Mutable Borrow Requirement (E0596)

**Ranger Source** (`FastDCT.transformFast`):

```ranger
class FastDCT {
  fn transformFast:void (coeffs:[int] output:[int]) {
    ; output is passed to transform() which mutates it
    this.transform(coeffs output)
  }

  fn transform:void (coeffs:[int] output:[int]) {
    ; output is mutated here
    set output 0 (at coeffs 0)
  }
}
```

**Generated Rust**:

```rust
// Static analysis saw: coeffs not mutated → &Vec<i64>
// Static analysis saw: output not DIRECTLY mutated in transformFast → &Vec<i64> (WRONG!)
fn transformFast(&mut self, coeffs: &Vec<i64>, output: &Vec<i64>) -> () {
    self.transform(&coeffs, &mut output);  // ❌ cannot borrow output as mutable
}

// transform correctly has output as &mut
fn transform(&mut self, coeffs: &Vec<i64>, output: &mut Vec<i64>) -> () {
    output[0] = coeffs[0];
}
```

**The Problem**: Static analysis detected that `output` is mutated in `transform()` (correctly marking it `&mut`). But in `transformFast()`, the analysis only looked at direct mutations, not that `output` is PASSED to a function that requires `&mut`.

**Correct Rust**:

```rust
// output needs &mut because it's passed to transform() which requires &mut
fn transformFast(&mut self, coeffs: &Vec<i64>, output: &mut Vec<i64>) -> () {
    self.transform(&coeffs, output);  // ✅ output is already &mut
}
```

---

### Example 4: Moved Value in Loop (E0382)

**Ranger Source** (`ComponentEngine.bindFunctionParams`):

```ranger
class ComponentEngine {
  fn bindFunctionParams:void (fnNode:TSNode props:EvalValue) {
    def i:int 0
    while (i < (array_length fnNode.params)) {
      def param:TSNode (at fnNode.params i)

      ; props is used multiple times in the loop
      this.bindObjectPattern(param props)

      def paramName:string param.name
      this.setSymbol(paramName props)

      i = i + 1
    }
  }
}
```

**Generated Rust**:

```rust
fn bindFunctionParams(&mut self, fnNode: TSNode, props: EvalValue) -> () {
    let mut i: i64 = 0;
    while i < fnNode.params.len() as i64 {
        let param: TSNode = fnNode.params[i as usize].clone();

        // First use - props is MOVED here
        self.bindObjectPattern(&param, &mut props);  // ❌ props moved

        let paramName: String = param.name.clone();
        // Second use - ERROR: props already moved!
        self.setSymbol(paramName, props.clone());    // ❌ use of moved value

        i = i + 1;
        // Next iteration - props doesn't exist anymore!
    }
}
```

**The Problem**: In Rust, when you pass an owned value to a function, it's MOVED (ownership transferred). Inside a loop, `props` is moved on the first iteration and doesn't exist for subsequent iterations.

**Correct Rust** (Option A - make props a reference):

```rust
fn bindFunctionParams(&mut self, fnNode: TSNode, props: &mut EvalValue) -> () {
    while i < fnNode.params.len() as i64 {
        self.bindObjectPattern(&param, props);  // ✅ borrow, not move
        self.setSymbol(paramName, props);       // ✅ still valid
    }
}
```

**Correct Rust** (Option B - clone in loop):

```rust
fn bindFunctionParams(&mut self, fnNode: TSNode, props: EvalValue) -> () {
    while i < fnNode.params.len() as i64 {
        let props_copy = props.clone();
        self.bindObjectPattern(&param, &mut props_copy);
        self.setSymbol(paramName, props.clone());
    }
}
```

---

## Code Patterns Implemented

### Immutable Borrow for Parameters

```ranger
; When parameter is not mutated and is buffer/array type
; Static analysis sets: param.rust_borrow_type = 1
```

Generates:

```rust
fn process(&mut self, data: &Vec<u8>) { ... }
//                          ^^^ immutable borrow
```

### Mutable Borrow for Parameters

```ranger
; When parameter is mutated (field assignment, mutating method call)
; Static analysis sets: param.rust_borrow_type = 2
```

Generates:

```rust
fn process(&mut self, data: &mut Vec<u8>) { ... }
//                          ^^^^ mutable borrow
```

### Optional Field Access

```ranger
def box@(optional):EVGBox
; Access: box.width
```

Generates:

```rust
// Reading (not in LHS of assignment)
self.r#box.as_ref().unwrap().width

// Writing (in LHS of assignment)
self.r#box.as_mut().unwrap().width = value;
```

### Pre-evaluation for Borrow Conflicts

```ranger
; When calling method on self member with args that reference self
self.huffman.parseDHT(self.data, pos, len)
```

Generates:

```rust
let __arg_0 = self.data.clone();
let __arg_1 = pos;
let __arg_2 = len;
self.huffman.as_mut().unwrap().parseDHT(&__arg_0, __arg_1, __arg_2);
```

### Static Method Calls

```ranger
; Methods that don't use 'this' are detected
; Called as ClassName::method() instead of self.method()
```

Generates:

```rust
// Instead of: self.buildHuffmanCodes(bits, codes, &mut ehuf, &mut esiz);
JPEGEncoder::buildHuffmanCodes(&bits, &codes, &mut ehuf, &mut esiz);
```

---

## Next Steps

1. **Fix E0308 for assignment from borrowed param**

   - Add clone when assigning `&T` parameter to owned field

2. **Fix E0308 for local variables**

   - Add `&` prefix for local vars passed to immutable borrow params

3. **Fix E0596 for transitive mutation**

   - Detect parameters that are passed to `&mut` functions and upgrade their signature

4. **Fix E0382 for loop usage**
   - Detect variables used multiple times in loops and handle appropriately

---

## Historical Issue: Passing `this` to Trait-Type Parameter

**Status**: Generates panic message (intentional limitation)

When passing `this` to a trait-type parameter in Rust, we cannot create `Rc<RefCell<Self>>` from `&mut self`. The compiler now generates:

```rust
panic!("Cannot pass 'this' to trait-type parameter in Rust. Object must be externally wrapped in Rc<RefCell<...>>")
```

**Workaround**: Refactor to composition pattern - create a separate object that implements the trait and delegates to the main object. See archived solutions below.

---

## Testing Commands

```bash
# Compile Ranger compiler
npm run compile

# Build Rust code for evg_component_tool
npm run evgcomp:build:rust

# Count errors by type
npm run evgcomp:build:rust 2>&1 | Select-String "^error\[E" | Group-Object | Select-Object Name, Count

# Build C++ (working reference)
npm run evgcomp:build:cpp
```

---

## Related Files

- `compiler/ng_StaticAnalysis.rgr` - Static analysis implementation
- `compiler/ng_RangerRustClassWriter.rgr` - Rust code generation
- `compiler/ng_RangerAppWriterContext.rgr` - Context flags (`isInLhs`, etc.)
- `PLAN_STATIC_ANALYSIS.md` - Detailed static analysis plan

---

# Archived: Historical Solutions for `this` to Trait Parameter

The following solutions were considered for the "passing `this` to trait-type parameter" problem. They are preserved here for reference but the issue is now handled with a panic message and the recommendation to refactor to composition.

<details>
<summary>Click to expand archived solutions</summary>

### 1. Refactor to Composition (Recommended)

**Concept**: Instead of having `EVGPDFRenderer` extend `EVGImageMeasurer` (IS-A relationship), create a separate image measurer class that delegates to the renderer (HAS-A relationship).

```ranger
class PDFImageMeasurer {
    Extends(EVGImageMeasurer)
    def renderer:EVGPDFRenderer

    fn getImageDimensions:EVGImageDimensions (src:string) {
        return renderer.loadImageDimensions(src)
    }
}

class EVGPDFRenderer {
    def imageMeasurer:PDFImageMeasurer

    Constructor () {
        imageMeasurer = (new PDFImageMeasurer())
        imageMeasurer.renderer = this
        layout.setImageMeasurer(imageMeasurer)
    }
}
```

### 2. Two-Phase Initialization

Don't set self-reference in constructor. Require caller to wrap in `Rc<RefCell<>>` first.

### 3. ID-Based References (Arena Pattern)

Store IDs instead of references, use global registry for lookup.

### 4. Weak References

Store `Weak<RefCell<dyn Trait>>` instead of `Rc`.

### 5. Compiler-Generated Rc Wrapper

Annotate classes with `@RcWrapped` to have `new()` return `Rc<RefCell<Self>>`.

</details>
