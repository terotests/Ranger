# PLAN: Shapes — closed variant families

> **Status:** design + staging plan for `shape` / `case` / `group` — a closed variant
> family whose *source* reads like a small type hierarchy while each target picks its
> own physical representation. **Stages S0–S5 (core) are implemented** (§6):
> `union` + `case` narrowing works on every target the plan builds on; `shape`
> parses, type-checks and lowers to a record class per case plus a union over
> them; `match` covers a family with the compiler checking that every case is
> handled exactly once; `@(value)` / `@(reference)` give each case declared
> copy-and-compare semantics with the equality generated per shape; six targets
> carry the family in their own representation — TypeScript/ES6/Python as a
> tagged object (`__rg_kind`), Kotlin/C#/Dart as an interface the cases
> implement, Swift and Rust as a native `enum`, Go as a tagged struct, and C++
> as a variant that holds its scalar cases inline; and **shape methods** lower
> through a generated ops class. **Stages C0–C6** (§7) extend groups into a
> closed-family capability system: group/case methods, required operations,
> field projection, subgroup widening, and static exhaustive dispatch.
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
set of classes) and the `case` narrowing operator. §2.1 measured how far they carried:
**6 of 9 targets, and Rust — the target that would gain the most — was not one of
them.** Stage S0 closed that gap (§5.1): Rust, Dart, Kotlin, Go and C++ all narrow a
union now, so S1 can lower a shape to constructs every target already understands
without touching a single writer.

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
The first column is what the checkout measured **before** this work; the second is
where each target stands now that S0 (§6) has landed.

| Target | Before | Now | Representation the writer picks |
|---|---|---|---|
| ES6 / TS | runs | runs | `instanceof` |
| Python | runs | runs | `isinstance` |
| C++ | did not build — shim had no `mpark::holds_alternative` | **builds, runs** | `mpark::variant<shared_ptr<A>, …>` |
| Go | did not build — `declared and not used: n` | **builds, runs** | `interface{}` + type switch |
| Kotlin | did not build — `v : EvalV`, a type nothing declares | **valid output** (no toolchain here) | `Any` + `is` / `as` |
| Dart | did not type-check — no `case` template | **valid output** (no toolchain here) | `dynamic` + `is` |
| **Rust** | did not type-check — no `case` template | **builds, runs** | `Rc<dyn Any>` + `RgNarrow` downcast |
| C# | type-checks; not built here | unchanged | `dynamic` parameter + `is` test |
| Swift 6 | type-checks; not built here | unchanged | `Any` parameter + `as!` cast |

`tests/union-narrowing.test.ts` holds this table as executable form: it runs the
fixture on ES6, Python, Go and Rust (a target whose toolchain is absent is skipped)
and asserts the generated representation for Rust, Kotlin and Dart.

**What each target needed** — the S0 changes, because they are also the first
evidence for how each target will carry a `shape`:

- **Rust.** Three pieces, none of which existed. (1) A `union` is written as
  `Rc<dyn std::any::Any>` — its members share no trait, and nothing else can hold
  values of unrelated types. (2) Every class named by a union is marked shared
  (`StaticAnalyzer.analyzeClassSharing`), because only an `Rc<RefCell<T>>` coerces
  into `Rc<dyn Any>`; the coercion then happens implicitly at call, return and
  assignment sites. (3) The narrowing template downcasts back out through a small
  generated trait:

  ```rust
  trait RgNarrow: Sized { fn rg_narrow(v: &Rc<dyn std::any::Any>) -> Option<Self>; }
  impl<T: 'static> RgNarrow for Rc<RefCell<T>> {
      fn rg_narrow(v: &Rc<dyn std::any::Any>) -> Option<Self> {
          v.clone().downcast::<RefCell<T>>().ok()
      }
  }
  ```

  The trait exists so the template can name the member as `Rc<RefCell<T>>` — the
  spelling every other position uses — instead of having to strip the wrapper to
  reach `T`. The narrowed binding is registered as a shared local
  (`walkForSharedLocals`), so field reads through it borrow the cell like any other
  shared value.

  One trap worth recording: `Any` is itself a union of **every** declared class
  (`ng_RangerFlowParser.rgr:4404`), so "members of a union are shared" has to skip
  it by name — without that exclusion every class in every Rust program becomes
  `Rc<RefCell<T>>`. The same exclusion keeps the trait out of programs that declare
  no union of their own. The cost is that a `case` narrowing on an `:Any`-typed
  value is still unsupported on Rust; it was unsupported before as well.

- **Kotlin / Dart.** The union name reached the output as a type. Both writers now
  map a union to the target's top type (`Any`, `dynamic`) — in
  `getObjectTypeString` *and* in `writeTypeDef`, since a parameter, a return type
  and a field each take a different path to the type name. Dart additionally has to
  suppress the `?` on an optional union field: `dynamic` is already nullable and
  `dynamic?` is not valid Dart.

- **Go.** The narrowed binding was declared and never read when an arm only tests
  the type, which Go rejects outright. The template now emits `_ = binding`.

- **C++.** The `variant.hpp` shim installed next to the generated source
  (`bin/variant.hpp`, copied by `installFile`, `ng_LiveCompiler.rgr:210`) declared
  `mpark::variant` and `mpark::get` but not `mpark::holds_alternative`, which is
  exactly what the `case` template emits.

Two findings from the measurement stand unchanged by S0:

