# EVG Inspector — devtools for a picture nobody can read

**Status:** design. Nothing in this file is built yet.
**License:** AGPL-3.0-or-later (Gallery).

An EVG app in a browser is one `<canvas>` element. Open the browser's dev
tools on it and you get exactly that: one element, no children, no styles, no
box model. The DOM painter is not much better — `gallery/evg/html/evg-html.js`
emits a flat pile of `<rect>` and `<path>` in paint order, with no names, no
nesting and no relation to the tree that produced them. You can see the
picture. You cannot ask it anything.

This is the design for asking. A panel that shows the element hierarchy, the
box model, the computed style with the rules that set it, and whatever a
component chose to say about itself — over a live app on either painter, or
over a frame captured from one and opened later with no app running at all.

---

## 1. What already comes out of an EVG app

Three channels, and every browser host in this repository uses all three.
`gallery/ui/demo/main.js` says it in its own header:

```
  displayListJson()   what to draw
  hitId(x, y)         what is under the pointer
  a11yJson()          what it MEANS
```

They share one property that is the whole reason this design is short: **each
is derived from the same laid-out element tree, on the same pass.** Nothing is
written twice. `EVGA11yFromTree` walks the tree the picture came from and says
so in its header — an app that describes its tree a second time has two
descriptions to keep in step, and the one nobody can see is the one that rots.

The inspector is the fourth channel and obeys the same rule:

```
                    EVGElement tree (laid out)
                             │
        ┌────────────┬───────┴───────┬──────────────┐
        ▼            ▼               ▼              ▼
  EVGDisplayList  EVGHitTest   EVGA11yFromTree   EVGInspect
   what to draw   what is      what it means     WHAT IT IS
                  under here                     (this file)
```

`EVGInspect` is a new module beside `EVGA11yFromTree`. It is a walk, not a
renderer, and it produces JSON. What it does **not** do is give the display
list a second opinion about geometry: every rectangle it reports is the one
`EVGLayout` computed and `EVGDisplayList` drew, read off the same fields.

### Why not just read the DOM on the SVG painter

Because then the inspector only works on one painter, only in a browser, and
only for what SVG happens to express. The point of the display-list seam
(`gl/README.md`) is that WebGL, SVG, SDL+GL, PDF, PNG and the Android/iOS
ports are the same picture. An inspector attached to one painter's output
inherits none of that. Attached to the tree, it works on all of them, and on
the native targets it works where a browser's dev tools cannot reach at all.

---

## 2. Node identity

Everything else depends on being able to name a node.

`EVGElement.id` is not it. It is optional, it is the app's own test id, it is
frequently `""`, and nothing enforces uniqueness — `hitId` returning `""` for
most of a page is normal today.

The identity is a **path**, assigned by the inspect walk and by nothing else:

```
  "0"        the root
  "0/3"      its fourth child
  "0/3/1"    that child's second child
  "0/3/k:share/1"    a child with `key` set uses the key instead of the index
```

Index segments where there is no key, the key where there is one. This is the
same trick `EVGComponentHost` already plays with `enter` / `leave` / `pathFor`,
for the same reason: a name that is unique among siblings composes into a name
that is unique in the tree, and no registry is needed to hand them out.

What the path costs is honest and worth stating: it is **structural**. Insert a
row above the selected one and `0/3/1` now names a different element. Keyed
children are immune, which is exactly the set of children that a list rebuild
reorders — so in practice the selection survives the rebuilds that matter and
breaks on the ones where "the same node" has no meaning anyway. The panel
handles the break the way it has to: if a path stops resolving, the selection
is dropped and said to be dropped, never silently re-pointed at whatever is
now at that index.

---

## 3. Attribution: which commands did this element produce

Hovering a node in the panel has to light up the pixels it drew, and clicking
the canvas has to select the node under the pointer. The second is a hit test
and already exists. The first is not derivable from anything today: a draw
command carries geometry and colour and no idea where it came from.

So `EVGDrawCmd` gains one field:

