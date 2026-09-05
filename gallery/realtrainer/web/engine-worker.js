// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The RealTrainer app, served from a Worker.
//
// This is the whole of what runs off the main thread: the Ranger app and the
// generic `serveEngine` around it (gallery/evg/gl/evg-engine.js). The page
// — `main-worker.js` — never touches `RealTrainerDemo`; it posts the calls it
// used to make and paints the frames that come back.
//
// The hooks are the host logic that used to be three synchronous calls in a
// row on the main thread and is now one post: "what is under this point,
// and hover it". They read the tree, so they belong beside it.

import { serveEngine } from "../../evg/gl/evg-engine.js";
import { installCanvasMeasurer } from "../../evg/gl/evg-measure.js";
import { shiftsOf, effectOf } from "../../evg/gl/evg-list.js";
import * as RT from "../bin/RealTrainerDemo.cjs";
import { REALTRAINER_CSS, REALTRAINER_COMPACT, REALTRAINER_PLAN_MACHINE, REALTRAINER_CHAT_MACHINE, REALTRAINER_SEED } from "./generated.js";

// The browser measures here too — `OffscreenCanvas` — and before the app
// exists, because the app keeps a layout from the moment it is made.
const fontMeasure = installCanvasMeasurer(RT);

let hovered = "";
// The accessibility tree's generation and the host's focus, for the tree
// that rides on every new build — the host reads it, it does not ask.
let a11yGen = 0;
let a11yFocus = "";

serveEngine({
  make(init) {
    const app = new RT.RealTrainerDemo();
    app.init(REALTRAINER_CSS, REALTRAINER_COMPACT);
    app.loadPlanMachine(REALTRAINER_PLAN_MACHINE);
    app.loadChatMachine(REALTRAINER_CHAT_MACHINE);
    app.loadReference(REALTRAINER_SEED);
    app.setPointerCoarse(!!init.coarse);
    if (init.w > 0 && init.h > 0) app.setPageSize(init.w, init.h);
    if (init.route) app.openRoute(init.route);
    return app;
  },
  display: (app) => app.display(),
  shifts: (app, dl) => shiftsOf(dl),
  effect: (app, dl) => effectOf(dl),
  // What every reply carries: the reads the page makes on every frame, and
  // the ones its checks make, so none of them is a round trip.
  state: (app) => ({
    scene: app.sceneName(),
    field: app.focusedField(),
    velocity: app.scrollVelocity(),
    overBar: app.overScrollbar(),
    w: app.widthPx(),
    h: app.heightPx(),
    plan: app.plan.state(),
    chat: app.chat.state(),
  }),
  // A new build is when the tree changed, so the accessibility tree is
  // rebuilt beside it and crosses with it: the host's mirror and its checks
  // read a tree that is never behind the picture.
  onBuild: (app) => ({ a11y: app.a11yJson(++a11yGen, a11yFocus) }),
  hooks: {
    a11yFocus(app, id) {
      a11yFocus = id;
      return false;
    },
    // The pointer moved with nothing pressed: the scrollbar first, then the
    // element under it. Returns whether a frame is owed — the hover is
    // where the stylesheet's :hover rule and its transition start.
    hover(app, x, y) {
      let dirty = false;
      if (app.scrollbarHover(x, y)) dirty = true;
      const id = app.overScrollbar() ? "" : app.hitId(x, y);
      if (id !== hovered) {
        hovered = id;
        app.setHover(id);
        dirty = true;
      }
      return dirty;
    },
    leave(app) {
      hovered = "";
      app.setHover("");
      app.scrollbarHover(-1, -1);
      return true;
    },
    // A finger down: stop the page, mark what is under it.
    down(app, x, y) {
      app.scrollHalt();
      app.setPressed(app.hitId(x, y));
      return true;
    },
    // A tap: press what is under the point.
    up(app, x, y) {
      const id = app.hitId(x, y);
      app.setPressed("");
      return app.press(id);
    },
    // The faces finished loading on the page: measure again with them.
    refreshFonts(app) {
      fontMeasure.refresh();
      app.rebuild();
      return true;
    },
  },
});
