/**
 * Base UI's Switch, asked the same five questions Radix was asked — and a few
 * Radix was never asked.
 *
 *   node gallery/ui/conformance/oracle/switch_oracle.mjs
 *
 * Writes `switch.json` beside this file.
 *
 * WHY A SECOND REFERENCE. shadcn now ships three registries — `components/…`
 * is Radix, `components/base/…` is Base UI, `components/aria/…` is React Aria
 * — and this is the Base UI one.
 *
 * The package is `@base-ui/react`; `@base-ui-components/react` is the old
 * name and npm says so on install. Measured against 1.7.0, a release, rather
 * than the 1.0.0-rc.0 the old name is frozen at — an oracle pinned to a
 * release candidate two names ago is measuring history. `SwitchCtl` has been measured against
 * `@radix-ui/react-switch` since it was written — five behaviours in
 * `behaviours.json`. If the two libraries agree, that is worth knowing:
 * "a switch" is then a settled thing and one controller serves both. If they
 * DISAGREE, the disagreement is the finding, and pretending there is one
 * right answer would be inventing one.
 *
 * So this asks Base UI exactly what the Radix specs ask — pointer toggle,
 * Space, the role, aria-checked, disabled inertness — plus the three
 * questions the Radix specs never put, because a form is where a switch
 * actually lives:
 *
 *   does ENTER toggle? A Radix switch is a <button>, and a button's Enter is
 *   the browser's, not the library's. If Base UI suppresses it the two
 *   diverge on a key nobody documented either way.
 *   is there a hidden native input, so the thing SUBMITS?
 *   and what does it publish while disabled — the `disabled` attribute, which
 *   removes it from the tab order, or `aria-disabled`, which does not?
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOM_DIR = path.join(HERE, "..", "dom");

const APP = `
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Switch } from "@base-ui/react/switch";

function App() {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => { window.__on = on; }, [on]);
  // The id prop is NOT put on the switch: Base UI forwards it to the hidden
  // native input, which is how the control submits with a form. Found the
  // hard way — the first version of this probe clicked #sw and hit an
  // aria-hidden checkbox behind the page. So the switches are addressed by
  // ROLE and the wrappers carry the test ids. (No backticks in here: this
  // whole block lives inside a template literal.)
  return React.createElement("form", { id: "f" },
    React.createElement("div", { "data-t": "live" },
      React.createElement(Switch.Root, {
        id: "sw", name: "airplane", checked: on, onCheckedChange: setOn,
      }, React.createElement(Switch.Thumb, null))),
    React.createElement("div", { "data-t": "off" },
      React.createElement(Switch.Root, {
        id: "sw-off", name: "off", disabled: true, defaultChecked: false,
      }, React.createElement(Switch.Thumb, null))),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

/** Everything the DOM says about one switch. */
const READ = `(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const attrs = {};
  for (const a of el.attributes) attrs[a.name] = a.value;
  return {
    tag: el.tagName,
    role: el.getAttribute("role"),
    ariaChecked: el.getAttribute("aria-checked"),
    ariaDisabled: el.getAttribute("aria-disabled"),
    disabledAttr: el.hasAttribute("disabled"),
    tabIndex: el.tabIndex,
    attrs,
  };
}`;

assertDomInstalled();
const esbuild = requireDom("esbuild");
const { chromium } = requireDom("playwright-core");

const entry = path.join(HERE, ".switch-probe.jsx");
const bundle = path.join(HERE, ".switch-probe.js");
fs.writeFileSync(entry, APP);
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  outfile: bundle,
  loader: { ".jsx": "jsx" },
  format: "iife",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(DOM_DIR, "node_modules")],
  logLevel: "silent",
});
const pageFile = path.join(HERE, ".switch-probe.html");
fs.writeFileSync(
  pageFile,
  `<!doctype html><meta charset="utf-8">` +
    // Base UI is HEADLESS: an unstyled Switch.Root is a button with no
    // content and no size, and Playwright rightly refuses to click a
    // zero-pixel element. Supplying the box is the consumer's job in this
    // library, so the probe does what any consumer does. Nothing here is
    // captured — the appearance is shadcn's and is not what is being asked.
    `<style>
       [role="switch"] { width: 44px; height: 26px; border-radius: 13px;
         border: 1px solid #999; background: #ddd; padding: 0; display: block; }
       [role="switch"][data-checked] { background: #333; }
       [role="switch"] > * { display: block; width: 22px; height: 22px;
         border-radius: 11px; background: #fff; }
       body { margin: 24px; }
     </style>` +
    `<div id="root"></div><script src="./.switch-probe.js"></script>`,
);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(150);

