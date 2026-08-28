/**
 * React-shaped JS façade over the Ranger-compiled gallery/ui module.
 *
 *   const root = require("./ranger-ui-runtime.cjs").createRoot();
 *   root.render(() => root.createElement(root.View, { onClick: () => ... }, ...));
 *   root.dispatchClick(x, y);
 *   const json = root.renderToDisplayListJson(tree);
 */

"use strict";

const path = require("path");
const Module = require(path.join(__dirname, "..", "bin", "ranger_ui_module.cjs"));

function createRoot() {
  const ui = new Module.RangerUI();
  const api = ui.getAPI();
  const hooks = ui.getHooks();
  const handlers = new Map();
  let handlerSeq = 0;
  let renderFn = null;
  let currentTree = null;

  function makeProps(obj) {
    const names = [];
    const values = [];
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        if (k === "children" || k === "key" || k === "ref") continue;
        if (k === "onClick" && typeof v === "function") {
          const id = "h" + String(++handlerSeq);
          handlers.set(id, v);
          names.push("onClick");
          values.push(id);
          continue;
        }
        if (typeof v === "function") continue;
        if (v === undefined || v === null) continue;
        names.push(k);
        values.push(String(v));
      }
    }
    return ui.propsFrom(names, values);
  }

  function asChild(c) {
    if (c === null || c === undefined || c === false || c === true) return null;
    if (typeof c === "string" || typeof c === "number") {
      return ui.text(String(c));
    }
    return c;
  }

  function typeNameOf(type) {
    if (typeof type === "string") return type;
    if (typeof type === "function") {
      return type.displayName || type.name || "Anon";
    }
    return "div";
  }

  function createElement(type, props, ...rest) {
    const kids = [];
    const fromRest = rest.flat(Infinity);
    for (const c of fromRest) {
      const el = asChild(c);
      if (el) kids.push(el);
    }
    if (props && props.children != null) {
      const ch = Array.isArray(props.children) ? props.children : [props.children];
      for (const c of ch.flat(Infinity)) {
        const el = asChild(c);
        if (el) kids.push(el);
      }
    }
    const name = typeNameOf(type);
    return ui.createElement(name, makeProps(props), kids);
  }

  function Fragment(props) {
    const ch = props && props.children != null ? [].concat(props.children) : [];
    return createElement("Fragment", null, ...ch);
  }
  Fragment.displayName = "Fragment";

  function View(props) {
    return createElement("View", props);
  }
  View.displayName = "View";

  function Text(props) {
    return createElement("Text", props);
  }
  Text.displayName = "Text";

  function Button(props) {
    return createElement("Button", props);
  }
  Button.displayName = "Button";

  function Image(props) {
    return createElement("Image", props);
  }
  Image.displayName = "Image";

  function useState(initial) {
    const st = hooks.useState(String(initial));
    const set = (next) => {
      const cur = st.value;
      const v = typeof next === "function" ? next(cur) : next;
      hooks.setState(st.index, String(v));
    };
    return [st.value, set];
  }

  /**
   * Run a render function: beginRender → component (hooks + createElement) → layout.
   * Returns the virtual tree; hit regions are ready for dispatchClick.
   */
  function render(componentFn) {
    renderFn = componentFn;
    handlers.clear();
    handlerSeq = 0;
    ui.beginRender();
    currentTree = componentFn();
    ui.layoutPrepared(currentTree);
    return currentTree;
  }

  function rerenderIfDirty() {
    if (!renderFn) return false;
    if (!hooks.isDirty()) return false;
    handlers.clear();
    handlerSeq = 0;
    ui.beginRender();
    currentTree = renderFn();
    ui.layoutPrepared(currentTree);
    return true;
  }

  function dispatchClick(x, y) {
    const ev = ui.dispatchClick(x, y);
    const out = {
      type: "click",
      clientX: x,
      clientY: y,
      handlerId: ev.handlerId,
      handled: !!ev.handled,
    };
    if (ev.handled && handlers.has(ev.handlerId)) {
      handlers.get(ev.handlerId)(out);
      out.rerendered = rerenderIfDirty();
    } else {
      out.rerendered = false;
    }
    return out;
  }

  function hitTest(x, y) {
    return ui.hitTest(x, y);
  }

  function renderToEVG(element) {
    return ui.renderToEVG(element);
  }

  function renderToDisplayListJson(element, width, height) {
    if (width != null && height != null) {
      ui.setPageSize(width, height);
    }
    if (element == null) {
      element = currentTree;
    }
    return ui.renderToDisplayListJson(element);
  }

  function displayListCommandCount(element, width, height) {
    if (width != null && height != null) {
      ui.setPageSize(width, height);
    }
    if (element == null) {
      element = currentTree;
    }
    return ui.displayListCommandCount(element);
  }

  function hitRegionCount() {
    return ui.hitRegionCount();
  }

  function setPageSize(w, h) {
    ui.setPageSize(w, h);
  }

  return {
    createElement,
    Fragment,
    useState,
    View,
    Text,
    Button,
    Image,
    render,
    dispatchClick,
    hitTest,
    hitRegionCount,
    setPageSize,
    renderToEVG,
    renderToDisplayListJson,
    displayListCommandCount,
    get currentTree() {
      return currentTree;
    },
    /** @internal */
    _ui: ui,
    _api: api,
    _hooks: hooks,
    _Module: Module,
  };
}

const defaultRoot = createRoot();

module.exports = {
  createRoot,
  createElement: defaultRoot.createElement,
  Fragment: defaultRoot.Fragment,
  useState: defaultRoot.useState,
  View: defaultRoot.View,
  Text: defaultRoot.Text,
  Button: defaultRoot.Button,
  Image: defaultRoot.Image,
  render: defaultRoot.render,
  dispatchClick: defaultRoot.dispatchClick,
  hitTest: defaultRoot.hitTest,
  hitRegionCount: defaultRoot.hitRegionCount,
  setPageSize: defaultRoot.setPageSize,
  renderToEVG: defaultRoot.renderToEVG,
  renderToDisplayListJson: defaultRoot.renderToDisplayListJson,
  displayListCommandCount: defaultRoot.displayListCommandCount,
};
