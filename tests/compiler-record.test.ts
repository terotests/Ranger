import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";

describe("record types (Track 2.1)", () => {
  const positionalFixture = "tests/fixtures/record_basic.rgr";
  const keywordFixture = "tests/fixtures/record_keyword.rgr";

  it("should compile a record with auto-generated constructor", () => {
    const result = compileRanger(positionalFixture, "es6");
    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);
    expect(result.output).not.toContain("Not enough arguments");
  });

  it("should run positional record construction", () => {
    const { compile, run } = compileAndRun(positionalFixture);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("3");
    expect(run?.output).toContain("4");
    expect(run?.output).toContain("Done");
  });

  it("should run keyword record construction (new Point xpos 3 ypos 4)", () => {
    const { compile, run } = compileAndRun(keywordFixture);
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
