# Rave — from UI to running app

> **Rave by Ranger.** Design interfaces that already know how to work.

Rave is the next editor after [`figma/web/rafi`](figma/web/rafi/README.md).
Rafi proved the chrome: a Figma-style editor — rails, layers, canvas,
inspector, toolbar — built entirely out of `EVGElement`s, laid out by
`EVGLayout`, painted by the WebGL painter, checked headless in Node. Its UI
paradigm is right. Its *objects* are wrong for what comes next: a Rafi layer
is a rectangle with fills, and nothing on the board can be run.

Rave keeps Rafi's chrome and changes what the things on the canvas mean.

```
Figma / Rafi:   File  → Page   → Frames  → Layers
Rave:           App   → Routes → Pages   → Layouts → Components → Elements
```

A Rave document is not a picture of an application. It *is* the application's
structure — routes, layouts, components, a stylesheet with real breakpoints —
and the editor is a visual way of editing it. `Design` and `Run` are two tabs
over the same document.

This plan settles what the document is, what the editor does with it, what is
reused from the gallery as it stands, and what has to be built. The order of
stages follows the product order: **the shell first, then auth and routes, then
one page at many widths, then accessibility, then the component kit, then
polish** — because the thing the first prototype has to prove is one sentence:

> *A working, responsive SaaS application skeleton — login → dashboard →
> settings, navigable, usable on mobile, usable from the keyboard — is faster
> to build in Rave than in Figma.*

Vector pens, gradients, effects and illustration are out of scope until that
sentence is true.

---

## 1. What the gallery already gives Rave

This is why Rave is a small project rather than a large one. Each row is
something Figma has to *approximate* and EVG simply *has*.

| Need | What exists | Where |
|---|---|---|
| Real layout | `display: flex` and `display: grid` with `gap`, `fr`, `repeat(N, …)`, `minmax`, `grid-template-areas`, wrap, align/justify, `%`/`vw`/`vh`/`em`/`rem`, min/max clamps, `position: absolute` and `fixed`, `overflow` clip + scroll | `evg/EVGLayout.rgr`, `evg/EVGGrid.rgr`, `evg/EVGUnit.rgr` |
| Real breakpoints | `@media (min-width / max-width / min-height / max-height / orientation / pointer)`, evaluated against a caller-stated viewport: `applyTreeIn(root theme w h coarse)` | `evg/EVGStyleSheet.rgr:1406` |
| Theme tokens | `@vars { --ink: #09090b }`, `@vars dark { … }`, `var(--x, fallback)`, `@vars` inside `@media` | `evg/EVGStyleSheet.rgr:918-1144` (note: `rafi/README.md` still says there are no custom properties — that predates `@vars`) |
| Interaction states | `:hover`, `:focus`, `:active`, `:disabled` read straight from element state | `evg/EVGStyleSheet.rgr:158` |
| Accessibility tree | ~50 ARIA roles, tri-state ARIA attributes, derived from the laid-out tree, with `lint()` | `evg/EVGA11yTree.rgr`, `evg/EVGA11yFromTree.rgr`, browser mirror `evg/gl/evg-a11y.js` |
| Keyboard | Tab order, arrow navigation, modal focus trap, focus ring | `evg/EVGFocus.rgr` |
| Hit testing in paint order | overlays and modal backdrops come out right for free | `evg/EVGHitTest.rgr` |
| Element inspector | structural paths, box-model overlay, computed style, per-element draw commands, **live CSS reload** | `evg/EVGInspect.rgr`, `evg/inspect/` |
| Controls | Input (real caret + selection + IME), Select, Tabs, Dialog, AlertDialog, Popover, Dropdown/Context Menu, Menubar, NavMenu, Table, Tree, Toast, Slider, Checkbox, Switch, RadioGroup, Toggle, Accordion, Collapsible, Breadcrumb, Calendar, ScrollArea, Sortable, Progress, Avatar, Label, Separator … measured against Radix (97.8 %) | `ui/src/*Ctl.rgr`, `ui/src/UiHost.rgr` |
| Undo | `OfficeHistory@(Op)` — transactions, trimming, adopted by four editors | `office/editor/OfficeHistory.rgr:131` |
| Editor chrome | rails, layer tree with folding, breadcrumbs, stage with camera and rulers, inspector tabs, toolbar, status strip; `press(id)` command dispatch; `keyWith`; two-pass board-then-chrome painting | `figma/web/rafi/RafiApp.rgr` |
| Browser host | WebGL painter, gestures (pan/pinch/wheel), hidden text input with IME, a11y DOM mirror, canvas text measurer, engine-in-a-worker | `evg/gl/*.js` |
| Build, serve, gate | `.rgr → .cjs → ES module` with the sheet inlined, a `smoke.mjs` that runs the whole editor in Node, and `gallery:editors:test` in CI | `figma/web/rafi/build.mjs`, `scripts/run-gallery-editor-tests.sh` |
| A whole app in one tab | `mfiles` — shell, views, navigation, selection, command registry, dialogs, toasts, over a mocked server | `mfiles/src/shell/MfShell.rgr` |

