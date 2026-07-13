import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

describe("TSX engine - ComponentEngine regressions", () => {
  it("executes while loops and reads module-level const from functions", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/tsx_engine_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("whileLen=15");
    expect(out).toContain("constSum=20");
    expect(out).toContain("computed=15");
    expect(out).toContain("arrLen=3");
    expect(out).toContain("arrFirst=..XXX..");
    expect(out).toContain("objSum=60");
    expect(out).toContain("whileConst=15");
    expect(out).toContain("memberAssign=19");
    expect(out).toContain("helperSide=1");
    expect(out).toContain("modCount2=2");
    expect(out).toContain("whileReturn=5");
    expect(out).toContain("nestedBreak=306");
    expect(out).toContain("continueSkip=12");
    expect(out).toContain("splitNoPane=0");
    expect(out).toContain("splitWithPane=1");
    expect(out).toContain("mathSqrt=4");
    expect(out).toContain("anyObjectKey=1");
    expect(out).toContain("staticObjectKey=18");
    expect(out).toContain("[tsx] hello 42");
    expect(out).toContain("consoleLogOk=1");
    expect(out).toContain("tsx-engine-demo done");
  });

  it("resolves transitive relative imports from the importer directory", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/import_chain_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("importChain=7");
    expect(out).toContain("import-chain-demo done");
  });

  it("runs interpreted-.as language features (operators, control flow, stdlib)", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/tests/interp/as_lang_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out, out).toContain("ALL PASS");
    expect(out).not.toContain("SOME FAILED");
  });

  it("runs interpreted-.as class features (this, chaining, callbacks)", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/tests/interp/as_class_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out, out).toContain("ALL PASS");
  });
});
