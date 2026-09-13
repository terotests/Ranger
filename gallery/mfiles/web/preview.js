// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Preview tab's real viewers: the gallery's Word viewer (docx_viewer) and
// its spreadsheet (datagrid), each the same compiled Ranger app its own page
// runs, drawing into a canvas that sits UNDER the emulator's canvas. The
// emulator leaves a transparent hole where the preview goes and reports the
// box with `previewJson()`; this file keeps the viewer canvas on that box and
// hands it the pointer when the pointer is over the hole.
//
// Nothing loads until a preview is first asked for: the two engines are a few
// megabytes each, and most of a session never opens one.

import { renderDisplayList, loadImages, setFontFallback } from "./evg/gl/evg-webgl.js";

const ENGINES = {
  docx: { script: "viewers/docx_web.js", name: "DocxWeb" },
  xlsx: { script: "viewers/datagrid_web.js", name: "DataGridWeb" },
};

// The first family named is the face text is laid out in; the rest are the
// cuts and the per-codepoint fallback pool the viewers' own pages load.
const FONTS = [
  ["Open Sans", "OpenSans-Regular.ttf", { family: "Open Sans", weight: "400", style: "normal" }],
  [null, "OpenSans-Bold.ttf", { family: "Open Sans", weight: "700", style: "normal" }],
  [null, "OpenSans-Italic.ttf", { family: "Open Sans", weight: "400", style: "italic" }],
  [null, "OpenSans-BoldItalic.ttf", { family: "Open Sans", weight: "700", style: "italic" }],
  ["Noto Sans", "NotoSans-Regular.ttf", { family: "Noto Sans", weight: "400", style: "normal" }],
  [null, "NotoSans-Bold.ttf", { family: "Noto Sans", weight: "700", style: "normal" }],
  [null, "NotoEmoji-Regular.ttf", { family: "Noto Emoji", weight: "400", style: "normal" }],
];

const rangerBuffer = (ab) => {
  ab._view = new DataView(ab);
  return ab;
};

async function bytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.arrayBuffer();
}

const scripts = new Map();
function engine(kind) {
  const { script, name } = ENGINES[kind];
  return loadEngine(script, name);
}

/** A compiled Ranger app beside the page: its facade class, loaded once. */
export function loadEngine(script, name) {
  if (!scripts.has(script)) {
    // Each bundle runs in a function scope of its own, not as a <script> tag:
    // both are whole Ranger programs sharing class names (the EVG runtime, the
    // font manager, …), and two classic scripts declaring the same top-level
    // class make the second one a SyntaxError.
    scripts.set(
      script,
      fetch(script).then(async (res) => {
        if (!res.ok) throw new Error(`${script} did not load (${res.status}) — run npm run mfiles:web:page`);
        const found = new Function(`${await res.text()}\n;return typeof ${name} === "function" ? ${name} : undefined;\n//# sourceURL=${script}`)();
        if (!found) throw new Error(`${script} defined no ${name}`);
        return found;
      })
    );
  }
  return scripts.get(script);
}

let fontBytes = null;
function fonts() {
  if (!fontBytes) {
    fontBytes = Promise.all(FONTS.map(([, file]) => bytes(`fonts/${file}`))).then(async (all) => {
      if (typeof FontFace === "function" && document.fonts) {
        await Promise.all(
          FONTS.map(async ([, file, css], i) => {
            try {
              const face = new FontFace(css.family, all[i].slice(0), { weight: css.weight, style: css.style });
              await face.load();
              document.fonts.add(face);
            } catch (e) {
              console.warn(`could not register ${file} with the browser:`, e);
            }
          })
        );
      }
      setFontFallback([...new Set(FONTS.map(([, , css]) => css.family))]);
      return all;
    });
  }
  return fontBytes;
}

/** The shared faces into an app's FontManager (and, once, into the browser's). */
export async function withFonts(web) {
  const all = await fonts();
  FONTS.forEach(([family], i) => {
    const copy = rangerBuffer(all[i].slice(0));
    if (family) web.addFont(family, copy);
    else web.addFace(copy);
  });
}

/**
 * The preview layer. `canvas` is the viewer's own canvas, beneath the app's;
 * `onError` shows a failure the way the page shows its own.
 */
