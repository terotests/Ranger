# `is` — the kind test for closed shape families

`is v _:Shape.Case` answers **"does this value currently hold that case?"** and
nothing else. It is an expression, so it composes into `return`, `if`, `&&` and
anywhere else a boolean fits.

```ranger
fn isNumber:boolean () {
    return (is self _:EvalValue.Number)
}
```

Declared in `compiler/stdlib.rgr` (mirrored in `lib/stdlib.rgr`), immediately
after the `case` operator it is derived from.

## Why it exists

`case v x:Shape.Case { … }` already tests the discriminant — but it also
**binds** `x` and opens a block. An arm that only wants the answer pays for a
binding it never reads:

| target | what the binding costs in `case` |
| --- | --- |
| **Rust** | `.clone()` of the scrutinee — a refcount up/down pair for every reference case |
| **Go** | a declared local plus `_ = x` to satisfy the unused-variable rule |
| **ES6 / Python / PHP** | a dead assignment (`var x = v;`) |
| **C++** | `mpark::get<T>(v)` on top of the `holds_alternative` test |

The Rust row is the expensive one. `union_EvalValue` carries
`Rc<RefCell<…>>` in eight of its twelve variants, and the `case` template is

```
"if let " (typeof 1) "::" (typeof 2) "(" (e 2) ") = " (e 1) ".clone() { … }"
```

so **every** narrowing clones, whether or not the arm reads the binding. In the
generated interpreter that was 216 of 216 case sites.

`is` is the same discriminant test with the binding and the block removed. It
invents nothing per target — each template is the test the `case` operator on
that target already lowers to.

## Spelling

```
(is <value> _:<Shape>.<Case>)
```

The `_` is the binding you are *not* taking. It is a real annotated argument,
not a wildcard token: the compiler's argument matcher types an operator
argument from its `:Type` annotation, so the case has to arrive attached to a
name. Nothing is defined — the parameter is `@(noeval)`, so `_` never becomes a
variable and the same spelling may appear twice in one scope. Any name works;
`_` is the convention because it reads as "no binding".

## What each target emits

Source:

```ranger
shape Value {
    case Num { def n:double 0.0 }
    case Text { def s:string "" }
    case Nothing { }
}

sfn isNumNew:boolean (v:Value) {
    return (is v _:Value.Num)
}
```

Compiled (`node bin/output.js -l=<target> is_probe.rgr`):

| target | emitted body |
| --- | --- |
| **rust** | `matches!(v, union_Value::Value_Num(..))` |
| **cpp** | `mpark::holds_alternative<Value_Num>(v)` |
| **go** | `(v.tag == union_Value_tag_Value_Num)` |
| **es6** | `(v != null && v.__rg_kind === "Value_Num")` |
| **python** | `(v is not None and getattr(v, "_rg_kind", None) == "Value_Num")` |
| **kotlin** | `(v is Value_Num)` |
| **dart** | `(v is Value_Num)` |
| **csharp** | `(v is Value_Num)` |
| **java7** | `(v instanceof Value_Num)` |
| **scala** | `(v.isInstanceOf[Value_Num])` |
| **php** | `(is_object(v) && get_class(v) == "Value_Num")` |
| **swift6/3** | `({ () -> Bool in if case .Value_Num = v { return true }; return false })()` |

Side by side on Rust — the `case` form above, the `is` form below:

```rust
pub fn isNumOld(v : &union_Value) -> bool {
  if let union_Value::Value_Num(x) = v.clone() { /* union case */
    return true;
  };
  false
}
pub fn isNumNew(v : &union_Value) -> bool {
  matches!(v, union_Value::Value_Num(..))
}
```

and on ES6:

```js
ValueMain.isNumOld = function(v) {
  if( v != null && v.__rg_kind === "Value_Num" ) /* union case */ {
    var x = v;
    return true;
  };
  return false;
};
ValueMain.isNumNew = function(v) {
  return (v != null && v.__rg_kind === "Value_Num");
};
```

### Notes per target

- **Rust** — `matches!` reads the discriminant through the reference. No clone,
  no borrow of the payload, no drop at the end of the expression.
- **C++** — `holds_alternative` was already the bare index compare; the `case`
  template only added `mpark::get` on top. The template carries the same
  `variant.hpp` makefile dependency the `case` operator declares.
- **Swift** — `if case` is a statement, not an expression. An immediately
  applied closure is the only way to spell the test inline. `(e 1)` is named
  once, so the value is still evaluated exactly once.
