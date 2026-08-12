/**
 * JSX conformance — what the interpreter's JSX evaluation actually PRODUCES.
 *
 * The runtime-conformance suite derives every expectation from Node. There is
 * no oracle for this one: JSX has no result in plain JavaScript, so a rendered
 * tree is the engine's own contract and the expectations here are written down
 * rather than derived. That makes this a CHARACTERISATION suite -- it pins what
 * the engine does today so a refactor of the JSX layer has to change it
 * deliberately, and states which of those behaviours are wrong.
 *
 * Written ahead of the EvElement refactor (JSX evaluating to an engine-owned
 * element value instead of the EVG layout object), which is why the broken
 * cases are asserted in both directions the way KNOWN_GAPS is: closing one
 * fails this file until the entry moves, so a fix cannot land silently and
 * neither can a regression.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(HERE, "..");
const MODULE_PATH = path.join(
  ROOT_DIR,
  "gallery",
  "game_engine",
  "v2",
  "interp",
  "bin",
  "engine_module.cjs"
);

let ComponentEngine: any;
let EvValueBridge: any;

/**
 * A rendered tree, flattened to one line per node: the tag AS WRITTEN, the
 * element kind, the reconciliation key, every prop with its value, and the
 * text. All of it is what a host reads to render from.
 *
 * A prop prints as `name=value` for a primitive and `name=<Kind>` otherwise, so
 * a function or object prop is visible as one without the test depending on how
 * it renders. Before EvElement every prop was run through toString() on the way
 * in, so there was nothing but text to print.
 */
function propToText(v: any): string {
  if (v === null || v === undefined) return "?";
  if (v.value !== undefined) return String(v.value);
  const kind = (v.constructor && v.constructor.name) || "value";
  return "<" + kind.replace(/^EvalValue_/, "") + ">";
}

function renderToText(el: any, depth = 0): string {
  if (!el) return "(null)";
  const pad = "  ".repeat(depth);
  const bits: string[] = [el.tagName || "(none)"];
  if (el.isText) bits.push("text");
  if (el.isFragment) bits.push("frag");
  if (el.key) bits.push("key=" + el.key);
  const names = el.propNames || [];
  const values = el.propValues || [];
  for (let i = 0; i < names.length; i++) {
    bits.push(names[i] + "=" + propToText(values[i]));
  }
  if (el.textContent) bits.push("t=" + JSON.stringify(el.textContent));
  let out = pad + "<" + bits.join(" ") + ">";
  for (const kid of el.children || []) out += "\n" + renderToText(kid, depth + 1);
  return out;
}

/** Render `hud(props)` from `src` and flatten the result. */
function render(src: string, props: Record<string, unknown> = {}): string {
  const engine = new ComponentEngine();
  engine.quiet = true;
  const original = console.log;
  console.log = () => {};
  try {
    engine.loadScript(src);
    const p = EvValueBridge.taggedObject([], []);
    for (const [k, v] of Object.entries(props)) {
      p.setMember(k, toEngineValue(v));
    }
    return renderToText(engine.callRender("hud", p), 0);
  } catch (e: any) {
    return "<threw " + (e && e.message) + ">";
  } finally {
    console.log = original;
  }
}

function toEngineValue(v: unknown): any {
  if (typeof v === "number") return EvValueBridge.taggedNumber(v);
  if (typeof v === "string") return EvValueBridge.taggedString(v);
  if (typeof v === "boolean") return EvValueBridge.taggedBoolean(v);
  if (Array.isArray(v)) return EvValueBridge.taggedArray(v.map(toEngineValue));
  return EvValueBridge.taggedNull();
}

