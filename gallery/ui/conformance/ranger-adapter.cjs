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

const MODULE = path.join(__dirname, "..", "bin", "ui_host.cjs");

function loadModule() {
  if (!fs.existsSync(MODULE)) {
    throw new Error("compiled host missing — run `npm run ui:build` first (" + MODULE + ")");
  }
  return require(MODULE);
}

function buildHost(M, fixture, css) {
  const host = new M.UiHost();
  if (css) host.addStyleSheet(css);
  for (const c of fixture.controls) {
    if (c.type === "toggle") {
      const ctl = host.addToggle(c.tid, c.name);
      if (c.disabled) {
        ctl.disabled = true;
        ctl.build();
      }
    } else if (c.type === "collapsible") {
      const ctl = host.addCollapsible(c.tid, c.name, c.body || "");
      if (c.disabled) {
        ctl.disabled = true;
        ctl.build();
      }
    } else {
      throw new Error("unknown control type: " + c.type);
    }
  }
  return host;
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