- **Go** — the tag compare alone; no variant pointer is bound, so there is no
  `_ = x` discard to emit.
- **llvm** — no template, matching the `case` operator. The llvm target does not
  compile shape families at all today (`case` itself fails to match there), so
  this adds no new gap.

No target evaluates the value operand more than once.

## Cross-target verification

A probe declares a four-case shape (payload-free, scalar-payload, and two
reference cases in a group) and answers every question **twice** — once through
`case`, once through `is` — plus `is` composed with `||`, negated with
`false ==`, used as an `if` condition, and followed by a `case` that reads the
payload. Any target where the two lowerings disagree prints a mismatched row.

| target | compiles | executed | result |
| --- | --- | --- | --- |
| es6 | ✅ | ✅ | reference output |
| python | ✅ | ✅ | **matches es6** |
| go | ✅ | ✅ | **matches es6** |
| rust | ✅ | ✅ | **matches es6** |
| cpp | ✅ | ✅ | **matches es6** |
| java7 | ✅ | ✅ | **matches es6** |
| kotlin | ✅ | ✅ | **matches es6** |
| php | ✅ | ✅ | **matches es6** (needed a writer fix — see below) |
| swift6 / swift3 | ✅ | ✗ | toolchain unreachable; emission asserted by test |
| dart | ✅ | — | no toolchain here; emission inspected |
| csharp | ✅ | — | no toolchain here; emission inspected |
| scala | ✅ | — | no toolchain here; emission inspected |

Reference output, identical on all eight executed targets:

```
nul case=TFFF is=TFFF or=F not=T d=nul
num case=FTFF is=FTFF or=T not=F d=num:42
txt case=FFTF is=FFTF or=T not=T d=txt:hi
lst case=FFFT is=FFFT or=F not=T d=lst
```

`tests/is-operator.test.ts` runs `tests/fixtures/is_operator.rgr` on ES6,
Python, Go, Rust and Kotlin (each skipped when its toolchain is absent) and
asserts the emitted expression for Rust, C++, Kotlin and Swift — so Swift, whose
toolchain cannot be fetched in a sandbox, is still regression-locked.

**Swift is the one target never executed.** Its only distribution host,
`download.swift.org`, is refused by the network policy here (the proxy answers
403 to CONNECT), so the claim for Swift rests on reading the emitted code and on
the codegen assertions in the test, not on a run.

**PHP needed a writer fix to be testable at all.** It emitted a static call from
`main` as `$Probe->row(...)` — a member call on an undefined variable. The
param-desc branch of `writeVRef` was missing the leading-class check the plain-ns
branch already had, so it always wrote `$name->`. Fixed in
`ng_RangerPHPClassWriter.rgr`; PHP now emits `T::hello(...)` and runs both
probes correctly. Nothing to do with shapes — a seven-line class with one `sfn`
reproduced it.

## Groups: expanded into their member cases

A group is **not** a discriminant any target can test. The generated union
carries one tag per *case*, so asking a writer for a group tag produces a name
that does not exist:

- **rust** — `union_Val::union_Val_Prim` names no variant (`E0599`)
- **go** — `union_Val_tag_union_Val_Prim` is undefined
- **es6 / python** — a comparison against a tag no case ever carries, silently
  false for every value
- **swift** — a group lowers to its *own separate enum*, so a group tag is a
  comparison against a different type entirely

So `is v _:Shape.Group` is expanded at desugar time into a disjunction over the
group's member cases — the same move `match` already makes for a group arm —
and every target then sees only per-case tests it already knows how to lower:

```rust
pub fn isPrim(v : &union_Val) -> bool {
  (matches!(v, union_Val::Val_Nul(..))) || (matches!(v, union_Val::Val_Num(..)))
}
```

Verified running on ES6, Python, Go, Rust, C++, Kotlin, Java and PHP.

