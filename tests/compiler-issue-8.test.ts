import { describe, it, expect } from "vitest";
import { compileAndRunGo, isGoAvailable } from "./helpers/compiler";

const goAvailable = isGoAvailable();

describe.skipIf(!goAvailable)("Issue #8 Go unused variables", () => {
  it("omits unused for-loop item binding so go build succeeds", () => {
    const { compile, run } = compileAndRunGo(
      "tests/fixtures/issue_8_go_for_unused_item.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Go build/run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("loop");
  });

  it("keeps for-loop item binding when item is used", () => {
    const { compile, run } = compileAndRunGo(
      "tests/fixtures/issue_8_go_for_used_item.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Go build/run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("a");
    expect(run?.output).toContain("b");
  });

  it("does not emit unused local variable declarations", () => {
    const { compile, run } = compileAndRunGo(
      "tests/fixtures/issue_8_go_unused_var.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Go build/run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("ok");
  });
});
