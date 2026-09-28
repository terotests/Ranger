// ============================================================================
// evgr.test.ts — EVGr, EVG's layout written as a strict Rust module
// (lib/evgr), against EVG itself.
// ============================================================================
//
// rgrc compiles lib/evgr/src/lib.rs to JavaScript and lib/evg/bench/
// EvgLayoutBench.rgr publishes EVG; both lay out the same trees:
//
// - the fixtures of lib/evg/bench/layout-bench.mjs (flex, grid, text), small:
//   every box of EVGr is EVG's box;
// - the cases of lib/evg/bench/layout-cases.mjs: EVGr agrees with EVG on at
//   least the cases it agreed on when it was written (see lib/evgr/README.md
//   for where they differ and why, and bench/compare.mjs for Chromium);
// - with cargo, the native build prints the same boxes for the fixtures.
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";
import { createRequire } from "module";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "evgr");
const req = createRequire(__filename);

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

let EVG: any;
let R: any;
let CASES: any[] = [];

const S = {
  page: "display:flex;flex-direction:column;flex-wrap:nowrap;width:1200px;gap:8px;align-items:stretch",
  card: "display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;padding:8px;align-items:stretch",
  rail: "width:48px;height:56px;background-color:#e4e4e7",
  body: "display:flex;flex-direction:column;flex-wrap:nowrap;flex-grow:1;gap:4px;align-items:stretch",
  line: "height:16px;background-color:#f4f4f5",
  gridc: "display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;width:1200px",
  cell: "display:flex;flex-direction:column;flex-wrap:nowrap;gap:4px;padding:6px;align-items:stretch",
  text: "font-size:14px",
};
const WORDS = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Edsger Dijkstra", "Barbara McClintock"];

type Spec = { s: string; kids: Spec[]; text?: string };

function flexSpec(cards: number, withText: boolean): Spec {
  const kids: Spec[] = [];
  for (let i = 0; i < cards; i++) {
    const lines: Spec[] = [];
    for (let j = 0; j < 4; j++) {
      lines.push(withText && j === 0 ? { s: S.text, kids: [], text: WORDS[i % WORDS.length] } : { s: S.line, kids: [] });
    }
    kids.push({ s: S.card, kids: [{ s: S.rail, kids: [] }, { s: S.body, kids: lines }] });
  }
  return { s: S.page, kids };
}

function gridSpec(cells: number): Spec {
  const kids: Spec[] = [];
  for (let i = 0; i < cells; i++) {
    const lines: Spec[] = [];
    for (let j = 0; j < 4; j++) lines.push({ s: S.line, kids: [] });
    kids.push({ s: S.cell, kids: lines });
  }
  return { s: S.gridc, kids };
}

function evgBoxes(spec: Spec): number[][] {
  const build = (node: Spec): any => {
    const el = new EVG.EVGElement();
    for (const decl of (node.s || "").split(";")) {
      const t = decl.trim();
      if (!t) continue;
      const i = t.indexOf(":");
      if (i < 0) continue;
      el.setAttribute(t.slice(0, i).trim(), t.slice(i + 1).trim());
    }
    if (node.text !== undefined) {
      el.elementType = 1;
      el.textContent = node.text;
    }
    for (const k of node.kids || []) el.addChild(build(k));
    return el;
  };
  EVG.EVGReject.clearNotes();
  const root = build(spec);
  const lay = new EVG.EVGLayout();
  lay.setPageSize(1200, 900);
  lay.layout(root);
  const out: number[][] = [];
  (function walk(el: any) {
    out.push([el.calculatedX, el.calculatedY, el.calculatedWidth, el.calculatedHeight]);
    for (const k of el.children) walk(k);
  })(root);
  return out;
}

function evgrBoxes(spec: Spec): number[][] {
  const t = R.EvgrTree.new_();
  (function add(node: Spec, parent: number) {
    const i = node.text !== undefined ? t.add_text(parent, node.s || "", node.text) : t.add(parent, node.s || "");
    for (const k of node.kids || []) add(k, i);
  })(spec, -1);
  t.layout(1200, 900);
  const out: number[][] = [];
  for (let i = 0; i < t.count(); i++) out.push([t.x(i), t.y(i), t.w(i), t.h(i)]);
  return out;
}

function same(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let k = 0; k < 4; k++) {
      if (Math.abs(a[i][k] - b[i][k]) > 0.5) return false;
    }
  }
  return true;
}

describe("EVGr beside EVG", () => {
  beforeAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const run = (args: string[]) => {
      const r = spawnSync("node", ["dist/rgrc.js", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      const log = (r.stdout || "") + (r.stderr || "");
      if (r.status !== 0 || log.includes("[FAIL]")) throw new Error(log);
    };
    run(["-es6", "-nodemodule", "lib/evgr/src/lib.rs", `-d=${path.relative(ROOT, OUT)}`, "-o=Evgr.cjs"]);
    run(["-es6", "-nodemodule", "lib/evg/bench/EvgLayoutBench.rgr", `-d=${path.relative(ROOT, OUT)}`, "-o=EvgLayoutBench.cjs"]);
    R = req(path.join(OUT, "Evgr.cjs"));
    EVG = req(path.join(OUT, "EvgLayoutBench.cjs"));
    const mod = await import(path.join(ROOT, "lib/evg/bench/layout-cases.mjs"));
    CASES = mod.CASES;
  }, 300000);

  for (const [name, spec] of [
    ["flex", () => flexSpec(30, false)],
    ["grid", () => gridSpec(40)],
    ["text", () => flexSpec(30, true)],
  ] as [string, () => Spec][]) {
    it(`the ${name} fixture: every box is EVG's`, () => {
      const s = spec();
      expect(same(evgrBoxes(s), evgBoxes(s))).toBe(true);
    });
  }

  it("agrees with EVG on the layout cases it agreed on when written", () => {
    let agree = 0;
    for (const c of CASES) {
      if (same(evgrBoxes(c.root), evgBoxes(c.root))) agree++;
    }
    expect(agree).toBeGreaterThanOrEqual(39);
  });

  it.skipIf(!has("cargo --version"))("the native build lays the fixtures out the same", () => {
    const r = spawnSync(
      "cargo",
      ["run", "--release", "--offline", "--quiet", "--bin", "bench", "--manifest-path", path.join(ROOT, "lib/evgr/Cargo.toml"), "--", "1000"],
      { cwd: ROOT, encoding: "utf8", env: { ...process.env, CARGO_TARGET_DIR: path.join(OUT, "cargo") } }
    );
    expect(r.status, r.stderr).toBe(0);
    const rows = r.stdout.trim().split("\n").map((l) => JSON.parse(l));
    for (const row of rows) {
      const spec = row.fixture === "grid" ? gridSpec(Math.round(1000 / 5)) : flexSpec(Math.round(1000 / 7), row.fixture === "text");
      const boxes = evgrBoxes(spec);
      let sum = 0;
      for (const b of boxes) sum += b[0] + b[1] + b[2] + b[3];
      expect(Math.abs(sum - row.checksum)).toBeLessThan(0.01);
    }
  }, 600000);
});
