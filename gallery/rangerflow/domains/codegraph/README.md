# Code graph — Ranger source as a paged RangerFlow drawing

Read a Ranger program (the compiler itself, a library, a fixture), turn its
classes and methods into a call graph / UML view, and draw **one window at a
time** on the EVG WebGL canvas. A thousand-node dump does not fit on a chart
and is slow to lay out; twenty to thirty boxes do.

```text
  .rgr  ──VirtualCompiler──►  RangerFlowParser walk
                                    │  isCalling / isCalledBy / isUsingClasses
                                    ▼
                               CodeGraph (IR)
                                    │
                         CodeGraphPages (≤ 24 boxes)
                                    │
                          FlowGraph + click sink
                                    ▼
                         EVG display list → WebGL
```

## What to click

| Click | Goes to |
| --- | --- |
| a **class** box | that class: fields, methods, types it uses |
| a **method** stadium | callers, callees, data structures |
| a **hexagon arrow** on the edge | the next / previous window of the same view |
| **UML view →** | the same slice as compartment UML boxes |
| **← page** in the toolbar | history back (the browser's back for this chart) |

The host does not guess. Every node carries `dataKind` / `dataRef`; the editor
copies them onto a `FlowHitEvent` after a click (press + release, no drag).
`RangerFlowWeb.takeClicksJson()` is the drain for anything outside Ranger.

## Files

| File | Role | Pulls in the compiler? |
| --- | --- | --- |
| `CodeGraphModel.rgr` | classes, methods, calls, types | no |
| `CodeGraphPages.rgr` | windows of ≤ N nodes, pager arrows | no |
| `CodeGraphFlow.rgr` | page → FlowGraph, click session | no |
| `CodeGraphSample.rgr` | shop + 40-class fixtures | no |
| `CodeGraphBuilder.rgr` | `RangerAppWriterContext` → IR | **yes** |

The WebGL page loads the sample, not the builder — compiling the frontend into
the tab would be megabytes and wants a filesystem.

## Commands

```bash
npm run rangerflow:codegraph:test      # paging, clicks, history
npm run rangerflow:codegraph:builder   # VirtualCompiler walk of fixtures/codegraph/calls.rgr
npm run rangerflow:codegraph           # SVG / PDF of the shop overview + Order zoom
npm run rangerflow:codegraph:analyze -- gallery/rangerflow/fixtures/codegraph/calls.rgr
npm run rangerflow:codegraph:analyze -- compiler/ng_RangerAppClassDesc.rgr --max=24
npm run rangerflow:demo:web            # then ?scenario=codegraph
```

## Phases (what this is)

1. **Click events on RangerFlow** — `FlowEventSink` on `FlowEditor`, `dataKind` /
   `dataRef` on nodes and edges. A host drains after `pointerUp`.
2. **IR** — copy the compiler's already-built call graph, skip Lang.rgr.
3. **Paging** — overview / UML / class / method windows, cap 8–40 (default 24).
4. **EVG + WebGL** — same `FlowScene` path as every other RangerFlow demo.
5. **Navigation** — click to zoom in, pager arrows to turn the page, history
   back/forward so a large codebase can be walked without drawing it all.
