/**
 * Ranger adapter — drives the compiled EVG controllers with a conformance
 * spec and prints the behaviour trace.
 *
 * No browser, no React, no network: this side runs in CI.
 *
 *   node gallery/ui/conformance/ranger-adapter.cjs <spec.json>
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { buildHost } = require("./build-host.cjs");

const MODULE = path.join(__dirname, "..", "bin", "ui_host.cjs");

function loadModule() {
  if (!fs.existsSync(MODULE)) {
    throw new Error("compiled host missing — run `npm run ui:build` first (" + MODULE + ")");
  }
  return require(MODULE);
}


function run(spec, css) {
  const M = loadModule();
  const host = buildHost(M, spec.fixture, css);
  const trace = [];
  // What the spec asked to observe beyond the nodes themselves; see SPEC.md.
  const announce = (spec.observe || []).includes("announce");
  const observe = (label) => {
    // Lay out before observing: `visible` is a fact about the display tree.
    host.layout();
    const nodes = JSON.parse(host.traceJson()).nodes;
    if (announce) {
      // The live region, as a node of its own — the same shape the DOM side
      // synthesises, so the diff needs no special case for it.
      nodes.push({
        tid: "@announce",
        role: "status",
        name: host.announcementText(),
        state: "",
        expanded: null,
        pressed: null,
        checked: null,
        selected: null,
        disabled: false,
        tabstop: false,
        orientation: null,
        valuenow: null,
        valuemin: null,
        valuemax: null,
        hidden: false,
        focused: false,
        visible: true,
        roledescription: null,
        sort: null,
        haspopup: null,
        level: null,
        setsize: null,
        setpos: null,
        parent: "",
        posinset: 0,
      });
    }
    trace.push({ step: label, nodes });
  };

  observe("initial");
  for (const step of spec.steps) {
    if ("click" in step) {
      const mods = step.mods || [];
      host.clickWith(step.click, mods.includes("Shift"), mods.includes("Control"));
      observe("click " + step.click + (mods.length ? " [" + mods.join("+") + "]" : ""));
    } else if ("key" in step) {
      host.key(step.key);
      // `settle` is deliberately NOT ticked here, unlike on a hover step. It
      // exists because the REFERENCE moves focus in an effect and needs a
      // moment to finish; this side has no async at all and is settled the
      // instant `key` returns. Advancing a clock here would move controller
      // timers the reference's wait does not.
      observe("key " + JSON.stringify(step.key) +
        (step.settle ? " +" + step.settle + "ms" : ""));
    } else if ("focus" in step) {
      host.focus(step.focus);
      observe("focus " + step.focus);
    } else if ("hover" in step) {
      host.hover(step.hover);
      // The clock, for the surfaces that have one. A submenu opens 100ms after
      // the pointer lands on its parent row; the reference side waits the same
      // wall-clock time, and this side is told how much time passed. A step
      // with no `settle` advances nothing, so every existing spec is unchanged.
      if (step.settle) host.tick(step.settle);
      observe("hover " + step.hover + (step.settle ? " +" + step.settle + "ms" : ""));
    } else if ("unhover" in step) {
      host.unhover();
      observe("unhover");
    } else if ("press" in step) {
      // The fraction goes straight in: the spec says "80% across the track",
      // and each side resolves that against its own geometry rather than
      // trading pixels that mean different things.
      //
      // Which makes it essential that both sides measure the same rectangle.
      // The DOM adapter can only use the element the spec names, so the spec
      // must name the one the control actually drags against — pressing an
      // 18px thumb "at 0.8" and a 200px track "at 0.8" are different points.
      // Checked rather than documented: a silent divergence here would look
      // like a behaviour difference.
      const bounds = host.dragBoundsFor(step.press);
      if (bounds && bounds !== step.press) {
        throw new Error(
          `press "${step.press}" is measured against "${bounds}" — name that in the spec instead`,
        );
      }
      host.pressTid(step.press, step.at ?? 0.5);
      // A press that is not measured against a track is a press ON something:
      // the sortable's gesture starts here and needs no geometry.
      host.pressOn(step.press);
      observe("press " + step.press + " @" + (step.at ?? 0.5));
    } else if ("dragpick" in step) {
      host.dragPick(step.dragpick);
      observe("dragpick " + step.dragpick);
    } else if ("dragpoint" in step) {
      host.dragPoint(step.dragpoint, step.aty ?? 0.5, step.x ?? 0);
      if (step.hold) host.dragHold(step.hold);
      observe(
        "dragpoint " + step.dragpoint + " y" + (step.aty ?? 0.5) + " x" + (step.x ?? 0) +
          (step.hold ? " +" + step.hold + "ms" : ""),
      );
    } else if ("dragland" in step) {
      host.dragLand(step.dragland, step.aty ?? 0.5, step.x ?? 0);
      observe("dragland " + step.dragland + " y" + (step.aty ?? 0.5) + " x" + (step.x ?? 0));
    } else if ("dragto" in step) {
      host.dragFraction(step.dragto);
      observe("dragto " + step.dragto);
    } else if ("dragover" in step) {
      host.dragOnto(step.dragover);
      observe("dragover " + step.dragover);
    } else if ("release" in step) {
      host.pointerUp();
      host.releaseDrag();
      observe("release");
    } else if ("rightclick" in step) {
      host.rightClick(step.rightclick);
      observe("rightclick " + step.rightclick);
    } else {
      throw new Error("unknown step: " + JSON.stringify(step));
    }
  }
  return { adapter: "ranger", spec: spec.name, trace };
}

module.exports = { run };

if (require.main === module) {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error("usage: ranger-adapter.cjs <spec.json>");
    process.exit(2);
  }
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const cssPath = path.join(__dirname, "..", "theme", "base.css");
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
  process.stdout.write(JSON.stringify(run(spec, css), null, 1) + "\n");
}
