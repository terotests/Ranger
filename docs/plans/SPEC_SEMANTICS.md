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

**Current rule (PLAN_STRING_INDEXING.md, stages 1, 2, 4 and 5 done):** a
`string` is text in the target's own encoding. `strlen`, `charAt` / `at`,
`substring` and `indexOf` count **the target's native unit**, so they stay
O(1) and agree with each other on one target. They agree across targets
only on ASCII.

| Targets | Unit of `strlen` / `charAt` / `substring` |
| --- | --- |
| JavaScript / TypeScript, Java, Kotlin, C#, Dart, Swift 6 | UTF-16 code unit |
| Python | Unicode code point |
| Rust, Go, C++, PHP | UTF-8 byte |

Measured on this checkout for `"aé😀b"` (4 code points, 5 UTF-16 units,
8 UTF-8 bytes):

| | ES6 | Python | Rust | Go | C++ |
| --- | --- | --- | --- | --- | --- |
| `strlen s` | 5 | 4 | 8 | 8 | 8 |
| `charAt s 1` | 233 | 233 | 195 | 195 | 195 |
| `substring s 1 2` | `é` | `é` | `é` | half of `é` | half of `é` |
| `array_length (to_chars s)` | 4 | 4 | 4 | 4 | 4 |
| `length (to_charbuffer s)` | 8 | 8 | 8 | 8 | 8 |

The portable views:

- `to_chars s` → `[int]` of **Unicode code points**, the same on every target.
  Use it (or iterate it) for any text that may leave ASCII.
- `to_charbuffer s` → `charbuffer` of **UTF-8 bytes**, the same on every target.
  A `charbuffer` is bytes; its `length` and `charAt` count octets.

A program that indexes a `string` with non-ASCII text is **not portable**
under this rule; `-strict-strings` prints every `charAt` / `substring` on a
`string` that is not an ASCII literal. The older text of this section said `strlen` counted code
points everywhere; no target except Python ever did that, and the
`string_codepoint_index` fixture only uses ASCII, so it could not catch it.

**Planned:** code points become the one meaning of a string's length and
iteration, reached through `chars()` iteration instead of O(n) indexing, and
direct indexing of a `string` leaves the portable surface. See
[PLAN_RUST_SYNTAX.md §5](PLAN_RUST_SYNTAX.md#5-strings-d7).

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

- `@(optional)` marks an optional value (`def maybe@(optional):string`). A class
  field declared without a value is optional too.
- `if (!null? x)` narrows `x` inside the block; `-strict` reports optional reads
  that no check narrows. The full narrowing rules are in `AGENTS.md`
  ("Optionals").
- Each target lowers optionals to its own form (`std::optional<T>` on C++,
  `Option<T>` on Rust, a nullable reference elsewhere).

## 7. Conformance

The `tests/conformance/` directory contains programs plus `expected_output.txt` files.
A target is conformant when every fixture compiles and produces identical stdout on that target.

Seeded fixtures cover:

| Fixture | Issue / topic |
|---------|----------------|
| `math_ops` | Operator spacing, arithmetic |
| `int_division_to_double` | #4 floating division |
| `string_codepoint_index` | `at` / `strlen` on ASCII text (does not exercise non-ASCII, see §3.1) |
| `while_loop` | Control flow codegen |
| `lf_line_endings` | #12 LF-only sources |
| `array_param_mutate` | #58 array reference semantics (ES6; Go skipped — slice pass-by-value) |
| `clear_then_push` | #59 clear + push on parameter arrays |

## 8. Non-goals (this revision)

- Async/concurrency semantics
- Macro expansion order
- Package visibility across compilation units
- Payload-carrying enums and `match` exhaustiveness (Track 2.2–2.3)