- **Where unions work, the lowering is the expensive kind**: `dynamic` (C#),
  `interface{}` (Go), `Any` (Swift/Kotlin), `dyn Any` (Rust), `shared_ptr` per
  alternative (C++). Every alternative is boxed, so a `Number` variant still costs
  an allocation, and every narrowing is a runtime type test. This is why the
  `UnionOfClasses` lowering is a *stage*, not the destination: a shape knows its
  variants are closed, so it can switch on a tag instead of asking the runtime.
- **Nothing here is checked for exhaustiveness.** A `case` chain that forgets an
  arm silently falls through on every one of these targets.

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

### 3.3 Value and reference semantics — implemented (S4, §6.3)

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

**`identical` on a family value.** The `Identity: none` row above is not a statement
about the source, it is one the representation enforces. A value case rides *inside*
the tag on C++ and Rust, so two names cannot share one — and the operator did not even
build there until the writers were taught this shape (`Rc::ptr_eq` has no Rc to take
from an enum; the C++ variant had no `operator==` for the alternative it carries by
value). Both now answer per case:

| case | `identical a b` |
|---|---|
| reference | the same object, on every target |
| value | its content on C++ and Rust; the object on a target that boxes every case |

So `identical` on a **reference** case means the same thing everywhere, and on a
**value** case it asks a question the family does not define — use `Value.equals`,
which is specified for both. What would remove the divergence entirely is rewriting
`identical` and `==` on a family into the generated equality, and that needs an
overload of a language operator to win over the generic one it specializes. It cannot
today: `getOperators` returns candidates in registration order, the language is
registered before the program, and `identical (a:T b:T)` matches everything, so the
generated overload is never reached. Reversing that order was measured and is not a
local change — the compiler stops compiling itself, because `lib/stdlib.rgr` resolves
differently. A specificity rule (a candidate with no type parameter beats one with)
would be the real fix and it belongs to operator resolution, not to shapes.

Default when a case is in no group: `@(value)` for a case with no fields or only
immutable scalar fields, `@(reference)` otherwise — with a warning that asks for the
annotation, because guessing wrong here is a semantic change.

### 3.4 `match` and exhaustiveness — implemented (S2, §6.2)

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
- The scrutinee must be a plain name: each arm lowers to its own narrowing, so an
  expression there would be evaluated once per arm. Bind it to a local first.

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

### 3.6 Methods — shape, group and case

Methods are a **closed-family capability system**, not an open typeclass. The
compiler knows every case of every group, so it can check completeness and
synthesize exhaustive dispatch. No dictionaries, vtables or wrapper objects are
involved when a case value is viewed through a group type.

#### Shape methods — implemented

A method declared in a shape body moves onto the generated ops class:

```ranger
shape Value {
    case Nothing
    case Num { def value:double 0.0 }

    fn describe:string () {
        match self {
            Nothing { return "nothing" }
            Num n   { return ("num " + (to_string n.value)) }
        }
    }
    sfn zero:Value () { return (new Value.Num(0.0)) }
}

(Value.describe v)      ; Value__ops.describe(v)
```

An `fn` becomes an `sfn` whose first parameter is the value it acts on, named
`self`; an `sfn` moves as it is. A shape method may only touch what the whole family
has — in practice nothing — so it almost always starts with a `match`, and that match
is checked for exhaustiveness like any other.

No virtual dispatch is involved and no target needs a method on a union: the call is a
static one. That is also why the call spelling is `Value.describe(v)` rather than
`v.describe()` — a receiver-form call through a union would need per-target dispatch,
which is the same reason `Value.equals(a b)` is spelled that way.

#### Group and case methods — language contract (C0)

Canonical call spelling is statically qualified. Receiver sugar such as
`(value.toBool)` may be added later and must resolve to the same static operation:

```ranger
(Value.Printable.render v)     ; group method
(Value.Num.doubled n)          ; case method (after narrowing)
(Value.describe v)             ; shape method
```

**Method categories**

| Kind | Declared in | Receiver type | Availability |
|---|---|---|---|
| Shape method | shape body | whole family | all views of the shape |
| Group method (concrete) | group body, with body | that group | group and its member cases |
| Group method (required) | group body, **bodyless** | that group | every concrete member must implement |
| Case method | case body | exact case | only after narrowing to that case |

**Bodyless group method** = capability requirement. Exact signature match
(parameter types and return type). Covariant/contravariant matching is deferred.

**`@(override)`** is required when a case replaces a concrete group default.
Implementing a bodyless requirement does not need `override`. A same-named
case-only method does **not** silently satisfy a group requirement unless it is
the implementation selected for that slot (same name + compatible signature on a
member case).

**Method lookup order** (for resolving an unqualified / receiver call later):

```text
exact case → innermost group → parent groups → shape
```

Qualified calls name the declaring view explicitly (`Value.Printable.render`).

**Group nesting.** `group Numeric does Printable` is allowed. A case that
`does Numeric` is a transitive member of `Printable`. For the first release,
groups form **non-overlapping chains**: a case names one leaf group; orthogonal
overlapping groups are deferred. Membership is still recorded as case lists /
bitsets internally so orthogonal groups can be added without replacing the IR.

**Subtyping** (argument matching):

```text
Case <: its groups (direct and ancestors)
Group <: its parent group
Every case and group <: owning shape
```

Widening allocates nothing and preserves identity. A whole-shape value cannot be
passed to a group parameter merely because it *might* contain a member.

**Dispatch**

| Situation | Lowering |
|---|---|
| Concrete group method, not overridden | one static function on `Shape_Group__ops` |
| Required or overridden group method | exhaustive `match` dispatcher on `Shape_Group__ops` calling per-case impls |
| Case method | static function on `Shape_Case__ops` |
| Exact case known at call site | direct call, no dispatch |

**Conformance diagnostics** name the missing or incompatible slot, e.g.

```text
Value.Num implements Value.Printable but does not implement:
    fn render:string ()
```

**Fixture:** `tests/fixtures/shape_group_methods.rgr` is the canonical
cross-target program for this contract.

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

### 3.8 What stage S1 actually shipped

The implemented subset, against the design above:

| Design | S1 |
|---|---|
| `shape Name { … }`, closed by definition | ✅ |
| `case Name { def … }` (and `variant` as a synonym) | ✅ |
| `case Name does Group` (`extends` accepted as a synonym) | ✅ |
| `group Name { def … }` — fields shared by its members | ✅ |
| `Shape.Case` and `Shape.Group` as types | ✅ |
| Construction `(new Shape.Case(…))`, positional or keyword | ✅ (record constructors) |
| Narrowing `case v x:Shape.Case { … }` | ✅ (the existing operator) |
| `match` + exhaustiveness | ✅ S2 |
| `A \| B { … }` arms, group arms, qualified `Shape.Case` arms | ✅ S2 |
| Shape methods (`fn` / `sfn` in shape body) | ✅ ops class |
| Group / case methods, required ops, `@(override)` | ✅ C2–C4 (§7) |
| Nested groups (`group A does B`) | ✅ C2 (non-overlapping chains) |
| `@(value)` / `@(reference)`, generated equality, `identical` | ✅ S4 |
| Immutability of value cases, enforced | ✅ S4 |
| Group field projection through a group-typed value | ✅ C5 — `get_`/`set_` on group ops |
| `==` rewritten to the generated equality | ✖ later — needs operand types during operator matching |
| `Shape.Case(…)` construction without `new` | ✖ sugar |
| Native per-target representations | ✅ S5 on TS/ES6/Python/Kotlin/C#/Dart/Rust/C++/Go/Swift |

### 3.9 Explicitly not in v1

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

The destination per target, and what each stage means there. `UnionOfClasses` — the
S1 lowering — now works on every target in this table except C# and Swift, which were
never broken and were not touched (§2.1).

| Target | Destination | S1 (`UnionOfClasses`) today | S5 (native representation) |
|---|---|---|---|
| **Rust** | `NativeSumType` — **done (S5)** | `Rc<dyn Any>` + `RgNarrow` downcast | ✅ `enum union_Value` with scalar cases inline and reference cases behind `Rc<RefCell<T>>`; `if let` narrowing, no trait object, no downcast |
| **C++** | `CompactTaggedHandle` — **done (S5)** | `mpark::variant<shared_ptr<A>, …>` — one allocation per value | ✅ the variant carries scalar cases **by value**, so a primitive allocates nothing: 0.123 s → 0.0116 s on the value layer |
| **TypeScript** | union type + tag — **done (S5)** | `instanceof` on one class per case — works | ✅ `type union_Value = A\|B\|…` with `readonly __rg_kind` literal discriminant; narrowed by `__rg_kind === "…"`, verified with `tsc --noEmit` |
| **ES6** | `FlatTaggedObject` — **done (S5)** | same as TS, no annotations — works | ✅ each sealable-union case sets `this.__rg_kind = "Case"`; `case` narrows on the tag (not `instanceof`) |
| **C#** | interface — **done (S5)**; `CompactTaggedHandle` later | `dynamic` + `is` | ✅ `public interface union_Value` implemented by each case; a `readonly struct` with tag + scalar + payload is the later optimization |
| **Kotlin** | `BoxedSealedHierarchy` — **done (S5)** | `Any` + `is`/`as` | ✅ `sealed interface union_Value` implemented by each case; no wrapping at any call site |
| **Go** | tagged struct — **done (S5)** | `interface{}` + type switch — **works, runs** | ✅ `type union_Value struct { tag; per-variant pointers }` with `mk_union_Value_<Case>` wrap-at-flow; narrowing on `.tag` |
| **Python** | `FlatTaggedObject` — **done (S5)** | `isinstance` — works, runs | ✅ each sealable-union case sets `self.__rg_kind`; `case` narrows on the tag (not `isinstance`) |
| **Swift 6** | `NativeSumType` — **done (S5)** | `Any` + `as!` — works | ✅ `enum union_Value { case Value_Num(Value_Num) … }` with wrap-at-flow; `if case let` narrowing |
| **Dart** | `BoxedSealedHierarchy` — **done (S5)** | `dynamic` + `is` | ✅ `abstract class union_Value` implemented by each case; Dart 3 `sealed` would add exhaustive `switch` |
| **PHP / Scala / Java7** | `UnionOfClasses` / sealed | works | Scala already emits a `match`; Java 17+ sealed classes if the target moves |

### 5.1 What S0 changed, per target

S0 was the prerequisite round: make `union` + `case` actually work everywhere, since
that is what S1 lowers a shape to. Each fix is small and independently useful, and
each says something about how that target will carry a shape.

**Rust** — from "does not type-check" to "builds and runs". Three pieces:

```rust
// A union type
Rc<dyn std::any::Any>
// Its members, always shared so they coerce into it
Rc<RefCell<EvNumber>>
// The narrowing, through a generated trait
if let Some(n) = <Rc<RefCell<EvNumber>> as RgNarrow>::rg_narrow(&v) { … }
```

The trait is what makes the template writable: it lets the generated code name the
member as `Rc<RefCell<T>>` — the spelling every other position already uses — rather
than having to strip the wrapper to reach `T`. Marking union members shared belongs in
the ownership analysis, not the writer, so the analyzer and the writer keep one answer
between them; the narrowed binding is registered as a shared local so field reads
through it borrow the cell like any other shared value.

This is `UnionOfClasses` on Rust and it is deliberately the *slow* form: one
allocation per member, a runtime type test per arm. S5 replaces the whole thing with
a native `enum`, at which point `dyn Any` and `RgNarrow` disappear from the output.

**Kotlin and Dart** — the union name was reaching the output as a type name nothing
declares. Both now map it to the target's top type. The lesson for S5 is in *where*
the fix had to go: a parameter, a return type and a field each reach the type name by
a different path (`getObjectTypeString` vs `writeTypeDef`), so a shape's type must be
resolved in one place both paths consult, not patched per position.

**Go** — an arm that only tests the type left its binding unread, which Go rejects.
`_ = binding` in the template. Trivial, but it is the kind of defect that only shows
up when the generated code is actually built, which is why S0 ends with a test that
builds and runs on every toolchain present.

**C++** — the installed `variant.hpp` shim was missing `mpark::holds_alternative`.

Where the S0 changes live:

| Change | File |
|---|---|
| Rust / Dart narrowing templates, Go `_ = binding` | `lib/stdlib.rgr` (mirrored in `compiler/stdlib.rgr`) |
| Rust union type, `RgNarrow` trait in the header | `compiler/ng_RangerRustClassWriter.rgr` |
| Union members shared; narrowed binding is a shared local | `compiler/ng_StaticAnalysis.rgr` |
| Kotlin union type | `compiler/ng_RangerKotlinClassWriter.rgr` |
| Dart union type, no `?` on `dynamic` | `compiler/ng_RangerDartClassWriter.rgr` |
| C++ shim | `bin/variant.hpp` (and the copy under `gallery/invaders/`) |
| Fixture and tests | `tests/fixtures/union_case.rgr`, `tests/union-narrowing.test.ts`, `tests/compiler-cpp.test.ts` |

### 5.2 What is still missing per target

| Target | Gap | Blocks |
|---|---|---|
| Rust | `case` on an `:Any`-typed value (the universal union is excluded by name) | nothing in this plan; `Any` was unsupported before too |
| Rust | primitive arms of a union (`case v s:string`) still lower to `RJson::…`, i.e. JSON only | a shape with primitive-typed cases on the S1 lowering |
| Kotlin / Dart | no toolchain in this environment — output is read, not built | build-verifying these two in CI |
| C# | ~~`dynamic` erases the static type~~ | ✅ S5 interface |
| Swift | ~~`Any` erases the static type~~; no Swift toolchain here to build-verify | ✅ S5 native enum (codegen asserted) |
| all | a `case` chain written by hand is still unchecked — only `match` is | nothing; `match` is the checked form |
| all | ~~a shape may not declare methods yet~~ | ✅ shape / group / case methods (ops classes, C0–C4) |
| Rust / C++ / C# / Go / Dart / Swift / TS / ES6 | ~~the family is still the portable union of classes~~ | ✅ S5 native representation on those eight; Python / PHP / Scala / Java7 still on the portable lowering |
| all | ~~every case is a heap class~~ on Rust/C++ scalar `@(value)` cases | ✅ S5 inline; reference cases stay boxed |
| all | `==` on two shape values is the target's `==`, not the generated equality | a later round; `Shape.equals(a b)` is exact today |

## 6. Staging

Each stage is independently shippable and independently testable.

| Stage | Content | Done when |
|---|---|---|
| **S0 — done** | Make `union` + `case` work on every target: Rust and Dart narrowing, the Kotlin/Dart union type, the Go unused binding, the C++ shim (§5.1). Cross-target fixture that runs. | ✅ `tests/union-narrowing.test.ts` runs the fixture on ES6, Python, Go and Rust and asserts the Rust/Kotlin/Dart representation |
| **S1 — done** | `shape` + `case` + `group` parsed, registered, type-checked, lowered to `UnionOfClasses` (§6.1). **No writer knows the word `shape`.** | ✅ `tests/shapes.test.ts`: one shape program compiles on all nine targets and prints the same answer on ES6, Python, Go and Rust |
| **S2 — done** | `match` + exhaustiveness checking (§6.2). Lowering: a chain of `case` narrowings, so no target needs native pattern matching. | ✅ A missing case, a duplicate case and a `_` catch-all are compile errors naming what is wrong; the same `match` program runs identically on ES6, Python, Go and Rust |
| **S3 — done in S1/S2** | `group`, group-typed parameters, group arms in `match`, group fields. | ✅ A group is a union of its members, carries fields its cases inherit, and types a parameter |
| **S4 — done** | `@(value)` / `@(reference)`, the generated equality, the `identical` operator, the immutability rule for value cases (§6.3). | ✅ One program answers `true false false true false true` on ES6, Python, Go, C++ and Rust; mutating a value case and `@(value)` on a non-scalar case are compile errors |
| **S5 — done (core targets)** | Native representations, one target at a time; `UnionOfClasses` stays the fallback (§6.4). **TS/ES6, Python, Kotlin, C#, Dart, Rust, C++, Go, Swift** done. | ✅ TS/ES6/Python `__rg_kind` tag + kind narrowing; Kotlin/C#/Dart interface; Swift native `enum`; Go tagged struct; Rust native `enum`; C++ by-value variant — 10× on the C++ value layer |
| **C0 — done** | Freeze the group/case method language contract (§3.6, §7). Canonical fixture. | ✅ Contract documented; `tests/fixtures/shape_group_methods.rgr` |
| **C1–C4** | Shape-view descriptors, parse group/case methods, conformance, portable static dispatch (§7). | ✅ Group/case methods lower through `Shape_Group__ops` / `Shape_Case__ops` |
| **C5** | Group field projection via generated `get_`/`set_` accessors. | ✅ `r.identityId` on a group type; mutation through reference groups |
| **C6** | Subgroup → parent widen on native enum targets (`widen_to_<Parent>` helper). | ✅ Numeric → Printable on Rust/C++ without a wrapper object |
| **S6** | Inline payload records, tag pinning, whole-program variant elimination, `match` as an expression. | — |

Testing follows the pattern already in the repo: fixtures under `tests/fixtures/`,
per-target codegen assertions in `tests/compiler-*.test.ts`, and a runtime conformance
case under `tests/conformance/` so the same shape program produces the same output on
every target that can be executed in CI. S0 set that pattern for this feature:
`tests/fixtures/union_case.rgr` is compiled by every target test, run wherever a
toolchain exists, and skipped — not silently passed — where one does not.

### 6.1 How S1 lowers a shape

`shape` never reaches a writer. The flow parser rewrites it before class
collection (`DesugarShapes`, `ng_RangerFlowParser.rgr`), so everything downstream
sees ordinary declarations:

```ranger
shape Value {                       ; what you write
    group Ref { def identityId:int 0 }
    case Nothing
    case Num { def value:double 0.0 }
    case Items does Ref { def items:[Value] }
}
```

```ranger
record Value_Nothing { }            ; what the compiler collects
record Value_Num     { def value:double 0.0 }
record Value_Items   { def identityId:int 0  def items:[Value] }
union  Value      ( Value_Nothing Value_Num Value_Items )
union  Value_Ref  ( Value_Items )
```

Four decisions worth recording, each of which cost something to get right:

1. **The lowering builds nodes, not source text.** The first version synthesized
   Ranger source and re-parsed it, the way `buildRecordConstructor` does. It fails
   on fidelity: `getCode()` writes a `double` default of `0.0` back as `0`, and
   `def value:double 0` types the generated constructor's parameter as `int`, so
   `(new Value.Num(2.5))` stopped type-checking. The lowering now reuses the
   *parsed* field nodes (copied, since a node carries per-site analysis state),
   which keeps annotations, collection types and defaults exactly as written.
2. **The shape node becomes the union in place**, and the case classes are
   spliced in at the shape's own position — not appended to the file. A target
   that emits classes in source order and calls `main` at the end of it (Python)
   otherwise had every case class defined after its first use.
3. **A case takes the fields of its group**, so `group` is a real subset with
   shared state and not only a name. The group also becomes a union of its
   members, which is what makes `fn f (r:Value.Ref)` a type the compiler checks.
4. **`shape` is recognised by its whole form**, not its first word: `shape` is an
   ordinary identifier in existing code (`shape.initSphere(1.0)` in the physics
   sources), and matching on the leading vref alone turned every one of those
   calls into a malformed shape declaration. A declaration is three parts — the
   word, a bare name, a block — and nothing else is one.
5. **A shape must be top level.** Spliced into a class body the generated records
   land inside the class and take the compiler down with them, so the walk tracks
   whether it is still at file scope and a shape below it is a named error.

The source spelling `Value.Num` is rewritten to `Value_Num` across the tree in
the same pass — in type positions, in collection element types and in
`(new Value.Num(…))` — so a shape reads as one type with variants while the
compiler sees classes with ordinary names.

**What S1 does not include:** shape methods and `match` (S2 — a body that holds
anything but `case` / `group` is a compile error naming the stage rather than a
silently dropped method), `@(value)` / `@(reference)` (S4), and the native
per-target representations (S5). Construction is `(new Value.Num(2.5))`;
`Value.Num(2.5)` without `new` is sugar that S2 can add.

**Two S0 gaps closed by S1's Rust work.** A `new` in argument position had no
local to take its cell from, so it never coerced into the union's `Rc<dyn Any>`;
and a named value passed to a union parameter was moved rather than cloned,
because the parameter's declared type is a union and the writer's clone rule
looks for an object type. Both are handled at the one place every argument loop
in the Rust writer now starts with.

### 6.2 How S2 lowers a `match`

```ranger
match v {
    Nothing | Text { out = "primitive" }
    Value.Num n    { out = n.value }
    Ref r          { out = r.identityId }
}
```

becomes a chain of the narrowings S0 made work everywhere:

```ranger
case v __match0:Value_Nothing { out = "primitive" }
case v __match1:Value_Text    { out = "primitive" }
case v n:Value_Num            { out = n.value }
case v r:Value_Items          { out = r.identityId }
```

The arms are mutually exclusive, so a chain and a switch mean the same thing —
and a target that has no pattern matching at all needs nothing new to run it.

**The exhaustiveness check is the point.** Coverage is computed from the arms
themselves rather than from the scrutinee's inferred type: an arm names a case
or a group, both of which resolve to a set of case classes through the registry
the shape lowering records. Three things are compile errors:

| Written | Error |
|---|---|
| an unhandled case | `match on Value does not cover Value.Text, Value.Items — every case of a shape must be handled` |
| the same case twice | `` `Value.Num` is covered twice in this match `` |
| a `_` catch-all | `` `match` has no catch-all arm — cover every case of the shape, or narrow with `case` instead `` |

The catch-all is refused on purpose. It makes the check vacuous, and a case
added to the shape later is exactly what it would swallow — the bug class the
construct exists to remove. Partial handling is still available: `case` narrows
one variant and says nothing about the others.

**A match over a group type is complete when it covers that group.** The
scrutinee of `fn f (r:Value.Ref)` can only be a member of `Ref`, so covering
`Ref`'s members is exhaustive even though the shape has more cases. An arm may
also *name* a group, which expands to one narrowing per member.

That rule is read off the **declared** type — the enclosing function's parameter
list, then a `def name:Type` in its body — and not from the arms. The first
version accepted any arm set that happened to equal some group, which quietly
passed `match v { Items a { … } }` for a `v` holding the whole family: three
cases unhandled, no error, exactly the failure the construct is supposed to
catch. When the declared type cannot be read, the full shape is required.

Arm names resolve either qualified (`Value.Num`) or bare (`Num`); a bare name
claimed by two shapes in the same program is an error that asks for the
qualified spelling rather than picking one.

**What S2 does not include:** methods declared on a shape. `match this { … }`
inside a shape body wants a different lowering — one copy of the body per case,
with the arm for that case inlined — which is a separate piece of work from the
statement form. A shape body still accepts only `case` and `group`.

### 6.3 How S4 gives a case its semantics

```ranger
shape Value {
    group Ref@(reference) { def identityId:int 0 }
    case Nothing                              ; no fields  → value
    case Num  { def value:double 0.0 }        ; scalars    → value
    case Items does Ref { def items:[Value] } ; from group → reference
}
```

**Which is which.** An explicit `@(value)` / `@(reference)` on the case wins,
then the same on its group; otherwise a case holding only scalars is a value and
anything else is a reference. That default reproduces `EvalValue`'s hand-written
split exactly — null, undefined, number, string and boolean by content, array,
object, function, Map, Set and element by identity.

**The equality is generated.** Every shape gets a `Shape.equals(a b)` and
`Shape.notEquals(a b)`: field-by-field for a value case, `identical` for a
reference case, false across different cases. The whole thing is Ranger source
the compiler writes and re-parses, so it lowers through the same `case` chain as
everything else and needs nothing per target.

**`identical` is a new operator**, because identity is the one thing `==` cannot
express portably: Kotlin's `==` is structural, Rust's needs a `PartialEq` bound,
C#'s is overloadable. It lowers to `===`, `is`, `identical(…)`,
`Object.ReferenceEquals`, `Rc::ptr_eq` or a pointer comparison per target — and
on Rust the ownership analysis puts a class compared this way into a cell, since
identity of a plain struct is not a question Rust answers.

**Two rules the compiler now enforces:**

| Written | Error |
|---|---|
| `a.value = 3.0` on a value case | `cannot assign to a field of Value.Num: a value case is immutable, because it compares by content — build a new one instead` |
| `@(value)` on a case holding a collection | `case Bad is @(value) but holds a field that is not a scalar — a value case must be comparable by content, so mark it @(reference) or move the field out` |

Immutability is not decoration: it is what makes "two names for one value stay
interchangeable" true on a target that copies the case (S5's C++ handle, Rust's
enum) as well as on one that shares it.