/** Cases that hold. `expected` is the flattened tree, exactly. */
const CASES: Array<[name: string, src: string, props: Record<string, unknown>, expected: string]> = [
  // ---- primitive tags and the tag mapping ----
  ["view-tag-is-kept", `function hud(p) { return <View />; }`, {}, "<View>"],
  ["label-is-text", `function hud(p) { return <Label>hi</Label>; }`, {}, `<Label text t="hi">`],
  ["html-div-passes-through", `function hud(p) { return <div />; }`, {}, "<div>"],
  ["span-is-text", `function hud(p) { return <span>s</span>; }`, {}, `<span text t="s">`],
  ["image-tag-and-src", `function hud(p) { return <Image src="a.png" />; }`, {}, "<Image src=a.png>"],
  ["path-tag", `function hud(p) { return <Path />; }`, {}, "<Path>"],

  // ---- attributes ----
  ["static-attr", `function hud(p) { return <View id="a" />; }`, {}, "<View id=a>"],
  ["computed-attr", `function hud(p) { return <View id={"a" + 1} />; }`, {}, "<View id=a1>"],
  ["prop-attr", `function hud(p) { return <View id={p.name} />; }`, { name: "N" }, "<View id=N>"],
  ["class-attr", `function hud(p) { return <View className="c" />; }`, {}, "<View className=c>"],
  // Props keep their TYPE now. These four used to arrive as text.
  ["number-prop-stays-a-number", `function hud(p) { return <View n={7} />; }`, {}, "<View n=7>"],
  ["boolean-prop-stays-a-boolean", `function hud(p) { return <View b={true} />; }`, {}, "<View b=true>"],
  ["function-prop-survives", `function hud(p) { return <View onClick={function () { return 1; }} />; }`, {}, "<View onClick=<Function>>"],
  ["key-is-lifted-out-of-props", `function hud(p) { return <View key="k1" id="a" />; }`, {}, "<View key=k1 id=a>"],

  // ---- children ----
  [
    "two-children",
    `function hud(p) { return <View><Label>x</Label><Label>y</Label></View>; }`,
    {},
    ["<View>", `  <Label text t="x">`, `  <Label text t="y">`].join("\n"),
  ],
  [
    "nested-containers",
    `function hud(p) { return <View id="o"><View id="i"><Label>d</Label></View></View>; }`,
    {},
    ["<View id=o>", "  <View id=i>", `    <Label text t="d">`].join("\n"),
  ],
  [
    "array-literal-children",
    `function hud(p) { return <View>{[<Label>x</Label>]}</View>; }`,
    {},
    ["<View>", `  <Label text t="x">`].join("\n"),
  ],

  // ---- text content ----
  ["interpolated-text", `function hud(p) { return <Label>Score: {p.n}</Label>; }`, { n: 7 }, `<Label text t="Score: 7">`],
  ["text-only-expression", `function hud(p) { return <Label>{p.s}</Label>; }`, { s: "abc" }, `<Label text t="abc">`],

  // ---- components ----
  [
    "component-expansion",
    `function Badge(p) { return <Label className="b">z</Label>; }
     function hud(p) { return <View><Badge /></View>; }`,
    {},
    ["<View>", `  <Label text className=b t="z">`].join("\n"),
  ],
  [
    "component-props",
    `function Badge(p) { return <Label>{p.label}</Label>; }
     function hud(p) { return <Badge label="L" />; }`,
    {},
    `<Label text t="L">`,
  ],
  [
    "component-nested-in-component",
    `function Inner(p) { return <Label>i</Label>; }
     function Outer(p) { return <View id="o"><Inner /></View>; }
     function hud(p) { return <Outer />; }`,
    {},
    ["<View id=o>", `  <Label text t="i">`].join("\n"),
  ],

  // ---- conditionals ----
  [
    "conditional-true-branch",
    `function hud(p) { if (p.on) { return <View id="y" />; } return <View id="n" />; }`,
    { on: true },
    "<View id=y>",
  ],
  [
    "conditional-false-branch",
    `function hud(p) { if (p.on) { return <View id="y" />; } return <View id="n" />; }`,
    { on: false },
    "<View id=n>",
  ],
  [
    "ternary-child",
    `function hud(p) { return <View>{p.on ? <Label>a</Label> : <Label>b</Label>}</View>; }`,
    { on: true },
    ["<View>", `  <Label text t="a">`].join("\n"),
  ],

  // ---- list rendering with an arrow callback ----
  // These work. They are recorded because the fix for the `function (x)` form
  // below deletes the hand-rolled map path, and deleting it must not cost the
  // form that already worked.
  [
    "arrow-map-children",
    `function hud(p) { return <View>{[1, 2].map((n) => <Label>x</Label>)}</View>; }`,
    {},
    ["<View>", `  <Label text t="x">`, `  <Label text t="x">`].join("\n"),
  ],
  [
    "arrow-map-computed-attr",
    `function hud(p) { return <View>{[1, 2].map((n) => <View id={"i" + n} />)}</View>; }`,
    {},
    ["<View>", "  <View id=i1>", "  <View id=i2>"].join("\n"),
  ],
  [
    "arrow-map-block-body",
    `function hud(p) { return <View>{[1, 2].map((n) => { return <Label>y</Label>; })}</View>; }`,
    {},
    ["<View>", `  <Label text t="y">`, `  <Label text t="y">`].join("\n"),
  ],
  [
    "chained-filter-map",
    `function hud(p) { return <View>{[1, 2].filter((n) => n > 1).map((n) => <Label>f</Label>)}</View>; }`,
    {},
    ["<View>", `  <Label text t="f">`].join("\n"),
  ],
  [
    "map-over-a-variable",
    `function hud(p) { var xs = [1, 2]; return <View>{xs.map((n) => <Label>v</Label>)}</View>; }`,
    {},
    ["<View>", `  <Label text t="v">`, `  <Label text t="v">`].join("\n"),
  ],

  // ---- what a `{...}` child position accepts ----
  ["string-child", `function hud(p) { return <View>{"str"}</View>; }`, {}, ["<View>", `  <(none) text t="str">`].join("\n")],
  ["number-child", `function hud(p) { return <View>{7}</View>; }`, {}, ["<View>", `  <(none) text t="7">`].join("\n")],
  // null/false/undefined contribute nothing, as they do in React.
  ["null-child", `function hud(p) { return <View>{null}</View>; }`, {}, "<View>"],
  ["false-child", `function hud(p) { return <View>{false}</View>; }`, {}, "<View>"],
  [
    "ternary-false-branch",
    `function hud(p) { return <View>{p.on ? <Label>a</Label> : <Label>b</Label>}</View>; }`,
    { on: false },
    ["<View>", `  <Label text t="b">`].join("\n"),
  ],
  [
    "and-child-true",
    `function hud(p) { return <View>{p.on && <Label>a</Label>}</View>; }`,
    { on: true },
    ["<View>", `  <Label text t="a">`].join("\n"),
  ],
  ["and-child-false", `function hud(p) { return <View>{p.on && <Label>a</Label>}</View>; }`, { on: false }, "<View>"],
  [
    "or-child",
    `function hud(p) { return <View>{p.on || <Label>o</Label>}</View>; }`,
    { on: false },
    ["<View>", `  <Label text t="o">`].join("\n"),
  ],
  [
    "call-returning-element",
    `function mk() { return <Label>c</Label>; }
     function hud(p) { return <View>{mk()}</View>; }`,
    {},
    ["<View>", `  <Label text t="c">`].join("\n"),
  ],
  [
    "call-returning-array",
    `function mk() { return [<Label>c</Label>, <Label>d</Label>]; }
     function hud(p) { return <View>{mk()}</View>; }`,
    {},
    ["<View>", `  <Label text t="c">`, `  <Label text t="d">`].join("\n"),
  ],

  // ---- fixed by evaluating the child expression instead of walking it ----
  // These six were all the same shape: an element that had to be COMPUTED
  // rather than written as a literal. Each of the four hand-rolled walkers
  // could only see a literal, so each dropped its case. Running the expression
  // covers all of them, and there is nothing case-specific left to get right.
  [
    "function-callback-keeps-tag",
    `function hud(p) { return <View>{[1, 2].map(function (n) { return <Label>x</Label>; })}</View>; }`,
    {},
    ["<View>", `  <Label text t="x">`, `  <Label text t="x">`].join("\n"),
  ],
  [
    "function-callback-keeps-attrs",
    `function hud(p) { return <View>{[1, 2].map(function (n) { return <View id={"i" + n} />; })}</View>; }`,
    {},
    ["<View>", "  <View id=i1>", "  <View id=i2>"].join("\n"),
  ],
  [
    "function-callback-single-item",
    `function hud(p) { return <View>{[1].map(function (n) { return <Label>a</Label>; })}</View>; }`,
    {},
    ["<View>", `  <Label text t="a">`].join("\n"),
  ],
  [
    "block-return-in-component",
    `function Row(p) { if (p.x) { return <Label>t</Label>; } return <Label>f</Label>; }
     function hud(p) { return <View>{[1].map(function (n) { return <Row x={true} />; })}</View>; }`,
    {},
    ["<View>", `  <Label text t="t">`].join("\n"),
  ],
  [
    "ternary-with-a-computed-branch",
    `function mk() { return <Label>m</Label>; }
     function hud(p) { return <View>{p.on ? <Label>a</Label> : mk()}</View>; }`,
    { on: false },
    ["<View>", `  <Label text t="m">`].join("\n"),
  ],
  [
    // Flattened to any depth now, as React does.
    "nested-array-child",
    `function hud(p) { return <View>{[[<Label>n</Label>]]}</View>; }`,
    {},
    ["<View>", `  <Label text t="n">`].join("\n"),
  ],

  // ---- fragments ----
  [
    // A fragment is its own KIND now. It used to be materialised as a literal
    // `div`, a container the source never asked for; a host can splice it.
    "fragment-single-child",
    `function hud(p) { return <><Label>f</Label></>; }`,
    {},
    ["<(none) frag>", `  <Label text t="f">`].join("\n"),
  ],
];

