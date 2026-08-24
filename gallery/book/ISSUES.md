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

## 7. The committed `evg_pdf_tool.js` predates its own `-bleed` flag

`gallery/pdf_writer/src/tools/evg_pdf_tool.rgr` takes `-bleed PT` and the
renderer does the right thing with it — MediaBox grows to the trim plus bleed
on every side, and a TrimBox marks the finished page. The build committed in
`gallery/pdf_writer/bin/` contains no reference to bleed at all, so running the
committed tool with `-bleed` silently produces a PDF at trim size.

That is the worst shape a stale build can take: the flag is accepted, nothing
warns, and the file is wrong in a way that is invisible until a press trims
into the picture. `npm run book:print` recompiles the tool before using it, the
way `book:pdf` already did.

## 8. A dropped picture's `blob:` URL must not be given a base

`loadImages` in `gallery/evg/gl/evg-webgl.js` sets `img.src = base + src`, and
the book page passes `base: "./"` because the sample's photographs are named by
document-relative paths. An album's photographs are not: they arrive from a
file input or a drop, so their URL is `blob:http://…`, already absolute, and
prefixing it produces `./blob:http://…` — a URL that loads nothing.

Nothing errors. `Image.onerror` resolves the promise, the display list still
carries the picture, the page still renders, and every page comes out blank
paper with the captions on it. The standalone page now applies the base itself
and passes `base: ""`, and the self test asserts that every album picture has a
TEXTURE rather than that it has a draw command — which is the distinction the
bug lives in.

## 9. A method named for a Go keyword compiles, then does not

`BookAlbumImport` had a method called `select`. The es6 build was fine, the
tests passed, and the Go build produced a file the Go toolchain could not parse
at all — `syntax error: unexpected keyword select`, dozens of them, from one
method name. The es6 target will never tell you: only `npm run book:test:go`
does, which is the argument for running it on every change rather than at the
end.

`indexOfFrom` is the same class of trap from the other side: a static method
whose name starts with an existing global operator is swallowed by it, and the
class then does not have the method at all.

## 10. Two decimal places is a kilometre of latitude

`BookRenderer.num` rounds to two decimals, which is exactly right for a
typographic point and wrong by up to a kilometre for a coordinate. Writing a
photo index with it and reading it back moved every photograph, and a radius
search then answered differently for no visible reason — the file looked
plausible either way, because `61.51` is a perfectly ordinary-looking latitude.

`PhotoIndex.coord` writes six decimals (about a tenth of a metre) and the round
trip is asserted to a metre. The general lesson is that a number formatter
carries a precision assumption from wherever it was written, and moving one to
a new domain moves that assumption with it.

## 11. An empty field is not zero, and 0,0 is a real place

Both photo collectors have to say "this picture has no position", and the
tempting encoding is 0,0. That is a real coordinate in the Gulf of Guinea, and
a search for photographs within 30 km of it would return every untagged picture
in the library.

`PhotoRecord.located` is a separate flag, the index format omits `lat`/`lon`
rather than writing zeros, both halves must be present for either to be
believed, and the collector's self test asserts that an empty `mdls` field
becomes absent rather than zero.

## 12. A self test that reports only at the end cannot say where it stopped

The serverless page runs its checks under a virtual-time budget. When the photo
finder's checks were added the run started, occasionally, to end before the
last of them — and because the page wrote its results in one go at the end, the
DOM was empty and the smoke runner said "the page ran no self test", which is
what it also says when the script fails to load. Two very different faults, one
message.

The page now writes its results after every check and drops a `(running)`
marker when it finishes; the runner fails a run that still says `(running)` and
reports how far it got. The budget was raised as well, but that is the smaller
half of the fix: the diagnosis was.

## 13. `if optional` does not compile on C++, and only C++ says so

Three places read a file as `def body@(optional):string (read_file dir name)`
and then tested it with `if body`. An optional string is a POINTER on es6 and
a plain `std::string` on C++, so that becomes `if (body != NULL)` there — which
is not merely wrong, it does not compile. The es6, Go and Python builds were
all happy; the defect surfaced the first time the book was compiled for the
native host, in code that had been passing 220 assertions on three targets.

All three now read `(?? (read_file dir name) "")` and check the length, which
is what the schema editor already did. An empty file and a missing one become
the same answer, which for a plist or an index is correct: neither is parseable.

## 14. Passing `this` out of a constructor throws on C++ only

