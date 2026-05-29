import { CounterBoardPage, ProcessRuntime } from "../generated/counter_board";
import { BOARD_PROCESS_PATH, findProcessByPath } from "../processPaths";

let board: CounterBoardPage | null = null;

export function ensureCounterBoardStarted(): CounterBoardPage {
  const existing = findProcessByPath(BOARD_PROCESS_PATH);
  if (existing && existing.__rangerId !== 0) {
    board = existing;
    return existing;
  }

  const page = new CounterBoardPage();
  // Ranger wraps `new` in .rgr with __rangerRegisterRoot; plain TS `new` must register before startInstance.
  if (page.__rangerId === 0) {
    page.__rangerRegisterRoot();
  }
  ProcessRuntime.startInstance(page);
  board = page;
  return page;
}

export function stopCounterBoard(): void {
  if (board && board.__rangerId !== 0) {
    ProcessRuntime.stopInstance(board);
  }
  board = null;
}

export function getCounterBoard(): CounterBoardPage | null {
  if (board && board.__rangerId !== 0) {
    return board;
  }
  const found = findProcessByPath(BOARD_PROCESS_PATH);
  if (found && found.__rangerId !== 0) {
    board = found;
    return found;
  }
  return null;
}
