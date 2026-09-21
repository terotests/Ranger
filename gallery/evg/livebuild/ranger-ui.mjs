/**
 * Ranger UI document, version 2.
 *
 * One JSON file — `name.ranger.json` — that is the whole screen: a semantic
 * component tree, a CSS string, and the machine. Concrete EVG is a snapshot
 * under `compiled`, not the source.
 *
 *   visual appearance  →  css
 *   component meaning  →  props
 *   runtime identity   →  id
 *   document identity  →  uid
 *   behaviour          →  machine
 */
export const FORMAT = "ranger-ui";
export const VERSION = 2;

const LIBRARY = { library: "@rave/core", version: "2" };
const SETTINGS_LIB = { library: "@rave/settings", version: "1" };

/** Kit roots. Children under these are the control's drawing, not the spec. */
const COMPONENT_ROOTS = [
  { test: /^ui-switch(?:\s|$)/, type: "rave.Switch", library: LIBRARY, leaf: true },
  { test: /^ui-checkbox(?:\s|$)/, type: "rave.Checkbox", library: LIBRARY, leaf: true },
  { test: /^ui-btn(?:\s|$)|^ui-button(?:\s|$)/, type: "rave.Button", library: LIBRARY, leaf: true },
  { test: /^ui-slider(?:\s|$)/, type: "rave.Slider", library: LIBRARY, leaf: true },
  { test: /^ui-input(?:\s|$)|^ui-field(?:\s|$)/, type: "rave.Input", library: LIBRARY, leaf: true },
  { test: /(?:^|\s)(?:ui-chip|chip)(?:\s|$)/, type: "rave.Chip", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-pills(?:\s|$)/, type: "rave.Pills", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-pill(?:\s|$)/, type: "rave.Chip", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)(?:ui-appbar|appbar)(?:\s|$)/, type: "rave.AppBar", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)(?:ui-card|card)(?:\s|$)/, type: "rave.Card", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-tiles(?:\s|$)/, type: "rave.Tiles", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-tile(?:\s|$)/, type: "rave.Tile", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-bars(?:\s|$)/, type: "rave.Bars", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-banner(?:\s|$)/, type: "rave.Banner", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-tabbar(?:\s|$)/, type: "rave.TabBar", library: LIBRARY, leaf: false },
  { test: /(?:^|\s)ui-tab-item(?:\s|$)/, type: "rave.Tab", library: LIBRARY, leaf: true },
  { test: /(?:^|\s)(?:ui-row|row)(?:\s|$)/, type: "SettingsRow", library: SETTINGS_LIB, leaf: false },
];

const ROLE_TYPES = {
  switch: "rave.Switch",
  checkbox: "rave.Checkbox",
  slider: "rave.Slider",
  textbox: "rave.Input",
};

const KIT_CLASS_RE =
  /^(ui-switch|ui-checkbox|ui-btn|ui-button|ui-slider|ui-input|ui-field|ui-chip|ui-appbar|ui-card|ui-row|ui-pill|ui-tile|ui-bar|ui-banner|ui-tabbar|ui-tab-|ui-radio|ui-tabs|ui-avatar|ui-sep|ui-toast|ui-dialog|ui-tooltip|ui-progress|ui-select|ui-combobox|ui-breadcrumb|ui-accordion|ui-collapsible|ui-toggle|ui-popover|ui-table|ui-grid|ui-menu|ui-dropdown)/;

const PART_CLASS_RE =
  /^(ui-switch-|ui-checkbox-|ui-row-(?:title|sub|text|icon|value|chevron|line)|ui-card-title|ui-appbar-|ui-chip-(?:dot|label)|ui-tile-(?:icon|label|value|sub)|ui-bars-(?:title|badge|value|head|row)|ui-bar(?:-col|-label)?$|ui-banner-(?:icon|eyebrow|title|sub)|ui-tab-(?:icon|label))/;