export function createPreview({ canvas, onError }) {
  const viewers = {}; // kind → { web, url }
  let want = null; // what the app last asked for: {kind,url,name,x,y,w,h}
  let busy = null;
  let dragging = false;
  let coasting = false;
  const blobs = new Map();

  const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });

  async function viewer(kind) {
    if (!viewers[kind]) {
      viewers[kind] = (async () => {
        const Engine = await engine(kind);
        const web = new Engine();
        if (kind === "docx") {
          web.start();
        } else {
          web.start(Math.max(1, want.w), Math.max(1, want.h));
        }
        await withFonts(web);
        return { web, url: "" };
      })();
    }
    return viewers[kind];
  }

  /** The document's own picture parts, as object URLs. */
  async function imagesFor(kind, web, doc) {
    const wanted = new Set(doc.list.cmds.filter((c) => c.k === 2 && c.src).map((c) => c.src));
    const out = new Map();
    if (kind !== "docx" || wanted.size === 0) return out;
    for (const src of wanted) {
      if (!blobs.has(src)) {
        const raw = web.imageBytes(src);
        const view = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
        if (!view || !(view.length || view.byteLength)) {
          blobs.set(src, null);
          continue;
        }
        const url = URL.createObjectURL(new Blob([view], { type: /\.png$/i.test(src) ? "image/png" : "image/jpeg" }));
        const got = await loadImages({ list: { cmds: [{ k: 2, src: url }] } }, { base: "" });
        blobs.set(src, got.get(url) || null);
      }
      out.set(src, blobs.get(src));
    }
    return out;
  }

  async function draw() {
    if (!want || !gl) return;
    const v = await viewer(want.kind);
    if (!want || v.url !== want.url) return;
    const { web } = v;
    let text;
    if (want.kind === "docx") {
      web.frameSize(want.w, want.h);
      text = web.frame();
    } else {
      web.resize(want.w, want.h);
      text = web.scene();
    }
    const doc = JSON.parse(text);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.round(want.w * dpr);
    const bh = Math.round(want.h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    renderDisplayList(gl, doc, { dpr, images: await imagesFor(want.kind, web, doc) });
    window.__mfPreviewDoc = doc;
  }

  async function open() {
    const target = want;
    if (!target) return;
    const v = await viewer(target.kind);
    if (v.url === target.url) return;
    const data = rangerBuffer(await bytes(target.url));
    // Every paint hands over a fresh request, so the same file is the same ask.
    if (!want || want.url !== target.url) return;
    blobs.clear();
    const ok = target.kind === "docx" ? v.web.openDocument(data, target.name) : v.web.openWorkbook(data, target.name);
    if (!ok) throw new Error(`the viewer could not open ${target.name}`);
    if (target.kind === "docx") {
      v.web.setContinuous(true);
      // A pane is narrower than a page: zoom until the paper fits across it.
      v.web.frameFit(0);
      const paper = v.web.frameWidth() | 0;
      if (paper > target.w) v.web.zoomBy(Math.max(0.3, (target.w - 16) / paper));
    }
    v.url = target.url;
  }

  function run(job) {
    busy = (busy || Promise.resolve())
      .then(job)
      .catch((e) => onError(e));
    return busy;
  }

  return {
    /** The app's `previewJson()`, after every paint of the app. */
    update(json) {
      const next = JSON.parse(json);
      if (!next) {
        want = null;
        canvas.style.display = "none";
        return;
      }
      const moved = !want || want.url !== next.url || want.x !== next.x || want.y !== next.y || want.w !== next.w || want.h !== next.h;
      want = next;
      canvas.style.display = "block";
      canvas.style.left = `${next.x}px`;
      canvas.style.top = `${next.y}px`;
      canvas.style.width = `${next.w}px`;
      canvas.style.height = `${next.h}px`;
      if (moved) run(async () => {
        await open();
        await draw();
      });
    },

    /** Is (x, y), in page pixels, over the viewer? */
    covers(x, y) {
      return !!want && x >= want.x && y >= want.y && x < want.x + want.w && y < want.y + want.h;
    },

    dragging: () => dragging,

    pointer(phase, x, y, ev) {
      if (!want) return;
      const px = Math.round(x - want.x);
      const py = Math.round(y - want.y);
      const kind = want.kind;
      const shift = !!ev.shiftKey;
      const ctrl = !!(ev.ctrlKey || ev.metaKey);
      if (phase === "down") dragging = true;
      if (phase === "move" && !dragging && kind === "xlsx") return;
      if (phase === "up") {
        if (!dragging) return;
        dragging = false;
      }
      run(async () => {
        const { web } = await viewer(kind);
        if (kind === "docx") {
          if (phase === "down") web.framePointer(px, py, true, true, false, shift);
          else if (phase === "move") {
            if (!web.framePointer(px, py, false, dragging, false, false)) return;
          } else web.framePointer(px, py, false, false, true, shift);
        } else {
          web.pointer(px, py, phase !== "up", shift, ctrl);
        }
        await draw();
      });
    },

    wheel(x, y, ev) {
      if (!want) return;
      const kind = want.kind;
      let dy = ev.deltaY;
      if (ev.deltaMode === 1) dy *= 16;
      else if (ev.deltaMode === 2) dy *= 400;
      const px = Math.round(x - want.x);
      const py = Math.round(y - want.y);
      run(async () => {
        const { web } = await viewer(kind);
        if (kind === "docx") {
          if (!web.frameWheel(Math.round(dy))) return;
          await draw();
          return;
        }
        const horizontal = ev.shiftKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY);
        const raw = horizontal ? ev.deltaX || ev.deltaY : ev.deltaY;
        if (horizontal) web.wheelX(px, py, raw < 0 ? 1 : -1);
        else web.wheel(px, py, raw < 0 ? 1 : -1);
        await draw();
        if (coasting) return;
        coasting = true;
        try {
          while (want && want.kind === "xlsx" && web.coasting()) {
            await new Promise((done) => requestAnimationFrame(() => done()));
            web.idle();
            await draw();
          }
        } finally {
          coasting = false;
        }
      });
    },
  };
}
