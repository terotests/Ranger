# Ranger Language Semantics Specification

> **Status:** Initial draft (Track 1 of `PLAN_LANGUAGE_IMPROVEMENTS.md`).
> ES6/JavaScript is the **reference implementation**; other targets must conform to this spec.
> Syntax is documented separately in `ai/GRAMMAR.md`.

## 1. Evaluation model

- Ranger programs compile to a target language and run on that runtime.
- Top-level `class` / `record` declarations are processed at compile time; runtime behavior is defined by generated code.
- Method bodies execute sequentially unless control flow (`if`, `while`, `return`, etc.) redirects.
- Arguments to functions and operators are evaluated left-to-right before the callee runs (call-by-value for scalars).

## 2. Numeric types

### 2.1 `int`

- 64-bit signed integer semantics on the reference target (ES6 `number` truncated where needed).
- Integer literals parse as `int`.
- `int` division in an `int` context uses truncating division toward zero unless assigned to `double`.

### 2.2 `double`

- IEEE-754 double precision on all targets.
- Mixed `int` / `double` arithmetic promotes to `double`.
- **Issue #4 rule:** when a `double`-typed variable is initialized from `int / int`, every target must produce floating-point division (not integer truncation).

### 2.3 Overflow

- No defined overflow behavior yet; targets may wrap or use arbitrary-precision until a future spec revision locks this down.

## 3. String semantics

### 3.1 Code units vs code points

**Rule (Issue #57 generalization):** `strlen`, `charAt` / `at`, and `substring` operate on **Unicode code points** (user-perceived characters), not raw UTF-8 bytes or UTF-16 code units, on every supported target.

- `"é"` has `strlen` 1 even when encoded as multiple bytes in UTF-8.
- Indexing is zero-based on code points.
- `substring s start end` returns the half-open range `[start, end)` in code-point indices.

### 3.2 Line endings in source

- The parser normalizes CRLF, lone CR, and LF to LF before tokenization.
- Generated source may use the target platform convention; behavior must not depend on which convention the `.rgr` file used.

### 3.3 Concatenation and comparison

- `+` on strings is concatenation.
- `==` / `!=` compare string contents (value equality).

## 4. Aggregate types

### 4.1 Arrays `[T]`

- **Reference semantics (Issue #58 decision):** array values are references. Assigning an array variable aliases the same underlying collection; `push`, `clear`, and indexed `set` mutate the shared collection.
- Targets where slices are value types (Go) must compile parameter arrays so mutations are visible to the caller, or reject mutation of parameter arrays at compile time.
- `array_length` returns element count.
- `push arr item` appends; `clear arr` removes all elements (slice reset, not nil) on Go.

### 4.2 Maps `[K:V]`

- Reference semantics analogous to arrays.
- Keys must be of a primitive/hashable type per target constraints.

### 4.3 Class instances

- Object references; `new` creates a distinct instance.
- Field access through `this` in methods.

## 5. Records (Track 2.1)

- `record` declares a nominal product type with fields only (no user-defined methods required).
- A field-order constructor is auto-generated when none is written.
- Construction: `new RecordName field value ...` with keyword markers (`new Point xpos 3 ypos 4`), or positional shorthand (`new Point 3 4`).
- Records compile to the same class/struct machinery as `class` without inheritance.

## 6. Optional and nullable types

- `?` suffix marks optional/nullable types where the target supports them.
- Unwrapping and default initialization follow per-target lowering documented in class writers.

## 7. Conformance

The `tests/conformance/` directory contains programs plus `expected_output.txt` files.
A target is conformant when every fixture compiles and produces identical stdout on that target.

Seeded fixtures cover:

| Fixture | Issue / topic |
|---------|----------------|
| `math_ops` | Operator spacing, arithmetic |
| `int_division_to_double` | #4 floating division |
| `string_codepoint_index` | #57 code-point indexing |
| `while_loop` | Control flow codegen |
| `lf_line_endings` | #12 LF-only sources |
| `array_param_mutate` | #58 array reference semantics (ES6; Go skipped — slice pass-by-value) |
| `clear_then_push` | #59 clear + push on parameter arrays |

## 8. Non-goals (this revision)

- Async/concurrency semantics
- Macro expansion order
- Package visibility across compilation units
- Payload-carrying enums and `match` exhaustiveness (Track 2.2–2.3)
