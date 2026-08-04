# PLAN: Shapes — closed variant families

> **Status:** proposal, nothing implemented yet. This document is the design and the
> staging plan for `shape` / `case` / `group` — a closed variant family whose *source*
> reads like a small type hierarchy while each target picks its own physical
> representation.
>
> **Origin:** a design discussion about `gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr`,
> the largest hand-rolled tagged union in this repo.
>
> Every number in §1, §2.1 and §5 was **measured on this checkout**, not estimated.
> The commands are in Appendix A so they can be re-run when the numbers drift.

---

## Executive summary

Ranger has no way to say "this type is exactly one of these twelve things". Users
simulate it with an integer tag and one wide class carrying every field any variant
could need. `EvalValue` is that pattern at full scale: **33 data members, 12 value
kinds, 680 bytes per value on the C++ target**, where a plain number still carries
three ordered maps, three vectors and seven strings it can never use.

The fix is not class inheritance. Inheritance in Ranger commits every target to a
boxed hierarchy, and it does not even survive the Rust backend (`RUST_ISSUES.md:567`:
"the subclass struct never receives the fields of the parent"). The fix is a
**closed variant family declared once and lowered per target**: a Rust `enum`, a C++
tagged handle, a TypeScript discriminated union, a Kotlin `sealed interface`, a C#
`readonly struct` — all from the same source.

Three constructs, in this order of importance:

1. **`shape` + `case`** — a closed set of variants, each with only its own fields.
2. **`match`** with compiler-checked exhaustiveness — this is where the bug-prevention
   payoff is; without it a shape is just a tidier union.
3. **`group`** and **`@(value)` / `@(reference)`** — named subsets and *declared*
   copy/equality semantics, so the compiler knows what a target is allowed to do.

Ranger already has the two pieces this can be bootstrapped from: `union` (a nominal
set of classes) and the `case` narrowing operator. §2.1 measures exactly how far they
carry today — **6 of 9 tested targets, and Rust, the target that would gain the most,
is not one of them.**

---

## 1. The problem, measured

`gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr` — 1306 lines, one class
(`EvalValue.rgr:23`), 12 value kinds distinguished by `def valueType:int`.

| Measurement | Value |
|---|---|
| Data members on the class | **33** (generated C++ listing, Appendix A.3) |
| `sizeof(EvalValue)` on the C++ target | **680 bytes** |
| Same value as a compact tagged handle (`kind` + `double` + `shared_ptr`) | **32 bytes** (21× smaller) |
| Mentions of `valueType` in `EvalValue.rgr` | 92 |
| Mentions of `valueType` in `ComponentEngine.rgr` | 288 |
| Mentions of `isHole` in `ComponentEngine.rgr` | 22 |
| Parallel maps holding one property's state | 4 (`objectMap`, `getterMap`, `setterMap`, `attrFlags`) |
| Fields copied by `withThis` to rebind `this` | 15 (`EvalValue.rgr:346`) |

Every one of those 680 bytes is allocated for every value. Numbers are the hot case in
an interpreter, and `EvalValue.number()` (`EvalValue.rgr:182`) already has a
4096-entry small-integer pool bolted on precisely because the allocation is so
expensive — a pool that exists to work around the representation, not because the
language semantics need it.

**Which fields does each kind actually use?**

| kind | fields it needs | fields it carries |
|---|---|---|
| Null / Undefined / Hole | tag only | 33 |
| Boolean | `boolValue` | 33 |
| Number | `numberValue` | 33 |
| String | `stringValue` | 33 |
| Array | `arrayValue`, `declaredLength`, identity, property state | 33 |
| Object | identity, property state | 33 |
| Function | 13 function fields, identity, property state | 33 |
| Map / Set | `arrayValue`, `mapVals`, identity, property state | 33 |
| Element | `evgElement`, identity | 33 |

Three defects follow from the shape of the data, not from the code written on top of it:

1. **One tag means two states.** `Hole` is `valueType == 8` *plus* `isHole == true`
   (`EvalValue.rgr:151`). Anything that classifies by tag alone silently treats an
   absent array element as `undefined`. That is deliberate — the comment says so — but
   it is a hand-maintained invariant across 22 call sites, not something the compiler
   can check. As its own `case Hole` it becomes unmissable.
