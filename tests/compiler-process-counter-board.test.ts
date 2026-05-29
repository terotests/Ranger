import { describe, it, expect } from "vitest";
import { compileAndRun, compileAndRunKotlin, isKotlinAvailable } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_counter_board.rgr";

const kotlinAvailable = isKotlinAvailable();

describe("Ranger @process — dynamic counter board", () => {
  it("should add/remove rows and preserve counter state (JS)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const out = run?.output ?? "";
    expect(out).toContain("OK process counter board");
    expect(out).toContain("AUTO rows=1");
    expect(out).toContain("AUTO sumValues=3");
    expect(out).not.toContain("FAIL auto:");
  });

  describe.skipIf(!kotlinAvailable)("Kotlin", () => {
    it("runs counter board auto scenario", () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process counter board");
    });
  });
});
