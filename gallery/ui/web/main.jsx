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
    const mo = new MutationObserver(schedule);
    mo.observe(radixRef.current, { attributes: true, childList: true, subtree: true });
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      mo.disconnect();
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      if (pending.current) cancelAnimationFrame(pending.current);
    };
  }, [observe, schedule]);

  /**
   * Radix → Ranger. The DOM side gets a real user event, so its focus and
   * state are genuine; the id under the pointer is all Ranger needs.
   */
  const onRadixPointer = useCallback(
    (e) => {
      const hit = e.target.closest("[data-tid]");
      host.click(hit ? hit.getAttribute("data-tid") : "");
      schedule();
    },
    [host, schedule],
  );

  /**
   * Ranger → Radix. The canvas has coordinates, so this is the one place the
   * EVG hit test runs for real. Mirroring it into the DOM is a simulation:
   * focus + click for an enabled control, blur otherwise — which is what the
   * headless oracle showed a real press does.
   */
  const onCanvasPointer = useCallback(
    (e) => {
      const r = canvasRef.current.getBoundingClientRect();
      const tid = host.pointerDown(e.clientX - r.left, e.clientY - r.top);
      const el = tid ? radixRef.current.querySelector(`[data-tid="${CSS.escape(tid)}"]`) : null;
      if (el && !el.disabled) {
        el.focus();
        el.click();
      } else if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      canvasRef.current.focus();
      schedule();
    },
    [host, schedule],
  );

  /** Keyboard is genuinely shared: one real key event, both sides handle it. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Tab") return; // the browser owns Tab; see PLAN.md
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
      if ("click" in step) {
        const el = radixRef.current.querySelector(`[data-tid="${CSS.escape(step.click)}"]`);
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
      }
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
          <div id="radix" ref={radixRef} onClickCapture={onRadixPointer}>
            <RadixApp fixture={spec.fixture} />
          </div>
        </section>

        <section>
          <h2>Ranger — EVG controllers → WebGL</h2>
          <p className="sub">
            Controllers mutating a display list, painted by <code>evg-webgl.js</code>. Clicking here
            runs the real EVG hit test.
          </p>
          <canvas ref={canvasRef} tabIndex={0} onPointerDown={onCanvasPointer} />
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
          </div>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById("app")).render(<Playground />);