**What S4 does not include:** `==` on shape values still means whatever the
target's `==` means. Rewriting it to the generated equality needs the operand
types, which are known during flow analysis rather than in the lowering pass,
and doing it inside the operator-matching transaction is a change worth its own
round. `Value.equals(a b)` is the spelling until then.

### 6.4 S5: what each target carries the family as

The S1 lowering is portable and slow — every target sees classes and a runtime
type test. S5 replaces that, one target at a time, with the representation the
target actually wants. Two are done.

**TypeScript — already there, now verified.** The writer emits a real union
type and uses it in every signature:

```typescript
type union_Value = Value_Nothing|Value_Num|Value_Text|Value_Items;
type union_Value_Ref = Value_Items;
describe (v : union_Value) : string { if (v instanceof Value_Num) { … } }
```

`instanceof` is what TypeScript narrows on, so each arm is typed as its case
with no cast. The test runs `tsc --noEmit` over the generated file: the check
is not "the string looks right" but "the TypeScript compiler agrees".

**Kotlin, C# and Dart — an interface per union.**

```kotlin
sealed interface union_Value
sealed interface union_Value_Ref
class Value_Num( value : Double ) : union_Value
class Value_Items( identityId : Int, items : MutableList<union_Value> ) : union_Value, union_Value_Ref
fun describe( v : union_Value) : String
```

