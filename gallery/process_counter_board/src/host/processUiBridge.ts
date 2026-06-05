import { ProcessUiHost } from "../generated/counter_board";

type Unsubscribe = () => void;

const pathSubs = new Map<string, Set<() => void>>();
const idSubs = new Map<number, Set<() => void>>();
let installed = false;
let notifyDepth = 0;
let onNotifyRefresh: (() => void) | null = null;

function notifyListeners(): void {
  if (notifyDepth > 0) {
    return;
  }
  notifyDepth += 1;
  try {
    onNotifyRefresh?.();
    for (const [, set] of pathSubs) {
      for (const fn of set) {
        fn();
      }
    }
    for (const [, set] of idSubs) {
      for (const fn of set) {
        fn();
      }
    }
  } finally {
    notifyDepth -= 1;
  }
}

export function installProcessUiBridge(onRefresh?: () => void): void {
  if (onRefresh) {
    onNotifyRefresh = onRefresh;
  }
  if (installed) return;
  installed = true;

  const host = ProcessUiHost.__singleton();
  host.notifyPath = () => {
    notifyListeners();
  };
  host.notifyId = () => {
    notifyListeners();
  };
}

export function subscribePath(path: string, listener: () => void): Unsubscribe {
  installProcessUiBridge();
  let set = pathSubs.get(path);
  if (!set) {
    set = new Set();
    pathSubs.set(path, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function subscribeId(processId: number, listener: () => void): Unsubscribe {
  installProcessUiBridge();
  let set = idSubs.get(processId);
  if (!set) {
    set = new Set();
    idSubs.set(processId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}
