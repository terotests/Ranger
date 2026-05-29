struct RowUiState: Identifiable {
    var id: Int { processId }
    let processId: Int
    let label: String
    let reps: Int
    let ticks: Int
    let running: Bool
    let selected: Bool
}

struct CounterBoardUiState {
    let title: String
    let processPath: String
    let processId: Int
    let stateGeneration: Int
    let rows: [RowUiState]
    let sumValues: Int
}

extension CounterBoardPage {
    func toUiState() -> CounterBoardUiState {
        let n = rowCount()
        var rowStates: [RowUiState] = []
        for i in 0..<n {
            let r = rows[i]
            rowStates.append(
                RowUiState(
                    processId: r.__rangerId,
                    label: r.label,
                    reps: r.value,
                    ticks: r.tickCount,
                    running: r.running,
                    selected: i == selectedIndex
                )
            )
        }
        return CounterBoardUiState(
            title: title,
            processPath: __rangerPath,
            processId: __rangerId,
            stateGeneration: __rangerStateGeneration,
            rows: rowStates,
            sumValues: sumValues()
        )
    }
}
