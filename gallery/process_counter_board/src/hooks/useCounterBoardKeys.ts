import { useEffect } from "react";
import type { CounterBoardPage } from "../generated/counter_board";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function selectRow(page: CounterBoardPage, index: number): void {
  const n = page.rowCount();
  if (n === 0) return;
  let i = index;
  if (i < 0) i = 0;
  if (i >= n) i = n - 1;
  page.selectedIndex = i;
  page.markStateDirty();
}

/** CLI parity: +/−, arrows, space (+rep), r/enter (run/stop). */
export function useCounterBoardKeys(page: CounterBoardPage | null): void {
  useEffect(() => {
    if (!page || page.__rangerId === 0) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (isTypingTarget(ev.target)) return;

      const key = ev.key;
      let handled = true;

      switch (key) {
        case "ArrowUp":
          page.moveSelection(-1);
          break;
        case "ArrowDown":
          page.moveSelection(1);
          break;
        case "+":
        case "=":
          page.addRow();
          break;
        case "-":
        case "_":
          page.removeSelected();
          break;
        case " ":
          ev.preventDefault();
          page.addRepToSelected();
          break;
        case "r":
        case "R":
        case "Enter":
          page.toggleSelectedRun();
          break;
        default:
          handled = false;
      }

      if (handled) {
        ev.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page]);
}
