/**
 * The EVG host adapter — source → EvElement → EVGElement.
 *
 * The interpreter used to build EVGElement itself, so "does a host get what it
 * needs" was not a question anyone could ask: the engine WAS the host. Now the
 * engine hands out an inert EvElement and a renderer decides what the tags
 * mean, which is only an improvement if a renderer can still get its tree.
 *
 * So the expectations here are the OLD ones. Every tree in this file is what
 * `tests/jsx-conformance.test.ts` recorded before the refactor, when
 * ComponentEngine produced EVG elements directly: `View` mapped to `div`,
 * `Label` to `text` with elementType 1, `Image` to `image` with elementType 2,
 * `id`/`className`/`src` as fields. If the adapter reproduces them, the meaning
 * moved without being lost.
 *
 * The engine and the adapter are compiled into a SEPARATE module from
 * engine_module.cjs on purpose — that one stays renderer-free, and
 * tests/engine-imports.test.ts is what holds it to that.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(HERE, "..");
const MODULE_PATH = path.join(
  ROOT_DIR, "gallery", "game_engine", "v2", "interp", "bin", "engine_evg_module.cjs"
);

let ComponentEngine: any;
let EvValueBridge: any;
let EvElementToEVG: any;

/** An EVG tree, printed the way the pre-refactor suite printed it. */
function evgToText(el: any, depth = 0): string {
  if (!el) return "(null)";
  const pad = "  ".repeat(depth);
  const bits: string[] = [el.tagName || "?"];
  if (el.elementType !== undefined && el.elementType !== 0) bits.push("t" + el.elementType);
  if (el.id) bits.push("id=" + el.id);
  if (el.className) bits.push("class=" + el.className);
  if (el.src) bits.push("src=" + el.src);
  if (el.textContent) bits.push("text=" + JSON.stringify(el.textContent));
  let out = pad + "<" + bits.join(" ") + ">";
  for (const kid of el.children || []) out += "\n" + evgToText(kid, depth + 1);
  return out;
}

function toEngineValue(v: unknown): any {
  if (typeof v === "number") return EvValueBridge.taggedNumber(v);
  if (typeof v === "string") return EvValueBridge.taggedString(v);
  if (typeof v === "boolean") return EvValueBridge.taggedBoolean(v);
  if (Array.isArray(v)) return EvValueBridge.taggedArray(v.map(toEngineValue));
  return EvValueBridge.taggedNull();
}

/** Render through the engine, then convert with the host adapter. */
function renderThroughHost(src: string, props: Record<string, unknown> = {}): string {
  const engine = new ComponentEngine();
  engine.quiet = true;
  const original = console.log;
  console.log = () => {};
  try {
    engine.loadScript(src);
    const p = EvValueBridge.taggedObject([], []);
    for (const [k, v] of Object.entries(props)) p.setMember(k, toEngineValue(v));
    const evElement = engine.callRender("hud", p);
    const adapter = new EvElementToEVG();
    return evgToText(adapter.convert(evElement), 0);
  } catch (e: any) {
    return "<threw " + (e && e.message) + ">";
  } finally {
    console.log = original;
  }
}

/**
 * Trees recorded BEFORE the refactor, when the engine produced EVG directly.
 * Reproducing them is the whole claim.
 */
const PRE_REFACTOR: Array<[name: string, src: string, props: Record<string, unknown>, expected: string]> = [
  ["view-is-div", `function hud(p) { return <View />; }`, {}, "<div>"],
  ["label-is-text", `function hud(p) { return <Label>hi</Label>; }`, {}, `<text t1 text="hi">`],
  ["html-div-passes-through", `function hud(p) { return <div />; }`, {}, "<div>"],
  ["span-is-text", `function hud(p) { return <span>s</span>; }`, {}, `<text t1 text="s">`],
  ["image-is-img-kind", `function hud(p) { return <Image src="a.png" />; }`, {}, "<image t2 src=a.png>"],
  ["path-kind", `function hud(p) { return <Path />; }`, {}, "<path t3>"],
  ["static-attr", `function hud(p) { return <View id="a" />; }`, {}, "<div id=a>"],
  ["computed-attr", `function hud(p) { return <View id={"a" + 1} />; }`, {}, "<div id=a1>"],
  ["prop-attr", `function hud(p) { return <View id={p.name} />; }`, { name: "N" }, "<div id=N>"],
  ["class-attr", `function hud(p) { return <View className="c" />; }`, {}, "<div class=c>"],
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
  ["interpolated-text", `function hud(p) { return <Label>Score: {p.n}</Label>; }`, { n: 7 }, `<text t1 text="Score: 7">`],
  [
    "component-expansion",
    `function Badge(p) { return <Label className="b">z</Label>; }
     function hud(p) { return <View><Badge /></View>; }`,
    {},
    ["<div>", `  <text t1 class=b text="z">`].join("\n"),
  ],
  [
    "arrow-map-children",
    `function hud(p) { return <View>{[1, 2].map((n) => <Label>x</Label>)}</View>; }`,
    {},
    ["<div>", `  <text t1 text="x">`, `  <text t1 text="x">`].join("\n"),
  ],
  [
    "fragment-materialises-a-container",
    `function hud(p) { return <><Label>f</Label></>; }`,
    {},
    ["<div>", `  <text t1 text="f">`].join("\n"),
  ],
];

