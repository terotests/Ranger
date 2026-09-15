# CodeGraph — Ranger source as a paged call graph

A **gallery app** of its own, not a RangerFlow demo. RangerFlow draws one
window of the graph on the EVG WebGL canvas; the chrome around it is this
application: a class list, a breadcrumb, history back/forward, a sample
picker and an UML toggle.

A thousand-node dump does not fit on a chart and is slow to lay out. Twenty
to thirty boxes do. Click a class in the rail or on the canvas to drill in.

```text
  .rgr  ──VirtualCompiler──►  RangerFlowParser walk
                                    │  isCalling / isCalledBy / isUsingClasses
                                    ▼
                               CodeGraph (IR)
                                    │
                         CodeGraphPages (≤ 24 boxes)
                                    │
                          FlowGraph (RangerFlow, as a library)
                                    ▼
                         EVG display list → WebGL
```

**License: AGPL-3.0-or-later** — see [`../LICENSE`](../LICENSE).

## Run

```bash
npm run codegraph:test         # paging, clicks, history
npm run codegraph:builder      # VirtualCompiler walk of fixtures/calls.rgr
npm run codegraph              # SVG of the shop overview + Order zoom
npm run codegraph:analyze -- gallery/codegraph/fixtures/calls.rgr
npm run codegraph:analyze -- compiler/ng_RangerAppClassDesc.rgr --max=24
npm run codegraph:web          # build the page
npm run codegraph:web:serve    # …and serve it (port 8081)
npm run codegraph:web:test     # headless Chrome: click Order, go back
```

The WebGL page loads a **sample** (a shop domain, or 40 classes so the
overview has to page). It does not run VirtualCompiler in the tab — that
bundle is megabytes and wants a filesystem. `codegraph:analyze` is the CLI
that walks a real `.rgr` file.

## What to click

| In the app | Goes to |
| --- | --- |
| a **class** in the left rail | that class: fields, methods, types it uses |
| a **class** box on the canvas | the same |
| a **method** stadium | callers, callees, data structures |
| a **hexagon arrow** on the edge | the next / previous window of the same view |
| **UML** | the overview as compartment UML boxes |
| **← / →** | history back / forward |

Every node carries `dataKind` / `dataRef`. The editor copies them onto a
`FlowHitEvent` after a click (press + release, no drag).

## Compiler fragments

`compiler/ng_RangerAppClassDesc.rgr` is not a program. It names
`RangerAppWriterContext`, `CodeNode`, `CodeWriter` and so on without
Importing the files that define them — those types are loaded by a parent
(`ng_RangerFlowParser.rgr`) when the compiler is compiled as a unit.

Pointing the CLI at a file under `compiler/` that is not
`ng_Compiler.rgr` / `VirtualCompiler.rgr` / `ng_RangerFlowParser.rgr` /
`ng_LiveCompiler.rgr` therefore compiles **`compiler/ng_RangerFlowParser.rgr`**
and keeps classes whose source path matches the file you named.

## Files

| File | Role | Pulls in the compiler? |
| --- | --- | --- |
| `src/CodeGraphModel.rgr` | classes, methods, calls, types | no |
| `src/CodeGraphPages.rgr` | windows of ≤ N nodes, pager arrows | no |
| `src/CodeGraphFlow.rgr` | page → FlowGraph, click session | no |
| `src/CodeGraphSample.rgr` | shop + 40-class fixtures | no |
| `src/CodeGraphBuilder.rgr` | `RangerAppWriterContext` → IR | **yes** |
| `web/codegraph_web.rgr` | the explorer facade | no |

RangerFlow is imported as a **library** (`gallery/rangerflow/core`, layout,
export). This app does not live in RangerFlow's demo dropdown.
