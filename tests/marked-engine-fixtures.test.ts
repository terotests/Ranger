/**
 * marked@4.3.0 fixture suite on ComponentEngine.
 *
 * Uses the CLI harness helpers (collectCases / createEngineSession) so vitest
 * and `npm run jsengine:marked:fixtures` share one oracle path.
 *
 * Validated on WIP tip claude/ranger-inline-statics-wip-s24sru @ b7a323c9+.
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ROOT_DIR = path.resolve(__dirname, "..");
const MODULE_PATH = path.join(
  ROOT_DIR,
  "gallery/game_engine/v2/interp/bin/engine_module.cjs",
);
const SMOKE = require(
  path.join(
    ROOT_DIR,
    "gallery/game_engine/v2/interp/bench/marked_smoke/marked-smoke.cjs",
  ),
);

type Case = { name: string; md: string; suite: string };
type Row = {
  name: string;
  suite: string;
  nodeHtml: string;
  engineOk: boolean;
  matchNode: boolean;
  error: string | null;
  engineLen: number | null;
  nodeLen: number;
};

const cases: Case[] = SMOKE.collectCases({ quick: false });
const results = new Map<string, Row>();

describe("marked engine fixtures (Node parity)", () => {
  beforeAll(() => {
    if (!fs.existsSync(MODULE_PATH)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-module.sh")], {
        cwd: ROOT_DIR,
        stdio: "inherit",
      });
    }
    const nodeMarked = require(SMOKE.VENDOR_CJS);
    if (typeof nodeMarked.setOptions === "function") {
      nodeMarked.setOptions({ mangle: false });
    }
    const session = SMOKE.createEngineSession();
    expect(session.ok, session.error ?? "engine session").toBe(true);

    for (const c of cases) {
      const nodeHtml = String(nodeMarked.parse(c.md));
      const eng = session.parse(c.md);
      results.set(c.name, {
        name: c.name,
        suite: c.suite,
        nodeHtml,
        engineOk: !!eng.ok && typeof eng.html === "string",
        matchNode: !!eng.ok && eng.html === nodeHtml,
        error: eng.ok ? null : eng.error || "parse failed",
        engineLen: eng.ok && typeof eng.html === "string" ? eng.html.length : null,
        nodeLen: nodeHtml.length,
      });
    }
  }, 120_000);

  it("discovers marked fixtures (tiny + original + new + gfm)", () => {
    expect(cases.length).toBeGreaterThanOrEqual(80);
    const suites = new Set(cases.map((c) => c.suite));
    expect(suites.has("tiny")).toBe(true);
    expect(suites.has("original")).toBe(true);
    expect(suites.has("new")).toBe(true);
    expect(suites.has("gfm")).toBe(true);
  });

  it("every fixture parses to a string on the engine", () => {
    const bad = [...results.values()].filter((r) => !r.engineOk);
    expect(bad, bad.map((r) => `${r.name}: ${r.error}`).join("\n")).toEqual([]);
  });

  it("every fixture HTML matches Node marked.cjs", () => {
    const bad = [...results.values()].filter((r) => !r.matchNode);
    expect(
      bad,
      bad
        .map((r) => `${r.name}: nodeLen=${r.nodeLen} engLen=${r.engineLen} ${r.error ?? ""}`)
        .join("\n"),
    ).toEqual([]);
  });

  // Per-suite visibility in the reporter without 80+ it() noise.
  for (const suite of ["tiny", "original", "new", "gfm"]) {
    it(`suite ${suite}: full Node parity`, () => {
      const rows = [...results.values()].filter((r) => r.suite === suite);
      expect(rows.length).toBeGreaterThan(0);
      const bad = rows.filter((r) => !r.matchNode || !r.engineOk);
      expect(bad, bad.map((r) => r.name).join(", ")).toEqual([]);
    });
  }

  it("includes the large Markdown Syntax documentation fixture", () => {
    const row = results.get("original/markdown_documentation_syntax");
    expect(row).toBeTruthy();
    expect(row!.engineOk).toBe(true);
    expect(row!.matchNode).toBe(true);
    expect(row!.nodeLen).toBeGreaterThan(10_000);
  });
});
