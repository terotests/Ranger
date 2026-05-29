import { useEffect } from "react";
import { useProcess } from "./useProcess";
import { BOARD_PROCESS_PATH } from "../processPaths";

const PULSE_EVERY_MS = 400;
const FRAMES_PER_PULSE = 5;

/**
 * Host run-loop slice: pulse running rows on an interval (like CLI demo).
 */
export function useCounterBoardTick(): void {
  const page = useProcess(BOARD_PROCESS_PATH);

  useEffect(() => {
    if (!page) return;

    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      if (frame % FRAMES_PER_PULSE !== 0) return;
      page.pulseAll();
    }, PULSE_EVERY_MS);

    return () => window.clearInterval(id);
  }, [page]);
}
