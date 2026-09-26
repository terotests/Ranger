# Generics — what the editors asked for, and what shipped

This was written as notes for whoever implemented generics, from the four
visual editors while planning the shared editing kernel in
[`gallery/PLAN_EDITOR_KERNEL.md`](../../gallery/PLAN_EDITOR_KERNEL.md), which was
blocked on exactly one language feature.

**It shipped.** `class History @params(Op)` takes a type parameter and
`History@(int)` names its argument. What follows is kept for the reasoning
rather than the request: the three sections that are still live are
[the `Maybe<T>` warning](#the-warning-about-maybet-still-open), which is
unfixed and now more urgent, and the two notes on scope.

**Native generics (September 2026).** Monomorphisation is still what the type
checker sees, but a target with generics of its own now gets one class per
template when the body allows it. After the program is walked,
`RangerFlowParser.checkNativeGenerics` expands each instantiated template once
more with every parameter bound to an empty placeholder class
(`__tp_History_Op`), its generic form. A body that type checks against a class
with no fields and no methods, and applies no operator outside a short opaque
list (push, itemAt, set, get, unwrap, return, ...) to a parameter value, is
native. The errors of a failed check are taken back. Writers then skip the
copies, write the generic form as `template <class Op> class History`,
`class History<Op>`, `type History[Op any] struct`, `class History(Generic[Op])`
and so on, and spell each instance `History<int>`.

| Target | Native | Falls back to copies when |
|---|---|---|
| C++, Java, Kotlin, Scala, Dart, TypeScript/JS, Python, PHP | yes | the body is not opaque; C++ also when an argument is `boolean` or `charbuffer` |
| C# | yes | also when the class has an optional `T` |
| Go | yes | also when the class extends, or reads a `[K:T]` map (the helper is typed after the map) |
| Rust | yes | also when the class extends, is extended or `does` a trait, a method needs `__self_rc`, or the template is named like a prelude type (`Box`, `Vec`, …). Each copy's ownership (`&str` vs `String`, `&[T]` vs `Vec<T>`) is made to agree with the form by `StaticAnalyzer.settleRustNativeGenerics`: a parameter typed by the type parameter is taken by value |
| Swift, LLVM | no | always: Swift could not be verified here; LLVM has no generics |

A template with a static method or a singleton keeps its copies everywhere.
`-no-native-generics` turns it off; `-generics-report` prints each decision.
Tests: `tests/compiler-native-generics.test.ts`.

---

## What was asked for, and what arrived

| asked for | shipped |
|---|---|
| a type parameter as array element, parameter type and return type | yes |
| **no bounds, no constraints, no variance** | yes — "the case that would have forced a constraint system is `Selection`'s `contains`, and passing the comparison in costs one field where designing bounds costs fourteen backends" |
| monomorphise before any writer runs, so no backend changes | yes — `History@(int)` becomes `History_int`, `History@([string])` becomes `History_arr_string`, and none of the fourteen targets was touched |
| the acceptance test: `OfficeHistory` holds the ops and the editors delete their own stacks | yes — `OfficeHistory@(DocEditOp)`, `@(SpreadsheetUndoOp)`, `@(BookDocument)`, `@(PptxEditSnapshot)`, and `PptxEdit` gave up its history array and cursor |

Three things had to be fixed underneath that this document did not predict, and
one of them is the nested-type trap it *did*: `RangerArgMatch.add` answered true
for any type-parameter name longer than one character without recording it; a
type argument that is itself a collection may not stay a type NAME, "or every
writer spells a class called `[string]`"; and templates needed a registration
pass of their own, because a class variable of a generic type collected before
the file declaring it made **import order** decide whether a program compiled —
four docx suites built and two did not, from the same source.

## Still open

### The warning about `Maybe<T>` (still open)

The prediction was: *"when generics land, somebody will write `Maybe<T>` within
a week. Before they do, settle what an optional **is**, because today it is not
one thing."*

Nothing has changed, and it is now easier to hit. `@(optional)` on a string is
**a pointer on es6 and a plain `std::string` on C++**, so this is accepted by
the Ranger compiler — `[OK] Compilation successful!` — and the C++ it emits
does not compile:

```ranger
class OptProbe {
    sfn main:void () {
        def body@(optional):string (read_file "." "package.json")
        if body {
            print "read something"
        }
    }
}
```

```
opt.cpp:178:13: error: no match for 'operator!=' (operand types are
'std::string' {aka 'std::__cxx11::basic_string<char>'} and 'long int')
```

Nine errors from five lines, and the compiler reported success. That is
`gallery/book/ISSUES.md` #13 reduced to a repro — three call sites in the book
had it while 220 assertions passed on JavaScript, Go and Python.

A `Maybe<T>` built on top of that representation inherits the inconsistency and
spreads it into every generic container. Either fix the representation, or
state explicitly that `@(optional)` stays out of generics' path.

### The cases after `History<Op>`

`Selection<T>` and `Store<T>` are still hand-rolled or absent. They are Stage D
of the kernel plan and are ordinary work now rather than blocked work — with the
one design note that survives: **pass the comparison in**, do not reach for a
bound. Nothing in four editors has yet needed one.

---

## Two notes on scope that are still worth keeping

**`shape` is sum types, and it is not generics.** It is in the parser
(`compiler/RangerFlowParser.rgr:4554`), desugars into case classes, and is
used for real in `gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr`. So
"`JsonValue` and `PlistValue` are hand-rolled variants with a `kind:string`
field" is a `shape` problem. Don't let the two merge into one work item.

**What does not need generics.** Polymorphic behaviour — `EVGTextMeasurer` is a
concrete base class with a conservative default (`isFontAccurate()` returns
`false`) that subclasses override, and that idiom is right for measurement and
hit-testing. Toolbars and chrome already share by subclassing. And the display
list needs no types it does not have: `EVGDisplayList` is a data seam, which is
why `PptxFromEvg` could make it an output format for slides without either side
knowing about the other.