2. **Property state must be kept in sync across four maps.** One key can appear in
   `objectMap`, `getterMap`, `setterMap` and `attrFlags`; nothing but discipline stops
   a key from being a data property and an accessor at once.
3. **Identity is a hand-kept invariant.** `identityId` is documented as
   "assigned exactly once at the creation factory" (`EvalValue.rgr:28`) and minted by
   `EvalIdentityMinter` (`EvalValue.rgr:1270`). `equals` (`EvalValue.rgr:1236`) then
   *implements by hand* exactly the value/reference split this plan wants to declare:
   null, undefined, number, string and boolean compare by content; array, object,
   function, Map, Set and element compare by `identityId`.

That last one is the tell. The semantics already exist and are already correct — they
are just written in the language of a fat class instead of declared to the compiler.

---

## 2. What Ranger already has

| Construct | Where | What it gives | What it does not give |
|---|---|---|---|
| `union Name (A B C)` | `ng_RangerFlowParser.rgr:4718`; `RangerAppClassDesc.is_union` / `.is_union_of` (`:35` / `:66`) | A nominal set of existing classes usable as a type | No payload, no closedness guarantee, no exhaustiveness, no declared semantics |
| `case v x:T { … }` | `lib/stdlib.rgr:149` (operator with a template per target) | Runtime narrowing to one member | Not a statement the compiler reasons about — no arm coverage analysis |
| `record` | `ng_RangerFlowParser.rgr:3935`, `:3985`, `:4861` | A class with a synthesized keyword constructor | A reference type on every target — no inline payload |
| `Enum N:int (…)` | `ng_RangerAppEnums.rgr` | A plain integer enum | No payload |
| `systemunion` | `ng_RangerFlowParser.rgr:3909` | Unions over system classes | Same limits |

`record`'s implementation is worth calling out for a different reason: it desugars by
**synthesizing Ranger source and re-parsing it** (`buildRecordConstructor`,
`ng_RangerFlowParser.rgr:3985` — it builds a `Constructor (…)` string, feeds it to
`RangerLispParser`, and walks the result). That is the cheapest possible route for
stage S1 of this plan: a shape can be lowered to constructs every writer already
handles, with no writer touched at all.

### 2.1 Measured state of `union` per target

Two probe programs (Appendix A.1, A.2): a union narrowed with `case` in a function
body, and a union used as a field type, an array element type and a return type.

| Target | Type-checks | Generated code builds | Representation the writer picks |
|---|---|---|---|
| ES6 / TS | yes | **yes, runs** | `instanceof` |
| Python | yes | **yes, runs** | `isinstance` |
| C++ | yes | **yes, runs** (after the shim fix below) | `mpark::variant<shared_ptr<A>, shared_ptr<B>, …>` |
| Go | yes | **no** — `declared and not used: n` | `interface{}` + type switch |
| Kotlin | yes | **no** — emits `v : EvalV`, a type nothing declares | none (bare union name) |
| C# | yes | not built here | `dynamic` parameter + `is` test |
| Swift 6 | yes | not built here | `Any` parameter + `as!` cast |
| **Rust** | **no** — `Could not match argument types for case` | — | **no `case` template for class-typed arms** |
| **Dart** | **no** — same | — | none |

Three findings matter for this plan:

- **Rust has no union narrowing at all.** `lib/stdlib.rgr` does carry `rust` templates
  for the *primitive* arms (`:35`, `:69`, `:103`, `:138`) — but they are hardwired to
  `RJson::Bool(...)`, i.e. they only work for the JSON value union. The class-typed
  arm at `:149` has templates for es6, php, go, csharp, swift3, swift6, java7, kotlin,
  python, cpp, scala and ranger — and not for rust or dart. Rust is the target where a
  native `enum` would pay off most, and it is the one target that cannot narrow a
  union today.
