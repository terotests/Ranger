/**
 * DOM adapter — drives real Radix components in Chromium and prints the
 * behaviour trace in the harness's canonical shape.
 *
 *   node gallery/ui/conformance/dom-adapter.mjs <spec.json>
 *
 * Requires the reference host's dependencies:
 *   npm --prefix gallery/ui/conformance/dom install
 *
 * Chromium is found via $RANGER_CHROMIUM, then $PLAYWRIGHT_BROWSERS_PATH, then
 * playwright's own default.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { snapshotDom } from "./dom/snapshot.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "dom");
const domRequire = createRequire(path.join(DOM_DIR, "package.json"));

export class MissingDomDeps extends Error {}

/**
 * Is the reference host installed?
 *
 * Checking one package is not enough, and checking the wrong one is worse than
 * not checking: `esbuild` and `playwright-core` are also devDependencies of the
 * REPOSITORY, so on a machine with a root `npm install` they resolve from
 * there, the check passes, and the failure surfaces later as a wall of
 * "Could not resolve react" from the bundler instead of one line saying what
 * to run. So ask about everything dom/package.json declares.
 *
 * Resolution, not directory existence, because a package manager is allowed to
 * hoist — a dependency satisfied from the repository root is genuinely usable.
 */
export function assertDomInstalled() {
  const pkg = JSON.parse(fs.readFileSync(path.join(DOM_DIR, "package.json"), "utf8"));
  const needed = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const missing = needed.filter((name) => {
    try {
      domRequire.resolve(name);
      return false;
    } catch {
      return true;
    }
  });
  if (missing.length) {
    throw new MissingDomDeps(
      "the Radix reference host is not installed — run:\n" +
        "  npm run ui:conformance:install\n" +
        "missing: " +
        missing.join(", "),
    );
  }
}

export function requireDom(name) {
  assertDomInstalled();
  return domRequire(name);
}

/**
 * One tool out of the host's directory, WITHOUT demanding the reference
 * components.
 *
 * `requireDom` asks for everything `dom/package.json` declares, and for a
 * caller that renders Radix that is right — see the note on
 * `assertDomInstalled`. But `esbuild` and `playwright-core` are also
 * devDependencies of the REPOSITORY, and a caller that only bundles this
 * repo's own sources or only launches a browser needs nothing else. Making
 * those callers demand forty-three reference packages they never import turns
 * a working check into a failing one on any machine that has not run
 * `ui:conformance:install` — which is exactly what happened in CI, where the
 * root install provides both tools and the reference host is not installed at
 * all.
 *
 * So this resolves the one package asked for and reports only that one. Use it
 * for tools; use `requireDom` for anything that touches the reference
 * components, where a partial install really is the failure worth naming.
 */
export function requireHostTool(name) {
  try {
    return domRequire(name);
  } catch {
    throw new MissingDomDeps(
      `${name} could not be resolved — run:\n` +
        "  npm install\n" +
        `(or \`npm run ui:conformance:install\` to install it with the reference host)`,
    );
  }
}

export function findChromium() {
  if (process.env.RANGER_CHROMIUM) return process.env.RANGER_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && fs.existsSync(base)) {
    for (const entry of fs.readdirSync(base)) {
      if (!entry.startsWith("chromium-")) continue;
      const exe = path.join(base, entry, "chrome-linux", "chrome");
      if (fs.existsSync(exe)) return exe;
    }
  }
  return undefined;
}