/**
 * Trees the pre-refactor engine could NOT produce. Each is a case the old
 * hand-rolled child walkers dropped, and they render correctly through the
 * adapter for the same reason they render at all: the element was computed
 * rather than written as a literal.
 */
const NEWLY_POSSIBLE: Array<[name: string, src: string, props: Record<string, unknown>, expected: string]> = [
  [
    "function-callback-in-map",
    `function hud(p) { return <View>{[1, 2].map(function (n) { return <View id={"i" + n} />; })}</View>; }`,
    {},
    ["<div>", "  <div id=i1>", "  <div id=i2>"].join("\n"),
  ],
  [
    "computed-ternary-branch",
    `function mk() { return <Label>m</Label>; }
     function hud(p) { return <View>{p.on ? <Label>a</Label> : mk()}</View>; }`,
    { on: false },
    ["<div>", `  <text t1 text="m">`].join("\n"),
  ],
  [
    "nested-array-of-children",
    `function hud(p) { return <View>{[[<Label>n</Label>]]}</View>; }`,
    {},
    ["<div>", `  <text t1 text="n">`].join("\n"),
  ],
];

describe("evg host adapter", () => {
  beforeAll(() => {
    if (!fs.existsSync(MODULE_PATH)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-evg-module.sh")], {
        cwd: ROOT_DIR, stdio: "inherit",
      });
    }
    const mod = require(MODULE_PATH);
    ComponentEngine = mod.ComponentEngine;
    EvValueBridge = mod.EvValueBridge;
    EvElementToEVG = mod.EvElementToEVG;
  });

  for (const [name, src, props, expected] of PRE_REFACTOR) {
    it(`${name} reaches the renderer as it did before`, () => {
      expect(renderThroughHost(src, props)).toBe(expected);
    });
  }

  for (const [name, src, props, expected] of NEWLY_POSSIBLE) {
    it(`${name} reaches the renderer, which it did not before`, () => {
      expect(renderThroughHost(src, props)).toBe(expected);
    });
  }

  it("a tag the renderer does not know still carries its children", () => {
    // A LOWERCASE tag is host markup by JSX convention, so the engine passes
    // `gizmo` through untouched and has no opinion about it. The adapter maps
    // what it does not recognise to a container rather than dropping the
    // subtree -- a document may carry markup meant for a different renderer,
    // and dropping the tag would take its children with it.
    const got = renderThroughHost(
      `function hud(p) { return <gizmo><Label>inside</Label></gizmo>; }`
    );
    expect(got).toBe(["<div>", `  <text t1 text="inside">`].join("\n"));
  });

  it("an UNKNOWN capitalised tag renders as nothing, which is a component miss", () => {
    // Capitalised means "component" in JSX, so `<Gizmo/>` is not an unknown
    // host tag -- it is a component nobody defined. The engine answers with a
    // blank element and says nothing about it. Recorded rather than fixed:
    // reporting a missing component is the engine's call to make, and this
    // test is here so the silence is a known quantity.
    const got = renderThroughHost(
      `function hud(p) { return <Gizmo><Label>inside</Label></Gizmo>; }`
    );
    expect(got).toBe("<div>");
  });

  it("a numeric prop reaches setAttribute as an integer, not 100.0", () => {
    // EVG's unit parser takes "100". The prop is a Number on the EvElement, so
    // the adapter is what decides how it reads as text -- and getting this
    // wrong is silent, because setAttribute simply fails to parse.
    const engine = new ComponentEngine();
    engine.quiet = true;
    const original = console.log;
    console.log = () => {};
    try {
      engine.loadScript(`function hud(p) { return <View width={100} />; }`);
      const el = engine.callRender("hud", EvValueBridge.taggedObject([], []));
      const out = new EvElementToEVG().convert(el);
      expect(out.width.value).toBe(100);
    } finally {
      console.log = original;
    }
  });

  it("a function prop is left alone rather than stringified into an attribute", () => {
    const engine = new ComponentEngine();
    engine.quiet = true;
    const original = console.log;
    console.log = () => {};
    try {
      engine.loadScript(`function hud(p) { return <View onClick={function () { return 1; }} id="k" />; }`);
      const el = engine.callRender("hud", EvValueBridge.taggedObject([], []));
      // Still a live value on the element the engine produced...
      const names: string[] = el.propNames;
      expect(names).toContain("onClick");
      // ...and the adapter does not try to make an EVG attribute out of it.
      const out = new EvElementToEVG().convert(el);
      expect(evgToText(out)).toBe("<div id=k>");
    } finally {
      console.log = original;
    }
  });
});
