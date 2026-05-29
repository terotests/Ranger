import { ProcessNameRegistry, type ProcessPath } from "./generated/counter_board";

export type { ProcessPath };

/** Named path for CounterBoardPage (@name in counter_board.rgr). */
export const BOARD_PROCESS_PATH = "app.counterBoard" as const;

/**
 * Named @process lookup from TypeScript.
 * `new ProcessNameRegistry()` returns the same singleton instance each time (see generated constructor).
 */
export function findProcessByPath<P extends ProcessPath>(path: P) {
  return new ProcessNameRegistry().findProcess(path);
}