`BookSdlConfig`'s constructor called a helper with `this` to fill in the default
font list. On C++ an object is not yet owned by its `shared_ptr` while its
constructor runs, so `shared_from_this()` throws `std::bad_weak_ptr` — and the
native host died before printing a single line, on its first run, from a line
that is correct on every other target.

The fields are filled in the constructor itself now. The general rule: a
constructor may not hand `this` to anything.

## 15. The JPEG decoder narrates, which nobody noticed until a terminal saw it

`JPEGDecoder` printed twenty-five lines per photograph — every marker, every
Huffman table, every tenth row of MCUs. In a browser that goes to a console
nobody has open, and in the PDF tools it is arguably the point. In a native
window it goes to the user's terminal, so a book of forty pictures opens behind
a thousand lines of scrolling.

There is now a `quiet` flag, off by default so every existing caller is
unchanged, and the two places that decode a picture *as a side effect of
drawing something* — `EVGImageDecode` and `GridImages` — turn it on. It has to
be propagated into `HuffmanDecoder` at decode time rather than in the
constructor, because a caller can only set it after constructing the decoder.

## 16. Seven faces loaded, none of them bound: the whole book drawn in a bitmap font

The native host loaded its faces with `tr.fm.loadFont(path)` — the FontManager
directly. That loads the file, returns true, and logs `Loaded font 'Cinzel'
(Regular)`, so all seven faces reported success. What it does not do is any of
the things `UITextRenderer.loadFont(family, path)` does: bind the face to the
rasterizer, install the TrueType measurer, or set `hasFont`. `applyFace`
returns immediately while `hasFont` is false, so `RasterText` kept its built-in
bitmap font and **every glyph in the window was drawn in it** — while the
layout had been measured with the real metrics, so the line breaks were right
and the letterforms were not.

It looks like a retro style choice, not a defect. And the host's own guard —
"measuring with N face(s) and drawing with M" — passed cleanly, because both
counters were counting files that loaded rather than asking whether anything
was bound. A check that counts the wrong noun is worse than no check: it
reports the failure as fine.

The first face now goes through `tr.loadFont`, the rest through `tr.addFace`
(which is what joins the bold, italic and per-codepoint fallback pool), and the
host asks `tr.hasFont` and prints the bound face on every run. `EvgGlPainter`
has an early return when the wanted face is already the current one, which was
harmless before only by accident: with nothing bound, "already current" meant
"still the bitmap font".

## 17. Every shape drawn as one filled path, so 71 of the 187 were wrong

`OfficeShapeCatalog.pathFor` flattened all of a preset's paths into a single
`M … L … Z` run and handed it back as one filled path. That is not what a
preset is: each of its paths states its own fill and stroke, and 69 of the 187
carry geometry that a fill cannot draw.

* **`chartPlus`, `chartStar`, `chartX`** are a filled square *plus* a cross of
  `fill none` runs. Merged, the square fills and swallows the cross — three
  solid black squares.
* **The 23 callouts and the 12 action buttons** are the same shape: a filled
  body with an unfilled leader line or glyph over it. Every leader line and
  every button glyph was lost; the twelve action buttons were twelve squares.
* **`line`, `lineInv` and the nine connectors** say `fill norm` in the preset
  file but are runs of two or three points. Filling one has no area at all, so
  they rendered as nothing.

The geometry is now split per ring: a ring is on the fill side when its path is
filled and it has three points or more, and on the stroke side when it would
otherwise be invisible. `pathFor` answers the first, the new `strokePathFor`
the second, and `isStrokeOnly` says when a caller that can draw only one of
them must stroke. A stroked run is not closed, because closing a cross draws a
diagonal through it.

**What found it was looking at the shapes.** The unit test asserted that a
preset "becomes path data" and that the data "is a path" — both true of a
solid black square standing in for a plus sign. `npm run office:shapes:sheet`
draws all 187 onto one SVG for exactly this reason, and the three squares were
obvious the moment the sheet existed. There are assertions for it now, written
after the fact from what the picture showed.

### The same picture, looked at again, found four more

Fixing the fill/stroke split was not the end of it. A second reading of the
sheet — this time by the person who asked for the shapes — turned up a house
with no roof, a smiley with no eyes, braces drawn as beige blocks, and a pie
wedge whose curve was a run of flats. All four were real, and three of them
were one bug.

