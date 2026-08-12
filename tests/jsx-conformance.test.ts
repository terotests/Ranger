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
 * A rendered tree, flattened to one line per node. Only the fields a caller can
 * actually observe are printed -- the tag, the element kind, the identity/class
 * attributes and the text -- because those are what a host renders from.
 */
function renderToText(el: any, depth = 0): string {
  if (!el) return "(null)";
  const pad = "  ".repeat(depth);
  const bits: string[] = [el.tagName || "?"];
  if (el.elementType !== undefined && el.elementType !== 0) {
    bits.push("t" + el.elementType);
  }
  if (el.id) bits.push("id=" + el.id);
  if (el.className) bits.push("class=" + el.className);
  if (el.textContent) bits.push("text=" + JSON.stringify(el.textContent));
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
  ["view-is-div", `function hud(p) { return <View />; }`, {}, "<div>"],
  ["label-is-text", `function hud(p) { return <Label>hi</Label>; }`, {}, `<text t1 text="hi">`],
  ["html-div-passes-through", `function hud(p) { return <div />; }`, {}, "<div>"],
  ["span-is-text", `function hud(p) { return <span>s</span>; }`, {}, `<text t1 text="s">`],
  ["image-is-img-kind", `function hud(p) { return <Image src="a.png" />; }`, {}, "<image t2>"],
  ["path-kind", `function hud(p) { return <Path />; }`, {}, "<path t3>"],

  // ---- attributes ----
  ["static-attr", `function hud(p) { return <View id="a" />; }`, {}, "<div id=a>"],
  ["computed-attr", `function hud(p) { return <View id={"a" + 1} />; }`, {}, "<div id=a1>"],
  ["prop-attr", `function hud(p) { return <View id={p.name} />; }`, { name: "N" }, "<div id=N>"],
  ["class-attr", `function hud(p) { return <View className="c" />; }`, {}, "<div class=c>"],
  ["numeric-attr-stringified", `function hud(p) { return <View id={7} />; }`, {}, "<div id=7>"],

  // ---- children ----
  [
    "two-children",
    `function hud(p) { return <View><Label>x</Label><Label>y</Label></View>; }`,
    {},
    ["<div>", `  <text t1 text="x">`, `  <text t1 text="y">`].join("\n"),
  ],
  [
    "nested-containers",
    `function hud(p) { return <View id="o"><View id="i"><Label>d</Label></View></View>; }`,
    {},
    ["<div id=o>", "  <div id=i>", `    <text t1 text="d">`].join("\n"),
  ],
  [
    "array-literal-children",
    `function hud(p) { return <View>{[<Label>x</Label>]}</View>; }`,
    {},
    ["<div>", `  <text t1 text="x">`].join("\n"),
  ],

  // ---- text content ----
  ["interpolated-text", `function hud(p) { return <Label>Score: {p.n}</Label>; }`, { n: 7 }, `<text t1 text="Score: 7">`],
  ["text-only-expression", `function hud(p) { return <Label>{p.s}</Label>; }`, { s: "abc" }, `<text t1 text="abc">`],

  // ---- components ----
  [
    "component-expansion",
    `function Badge(p) { return <Label className="b">z</Label>; }
     function hud(p) { return <View><Badge /></View>; }`,
    {},
    ["<div>", `  <text t1 class=b text="z">`].join("\n"),
  ],
  [
    "component-props",
    `function Badge(p) { return <Label>{p.label}</Label>; }
     function hud(p) { return <Badge label="L" />; }`,
    {},
    `<text t1 text="L">`,
  ],
  [
    "component-nested-in-component",
    `function Inner(p) { return <Label>i</Label>; }
     function Outer(p) { return <View id="o"><Inner /></View>; }
     function hud(p) { return <Outer />; }`,
    {},
    ["<div id=o>", `  <text t1 text="i">`].join("\n"),
  ],

  // ---- conditionals ----
  [
    "conditional-true-branch",
    `function hud(p) { if (p.on) { return <View id="y" />; } return <View id="n" />; }`,
    { on: true },
    "<div id=y>",
  ],
  [
    "conditional-false-branch",
    `function hud(p) { if (p.on) { return <View id="y" />; } return <View id="n" />; }`,
    { on: false },
    "<div id=n>",
  ],
  [
    "ternary-child",
    `function hud(p) { return <View>{p.on ? <Label>a</Label> : <Label>b</Label>}</View>; }`,
    { on: true },
    ["<div>", `  <text t1 text="a">`].join("\n"),
  ],

  // ---- list rendering with an arrow callback ----
  // These work. They are recorded because the fix for the `function (x)` form
  // below deletes the hand-rolled map path, and deleting it must not cost the
  // form that already worked.
  [
    "arrow-map-children",
    `function hud(p) { return <View>{[1, 2].map((n) => <Label>x</Label>)}</View>; }`,
    {},
    ["<div>", `  <text t1 text="x">`, `  <text t1 text="x">`].join("\n"),
  ],
  [
    "arrow-map-computed-attr",
    `function hud(p) { return <View>{[1, 2].map((n) => <View id={"i" + n} />)}</View>; }`,
    {},
    ["<div>", "  <div id=i1>", "  <div id=i2>"].join("\n"),
  ],
  [
    "arrow-map-block-body",
    `function hud(p) { return <View>{[1, 2].map((n) => { return <Label>y</Label>; })}</View>; }`,
    {},
    ["<div>", `  <text t1 text="y">`, `  <text t1 text="y">`].join("\n"),
  ],
  [
    "chained-filter-map",
    `function hud(p) { return <View>{[1, 2].filter((n) => n > 1).map((n) => <Label>f</Label>)}</View>; }`,
    {},
    ["<div>", `  <text t1 text="f">`].join("\n"),
  ],
  [
    "map-over-a-variable",
    `function hud(p) { var xs = [1, 2]; return <View>{xs.map((n) => <Label>v</Label>)}</View>; }`,
    {},
    ["<div>", `  <text t1 text="v">`, `  <text t1 text="v">`].join("\n"),
  ],

  // ---- fragments ----
  [
    // A fragment is materialised as a container, not spliced into the parent.
    "fragment-single-child",
    `function hud(p) { return <><Label>f</Label></>; }`,
    {},
    ["<div>", `  <text t1 text="f">`].join("\n"),
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
const KNOWN_WRONG: Array<[name: string, src: string, props: Record<string, unknown>, wrong: string, shouldBe: string]> = [
  [
    "function-callback-keeps-tag",
    `function hud(p) { return <View>{[1, 2].map(function (n) { return <Label>x</Label>; })}</View>; }`,
    {},
    ["<div>", "  <div>", "  <div>"].join("\n"),
    ["<div>", `  <text t1 text="x">`, `  <text t1 text="x">`].join("\n"),
  ],
  [
    "function-callback-keeps-attrs",
    `function hud(p) { return <View>{[1, 2].map(function (n) { return <View id={"i" + n} />; })}</View>; }`,
    {},
    ["<div>", "  <div>", "  <div>"].join("\n"),
    ["<div>", "  <div id=i1>", "  <div id=i2>"].join("\n"),
  ],
  [
    "function-callback-single-item",
    `function hud(p) { return <View>{[1].map(function (n) { return <Label>a</Label>; })}</View>; }`,
    {},
    ["<div>", "  <div>"].join("\n"),
    ["<div>", `  <text t1 text="a">`].join("\n"),
  ],
  [
    "block-return-in-component",
    `function Row(p) { if (p.x) { return <Label>t</Label>; } return <Label>f</Label>; }
     function hud(p) { return <View>{[1].map(function (n) { return <Row x={true} />; })}</View>; }`,
    {},
    ["<div>", "  <div>"].join("\n"),
    ["<div>", `  <text t1 text="t">`].join("\n"),
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
