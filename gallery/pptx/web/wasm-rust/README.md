# The PPTX editor, as WebAssembly — through Rust

The same editor as [`/pptx/`](../standalone/), compiled a third way.

    npm run pptx:wasm:rust          # build it
    npm run pptx:wasm:rust:test     # the standalone page's own 98 assertions, in a browser
    npm run pptx:wasm:rust:parity   # does it draw the same picture as the JavaScript build?
    npm run pptx:wasm:rust:serve    # look at it

## What is compiled, and what is written

One source file, three backends:

    gallery/pptx/web/pptx_web.rgr
        ├── -es6   → pptx_web.js   →                        /pptx/
        ├── -l=cpp → pptx_web.cpp  → em++  → pptx_wasm.wasm  /pptx-wasm/
        └── -l=rust → pptx_web.rs  → rustc → pptx_wasm.wasm  here

Everything else is shared. `standalone.mjs` — the whole page: chrome, pointer,
keyboard, the show, printing, saving — is the same file in all three, byte for
byte, and so are the fonts, the shaders, the preset geometry and the sample
deck. Two files here are hand-written and they are the only ones:

* **`bind.rs`** (~510 lines) says which methods a page may call and how values
  cross the WebAssembly boundary.
* **`host.mjs`** (~200 lines) presents the module as the class
  `standalone.mjs` expects, method for method.

A difference between this page and the JavaScript one is therefore a
difference in the **engine**, which is the only thing being compared.

## What it needs

    rustup target add wasm32-unknown-unknown

And nothing else. No SDK to source, no runtime to ship: `rustc` emits a module
with **zero imports**, so `host.mjs` instantiates it with
`WebAssembly.instantiate(bytes, {})` and there is no glue file beside it.

That is the difference from the C++ build, and it is the whole difference.
Emscripten brings a heap manager, an environment guess and ~78 KB of
JavaScript; this brings a `.wasm` and the twenty lines that load it. What it
costs instead is the marshalling, which Emscripten was doing: the boundary is
the C ABI, so strings and byte arrays cross as an ADDRESS and a LENGTH.

    in    the page asks for `rg_alloc(n)`, writes into the module's memory,
          passes (ptr, len), and frees after
    out   the call fills one scratch buffer inside the module and answers its
          LENGTH; the page reads it at `rg_out_ptr()`

The frame does not cross that way. `sceneBinary` is 330 000 integers on a
chart slide, so the module hands back the ADDRESS of its own storage and the
page makes typed-array VIEWS onto WebAssembly memory — nothing is copied in
either direction. Those views are valid until the next call that can
reallocate; the page reads a frame and draws it before asking for another,
which is exactly that discipline.

## What running it found

Compiling is not the same as working, and this build is what proved it. The
Rust backend reached zero rustc errors before any of this existed; every one
of the following was found by opening a deck with it, and every one is fixed
in the compiler:

* **`indexOf` counted bytes** while `strlen`, `charAt` and `substring` counted
  characters. An OOXML parser reading a slide with `Hämeenlinna` in it sliced
  the rest of the document one byte short per accent and dropped every shape
  after the first. Consistent within a target is the whole requirement, and
  Rust was the one target that was not.
* **Five `RefCell` double-borrow panics**, each a place where a borrow was
  held across something that took the same cell: an assignment whose right
  side read the object it was writing, an operator whose operand did, a call
  argument that did, and a tail expression that outlived the local it
  borrowed. rustc cannot see any of them — the borrows are of a `RefCell`,
  not of the struct.
* **An argument evaluated twice.** Two hoisting passes both claimed the same
  argument, so `writeByte(this.readU8())` read two bytes and wrote one. A PNG
  that decodes everywhere else came back as `chunk parse failed`.
* **An out parameter passed as a copy.** `parseSpTreeInto(tree, path,
  slide.shapes, slide.opaque)` filled a temporary that was then dropped, and
  the deck parsed to five empty slides.

The parity test is what holds that line now: 35 decks, 43 slides, 8459
commands compared field for field against the JavaScript engine.

## What it costs

    wasm engine   5765 KB raw   1628 KB gzipped
    js engine     2994 KB raw    668 KB gzipped
    ratio                         2.4x gzipped

The engine is the largest single file on the page either way; the fonts are
858 KB and 405 KB beside it, so the page grows by rather less than the ratio
suggests. On speed the two are close enough that a loaded machine decides the
answer — which is the finding, not a disappointment: what a WASM build has to
win here is the 10 ms of layout, and the 62 ms that used to go into handing
the frame over was fixed by replacing the bridge, with no port at all.
