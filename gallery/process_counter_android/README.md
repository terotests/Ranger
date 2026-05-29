# Counter board — imaginary Android + Ranger `@process`

Exploratory sample (not built in CI): same [`counter_board.rgr`](ranger/counter_board.rgr) as the [web gallery](../process_counter_board), compiled to Kotlin with a documented host/UI binding layer for Jetpack Compose.

## Generate Ranger Kotlin

```bash
cd gallery/process_counter_android
npm run build:ranger
```

Output: [`generated/counter_board.kt`](generated/counter_board.kt)

Requires Ranger `bin/output.js` built at repo root.

## Imaginary app layout

```
generated/counter_board.kt   # Ranger @process runtime + board (copy into module)
app/
  ProcessPaths.kt
  host/CounterBoardHost.kt   # start @name process, __rangerRegisterRoot
  host/ProcessUiBridge.kt    # UI notify (see ISSUES.md)
  ui/CounterBoardScreen.kt   # Controller + Compose pseudocode
  ui/ProcessTreePanel.kt
  MainActivity.kt            # Wiring sketch
```

## Real Android integration (outline)

1. Add `generated/counter_board.kt` to `app/src/main/java/...` (default package or your package — adjust imports).
2. Copy `app/host` + `app/ui` into the same package or call from a `ViewModel`.
3. `Application.onCreate`: optional `ProcessUiBridge` setup (see issues).
4. Compose: bind `CounterBoardController.uiState` or map `CounterBoardUiState` to UI.

## Related

- [Web gallery](../process_counter_board/README.md)
- [iOS gallery](../process_counter_ios/README.md)
- [ISSUES.md](ISSUES.md) — Kotlin-specific gaps