C# and Dart take the same shape, which is the point:

```csharp
public interface union_Value { }
class Value_Items : union_Value, union_Value_Ref { … }
public String describe( union_Value v )        // was: dynamic v
```

```dart
abstract class union_Value {}
class Value_Items implements union_Value, union_Value_Ref { … }
String describe(union_Value v)                 // was: dynamic v
```

This is the representation with the best cost/benefit ratio of the whole stage:
a class *implements* an interface, so **nothing has to be wrapped, converted or
unwrapped at any call site** — the reason S1's Rust work needed a hook in every
argument loop and this needed none. On C# it also removes `dynamic`, which
compiled but gave up every compile-time check and routed each access through the
DLR. The decision lives once in `RangerGenericClassWriter` (`unionIsSealable`,
`unionInterfacesOf`); each writer only spells its own syntax.

Two rules keep it honest, and they are shared: a union whose members are not all
classes (a union over primitives — `Int` cannot implement anything) keeps the
target's top type, and the compiler's own `Any` union — which contains *every*
class — is never made an interface.

**Rust — a native enum, with scalar cases carried inline.**

```rust
#[derive(Clone)]
pub enum union_Value {
    Value_Nothing(Value_Nothing),          // no fields  -> by value
    Value_Num(Value_Num),                  // scalars    -> by value
    Value_Text(Value_Text),
    Value_Items(Rc<RefCell<Value_Items>>), // a reference case keeps its cell
}
…
if let union_Value::Value_Num(n) = v.clone() { … }
```

