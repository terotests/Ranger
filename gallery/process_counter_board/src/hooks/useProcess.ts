import { useEffect, useState } from "react";
import { getCounterBoard, ensureCounterBoardStarted } from "../host/counterBoardHost";
import { subscribePath } from "../host/processUiBridge";
import { BOARD_PROCESS_PATH, findProcessByPath, type ProcessPath } from "../processPaths";

/**
 * Subscribe to a named @process path and re-render when markStateDirty runs on that process.
 */
export function useProcess<P extends ProcessPath>(path: P): ReturnType<typeof resolveProcess<P>> {
  const [, setTick] = useState(0);

  // Start before first paint so toolbar is not stuck on "Starting…" (effect alone never re-renders).
  if (path === BOARD_PROCESS_PATH) {
    ensureCounterBoardStarted();
  }

  useEffect(() => {
    return subscribePath(path, () => setTick((n) => n + 1));
  }, [path]);

  return resolveProcess(path);
}

function resolveProcess<P extends ProcessPath>(path: P) {
  if (path === BOARD_PROCESS_PATH) {
    return getCounterBoard() as ProcessForPath<P>;
  }
  const found = findProcessByPath(path);
  if (!found || found.__rangerId === 0) {
    return null as unknown as ProcessForPath<P>;
  }
  return found as ProcessForPath<P>;
}

type ProcessForPath<P extends ProcessPath> = P extends typeof BOARD_PROCESS_PATH
  ? import("../generated/counter_board").CounterBoardPage
  : import("../generated/counter_board").RangerProcessBase;
