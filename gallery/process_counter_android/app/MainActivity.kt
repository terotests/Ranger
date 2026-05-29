/**
 * Imaginary launcher — in a real app this is `ComponentActivity` with Compose setContent.
 * Not compiled in CI; documents wiring only.
 */
class MainActivity {
    private val boardController = CounterBoardController()

    fun onCreate() {
        boardController.onStateChanged = { state ->
            // bind state to views
            println("Counter board gen=${state.stateGeneration} rows=${state.rows.size}")
        }
        boardController.start()
    }

    fun onDestroy() {
        boardController.stop()
    }
}
