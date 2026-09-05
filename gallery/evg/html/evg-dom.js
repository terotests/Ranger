// SPDX-License-Identifier: AGPL-3.0-or-later
//
// evg-dom.js — the page as DOM nodes that SURVIVE a frame.
//
// `evg-html.js` paints the display list as `<svg>` and rebuilds every node
// every frame, because a draw command carries no identity; its header says
// that is a property of the seam. This file sits on the other seam —
// `EVGHostTree` (PLAN_NATIVE_HOSTS.md S2/S3): ops keyed by the inspector's
// path, saying what was CREATED, what changed on a node that exists and
// which of five things changed, what MOVED and what is gone. One DOM node
// per element, made once and patched, so a CSS transition, a focus ring, a
// caret or a real `<input>` has something to attach to, and a frame that
// changed one colour writes one style property.
//
// WHAT IS NATIVE HERE AND WHAT IS NOT. Geometry is EVG's: every node is
// `position: absolute` at the rectangle the layout computed, inside its
// parent, at scroll 0. Text is EVG's lines: one `<div>` per line with
// `white-space: pre`, so the browser breaks nothing itself and a PDF laid
// out from the same tree breaks in the same place. What the browser
// contributes is what a canvas cannot: identity, selectable text, the
// compositor — a scroll container's children live in a layer that moves by
// one `transform`, written from the SCROLL bit — and, later, the field
// itself where the page draws a field.
//
// Paths are `<path d>` inside an inline `<svg>`, verbatim: the host tree
// hands over the source rather than flattened rings, because this host has
// a path renderer.

const SVG_NS = "http://www.w3.org/2000/svg";