**What does not exist and Rave builds:** a document model for applications
(routes, layouts, components, variants), a router, an auth model, a
"structure-first" selection/insert/reorder editor (PLAN_EDITOR_KERNEL Stage D is
explicitly still open — Rave deliberately needs almost none of it, see §5.3),
the new-project wizard and application patterns, and a runtime export.

**Engine facts the editor must respect** (each one is a place where a naive
Figma-shaped inspector would lie):

- Selectors are **class-only**: `.a`, `.a, .b`, and `.theme-x .a`. No id,
  element, attribute or child selectors. Rave gives every node a generated
  class and writes all style as class rules (§3.4). This is a feature: what
  the inspector shows is exactly what the engine reads.
- `aspect-ratio`, `calc()`, `min-content`/`max-content`, `repeat(auto-fit|auto-fill, …)`,
  the per-side `border-top/right/bottom/left` shorthands (only `border` exists)
  and reversed flex directions are **rejected**, loudly, through `EVGReject`.
  Rave does not offer them in the inspector; it surfaces `warningAt(i)` in the
  status strip so a hand-typed rule that the engine drops is never silent.
- `align-items` defaults to `flex-start` and `flex-wrap` initialises to
  `wrap`, both unlike CSS. Rave's base sheet sets the CSS defaults explicitly
  on its root class so a designer's expectations hold (§3.4).
- A `@media` rule **does not apply at all** unless a viewport was stated. Every
  Rave render goes through `applyTreeIn`; the editor never calls `applyTree`.

---

## 2. The product, in one screen

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Rave   my-saas ▾        Design | Run        ⚲ logged out ▾   1440 1024 768 390 │
├────────────┬─────────────────────────────────────────────────┬───────────────┤
│ Routes     │                                                 │ Container     │
│  /         │   ┌───── 1440 ─────┐  ┌── 768 ──┐  ┌ 390 ┐      │ Layout  Grid  │
│  /login    │   │ Header         │  │ Header  │  │Head │      │ Columns       │
│  /dashboard│   │ Side │ Main    │  │ Side│Mn │  │ ≡   │      │  240px 1fr    │
│  /settings │   │      │         │  │     │   │  │Main │      │ Gap     24px  │
│  /profile  │   │      │         │  │     │   │  │     │      │ Max-w  1280px │
│            │   └────────────────┘  └─────────┘  └─────┘      │ ─────────────│
│ Components │                                                 │ Responsive    │
│  Button    │                                                 │ <768  cols: 1 │
│  Input     │                                                 │ ≥1024 cols: 3 │
│  Card      │                                                 │ ─────────────│
│  Sidebar … │                                                 │ CSS ▸         │
│            │                                                 │ Actions       │
│ Layers     │                                                 │  click →      │
│  ▾ Shell   │                                                 │   Navigate    │
│    Header  │                                                 │   /settings   │
│    Sidebar │                                                 │ ─────────────│
│    Main    │                                                 │ A11y  ✓ role  │
│            │                                                 │       ⚠ label │
├────────────┴─────────────────────────────────────────────────┴───────────────┤
│ /dashboard · 3 viewports · 41 nodes · 1 a11y warning · 0 engine rejections     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Three things differ from Rafi and they are the whole product:

1. **The left rail is Routes / Components / Layers**, not Pages / Layers.
2. **The stage shows one page at several widths at once.** They are not
   copies. They are the same tree, laid out four times with four viewports.
