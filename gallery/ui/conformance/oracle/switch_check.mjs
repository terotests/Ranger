#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// SwitchCtl against Base UI — a SECOND reference, beside the Radix specs.
//
//   node gallery/ui/conformance/oracle/switch_check.mjs
//
// `SwitchCtl` has been measured against `@radix-ui/react-switch` since it was
// written: five behaviours in `behaviours.json`, driven through the browser by
// `switch_basic` and `switch_disabled`. shadcn's `base/` registry is Base UI
// instead, so the question is whether "a switch" is a settled thing.
//
// It mostly is, and where it is not, the difference is in the MECHANISM
// rather than the behaviour — which is the interesting answer and the one
// that would have been missed by only reading the ARIA pattern:
//
//   Base UI renders a SPAN with role=switch and tabindex=0. Radix renders a
//   BUTTON. Both toggle on Enter — but a button gets that from the browser
//   and a span cannot, so Base UI implements it deliberately. Two libraries
//   agreeing for two different reasons is worth knowing, because only one of
//   them would survive being re-hosted somewhere without a DOM. This kit has
//   no tags at all, so it is in the same position as the span: Enter is a
//   rule it has to state, and `UiCtl.activatesOn` states it.
//
//   Base UI marks a disabled switch with aria-disabled=true and tabindex=-1;
//   it does NOT use the `disabled` attribute. Radix does. This kit publishes
//   `disabled` on the row and drops the tab stop — the mirror writes
//   aria-disabled, so it lands where Base UI lands.
//
// Two things are recorded as having NO equivalent rather than scored:
//
//   the hidden native <input type=checkbox> that carries the id and the name
//   so the control submits with a form. That is a DOM submission mechanism.
//   A canvas control has no form to submit to, and inventing one would be
//   inventing a requirement.
//
//   the element's tag. There are no tags here.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "switch.json"), "utf8"));

const mk = (disabled) => {
  const host = new H.UiHost();
  const c = host.addSwitch("sw", "Airplane Mode");
  if (disabled) c.disabled = true;
  c.build();
  return { host, c };
};
/** What the row says, in the DOM's own words. */
const state = (host, c) => {
  const rows = c.rows();
  const r = rows[0];
  return {
    role: H.EVGA11yRole.ariaName(r.role),
    ariaChecked: r.checked === 2 ? "true" : r.checked === 1 ? "false" : null,
    disabled: r.disabled,
    tabStop: r.tabStop,
  };
};

let pass = 0;
let fail = 0;
let diverged = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};
const divergence = (what, got, reference, why) => {
  diverged++;
  console.log(`  DIVERGES ${what}: ${got}   Base UI: ${reference}`);
  console.log(`           ${why}`);
};

console.log(`Base UI ${oracle.baseUi}`);

console.log("the role and the resting state");
{
  const { host, c } = mk(false);
  const s = state(host, c);
  check("role", s.role, oracle.atRest.role);
  check("aria-checked at rest", s.ariaChecked, oracle.atRest.ariaChecked);
  check("it is a tab stop", s.tabStop, oracle.atRest.tabIndex === 0);
}

console.log("what flips it");
{
  const { host, c } = mk(false);
  c.activate("sw");
  check("a click", state(host, c).ariaChecked, oracle.afterClick.ariaChecked);
}
{
  // A TOGGLE, not a value. `host.click` both focuses and activates, so
  // click-then-Space is two flips — the first version of this asserted the
  // value and failed for arithmetic rather than for behaviour. The oracle
  // measured a toggle too: Base UI's switch went false, true, false, true
  // across its own click-click-space.
  const { host, c } = mk(false);
  host.click("sw");
  const before = state(host, c).ariaChecked;
  host.key(" ");
  const after = state(host, c).ariaChecked;
  check("Space toggles", before !== after, true);
}
{
  // The one the Radix specs never asked, because a <button> answers it for
  // free and nobody had to decide.
  const { host, c } = mk(false);
  host.click("sw");
  const before = state(host, c).ariaChecked;
  host.key("Enter");
  const after = state(host, c).ariaChecked;
  check("Enter toggles, as Base UI's span does", before !== after && oracle.enter.toggles, true);
}

console.log("disabled");
{
  const { host, c } = mk(true);
  const s = state(host, c);
  check("it is inert to a click", (c.activate("sw"), state(host, c).ariaChecked), s.ariaChecked);
  check("and Base UI's is too", oracle.disabledInert, true);
  check("it is not a tab stop", s.tabStop, oracle.disabled.tabIndex === 0);
  // The SPELLING, which is where the two libraries actually differ.
  check("marked aria-disabled rather than with the disabled attribute",
    s.disabled === true && oracle.disabled.ariaDisabled === "true" &&
      oracle.disabled.disabledAttr === false, true);
}

console.log("recorded, not scored");
{
  divergence("the element", "no tag — this kit has none", oracle.atRest.tag,
    "Base UI uses a span with role=switch, Radix a button. Both toggle on " +
    "Enter; only the button gets it from the browser. A kit with no tags is " +
    "in the span's position and must state the rule, which it does.");
  const input = (oracle.hiddenInput || [])[0];
  divergence("a hidden native input", "none",
    input ? `${input.type} name=${input.name} id=${input.id} aria-hidden=${input.ariaHidden}` : "none",
    "it exists so the control submits with a form, and it is where the id " +
    "and name go — a querySelector('#id') finds the checkbox, not the " +
    "switch. There is no form here to submit to.");
  const dataKeys = Object.keys(oracle.atRest.attrs || {}).filter((k) => k.startsWith("data-"));
  divergence("state attributes", "a class token and a UiRow field", dataKeys.join(",") || "none",
    "Base UI publishes data-checked/data-unchecked for its stylesheet; this " +
    "kit puts the state in a class token, which is the same idea in the " +
    "vocabulary EVGStyleSheet actually has.");
}

const total = pass + fail;
console.log("");
console.log(`parity: ${pass}/${total} switch behaviours match Base UI ${oracle.baseUi}`);
console.log(`         ${diverged} recorded divergence(s), none of them behavioural`);
console.log(fail ? `\nRESULT FAIL — failed=${fail}` : "\nRESULT OK — failed=0");
process.exitCode = fail ? 1 : 0;
