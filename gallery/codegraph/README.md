# CodeGraph — Ranger source as a paged call graph

A **gallery app** of its own, not a RangerFlow demo. RangerFlow draws one
window of the graph on the EVG WebGL canvas; The chrome around it is **Full EVG** (`gallery/ui` toolbar, example select, class tree) so the same `CodeGraphApp` paints in a tab and in an SDL2 desktop window. RangerFlow still draws the current window of the graph on the canvas region.

Live example files (`fixtures/calls.rgr`, `fixtures/animals.rgr`) are
compiled **in the tab** by VirtualCompiler — the same compiler the playground
uses — then walked into the IR through UAST. Shop / 40-class fixtures stay as a
no-compiler fallback. On the desktop, **Open** picks a `.rgr`, a directory with
`ranger.json`, or that manifest; `Import "pkg:…"` resolves the same way `rgrc`
does (path / vendor / cache). Desktop **Git URL** clones with `gallery/pkg`
then analyses Ranger or TypeScript. CLI:

```bash
npm run codegraph:analyze -- tests/fixtures/pkg/app
npm run codegraph:analyze -- https://github.com/org/repo.git
./tmp/codegraph-sdl/codegraph_sdl https://github.com/org/repo.git
```

A thousand-node dump does not fit on a chart and is slow to lay out. Twenty
to thirty boxes do. Click a class in the rail or on the canvas to drill in.

```text
  .rgr / ranger.json / pkg:  ──VirtualCompiler──►  UastRanger
                                    │
                          shared UAST pipeline
                                    ▼
                               CodeGraph (IR)
                                    │
                         CodeGraphPages (≤ 24 boxes)
                                    │
                          FlowGraph (RangerFlow, as a library)
                                    ▼
                         EVG display list → WebGL / SDL2
```

**License: AGPL-3.0-or-later** — see [`../LICENSE`](../LICENSE).

The same page is published at
**[terotests.github.io/Ranger/codegraph/](https://terotests.github.io/Ranger/codegraph/)**
by the Pages workflow.

![calls.rgr after VirtualCompiler: Order.items points at LineItem](artifacts/codegraph_calls.png)

![animals.rgr: Farm.animals:[Animal] and Dog/Cat inherit Animal](artifacts/codegraph_animals.png)

![the shop fixture as UML, field types drawn as associations](artifacts/codegraph_shop.png)

## Run

```bash
npm run codegraph:test         # paging, clicks, history
npm run codegraph:builder      # VirtualCompiler walk of fixtures/calls.rgr
npm run codegraph:app          # Full EVG chrome + shop navigation
npm run codegraph              # SVG of the shop overview + Order zoom
npm run codegraph:analyze -- gallery/codegraph/fixtures/calls.rgr
npm run codegraph:analyze -- compiler/ng_RangerAppClassDesc.rgr --max=24
npm run codegraph:bench        # JS wall-clock stages (fixtures/calls.rgr)
npm run codegraph:bench:rt     # JS stages for gallery/realtrainer
npm run codegraph:bench:cpp    # same bench compiled to C++
npm run codegraph:bench:cpp:rt # C++ stages for gallery/realtrainer
npm run codegraph:web          # build the page (compiler + examples)
npm run codegraph:web:serve    # …and serve it (port 8081)
npm run codegraph:web:test     # headless Chrome: click Order, go back, compile calls.rgr
npm run codegraph:sdl          # native SDL2 window (macOS / Linux)
npm run codegraph:sdl:smoke    # headless dummy video driver
```

Open `/codegraph/` and pick **calls.rgr**, **animals.rgr**, **css**, **evg**,
**zip**, or **Ranger compiler**.
The source is in the left rail; **Analyze with VirtualCompiler** rebuilds the
graph from it. The compiler sample walks `VirtualCompiler.rgr` and every file
it Imports — a large class graph, paged, and it takes a moment. `css` / `evg`
/ `zip` are the same walk over smaller gallery libraries, and they open on
CssSheet / EVGElement / ZipReader so the first drawing is a class page rather
than a catalogue of every compartment.

`?example=animals.rgr` opens the farm; `?example=compiler` walks the compiler;
`?example=css` / `evg` / `zip` walk those libraries;
`?sample=shop` skips the compiler and loads the fixture (UML with field links).

Opening a large app such as `gallery/realtrainer/src/RealTrainerDemo.rgr` is
VirtualCompiler on that file plus its Import closure, then UAST semantic,
then a 24-box UML page. `codegraph:bench` / `codegraph:bench:cpp` print a
`BENCH` line per stage (compile, parse, members, layout, …) on JavaScript
and C++ so the wait is not a black box. `codegraph:analyze` also recompiles
the CLI from Ranger on every run; the bench times analysis only.


## What to click

| In the app | Goes to |
| --- | --- |
| a **class** in the left rail | that class: fields, methods, types it uses |
| a **class** box on the canvas | the same |
| a **method row** in a UML box | callers, callees, types that method uses |
| a **rose** box above a class | a class whose field points here; click walks back to it |
| a **← N more users** hexagon | the rest of those referrers, paged |
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
| `src/CodeGraphBuilder.rgr` | compile → UAST → IR; `fromPath` opens ranger.json / `pkg:` | **yes** |
| `src/CodeGraphApp.rgr` | Full EVG explorer (chrome + analyse) | **yes** (VFS analyse) |
| `web/codegraph_web.rgr` | browser name for `CodeGraphApp` | **yes** |
| `platform/sdl/codegraph_sdl.rgr` | SDL2 window, native file picker | **yes** |
| `tools/codegraph_open.mjs` | CLI wrapper; clones a Git URL via gallery/pkg | no |
| `fixtures/calls.rgr` | Order / LineItem / Checkout | compiled live |
| `fixtures/animals.rgr` | Farm.animals:[Animal], Dog / Cat | compiled live |
| `gallery/css`, `evg`, `zip` | CssCore / EVGElement / ZipReader | compiled live |

RangerFlow is imported as a **library** (`gallery/rangerflow/core`, layout,
export). This app does not live in RangerFlow's demo dropdown.

A language-analysis layer that *projects into* this IR — so TypeScript and
later Go can reuse the same class/method page — is [`gallery/uast`](../uast/README.md).
`CodeGraphBuilder` compiles Ranger (including `pkg:` imports) and asks UAST
to fill the graph. It does not walk `RangerAppClassDesc` itself.