3. **`Design | Run`** is a top-level switch. In Run the buttons navigate, the
   login logs in, the dialog traps focus, Tab moves focus, and dragging the
   viewport edge reflows the grid.

---

## 3. The document

### 3.1 Shape

```
RaveApp
  name, targets {web, desktop, tablet, mobile}
  auth:      RaveAuthSpec   { enabled, loginRoute, afterLogin, mock user }
  nav:       sidebar | topbar | tabs | none
  breakpoints: [RaveBreakpoint] { name, minWidth }      e.g. sm 0 / md 768 / lg 1024 / xl 1440
  theme:     RaveTheme     { vars: [name → value], variants: light/dark → overrides }
  routes:    [RaveRoute]   { path, pageId, layoutId?, protected, title }
  layouts:   [RaveNode]    page shells with one Slot node (Header/Sidebar/Main/Footer)
  pages:     [RaveNode]    one tree per route target
  components:[RaveComponent] { name, root:RaveNode, variants:[name], defaultVariant, props }
  styles:    [RaveRule]    { cls, media?, decls:[RaveDecl] }
```

```
RaveNode
  id           stable int, never reused (the generated class is "n<id>")
  kind         element | instance | slot | conditional
  tag          semantic tag: div, header, nav, main, aside, footer, section,
               h1–h4, p, span, button, a, img, form, label, input, ul/li, table…
               — the tag chooses the default a11y role and the default keyboard
               behaviour, exactly as it does in HTML
  name         layer name, user-editable
  classes      user classes in addition to n<id>  (shared styles)
  props        inline overrides (rare; the inspector writes rules, not props)
  a11y         label, description, hidden, live, … (only what the tag does not imply)
  text         for text-bearing tags
  src / alt    for img
  actions      [RaveAction] on click / submit / change
  instanceOf   component id + variant, when kind == instance
  condition    authenticated | unauthenticated, when kind == conditional
  children     [RaveNode]
```

```
RaveAction
  Navigate(path)  Back  Login  Logout  OpenDialog(nodeId)  CloseDialog
  Toggle(nodeId)  SetState(nodeId, key, value)  Submit(formId → Navigate)
```

Serialised as JSON through `@serialize` — one `app.rave.json`. The stylesheet
is **not** a second file: `styles` is structured, and `RaveCss.emit(app)`
writes the EVG sheet text the engine parses. The CSS panel (§5.5) is a view of
one `RaveRule`, parsed back through `EVGStyleSheet.parseDeclarations`
(`evg/EVGStyleSheet.rgr:1268`) — there is one source of truth and it is the
document.

### 3.2 Routes, layouts, pages

A route points at a page and optionally a layout. A layout is a page tree with
exactly one `slot` node; rendering `/dashboard` means rendering the layout
tree with the page tree spliced into the slot. `Dashboard Shell` is a layout;
`/dashboard`, `/settings`, `/profile` are pages that share it. This is what
makes "change the sidebar once" true.

`protected: true` on a route makes the router redirect to `auth.loginRoute`
when not authenticated and back to the requested path after `Login`. Nothing
is drawn for this — it is a checkbox in the route inspector.

### 3.3 Auth as primitives

Five first-class things, all editor-visible, all mock-backed for the MVP:

| Primitive | What it is in the document | What Run does |
|---|---|---|
| `Protected Route` | `route.protected = true` | redirect to login, remember `returnTo` |
| `Login` | a `RaveAction` on a button or form | `RaveAuth.login()`; navigate to `returnTo` or `auth.afterLogin` |
| `Logout` | a `RaveAction` | `RaveAuth.logout()`; navigate to `/` |
| `Authenticated` | `kind: conditional, condition: authenticated` wrapper node | children rendered only when logged in |
| `Unauthenticated` | the same, inverted | |

The editor toolbar has one toggle, **logged in / logged out**, which sets the
same `RaveAuth` state the Run mode uses, so the designer sees both faces of a
page without leaving Design.

### 3.4 Styles

Every node's style is a set of class rules on `n<id>`, one per breakpoint
condition:

```css
@vars { --bg: #ffffff; --ink: #09090b; --muted: #71717a; --accent: #2563eb; --radius: 8px }
@vars dark { --bg: #09090b; --ink: #fafafa }

.rv { display: flex; flex-direction: column; flex-wrap: nowrap; align-items: stretch }

.n12 { display: grid; grid-template-columns: 240px 1fr; gap: 24px; width: 100%; max-width: 1280px }
@media (max-width: 767px) { .n12 { grid-template-columns: 1fr } }
@media (min-width: 1024px) { .n12 { grid-template-columns: 240px 1fr 320px } }
```

- `.rv` is on every node and restores CSS defaults the engine does not share
  (`flex-wrap: nowrap`, `align-items: stretch`).
- The **Responsive** section of the inspector is a list of `(breakpoint →
  overrides)` rows for the selected node. Adding a row adds a `@media` rule.
- **Shared styles** are user classes (`.card`, `.muted`) — a rule whose `cls`
  is not a node class. Applying one to a node appends it to `classes`.
- **Components** style their internals with `cmp-<name>` and
  `cmp-<name>-<variant>` classes; `variant: destructive` on a Button instance
  swaps `cmp-button-default` for `cmp-button-destructive`. States are the four
  pseudo-classes, so `.cmp-button:hover` is just a rule.
- Theme = `@vars` blocks; the theme picker is `applyTreeIn(root theme …)`.

Rafi's `rafi.css` remains the editor's own chrome sheet; the document sheet is
a second `EVGStyleSheet` applied to the viewport trees only. Two sheets, two
trees, no leakage.

---

## 4. The runtime — `RaveRuntime`

The runtime is what makes Run work, and it is also the exported app (§7).
It is deliberately a headless Ranger object with the same seams Rafi and
`ui/demo` already have, so the smoke test drives it with no browser.

```
RaveRuntime
  load(app:RaveApp)
  router:  RaveRouter   { path, history, navigate(path), back(), guard(route) }
  auth:    RaveAuth     { loggedIn, user, login(), logout() }
  build(viewport w h coarse) → RaveView
      resolves route → layout ⊕ page → EVGElement tree (via RaveBuild)
      instantiates components: a Button instance becomes a focusable button
      element with role button; an Input instance becomes a UiHost InputCtl;
      Select/Tabs/Dialog/Menu/Table become their *Ctl; Card/Container/Header
      are plain elements
      applies the document sheet with applyTreeIn(root theme w h coarse)
      lays out, and answers displayListJson / hitId / a11yJson / press / keyWith
  press(id) → dispatches the node's RaveAction, then rebuilds the affected views
  keyWith(k shift ctrl) → EVGFocus.key first; Enter/Space activate; Escape closes
```

One `RaveRuntime` serves N `RaveView`s — one per viewport on the stage — from
one document. A `Navigate` changes `router.path` and every view rebuilds. This
is the "one page, many viewports" promise implemented literally: there is one
tree description and N laid-out instances.

`RaveBuild` is the only place that knows how a `RaveNode` becomes elements and
controls. `ui/src/UiHost.rgr` already has the factories (`addInput`, `addSelect`,
`addTabs`, `addDialog`, `addDropdownMenu`, `addTable`, `addNavMenu`, …);
`RaveBuild` calls them with the node's id as the `tid` so `press(id)` and
`hitId` speak the document's ids.

Missing from `gallery/ui` and added there, not in Rave, so `ui:test` covers
them: **`ButtonCtl`** (there is no button control today — buttons are ad-hoc
elements), **`CardCtl`** (trivial), **`SheetCtl`** (a Dialog that slides from
an edge — `DialogCtl` + one class), **`CommandCtl`** (Popover + Input + filtered
list — `MenuCtl` and `InputCtl` exist), **`SidebarCtl`** (`NavMenuCtl` in a
column with collapse).

---

## 5. The editor — `RaveApp`

Modelled on `RafiApp` and reusing its shape: one class, `press(id)` as the
command surface, `rebuild()` on `dirty`, two display lists painted board then
chrome, `a11yJson` for the chrome so the *editor itself* is accessible.

### 5.1 New project

`File → New` is one sheet, not a blank canvas:

