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
  const observe = (label) => {
    // Lay out before observing: `visible` is a fact about the display tree.
    host.layout();
    trace.push({ step: label, nodes: JSON.parse(host.traceJson()).nodes });
  };

  observe("initial");
  for (const step of spec.steps) {
    if ("click" in step) {
      host.click(step.click);
      observe("click " + step.click);
    } else if ("key" in step) {
      host.key(step.key);
      observe("key " + JSON.stringify(step.key));
    } else if ("focus" in step) {
      host.focus(step.focus);
      observe("focus " + step.focus);
    } else if ("hover" in step) {
      host.hover(step.hover);
      observe("hover " + step.hover);
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
      observe("press " + step.press + " @" + (step.at ?? 0.5));
    } else if ("dragto" in step) {
      host.dragFraction(step.dragto);
      observe("dragto " + step.dragto);
    } else if ("release" in step) {
      host.pointerUp();
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
