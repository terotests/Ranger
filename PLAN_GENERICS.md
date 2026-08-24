# Generics — the use cases the editors are waiting on

Notes for whoever implements this. Written from the four visual editors
(`pptx`, `docx_viewer`, `datagrid`, `book`) while planning the shared editing
kernel in [`gallery/PLAN_EDITOR_KERNEL.md`](gallery/PLAN_EDITOR_KERNEL.md),
which is blocked on exactly one language feature.

Everything below names real code. Nothing here is a wish for a feature in the
abstract — each case is a place where a shared module exists or is planned and
cannot hold the thing it needs to hold.

---

## First: three things you already have, so you don't build them twice

**You have sum types.** `shape` is in the parser
(`compiler/ng_RangerFlowParser.rgr:4554`), it desugars into case classes, and it
is used for real in `gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr`
with `group` / `case` / `does`. So when someone says "`JsonValue` and
`PlistValue` are hand-rolled variants with a `kind:string` field" — true, and
that is a `shape` problem, **not** a generics problem. Don't let the two get
merged into one work item.

**You have parameterised types already, built in.** `[T]` and `[K:V]` are
generic containers whose spelling every one of the fourteen writers already
knows how to emit. Generics generalise machinery that exists rather than
introducing a new kind of thing.

**You have a type variable, in one place.** `lib/stdlib.rgr` already writes
`arg@(union):T` and `item@(define):T` in operator signatures (lines 11, 17,
469…). It is not user-declarable, but the notion of `T` is not foreign to the
compiler.

---

## The flagship case: `History<Op>`

`gallery/office/editor/OfficeHistory.rgr` is 157 lines that share *the rules* of
an undo stack while refusing to hold the operations. Its own header says why,
and names the feature:

> Not the operations. `SheetSetCell` is not `SlideMoveShape` is not
> `DocInsertText`, and a base class over them would be a place to put nothing.
> **Ranger has no generics either**, so this deliberately does not try to hold
> the ops themselves — each editor keeps its own array.

What that costs today, measured:

| | lines | uses `OfficeHistory` |
|---|---|---|
| `gallery/pptx/src/PptxEdit.rgr` | 4450 | **no** |
| `gallery/docx_viewer/src/DocxEditController.rgr` | 2027 | yes |
| `gallery/book/src/BookEdit.rgr` | 1448 | **no** |
| `gallery/datagrid/src/SpreadsheetModel.rgr` | — | yes |

Three hand-written undo stacks, and the shared policy that exists is ignored by
two of them. `OfficeHistory`'s header records what that produced last time:
transactions missing so one paste took five undos, `redo` handling one op kind
where `undo` handled five, and a `kind = 5` collision that made undoing a chart
paste run the delete path.

**What it needs from the type system.** Nothing exotic:

```
class History<Op> {
    def ops:[Op]
    fn push:void (op:Op)
    fn undo:Op ()
}
```

A type parameter usable as (1) an array element, (2) a parameter type,
(3) a return type. **No bounds. No constraints. No variance.** If that is all
that ships, this case is solved and the kernel is unblocked.

---

## The second case, and the one that decides your constraint story: `Selection<T>`

Every editor keeps a selection. The book selects **frame ids** (`string`); pptx
selects **shape objects**. A shared `Selection<T>` needs `contains`, which needs
to compare two `T`s — value equality for a string, identity for an object.

That is the first place where "no bounds" stops being obviously enough. Two ways
out, and I would push hard for the second:

1. Require a bound (`T: Equatable`) — which means designing a constraint system,
   on fourteen targets, before the editors get anything.
2. **Pass the comparison in.** `Selection<T>` holds a `sameFn` supplied at
   construction, or the kernel works over ids only and the app maps id → node.
   `OfficeHistory` already takes this shape: it works over *transaction ids*
   rather than over operations.

Option 2 keeps generics bound-free, which on this many backends is worth a great
deal. **Recommendation: ship generics with no constraint system at all, and let
the call sites pass functions.** Add bounds later if something genuinely cannot
be written without them; from the editor side, nothing yet can't.

---

## The rest of the queue, in the order the kernel wants them

