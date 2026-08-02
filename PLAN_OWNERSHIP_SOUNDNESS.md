# PLAN_OWNERSHIP_SOUNDNESS — make the ownership summary true, and the C++ borrow safe

Question: the ownership inference (`compiler/ng_StaticAnalysis.rgr`, from
`analyzeOwnershipAll`) decides `borrowed` / `moved` / `shared` / `unknown` per
parameter, and the C++ writer turns a `borrowed` object parameter into
`const std::shared_ptr<T>&` (PLAN_CODEGEN_OWNERSHIP, finding 1). Is the summary
right, and is the optimization safe?

**Answer: the summary misses most of the escape forms it claims to see, and
the optimization can change what a program does.** Every finding below was
measured against the compiler as of `dff3ff80`, with small programs that this
plan turns into fixtures. The probes live in `tests/fixtures/` after this work.

## Status

| # | Finding | Fix | State |
| --- | --- | --- | --- |
| 1 | `const&` binding can alias mutable storage: same program prints one thing on JS and another on C++, and a member-collection argument is a use-after-free (AddressSanitizer confirms) | call-site copy for an argument that is not a stable name | Done |
| 2 | The escape-via-call marking almost never fires; the one `unknown` it does produce (`blockIdx:int` in the gallery) is a primitive that can never carry ownership | walk `has_call` / `hasFnCall` / `hasNewOper` nodes, filter primitives | Done |
| 3 | `set` / `put` record the key as the escaping value, not the value (`itemAt children 2` where the value is child 3) | index fix | Done |
| 4 | The short form of a member store (`last = p`) is not counted; `push` already resolves a single-name member, `=` does not | resolve a single-name LHS through the context | Done |
| 5 | A value that escapes through a local alias (`def q p` … `this.last = q`) or through `unwrap` is not counted | alias tracking in the walk, unwrap-transparent value names | Done |
| 6 | No interprocedural answer: `k.adopt(p)` where `adopt` stores `p` reads `borrowed` | propagate callee summaries to caller arguments to a fixpoint (the "Phase B" the code comments name) | Done |
| 7 | The state `owned` (kind 1) is never assigned by any code path | keep the name reserved; the docs no longer present it as produced | Done (docs) |
| 8 | A two-step escape through a local collection (`push tmp p` … `this.items = tmp`) is not counted | needs per-local escape sets, not just aliases | Open |
| 9 | The same aliasing hazard exists for the older `const std::string&` / `const std::vector<T>&` value parameters (`cppReadonlyValueParam`) | same call-site rule would close it | Open |
| 10 | A receiver can escape through a method that stores `this` | needs a `this`-escape summary per method | Open |
| 11 | An argument passed to a lambda the function received (`cb(v)`) is not followed — the summary stays `borrowed` even when the lambda stores it | the lambda-call node shape is not one of the three the walk reads; the C++ output stays safe because a lambda takes its arguments by value | Open |
| 12 | A virtual call propagates the summary of the statically resolved method only; an override that stores where the base does not is not met | needs a meet over the override set; the C++ writer already excludes inheriting classes from `const&`, so no C++ output is affected | Open |

---

## Finding 1 — the borrowed `const&` is unsound at an aliasing call site

`borrowed` means: the parameter does not escape the callee. The C++ writer
(`cppBorrowedObjectParam`) reads it as: the parameter may bind by reference.
Those are different claims. Binding by reference is only safe when the
argument expression names storage that stays put for the whole call. Two
programs, both correctly inferred `borrowed`, show the difference.

**The behavior changes.** A method reads its parameter after reassigning the
field that the caller passed:

```lisp
fn use:void (p:Node) {
    this.reset()                      ; reset assigns this.item = fresh
    print ("after reset: " + p.name)
}
...
h.use((unwrap h.item))
```

The C++ output binds the member itself: `h->use(h->item)` against
`use(const std::shared_ptr<Node>& p)`. The callee's own reassignment moves
under the reference.

