import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_nesting.rgr";

describe("Ranger @process compiler feature", () => {
  it("should compile and run process nesting fixture (JS)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK process nesting");
  });
});