The trait object and the downcast are gone: a closed set the compiler can see,
narrowed with `if let`. A member is wrapped into its variant at the sites where a
value flows into the family — argument and local initializer — which is the cost
the `dyn Any` handle avoided and the reason S1 did not start here.

The **inline payload** is what makes it fast. A case that holds only scalars has
nothing that needs a cell, so it rides inside the variant; only a case with a
collection, an object field or an optional keeps its `Rc<RefCell<T>>`. That is
the `@(value)` / `@(reference)` split from S4 doing physical work, and it is
computed the same way: all-scalar fields means by value.

**C++ — the same rule, through the variant it already had.**

```cpp
typedef mpark::variant<Value_Nothing, Value_Num, Value_Text,
                       std::shared_ptr<Value_Items>>  r_union_Value;
```

C++ was already a tagged union — of `shared_ptr`s, so every value cost an
allocation. Putting the scalar cases *in* the variant removes it: construction
is `Value_Num(2.5)` rather than `std::make_shared<Value_Num>(2.5)`, a narrowing
binds the value, and its fields are reached with `.` instead of `->`. Three
places in the writer decide all of that (the type mapping, `writeNewCall`, the
path separator), which is why the change is small.

Measured on the value-layer benchmark (§7.4), same program, same answer:

| target | shape vs the fat class, before S5 | after S5 |
|---|---|---|
| C++ `-O2` | 2.0× | **30×** (0.354 s → 0.0117 s in the same run) |
| Rust `-O` | 3.5× | **6.9×** (0.460 s → 0.0667 s in the same run) |

