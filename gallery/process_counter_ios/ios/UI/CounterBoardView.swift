import SwiftUI

/// Imaginary SwiftUI — add to an Xcode target with generated `counter_board.swift`.
struct CounterBoardView: View {
    @StateObject private var model = CounterBoardViewModel()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let state = model.uiState {
                Text(state.title).font(.title2)
                Text("\(state.processPath) · id \(state.processId) · gen \(state.stateGeneration)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack {
                    Button("+ Row") { model.addRow() }
                    Button("− Remove") { model.removeSelected() }
                    Button("Run/Stop") { model.toggleRun() }
                }
                List(state.rows) { row in
                    HStack {
                        Text(row.label)
                        Spacer()
                        Text("reps=\(row.reps) ticks=\(row.ticks)")
                        Text(row.running ? "RUN" : "STOP")
                            .font(.caption)
                    }
                    .listRowBackground(row.selected ? Color.blue.opacity(0.15) : Color.clear)
                    .onTapGesture { model.selectRow(at: state.rows.firstIndex(where: { $0.id == row.id }) ?? 0) }
                }
                Text("sum=\(state.sumValues)")
                    .font(.caption)
            } else {
                Text("Starting counter board…")
            }
            ProcessTreeSidebar()
        }
        .padding()
        .onAppear { model.start() }
        .onDisappear { model.stop() }
    }
}

struct ProcessTreeSidebar: View {
    var body: some View {
        VStack(alignment: .leading) {
            Text("Process tree").font(.headline)
            ForEach(ProcessTreePanel.liveRootLabels(), id: \.self) { line in
                Text(line).font(.caption.monospaced())
            }
        }
    }
}
