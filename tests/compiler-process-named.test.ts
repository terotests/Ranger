import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { compileRanger, compileAndRun } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_named_paths.rgr";
const DUPLICATE_FIXTURE = "tests/fixtures/process_named_paths_duplicate.rgr";
const OUTPUT_JS = path.join(
  __dirname,
  ".output",
  "process_named_paths.js"
);

describe("Ranger @process @name", () => {
  it("should compile named paths and emit registry + find_process", () => {
    const result = compileRanger(FIXTURE);
    expect(result.success, `Compile failed: ${result.error || result.output}`).toBe(true);
    const code = fs.readFileSync(OUTPUT_JS, "utf-8");
    expect(code).toContain("ProcessNameRegistry");
    expect(code).toContain("bindIfConfigured");
    expect(code).toContain("findByPath");
    expect(code).toContain("app.alpha");
    expect(code).toContain("processPath");
    expect(code).toContain("markStateDirty");
    expect(code).toContain("receiveMessage");
  });

  it("should run named paths fixture", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK process named paths");
    expect(run?.output).not.toContain("FAIL named:");
  });

  it("should reject duplicate @name paths at compile time", () => {
    const result = compileRanger(DUPLICATE_FIXTURE);
    expect(result.success).toBe(false);
    expect(result.error || result.output).toMatch(/Duplicate @process @name path/i);
  });
});