async function bundle() {
  const esbuild = requireDom("esbuild");
  await esbuild.build({
    entryPoints: [path.join(DOM_DIR, "app.jsx")],
    bundle: true,
    outfile: path.join(DOM_DIR, "bundle.js"),
    loader: { ".jsx": "jsx" },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
}

export async function run(spec) {
  const { chromium } = requireDom("playwright-core");
  await bundle();

  const browser = await chromium.launch({ executablePath: findChromium() });
  try {
    const page = await browser.newPage();
    await page.addInitScript(`window.__FIXTURE__ = ${JSON.stringify(spec.fixture)};`);
    await page.goto(pathToFileURL(path.join(DOM_DIR, "index.html")).href);
    await page.waitForFunction("window.__READY__ === true");

    const trace = [];
    const sel = (tid) => `[data-tid="${tid}"]`;

    // Let React commit before looking. Playwright returns as soon as the event
    // is dispatched, but React 18 flushes state in a later task — observing
    // straight away catches a half-updated DOM, and the same spec then yields
    // different oracles on different runs. Two frames is one full commit plus
    // paint; without this the benchmark measures a race, not a behaviour.
    const settle = () =>
      page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );

    // What the spec asked to observe beyond the nodes themselves. Declared in
    // the spec file so it is visible that a field is being looked at — and,
    // where it is absent, visible that it is not.
    const options = { announce: !!(spec.observe || []).includes("announce") };
    const observe = async (label) => {
      await settle();
      trace.push({
        step: label,
        nodes: await page.evaluate(([fn, o]) => new Function("return " + fn)()(o),
          [snapshotDom.toString(), options]),
      });
    };

    // The element a press started on, so a later dragto is measured against the
    // same rectangle rather than whatever is under the cursor now.
    let dragBox = null;

    await observe("initial");
    for (const step of spec.steps) {
      if ("click" in step) {
        // force: a user can put the pointer on a disabled control's rectangle;
        // what the browser then does with focus is part of the contract.
        // `mods` is Playwright's own modifier list — ["Shift"], ["Control"],
        // or both. A multi-select is the only thing that reads them, and the
        // label carries them so a trace says which click it was.
        const mods = step.mods || [];
        await page
          .locator(sel(step.click))
          .click({ force: true, modifiers: mods })
          .catch(() => {});
        await observe("click " + step.click + (mods.length ? " [" + mods.join("+") + "]" : ""));
      } else if ("key" in step) {
        // `mods` on a key, the same list `click` already takes. Playwright
        // spells a modified press "Control+ArrowRight", so the list is joined
        // onto the front rather than passed separately.
        const kmods = step.mods || [];
        const base = step.key === " " ? "Space" : step.key;
        await page.keyboard.press(kmods.length ? kmods.join("+") + "+" + base : base);
        // Some components move focus in an EFFECT rather than in the handler,
        // so state and DOM focus disagree for a frame or two after the key.
        // headless-tree is one: its roving tabIndex moves immediately and the
        // `.focus()` lands about 32ms later, which is exactly where two
        // animation frames put the observation — some steps caught up and some
        // did not, in the same run. `settle` waits past it. See SPEC.md.
        if (step.settle) await page.waitForTimeout(step.settle);
        await observe("key " + JSON.stringify(step.key) +
          (kmods.length ? " [" + kmods.join("+") + "]" : "") +
          (step.settle ? " +" + step.settle + "ms" : ""));
      } else if ("type" in step) {
        // ONE CHARACTER PER OBSERVATION. `page.keyboard.type("hello")` would
        // be one row at the end, and a caret that goes wrong on the second
        // keystroke looks identical to one that goes wrong on the fifth. The
        // whole reason to have a typing step rather than five `key` steps is
        // that the spec reads as a word; the trace still has to read as
        // keystrokes.
        for (const ch of step.type) {
          await page.keyboard.type(ch);
          await observe("type " + JSON.stringify(ch));
        }
      } else if ("focus" in step) {
        await page.locator(sel(step.focus)).focus().catch(() => {});
        await observe("focus " + step.focus);
      } else if ("hover" in step) {
        // Tooltip and hover-card open on a real pointer entering the trigger;
        // there is no click to stand in for it, so the harness moves the mouse.
        await page.locator(sel(step.hover)).hover().catch(() => {});
        // Some hover-driven surfaces are on a TIMER — a submenu waits 100ms
        // before opening, so that dragging the pointer down a menu does not
        // flash every submenu on the way past. The two rAFs below are ~32ms,
        // which lands in the middle of that wait: without `settle` the step
        // would observe a race and the same spec would pass and fail on
        // different machines. `settle` puts the observation firmly on one side
        // of the delay. It is not a substitute for measuring the delay itself
        // — that is done where the clock is exact, in the Ranger tests.
        if (step.settle) await page.waitForTimeout(step.settle);
        await observe("hover " + step.hover + (step.settle ? " +" + step.settle + "ms" : ""));
      } else if ("unhover" in step) {
        // Park the pointer in the corner, away from every control, so a
        // hover-driven surface sees the pointer leave. In steps, because a
        // tooltip keeps itself open over a "grace area" between trigger and
        // content and decides with `pointermove`: one teleporting move can
        // land outside the polygon without ever crossing its edge.
        await page.mouse.move(0, 0, { steps: 12 });
        await observe("unhover");
      } else if ("press" in step) {
        // A press that may become a drag, at a fraction of the named element's
        // width. The fraction, not a pixel, because the two systems lay out
        // differently on purpose — it is the only coordinate both can agree on.
        const box = await page.locator(sel(step.press)).boundingBox();
        dragBox = box;
        if (box) {
          await page.mouse.move(box.x + box.width * (step.at ?? 0.5), box.y + box.height / 2);
          await page.mouse.down();
        }
        await observe("press " + step.press + " @" + (step.at ?? 0.5));
      } else if ("dragpick" in step) {
        // An HTML5 drag, not a mouse one. Playwright cannot drive native
        // drag-and-drop through the mouse, and the library reads nothing from
        // it but `clientX`, `clientY` and the row's own rectangle — so the
        // events are synthesised, carrying one DataTransfer for the gesture.
        await page.evaluate((id) => {
          const el = document.querySelector(`[data-tid="${id}"]`);
          const dt = new DataTransfer();
          window.__dt = dt;
          el.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
        }, step.dragpick);
        await observe("dragpick " + step.dragpick);
      } else if ("dragpoint" in step) {
        await page.evaluate(
          ([id, aty, x]) => {
            const el = document.querySelector(`[data-tid="${id}"]`);
            const b = el.getBoundingClientRect();
            el.dispatchEvent(
              new DragEvent("dragover", {
                bubbles: true,
                cancelable: true,
                dataTransfer: window.__dt,
                clientX: b.left + x,
                clientY: b.top + b.height * aty,
              }),
            );
          },
          [step.dragpoint, step.aty ?? 0.5, step.x ?? 0],
        );
        // A HOLD, in ms. `openOnDropDelay` opens a folder under a cursor that
        // waits on it, and nothing shorter than the delay can observe that.
        await page.waitForTimeout(step.hold ?? 40);
        await observe(
          "dragpoint " + step.dragpoint + " y" + (step.aty ?? 0.5) + " x" + (step.x ?? 0) +
            (step.hold ? " +" + step.hold + "ms" : ""),
        );
      } else if ("dragland" in step) {
        await page.evaluate(
          ([id, aty, x]) => {
            const el = document.querySelector(`[data-tid="${id}"]`);
            const b = el.getBoundingClientRect();
            el.dispatchEvent(
              new DragEvent("drop", {
                bubbles: true,
                cancelable: true,
                dataTransfer: window.__dt,
                clientX: b.left + x,
                clientY: b.top + b.height * aty,
              }),
            );
          },
          [step.dragland, step.aty ?? 0.5, step.x ?? 0],
        );
        await page.waitForTimeout(120);
        await observe("dragland " + step.dragland + " y" + (step.aty ?? 0.5) + " x" + (step.x ?? 0));
      } else if ("dragto" in step) {
        if (dragBox) {
          await page.mouse.move(
            dragBox.x + dragBox.width * step.dragto,
            dragBox.y + dragBox.height / 2,
            { steps: 8 },
          );
        }
        await observe("dragto " + step.dragto);
      } else if ("dragover" in step) {
        // Onto ANOTHER element, which is the drag a sortable is made of — as
        // opposed to `dragto`, which slides along the pressed element's own
        // width and exists for a slider. In steps: dnd-kit resolves a drag from
        // pointermove events and a single teleport can cross every item's
        // rectangle without ever being seen inside one.
        const box = await page.locator(sel(step.dragover)).boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        }
        await observe("dragover " + step.dragover);
      } else if ("release" in step) {
        await page.mouse.up();
        dragBox = null;
        await observe("release");
      } else if ("rightclick" in step) {
        await page.locator(sel(step.rightclick)).click({ button: "right", force: true }).catch(() => {});
        await observe("rightclick " + step.rightclick);
      } else {
        throw new Error("unknown step: " + JSON.stringify(step));
      }
    }
    return { adapter: "radix-dom", spec: spec.name, trace };
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error("usage: dom-adapter.mjs <spec.json>");
    process.exit(2);
  }
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  try {
    process.stdout.write(JSON.stringify(await run(spec), null, 1) + "\n");
  } catch (e) {
    if (e instanceof MissingDomDeps) {
      console.error(e.message);
      process.exit(3);
    }
    throw e;
  }
}