```ranger
def node:string ""      ; inspect path of the element that emitted this, or ""
```

emitted in `toJson` as `"n"` (a key the format does not use) and **only when
attribution is switched on**:

```ranger
def attribute:boolean false     ; on EVGDisplayList
```

Off, the JSON is byte-identical to today's — which is a gate, not a hope; see
§10. On, a list grows about twelve bytes per command and every painter ignores
the extra key it does not read.

The binary bridge gets the same treatment: `EVGSceneBinary` already pools
strings and refers to them by index, so a node id is **one more int per
command** in the record, pointing into the pool it already carries. The stride
changes; the shape does not.

This is worth more than the highlight it was added for. "Which element drew
these three commands" is the question behind the class of bug that
`gl/README.md` describes as five painters each deciding again what a box means
— border-radius working in PDF and silently not in PNG, because one painter
read `box.borderRadius` and another a stale `el.borderRadius`. With
attribution, the command that is wrong names the element that is wrong.

---

## 4. What a node carries

Two responses, because the tree is fetched whole and the detail is fetched for
one node at a time. A dashboard is 1 200 elements; sending every computed
property for every one of them is megabytes nobody will look at.

### 4.1 The tree

Flat array, parent by id, with the same key names and the same `gen` field
`EVGA11yTree.toJson` already writes — short keys, defaults omitted, one less
format for a host to learn.

```json
{
  "gen": 12,
  "root": "0",
  "w": 1240, "h": 560,
  "nodes": [
    {
      "id": "0/3/k:share",
      "p": "0/3",
      "tag": "div",
      "tid": "row-Share",
      "cls": "menu-row menu-row-sub",
      "comp": "menubar/menu:File/row:share",
      "role": "menuitem",
      "text": "Share",
      "box":  [220, 148, 180, 28],
      "in":   [232, 152, 156, 20],
      "m":    [0, 0, 2, 0],
      "b":    [1, 1, 1, 1],
      "pd":   [4, 12, 4, 12],
      "flags": ["hover", "overlay"],
      "cmds": [41, 42, 43],
      "kids": 2
    }
  ]
}
```

* `tid` is the element's own `EVGElement.id` — the app's test id, when it set
  one. It is not the identity; `id` is. Keeping both is the point: the panel
  can name a node the way the app names it, and `hitId` keeps meaning what
  it means today.
* `box` is the border box — `calculatedX/Y/Width/Height`, the rectangle the
  display list drew and the hit test tests.
* `in` is the content box — `calculatedInnerWidth/Height` and the padded
  origin. Those two plus `m` / `b` / `pd` are the four rings of the box-model
  diagram, and they come from `EVGBox` resolved to pixels, not from the
  authored units. The authored units are in the style detail, where the
  difference between `padding: 1em` and `12px` belongs.
* `comp` is `EVGComponentHost.pathFor` when a component built this subtree,
  `""` otherwise. It is what turns "some div" into "the row component of the
  File menu", and it is free: the host already keeps the path.
* `flags` is the small set of booleans that change how a node behaves rather
  than how it looks: `abs`, `overlay`, `clip`, `inline`, `hover`, `focus`,
  `pressed`, `hidden`. The state flags matter because a `:hover` rule that
  won is unreadable without knowing the element is hovered.
* `cmds` is present only when the list was built with attribution on.

`text` is the element's own text, truncated. A node is not a text dump.

### 4.2 The detail

