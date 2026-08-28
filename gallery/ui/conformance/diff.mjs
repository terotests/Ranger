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
  "tabstop",
  "focused",
  "visible",
];

function indexByTid(nodes) {
  const m = new Map();
  for (const n of nodes) m.set(n.tid, n);
  return m;
}

/** Divergences between one pair of observations. */
export function diffNodes(step, rangerNodes, domNodes) {
  const diffs = [];
  let observations = 0;
  let matched = 0;
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
export function diffTraces(rangerTrace, domTrace) {
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
    const one = diffNodes(r.step, r.nodes, d.nodes);
    diffs.push(...one.diffs);
    observations += one.observations;
    matched += one.matched;
  }
  return { diffs, observations, matched };
}
