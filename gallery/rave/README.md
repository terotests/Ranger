# Rave — from UI to running app

> **Rave by Ranger.** Design interfaces that already know how to work.

Rave is the editor after [Rafi](../figma/web/rafi/README.md). Rafi proved
that a Figma-style editor's chrome can be EVG elements laid out by
`EVGLayout` and checked headless in Node. Rave keeps that chrome and changes
what the things on the canvas *mean*: a Rave document is not a picture of an
application but the application's structure — routes, layouts, pages,
components and a stylesheet with real breakpoints — and `Design` and `Run`
are two tabs over the same document.

The plan is [`../PLAN_RAVE.md`](../PLAN_RAVE.md). Stages M0–M5 are done: the
acceptance test for M5 — the wizard, a sign-in from the keyboard on the phone
frame, the dashboard, settings, and every route linting clean at every width
— runs as one script in `rave:test`.

```bash
npm run rave:import gallery/figma/fixtures/health.fig   # read a .fig as an application
npm run rave:test     # the document, the runtime and the editor, headless (in the editor gate)
npm run rave:smoke    # the page, built the way the site builds it, driven in Node
npm run rave:web      # build and serve on http://127.0.0.1:8012/
```

Deployed at `/rave/`. **License:** AGPL-3.0-or-later (Gallery).

## What is where

| Path | What it is |
| --- | --- |
| `src/RaveDoc.rgr` | The document: `RaveApp` → routes, layouts, pages, components, `RaveNode`s with actions, `RaveRule`s per class and breakpoint; tree edits (`attach`, `detach`, `cloneNode`); `toJson` / `fromJson` |
| `src/RaveJson.rgr` | A small JSON value, parsed and written in Ranger, so `app.rave.json` opens on every target |
| `src/RaveCss.rgr` | The document's rules written out as the EVG stylesheet the engine parses; `@vars` for the palette, `@media` per breakpoint rule |
| `src/RaveBuild.rgr` | A route as EVG elements: the layout with the page spliced into its slot, conditional nodes by session, roles and focus from tags |
| `src/RaveRouter.rgr` | Path, history, and the one guard: a protected route reached logged out goes to the login route and comes back after `Login` |
| `src/RaveAuth.rgr` | The mock session: logged in or out, and who |
| `src/RaveRuntime.rgr` | One document, N views, one scene. Each view is a viewport; every view is the same route laid out at its own width, side by side in one tree. Answers `displayListJson`, `sceneListJson` (through a camera), `a11yJson`, `hitId`, `press`, `keyWith`, `lint` |
| `src/RaveOps.rgr` | Every edit as a `RaveOp` with its inverse, recorded in `OfficeHistory@(RaveOp)`; `RaveEdit` is the only thing that changes a document |
| `src/RaveImport.rgr` | A Figma file read as an application: auto-layout taken as it stands, everything else cut into flex, names and shapes read for meaning, agreeing frames lifted into a layout — and a report of every guess |
| `src/rave_import_cli.rgr` | `npm run rave:import <file.fig> [out.rave.json]` — the reading, then the result built at two widths with its rejections and lint |
| `src/RaveKit.rgr` | The Components pane: thirty-six entries in six groups (Layout, Text, Form, Data, Navigation, Overlay), each a node tree in the document's own vocabulary |
| `src/RaveFields.rgr` | Which kind of input each inspector field is — choice, length (number + unit) or text — and the number/unit parsing behind it |
| `src/RaveA11y.rgr` | Contrast (a real gamma curve, no `pow`), problems by node, tab order |
| `src/RavePatterns.rgr` | The six patterns as code — `Dashboard Shell`, `Auth Flow`, `Settings Layout`, `Master / Detail`, `CRUD`, `Marketing + App` — plus the palette every one of them shares and `fromChoices`, which is what the wizard's four answers turn into |
| `src/RaveEditor.rgr` | The editor: Rafi's chrome over the runtime's scene. `press(id)`, `keyWith`, `typeChar` are the three doors everything goes through |
| `web/` | `index.html`, `main.js` (WebGL, pointer, keyboard, file dialog, download), `rave.css` (the chrome as an EVG sheet), `build.mjs`, `smoke.mjs` |
| `tests/RaveTest.rgr` | 464 checks: the patterns, the runtime, the guard, the keyboard, three widths, the editor stage by stage, every kit entry at every width, and the ten-minute test end to end |

## The document

```
App → Routes → Pages → Layouts → Components → Elements
```

A node is a semantic element — `header`, `nav`, `main`, `button`, `input`,
`h1` — with a stable id. Its style is class rules on `n<id>`, one per
breakpoint condition, because an EVG sheet knows class selectors and nothing
else; that is a feature, since what an inspector shows is exactly what the
engine reads. Actions are data on the node (`click → navigate /settings`).
Auth is a document concept: a route is `protected`, a node is rendered only
when `authenticated` or `unauthenticated`, and `login` / `logout` are actions.

