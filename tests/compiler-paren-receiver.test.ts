import { describe, it, expect, beforeAll } from "vitest";
import {
  compileAndRun,
  compileAndRunRust,
  expectCompileError,
  isRustAvailable,
  type CompileResult,
  type RunResult,
} from "./helpers/compiler";

// ISSUES.md #87. A property read on a parenthesised receiver that is an
// OPERAND of an infix operator -- `(unwrap x).v == 1`, `1 + (f()).v` -- was
// handed to the infix rewriter as the bare `.v` token, and the expression in
// front of it was lost: "Undefined variable .v", or "Could not match argument
// types for ==". The same read outside an infix expression had always worked.
//
// The reader now attaches the `.name` token to the expression it follows,
// flagged, and the flow parser binds that expression to a temporary in the
// statement's register expressions and reads `<tmp>.name` -- the same
// mechanism operator arguments are hoisted through, so every writer sees an
// ordinary variable path. Only the infix shape is rewritten; the shapes that
// already worked keep their code generation, which the fixture also checks.
//
// The gate is the program's OUTPUT, on es6 and on Rust when its toolchain is
// here (the hoisted temporary must be typed Rc<RefCell<T>> there, which the
// shared-locals analysis only does when it walks the register expressions).
const FIXTURE = "tests/fixtures/paren_receiver_infix.rgr";
const LOOP_HEAD = "tests/fixtures/paren_receiver_loop_head.rgr";

const EXPECTED: [string, string][] = [
  ["concat", "box!"],
  ["leftEq", "1"],
  ["rightEq", "1"],
  ["rightAdd", "2"],
  ["callRecv", "3"],
  ["both", "0"],
  ["plain", "1"],
  ["assigned", "7"],
];

function expectAll(run: RunResult | undefined, target: string) {
  expect(run?.success, `${target} run failed: ${run?.error}`).toBe(true);
  for (const [name, value] of EXPECTED) {
    expect(run?.output, `${target}: ${name}`).toContain(`${name}=${value}`);
  }
}

describe("Issue #87 a parenthesised receiver inside an infix expression", () => {
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

  it.skipIf(!isRustAvailable())("answers the same on rust", () => {
    const { compile: c, run: r } = compileAndRunRust(FIXTURE);
    expect(c.success, `Rust compile failed: ${c.error || c.output}`).toBe(true);
    expectAll(r, "rust");
  });

  it("refuses the shape in a loop condition, naming the fix", () => {
    const res = expectCompileError(LOOP_HEAD);
    expect(res.output + (res.error || "")).toContain(
      "cannot be used in a loop condition"
    );
  });
});