```
Targets      [x] Web  [ ] Desktop  [x] Tablet  [x] Mobile
Sign-in      (•) Yes — login page and protected routes   ( ) No
Navigation   (•) Sidebar   ( ) Top bar   ( ) Tabs   ( ) None
Start from   (•) Dashboard Shell  ( ) Marketing + App  ( ) Master/Detail  ( ) CRUD  ( ) Empty
```

The answer is a `RaveApp` produced by `RavePatterns` (§6): routes, a layout,
pages with a header, sidebar, main and footer, breakpoints chosen from the
targets, a login route wired to a protected dashboard. The first thing the
user sees is a working application at three widths.

### 5.2 Left rail: Routes / Components / Layers

- **Routes.** The list of paths. Select one to put its page on the stage.
  `+` adds a route (path, title, layout, protected). The route inspector shows
  the same fields. A route-graph view (which buttons navigate where) is a
  later, derived diagram — it is computed from actions, never drawn by hand.
- **Components.** The kit (§6.2) plus the document's own components. Drag
  onto the stage or the layer tree to insert an instance.
- **Layers.** The tree of the current page, spliced into its layout, with the
  layout's nodes shown dimmed and locked (edit the layout by opening it). Same
  folding, breadcrumbs and `tree:<id>` / `fold:<id>` / `into:<id>` ids as
  Rafi.

### 5.3 The stage and what selection means here

The stage is Rafi's stage: camera, rulers, pan, zoom, fit. What is on it is
N viewport frames, each a `RaveView`, labelled with its width and named
breakpoint, laid out left to right. The viewport set is the project's
breakpoints by default; any frame's right edge can be dragged and the layout
reflows live, which is the demonstration that this is one responsive page.

**Selection is structural.** Clicking a node in any viewport selects the
`RaveNode`, and the same node highlights in every viewport and in Layers. The
selection chrome is a box with the node's name and its layout role
(`grid item 2/3`, `flex child`), not eight resize handles.

Because layout is flex/grid, the MVP has **no free transforms**:

| Gesture | Meaning |
|---|---|
| drag a node within its parent | reorder (insertion line between siblings) |
| drag a node onto another container | reparent |
| drag from Components | insert at the indicated slot |
| drag a flex/grid child's edge | edits `width` / `flex-basis` / `grid-column: span` — a style edit, snapped to the parent's tracks |
| ⌫ | delete; ⌘D duplicate; ⌘G wrap selection in a new container |

Only nodes whose own rule says `position: absolute` or `fixed` get x/y
handles. This is the reason Rave can skip PLAN_EDITOR_KERNEL Stage D
(selection, snap, align, distribute, z-order): a structure editor does not
need pixel manipulation to be complete, and what it does need — reorder,
reparent, insert — is what `SortableCtl` and `TreeCtl` already do for lists.

### 5.4 Inspector: Design tab

Figma-shaped on purpose, but every field is a CSS property of the selected
node's rule at the *current breakpoint* (a breakpoint picker at the top of
the panel, defaulting to "base"):

```
Layout      Flex ▾ / Grid ▾ / Block      direction  wrap  justify  align
Grid        columns [240px 1fr]  rows [auto]  areas ▸  auto-flow
Spacing     gap  row-gap  column-gap     padding (4)   margin (4)
Size        width  height  min/max       (px % vw vh em rem fill fit-content)
Position    relative ▾ / absolute / fixed   inset  z
Fill        background-color   image
Border      color  width  radius (4)
Text        font  size  weight  line-height  color  align
Overflow    visible / clip / scroll
Responsive  base ▸  <768: columns 1  ▸  ≥1024: columns 3   [+ breakpoint]
Actions     click → Navigate /settings          [+ action]
A11y        role (from tag)  label  description  hidden   ⚠ warnings
```

Setting a field with the picker on `md` writes into the `@media
(min-width: 768px)` rule. The Responsive section lists every override the node
has, so the whole responsive story of one node is visible in one place.

Fields are real inputs (`RaveFields`, done with M2): a **choice** opens its
list and never cycles on a click; a **length** is a number half and a unit
half kept apart, stepped with the arrows or a track and applied live as one
undo step; a **text** field is `gallery/ui`'s `InputCtl` as the model —
caret, selection by keys and by drag, `Ctrl+A`, word motion — drawn by the
editor from the same measurement the painter uses.

### 5.5 Inspector: CSS tab

