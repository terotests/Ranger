# Responsive layout, live

A page as wide as the browser window, laid out **again on every resize** by the
EVG engine compiled into the browser. The browser lays out nothing: it is handed
an `<svg>` full of absolute coordinates that EVG computed.

```sh
npm run evg:responsive:web:serve    # build and serve on http://localhost:8007/
npm run evg:responsive:check        # the same layout at four widths, no browser
npm run evg:responsive:web:smoke    # the built page, driven in Chromium
npm run evg:responsive:web          # build only -> dist/
```

The showcase build ships the same files to `/evg/responsive/` on Pages.

## Why it exists

Every other EVG page in this repository is laid out **once**, at a size somebody
typed: a sheet of A4 for the PDF, 420×320 for the conformance playground,
`boxmodel.json` at whatever it was exported at. That is a fair test of the
layout and no test at all of the part CSS calls responsive — `@media`, `vw`,
percentages, a grid that changes how many columns it has.

Here every frame runs the whole pipeline:

```
build the tree            EvgResponsiveDemo.build()
state the viewport        EVGStyleSheet.setViewport(w, h, coarse)
resolve the cascade       applyTree — matching @media blocks contribute
lay out                   EVGLayout.layout, setPageSize(w, h)  ← also vw / vh
flatten                   EVGDisplayList.build
paint                     ../../html/evg-html.js, the SVG backend
```

About a millisecond of layout per frame at 1400px, reported in the strip at the
bottom of the page along with the width EVG was given and how many draw commands
came out.

## What is being demonstrated

The tree in [`EvgResponsiveDemo.rgr`](EvgResponsiveDemo.rgr) has no width, no
colour and no size anywhere in it — it is a list of names. Every number on the
screen comes from `defaultCss()`, and its three `@media` blocks are the entire
difference between the wide layout and the phone one:

| Width | |
| --- | --- |
| `> 1080px` | sidebar beside the content, cards four across |
| `≤ 1080px` | cards three across |
| `≤ 820px` | sidebar above the content, cards two across |
| `≤ 560px` | one card per row, smaller type, tighter padding |

Plus two things no breakpoint decides: the page margins are `4vw`, a share of
the window rather than of the parent, and the stat strip wraps on its own
because its tiles state a `min-width` and the line runs out.

`@media (pointer: coarse)` is in there too — the *pointer: coarse* button in the
strip toggles what the host reports, and the sidebar's rows grow for a finger.

## The files

| | |
| --- | --- |
| `EvgResponsiveDemo.rgr` | the page: the tree, the stylesheet, and one `render()` that returns a display list as JSON |
| `EvgResponsiveCheck.rgr` | the same layout at four widths, asserted in Node |
| `index.html` | the stage, the resize observer and the controls |
| `build.mjs` | compiles the demo to a browser IIFE and copies the painter beside it |
| `smoke.mjs` | serves `dist/` and drives it in Chromium |

`EvgResponsiveCheck` counts card columns by **grouping the laid-out cards by
their `y`** rather than by reading the stylesheet back: however the grid decided
to place them, the cards sharing the top row are the columns. The sidebar's move
is checked the same way — where its box ended up, not what rule put it there.
It also checks the rule that a stylesheet with **no viewport stated** applies no
conditional rule at all, because a media query that cannot be evaluated has no
truth value.
