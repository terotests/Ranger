/**
 * Ranger render stress — how far the EVG pipeline goes before a frame drops.
 *
 * Three clocks, because they are three different questions:
 *
 *   paint      the list is already in memory; only `renderDisplayList` +
 *              `gl.finish`. The painter's ceiling.
 *   retained   the tree is kept; layout + display list + paint. A hover, a
 *              transition, anything that does not rebuild.
 *   rebuild    `buildHost` again, then the lot. A sort, a page change, a
 *              tree literal that starts over.
 *
 * Synthetic lists (rects, text) have no controller at all — they exist so
 * the painter can be asked about command count without TableCtl.build()
 * sitting on the answer.
 */

import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import * as HostModule from "../bin/ui_host.cjs";
import { buildHost } from "../conformance/build-host.cjs";
import { THEME_CSS } from "./generated.js";
import { PAGE, fixtureFor } from "./scenes.js";

const canvas = document.getElementById("evg");
const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: true,
});
if (!gl) throw new Error("WebGL 2 is not available");

const W = PAGE.width;
const H = PAGE.height;

function now() {
  return performance.now();
}

function median(xs) {
  const a = xs.filter((v) => typeof v === "number" && !Number.isNaN(v)).sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function p95(xs) {
  const a = xs.filter((v) => typeof v === "number" && !Number.isNaN(v)).sort((x, y) => x - y);
  if (!a.length) return 0;
  return a[Math.min(a.length - 1, Math.ceil(a.length * 0.95) - 1)];
}

function fps(ms) {
  return ms > 0 ? 1000 / ms : 0;
}

function paint(list) {
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = W;
  canvas.height = H;
  const stats = renderDisplayList(gl, { width: W, height: H, list }, { dpr: 1 });
  gl.finish();
  return stats;
}

function rectList(n) {
  const cmds = [];
  const cols = 50;
  const cell = 12;
  for (let i = 0; i < n; i++) {
    cmds.push({
      k: 0,
      x: (i % cols) * cell,
      y: Math.floor(i / cols) * cell,
      w: cell - 1,
      h: cell - 1,
      r: 4,
      c: [0.2 + (i % 7) * 0.08, 0.35, 0.85 - (i % 5) * 0.08, 1],
    });
  }
  return { cmds };
}

function textList(n, unique) {
  const cmds = [];
  const cols = 6;
  const cw = 140;
  const ch = 16;
  for (let i = 0; i < n; i++) {
    const label = unique ? "Row " + String(i).padStart(5, "0") : "Row item";
    cmds.push({
      k: 3,
      x: (i % cols) * cw + 4,
      y: Math.floor(i / cols) * ch + 12,
      w: cw,
      h: ch,
      c: [0.1, 0.12, 0.18, 1],
      text: label,
      font: "sans-serif",
      size: 12,
    });
  }
  return { cmds };
}

function timePaint(list, reps) {
  paint(list); // programs, atlas, first upload
  paint(list); // a second frame, so the first hitch is not in the sample
  const samples = [];
  for (let i = 0; i < reps; i++) {
    const t0 = now();
    paint(list);
    samples.push(now() - t0);
  }
  return {
    median_ms: median(samples),
    p95_ms: p95(samples),
    fps: fps(median(samples)),
    cmds: list.cmds.length,
    samples: samples.length,
  };
}

function mountKit(kind, n, pageSize) {
  const host = buildHost(HostModule, fixtureFor({ kind, n, pageSize, id: kind + n }), THEME_CSS);
  host.setPageSize(W, H);
  return host;
}

function pipeline(host, withJson) {
  const t0 = now();
  const page = host.layout();
  const t1 = now();
  const lay = new HostModule.EVGLayout();
  lay.setPageSize(host.pageWidth, host.pageHeight);
  const dl = new HostModule.EVGDisplayList();
  dl.setTextEngine(lay.getTextEngine());
  dl.build(page);
  const t2 = now();
  let list;
  let json_ms = 0;
  let parse_ms = 0;
  let json_bytes = 0;
  if (withJson) {
    const json = dl.toJson();
    const t3 = now();
    list = JSON.parse(json);
    const t4 = now();
    json_ms = t3 - t2;
    parse_ms = t4 - t3;
    json_bytes = json.length;
  } else {
    // The painter speaks JSON-shaped commands. A native host skips this; the
    // browser host the showcase uses does not. When we want "retained without
    // the tax" we still have to cross the seam once.
    const json = dl.toJson();
    list = JSON.parse(json);
    json_bytes = json.length;
  }
  const t5 = now();
  const glStats = paint(list);
  const t6 = now();
  return {
    layout_ms: t1 - t0,
    dl_ms: t2 - t1,
    json_ms,
    parse_ms,
    gl_ms: t6 - t5,
    total_ms: t6 - t0,
    cmds: typeof dl.count === "function" ? dl.count() : list.cmds.length,
    json_bytes,
    drawn: glStats.drawn,
    list,
  };
}

function timeFn(fn, warm, timed) {
  for (let i = 0; i < warm; i++) fn();
  const samples = [];
  for (let i = 0; i < timed; i++) {
    const t0 = now();
    const out = fn();
    samples.push({ ms: now() - t0, out });
  }
  return {
    median_ms: median(samples.map((s) => s.ms)),
    p95_ms: p95(samples.map((s) => s.ms)),
    fps: fps(median(samples.map((s) => s.ms))),
    last: samples[samples.length - 1].out,
    samples: samples.length,
  };
}

const PAINT_REPS = 12;
const PIPE_WARM = 1;
const PIPE_TIMED = 4;

/**
 * Stop a series once a sample is this slow — further N is the same shape
 * and only burns the clock.
 */
const GIVE_UP_MS = 800;

export async function runStress() {
  const rows = [];

  const push = (row) => {
    rows.push(row);
    return row.median_ms >= GIVE_UP_MS;
  };

  // --- painter only: rects ------------------------------------------------
  for (const n of [1000, 5000, 10000, 25000, 50000, 100000, 200000]) {
    const list = rectList(n);
    const t = timePaint(list, PAINT_REPS);
    if (push({
      group: "paint-rects",
      id: "rects-" + n,
      n,
      path: "paint",
      ...t,
    })) break;
  }

  // --- painter only: text -------------------------------------------------
  for (const [n, unique, tag] of [
    [500, false, "text-repeat-500"],
    [2000, false, "text-repeat-2000"],
    [2000, true, "text-unique-2000"],
    [8000, false, "text-repeat-8000"],
    [8000, true, "text-unique-8000"],
  ]) {
    const list = textList(n, unique);
    const t = timePaint(list, unique ? 6 : PAINT_REPS);
    if (push({
      group: "paint-text",
      id: tag,
      n,
      path: "paint",
      unique: unique ? 1 : 0,
      ...t,
    })) break;
  }

  // --- real controllers ---------------------------------------------------
  const tables = [
    { n: 100, pageSize: 100 },
    { n: 200, pageSize: 200 },
    { n: 400, pageSize: 400 },
    { n: 800, pageSize: 800 },
    { n: 1600, pageSize: 1600 },
  ];

  for (const spec of tables) {
    let host;
    let built;
    try {
      const t0 = now();
      host = mountKit("table", spec.n, spec.pageSize);
      built = now() - t0;
    } catch (e) {
      rows.push({
        group: "table",
        id: "table-" + spec.n,
        n: spec.n,
        path: "rebuild",
        error: String(e && e.message ? e.message : e),
      });
      break;
    }

    const retained = timeFn(() => pipeline(host, false), PIPE_WARM, PIPE_TIMED);
    const list = retained.last.list;
    const paintOnly = timePaint(list, PAINT_REPS);

    const rebuild = timeFn(() => {
      const h = mountKit("table", spec.n, spec.pageSize);
      return pipeline(h, true);
    }, PIPE_WARM, spec.n >= 800 ? 2 : PIPE_TIMED);

    rows.push({
      group: "table",
      id: "table-" + spec.n + "-paint",
      n: spec.n,
      path: "paint",
      ...paintOnly,
    });
    rows.push({
      group: "table",
      id: "table-" + spec.n + "-retained",
      n: spec.n,
      path: "retained",
      median_ms: retained.median_ms,
      p95_ms: retained.p95_ms,
      fps: retained.fps,
      cmds: retained.last.cmds,
      layout_ms: retained.last.layout_ms,
      dl_ms: retained.last.dl_ms,
      gl_ms: retained.last.gl_ms,
      json_bytes: retained.last.json_bytes,
    });
    rows.push({
      group: "table",
      id: "table-" + spec.n + "-rebuild",
      n: spec.n,
      path: "rebuild",
      median_ms: rebuild.median_ms,
      p95_ms: rebuild.p95_ms,
      fps: rebuild.fps,
      cmds: rebuild.last.cmds,
      build_ms: built,
      layout_ms: rebuild.last.layout_ms,
      dl_ms: rebuild.last.dl_ms,
      json_ms: rebuild.last.json_ms,
      gl_ms: rebuild.last.gl_ms,
      json_bytes: rebuild.last.json_bytes,
    });

    if (rebuild.median_ms >= GIVE_UP_MS) break;
  }

  for (const n of [200, 500, 1000, 2000]) {
    let host;
    try {
      host = mountKit("checkbox", n, n);
    } catch (e) {
      rows.push({
        group: "checkbox",
        id: "checkbox-" + n,
        n,
        path: "rebuild",
        error: String(e && e.message ? e.message : e),
      });
      break;
    }
    const retained = timeFn(() => pipeline(host, false), PIPE_WARM, PIPE_TIMED);
    const paintOnly = timePaint(retained.last.list, PAINT_REPS);
    const rebuild = timeFn(() => {
      const h = mountKit("checkbox", n, n);
      return pipeline(h, true);
    }, PIPE_WARM, n >= 1000 ? 2 : PIPE_TIMED);

    rows.push({
      group: "checkbox",
      id: "checkbox-" + n + "-paint",
      n,
      path: "paint",
      ...paintOnly,
    });
    rows.push({
      group: "checkbox",
      id: "checkbox-" + n + "-rebuild",
      n,
      path: "rebuild",
      median_ms: rebuild.median_ms,
      p95_ms: rebuild.p95_ms,
      fps: rebuild.fps,
      cmds: rebuild.last.cmds,
    });
    if (rebuild.median_ms >= GIVE_UP_MS) break;
  }

  return {
    gl: gl.getParameter(gl.VERSION),
    renderer: gl.getParameter(gl.RENDERER),
    rows,
    ceilings: ceilings(rows),
  };
}

function ceilings(rows) {
  const out = {};
  for (const budget of [16.7, 33.3]) {
    const label = budget < 20 ? "60fps" : "30fps";
    out[label] = {};
    for (const row of rows) {
      if (row.error || row.path == null) continue;
      const key = row.group + "/" + row.path;
      if (row.median_ms <= budget) {
        const prev = out[label][key];
        if (!prev || row.n > prev.n) out[label][key] = { n: row.n, ms: row.median_ms, cmds: row.cmds || 0 };
      }
    }
  }
  return out;
}

window.__runStress = runStress;
window.__STRESS_READY__ = true;