| want | who | needs beyond `History<Op>` |
|---|---|---|
| `Store<T>` — id → thing, for assets, styles, images | all four (`BookApi.assetFor`, pptx resolver, docx styles) | generic + `[string:T]` |
| `Selection<T>` | all four | equality, see above |
| `Transaction<Op>` | with History | nothing |
| `Result<T>` / `Maybe<T>` | everywhere | **read the warning below first** |

### The warning about `Maybe<T>`

When generics land, somebody will write `Maybe<T>` within a week. Before they
do, settle what an optional *is*, because today it is not one thing.

`@(optional)` on a string is **a pointer on es6 and a plain `std::string` on
C++**. So this compiles on JavaScript, Go and Python and does not compile on
C++ at all:

```ranger
def body@(optional):string (read_file dir name)
if body { … }        ; becomes `if (body != NULL)` on C++
```

That is `gallery/book/ISSUES.md` #13 — three call sites had it while 220
assertions passed on three targets. A `Maybe<T>` built on top of that
inconsistency inherits it and spreads it into every generic container. Either
fix the representation as part of this work, or state explicitly that
`@(optional)` stays out of generics' path.

---

## What does NOT need generics — please don't scope it in

- **Polymorphic behaviour.** `EVGTextMeasurer` is a concrete base class with a
  conservative default (`isFontAccurate()` returns `false`) that subclasses
  override. That idiom works today and is the right one for measurement,
  hit-testing and anything with an app-specific answer.
- **Toolbars, chrome, commands.** `BookToolbar extends EVGToolbar` and
  `PptxToolbar extends EVGToolbar` already share everything they can.
- **The display list.** `EVGDisplayList` is a data seam and needs no types it
  does not have.

---

## Implementation advice, such as it is

**Monomorphise. Do not ask fourteen writers to learn a type system.**

There are fourteen targets — `es6 go python cpp rust swift java7 kotlin php
csharp scala dart llvm ts`. PHP has no generics; Python erases them; C++ wants
templates; Rust wants bounds it can check; and **LLVM in this repo does manual
retain/release**. Expanding `History<SlideOp>` into a concrete `History_SlideOp`
class *before* the writer runs keeps every backend exactly as it is today.

There is precedent for this in the compiler already: `shape` desugars into case
classes, and `expandShapesInScope` inserts them into the scope it is walking.

**Expect the pain to be in nested type spelling, because it already has been.**
`TARGET_NOTES.md` records three separate defects from parameterised types that
merely *nest*:

- #25 — `[string:[string]]` fell through `smapValueOwnKind` to kind 0, so the
  map held a descriptor with no retain and pointed at a freed array on LLVM.
- #26 — reading an array out of a map bound an owned local with no matching
  retain; the scope-end release freed it out from under the map.
- C#, item 4 — "**A nested collection kept its Ranger spelling.**"
  `[string:[string]]` came out as `Dictionary<String,[string]>`; the C# writer
  needed the recursive conversion the Dart writer had already been given.

Generics multiply that surface. Whatever you do, the type-spelling path has to
be recursive on every writer, and it is worth grepping for the writers that
still are not.

**The first test to write** — the one that would have caught all three of the
above:

1. one generic class instantiated at **two different types** in one program;
2. one instantiated at an **array type** (`History<[string]>`), because nesting
   is the known failure;
3. one instantiated at a **shape** type, since `shape` is the other
   parameterised thing here;
4. compiled and **run** on all fourteen targets, comparing output bytes — the
   yardstick `TARGET_NOTES.md` already uses for the self-host round.

---

## How you will know it worked

Not "the feature compiles". This:

> `gallery/office/editor/OfficeHistory.rgr` holds the operations, and
> `PptxEdit.rgr` and `BookEdit.rgr` delete their own undo stacks.

That diff — three editors getting smaller while one shared file grows by the
array it was always supposed to own — is the acceptance test. Everything in
`gallery/PLAN_EDITOR_KERNEL.md` stages C through E is waiting behind it.

One thing to do *before* any of it, which needs no language work at all: **no
gallery editor suite currently runs in CI** (`.github/workflows/ci.yml` runs
none of `book:test`, `pptx:test`, `docx_viewer:test`, `datagrid:test`,
`office:*:test`). Landing generics into a codebase where cross-module breakage
is caught only when a human remembers to run five suites is the one sequencing
mistake worth avoiding.
