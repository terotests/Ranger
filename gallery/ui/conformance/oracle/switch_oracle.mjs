/**
 * Base UI's Switch, asked the same five questions Radix was asked — and a few
 * Radix was never asked.
 *
 *   node gallery/ui/conformance/oracle/switch_oracle.mjs
 *
 * Writes `switch.json` beside this file.
 *
 * WHY A SECOND REFERENCE. shadcn now ships two registries, and the `base/`
 * one is Base UI rather than Radix. `SwitchCtl` has been measured against
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
import { Switch } from "@base-ui-components/react/switch";

function App() {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => { window.__on = on; }, [on]);
  return React.createElement("form", { id: "f" },
    React.createElement(Switch.Root, {
      id: "sw", name: "airplane", checked: on, onCheckedChange: setOn,
    }, React.createElement(Switch.Thumb, { id: "thumb" })),
    React.createElement(Switch.Root, {
      id: "sw-off", name: "off", disabled: true, defaultChecked: false,
    }, React.createElement(Switch.Thumb, null)),
  );
}
createRoot(document.getElementById("root")).render(React.createElement(App));
window.__READY__ = true;
`;

/** Everything the DOM says about one switch. */
const READ = `(id) => {
  const el = document.getElementById(id);
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
  `<!doctype html><meta charset="utf-8"><div id="root"></div><script src="./.switch-probe.js"></script>`,
);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
await page.goto(pathToFileURL(pageFile).href);
await page.waitForFunction("window.__READY__ === true", null, { timeout: 20000 });
await page.waitForTimeout(150);

const read = (id) => page.evaluate(`(${READ})(${JSON.stringify(id)})`);
const on = () => page.evaluate(() => !!window.__on);
const out = {};

out.atRest = { ...(await read("sw")), checked: await on() };
out.thumb = await read("thumb");

// --- the five the Radix specs ask
await page.click("#sw");
await page.waitForTimeout(60);
out.afterClick = { ...(await read("sw")), checked: await on() };

await page.click("#sw");
await page.waitForTimeout(60);
await page.focus("#sw");
await page.keyboard.press(" ");
await page.waitForTimeout(60);
out.afterSpace = { ...(await read("sw")), checked: await on() };

// --- and the three they do not
await page.evaluate(() => { window.__on = window.__on; });
const beforeEnter = await on();
await page.focus("#sw");
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
    type: i.type, name: i.name, checked: i.checked,
    hidden: getComputedStyle(i).position === "absolute" || i.hidden ||
            getComputedStyle(i).visibility === "hidden" ||
            getComputedStyle(i).opacity === "0",
  }));
});

// Disabled: which spelling, and is it still a tab stop?
out.disabled = await read("sw-off");
const beforeDisabledClick = await page.evaluate(() =>
  document.getElementById("sw-off").getAttribute("aria-checked"));
await page.click("#sw-off", { force: true });
await page.waitForTimeout(60);
out.disabledAfterClick = await page.evaluate(() =>
  document.getElementById("sw-off").getAttribute("aria-checked"));
out.disabledInert = beforeDisabledClick === out.disabledAfterClick;

const version = createRequire(path.join(DOM_DIR, "package.json"))(
  "@base-ui-components/react/package.json",
).version;
await browser.close();
for (const f of [entry, bundle, pageFile]) fs.rmSync(f, { force: true });

fs.writeFileSync(
  path.join(HERE, "switch.json"),
  JSON.stringify({ baseUi: version, ...out }, null, 2) + "\n",
);
console.log("wrote gallery/ui/conformance/oracle/switch.json  (@base-ui-components/react " + version + ")");
console.log("at rest :", JSON.stringify({ tag: out.atRest.tag, role: out.atRest.role, ariaChecked: out.atRest.ariaChecked, tabIndex: out.atRest.tabIndex }));
console.log("click   :", out.atRest.ariaChecked, "->", out.afterClick.ariaChecked);
console.log("space   :", out.afterSpace.ariaChecked);
console.log("enter   :", out.enter.toggles ? "TOGGLES" : "does nothing");
console.log("hidden  :", JSON.stringify(out.hiddenInput));
console.log("disabled:", JSON.stringify({ disabledAttr: out.disabled.disabledAttr, ariaDisabled: out.disabled.ariaDisabled, tabIndex: out.disabled.tabIndex, inert: out.disabledInert }));
console.log("data-*  :", JSON.stringify(Object.keys(out.atRest.attrs).filter((k) => k.startsWith("data-"))));
