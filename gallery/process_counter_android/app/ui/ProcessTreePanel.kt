/** Imaginary debug panel — bind to a TextView or Compose list. */
object ProcessTreePanel {
    fun liveRootLabels(): List<String> {
        return ProcessRuntime.collectAllLiveRoots().map { proc ->
            buildString {
                append(proc.__rangerClassName)
                append(" #")
                append(proc.__rangerId)
                if (proc.__rangerPath.isNotEmpty()) {
                    append(" path=")
                    append(proc.__rangerPath)
                }
                if (proc.__rangerParentId != 0) {
                    append(" parent=")
                    append(proc.__rangerParentId)
                }
            }
        }
    }
}
