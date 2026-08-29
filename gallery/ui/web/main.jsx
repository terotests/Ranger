/**
 * The playground: real Radix on the left, Ranger's EVG controllers painted by
 * the WebGL painter on the right, and a live diff of the two behaviour traces.
 *
 * Everything shared with the headless gate is imported, not copied — the same
 * fixtures, the same host builder, the same DOM snapshot, the same diff rules.
 * A playground that measured differently from the gate would be worse than no
 * playground.
 *
 * The gate is still `npm run ui:report`. Here the pointer has to be MIRRORED
 * between two independent hosts, and a mirrored click is a simulation of a
 * click; keyboard is shared for real (one key event, both sides handle it).
 * So treat a divergence seen here as a lead, and confirm it headless.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { App as RadixApp } from "../conformance/dom/app.jsx";
import { snapshotDom } from "../conformance/dom/snapshot.js";
import { diffNodes, FIELDS } from "../conformance/diff.mjs";
import { buildHost } from "../conformance/build-host.cjs";
import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import * as HostModule from "../bin/ui_host.cjs";
import { SPECS, THEME_CSS } from "./generated.js";

/**
 * The specs, grouped by the component they exercise. A flat dropdown of 31
 * names was unreadable; a tree says at a glance which components exist, how
 * many specs each one has, and — once visited — which of them diverge.
 */
const GROUPS = (() => {
  const by = new Map();
  SPECS.forEach((s, index) => {
    const key = s.component || "—";
    if (!by.has(key)) by.set(key, []);
    // The component name is already the heading; repeating it in every row
    // just makes them all start with the same word.
    const label = s.name.replace(/^[a-z]+_/, "").replace(/_/g, " ");
    by.get(key).push({ index, label });
  });
  return [...by.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([component, specs]) => ({ component, specs }));
})();

const PAGE_W = 420;
const PAGE_H = 320;

/** Two frames: one React commit plus paint, the same wait the gate uses. */
const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

function useEvgHost(fixture, theme) {
  return useMemo(() => {
    const host = buildHost(HostModule, fixture, THEME_CSS);
    host.setPageSize(PAGE_W, PAGE_H);
    host.setTheme(theme);
    host.layout();
    // The EVG host, for anything driving this page from outside: a browser
    // test needs an item's RECTANGLE to press, and only the host knows where
    // layout put it. The same hook the accessibility audit page exposes, and
    // for the same reason — a canvas offers nothing to a query selector.
    window.__uiHost = host;
    return host;
  }, [fixture, theme]);
}

async function paint(canvas, host) {
  const list = JSON.parse(host.displayListJson());
  const doc = { width: PAGE_W, height: PAGE_H, list };
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = PAGE_W + "px";
  canvas.style.height = PAGE_H + "px";
  canvas.width = Math.round(PAGE_W * dpr);
  canvas.height = Math.round(PAGE_H * dpr);
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    premultipliedAlpha: false,
    stencil: true,
    // Without this the drawing buffer is undefined once the frame is
    // composited, so anything that READS the canvas — a screenshot, a
    // drawImage, an automated check — gets a stale frame or nothing at all.
    // It cost an hour of chasing a divergence that was only in the picture.
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL 2 is not available in this browser");
  await document.fonts.ready;
  await Promise.all(
    doc.list.cmds.filter((c) => c.text).map((c) => document.fonts.load(`${c.size}px "${c.font}"`)),
  );
  const stats = renderDisplayList(gl, doc, { dpr });
  // Handy when the canvas looks empty: says whether the painter drew nothing
  // or the display list was empty in the first place.
  window.__evgStats = { ...stats, cmds: doc.list.cmds.length };
}

