# PLAN_TARGET_IDIOMS — the idioms each target was still missing

> **Status: the native-enum work is done on every target with an enum; the
> per-target items below are done except the two named at the end.** Gated by
> `gallery/friendly/compile.sh` (twelve studies, eight runnable targets, the
> cross-target output diff clean), the eight self-host checks, and `npm test`.

Three separate readings of the generated output — one per target — kept finding
the same shapes. They are collected here because the decisions behind them are
target-neutral even when the spelling is not.

## A Ranger `Enum` is that target's enum

A Ranger `Enum` reached the output as a bare integer on every target but Rust
and C++, so `Color.Green` arrived as `1` and `colorName` took an `int`. The
name was gone, which is the loudest "this was generated" tell in the gallery
studies.

The question of whether an enum *can* be the native form is the same one Rust
and C++ already asked, so it stays in one place — `compiler/EnumAnalysis.rgr`,
`class EnumNativeAnalysis`. It is conservative: the native form is emitted only
when every use in the program is one a native enum can carry (a declaration, an
`Enum.Member` reference, `==` / `!=` against the same enum, an assignment, a
`switch` / `case`, a `return`), and the integer lowering stays for the rest.
`-strict-ownership` prints the verdict and its reason the way the sharing
verdicts do.

Each writer holds one instance and spells the declaration its own way:

| Target | Declaration | Member |
| --- | --- | --- |
| C# | `public enum Color : int { Red = 0, … }` | `Color.Red` |
| Java | `public enum Color { Red, … }`, its own file | `Color.Red` |
| Kotlin | `enum class Color { Red, … }` | `Color.Red` |
| Swift | `enum Color : Int { case Red = 0, … }` | `Color.Red` |
| Dart | `enum Color { Red, … }` | `Color.Red` |
| Scala | `sealed abstract class Color(val value : Int)` + `case object`s | `Color.Red` |
| PHP | `enum Color : int { case Red = 0; … }` | `Color::Red` |
| Python | `class Color(IntEnum): Red = 0` | `Color.Red` |
| Go | `type Color int64` + a `const` block | `ColorRed` |
| TypeScript | `export enum Color { Red = 0, … }` | `Color.Red` |

Two things this pass found, both from the self-host build rather than from the
studies.

**A member name can be a keyword of the target.** `RangerAnnType` has a member
called `None`, and `None = 0` is a Python `SyntaxError`. Every member name goes
through `ctx.transformWord` now — the per-target reserved-word map Lang.rgr
already carries — at the declaration and at every reference.

**Kotlin's `when` over an enum has to be exhaustive**, and a Ranger `switch`
need not have a `default`. `else` also has to come last, while a Ranger
`default` may sit anywhere in the case list; the template form could do
neither. The whole statement is written by the writer now
(`RangerKotlinClassWriter.ktWriteSwitch`): the cases in source order, then the
default — or an empty `else` when there is none.

Where a target has no enum, nothing changed. Plain JavaScript keeps the
integer: a frozen object in its place is a real runtime value with its own
identity, which is a change of program rather than of spelling.

## `??` is that target's own operator

`(?? a b)` expanded to the macro ternary `(? (!null? a) (unwrap a) b)` on every
target. Seven of them spell it in one token: `??` on JavaScript, TypeScript,
C#, Swift, Dart and PHP, `?:` on Kotlin, and `.getOrElse(…)` on Scala, where an
optional is an `Option[T]` rather than a nullable reference. Java, Go, Python,
C++ and Rust keep the macro.

## Python carries types now

The Python output used to have no type annotations at all, so a reader of it
had less to go on than a reader of the Ranger source. Every signature the
writer can name is annotated: parameters, returns, `__init__` as `-> None`.
`from __future__ import annotations` goes in ahead of the imports, which makes
every annotation a lazy string — a class named before its own `class` statement
is then not a `NameError`, and the file keeps compiling in the order the writer
emits it. A type the writer cannot name — a lambda, a generic parameter, a
system class with no Python name — is left off rather than guessed.

A behaviour-only trait is a `typing.Protocol`. A Protocol is structural, so the
classes carrying the mixin copies satisfy it without naming it, which is what
the Ranger `does` already means and what makes the name usable in an
annotation.

## PHP declares its properties

`var $x;` told a reader nothing the Ranger source did not already say better.
Properties are `public int $x = 0;` now. The declaration carries its own
initializer, because a typed property PHP cannot see a value for throws on the
first read and the constructor is free to read one field while setting another;
a non-nullable *object* type has no literal PHP accepts there, so those stay
untyped rather than becoming a runtime error. `declare(strict_types=1)` is not
written, so the coercions the untyped form allowed still happen at the boundary
instead of becoming a `TypeError`.

## The `for` loop, on the last two targets

`compiler/ForLoopAnalysis.rgr` answers "can this be the target's own loop over
the collection" for nine writers already. Scala (`for (v <- xs)`) and PHP
(`foreach ($xs as $v)`) join them, under the same two conditions as everywhere
else: the body must not read the index and must not touch any name the
collection rests on.

## Ownership: a local that is stored for the last time is moved, not shared

`analyzeClassSharing` marked a class shared — `Rc<RefCell<T>>` on Rust — as
soon as a named value was pushed into any object graph. The rule's own comment
said why: *a named value stored into an object graph is held there while the
name (or another alias of the object) stays reachable*. In the shape that
motivated it the name does **not** stay reachable:

```
fn add:void (name:string cents:int qty:int) {
    def line (new CartLine)
    line.name = name
    push lines line
}
```

`StaticAnalyzer.storeIsLocalMove` decides that case: the stored operand is a
plain local (not a path, not a field, not a captured or class variable), it has
exactly one `def` in this body, that `def` sits in the same block as the store
so the object is made fresh on every path that reaches it, nothing else aliases
the name, and no use of the name follows the end of the store expression. Then
the store is a move and the class stays a value. `landing/examples/Cart.rgr`
went from `Vec<Rc<RefCell<CartLine>>>` to `Vec<CartLine>`.

The Rust `for` gained the matching read: a body that does nothing with the
element but read `Copy` fields off it binds `&T` — `for line in
self.lines.iter()` — instead of cloning every element. Every other shape
(writing a field, calling a method, handing the value on, reading a `String` or
a collection field out of it) either needs `&mut` or moves out of the borrow,
so those keep the clone.

## Not done

- **Clone elision at a store.** `self.lines.push(line.clone())` still clones a
  local that is dead after the push. The fact is already computed
  (`storeIsLocalMove`); acting on it means a per-node liveness channel into the
  Rust operand writer, which decides `.clone()` at twenty-nine separate sites.
- **Dart `record` as a named-parameter constructor.** `Point({this.xpos = 0})`
  with `Point(xpos: 3)` at the call site is the idiom, and the two halves have
  to change together or every construction breaks. There is no `dart` on this
  machine to check that they did, and an unverifiable change to construction is
  worse than plain-but-correct output.
- **Python `@dataclass`.** A Ranger field default is an arbitrary expression,
  and a dataclass default with one is shared between instances, where the
  `__init__` this writer emits assigns it per instance. The two are not the
  same program.

## How to check

```
npm run compile
bash gallery/friendly/compile.sh
npm run selfhost:check:cpp      # and :go :python :csharp :kotlin :java :dart
bash scripts/rust-selfhost-check.sh
npm test
```
