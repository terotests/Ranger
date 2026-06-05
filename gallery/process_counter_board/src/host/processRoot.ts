import type { ProcessRuntime, RangerProcessBase } from "../generated/counter_board";

export interface ProcessRootHandle<TSnapshot> {
  dispatch(work: () => void): void;
  snapshot(): TSnapshot | null;
  subscribe(listener: () => void): () => void;
  getRevision(): number;
  refreshSnapshot(): void;
}

export function createProcessRootHandle<TSnapshot>(config: {
  rootPath: string;
  getRoot: () => RangerProcessBase | null;
  buildSnapshot: (root: RangerProcessBase) => TSnapshot;
  revisionOf: (root: RangerProcessBase) => number;
  installBridge: () => void;
  subscribePath: (path: string, listener: () => void) => () => void;
  ProcessRuntime: typeof ProcessRuntime;
}): ProcessRootHandle<TSnapshot> {
  let cachedRevision = -1;
  let cachedSnapshot: TSnapshot | null = null;

  function refreshSnapshot(): void {
    const root = config.getRoot();
    if (!root || root.__rangerId === 0) {
      cachedRevision = -1;
      cachedSnapshot = null;
      return;
    }
    const nextRev = config.revisionOf(root);
    if (nextRev === cachedRevision && cachedSnapshot !== null) {
      return;
    }
    cachedRevision = nextRev;
    cachedSnapshot = config.buildSnapshot(root);
  }

  return {
    dispatch(work) {
      config.installBridge();
      const root = config.getRoot();
      if (!root || root.__rangerId === 0) {
        work();
        refreshSnapshot();
        return;
      }
      config.ProcessRuntime.beginDispatchTurn(root);
      try {
        work();
      } finally {
        config.ProcessRuntime.endDispatchTurn(root);
      }
      refreshSnapshot();
    },
    snapshot() {
      refreshSnapshot();
      return cachedSnapshot;
    },
    subscribe(listener) {
      config.installBridge();
      return config.subscribePath(config.rootPath, () => {
        refreshSnapshot();
        listener();
      });
    },
    getRevision() {
      return cachedRevision;
    },
    refreshSnapshot,
  };
}
