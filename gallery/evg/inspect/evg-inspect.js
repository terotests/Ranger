// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The EVG inspector panel — dev tools for a picture nobody can read.
//
// An EVG app in a browser is one <canvas>, or a flat pile of <rect> and <path>
// in paint order. Either way the browser's own dev tools have nothing to say
// about it. This is the panel that does: the element hierarchy, the box model
// over the real pixels, the computed style, and the draw commands each element
// emitted.
//
// GENERIC ON PURPOSE. It knows nothing about any app. It is handed an adapter
// of small functions and everything it shows is read through them:
//
//   attach({
//     surface,                  // the <canvas> or <svg> the app paints into
//     app: {
//       tree:  () => json,      // REQUIRED — EVGInspect.treeJson()
//       node:  (path) => json,  // optional — EVGInspect.nodeJson(path)
//       hit:   (x, y) => path,  // optional — EVGInspect.hitPath(); a geometric
//                               //            fallback is used when absent
//       frame: () => json,      // optional — displayListJson() with attribution
//       refresh: () => void,    // optional — ask the host to repaint
//       viewport: () => [w, h], // optional — the surface's logical size, when
//                               //            the tree does not fill it
//       transform: () => json,  // optional — {x, y, k} mapping the tree's
//                               //            coordinates onto the surface
//       css:   () => ({ name, text, href, errors }),   // optional
//       setCss: (text) => void,                        // optional
//       label: "…",             // optional — what to call the app
//     },
//   })
//
// Everything past `tree` degrades rather than fails, which is what makes one
// panel serve a slide editor and a dashboard without either knowing about it.
//
// `css`/`setCss` are the pair that makes the panel an editor rather than a
// viewer, and they are the reason it does not need an override layer. The
// element tree is an app's OUTPUT — edit it and the next rebuild throws the
// edit away, which is why a DevTools style edit dies on a React re-render. The
// stylesheet is an app's INPUT: hand back a changed one and the app re-parses
// and re-cascades exactly as it did at startup. Nothing is intercepted, and
// the text in the editor is the text that goes in the file.
//
// The overlay is DOM over the surface, not commands in the display list. Two
// reasons and both matter: a screenshot taken while the panel is open is still
// a screenshot of the app, and one implementation then serves both painters —
// the WebGL canvas and the SVG one are the same rectangle on the page.

