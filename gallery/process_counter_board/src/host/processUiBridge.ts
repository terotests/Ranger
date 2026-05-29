import { ProcessUiHost } from "../generated/counter_board";

type Unsubscribe = () => void;

const pathSubs = new Map<string, Set<() => void>>();
const idSubs = new Map<number, Set<() => void>>();
let installed = false;

export function installProcessUiBridge(): void {
  if (installed) return;
  installed = true;

  const host = ProcessUiHost.__singleton();
  host.notifyPath = (path: string) => {
    const set = pathSubs.get(path);
    if (set) {
      for (const fn of set) fn();
    }
  };
  host.notifyId = (processId: number) => {
    const set = idSubs.get(processId);
    if (set) {
      for (const fn of set) fn();
    }
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
