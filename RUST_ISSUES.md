# Rust Code Generation Issues

This document describes the remaining issues with Rust code generation in Ranger, specifically for projects using trait polymorphism patterns.

## Current Status

As of December 2025, the Rust backend can successfully compile complex projects like `evg_component_tool` with:

- ✅ Trait-based polymorphism using `Rc<RefCell<dyn Trait>>`
- ✅ Interior mutability for trait methods using `&mut self`
- ✅ Optional object fields in trait-related classes wrapped in `RefCell`
- ✅ Transitive mutation analysis for method signatures
- ✅ Call graph analysis for detecting indirect mutations

**Error count progression**: 365+ errors → 0 errors (compilation succeeds)

However, there is **one runtime issue** that causes a panic.

---

## The Core Problem: Passing `this` to a Trait-Type Parameter

### The Pattern

In Ranger source code:

```ranger
class EVGPDFRenderer {
    Extends(EVGImageMeasurer)
    def layout:EVGLayout

    Constructor () {
        ; ... initialization ...
        layout.setImageMeasurer(this)  ; <-- PROBLEM
    }
}
```

The `setImageMeasurer` method expects an `EVGImageMeasurer` (a trait parent class). Passing `this` means "store a reference to myself as the image measurer."

### How It's Currently Generated

```rust
fn init(&mut self) {
    self.layout.as_ref().unwrap().borrow_mut()
        .setImageMeasurer(Rc::new(RefCell::new(self.clone())));
    //                                         ^^^^^^^^^^^
    //                                         PROBLEM: can't clone
}
```

### Why It Fails

`EVGPDFRenderer` cannot implement `Clone` because it contains fields of type `Rc<RefCell<dyn SomeTrait>>`. The `dyn Trait` type is not `Clone`, so the derive macro fails.

Even if we could clone, **cloning is semantically wrong** - we want to store a reference to the SAME object, not a copy.

---

## Potential Solutions

### 1. Refactor to Composition (Recommended)

**Concept**: Instead of having `EVGPDFRenderer` extend `EVGImageMeasurer` (IS-A relationship), create a separate image measurer class that delegates to the renderer (HAS-A relationship). This avoids passing `this` entirely.

**Current Design (Inheritance - problematic)**:

```ranger
class EVGPDFRenderer {
    Extends(EVGImageMeasurer)  ; IS-A image measurer

    Constructor () {
        layout.setImageMeasurer(this)  ; Pass self - PROBLEM!
    }

    fn getImageDimensions:EVGImageDimensions (src:string) {
        ; Implementation here
    }
}
```

**Refactored Design (Composition - works)**:

```ranger
class PDFImageMeasurer {
    Extends(EVGImageMeasurer)  ; This is the trait implementor
    def renderer:EVGPDFRenderer

    fn getImageDimensions:EVGImageDimensions (src:string) {
        return renderer.loadImageDimensions(src)  ; Delegate to renderer
    }
}

class EVGPDFRenderer {
    ; Does NOT extend EVGImageMeasurer anymore!
    def imageMeasurer:PDFImageMeasurer

    Constructor () {
        imageMeasurer = (new PDFImageMeasurer())
        imageMeasurer.renderer = this
        layout.setImageMeasurer(imageMeasurer)  ; Pass separate object - WORKS!
    }

    fn loadImageDimensions:EVGImageDimensions (src:string) {
        ; Actual implementation (moved from getImageDimensions)
    }
}
```

**Why this works in Rust**:

1. `PDFImageMeasurer` is a simple struct that CAN be wrapped in `Rc<RefCell<...>>`
2. We pass `imageMeasurer` (a separate object), not `this`
3. `EVGPDFRenderer` is no longer trait-related, so no `RefCell` complexity for its fields
4. The back-reference `renderer:EVGPDFRenderer` is just a regular owned object or reference

**Pros**:

- Composition over inheritance - cleaner design pattern
- Rust-friendly - avoids self-referential Rc issues
- Works for all targets - no Rust-specific workarounds needed
- Separation of concerns - measurement logic is isolated
- Idiomatic Rust approach

**Cons**:

- Requires source code refactoring
- Slight indirection for method calls

---

### 2. Two-Phase Initialization

**Concept**: Don't set the self-reference in the constructor. Instead, require the caller to:

1. Create the object
2. Wrap it in `Rc<RefCell<...>>`
3. Call an init method passing the Rc

**Ranger pattern**:

```ranger
class EVGPDFRenderer {
    Constructor () {
        ; Don't call setImageMeasurer here
    }

    fn initWithSelf:void (selfRc:EVGPDFRenderer) {
        layout.setImageMeasurer(selfRc)
    }
}

; Usage:
def renderer (new EVGPDFRenderer())
def rc:Rc (Rc.wrap(renderer))  ; New Ranger construct
rc.initWithSelf(rc)
```

**Rust output**:

```rust
impl EVGPDFRenderer {
    pub fn new() -> EVGPDFRenderer { /* no self-reference */ }

    pub fn init_with_self(self_rc: Rc<RefCell<EVGPDFRenderer>>) {
        self_rc.borrow_mut().layout.as_ref().unwrap().borrow_mut()
            .setImageMeasurer(self_rc.clone());
    }
}

// Usage:
let renderer = Rc::new(RefCell::new(EVGPDFRenderer::new()));
EVGPDFRenderer::init_with_self(renderer.clone());
```

**Pros**: Clean Rust semantics, no unsafe code
**Cons**: Requires source code changes, changes API

---

### 3. ID-Based References (Arena Pattern)

**Concept**: Instead of storing actual object references, store IDs. Use a global registry to look up objects.

**Implementation**:

```rust
// Global registry
thread_local! {
    static IMAGE_MEASURERS: RefCell<HashMap<u64, Rc<RefCell<dyn EVGImageMeasurerTrait>>>>
        = RefCell::new(HashMap::new());
}

struct EVGLayout {
    image_measurer_id: Option<u64>,  // Store ID, not reference
}

impl EVGLayout {
    fn setImageMeasurer(&mut self, id: u64) {
        self.image_measurer_id = Some(id);
    }

    fn get_image_measurer(&self) -> Option<Rc<RefCell<dyn EVGImageMeasurerTrait>>> {
        self.image_measurer_id.and_then(|id| {
            IMAGE_MEASURERS.with(|m| m.borrow().get(&id).cloned())
        })
    }
}
```

**Pros**: Avoids self-referential issues entirely
**Cons**: Runtime overhead, complexity, not idiomatic Rust

---

### 4. Weak References

**Concept**: Store `Weak<RefCell<dyn Trait>>` instead of `Rc<RefCell<dyn Trait>>` for back-references.

**Implementation**:

```rust
struct EVGLayout {
    image_measurer: Option<Weak<RefCell<dyn EVGImageMeasurerTrait>>>,
}

impl EVGPDFRenderer {
    pub fn init(self_rc: &Rc<RefCell<Self>>) {
        self_rc.borrow_mut().layout.as_ref().unwrap().borrow_mut()
            .setImageMeasurer(Rc::downgrade(self_rc));
    }
}
```

**Pros**: Prevents reference cycles, idiomatic Rust
**Cons**: Requires upgrading Weak to Rc on each access, can fail if object dropped

---

### 5. Detect and Skip for Rust

**Concept**: Detect `this` being passed to trait-type parameters and generate a no-op or warning for Rust only.

**Implementation in compiler**:

```ranger
if is_passing_this_to_trait {
    ; For Rust: skip this line, add comment
    wr.out("// NOTE: setImageMeasurer(this) skipped - not supported in Rust" true)
}
```

**Pros**: Simple, doesn't break other targets
**Cons**: Feature doesn't work in Rust, may cause runtime issues

---

### 6. Custom Clone Implementation

**Concept**: Generate a manual `Clone` implementation that clones `Rc` fields (shared ownership) rather than trying to clone the inner `dyn Trait`.

**Implementation**:

```rust
impl Clone for EVGPDFRenderer {
    fn clone(&self) -> Self {
        EVGPDFRenderer {
            // Clone Rc (shared ownership, not deep clone)
            measurer: self.measurer.clone(),  // Rc::clone
            layout: self.layout.clone(),
            // ... other fields
        }
    }
}
```

**Problem**: This creates a NEW object that shares the same trait object references. It's still not "this" - it's a shallow copy. When `setImageMeasurer` stores it, it stores a different object.

**Verdict**: Doesn't actually solve the problem.

---

### 7. Raw Pointer with Unsafe

**Concept**: Use raw pointers for self-references.