const VISUAL = new Set([
  "background-color",
  "background-gradient",
  "color",
  "opacity",
  "font-size",
  "font-weight",
  "font-family",
  "letter-spacing",
  "line-height",
  "text-align",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "border",
  "border-width",
  "border-color",
  "border-style",
  "border-radius",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "gap",
  "row-gap",
  "column-gap",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "display",
  "flex-direction",
  "flex-wrap",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "justify-content",
  "align-items",
  "align-self",
  "align-content",
  "position",
  "left",
  "right",
  "top",
  "bottom",
  "overflow",
  "overflow-x",
  "overflow-y",
  "grid-template-columns",
  "grid-template-rows",
  "grid-area",
  "grid-auto-flow",
  "box-shadow",
  "evg-surface-effect",
  "evg-effect-on",
  "evg-fx-density",
  "evg-fx-nebula",
  "evg-fx-hue",
  "evg-fx-hue2",
  "evg-fx-shine",
  "evg-fx-sweep",
]);

const HANDOFF =
  "Ranger UI document (format ranger-ui, version 2). ui + css + machine are the source; compiled.evg is a snapshot. Known types (rave.Switch, rave.Card, SettingsRow, …) come from the components manifest — do not redraw them from boxes. Paste this JSON into a Ranger + EVG session, or write a Rave app that matches ui and css.";

function classList(node) {
  const raw = (node && node.props && (node.props["class-name"] || node.props.class)) || "";
  return String(raw)
    .split(/\s+/)
    .filter(Boolean);
}

function primaryClass(node) {
  return classList(node).find((c) => !c.includes("{") && !/-state-/.test(c)) || classList(node)[0] || "";
}

function authorClasses(node) {
  return classList(node).filter((c) => !KIT_CLASS_RE.test(c) && !/-state-/.test(c) && !c.includes("{"));
}

function matchComponent(node) {
  const cls = classList(node).join(" ");
  for (const spec of COMPONENT_ROOTS) {
    if (spec.test.test(cls)) return spec;
  }
  const role = node && node.role;
  if (role && ROLE_TYPES[role]) {
    return { type: ROLE_TYPES[role], library: LIBRARY, leaf: true, test: null };
  }
  return null;
}

function isScreenChild(path, ctx) {
  const root = (ctx && ctx.rootPath) || "0";
  const prefix = `${root}/`;
  if (!String(path || "").startsWith(prefix)) return false;
  return !String(path).slice(prefix.length).includes("/");
}

function looksLikeTabbar(node) {
  const cls = classList(node).join(" ");
  if (/\bui-tabbar\b/.test(cls)) return true;
  const props = (node && node.props) || {};
  const pinned = props.position === "absolute" || props.bottom != null || /\btab/.test(cls);
  if (!pinned) return false;
  const kids = (node && node.children) || [];
  if (kids.length < 3 || kids.length > 6) return false;
  const labels = kids.map((c) => textOf(c).trim()).filter(Boolean);
  if (labels.length !== kids.length) return false;
  return labels.every((t) => t.length <= 16);
}

function childIsDiv(node) {
  return ((node && node.children) || []).some((c) => c && (c.tag === "div" || (c.children && c.children.length)));
}

/**
 * A titled panel under the screen with nested boxes, but no kit class —
 * the tree Gemini draws by hand. Export still names it rave.Card.
 */
function inferSpec(node, path, ctx) {
  const hit = matchComponent(node);
  if (hit) return hit;
  if (!node || path === ((ctx && ctx.rootPath) || "0")) return null;
  if (ctx && ctx.parentType === "rave.TabBar") {
    return { type: "rave.Tab", library: LIBRARY, leaf: true, test: null, inferred: true };
  }
  if (!isScreenChild(path, ctx)) return null;
  if (looksLikeTabbar(node)) return { type: "rave.TabBar", library: LIBRARY, leaf: false, test: null, inferred: true };
  if (childIsDiv(node) && (node.children || []).length >= 2 && textOf(node)) {
    return { type: "rave.Card", library: LIBRARY, leaf: false, test: null, inferred: true };
  }
  return null;
}

function isPartNode(node) {
  return classList(node).some((c) => PART_CLASS_RE.test(c));
}

function bindFromClass(cls) {
  const joined = Array.isArray(cls) ? cls.join(" ") : String(cls || "");
  const hole = joined.match(/-state-\{([^}]+)\}/);
  if (hole) return `{${hole[1]}}`;
  if (/-state-checked\b/.test(joined) || /\bstate-checked\b/.test(joined)) return true;
  if (/-state-unchecked\b/.test(joined)) return false;
  if (/-state-indeterminate\b/.test(joined)) return "indeterminate";
  return undefined;
}