/**
 * Cases that do NOT hold. Each records what the engine produces today next to
 * what it should. Asserted in both directions: the `wrong` value must still be
 * what comes out, so closing one of these fails here and forces the entry to
 * move up into CASES.
 *
 * All four are one defect, and it is narrower than "map is broken" -- the arrow
 * cases above prove `.map` works. `{xs.map(cb)}` is not evaluated as an
 * expression at all: `evaluateArrayMapChild` pattern-matches the call in the
 * JSX child position and re-implements the callback invocation by hand. Both
 * halves of that hand-rolled path -- `bindMapCallback`, which binds the
 * parameters, and `evaluateMapCallbackBody`, which runs the body -- guard on
 * node kind 17, ArrowFunctionExpression. A `function (x) { ... }` callback is
 * kind 18, so it matches neither: nothing is bound, the body never runs, and a
 * BLANK element is returned and appended as a child.
 *
 * Nothing reports it. The element is well-formed, just empty, so a list of
 * items renders as the right NUMBER of empty containers.
 *
 * Evaluating the expression normally is the fix, and it deletes this special
 * case rather than extending it: an array of element values in a child
 * position is already handled a few lines below.
 */
/**
 * Cases that do NOT hold, asserted in both directions so neither a fix nor a
 * regression can land silently.
 *
 * The six map/ternary/nested-array entries that used to live here are fixed and
 * have moved up into CASES. What is left is a DIFFERENT defect, and one the
 * child-expression work did not touch: a function declared INSIDE another
 * function and returning JSX answers nothing. The same declaration at top level
 * works, and so does a nested one returning anything that is not JSX, which
 * puts it in how a nested declaration's body reports its result rather than in
 * JSX evaluation.
 */