**Implementation**:

```rust
impl EVGPDFRenderer {
    pub fn init(&mut self) {
        let self_ptr = self as *mut Self;
        // Store raw pointer... but this is very unsafe
    }
}
```

**Pros**: Works
**Cons**: Unsafe, lifetime issues, undefined behavior risks

---

### 8. Callback/Closure Pattern

**Concept**: Instead of storing the measurer, pass it to methods that need it.

**Ranger pattern**:

```ranger
class EVGLayout {
    ; No stored image_measurer field

    fn layoutWithMeasurer:void (measurer:EVGImageMeasurer) {
        ; Use measurer for this operation only
    }
}
```

**Pros**: Avoids storing references entirely
**Cons**: Significant API change, may not fit all use cases

---

### 9. Compiler-Generated Rc Wrapper

**Concept**: For classes that need to pass `this` to trait parameters, always wrap them in `Rc<RefCell<>>` at construction time.

**Ranger annotation**:

```ranger
@RcWrapped
class EVGPDFRenderer {
    ; All instances are Rc<RefCell<EVGPDFRenderer>>
}
```

**Rust output**:

```rust
// EVGPDFRenderer::new() returns Rc<RefCell<EVGPDFRenderer>>
pub fn new() -> Rc<RefCell<EVGPDFRenderer>> {
    let me = EVGPDFRenderer { /* fields */ };
    let rc = Rc::new(RefCell::new(me));
    // Now we can pass rc.clone() to setImageMeasurer
    rc.borrow_mut().layout...setImageMeasurer(rc.clone());
    rc
}
```

**Pros**: Transparent to source code, works correctly
**Cons**: All instances are heap-allocated, slightly different semantics

---

## Recommended Approach

**Best solution**: Use solution #1 (refactor to composition). This is the cleanest approach that:

- Works across all language targets without special handling
- Follows idiomatic Rust patterns (composition over inheritance)
- Separates concerns cleanly
- Requires no compiler changes

**If source refactoring is not desired**:

**Short term**: Use solution #5 (skip for Rust) to get compilation working, with a clear runtime message explaining the limitation.

**Medium term**: Implement solution #9 (compiler-generated Rc wrapper) for classes that:

1. Are trait-related (extend a trait parent or are extended)
2. Have methods that pass `this` to trait-type parameters

**Long term**: Consider solution #2 (two-phase initialization) as a language pattern, possibly with syntactic sugar to make it ergonomic across all targets.

---

## Detection Algorithm

To implement solution #9, we need to detect classes that pass `this` to trait parameters:

```
for each class C:
    for each method M in C:
        for each statement S in M:
            if S is a method call:
                for each argument A in S:
                    if A == "this" and parameter type is trait-related:
                        mark C as needs-rc-wrapper
```

Classes marked as `needs-rc-wrapper` would:

1. Have `new()` return `Rc<RefCell<Self>>` instead of `Self`
2. Have `this` references in trait-parameter positions use `self_rc.clone()`
3. Store the Rc internally or receive it as a parameter

---

## Affected Patterns in evg_component_tool

Currently only one pattern triggers this issue:

```ranger
; In EVGPDFRenderer constructor:
layout.setImageMeasurer(this)
```

The `EVGLayout.setImageMeasurer` method stores an `EVGImageMeasurer` reference for later use in layout calculations. This is a common pattern for dependency injection / strategy pattern.

---

## Related Issues

### Issue: Array Mutation in Trait Methods

**Status**: Resolved by using `&mut self` for all trait methods.

Previously, trait methods used `&self` which prevented mutation. Now all trait interface methods use `&mut self`, allowing normal mutation patterns.

### Issue: Optional Field Access in Trait Classes

**Status**: Resolved by wrapping in `RefCell`.

Optional object fields in trait-related classes are wrapped in `Option<RefCell<T>>` and accessed via `.as_ref().unwrap().borrow_mut()`.

---

## Testing

To verify Rust compilation:

```bash
npm run evgcomp:build:rust
```

Current state: Compiles successfully with 0 errors, but runtime panic on `setImageMeasurer(this)` call.

To test C++ (which works fully):

```bash
npm run evgcomp:build:cpp
cd gallery/pdf_writer
./bin/evg_component_tool_cpp.exe examples/test_multipage.tsx output.pdf --assets=./assets/fonts
```
