import Foundation

/// Imaginary SwiftUI ViewModel — wire with `@StateObject` in a real target.
@MainActor
final class CounterBoardViewModel: ObservableObject {
    @Published private(set) var uiState: CounterBoardUiState?
    private var unsubscribe: (() -> Void)?
    private var tickTask: Task<Void, Never>?

    func start() {
        let page = CounterBoardHost.ensureStarted()
        refresh(page: page)
        unsubscribe = ProcessUiBridge.subscribe(path: ProcessPaths.board) { [weak self] in
            Task { @MainActor in
                if let p = CounterBoardHost.getBoard() {
                    self?.refresh(page: p)
                }
            }
        }
        tickTask = Task {
            var lastGen = -1
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 400_000_000)
                guard let page = CounterBoardHost.getBoard() else { continue }
                page.pulseAll()
                if page.__rangerStateGeneration != lastGen {
                    lastGen = page.__rangerStateGeneration
                    refresh(page: page)
                }
            }
        }
    }

    func stop() {
        tickTask?.cancel()
        tickTask = nil
        unsubscribe?()
        unsubscribe = nil
        CounterBoardHost.stop()
        uiState = nil
    }

    func addRow() { mutate { $0.addRow() } }
    func removeSelected() { mutate { $0.removeSelected() } }
    func moveSelection(delta: Int) { mutate { $0.moveSelection(delta: delta) } }
    func addRep() { mutate { $0.addRepToSelected() } }
    func toggleRun() { mutate { $0.toggleSelectedRun() } }

    func selectRow(at index: Int) {
        guard let page = CounterBoardHost.getBoard() else { return }
        let n = page.rowCount()
        guard n > 0 else { return }
        page.selectedIndex = min(max(index, 0), n - 1)
        page.markStateDirty()
        refresh(page: page)
    }

    private func mutate(_ block: (CounterBoardPage) -> Void) {
        guard let page = CounterBoardHost.getBoard() else { return }
        block(page)
        refresh(page: page)
    }

    private func refresh(page: CounterBoardPage) {
        uiState = page.toUiState()
    }
}