```json
{
  "id": "0/3/k:share",
  "computed": {
    "background-color": "#2f2f33",
    "padding-left": "12px",
    "font-size": "13px",
    "width": "180px"
  },
  "cascade": [
    { "sel": "(override)", "decls": [ {"p":"background-color","v":"#ff0000","win":true} ] },
    { "sel": "(inline)",   "decls": [ {"p":"width","v":"180","win":true} ] },
    { "sel": ".menu-row:hover", "state": "hover", "on": true, "theme": "dark",
      "decls": [ {"p":"background-color","v":"#2f2f33","win":false} ] },
    { "sel": ".menu-row", "media": "(min-width: 900px)",
      "decls": [ {"p":"background-color","v":"#1c1c1f","win":false},
                 {"p":"padding-left","v":"12px","win":true} ] }
  ],
  "units": { "padding-left": "1em -> 12px", "width": "180 -> 180px" },
  "debug": [
    { "src": "MenuCtl", "rows": [
        {"k":"pendingMs","v":"100","t":"ms"},
        {"k":"openPath","v":"File","t":"enum"},
        {"k":"owner","v":"0/3","t":"ref"} ] }
  ]
}
```

`cascade` is in winning order, strongest first, and every declaration says
whether it won. That is the devtools view: the struck-through rules are the
ones with `"win": false`, and you can see at a glance that a hover rule is
sitting on top of the base one. `units` is the second half of the same
question — a value the sheet wrote as `1em` and the layout resolved to `12px`,
which is where `EVGUnit` bugs are visible and nowhere else.

---

## 5. Where the cascade provenance comes from

This is the only part of the design that is not a walk over existing data, so
it gets its own section.

`EVGStyleSheet` writes values into element fields and keeps no record of which
rule wrote them. Worse for a naive approach, the fast path does not even look
at rules at run time: `buildPlan` flattens every matching rule for a
(class, theme, state) key into two parallel arrays of names and values, caches
it by key, and `applyGroup` replays the flattened list. By the time a value
reaches an element, the rule is long gone, and reconstructing it afterwards by
re-matching selectors would be a second implementation of the cascade — the
exact kind of second opinion this design exists to avoid.

**Record it where the rule is in hand: in `buildPlan`.**

```ranger
def planRules:[int]     ; parallel to planNames/planValues: index into `rules`,
                        ; or -1 for a state-clear's initial value
```

One int per planned declaration, pushed in `planGroup` and `planStateClears`
beside the name and value they already push. Then:

* the cost is **per plan, not per element**. A 1 600-row table has a handful of
  plans and a hundred thousand applications of them; a design that traced at
  apply time would pay a hundred thousand times for the same answer.
* the order is already the cascade order, because `buildPlan` calls
  `planGroup` in the four passes that *are* the precedence — plain, themed,
  stateful, themed-and-stateful — and the last write wins. So "which
  declaration won" is not computed, it is read: the last entry for a property
  in the plan is the winner and the earlier ones are the overridden list. No
  specificity is recalculated anywhere, which means the panel cannot disagree
  with the engine about who won.
* it costs nothing when the inspector is off except the array itself, and it
  can be skipped entirely behind `def traceRules:boolean false` if even that
  is too much — but the array is small and always-on keeps one code path.

Two provenances are not in the plan and are added by the walk:

* **inline** — `EVGElement.inlineProps` already records exactly which
  properties the authoring layer set directly, because `applyDecls` needs it to
  know what not to overwrite. It is the "author wrote this on the element"
  channel, already there.
* **override** — the inspector's own edits, §7.

`applyToDirect` / `applyDecls`, the non-planned path, keeps the rule in hand
and can record it directly.

### What a rule can say about itself

`EVGStyleRule` today knows its `className`, `pseudo`, `theme`, `media` and
source `order`. That is enough to print `.menu-row:hover` and the media
condition, which is what the `sel` field above is: **reconstructed, not
stored**. It is not enough to jump to the line in the CSS file that wrote it.

Adding `def sourceLine:int 0` to `EVGStyleRule`, set by `addRulesIn` from the
offset it already has, is a dozen lines and turns the panel's rule header into
a link. It is phase 6 and not a prerequisite for anything.

---

## 6. Components sharing debug info

The picture explains the *what*. A component knows the *why*, and today it has
nowhere to say it: `MenuCtl.pendingTid` and the 100 ms submenu timer beside it
are invisible in every one of the four channels, and they are the state that
explains a submenu that will not close.

### The format