On the interface-lowering targets (Kotlin, Java, C#, Dart, Scala) a group *is* a
real type — Kotlin emits `sealed interface union_Val_Prim` and each case
implements it — so the disjunction is redundant there, but still correct. The
expansion is deliberately target-independent: putting "does this target make
groups real types?" into the flow would push writer knowledge up a layer.

**`case v x:Shape.Group` is still broken** — it needs a narrowed *binding*, not
just an answer, so the same expansion does not apply to it. That remains the
known-failing `shapes.test.ts > lowering > makes a group a type of its own`. Use
`is` for a group test; use `case` on a concrete case when you need the payload.

## Measured effect on the interpreter

`gallery/game_engine/v2/interp` was refactored onto the operator (see
"Engine refactor" below). Generated Rust for the Octane runner:

| | before | after |
| --- | ---: | ---: |
| `if let union_…` narrowings | 216 | 197 |
| `matches!` kind tests | 0 | 19 |
| `.clone()` calls | 7761 | 7499 |
| `EvValueBridge::` calls | 1265 | 1022 |

Interleaved wall time, same host, baseline binaries kept and re-run against the
refactored ones. **Octane suites** (the harness from
`zoo_octane/bench_matrix.py`, 5 reps, min ms — the score is liveClock-quantized
on C++, so wall time is the honest read):

| suite | Rust | C++ | es6 |
| --- | ---: | ---: | ---: |
| richards | **−16.4%** | −1.1% | +2.3% |
| deltablue | **−17.2%** | +0.4% | −0.7% |
| splay | **−20.5%** | −2.9% | +10.7% |

**Fixed-work microbenchmarks** (`zoo_octane/micro`, 13 reps, min ms):

| script | Rust | C++ | es6 |
| --- | ---: | ---: | ---: |
| arith_big | −12.8% | +6.6% | −3.4% |
| prop | −10.8% | −4.8% | +1.2% |
| call | −10.2% | −0.2% | +1.1% |
| method | −18.3% | −2.9% | +1.7% |
| typemix | −18.5% | −0.7% | +0.8% |
| pool_hit | −18.8% | +4.6% | +1.6% |
| pool_miss | −14.2% | +3.5% | +0.1% |

Read the three targets separately, because the reason each moves is different:

- **Rust — 10–20% faster, consistently.** This is the target the operator was
  written for. Every `case` cloned the scrutinee; the predicates under every
  dynamic type dispatch now read the discriminant in place.
- **C++ — flat, as predicted.** `holds_alternative` was already the bare index
  compare, and `mpark::get` on a variant with inline scalar cases is close to
  free. Nothing was there to remove. (es6 `splay` and C++ `arith_big` swing
  either way run to run; those rows are noise, not signal.)
- **es6 — flat.** V8 already folds the string tag compare and eliminates the
  dead `var x = v`, so the operator gives its JIT nothing new.

Absolute standing on this host after the refactor (Octane richards, from
`bench_matrix.py`) — for orientation against PR #544's six-engine matrix, which
was measured on a different machine:

| engine | richards score | wall | peak RSS |
| --- | ---: | ---: | ---: |
| Node (V8) | 22530 | 2.07s | 57 MB |
| Ranger C++ -O3 | 0.5† | **5.26s** | **12.6 MB** |
| Ranger Rust -O3 | 59.0 | 6.49s | **12.0 MB** |
| Ranger es6 | 21.7 | 7.96s | 94 MB |

† liveClock-quantized on this host — read C++ throughput from wall time.
The Ranger scores land in quantized buckets (21.7 / 40.6 / 59.0 / 136) at this
speed, which is why every claim above is wall time.

## Engine refactor

What changed in `gallery/game_engine/v2/interp/migrate/src`:

- **`EvalValue.rgr`** — 12 single-case predicates (`isNull`, `isNumber`,
  `isString`, `isHole`, `isUndefined`, `isBoolean`, `isElement`,
  `isArrayValue`, `isObject`, `isFunction`, `isMap`, `isSet`) became one-line
  `is` expressions; `isNullOrUndefined` became `(is …) || (is …)`; two
  `EvPropertySlot.Accessor` tests on a local scrutinee likewise.
- **`EvHandle.rgr`** — the three payload-free arms of `fromBody`
  (`Hole`/`Null`/`Undefined`) became `if (is ev _:…)`, since they bound a
  value they never read.
- **`ComponentEngine.rgr`** — 243 `EvValueBridge.isX(v)` static forwarder
  calls became direct `v.isX()`. Only call sites whose argument is a bare name
  were rewritten; the 18 that pass an expression keep the call, because moving
  an expression into receiver position would change how it parses.

The `EvValueBridge` forwarders themselves are unchanged and still exported —
only the engine's internal call sites stopped going through them.

Conformance held at every step: `test:runtime` **1327/1327** on es6, and
`conformance-native.cjs` **1297/1303 with 0 crashes** on both C++ and Rust,
identical to baseline.

## When to keep using `case`

`is` replaces only the pure test. When the arm reads the payload, `case` is
still the operator you want — it binds the narrowed value, which is the thing
`is` deliberately gives up:

```ranger
case body a:EvalValue.Array {
    return (array_length a.items)
}
```
