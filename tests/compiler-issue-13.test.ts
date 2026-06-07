import { describe, it, expect } from "vitest";
import { compileRanger, compileAndRun } from "./helpers/compiler";

describe("Issue #13 uninitialized object member access", () => {
  it("rejects member assignment on an uninitialized object", () => {
    const result = compileRanger(
      "tests/fixtures/issue_13_uninit_member_assign.rgr"
    );
    expect(result.success).toBe(false);
    expect(result.output || result.error || "").toMatch(
      /Use of uninitialized object obj/i
    );
  });

  it("allows member assignment after object construction", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/issue_13_init_member_assign.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("Doo!!!");
  });

  it("still compiles nested if def regression fixture", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/issue_13_nested_if_def.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("TEST PASSED");
  });
});