const CSS = `
.evgi { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; z-index: 2147483000;
  display: flex; flex-direction: column; box-sizing: border-box;
  font: 12px/1.5 ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  background: var(--evgi-bg); color: var(--evgi-ink); border-left: 1px solid var(--evgi-line);
  box-shadow: -8px 0 28px rgba(0,0,0,.28); }
.evgi, .evgi * { box-sizing: border-box; }
.evgi { --evgi-bg:#12151c; --evgi-panel:#171b24; --evgi-line:#262c39; --evgi-ink:#dfe4ee;
  --evgi-dim:#8b96ab; --evgi-accent:#7aa2f7; --evgi-sel:#243044;
  --evgi-margin:rgba(246,178,107,.45); --evgi-border:rgba(255,229,143,.45);
  --evgi-padding:rgba(147,196,125,.40); --evgi-content:rgba(122,162,247,.42); }
.evgi.evgi-light { --evgi-bg:#ffffff; --evgi-panel:#f6f7f9; --evgi-line:#e2e5ea; --evgi-ink:#1b2029;
  --evgi-dim:#6a7382; --evgi-accent:#3661c9; --evgi-sel:#e6ecf9; }
.evgi-head { display:flex; align-items:center; gap:6px; padding:7px 9px; border-bottom:1px solid var(--evgi-line);
  background: var(--evgi-panel); flex: 0 0 auto; }
.evgi-title { font-weight:600; margin-right:auto; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.evgi-btn { background:transparent; color:var(--evgi-ink); border:1px solid var(--evgi-line); border-radius:5px;
  padding:3px 7px; cursor:pointer; font:inherit; line-height:1.3; }
.evgi-btn:hover { background: var(--evgi-sel); }
.evgi-btn.on { background: var(--evgi-accent); border-color: var(--evgi-accent); color:#0b0e14; }
.evgi-search { flex:0 0 auto; padding:6px 9px; border-bottom:1px solid var(--evgi-line); display:flex; gap:6px; }
.evgi-search input { flex:1; background:var(--evgi-bg); color:var(--evgi-ink); border:1px solid var(--evgi-line);
  border-radius:5px; padding:4px 7px; font:inherit; }
.evgi-search input:focus { outline:none; border-color:var(--evgi-accent); }
.evgi-tree { flex: 1 1 46%; overflow:auto; padding:4px 0; min-height:80px; }
.evgi-row { display:flex; align-items:center; gap:4px; padding:1px 8px 1px 0; cursor:default; white-space:nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:11.5px; }
.evgi-row:hover { background: rgba(122,162,247,.10); }
.evgi-row.sel { background: var(--evgi-sel); }
.evgi-tw { width:13px; flex:0 0 13px; text-align:center; color:var(--evgi-dim); cursor:pointer; user-select:none; }
.evgi-tag { color:#7ee0c0; }
.evgi-id  { color:#f2b661; }
.evgi-cls { color:#b39ddb; }
.evgi-txt { color:var(--evgi-dim); font-style:italic; overflow:hidden; text-overflow:ellipsis; }
.evgi-dim { color: var(--evgi-dim); }
.evgi-tabs { display:flex; gap:2px; padding:5px 8px 0; border-top:1px solid var(--evgi-line); background:var(--evgi-panel); flex:0 0 auto; }
.evgi-tab { padding:4px 9px; border:1px solid transparent; border-bottom:none; border-radius:5px 5px 0 0;
  cursor:pointer; color:var(--evgi-dim); }
.evgi-tab.on { background:var(--evgi-bg); border-color:var(--evgi-line); color:var(--evgi-ink); }
.evgi-body { flex:1 1 54%; overflow:auto; padding:9px 10px 14px; background:var(--evgi-bg); }
.evgi-body h4 { margin:12px 0 5px; font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--evgi-dim); font-weight:600; }
.evgi-body h4:first-child { margin-top:0; }
.evgi-kv { display:grid; grid-template-columns: minmax(96px,auto) 1fr; gap:1px 10px; font-family: ui-monospace, Menlo, monospace; font-size:11.5px; }
.evgi-kv > div { padding:1px 0; overflow-wrap:anywhere; }
.evgi-kv .k { color:var(--evgi-dim); }
.evgi-kv .v.ov { color:var(--evgi-accent); }
.evgi-swatch { display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:5px;
  border:1px solid rgba(128,128,128,.5); vertical-align:baseline; }
.evgi-boxmodel { margin:2px 0 6px; text-align:center; font-family: ui-monospace, Menlo, monospace; font-size:10.5px; }
.evgi-bm { padding:14px; position:relative; }
.evgi-bm > .lbl { position:absolute; top:2px; left:5px; font-size:9px; letter-spacing:.05em; color:var(--evgi-ink); opacity:.75; }
.evgi-bm.m { background: var(--evgi-margin); }
.evgi-bm.b { background: var(--evgi-border); }
.evgi-bm.p { background: var(--evgi-padding); }
.evgi-bm.c { background: var(--evgi-content); padding:16px 10px; }
.evgi-empty { color:var(--evgi-dim); padding:14px 2px; }
.evgi-rule { border:1px solid var(--evgi-line); border-radius:6px; margin:0 0 7px; overflow:hidden; }
.evgi-rule > header { display:flex; align-items:center; gap:7px; padding:4px 8px; background:var(--evgi-panel);
  font-family: ui-monospace, Menlo, monospace; font-size:11.5px; }
.evgi-rule > header .sel { color:#b39ddb; }
.evgi-rule > header .cnt { margin-left:auto; color:var(--evgi-dim); font-size:10.5px; white-space:nowrap; }
.evgi-rule > header .media { color:#f2b661; font-size:10.5px; }
.evgi-rule .decls { padding:4px 8px 5px; display:grid; grid-template-columns:minmax(96px,auto) 1fr;
  gap:1px 10px; font-family: ui-monospace, Menlo, monospace; font-size:11.5px; }
.evgi-rule .decls .k { color:var(--evgi-dim); }
.evgi-rule .lost .k, .evgi-rule .lost .v { text-decoration: line-through; opacity:.45; }
.evgi-rule .inl .k, .evgi-rule .inl .v { text-decoration: line-through; opacity:.55; }
.evgi-chip { display:inline-flex; align-items:center; gap:5px; border:1px solid var(--evgi-line);
  border-radius:11px; padding:1px 8px; margin:0 5px 5px 0; font-family: ui-monospace, Menlo, monospace;
  font-size:11px; }
.evgi-chip b { color:#b39ddb; font-weight:500; }
.evgi-chip span { color:var(--evgi-dim); font-size:10.5px; }
.evgi-note { color:var(--evgi-dim); padding:6px 0 0; line-height:1.6; }
.evgi-css textarea { width:100%; min-height:230px; resize:vertical; background:var(--evgi-bg);
  color:var(--evgi-ink); border:1px solid var(--evgi-line); border-radius:6px; padding:7px 8px;
  font:11.5px/1.55 ui-monospace, Menlo, monospace; white-space:pre; overflow-wrap:normal; }
.evgi-css textarea:focus { outline:none; border-color:var(--evgi-accent); }
.evgi-css .bar { display:flex; align-items:center; gap:7px; padding:0 0 6px; }
.evgi-css .bar .name { font-family: ui-monospace, Menlo, monospace; font-size:11.5px; }
.evgi-css .bar .live { margin-left:auto; color:#7ee0c0; font-size:10.5px; }
.evgi-css .err { color:#f87171; font-family: ui-monospace, Menlo, monospace; font-size:11px; padding:5px 0 0; }
.evgi-cmd { font-family: ui-monospace, Menlo, monospace; font-size:11px; padding:1px 0; }
.evgi-cmd b { color:#7ee0c0; font-weight:600; }
.evgi-foot { flex:0 0 auto; padding:5px 9px; border-top:1px solid var(--evgi-line); color:var(--evgi-dim);
  background:var(--evgi-panel); display:flex; gap:8px; align-items:center; }
.evgi-foot code { background:rgba(128,128,128,.16); padding:0 4px; border-radius:3px; }

.evgi-ov { position:absolute; pointer-events:none; z-index:2147482000; }
.evgi-ov > div { position:absolute; }
.evgi-ov .m { background: var(--evgi-margin, rgba(246,178,107,.45)); }
.evgi-ov .b { background: var(--evgi-border, rgba(255,229,143,.45)); }
.evgi-ov .p { background: var(--evgi-padding, rgba(147,196,125,.40)); }
.evgi-ov .c { background: var(--evgi-content, rgba(122,162,247,.42)); }
.evgi-ov .tip { background:#12151c; color:#dfe4ee; border:1px solid #39415a; border-radius:4px;
  padding:2px 6px; font:11px/1.45 ui-monospace, Menlo, monospace; white-space:nowrap;
  box-shadow:0 3px 10px rgba(0,0,0,.4); }
.evgi-picking { cursor: crosshair !important; }
`;

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const parse = (v) => (typeof v === "string" ? JSON.parse(v) : v);
const px = (v) => (Math.round(v * 100) / 100);