function textOf(node) {
  if (!node) return "";
  if (node.text) return String(node.text);
  for (const c of node.children || []) {
    const t = textOf(c);
    if (t) return t;
  }
  return "";
}

function findByClass(node, re) {
  if (!node) return null;
  if (classList(node).some((c) => re.test(c))) return node;
  for (const c of node.children || []) {
    const hit = findByClass(c, re);
    if (hit) return hit;
  }
  return null;
}

function uidOf(node, path) {
  if (node && node.uid) return String(node.uid);
  if (node && node.key) return `rui_k_${String(node.key).replace(/[^A-Za-z0-9_]+/g, "_")}`;
  if (node && node.id) return `rui_${String(node.id).replace(/[^A-Za-z0-9]+/g, "_")}`;
  return `rui_${String(path || "0").replace(/\//g, "_")}`;
}

function visualProps(node) {
  const props = (node && node.props) || {};
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (VISUAL.has(k) && v != null && String(v) !== "") out[k] = String(v);
  }
  return out;
}

function styleKey(vis) {
  return Object.keys(vis)
    .sort()
    .map((k) => `${k}:${vis[k]}`)
    .join(";");
}

function parseRules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(String(css || "")))) {
    out.push({ selector: m[1].trim(), body: m[2], text: `${m[1].trim()} {${m[2]}}` });
  }
  return out;
}

function selectorIsKitOnly(selector) {
  const names = [...String(selector).matchAll(/\.([A-Za-z0-9_{}-]+)/g)].map((x) => x[1]);
  if (!names.length) return false;
  return names.every((n) => KIT_CLASS_RE.test(n) || n.startsWith("theme-"));
}

/** Drop library-default kit rules. Author classes and mixed selectors stay. */
export function authoredCss(css) {
  return parseRules(css)
    .filter((r) => !selectorIsKitOnly(r.selector))
    .map((r) => r.text)
    .join("\n");
}

function declsOf(vis) {
  return Object.keys(vis)
    .sort()
    .map((k) => `  ${k}: ${vis[k]};`)
    .join("\n");
}

function mergeRule(map, selector, vis) {
  const have = map.get(selector) || {};
  map.set(selector, { ...have, ...vis });
}

function switchProps(node) {
  const props = {};
  const checked = bindFromClass(classList(node));
  if (checked !== undefined) props.checked = checked;
  const label = findByClass(node, /^ui-switch-label$|^ui-checkbox-label$/);
  if (label && label.text) props.name = String(label.text);
  if (node.props && node.props.disabled) props.disabled = true;
  return props;
}

function rowProps(node) {
  const props = {};
  const title = findByClass(node, /^ui-row-title$/) || findByClass(node, /^row-title$/);
  const sub = findByClass(node, /^ui-row-sub$/) || findByClass(node, /^row-sub$/);
  const icon = findByClass(node, /^ui-row-icon$/) || findByClass(node, /^row-icon$/);
  const value = findByClass(node, /^ui-row-value$/) || findByClass(node, /^row-value$/);
  if (title && title.text) props.label = String(title.text);
  if (sub && sub.text) props.sub = String(sub.text);
  if (icon && icon.text) props.icon = String(icon.text);
  if (value && value.text) props.value = String(value.text);
  if (!props.label) {
    const spans = (node.children || []).filter((c) => c && (c.text || c.tag === "span"));
    if (spans.length >= 1 && textOf(spans[0])) props.label = textOf(spans[0]);
    if (spans.length >= 2 && textOf(spans[1]) && !props.value) props.value = textOf(spans[1]);
  }
  return props;
}

function firstHeading(node) {
  const title =
    findByClass(node, /^ui-card-title$/) ||
    findByClass(node, /^(row-title|section-h|nav-title)$/);
  if (title && title.text) return String(title.text);
  for (const c of (node && node.children) || []) {
    if (c && c.text && String(c.text).trim()) return String(c.text).trim();
    if (c && c.tag === "span") {
      const t = textOf(c);
      if (t) return t;
    }
  }
  return "";
}

function cardProps(node) {
  const props = {};
  const heading = firstHeading(node);
  if (heading) props.title = heading;
  return props;
}