**Shading was thrown away.** A preset's path states `norm`, `darken`,
`darkenLess`, `lighten` or `lightenLess`, and 34 of them use a modifier to
shade a bevel, a cube's third face, a cylinder's lid, a smiley's eyes and the
glyph on every one of the twelve action buttons. The catalogue merged all of it
into one fill, so the roof of the house was painted in the same colour as the
wall — present, and invisible. `partsFor` now returns the shape's pieces, each
with its shade and a `shadeFactor` to apply it by; `pathFor` and
`strokePathFor` are two views of that list. The parts also come back **fills
first, then lines**, because the file lists `chartPlus`'s cross *before* the
square it sits in and drawing them in file order hides the cross under the box.

**Seven shapes are stroke-first, and the geometry cannot say so.** `arc` and
the six braces and brackets each supply a closed `fill norm` body — the pie
sector under an arc, the block behind a brace — that nobody wants. Which of
the two you get is decided by the shape's default *style*, which is not in the
geometry file, so it is a flag on the entry: `ShapeEntry.noFill`.

**A few shapes have a proportion they need.** `leftBracket` puts its arms
across the full width of its box, so in a wide box it is a rounded rectangle,
not a bracket; a gear stretched sideways has splayed teeth. `ShapeEntry.aspect`
records it for the 46 shapes built on a circle and the 7 that want to be tall,
and is 0 — "any box will do" — for the other 134. Nothing is forced to obey it;
it is what a picker sizes a preview to and what an editor can offer as an
insert size.

**Two decimals of a UNIT box is 1% of the shape.** `num` rounded path
coordinates to two places, which reads as generous until you notice the paths
are in 0..1 and not in points. A pie wedge's quarter circle is 32 points of
smooth geometry, and every one of them snapped onto a 1% grid: hence the run of
visible flats along the curve. Four decimals now, trailing zeros trimmed.

With those in, the gears count 6 and 9 teeth, the sun 8 rays, and the twelve
action buttons are a house, a question mark, an *i*, a camera, a speaker, a
U-turn and the four navigation arrows.

### Still open

* **`moon` does not close.** Its ring ends at `(1, 0.6934)` and the `z` closes
  it with a straight run up the right edge, so the crescent has one horn
  instead of two. The evaluator is faithful here — the arc genuinely ends
  there given the guides in `presets.txt` — and for the ring to close, the
  inner arc's `dy1` would have to be `sqrt(dx2p² + hd2²)` = 0.9014 rather than
  the 0.625 the guides produce. Either the extraction dropped something or one
  guide is being read wrongly; settling it needs the original
  `presetShapeDefinitions.xml`, which is not in the repo. **Not fudged in the
  meantime**: a hand-tuned constant in one shape's guides would be a lie about
  where the geometry comes from.
* **`cloud`'s scallops are specks.** Its second path is eleven arcs of about 4%
  of the width each, so they draw as short marks rather than the inner curves
  a cloud usually shows. Faithful to the guides as written; worth the same
  check as the moon when the XML is to hand.
* **A `BookFrame` holds one path.** For the 60 shapes that have both a body and
  a line the book takes the body and drops the line, so an inserted callout has
  no leader. Fixing it means a second path on the frame sharing the first's
  transform, not a second frame — two frames would scale independently and
  could not be moved together. The slide editor is unaffected: it stores the
  preset name and its renderer draws every path.
* **The book editor paints one colour.** It can now ask for the parts but has
  nowhere to put their shades, for the same reason.

## 18. The shape catalogue aborted the native editor before it drew a frame

`OfficeShapeCatalog`'s constructor read:

```
Constructor () {
    OfficeShapeCatalog.fill(this)
    OfficeShapeCatalog.markNoFill(this)
    OfficeShapeCatalog.markAspect(this)
}
```

which is legal Ranger, compiles clean on all fourteen targets, and passes every
JavaScript test. On C++ it throws. The writer reaches a shared pointer to the
object through `shared_from_this()`, and inside a constructor there is no
shared pointer yet, so the SDL book editor died on `std::bad_weak_ptr` after
printing its banner and before drawing anything.

This is the same defect as §14, in a different file, found the same way — by
running the native binary. Nothing else can find it: the browser build, the
Node tests and the twelve other targets are all fine.

The table is built as a plain list now and assigned:

```
Constructor () {
    entries = (OfficeShapeCatalog.build())
}
```

**And there is a test for it this time.** `npm run office:shapes:native` builds
the catalogue and uses it on JavaScript *and* on C++, because the whole point
is that the two disagree. The main suite cannot do this — it imports both
editors, and compiling the whole book and the whole deck to C++ is more than a
constructor check is worth — so the native half is a separate, small file. It
does not merely construct the catalogue: a `build` that quietly returned
nothing would pass that, so it counts, finds and draws as well.
