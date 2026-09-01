/**
 * EVG side of the bench.
 *
 * Two paint paths, because they are different costs and the showcase page
 * pays the more expensive one every frame:
 *
 *   engine     layout + display-list build. What a native host (SDL, the C++
 *              painter) would do — it wants the commands, not a string.
 *   showcase   engine + toJson + JSON.parse + WebGL. What
 *              gallery/ui/demo/main.js actually does.
 *
 * The breakdown is reported so a slow frame can say whether it was layout,
 * the list, the serialise, or the GPU.
 */

import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import * as HostModule from "../bin/ui_host.cjs";
import { buildHost } from "../conformance/build-host.cjs";
import { MenubarDemo } from "../bin/MenubarDemo.cjs";
import { ToolbarDemo } from "../bin/ToolbarDemo.cjs";
import { SortableDemo } from "../bin/SortableDemo.cjs";
import { MotionDemo } from "../bin/MotionDemo.cjs";
import { TableDemo } from "../bin/TableDemo.cjs";
import { DropdownDemo } from "../bin/DropdownDemo.cjs";
import {
  MENUBAR_CSS,
  TOOLBAR_CSS,
  SORTABLE_CSS,
  MOTION_CSS,
  TABLE_CSS,
  DROPDOWN_CSS,
  THEME_CSS,
} from "./generated.js";
import { SCENES, PAGE, fixtureFor, actionTid } from "./scenes.js";

const canvas = document.getElementById("evg");
const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: true,
});
if (!gl) throw new Error("WebGL 2 is not available");

const motion = new MotionDemo();
motion.init(MOTION_CSS);
const tableDemo = new TableDemo();
tableDemo.init(TABLE_CSS);
const dropdown = new DropdownDemo();
dropdown.init(DROPDOWN_CSS);

function countEls(el) {
  if (!el) return 0;
  const kids = el.children;
  const n = kids && typeof kids.length === "number" ? kids.length : 0;
  let total = 1;
  for (let i = 0; i < n; i++) total += countEls(kids[i]);
  return total;
}

function paint(list, w, h) {
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w;
  canvas.height = h;
  return renderDisplayList(gl, { width: w, height: h, list }, { dpr: 1 });
}

function now() {
  return performance.now();
}

function engineFromHost(host) {
  const t0 = now();
  const page = host.layout();
  const t1 = now();
  const lay = new HostModule.EVGLayout();
  lay.setPageSize(host.pageWidth, host.pageHeight);
  const dl = new HostModule.EVGDisplayList();
  dl.setTextEngine(lay.getTextEngine());
  dl.build(page);
  const t2 = now();
  const json = dl.toJson();
  const t3 = now();
  const list = JSON.parse(json);
  const t4 = now();
  const glStats = paint(list, host.pageWidth, host.pageHeight);
  const t5 = now();
  return {
    layout_ms: t1 - t0,
    dl_ms: t2 - t1,
    json_ms: t3 - t2,
    parse_ms: t4 - t3,
    gl_ms: t5 - t4,
    engine_ms: t2 - t0,
    showcase_ms: t5 - t0,
    cmds: typeof dl.count === "function" ? dl.count() : list.cmds.length,
    json_bytes: json.length,
    elements: countEls(host.root),
    drawn: glStats.drawn,
    gl_runs: glStats.runs,
  };
}

function engineFromJson(json, w, h) {
  const t0 = now();
  const list = JSON.parse(json);
  const t1 = now();
  const glStats = paint(list, w, h);
  const t2 = now();
  return {
    json_ms: 0,
    parse_ms: t1 - t0,
    gl_ms: t2 - t1,
    showcase_ms: t2 - t0,
    engine_ms: 0,
    layout_ms: 0,
    dl_ms: 0,
    cmds: list.cmds.length,
    json_bytes: json.length,
    elements: 0,
    drawn: glStats.drawn,
    gl_runs: glStats.runs,
  };
}

