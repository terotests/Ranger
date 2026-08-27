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
- [x] Unit tests + TypeScript dual-host stubs

### Phase 2 — interaction

- [ ] Pointer/keyboard → React-shaped synthetic events
- [ ] Bridge to `UILayer` / `UIInput` for SDL and canvas hosts
- [ ] `onClick` / `onChange` props that fire after hit-test
- [ ] Controlled `TextInput` primitive

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
