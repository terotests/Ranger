/// SwiftUI refresh hook. Generated `ProcessUiHost.notifyPath` is empty — use
/// `dispatch(path:)` from a future codegen forwarder, or poll `__rangerStateGeneration`.
enum ProcessUiBridge {
    private static var pathListeners: [String: [() -> Void]] = [:]

    static func subscribe(path: String, listener: @escaping () -> Void) -> () -> Void {
        var set = pathListeners[path] ?? []
        set.append(listener)
        pathListeners[path] = set
        let id = set.count - 1
        return {
            var current = pathListeners[path] ?? []
            if id < current.count {
                current.remove(at: id)
            }
            pathListeners[path] = current
        }
    }

    static func dispatch(path: String) {
        pathListeners[path]?.forEach { $0() }
    }
}