## The editor

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ● Rave  Acme          Design | Run        logged out  Light  Undo Redo … │
├───────────┬──────────────────────────────────────────────┬───────────────┤
│ Routes    │  desktop · 1440     tablet · 768   phone·390 │ Design CSS A11y│
│ Components│  ┌──────────────┐   ┌────────┐    ┌────┐    │ div  Cards     │
│ Layers    │  │ Header       │   │ Header │    │Head│    │ NODE  name …   │
│  ↑↓←→ Wrap│  │ Side │ Main  │   │ Side│Mn│    │Main│    │ BREAKPOINT     │
│  Dup Del  │  │      │ ▣ ▣ ▣ │   │     │▣▣│    │ ▣  │    │  base <768 …   │
│ ▾ Shell   │  └──────────────┘   └────────┘    └────┘    │ LAYOUT Grid    │
│   Header  │                                             │  Columns …     │
│   Body    │            [ − 50% + Fit | Tab order ]      │ RESPONSIVE     │
│    Sidebar│                                             │ ACTIONS        │
│    Main   │                                             │ ACCESSIBILITY  │
├───────────┴──────────────────────────────────────────────┴───────────────┤
│ Acme · design · /dashboard · views 3 · a11y 0 · rejected 0 · undo 4       │
└──────────────────────────────────────────────────────────────────────────┘
```

- **The stage is the app.** The three viewports are the runtime's own
  laid-out trees in one scene, drawn through a camera (`RaveRuntime.sceneListJson`);
  the chrome is painted over them with the clear switched off, exactly as
  Rafi paints its board. Drag to pan, scroll to zoom, `Fit` to see all three.
- **Selection is structural.** A node is picked on the stage or in Layers and
  boxed in every viewport. There are no resize handles: the gestures are
  `↑ ↓` (reorder), `← →` (out of / into a container), `Wrap`, `Dup`, `Del`,
  and pick-and-drop (`⋮` on a row, then click where it goes — a row, or a
  node on the stage). All of it is one undo stack.
- **Design fields write rules, and they are real inputs.** A field is a
  property of the node's rule at the chosen breakpoint chip, and it is one of
  three kinds (`RaveFields`):
  - a **choice** (`Layout`, `Direction`, `Justify`, `Position`, the action, a
    unit) opens its list under itself — `↑ ↓ Enter`, or a press — and never
    cycles on a click;
  - a **length** (`Gap`, `Width`, `Padding`, `Size`, …) is a number half and a
    unit half kept apart: the number is typed (letters are refused), stepped
    with `↑ ↓` (`Shift` ×10), nudged with `−` `+` or dragged on the track under
    it, and applied live; the unit is a list. A session of steps is one undo
    step; `Escape` puts the value back and leaves none;
  - everything else is a **text** field on `gallery/ui`'s `InputCtl`: caret,
    `Shift`+arrows and drag to select, `Ctrl+A`, `Ctrl`+arrows by word,
    click to place the caret, `Enter` commits.
  The **CSS** tab is the same rule as text, one editable line per declaration
  (the same text field), parsed through `EVGStyleSheet.parseDeclarations`.
- **Run** hands the stage to the runtime: presses navigate and sign in, `Tab`
  and `Enter` walk the active viewport, the strip shows the last key, and the
  `logged in / out` toggle and the theme picker sit in the top bar.
- **A11y** shows the active viewport's accessibility tree beside Layers and
  every problem — the engine's lint plus the contrast walk — as a row that
  selects the node; rows in Layers carry ⚠, the inspector repeats the message,
  and `Tab order` numbers the focusable nodes on the stage.

## What the engine's limits taught the first pattern

`RaveRuntime.layoutWarningCount` is every declaration `EVGReject` refused, and
the test treats one as a failure. The first run of the pattern failed on
exactly three: `border-top`, `border-right` and `border-bottom` are not EVG
properties (`border` is). `rafi.css` and `r5.css` both write them and both
lose them silently. Rave does not: the pattern was rewritten in the engine's
vocabulary, and the inspector offers only what the engine accepts.

Two defaults the base class `.rv` restores to CSS's answer: `flex-wrap:
nowrap` (EVG initialises to `wrap`) and `align-items: stretch` (EVG defaults
to `flex-start`).

## What M5 added to the document

Four patterns needed four things the document did not have, and each one is
small enough to state in a line:

- **Collections.** Named fields and rows keyed by `id`. A node with `repeat`
  draws its children once per row; the copies share the node's class — one
  rule, many rows — and take an element id of their own, `n40-2`, so a press
  lands on the third row rather than on the template.
- **Route parameters.** A path may carry `:name`. An exact path still wins
  over a pattern, so `/items/new` can sit beside `/items/:id`. A node with
  `source` is about the row the parameter names, and `{field}` in any text,
  label or alt under it is that row's value. A detail route opened by its
  pattern — which is what the editor does — previews the first row rather
  than showing a reader its own braces.
- **Overlays and toasts.** An overlay is on the page only while it is the one
  that is open, and an `a11yModal` while it is, so `EVGFocus` keeps the
  keyboard inside it. A toast is on the page only while the runtime has words
  for it. `open`, `close`, `create`, `remove` and `toast` are the actions.
- **Nested layouts.** A layout root may name the layout it sits inside. A
  route is built through the whole chain, outermost first, each one's slot
  holding the next — which is what makes `Settings Layout` a layout inside
  the shell rather than a page pretending to be one.

And the app's own fields take typing: a focused input takes the key before
the focus walk does, so a space in a sentence is a space and not a press.

**A frame is a viewport.** `position: fixed` used to resolve against the page,
and there was one page per layout — so on a stage showing one document at
three widths, all three modals landed on top of each other at the stage's
corner. `EVGElement.viewportRoot` (with `viewportX/Y/W/H`) says a box is a
viewport of its own; a fixed box resolves against the nearest one. Off — every
host with a single page — nothing changes.

## Importing a Figma file

`File → Import .fig`, or `npm run rave:import <file.fig> [out.rave.json]`.
A `.fig` is a tree of boxes at absolute coordinates; a Rave document is
routes, layouts and flex. `RaveImport` reads the file the way a person does,
and writes down what it guessed.

**The layout.** A frame with auto-layout already *is* a flex box, and is
taken as it stands — direction, gap, padding, justify, align, grow. A frame
without one is cut: find a horizontal line no child crosses, and what is
above and below it are two items of a column; no such line, try a vertical
one and get a row; neither, and the boxes really do overlap, so they stay
absolute and the report says which. A band holding more than one child
becomes a container of its own and is cut the other way — that is how a flat
pile becomes a tree.

Two rules keep the drawing honest: the gap is the *smallest* space between
two bands and anything more is that band's own margin, so nothing moves; and
a box as wide as the space it is in is written `100%` rather than the pixels
it happened to measure, which is the one substitution that makes an imported
screen reflow at all instead of being a photograph.

**The meaning.** Names first — a layer somebody called `Header` is a header,
and no arithmetic about where it sits beats that. Then shape:

| What it looks like | What it becomes |
| --- | --- |
| a rounded, filled box with one line of text, 24–72 tall | `button`, carrying the words |
| a bordered box with one line of text, 28–64 tall | `input`, the words becoming the placeholder |
| the top band of a screen, 24–160 tall | `header` |
| the bottom band of a screen | `footer` |
| a tall narrow column down the left of a screen | `aside` |
| a drawn box — border, or fill with a corner — holding more than one thing | `section` |
| a fill that is a picture | `img` |
| a text run | `h1`–`h4` or `p`, by size and weight |

A button drawn as an icon has no words, so it is named from its layer:
otherwise it is the one thing the accessibility lint will not forgive.

**The structure.** One top-level frame is one route. Where several frames
agree about a child — same name, same size, same left edge, and the same
distance from the top *or* from the bottom, because a tab bar sits at the
bottom of screens that are not the same height — that child is furniture,
and it is lifted into a layout with a slot where the screens differ. The
slot goes in as a box of its own *before* the cut runs, so it lands between
the header and the tab bar rather than after both of them. That is the
difference between importing five pictures and importing an application.

**What it will not do is invent.** A rule it writes is a measurement from
the file. Effects — shadows and blurs — and a border with a weight per side
have no EVG property, so they are reported per node rather than dropped in
silence. The Import tab in the editor is that report: the counts, then every
guess with its reason.

`gallery/figma/fixtures/health.fig` — three screens, 401 Figma nodes —
imports as three routes on one shared layout, 363 nodes, 79 containers
straight from the file's own auto-layout and 15 cut, with zero engine
rejections and zero accessibility problems at 1440 and at 390.

## Not in the kit yet, and why

The shadcn list has four entries Rave does not offer, because offering them
would mean drawing something that does not behave: **Popover**, **Tooltip**,
**HoverCard** and **Dropdown / Context menu** are all anchored to an element
rather than to the viewport, and the document has no way to say what a thing
is anchored to. `EVGLayout` can place an overlay against a box
(`overlaySide`), so this is a document-model gap, not an engine one. `Menu`
is in the kit as what it can honestly be today: a list with `menu` and
`menuitem` roles, in the flow.

## Next

M6, the export: `File → Export` writing the static app folder — the runtime,
the document and the host, with the route in `location.hash` — and the M0
script run against it. Then M7.
