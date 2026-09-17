/**
 * marks.js — the strip of language and platform marks under the hero.
 *
 * The stylesheet already scrolls it with a keyframe, which is what a page
 * with no JavaScript keeps. This replaces that with one offset advanced per
 * frame, because a keyframe cannot be grabbed: with the offset in a variable,
 * a drag and the drift are the same number and the strip carries on from
 * wherever it is let go, with the flick it was let go at.
 *
 * Everything here is optional. If it does not run, the CSS keyframe does.
 */

const DRIFT = -14;      // px per second, leftwards, slow enough to read past
const EASE = 0.55;      // seconds for a flick to settle back into the drift
const FLICK_MAX = 2600; // px per second a throw is clamped to

export function startMarks(root) {
  if (!root) return null;
  const clip = root.querySelector(".marks__clip");
  const track = root.querySelector(".marks__track");
  const runs = [...root.querySelectorAll(".marks__run")];
  if (!clip || !track || runs.length < 2) return null;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return null;   // the stylesheet has already stopped it

  // Enough copies that one run's width of travel never opens a gap on a wide
  // screen. The markup carries two; a 21:9 desktop wants more.
  const runWidth = () => runs[0].getBoundingClientRect().width;
  const fill = () => {
    const w = runWidth();
    if (!w) return;
    while (track.scrollWidth < clip.clientWidth + w * 2 && runs.length < 8) {
      const copy = runs[0].cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.append(copy);
      runs.push(copy);
    }
  };
  fill();

  track.style.animation = "none";
  clip.classList.add("is-live");

  let span = runWidth();
  let x = 0;
  let v = DRIFT;
  let dragging = false;
  let pointer = 0;
  let lastMoveAt = 0;
  let lastMoveX = 0;
  let flick = 0;
  let raf = 0;
  let visible = true;

  /** Keep the offset inside one run, so the copies cover what leaves. */
  const wrap = () => {
    if (span <= 0) return;
    while (x <= -span) x += span;
    while (x > 0) x -= span;
  };

  const draw = () => { track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`; };

  let last = performance.now();
  const tick = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging) {
      // Whatever it was thrown at, settling back into the drift.
      v += (DRIFT - v) * (1 - Math.exp(-dt / EASE));
      x += v * dt;
      wrap();
      draw();
    }
    if (visible) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  clip.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    pointer = e.clientX;
    lastMoveX = e.clientX;
    lastMoveAt = performance.now();
    flick = 0;
    clip.classList.add("is-dragging");
    clip.setPointerCapture?.(e.pointerId);
  });

  clip.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - pointer;
    pointer = e.clientX;
    x += dx;
    wrap();
    draw();
    // The speed of the last few milliseconds is what the throw is worth.
    const dt = (now - lastMoveAt) / 1000;
    if (dt > 0.004) {
      flick = Math.max(-FLICK_MAX, Math.min(FLICK_MAX, (e.clientX - lastMoveX) / dt));
      lastMoveX = e.clientX;
      lastMoveAt = now;
    }
    e.preventDefault();
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    clip.classList.remove("is-dragging");
    clip.releasePointerCapture?.(e.pointerId);
    // A throw that stopped before the finger lifted is not a throw. A quarter
    // of a second, not a twentieth: a real hand pauses, and so does the gap
    // between the last move event and the release.
    v = performance.now() - lastMoveAt < 260 && Math.abs(flick) > 40 ? flick : DRIFT;
    wake();
  };
  clip.addEventListener("pointerup", release);
  clip.addEventListener("pointercancel", release);

  // A drag that starts on a mark must not turn into an image drag.
  clip.addEventListener("dragstart", (e) => e.preventDefault());

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    if (visible) wake();
  }, { rootMargin: "100px" });
  io.observe(clip);

  addEventListener("resize", () => { span = runWidth(); fill(); wrap(); draw(); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) wake();
  });

  draw();
  wake();
  return { stop() { io.disconnect(); if (raf) cancelAnimationFrame(raf); } };
}
