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

// ISSUES.md #85. An array literal handed to a call whose result is
// immediately dereferenced was lost -- the elements were emitted where the
// array should be, so `(box.take(([] _:string ( "a" "b" )))).count()` came out
// as `box.take("a""b").count()`. Two elements did not parse, one element
// parsed and answered the string's length, and the compiler said [OK] either
// way.
//
// The receiver of a `recv.method()` rewrite is copied BEFORE it is walked now.
// Walking an array literal replaces the node's children with its elements and
// marks the node; a copy taken afterwards carried the children without the
// mark, which is a bare list of elements rather than an array.
//
// The gate is the program's OUTPUT on every target whose toolchain is here,
// not the emitted source.
const FIXTURE = "tests/fixtures/issue_85_chained_array_literal.rgr";
const ONE_ELEMENT = "tests/fixtures/issue_85_one_element.rgr";

const EXPECTED: [string, string][] = [
  ["bound", "2"],
  ["typed", "2"],
  ["untyped", "3"],
  ["twice", "4"],
  ["afterArg", "3"],
];

const ONE_EXPECTED: [string, string][] = [
  ["bound", "1"],
  ["inline", "1"],
];

function expectAll(
  run: RunResult | undefined,
  target: string,
  wanted: [string, string][] = EXPECTED
) {
  expect(run?.success, `${target} run failed: ${run?.error}`).toBe(true);
  for (const [name, value] of wanted) {
    expect(run?.output, `${target}: ${name}`).toContain(`${name}=${value}`);
  }
}

describe("Issue #85 an array literal in a dereferenced call", () => {
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

// The one-element literal is the silent half: it parsed, and answered the
// length of the string. Rust is not gated here -- it drops a one-element
// inline array literal in any argument position, chained or not (#84).
describe("Issue #85 the one-element literal that parsed and lied", () => {
  it("answers 1 on es6", () => {
    const { compile: c, run: r } = compileAndRun(ONE_ELEMENT);
    expect(c.success, `Compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "es6", ONE_EXPECTED);
  });

  it.skipIf(!isGoAvailable())("answers 1 on go", () => {
    const { compile: c, run: r } = compileAndRunGo(ONE_ELEMENT);
    expect(c.success, `Go compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "go", ONE_EXPECTED);
  });

  it.skipIf(!isPythonAvailable())("answers 1 on python", () => {
    const { compile: c, run: r } = compileAndRunPython(ONE_ELEMENT);
    expect(c.success, `Python compile failed: ${c.error || c.output}`).toBe(
      true
    );
    expectAll(r, "python", ONE_EXPECTED);
  });
});
