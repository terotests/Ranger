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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "dom");
const domRequire = createRequire(path.join(DOM_DIR, "package.json"));

export class MissingDomDeps extends Error {}

function requireDom(name) {
  try {
    return domRequire(name);
  } catch {
    throw new MissingDomDeps(
      "the Radix reference host is not installed — run:\n" +
        "  npm --prefix gallery/ui/conformance/dom install",
    );
  }
}

function findChromium() {
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

/**
 * Canonical observation. The Ranger side reports the same fields off its
 * display tree; see SPEC.md for what each one means on each side.
 */
const SNAPSHOT = () => {
  const NAMED_ROLES = new Set(["button", "link", "heading", "tab", "menuitem", "checkbox", "radio", "switch"]);
  // aria-checked and aria-selected are tri-state: "mixed" is a real value.
  const tri = (v) => (v == null ? null : v === "mixed" ? "mixed" : v === "true");
  const out = [];
  for (const el of document.querySelectorAll("[data-tid]")) {
    const explicit = el.getAttribute("role");
    const tag = el.tagName.toLowerCase();
    let role = explicit;
    if (!role) role = tag === "button" ? "button" : tag === "a" ? "link" : "none";
    const label = el.getAttribute("aria-label");
    const name = label != null ? label : NAMED_ROLES.has(role) ? (el.textContent || "").trim() : "";
    const expanded = el.getAttribute("aria-expanded");
    const pressed = el.getAttribute("aria-pressed");
    const disabled = el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
    out.push({
      tid: el.getAttribute("data-tid"),
      role,
      name,
      state: el.getAttribute("data-state") || "",
      expanded: expanded == null ? null : expanded === "true",
      pressed: pressed == null ? null : pressed === "true",
      checked: tri(el.getAttribute("aria-checked")),
      selected: tri(el.getAttribute("aria-selected")),
      disabled,
      // Would Tab land here? Roving focus is exactly this going false on the
      // items a composite does not want in the tab order.
      tabstop: el.tabIndex >= 0 && !disabled,
      focused: document.activeElement === el,
      visible: el.getClientRects().length > 0,
    });
  }
  return out;
};

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
      trace.push({ step: label, nodes: await page.evaluate(SNAPSHOT) });
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
