/**
 * Android UI refresh hook.
 *
 * Generated [ProcessUiHost.notifyPath] is an empty method (not a Kotlin property),
 * unlike the TS gallery where we assign `host.notifyPath = …`. Until codegen emits
 * a forwarder, call [notifyPath] from host code after actions, or poll
 * [CounterBoardPage.__rangerStateGeneration] (see [CounterBoardController]).
 */
object ProcessUiBridge {
    private val pathListeners = mutableMapOf<String, MutableSet<() -> Unit>>()

    fun subscribePath(path: String, listener: () -> Unit): () -> Unit {
        val set = pathListeners.getOrPut(path) { mutableSetOf() }
        set.add(listener)
        return { set.remove(listener) }
    }

    /** Call from a patched ProcessUiHost or tests when notifyPath is wired. */
    fun dispatchPath(path: String) {
        pathListeners[path]?.forEach { it.invoke() }
    }
}