- **Where unions do work, the lowering is the expensive kind**: `dynamic` (C#),
  `interface{}` (Go), `Any` (Swift), `shared_ptr` per alternative (C++). Every
  alternative is boxed, so a `Number` variant still costs an allocation. A shape must
  not simply inherit this lowering — see §5.
- **Fixed while measuring:** the `variant.hpp` shim installed next to generated C++
  (`bin/variant.hpp`, copied by `installFile`, `ng_LiveCompiler.rgr:210`) declared
  `mpark::variant` and `mpark::get` but **not** `mpark::holds_alternative`, which is
  what the `case` template emits — so every generated C++ program that narrowed a
  union failed to compile against the shim. Fixed in this change, with a regression
  test in `tests/compiler-cpp.test.ts` and a fixture at `tests/fixtures/union_case.rgr`.

**Conclusion.** `union` is a type-checker feature with an ad-hoc lowering per target.
It is a fine *stage-0* desugaring target on the six targets where it works, and it is
not the end state anywhere.

---

## 3. Design

### 3.1 Surface syntax

```ranger
shape EvalValue {
    group Primitive @(value)
    group Reference @(reference)
    group PropertyCarrier does Reference {
        def properties:PropertyBag
    }

    case Null      does Primitive
    case Undefined does Primitive
    case Hole      does Primitive
    case Number    does Primitive       { def value:double 0.0 }
    case String    does Primitive       { def value:string "" }
    case Boolean   does Primitive       { def value:boolean false }

    case Array     does PropertyCarrier {
        def items:[EvalValue]
        def declaredLength:int (0 - 1)
    }
    case Object    does PropertyCarrier
    case Function  does PropertyCarrier {
        def core:FunctionCore
        def binding:FunctionBinding
    }
    case Map       does PropertyCarrier { def entries:[MapEntry] }
    case Set       does PropertyCarrier { def items:[EvalValue] }
    case Element   does Reference       { def element:EVGElement }

    fn toBool:boolean () {
        match this {
            Null | Undefined | Hole { return false }
            Number n  { return ((n.value == n.value) && (n.value != 0.0)) }
            String s  { return ((strlen s.value) > 0) }
            Boolean b { return b.value }
            Reference { return true }
        }
    }
}
```

Deliberate departures from the original sketch, each with a reason:

**`shape` is closed by definition — no `@(closed)`.** Closedness is the entire point;
an annotation invites an `@(open)` that would silently disable exhaustiveness checking
everywhere. If open families are ever wanted, they should be a different keyword.

**Variant fields are declared with `def`, in a block.** `case Number(value:double)`
reads well but introduces a second field syntax into a language that has exactly one
(`def name:type default`). Reusing `def` means defaults, annotations and the existing
`CheckTypeAnnotationOf` path all work unchanged.

**`group … does …`, never `extends`.** Groups are subsets, not base classes. Using
`extends` would suggest that a target must produce a real superclass, which is exactly
the commitment this design exists to avoid. `does` reads the same in both positions
(`case X does Group`, `group A does B`).

**Identity is compiler-owned, not a declared `int` field.** Declaring
`def identityId:int` inside `group Reference` forces every target to store a counter.
Rust and C++ already have a perfectly good identity — the payload address — and the
JVM has one too. The language should expose the *operation*, not the storage:
`@(reference)` guarantees a stable identity for the value's lifetime, `===` and
`sameReference` compare it, and `identityId` is available as a read-only accessor only
on targets that need a printable number (the current `EvalIdentityMinter` is exactly
the fallback implementation).

### 3.2 Groups

A `group` is a named subset of the family plus the fields every member of that subset
carries. It is usable as a type:

```ranger
fn sameReference:boolean (a:EvalValue.Reference b:EvalValue.Reference) {
    return (a === b)
}
```

Three consequences the compiler gets for free:

- the primitive arms need not be considered in the body;
- `match` over a `EvalValue.Reference` value is exhaustive when it covers the group's
  members, not the whole family;
- a group with fields (`PropertyCarrier.properties`) tells the representation selector
  which variants share a payload prefix — which is what lets C++ and Rust put
  `PropertyBag` in one place instead of eleven.

Groups may nest (`PropertyCarrier does Reference`). They may not overlap in v1: a case
belongs to at most one group chain. Overlapping groups are a lattice, and a lattice
needs a real subtyping algorithm in `ng_RangerArgMatch.rgr` — not a v1 problem.

### 3.3 Value and reference semantics

This is the more important half of the proposal, and it is the half that is *not*
about layout.

| | `@(value)` | `@(reference)` |
|---|---|---|
| Copy | copies the value | shares the payload |
| `==` | compares content | compares identity |
| Identity | none | stable for the value's lifetime |
| Mutable fields | **not allowed** | allowed |

The "no mutable fields on a value case" rule is an addition to the original proposal
and it is load-bearing. Without it, a value case with a mutable field is observably a
reference on ES6 (which shares the object) and a copy on Rust (which clones it) — the
same program, two behaviours, no diagnostic. Value cases are immutable; a change
produces a new value. This matches every variant `EvalValue` marks as a value today.

Physical sharing stays a target decision: `@(value)` says nothing about whether a
runtime may intern strings or pool small integers. It constrains what a program can
*observe*.

Default when a case is in no group: `@(value)` for a case with no fields or only
immutable scalar fields, `@(reference)` otherwise — with a warning that asks for the
annotation, because guessing wrong here is a semantic change.

### 3.4 `match` and exhaustiveness

```ranger
match value {
    Null | Undefined | Hole { … }     ; several variants, one arm
    Number n                 { … }     ; binds the variant, n.value in scope
    Reference r              { … }     ; a group covers all its members
}
```

Rules:

- Every variant of the family (or of the group, when the scrutinee is a group type)
  must be covered exactly once. Missing arm → error naming the missing variants.
  Duplicate arm → error.
- **No `default` arm.** A `default` makes the check vacuous and silently absorbs
  variants added later — which is the exact bug class this construct exists to
  eliminate. Where a catch-all is genuinely wanted, `_ { … }` is explicit and can be
  linted.
- Arms bind by name; the binding is typed as the variant, so `n.value` resolves
  statically. This is the `case` operator's `@(define)` mechanism
  (`lib/stdlib.rgr:149`), generalized.
- `match` is a statement, and it is an expression only if `all paths return` analysis
  lands first (`PLAN_LANGUAGE_IMPROVEMENTS.md`, Track 3.2). Statement-only in v1.

### 3.5 Construction and testing

```ranger
def v:EvalValue (EvalValue.Number(3.0))          ; positional, in declaration order
def a:EvalValue (EvalValue.Array(items 4))
if (v is EvalValue.Number) { … }                 ; single-variant test
if (v is EvalValue.Reference) { … }              ; group test
```

Keyword construction (`EvalValue.Array items xs declaredLength 4`) should reuse
`record`'s existing keyword-argument path (`expandRecordCtorArgsIfNeeded`,
`ng_RangerFlowParser.rgr:3947`) rather than growing a second one.

