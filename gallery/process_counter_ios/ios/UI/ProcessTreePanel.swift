enum ProcessTreePanel {
    static func liveRootLabels() -> [String] {
        ProcessRuntime.collectAllLiveRoots().map { proc in
            var s = "\(proc.__rangerClassName) #\(proc.__rangerId)"
            if !proc.__rangerPath.isEmpty {
                s += " path=\(proc.__rangerPath)"
            }
            if proc.__rangerParentId != 0 {
                s += " parent=\(proc.__rangerParentId)"
            }
            return s
        }
    }
}
