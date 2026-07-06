import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";

describe("record types (Track 2.1)", () => {
  const fixture = "tests/fixtures/record_basic.rgr";

  it("should compile a record with auto-generated constructor", () => {
    const result = compileRanger(fixture, "es6");
    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);
    expect(result.output).not.toContain("Not enough arguments");
  });

  it("should run record construction with keyword fields", () => {
    const { compile, run } = compileAndRun(fixture);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("3");
    expect(run?.output).toContain("4");
    expect(run?.output).toContain("Done");
  });
});