function showcaseMeasure(name) {
  const t0 = now();
  let json;
  let w = 1240;
  let h = 560;
  switch (name) {
    case "menubar":
      json = MenubarDemo.displayListJson(
        MENUBAR_CSS,
        ["Always Show Full URLs"],
        "Luis",
        "File",
        true,
        false,
      );
      h = 560;
      break;
    case "toolbar":
      json = ToolbarDemo.displayListJson(
        TOOLBAR_CSS,
        true,
        false,
        false,
        "center",
        "Edited 2 hours ago",
      );
      h = 320;
      break;
    case "sortable":
      json = SortableDemo.displayListJson(
        SORTABLE_CSS,
        ["demo", "spec", "video", "audio", "extra"],
        "",
      );
      h = 560;
      break;
    case "table":
      json = tableDemo.displayListJson();
      w = 900;
      h = 460;
      break;
    case "dropdown":
      json = dropdown.displayListJson();
      w = 900;
      h = 560;
      break;
    case "motion":
      json = motion.displayListJson();
      w = 1240;
      h = motion.heightPx();
      break;
    default:
      throw new Error("unknown showcase " + name);
  }
  const built = now();
  const rest = engineFromJson(json, w, h);
  rest.engine_ms = built - t0;
  rest.layout_ms = built - t0;
  rest.dl_ms = 0;
  rest.json_ms = 0;
  rest.showcase_ms = rest.showcase_ms + (built - t0);
  rest.page_w = w;
  rest.page_h = h;
  return rest;
}

function mountKit(scene) {
  const host = buildHost(HostModule, fixtureFor(scene), THEME_CSS);
  host.setPageSize(PAGE.width, PAGE.height);
  host.layout();
  return host;
}

function median(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function repeatsFor(scene) {
  if (scene.n && scene.n >= 1000) return { warm: 1, timed: 3 };
  if (scene.n && scene.n >= 200) return { warm: 1, timed: 5 };
  return { warm: 1, timed: 7 };
}

/**
 * Mount, warm up, time the frame, then time one incremental update.
 */
export async function benchEvg(scene) {
  const reps = repeatsFor(scene);
  if (scene.evg === "showcase") {
    showcaseMeasure(scene.showcase); // warmup
    const samples = [];
    for (let i = 0; i < reps.timed; i++) samples.push(showcaseMeasure(scene.showcase));
    const first = samples[0];
    return {
      side: "evg",
      id: scene.id,
      group: scene.group,
      n: scene.n || 0,
      pageSize: scene.pageSize || 0,
      engine_ms: median(samples.map((s) => s.engine_ms)),
      showcase_ms: median(samples.map((s) => s.showcase_ms)),
      build_ms: 0,
      layout_ms: median(samples.map((s) => s.layout_ms)),
      dl_ms: median(samples.map((s) => s.dl_ms)),
      json_ms: median(samples.map((s) => s.json_ms)),
      parse_ms: median(samples.map((s) => s.parse_ms)),
      gl_ms: median(samples.map((s) => s.gl_ms)),
      update_ms: 0,
      cmds: first.cmds,
      json_bytes: first.json_bytes,
      elements: first.elements,
      drawn: first.drawn,
    };
  }

  let host = mountKit(scene);
  for (let i = 0; i < reps.warm; i++) engineFromHost(host);

  const samples = [];
  for (let i = 0; i < reps.timed; i++) {
    // Fresh host each sample: build() lives inside mountKit, and leaving it
    // out would compare a retained EVG tree to a React tree that is created
    // every mount.
    const t0 = now();
    host = mountKit(scene);
    const built = now() - t0;
    const painted = engineFromHost(host);
    painted.build_ms = built;
    painted.engine_ms += built;
    painted.showcase_ms += built;
    samples.push(painted);
  }

  let update_ms = 0;
  const tid = actionTid(scene);
  if (tid) {
    const updates = [];
    for (let i = 0; i < reps.timed; i++) {
      host = mountKit(scene);
      engineFromHost(host);
      const t0 = now();
      host.click(tid);
      engineFromHost(host);
      updates.push(now() - t0);
    }
    update_ms = median(updates);
  }

  const first = samples[0];
  return {
    side: "evg",
    id: scene.id,
    group: scene.group,
    n: scene.n || 0,
    pageSize: scene.pageSize || 0,
    engine_ms: median(samples.map((s) => s.engine_ms)),
    showcase_ms: median(samples.map((s) => s.showcase_ms)),
    build_ms: median(samples.map((s) => s.build_ms || 0)),
    layout_ms: median(samples.map((s) => s.layout_ms)),
    dl_ms: median(samples.map((s) => s.dl_ms)),
    json_ms: median(samples.map((s) => s.json_ms)),
    parse_ms: median(samples.map((s) => s.parse_ms)),
    gl_ms: median(samples.map((s) => s.gl_ms)),
    update_ms,
    cmds: first.cmds,
    json_bytes: first.json_bytes,
    elements: first.elements,
    drawn: first.drawn,
  };
}

window.__SCENES__ = SCENES;
window.__benchEvg = benchEvg;
window.__EVG_READY__ = true;