// The overlay. Four absolutely positioned rings over the surface, in the four
// colours a browser uses — there is no reason to invent different ones — plus
// a label that says what is under them.
function makeOverlay() {
  const host = el("div", "evgi-ov");
  const parts = {};
  for (const k of ["m", "b", "p", "c"]) { parts[k] = el("div", k); host.appendChild(parts[k]); }
  const tip = el("div", "tip");
  host.appendChild(tip);
  host.style.display = "none";
  return {
    host,
    hide() { host.style.display = "none"; },
    // `rect` is the surface's position on the page; `scale` maps app pixels to
    // CSS pixels, which is how a zoomed slide and a 1:1 dashboard share this.
    // `t` maps box space to the surface's own logical space — identity for a
    // page whose tree IS the surface, and a fit-and-centre for a slide drawn
    // inside an editor window. `scale` then maps that to CSS pixels.
    show(node, rect, scale, t = { x: 0, y: 0, k: 1 }) {
      if (!node) { this.hide(); return; }
      const k = t.k || 1;
      const [x0, y0, w0, h0] = node.box;
      const x = t.x + x0 * k, y = t.y + y0 * k, w = w0 * k, h = h0 * k;
      const m = (node.m || [0, 0, 0, 0]).map((v) => v * k);
      const b = (typeof node.b === "number" ? node.b : 0) * k;
      const pd = (node.pd || [0, 0, 0, 0]).map((v) => v * k);
      const S = (v) => v * scale;
      const put = (n, l, t, ww, hh) => {
        n.style.left = S(l) + "px"; n.style.top = S(t) + "px";
        n.style.width = Math.max(0, S(ww)) + "px"; n.style.height = Math.max(0, S(hh)) + "px";
      };
      put(parts.m, x - m[3], y - m[0], w + m[1] + m[3], h + m[0] + m[2]);
      put(parts.b, x, y, w, h);
      put(parts.p, x + b, y + b, w - 2 * b, h - 2 * b);
      put(parts.c, x + b + pd[3], y + b + pd[0],
          w - 2 * b - pd[1] - pd[3], h - 2 * b - pd[0] - pd[2]);
      const name = (node.tag || "?") + (node.tid ? "#" + node.tid : "")
        + (node.cls ? "." + node.cls.split(/\s+/)[0] : "");
      tip.textContent = `${name}  ${px(w0)} × ${px(h0)}`;
      tip.style.left = S(x) + "px";
      const above = y * scale > 22;
      tip.style.top = (above ? S(y) - 22 : S(y + h) + 4) + "px";
      host.style.display = "";
      host.style.left = "0px"; host.style.top = "0px";
      host.style.width = rect.width + "px"; host.style.height = rect.height + "px";
    },
  };
}

