/**
 * acorn@8.14.1 parse pipelines on ComponentEngine.
 *
 * Shares cases with gallery/game_engine/v2/interp/bench/acorn_smoke/acorn-smoke.cjs.
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
  path.join(ROOT_DIR, "gallery/game_engine/v2/interp/bench/acorn_smoke/acorn-smoke.cjs"),
);

type Case = {
  name: string;
  source: string;
  options: Record<string, unknown>;
  summarize: (ast: any) => unknown;
};
type Row = {
  name: string;
  nodeJson: string;
  engineJson: string | null;
  match: boolean;
  error: string | null;
};

const cases: Case[] = SMOKE.CASES;
const rows = new Map<string, Row>();

describe("acorn engine smoke (AST summaries)", () => {
  beforeAll(() => {
    expect(fs.existsSync(SMOKE.VENDOR), "vendor/acorn.js").toBe(true);
    if (!fs.existsSync(MODULE_PATH)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-module.sh")], {
        cwd: ROOT_DIR,
        stdio: "inherit",
      });
    }

    const acorn = SMOKE.loadNodeAcorn();
    expect(acorn.version).toBe("8.14.1");

    const session = SMOKE.createEngineSession();
    expect(session.ok, session.error ?? "engine session").toBe(true);

    for (const c of cases) {
      const nodeJson = SMOKE.runNodeCase(acorn, c);
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

  it("loads acorn 8.14.1 and exposes parse", () => {
    expect(rows.size).toBe(cases.length);
    expect(cases.length).toBeGreaterThanOrEqual(6);
  });

  for (const c of cases) {
    it(`${c.name} AST summary matches Node`, () => {
      const r = rows.get(c.name)!;
      expect(r.error, r.error ?? undefined).toBeNull();
      expect(r.engineJson).toBe(r.nodeJson);
    });
  }

  it("complex_program is an async exported buildReport", () => {
    const r = rows.get("complex_program")!;
    expect(r.match).toBe(true);
    const data = JSON.parse(r.nodeJson);
    expect(data.asyncExport).toBe(true);
    expect(data.name).toBe("buildReport");
    expect(data.body).toContain("ExportNamedDeclaration");
    expect(data.lines).toBeGreaterThan(5);
  });
});
