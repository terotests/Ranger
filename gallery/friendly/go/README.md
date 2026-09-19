# Go — can Ranger write idiomatic Go?

The same nine programs as [`../src/`](../src/) compiled with `-l=go`, then
`go build` and run. Snapshots are in [`generated/`](generated/).

```bash
bash gallery/friendly/go/compile.sh
```

The Go I wanted is the Go of the standard library: pointer vs value
receivers chosen on purpose, `error` as a return, `interface` satisfied by
methods, slices, and `iota` enums. What Ranger writes is a working Go
program that still reads as a port from another language.

## Verdict

**I could write Ranger that `go build` accepts and that prints the right
answers** for every study. Sharing is natural — a class is `*T`, `def b:Counter a`
is two names for one pointer, and `append` is the slice idiom.

**I could not write idiomatic Go.** There is no `(T, error)` and no `error`
type. `@(optional)` is `*GoNullable` (`value interface{}; has_value bool`),
not `*T` or `(T, bool)`. A `shape` is a tagged struct with a `tag int` and
a pointer per case, not an interface. A Ranger `Enum` is an `int64` constant.
A Ranger `trait` is a mixin: `label` is copied onto `User` and `Bot`; there
is no `type Named interface { Label() string }`. `try`/`throw` is
`panic` + `defer recover()`, which runs, and is the opposite of the Go
proverb. Every file still declares `GoNullable` even when nothing is
optional. `int` is `int64`. Factories are `CreateNew_Point`, not `NewPoint`.

## How to write Ranger today if the Go output matters

| Wanted Go | Write this Ranger | What comes out |
| --- | --- | --- |
| `type Point struct { X, Y int }` | `record Point { def x:int 0 … }` | `type Point struct { x int64 }` + `CreateNew_Point` |
| pointer receiver | a class method | `func (this *PointOps) manhattan(p *Point) int64` |
| two names, one object | `def alias:Counter left` | `alias := left` on `*Counter` |
| `error` return | a `shape` with Ok/Err | tagged `union_*` struct |
| `*string` / `(string, bool)` | `@(optional)` | `*GoNullable` |
| `interface { Label() string }` | `trait Named` + `does` | copied methods, no interface |
| `for _, v := range xs` | `for xs v:int i` | C-style `for i := 0; i < len(xs); i++` |
| `func(int64) int64` | `f:(fn:int (p:int))` | exactly that — this one landed |
| generic `Stack[T]` | `class Stack @params(T)` | `Stack_int` / `Stack_string` |

`try`/`throw` **does** catch on Go (unlike Rust). It is still `panic`/`recover`,
so do not use it if the `.go` will be read as a library. Prefer a shape.

`@(weak)` does nothing — Go has GC. `parent` is `*GoNullable`, not `*TreeNode`.

---

## The studies

### 01 — types, sharing, back-edges

`record Point` is a struct. Methods take `*Point`. `Counter` aliasing is
pointer assignment and `shared 1` prints correctly. `TreeNode.parent` is
`*GoNullable`, assigned with `.value = this; .has_value = true`. A human
writes `Parent *TreeNode`. JSON struct tags appear on every field.

### 02 — optionals and Result

`findName` returns `*GoNullable`. `str2int` is `strconv.ParseInt` boxed in
the same type. `??` on a local becomes an immediately-invoked `func() string`.
`ParseOutcome` is

```go
type union_ParseOutcome struct {
    tag int
    ParseOutcome_Ok  *ParseOutcome_Ok
    ParseOutcome_Err *ParseOutcome_Err
}
```

not `error`. `match` is `if a.tag == …`.

### 03 — enums and match

`Enum Color` is gone at runtime: `colorName` takes `int64` and compares to
`0` / `1`. `shape Message` is the tagged struct above. There is no
`type Color int` + `iota`.

### 04 — traits / interfaces

`does Named` copies `label()` onto `User` and `Bot`. `show` takes `*User`
only. No Go `interface` was generated.

### 05 — iteration

`total(xs []int64)` is a slice — good. The loop is indexed, not `range`.
`applyEach` takes `func(int64) int64` and `main` writes a function literal.
That is the closest study to the idiom.

### 06 — generics

`Stack_int` / `Stack_string`. `peek` returns `*GoNullable`. Assigning the
result copies `.value` and `.has_value` into a fresh box (the documented
“do not alias the optional box” rule). Go 1.18 `Stack[T]` is not emitted.

### 07 — slices and strings

`greet(name string)`, `total(xs []int64)`. No `[]byte` vs `string`
distinction. `firstChar` is a rune-aware helper path when the writer
chooses one; here it is ordinary string slicing through Ranger
`substring`.

### 08 — builder

Copying builder: helpers on `*RequestBuild` taking `*Request`. Mutating
`return this` is a pointer return of `*MutRequest` — that one *is* the
Go fluent style (`func (m *MutRequest) withHost(h string) *MutRequest`).
Closer than Rust’s clone-out.

### 09 — errors

The shape path runs. The `try`/`throw` attempt
([`../rust/attempts/09_throw_panics.rgr`](../rust/attempts/09_throw_panics.rgr))
prints `after_bad negative` via `panic`/`recover`. Working, not idiomatic.

## What I could not write

`(T, error)`, `fmt.Errorf` wrapping, `interface` satisfaction, goroutines
and channels, `context.Context`, struct tags I control, `iota`,
`defer` as RAII, modules (`Import` is compile-time inclusion).

## How the language could improve (for Go)

1. Optional as `*T` or `(T, bool)`, not `GoNullable`.
2. A `Result` / error type that lowers to `(T, error)` on Go and to a
   shape / exception on the other targets.
3. Ranger `Enum` → `type Color int` + `iota`.
4. A field-free `trait` → a Go `interface`.
5. `for xs v:int i` → `for _, v := range xs` when the index is unused.
6. `NewPoint` / exported names (`Point`, `X`) instead of `CreateNew_Point`
   and lowercase fields — or a `public` / export annotation the writer
   already has for API docs.
7. Do not emit `GoNullable` or `strconv` into a file that uses neither.