export function attach(opts = {}) {
  const app = opts.app || {};
  if (typeof app.tree !== "function") throw new Error("evg-inspect: app.tree() is required");
  const surface = opts.surface || document.querySelector("canvas") || document.querySelector("svg");
  if (!surface) throw new Error("evg-inspect: no surface to overlay");

  if (!document.getElementById("evgi-css")) {
    const st = el("style"); st.id = "evgi-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // --- state ---------------------------------------------------------------
  let tree = null;              // the last fetched tree
  let byId = new Map();
  let kids = new Map();
  let selected = null;          // node id
  let detail = null;            // node detail json
  let frame = null;             // display list, when the app offers one
  let expanded = new Set(["0"]);
  let picking = false;
  let tab = "box";
  let filter = "";

  // --- panel ---------------------------------------------------------------
  const panel = el("div", "evgi");
  if (opts.theme === "light") panel.classList.add("evgi-light");

  const head = el("div", "evgi-head");
  const title = el("div", "evgi-title", app.label || "EVG inspector");
  const pick = el("button", "evgi-btn", "⌖ pick");
  pick.title = "Click an element in the picture (Esc to stop)";
  const reload = el("button", "evgi-btn", "↻");
  reload.title = "Re-read the tree";
  const close = el("button", "evgi-btn", "✕");
  head.append(title, pick, reload, close);

  const searchBar = el("div", "evgi-search");
  const search = el("input");
  search.placeholder = "filter by tag, #id, .class or text";
  searchBar.append(search);

  const treeView = el("div", "evgi-tree");
  const tabs = el("div", "evgi-tabs");
  const body = el("div", "evgi-body");
  const foot = el("div", "evgi-foot");

  const TABS = [["box", "Box"], ["styles", "Styles"], ["css", "CSS"], ["cmds", "Commands"], ["raw", "Node"]];
  const tabEls = {};
  for (const [key, label] of TABS) {
    const t = el("div", "evgi-tab", label);
    t.onclick = () => { tab = key; renderTabs(); renderBody(); };
    tabEls[key] = t;
    tabs.appendChild(t);
  }
  panel.append(head, searchBar, treeView, tabs, body, foot);
  document.body.appendChild(panel);

  // The overlay goes inside the surface's offset parent so it scrolls with the
  // picture rather than floating over the page.
  const holder = surface.parentElement || document.body;
  const holderPos = getComputedStyle(holder).position;
  if (holderPos === "static") holder.style.position = "relative";
  const overlay = makeOverlay();
  holder.appendChild(overlay.host);

  // --- reading the app -----------------------------------------------------

  function surfaceRect() { return surface.getBoundingClientRect(); }

  // The surface's own logical width. A page whose tree fills the surface has
  // nothing to say here and gets the tree's width; an editor that draws a
  // slide inside a window says how big the window is, because the tree is the
  // slide and the surface is not.
  function viewport() {
    if (typeof app.viewport === "function") {
      try { const v = app.viewport(); if (v && v[0]) return v; } catch { /* below */ }
    }
    return tree ? [tree.w, tree.h] : [1, 1];
  }
  function scale() {
    const r = surfaceRect();
    return r.width / viewport()[0] || 1;
  }
  function transform() {
    if (typeof app.transform === "function") {
      try {
        const t = parse(app.transform());
        if (t && typeof t.k === "number") return { x: t.x || 0, y: t.y || 0, k: t.k || 1 };
      } catch { /* below */ }
    }
    return { x: 0, y: 0, k: 1 };
  }

  function refreshTree(keepSelection = true) {
    try {
      tree = parse(app.tree());
    } catch (e) {
      tree = null;
      foot.textContent = "tree() failed: " + e.message;
      return;
    }
    byId = new Map();
    kids = new Map();
    for (const n of tree.nodes) {
      byId.set(n.id, n);
      if (n.p != null) {
        if (!kids.has(n.p)) kids.set(n.p, []);
        kids.get(n.p).push(n.id);
      }
    }
    if (!keepSelection || (selected && !byId.has(selected))) {
      // A path that stopped resolving is a dropped selection, said out loud.
      // Re-pointing it at whatever now sits at that index would be a lie.
      if (selected) foot.dataset.note = "selection dropped: " + selected;
      selected = null; detail = null;
    }
    frame = null;
    if (typeof app.frame === "function") {
      try { frame = parse(app.frame()); } catch { frame = null; }
    }
    renderTree(); renderBody(); renderFoot();
  }

  function loadDetail(id) {
    detail = null;
    if (typeof app.node === "function") {
      try { detail = parse(app.node(id)); } catch (e) { detail = { error: e.message }; }
    }
  }

  // A hit test the app did not provide. Reverse document order over the boxes
  // the tree already carries, deepest-last — an approximation of the paint
  // order, and said to be one: an app that offers `hit` gets the real thing.
  function fallbackHit(x, y) {
    if (!tree) return "";
    for (let i = tree.nodes.length - 1; i >= 0; i--) {
      const n = tree.nodes[i];
      const [bx, by, bw, bh] = n.box;
      if (x >= bx && y >= by && x <= bx + bw && y <= by + bh) return n.id;
    }
    return "";
  }
  function hitAt(x, y) {
    if (typeof app.hit === "function") {
      try { return app.hit(x, y) || ""; } catch { /* fall through */ }
    }
    return fallbackHit(x, y);
  }

  // --- selection -----------------------------------------------------------

  function select(id, { reveal = true, quiet = false } = {}) {
    if (!byId.has(id)) return;
    selected = id;
    loadDetail(id);
    if (reveal) {
      let p = byId.get(id).p;
      while (p != null) { expanded.add(p); p = byId.get(p) ? byId.get(p).p : null; }
    }
    renderTree(); renderBody(); renderFoot();
    // `quiet` is the opening selection: the panes are worth filling, four
    // coloured rings around the entire page are not.
    if (quiet) overlay.hide(); else highlight(id);
    const row = treeView.querySelector(`[data-id="${cssEscape(id)}"]`);
    if (row && reveal) row.scrollIntoView({ block: "nearest" });
  }
  const cssEscape = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&"));

  function highlight(id) {
    const n = id ? byId.get(id) : null;
    if (!n) { overlay.hide(); return; }
    overlay.show(n, surfaceRect(), scale(), transform());
  }

  // --- the tree view -------------------------------------------------------

  function matches(n) {
    if (!filter) return true;
    const f = filter.toLowerCase();
    if (f[0] === "#") return (n.tid || "").toLowerCase().includes(f.slice(1));
    if (f[0] === ".") return (n.cls || "").toLowerCase().includes(f.slice(1));
    return ((n.tag || "") + " " + (n.tid || "") + " " + (n.cls || "") + " " + (n.text || ""))
      .toLowerCase().includes(f);
  }

  function renderTree() {
    treeView.textContent = "";
    if (!tree) return;
    // With a filter on, the tree is flattened to the matches: a hierarchy with
    // most of it hidden reads as a broken tree, not as a search result.
    if (filter) {
      const hits = tree.nodes.filter(matches).slice(0, 400);
      for (const n of hits) treeView.appendChild(rowFor(n, 0));
      if (!hits.length) treeView.appendChild(el("div", "evgi-empty", "nothing matches"));
      return;
    }
    const walk = (id, depth) => {
      const n = byId.get(id);
      if (!n) return;
      treeView.appendChild(rowFor(n, depth));
      if (!expanded.has(id)) return;
      for (const k of kids.get(id) || []) walk(k, depth + 1);
    };
    walk(tree.root, 0);
  }

  function rowFor(n, depth) {
    const row = el("div", "evgi-row" + (n.id === selected ? " sel" : ""));
    row.dataset.id = n.id;
    row.style.paddingLeft = 4 + depth * 11 + "px";
    const kidCount = (kids.get(n.id) || []).length;
    const tw = el("span", "evgi-tw", kidCount ? (expanded.has(n.id) ? "▾" : "▸") : "");
    if (kidCount) {
      tw.onclick = (e) => {
        e.stopPropagation();
        if (expanded.has(n.id)) expanded.delete(n.id); else expanded.add(n.id);
        renderTree();
      };
    }
    row.appendChild(tw);
    row.appendChild(el("span", "evgi-tag", n.tag || "?"));
    if (n.tid) row.appendChild(el("span", "evgi-id", "#" + n.tid));
    if (n.cls) row.appendChild(el("span", "evgi-cls", "." + n.cls.split(/\s+/).join(".")));
    if (n.text) row.appendChild(el("span", "evgi-txt", " " + n.text));
    if (!n.text && kidCount) row.appendChild(el("span", "evgi-dim", ` ${kidCount}`));
    row.onclick = () => select(n.id, { reveal: false });
    row.onmouseenter = () => highlight(n.id);
    row.onmouseleave = () => highlight(selected);
    return row;
  }

  // --- the detail panes ----------------------------------------------------

  function renderTabs() {
    for (const [key] of TABS) tabEls[key].classList.toggle("on", key === tab);
  }

  function kv(rows) {
    const grid = el("div", "evgi-kv");
    for (const [k, v, cls] of rows) {
      grid.appendChild(el("div", "k", k));
      const d = el("div", "v" + (cls ? " " + cls : ""));
      if (/^(#|rgb|hsl)/.test(String(v))) {
        const sw = el("span", "evgi-swatch");
        sw.style.background = v;
        d.append(sw, document.createTextNode(String(v)));
      } else d.textContent = String(v);
      grid.appendChild(d);
    }
    return grid;
  }

  function renderBody() {
    renderTabs();
    body.textContent = "";
    const n = selected ? byId.get(selected) : null;
    if (!n) {
      body.appendChild(el("div", "evgi-empty",
        tree ? "Pick an element in the picture, or choose one from the tree." : "No tree."));
      return;
    }
    if (tab === "box") renderBox(n);
    else if (tab === "styles") renderStyles(n);
    else if (tab === "css") renderCss();
    else if (tab === "cmds") renderCmds(n);
    else renderRaw(n);
  }

  function renderBox(n) {
    const [x, y, w, h] = n.box;
    const m = n.m || [0, 0, 0, 0], b = n.b || 0, pd = n.pd || [0, 0, 0, 0];
    const wrap = el("div", "evgi-boxmodel");
    const mb = el("div", "evgi-bm m"); mb.appendChild(el("span", "lbl", "margin"));
    const bb = el("div", "evgi-bm b"); bb.appendChild(el("span", "lbl", "border"));
    const pb = el("div", "evgi-bm p"); pb.appendChild(el("span", "lbl", "padding"));
    const cb = el("div", "evgi-bm c");
    const content = detail && detail.content ? detail.content : [x + b + pd[3], y + b + pd[0],
      w - 2 * b - pd[1] - pd[3], h - 2 * b - pd[0] - pd[2]];
    cb.textContent = `${px(content[2])} × ${px(content[3])}`;
    mb.append(top(m[0]), bb); bb.append(top(b), pb); pb.append(top(pd[0]), cb);
    // The four sides are shown as the browser shows them: the number on each
    // edge of its own ring.
    function top(v) { const d = el("div", "", String(px(v))); d.style.fontSize = "10px"; d.style.opacity = ".8"; return d; }
    wrap.appendChild(mb);
    body.append(el("h4", null, "box model"), wrap);
    body.append(el("h4", null, "geometry"), kv([
      ["position", `${px(x)}, ${px(y)}`],
      ["border box", `${px(w)} × ${px(h)}`],
      ["content box", `${px(content[2])} × ${px(content[3])}`],
      ["margin", m.map(px).join("  ")],
      ["border", String(px(b))],
      ["padding", pd.map(px).join("  ")],
    ]));
    const idRows = [["path", n.id], ["tag", n.tag || ""]];
    if (n.tid) idRows.push(["id", n.tid]);
    if (n.cls) idRows.push(["class", n.cls]);
    if (n.role) idRows.push(["role", n.role]);
    if (n.flags) idRows.push(["flags", n.flags.join(" ")]);
    idRows.push(["children", String(n.kids ?? 0)]);
    if (detail && detail.styleSlot != null && detail.styleSlot >= 0) {
      idRows.push(["style plan", "#" + detail.styleSlot]);
    }
    body.append(el("h4", null, "identity"), kv(idRows));
    if (n.text) body.append(el("h4", null, "text"), kv([["content", detail?.textFull || n.text]]));
  }

  function renderStyles(n) {
    if (!detail) {
      body.appendChild(el("div", "evgi-empty",
        "This host does not expose node() — only the tree is available."));
      return;
    }
    if (detail.error) { body.appendChild(el("div", "evgi-empty", detail.error)); return; }
    const inline = new Set(detail.inline || []);

    // --- which classes reach this element ------------------------------------
    //
    // This cascade selects on classes and nothing else, so the set of rules
    // that can ever touch a node is exactly the set written against one of its
    // classes. That makes the list short, exact, and worth showing first: it
    // is the answer to "where do I go to change this".
    const classes = detail.classes || [];
    if (classes.length) {
      body.append(el("h4", null, "classes on this element"));
      const wrap = el("div");
      for (const c of classes) {
        const chip = el("span", "evgi-chip");
        chip.append(el("b", null, "." + c.name), el("span", null, `${c.matches} element${c.matches === 1 ? "" : "s"}`));
        chip.title = `.${c.name} matches ${c.matches} element${c.matches === 1 ? "" : "s"} in this tree`;
        chip.onclick = () => { filter = "." + c.name; search.value = filter; renderTree(); };
        wrap.appendChild(chip);
      }
      body.appendChild(wrap);
      const many = classes.filter((c) => c.matches > 1);
      if (many.length) {
        body.appendChild(el("div", "evgi-note",
          "Editing one of these changes every element that carries it — there is no "
          + "way to reach one instance without giving it a class of its own."));
      }
    } else if (n.cls === undefined) {
      body.append(el("h4", null, "classes on this element"));
      body.appendChild(el("div", "evgi-note",
        "None. The cascade skips an element with no class, so no stylesheet rule "
        + "can reach this one at all — whatever it looks like was set on it directly."));
    }

    // --- the rules, grouped, winners and losers ------------------------------
    const cascade = detail.cascade || [];
    if (cascade.length) {
      body.append(el("h4", null, "rules, strongest last"));
      // Group consecutive declarations that came from the same selector: the
      // plan is flat, but a person reads rules.
      const groups = [];
      for (const d of cascade) {
        const last = groups[groups.length - 1];
        if (last && last.sel === d.sel && last.media === d.media) last.decls.push(d);
        else groups.push({ sel: d.sel, media: d.media, cls: d.cls, decls: [d] });
      }
      const matchOf = new Map(classes.map((c) => [c.name, c.matches]));
      for (const g of groups) {
        const box = el("div", "evgi-rule");
        const head = el("header");
        head.appendChild(el("span", "sel", g.sel));
        if (g.media) head.appendChild(el("span", "media", "@media " + g.media));
        const m = matchOf.get(g.cls);
        if (m !== undefined) head.appendChild(el("span", "cnt", `${m} element${m === 1 ? "" : "s"}`));
        box.appendChild(head);
        const decls = el("div", "decls");
        for (const d of g.decls) {
          const cls = d.beatenByInline ? "inl" : (d.win ? "" : "lost");
          const k = el("div", "k" + (cls ? " " + cls : ""), d.p);
          const v = el("div", "v" + (cls ? " " + cls : ""));
          if (/^(#|rgb|hsl)/.test(String(d.v))) {
            const sw = el("span", "evgi-swatch");
            sw.style.background = d.v;
            v.append(sw, document.createTextNode(d.v));
          } else v.textContent = d.v;
          if (d.beatenByInline) v.title = "the app sets this on the element; no rule can win";
          else if (!d.win) v.title = "overridden by a later rule";
          decls.append(k, v);
        }
        box.appendChild(decls);
        body.appendChild(box);
      }
      if (cascade.some((d) => d.beatenByInline)) {
        body.appendChild(el("div", "evgi-note",
          "A struck line marked as inline is not lost to another rule — the app "
          + "writes that property onto the element itself, and an inline value "
          + "outranks every rule. Editing the sheet cannot change it."));
      }
    } else {
      body.append(el("h4", null, "rules"));
      body.appendChild(el("div", "evgi-note",
        detail.classes
          ? "No rule in the sheet writes to this element."
          : "This host did not hand the inspector its stylesheet, so what SET each "
          + "value cannot be shown — only what the value is."));
    }

    // --- and the values that came out ----------------------------------------
    const rows = Object.entries(detail.computed || {})
      .map(([k, v]) => [k, v, inline.has(k) ? "ov" : ""]);
    body.append(el("h4", null, `computed  ·  ${rows.length} properties`), kv(rows));
    if (inline.size) {
      body.append(el("h4", null, "set on the element, not by a rule"),
        el("div", "evgi-cmd", [...inline].join(", ")));
      body.appendChild(el("div", "evgi-note",
        "Highlighted above. This is the cascade's own record of what the authoring "
        + "layer set directly — it is what the cascade consults to know what it must "
        + "not overwrite, so it is read here rather than guessed."));
    }
  }

  // --- the stylesheet, as the input it is ------------------------------------
  //
  // The element tree is the app's output; the sheet is its input. So this pane
  // edits a real input and hands it back, and the app re-parses and
  // re-cascades exactly as it did at startup. Nothing is intercepted, no value
  // is held over the app's head, and the text in this box is the text that
  // goes in the file — there is no "copy as CSS" step because there is nothing
  // to translate.
  let cssDraft = null;
  function renderCss() {
    if (typeof app.css !== "function") {
      body.appendChild(el("div", "evgi-empty",
        "This host does not expose its stylesheet. A host that hands the panel "
        + "css() gets a live editor here; the tree stays readable either way."));
      return;
    }
    let src;
    try { src = app.css(); } catch (e) { body.appendChild(el("div", "evgi-empty", String(e.message))); return; }
    const wrap = el("div", "evgi-css");
    const bar = el("div", "bar");
    bar.appendChild(el("span", "name", src.name || "stylesheet"));
    const apply = el("button", "evgi-btn", "apply");
    const revert = el("button", "evgi-btn", "revert");
    bar.append(apply, revert);
    if (src.href) bar.appendChild(el("span", "live", "live from disk"));
    wrap.appendChild(bar);

    const area = el("textarea");
    area.spellcheck = false;
    area.value = cssDraft != null ? cssDraft : (src.text || "");
    area.oninput = () => { cssDraft = area.value; };
    // Tab indents rather than leaving the box: this is an editor, and losing
    // your place to focus the next button is not what the key is for here.
    area.onkeydown = (ev) => {
      if (ev.key === "Tab") {
        ev.preventDefault();
        const a0 = area.selectionStart, b0 = area.selectionEnd;
        area.value = area.value.slice(0, a0) + "  " + area.value.slice(b0);
        area.selectionStart = area.selectionEnd = a0 + 2;
        cssDraft = area.value;
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") { ev.preventDefault(); apply.onclick(); }
    };
    wrap.appendChild(area);

    const errs = el("div", "err");
    const showErrors = (list) => {
      errs.textContent = "";
      for (const e of list || []) errs.appendChild(el("div", null, e));
    };
    showErrors(src.errors);
    wrap.appendChild(errs);
    wrap.appendChild(el("div", "evgi-note",
      "Applying re-parses the sheet and re-cascades the tree — the same path the "
      + "app took at startup. Saving the file on disk does the same thing by the "
      + "other route, and the two cannot drift."));

    apply.onclick = () => {
      if (typeof app.setCss !== "function") return;
      try {
        app.setCss(area.value);
        refreshTree();
        tab = "css";
        renderTabs();
        renderBody();
      } catch (e) { showErrors([String(e.message)]); }
    };
    revert.onclick = () => { cssDraft = null; renderBody(); };
    body.appendChild(wrap);
  }

  // Which commands this element emitted. Present only when the host built the
  // list with attribution on; without it the answer would be a guess made from
  // rectangles, and a guess is worse than a blank pane.
  function renderCmds(n) {
    if (!frame) {
      body.appendChild(el("div", "evgi-empty",
        "This host does not expose frame() — no display list to attribute."));
      return;
    }
    const list = frame.list ? frame.list.cmds : frame.cmds;
    if (!list) { body.appendChild(el("div", "evgi-empty", "no commands in the frame")); return; }
    if (list.length && list[0].n === undefined) {
      body.appendChild(el("div", "evgi-empty",
        "The frame carries no attribution. Set `attribute` on the display list "
        + "before building it, and the commands each element emitted show up here."));
      return;
    }
    const KIND = ["RECT", "BORDER", "IMAGE", "TEXT", "PUSH_CLIP", "POP_CLIP", "PATH", "STROKE"];
    const mine = [];
    list.forEach((c, i) => { if (c.n === n.slot) mine.push([i, c]); });
    body.append(el("h4", null, `${mine.length} of ${list.length} commands`));
    if (!mine.length) {
      body.appendChild(el("div", "evgi-empty",
        "This element drew nothing. A layout box with no background is normal."));
      return;
    }
    for (const [i, c] of mine.slice(0, 200)) {
      const row = el("div", "evgi-cmd");
      row.append(el("span", "evgi-dim", String(i).padStart(4, " ") + "  "));
      row.appendChild(el("b", null, KIND[c.k] || String(c.k)));
      const bits = [` ${px(c.x)},${px(c.y)}`];
      if (c.w || c.h) bits.push(`${px(c.w)}×${px(c.h)}`);
      if (c.r) bits.push(`r${px(c.r)}`);
      if (c.text != null) bits.push(JSON.stringify(c.text));
      if (c.font) bits.push(c.font + " " + px(c.size || 0));
      row.append(document.createTextNode("  " + bits.join("  ")));
      if (c.c) {
        const sw = el("span", "evgi-swatch");
        sw.style.background = `rgba(${c.c[0]},${c.c[1]},${c.c[2]},${c.c[3]})`;
        row.append(document.createTextNode(" "), sw);
      }
      body.appendChild(row);
    }
  }

  function renderRaw(n) {
    const pre = el("pre");
    pre.style.cssText = "white-space:pre-wrap;font:11px ui-monospace,Menlo,monospace;margin:0";
    pre.textContent = JSON.stringify({ node: n, detail }, null, 1);
    body.appendChild(pre);
  }

  function renderFoot() {
    foot.textContent = "";
    if (!tree) { foot.append("no tree"); return; }
    foot.append(`${tree.nodes.length} nodes`);
    if (frame) {
      const list = frame.list ? frame.list.cmds : frame.cmds;
      if (list) foot.append(` · ${list.length} commands`);
    }
    foot.append(` · ${px(tree.w)}×${px(tree.h)}`);
    if (foot.dataset.note) {
      const n = el("span", "", " · " + foot.dataset.note);
      n.style.color = "#f2b661";
      foot.append(n);
    }
  }

  // --- picking -------------------------------------------------------------

  // A pointer lands in CSS pixels; the app answers in the coordinates its own
  // tree is in. Both conversions happen here so an adapter never has to know
  // where on the page its picture ended up.
  function surfacePoint(ev) {
    const r = surfaceRect();
    const s = scale() || 1;
    const t = transform();
    const sx = (ev.clientX - r.left) / s;
    const sy = (ev.clientY - r.top) / s;
    return [(sx - t.x) / (t.k || 1), (sy - t.y) / (t.k || 1)];
  }
  function setPicking(on) {
    picking = on;
    pick.classList.toggle("on", on);
    document.body.classList.toggle("evgi-picking", on);
    if (!on) highlight(selected);
  }
  surface.addEventListener("mousemove", (ev) => {
    if (!picking) return;
    const [x, y] = surfacePoint(ev);
    const id = hitAt(x, y);
    if (id && byId.has(id)) highlight(id);
  });
  surface.addEventListener("click", (ev) => {
    if (!picking) return;
    ev.preventDefault(); ev.stopPropagation();
    const [x, y] = surfacePoint(ev);
    const id = hitAt(x, y);
    if (id && byId.has(id)) { select(id); setPicking(false); }
  }, true);
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && picking) { setPicking(false); ev.preventDefault(); }
  });

  pick.onclick = () => setPicking(!picking);
  reload.onclick = () => refreshTree();
  close.onclick = () => api.detach();
  search.oninput = () => { filter = search.value.trim(); renderTree(); };

  window.addEventListener("resize", () => highlight(selected));

  refreshTree(false);
  // Open on the root rather than on an empty pane. There is always something
  // to say about the page as a whole, and a panel whose right half is a
  // sentence asking you to click something is a panel that has not started.
  if (tree && tree.nodes.length) select(tree.root, { quiet: true });
  renderTabs();

  const api = {
    // A host that repaints tells the panel so; nothing here polls.
    refresh: () => refreshTree(true),
    select,
    get selection() { return selected; },
    detach() {
      setPicking(false);
      overlay.host.remove();
      panel.remove();
    },
  };
  return api;
}

// One line in a host: `?inspect=1` turns it on and nothing else changes.
export function attachIfRequested(opts = {}) {
  const q = new URLSearchParams(location.search);
  const want = q.get("inspect");
  if (want === null || want === "0" || want === "false") return null;
  return attach(opts);
}
