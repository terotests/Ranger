# RealTrainer — native SDL2 + OpenGL host

The same app the browser page, the iPhone and the Android tablet run, in a
desktop window. Nothing in it knows which of the four it is in:

```text
SDL event  → RtHost → RealTrainerDemo              (this process)
RtHost     → EVGDisplayList → EvgGlPainter → OpenGL
```

That is the display-list seam. `gallery/evg/gl/evg-webgl.js` draws the list in
a browser tab, `EvgPainter.kt` draws it on an `android.graphics.Canvas`, and
`EvgGlPainter` + `evg_gl_native.cpp` draw the same list in a window from the
same commands — no second copy of the tree walk in between.

```bash
npm run rt:sdl            # Ranger → C++ → native binary
npm run rt:sdl:ranger     # …stop after the C++, which needs no SDL2      (CI)
npm run rt:sdl:run        # …and open the window
npm run rt:sdl:smoke      # …or 30 frames headless                        (CI)

./tmp/rt-sdl/rt_sdl --size 390x844          # the phone shell, in a window
./tmp/rt-sdl/rt_sdl --route /calendar/cal-plan?week=2026-02-09
```

Requirements: a C++17 compiler, SDL2 (`brew install sdl2` /
`apt-get install libsdl2-dev`), and OpenGL — the system framework on macOS,
mesa on Linux.

## What is here, and why so little

| | |
| --- | --- |
| `rt_sdl.rgr` | the event loop, the five texts off the disk, and the clock |
| `build.sh` | Ranger → C++ → binary |
| `../../src/RtHost.rgr` | the viewport, shared with iOS and Android |

`RtHost` is the port. It already holds the window, the safe area, the point
conversion, the press a drag cancels, the fling's clock and the keyboard — it
is what `rt_ios.rgr` and `rt_android.rgr` are, one line each. What a window
adds that a `UIView` and a browser page do not is an event loop, files read
off a disk rather than assets or a bundle, and a clock; that is this file.

The window, the input and the GL present path are **not** here either. They
are the DataGrid's `dgfx_*` layer under `gallery/datagrid/platform/sdl/` —
generic SDL2 plumbing that happens to have been written for the spreadsheet
first, which `gallery/book` and `gallery/rangerflow` borrow the same way.

One honest consequence, the same one the schema editor records:
`EvgGlPainter.draw` takes a `GridImages` because the spreadsheet it was written
for draws photographs. RealTrainer draws none, so this host passes an empty
one — and through that one parameter links a good deal of a DataGrid it never
calls. Where the painter ought to live is `gallery/evg/gl/`, beside
`evg-webgl.js`, with the image lookup behind a small interface. That is a
refactor of a working host and has not been done.

## Input

`book_sdl` drives `BookApp` through `UIInput`, the game engine's
immediate-mode input. RealTrainer is an `EvgApp`, so its input is `EvgHost`'s
and this host calls it directly — `pressAt`, `panAt`, `releasePress`,
`hoverAt`, `typeText`, `key`. Nothing in between.

| | |
| --- | --- |
| click | press down marks the control, up activates it |
| drag | scrolls the page, and past a few points takes the mark off — as a finger does in the browser |
| wheel | the same drag, one line a notch, through the same scroller and the same fling |
| typing | into the focused field, dropped when there is none |
| `Esc` | closes what is open — a dialog, a menu — and closes the **window** when the app says it had nothing to close |

There are no letter shortcuts, which is the difference from the book editor and
the schema editor. This is an application with text fields in it: `q` types a q.

SDL reports the pointer in **window points**, which is the space `EvgHost`
converts from, so nothing is converted here. The drawable is twice that on a
HiDPI screen and is used inside the painter for exactly two things — the GL
viewport and the scale the text atlas is rasterized at.

## The page is the window

There is no fit, no letterbox and no pinch, as there is none in the browser at
`?page=fit` or on the phone. The window size is asked for every frame rather
than remembered from `dgfx_open` — the size a window opens at is a request and
the corner can be dragged — and a change is a re-layout, so the stylesheet
folds the rail into a bottom bar under 768 points on its own. Drag the corner
narrow and the desktop shell becomes the phone one, live.

`--size 980x760` is the default and is the desktop demo the browser checks
measure; `--size 390x844` is the phone.

## The face is renamed, on purpose

The stylesheet asks for `Arial`. A browser resolves that through its own font
stack, CoreText and Android substitute for it, and a window has neither:
`FontManager` walks a chain of looser matches and finally hands back whatever
loaded first, which resolves `Arial` **and** `Arial-Bold` to the same face and
draws every heading at the regular cut's widths.

So the host loads two Open Sans faces and relabels them as that family, styles
kept, which makes `Arial-Bold` an exact hit. It is a substitution either way;
this is the honest form of it, and `--family` names a different one.

The same `UITextRenderer` then does both jobs — it measures and it
rasterizes — because a page laid out to one set of widths and drawn with
another looks almost right, which is worse than looking wrong. `loadFontBytes`
is what binds the face to the rasterizer, installs the TrueType measurer and
sets `hasFont`; loading into the manager alone leaves every glyph in the
built-in bitmap font while returning true.

**Order matters, and it is the reason the faces are opened before the host
exists.** `EVGDefaultMeasurer` is read by `EVGLayout` and `EVGTextEngine` in
their *constructors*, and `RealTrainerDemo` builds one of each as a field — a
measurer installed after `new RtSdl` would arrive after the engine meant to use
it. Faces, install, then the app.

## The clock

Ranger has no date type and no `now()` — a clock inside a reducer is what makes
a state machine untestable — so the app takes today as a value and the host
hands it in. This one reads the wall clock and converts days-since-epoch into a
civil date with integer arithmetic, no table and no leap-year special case.
`--today 2026-02-09` overrides it, which is what makes a screenshot
reproducible; `npm run rt:sdl:smoke` passes one for that reason.

## The headless check

`--frames 30` under `SDL_VIDEODRIVER=dummy` runs thirty frames and prints what
the last one held:

```text
-- last frame --
scene      <the scene the shell is on>
section    <home | calendar | dashboard | chat>
commands   <how many draw commands the frame held>
text runs  <how many of them were text>
page       980 x 760
stylesheet 0 error(s)
face       Arial bound to the rasterizer
```

Those are the fields, not a recorded run — no machine with SDL2 on it has run
this yet, and printing numbers nobody measured is how a README starts lying.

The shape is deliberately not "it did not crash": a host that loaded nothing and
drew an empty window would also not crash. A scene name, a command count, a run
count and a stylesheet that parsed are four numbers that cannot all be right by
accident.

## What has been verified

On this container, with no SDL2 and no display:

* Ranger → C++ compiles clean (`-l=cpp`, ~25 s, 117 757 lines of C++).

What has **not** been verified here is the link, the window or the picture.
This container has no `libsdl2-dev`, no GL headers, no display and no
compositor. The GL path itself is the DataGrid's, exercised by
`npm run datagrid:sdl`, but "RealTrainer draws correctly through it" is a claim
this machine cannot make. Run it on a desktop and look.

## License

AGPL-3.0-or-later (Gallery).
