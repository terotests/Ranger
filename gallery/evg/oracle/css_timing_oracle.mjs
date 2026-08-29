/**
 * The browser, asked what CSS actually does with time.
 *
 *   node gallery/evg/oracle/css_timing_oracle.mjs
 *
 * Writes `css-timing.json` beside this file. Nothing in EVG reads it at run
 * time; `EVGTimingTest.rgr` is checked against it by hand, the same way the
 * dnd-kit capture works, so a disagreement is a decision someone made rather
 * than a test that quietly moved.
 *
 * Four questions, and the third is the reason this file exists at all:
 *
 *   1. What does each timing function output at a given input progress?
 *      Sampled off a real `Animation` rather than a formula, so a keyword's
 *      exact control points come from the engine and not from a blog post.
 *   2. Where is a transition with a DELAY during the delay — at the start
 *      value, or already moving?
 *   3. When a transition is reversed half way, is the shortened duration a
 *      fraction of the INPUT progress or of the EASED OUTPUT progress? The two
 *      differ by 20% of the duration on `ease-in` at the midpoint, and the
 *      spec's answer is not the one you would guess from the phrase "half way
 *      through".
 *   4. Does `transform: rotate()` interpolate as an angle, and about what?
 *
 * Every sample is taken with the animation PAUSED and `currentTime` set by
 * hand. Waiting real milliseconds and reading the result measures the machine's
 * scheduler as much as the engine, and the numbers move between runs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium, assertDomInstalled } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const FUNCTIONS = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
  "steps(4, end)",
  "steps(4, start)",
  // Two curves chosen to BREAK a Newton-only solver rather than to look
  // pretty. `cubic-bezier(1, 0, 0, 1)` has a derivative of zero at both ends
  // and near-zero across the middle, and a plain Newton iteration from t = x
  // diverges by six orders of magnitude a hair either side of 0.5 — while
  // landing exactly on 0.5 itself, which is why sampling the round numbers
  // hides it completely.
  "cubic-bezier(1, 0, 0, 1)",
  "cubic-bezier(0.999, 0, 0.001, 1)",
];

// The awkward values are deliberate. 0.499 and 0.501 straddle the point where
// a stiff curve's derivative vanishes; 0.05 and 0.95 sit where a solver that
// gives up at the ends is still plausible-looking in the middle.
const AT = [0, 0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.499, 0.5, 0.501, 0.6, 0.7, 0.75, 0.8, 0.9, 0.95, 1];

const PAGE = `<!doctype html><meta charset="utf-8">
<style>
  #probe { position: absolute; left: 0px; top: 0px; width: 100px; height: 40px;
           background-color: rgb(248, 250, 252); opacity: 1; transform: none; }
</style>
<div id="probe"></div>`;

async function capture(page) {
  return page.evaluate(
    async ([functions, at]) => {
      const el = document.getElementById("probe");
      const cs = () => getComputedStyle(el);
      const out = {};

      // --- 1. the timing functions themselves.
      //
      // `left` and not `opacity`: a cubic-bezier whose control points leave
      // [0,1] OVERSHOOTS, and opacity clamps. A clamped sample would report
      // the overshoot as flat and the checker built from it would then accept
      // an implementation that could not overshoot at all.
      out.functions = {};
      for (const easing of functions) {
        const anim = el.animate([{ left: "0px" }, { left: "1000px" }], {
          duration: 1000,
          easing,
          fill: "both",
        });
        anim.pause();
        const samples = [];
        for (const t of at) {
          anim.currentTime = t * 1000;
          samples.push(Number((parseFloat(cs().left) / 1000).toFixed(5)));
        }
        anim.cancel();
        out.functions[easing] = samples;
      }

      // --- 2. a transition with a delay.
      const bgAt = (spec, from, to, times) => {
        el.style.transition = "none";
        el.style.backgroundColor = from;
        void el.offsetWidth;
        el.style.transition = spec;
        el.style.backgroundColor = to;
        const anim = document.getAnimations().find((a) => a.transitionProperty === "background-color");
        if (!anim) return null;
        anim.pause();
        const rows = times.map((ms) => {
          anim.currentTime = ms;
          return { at: ms, value: cs().backgroundColor };
        });
        anim.cancel();
        el.style.transition = "none";
        return rows;
      };

      out.delay = {
        spec: "background-color 200ms linear 100ms",
        from: "rgb(0, 0, 0)",
        to: "rgb(200, 200, 200)",
        // The clock a transition's `currentTime` runs on INCLUDES the delay,
        // so 0 and 100 both sit in it and 300 is the end.
        samples: bgAt("background-color 200ms linear 100ms", "rgb(0, 0, 0)", "rgb(200, 200, 200)",
          [0, 50, 100, 150, 200, 250, 300]),
      };

      // --- 3. reversing a transition part way.
      //
      // Paused and driven by hand for the same reason as everything else here.
      // The number wanted is the DURATION the engine gives the reversed
      // transition, which it reports through `getTiming()`.
      const reverseAfter = (easing, ms, dur) => {
        el.style.transition = "none";
        el.style.backgroundColor = "rgb(0, 0, 0)";
        void el.offsetWidth;
        el.style.transition = `background-color ${dur}ms ${easing}`;
        el.style.backgroundColor = "rgb(255, 255, 255)";
        let anim = document.getAnimations().find((a) => a.transitionProperty === "background-color");
        anim.pause();
        anim.currentTime = ms;
        const atReversal = cs().backgroundColor;
        // Committing the paused value is what makes the reversal start from
        // where the eye is, rather than from where the clock would be once the
        // animation is let go.
        el.style.backgroundColor = "rgb(0, 0, 0)";
        const back = document.getAnimations().find((a) => a.transitionProperty === "background-color");
        const timing = back ? back.effect.getTiming() : null;
        const started = back ? getComputedStyle(el).backgroundColor : null;
        if (back) back.cancel();
        anim.cancel();
        el.style.transition = "none";
        return {
          easing,
          original: dur,
          reversedAt: ms,
          inputProgress: ms / dur,
          valueAtReversal: atReversal,
          reversedDuration: timing ? timing.duration : null,
          reversedDelay: timing ? timing.delay : null,
          startsFrom: started,
        };
      };

      out.reversal = [
        reverseAfter("linear", 100, 200),
        reverseAfter("ease-in", 100, 200),
        reverseAfter("ease-out", 100, 200),
        reverseAfter("ease", 50, 200),
      ];

      // Reversing a REVERSAL. The interesting question is whether the
      // shortening compounds naively — halving again to 50ms — or whether the
      // factor is carried and recombined, which would make the third leg
      // LONGER than the second. Guessing this wrong is invisible on a single
      // pass of the pointer and obvious on a jittery one.
      const doubleReverse = (easing, dur, firstAt, secondFraction) => {
        el.style.transition = "none";
        el.style.backgroundColor = "rgb(0, 0, 0)";
        void el.offsetWidth;
        el.style.transition = `background-color ${dur}ms ${easing}`;
        el.style.backgroundColor = "rgb(255, 255, 255)";
        const legs = [];
        let anim = document.getAnimations().find((a) => a.transitionProperty === "background-color");
        anim.pause();
        anim.currentTime = firstAt;
        legs.push({ leg: 1, duration: dur, pausedAt: firstAt, value: cs().backgroundColor });

        el.style.backgroundColor = "rgb(0, 0, 0)";
        let back = document.getAnimations().find((a) => a.transitionProperty === "background-color");
        back.pause();
        const d2 = back.effect.getTiming().duration;
        back.currentTime = d2 * secondFraction;
        legs.push({ leg: 2, duration: d2, pausedAt: d2 * secondFraction, value: cs().backgroundColor });

        el.style.backgroundColor = "rgb(255, 255, 255)";
        const fwd = document.getAnimations().find((a) => a.transitionProperty === "background-color");
        const d3 = fwd ? fwd.effect.getTiming().duration : null;
        legs.push({ leg: 3, duration: d3, value: cs().backgroundColor });
        document.getAnimations().forEach((a) => a.cancel());
        el.style.transition = "none";
        return { easing, original: dur, secondFraction, legs };
      };

      out.doubleReversal = [
        doubleReverse("linear", 200, 100, 0.5),
        doubleReverse("linear", 200, 100, 0.25),
      ];

      // A delay on a reversal: is the delay shortened by the same factor as
      // the duration, or does the full delay run again?
      out.delayedReversal = (() => {
        el.style.transition = "none";
        el.style.backgroundColor = "rgb(0, 0, 0)";
        void el.offsetWidth;
        el.style.transition = "background-color 200ms linear 100ms";
        el.style.backgroundColor = "rgb(255, 255, 255)";
        const a = document.getAnimations().find((x) => x.transitionProperty === "background-color");
        a.pause();
        a.currentTime = 200; // 100ms of delay + 100ms of the 200ms run
        const at = cs().backgroundColor;
        el.style.backgroundColor = "rgb(0, 0, 0)";
        const b = document.getAnimations().find((x) => x.transitionProperty === "background-color");
        const t = b ? b.effect.getTiming() : null;
        // What the engine REPORTS and what it DOES are two questions. Sample
        // the reversed leg as well, so the delay's fate is settled by the
        // colour on screen rather than by a timing object.
        let samples = null;
        if (b) {
          b.pause();
          samples = [0, 50, 100, 125, 150, 175, 200].map((ms) => {
            b.currentTime = ms;
            return { at: ms, value: cs().backgroundColor };
          });
        }
        document.getAnimations().forEach((x) => x.cancel());
        el.style.transition = "none";
        return {
          spec: "background-color 200ms linear 100ms",
          pausedAt: 200,
          valueAtReversal: at,
          reversedDuration: t ? t.duration : null,
          reversedDelay: t ? t.delay : null,
          reversedSamples: samples,
        };
      })();

      // --- 4. transform: rotate
      el.style.transition = "none";
      el.style.transform = "rotate(0deg)";
      void el.offsetWidth;
      const rot = el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(90deg)" }], {
        duration: 1000,
        easing: "linear",
        fill: "both",
      });
      rot.pause();
      out.rotate = at.map((t) => {
        rot.currentTime = t * 1000;
        return { at: t, matrix: cs().transform };
      });
      rot.cancel();

      // What a rotation turns about, with no transform-origin set. The
      // rectangle is 100x40 at (0,0); a quarter turn about the CENTRE puts the
      // box somewhere a quarter turn about the corner does not.
      el.style.transform = "rotate(90deg)";
      const r = el.getBoundingClientRect();
      out.rotateOrigin = {
        transformOrigin: cs().transformOrigin,
        boxBefore: { x: 0, y: 0, w: 100, h: 40 },
        boxAfterQuarterTurn: { x: r.x, y: r.y, w: r.width, h: r.height },
      };
      el.style.transform = "none";

      // --- 5. transform-origin, said every way CSS allows
      //
      // Two questions per case, and they are different questions. What does
      // the engine RESOLVE the origin to (`getComputedStyle` gives it in
      // pixels, so keywords and percentages come back already worked out), and
      // where does the box actually END UP once it is turned about that point.
      // The first can be right while the second is wrong, and only the second
      // is what anyone sees.
      //
      // The single-value forms are the ones worth having in a table. CSS says
      // a lone LENGTH sets x and leaves y at 50%, but a lone `top` or `bottom`
      // is a Y keyword and sets the OTHER axis — so `transform-origin: top`
      // means `50% 0%` and `transform-origin: 10px` means `10px 50%`. Reading
      // "the first value is x" straight off is wrong for exactly the keyword
      // half of the grammar.
      const originCases = [
        "50% 50%", "0 0", "100% 100%", "0% 100%",
        "left top", "right bottom", "center bottom", "top left",
        // Pairs where the two keywords resolve DIFFERENTLY, so the swap rule
        // is observable. `top left` cannot show it: left and top are both 0%,
        // so writing them either way round gives the same point and a swap
        // that never happens looks correct.
        "bottom left", "right top", "top center", "center right",
        "10px 4px", "25% 10px",
        "left", "right", "top", "bottom", "center", "10px", "25%",
      ];
      out.transformOrigin = originCases.map((spec) => {
        el.style.transition = "none";
        el.style.transformOrigin = spec;
        el.style.transform = "none";
        void el.offsetWidth;
        const resolved = cs().transformOrigin;
        el.style.transform = "rotate(90deg)";
        const b = el.getBoundingClientRect();
        el.style.transform = "none";
        return {
          spec,
          resolved,
          boxAfterQuarterTurn: { x: b.x, y: b.y, w: b.width, h: b.height },
        };
      });
      el.style.transformOrigin = "";

      // Is transform-origin itself animatable, and how does it interpolate
      // between two percentages?
      out.originTransition = (() => {
        el.style.transition = "none";
        el.style.transformOrigin = "0% 0%";
        void el.offsetWidth;
        el.style.transition = "transform-origin 200ms linear";
        el.style.transformOrigin = "100% 100%";
        const a = document.getAnimations().find((x) => x.transitionProperty === "transform-origin");
        if (!a) {
          el.style.transition = "none";
          el.style.transformOrigin = "";
          return { animatable: false };
        }
        a.pause();
        const rows = [0, 50, 100, 150, 200].map((ms) => {
          a.currentTime = ms;
          return { at: ms, resolved: cs().transformOrigin };
        });
        document.getAnimations().forEach((x) => x.cancel());
        el.style.transition = "none";
        el.style.transformOrigin = "";
        return { animatable: true, from: "0% 0%", to: "100% 100%", samples: rows };
      })();

      return out;
    },
    [FUNCTIONS, AT],
  );
}

assertDomInstalled();
const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
await page.setContent(PAGE);
const data = await capture(page);
const version = await page.evaluate(() => navigator.userAgent);
await browser.close();

const file = path.join(HERE, "css-timing.json");
fs.writeFileSync(file, JSON.stringify({ capturedFrom: version, ...data }, null, 2) + "\n");
console.log("wrote " + path.relative(process.cwd(), file));
console.log(JSON.stringify(data.doubleReversal, null, 2));
console.log(JSON.stringify(data.delayedReversal, null, 2));
console.log(JSON.stringify(data.rotateOrigin, null, 2));
