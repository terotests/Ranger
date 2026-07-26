// ============================================================================
// useDragGesture.js — one canonical drag state for a pointer-driven canvas.
// ============================================================================
//
// WHY THIS EXISTS
//
// SplineCanvas and Preview3D each hand-rolled the same gesture plumbing: a
// hit-test on pointerdown, `setPointerCapture`, some state to remember what is
// being dragged, and a reset on pointerup. SplineCanvas kept FOUR independent
// mutable flags for it:
//
//     let dragging = null;          // a knot / handle
//     let draggingChild = null;     // a sub-object attach box
//     let draggingNormal = null;    // 'start' | 'end' of the placement normal
//     let draggingTranslate = false // whole-shape translate
//
// Independent flags make contradictory states representable — dragging a knot
// and translating at the same time is a state the type system happily allows and
// nothing rejects. That is the same "mode soup" class of bug IDEAL.md §0.1 lists
// as a runtime-correctness failure in the v1 SDL runner ("a boolean-flag mode
// soup that made contradictory states representable"), and every `pointerup` had
// to remember to clear all four or a stale flag leaked into the next gesture.
//
// A drag is, by definition, ONE thing at a time. So this models it as one slot:
// either nothing is being dragged, or exactly one `{ kind, payload }` is. The
// illegal states stop existing rather than being avoided by discipline.
//
// It is deliberately framework-light: a plain closure over one variable, no Vue
// reactivity. Gesture state must NOT be reactive — a pointermove that triggers a
// re-render mid-drag is how you get dropped frames and re-entrancy.
// ============================================================================

/**
 * @param {object} [opts]
 * @param {() => (HTMLElement|null|undefined)} [opts.element] the capture target,
 *   read lazily because the canvas ref is null until mount.
 */
export function useDragGesture(opts = {}) {
  const elementOf = opts.element || (() => null);

  /** @type {{ kind: string, payload: any } | null} — the whole state. */
  let active = null;

  /**
   * Start a drag. Captures the pointer so the gesture keeps receiving moves
   * after the cursor leaves the element (the reason every one of these call
   * sites had a setPointerCapture next to it).
   *
   * @param {string} kind  what is being dragged ("knot", "child", "orbit", ...)
   * @param {any}    payload  whatever the mover needs (an id, a handle, an axis)
   * @param {PointerEvent} [event]
   */
  function begin(kind, payload = null, event = undefined) {
    active = { kind, payload };
    const el = elementOf();
    if (el && event && event.pointerId != null && el.setPointerCapture) {
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // Capture is an optimisation, not a correctness requirement: a browser
        // that refuses it still delivers moves while the button is held.
      }
    }
    return active;
  }

  /** True when any drag is live, or when the live drag is one of `kinds`. */
  function isActive(...kinds) {
    if (!active) return false;
    return kinds.length === 0 || kinds.includes(active.kind);
  }

  /** The payload if `kind` is the live drag, else null. */
  function payloadOf(kind) {
    return active && active.kind === kind ? active.payload : null;
  }

  /** The live kind, or null. */
  function kind() {
    return active ? active.kind : null;
  }

  /** Replace the payload of the live drag (e.g. remember the last world point). */
  function setPayload(payload) {
    if (active) active.payload = payload;
  }

  /**
   * Finish the gesture. Returns the `{kind, payload}` that WAS active (or null),
   * so a caller can decide whether to emit a commit — the previous code had to
   * test four flags before emitting `drag-end`.
   */
  function end(event = undefined) {
    const was = active;
    active = null;
    const el = elementOf();
    if (el && event && event.pointerId != null && el.releasePointerCapture) {
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        // Already released (the browser does it implicitly on pointerup).
      }
    }
    return was;
  }

  return { begin, isActive, payloadOf, kind, setPayload, end };
}