The same node, as text:

```css
.n12 {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1280px;
}
@media (max-width: 767px) { .n12 { grid-template-columns: 1fr } }
```

Editable. On blur the block is parsed with `parseDeclarations`; unknown or
rejected properties are marked inline from `EVGReject`, not silently dropped.
Design and CSS edit the same `RaveRule`, and switching tabs is free.

### 5.6 Inspector: A11y

A fourth rail tab, **Accessibility**, shows `EVGA11yFromTree` for the current
viewport as a tree beside Layers, and `EVGA11yTree.lint()` findings as
warnings on nodes: input without label, image without alt, button without a
name, dialog without a modal flag, heading level jumps, text contrast below
4.5:1 (the display-list contrast check `ui:a11y` already runs). The structure
guarantees the easy half — a Button *is* role `button`, a Dialog *does* trap
focus through `EVGFocus` — and the lint reports the half that needs a human.

### 5.7 Run

`Run` hides the rails, keeps the stage, and hands pointer and keyboard to
`RaveRuntime` instead of the selection tool. The viewport frames stay: the
same three widths, all live, all navigating together. A **Run** toolbar
carries `logged in / logged out`, the current path with `←`, a theme
picker, and a **keyboard** badge that lights when a key event was handled by
`EVGFocus` so keyboard reachability is visible while testing.

### 5.8 Undo

`OfficeHistory@(RaveOp)` — one op type per document mutation (insert, delete,
move, setRule, setDecl, setAction, setRoute…), each holding its inverse.
Transactions wrap drags. Route and style edits are undoable together with tree
edits, which is what a designer expects and what a separate CSS file would
break.

---

## 6. Patterns and the kit

### 6.1 Application patterns — `RavePatterns.rgr`

Ranger functions that return a `RaveApp` (or a fragment inserted into one):

| Pattern | What it produces |
|---|---|
| `Dashboard Shell` | layout: header + sidebar + main + footer; routes `/`, `/dashboard`, `/settings`, `/profile`; sidebar collapses to a top bar under `md`. `applyNav` then moves that one `nav` node where the wizard's answer says — the header for a top bar, a bar above the footer for tabs, away for none — rather than building a second one |
| `Auth Flow` | `/login`, `/signup`, `/forgot`; `Login` action; all other routes protected |
| `Settings Layout` | left tab list + right form area; stacks under `md` |
| `Master / Detail` | list route + `/items/:id` route; two columns, one column on mobile with `Back` |
| `CRUD` | Master/Detail + create dialog + delete AlertDialog + toast |
| `Marketing + App` | public `/`, `/pricing` on a top-bar layout; `/app/*` on Dashboard Shell |

Patterns compose: `Marketing + App` is `Auth Flow` ⊕ `Dashboard Shell` under
`/app`. They are code, not a template format, so they are tested like code:
`rave:test` instantiates each one, runs it headless, navigates every route
logged in and out, and lints every page at every breakpoint.

### 6.2 Component kit

shadcn/ui's list, mapped to what exists:

| Rave component | Backed by | Variants / notes |
|---|---|---|
| Button | **new** `ButtonCtl` | default, secondary, outline, ghost, destructive, link; sizes |
| Input, Textarea | `InputCtl` | with `LabelCtl`; required/invalid/disabled |
| Select | `SelectCtl` | |
| Checkbox, Switch, RadioGroup, Slider | existing | |
| Tabs | `TabsCtl` | |
| Dialog, AlertDialog | existing | focus trap via `EVGFocus` |
| Sheet | **new** `SheetCtl` | Dialog + side |
| Dropdown Menu, Context Menu, Menubar | `MenuCtl`, `MenubarCtl` | |
| Popover, Tooltip, HoverCard | existing | |
| Table | `TableCtl` | |
| Card | **new** `CardCtl` | header / content / footer slots |
| Sidebar | **new** `SidebarCtl` | `NavMenuCtl` + collapse + mobile sheet |
| Command Menu | **new** `CommandCtl` | ⌘K |
| Breadcrumb, Accordion, Collapsible, Progress, Avatar, Separator, Toast, Calendar, DateField, ScrollArea | existing | |

