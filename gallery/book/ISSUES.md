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

## 4. `EVGDisplayList.addText` marks italic in `textAlign`

```ranger
fn addText:void (… bold:boolean italic:boolean …) {
    if italic {
        c.textAlign = "italic"      ; not a text alignment
    }
```

`GridView` reads it back that way, so it is a convention rather than a slip —
but it means a caller cannot use `addText` for text that is both italic and
centred, which is most of a page of running text. `BookToEvg` pushes its own
commands for that reason and puts the weight in `fontWeight`, where the
painters already look for it.

## 5. A host that loads faces as bytes must load one as a FAMILY

`UITextRenderer` has two ways in:

```ranger
fn loadFontBytes:boolean (family:string data:buffer)   ; sets hasFont = true
fn addFaceBytes:boolean (data:buffer)                  ; does not
```

`measureWidth` falls back to a 3x5 bitmap step while `hasFont` is false. So a
browser host that hands over every face with `addFaceBytes` gets a renderer
that *draws* correctly — the page's own text atlas rasterizes with the
browser's copy of the font — and *measures* with the bitmap fallback. Nothing
errors. The symptom is that nothing ever wraps: a title runs off the trim while
being drawn in exactly the right typeface.

The first face has to go in through `addFont(family, bytes)`. The serverless
page does that, and its self test now asserts the title wraps, because this is
precisely the class of bug that a screenshot makes look fine.

## 6. A WebGL page needs `@font-face` for the fonts the engine measures with

`evg-webgl.js` rasterizes each text run with the browser's canvas 2D, so the
faces the ENGINE loaded are invisible to it. A page that measures in Cinzel and
never declares Cinzel to the browser draws the whole book in a fallback
sans-serif at Cinzel's widths. Both book pages declare the same four faces the
engine is given, and await `document.fonts.ready` before the first draw.
