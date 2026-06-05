import { ProcessRuntime, type CounterBoardPage } from "../generated/counter_board";
import { BOARD_PROCESS_PATH } from "../processPaths";
import { ensureCounterBoardStarted, getCounterBoard } from "./counterBoardHost";
import { createProcessRootHandle } from "./processRoot";
import { installProcessUiBridge, subscribePath } from "./processUiBridge";

export type CounterBoardSnapshot = CounterBoardPage;

export const counterBoardRoot = createProcessRootHandle<CounterBoardSnapshot>({
  rootPath: BOARD_PROCESS_PATH,
  getRoot: () => getCounterBoard(),
  buildSnapshot: (root) => root as CounterBoardPage,
  revisionOf: (root) => root.__rangerStateGeneration,
  installBridge: () => {
    installProcessUiBridge(counterBoardRoot.refreshSnapshot);
  },
  subscribePath,
  ProcessRuntime,
});

export function ensureCounterBoardRoot(): CounterBoardPage {
  const board = ensureCounterBoardStarted();
  counterBoardRoot.refreshSnapshot();
  return board;
}
