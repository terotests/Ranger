# Rust Code Generation Issues

This document describes the current status and remaining issues with Rust code generation in Ranger, specifically for the `evg_component_tool` project.

## Current Status (August 2026)

`evg_component_tool` and the PPTX viewer (`gallery/pptx/web/pptx_web.rgr`,
79 160 lines of generated Rust) both compile with **zero rustc errors**. The
sections below the historical table are kept for the reasoning; the counts in
them are the counts of the day they were written. For the last and largest
run, see [The PPTX viewer compiles](#the-pptx-viewer-compiles).

### Error Count Progression

| Phase                  | Errors | Key Changes                      |
| ---------------------- | ------ | -------------------------------- |
| Initial                | 365+   | No static analysis               |
| After trait fixes      | 50+    | Trait-based polymorphism working |
| After static analysis  | 19     | Mutation detection, borrow types |
| After immutable borrow | 11     | Proper `&` vs `&mut` handling    |
| August 2026            | **0**  | See the PPTX section at the end  |

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

---

## Measured on the current tree (August 2026)

The notes above come from one project (`evg_component_tool`). This section is a
sweep of the sample fixtures and of one gallery program, so the numbers are
about the target in general.

### Sample of ten fixtures

Eight of ten generate Rust that `rustc` builds with no error: `hello`,
`array_push`, `class_array`, `record_basic`, `string_ops`, `buffer_test`,
`forward_ref`, `infix_method_call`. Two do not.

| Fixture | `rustc` says | Cause |
| --- | --- | --- |
| `inheritance.rgr` | `no field 'name' on type 'Cat'` ×2 | The subclass struct never receives the fields of the parent. |
| `hash_map.rgr` | `an inner attribute is not permitted in this context` ×5, plus two type mismatches | A polyfill writes the `#![allow(…)]` header again below the top of the file. An inner attribute is legal only at the top. |

### An object is a value, not a reference

```lisp
def a:Counter (new Counter())
def b:Counter a
b.add(1)
print ("a " + (to_string a.value))
```

This prints `a 1` on JavaScript, Go, Python, C++ and Swift, because an object is
a reference on those targets. The Rust output gives `Counter` a plain `struct`,
so the second name moves the value:

```text
error[E0382]: borrow of moved value: `a`
   move occurs because `a` has type `Counter`, which does not implement the `Copy` trait
```

The writer adds `.clone()` in many places to work around this — 321 calls in the
Rust output of `jpeg_scaler.rgr` — so a program can compile and still give a
wrong answer, because each name then holds its own copy.

### `weak` does not compile

```rust
c.parent = Some(Rc::downgrade(&Rc::new(RefCell::new(p.clone()))));
…
let mut p : Parent = self.parent.clone().unwrap().upgrade().unwrap().borrow_mut();
```

`rustc` rejects the second line: `RefMut<Parent>` where `Parent` is expected.
The first line holds a fault that `rustc` does not report: the `Rc` is a
temporary, so the `Weak` is dead at the end of the statement and `upgrade()`
gives `None`.

This is the same cause as the section above. With no `Rc` holding the parent
there is nothing to downgrade, so `weak` needs the object model first.

### Operator coverage (fixed)

`jpeg_scaler.rgr` compiled to Rust held three errors, all
`Rust has no ternary operator`. The cause was `str2double`: it had no Rust
template, so it took the default one, which is JavaScript
(`isNaN( parseFloat(x) ) ? undefined : parseFloat(x)`).

`empty`, `int2double` and `str2double` now have Rust templates, and the file
builds with `rustc` and no error. It still writes a wrong image, for the reason
in the two sections above.

### The order of the work

1. **The object model.** A class needs a shape that two names can share.
   Everything below waits for it: `weak`, inheritance and the correctness of a
   program that shares an object.
2. **Inheritance.** The subclass struct needs the fields of the parent.
3. **The inner attribute.** A polyfill must not write `#![…]` below the top of
   the file. This one is local and small.

---

## The PPTX viewer compiles

_August 2026._ The question that prompted this was whether the browser PPTX
viewer at `gallery/pptx/web/` could be compiled Ranger → Rust → WASM as a
second path beside the JavaScript one. It can. `pptx_web.rgr` emits 79 160
lines of Rust that rustc accepts with no errors, at `-O` as well, and
`--target wasm32-unknown-unknown` produces a module.

`evg_component_tool`, the program the table at the top of this file tracks,
is at zero too.

### What the program is

`gallery/pptx/web/pptx_web.rgr` pulls in the whole stack: the OOXML reader and
writer, the shape geometry, the text layout, the EVG display list, the CSS
core, and the Vela chart compiler. It is 2.9 MB / 79 160 lines of generated
Rust — for scale, `evg_component_tool` is a fraction of that.

### The road from 398 errors

Every fix is in the compiler. Nothing in this program's `.rgr` sources
changed; the front end had already been made to emit it (see the entry
below this one).

| Errors | What was wrong |
| ---: | --- |
| 398 | starting point |
| 130 | **a call through a field is a mutation of the object that holds it.** 277 of the 398 were one bug in 267 functions: the receiver-mutability analysis looked for `obj.method()` in the `(call obj method args)` node the front end builds for a call on an *expression*, and an ordinary `reader.seek(x)` is a `hasFnCall` node whose receiver lives inside the dotted name. The verdict now runs to a fixpoint, because the answer for the field's class is not settled when the class holding the field is read. |
| 93 | **the borrow a path head takes.** A receiver path rooted at `this` borrows mutably when the field it reaches is held inline; `isMutatingOpName` in the template walker was missing four of the names Lang.rgr gives the in-place array operators; a call receiver counts as reaching a field through a path, so an optional field used that way is not put in a cell. |
| 77 | **a `&mut` argument reaches through its handle mutably** — the Rc segments on its path take `borrow_mut()`, the way a call receiver and an assignment target already did. |
| 55 | **a buffer is a Vec**, in the three places that had written their tests for `[int]` and so never saw one. |
| 38 | a string written in place is not a static string; `get` on a map of int/double/boolean had no Rust template; the clone rule for call arguments exists in five copies and one listed only Array and Hash. |
| 28 | **a field read on an expression.** `(itemAt runs ri).color` yields an `Rc<RefCell<…>>`, which has no fields of its own. CreatePropertyGet is overridden for Rust and settles the question for the field-tail rule in WriteVRef, which had been guessing from the field *name* alone. |
| 21 | **a call on a name is a call on that name's class** — `huffman.getDCTable(…)` was answering "unknown", which means the mutable borrow, everywhere. |
| 14 | **a statement-level operator can put a `let` in front of itself.** `push this.items (this.make())` holds `&mut self.items` and `&mut self` at once; the call path already hoisted conflicting arguments, and operator statements gained the same moment (`beforeOperatorStatement`). |
| 4 | a subclass handle stored in a trait field takes the unsizing coercion; a cell for a raw argument; an inherited method's body walks with the return declaration its inherent copy walks with; `set_at` stores a value, so it takes the by-value slot rule; a tail expression that borrows a local becomes an explicit `return`. |
| **0** | Clone is derived only when what a class holds INLINE can derive it; a plain `@(optional)` local is an `Option<T>` too; a hoisted argument still takes the borrow its parameter declares; `(call this m args)` is a call on THIS object, not on a field of it; and a method named after a Rust keyword needs `r#` — `fn type(…)` is a parse error, which carries no error code and had been hiding under a count of `error[E…]` lines. |

### What is left

21 warnings, no errors. They are the ordinary ones: `while true`, unused
imports, one `unconditional_recursion`.

A WASM *build* exists now too, at `gallery/pptx/web/wasm-rust/`: `bind.rs`
beside it exports the editor over the C ABI and `host.mjs` presents the module
as the object the page already expects, so the standalone page runs on it
unchanged. `rustc --target wasm32-unknown-unknown --crate-type=cdylib` is the
whole toolchain — the module has zero imports, so there is no glue file and no
SDK to source.

### Compiling is not the same as working

Everything above was measured with rustc alone, and rustc was satisfied while
the program was still wrong. Running it found six more emitter bugs, all fixed
in the compiler, none of them visible to a type checker:

| What it looked like | What it was |
| --- | --- |
| a deck with an accent in it dropped every shape after the first | `indexOf` returned a BYTE index while `strlen`, `charAt` and `substring` counted characters. Consistency within a target is the requirement, and Rust was the one target that broke it. Three prelude helpers now convert. |
| five different panics, all `already borrowed` | a borrow held across something that takes the same cell: an assignment whose right side reads the object it writes, an operator whose operand does, a call argument that does, a tail expression outliving the local it borrows. rustc cannot see these — the borrow is of a `RefCell`, not of the struct. |
| a PNG failed to decode | `writeByte(this.readU8())` read TWO bytes: two hoisting passes both claimed the same argument. The `__arg_N` sites now check whether the argument is already in a temporary. |
| the deck parsed to five empty slides | an out parameter hoisted into a temporary that was then dropped. Hoisting now leaves out parameters to the one site that writes the temporary back. |

The guard against a repeat is `npm run pptx:wasm:rust:parity`: 35 decks, 43
slides, 8459 scene commands compared field for field against the JavaScript
engine, plus the standalone page's own 98 assertions run in a browser against
the WASM module.

### The performance question this was asked for

Worth restating, because it has not changed. On the six-slide chart deck,
one slide, 10 084 commands — `npm run pptx:scene:bench`, all three from the
same run:

    buildFrame   10 ms    the layout, in Ranger
    toJson       62 ms    handing the frame to the page as text
    toBinary      7 ms    handing the same frame over as Int32Arrays

The cost was never the layout, so a WASM port would not have touched it.
Replacing that bridge (see `gallery/pptx/web/bridge.mjs`) took the hand-over
from ~70 ms to ~7 ms with no port at all. What is left for a WASM build to
win is the 10 ms of layout, and the C++ → WASM measurement puts the engine
at 1.03–1.25× faster and 2.8× larger as a download. Rust would take the same
route — same LLVM, same `wasm32`, same reference counting — so the
expectation is the same column. The value of this work is a second backend
that compiles a program this size, not speed.

---

## The PPTX viewer: how the front end got there (August 2026)

The Ranger side of the same program, recorded before the compiler work above
began. Kept because the diagnostic it explains is one every large program
will meet.

### Stage one: the Ranger frontend — DONE

The `-l=rust` frontend reported 45 errors, all one diagnostic:

> This method stores `this`, so its Rust form needs the receiver's Rc. Bind the
> receiver to a variable first: `def recv:T (expr)` — then `recv.method(...)`.

Every one was the same shape: a method called on a FIELD-ACCESS expression,
`ch.def0.get("scale")`, where the receiver has to exist as an `Rc` before a
method can borrow it. They were fixed at the source, by binding the receiver to
a local first — 39 sites in `VlCompile.rgr`, `VlCommand.rgr`, `VlScene.rgr` and
`PptxResolver.rgr`, plus `CRC32`'s constructor, which called a method that
writes through `this` before the object was inside its `Rc`.

Four of the 45 were invisible to the error report: `(! (ch.def0.has(k)))`
expands through a macro, so the compiler could only name `<macro >:1:11`. Worth
knowing — a macro-expanded location is not a missing error.

`-l=rust` now emits the viewer with no failures. **The Ranger side is done.**

### Stage two: rustc

396 errors then, 0 now — see the section above this one for what each
family was and which emitter decision it came from.
