# Counter board — React + Ranger `@process` gallery

Vite demo: Ranger [`counter_board.rgr`](ranger/counter_board.rgr) compiles to TypeScript, a named page process (`@name("app.counterBoard")`), and React binds via `useProcess`.

## Prerequisites

- Ranger compiler built at repo root (`npm run compile` twice if you changed `ng_RangerFlowParser.rgr`)

`npm install` runs **`build:ranger`** (postinstall) and writes [`src/generated/counter_board.ts`](src/generated/counter_board.ts). If IDE imports are red before install, run `npm run build:ranger` manually.

Import generated code **without** the `.ts` suffix (e.g. `from "../generated/counter_board"`). Extensionless imports match `moduleResolution: "bundler"` and work reliably in the editor.

## Commands

```bash
cd gallery/process_counter_board
npm install
npm run dev
```

- **`build:ranger`** — `node ../../bin/output.js -es6 -typescript -esm ranger/counter_board.rgr` → `src/generated/counter_board.ts`
- **`dev`** — compile Ranger then Vite on port **5188** (avoids stale PWA/cache on 5174)

## Architecture

| Layer | Role |
|-------|------|
| `CounterBoardPage @name("app.counterBoard")` | Live state (rows, selection, reps) |
| `markStateDirty()` | After mutations → bumps `__rangerStateGeneration`, `ProcessUiHost.notifyPath` |
| `processUiBridge.ts` | TS listeners on `notifyPath` (Ranger stub is empty until bridged) |
| `useProcess("app.counterBoard")` | Re-read process fields when generation bumps |
| `counterBoardHost` | Calls `__rangerRegisterRoot()` before `startInstance` (TS `new` is not auto-wrapped like Ranger `new`) |
| `useCounterBoardTick` | `pulseAll()` on interval for running rows |
| `ProcessRuntime` (generated) | Static extension API: `ProcessRuntime.collectAllLiveRoots()`, `startInstance`, etc. |

Route mapping for a real app: URL `/counter` ↔ `app.counterBoard` ↔ `useProcess`.

### Named lookup (Ranger vs generated TS)

| API | Where | Role |
|-----|--------|------|
| `find_process "app.counterBoard"` | Ranger `.rgr` | Operator → `ProcessNameRegistry.findByPath` |
| `(new ProcessNameRegistry()).findProcess("app.counterBoard")` | Generated TS | `@singleton` makes `new` return the shared instance; typed overloads via `interface ProcessNameRegistry` |
| `useProcess(BOARD_PROCESS_PATH)` | React gallery | Subscribes to `markStateDirty` + resolves via `findProcessByPath` / host |
| UI demo line | [`CounterBoard.tsx`](src/components/CounterBoard.tsx) | `new ProcessNameRegistry().findProcess(BOARD_PROCESS_PATH)` shown in header |

[`processPaths.ts`](src/processPaths.ts) wraps `new ProcessNameRegistry().findProcess(path)` as `findProcessByPath`. Used from [`counterBoardHost.ts`](src/host/counterBoardHost.ts), [`useProcess.ts`](src/hooks/useProcess.ts), and directly in [`CounterBoard.tsx`](src/components/CounterBoard.tsx).

Inbound messages from other processes: override `fn receiveMessage:void (msg:Any)` and use `proc_send "app.counterBoard" msg` in Ranger (see [`tests/fixtures/process_proc_send.rgr`](../../tests/fixtures/process_proc_send.rgr)).

**Keyboard** (same as CLI fixture): `+`/`=` add row, `-` remove, ↑↓ move selection, Space +1 rep, `r`/Enter run/stop. Click a row to select it.

## Sibling galleries (exploratory, not CI)

- [Android + Kotlin](../process_counter_android/README.md)
- [iOS + Swift](../process_counter_ios/README.md)

## Tests

CLI fixture remains at [`tests/fixtures/process_counter_board.rgr`](../../tests/fixtures/process_counter_board.rgr). Named-process compiler tests: [`tests/compiler-process-named.test.ts`](../../tests/compiler-process-named.test.ts).