Absolute times drift on a shared machine, so each figure is the ratio measured
inside one interleaved run. The C++ result is the one the plan predicted from
`sizeof`: the allocation per value was the entire cost, and a case that holds
only scalars has nothing that needs one. Rust improves for the same reason; the
distance left to its no-union ceiling is the string case and the loop itself.

Still ahead (optional later polish):

| Target | Destination | Notes |
|---|---|---|
| Python | `__slots__` on tagged cases | Kind tag is done; slots are a size/layout follow-up. |
| Go | denser tag packing / scalar inline | Tagged struct with per-variant pointers is done. |
| PHP / Scala / Java7 | stay on `UnionOfClasses` / sealed later | Not in the S5 native-sum set; Java 17 sealed would need a retarget. |

**Where S1 lands, per target.** S1 touches no writer, so the S1 result on each target
is exactly the row in §5 — Rust gets `Rc<dyn Any>`, C++ an `mpark::variant`, Kotlin an
`Any`, Go an `interface{}`. Slow, but correct and uniform, and it is what makes S2's
exhaustiveness checking testable everywhere before any target has a native
representation.

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

### 7.4 What the migration is worth, measured

Before migrating 288 call sites it is worth knowing what the migration buys.
`gallery/game_engine/v2/interp/bench/value_layer/` holds four programs that run
the interpreter's hot value pattern — construct, ask the type, read it back,
compare — over two million iterations, in four representations:

