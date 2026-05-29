# Counter board — imaginary iOS + Ranger `@process`

Exploratory sample (not built in CI): [`counter_board.rgr`](ranger/counter_board.rgr) → Swift6, with SwiftUI-shaped bindings.

## Generate Ranger Swift

```bash
cd gallery/process_counter_ios
npm run build:ranger
```

Output: [`generated/counter_board.swift`](generated/counter_board.swift)

## Imaginary app layout

```
generated/counter_board.swift
ios/
  ProcessPaths.swift
  Host/CounterBoardHost.swift
  Host/ProcessUiBridge.swift
  UI/CounterBoardViewModel.swift
  UI/CounterBoardView.swift      # SwiftUI (needs Xcode target)
  UI/ProcessTreePanel.swift
  CounterBoardApp.swift
```

## Real iOS integration (outline)

1. Add `counter_board.swift` + `ios/**/*.swift` to an Xcode target (or SwiftPM).
2. `@main` App presenting `CounterBoardView()`.
3. Ensure `CounterBoardHost.ensureStarted()` runs once per scene.

## Related

- [Web gallery](../process_counter_board/README.md)
- [Android gallery](../process_counter_android/README.md)
- [ISSUES.md](ISSUES.md)
