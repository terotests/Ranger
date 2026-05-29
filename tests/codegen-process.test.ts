import { describe, it, expect } from "vitest";
import {
  getGeneratedKotlinCode,
  getGeneratedSwiftCode,
} from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_nesting.rgr";
const LIFECYCLE_FIXTURE = "tests/fixtures/process_page_lifecycle.rgr";

describe("@process code generation", () => {
  it("should emit __rangerRegister in Kotlin output", () => {
    const result = getGeneratedKotlinCode(FIXTURE);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("open class RangerProcessBase");
    expect(result.code).toContain("__rangerRegisterChild");
    expect(result.code).toContain("__singleton");
    expect(result.code).toContain("parentIdOf");
    expect(result.code).toContain("allInstances");
  });

  it("should emit __rangerRegister in Swift6 output", () => {
    const result = getGeneratedSwiftCode(FIXTURE);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("__rangerRegisterChild");
    expect(result.code).toContain("__singleton");
    expect(result.code).toContain("parentIdOf");
    expect(result.code).toContain("allInstances");
  });

  it("should emit lifecycle hooks and proc_stop in Kotlin output", () => {
    const result = getGeneratedKotlinCode(LIFECYCLE_FIXTURE);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("__rangerStopSubtree");
    expect(result.code).toContain("untrack");
    expect(result.code).toContain("ProcessRuntime.stopInstance");
    expect(result.code).toContain("stopByProcessId");
    expect(result.code).not.toContain("__rangerGlobalId");
    expect(result.code).toContain("stopByClassName");
  });
});