| variant | Node | C++ `-O2` | Rust `-O` |
|---|---|---|---|
| today's fat class | 490 ms | 0.240 s | 0.37 s |
| the shape lowering as it stands | **78 ms** (6.3×) | **0.123 s** (2.0×) | **0.105 s** (3.5×) |
| one class per case, dispatched on an int tag | 12.5 ms (39×) | 0.118 s (2.0×) | 0.008 s |
| a compact handle (tag + scalar + payload) | 12.3 ms (40×) | 0.130 s (1.8×) | 0.008 s |

Three readings, and the third is the one that matters:

1. **The shape lowering already wins on the value layer** — 6.3× on Node, 2× on
   C++, 3.5× on Rust — before any native representation exists.
2. **On Node what remains is the dispatch, not the object.** A `kind` field and
   an integer test buys another 6×; the single-object handle buys nothing on top
   of it. This is the plan's `FlatTaggedObject` (§4.3) and it says S5's next JS
   step is a tag, not a handle. On C++ the opposite holds: all four rows still
   allocate through `shared_ptr`, so the tag changes little and the gain waits
   for a handle that is a *value type*.
3. **The value layer is not where the engine spends its time — on Node.**
   Counting `EvalValue` constructions per benchmark case against the built
   engine (`count_allocations.cjs`):

   | case | case time | EvalValues | at the measured ~82 ns each |
   |---|---|---|---|
   | loop | 113 ms | 150 477 | ~12 ms — 11% |
   | fib | 60 ms | 569 | 0% — the small-int pool absorbs it |
   | array | 152 ms | 126 174 | ~10 ms — 7% |
   | object | 59 ms | 76 573 | ~6 ms — 11% |
   | method | 93 ms | 96 433 | ~8 ms — 9% |

   So the honest expectation for the Node build is **5–10% end to end**, not a
   multiple. V8's nursery makes the fat object cheaper than its 33 fields
   suggest, and the small-integer pool already removes the hottest allocations.

That reorders the case for the migration. Its value is **correctness and
clarity** — `Hole` as its own case, one property slot instead of four parallel
maps, a function's core split from its binding, an equality the compiler writes
— with a modest speedup on Node attached. The large speedups live on the native
targets, where an `EvalValue` is 680 bytes with eight collections and no nursery
to hide it; that share has not been measured and is the next thing to measure,
not to assume.

### 7.4b The first migration step, done and measured

The function/element payload is split out (`shape EvalPayload { None | FnCore |
ElemBox }`, `EvalValue.payload`), which is §7.3's core/binding idea applied to
the whole kind-specific part rather than only to functions. Thirteen fields left
the class; the 122 sites in `ComponentEngine.rgr` that read or wrote them go
through accessors on `EvalValue`, so the payload's representation is now the
shape's business alone.

| | before | after |
|---|---|---|
| `sizeof(EvalValue)` on C++ | 680 B | **376 B** (−45%) |
| `sizeof` of the payload slot | — | 24 B (`mpark::variant`) |
| runtime conformance | 1281/1281 | 1281/1281 |
| C++ engine, geometric mean of the 7 workloads | 1.00 | **0.99** |

The size halved and **the speed did not move**: 0.987 geometric mean over
`loop, fib, strcat, array, object, method, regex`, interleaved best-of-5 against
a baseline binary built from the same commit's parent. Six of seven cases came
out 1–5% faster; `fib` came out 7% slower, which is the one workload that is
almost entirely calls, and a call now reads its core through a variant test
instead of a field load.

That is consistent with what the value layer already said (§7.4): the C++ engine
constructs 4.7k–74k `EvalValue`s per case at ~40 ns each, so the construction is
1–5% of a case, and halving the object cannot buy more than that. **On the
native targets the interpreter is not allocation-bound**, and the remaining
migration steps should be taken for the correctness and clarity they buy, not
for a speedup that the measurement says is not there.

What the step did buy, beyond the size: `withThis` copies eleven fields it used
to copy fifteen of, "a value is a function or an element, never both" is
enforced by the type rather than by convention, and three Rust writer faults
that no `record` with a class-typed field could avoid are fixed
(`tests/shapes.test.ts`, `a shape as a field`).

### 7.5 Migration order

1. **✅ E1 — shape beside the class.** `gallery/game_engine/v2/interp/migrate/src/EvValue.rgr`
   defines the target family (`Primitive` / `Reference` / `PropertyCarrier` /
   `Callable` + cases from §3.1). Named `EvValue` so `class EvalValue` keeps
   serving the engine. Smoke fixture: `tests/fixtures/shape_evalvalue_e1.rgr`.
2. **✅ E2 — compatibility surface (primitives).** `EvValue.number` / `.null` /
   `.hole` / `.isNumber` / … mirror the tagged-class entry points;
   `EvValueBridge.fromTagged` converts primitives and Hole from `class EvalValue`.
   `ComponentEngine.rgr` still uses the tagged class. Fixture:
   `tests/fixtures/shape_evalvalue_e2.rgr`.
