---
name: rave
description: Design and change a Rave application from files on disk — a responsive, routed, accessible app that really runs, written as HTML-shaped markup and checked without a browser. Use when asked to make, restyle, extend or fix a Rave document (.rave / app.rave.json), when a `rave check` reports rejections or accessibility problems, or when someone wants a UI designed that is an application rather than a picture of one.
---

# Rave, from the files

A Rave document **is** an application: routes, layouts, pages, and a stylesheet
with real breakpoints, drawn by EVG. A `.rave` file is that document as
HTML-shaped markup with no ids in it, so it can be written and edited like any
other source file.

```
npm run rave -- new app.rave --name "Acme" --start crud --nav sidebar
npm run rave -- check app.rave        # the loop: exit 0 or the reasons why not
npm run rave -- shot app.rave --width 390   # paint a route and look at it
npm run rave -- measure app.rave --width 390  # overflow, overlap, off the page
npm run rave -- outline app.rave --width 390  # the laid-out tree, one line per node
npm run rave -- serve app.rave        # the editor at :8012, bound to the file
npm run rave -- spec                  # the format in full — read this before writing one
```

From outside this repository the same thing is `node <ranger>/gallery/rave/cli.mjs …`.
If the host has not loaded `ranger-design` (a cloud agent often has not), this
CLI *is* the MCP: every tool is one of these commands.

There is also an MCP server over the same commands — `ranger-design`, declared
in this repository's `.mcp.json` and `.cursor/mcp.json` — with
`rave_spec`, `rave_new`, `rave_check`, `rave_read`, `rave_write`, `rave_shot`,
`rave_measure`, `rave_outline`, `figma_check`, `figma_markup` and `figma_tree`. Use whichever door is in front
of you; they do the same work, and `rave_write` runs the check on what it
wrote, so a document that does not hold up says so in the same answer.

## The loop

1. **`rave spec`** once, if you have not written this markup before. It lists
   every element, every attribute, and — the part that matters — the CSS the
   engine understands and the CSS it does not.
2. Edit the `.rave` file.
3. **`rave check <file>`**. It parses, then builds every route at every width
   the project targets, and prints three kinds of thing:
   - `line 12: …` a parse error, with the line;
   - `/dashboard @390 rejected: unknown property: aspect-ratio` a declaration
     the engine refused — it drew nothing, silently, and this is the only place
     that says so;
   - `/settings @768 a11y: n14: focusable with no accessible name` an
     accessibility problem.
   It ends with `RAVE OK` or `RAVE FAIL n`, and exits non-zero on failure.
4. Fix what it named. Go back to 3.
5. **`rave shot`** and **`rave measure`** on a route at a width. `check` is CSS
   and accessibility; `measure` is boxes — overflow, overlap, off the page —
   and `shot` now prints that measure under the picture. `rave outline` is the
   same tree, one line per node, with the addresses the findings speak in.

Do not declare a design finished on a `RAVE FAIL`. Every line it prints is
something a person would have found by looking.

## What the markup looks like

```html
<app name="Acme" targets="web tablet mobile" nav="sidebar" auth="on" login="/login" after="/dashboard"/>
<breakpoint name="md" min="768"/>
<var name="ink" value="#09090b"/>
<style class="card">background-color: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px</style>

<layout name="Shell" style="width: 100%; height: 100%">
  <header label="Header" style="height: 56px; padding: 0 24px; flex-direction: row; align-items: center">
    <span class="brand">Acme</span>
  </header>
  <main label="Main" style="padding: 24px; gap: 24px"><slot/></main>
</layout>

<page name="Dashboard" style="gap: 24px">
  <h1 class="title">Dashboard</h1>
  <div name="Cards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">
    <media below="md" style="grid-template-columns: 1fr"/>
    <section class="card" label="Revenue"><h3>Revenue</h3></section>
  </div>
  <button class="btn">Go to settings<on click="navigate" arg="/settings"/></button>
</page>

<route path="/dashboard" title="Dashboard" page="Dashboard" layout="Shell" protected="yes"/>
```

Words are the element's content. A node's own rule is its `style=`. The same
rule at another width is a `<media below|from|query … style="…"/>` child. An
action is an `<on click="…" arg="…"/>` child. Every layout needs exactly one
`<slot/>`. A `<path d="…" viewBox="…"/>` is a vector — `svg="…"` is a whole
drawing — not a box with a radius.

## The four that catch people out

- **Only class selectors exist.** No ids, no element selectors, no descendant
  combinators. `style=` on the element, or `<style class="x">` shared.
- **`calc()`, `aspect-ratio`, `min-content`, `max-content`,
  `repeat(auto-fit, …)`, `box-shadow`, `transform`, `transition` and the
  per-side border shorthands are not implemented.** A rule that uses one is
  dropped, and `check` is where you find out.
- **Accessibility is checked, not suggested.** Every input needs a `label`,
  every img an `alt`, every button words or a `label`, headings go down one
  level at a time, and text must reach 4.5:1 against its ground.
- **`auth="on"` makes `protected="yes"` routes real.** A protected route
  reached logged out goes to the login route and comes back after `<on
  click="login"/>`.

## Data, dialogs and the rest

`<collection name="items" fields="id title status">` with `<row …/>` children
is a table the pages can be about: `repeat="items"` draws a node's children
once per row and `{field}` in any text under it is that row's value;
`source="items" sourceKey="id"` makes a subtree about the one row a route's
`:id` names. `overlay="name"` is a dialog, on the page only while it is open;
open it with `<on click="open" arg="name"/>`. `when="authenticated"` puts a
node on the page only when the session is.

## Seeing it

`rave shot <file> --route /dashboard --width 390 --out shot.png` paints one
route at one width and leaves a PNG; `--all` does every route at every width
the project targets, into a directory. There is no browser in it: the route is
built and styled at that viewport — a `@media` rule does not apply at all
unless one is stated — and the gallery's own software rasterizer paints the
tree. The same call now prints a `MEASURE n findings` of that tree, so looking
at the picture also says whether the boxes are wrong. Over MCP the same thing
is `rave_shot`, and the picture comes back in the answer; `rave_measure` and
`rave_outline` are the boxes and the tree on their own.

Look at what you made. `check` catches what is wrong; a picture and a measure
catch what is merely bad.


`rave serve app.rave` runs the editor at `http://127.0.0.1:8012/` bound to that
file: it loads it, follows it when you write it, and writes it back when
someone presses Save in the page. That is how an agent editing the file and a
person watching the screen are one session.

## The Figma side

`figma check <file.fig>` reads a `.fig` the whole way — parsed, converted,
imported as an application and drawn — and reports what each stage could not
carry. `figma markup <file.fig>` prints it as this markup, so a design that
arrived as a Figma file becomes one that can be edited and checked.
`figma tree` is the node tree, and `figma serve <file.fig>` runs Rafi — the
Figma viewer — bound to that file, following it when it is replaced.

```
npm run figma -- check app.fig
npm run figma -- markup app.fig > app.rave   # then edit and `rave check` it
npm run figma -- serve app.fig
```
