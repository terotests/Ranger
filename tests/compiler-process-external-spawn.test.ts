import { describe, it, expect } from "vitest";
import {
  compileAndRun,
  compileAndRunKotlin,
  getGeneratedKotlinCode,
  isKotlinAvailable,
} from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_external_spawn.rgr";

const kotlinAvailable = isKotlinAvailable();

describe("Ranger @process — spawn from external caller", () => {
  it("should parent new Worker to host when created inside host method (JS)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const out = run?.output ?? "";
    expect(out).toContain("OK process external spawn");
    expect(out).toContain("OK   worker parents to host (parentIdOf)");
    expect(out).toContain("OK   worker parents to host (__rangerParentId)");
    expect(out).toContain("OK   orphan NOT under host (parentIdOf)");
    expect(out).toContain("OK   static spawn NOT under instance host (parentIdOf)");
    expect(out).not.toContain("FAIL ");
  });

  it("should emit __rangerRegisterChild(this) in host instance spawn method (Kotlin)", () => {
    const result = getGeneratedKotlinCode(FIXTURE);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("spawnWorkerFromOutside");
    expect(result.code).toMatch(
      /spawnWorkerFromOutside[\s\S]*__rangerRegisterChild/
    );
    expect(result.code).toContain("spawnWorkerFromStatic");
  });

  describe.skipIf(!kotlinAvailable)("Kotlin runtime", () => {
    it("should parent new Worker to host when created inside host method", () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process external spawn");
    });
  });
});
