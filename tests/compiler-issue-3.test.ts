import { describe, it, expect } from "vitest";
import { compileRanger } from "./helpers/compiler";

describe("Issue #3 null? on non-optional values", () => {
  it("reports a clear error when null? is used on a non-optional value", () => {
    const result = compileRanger("tests/fixtures/issue_3_null_on_non_optional.rgr");
    expect(result.success).toBe(false);
    expect(result.output || result.error || "").toMatch(
      /!null\? applies only to optional values.*nonOptional.*non-optional \(string\)/i
    );
  });
});