| Target | Prints |
| --- | --- |
| JavaScript (reference semantics, the language's model) | `after reset: orig` |
| C++ with the `const&` binding | `after reset: fresh` |

**The memory breaks.** A method reads its parameter and pushes one element to
a member list; the caller passes an element of that list:

```lisp
fn use:void (p:Node) {
    push items extra
    print ("after push: " + p.name)
}
...
h.use((itemAt h.items 0))
```

`h->use(h->items.at(0))` binds a reference into the vector's buffer, and the
`push_back` inside the callee reallocates it. Built with
`g++ -std=c++17 -fsanitize=address`:

```text
ERROR: AddressSanitizer: heap-use-after-free ... in Holder::use
```

Before the `const&` change both programs were safe: the by-value
`std::shared_ptr` copy pinned the object the caller saw at call time.

**Change.** The signature keeps `const&`. The call site decides: an argument
that is a stable name — a local, a parameter, `this`, or a fresh temporary
(`new`, a call result) — binds directly and stays free. Any other argument (a
field, a collection element, an `unwrap` of either) is wrapped in a copy,
`std::shared_ptr<T>( … )`, which lives to the end of the call expression and
pins the call-time object. That restores the reference semantics of the
language and the lifetime guarantee, and keeps the optimization free for the
common case.

`cppNeedsCallTempCopy` in `ng_RangerCppClassWriter.rgr`; applied in
`writeFnCall` and `writeNewCall`.

**Result.** Both probe programs now print the same text on JS and on C++, and
the AddressSanitizer run is clean. `jpeg_scaler.rgr` still builds and writes
the same image byte for byte.

---

## Finding 2 — the escape-via-call marking fires on a name collision, not on a call

`walkForEscapes` recognized one call shape: a node whose first child is the
vref `call`. At the time the pass runs, an ordinary `obj.method(args)` sits in
the tree as a `hasFnCall` node, and only a handful of expressions — observed:
a method whose name collides with a system collection method (`get`, `set`,
`add` …), in a `def` initializer — are in the `call` form. Measured before the
fix:

| Program | Marking |
| --- | --- |
| `k.adopt(p)`, `adopt` stores `p` into a field | nothing — `p` reads `borrowed` |
| `Keeper.staticKeep(this p)`, the static stores `p` | nothing |
| `g.setVal(idx 0 5)` at statement level | nothing |
| `def x:int (g.get(idx 0))` | `idx -> unknown` — because the method is named `get` |

The last row is the only `unknown` in all 110 functions of
`jpeg_scaler.rgr` — `blockIdx:int` in `decodeACRefineBlock`, which
PLAN_CODEGEN_OWNERSHIP and the docs presented as the honest limit of the
pass ("255 of 256"). An `int` is copied at every boundary; it can never carry
ownership. The 256th parameter was not a limit, it was two bugs: the wrong
call shape, and a missing primitive filter (`isHeapOwnedParam` guards every
escape branch except this one).

**Change.** The walk now collects arguments from the shapes the rest of the
compiler uses — `node.has_call` (args at child 3), `node.hasFnCall` (args
under child 1), `node.hasNewOper` (args at child 2, against the constructor)
— the same forms `walkForTransitiveWeak` in the same file already reads. Only
heap-owned parameters are considered. A call whose `fnDesc` the flow parser
did not resolve marks the argument unresolved, as before; a resolved call
records a pending edge for finding 6.

---

## Finding 3 — `set` and `put` escape the key

```lisp
set slots "x" p       ; children: [set, slots, "x", p]
```

The walk read `itemAt node.children 2` as the escaping value for `push`,
`set` and `put` alike. For `push coll v` child 2 is the value; for
`set coll k v` and `put coll k v` it is the key. `p` stored into a member map
read `borrowed`.

**Change.** The value is child 3 for `set`/`put` (guarded on arity), child 2
for `push`. `insert coll i v` has the same shape as `set` and was not read at
all; it is included now.

---

## Findings 4 and 5 — stores the walk did not see

All three probes below read `borrowed` before; all are `moved` now.

```lisp
fn shortStore:void (p:Node) {
    last = p                    ; short form of this.last = p  (finding 4)
}
fn aliasStore:void (p:Node) {
    def q:Node p                ; alias                        (finding 5)
    this.last = q
}
fn unwrapStore:void (p:Node) {
    def maybe@(optional):Node p
    this.last = (unwrap maybe)  ; value behind unwrap          (finding 5)
}
```

The single-name resolution that finding 4 needs already existed for
`push`/`set`/`put` targets (`targetOutlivesScope`); the `=` branch simply did
not use it. Finding 5 is a per-function alias table built during the same
walk (`def x y` and `x = y` where `y` resolves to a parameter), and an
`escapeValueName` helper that sees through `unwrap`.

These matter beyond the summary: every parameter wrongly read as `borrowed`
was a candidate for the `const&` binding of finding 1.

---

## Finding 6 — Phase B, the interprocedural summary

The comment in the code said it from the start:

> Passed into another call whose ownership summary is not yet propagated
> -> cannot decide intraprocedurally.

With findings 2–5 fixed the pass holds correct per-function summaries and a
list of pending call edges (caller parameter, callee, argument index). A
fixpoint loop then escalates: an argument passed where the callee's summary
says `moved` or `shared` escapes into that callee (`moved` on one edge,
`shared` past one); passed where the callee says `borrowed` it stays free;
passed where the callee itself is `unknown`, or to a call with no `fnDesc`
(a lambda, a plugin), it is `unknown`. Escalation is monotone, so the loop
terminates; a recursion cycle of read-only functions correctly stays
`borrowed`.

`k.adopt(p)` now reads `moved (call adopt.p)`. A parameter forwarded down a
chain of readers stays `borrowed`, which keeps the `const&` win of
PLAN_CODEGEN_OWNERSHIP finding 1 — that is the point of doing Phase B rather
than marking every call-crossing argument `unknown`.

---

## What stays open

**Finding 8** — a local collection that a parameter is pushed into, where the
collection is then stored, still hides the escape. It needs per-local escape
state, the same lattice one level down. The alias table is the place to grow
it from.

**Finding 9** — `cppReadonlyValueParam` has passed `const std::string&` and
`const std::vector<T>&` since before the ownership work, with the same
aliasing exposure at a call site that passes a member. The
`cppNeedsCallTempCopy` rule extends naturally; it needs its own measurement
first.

**Finding 10** — a method that stores `this` (`observer.subscribe(this)` and
then the subject keeps it) escapes its receiver; no summary covers receivers.

**`owned`** — kind 1 stays a reserved name that no path assigns. If a use
appears (a local the function creates and keeps, for manual-memory targets),
it has a slot; until then the docs do not list it as an output of the pass.

## How to check

```sh
npm run compile                                  # rebuild bin/output.js
npx vitest run tests/compiler-ownership.test.ts  # summary + call-site copy fixtures
npm run test:es6                                 # nothing else regressed
```

The end-to-end check from PLAN_CODEGEN_OWNERSHIP still gates the C++ side:

```sh
node bin/output.js -l=cpp ./gallery/pdf_writer/src/tools/jpeg_scaler.rgr -d=./tmp -o=x.cpp
cd tmp && g++ -std=c++17 -I. x.cpp -o jpeg
./jpeg -width 600 ../gallery/pdf_writer/assets/images/Example.jpg out.jpg
md5sum out.jpg      # must match the previous compiler's output
```

And the two soundness probes must agree with the JavaScript output and pass
AddressSanitizer; they are fixtures under `tests/fixtures/` and asserted in
`tests/compiler-ownership.test.ts`.