```ranger
class EVGDebugNote {
    def group:string ""     ; who is speaking — usually the class name
    def label:string ""     ; the field
    def value:string ""     ; already a string; formatting is the emitter's job
    def kind:string ""      ; how to render it, see below
}
```

`kind` is one of `text`, `num`, `px`, `ms`, `bool`, `enum`, `color`, `ref`.
Only two of them do anything beyond formatting:

* `color` gets a swatch,
* `ref` is **another node's inspect path**, and the panel makes it clickable.
  That is what makes "this controller owns that element" navigable, and it is
  the reason `kind` exists at all rather than everything being text.

### The sink

Notes are not a field on `EVGElement` — a 10 000-row grid should not carry an
empty array per row for a feature that is off. They live in one process-wide
sink, and an element points into it:

```ranger
def debugSlot:int (0 - 1)      ; on EVGElement: head of its note chain, or -1
```

```ranger
class EVGDebug {
    sfn enabled:boolean ()                 ; one static flag
    sfn beginPass:void ()                  ; clears the sink, like EVGComponentHost
    sfn note:void (el:EVGElement group:string label:string value:string kind:string)
}
```

`note` returns immediately when the flag is off, so the cost in a shipping
build is one boolean test at each call site and one int on each element. When
it is on, it pushes onto parallel arrays and links the note into the element's
chain, so the inspect walk joins notes to nodes in one pass with no lookup.

`beginPass` is called where `EVGComponentHost.beginPass` already is. Notes are
per frame, like everything else here; a note that survived a rebuild would be
describing a tree that no longer exists.

### The convention for a UI library

`gallery/ui` is the first user and sets the rule, because a debug channel with
no rule becomes a second log:

1. **One group per controller instance**, named for the class.
2. **A row is a reason, never a restatement.** `width: 180` is already in the
   box model and must not be a note. `pendingMs: 100` is not anywhere else and
   must be.
3. **The a11y trace is not duplicated.** Role, name, expanded, pressed,
   checked, selected, disabled are the twelve fields `npm run ui:report`
   already diffs against Radix, and they are in the a11y channel. A note that
   repeats one of them is two sources for one fact.
4. **`ref` to the element the controller owns**, always. That single row is
   what connects a controller to the picture.

So `MenuCtl` emits `openPath`, `pendingTid`, `pendingMs`, `keyboardMode`, and
a `ref` to its surface. `ToggleCtl` emits almost nothing, which is correct.

---

## 7. Editing

Read-only would already pay for itself, but the question the panel is opened
with is usually "what if this were 20px", and answering it by editing a `.rgr`
file and rebuilding is the loop the panel exists to shorten.

An edit is an **override**: a (path, property, value) triple in a table the
inspector owns.

```json
{"op": "set", "id": "0/3/k:share", "prop": "padding-left", "value": "24px", "scope": "sticky"}
```

Two scopes, and the difference is what happens on the next frame:

* **`once`** — write the value onto the element now and re-lay-out. It is gone
  the moment the cascade runs again, which on a tree-literal app is the next
  keystroke. Right for looking.
* **`sticky`** — keep it in the override table, and reapply the whole table
  **after** `applyTree` on every frame, in the walk `EVGInspect` is doing
  anyway. Right for working.

Sticky overrides are keyed on the inspect path, which is why they survive a
rebuild that the elements themselves do not: `gallery/ui`'s demos discard the
whole tree on every input and build a new one, and an edit written onto an
element would last one frame. An edit written against `0/3/k:share` lands on
whatever element that path names next time, which is the node the user was
looking at.

The override layer is also the export. "Copy as CSS" walks the table and
prints rules against each node's class list — a starting point for the sheet
edit the user is going to make anyway, not a claim to have made it.

Clearing is `{"op":"clear"}` for one node or all, and the panel shows the
count, because an override table you have forgotten about is a debugging
session that ends in confusion.

