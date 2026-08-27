# Why React DOM and Ranger EVG look slightly different

Same props, two layout engines.

## Fixed

| Issue | Cause | Fix |
| --- | --- | --- |
| Tall white card filling the canvas | `EVGLayout.layout` forces an unset **root** height to `pageHeight` | `RangerUI` wraps the user tree in a page shell so the card shrink-wraps |
| Full-width blue button | `Button` was a `div` + nested `span` (`width = parentWidth`) | Host as `button` with `textContent` |
| Black “Increment” on blue | Nested span did not inherit `color` | Color on the button leaf |
| **Huge white rectangle vs compact React card** | Compare page sized the WebGL **canvas to the page** (360×280) and set `background: #fff` on the canvas element — the CSS fill looked like the card | Canvas CSS background **transparent**; canvas sized to the **painted command bbox** (card ~320×196) |

## Still different by engine design

1. **Line height / wrapping** — CSS line boxes vs EVG `lineHeight` × TTF wrap (subtitle break point may differ).
2. **Font rasterization** — browser vs WebGL glyph atlas.
3. **Shadow** — compare page adds CSS `box-shadow` around both hosts; EVG display list has no shadow command of its own.

## How to re-check

```bash
npm run ui:compare
# open gallery/ui/compare/index.html
```