Every kit component is a `RaveComponent` whose root is a normal node tree with
`cmp-*` classes, so a user can *Detach instance* and edit the copy, or *Create
component* from any selection. That is the one Figma habit worth keeping.

---

## 7. Export — the running app

`File → Export` writes a folder that is the application without the editor:

```
app/
  index.html          canvas + a11y mirror + text input (same as rafi/index.html)
  app.rave.json       the document
  generated.js        RaveRuntime + gallery/ui + EVG, compiled — no RaveApp
  generated-host.js   evg-webgl, evg-a11y, evg-textinput, evg-gestures, evg-measure
```

It runs from a static server, honours the browser's real width (so the
responsive rules are exercised by the window, not by a frame), keeps the
route in `location.hash`, and the mock auth in memory. That is the delivered
promise: the thing that was designed is the thing that runs.

Later exports are compilations of the same document — HTML+CSS, Ranger code for
a native EVG host — and they are out of scope until §8 M6.

### 7.1 The document as text

`RaveText` is `app.rave.json` without the ids: indentation for the tree, a
node's rule inline, `@md` for the same node at another width, `->` for an
action. It exists because the AI menu needs a format a model can be told
about in a paragraph and write without a schema — and because a format with
no ids in it is the strongest round-trip test the document has.

### 7.2 The other direction: import

Export is the promise; import is what makes the promise reachable from work
that already exists. `RaveImport` reads a `.fig` into the same `RaveApp` the
patterns build — see `rave/README.md` for the cut, the guesses and the
shared-layout rule. It is deliberately upstream of M6: a document that came
out of somebody's Figma file and a document that came out of the wizard are
the same document, and everything after this point treats them the same.

---

## 8. Stages

Every stage ends with a headless test in `rave:test`, and `rave:test` joins
`gallery:editors:test` at M1 so nothing after that can regress the whole.
The acceptance test for the project is **M5**: it is the sentence at the top,
written as a smoke script.

