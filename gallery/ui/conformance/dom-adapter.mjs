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

    const observe = async (label) => {
      await settle();
      trace.push({ step: label, nodes: await page.evaluate(snapshotDom) });
    };

    await observe("initial");
    for (const step of spec.steps) {
      if ("click" in step) {
        // force: a user can put the pointer on a disabled control's rectangle;
        // what the browser then does with focus is part of the contract.
        await page.locator(sel(step.click)).click({ force: true }).catch(() => {});
        await observe("click " + step.click);
      } else if ("key" in step) {
        await page.keyboard.press(step.key === " " ? "Space" : step.key);
        await observe("key " + JSON.stringify(step.key));
      } else if ("focus" in step) {
        await page.locator(sel(step.focus)).focus().catch(() => {});
        await observe("focus " + step.focus);
      } else if ("hover" in step) {
        // Tooltip and hover-card open on a real pointer entering the trigger;
        // there is no click to stand in for it, so the harness moves the mouse.
        await page.locator(sel(step.hover)).hover().catch(() => {});
        await observe("hover " + step.hover);
      } else if ("unhover" in step) {
        // Park the pointer in the corner, away from every control, so a
        // hover-driven surface sees the pointer leave. In steps, because a
        // tooltip keeps itself open over a "grace area" between trigger and
        // content and decides with `pointermove`: one teleporting move can
        // land outside the polygon without ever crossing its edge.
        await page.mouse.move(0, 0, { steps: 12 });
        await observe("unhover");
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