function Playground() {
  const [specIndex, setSpecIndex] = useState(0);
  const [theme, setTheme] = useState("");
  const [rows, setRows] = useState([]);
  const [diffs, setDiffs] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // What each spec looked like the last time it was on screen, so the tree can
  // show where the divergences are without re-running everything.
  const [seen, setSeen] = useState({});

  const spec = SPECS[specIndex];
  const specName = spec.name;
  const host = useEvgHost(spec.fixture, theme);
  const radixRef = useRef(null);
  const canvasRef = useRef(null);

  const repaint = useCallback(async () => {
    try {
      await paint(canvasRef.current, host);
      setErr("");
    } catch (e) {
      setErr(String((e && e.message) || e));
    }
  }, [host]);

  /** Snapshot both sides and diff them, exactly as the gate does. */
  const observe = useCallback(async () => {
    await settle();
    await repaint();
    const dom = snapshotDom();
    const ranger = JSON.parse(host.traceJson()).nodes;
    const { diffs: d } = diffNodes("live", ranger, dom);
    const byTid = new Map();
    for (const n of ranger) byTid.set(n.tid, { tid: n.tid, ranger: n, dom: null });
    for (const n of dom) {
      const row = byTid.get(n.tid) || { tid: n.tid, ranger: null, dom: null };
      row.dom = n;
      byTid.set(n.tid, row);
    }
    setRows([...byTid.values()]);
    setDiffs(d);
    setSeen((prev) => ({ ...prev, [specName]: d.length }));
  }, [host, repaint, specName]);

  /**
   * Re-observe whenever the DOM side actually changes, instead of guessing how
   * long React needs. An observation taken straight after a key press can
   * catch the DOM before React has committed, and the panel then shows a
   * divergence that is not there — measured: a tab that had already activated
   * still read as inactive. A MutationObserver plus the focus events removes
   * the guess; the EVG side has no async, so its own calls stay explicit.
   */
  const pending = useRef(0);
  const schedule = useCallback(() => {
    if (pending.current) return;
    pending.current = requestAnimationFrame(() => {
      pending.current = 0;
      observe();
    });
  }, [observe]);

  useEffect(() => {
    observe();
    // Watch the panel AND the portals — an overlay's content is a child of
    // <body>, not of #radix, so a panel-scoped observer shows a stale dialog.
    // But not the playground's own chrome: rendering the trace table is itself
    // a mutation of <body>, so an unfiltered observer re-observes because it
    // just observed, forever. Anything inside #app that is not the panel is
    // this page's own furniture; anything outside #app is a portal.
    const app = document.getElementById("app");
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (!el) continue;
        if (radixRef.current.contains(el) || !app.contains(el)) {
          schedule();
          return;
        }
      }
    });
    mo.observe(document.body, { attributes: true, childList: true, subtree: true });
    const onFocusIn = (e) => {
      if (tabbing.current && !driving.current) {
        tabbing.current = false;
        const hit = e.target.closest && e.target.closest("[data-tid]");
        if (hit) host.focus(hit.getAttribute("data-tid"));
      }
      schedule();
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", schedule);
    return () => {
      mo.disconnect();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", schedule);
      // Clear the id as well as the frame. `schedule()` treats a non-zero
      // pending as "an observation is already on its way", so leaving the id
      // behind after cancelling it wedges the live view shut: every later
      // change returns early and the panel keeps showing — and scoring — the
      // trace from before the spec was switched. Measured: opening a menu
      // added five nodes to the DOM and the table still showed one, under a
      // green "traces agree".
      if (pending.current) cancelAnimationFrame(pending.current);
      pending.current = 0;
    };
  }, [observe, schedule, host]);

  /**
   * Radix → Ranger, listened for on the DOCUMENT rather than on the panel.
   *
   * Every overlay — dialog, popover, menu, tooltip — is rendered through a
   * portal, so its content is a child of <body>, not of #radix. A listener on
   * the panel therefore never sees a click on a dialog's Cancel button, and
   * the two sides silently stop agreeing the moment anything opens. Measured:
   * replaying the alert-dialog spec through the panel-scoped handler produced
   * eleven divergences that the headless gate does not have.
   *
   * Only elements the fixture tagged are acted on, so the sidebar and the
   * header are not mistaken for the page under test. A click inside #radix
   * that lands on nothing still blurs, which is what a browser does.
   */
  /**
   * Set while the page is driving the DOM side itself — the canvas mirror and
   * the spec replay both synthesise real events, and a real event reaches the
   * document listeners below. Without this the EVG side gets the input twice:
   * measured as a dialog that closed and then immediately blurred its own
   * trigger, because the second dispatch found the close button gone.
   */
  const driving = useRef(false);
  /** Set between a Tab keydown and the focusin it causes. */
  const tabbing = useRef(false);
  /** The element a drag started in the Radix panel is measured against. */
  const domDragBounds = useRef("");
  // A drag of one thing onto another, started on the reference side.
  const domOnto = useRef(false);
  const drive = useCallback((fn) => {
    driving.current = true;
    try {
      fn();
    } finally {
      driving.current = false;
    }
  }, []);

  useEffect(() => {
    const fromCanvas = (e) =>
      driving.current || (canvasRef.current && canvasRef.current.contains(e.target));
    const tidOf = (e) => {
      const hit = e.target.closest && e.target.closest("[data-tid]");
      return hit ? hit.getAttribute("data-tid") : null;
    };

    // POINTERDOWN, not click. A menu opens on pointer down and portals its
    // surface directly under the cursor, so by the time the click event fires
    // the target is the menu, not the trigger — the EVG side was told about a
    // press on a node that had not existed a moment earlier, and never opened
    // at all. Measured: five nodes on the Radix side, one on this one.
    // It is also the more faithful event: UiHost's own entry point is
    // pointerDown(), and both sides are observed once everything has settled.
    // The fraction across the element the control drags against, read off the
    // DOM's own geometry. Both hosts are asked about the same element, so a
    // grab on an 18px thumb and one on a 200px rail mean the same point.
    const fracFor = (boundsTid, e) => {
      const el = document.querySelector(`[data-tid="${CSS.escape(boundsTid)}"]`);
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return b.width ? (e.clientX - b.x) / b.width : 0;
    };
    const onDown = (e) => {
      if (fromCanvas(e)) return;
      const tid = tidOf(e);
      if (tid === null && !radixRef.current.contains(e.target)) return;
      if (tid && host.dragsOntoFor(tid)) {
        // The same gesture from the other side: the reference is being dragged
        // with the real pointer, and the EVG list follows it by test id.
        domOnto.current = true;
        host.pressOn(tid);
        schedule();
        return;
      }
      const boundsTid = tid ? host.dragBoundsFor(tid) : "";
      if (boundsTid) {
        // A drag, not a click. Radix is already handling the real pointer; the
        // EVG side follows it by fraction until the button comes up.
        domDragBounds.current = boundsTid;
        host.pressTid(tid, fracFor(boundsTid, e));
        schedule();
        return;
      }
      host.click(tid || "");
      schedule();
    };
    const onMove = (e) => {
      if (fromCanvas(e)) return;
      if (domOnto.current) {
        const over = tidOf(e);
        if (over) host.dragOnto(over);
        schedule();
        return;
      }
      if (!domDragBounds.current) return;
      host.dragFraction(fracFor(domDragBounds.current, e));
      schedule();
    };
    const onUp = () => {
      if (domOnto.current) {
        domOnto.current = false;
        host.releaseDrag();
        schedule();
        return;
      }
      if (!domDragBounds.current) return;
      domDragBounds.current = "";
      host.pointerUp();
      schedule();
    };
    // A tooltip and a hover card have no other input than this.
    const onOver = (e) => {
      if (fromCanvas(e)) return;
      const tid = tidOf(e);
      if (tid) host.hover(tid);
      else host.unhover();
      schedule();
    };
    const onContext = (e) => {
      if (fromCanvas(e)) return;
      const tid = tidOf(e);
      if (tid) host.rightClick(tid);
      schedule();
    };

    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("contextmenu", onContext, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("contextmenu", onContext, true);
    };
  }, [host, schedule]);

  /**
   * Ranger → Radix. The canvas has coordinates, so this is the one place the
   * EVG hit test runs for real. Mirroring it into the DOM is a simulation:
   * focus + click for an enabled control, blur otherwise — which is what the
   * headless oracle showed a real press does.
   */
  /**
   * Canvas → Radix for a drag. The EVG side is driven by its own hit test and
   * its own geometry; this puts the same gesture on the reference by asking
   * both hosts for the fraction across the SAME element — the one the control
   * drags against, which for a slider is the track whether you grabbed the
   * rail or the thumb.
   */
  const dragging = useRef(false);
  const pressedTid = useRef("");
  /**
   * Pointer capture, faked for the length of a canvas-driven drag.
   *
   * Radix grabs the pointer with `setPointerCapture(event.pointerId)` and then
   * ignores every move where `event.target.hasPointerCapture(id)` is false.
   * Neither can work here: the real pointer is on the CANVAS, which holds the
   * capture, and the events going to Radix are replayed. Both failures were
   * measured, one after the other — first the capture call threw inside
   * Radix's own handler and it never started dragging, then with that stubbed
   * it took the press and dropped every move.
   *
   * So for the duration of one mirrored drag: capture is a no-op and every
   * element claims to hold it. Three prototype methods, restored on release.
   * The headless gate drives Radix with a real mouse and needs none of this.
   */
  const savedCapture = useRef(null);
  const stubPointerCapture = useCallback((on) => {
    if (on && !savedCapture.current) {
      savedCapture.current = [
        Element.prototype.setPointerCapture,
        Element.prototype.releasePointerCapture,
        Element.prototype.hasPointerCapture,
      ];
      Element.prototype.setPointerCapture = function () {};
      Element.prototype.releasePointerCapture = function () {};
      Element.prototype.hasPointerCapture = function () {
        return true;
      };
    } else if (!on && savedCapture.current) {
      [
        Element.prototype.setPointerCapture,
        Element.prototype.releasePointerCapture,
        Element.prototype.hasPointerCapture,
      ] = savedCapture.current;
      savedCapture.current = null;
    }
  }, []);
  const mirrorDrag = useCallback(
    (tid, e) => {
      const boundsTid = host.dragBoundsFor(tid);
      if (!boundsTid) return;
      const el = document.querySelector(`[data-tid="${CSS.escape(boundsTid)}"]`);
      if (!el) return;
      const b = el.getBoundingClientRect();
      const cr = canvasRef.current.getBoundingClientRect();
      const evgBox = host.findEl(host.root, boundsTid);
      if (!evgBox || !evgBox.calculatedWidth) return;
      const frac = (e.clientX - cr.left - evgBox.calculatedX) / evgBox.calculatedWidth;
      drive(() => {
        const x = b.x + b.width * frac;
        const y = b.y + b.height / 2;
        el.dispatchEvent(
          new PointerEvent(dragging.current ? "pointermove" : "pointerdown", {
            bubbles: true,
            pointerType: "mouse",
            clientX: x,
            clientY: y,
            buttons: 1,
            pointerId: 1,
            isPrimary: true,
          }),
        );
      });
    },
    [host, drive],
  );

  /**
   * The other kind of drag: one thing onto another.
   *
   * A slider's drag is a fraction of a track, and the mirror has to compute
   * that fraction. This one is simpler and more robust — what matters is which
   * ITEM the pointer is over, which is a test id on both sides, so the mirror
   * dispatches at the centre of the element carrying the same id. Nothing has
   * to agree about geometry for the two lists to reorder together.
   */
  const ontoDrag = useRef(false);
  const mirrorOnto = useCallback(
    (tid, kind) => {
      const el = tid ? document.querySelector(`[data-tid="${CSS.escape(tid)}"]`) : null;
      if (!el) return;
      const b = el.getBoundingClientRect();
      drive(() => {
        // A real mousedown focuses what it lands on; a synthetic one does not,
        // because focusing is the browser's default action and not part of the
        // event. Without this the panel reported the pressed item as focused
        // on the EVG side and not on the reference — a divergence the headless
        // gate, which uses real input, does not have.
        if (kind === "pointerdown" && el.focus) el.focus();
        el.dispatchEvent(
          new PointerEvent(kind, {
            bubbles: true,
            pointerType: "mouse",
            clientX: b.x + b.width / 2,
            clientY: b.y + b.height / 2,
            buttons: kind === "pointerup" ? 0 : 1,
            pointerId: 1,
            isPrimary: true,
          }),
        );
      });
    },
    [drive],
  );

  const onCanvasDragMove = useCallback(
    (e) => {
      if (!dragging.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      if (ontoDrag.current) {
        const over = host.hitTest(e.clientX - r.left, e.clientY - r.top);
        if (over) {
          host.dragOnto(over);
          mirrorOnto(over, "pointermove");
        }
        schedule();
        return;
      }
      host.pointerMove(e.clientX - r.left, e.clientY - r.top);
      // The bounds come from what was PRESSED, not from what is under the
      // cursor now — a drag routinely leaves the control it started on.
      mirrorDrag(pressedTid.current, e);
      schedule();
    },
    [host, mirrorDrag, mirrorOnto, schedule],
  );

  const onCanvasUp = useCallback(
    (e) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (ontoDrag.current) {
        ontoDrag.current = false;
        host.releaseDrag();
        mirrorOnto(pressedTid.current, "pointerup");
        stubPointerCapture(false);
        schedule();
        return;
      }
      host.pointerUp();
      stubPointerCapture(false);
      drive(() => {
        document.dispatchEvent(
          new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse", clientX: e.clientX, clientY: e.clientY }),
        );
      });
      schedule();
    },
    [host, drive, schedule, stubPointerCapture, mirrorOnto],
  );

  const onCanvasPointer = useCallback(
    (e) => {
      const r = canvasRef.current.getBoundingClientRect();
      // pressAt, not pointerDown: a slider's thumb is grabbed, not clicked, and
      // this is the one host with a real pointer to grab it with.
      const tid = host.pressAt(e.clientX - r.left, e.clientY - r.top);
      if (tid && host.dragsOntoFor(tid)) {
        // A press that will become a drag onto something else, so it is NOT
        // also a click: dnd-kit waits for the pointer to travel before a press
        // becomes a drag, and a click that never travels must leave the list
        // alone on both sides.
        //
        // preventDefault, because focusing the canvas is the browser's default
        // action for a press on it — and it happens AFTER this handler, so it
        // would undo the focus the mirror just gave the item. Measured: the
        // reference then never heard Space, because the element dnd-kit
        // listens on did not have focus.
        e.preventDefault();
        pressedTid.current = tid;
        ontoDrag.current = true;
        dragging.current = true;
        stubPointerCapture(true);
        host.pressOn(tid);
        mirrorOnto(tid, "pointerdown");
        try {
          canvasRef.current.setPointerCapture(e.pointerId);
        } catch {
          // A synthetic pointer has none to capture; the drag works without it.
        }
        // Focus stays on the MIRRORED element rather than moving to the canvas.
        // A sortable's next input is usually a key — Space picks the item up —
        // and the reference only hears it if the element it belongs to has
        // focus. The EVG side is not affected: the key handler is on `window`,
        // which sees the event wherever focus is.
        schedule();
        return;
      }
      if (host.dragBoundsFor(tid)) {
        pressedTid.current = tid;
        stubPointerCapture(true);
        mirrorDrag(tid, e);
        dragging.current = true;
        try {
          canvasRef.current.setPointerCapture(e.pointerId);
        } catch {
          // A synthetic pointer has none to capture; the drag works without it.
        }
        canvasRef.current.focus();
        schedule();
        return;
      }
      const el = tid ? document.querySelector(`[data-tid="${CSS.escape(tid)}"]`) : null;
      drive(() => {
        if (el && !el.disabled) {
          el.focus();
          el.click();
        } else if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
      });
      canvasRef.current.focus();
      schedule();
    },
    [host, schedule, drive, mirrorDrag, mirrorOnto, stubPointerCapture],
  );

  /**
   * Ranger → Radix for the pointer without a button. Same simulation caveat as
   * onCanvasPointer, and a little worse: React reconstructs enter/leave from
   * the bubbling `pointerover` / `pointerout` pair, so those are what get
   * dispatched. The EVG side is driven by its own hit test either way.
   */
  const hoveredTid = useRef("");
  const onCanvasMove = useCallback(
    (e) => {
      const r = canvasRef.current.getBoundingClientRect();
      const tid = host.hitTest(e.clientX - r.left, e.clientY - r.top);
      if (tid === hoveredTid.current) return;
      const find = (id) => (id ? document.querySelector(`[data-tid="${CSS.escape(id)}"]`) : null);
      const was = find(hoveredTid.current);
      if (was) {
        was.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }));
      }
      hoveredTid.current = tid;
      if (tid) {
        host.hover(tid);
        const el = find(tid);
        if (el) {
          el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
          el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
        }
      } else {
        host.unhover();
      }
      schedule();
    },
    [host, schedule],
  );

  const onCanvasLeave = useCallback(() => {
    hoveredTid.current = "";
    host.unhover();
    radixRef.current.dispatchEvent(
      new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }),
    );
    schedule();
  }, [host, schedule]);

  const onCanvasContext = useCallback(
    (e) => {
      e.preventDefault();
      const r = canvasRef.current.getBoundingClientRect();
      const tid = host.hitTest(e.clientX - r.left, e.clientY - r.top);
      host.rightClick(tid);
      const el = tid ? document.querySelector(`[data-tid="${CSS.escape(tid)}"]`) : null;
      if (el) el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
      canvasRef.current.focus();
      schedule();
    },
    [host, schedule],
  );

  /** Keyboard is genuinely shared: one real key event, both sides handle it. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Tab") {
        // The browser owns Tab (see PLAN.md), so the DOM side moves focus on
        // its own and the EVG side would otherwise be left behind — every
        // later key would then go to the wrong control. This is the ONE place
        // the page copies focus across rather than deriving it from input:
        // the focusin handler below reads the flag and does it.
        tabbing.current = true;
        return;
      }
      // The replay synthesises its own keydown and tells the host separately,
      // and a synthetic keydown bubbles to window like any other. Without this
      // the EVG side takes every replayed arrow twice: measured as a tab strip
      // that ended two steps past where the reference left it.
      if (driving.current) return;
      host.key(e.key === "Spacebar" ? " " : e.key);
      schedule();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [host, schedule]);

  /** Replay the spec's own steps, so the page shows what the gate measures. */
  const replay = useCallback(async () => {
    setBusy(true);
    for (const step of spec.steps) {
      // Every branch below synthesises the DOM event itself and then tells the
      // EVG host separately, so the document listeners must stay out of it.
      driving.current = true;
      if ("click" in step) {
        const el = document.querySelector(`[data-tid="${CSS.escape(step.click)}"]`);
        if (el && !el.disabled) {
          el.focus();
          el.click();
        } else if (document.activeElement) {
          document.activeElement.blur();
        }
        host.click(step.click);
      } else if ("key" in step) {
        const el = document.activeElement;
        if (el) {
          const opts = { key: step.key === " " ? " " : step.key, bubbles: true, cancelable: true };
          el.dispatchEvent(new KeyboardEvent("keydown", opts));
          el.dispatchEvent(new KeyboardEvent("keyup", opts));
          if (step.key === " " || step.key === "Enter") el.click();
        }
        host.key(step.key);
      } else if ("focus" in step) {
        const el = document.querySelector(`[data-tid="${CSS.escape(step.focus)}"]`);
        if (el) el.focus();
        host.focus(step.focus);
      } else if ("hover" in step) {
        const el = document.querySelector(`[data-tid="${CSS.escape(step.hover)}"]`);
        if (el) {
          el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
          el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
        }
        host.hover(step.hover);
      } else if ("unhover" in step) {
        // A tooltip stays up over a "grace area" between trigger and content,
        // and decides with a DOCUMENT pointermove carrying real coordinates —
        // a pointerout on the panel leaves it open. Measured: the replay
        // reported the tip still delayed-open after the step said it had left.
        // React derives pointerleave from a BUBBLING pointerout whose
        // relatedTarget is outside the element, so a bare pointerleave never
        // reaches the handler. Leave first, then move: the grace area is only
        // created on leave, and the document pointermove is what tells the
        // tooltip the pointer is no longer inside it.
        // The coordinates matter: a tooltip builds its grace polygon from the
        // point the pointer left at, so leaving at (0,0) and then moving to
        // (0,0) puts the pointer on a vertex of its own grace area and the tip
        // never closes. Leave from the middle of the control, as a hand would.
        for (const el of document.querySelectorAll("[data-tid]")) {
          const r = el.getBoundingClientRect();
          el.dispatchEvent(
            new PointerEvent("pointerout", {
              bubbles: true,
              pointerType: "mouse",
              relatedTarget: document.body,
              clientX: r.left + r.width / 2,
              clientY: r.top + r.height / 2,
            }),
          );
        }
        // Then WALK away, rather than teleport. A grace area is left by
        // crossing its edge, and the headless adapter needed the same thing:
        // one jump can land outside the polygon without a pointermove ever
        // reporting a point beyond it. Twelve steps to the far corner, which
        // is the direction nothing is portalled into.
        const toX = window.innerWidth - 2;
        const toY = window.innerHeight - 2;
        for (let i = 1; i <= 12; i += 1) {
          document.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles: true,
              pointerType: "mouse",
              clientX: (toX * i) / 12,
              clientY: (toY * i) / 12,
            }),
          );
        }
        host.unhover();
      } else if ("rightclick" in step) {
        const el = document.querySelector(`[data-tid="${CSS.escape(step.rightclick)}"]`);
        if (el) el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
        host.rightClick(step.rightclick);
      }
      driving.current = false;
      await observe();
      await new Promise((r) => setTimeout(r, 260));
    }
    setBusy(false);
  }, [spec, host, observe]);

  const mismatched = new Set(diffs.map((d) => d.tid + "." + d.field));
  const ok = diffs.length === 0;

  return (
    <>
      <header>
        <h1>gallery/ui — Radix vs Ranger EVG</h1>
        <label>
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={(e) => setTheme(e.target.checked ? "dark" : "")}
          />
          EVG dark theme
        </label>
        <button onClick={replay} disabled={busy}>
          {busy ? "replaying…" : "replay spec steps"}
        </button>
        <span className={"verdict " + (ok ? "ok" : "bad")}>
          {ok ? "traces agree" : diffs.length + " divergence" + (diffs.length === 1 ? "" : "s")}
        </span>
      </header>

      <div className="body">
        <nav className="tree" aria-label="Specs by component">
          <div className="count">
            <span>{GROUPS.length} components</span>
            <span>{SPECS.length} specs</span>
          </div>
          {GROUPS.map((g) => (
            <div className="group" key={g.component}>
              <div className="name">
                <span>{g.component}</span>
                <span className="n">{g.specs.length}</span>
              </div>
              {g.specs.map(({ index, label }) => {
                const d = seen[SPECS[index].name];
                const cls = d === undefined ? "dot" : d === 0 ? "dot ok" : "dot bad";
                return (
                  <button
                    key={index}
                    className="spec"
                    aria-current={index === specIndex ? "true" : undefined}
                    title={d === undefined ? "not visited yet" : d === 0 ? "traces agree" : d + " divergences"}
                    onClick={() => setSpecIndex(index)}
                  >
                    <span className={cls} />
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="content">
      <main>
        <section>
          <h2>Radix — React DOM</h2>
          <p className="sub">Real @radix-ui components. Click and type here; both sides follow.</p>
          {/*
            key=specName so React REMOUNTS the reference host on every spec
            change. Radix's controls are uncontrolled — a checkbox holds its own
            checked state — so an update in place leaves the previous spec's
            state behind while the EVG host is rebuilt from scratch, and the two
            sides start out of sync. Measured: replaying every spec in order
            reported seven divergences that the headless gate, which gets a
            fresh page each time, does not have.
          */}
          <div id="radix" ref={radixRef}>
            <RadixApp key={specName} fixture={spec.fixture} />
          </div>
        </section>

        <section>
          <h2>Ranger — EVG controllers → WebGL</h2>
          <p className="sub">
            Controllers mutating a display list, painted by <code>evg-webgl.js</code>. Clicking here
            runs the real EVG hit test.
          </p>
          <canvas
            ref={canvasRef}
            tabIndex={0}
            onPointerDown={onCanvasPointer}
            onPointerMove={(e) => (dragging.current ? onCanvasDragMove(e) : onCanvasMove(e))}
            onPointerUp={onCanvasUp}
            onPointerCancel={onCanvasUp}
            onPointerLeave={onCanvasLeave}
            onContextMenu={onCanvasContext}
          />
          {err ? <p className="note">painter: {err}</p> : null}
        </section>
      </main>

      <div className="trace">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>test id</th>
                {FIELDS.map((f) => (
                  <th key={f}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tid}>
                  <td className="tid">{row.tid}</td>
                  {FIELDS.map((f) => {
                    const bad = mismatched.has(row.tid + "." + f);
                    const rv = row.ranger ? row.ranger[f] : undefined;
                    const dv = row.dom ? row.dom[f] : undefined;
                    return (
                      <td key={f} className={bad ? "diff" : ""}>
                        {bad ? `${JSON.stringify(rv)} ≠ ${JSON.stringify(dv)}` : JSON.stringify(rv)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          One value means both sides agree. Two mean they do not — Ranger first, then Radix. The
          pointer is mirrored between two independent hosts here, so a mirrored click is a
          simulation of a click; the keyboard is shared for real. Confirm anything you see with{" "}
          <code>npm run ui:report</code>, which drives both sides with real input.
        </p>
        {spec.steps.some((st) => "unhover" in st) ? (
          <p className="note">
            <strong>Replaying an <code>unhover</code> step is not reliable.</strong> A Radix tooltip
            stays up over a grace area between the trigger and its content and leaves it only on a
            real pointer move, which no synthetic event reproduces — so the replay can leave the tip
            open and report a divergence the gate does not have. Hover the trigger with the mouse
            and move away: that path is real input on both sides, and it agrees.
          </p>
        ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById("app")).render(<Playground />);
