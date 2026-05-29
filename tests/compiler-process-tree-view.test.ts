import { describe, it, expect } from "vitest";
import {
  compileAndRun,
  getGeneratedKotlinCode,
} from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_tree_introspection.rgr";
const NESTING = "tests/fixtures/process_nesting.rgr";

describe("Ranger @process — ProcessTreeView introspection", () => {
  it("should find roots and print tree (JS)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const out = run?.output ?? "";
    expect(out).toContain("OK process tree introspection");
    expect(out).toContain("ScreenProcess #");
    expect(out).toContain("HostPage #");
    expect(out).toContain("CounterProcess #");
    expect(out).toContain("roots=1");
  });

  it("should emit collectAllLiveRoots and printProcessTree in Kotlin", () => {
    const result = getGeneratedKotlinCode(NESTING);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("collectAllLiveRoots");
    expect(result.code).toContain("printProcessTree");
    expect(result.code).toContain("ProcessTreeView");
  });
});
