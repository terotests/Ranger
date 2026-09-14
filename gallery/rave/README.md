# Rave — from UI to running app

> **Rave by Ranger.** Design interfaces that already know how to work.

Rave is the editor after [Rafi](../figma/web/rafi/README.md). Rafi proved
that a Figma-style editor's chrome can be EVG elements laid out by
`EVGLayout` and checked headless in Node. Rave keeps that chrome and changes
what the things on the canvas *mean*: a Rave document is not a picture of an
application but the application's structure — routes, layouts, pages,
components and a stylesheet with real breakpoints — and `Design` and `Run`
are two tabs over the same document.

The plan is [`../PLAN_RAVE.md`](../PLAN_RAVE.md). Stages M0–M6 are done.

```bash
npm run rave:test     # the document, the runtime and the editor, headless (in the editor gate)
npm run rave:smoke    # the page, built the way the site builds it, driven in Node
npm run rave:web      # build and serve on http://127.0.0.1:8012/
npm run rave:export   # the app without the editor, in gallery/rave/export/
npm run rave:export:serve   # …served on http://127.0.0.1:8013/
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
| `src/RaveKit.rgr` | The Components pane: Container, Section, Heading, Text, Button, Link, Input, Card, Image, Navigation, Form, List, Select, Tabs, Dialog, Toggle — each a node tree in the document's own vocabulary; the last five are *instances* the runtime binds |
| `src/RaveBind.rgr` | Kit instances bound to `gallery/ui`'s controllers at run time — `DialogCtl`, `TabsCtl`, `SelectCtl`, `InputCtl`, `ToggleCtl` — one binding per viewport, their `UiRow`s written onto the elements so the a11y tree, the focus walk and the lint see them |
| `src/RaveFields.rgr` | Which kind of input each inspector field is — choice, length (number + unit) or text — and the number/unit parsing behind it |
| `src/RaveA11y.rgr` | Contrast (a real gamma curve, no `pow`), problems by node, tab order |
| `src/RavePatterns.rgr` | The six patterns as code — `Dashboard Shell` (sidebar / top bar / tabs / none), `Auth Flow`, `Settings Layout` (tabs), `Master / Detail`, `CRUD` (dialogs), `Marketing + App` — and `create(name, targets, auth, nav, start)`, the new-project sheet's answer |
| `src/RaveEditor.rgr` | The editor: Rafi's chrome over the runtime's scene. `press(id)`, `keyWith`, `typeChar` are the three doors everything goes through |
| `src/RaveExport.rgr` | The runtime and the patterns compiled without the editor: `open(json)`, `starter()` |
| `web/` | `index.html`, `main.js` (WebGL, pointer, keyboard, file dialog, download), `rave.css` (the chrome as an EVG sheet), `build.mjs`, `smoke.mjs` |
| `export/` | The exported application: `index.html`, `main.js` (one view the size of the window, the route in the hash), `build.mjs` (`--app FILE`, `--out DIR`), `smoke.mjs` — deployed at `/rave/app/` |
| `tests/RaveTest.rgr` | 474 checks: the pattern, the runtime, the guard, the keyboard, three widths, and the editor stage by stage |

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
- **New project is four answers, not a blank canvas.** `New` opens a sheet:
  the name, what it runs on (web / tablet / mobile become the viewports),
  whether it signs in, where the navigation goes, and what to start from —
  Dashboard Shell, Settings Layout, Master / Detail, CRUD, Marketing + App
  or an empty page. `Create` is a working application at every width chosen.
- **The kit runs.** Select, Tabs, Dialog, Toggle and every Input are
  `gallery/ui` controllers at run time (`RaveBind`): a dialog opens on its
  trigger with the document's children as its body, traps the focus and
  closes on Escape; tabs switch; a select opens and picks; an input takes
  typing. Each viewport carries its own instances — three viewports are
  three running copies. The controllers' own rows are written onto their
  elements, so the A11y tab, the lint and the tab order see them.
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

## Why each viewport is laid out on its own

An overlay — a dialog's scrim, a select's list — is placed by `EVGLayout`
against the layout's page. With all three viewports in one layout that page
was the scene, and a dialog opened on the phone was centred on the desk.
`RaveRuntime.rebuild` now lays each viewport out as its own page and moves
it into place with `moveSubtree`; the scene root only holds them. The
camera, the hit test and the selection boxes did not change.

## Export — the running app

`Save` writes `app.rave.json`. `npm run rave:export -- --app app.rave.json`
(or the deploy's `/rave/app/`) assembles the runtime without the editor,
the page host and that document into a static folder: it runs from any
static server, lays the page out at the window's real width so the
breakpoints are the browser's, keeps the route in `location.hash`, and the
mock session in memory. `rave:export:smoke` runs the M0 script against the
module the build wrote — the same `RaveRuntime` the editor's Run tab
drives, so what passed there passes here.

## Next

Stage M7, polish. Still open from M5: `ButtonCtl`, `SheetCtl`, `CommandCtl`
and `SidebarCtl` in `gallery/ui` with conformance specs.
