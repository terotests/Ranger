# Book editor — native SDL2 + OpenGL host

The same `BookApp` the browser page drives, in a desktop window. Nothing in the
editor knows which host it is running in:

```text
SDL event  → UIInput → BookApp → BookEditor          (this process)
BookApp    → EVGDisplayList → EvgGlPainter → OpenGL
```

That is the point of the display-list seam. `gallery/evg/gl/evg-webgl.js` draws
the list in a browser tab and `EvgGlPainter` + `evg_gl_native.cpp` draw the same
list in a window, from the same commands, with no second copy of the tree walk
in between. The window, the input and the GL present path are the DataGrid's
`dgfx_*` layer — generic SDL2 plumbing that happens to live over there, which
the schema editor borrows the same way.

```bash
npm run book:sdl                # Ranger → C++ → native binary
npm run book:sdl:run            # …and open the window
npm run book:sdl:smoke          # …or 30 frames headless, for CI

./tmp/book-sdl/book_sdl gallery/book/platform/sdl/book.config.json
```

Requirements: a C++17 compiler, SDL2 (`brew install sdl2` /
`apt-get install libsdl2-dev`), and OpenGL — the system framework on macOS,
mesa on Linux.

## The configuration file

A browser host is configured by its URL and a command-line host by its
arguments. A window has neither: it is opened by double-clicking it, so what it
opens has to come from a file.

**Every field has a default and a missing file is not an error** — it is the
defaults. A config with one line in it means *like the default, but that one
thing different*:

```json
{ "spread": 3 }
```

That is deliberate. The first run of a fresh build should show a book rather
than a diagnostic, and a half-written config is the normal state of a config.

What the host will not do is hide what it decided. It prints the settings
actually in force before it opens anything, because a host that silently fell
back to a default is indistinguishable from one that read your file correctly —
and the difference matters the moment a path is wrong:

```text
config     gallery/book/platform/sdl/book.config.json
window     1400 x 900
fonts      gallery/pdf_writer/assets/fonts, 7 face(s)
opening    photos, on spread 2
index      gallery/book/fixtures/photo-index.json
query      from 2019-06-01 to 2019-08-31 at cottage
pictures   gallery/pdf_writer/assets/images
output     gallery/book/output/sdl
```

### What it can open

| `"open"` | what happens |
|---|---|
| `"sample"` | the book that ships with the engine |
| `"album"` | an iPhoto / Aperture library index — `album.file`, `album.name` |
| `"photos"` | a photo index, filtered — `photos.index` plus the query below |

The photo query is the same one `npm run book:photos` takes, as data:
`from`, `to`, `place` (a place the index itself names), `near` as `lat,lon`,
`radiusKm`, `text`, `title`. An empty field is no bound.

`assets` says where the photographs are **now**. For `open: "photos"` it
re-roots the index's paths by file name, because an index's paths belong to
whoever wrote it — a folder that has since moved, or a Mac this is not. Leave
it empty to keep the index's own paths, which is what an index of absolute
paths wants.

`fonts.faces` **replaces** the default list rather than adding to it: a host
that quietly kept loading a face you removed is a host you cannot use to test a
face.

## Keys

| | |
|---|---|
| `←` `→` | turn the spread (`n` / `v` also) |
| `e` | edit / read |
| `b` `m` `f` `g` | bleed · margins · frame edges · guides |
| `z` `y` | undo · redo |
| `s` | save this spread as SVG into `output` |
| `p` | print preflight to the console |
| `q` | quit |

Bare letters rather than Ctrl chords, for the reason the schema editor gives: a
window with no terminal behind it does not reliably get a text event while Ctrl
is held, and a key that silently does nothing is worse than a simpler key.

## The headless check

`--smoke` runs thirty frames with `SDL_VIDEODRIVER=dummy` and then prints what
the last frame held:

```text
-- last frame --
commands   212
text runs  30
pictures   1
pages      8 in 5 spread(s)
preflight  3 error(s), 0 warning(s)
```

That is the whole of the check, and it is deliberately not "it did not crash":
a host that opened nothing and drew an empty desk would also not crash.
Commands, text runs and pictures are three numbers that cannot all be right by
accident.

## Two things this host does that the other two did not

**It loads every face twice, on purpose.** `BookApp` measures with them — that
is what decides where every line breaks — and `UITextRenderer` rasterizes with
them. Loading one and not the other is the failure this whole stack is built to
prevent: a book laid out to one set of widths and drawn with another looks
almost right, which is worse than looking wrong. The two loads are counted
separately and a mismatch is a warning, because they can fail apart.

**It decodes the photographs itself.** The browser hands textures to WebGL; here
the pictures go through `GridImages` into the painter, keyed by the same path
string the display list carries — so the cache key and the document's own name
for a picture are one string, exactly as in the browser.

## What this is not

It is not a macOS application bundle, and that matters if you were hoping to
reach the system Photos library from it. A TCC permission attaches to a signed
`.app` with a usage string in its `Info.plist`; a binary run from a terminal
inherits the terminal's grants instead. Reading a Photos library still goes
through `gallery/book/tools/mac_photos.mjs`, which asks Photos.app and writes an
index this host can then open. See the note in the module README.