3. **Convert by kind, not by call site.** `Hole` first (it is a correctness fix, not
   just a cleanup), then the primitives, then `Element`, then the property carriers.
   Each conversion is one `match` replacing one `valueType` chain, and the benchmark
   suite (`gallery/game_engine/v2/interp/bench/`, `npm run test:tsengine`) gates each
   step.
4. **Delete the wrappers** and the `valueType` constants; rename `EvValue` → `EvalValue`.
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
| A per-target fix reaches further than intended | S0 hit this immediately: marking union members shared on Rust also matched the compiler's universal `Any` union, which would have made **every class in every Rust program** `Rc<RefCell<T>>`. Caught by diffing the generated output of a union-free program before and after — now a test (`tests/union-narrowing.test.ts`). Every representation change in S5 needs the same before/after diff on a program that does not use the feature. |

Open questions worth settling before S1:

1. **Nested shape declarations** — is `shape PropertySlot` allowed inside
   `shape EvalValue`, or must it be top level? (Top level in v1 is simpler and loses
   nothing.)
2. **Serialization.** `@serialize(true)` (`ng_RangerSerializeClass.rgr`) needs a rule
   for shapes: `stableTag` in the wire form, or the variant name? Name is more robust
   to reordering, tag is smaller.
3. **`Any` interaction.** `Any` is itself a union of every declared class
   (`ng_RangerFlowParser.rgr:4404`). Do shape cases join it? They should not — a shape
   case is not independently constructible outside its family. S0 already had to
   exclude `Any` by name twice on the Rust target (§5.1); a shape must not add a third
   place where the universal union has to be special-cased, which argues for giving it
   an explicit flag on the class descriptor rather than matching on the name.
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

Before S0 (the baseline this plan was written against):

```bash
node bin/output.js -es6 probe.rgr -d=out -o=probe.js -nodecli   # OK, prints true
node bin/output.js -l=python probe.rgr -d=out -o=probe.py       # OK, prints true
node bin/output.js -l=cpp    probe.rgr -d=out -o=probe.cpp      # OK; g++ fails: no mpark::holds_alternative
node bin/output.js -l=go     probe.rgr -d=out -o=probe.go       # compiles; go build fails: declared and not used
node bin/output.js -l=kotlin probe.rgr -d=out -o=probe.kt       # compiles; emits `v : EvalV`, undeclared
node bin/output.js -l=rust   probe.rgr -d=out -o=probe.rs       # FAILS: Could not match argument types for case
node bin/output.js -l=dart   probe.rgr -d=out -o=probe.dart     # FAILS: same
```

After S0, every one of those seven produces code that compiles, and the four with a
toolchain in this environment run and print `true`:

```bash
node bin/output.js -l=rust probe.rgr -d=out -o=probe.rs
(cd out && rustc --edition 2021 -A warnings probe.rs -o probe && ./probe)   # true
node bin/output.js -l=go   probe.rgr -d=out -o=probe.go
(cd out && go run probe.go)                                                 # true
node bin/output.js -l=cpp  probe.rgr -d=out -o=probe.cpp
(cd out && g++ -std=c++17 probe.cpp -o probe && ./probe)                    # true
```

The same fixture is checked in as `tests/fixtures/union_case.rgr` and driven by
`tests/union-narrowing.test.ts`.

### A.2 Probe 2 — union as a field, array element and return type

Same three classes; a `Box` with `def items:[EvalV]`, `def one@(optional):EvalV`,
`fn add:void (v:EvalV)`, `fn first:EvalV ()` and a `for` loop narrowing each element.
This is the probe that exercises the positions a single `case` in a method body does
not: an element type, an optional field and a return type each reach the type name by
a different path in the writers, which is where the Kotlin and Dart fixes had to go.
Before S0 it failed to type-check on Rust and Dart; now es6, python, go, C++ and Rust
all build and print `ns`.

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

## 7. Closed-family capabilities (group methods)

This stage turns groups into typeclass-like capabilities while keeping the family
closed. See §3.6 for the source-level contract. Implementation order:

| Milestone | Deliverable | Primary files |
|---|---|---|
| **C0** | Language contract + canonical fixture | `PLAN_SHAPES.md`, `tests/fixtures/shape_group_methods.rgr` |
| **C1** | `ShapeViewDesc` (shape / group / case views with allowed-case lists); subtyping remains union-based for portable lowering | `ng_RangerAppClassDesc.rgr`, parser maps |
| **C2** | Parse `fn`/`sfn` in group and case bodies; nested `group A does B`; bodyless = required | `ng_RangerFlowParser.rgr` |
| **C3** | Required-method completeness; exact signature match; `@(override)` on replacing a default | shape finalization inside `expandShape` |
| **C4** | Portable ops lowering: `Shape_Group__ops` dispatchers, `Shape_Case__ops` impls | `attachShapeMethods` / new helpers in the flow parser |
| **C5** | Group field projection (get/set via generated accessors) | `GetProperty` / `WriteVRef` / `cmdAssign` rewrite to ops |
| **C6** | `widen_to_<Parent>` helper for subgroup → parent on native enums | `areEqualTypes` inserts the helper call |

**Definition of done** for the capability system: a group-typed parameter such as
`Ev.Callable` accepts member cases without wrapping, required methods
dispatch through one exhaustive static match, exact-case methods are available
only after narrowing, and identity is preserved across widening.

| Check | Fixture |
|---|---|
| Required + nested groups + case methods | `shape_group_methods.rgr` |
| Callable-style invoke (DoD example) | `shape_group_callable.rgr` |
| Group field projection | `shape_group_fields.rgr` |
| Subgroup → parent widen | `shape_group_parent_widen.rgr` |
| Identity preserved across widen | `shape_group_widen_identity.rgr` |
| Missing impl / bad signature / missing `@(override)` | `shape_group_missing_impl.rgr`, `shape_group_bad_signature.rgr`, `shape_group_override_missing.rgr` |

**EvalValue migration** (§7.5) is unblocked: C0–C6 and the DoD fixtures above
pass. Do not delete the tagged class until call sites convert by kind and the
engine suite stays green.

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
