/**
 * The generated corpus, shared by `timings.mjs` and the child process that
 * measures memory — so both build exactly the same form.
 */
export function branchingForm(n) {
  const elements = [];
  for (let i = 0; i < n; i++) {
    elements.push({ type: "text", name: `q${i}`, inputType: "number" });
    elements.push({ type: "text", name: `f${i}`, visibleIf: `{q${i}} > 10`, requiredIf: `{q${i}} > 10` });
    elements.push({ type: "expression", name: `d${i}`, expression: `{q${i}} * 2` });
    elements.push({ type: "text", name: `c${i}`, validators: [{ type: "expression", expression: `{d${i}} < 100`, text: "too big" }] });
    elements.push({ type: "text", name: `s${i}` });
  }
  return { elements };
}

export function cascadeForm(n) {
  const elements = [{ type: "text", name: "c0", inputType: "number" }];
  for (let i = 1; i < n; i++) {
    elements.push({ type: "expression", name: `c${i}`, expression: `{c${i - 1}} + 1` });
  }
  return { elements };
}