const KNOWN_WRONG: Array<[name: string, src: string, props: Record<string, unknown>, wrong: string, shouldBe: string]> = [
  [
    "nested-fn-returning-jsx",
    `function hud(p) { function mk() { return <Label>m</Label>; } return <View>{mk()}</View>; }`,
    {},
    "<View>",
    ["<View>", `  <Label text t="m">`].join("\n"),
  ],
  [
    "nested-fn-in-ternary-branch",
    `function hud(p) { function mk() { return <Label>m</Label>; } return <View>{p.on ? <Label>a</Label> : mk()}</View>; }`,
    { on: false },
    "<View>",
    ["<View>", `  <Label text t="m">`].join("\n"),
  ],
];

describe("jsx conformance", () => {
  beforeAll(() => {
    if (!fs.existsSync(MODULE_PATH)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-module.sh")], {
        cwd: ROOT_DIR,
        stdio: "inherit",
      });
    }
    const mod = require(MODULE_PATH);
    ComponentEngine = mod.ComponentEngine;
    EvValueBridge = mod.EvValueBridge;
  });

  for (const [name, src, props, expected] of CASES) {
    it(`${name} renders as recorded`, () => {
      expect(render(src, props)).toBe(expected);
    });
  }

  for (const [name, src, props, wrong, shouldBe] of KNOWN_WRONG) {
    it(`${name} is still wrong in the recorded way`, () => {
      const got = render(src, props);
      expect(got, `"${name}" should NOT equal the correct tree yet`).not.toBe(shouldBe);
      expect(got, `"${name}" produced something other than the recorded wrong tree`).toBe(wrong);
    });
  }

  it("every known-wrong case has a distinct correct form recorded", () => {
    for (const [name, , , wrong, shouldBe] of KNOWN_WRONG) {
      expect(wrong, `${name} records the same tree as wrong and correct`).not.toBe(shouldBe);
    }
  });
});