**What cannot be edited.** Anything the element does not own: text content
produced by a component, a value a controller writes every frame (it wins the
next frame, and the panel says so rather than fighting it), and structure. No
node insertion, no deletion, no reparenting. Those change what the app *is*,
and the app is the source of truth for that.

---

## 8. The overlay

The highlight is **not** in the display list. Putting it there would pollute
every screenshot, every parity run and every PDF taken while the panel is
open, and it would have to be implemented once per painter.

Instead `evg-inspect-overlay.js` positions plain DOM over the canvas: four
nested absolutely-positioned boxes for margin, border, padding and content,
in the same four colours a browser uses because there is no reason to invent
different ones, plus a label with the tag, class and pixel size. The
positioning arithmetic is the same scale-and-offset that `evg-a11y.js` already
does to put mirrored nodes at painted rectangles — one implementation, moved
into a shared helper.

It therefore works identically over the WebGL canvas and over the SVG painter's
`<svg>`, and it works on the offline bundle viewer where there is no app at
all. Native targets get the same overlay drawn by the port; on those, the
alternative — pushing overlay quads into the display list — is available and
acceptable, because a native screenshot harness is not running while somebody
has an inspector open.

---

## 9. Where the panel runs

Three modes, one panel, one protocol.

```
  ┌ in-page ────────────────────────────────────────────────┐
  │  ?inspect=1   panel is DOM beside the canvas             │
  │  direct calls, no serialisation, no server               │
  └──────────────────────────────────────────────────────────┘
  ┌ attached ───────────────────────────────────────────────┐
  │  panel in one page, app in another / on a device         │
  │  JSON over WebSocket on the preview server's /inspect    │
  │  the only mode that reaches SDL, Android, iOS            │
  └──────────────────────────────────────────────────────────┘
  ┌ offline ────────────────────────────────────────────────┐
  │  a .evginspect bundle, opened with no app running        │
  │  read-only: tree, styles, debug notes, the frame itself   │
  └──────────────────────────────────────────────────────────┘
```

**In-page** is the default and needs no infrastructure: `main.js` already holds
the app object and calls `displayListJson()` on it. The panel is a fourth
consumer of the same object.

**Attached** exists because the seam is portable and the panel should not have
to be. `EVGInspect` compiles to the same targets `EVGDisplayList` does — that
is the entire reason the display list has the shape it has — so a Ranger app
on a Raspberry Pi or an Android phone can answer the same four ops over a
socket, and the panel in a laptop browser cannot tell the difference. This is
the capability a browser's dev tools structurally cannot have.

**Offline** is what the user asked for as "just inspect the renderer's output".
A bundle is one JSON file:

```json
{ "evginspect": 1,
  "frame":  { "...": "the display list, with attribution" },
  "tree":   { "...": "the inspect tree" },
  "a11y":   { "...": "the a11y tree" },
  "styles": { "...": "per-node cascade for every node" },
  "png":    "data:image/png;base64,..." }
```

written by `npm run evg:inspect -- page.tsx out.evginspect` beside the existing
`npm run evg:displaylist`. It is a debugging artifact you can attach to a bug
report, and — the reason it will earn its keep — **a CI artifact.** When a
parity or screenshot gate fails, the run attaches the bundle for the failing
frame, and the person reading the failure a day later gets the tree, the
styles and the commands instead of two PNGs and a percentage.

### The protocol

Four ops in, JSON out, one version field, no streaming.

```
→ {"op":"tree",  "gen":12}
→ {"op":"node",  "id":"0/3/k:share", "want":["style","debug","units"]}
→ {"op":"hit",   "x":220, "y":140}          ← {"id":"0/3/k:share"}
→ {"op":"frame", "attribute":true}          ← the display list
→ {"op":"set" | "clear", ...}               ← §7
```

`gen` is a frame counter the app already bumps. The panel sends the generation
it last saw; a response with a different `gen` means the tree moved under it,
and the panel refetches rather than merging. There is no incremental tree
update in this design and there should not be one until a measurement asks for
it: a full tree of a 1 200-element dashboard is roughly 200 KB of JSON, built
by a walk that costs less than the layout that preceded it.

