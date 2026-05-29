import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/singleton_registry_smoke.rgr";

describe("Ranger @singleton compiler feature", () => {
  it("should compile and resolve __singleton() for analyzer and JS", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK singleton registry");
  });
});
