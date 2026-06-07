import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

describe("Issue #28 inline block scopes without newline", () => {
  it("compiles and runs inline filter block followed by print", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/issue_28_inline_block.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("1");
  });

  it("compiles and runs multiline filter block followed by print", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/issue_28_multiline_block.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("1");
  });

  it("compiles and runs inline filter with member access in predicate", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/issue_28_inline_member.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("1");
  });
});
