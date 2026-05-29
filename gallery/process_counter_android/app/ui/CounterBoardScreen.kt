/**
 * Imaginary Jetpack Compose screen — not wired to a Gradle project.
 * ViewModel would hold [CounterBoardController] and collect uiState.
 */
class CounterBoardController {
    private var unsubscribe: (() -> Unit)? = null
    var uiState: CounterBoardUiState? = null
        private set
    var onStateChanged: ((CounterBoardUiState) -> Unit)? = null

    @Volatile
    private var tickRunning = false
    private var tickThread: Thread? = null

    fun start() {
        val page = CounterBoardHost.ensureStarted()
        refresh(page)
        unsubscribe = ProcessUiBridge.subscribePath(ProcessPaths.BOARD) {
            CounterBoardHost.getBoard()?.let { refresh(it) }
        }
        tickRunning = true
        tickThread = Thread {
            var lastGen = -1
            while (tickRunning) {
                try {
                    Thread.sleep(400)
                } catch (_: InterruptedException) {
                    break
                }
                if (!tickRunning) break
                val page = CounterBoardHost.getBoard() ?: continue
                page.pulseAll()
                if (page.__rangerStateGeneration != lastGen) {
                    lastGen = page.__rangerStateGeneration
                    refresh(page)
                }
            }
        }.also { it.isDaemon = true; it.start() }
    }

    fun stop() {
        tickRunning = false
        tickThread?.interrupt()
        tickThread = null
        unsubscribe?.invoke()
        unsubscribe = null
        CounterBoardHost.stop()
    }

    fun addRow() {
        CounterBoardHost.getBoard()?.addRow()
        CounterBoardHost.getBoard()?.let { refresh(it) }
    }

    fun removeSelected() {
        CounterBoardHost.getBoard()?.removeSelected()
        CounterBoardHost.getBoard()?.let { refresh(it) }
    }

    fun moveSelection(delta: Int) {
        CounterBoardHost.getBoard()?.moveSelection(delta)
        CounterBoardHost.getBoard()?.let { refresh(it) }
    }

    fun addRep() {
        CounterBoardHost.getBoard()?.addRepToSelected()
        CounterBoardHost.getBoard()?.let { refresh(it) }
    }

    fun toggleRun() {
        CounterBoardHost.getBoard()?.toggleSelectedRun()
        CounterBoardHost.getBoard()?.let { refresh(it) }
    }

    fun selectRow(index: Int) {
        val page = CounterBoardHost.getBoard() ?: return
        val n = page.rowCount()
        if (n == 0) return
        page.selectedIndex = index.coerceIn(0, n - 1)
        page.markStateDirty()
    }

    private fun refresh(page: CounterBoardPage) {
        uiState = page.toUiState()
        uiState?.let { onStateChanged?.invoke(it) }
    }
}

// Pseudocode Compose (enable when embedded in a real module):
//
// @Composable
// fun CounterBoardScreen(controller: CounterBoardController) {
//     val state by remember { derivedStateOf { controller.uiState } }
//     if (state == null) Text("Starting…") else {
//         Column {
//             Text(state.title)
//             LazyColumn {
//                 items(state.rows) { row ->
//                     Row(Modifier.clickable { controller.selectRow(...) }) {
//                         Text("${row.label} reps=${row.reps}")
//                     }
//                 }
//             }
//         }
//     }
// }
