/** Snapshot for Compose / RecyclerView binding (imaginary UI). */
data class RowUiState(
    val processId: Int,
    val label: String,
    val reps: Int,
    val ticks: Int,
    val running: Boolean,
    val selected: Boolean,
)

data class CounterBoardUiState(
    val title: String,
    val processPath: String,
    val processId: Int,
    val stateGeneration: Int,
    val rows: List<RowUiState>,
    val sumValues: Int,
)

fun CounterBoardPage.toUiState(): CounterBoardUiState {
    val n = rowCount()
    val sel = selectedIndex
    val rowStates = mutableListOf<RowUiState>()
    for (i in 0 until n) {
        val r = rows[i]
        rowStates.add(
            RowUiState(
                processId = r.__rangerId,
                label = r.label,
                reps = r.value,
                ticks = r.tickCount,
                running = r.running,
                selected = i == sel,
            )
        )
    }
    return CounterBoardUiState(
        title = title,
        processPath = __rangerPath,
        processId = __rangerId,
        stateGeneration = __rangerStateGeneration,
        rows = rowStates,
        sumValues = sumValues(),
    )
}
