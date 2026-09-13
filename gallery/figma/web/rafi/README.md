# rafi — the Fig editor, with the DOM taken out

The editor at [`../standalone`](../standalone) draws a Figma file on a canvas
and builds everything around it — the rails, the layers tree, the inspector,
the toolbar, the status strip — out of HTML that a JavaScript module creates
and a browser stylesheet paints. **This is the same editor with that half
written in Ranger**: every rail, row, tab, field and button is an `EVGElement`
laid out by `EVGLayout` and painted by the same WebGL painter the board is.

```bash
npm run rafi:web     # build and serve on http://127.0.0.1:8011/
npm run rafi:test    # the whole editor, checked in Node, no browser
```

Deployed at `/rafi/`. `/figma/` stays as it is: two editors over one reader is
the point of having both, and the DOM one is the reference the Ranger one is
compared against.

**License:** AGPL-3.0-or-later (Gallery).

## What is where

| Path | What it is |
| --- | --- |
| `RafiApp.rgr` | The editor. Reads `FigApp` directly — `sceneDoc`, `findScene`, `currentPage` — and answers two display lists and an accessibility tree |
| `rafi.css` | The chrome as an **EVG** stylesheet. Same colours and sizes as `standalone/index.html`, written out: an EVG sheet has no custom properties |
| `main.js` | WebGL, the pointer, the keyboard, the file dialog, and the bytes the page starts on. Nothing else |
| `index.html` | A canvas, an error line, and one hidden `<input type=file>` |
| `build.mjs` | Wraps the compiled app as an ES module, inlines the stylesheet, copies EVG's browser helpers and the fixtures |
| `smoke.mjs` | The editor without a browser |

## Two passes, board then chrome

The board and the chrome are different kinds of list and they are drawn in
that order:

```
  boardJson()        FigApp's list, with a CAMERA: scene coordinates and a
        │            view the painter multiplies. Its own page background is
        │            the desk, the size of the window.
        ▼
  displayListJson()  the chrome, in page coordinates, painted on top with the
                     clear switched off.
```

Three things fall out of that and each one was a blank or black board first:

- **The camera is not optional.** With it off the list is in page pixels and a
  path — which is what a Figma text layer is, once the editor has flattened its
  glyphs — is left behind at the origin while its box moves. The board came out
  as blocks of colour with no writing on it.
- **The chrome paints no background behind the stage.** The board is *under*
  the chrome, so a rectangle there paints the document out. `.rf-page` and
  `.rf-stage` have no `background-color`; what surrounds the board is opaque
  on its own, and the board is the hole that leaves.
- **The second pass must not clear.** `renderDisplayList` calls
  `draw(shifts)` with one argument and there is no way through it to say "keep
  what is already there", so `main.js` uses `prepareDisplayList` and
  `frame.draw(null, null, { clear: false })`.

The context needs `stencil: true`. A filled path is drawn through the stencil
buffer and a context without one drops every one of them silently — which on a
Figma board is all the text.

## What the chrome reads

`FigApp`, directly. There is no JSON between the file and the pixels: the tree
walks `fig.sceneDoc.pages`, the panel reads a `SceneNode`'s own fills, the
footer counts `fig.sceneDoc.warnings`. That is the whole reason for the
exercise — the browser build hands JavaScript a string because JavaScript is
on the other side of a boundary, and here there is no boundary.

## Differences from `/figma/`

Deliberate, and small:

- The left ruler's numbers are upright rather than turned.
- The status strip does not carry the kept-frame counter: this page walks the
  board on every frame rather than keeping one (`gl/evg-view.js` is the
  arithmetic for that, and it lives in the host).
- Editing is not wired yet — the panel reads a layer, it does not write one.
  `FigApp` has the writes (`editRect`, `editFillOpacity`, …); what is missing
  is a text field in EVG to type into, which `gallery/ui`'s `InputCtl` is.
