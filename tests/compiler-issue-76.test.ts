import { describe, it, expect, beforeAll } from "vitest";
import { compileAndRun, type CompileResult, type RunResult } from "./helpers/compiler";

// ISSUES.md #76. `recv.call(args).field = value` used to compile without a
// word of complaint and DROP THE STORE — the call was emitted, the assignment
// was not. The parser now desugars it into a temporary plus a plain field
// store.
//
// The gate is the program's OUTPUT, not the emitted source. A test that
// grepped for `__rgr_recv_` would pass on a rewrite that stored the wrong
// thing, and would fail on a future fix that reached the same result another
// way — neither is what this is protecting.
//
// Mutation-proved against both earlier states of the compiler, by compiling
// and running the same fixture:
//
//   before any fix   compiles cleanly and prints `unset|0|unset` four times —
//                    every store dropped, and `cmp|ok` never printed
//   the reject fix   parse error, no output at all
//   this fix         the eight lines asserted below
describe("Issue #76 assigning to a field of a call result", () => {
  let compile: CompileResult;
  let run: RunResult | undefined;

  beforeAll(() => {
    const res = compileAndRun("tests/fixtures/issue_76_call_result_field.rgr");
    compile = res.compile;
    run = res.run;
  });

  it("compiles and runs", () => {
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
  });

  it("stores through a call with an argument", () => {
    expect(run?.output).toContain("zero|");
    expect(run?.output).toContain("one|");
  });

  it("stores through a zero-argument call", () => {
    // b.first().n = 42, read back before the loop overwrites it
    expect(run?.output).toContain("zero|42|deep");
  });

  it("stores through a chained receiver", () => {
    // b.at(1).self().n = 7
    expect(run?.output).toContain("one|7|unset");
  });

  it("stores through a nested field path after the call", () => {
    // b.at(0).inner.tag = "deep"
    expect(run?.output).toContain("|deep");
  });

  it("stores from inside a block, twice per iteration", () => {
    expect(run?.output).toContain("zero|100|in-loop-0");
    expect(run?.output).toContain("one|101|in-loop-1");
  });

  it("leaves reads of a call result alone", () => {
    expect(run?.output).toContain("read|zero");
    expect(run?.output).toContain("cmp|ok");
  });
});
