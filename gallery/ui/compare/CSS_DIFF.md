# Why React DOM and Ranger EVG look slightly different

Same props, two layout engines. The remaining gaps after the UI-kit fixes:

## Fixed in gallery/ui (this iteration)

| Issue | Cause | Fix |
| --- | --- | --- |
| Tall white card filling the canvas | `EVGLayout.layout` forces an unset **root** height to `pageHeight` (document/page behaviour) | `RangerUI` wraps the user tree in a page shell so the card is a **child** and shrink-wraps |
| Full-width blue button | `Button` expanded to a `div` + nested `span`; containers default to `width = parentWidth` | Host as `button` with `textContent` so EVG shrink-wraps like DOM `<button>` |
| Black “Increment” label on blue | Nested span did not inherit `color` | `textContent` on `button` carries `color`; nested spans inherit color/font props |

## Still different by engine design

1. **Line height / wrapping** — DOM uses CSS line boxes (~1.2–1.4× font-size with font metrics). EVG uses `lineHeight` × font-size and its own TTF wrap, so the subtitle may break at a different word.
2. **Font face naming** — DOM: `font-weight: bold` + `Noto Sans`. EVG: face `"Noto Sans-Bold"`. Glyph rasterization (canvas atlas vs browser) also differs slightly.
3. **Stage chrome** — React mounts a content-sized card in a flex stage; EVG paints a page-sized canvas with the card at the top-left of that page. Not component CSS.
4. **Shadows** — DOM compare page can add `box-shadow`; EVG display list has no shadow command yet.

## How to re-check

```bash
npm run ui:compare
# open gallery/ui/compare/index.html
```
