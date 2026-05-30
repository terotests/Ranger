import { describe, it, expect } from "vitest";
import { compileRanger } from "./helpers/compiler";

describe("Ranger @process spawn site rules", () => {
  it("should reject dynamic @process new outside @process instance method", () => {
    const result = compileRanger("tests/fixtures/process_spawn_orphan_bad.rgr");
    expect(result.success).toBe(false);
    expect(result.output || result.error || "").toMatch(
      /Dynamic @process: new only inside/i
    );
  });

  it("should compile fixtures that bootstrap AppRoot from main", () => {
    const result = compileRanger("tests/fixtures/process_proc_send.rgr");
    expect(result.success, result.output || result.error).toBe(true);
  });

  it("should reject proc_start when target @process has no fn start", () => {
    const result = compileRanger("tests/fixtures/process_proc_start_no_start_bad.rgr");
    expect(result.success).toBe(false);
    expect(result.output || result.error || "").toMatch(/proc_start:.*has no fn start/i);
  });
});