function namedText(node, re) {
  const hit = findByClass(node, re);
  return hit && hit.text ? String(hit.text) : "";
}

function tileProps(node) {
  const props = {};
  const label = namedText(node, /^ui-tile-label$/);
  const value = namedText(node, /^ui-tile-value$/);
  const sub = namedText(node, /^ui-tile-sub$/);
  const icon = namedText(node, /^ui-tile-icon$/);
  if (label) props.label = label;
  if (value) props.value = value;
  if (sub) props.sub = sub;
  if (icon) props.icon = icon;
  return props;
}

function bannerProps(node) {
  const props = {};
  const eyebrow = namedText(node, /^ui-banner-eyebrow$/);
  const title = namedText(node, /^ui-banner-title$/);
  const sub = namedText(node, /^ui-banner-sub$/);
  const icon = namedText(node, /^ui-banner-icon$/);
  if (eyebrow) props.eyebrow = eyebrow;
  if (title) props.title = title;
  if (sub) props.sub = sub;
  if (icon) props.icon = icon;
  return props;
}

function barsProps(node) {
  const props = {};
  const title = namedText(node, /^ui-bars-title$/);
  const value = namedText(node, /^ui-bars-value$/);
  const badge = namedText(node, /^ui-bars-badge$/);
  if (title) props.title = title;
  if (value) props.value = value;
  if (badge) props.badge = badge;
  const bars = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (classList(n).includes("ui-bar-col")) {
      const item = {};
      const label = namedText(n, /^ui-bar-label$/);
      const fill = findByClass(n, /^ui-bar$/);
      if (label) item.label = label;
      if (fill && fill.props && fill.props.height) item.height = String(fill.props.height);
      if (fill && fill.props && fill.props["background-color"]) item.color = String(fill.props["background-color"]);
      if (Object.keys(item).length) bars.push(item);
    }
    for (const c of n.children || []) walk(c);
  };
  walk(node);
  if (bars.length) props.bars = bars;
  return props;
}

function tabProps(node) {
  const props = {};
  const labelNode = findByClass(node, /^ui-tab-label/);
  const icon = namedText(node, /^ui-tab-icon$/);
  const label = (labelNode && labelNode.text) || textOf(node);
  if (label) props.label = String(label).replace(/\s+/g, " ").trim();
  if (icon) props.icon = icon;
  if (
    classList(node).some((c) => /-active$/.test(c)) ||
    classList(labelNode).some((c) => /-active$/.test(c))
  ) {
    props.active = true;
  }
  return props;
}

function appbarProps(node) {
  const props = {};
  const title = findByClass(node, /^ui-appbar-title$/) || findByClass(node, /^nav-title$/);
  if (title && title.text) props.title = String(title.text);
  else {
    const heading = firstHeading(node);
    if (heading) props.title = heading;
  }
  return props;
}

/**
 * Convert one EVG node into a Ranger UI node. Visual properties are collected
 * onto `styles` (selector → decls) rather than copied into props.
 */
