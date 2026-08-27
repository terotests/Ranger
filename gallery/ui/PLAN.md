# gallery/ui — plan

## Goal

A reusable, React-API-compatible component library whose **only** paint target
is EVG, so one UI runs on WebGL, SDL+GL, SoftCanvas, PDF and HTML.

## Phases

### Phase 1 — foundation (this PR)

- [x] `RgElement` / `RgProps` virtual tree
- [x] `createElement` + `Fragment` + component registry
- [x] `renderToEVG` via `EVGBridge`
- [x] XML → `RgElement` (`XmlCore`)
- [x] Primitives: View, Text, Button, Image
- [x] Minimal `useState`
- [x] TypeScript dual-host stubs (`react/`)
- [x] `RangerUI.renderToDisplayListJson` — WebGL / SDL painter seam
- [x] React-shaped Node runtime (`runtime/ranger-ui-runtime.cjs`)
- [x] Dual-host smoke (`npm run ui:runtime`)

### Phase 2 — interaction

- [x] Pointer → React-shaped synthetic events (`dispatchClick` / `SyntheticEvent`)
- [x] Hit regions from laid-out EVG (`HitMap` / `rgclick:<id>`)
- [x] `onClick` props fire after hit-test (JS runtime + Ranger handler ids)
- [ ] Bridge to `UILayer` / `UIInput` for SDL and canvas hosts (thin adapter next)
- [ ] Controlled `TextInput` primitive
- [ ] Keyboard events
### Phase 3 — richer React surface

- [ ] `useEffect`, `useRef`, `useMemo` (subset)
- [ ] Context API (theme / locale)
- [ ] Keys + list reconciliation (diff host tree before EVG)
- [ ] Number/boolean prop values (not only strings)

### Phase 4 — kit

- [ ] Layout helpers (Stack, Row, Spacer)
- [ ] Form controls aligned with `rangerforms`
- [ ] Shared theme tokens
- [ ] Showcase page in `gallery/evg/showcase` or `office/docs`

## Dual-host rule

Component **source** should depend only on:

- `createElement` / hooks from the chosen runtime import
- Primitives (`View`, `Text`, …) with the same prop names

Never import `EVGElement` from a shared component file if that file must also
run under real React.