### 3.6 Methods

Methods may be declared on the shape (all variants), on a group (its members), or on a
single case. A shape method may only touch fields the whole family has — in practice
none, so shape methods almost always start with a `match`. A group method may touch the
group's fields directly. Nothing here requires virtual dispatch: the lowering is a free
function plus a tag switch, except where a target's chosen representation is a sealed
hierarchy anyway (Kotlin's default, Swift), in which case the writer may use real
methods.

### 3.7 The `case` keyword collision

`case` already exists twice: as the `switch` arm operator and as the union-narrowing
statement operator (`lib/stdlib.rgr:149`, `compiler/operators.md`). Using it a third
time as a shape member declaration is *parseable* — a shape body is walked by its own
routine, and `case Number does Primitive { … }` cannot appear where a statement is
expected — but it costs something real: editor highlighting, `ng_RangerDocGenerator`,
the VS Code extension and every future grammar tool now need context to know which
`case` they are looking at.

Recommendation: **keep `case` as the canonical spelling** (it reads best and matches
the design intent) and accept `variant` as a synonym from day one, so tooling that
cannot carry context has an unambiguous form to emit and users of `switch`-heavy code
have an escape hatch. This costs one line in the shape-body walker.

### 3.8 Explicitly not in v1

| Deferred | Why |
|---|---|
| `payload record` / inline records | Needed for the *best* Rust and C++ layouts, not for correctness. Variant fields declared inline cover every case in `EvalValue`. |
| Generic shapes (`shape Result<T>`) | Interacts with the generic-instantiation machinery; a large separate design. |
| Match guards, nested/destructuring patterns | Each is a real feature; none is needed to delete `valueType`. |
| Open shapes / user-extensible families | Contradicts exhaustiveness; add later if ever. |
| Whole-program dead-variant elimination | Real, but a whole-program optimization pass gated on a closed-world flag. Low value next to the layout win. |
| `match` as an expression | Wants `all paths return` analysis first. |

---

## 4. Compiler model

### 4.1 IR

Target-independent, built by the flow parser, consumed by every writer:

```text
ShapeDesc
  name
  cases[]        ShapeCaseDesc
  groups[]       ShapeGroupDesc
  methods[]      RangerAppFunctionDesc
  representation RepresentationKind     ; chosen per target, see 4.3

ShapeCaseDesc
  name
  stableTag:int                          ; assignment order; stable across builds
  fields[]       RangerAppParamDesc
  semantics      Value | Reference
  groups[]       string                  ; innermost first

ShapeGroupDesc
  name
  semantics      Value | Reference | Unset
  fields[]       RangerAppParamDesc
  cases[]        string                  ; transitive closure
  methods[]      RangerAppFunctionDesc
```

`stableTag` matters for the serialize path (`ng_RangerSerializeClass.rgr`) and for any
on-disk or cross-process representation: variant order in the source must not silently
renumber a persisted tag. Assign in declaration order, never reorder, and let a future
`@(tag 7)` pin it explicitly.

### 4.2 Where each piece lands

| Stage | File | Hook |
|---|---|---|
| Registration | `ng_RangerFlowParser.rgr:4718` | next to `union` / `systemunion` in the top-level walker |
| Statement dispatch | `ng_RangerFlowParser.rgr:~590` | a `case 'shape'` beside `'class'` / `'record'` |
| Descriptor storage | `ng_RangerAppClassDesc.rgr` | `is_shape`, `shape_of`, `shape_cases`, `shape_groups` beside `is_union` (`:35`) and `is_record` (`:32`) |
| Type identity / lookup | `TTypeRegistry.rgr`, `ng_RangerAppWriterContext.rgr:1249` | `EvalValue`, `EvalValue.Number` and `EvalValue.Reference` all resolve as types; `b_multitype` must know a shape is multi-typed |
| Argument matching | `ng_RangerArgMatch.rgr:111`, `:450`, `:551` | a case matches its shape and each of its groups (the union rules generalize) |
| Exhaustiveness | new pass, invoked where `ng_StaticAnalysis.rgr` runs | needs the full `ShapeDesc` and the arm list; a pure IR pass, no target knowledge |
| Lowering | `ng_RangerFlowParser.rgr:3985` style | synthesize Ranger source for S1; per-writer emitters from S4 |
| Codegen | each `ng_Ranger*ClassWriter.rgr` | only for targets whose representation is not the S1 desugaring |

### 4.3 Representation selection

One enum, chosen per (target, shape), so a writer can opt in gradually:

```text
NativeSumType        ; Rust enum, Swift enum with payloads
CompactTaggedHandle  ; C++ / C#: tag + scalar slot + payload pointer
BoxedSealedHierarchy ; Kotlin sealed interface, Java sealed classes, Swift classes
FlatTaggedObject     ; ES6 / TS / Python / Dart: { kind, … }
UnionOfClasses       ; the S1 desugaring — works wherever `union` + `case` work
```

Selection is a *writer* decision with an IR-level default, and it must be observable
in diagnostics (`--explain-shapes` or similar): "EvalValue → CompactTaggedHandle
(cpp)". Silent representation choices are impossible to debug from generated code.

---

## 5. Per-target plan

| Target | Representation | Notes / what exists today |
|---|---|---|
| **Rust** | `NativeSumType` | `enum EvalValue { Number(f64), Array(Rc<RefCell<ArrayData>>), … }`; `match` maps 1:1. **Blocked today:** no class-typed `case` template at all (§2.1). Highest payoff, highest prerequisite cost. |
| **C++** | `CompactTaggedHandle` | `enum class Kind : uint8_t` + `double scalar_` + `shared_ptr<Payload>`: **32 bytes vs today's 680**, and primitives allocate nothing. The existing `mpark::variant` lowering is the fallback (`UnionOfClasses`) and stays correct. C++14 support argues against `std::variant` as the baseline. |
| **TypeScript** | `FlatTaggedObject` | Discriminated union on `kind` + named subset types for groups; `never`-based exhaustiveness in the emitted code doubles as a check that the Ranger-side analysis agrees. |
| **ES6** | `FlatTaggedObject` | Same runtime shape as TS, no annotations. Null/Undefined/Hole as frozen singletons. |
| **C#** | `CompactTaggedHandle` | `readonly struct` with tag + `double` + `object?`; avoids boxing every element of an `EvalValue[]`. Replaces today's `dynamic`, which defeats every static check. |
| **Kotlin** | `BoxedSealedHierarchy` default | `sealed interface` + `data class` per variant; `when` is checked exhaustive by kotlinc, which independently validates our analysis. A `CompactTaggedHandle` mode is the JVM optimization, later. **Fix first:** the union type name is currently emitted undeclared (§2.1). |
| **Go** | `UnionOfClasses` → interface + type switch | Works today apart from the unused-binding defect (§2.1); a tagged struct is the later optimization. |
| **Python** | `FlatTaggedObject` | `isinstance` narrowing works today; small classes with `__slots__` are the natural target. |
| **Swift 6** | `NativeSumType` | Swift enums carry payloads natively; today's `Any` + `as!` is strictly worse. |
| **Dart / PHP / Scala / Java7** | `UnionOfClasses` or `BoxedSealedHierarchy` | Follow the general path; Dart needs the missing `case` template first. |

**Prerequisite defects** (all measured in §2.1) — these block the plan on the targets
that need them, and each is independently useful:

1. Rust: class-typed `case` template (or a native `match` lowering).
2. Kotlin: emit a declared type for a union (a sealed interface is the natural answer,
   and it is the same machinery a shape needs).
3. Go: emit `_ = binding` (or use the binding) so an unused narrowed value compiles.
4. Dart: class-typed `case` template.
5. ~~C++: `holds_alternative` missing from the installed `variant.hpp` shim.~~ **Fixed
   in this change.**

---

## 6. Staging

Each stage is independently shippable and independently testable.

| Stage | Content | Done when |
|---|---|---|
| **S0** | Fix the target defects in §5 (1–4). Add a conformance fixture per target that narrows a union and runs. | The §2.1 table is green everywhere |
| **S1** | `shape` + `case` parsed, registered, type-checked. Lowering: `UnionOfClasses` — synthesize one class per case plus a `union`, exactly as `buildRecordConstructor` synthesizes a constructor (`ng_RangerFlowParser.rgr:3985`). **No writer is touched.** | A shape compiles and runs on every target where `union` works |
| **S2** | `match` + exhaustiveness checking. Lowering: a chain of `case` narrowings. Error messages name missing variants by name. | A missing arm is a compile error on every target; a shape with a full `match` runs identically on es6, python, cpp |
| **S3** | `group`, group-typed parameters, group patterns in `match`, group fields. | `fn f (v:EvalValue.Reference)` type-checks and rejects a primitive |
| **S4** | `@(value)` / `@(reference)`: `==` lowering, copy semantics, identity, the immutability rule for value cases. | Cross-target conformance test: value cases compare by content, reference cases by identity, on every target |
| **S5** | Representation selection + native representations for Rust, C++, TS, Kotlin, C#. One target at a time, `UnionOfClasses` remains the fallback. | Rust emits a real `enum`; C++ emits the compact handle; measured `sizeof` drops |
| **S6** | Inline payload records, tag pinning, whole-program variant elimination, `match` as an expression. | — |

Testing follows the pattern already in the repo: fixtures under `tests/fixtures/`,
per-target codegen assertions in `tests/compiler-*.test.ts`, and a runtime conformance
case under `tests/conformance/` so the same shape program produces the same output on
every target that can be executed in CI.

---

## 7. Migrating `EvalValue`

The migration is the reason the feature is worth building, and it is also the only
honest test of the design. It should be staged so the engine keeps running throughout.

### 7.1 Field mapping

| Today | Becomes |
|---|---|
| `valueType:int` | the variant tag — deleted from source |
| `numberValue` | `Number.value` |
| `stringValue` | `String.value` |
| `boolValue` | `Boolean.value` |
| `isHole` | the `Hole` variant (the tag/flag pair disappears) |
| `identityId` | compiler-owned identity on `group Reference`; `EvalIdentityMinter` becomes the fallback implementation |
| `arrayValue`, `declaredLength` | `Array.items`, `Array.declaredLength` |
| `arrayValue` + `mapVals` | `Map.entries:[MapEntry]` — one list of pairs instead of two index-matched lists |
| `objectMap`, `getterMap`, `setterMap`, `attrFlags` | `PropertyBag.slots:[string:PropertySlot]` (see below) |
| `protoRef`, `extensibleFlag`, `sealedFlag`, `frozenFlag` | `PropertyBag` |
| `functionName`, `functionNode`, `closureId`, `homeModule`, `srcText`, `builtinKind`, `builtinName`, `builtinNamespace`, `strictFn`, `suppressedKeys` | `FunctionCore` (shared) |
| `boundThis`, `boundArgs`, `boundExplicit` | `FunctionBinding` (per binding) |
| `evgElement` | `Element.element` |
| `functionBody` | dead (`/** note: unused */` in the generated C++) — delete |

### 7.2 Properties: one slot per key

```ranger
shape PropertySlot {
    case Data     { def value:EvalValue  def attributes:int }
    case Accessor {
        def getter@(optional):EvalValue
        def setter@(optional):EvalValue
        def attributes:int
    }
}

class PropertyBag {
    def slots:[string:PropertySlot]
    def prototype@(optional):EvalValue
    def extensible:boolean true
    def sealed:boolean false
    def frozen:boolean false
}
```

Four parallel maps become one, and "data property *and* accessor for the same key"
stops being representable. Note this is also the first place a nested shape pays for
itself: `PropertySlot` is a two-variant family, exactly the case where today's answer
is a boolean flag plus optional fields.

### 7.3 Functions: split core from binding

`withThis` (`EvalValue.rgr:346`) copies 15 fields to rebind `this`, preserving
`identityId` by hand so the new value stays `===` to the old one. With

```text
Function
  core:    FunctionCore      ; shared, carries identity
  binding: FunctionBinding   ; boundThis, boundArgs, boundExplicit
```

`withThis` copies the binding and shares the core — three fields instead of fifteen,
and identity preservation stops being a hand-maintained invariant because the identity
lives in the shared core.

### 7.4 Migration order

1. **S1–S2 land.** Define the shape beside the existing class; nothing calls it yet.
2. **Compatibility layer.** Keep every current entry point as a thin wrapper —
   `EvalValue.number(12.0)` → `EvalValue.Number(12.0)`, `v.isNumber()` →
   `v is EvalValue.Number`. The 288 `valueType` sites in `ComponentEngine.rgr` keep
   compiling.
3. **Convert by kind, not by call site.** `Hole` first (it is a correctness fix, not
   just a cleanup), then the primitives, then `Element`, then the property carriers.
   Each conversion is one `match` replacing one `valueType` chain, and the benchmark
   suite (`gallery/game_engine/v2/interp/bench/`, `npm run test:tsengine`) gates each
   step.
4. **Delete the wrappers** and the `valueType` constants.
5. **Re-measure.** `sizeof(EvalValue)` on C++, the eight benchmark cases on Node, C++,
   Rust, Go, Kotlin, Python and C#, and the small-integer pool's remaining value —
   with primitives no longer heap-allocated, the pool may stop earning its keep on the
   native targets.

The order matters: every step is a mechanical, reviewable transformation with a
runnable test on both sides, and at no point does the engine stop working.

---

## 8. Risks and open questions

| Risk | Response |
|---|---|
| A closed family across 15+ writers is a large surface | S1 touches **no** writer — it desugars to constructs every writer already handles. Native representations arrive one target at a time behind the representation enum. |
| Exhaustiveness checking is only as good as the type analysis | Kotlin's `when` and TypeScript's `never` check the same property independently on the emitted code; a disagreement is a bug report from the target compiler, for free. |
| `case` used three ways | Shape bodies have their own walker; `variant` as a synonym gives tooling an unambiguous spelling (§3.7). |
| Value semantics diverging across targets | The "no mutable fields on `@(value)` cases" rule (§3.3), enforced at declaration, plus a cross-target conformance test in S4. |
| Big-bang `EvalValue` rewrite | Explicitly staged behind a compatibility layer (§7.4) with the benchmark suite as the gate. |

Open questions worth settling before S1:

1. **Nested shape declarations** — is `shape PropertySlot` allowed inside
   `shape EvalValue`, or must it be top level? (Top level in v1 is simpler and loses
   nothing.)
2. **Serialization.** `@serialize(true)` (`ng_RangerSerializeClass.rgr`) needs a rule
   for shapes: `stableTag` in the wire form, or the variant name? Name is more robust
   to reordering, tag is smaller.
3. **`Any` interaction.** `Any` is itself a union of every declared class
   (`ng_RangerFlowParser.rgr:4404`). Do shape cases join it? They should not — a shape
   case is not independently constructible outside its family.
4. **Does a case name live in the shape's namespace only?** `EvalValue.Number` should
   not collide with a top-level `Number`; the descriptor should store the qualified
   name and let writers mangle as their target requires.

---

## Appendix A: reproducing the measurements

Commit measured: `dfbcfca`. All commands run from the repo root.

### A.1 Probe 1 — union narrowed in a function body

```ranger
class EvNumber { def value:double 0.0 }
class EvString { def value:string "" }
class EvArray  { def identityId:int 0 }

union EvalV (EvNumber EvString EvArray)

class Probe {
    fn toBool:boolean (v:EvalV) {
        case v n:EvNumber { return (n.value != 0.0) }
        case v s:EvString { return ((strlen s.value) > 0) }
        case v a:EvArray  { return true }
        return false
    }
    sfn main:void () {
        def p:Probe (new Probe())
        def n:EvNumber (new EvNumber())
        n.value = 3.0
        print (to_string (p.toBool(n)))
    }
}
```

```bash
node bin/output.js -es6 probe.rgr -d=out -o=probe.js -nodecli   # OK, prints true
node bin/output.js -l=python probe.rgr -d=out -o=probe.py       # OK, prints true
node bin/output.js -l=cpp    probe.rgr -d=out -o=probe.cpp      # OK; g++ -std=c++17 builds, prints true
node bin/output.js -l=go     probe.rgr -d=out -o=probe.go       # compiles; go build fails: declared and not used
node bin/output.js -l=kotlin probe.rgr -d=out -o=probe.kt       # compiles; emits `v : EvalV`, undeclared
node bin/output.js -l=rust   probe.rgr -d=out -o=probe.rs       # FAILS: Could not match argument types for case
node bin/output.js -l=dart   probe.rgr -d=out -o=probe.dart     # FAILS: same
```

### A.2 Probe 2 — union as a field, array element and return type

Same three classes; a `Box` with `def items:[EvalV]`, `def one@(optional):EvalV`,
`fn add:void (v:EvalV)`, `fn first:EvalV ()` and a `for` loop narrowing each element.
Type-checks on every target except Rust and Dart; es6, python and (after the shim fix)
C++ build and print `ns`.

### A.3 `sizeof(EvalValue)` on the C++ target

```bash
node bin/output.js -l=cpp gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr \
  -d=out -o=ev.cpp
# append a main printing sizeof(EvalValue), then:
g++ -std=c++17 -O2 ev.cpp -o ev_size && ./ev_size
# sizeof(EvalValue) = 680
# sizeof(shared_ptr<EvalValue>) = 16
# sizeof(std::string) = 32
# sizeof(rg_ordered_map<std::string, std::shared_ptr<EvalValue>>) = 48
# sizeof(std::vector<std::shared_ptr<EvalValue>>) = 24
```

The 33 generated data members are listed by the same command; the compact-handle
comparison (`uint8_t` + `double` + `shared_ptr` = 32 bytes) is a three-field struct
compiled with the same flags.

### A.4 Source counts

```bash
grep -c valueType gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr        # 92
grep -c valueType gallery/game_engine/v2/interp/migrate/src/ComponentEngine.rgr  # 288
grep -c isHole    gallery/game_engine/v2/interp/migrate/src/ComponentEngine.rgr  # 22
```

---

## Related documents

- `PLAN_LANGUAGE_IMPROVEMENTS.md` — Track 2 (records, payload enums, `match`). This
  document is the payload-enum half of that track, deliberately separated: the existing
  `Enum` stays a plain integer enum, and `shape` is the payload-carrying family. A
  payload enum, if ever wanted, becomes sugar over `shape`.
- `RUST_ISSUES.md` — inheritance not surviving the Rust backend (`:567`), the reason
  class hierarchies are not the answer here.
- `TS_ENGINE_PERF.md` — the measured cost of the current value model across seven
  targets.
- `SPEC_SEMANTICS.md` — where the `@(value)` / `@(reference)` rules belong once agreed.
