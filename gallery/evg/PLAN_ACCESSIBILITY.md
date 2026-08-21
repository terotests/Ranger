# Screen readers for an EVG program on the GPU

How a WebGL or SDL2+OpenGL program built out of EVG could be made usable by
NVDA, JAWS, VoiceOver and Orca — and why the answer is a second list beside the
display list rather than anything in the renderer.

Status: **phases 1–3 are built and tested** in the browser
([§12](#12-what-is-built)); the **macOS native bridge is written but has not run
on a Mac** ([§13](#13-the-native-host-macos)). The declarative side (§4) and the
other two desktop platforms are still design.

---

## 1. Why a GPU frame is invisible

A screen reader does not look at pixels. It asks the platform for a *tree* —
nodes with a role, a name, a value, a state and a rectangle — and it walks that
tree with the arrow keys, drives it with the Tab key, mirrors it onto a braille
display and reads out what changed. Windows calls that tree UI Automation, macOS
calls it NSAccessibility, Linux calls it AT-SPI2, and a browser builds it out of
the DOM.

Everything under `gallery/evg/gl/` deliberately throws that away. `EVGDisplayList`
emits, in its own words, commands that are "absolute pixels, resolved colours,
no tree, no units", and `evg-webgl.js` turns them into instanced quads with a
signed distance function. By the time a button exists on screen it is a rounded
rect and a glyph run, and `sdRoundedBox` has no opinion about whether that is a
button, a cell, a tab or a decorative divider.

So a `<canvas>` running the DataGrid is, to NVDA, one empty graphic. The SDL2
host is worse: an OpenGL window with no accessible children at all. This is the
same wall Google Sheets, Figma, Flutter-on-canvas and every game UI hit. Nobody
has solved it by making the renderer smarter. Everybody has solved it — when
they solved it — by publishing a parallel semantic tree.

## 2. Two dead ends, named so they are not tried

**Inferring semantics from the display list.** Tempting, because the list is
already flat, already positioned, and already crosses the seam as JSON. It is
OCR against your own program: a rect with a border and a centred run of text is
a button, unless it is a tab, or a cell, or a chart legend swatch. The list is
lossy *on purpose* — that is what made it portable — and guessing back the part
that was discarded produces a tree that is wrong in exactly the cases that
matter (state, grouping, order, and what is decoration).

**`role="application"` plus an `aria-live` region.** Cheap: one div, one string,
announce what changed. It is also a lecture, not a user interface. The reader
gets no exploration, no braille cursor, no touch, no "what is next to this", no
list of headings — and every AT user's first move, reading the screen
top-to-bottom with the review cursor, returns nothing. Live regions are a
supplement for events that have no anchor ("Recalculated 1,200 cells"), not a
substitute for a tree.

## 3. The seam, restated: walk once, emit two lists

`EVGDisplayList` exists because five painters each walked the laid-out tree
themselves, and that is how border-radius came to work in PDF and silently not
in PNG — one painter read `box.borderRadius`, another read a stale
`el.borderRadius` that nothing wrote. An accessibility tree written as a *second*
independent walk would repeat that mistake with worse symptoms: the drift would
be silent to everyone who can see the screen, and only a blind user would ever
hit it.

So the same rule applies. One pass over the same state produces two outputs:

```
                     ┌─► EVGDisplayList  (geometry)   ─► WebGL / SDL2+GL / PDF / PNG
app state ──► walk ──┤
                     └─► EVGA11yTree     (meaning)    ─► DOM mirror / UIA / AT-SPI / AX
```

Same coordinates, same build call, same generation number. If a node has no
matching geometry, or geometry has no node and is not marked decoration, that
is a bug the builder can *detect* — which is the second reason to keep them
together.

## 4. Where the meaning actually lives today

EVG has two distinct program shapes, and they need different answers. This is
the part that decides the whole design.

### Declarative EVG — there is a tree

`EVGDisplayList.build(root:EVGElement)` walks a laid-out `EVGElement` tree: the
showcase pages, the PDF documents, anything coming through
`jsx/JSXToEVG.rgr`. The tree already carries `tagName`, `id`, `className`,
`textContent`, and `alt` on images (`JSXToEVG.rgr:593`). It carries almost no
*intent*: nothing says focusable, nothing says button, nothing says this
`<div>` is a group of radio buttons and that one is a shadow.

What is missing is a handful of fields on `EVGElement` and their pass-through in
`JSXToEVG`:

```
role         aria-label       aria-describedby   aria-hidden
tabIndex     aria-live        aria-level         aria-expanded / -checked / -selected
```

Plus sane defaults, so an unannotated page is not silent: `<span>` with text is
static text, `<img alt="…">` is an image with that name, `<img>` with no `alt`
is decoration, a `<Button>` component is a button. Defaults are what make the
first 80% arrive for free; explicit attributes are what make the last 20%
correct.

### Immediate-mode EVG — there is no tree, and that is fine

`GridView.buildDisplayList` (`gallery/datagrid/src/GridView.rgr:1204`) and
`EVGWindow.paint` build a display list *directly* from a domain model. There is
no element tree to annotate and there should not be one — the model is richer
than a tree of divs ever was.

And the model already knows nearly everything an AT wants:

| Already in the repo | What it is, in accessibility terms |
| --- | --- |
| `EVGControlKind` — label, button, radio, checkbox, input, separator, swatch, tool, content | a role enum, already written |
| `EVGControl.text` / `.value` | accessible name / value |
| `EVGControl.checked` / `.enabled` / `.isDefault` | states |
| `EVGControl.x/y/w/h`, `contains()` | bounds and hit test |
| `EVGWindow.focusedId`, `focusNext()` | a focus model with a single owner |
| `EVGWindow.controls` order | reading order and Tab order |
| `SpreadsheetModel.cellLabel(row col)` | "B7" — the name of a gridcell |
| `GridSelection.active` / `liveRange()` | focused cell, selected range |
| `DataGrid` visible window + model row/col counts | virtualization indices |
| `@process` `markStateDirty()` / scene generation (`?seen=N`, 204) | the change signal an AT event needs |

The immediate-mode side is *further along* than the declarative side. Its
problem is not that the information is missing; it is that nothing publishes it.
`EVGWindow` could emit an accessibility node per control in about the same
number of lines it takes to paint one.

## 5. The model: `EVGA11yTree` in Ranger

A new pure module beside `EVGDisplayList.rgr` — no device resources, no host
calls — so it compiles to ES6, C++, Rust and Go exactly like the display list
does. That is the specifically *Ranger* part of this: the accessibility model is
written once and is then available to the browser host, the SDL2 host, and any
future host, instead of being re-implemented per platform the way it normally is.

The field set is chosen as the intersection of ARIA, UIA, AT-SPI,
NSAccessibility and AccessKit — everything below exists in all five:

```ranger
class EVGA11yRole {
    sfn none:int ()      { return 0 }   ; decoration; never surfaced
    sfn group:int ()     { return 1 }
    sfn text:int ()      { return 2 }
    sfn button:int ()    { return 3 }
    sfn checkbox:int ()  { return 4 }
    sfn radio:int ()     { return 5 }
    sfn textField:int () { return 6 }
    sfn image:int ()     { return 7 }
    sfn grid:int ()      { return 8 }
    sfn row:int ()       { return 9 }
    sfn cell:int ()      { return 10 }
    sfn tab:int ()       { return 11 }
    sfn menuItem:int ()  { return 12 }
    sfn dialog:int ()    { return 13 }
    sfn status:int ()    { return 14 }
}

class EVGA11yNode {
    def id:string ""            ; STABLE across frames — see §8
    def parentId:string ""
    def role:int 0
    def name:string ""          ; what gets read
    def description:string ""   ; read after a pause, on request
    def value:string ""         ; a field's text, a slider's number
    def x:double 0.0 def y:double 0.0 def w:double 0.0 def h:double 0.0
    def focusable:boolean false
    def focused:boolean false
    def disabled:boolean false
    def checked:int 0           ; 0 no, 1 yes, 2 mixed, 3 not applicable
    def selected:boolean false
    def expanded:int 3
    def readOnly:boolean false
    ; Position in a set the tree does not fully contain — the whole point of
    ; virtualization. "Row 4,120 of 10,000" is this and nothing else.
    def rowIndex:int 0 def colIndex:int 0
    def rowCount:int 0 def colCount:int 0
    def posInSet:int 0 def setSize:int 0
    ; Text fields: caret and selection, in UTF-16 offsets into `value`.
    def caret:int 0 def selStart:int 0 def selEnd:int 0
    def actions:int 0           ; bitmask: focus | activate | setValue | expand | scrollTo
    def live:int 0              ; 0 off, 1 polite, 2 assertive
}

class EVGA11yTree {
    def nodes:[EVGA11yNode]
    def rootId:string ""
    def focusId:string ""       ; the app's focus, not the host's
    def generation:int 0        ; same counter the scene uses
    fn addNode:EVGA11yNode (id:string parentId:string role:int)
    fn toJson:string ()
    fn diff:EVGA11yUpdate (prev:EVGA11yTree)   ; §8
    fn lint:[string] ()                        ; §9
}
```

Nothing in there is browser-specific. `role`, `name`, `bounds`, `focus`, plus a
tree of stable ids and an update packet, is precisely the shape of an AccessKit
`TreeUpdate`, and AccessKit is what egui, Bevy and Slint use to reach all three
desktop platforms. Matching its shape deliberately makes the native adapter in
§7 nearly a transcription.

## 6. The browser host: a DOM mirror over the canvas

For WebGL there is only one approach that actually works with real screen
readers, and it is what Google Sheets does: keep a small, real, focusable DOM
tree positioned over the canvas, and let the browser build the accessibility
tree from it as usual.

Where it would go: `gallery/evg/gl/evg-a11y.js`, beside `evg-webgl.js`, wired
from `gallery/datagrid/web/standalone/standalone.mjs` where the scene is already
pulled each frame.

```
GridApp ─┬─ sceneJson()  ─► evg-webgl.js  ─► pixels        (what a sighted user gets)
         └─ a11yJson()   ─► evg-a11y.js   ─► DOM mirror    (what NVDA reads)
```

The mechanics that matter:

- **The canvas gets `aria-hidden="true"`** and loses `tabindex`. It is now
  scenery. Today it is the focus target (`web/standalone/index.html:168`), so
  this is a real change to the input path, not an addition.
- **The mirror is the focus and keyboard target.** The existing
  `canvas.addEventListener("keydown", …)` moves onto the mirror container, so a
  screen reader in forms/focus mode passes keys straight into `GridApp.handleKey`
  as it does today.
- **Nodes are positioned at their real bounds** (`position:absolute`, CSS
  pixels, divided by DPR). This is not cosmetic: touch exploration on iOS/Android,
  screen magnifiers, and the "route mouse to focus" command all use those
  rectangles. Nodes are invisible via `opacity:0` / `color:transparent`, never
  `display:none` or `visibility:hidden` — those remove the node from the
  accessibility tree, which is the one thing being built here.
- **Focus has exactly one owner: the app.** When `GridSelection.active` or
  `EVGWindow.focusedId` moves, the host calls `.focus()` on the mirror node;
  when a `focusin` arrives from the browser (Tab from the address bar), the host
  tells the app. A re-entrancy guard around both directions, or the two chase
  each other forever.
- **The cell editor becomes a real `<input>`.** IME, dictation, Android/iOS
  keyboards, braille input and caret announcements are things browsers only give
  to real text controls. The app stays the source of truth; the input is a
  puppet, synced from `editBuf` and forwarding every change back.
- **The grid is `role="grid"` with honest virtualization.** Emit the ~40 visible
  rows, each with `aria-rowindex`, and put `aria-rowcount="10000"` /
  `aria-colcount` on the grid. A 10,000-row DOM mirror is not an option, and
  lying about the counts makes the reader announce nonsense positions.
- **One `aria-live="polite"` status region** for what has no anchor: sort
  applied, recalculation finished, file loaded, "3 cells copied". Assertive is
  for errors only. Chatty live regions are the most common way a technically
  correct implementation becomes unusable.

The browse-mode trap deserves naming: NVDA and JAWS intercept arrow keys in
browse mode, so a grid the user must arrow around needs
`role="application"`/focus mode on the container — at which point the app owes
the user *complete* keyboard navigation, because the reader's own navigation is
now switched off. That is a promise, not a flag.

## 7. The native host: SDL2 + OpenGL

There is no cross-platform accessibility API. There are three, and SDL2 exposes
none of them (SDL3 has only the beginnings). What SDL does give is the native
window handle, which is the anchor every platform adapter needs.

| Platform | API | Anchor |
| --- | --- | --- |
| Windows | UI Automation (`IRawElementProviderSimple/Fragment`) | HWND |
| macOS | NSAccessibility protocol on the `NSView` | NSWindow/NSView |
| Linux | AT-SPI2 over D-Bus (via ATK) | window + bus name |

Writing three adapters is months of work and is why almost no GPU app has this.
The realistic route is **AccessKit**: one Rust crate with a C API that
implements all three behind a single node/tree/update model, already shipping in
egui, Bevy and Slint. The work then is:

1. `EVGA11yTree` → AccessKit `TreeUpdate` (a field-for-field transcription; it
   can live in Ranger-generated C++ or Rust, since both are targets).
2. Create the adapter from the SDL window handle
   (`SDL_GetWindowWMInfo` → HWND / NSView / X11 window).
3. Push an update whenever the generation changes; route the actions AccessKit
   reports back (activate, focus, set value) into the same `GridApp` entry points
   the pointer path uses.

`gallery/datagrid/platform/sdl/evg_gl_native.cpp` is where that shim would sit,
next to the GL upload it already does. Note the platform work is bounded and
one-time, while the *content* — roles, names, states, order — is the Ranger
module both hosts share.

## 8. The three problems that decide whether it works

**Stable ids.** If node ids are assigned by emission order, then every frame
produces a "new" tree, the AT loses its cursor, focus resets, and the braille
display flickers. Ids must be derived from identity, not from paint order:
`win:7/ctrl:3`, `sheet:Q3/cell:B7`, `el:#total`. This is the single most
common way a first implementation fails, and it fails in a way that looks fine
on screen.

**Diffing, not republishing.** Platform APIs want *events* — "this node's value
changed", "focus moved" — not a fresh tree at 60 Hz. The repo already has the
signal: `markStateDirty()` and the scene generation that lets an idle page
answer 204 instead of re-sending. `EVGA11yTree.diff()` should produce the same
kind of packet: added, removed, changed, focus moved. Rebuilding a DOM mirror
every frame will melt the tab, and rebuilding a UIA tree every frame will hang
the reader.

**Virtualization honesty.** Only what the model has may be claimed. The visible
window is what gets nodes; `rowCount`/`colCount`/`setSize` carry the truth about
the rest; and scrolling in response to an AT `scrollTo` action must actually
move the viewport, or the reader will ask for row 4,120 and be told it does not
exist.

## 9. Testing it without owning a screen reader

This repo's habit is dumps and oracles, and accessibility suits that unusually
well — the tree is text.

- **A golden a11y dump** next to the display-list dumps (`npm run
  datagrid:artifacts` style): every node, indented, `role · name · state ·
  bounds`. A refactor that silently drops a name shows up as a diff. This
  catches most real regressions and needs no host at all.
- **Lints in the builder**, failing the test suite: a focusable node with no
  accessible name; a duplicate id; a node whose bounds fall outside its parent;
  `focusId` pointing at a node that is not in the tree; a live region with no
  text; a text run in the display list with no node covering it and no
  decoration marker (the geometry/meaning cross-check from §3).
- **Keyboard-only reachability**, as a pure Ranger test over `GridApp` /
  `EVGWindow`: from a cold start, is every action reachable with Tab and the
  arrow keys? A screen reader over a mouse-only app is a facade; this test is
  what stops that from shipping.
- **The real browser tree.** The `?selftest=1` harness already drives the page in
  headless Chrome. Chrome DevTools Protocol's `Accessibility.getFullAXTree`
  returns the accessibility tree the browser actually computed — that is a
  genuine end-to-end assertion (roles, names, focus) with no AT installed.
- **What none of it proves.** Whether the thing is *usable* is decided by a pass
  with NVDA on Windows and VoiceOver on macOS, by someone who uses them. No CI
  check substitutes for that, and this container has neither a GPU nor a screen
  reader, so nothing above has been run here.

## 10. Two things that come along for free

- **Tagged PDF / PDF-UA.** `EVGPDFRenderer` is right there, and a tagged PDF is
  the same information under another name: a structure tree of headings,
  paragraphs, figures with `/Alt`, tables with real cells, and decoration marked
  `/Artifact`. Today the PDF output is a picture of a document. The a11y tree
  is exactly what would make it a document.
- **`EVGHTMLRenderer`.** It emits absolutely positioned `<div>`s — the same
  semantic void as the canvas. Given the tree, it can emit real roles and names
  instead, and the HTML target becomes the cheapest place to check the semantics
  against a browser.

## 11. Order of work

| Phase | Work | State |
| --- | --- | --- |
| 1 | `EVGA11yTree.rgr` + emission from `EVGWindow` controls + text dump + lints | **done** — `npm run evg:a11y:test` |
| 2 | `gallery/evg/gl/evg-a11y.js` DOM mirror, wired into the standalone host; canvas `aria-hidden`; focus routing; status live region | **done** — `npm run datagrid:web:test` |
| 3 | Grid semantics: `role=grid`, row/col indices, virtualization counts, headers, sheet tabs, toolbar | **done** — `npm run datagrid:a11y:test` |
| 4 | The cell editor as a real `<input>`, for IME, dictation and braille entry | not done — see §12 |
| 5 | Keyboard completeness and a visible focus ring, audited rather than assumed | not done, and it is what phase 6 should wait for |
| 6 | Declarative side: `role` / `aria-*` on `EVGElement` + `JSXToEVG`, defaults per tag, showcase pages, `EVGHTMLRenderer` parity | not done |
| 7 | Native macOS: `dgfx_a11y.mm`, NSAccessibility elements over the SDL2 window | **written, unverified** — see §13 |
| 8 | Windows (UIA) and Linux (AT-SPI2), most likely via AccessKit | not done |
| 9 | Tagged PDF from the same tree | not done |

The honest summary: the renderer needs no changes at all, the browser host needs
a new file and a change to who owns focus, and the native host needs a bounded
platform shim. The real work — and the part that is easy to underestimate — is
that every widget must say what it *is*, which is a change spread thinly across
`EVGWindow`, `GridView` and every page, and a discipline (name it, or the lint
fails) rather than a feature.

---

## 12. What is built

Three files carry it, and the split is the one §3 argues for: meaning is emitted
in Ranger beside the geometry, and each host translates it into whatever its
platform speaks.

| File | What it is |
| --- | --- |
| [`EVGA11yTree.rgr`](EVGA11yTree.rgr) | The model: roles, names, states, bounds, virtualization indices, focus, a text dump and the lints. Pure Ranger — no host, no device — so it compiles to ES6, C++, Rust and Go like the display list does. |
| [`EVGWindow.rgr`](EVGWindow.rgr) · [`EVGToolbar.rgr`](EVGToolbar.rgr) | `a11y()` on both. `EVGControlKind` was already a role enumeration and `focusedId` already a focus model; publishing them was most of the work. |
| [`GridView.rgr`](../datagrid/src/GridView.rgr) | `a11yTree()` — the sheet as a `grid` with column and row headers, the visible cells, the formula bar, the sheet tabs, the toolbar, the dialogs and a status live region. `GridApp.a11yJson()` / `a11yDump()` are the entry points. |
| [`gl/evg-a11y.js`](gl/evg-a11y.js) | The browser half: real DOM over the canvas, positioned at the rectangles that were painted, reusing elements by node id. |

What a reader gets today, in the standalone DataGrid page:

- The canvas is `aria-hidden`; the mirror is what the browser sees.
- The sheet is a `role="grid"` claiming every row it has (`aria-rowcount`) while
  emitting only the ones on screen, each with `aria-rowindex` / `aria-colindex`,
  so "row 7 of 1,000" is true rather than invented.
- Column letters and row numbers are `columnheader` / `rowheader`, which is what
  makes a cell announce as "B, 7, 1204" instead of "1204".
- The caret cell is the one tab stop in the whole application — a roving
  tabindex — and moving the selection moves the reader with it.
- The toolbar is named buttons with `aria-pressed` on the toggles; the sheet
  tabs are a `tablist`; a dialog is a `dialog` with `aria-modal`, and while one
  is open the sheet behind it is hidden from the reader.
- Activating anything through the reader presses the app *where the thing is*,
  so there is no map from node ids to commands to keep in step.
- `?a11y=0` turns the mirror off, which is how to tell a mirror bug from an app
  bug.

### Trying it with a screen reader

```bash
npm run datagrid:web:serve      # builds, then serves it on :8000
```

On macOS, VoiceOver is already installed — **⌘F5** turns it on and off. Safari
pairs with it best; Chrome works.

- **VO+→ / VO+←** (Control+Option+arrow) walks the tree: toolbar buttons by
  name, the formula bar, the grid, the sheet tabs.
- **VO+Shift+↓** interacts with the grid; plain **arrow keys** then move the
  spreadsheet's own caret and each cell is announced with its column and row.
- If arrows do nothing, VoiceOver's Quick Nav is on — press **← and → together**
  to turn it off.
- **VO+Space** presses whatever is focused.

Orca on Linux and NVDA on Windows read the same DOM; nothing in the mirror is
macOS-specific.

### Tested

| Check | Where |
| --- | --- |
| The model, the lints, dialog emission, reading order, id stability | `npm run evg:a11y:test` (36 checks) |
| The sheet's tree: virtualization, headers, caret focus, editing, modal focus, live region | `npm run datagrid:a11y:test` (46 checks) |
| The real DOM in a real browser: mirror present, canvas hidden, honest counts, one tab stop, activation moves the caret, a modal hides the sheet | `npm run datagrid:web:test` (34 checks, headless Chrome) |

### What is honestly not done

- **The cell editor is not a real `<input>` yet.** It is a focusable
  `role="textbox"` carrying the edit buffer, and keys reach the app exactly as
  they did before — so typing works and the field announces itself, but IME,
  dictation and braille *entry* need a real input, with the app still owning the
  buffer. That is phase 4 and it is the largest remaining browser-side gap.
- **No screen reader has run against it here.** This container has no GPU and no
  assistive technology; everything above was verified through the DOM the
  browser built. Whether it is *usable* is decided by someone using it.
- **Keyboard completeness is assumed, not audited.** The mirror faithfully
  exposes whatever the app can do; anything the app can only be told with a
  mouse is still unreachable, and no test currently asserts otherwise.
- **The hosted page** (`web/client.mjs`, the Node-server variant) has no mirror.
  Only the standalone build does.
- **Nothing is emitted for charts and images** beyond the panel they sit in, and
  a chart is a picture with no alternative text.

---

## 13. The native host (macOS)

The browser mirror proved the tree; the SDL2 + OpenGL build is the second
consumer of it, and the one that shows whether the seam was worth having. It
was: the app side did not change at all.

```text
GridApp ─┬─ EVGDisplayList ─► EvgGlPainter ─► OpenGL           the picture
         └─ a11yJson()     ─► dgfx_a11y.mm ─► NSAccessibility   what it means
```

Three files, mirroring the existing `dgfx_menu` pattern exactly:

| File | What |
| --- | --- |
| [`dgfx_a11y.h`](../datagrid/platform/sdl/dgfx_a11y.h) | Four C functions: is anything listening, publish a tree, take a press, reset |
| [`dgfx_a11y.mm`](../datagrid/platform/sdl/dgfx_a11y.mm) | macOS: `NSJSONSerialization` → one `NSAccessibilityElement` per node under the window's content view |
| [`dgfx_a11y_stub.cpp`](../datagrid/platform/sdl/dgfx_a11y_stub.cpp) | Everywhere else: says nobody is listening, so nothing is built |

Why macOS first, other than the machine being to hand: the build **already
links AppKit**, for the real `NSMenu` in `dgfx_menu.mm`. NSAccessibility is in
that same framework, so the platform half needed no new dependency — the file
next to it and one more line in `build.sh`.

Decisions worth naming, because each is a way this normally goes wrong:

- **The JSON is the interface.** The bridge takes the same string the browser
  page parses. That is one serialization for both hosts, and it means the
  native side has no opinion at all about what a spreadsheet is.
- **Elements are reused by node id**, as in the browser. This is what the stable
  ids buy: rebuilding the element VoiceOver is sitting on throws its cursor back
  to the top of the window, and nothing looks wrong on screen.
- **Nothing is built when nothing is listening.** `dgfx_a11y_active()` reads
  VoiceOver's own state (`NSWorkspace.isVoiceOverEnabled`), so an ordinary run
  pays nothing; `DGFX_A11Y=1` forces it on for Accessibility Inspector.
- **A press comes back as a point**, not a command, and the host presses the app
  there. Same decision as the browser, for the same reason: no second table of
  what each thing does, and a button that moved is still pressed correctly.
- **Focus is posted only when the app's focus moves.** Posting
  `NSAccessibilityFocusedUIElementChangedNotification` every frame interrupts
  the reader mid-sentence, over and over.
- **Coordinates are converted once**, in `screenRect`: the tree is in window
  points with y down, NSAccessibility wants screen points with y up. This is the
  line most likely to need adjusting on a multi-display setup.

### What is verified, and what is not

Running here (Linux container, no GPU, no macOS):

```bash
npm run datagrid:sdl        # Ranger → C++ → SDL2 + OpenGL binary
npm run datagrid:sdl:a11y   # …and print the tree it produces
```

- The whole app **compiles to C++ and links**, with the a11y model, the emission
  and the operators in it.
- The binary **runs** (`SDL_VIDEODRIVER=dummy`) and prints the same tree the
  browser gets — 541 lines of roles, names and rectangles — which is the claim
  "the model is portable" being checked rather than asserted.
- The **Linux stub path** builds and is what that run used.

Not verified: `dgfx_a11y.mm` itself. It has never been compiled — there is no
AppKit here — so expect a round of compiler errors on a Mac before it works,
and treat the VoiceOver behaviour as unproven until someone hears it.

### One thing this found

The native build was **broken before any of this**: `evggl_clip` and
`evggl_clip_off` were added to `evg_gl_native.h` but not to the mirrored
`extern "C"` block in `gfx_datagrid_sdl.rgr` that the generated C++ actually
sees, so the link failed on two symbols. Nobody noticed because the container
has no SDL2 and the build was never run here. Two declarations fixed it. It is
the same failure mode the display list exists to prevent, one layer down: two
copies of a list, and only one of them was updated.
