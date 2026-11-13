import { describe, it, expect, beforeAll } from "vitest";
import {
  compileAndRun,
  compileAndRunGo,
  compileAndRunKotlin,
  compileAndRunPython,
  compileAndRunRust,
  isGoAvailable,
  isKotlinAvailable,
  isPythonAvailable,
  isRustAvailable,
  type CompileResult,
  type RunResult,
} from "./helpers/compiler";

// ISSUES.md #106. A shape case built with an array literal argument and
// stored into the union (`def a:Sample (new Sample.Points(([] _:double (1.0
// 2.0))))`) lost the array: `convertToUnion` copies the walked `new`, and a
// walked array literal is its elements plus the is_array_literal mark, which
// the copy did not carry. es6 wrote `new Sample_Points(1.02.0)`, an empty
// literal came out as no argument at all, and the Rust-syntax lowering hit it
// in every enum zero value with a Vec payload.
//
// CodeNode.rebuildWithType now copies a walked literal back to its unwalked
// form, so every copy (this one, #85's, and any later one) is re-analysed
// whole.
const FIXTURE = "tests/fixtures/issue_106_union_array_literal.rgr";

const EXPECTED: [string, string][] = [
  ["typed", "2"],
  ["empty", "0"],
  ["untyped", "3"],
  ["one", "1"],
  ["assigned", "2"],
];

function expectAll(run: RunResult | undefined, target: string) {
  expect(run?.success, `${target} run failed: ${run?.error}`).toBe(true);
  for (const [name, value] of EXPECTED) {
    expect(run?.output, `${target}: ${name}`).toContain(`${name}=${value}`);
  }
}

describe("Issue #106 an array literal in a shape case stored into its union", () => {
  let compile: CompileResult;
  let run: RunResult | undefined;

  beforeAll(() => {
    const res = compileAndRun(FIXTURE);
    compile = res.compile;
    run = res.run;
  });

  it("compiles", () => {
    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
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
    expect(c.success, `Python compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "python");
  });

  it.skipIf(!isRustAvailable())("answers the same on rust", () => {
    const { compile: c, run: r } = compileAndRunRust(FIXTURE);
    expect(c.success, `Rust compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "rust");
  });

  it.skipIf(!isKotlinAvailable())("answers the same on kotlin", () => {
    const { compile: c, run: r } = compileAndRunKotlin(FIXTURE);
    expect(c.success, `Kotlin compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "kotlin");
  }, 300000);
});
