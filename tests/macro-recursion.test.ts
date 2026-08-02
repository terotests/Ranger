import { describe, it, expect } from "vitest";
import { compileRanger } from "./helpers/compiler";

const FIXTURES = "tests/fixtures";

/**
 * Macro expansion renders the template to Ranger source and walks the result
 * again (`buildMacro` + `WalkNode` in ng_parser_std_match2.rgr). A template
 * that expands to a call to the same operator therefore has no base case.
 *
 * Before the expansion-depth guard the compiler did not overflow the stack or
 * report anything -- it simply never returned. These tests assert that it now
 * fails with a diagnostic naming the operator, and that they terminate at all:
 * a regression here would hang the suite rather than fail it, so both cases
 * carry a timeout.
 */
describe("macro expansion recursion guard", () => {
  it("rejects a macro that expands to itself", { timeout: 60000 }, () => {
    const result = compileRanger(`${FIXTURES}/macro_self_recursion.rgr`, "es6");
    const output = `${result.output}${result.error || ""}`;

    expect(result.success, "expected the self-recursive macro to be rejected").toBe(false);
    expect(output).toContain("does not terminate");
    expect(output).toContain("selfmac");
  });

  it("rejects an indirect macro cycle", { timeout: 60000 }, () => {
    const result = compileRanger(
      `${FIXTURES}/macro_indirect_recursion.rgr`,
      "es6"
    );
    const output = `${result.output}${result.error || ""}`;

    expect(result.success, "expected the macA -> macB -> macA cycle to be rejected").toBe(false);
    expect(output).toContain("does not terminate");
  });
});
