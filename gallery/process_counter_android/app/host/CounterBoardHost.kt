/**
 * Starts [CounterBoardPage] at [ProcessPaths.BOARD].
 * Plain Kotlin `CounterBoardPage()` must call [CounterBoardPage.__rangerRegisterRoot]
 * before [ProcessRuntime.startInstance] (Ranger wraps `new` in .rgr only).
 */
object CounterBoardHost {
    private var board: CounterBoardPage? = null

    fun ensureStarted(): CounterBoardPage {
        val reg = ProcessNameRegistry.__singleton()
        if (reg.hasLive(ProcessPaths.BOARD)) {
            val existing = reg.findByPath(ProcessPaths.BOARD) as? CounterBoardPage
            if (existing != null && existing.__rangerId != 0) {
                board = existing
                return existing
            }
        }
        val page = CounterBoardPage()
        if (page.__rangerId == 0) {
            page.__rangerRegisterRoot()
        }
        ProcessRuntime.startInstance(page)
        board = page
        return page
    }

    fun getBoard(): CounterBoardPage? {
        board?.let { if (it.__rangerId != 0) return it }
        val reg = ProcessNameRegistry.__singleton()
        if (!reg.hasLive(ProcessPaths.BOARD)) return null
        val found = reg.findByPath(ProcessPaths.BOARD) as? CounterBoardPage ?: return null
        if (found.__rangerId == 0) return null
        board = found
        return found
    }

    fun stop() {
        board?.let { if (it.__rangerId != 0) ProcessRuntime.stopInstance(it) }
        board = null
    }
}
