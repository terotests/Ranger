# The front page

What is published at <https://terotests.github.io/Ranger/> — the language's own
page: what Ranger is, what it compiles to, which platforms it reaches, how the
portability claims are checked, and the gallery. The playground it replaced at
the site root now lives at [`/playground/`](https://terotests.github.io/Ranger/playground/).

It is plain HTML, one stylesheet and one module. No framework, no bundler, no
dependency to install — `node landing/build.mjs` copies four files and checks
that the generated ones are there.

```bash
node landing/build.mjs              # -> landing/dist
node landing/build.mjs --out DIR    # -> anywhere (the Pages job uses this)
python3 -m http.server -d landing/dist 8080
```

## What on the page is generated, and by what

Four things on the page are produced by this repository's own compiler and
libraries rather than drawn or written by hand. Each has a script, each output
is committed, and only a change to the thing itself needs the script re-run.

| On the page | Output | Script |
| --- | --- | --- |
| The logo, and the tab icon | `assets/ranger-mark.svg`, `assets/favicon.svg` | `node landing/tools/logo.mjs` |
| The language and platform marks | `assets/logos/*.svg` | `node landing/tools/logos.mjs` |
| The rippling backdrop | `assets/hero/hero.json` | `node landing/tools/hero.mjs` |
| The compiled example tabs | `assets/targets.js` | `node landing/tools/examples.mjs` |
| The screenshots | `assets/shots/*.jpg` | `node landing/tools/capture.mjs` then `shots.mjs` |

`build.mjs` re-runs `examples.mjs` itself — that one has to be current, because
the point of the section it feeds is that the Swift beside the tab is what
*this* commit's compiler writes. The others are left alone: they need demos
built and toolchains present, and they do not change when the compiler does.

### The logo

Ranger's mark existed as a bitmap and nothing else: `assets/logo/ranger-mark.png`
is the project's avatar at 304 × 304, the same shield as
`ranger-vscode-extension/icons/ranger-file-icon.svg`.

`tools/logo.mjs` hands it to `lib/evg/tools/evg_trace_cli.rgr` — the bitmap
tracer — which posterises it into flat colour regions, walks each region's
edges, finds the corners, fits cubics between them, and writes each layer back
as one evenodd path. Three of its settings are what make the outline come out
clean rather than dashed, and each is there for a reason the first attempt
showed: the palette is **pinned** to the shield's own four colours instead of
quantised out of the picture, `lumaWeight 1` stops the half-lit pixels around
the rim reading as the dark letter, and `turdsize 12` drops the specks the
anti-aliased band still leaves. The paper layer is dropped and the rest are
clipped to the silhouette, so nothing escapes past the outline. What comes out
is `assets/ranger-mark.svg`: a real vector logo, three layers, about 3 KB,
sharp at any size. It is the mark in the
navigation bar and the footer, the tab icon, the drawing in the colophon, and
the shield inside the rippling backdrop, so those four cannot drift apart.

The same tracer compiles to Node, Python, C++ and Rust, and
`npm run evg:trace:cli:smoke` asserts all four write the byte-identical SVG.

### The strip of language and platform marks

The same pipeline, nineteen more times. `assets/logos/src` holds the marks as
they arrived — [simple-icons](https://simpleicons.org), CC0-1.0, the licence is
in that directory — and `tools/logos.mjs` rasterises each one to a 320 × 320
bitmap with EVG's scanline rasteriser and traces it back with the bitmap
tracer. After the first step the logo is pixels and nothing else; what the page
draws is a path this repository computed from an image.

The output takes `currentColor` and the page uses it as a CSS mask, so one
colour rule tints the whole strip and a mark can light up on its own under the
pointer. `build.mjs` publishes the traces and leaves `src/` behind.

The marks are the trademarks of the projects they belong to, and they say which
languages and platforms Ranger compiles for. None of it is an endorsement by
any of them.

### The backdrop

`assets/hero/hero.tsx` and `hero.css` are an EVG document: a field of hairline
rules, a grid crossing them, and the traced logo. `tools/hero.mjs` lays it out at build
time and writes the display list — flat draw commands in absolute pixels —
including the `evg-surface-effect: ripple` block the stylesheet declares.

`assets/hero/hero.js` then draws that list on the GPU every frame through
`lib/evg/gl/evg-webgl.js`, the same WebGL 2 painter the PowerPoint editor
and the node-graph editor use, and pushes drops into `list.effect.drops` as
the pointer moves. The painter is copied into the build rather than forked
here, so the front page cannot drift from the renderer it is demonstrating.

If WebGL 2 is missing, the fetch fails, or the visitor asked for reduced
motion, the section keeps the flat background its stylesheet gave it. Nothing
on the page depends on the backdrop having run.

### The example

`examples/Cart.rgr` is forty lines of ordinary Ranger. `tools/examples.mjs`
compiles it for Swift, Kotlin, JavaScript, TypeScript, C#, C++, PHP and Rust
and writes each result into `assets/targets.js`. For C++ and Rust it starts the
listing after the small runtime header every program on those targets carries,
and says how many lines it skipped.

The compiler exits 0 even when compilation fails, so the script reads the log
rather than the exit status, and throws if any target did not produce a file.

### The screenshots

`tools/shots.mjs` scales pictures into `assets/shots` and fails if a source is
missing. Most sources are artifacts a gallery project already keeps in the
repository. Two are captured from the demos' own build output by
`tools/capture.mjs`, which builds them first: the Fig reader opened on
`gallery/figma/fixtures/health.fig`, and the game engine running in a tab.
Both scripts use the Chromium that is already installed for the browser smoke
tests, so neither adds a dependency.

## Layout and palette

The palette is the language's own — the gold `#fbc802` and near-black `#07070a`
of `ranger-vscode-extension/icons/ranger-file-icon.svg`. The layout is a column
grid with hairline rules and a small monospaced label over every block, and one
section turns the gold into the whole field rather than wearing it as an accent.

Nothing is downloaded: the type is the reader's own system sans and mono, and
the only artwork is the traced mark.

## Files

```
landing/
  index.html  styles.css  main.js     the page
  build.mjs                           assemble it
  examples/Cart.rgr                   the program the target tabs show
  assets/
    logo/ranger-mark.png              the bitmap the logo is traced from
    logos/src/*.svg                   the language marks as they arrived (CC0)
    logos/*.svg                       generated — tools/logos.mjs
    hero/hero.tsx  hero/hero.css      what the backdrop is laid out from
    hero/hero.js                      what draws it, per frame, on the GPU
    ranger-mark.svg  favicon.svg      generated — tools/logo.mjs
    hero/hero.json                    generated — tools/hero.mjs
    targets.js                        generated — tools/examples.mjs
    shots/*.jpg                       generated — tools/capture.mjs + shots.mjs
  tools/                              the generators
```
