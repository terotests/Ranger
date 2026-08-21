# Issues found while building the book engine

Three notes for anyone hitting the same walls. None of them is a book-engine
bug; all three are things the language or the standard operators do that were
surprising enough to cost time.

## 1. `if!` loses field resolution for a local in the block

```ranger
def f:BookFrame (src.copyOf())
if! recto {
    def right:double (p.width - f.x)   ; fine
    f.x = (right - f.w)                ; [FAIL] variable not found w
}
```

`f.x` resolves and `f.w` does not, inside the same macro-expanded block. The
error is reported against `<macro >` rather than the source line, which makes it
hard to find. Rewriting as `if (recto == false) { … }` compiles and behaves.

Worked around in `BookModel.applyMaster`.

## 2. An array passed to a method is a copy on Go

```ranger
fn pushBroken:void (out:[BookBrokenLine] …) {
    push out line        ; appends to a copy on Go — caller sees nothing
}
```

This compiles everywhere and works on JavaScript and Python, and silently
produces zero lines on Go, because a Go slice is passed by value. It cost a
green JavaScript test suite and a completely empty Go one.

The rule that follows: **a helper must return the value and let the caller
push**, never take the array and append to it. `BookFlow.makeBroken` is written
that way for exactly this reason. Fields are fine — `result.lines` is reached
through an object, so it is shared.

Worth knowing that this is the kind of divergence `npm run book:test:go` exists
to catch. It found this one on the first run.

## 3. `create_dir` is not idempotent on the JavaScript target

`create_dir` maps to `fs.mkdirSync(path)` on es6 — no `recursive` — so it throws
`EEXIST` when the directory is already there. On Rust it maps to
`create_dir_all` and on Kotlin to `mkdirs`, both of which are idempotent, so the
same source behaves differently depending on the target.

Worked around in `book_demo.rgr` with a `try { create_dir out } { }`.
