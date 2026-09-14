import { describe, it, expect, beforeAll } from "vitest";
import {
  compileAndRun,
  compileAndRunGo,
  compileAndRunPython,
  compileAndRunRust,
  isGoAvailable,
  isPythonAvailable,
  isRustAvailable,
  type CompileResult,
  type RunResult,
} from "./helpers/compiler";

// ISSUES.md #63. `return this.helper()` -- the way a call in return position
// is written in every C-family language -- failed type analysis, and the
// error pointed at the wrong thing ("Function does not return any values!",
// or a phantom missing method somewhere else entirely). The documented
// workaround was an extra pair of parentheses, or a temporary local when the
// call was an operand of arithmetic.
//
// The parser folds `recv.method(` back onto its receiver now, so the bare
// spelling and the parenthesised one are the same program.
//
// The gate is the program's OUTPUT on four targets, not the emitted source:
// the fold rewrites the parse tree, and the thing that has to hold is that
// every backend still computes the same numbers. The fixture asserts the
// canonical spelling beside the bare one so a fold that quietly changed what
// a call MEANS would show up as a wrong number rather than as a pass.
const FIXTURE = "tests/fixtures/issue_63_bare_call.rgr";

const EXPECTED: [string, string][] = [
  ["bareReturn", "3"],
  ["parenReturn", "3"],
  ["bareReturnPlus", "13"],
  ["bareStaticReturn", "14"],
  ["arithmeticOnCall", "4"],
  ["arithmeticOnCallRight", "97"],
  ["arithmeticBothSides", "23"],
  ["callAsArgument", "6"],
  ["bareChainReturn", "3"],
  ["chainArithmetic", "15"],
  ["compareCall", "1"],
  ["untouched", "6"],
];

function expectAll(run: RunResult | undefined, target: string) {
  expect(run?.success, `${target} run failed: ${run?.error}`).toBe(true);
  for (const [name, value] of EXPECTED) {
    expect(run?.output, `${target}: ${name}`).toContain(`${name}=${value}`);
  }
}

describe("Issue #63 a call written without its own parentheses", () => {
  let compile: CompileResult;
  let run: RunResult | undefined;

  beforeAll(() => {
    const res = compileAndRun(FIXTURE);
    compile = res.compile;
    run = res.run;
  });

  it("compiles", () => {
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
  });

  it("answers the same on es6", () => {
    expectAll(run, "es6");
  });

  it.skipIf(!isGoAvailable())("answers the same on go", () => {
    const { compile: c, run: r } = compileAndRunGo(FIXTURE);
    expect(c.success, `Go compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "go");
  });

  it.skipIf(!isPythonAvailable())("answers the same on python", () => {
    const { compile: c, run: r } = compileAndRunPython(FIXTURE);
    expect(c.success, `Python compile failed: ${c.error || c.output}`).toBe(
      true
    );
    expectAll(r, "python");
  });

  it.skipIf(!isRustAvailable())("answers the same on rust", () => {
    const { compile: c, run: r } = compileAndRunRust(FIXTURE);
    expect(c.success, `Rust compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "rust");
  });
});
