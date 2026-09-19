# `evg_agent` — the tool surface

Four verbs over an EVG document. An agent with a shell already has everything
it needs to edit one; MCP, a widget and an editor panel are transports over
exactly these, added when something needs them. The plan they belong to is
[`PLAN_AI_BRIDGE.md`](../../../docs/plans/PLAN_AI_BRIDGE.md).

```bash
npm run agent -- outline <doc.evg.json> [--depth=N] [--at=PATH]
npm run agent -- query   <doc.evg.json> <.class | #id | tag | path>
npm run agent -- patch   <doc.evg.json> <ops.json> [--out=FILE]
npm run agent -- measure <doc.evg.json> [--width=N] [--height=N]
```

## outline — the addresses

```
$ npm run agent -- outline lib/evg/agent/fixtures/card.evg.json --depth=1
0                     div .page  width=600px  height=400px  background-color=rgb(246,247,249) …
0/0                     div .card  width=320px  height=120px  background-color=rgb(255,255,255) …
0/1                     div .card  width=320px  height=120px  background-color=rgb(255,255,255) …

… 3 deeper nodes not shown — raise --depth or pass --at to go into one
```

The only verb that does not print JSON, because it is the only one meant to be
**read** rather than parsed. One line per node — its address, what it is, and
just the properties it actually sets — costs a fraction of the same tree as
JSON while carrying the addresses every other verb takes.

A truncated outline says so. A model that cannot see there is more will
confidently describe a document it has only the top of.

Addresses are `EVGInspect` paths: `0` is the root, `0/3` its fourth child,
`0/3/k:share` a child with a `key`. Keyed children survive a sibling being
inserted above them; unkeyed ones do not, which is the reason to key anything
an edit will come back to.

## query — finding one

```
$ npm run agent -- query lib/evg/agent/fixtures/card.evg.json .card
{"matches":[
  {"at":"0/0","tag":"div","props":{"class-name":"card","width":"320px", …},"children":2},
  {"at":"0/1","tag":"div","props":{"class-name":"card","width":"320px", …},"children":1}
],"count":2}
```

`.class`, `#id`, a bare tag, or a path. Not a selector engine — a compound
selector belongs to `EVGStyleSheet`, and a second weaker implementation of one
here would be worth less than the honest limit.

## patch — the edit

Ops are the only way to change a document. Each is addressed by a path,
validated against the engine's real property set, and carries its own inverse.

```json
{"ops":[
  {"op":"set-text","at":"0/0/k:title","value":"Invoices"},
  {"op":"set-prop","at":"0/0","prop":"background-color","value":"rgb(255,251,235)"},
  {"op":"insert","at":"0/0","index":2,"tag":"span"},
  {"op":"remove","at":"0/1"},
  {"op":"move","at":"0/0/k:sub","to":"0/1","index":0}
]}
```

```
$ npm run agent -- patch doc.evg.json ops.json
{"ok":true,"applied":4,"wrote":"doc.evg.json","inverse":[
  {"op":"set-text","at":"0/0/k:title","value":"Orders"},
  {"op":"set-prop","at":"0/0","prop":"background-color","value":"rgb(255,255,255)"},
  {"op":"remove","at":"0/0/2"}
]}
```

The `inverse` list is a **runnable ops file**: save it, run `patch` with the
ops in reverse order, and the document is what it was. That is the difference
between "here is how to undo it" and "here is a description of the undo".

Four rules worth knowing before writing ops:

- **A rejected op fails the whole batch.** Nothing is applied and the document
  is untouched. "3 of 5 applied" hands you a document nobody designed.
- **An op can apply and leave no trace.** A file carries only what differs from
  a fresh element of that tag, and EVG's defaults are not CSS's — a div is
  `flex-direction: column`. Setting a property to its default therefore removes
  a line rather than adding one, and the node changed anyway. `patch` names
  those ops in `atDefault` so that re-reading the file is not read as the edit
  having been dropped:

  ```
  {"ok":true,"applied":1,"wrote":"doc.evg.json","atDefault":[
    {"at":"0/0","prop":"flex-direction","value":"column","tag":"div"}
  ],"note":"applied — but those values are the tag default …","inverse":[…]}
  ```

- **A property that cannot be read back cannot be patched.** The patchable set
  is `EVGPatch.patchableNames()` — which is also exactly what a document file
  can carry, so nothing can be written down that an edit would silently drop.
