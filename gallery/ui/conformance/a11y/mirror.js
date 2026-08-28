/**
 * The EVG side, as an accessibility tree in real DOM.
 *
 * A screen reader cannot read a canvas. `gallery/evg/gl/evg-a11y.js` exists to
 * solve that: the app publishes what the frame MEANS as an `EVGA11yTree`, and
 * the mirror turns it into positioned DOM elements carrying the roles, names
 * and states. That is what a reader walks — and therefore the only honest
 * thing to point an auditor at.
 *
 * So this page builds the same fixture the parity harness uses, asks UiHost for
 * its accessibility tree, and mirrors it. `a11y.mjs` then runs axe-core over
 * the result, exactly as it runs axe over the Radix page.
 */

import { buildHost } from "../build-host.cjs";
import { createA11yMirror } from "../../../evg/gl/evg-a11y.js";
import * as HostModule from "../../bin/ui_host.cjs";
import { FIXTURE, THEME_CSS, PAGE } from "./generated.js";

const host = buildHost(HostModule, FIXTURE, THEME_CSS);
host.setPageSize(PAGE.width, PAGE.height);
host.layout();

const stage = document.getElementById("stage");
stage.style.position = "relative";
stage.style.width = PAGE.width + "px";
stage.style.height = PAGE.height + "px";

// No canvas: the audit is about the tree a reader gets, and a canvas would only
// add the empty graphic the mirror exists to replace.
const mirror = createA11yMirror(stage, { label: "Ranger UI" });

function paint() {
  mirror.update(JSON.parse(host.a11yJson()));
}
paint();

// The driver steps the controllers and re-mirrors, so the audit can look at a
// dialog that is open, a tab that is selected, a checkbox that is mixed —
// states an initial render never shows.
window.__evg = {
  click: (tid) => {
    host.click(tid);
    paint();
  },
  key: (name) => {
    host.key(name);
    paint();
  },
  displayList: () => JSON.parse(host.displayListJson()),
  a11y: () => JSON.parse(host.a11yJson()),
  lint: () => host.a11yProblems(),
};
window.__READY__ = true;
