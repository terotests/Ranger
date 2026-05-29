enum CounterBoardHost {
    private static var board: CounterBoardPage?

    static func ensureStarted() -> CounterBoardPage {
        let reg = ProcessNameRegistry.__singleton()
        if reg.hasLive(path: ProcessPaths.board) {
            if let existing = reg.findByPath(path: ProcessPaths.board) as? CounterBoardPage,
               existing.__rangerId != 0 {
                board = existing
                return existing
            }
        }
        let page = CounterBoardPage()
        if page.__rangerId == 0 {
            page.__rangerRegisterRoot()
        }
        ProcessRuntime.startInstance(proc: page)
        board = page
        return page
    }

    static func getBoard() -> CounterBoardPage? {
        if let b = board, b.__rangerId != 0 { return b }
        let reg = ProcessNameRegistry.__singleton()
        if !reg.hasLive(path: ProcessPaths.board) { return nil }
        guard let found = reg.findByPath(path: ProcessPaths.board) as? CounterBoardPage,
              found.__rangerId != 0 else { return nil }
        board = found
        return found
    }

    static func stop() {
        if let b = board, b.__rangerId != 0 {
            ProcessRuntime.stopInstance(proc: b)
        }
        board = nil
    }
}
