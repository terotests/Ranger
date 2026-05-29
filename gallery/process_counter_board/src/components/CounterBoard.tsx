import { ProcessNameRegistry, type CounterRowProcess } from "../generated/counter_board";
import { useProcess } from "../hooks/useProcess";
import { useCounterBoardTick } from "../hooks/useCounterBoardTick";
import { selectRow, useCounterBoardKeys } from "../hooks/useCounterBoardKeys";
import { BOARD_PROCESS_PATH } from "../processPaths";

export function CounterBoard() {
  const page = useProcess(BOARD_PROCESS_PATH);
  // Vite demo: named lookup via singleton registry (same instance as host start).
  const viaRegistry = new ProcessNameRegistry().findProcess(BOARD_PROCESS_PATH);
  useCounterBoardTick();
  useCounterBoardKeys(page);

  if (!page || page.__rangerId === 0) {
    return <p className="muted">Counter board not running — hard-refresh the page.</p>;
  }

  const n = page.rowCount();
  const rows: CounterRowProcess[] = page.rows ?? [];

  return (
    <div className="board" tabIndex={0}>
      <header>
        <h1>{page.title}</h1>
        <p className="meta">
          Process <code>{BOARD_PROCESS_PATH}</code> · id {page.__rangerId} · gen{" "}
          {page.__rangerStateGeneration}
        </p>
        <p className="meta registry-lookup">
          <code>new ProcessNameRegistry().findProcess(...)</code>
          {viaRegistry && viaRegistry.__rangerId === page.__rangerId
            ? ` → same instance (#${viaRegistry.__rangerId})`
            : " → not found"}
        </p>
      </header>

      <div className="toolbar">
        <button type="button" onClick={() => page.addRow()}>
          + Row
        </button>
        <button type="button" onClick={() => page.removeSelected()} disabled={n === 0}>
          − Remove
        </button>
        <button type="button" onClick={() => page.moveSelection(-1)} disabled={n === 0}>
          ↑
        </button>
        <button type="button" onClick={() => page.moveSelection(1)} disabled={n === 0}>
          ↓
        </button>
        <button type="button" onClick={() => page.addRepToSelected()} disabled={n === 0}>
          + Rep
        </button>
        <button type="button" onClick={() => page.toggleSelectedRun()} disabled={n === 0}>
          Run / Stop
        </button>
      </div>

      <ul className="rows">
        {n === 0 ? (
          <li className="empty">No rows — press + Row</li>
        ) : (
          rows.map((row, i) => {
            const selected = i === page.selectedIndex;
            const run = row.running ? "RUN" : "STOP";
            return (
              <li
                key={row.__rangerId || i}
                role="button"
                tabIndex={0}
                className={selected ? "row selected" : "row"}
                onClick={() => selectRow(page, i)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    ev.stopPropagation();
                    selectRow(page, i);
                  }
                }}
              >
                <span className="label">{row.label}</span>
                <span>reps={row.value}</span>
                <span>ticks={row.tickCount}</span>
                <span className="run">{run}</span>
              </li>
            );
          })
        )}
      </ul>

      <footer className="footer">
        <span>rows={n}</span>
        <span>sum={page.sumValues()}</span>
        <span className="keys-hint">
          ↑↓ select · click row · space +rep · r run · +/− row
        </span>
      </footer>
    </div>
  );
}