const LIVE = '[data-t="live"] [role="switch"]';
const OFF = '[data-t="off"] [role="switch"]';
const read = (sel) => page.evaluate(`(${READ})(${JSON.stringify(sel)})`);
const on = () => page.evaluate(() => !!window.__on);
const out = {};

out.atRest = { ...(await read(LIVE)), checked: await on() };
out.thumb = await read('[data-t="live"] [role="switch"] > *');

// --- the five the Radix specs ask
await page.click(LIVE);
await page.waitForTimeout(60);
out.afterClick = { ...(await read(LIVE)), checked: await on() };

await page.click(LIVE);
await page.waitForTimeout(60);
await page.focus(LIVE);
await page.keyboard.press(" ");
await page.waitForTimeout(60);
out.afterSpace = { ...(await read(LIVE)), checked: await on() };

// --- and the three they do not
await page.evaluate(() => { window.__on = window.__on; });
const beforeEnter = await on();
await page.focus(LIVE);
await page.keyboard.press("Enter");
await page.waitForTimeout(80);
out.enter = {
  before: beforeEnter,
  after: await on(),
  toggles: beforeEnter !== (await on()),
  $comment:
    "A <button> toggles on Enter because the browser says so, not because " +
    "the library does. Whether a switch SHOULD is not settled — the ARIA " +
    "pattern names Space and is silent on Enter — so whichever way this " +
    "falls, it is a fact about the reference and not a rule.",
};

// A hidden native input is what makes the thing submit with a form.
out.hiddenInput = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("#f input")];
  return inputs.map((i) => ({
    id: i.id, type: i.type, name: i.name, checked: i.checked,
    ariaHidden: i.getAttribute("aria-hidden"),
    tabIndex: i.tabIndex,
  }));
});
out.idGoesToTheInput = {
  $comment:
    "The `id` prop lands on the hidden native input, not on the switch. So " +
    "a <label for> points at the input and a querySelector('#id') finds an " +
    "aria-hidden checkbox rather than the control — which is exactly how the " +
    "first version of this probe failed.",
};

// Disabled: which spelling, and is it still a tab stop?
out.disabled = await read(OFF);
const ariaOf = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  return el ? el.getAttribute("aria-checked") : null;
}, sel);
const beforeDisabledClick = await ariaOf(OFF);
await page.click(OFF, { force: true });
await page.waitForTimeout(60);
out.disabledAfterClick = await ariaOf(OFF);
out.disabledInert = beforeDisabledClick === out.disabledAfterClick;

const version = createRequire(path.join(DOM_DIR, "package.json"))(
  "@base-ui/react/package.json",
).version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.rmSync(f, { force: true });

fs.writeFileSync(
  path.join(HERE, "switch.json"),
  JSON.stringify({ baseUi: version, ...out }, null, 2) + "\n",
);
console.log("wrote gallery/ui/conformance/oracle/switch.json  (@base-ui/react " + version + ")");
console.log("at rest :", JSON.stringify({ tag: out.atRest.tag, role: out.atRest.role, ariaChecked: out.atRest.ariaChecked, tabIndex: out.atRest.tabIndex }));
console.log("click   :", out.atRest.ariaChecked, "->", out.afterClick.ariaChecked);
console.log("space   :", out.afterSpace.ariaChecked);
console.log("enter   :", out.enter.toggles ? "TOGGLES" : "does nothing");
console.log("hidden  :", JSON.stringify(out.hiddenInput));
console.log("disabled:", JSON.stringify({ disabledAttr: out.disabled.disabledAttr, ariaDisabled: out.disabled.ariaDisabled, tabIndex: out.disabled.tabIndex, inert: out.disabledInert }));
console.log("data-*  :", JSON.stringify(Object.keys(out.atRest.attrs).filter((k) => k.startsWith("data-"))));