---

## 10. What it costs when it is off

Stated as a list because this is the part that gets checked, not assumed:

| Piece | Off | On |
| --- | --- | --- |
| `EVGDrawCmd.node` | one empty string per command; not written to JSON | ~12 bytes per command of JSON |
| `EVGSceneBinary` | stride unchanged | one int per command, into the existing string pool |
| `planRules` | one int per *planned declaration*, never per element | read by the walk |
| `EVGElement.debugSlot` | one int per element, never touched | a chain head |
| `EVGDebug.note` | one boolean test per call site | pushes onto the sink |
| `EVGInspect` walk | never runs | one tree walk per request, not per frame |
| Overlay, panel | not loaded | DOM over the canvas |

The line that has to hold: **`displayListJson()` with attribution off produces
the same bytes it produces today.** That is a test, not a claim — §11.

---

## 11. How it is checked

The repository's habit is that a second implementation of anything is
differenced against the first — `pptx:html:parity` renders every scene through
both painters and compares area, because two screenshots side by side is how a
claim gets believed and not how it gets checked. The inspector is a second
description of the same tree and gets the same treatment.

1. **Attribution gate.** Every command in an attributed list carries a node id
   that resolves in the inspect tree, and the command's rectangle lies within
   that node's border box. Two known exceptions, asserted as exceptions rather
   than allowed silently: a shadow extends past the box by its blur and offset,
   and a text run may overhang by the font's side bearings. Anything else
   escaping its box is a real bug and this is the first thing that would find
   it.
2. **Cascade gate.** For every node and every property in `computed`, the
   winning entry in `cascade` has the same value. This is the test that keeps
   the trace honest: it fails the moment a write path stops going through the
   plan, which is exactly the drift the trace is vulnerable to.
3. **Box-model gate.** `box`, `in`, `m`, `b`, `pd` are mutually consistent —
   content box plus padding plus border equals border box — on every node of
   every showcase page. Cheap, and it checks `EVGBox` resolution as a
   side effect.
4. **Painter agnosticism.** The panel is driven over the same frame through
   the WebGL host and the SVG host; the tree and the detail must be identical,
   because neither painter is consulted to produce them.
5. **Off-cost gate.** `displayListJson()` byte-compared with attribution off,
   before and after the change, over the showcase pages and the pptx deck.
6. **Debug-note lint.** Notes are checked against §6's rules the way
   `EVGA11yTree.lint` checks the a11y tree: a group that restates a box-model
   field, or a `ref` that does not resolve, is reported. An unchecked debug
   channel becomes a log within a month.

The headless runs go in beside the existing ones: `npm run evg:inspect:test`.

---

## 12. The runner: the same channels, with no browser

The four reads this design is built on — tree, style, hit, frame — are not
only what a panel needs. They are what a **test** needs, and an EVG app can be
driven through them in-process, with no browser, no page and no protocol.
That makes the headless runner a use of the inspector rather than a separate
project, and it is measured here rather than asserted:

```bash
npm run ui:runner:bench          # gallery/ui/bench/runner-vs-browser.mjs
```

Twenty tests, each a fresh instance or page, five interactions, five
assertions. The browser half drives Chromium over raw CDP against a page
holding one canvas and a ready flag — **no Playwright and no application**, so
every browser number below is generous to the browser.

```
  target                      start-up      per test      suite total
  ------------------------------------------------------------------
  EVG runner / MessageDemo        9.2 ms       4.2 ms         93 ms
  EVG runner / DashboardDemo     22.8 ms     107.1 ms       2 165 ms
  Chromium floor (no app)       251.0 ms      91.9 ms       2 090 ms

  per call
    browser        evaluate 1.0–1.4 ms · DOM query 2.4–3.4 ms
                   click 2.2–3.1 ms · screenshot 35–43 ms
    MessageDemo    boot 2.4 ms · frame 0.34 ms · a11y 0.14 ms · hit 0.04 ms
    DashboardDemo  boot 31 ms · frame 9.1 ms · a11y 8.8 ms · hit 11 ms
                   hit (cached) 0.007 ms
```

