# The Rust target cannot build the interpreter yet

Recorded 2026-08-03 against `origin/master` (`4586fc70`), rustc 1.94.1.

`build.sh` defaults to `cpp`. `TARGET=rust bash build.sh` gets as far as
generating Rust and then fails in `rustc`. This note records how far it gets and
what blocks it, so the next attempt starts from evidence rather than from
scratch.

## Where it stands

| Stage | Result |
|---|---|
| Ranger → Rust codegen | **passes** — 32111 lines of Rust, no compiler errors |
| `rustc -O` on that output | **fails** — 676 errors |

The Ranger side is clean only after the operator additions committed alongside
this note: `M_PI`, `tan`, `to_lowercase`, `to_uppercase` and `file_mtime` had no
`rust` template at all, and their absence produced 15 type-inference failures
(an operator with no template resolves to no type, and every binding that reads
it inherits that). Those are fixed. What follows is what remains.

## What blocks it

Counted by distinct rustc message, most frequent first:

| n | Error | What it is |
|---|---|---|
| 416 | `mismatched types` | broad: owned vs borrowed, `T` vs `Rc<RefCell<T>>`, `i64` vs `usize` |
| 35 | ``expected expression, found `let` statement`` | a temp is emitted *into* a binding: `let mut idTok: Rc<RefCell<Token>> = let _tmp_1 = …;` |
| 27 | ``no method named `has` found for `&mut Rc<RefCell<EvalContext>>` `` | method calls not routed through the `RefCell` borrow |
| 17 | ``no field `isHole` on type `Rc<RefCell<EvalValue>>` `` | field reads not routed through the borrow |
| 16 | ``cannot find value `context` in this scope`` | a captured field referenced as a bare local |
| 13 | ``expected type, found `=` `` | the declared type is dropped: `let mut savedLabels :  = …` |
| 11 | ``no method named `unwrap` found for `Vec<String>` `` | a non-optional treated as `Option` |

The 13 + 11 pair is one bug seen twice. For

```ranger
def savedctorLabels:[string] this.activeLabels
```

the backend emits

```rust
let mut savedctorLabels :  = self.activeLabels.unwrap().clone();
```

— the declared `[string]` is lost *and* an `.unwrap()` is added to a field that
is not optional. A local declared with an explicit type and initialised from a
field is a common enough shape that this alone accounts for a fifth of the
non-`mismatched-types` errors.

## Scale check

The interpreter is not merely large; the target does not yet handle programs of
this shape at all. The TypeScript parser — a smaller, simpler program in the same
repository — fails the same way:

```
npm run tsparser:compile:rust     # Ranger -> Rust: OK
rustc -O gallery/ts_parser/bin/ts_parser_main.rs
                                  # 37 errors, same categories
```

Meanwhile `npm run test:rust` and `codegen-rust.test.ts` both pass (67 checks).
So the Rust backend is real and works on the programs it is tested against; the
gap is between those programs and one of this size.

## Suggested order of attack

1. The empty-type / spurious-`unwrap` bug on `def x:T <field>` — one shape,
   24 errors, and it is the only one whose root cause is already pinned down.
2. The `let`-as-expression temp (35) — a statement emitted where an expression
   was required, so probably one emit path.
3. Route field reads and method calls on a shared class through the `RefCell`
   borrow (44).

That is roughly 100 of 676. The remaining `mismatched types` bulk needs a
narrower repro than "the interpreter" — the TS parser at 37 errors is the better
harness for it.