const rgba = (c) => `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;
const px = (v) => `${v}px`;

/**
 * Make a painter over `target`.
 *
 * @param {HTMLElement} target  the stage the page is built into
 * @returns {{ apply: (doc: object) => object, count: () => number,
 *             nodes: () => object[], reset: () => void }}
 */
export function createDomPainter(target) {
  // path -> { el, inner, index, parent, px, py, w, h, born }
  const nodes = new Map();
  let build = 0;

  target.style.position = "relative";
  target.style.overflow = "hidden";

  function reset() {
    for (const n of nodes.values()) n.el.remove();
    nodes.clear();
  }

  // Where a child of `n` is appended: the scroll layer of a clipping box,
  // the box itself otherwise.
  const slotOf = (n) => n.inner || n.el;

  function placeInParent(n, op) {
    const parent = op.parent ? nodes.get(op.parent) : null;
    const slot = parent ? slotOf(parent) : target;
    n.parent = op.parent;
    n.index = op.index;
    // Siblings are ordered by the tree index the op carries; hidden
    // elements leave gaps, so "the first sibling with a larger index" is
    // the place, not "the child at that index".
    let before = null;
    for (const c of slot.children) {
      const ci = c.__evgIndex;
      if (ci !== undefined && ci > op.index) { before = c; break; }
    }
    n.el.__evgIndex = op.index;
    if (before) slot.insertBefore(n.el, before); else slot.appendChild(n.el);
  }

  function makeNode(op) {
    const el = document.createElement("div");
    el.className = "evg-node";
    el.style.position = "absolute";
    el.style.boxSizing = "border-box";
    el.style.margin = "0";
    el.dataset.path = op.path;
    if (op.id) el.dataset.id = op.id;
    const n = { el, inner: null, index: op.index, parent: op.parent, x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0, born: build };
    if (op.clip) {
      // The layer the compositor moves. Children go in it; the box clips.
      const inner = document.createElement("div");
      inner.className = "evg-layer";
      inner.style.position = "absolute";
      inner.style.left = "0";
      inner.style.top = "0";
      inner.style.width = "100%";
      inner.style.height = "100%";
      inner.style.willChange = "transform";
      el.appendChild(inner);
      n.inner = inner;
      el.style.overflow = "hidden";
    }
    return n;
  }

  function geometry(n, op) {
    n.el.style.left = px(op.x);
    n.el.style.top = px(op.y);
    n.el.style.width = px(op.w);
    n.el.style.height = px(op.h);
    n.x = op.x; n.y = op.y; n.w = op.w; n.h = op.h;
  }

  function paint(n, op) {
    const s = n.el.style;
    // The element's own classes ride on the node, after this painter's, so
    // a page's stylesheet can address what the tree named.
    n.el.className = "evg-node" + (op.cls ? " " + op.cls : "");
    if (op.gd !== undefined && op.bg2) {
      // 1 = across, otherwise down — the display list's `gd`.
      s.backgroundImage = `linear-gradient(${op.gd === 1 ? "to right" : "to bottom"}, ${rgba(op.bg)}, ${rgba(op.bg2)})`;
      s.backgroundColor = "";
    } else {
      s.backgroundImage = "";
      s.backgroundColor = op.bg ? rgba(op.bg) : "";
    }
    // A border is a band INSIDE the box, and it must not move the children:
    // CSS places an absolute child inside the parent's PADDING box, so a real
    // `border` would shift every child by its width. An inset box-shadow is
    // the same band, follows the radius, and moves nothing. The drop shadow
    // rides in the same list.
    const shadows = [];
    if (op.bw) shadows.push(`inset 0 0 0 ${op.bw}px ${rgba(op.bc)}`);
    if (op.sh) shadows.push(`${op.sh.x}px ${op.sh.y}px ${op.sh.blur}px ${rgba(op.sh.c)}`);
    s.boxShadow = shadows.join(", ");
    s.borderRadius = op.rc ? `${op.rc[0]}px ${op.rc[1]}px ${op.rc[2]}px ${op.rc[3]}px` : "";
    s.opacity = op.opacity !== undefined ? String(op.opacity) : "";
    s.cursor = op.cursor || "";
    s.backdropFilter = op.bb ? `blur(${op.bb}px)` : "";
    s.transform = op.rot ? `rotate(${op.rot}deg)` : "";
    s.zIndex = op.overlay ? "10" : "";
    if (op.src) {
      let img = n.el.querySelector(":scope > img.evg-img");
      if (!img) {
        img = document.createElement("img");
        img.className = "evg-img";
        img.style.position = "absolute";
        img.style.left = "0";
        img.style.top = "0";
        img.style.width = "100%";
        img.style.height = "100%";
        img.draggable = false;
        n.el.appendChild(img);
      }
      if (img.getAttribute("src") !== op.src) img.setAttribute("src", op.src);
      img.style.objectFit = op.fit || "cover";
    }
    if (op.path) {
      let svg = n.el.querySelector(":scope > svg.evg-path");
      if (!svg) {
        svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", "evg-path");
        svg.style.position = "absolute";
        svg.style.left = "0";
        svg.style.top = "0";
        svg.style.overflow = "visible";
        n.el.appendChild(svg);
      }
      svg.setAttribute("width", String(op.w));
      svg.setAttribute("height", String(op.h));
      if (op.path.viewBox) svg.setAttribute("viewBox", op.path.viewBox); else svg.removeAttribute("viewBox");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      if (op.path.svg && !op.path.d) {
        svg.innerHTML = op.path.svg;
      } else {
        let p = svg.querySelector("path");
        if (!p) {
          p = document.createElementNS(SVG_NS, "path");
          svg.appendChild(p);
        }
        p.setAttribute("d", op.path.d || "");
        p.setAttribute("fill", op.path.fill ? rgba(op.path.fill) : "none");
        p.setAttribute("fill-rule", op.path.rule || "nonzero");
        if (op.path.stroke) {
          p.setAttribute("stroke", rgba(op.path.stroke));
          p.setAttribute("stroke-width", String(op.path.sw || 1));
          if (op.path.dash) p.setAttribute("stroke-dasharray", op.path.dash);
        } else {
          p.removeAttribute("stroke");
        }
      }
    }
  }

  function text(n, op) {
    for (const old of n.el.querySelectorAll(":scope > .evg-line")) old.remove();
    if (!op.text) return;
    const t = op.text;
    for (const [line, x, y] of t.lines) {
      const d = document.createElement("div");
      d.className = "evg-line";
      d.style.position = "absolute";
      d.style.left = px(x);
      d.style.top = px(y);
      d.style.whiteSpace = "pre";
      d.style.lineHeight = px(t.lh);
      d.style.height = px(t.lh);
      d.style.font = `${t.weight ? t.weight + " " : ""}${t.size}px "${t.font.replace(/-Bold$/, "")}", sans-serif`;
      d.style.color = rgba(t.c);
      // The same bidi override the painters apply: EVG ordered the runs.
      d.textContent = "\u202D" + line + "\u202C";
      n.el.appendChild(d);
    }
  }

  function a11y(n, op) {
    if (op.role) n.el.setAttribute("role", op.role); else n.el.removeAttribute("role");
    if (op.label) n.el.setAttribute("aria-label", op.label); else n.el.removeAttribute("aria-label");
    const st = op.state || "";
    n.el.setAttribute("aria-disabled", st.includes("d") ? "true" : "false");
    if (st.includes("h")) n.el.setAttribute("aria-hidden", "true"); else n.el.removeAttribute("aria-hidden");
    n.el.tabIndex = st.includes("f") ? 0 : -1;
  }

  function scroll(n, op) {
    if (!n.inner || !op.scroll) return;
    n.sx = op.scroll[0];
    n.sy = op.scroll[1];
    n.inner.style.transform = `translate(${-n.sx}px, ${-n.sy}px)`;
  }

  /**
   * Apply one host document: `{ width, height, host: { ops, … } }`.
   * Returns the tally the ops carried.
   */
  function apply(doc) {
    build += 1;
    // The height is the document's; the WIDTH is the stage's own, because a
    // responsive page is laid out to the width the stage has — a painter
    // that fixed it would stop the page ever being resized.
    target.style.height = px(doc.height);
    const host = doc.host;
    for (const op of host.ops) {
      switch (op.op) {
        case "create": {
          const n = makeNode(op);
          nodes.set(op.path, n);
          geometry(n, op);
          paint(n, op);
          text(n, op);
          a11y(n, op);
          scroll(n, op);
          placeInParent(n, op);
          break;
        }
        case "update": {
          const n = nodes.get(op.path);
          if (!n) break;
          if (op.bits & 1) geometry(n, op);
          if (op.bits & 2) paint(n, op);
          if (op.bits & 4) text(n, op);
          if (op.bits & 8) a11y(n, op);
          if (op.bits & 16) scroll(n, op);
          break;
        }
        case "move": {
          const n = nodes.get(op.path);
          if (!n) break;
          placeInParent(n, op);
          break;
        }
        case "remove": {
          const n = nodes.get(op.path);
          if (!n) break;
          n.el.remove();
          nodes.delete(op.path);
          break;
        }
        default:
          break;
      }
    }
    return { build, created: host.created, updated: host.updated, moved: host.moved, removed: host.removed, count: host.count, nodes: nodes.size };
  }

  return {
    apply,
    reset,
    count: () => nodes.size,
    /** Every node: its path, the page rectangle the engine's offsets add up
     *  to — walked up the parents, because a child whose parent moved got
     *  no op of its own — and the build it was made in. For a check that
     *  asks the DOM where it put them. */
    nodes: () => [...nodes.entries()].map(([path, n]) => {
      let px = 0, py = 0;
      for (let c = n; c; c = c.parent ? nodes.get(c.parent) : null) {
        px += c.x; py += c.y;
        const p = c.parent ? nodes.get(c.parent) : null;
        if (p) { px -= p.sx; py -= p.sy; }
      }
      return { path, el: n.el, px, py, w: n.w, h: n.h, born: n.born };
    }),
  };
}
