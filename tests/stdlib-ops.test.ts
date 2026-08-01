import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/stdlib_new_ops.rgr";

// These operators live in lib/stdlib.rgr as Ranger source rather than as
// per-target templates, so they reach every backend without a template matrix.
// The cross-target loop is what proves that, and is the reason to prefer this
// mechanism over templates -- see PLAN_OPERATORS.md §2.
describe("stdlib collection and map helpers", () => {
  it("computes any / all / slice / values / map_length / get_or", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("any:y");
    expect(run?.output).toContain("all:y");
    expect(run?.output).toContain("all2:n");
    expect(run?.output).toContain("slice:2:2");
    expect(run?.output).toContain("values:2");
    expect(run?.output).toContain("len:2");
    expect(run?.output).toContain("get_or_hit:1");
    expect(run?.output).toContain("get_or_miss:99");
  });

  for (const target of ["es6", "cpp", "kotlin", "swift3", "swift6", "go", "rust"]) {
    it(`compiles for ${target}`, () => {
      const result = compileRanger(FIXTURE, target);
      expect(result.success, `Compile failed for ${target}: ${result.error || result.output}`).toBe(true);
    });
  }
});
