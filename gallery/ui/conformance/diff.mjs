/**
 * The comparison rules, with no Node in them, so the headless gate and the
 * browser playground compare traces the same way instead of drifting apart.
 */

/** The observable surface. Every one of these is compared literally. */
export const FIELDS = [
  "role",
  "name",
  "state",
  "expanded",
  "pressed",
  "checked",
  "selected",
  "disabled",
  "valuenow",
  "valuemin",
  "valuemax",
  // What a text field holds, and where the caret is in it. The slider's
  // lesson a second time and harder: role, name, state, tabstop and focus are
  // all IDENTICAL for an empty box and one holding a typed word, so without
  // these four a spec that types "hello" and arrows back through it produces
  // a trace in which nothing whatsoever happens.
  //
  // `value` is the text even for a password — it is what `input.value`
  // reports, and a side that reported bullets would agree with nothing.
  "value",
  "placeholder",
  // Both ends, always. A caret is a selection of length zero, and a start on
  // its own cannot tell a collapsed caret from a selection that begins there
  // — which is exactly the difference between ArrowLeft and Shift+ArrowLeft.
  "selstart",
  "selend",
  // `aria-describedby`, resolved to the text it points at. A Field's hint and
  // its error message are exactly this and nothing else — without it, a field
  // that has just been marked invalid reports `invalid: "true"` and not one
  // word about WHY, which is the whole of what a reader is given.
  "description",
  "hidden",
  "tabstop",
  "focused",
  "visible",
  "roledescription",
  // `aria-sort`. Its own field for the same reason `valuenow` is one: sorting
  // a table changes which rows are where and nothing else about any node, so
  // without it the one thing the control does is invisible to the diff.
  "sort",
  // `aria-haspopup`. A submenu's parent row is a menuitem like any other and
  // announces like one without it; this is what makes "opens a menu" audible.
  "haspopup",
  // `aria-level` and `aria-setsize`. A tree is a flat list of `treeitem`s as
  // far as every other field is concerned — same role, a name each, in order —
  // so without these two the diff cannot see its SHAPE at all. `posinset` is
  // already here and says where a row sits among its siblings; these say how
  // deep it is and how many siblings there are.
  // `aria-orientation`. On a SPLITTER it is what a key means: ArrowLeft moves
  // a horizontal one and does nothing at all to a vertical one, and the two
  // are otherwise identical in every field here. Toolbars, sliders, menubars
  // and separators publish it too, so adding it widened more than the one
  // component it was added for — which is the point of a shared field list.
  //
  // `aria-controls` is deliberately NOT here. It is an id reference, and the
  // trace is already keyed by test id: the separator's own tid says which one
  // it is, so the reference would only be comparing two id schemes that have
  // no reason to agree.
  // `aria-current`. A breadcrumb's whole claim is which crumb is the page you
  // are on, and without this the trail is a list of links the diff cannot tell
  // apart. It is not breadcrumb-only: any navigation marks its current item.
  // The form triad. `aria-invalid` and `aria-required` are emitted by the
  // reference TODAY on several controls and have never been compared;
  // `aria-readonly` is already mirrored by `evg-a11y.js` and was never in the
  // list either. Added before the text field rather than with it, so the
  // trace can see a form's state before there is a form.
  "invalid",
  "required",
  "readonly",
  "current",
  "orientation",
  "level",
  "setsize",
  // `aria-posinset`, the attribute — NOT the `posinset` below, which this
  // harness derives from the tree it walks. For a flat tree DOM the two
  // disagree by design; see the note in dom/snapshot.js.
  "setpos",
  // Where the node sits among its siblings. A sortable moves nothing else:
  // every other field of every item is identical before and after a reorder,
  // and the diff keys by test id, so without this the one thing the component
  // does is the one thing the harness cannot see.
  //
  // Compared only between nodes that agree on `parent` — see below.
  "posinset",
];

/**
 * Position is only meaningful INSIDE a control.
 *
 * Measured, on the first run of `posinset`: the tooltip's content was 2nd on
 * the Ranger side and 3rd on the Radix side. Neither is wrong. Radix portals a
 * floating surface to the end of the document, so it lands after the button
 * beside it; EVG keeps it the trigger's child and moves only where it is
 * PAINTED, so it stays where it was declared. Both are deliberate — the second
 * one is the entire point of EVG's overlay layer — and the order of unrelated
 * top-level controls is not a behaviour either way.
 *
 * So a node with no parent has no position to compare, and the two sides are
 * not asked about it. Inside one control both sides agree on the parent, and
 * there it is compared strictly — which is where a sortable's items live, and
 * the only place the field was ever for.
 */
function comparable(field, rn, dn) {
  if (field !== "posinset") return true;
  if (!rn.parent || !dn.parent) return false;
  return rn.parent === dn.parent;
}

function indexByTid(nodes) {
  const m = new Map();
  for (const n of nodes) m.set(n.tid, n);
  return m;
}

/** Divergences between one pair of observations. */
export function diffNodes(step, rangerNodes, domNodes, ignoreFields) {
  const diffs = [];
  let observations = 0;
  let matched = 0;
  const ignore = new Set(ignoreFields || []);
  const rm = indexByTid(rangerNodes);
  const dm = indexByTid(domNodes);

  for (const tid of new Set([...rm.keys(), ...dm.keys()])) {
    const rn = rm.get(tid);
    const dn = dm.get(tid);
    if (!rn || !dn) {
      // A node only one side knows about fails every field at once.
      observations += FIELDS.length;
      diffs.push({ step, tid, note: "node missing on " + (rn ? "dom" : "ranger") });
      continue;
    }
    for (const f of FIELDS) {
      // A field a spec has declared DISPUTED. Not skipped quietly: it is out of
      // the denominator entirely, and `behaviours.json` carries the evidence
      // for why copying the reference here would be worse than diverging from
      // it. The one case today is a splitter's aria-valuemin/valuemax in a
      // group of three or more, where the reference publishes min > now > max
      // — a range no assistive technology can use.
      if (ignore.has(f)) continue;
      if (!comparable(f, rn, dn)) continue;
      observations += 1;
      if (rn[f] === dn[f]) matched += 1;
      else diffs.push({ step, tid, field: f, ranger: rn[f], dom: dn[f] });
    }
  }
  return { diffs, observations, matched };
}

/**
 * Compare two traces step by step.
 *
 * An observation is one field of one node at one step, so a spec's denominator
 * grows with both the fixture and the number of steps.
 */
export function diffTraces(rangerTrace, domTrace, ignoreFields) {
  const diffs = [];
  let observations = 0;
  let matched = 0;
  const steps = Math.max(rangerTrace.length, domTrace.length);

  for (let i = 0; i < steps; i++) {
    const r = rangerTrace[i];
    const d = domTrace[i];
    if (!r || !d) {
      diffs.push({ step: (r || d).step, note: "step missing on " + (r ? "dom" : "ranger") });
      continue;
    }
    const one = diffNodes(r.step, r.nodes, d.nodes, ignoreFields);
    diffs.push(...one.diffs);
    observations += one.observations;
    matched += one.matched;
  }
  return { diffs, observations, matched };
}