- **`remove`'s inverse is in-process only.** It names a subtree the patch that
  removed it is holding. A file cannot replay it; keep the pre-patch document
  if you want that undo across two runs.

## measure — the part a model cannot do for itself

```
$ npm run agent -- measure lib/evg/agent/fixtures/broken.evg.json --width=600 --height=300
{"width":600,"height":300,"nodes":5,"findings":[
  "0/0 and 0/1 overlap",
  "0/0/0 overflows its parent to the right by 200",
  "0/2: right edge 820 is past the page width 600",
  "0/2: bottom edge 320 is past the page height 300"
],"count":4}
```

It lays the document out and answers, in numbers, whether the result is wrong.
A screenshot asks a model to *see* that — badly, and for a thousand times the
tokens. This reads it off the boxes layout already computed.

What it checks today: a node past the page, a child spilling out of a parent
that clips, and two in-flow siblings on top of each other. `overflow: visible`
is not a finding — the author meant it to spill. Absolutely positioned nodes
are not checked for overlap; overlapping is what they are for.

A `path` has no box — its geometry is the `d` string — so its page bounds are
read from the coordinates in `d`, control points included. That bound is looser
than the shape, which is the right way round: a shape reported as on the page
is on it. A path using `A` is left unchecked, because arc flags among the
coordinates would invent a bound rather than widen one.

**What it does NOT check, on a diagram.** A document exported from RangerFlow
is entirely absolute positions and paths, so the overlap and parent-overflow
checks have nothing to work with: a label that no longer fits the shape drawn
behind it is not a finding, because nothing in the document says the two belong
together. Off-page is caught; fit is not. Look at a diagram before believing a
count of zero.

## Getting a real document in, and a picture out

The four verbs read `.evg.json`. Two neighbours in `gallery/pdf_writer/src/tools`
connect that to everything else — and both of them read either format, so
nothing below is a special path for agents:

```bash
# a .tsx document (with its stylesheet resolved in) -> the editable format
npm run agent:import -- page.tsx page.evg.json -css themes/showcase.css -theme editorial

# the editable format -> a picture to look at
npm run agent:render -- page.evg.json page.png
npm run agent:html   -- page.evg.json page.html
```

These build the tool if it is not there and then run it — the compiled
JavaScript under `gallery/pdf_writer/bin/` is not in the repository, because a
regenerated bundle is 40 000 lines of diff nobody can review. Running the tool
directly with `node` works too, once something has built it.

There is no `render` verb here, and that is deliberate: the painters already
exist and adding a second entry point to them would be two things to keep
working instead of one.

**The conversion is checked, not asserted.** `evg_json_tool` lays the original
out, reads its own output back, lays that out too, and compares — the boxes,
and then the draw commands the two produce. It also names anything it had to
drop. `-strict` turns that report into a refusal, which is what a build step
wants.

**Stylesheets are resolved in.** Whatever `-css` decides becomes inline props
in the output, so the agent edits one document rather than a tree plus a
cascade it cannot see. The cost is that theming is baked: re-theming means
converting again from the source.

**Asset paths move with the document.** A `src` is resolved against the file it
is written in, so the converter re-anchors every one for wherever the output is
going. When the two places have no expressible relation — one absolute, one not
— it says so instead of writing a path that resolves somewhere else.

## The document format

[`EVGTreeJson`](../EVGTreeJson.rgr). A node says its tag, identity, text, and
`props` — and `props` is exactly the patchable set. Only what differs from a
fresh element **of the same tag** is written, so a file stays short and a span
and a div can disagree about their defaults.

It is not a lossless container for an arbitrary EVG tree: a `path` element's
`d`, an image's `alt`, a `viewBox` — the engine has them and this format does
not. A converter into this format from JSX or a `.fig` has to say what it drops
rather than round-trip through here and call it identity.

## Running the tests

```bash
npm run evg:patch:test    # EVGPatch and EVGTreeJson — 81 assertions
npm run agent:smoke       # the four verbs, against the fixtures
npm run agent:roundtrip   # every showcase page, converted and re-rendered
```

`agent:roundtrip` is the one that matters most and the one that found every
loss so far. It converts all seventeen showcase pages and requires the PNG
rendered from the conversion to be **byte-identical** to the PNG rendered from
the original. It asks nothing and compares everything, which is why it caught
three properties the format was missing — `grid-row`, an imported SVG's source,
and the `emoji-color` tint — each of which the converter's own audit had called
clean.