export function convertNode(node, path, ctx) {
  if (!node || typeof node !== "object") return null;
  const spec = inferSpec(node, path, ctx);
  const uid = uidOf(node, path);
  const isRoot = path === (ctx.rootPath || "0");
  const vis = visualProps(node);
  if (isRoot && ctx.viewport) {
    const w = `${ctx.viewport.width}px`;
    const h = `${ctx.viewport.height}px`;
    if (vis.width === w) delete vis.width;
    if (vis.height === h) delete vis.height;
  }
  const authors = authorClasses(node);
  let klass = authors.join(" ");

  if (Object.keys(vis).length) {
    if (!klass) {
      if (isRoot) klass = "screen";
      else {
        const key = styleKey(vis);
        if (!ctx.styleClasses.has(key)) {
          const n = ctx.styleClasses.size + 1;
          ctx.styleClasses.set(key, `rui-s${n}`);
        }
        klass = ctx.styleClasses.get(key);
      }
    }
    const sel = `.${klass.split(/\s+/)[0]}`;
    mergeRule(ctx.styles, sel, vis);
  }

  if (spec) {
    ctx.components[spec.type] = spec.library;
    const out = { type: spec.type, uid };
    if (node.id) out.id = String(node.id);
    if (klass) out.class = klass;
    let props = {};
    if (spec.type === "rave.Switch" || spec.type === "rave.Checkbox") props = switchProps(node);
    else if (spec.type === "SettingsRow") props = rowProps(node);
    else if (spec.type === "rave.Card") props = cardProps(node);
    else if (spec.type === "rave.Tile") props = tileProps(node);
    else if (spec.type === "rave.Banner") props = bannerProps(node);
    else if (spec.type === "rave.Bars") props = barsProps(node);
    else if (spec.type === "rave.Tab") props = tabProps(node);
    else if (spec.type === "rave.AppBar") props = appbarProps(node);
    else if (spec.type === "rave.Button" || spec.type === "rave.Chip") {
      const t = textOf(node);
      if (t) props.label = t;
      if (classList(node).includes("ui-pill-active")) props.active = true;
    }
    if (Object.keys(props).length) out.props = props;
    if (!spec.leaf) {
      const kids = [];
      const prevParent = ctx.parentType;
      ctx.parentType = spec.type;
      for (let i = 0; i < (node.children || []).length; i += 1) {
        const ch = node.children[i];
        if (isPartNode(ch) && !matchComponent(ch)) continue;
        const conv = convertNode(ch, `${path}/${i}`, ctx);
        if (conv) kids.push(conv);
      }
      ctx.parentType = prevParent;
      if (kids.length) out.children = kids;
    }
    return out;
  }

  const tag = node.tag || "div";
  const type = isRoot ? "Screen" : `evg.${tag}`;
  const out = { type, uid };
  if (node.id) out.id = String(node.id);
  if (klass) out.class = klass;
  if (node.text) out.text = String(node.text);
  const kids = [];
  for (let i = 0; i < (node.children || []).length; i += 1) {
    const conv = convertNode(node.children[i], `${path}/${i}`, ctx);
    if (conv) kids.push(conv);
  }
  if (kids.length) out.children = kids;
  return out;
}

function cssFrom(ctx, existing) {
  const authored = authoredCss(existing);
  const extra = [];
  for (const [sel, vis] of ctx.styles) {
    const body = declsOf(vis);
    if (!body) continue;
    // A rule already in the authored sheet for this selector is the source;
    // do not write the same decls again from the inline props we just lifted.
    const have = parseRules(authored).some((r) => r.selector === sel);
    if (have) continue;
    extra.push(`${sel} {\n${body}\n}`);
  }
  return [authored, extra.join("\n\n")].filter((s) => s && s.trim()).join("\n\n");
}

function countUi(node) {
  if (!node) return 0;
  let n = 1;
  for (const c of node.children || []) n += countUi(c);
  return n;
}

function collectTypes(node, out = new Set()) {
  if (!node || typeof node !== "object") return out;
  if (node.type) out.add(node.type);
  for (const c of node.children || []) collectTypes(c, out);
  return out;
}

/** Seed chip "empty" is the starting canvas, not the finished screen. */
export function inferKind(ui, given = "") {
  const asked = String(given || "").trim();
  if (asked && asked !== "empty") return asked;
  const types = collectTypes(ui);
  const dash = ["rave.Pills", "rave.Bars", "rave.Tiles", "rave.Banner", "rave.TabBar"].filter((t) => types.has(t));
  if (dash.length >= 2) return "dashboard";
  if (types.has("SettingsRow") || types.has("rave.Switch")) return "settings";
  return asked;
}

function collectUiIds(node, out) {
  if (!node) return;
  if (node.id) out.push(String(node.id));
  for (const c of node.children || []) collectUiIds(c, out);
}

export function convertDocument(doc, { pathPrefix = "0", viewport = null } = {}) {
  const ctx = { styles: new Map(), styleClasses: new Map(), components: {}, viewport, rootPath: pathPrefix };
  const ui = convertNode(doc && doc.root, pathPrefix, ctx);
  const css = cssFrom(ctx, (doc && doc.css) || "");
  return { ui, css, components: ctx.components };
}