Four things are worth reading off that table, and the last one is the reason
this section is in the inspector's design and not in a benchmark README.

**The browser's per-test cost is a constant.** Roughly 90 ms of page creation,
navigation and protocol round trips before the app under test has done
anything, on an empty page. Nothing in a suite tunes it away, and a real
Playwright test adds its driver process, its selector engine, its actionability
polling and the app's own boot on top.

**An assertion is thirty to a hundred times cheaper in process.** 1.0–3.4 ms
for an `evaluate` or a DOM query, against 0.04–0.14 ms to read the hit test or
the accessible tree directly. A suite whose cost is dominated by assertions
rather than by page loads is where this compounds hardest.

**The runner has no screenshot problem.** A `Page.captureScreenshot` is 35–43 ms
and produces pixels that then have to be diffed with a tolerance. The display
list is already in hand, costs what the frame costs, and compares as
structure — a command that moved says which command moved. Pixels stay the
right tool for the two painters, and only for them (§11.4).

**The runner's per-test cost is your app's frame, and that is the finding.**
`MessageDemo` is 22× faster than the floor. `DashboardDemo` is *slower* than
it, and not because of the method: `hitId` costs 11 ms and `hitIdCached`
costs 0.007 ms, because the first re-renders the entire page before testing a
point and the second tests the layout that is already there. `a11yJson` does
the same rebuild. So a test that interacts and then makes three assertions
pays for four full frames when it needed one — a 1 400× difference on one of
them, sitting in an app that looks fine.

That is precisely the class of thing this design exists to make visible, and
it is an argument for building the panel first and the runner second: the
runner's speed is the app's frame cost, and the frame cost is what the
inspector shows you. A frame panel over `EVGStyleSheet`'s existing
`planHits` / `planMisses` and the layout counters is the natural next step
after the phase 2 in §13, and it is what turns "the dashboard suite is slow" into
"the dashboard rebuilds its table three times per assertion".

### What this is not

The repository already runs this split and names the two halves correctly:
`gallery/ui/conformance/oracle/*_oracle.mjs` drives **real Radix and Base UI in
a real browser** and writes a trace to JSON; `*_check.mjs` replays the same
questions against the Ranger controllers with no browser at all. The browser is
the **oracle**, run when the reference might have changed. The headless run is
the **gate**, run on every commit. `README.md` in `gallery/ui` says the browser
playground is "a lead, not the gate", and that sentence is the whole policy.

So the runner does not replace the browser. It replaces the *majority* of
tests that never needed one, and leaves the browser the ones that do:

* the painters — WebGL and SVG produce pixels and only a browser has them
  (`pptx:html:parity` already differences the two);
* real font rasterisation and platform text shaping;
* the input the platform owns — IME composition, clipboard, the text-input
  bridge driven through the DevTools protocol in `PLAN_INPUTS.md`;
* whatever a screen reader is actually handed, as opposed to what the a11y
  tree claims.

### A mocked backend costs nothing here

The reason e2e suites reach for a browser is usually not the browser. It is
that the app only assembles inside one. An EVG app under this runner is an
ordinary object in the test's own process, so a mock is an argument, not an
interception: no route table, no service worker, no port, no fixture server,
and no async at all if the mock is synchronous. `gallery/ui`'s checks already
construct the demo, hand it CSS and press it by id.

### Determinism, which may be worth more than the speed

There is nothing to wait for. No auto-wait, no retry, no polling for an
element to become actionable, no timeout to tune, and no frame budget to race.
An interaction returns when the frame is built, and the assertion reads that
frame. The flake class that makes browser suites expensive to own is not
reduced here, it is absent — and a suite that never flakes is one nobody has
to re-run, which is a second multiplier on top of the first.

## 13. Phases