| Stage | Delivers | Test |
|---|---|---|
| **M0 Document + runtime, headless** ✅ | `RaveDoc`, `RaveCss.emit`, `RaveBuild`, `RaveRouter`, `RaveAuth`, `RaveRuntime`; `Dashboard Shell` + `Auth Flow` patterns — `gallery/rave/src`, `rave:test` in the editor gate | build the pattern; `press("login")` lands on `/dashboard`; `/settings` unauthenticated redirects to `/login` and back; a11y lint is clean; `grid-template-columns` differs between 1440 and 390 |
| **M1 Editor, read-only** ✅ | `RaveEditor` chrome (Rafi's, re-labelled), Routes/Components/Layers rail, three viewports on the stage from one scene (`RaveRuntime.sceneListJson`), Design inspector *reading* the node, status strip with engine rejections; `rave:web`, `rave:smoke`, `build.mjs`, deploy at `/rave/` | rails, tree, frames and inspector values asserted from `displayListJson` / `treeIdsJson` the way `rafi/smoke.mjs` does |
| **M2 Editing** ✅ | insert from Components (`RaveKit`), reorder / reparent by pick-and-drop on the stage and in Layers plus ↑ ↓ ← →, delete / duplicate / wrap, Design fields and cycle fields write rules, breakpoint chips + Responsive rows, CSS tab parsed through `parseDeclarations`, undo/redo over `OfficeHistory@(RaveOp)`, save/open `app.rave.json` (`RaveJson`) | every mutation round-trips through undo; a rule edited in CSS shows in Design and vice versa |
| **M3 Run** ✅ | `Design \| Run` switch, stage presses and keys go to the runtime's active view, logged-in toggle, last-key badge in the strip, theme picker | the M0 script, driven through the editor's `press`/`keyWith`, with the stage in Run |
| **M4 Accessibility** ✅ | A11y inspector tab (the active view's tree beside Layers, every problem clickable), ⚠ on layer rows, `RaveA11y.contrast` with a real gamma curve, tab-order badges on the stage | a pattern with a deliberately unlabelled input reports exactly one warning; Tab from the login field reaches the login button |
| **M5 New project + patterns + kit** ✅ | the wizard (`File → New` as a sheet, four questions, `RavePatterns.fromChoices` as the answer); all six patterns; the kit table complete — thirty-six entries in six groups. The document gained what the patterns needed: collections with `repeat`, route parameters with `source`/`{field}`, overlays and toasts, nested layouts, and typing into the app's own inputs. The engine gained `viewportRoot`, so `fixed` means the frame it is in rather than the stage. The four anchored controls (Popover, Tooltip, HoverCard, Dropdown/Context menu) wait on an anchor in the document model — see `rave/README.md` | **the ten-minute test**: wizard → login → dashboard → settings → mobile → keyboard, as one script, plus every kit entry dropped and linted at three widths |
| **M5.5 Import** ✅ | `RaveImport`: a `.fig` read as an application — auto-layout taken as it stands, everything else cut into rows and columns by an XY cut, names and shapes read for meaning, agreeing frames lifted into a shared layout, and a report of every guess. `File → Import .fig` in the editor with an Import tab, `npm run rave:import` on the command line | `health.fig` imports as three routes on one layout with zero engine rejections and zero a11y problems at 1440 and 390; the cut, the guesses and the shared-layout rule each checked on a scene built for them |
| **M5.6 The AI menu** ✅ | `RaveText`: the document as lines with no ids in them, written and read by one grammar, so a document survives a round trip through something that has never seen this codebase. `AI…` writes a prompt — the format, what the engine will not accept, the thing as it stands, the ask — and reads back an answer over the document, the page or the selected node. No service is called: a person is the wire | a document written out, read back and written again is the same text; an answer over a node lands as one undo step with its shared classes merged; an answer that is not the format is refused whole, with the line number |
| **M6 Export** | `File → Export`, the static app folder, `location.hash` routing | export a pattern, serve it, run the M0 script against `generated.js` |
| **M7 Polish** | gradients, shadows, effects, image fills, component property panels, route graph diagram, dark theme editing | — |

Nothing in M0–M6 draws a vector path.

---

## 9. Where it lives

```
gallery/rave/
  README.md
  src/
    RaveDoc.rgr        RaveApp, RaveRoute, RaveNode, RaveAction, RaveRule, @serialize
    RaveCss.rgr        rules → EVG stylesheet text; parseDeclarations back
    RaveBuild.rgr      RaveNode → EVGElement / UiHost controls, layout ⊕ page splicing
    RaveRouter.rgr     path, history, guards
    RaveAuth.rgr       mock auth
    RaveRuntime.rgr    N views over one document; press / keyWith / displayListJson / a11yJson
    RavePatterns.rgr   Dashboard Shell, Auth Flow, Settings, Master/Detail, CRUD, Marketing + App
    RaveOps.rgr        RaveOp + OfficeHistory@(RaveOp)
    RaveApp.rgr        the editor (from RafiApp)
    RaveTest.rgr       headless suite
  web/
    index.html  main.js  build.mjs  smoke.mjs  rave.css   (from figma/web/rafi)
  export/
    index.html  main.js                                   (the runtime host, §7)
```

Kit additions go to `gallery/ui/src/` with specs in `gallery/ui/tests/`.
`gallery/figma` is untouched: Rafi stays as the reference editor over Figma
files, and `/rafi/` keeps deploying.

npm scripts follow Rafi's exactly: `rave:build`, `rave:page`, `rave:web`
(port 8012), `rave:test`, plus `rave:export`.

---

## 10. Decisions taken here, so they are not re-opened

- **Structure over pixels.** No free transforms in the MVP. Position is a
  style property; reorder and reparent are the gestures.
- **Class-per-node styling.** Every node is `.rv.n<id>` and all style is
  rules. Inline props exist in the model for imports but the inspector never
  writes them.
- **One document, N renders.** Viewports are not frames and are never copied.
- **Actions, not arrows.** Navigation is an action on a node; the graph is
  derived.
- **Auth is a document concept.** Protected routes and `Authenticated`
  wrappers are nodes and flags, not pictures of a login page.
- **The runtime is the export.** Run inside the editor and the exported app
  execute the same `RaveRuntime` on the same `app.rave.json`.
- **Kit controls live in `gallery/ui`.** Rave has no private widgets;
  everything it places is measured by `ui:test` and the Radix conformance run.
- **The engine's limits are the inspector's limits.** What EVG rejects, Rave
  does not offer; what EVG drops, Rave reports.