function parseJson(text) {
  if (text && typeof text === "object") return text;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function walkHasVisualProps(node, errs, at) {
  if (!node || typeof node !== "object") return;
  const props = node.props || {};
  for (const k of Object.keys(props)) {
    if (VISUAL.has(k)) errs.push(`${at}: props.${k} is appearance — it belongs in css`);
  }
  (node.children || []).forEach((c, i) => walkHasVisualProps(c, errs, `${at}/children/${i}`));
}

function walkUidType(node, errs, at) {
  if (!node || typeof node !== "object") {
    errs.push(`${at}: not an object`);
    return;
  }
  if (!node.type) errs.push(`${at}: missing type`);
  if (!node.uid) errs.push(`${at}: missing uid`);
  (node.children || []).forEach((c, i) => walkUidType(c, errs, `${at}/children/${i}`));
}

export function validateRangerUi(doc) {
  const errs = [];
  if (!doc || typeof doc !== "object") return { ok: false, errors: ["not an object"] };
  if (doc.format !== FORMAT) errs.push(`format must be ${FORMAT}`);
  if (doc.version !== VERSION) errs.push(`version must be ${VERSION}`);
  if (!doc.ui || typeof doc.ui !== "object") errs.push("ui is required");
  else {
    walkUidType(doc.ui, errs, "ui");
    walkHasVisualProps(doc.ui, errs, "ui");
  }
  if (doc.css != null && typeof doc.css !== "string") errs.push("css must be a string");
  if (doc.components != null && (typeof doc.components !== "object" || Array.isArray(doc.components))) {
    errs.push("components must be an object");
  }
  if (doc.machine != null && typeof doc.machine !== "object") errs.push("machine must be an object");
  return { ok: errs.length === 0, errors: errs };
}

export function compactOf(doc) {
  if (!doc) return doc;
  const out = {
    format: doc.format,
    version: doc.version,
    meta: doc.meta,
    viewport: doc.viewport,
  };
  if (doc.components && Object.keys(doc.components).length) out.components = doc.components;
  out.ui = doc.ui;
  out.css = doc.css || "";
  if (doc.machine) out.machine = doc.machine;
  if (doc.pages && Object.keys(doc.pages).length) out.pages = doc.pages;
  return out;
}

export function buildRangerUi({
  doc,
  name = "screen",
  prompt = "",
  kind = "",
  viewport = null,
  machine = null,
  pages = null,
  measure = null,
  outline = null,
  full = false,
} = {}) {
  const parsed = parseJson(doc) || {};
  const view = {
    width: (viewport && viewport.width) || 390,
    height: (viewport && viewport.height) || 844,
  };
  const converted = convertDocument(parsed, { viewport: view });
  const components = { ...converted.components };
  const pageUis = {};
  let css = converted.css;
  if (pages && typeof pages === "object") {
    for (const [state, text] of Object.entries(pages)) {
      const pdoc = parseJson(text);
      if (!pdoc) continue;
      const one = convertDocument(pdoc, { pathPrefix: `p_${state}` });
      pageUis[state] = one.ui;
      Object.assign(components, one.components);
      if (one.css && !css.includes(one.css)) css = [css, one.css].filter(Boolean).join("\n\n");
    }
  }
  const ids = [];
  collectUiIds(converted.ui, ids);
  const machineObj = parseJson(machine);
  const document = {
    format: FORMAT,
    version: VERSION,
    meta: {
      name: String(name || "screen").slice(0, 120),
      prompt: prompt || "",
      kind: inferKind(converted.ui, kind),
      handoff: HANDOFF,
    },
    viewport: view,
    components,
    ui: converted.ui,
    css: css || "",
  };
  if (machineObj) document.machine = machineObj;
  if (Object.keys(pageUis).length) document.pages = pageUis;
  if (full) {
    document.compiled = { evg: parsed };
    if (pages) {
      const compiledPages = {};
      for (const [state, text] of Object.entries(pages)) {
        const pdoc = parseJson(text);
        if (pdoc) compiledPages[state] = pdoc;
      }
      if (Object.keys(compiledPages).length) document.compiled.pages = compiledPages;
    }
    document.debug = {};
    if (outline) document.debug.outline = Array.isArray(outline) ? outline.join("\n") : String(outline);
    if (measure) document.debug.layout = measure;
  }
  const check = validateRangerUi(compactOf(document));
  return {
    document,
    compact: compactOf(document),
    valid: check,
    ids,
    nodes: countUi(converted.ui),
    hasApp: Boolean(machineObj),
    components,
  };
}
