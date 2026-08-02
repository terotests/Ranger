import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const FIXTURES = "tests/fixtures";

/**
 * Macro expansion renders the template to Ranger source and walks the result
 * again (`buildMacro` + `WalkNode` in ng_parser_std_match2.rgr). A template
 * that expands to a call to the same operator therefore has no base case.
 *
 * Before the guard the compiler did not overflow the stack or report anything
 * -- it simply never returned. Detection keys on operator name + source
 * position, not on the name alone: `if ... else` is itself a macro emitting
 * `if`, so nested if/else re-enters the same operator legitimately. These tests assert that it now
 * fails with a diagnostic naming the operator, and that they terminate at all:
 * a regression here would hang the suite rather than fail it, so both cases
 * carry a timeout.
 */
describe("macro expansion recursion guard", () => {
  it("rejects a macro that expands to itself", { timeout: 60000 }, () => {
    const result = compileRanger(`${FIXTURES}/macro_self_recursion.rgr`, "es6");
    const output = `${result.output}${result.error || ""}`;

    expect(result.success, "expected the self-recursive macro to be rejected").toBe(false);
    expect(output).toContain("is recursive");
    expect(output).toContain("selfmac");
  });

  it("rejects an indirect macro cycle", { timeout: 60000 }, () => {
    const result = compileRanger(
      `${FIXTURES}/macro_indirect_recursion.rgr`,
      "es6"
    );
    const output = `${result.output}${result.error || ""}`;

    expect(result.success, "expected the macA -> macB -> macA cycle to be rejected").toBe(false);
    expect(output).toContain("is recursive");
  });
});

describe("macro expansion re-entry that is legitimate", () => {
  // `if ... else` expands to the three-argument `if`, so a nested if/else
  // re-enters the same macro operator while the outer one is still in flight.
  // A guard keyed on the operator name alone would reject this, and with it
  // most real programs -- the compiler's own source included.
  it("allows nested if/else, which re-enters the same macro", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/macro_nested_if.rgr`);

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("deep");
  });
});
