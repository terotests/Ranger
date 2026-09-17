---
name: ranger-lang
description: Write or edit Ranger source (`.rgr`) without walking into the compiler errors that cost the most time — a call that needs its own parentheses, two statements on a line, a reserved method name, a parenthesised receiver. Use whenever creating or changing a `.rgr` file, and especially when a Ranger compile fails with an error that points at the wrong place ("function variable not found", "Class X does not have method Y", "Could not match argument types").
---

# Writing Ranger

Ranger is LISP / S-expression based. The rules below are the ones whose error
messages point somewhere other than the mistake, so they cost a debugging cycle
each. `AGENTS.md` has the full list; this is what to check first.

## Compile after every few functions

```bash
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
  node bin/output.js -es6 path/to/File.rgr -d=/tmp -o=File.js -nodecli 2>&1 | grep -A3 FAIL
```

The compiler **exits 0 even when compilation fails** — it prints `[FAIL]` and
`Compilation FAILED` and returns success. Never chain a run onto a build with
`&&`; for suites use `bash scripts/rgr-suite.sh <src> <outdir> <out.js>`, which
reads the log and fails properly.

## The errors that point at the wrong line

**A returned call on a dotted receiver may be written bare.**
`return this.helper()`, `return P.staticHelper()` and `return a.b().c()` all
parse — the parser folds a `(` that touches a dotted name onto that name.
`return (this.helper())` still works. A callee that is **not** dotted, such as a
lambda held in a local, still needs its own parentheses: `return (fn1(3))`, and
the bare form there fails with `Could not match argument types for return`.

**One statement per line.** `{ el.x = 1  return true }` is a parse error.
Alignment inside a one-line `if` body is a trap: `if (a) { x = 1  return true }`
looks tidy and does not parse. A single statement is fine: `{ return a }`.

**Arithmetic on a call result** works when the receiver is dotted:
`(w - (Foo.bar() + 8))` parses, and so does `def v:int (this.h.value() * 5)`.
`(obj.method()).field` still does not — bind the object, then read the field.

**Never start a statement with a parenthesised receiver.** Bind first:
`def recv:T (expr)` then `recv.method()`.

## Reserved method names

Defining one of these on your own class compiles, and then **every call site
fails** with `Class X does not have method …`, because the compiler resolves the
name elsewhere:

```
contains  startsWith  endsWith  trim  first  last
remove    insert      write     read   normalize  toString
has       sqrt
```

Rename: `hasSub`, `beginsWith`, `finishesWith`, `trimWs`, `lowest`, `highest`,
`removeNode`, `insertNode`, `toText`, `fromText`, `collapse`, `asString`,
`mentions`, `squareRoot`.

The list is what has been hit, not what exists: `sqrt` and `has` were found one
compile at a time while writing the Vega chart door and its test.

## Optionals

The annotation goes on the **name**, not the type:

```ranger
fn find@(optional):EVGElement (path:string) { … }   ; correct
def hit@(optional):EVGElement (this.find("0/1"))
if (null? hit) { return }
def el:EVGElement (unwrap hit)
```

A class field read back as a return value types as optional — build the value in
a local and return the local.

An engine field declared `def width:EVGUnit` with no initialiser may still be
null at runtime. Treat such fields as optional when reading them.

## Small things that bite

- Integer division is `idiv`; `/` is real division.
- Elvis is prefix: `(?? value fallback)`.
- Typed array literals need a group: `([] _:T ( a b c ))`.
- No `abs` builtin — inline it.
- Import each file by one consistent path form; mixing bare and relative imports
  of the same file has broken inherited-method resolution.
- Some files in this repository are **CRLF**. A script that rewrites a whole
  file will silently convert it and turn a 12-line change into 800. Check with
  `file` before and after, or edit in place.

## What differs between targets

One source, several languages — and the places they disagree are worth knowing
before a test passes on one and fails on another:

- **`to_double` and surrounding whitespace.** `"10 "` parses as 10 in
  JavaScript and Python and as NOTHING in Go, whose parse is strict. A number
  scanned up to the next character usually carries a trailing space, so
  `(to_double (trim text))` is the portable form. Untrimmed, the same parser
  returned the right answer on two targets and zero on the third.
- Numbers print as they print: `7` in JavaScript and Go, `7.0` in Python. Test
  the VALUE, not the string, unless the string is the point.

When a program has to be right on more than one target, run it on more than
one: `rgr run X.rgr && rgr run X.rgr -l=python && rgr run X.rgr -l=go` takes
seconds and is the only thing that actually checks the claim.

## Public API doc blocks

`doc { public … }` on a method whose parameters or return type are internal
classes fails the build. Either mark those classes public too, or leave the doc
block without `public`.
