/**
 * hero.js — draw the front page's backdrop on the GPU, and rain on it.
 *
 * The picture is not an image file. `hero.json` is an EVG display list: flat
 * draw commands that lib/evg's layout engine produced from hero.tsx and
 * hero.css at build time. lib/evg/gl/evg-webgl.js — the same WebGL 2
 * painter the PowerPoint editor and the node-graph editor are drawn with —
 * turns those commands into geometry here, once, and then draws them every
 * frame through `evg-surface-effect: ripple`, which renders the finished
 * surface into a texture and puts it back through a fragment shader that
 * bends the sample position in rings travelling out from each drop.
 *
 * Everything this file adds is the weather: where the drops fall and how old
 * they are. The drops live in `doc.list.effect.drops` — the same array the
 * stylesheet's `evg-ripple-*` numbers configure — so the renderer is being
 * driven exactly as an application would drive it.
 *
 * If anything is missing (no WebGL 2, a failed fetch, reduced motion) the
 * section keeps the flat background its stylesheet gave it and nothing here
 * runs. The page must not depend on this having worked.
 */

const SCENE_W = 1600;
const SCENE_H = 900;
const MAX_DROPS = 8;          // the shader's own limit
const DEAD = 0.004;           // what the renderer treats as a spent drop
const RAIN_EVERY = 1.7;       // seconds between drops nobody asked for
const POINTER_EVERY = 0.09;   // seconds between drops from one moving pointer

export async function startHero(canvas, opts = {}) {
  if (!canvas) return null;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const gl = canvas.getContext("webgl2", {
    antialias: true, premultipliedAlpha: false, stencil: true, alpha: true,
  });
  if (!gl) return null;

  let evg;
  let doc;
  try {
    [evg, doc] = await Promise.all([
      import(opts.painter || "../gl/evg-webgl.js"),
      fetch(opts.list || "assets/hero/hero.json").then((r) => {
        if (!r.ok) throw new Error(`hero.json: ${r.status}`);
        return r.json();
      }),
    ]);
  } catch (err) {
    console.warn("hero backdrop unavailable:", err.message);
    return null;
  }

  const fx = doc.list.effect;
  if (!fx) return null;
  fx.drops = [];

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(SCENE_W * dpr);
  canvas.height = Math.round(SCENE_H * dpr);

  let frame = evg.prepareDisplayList(gl, doc, { dpr });
  canvas.dataset.ready = "1";

  /** Put a drop on the surface, oldest out when the shader is full. */
  const drop = (x, y) => {
    if (fx.drops.length >= MAX_DROPS) fx.drops.shift();
    fx.drops.push([x, y, 0]);
  };

  // A first ring so the surface is already moving when the page appears.
  drop(SCENE_W * 0.72, SCENE_H * 0.34);

  if (reduced) {
    // One frame, with one ring in it, and then nothing moves again.
    frame.draw();
    return { stop() { frame.dispose(); } };
  }

  let last = performance.now();
  let sinceRain = 0;
  let sincePointer = POINTER_EVERY;
  let running = true;
  let visible = true;
  let raf = 0;

  const tick = (now) => {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    for (const d of fx.drops) d[2] += dt;
    // The renderer stops at the same threshold; retiring them here keeps the
    // eight slots for rings somebody can still see.
    fx.drops = fx.drops.filter((d) => Math.exp(-d[2] * fx.decay) > DEAD);

    sinceRain += dt;
    sincePointer += dt;
    if (sinceRain >= RAIN_EVERY) {
      sinceRain = 0;
      drop(SCENE_W * (0.08 + Math.random() * 0.84), SCENE_H * (0.08 + Math.random() * 0.84));
    }

    frame.draw();
    if (visible) raf = requestAnimationFrame(tick);
  };

  const wake = () => { if (!raf && running && visible) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  // Only while the backdrop is on screen: a page scrolled past the first
  // screen should not be running a shader nobody is looking at.
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) wake();
  }, { rootMargin: "120px" });
  io.observe(canvas);

  const host = opts.host || canvas.parentElement || canvas;
  host.addEventListener("pointermove", (e) => {
    if (sincePointer < POINTER_EVERY) return;
    sincePointer = 0;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // The canvas is laid out with object-fit: cover, so the visible window is
    // the scene cropped on one axis. Undo that crop rather than stretching,
    // or a drop lands beside the pointer on wide screens.
    const scale = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    const x = (e.clientX - r.left - (r.width - SCENE_W * scale) / 2) / scale;
    const y = (e.clientY - r.top - (r.height - SCENE_H * scale) / 2) / scale;
    if (x < 0 || y < 0 || x > SCENE_W || y > SCENE_H) return;
    drop(x, y);
    wake();
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) wake();
  });

  wake();

  return {
    drop,
    stop() { running = false; io.disconnect(); if (raf) cancelAnimationFrame(raf); frame.dispose(); },
  };
}