Each phase is useful on its own; none of them requires the next.

| # | What | Roughly |
| --- | --- | --- |
| 1 | `EVGInspect` walk, node paths, tree + box model. In-page panel, overlay, hit-to-select. Read-only, both painters. | the spine |
| 2 | `planRules`, the cascade view, `units`. Gates 2 and 3. | the reason it is devtools and not a tree dump |
| 3 | Attribution on `EVGDrawCmd` + binary bridge, command list per node, gates 1 and 5. | |
| 4 | Overrides — `once` and `sticky`, copy-as-CSS. | the loop this exists to shorten |
| 5 | `EVGDebug` sink and note format; adopted across `gallery/ui` controllers; note lint. | |
| 6 | Offline bundle + `npm run evg:inspect`, CI attachment on gate failure. | the highest value per line of the six |
| 7 | Attached transport over the preview server's `/inspect`; SDL, Android and iOS answering the same ops. | |
| 8 | `EVGStyleRule.sourceLine`, and a source span from `JSXToEVG`, so a rule and a node both link to the line that wrote them. | |

Phase 6 is placed after 5 rather than last on purpose: a bundle is worth more
than a live panel to the person reading a CI failure tomorrow, and it needs
nothing from phase 7.

The runner of §12 is not a phase here, because it needs nothing from this file
that does not already exist — `gallery/ui`'s checks drive apps headless today.
What it needs is the frame panel that phase 2 makes possible: the runner's
speed is the app's frame cost, and until that is visible, a suite that is
slower than a browser looks like a verdict on the method. Redundant rebuilds
behind `hitId` and `a11yJson` are worth fixing on their own account and are
independent of everything above.

---

## 14. Non-goals

* **Not a profiler.** Frame timing is a real want and a different panel.
  `EVGStyleSheet` already counts `planHits` / `planMisses`, and `EVGDisplayList`
  has the numbers quoted in its own header — enough for that panel to be built
  later, on the same transport, without this one growing a timeline.
* **Not a time-travel debugger.** No frame history, no stepping backwards.
  The offline bundle is one frame and says so.
* **Not structural editing.** §7.
* **Not a replacement for the a11y mirror.** They answer different questions
  and the inspector reads the a11y tree rather than recomputing it — which
  incidentally makes `EVGA11yTree.lint`'s findings visible in a panel for the
  first time.
* **Not in the shipping bundle by default.** Everything here is behind a flag,
  and the flag defaults to off.

---

## 15. Open questions

* **Node paths across a keyed reorder.** `EVGReconcile` already decides which
  nodes are the same node across a rebuild. Should the inspect path be derived
  from the reconciler's identity instead of from structure, where a reconciler
  is in use? It would make selection survive more rebuilds. It would also make
  the path mean two different things depending on the app, and the panel would
  have no way to tell. Leaning towards structure-only, and letting keys carry
  the weight.
* **How much of the cascade to send.** The design sends the whole matched set
  per node on demand. A node matched by forty rules in a large sheet makes that
  response large. Truncating to the rules that touch a property with a winner
  is easy and loses the "this rule matched but set nothing you asked about"
  case, which is occasionally the answer.
* **Overrides and the plan cache.** A sticky override applied after
  `applyTree` does not invalidate the layout signature the plan cache compares.
  If an override touches a layout property, the cache must be told, or the
  frame keeps the old geometry. The mechanism exists (`planLayoutSig`); the
  wiring is phase 4's real work and the place a bug would hide.

---

## 16. Summary

The picture an EVG app draws already knows everything the panel needs. The
tree was laid out, the boxes were resolved, the rules were matched and a
component knew why it was doing what it did — and then all of it was thrown
away and only quads came out the other end.

This design keeps four of those things and throws away nothing else: a path
per node, a rule index per planned declaration, a node id per draw command,
and a note chain per element that opted in. Everything the panel shows is read
from what the engine decided, never recomputed beside it, which is the only
property that keeps an inspector true a year after it is written.
