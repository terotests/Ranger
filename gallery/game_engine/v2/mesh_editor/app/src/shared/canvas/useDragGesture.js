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
//
// WHY SO SMALL — THE PART THAT NEEDED THINKING
//
// Drag code has a reputation for resisting abstraction, because every gesture
// looks bespoke: one edits a knot, one orbits a camera, one resizes an overlay
// square. Trying to unify what they *do* does fail. But sorting Preview3D's five
// mutables showed they were not five gestures at all — they were three
// different KINDS of thing wearing the same clothes:
//
//   1. Which gesture is live        draggingOrbit, surfaceDragging, regionDrag
//   2. That gesture's parameter     dragGuid (surface), downPos (tap)
//   3. A POLICY derived from (1)    blockHostOrbit
//
// Only (1) is genuinely shared, and it is a single value, because a pointer can
// only be doing one thing. (2) is per-gesture data that just needs somewhere to
// live — hence an opaque `payload` this module never interprets. (3) should
// never have been stored at all: `blockHostOrbit` was assigned in seven places
// and read by exactly one predicate, so a missed reset silently disabled camera
// orbit for the rest of the session. It is now computed from the live kind.
//
// So the abstraction is not "a drag framework". It is: one slot, an opaque
// payload, and the discipline of deriving policy instead of mirroring it. The
// varying parts — hit-testing, what a move means, what to emit on commit —
// stay in the component, where they belong.
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
