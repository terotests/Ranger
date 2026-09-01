/**
 * lodash@4.17.21 complex pipelines on ComponentEngine.
 *
 * Shares cases with gallery/game_engine/v2/interp/bench/lodash_smoke/lodash-smoke.cjs.
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
    "gallery/game_engine/v2/interp/bench/lodash_smoke/lodash-smoke.cjs",
  ),
);

type Case = { name: string; body: string };
type Row = {
  name: string;
  nodeJson: string;
  engineJson: string | null;
  match: boolean;
  error: string | null;
};

const cases: Case[] = SMOKE.CASES;
const rows = new Map<string, Row>();

describe("lodash engine smoke (complex pipelines)", () => {
  beforeAll(() => {
    expect(fs.existsSync(SMOKE.VENDOR), "vendor/lodash.js").toBe(true);
    if (!fs.existsSync(MODULE_PATH)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-module.sh")], {
        cwd: ROOT_DIR,
        stdio: "inherit",
      });
    }

    const lodash = SMOKE.loadNodeLodash();
    expect(lodash.VERSION).toBe("4.17.21");

    const session = SMOKE.createEngineSession();
    expect(session.ok, session.error ?? "engine session").toBe(true);

    for (const c of cases) {
      const nodeJson = SMOKE.serialize(SMOKE.runNodeCase(lodash, c.body));
      const eng = session.runJson(c.name);
      rows.set(c.name, {
        name: c.name,
        nodeJson,
        engineJson: eng.ok ? eng.json : null,
        match: !!eng.ok && eng.json === nodeJson,
        error: eng.ok ? null : eng.error || "run failed",
      });
    }
  }, 120_000);

  it("loads lodash 4.17.21 and exposes _.map", () => {
    expect(rows.size).toBe(cases.length);
    expect(cases.length).toBeGreaterThanOrEqual(12);
  });

  for (const c of cases) {
    it(`${c.name} matches Node`, () => {
      const r = rows.get(c.name)!;
      expect(r.error, r.error ?? undefined).toBeNull();
      expect(r.engineJson).toBe(r.nodeJson);
    });
  }

  it("complex_sales_report ranks EU/US revenue correctly", () => {
    const r = rows.get("complex_sales_report")!;
    expect(r.match).toBe(true);
    const data = JSON.parse(r.nodeJson);
    expect(data.allRevenue).toBe(2 * 10 + 1 * 20 + 3 * 10 + 5 * 9 + 1 * 25);
    expect(data.euA).toBe(50);
    expect(data.ranked[0].region).toBe("EU");
    expect(data.ranked[0].revenue).toBeGreaterThan(data.ranked[1].revenue);
  });
});
