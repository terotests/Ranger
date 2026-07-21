// ============================================================================
// editHistory.js — immutable undo/redo buffer for editor shape snapshots.
// ============================================================================

/**
 * Lightweight history stack (no Zustand). Snapshots are plain JSON-safe clones.
 * Call push() *before* a mutating edit with the current (pre-edit) shape.
 */
export function createEditHistory({ limit = 80 } = {}) {
  /** @type {{ label: string, data: any }[]} */
  let past = [];
  /** @type {{ label: string, data: any }[]} */
  let future = [];

  function canUndo() {
    return past.length > 0;
  }
  function canRedo() {
    return future.length > 0;
  }

  function clear() {
    past = [];
    future = [];
  }

  /**
   * @param {any} snapshot plain object from snapshotShape() — state *before* the edit
   * @param {string} [label]
   */
  function push(snapshot, label = "") {
    const data = JSON.parse(JSON.stringify(snapshot));
    const serialized = JSON.stringify(data);
    // Skip only consecutive duplicate pre-states (e.g. double commitToHistory).
    if (past.length && JSON.stringify(past[past.length - 1].data) === serialized) {
      return false;
    }
    past.push({ label, data });
    if (past.length > limit) past.shift();
    future = [];
    return true;
  }

  /** Reset stacks after load/reset (does not push). */
  function baseline(_snapshot) {
    future = [];
  }

  /**
   * @param {any} currentSnapshot state *after* edits (goes onto redo stack)
   * @returns {any|null} previous snapshot to restore
   */
  function undo(currentSnapshot) {
    if (!past.length) return null;
    future.push({ label: "redo", data: JSON.parse(JSON.stringify(currentSnapshot)) });
    const prev = past.pop();
    return prev.data;
  }

  /**
   * @param {any} currentSnapshot
   * @returns {any|null}
   */
  function redo(currentSnapshot) {
    if (!future.length) return null;
    past.push({ label: "undo-point", data: JSON.parse(JSON.stringify(currentSnapshot)) });
    const next = future.pop();
    return next.data;
  }

  function info() {
    return {
      canUndo: canUndo(),
      canRedo: canRedo(),
      past: past.length,
      future: future.length,
    };
  }

  return { push, baseline, undo, redo, clear, canUndo, canRedo, info };
}
